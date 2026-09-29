"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/local/db";
import { rateLimit } from "@/lib/local/rate-limit";
import { validEmail, validName, validPassword, validWorkspaceCode, validWorkspaceName } from "@/lib/auth/validation";
import { emailConfigured, sendAccountEmail } from "@/lib/auth/mail";
import { confirmAccountEmail, createAccountToken, createPendingAccount, createSession, findAccount, firstAccount, hashPassword, recordLoginFailure, resetPasswordWithToken, revokeSession, rollbackPendingAccount, verifyPassword } from "@/lib/auth/local";

function authRateLimit(scope: string, email: string | null, max: number, durationMs: number) {
  rateLimit(`${scope}:global`, 200, durationMs);
  const digest = createHash("sha256").update(email ?? "invalid").digest("hex").slice(0, 24);
  rateLimit(`${scope}:${digest}`, max, durationMs);
}

export async function register(formData: FormData) {
  const name = validName(formData.get("name"));
  const email = validEmail(formData.get("email"));
  try { authRateLimit("register", email, 5, 60 * 60 * 1000); } catch { redirect("/register?error=rate"); }
  const password = validPassword(formData.get("password"));
  const initial = firstAccount();
  const workspaceName = initial ? validWorkspaceName(formData.get("workspaceName")) : undefined;
  const workspaceCode = !initial ? validWorkspaceCode(formData.get("workspaceCode")) : undefined;
  if (!name || !email || !password || initial && !workspaceName || !initial && !workspaceCode || formData.get("privacyAck") !== "yes") redirect("/register?error=invalid");
  if (!process.env.PRIVACY_CONTROLLER_NAME || !process.env.PRIVACY_CONTACT_EMAIL) redirect("/register?error=privacy-config");
  if (!emailConfigured()) redirect("/register?error=mail-config");
  const existing = findAccount(email);
  if (existing) redirect("/register?notice=check-email");
  const passwordHash = await hashPassword(password);
  let account: { id: string };
  try { account = createPendingAccount({ name, email, passwordHash, workspaceName: workspaceName ?? undefined, workspaceCode: workspaceCode ?? undefined }); }
  catch { redirect("/register?error=workspace"); }
  try {
    const token = createAccountToken(account.id, "verify_email");
    await sendAccountEmail(email, "verify_email", token);
  } catch {
    rollbackPendingAccount(account.id);
    redirect("/register?error=mail-service");
  }
  redirect("/register?notice=check-email");
}

export async function confirmEmail(formData: FormData) {
  const token = String(formData.get("token") || "");
  if (!confirmAccountEmail(token)) redirect("/verify-email?error=expired");
  redirect("/login?notice=verified");
}

export async function resendVerification(formData: FormData) {
  const email = validEmail(formData.get("email"));
  try { authRateLimit("resend", email, 5, 60 * 60 * 1000); } catch { redirect("/verify-email?notice=sent"); }
  if (!email || !emailConfigured()) redirect("/verify-email?notice=sent");
  const account = findAccount(email);
  if (account?.status === "pending_email") {
    try { await sendAccountEmail(email, "verify_email", createAccountToken(account.id, "verify_email")); } catch { /* Resposta uniforme para evitar enumeração. */ }
  }
  redirect("/verify-email?notice=sent");
}

export async function login(formData: FormData) {
  const email = validEmail(formData.get("email"));
  try { authRateLimit("login", email, 10, 15 * 60 * 1000); } catch { redirect("/login?error=rate"); }
  const password = formData.get("password");
  if (!email || typeof password !== "string" || !password || Buffer.byteLength(password) > 512) redirect("/login?error=invalid");
  const account = findAccount(email);
  const verified = await verifyPassword(password, account?.password_hash ?? null);
  if (!account || !verified || account.locked_until && account.locked_until > new Date().toISOString()) {
    if (account && !verified) recordLoginFailure(account);
    redirect("/login?error=invalid");
  }
  if (account.status !== "active" || !account.verified_at) redirect("/login?error=inactive");
  getDb().prepare("update accounts set failed_attempts=0,locked_until=null where id=?").run(account.id);
  await createSession(account.id);
  redirect(account.role === "customer" ? "/portal" : "/app");
}

export async function sendPasswordReset(formData: FormData) {
  const email = validEmail(formData.get("email"));
  try { authRateLimit("reset", email, 5, 60 * 60 * 1000); } catch { redirect("/reset-password?notice=sent"); }
  if (!email || !emailConfigured()) redirect("/reset-password?notice=sent");
  const account = findAccount(email);
  if (account?.status === "active") {
    try { await sendAccountEmail(email, "reset_password", createAccountToken(account.id, "reset_password")); } catch { /* Resposta uniforme. */ }
  }
  redirect("/reset-password?notice=sent");
}

export async function updatePassword(formData: FormData) {
  const token = String(formData.get("token") || "");
  const password = validPassword(formData.get("password"));
  if (!password) redirect(`/update-password?token=${encodeURIComponent(token)}&error=weak`);
  const passwordHash = await hashPassword(password);
  if (!resetPasswordWithToken(token, passwordHash)) redirect("/update-password?error=expired");
  redirect("/login?notice=password-updated");
}

export async function logout() {
  await revokeSession();
  redirect("/login");
}
