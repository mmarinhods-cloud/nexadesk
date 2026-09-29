import { existsSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
if (process.env.DATABASE_URL) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const { rows } = await client.query("select email,name,role,status,verified_at from nexadesk.accounts order by created_at");
    console.table(rows);
  } finally { await client.end(); }
} else {
  const path = process.env.NEXADESK_LOCAL_DB_PATH || join(process.cwd(), ".data", "nexadesk.sqlite");
  if (!existsSync(path)) { console.log("Nenhuma conta cadastrada."); process.exit(0); }
  const db = new DatabaseSync(path, { readOnly: true });
  console.table(db.prepare("select email,name,role,status,verified_at from accounts order by created_at").all());
  db.close();
}
