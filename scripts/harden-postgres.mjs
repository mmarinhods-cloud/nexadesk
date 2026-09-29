import { randomBytes } from "node:crypto";
import { readFile, rename, writeFile, chmod } from "node:fs/promises";
import pg from "pg";

const envPath = ".env.local";
process.loadEnvFile(envPath);
const currentUrl = process.env.DATABASE_URL;
if (!currentUrl) throw new Error("DATABASE_URL não configurada.");
const parsed = new URL(currentUrl);
if (!["postgres:", "postgresql:"].includes(parsed.protocol) || decodeURIComponent(parsed.pathname.slice(1)) !== "nexadesk") throw new Error("A URL deve apontar para a base nexadesk.");

const role = "nexadesk_runtime";
const password = randomBytes(48).toString("base64url");
const client = new pg.Client({ connectionString: currentUrl, application_name: "nexadesk-hardening" });
await client.connect();
try {
  const { rows } = await client.query("select current_user as actor, rolsuper, rolcreaterole from pg_roles where rolname=current_user");
  if (!rows[0]?.rolsuper && !rows[0]?.rolcreaterole) throw new Error("A conexão atual não pode criar uma conta restrita.");
  if ((await client.query("select 1 from pg_roles where rolname=$1", [role])).rowCount) throw new Error("A conta nexadesk_runtime já existe; nenhuma alteração foi feita.");
  const schema = await client.query("select 1 from information_schema.schemata where schema_name='nexadesk'");
  if (!schema.rowCount) throw new Error("Esquema nexadesk ausente. Execute a migração primeiro.");
  await client.query("begin");
  await client.query(`create role ${role} login password '${password}' nosuperuser nocreatedb nocreaterole noreplication`);
  await client.query(`grant connect on database nexadesk to ${role}`);
  await client.query(`grant usage on schema nexadesk to ${role}`);
  await client.query(`grant select,insert,update,delete on all tables in schema nexadesk to ${role}`);
  await client.query(`grant usage,select,update on all sequences in schema nexadesk to ${role}`);
  const actor = `"${rows[0].actor.replaceAll('"', '""')}"`;
  await client.query(`alter default privileges for role ${actor} in schema nexadesk grant select,insert,update,delete on tables to ${role}`);
  await client.query(`alter default privileges for role ${actor} in schema nexadesk grant usage,select,update on sequences to ${role}`);
  await client.query("commit");

  const env = await readFile(envPath, "utf8");
  if (!/^DATABASE_URL=.*$/m.test(env)) throw new Error("DATABASE_URL não encontrada em .env.local; a conta foi criada, mas o arquivo não mudou.");
  parsed.username = role;
  parsed.password = password;
  const temporary = `${envPath}.tmp`;
  await writeFile(temporary, env.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${parsed.toString()}`), { mode: 0o600 });
  await chmod(temporary, 0o600);
  await rename(temporary, envPath);
  console.log("Conta PostgreSQL restrita criada e DATABASE_URL atualizada em .env.local.");
} catch (error) {
  await client.query("rollback").catch(() => {});
  throw error;
} finally {
  await client.end();
}
