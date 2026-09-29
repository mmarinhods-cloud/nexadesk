import { randomUUID } from "node:crypto";
import { chmod, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync, backup } from "node:sqlite";
import pg from "pg";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Defina DATABASE_URL em .env.local antes de migrar.");
const url = new URL(connectionString);
if (!["postgres:", "postgresql:"].includes(url.protocol) || decodeURIComponent(url.pathname.slice(1)) !== "nexadesk") {
  throw new Error("DATABASE_URL deve apontar para a base PostgreSQL nexadesk.");
}

const sourcePath = process.env.NEXADESK_LOCAL_DB_PATH || join(process.cwd(), ".data", "nexadesk.sqlite");
const schema = await readFile(join(process.cwd(), "src", "lib", "local", "schema.sql"), "utf8");
const tables = [
  "organizations", "accounts", "agents", "companies", "customers", "sla_policies", "tickets",
  "messages", "events", "tags", "ticket_tags", "articles", "automations", "automation_runs",
  "notifications", "macros", "feedback", "attachments", "audit_logs", "saved_views",
  "sessions", "auth_tokens", "privacy_requests",
];
const client = new pg.Client({ connectionString, application_name: "nexadesk-migration" });
await client.connect();
let source;
try {
  await client.query("begin");
  await client.query("select pg_advisory_xact_lock(hashtext('nexadesk-schema-migration'))");
  await client.query("create schema if not exists nexadesk");
  await client.query("set search_path to nexadesk, public");
  await client.query(schema);
  const occupied = [];
  for (const table of tables) {
    const result = await client.query(`select count(*)::int as total from ${table}`);
    if (result.rows[0].total > 0) occupied.push(table);
  }
  if (occupied.length) throw new Error(`O esquema nexadesk já contém dados (${occupied.join(", ")}). Migração interrompida para evitar sobrescrita.`);
  if (!existsSync(sourcePath)) {
    await client.query("commit");
    console.log("Esquema PostgreSQL criado. Não havia banco SQLite para importar.");
  } else {
    source = new DatabaseSync(sourcePath, { readOnly: true });
    const backupPath = join(process.cwd(), ".data", `nexadesk-pre-postgres-${Date.now()}-${randomUUID().slice(0, 8)}.sqlite`);
    await backup(source, backupPath);
    await chmod(backupPath, 0o600);
    let totalRows = 0;
    for (const table of tables) {
      const columns = source.prepare(`pragma table_info(${table})`).all().map((column) => column.name);
      const rows = source.prepare(`select * from ${table}`).all();
      if (!columns.length) throw new Error(`Tabela de origem ausente: ${table}`);
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(",");
      const names = columns.map((name) => `"${name}"`).join(",");
      for (const row of rows) {
        await client.query(`insert into ${table} (${names}) values (${placeholders})`, columns.map((name) => row[name]));
      }
      const result = await client.query(`select count(*)::int as total from ${table}`);
      if (result.rows[0].total !== rows.length) throw new Error(`Contagem divergente em ${table}.`);
      totalRows += rows.length;
    }
    await client.query("commit");
    console.log(`Migração concluída: ${totalRows} registros em ${tables.length} tabelas. Cópia SQLite: ${backupPath}`);
  }
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  source?.close();
  await client.end();
}
