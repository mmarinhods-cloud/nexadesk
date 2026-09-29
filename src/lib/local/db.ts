import { DatabaseSync } from "node:sqlite";
import { chmodSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { MessageChannel, receiveMessageOnPort, Worker } from "node:worker_threads";

export type Db = {
  prepare(sql: string): {
    get(...values: unknown[]): unknown;
    all(...values: unknown[]): unknown[];
    run(...values: unknown[]): unknown;
  };
  exec(sql: string): void;
};

const databasePath = process.env.NEXADESK_LOCAL_DB_PATH || join(process.cwd(), ".data", "nexadesk.sqlite");
const defaultDataDir = join(process.cwd(), ".data");
const schemaPath = join(process.cwd(), "src", "lib", "local", "schema.sql");

declare global { var nexadeskDb: Db | undefined; }

function checkPostgresUrl(value: string) {
  const parsed = new URL(value);
  if (!["postgres:", "postgresql:"].includes(parsed.protocol) || decodeURIComponent(parsed.pathname.slice(1)) !== "nexadesk") {
    throw new Error("DATABASE_URL deve apontar para a base PostgreSQL nexadesk.");
  }
}

class PostgresDb implements Db {
  private readonly worker: Worker;

  constructor() {
    checkPostgresUrl(process.env.DATABASE_URL!);
    this.worker = new Worker(join(process.cwd(), "src", "lib", "local", "pg-worker.mjs"));
    this.worker.unref();
  }

  private query(sql: string, values: unknown[] = []) {
    const { port1, port2 } = new MessageChannel();
    const signal = new Int32Array(new SharedArrayBuffer(4));
    this.worker.postMessage({ sql, values, port: port2, signal }, [port2]);
    const wait = Atomics.wait(signal, 0, 0, 20_000);
    if (wait === "timed-out") { port1.close(); throw new Error("Tempo limite da consulta ao PostgreSQL excedido."); }
    let packet = receiveMessageOnPort(port1)?.message as { rows?: Record<string, unknown>[]; rowCount?: number; error?: string } | undefined;
    const until = Date.now() + 1000;
    while (!packet && Date.now() < until) packet = receiveMessageOnPort(port1)?.message as typeof packet;
    port1.close();
    if (!packet) throw new Error("Resposta do PostgreSQL indisponível.");
    if (packet.error) throw new Error(`PostgreSQL: ${packet.error}`);
    return packet;
  }

  prepare(sql: string) {
    return {
      get: (...values: unknown[]) => this.query(sql, values).rows?.[0],
      all: (...values: unknown[]) => this.query(sql, values).rows ?? [],
      run: (...values: unknown[]) => ({ changes: this.query(sql, values).rowCount ?? 0 }),
    };
  }

  exec(sql: string) { this.query(sql); }
}

export function getDb(): Db {
  if (globalThis.nexadeskDb) return globalThis.nexadeskDb;
  if (process.env.DATABASE_URL) {
    globalThis.nexadeskDb = new PostgresDb();
    return globalThis.nexadeskDb;
  }
  if (process.env.NEXADESK_TEST_MODE !== "1" || !process.env.NEXADESK_LOCAL_DB_PATH) {
    throw new Error("DATABASE_URL não configurada. O SQLite é permitido apenas nos testes isolados.");
  }
  mkdirSync(dirname(databasePath), { recursive: true, mode: 0o700 });
  if (dirname(databasePath) === defaultDataDir) chmodSync(defaultDataDir, 0o700);
  const previousUmask = process.umask(0o077);
  let db: DatabaseSync;
  try { db = new DatabaseSync(databasePath); } finally { process.umask(previousUmask); }
  chmodSync(databasePath, 0o600);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  db.exec(readFileSync(schemaPath, "utf8"));
  globalThis.nexadeskDb = db as unknown as Db;
  return globalThis.nexadeskDb;
}

export function transaction<T>(work: (db: Db) => T): T {
  const db = getDb();
  db.exec(process.env.DATABASE_URL ? "BEGIN" : "BEGIN IMMEDIATE");
  try { const result = work(db); db.exec("COMMIT"); return result; }
  catch (error) { db.exec("ROLLBACK"); throw error; }
}
