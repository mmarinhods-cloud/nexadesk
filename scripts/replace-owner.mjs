import { existsSync } from "node:fs";
import { randomBytes, randomUUID, createHash, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import pg from "pg";
import nodemailer from "nodemailer";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const options = new Map();
for (let i = 2; i < process.argv.length; i += 2) options.set(process.argv[i], process.argv[i + 1]);
const email = options.get("--email")?.trim().toLowerCase();
const name = options.get("--name")?.trim();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !name || name.length < 2 || name.length > 80) {
  console.error("Uso: npm run account:replace-owner -- --email usuario@dominio.com --name Nome");
  process.exit(1);
}
const connectionString = process.env.DATABASE_URL;
if (!connectionString || new URL(connectionString).pathname !== "/nexadesk") throw new Error("DATABASE_URL deve apontar para a base PostgreSQL nexadesk.");
if (!process.env.EMAIL_USER || !process.env.EMAIL_USER_TOKEN) throw new Error("Configure EMAIL_USER e EMAIL_USER_TOKEN.");
const origin = new URL(process.env.NEXADESK_SITE_URL || "http://127.0.0.1:3000");
if (origin.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(origin.hostname)) throw new Error("NEXADESK_SITE_URL deve apontar para localhost.");

if (!process.stdin.isTTY) throw new Error("Execute o comando em um terminal interativo.");
console.log("Informe a nova senha (a entrada ficará oculta):");
const password = await new Promise((resolve, reject) => {
  let value = "";
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on("data", function onData(chunk) {
    for (const char of String(chunk)) {
      if (char === "\r" || char === "\n") {
        process.stdin.off("data", onData);
        process.stdin.setRawMode(false);
        process.stdin.pause();
        console.log();
        resolve(value);
        return;
      }
      if (char === "\u0003") {
        process.stdin.off("data", onData);
        process.stdin.setRawMode(false);
        process.stdin.pause();
        reject(new Error("Operação cancelada."));
        return;
      }
      if (char === "\u007f") value = value.slice(0, -1);
      else if (value.length < 129) value += char;
    }
  });
});
if (password.length < 8 || password.length > 128 || Buffer.byteLength(password, "utf8") > 512) throw new Error("A senha precisa ter de 8 a 128 caracteres.");
const salt = randomBytes(16);
const derived = await promisify(scryptCallback)(password, salt, 64, { N: 16384, r: 8, p: 1 });
const passwordHash = `scrypt$16384$8$1$${salt.toString("hex")}$${derived.toString("hex")}`;
const token = randomBytes(32).toString("base64url");
const tokenHash = createHash("sha256").update(token).digest("hex");
const now = new Date().toISOString();
const accountId = randomUUID();
const client = new pg.Client({ connectionString });
await client.connect();
try {
  await client.query("begin");
  await client.query("set local search_path to nexadesk, public");
  await client.query("lock table accounts in exclusive mode");
  const { rows: accounts } = await client.query("select id,organization_id from accounts");
  if (accounts.length !== 1) throw new Error("A substituição requer exatamente uma conta existente.");
  const { rows: organizations } = await client.query("select id from organizations");
  if (organizations.length !== 1 || organizations[0].id !== accounts[0].organization_id) throw new Error("Organização inesperada; nenhuma conta foi alterada.");
  const emptyTables = ["tickets", "messages", "events", "companies", "customers", "articles", "automations", "automation_runs", "notifications", "macros", "feedback", "attachments", "audit_logs", "saved_views", "privacy_requests"];
  for (const table of emptyTables) {
    const { rows } = await client.query(`select count(*)::int total from ${table}`);
    if (rows[0].total !== 0) throw new Error(`Há registros em ${table}; nenhuma conta foi alterada.`);
  }
  await client.query("alter table accounts alter column privacy_ack_at drop not null");
  await client.query("delete from agents where id=$1", [accounts[0].id]);
  await client.query("delete from accounts where id=$1", [accounts[0].id]);
  await client.query(
    "insert into accounts (id,organization_id,name,email,password_hash,role,status,verified_at,created_at,updated_at,privacy_notice_version,privacy_ack_at,failed_attempts,locked_until) values ($1,$2,$3,$4,$5,'owner','pending_email',null,$6,$6,$7,null,0,null)",
    [accountId, accounts[0].organization_id, name, email, passwordHash, now, "2026-09-25"],
  );
  await client.query("insert into agents (id,organization_id,name,email,role) values ($1,$2,$3,$4,'owner')", [accountId, accounts[0].organization_id, name, email]);
  await client.query("insert into auth_tokens (id,account_id,purpose,token_hash,expires_at,consumed_at,created_at) values ($1,$2,'verify_email',$3,$4,null,$5)", [randomUUID(), accountId, tokenHash, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), now]);

  const port = Number(process.env.SMTP_PORT || "465");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("SMTP_PORT inválida.");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com", port, secure: port === 465,
    requireTLS: port !== 465, auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_USER_TOKEN },
    tls: { minVersion: "TLSv1.2" }, disableFileAccess: true, disableUrlAccess: true,
    connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 15000,
  });
  const link = `${origin.origin}/verify-email?token=${encodeURIComponent(token)}`;
  await transporter.sendMail({
    from: process.env.EMAIL_USER, to: email, subject: "Confirme seu e-mail no NexaDesk",
    text: `Para confirmar seu e-mail e ativar sua conta owner, abra este link:\n${link}\n\nO link expira em 24 horas. Se você não solicitou o cadastro, ignore esta mensagem.`,
  });
  await client.query("commit");
  console.log(`Conta owner criada para ${email}. Confirmação enviada por e-mail.`);
} catch (error) {
  await client.query("rollback");
  console.error(`Conta preservada: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
