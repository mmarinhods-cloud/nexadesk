import "server-only";
import { randomBytes, randomUUID, createHash, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getDb, transaction } from "@/lib/local/db";
import type { MemberRole } from "@/lib/auth/permissions";

const scrypt = (password: string, salt: Buffer) => new Promise<Buffer>((resolve, reject) => {
  scryptCallback(password, salt, 64, { N: 16384, r: 8, p: 1 }, (error, key) => error ? reject(error) : resolve(key as Buffer));
});
const cookieName = "nexadesk_session";
const issuer = "nexadesk-local";
const sessionSeconds = 8 * 60 * 60;
const dummySalt = "c2bbac877a15973cbb20f4c63b4b75ad";
const hashToken = (value: string) => createHash("sha256").update(value).digest("hex");

export type Account = { id: string; organization_id: string; name: string; email: string; password_hash: string; role: MemberRole; status: "pending_email" | "active" | "suspended"; verified_at: string | null; failed_attempts: number; locked_until: string | null };

function signingKey() {
  const configured = process.env.NEXADESK_JWT_SECRET;
  if (!configured) throw new Error("NEXADESK_JWT_SECRET não configurado. Execute npm run setup:local.");
  const bytes = Buffer.from(configured, "base64url");
  if (bytes.length < 32) throw new Error("NEXADESK_JWT_SECRET precisa ter pelo menos 32 bytes.");
  return bytes;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, Buffer.from(salt, "hex"));
  return `scrypt$16384$8$1$${salt}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string | null) {
  const parts = stored?.split("$");
  const salt = parts?.length === 6 && parts[0] === "scrypt" ? parts[4] : dummySalt;
  const key = await scrypt(password, Buffer.from(salt, "hex"));
  if (!stored || !parts || parts.length !== 6) return false;
  const expected = Buffer.from(parts[5], "hex");
  return expected.length === key.length && timingSafeEqual(key, expected);
}

export function firstAccount() {
  return (getDb().prepare("select count(*) total from accounts").get() as { total: number }).total === 0;
}

export function findAccount(email: string): Account | null {
  return (getDb().prepare("select * from accounts where email=?").get(email) as Account | undefined) ?? null;
}

export function createPendingAccount(input: { name: string; email: string; passwordHash: string; workspaceName?: string; workspaceCode?: string }) {
  return transaction((db) => {
    if (process.env.DATABASE_URL) db.prepare("select pg_advisory_xact_lock(hashtext(?))").get("nexadesk-first-account");
    const first = (db.prepare("select count(*) total from accounts").get() as { total: number }).total === 0;
    let org: { id: string; name: string } | undefined;
    if (first) {
      if (!input.workspaceName) throw new Error("Informe o nome do workspace.");
      const id = randomUUID();
      const slug = input.workspaceName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 45) || "workspace";
      db.prepare("insert into organizations values (?,?,?)").run(id, input.workspaceName, slug);
      org = { id, name: input.workspaceName };
      db.prepare("insert into sla_policies values (?,?,?,?,?)").run(randomUUID(), id, "Padrão", 240, 1440);
    } else {
      if (!input.workspaceCode) throw new Error("Informe o código do workspace.");
      org = db.prepare("select id,name from organizations where slug=?").get(input.workspaceCode) as { id: string; name: string } | undefined;
      if (!org) throw new Error("Workspace não encontrado.");
    }
    const id = randomUUID();
    const now = new Date().toISOString();
    const role = first ? "owner" : "customer";
    db.prepare("insert into accounts (id,organization_id,name,email,password_hash,role,status,verified_at,created_at,updated_at,privacy_notice_version,privacy_ack_at,failed_attempts,locked_until) values (?,?,?,?,?,?,?,?,?,?,?,?,0,null)").run(id, org.id, input.name, input.email, input.passwordHash, role, "pending_email", null, now, now, "2026-09-25", now);
    if (role === "customer") db.prepare("insert into customers values (?,?,?,?,?,?,?)").run(id, org.id, null, input.name, input.email, "Padrão", 0);
    else db.prepare("insert into agents values (?,?,?,?,?)").run(id, org.id, input.name, input.email, role);
    return { id, role, organizationId: org.id };
  });
}

export function rollbackPendingAccount(id: string) {
  transaction((db) => {
    const account = db.prepare("select organization_id,role,status from accounts where id=?").get(id) as { organization_id: string; role: string; status: string } | undefined;
    if (!account || account.status !== "pending_email") return;
    db.prepare("delete from auth_tokens where account_id=?").run(id);
    db.prepare("delete from customers where id=?").run(id);
    db.prepare("delete from agents where id=?").run(id);
    db.prepare("delete from accounts where id=?").run(id);
    const others = (db.prepare("select count(*) total from accounts where organization_id=?").get(account.organization_id) as { total: number }).total;
    if (!others) { db.prepare("delete from sla_policies where organization_id=?").run(account.organization_id); db.prepare("delete from organizations where id=?").run(account.organization_id); }
  });
}

export function createAccountToken(accountId: string, purpose: "verify_email" | "reset_password") {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expires = new Date(now.getTime() + (purpose === "verify_email" ? 24 * 60 * 60 * 1000 : 30 * 60 * 1000)).toISOString();
  const db = getDb();
  db.prepare("delete from auth_tokens where account_id=? and purpose=? and expires_at<=?").run(accountId, purpose, now.toISOString());
  db.prepare("insert into auth_tokens values (?,?,?,?,?,?,?)").run(randomUUID(), accountId, purpose, hashToken(token), expires, null, now.toISOString());
  return token;
}

function accountForToken(db: ReturnType<typeof getDb>, token: string, purpose: "verify_email" | "reset_password") {
  return db.prepare("select t.account_id,a.status from auth_tokens t join accounts a on a.id=t.account_id where t.token_hash=? and t.purpose=? and t.consumed_at is null and t.expires_at>?").get(hashToken(token), purpose, new Date().toISOString()) as { account_id: string; status: Account["status"] } | undefined;
}

export function confirmAccountEmail(token: string): boolean {
  if (!/^[A-Za-z0-9_-]{40,100}$/.test(token)) return false;
  return transaction((db) => {
    const account = accountForToken(db, token, "verify_email");
    if (!account || account.status !== "pending_email") return false;
    const now = new Date().toISOString();
    db.prepare("update accounts set status='active',verified_at=?,updated_at=? where id=?").run(now, now, account.account_id);
    db.prepare("delete from auth_tokens where account_id=? and purpose='verify_email'").run(account.account_id);
    return true;
  });
}

export function resetPasswordWithToken(token: string, passwordHash: string): boolean {
  if (!/^[A-Za-z0-9_-]{40,100}$/.test(token)) return false;
  return transaction((db) => {
    const account = accountForToken(db, token, "reset_password");
    if (!account || account.status !== "active") return false;
    const now = new Date().toISOString();
    db.prepare("update accounts set password_hash=?,failed_attempts=0,locked_until=null,updated_at=? where id=?").run(passwordHash, now, account.account_id);
    db.prepare("update sessions set revoked_at=? where account_id=? and revoked_at is null").run(now, account.account_id);
    db.prepare("delete from auth_tokens where account_id=? and purpose='reset_password'").run(account.account_id);
    return true;
  });
}

export function recordLoginFailure(account: Account | null) {
  if (!account) return;
  const attempts = account.failed_attempts + 1;
  const locked = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
  getDb().prepare("update accounts set failed_attempts=?,locked_until=? where id=?").run(locked ? 0 : attempts, locked, account.id);
}

export async function createSession(accountId: string) {
  const id = randomUUID();
  const now = new Date();
  const expires = new Date(now.getTime() + sessionSeconds * 1000);
  getDb().prepare("insert into sessions values (?,?,?,?,?)").run(id, accountId, expires.toISOString(), null, now.toISOString());
  const token = await new SignJWT({}).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setIssuer(issuer).setAudience(issuer).setSubject(accountId).setJti(id).setIssuedAt().setExpirationTime(Math.floor(expires.getTime() / 1000)).sign(signingKey());
  (await cookies()).set(cookieName, token, { httpOnly: true, sameSite: "strict", secure: false, path: "/", maxAge: sessionSeconds, priority: "high" });
}

export async function readSession() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, signingKey(), { algorithms: ["HS256"], issuer, audience: issuer });
    if (!payload.sub || !payload.jti) return null;
    const row = getDb().prepare("select a.* from sessions s join accounts a on a.id=s.account_id where s.id=? and s.account_id=? and s.revoked_at is null and s.expires_at>? and a.status='active' and a.verified_at is not null").get(payload.jti, payload.sub, new Date().toISOString()) as Account | undefined;
    return row ? { account: row, sessionId: payload.jti } : null;
  } catch { return null; }
}

export async function revokeSession() {
  const current = await readSession();
  if (current) getDb().prepare("update sessions set revoked_at=? where id=?").run(new Date().toISOString(), current.sessionId);
  (await cookies()).delete(cookieName);
}
