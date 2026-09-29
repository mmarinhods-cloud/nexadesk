import "server-only";
import nodemailer from "nodemailer";
import { accountEmailContent } from "@/lib/auth/email-template";

export function emailConfigured() {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_USER_TOKEN);
}

function origin() {
  const value = process.env.NEXADESK_SITE_URL || "http://127.0.0.1:3000";
  const parsed = new URL(value);
  if (parsed.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(parsed.hostname)) throw new Error("NEXADESK_SITE_URL deve apontar para localhost.");
  return parsed.origin;
}

export async function sendAccountEmail(to: string, purpose: "verify_email" | "reset_password", token: string) {
  if (!emailConfigured()) throw new Error("Configure EMAIL_USER e EMAIL_USER_TOKEN antes de cadastrar contas.");
  const port = Number(process.env.SMTP_PORT || "465");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("SMTP_PORT inválida.");
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const transporter = nodemailer.createTransport({
    host, port, secure: port === 465, requireTLS: port !== 465,
    auth: { user: process.env.EMAIL_USER!, pass: process.env.EMAIL_USER_TOKEN! },
    tls: { minVersion: "TLSv1.2" },
    disableFileAccess: true, disableUrlAccess: true,
  });
  const path = purpose === "verify_email" ? "/verify-email" : "/update-password";
  const link = `${origin()}${path}?token=${encodeURIComponent(token)}`;
  await transporter.sendMail({ from: `NexaDesk <${process.env.EMAIL_USER!}>`, to, ...accountEmailContent(purpose, link) });
}
