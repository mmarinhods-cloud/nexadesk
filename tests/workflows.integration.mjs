import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash, randomBytes, randomUUID, scrypt as scryptCallback } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { promisify } from "node:util";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { encodeReply } = require("next/dist/compiled/react-server-dom-webpack/client.node");
const manifest = require("../.next/server/server-reference-manifest.json");
const actionId = (name) => Object.entries(manifest.node).find(([, item]) => item.exportedName === name)?.[0];
const port = 3107;
const origin = `http://127.0.0.1:${port}`;
const temporary = await mkdtemp(join(tmpdir(), "nexadesk-integration-"));
const dbPath = join(temporary, "test.sqlite");
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys=ON");
db.exec(await readFile("src/lib/local/schema.sql", "utf8"));
const organizationId = randomUUID();
const now = new Date().toISOString();
const password = randomBytes(18).toString("base64url");
const salt = randomBytes(16);
const key = await promisify(scryptCallback)(password, salt, 64, { N: 16384, r: 8, p: 1 });
const hash = `scrypt$16384$8$1$${salt.toString("hex")}$${key.toString("hex")}`;
db.prepare("insert into organizations values (?,?,?)").run(organizationId, "Workspace de testes", "workspace-de-testes");
db.prepare("insert into sla_policies values (?,?,?,?,?)").run(randomUUID(), organizationId, "Padrão", 240, 1440);
const accounts = [];
for (let index = 1; index <= 20; index++) {
  const role = index <= 13 ? "customer" : index <= 17 ? "admin" : "supervisor";
  const id = randomUUID();
  const name = `${role === "customer" ? "Cliente" : role === "admin" ? "Admin" : "Supervisor"} ${String(index).padStart(2, "0")}`;
  const email = `workflow${String(index).padStart(2, "0")}@nexadesk.test`;
  db.prepare("insert into accounts (id,organization_id,name,email,password_hash,role,status,verified_at,created_at,updated_at,privacy_notice_version,privacy_ack_at,failed_attempts,locked_until) values (?,?,?,?,?,?,?,?,?,?,?,?,0,null)").run(id, organizationId, name, email, hash, role, "active", now, now, now, "test-fixture", null);
  if (role === "customer") db.prepare("insert into customers values (?,?,?,?,?,?,?)").run(id, organizationId, null, name, email, "Padrão", 0);
  else db.prepare("insert into agents values (?,?,?,?,?)").run(id, organizationId, name, email, role);
  accounts.push({ id, email, role });
}
assert.equal(accounts.length, 20);
assert.equal(accounts.filter((account) => account.role === "customer").length, 13);
assert.equal(accounts.filter((account) => account.role === "admin").length, 4);
assert.equal(accounts.filter((account) => account.role === "supervisor").length, 3);
db.close();

const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: process.cwd(),
  env: { ...process.env, DATABASE_URL: "", NEXADESK_TEST_MODE: "1", NEXADESK_LOCAL_DB_PATH: dbPath, NEXADESK_ATTACHMENT_DIR: join(temporary, "attachments"), NEXADESK_JWT_SECRET: randomBytes(32).toString("base64url"), EMAIL_USER: "", EMAIL_USER_TOKEN: "", NEXADESK_SITE_URL: origin },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += String(chunk).slice(-1500); });
server.stderr.on("data", (chunk) => { serverOutput += String(chunk).slice(-1500); });

async function request(path, options = {}) {
  return fetch(`${origin}${path}`, { redirect: "manual", ...options });
}
function actionField(html) {
  const match = html.match(/name="(\$ACTION_ID_[a-f0-9]+)"/);
  assert.ok(match, "Formulário de Server Action não encontrado");
  return match[1];
}
async function login(account) {
  const page = await request("/login");
  assert.equal(page.status, 200);
  const form = new FormData();
  form.set(actionField(await page.text()), "");
  form.set("email", account.email);
  form.set("password", password);
  const response = await request("/login", { method: "POST", body: form, headers: { Origin: origin } });
  assert.ok([302, 303].includes(response.status), `Login falhou: ${response.status}`);
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie?.startsWith("nexadesk_session="), "Cookie de sessão ausente");
  return cookie;
}
async function serverAction(path, cookie, name, args, expectSuccess = true) {
  const id = actionId(name);
  assert.ok(id, `Action ${name} ausente no manifesto`);
  const body = await encodeReply(args);
  const headers = { Origin: origin, Cookie: cookie, "Next-Action": id, Accept: "text/x-component" };
  if (typeof body === "string") headers["Content-Type"] = "text/plain;charset=UTF-8";
  const response = await request(path, { method: "POST", headers, body });
  const text = await response.text();
  const hasError = !response.ok || text.includes("E{");
  if (expectSuccess) assert.ok(!hasError, `${name} falhou: HTTP ${response.status}`);
  else assert.ok(hasError, `${name} aceitou uma ação proibida`);
  return response;
}

try {
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server.exitCode !== null) throw new Error(`Servidor de testes terminou: ${serverOutput}`);
    try { if ((await request("/login")).status === 200) { ready = true; break; } } catch { /* aguardando a porta */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, `Servidor de testes indisponível: ${serverOutput}`);
  const loginPage = await request("/login");
  assert.match(loginPage.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.match(loginPage.headers.get("cache-control") ?? "", /no-store/);
  assert.equal((await request("/login", { headers: { "X-Forwarded-Host": "host-invalido.test" } })).status, 400);
  assert.equal((await request("/login", { method: "POST", headers: { Origin: "http://site-invalido.test" } })).status, 403);
  assert.equal((await request("/login", { method: "POST" })).status, 403);

  const cookies = new Map();
  for (const account of accounts) {
    const cookie = await login(account);
    cookies.set(account.id, cookie);
    const route = account.role === "customer" ? "/portal" : "/app";
    assert.equal((await request(route, { headers: { Cookie: cookie } })).status, 200, `${account.role} sem acesso à própria área`);
  }

  const customer = accounts[0];
  const otherCustomer = accounts[1];
  const admin = accounts[13];
  const supervisor = accounts[17];
  assert.equal((await request("/app", { headers: { Cookie: cookies.get(customer.id) } })).headers.get("location"), "/portal");
  assert.equal((await request("/api/account/export")).status, 401);

  for (const [index, account] of accounts.slice(0, 13).entries()) {
    const page = await request("/portal/new-ticket", { headers: { Cookie: cookies.get(account.id) } });
    assert.equal(page.status, 200);
    assert.ok((await page.text()).includes(`$ACTION_ID_${actionId("createTicketAction")}`));
    const form = new FormData();
    form.set(`$ACTION_ID_${actionId("createTicketAction")}`, "");
    form.set("subject", index === 0 ? "Falha ao entrar na plataforma" : `Solicitação de suporte ${index + 1}`);
    form.set("description", index === 0 ? "Não consigo entrar na plataforma desde esta manhã e preciso de ajuda." : `Preciso de orientação para resolver a solicitação ${index + 1} no portal de atendimento.`);
    const response = await request("/portal/new-ticket", { method: "POST", headers: { Cookie: cookies.get(account.id), Origin: origin }, body: form });
    assert.ok([302, 303].includes(response.status), `Criação do ticket ${index + 1} falhou: ${response.status}`);
    assert.ok(response.headers.get("location")?.startsWith("/portal/tickets/"), `Criação redirecionou para ${response.headers.get("location")}`);
  }
  const created = new DatabaseSync(dbPath);
  const ticket = created.prepare("select id,status from tickets where customer_id=?").get(customer.id);
  assert.ok(ticket?.id, "Ticket não gravado");
  assert.equal(created.prepare("select count(*) total from tickets").get().total, 13);
  assert.equal(created.prepare("select count(*) total from messages where ticket_id=?").get(ticket.id).total, 1);
  assert.equal((await request(`/portal/tickets/${ticket.id}`, { headers: { Cookie: cookies.get(otherCustomer.id) } })).status, 404);

  await serverAction(`/app/tickets/${ticket.id}`, cookies.get(customer.id), "changeTicketAction", [ticket.id, "status", "resolved"], false);
  assert.equal(created.prepare("select status from tickets where id=?").get(ticket.id).status, "open");
  await serverAction(`/portal/tickets/${ticket.id}`, cookies.get(otherCustomer.id), "sendMessageAction", [ticket.id, "Tentativa indevida", "public"], false);
  await serverAction(`/portal/tickets/${ticket.id}`, cookies.get(customer.id), "sendMessageAction", [ticket.id, "Tentativa de nota interna", "internal"], false);
  await serverAction(`/portal/tickets/${ticket.id}`, cookies.get(customer.id), "submitFeedbackAction", [ticket.id, 5, "Antes da solução"], false);
  assert.equal(created.prepare("select count(*) total from messages where ticket_id=?").get(ticket.id).total, 1);
  assert.equal(created.prepare("select count(*) total from feedback where ticket_id=?").get(ticket.id).total, 0);

  await serverAction(`/app/tickets/${ticket.id}`, cookies.get(admin.id), "sendMessageAction", [ticket.id, "<p>Estamos analisando o acesso e retornaremos em breve.</p>", "public"]);
  await serverAction(`/app/tickets/${ticket.id}`, cookies.get(supervisor.id), "sendMessageAction", [ticket.id, "<p>Nota reservada à equipe.</p>", "internal"]);
  await serverAction(`/portal/tickets/${ticket.id}`, cookies.get(customer.id), "sendMessageAction", [ticket.id, "Obrigado. Continuo aguardando a solução.", "public"]);
  await serverAction(`/app/tickets/${ticket.id}`, cookies.get(admin.id), "changeTicketAction", [ticket.id, "status", "resolved"]);
  assert.equal(created.prepare("select status from tickets where id=?").get(ticket.id).status, "resolved");
  assert.equal(created.prepare("select count(*) total from messages where ticket_id=?").get(ticket.id).total, 4);
  const customerPage = await request(`/portal/tickets/${ticket.id}`, { headers: { Cookie: cookies.get(customer.id) } });
  const customerHtml = await customerPage.text();
  assert.ok(customerHtml.includes("Estamos analisando"), "Resposta pública não apareceu no portal");
  assert.ok(!customerHtml.includes("Nota reservada à equipe"), "Nota interna vazou para o cliente");
  const fakeUpload = new FormData();
  fakeUpload.set("ticketId", ticket.id);
  fakeUpload.set("visibility", "public");
  fakeUpload.set("file", new File(["conteúdo inválido"], "falso.png", { type: "image/png" }));
  await serverAction(`/portal/tickets/${ticket.id}`, cookies.get(customer.id), "uploadAttachmentAction", [fakeUpload]);
  assert.equal(created.prepare("select count(*) total from attachments where ticket_id=?").get(ticket.id).total, 0, "Arquivo falso foi aceito");
  const validUpload = new FormData();
  validUpload.set("ticketId", ticket.id);
  validUpload.set("visibility", "public");
  validUpload.set("file", new File([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/NnoAAAAASUVORK5CYII=", "base64")], "captura.png", { type: "image/png" }));
  await serverAction(`/portal/tickets/${ticket.id}`, cookies.get(customer.id), "uploadAttachmentAction", [validUpload]);
  const attachment = created.prepare("select id from attachments where ticket_id=?").get(ticket.id);
  assert.ok(attachment?.id, "Anexo válido não foi gravado");
  assert.equal((await request(`/api/attachments/${attachment.id}`, { headers: { Cookie: cookies.get(customer.id) } })).status, 200);
  assert.equal((await request(`/api/attachments/${attachment.id}`, { headers: { Cookie: cookies.get(otherCustomer.id) } })).status, 404);
  assert.equal((await request(`/api/attachments/${attachment.id}`)).status, 401);
  await serverAction(`/portal/tickets/${ticket.id}`, cookies.get(customer.id), "submitFeedbackAction", [ticket.id, 5, "Atendimento resolvido"]);
  assert.equal(created.prepare("select rating from feedback where ticket_id=?").get(ticket.id).rating, 5);
  const unverified = accounts[2];
  const verificationToken = randomBytes(32).toString("base64url");
  created.prepare("update accounts set status='pending_email',verified_at=null where id=?").run(unverified.id);
  created.prepare("insert into auth_tokens values (?,?,?,?,?,?,?)").run(randomUUID(), unverified.id, "verify_email", createHash("sha256").update(verificationToken).digest("hex"), new Date(Date.now() + 60_000).toISOString(), null, now);
  assert.equal((await request("/portal", { headers: { Cookie: cookies.get(unverified.id) } })).headers.get("location"), "/login");
  const confirmation = new FormData();
  confirmation.set(`$ACTION_ID_${actionId("confirmEmail")}`, "");
  confirmation.set("token", verificationToken);
  const confirmationResponse = await request("/verify-email", { method: "POST", body: confirmation, headers: { Origin: origin } });
  assert.equal(confirmationResponse.headers.get("location"), "/login?notice=verified");
  assert.equal(created.prepare("select status from accounts where id=?").get(unverified.id).status, "active");
  assert.equal(created.prepare("select count(*) total from auth_tokens where account_id=?").get(unverified.id).total, 0);
  await login(unverified);
  created.close();
  console.log("20 contas (13 clientes, 4 admins, 3 supervisores): login e acesso por papel OK.");
  console.log("13 tickets, conversas, solução, avaliação, anexos, bloqueios de acesso e confirmação de e-mail: OK.");
} finally {
  if (server.exitCode === null) {
    server.kill("SIGTERM");
    await new Promise((resolve) => server.once("exit", resolve));
  }
  await rm(temporary, { recursive: true, force: true });
}
