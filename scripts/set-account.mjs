import { existsSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const options = new Map();
for (let i = 2; i < process.argv.length; i += 2) options.set(process.argv[i], process.argv[i + 1]);
const email = options.get("--email")?.trim().toLowerCase();
const role = options.get("--role");
const status = options.get("--status");
const roles = new Set(["owner", "admin", "supervisor", "agent", "customer"]);
const states = new Set(["active", "suspended", "pending_email"]);
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || role && !roles.has(role) || status && !states.has(status) || !role && !status) {
  console.error("Uso: npm run account:set -- --email usuario@dominio.com [--role owner|admin|supervisor|agent|customer] [--status active|suspended|pending_email]");
  process.exit(1);
}

const postgres = Boolean(process.env.DATABASE_URL);
const path = process.env.NEXADESK_LOCAL_DB_PATH || join(process.cwd(), ".data", "nexadesk.sqlite");
if (!postgres && !existsSync(path)) { console.error("Banco local não encontrado. Cadastre a primeira conta antes."); process.exit(1); }
const db = postgres ? new pg.Client({ connectionString: process.env.DATABASE_URL }) : new DatabaseSync(path);
const query = async (sql, values = []) => {
  if (postgres) return (await db.query(sql, values)).rows;
  const localSql = sql.replace(/\$\d+/g, "?");
  return /^\s*select\b/i.test(sql) ? db.prepare(localSql).all(...values) : (db.prepare(localSql).run(...values), []);
};
if (postgres) await db.connect();
try {
  if (postgres) { await db.query("begin"); await db.query("set search_path to nexadesk, public"); }
  else db.exec("PRAGMA foreign_keys=ON; BEGIN IMMEDIATE");
  const account = (await query("select id,organization_id,name,email,role,status,verified_at from accounts where email=$1", [email]))[0];
  if (!account) throw new Error("Conta não encontrada.");
  const nextRole = role || account.role;
  const nextStatus = status || account.status;
  if (account.role === "owner" && account.status === "active" && (nextRole !== "owner" || nextStatus !== "active")) {
    const owners = Number((await query("select count(*) total from accounts where organization_id=$1 and role='owner' and status='active'", [account.organization_id]))[0].total);
    if (owners <= 1) throw new Error("O último owner ativo não pode perder acesso.");
  }
  if (nextStatus === "active" && !account.verified_at) throw new Error("Confirme o e-mail antes de ativar a conta.");
  if (nextRole !== account.role) {
    if (nextRole === "customer") {
      await query("insert into customers values ($1,$2,$3,$4,$5,$6,$7) on conflict(id) do nothing", [account.id, account.organization_id, null, account.name, account.email, "Padrão", 0]);
      await query("update tickets set assignee_id=null where organization_id=$1 and assignee_id=$2", [account.organization_id, account.id]);
      await query("delete from agents where id=$1 and organization_id=$2", [account.id, account.organization_id]);
    } else {
      await query("insert into agents (id,organization_id,name,email,role) values ($1,$2,$3,$4,$5) on conflict(id) do update set role=excluded.role,name=excluded.name,email=excluded.email", [account.id, account.organization_id, account.name, account.email, nextRole]);
    }
  }
  const now = new Date().toISOString();
  await query("update accounts set role=$1,status=$2,updated_at=$3 where id=$4", [nextRole, nextStatus, now, account.id]);
  await query("update sessions set revoked_at=$1 where account_id=$2 and revoked_at is null", [now, account.id]);
  await query("insert into audit_logs values ($1,$2,$3,$4,$5,$6,$7,$8,$9)", [randomUUID(), account.organization_id, "local-cli", "account", account.id, "account_state_changed", `${account.role}/${account.status}`, `${nextRole}/${nextStatus}`, now]);
  if (postgres) await db.query("commit"); else db.exec("COMMIT");
  console.log(`Conta ${email}: ${nextRole}, ${nextStatus}. Sessões revogadas.`);
} catch (error) {
  if (postgres) await db.query("rollback"); else db.exec("ROLLBACK");
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (postgres) await db.end(); else db.close();
}
