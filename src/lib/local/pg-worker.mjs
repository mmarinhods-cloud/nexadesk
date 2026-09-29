import { parentPort } from "node:worker_threads";
import pg from "pg";

const { Client, types } = pg;
types.setTypeParser(20, Number); // count(*) e outros bigint cabem no volume desta instalação local.
types.setTypeParser(1700, Number);

const client = new Client({ connectionString: process.env.DATABASE_URL, application_name: "nexadesk-local", connectionTimeoutMillis: 5_000, query_timeout: 15_000 });
const ready = (async () => {
  await client.connect();
  await client.query("set search_path to nexadesk, public");
  const result = await client.query("select to_regclass('nexadesk.accounts') as table_name");
  if (!result.rows[0]?.table_name) throw new Error("Esquema ausente. Execute npm run db:migrate:postgres antes de iniciar a aplicação.");
})().then(() => null, (error) => error);

function parameterize(sql) {
  let index = 0;
  let quoted = false;
  let converted = "";
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if (char === "'") {
      if (quoted && sql[i + 1] === "'") { converted += "''"; i++; continue; }
      quoted = !quoted;
    }
    converted += char === "?" && !quoted ? `$${++index}` : char;
  }
  converted = converted.replace(/group_concat\(tags\.name,\s*', '\)/gi, "string_agg(tags.name, ', ' order by tags.name)");
  if (/^\s*insert\s+or\s+ignore\s+into\b/i.test(converted)) {
    converted = converted.replace(/^(\s*)insert\s+or\s+ignore\s+into\b/i, "$1insert into").replace(/;?\s*$/, " on conflict do nothing");
  }
  return converted;
}

parentPort.on("message", async ({ sql, values, port, signal }) => {
  try {
    const initializationError = await ready;
    if (initializationError) throw initializationError;
    const result = await client.query(parameterize(sql), values);
    port.postMessage({ rows: result.rows, rowCount: result.rowCount });
  } catch (error) {
    port.postMessage({ error: error instanceof Error ? error.message : "Falha na consulta." });
  } finally {
    Atomics.store(signal, 0, 1);
    Atomics.notify(signal, 0);
    port.close();
  }
});
