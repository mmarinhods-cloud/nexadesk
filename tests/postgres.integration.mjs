import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes, randomUUID, scrypt as scryptCallback } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { createRequire } from "node:module";
import pg from "pg";

process.loadEnvFile(".env.local");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL ausente.");
const require = createRequire(import.meta.url);
const { encodeReply } = require("next/dist/compiled/react-server-dom-webpack/client.node");
const manifest = require("../.next/server/server-reference-manifest.json");
const actionId = (name) => Object.entries(manifest.node).find(([, item]) => item.exportedName === name)?.[0];
const origin = "http://127.0.0.1:3109";
const organizationId = randomUUID();
const slug = `integration-${organizationId.slice(0, 8)}`;
const temporary = await mkdtemp(join(tmpdir(), "nexadesk-postgres-integration-"));
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, application_name: "nexadesk-integration" });
await client.connect();
await client.query("set search_path to nexadesk, public");
let server;

async function cleanup() {
  await client.query("begin");
  try {
    const { rows } = await client.query("select slug from organizations where id=$1", [organizationId]);
    if (!rows.length) { await client.query("rollback"); return; }
    if (rows[0].slug !== slug) throw new Error("Organização de testes divergente; limpeza cancelada.");
    await client.query("delete from ticket_tags where ticket_id in (select id from tickets where organization_id=$1)", [organizationId]);
    await client.query("delete from sessions where account_id in (select id from accounts where organization_id=$1)", [organizationId]);
    await client.query("delete from auth_tokens where account_id in (select id from accounts where organization_id=$1)", [organizationId]);
    await client.query("delete from privacy_requests where account_id in (select id from accounts where organization_id=$1)", [organizationId]);
    for (const table of ["feedback", "attachments", "notifications", "automation_runs", "messages", "events", "tickets", "saved_views", "audit_logs", "automations", "articles", "macros", "tags", "agents", "customers", "companies", "sla_policies", "accounts"]) {
      await client.query(`delete from ${table} where organization_id=$1`, [organizationId]);
    }
    await client.query("delete from organizations where id=$1 and slug=$2", [organizationId, slug]);
    await client.query("commit");
  } catch (error) { await client.query("rollback"); throw error; }
}

async function request(path, options = {}) { return fetch(`${origin}${path}`, { redirect: "manual", ...options }); }
async function login(account, password) {
  const page = await request("/login");
  assert.equal(page.status, 200);
  const form = new FormData();
  form.set(`$ACTION_ID_${actionId("login")}`, "");
  form.set("email", account.email);
  form.set("password", password);
  const response = await request("/login", { method: "POST", headers: { Origin: origin }, body: form });
  assert.ok([302, 303].includes(response.status), `Login PostgreSQL falhou: ${response.status}`);
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie?.startsWith("nexadesk_session="));
  return cookie;
}
async function action(path, cookie, name, args) {
  const id = actionId(name);
  assert.ok(id);
  const body = await encodeReply(args);
  const headers = { Origin: origin, Cookie: cookie, "Next-Action": id, Accept: "text/x-component" };
  if (typeof body === "string") headers["Content-Type"] = "text/plain;charset=UTF-8";
  const response = await request(path, { method: "POST", headers, body });
  assert.ok(response.ok, `${name}: HTTP ${response.status}`);
  assert.ok(!(await response.text()).includes("E{"), `${name} retornou erro`);
}

try {
  const now = new Date().toISOString();
  const password = randomBytes(18).toString("base64url");
  const salt = randomBytes(16);
  const key = await promisify(scryptCallback)(password, salt, 64, { N: 16384, r: 8, p: 1 });
  const hash = `scrypt$16384$8$1$${salt.toString("hex")}$${key.toString("hex")}`;
  await client.query("begin");
  try {
    await client.query("insert into organizations values ($1,$2,$3)", [organizationId, "Teste integrado PostgreSQL", slug]);
    await client.query("insert into sla_policies values ($1,$2,$3,$4,$5)", [randomUUID(), organizationId, "Padrão", 240, 1440]);
    const accounts = [];
    for (let index = 1; index <= 20; index++) {
      const role = index <= 13 ? "customer" : index <= 17 ? "admin" : "supervisor";
      const id = randomUUID();
      const name = `${role} ${index}`;
      const email = `pg-${organizationId.slice(0, 8)}-${index}@nexadesk.test`;
      await client.query("insert into accounts (id,organization_id,name,email,password_hash,role,status,verified_at,created_at,updated_at,privacy_notice_version,privacy_ack_at,failed_attempts,locked_until) values ($1,$2,$3,$4,$5,$6,'active',$7,$7,$7,'test-fixture',null,0,null)", [id, organizationId, name, email, hash, role, now]);
      if (role === "customer") await client.query("insert into customers values ($1,$2,$3,$4,$5,$6,$7)", [id, organizationId, null, name, email, "Padrão", 0]);
      else await client.query("insert into agents values ($1,$2,$3,$4,$5)", [id, organizationId, name, email, role]);
      accounts.push({ id, email, role });
    }
    await client.query("commit");

    server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3109"], {
      cwd: process.cwd(),
      env: { ...process.env, NEXADESK_ATTACHMENT_DIR: join(temporary, "attachments"), NEXADESK_SITE_URL: origin, EMAIL_USER: "", EMAIL_USER_TOKEN: "" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    server.stdout.on("data", (chunk) => { output += String(chunk).slice(-1500); });
    server.stderr.on("data", (chunk) => { output += String(chunk).slice(-1500); });
    let ready = false;
    for (let attempt = 0; attempt < 120; attempt++) {
      if (server.exitCode !== null) throw new Error(`Servidor PostgreSQL terminou: ${output}`);
      try { if ((await request("/login")).status === 200) { ready = true; break; } } catch { /* aguardando a porta */ }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    assert.ok(ready, `Servidor PostgreSQL indisponível: ${output}`);

    const cookies = new Map(await Promise.all(accounts.map(async (account) => {
      const cookie = await login(account, password);
      assert.equal((await request(account.role === "customer" ? "/portal" : "/app", { headers: { Cookie: cookie } })).status, 200);
      return [account.id, cookie];
    })));
    await Promise.all(Array.from({ length: 13 }, async (_, index) => {
      const account = accounts[index];
      const form = new FormData();
      form.set(`$ACTION_ID_${actionId("createTicketAction")}`, "");
      form.set("subject", `Solicitação PostgreSQL ${index + 1}`);
      form.set("description", `Solicitação real de teste PostgreSQL ${index + 1} com descrição suficiente.`);
      const response = await request("/portal/new-ticket", { method: "POST", headers: { Cookie: cookies.get(account.id), Origin: origin }, body: form });
      assert.ok(response.headers.get("location")?.startsWith("/portal/tickets/"), `Ticket PG ${index + 1} falhou: ${response.status}`);
    }));
    const count = await client.query("select count(*)::int total,count(distinct number)::int unique_numbers from tickets where organization_id=$1", [organizationId]);
    assert.equal(count.rows[0].total, 13);
    assert.equal(count.rows[0].unique_numbers, 13);
    const ticketResult = await client.query("select id,status from tickets where organization_id=$1 order by number limit 1", [organizationId]);
    const ticket = ticketResult.rows[0];
    const customer = accounts[0];
    const admin = accounts[13];
    const supervisor = accounts[17];
    assert.equal((await request(`/portal/tickets/${ticket.id}`, { headers: { Cookie: cookies.get(accounts[1].id) } })).status, 404);
    await action(`/app/tickets/${ticket.id}`, cookies.get(admin.id), "sendMessageAction", [ticket.id, "<p>Resposta de suporte PostgreSQL.</p>", "public"]);
    await action(`/app/tickets/${ticket.id}`, cookies.get(supervisor.id), "sendMessageAction", [ticket.id, "<p>Nota interna PostgreSQL.</p>", "internal"]);
    await action(`/portal/tickets/${ticket.id}`, cookies.get(customer.id), "sendMessageAction", [ticket.id, "Recebi a resposta. Obrigado.", "public"]);
    await action(`/app/tickets/${ticket.id}`, cookies.get(admin.id), "changeTicketAction", [ticket.id, "status", "resolved"]);
    const finalTicket = await client.query("select status from tickets where id=$1", [ticket.id]);
    assert.equal(finalTicket.rows[0].status, "resolved");
    await action(`/portal/tickets/${ticket.id}`, cookies.get(customer.id), "submitFeedbackAction", [ticket.id, 5, "Resolvido"]);
    const feedback = await client.query("select rating from feedback where ticket_id=$1", [ticket.id]);
    assert.equal(feedback.rows[0].rating, 5);
    const page = await request(`/portal/tickets/${ticket.id}`, { headers: { Cookie: cookies.get(customer.id) } });
    const html = await page.text();
    assert.ok(html.includes("Resposta de suporte PostgreSQL."));
    assert.ok(!html.includes("Nota interna PostgreSQL."));
    const analytics = await request("/app/analytics?days=7", { headers: { Cookie: cookies.get(supervisor.id) } });
    assert.equal(analytics.status, 200);
    assert.ok((await analytics.text()).includes("Tickets recebidos"));
    console.log("PostgreSQL: 20 logins e 13 tickets simultâneos, conversa, nota interna, solução e avaliação OK.");
  } catch (error) { await client.query("rollback").catch(() => {}); throw error; }
} finally {
  if (server?.exitCode === null) {
    server.kill("SIGTERM");
    await new Promise((resolve) => server.once("exit", resolve));
  }
  await cleanup();
  const remaining = await client.query("select count(*)::int total from organizations where id=$1", [organizationId]);
  assert.equal(remaining.rows[0].total, 0, "Organização de testes não removida");
  await client.end();
  await rm(temporary, { recursive: true, force: true });
}
