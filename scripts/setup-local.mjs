import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { resolve } from "node:path";

const path = resolve(process.cwd(), ".env.local");
const current = existsSync(path) ? readFileSync(path, "utf8") : "";
const has = (name) => new RegExp(`^${name}=`, "m").test(current);
const additions = [];
if (!has("NEXADESK_JWT_SECRET")) additions.push(`NEXADESK_JWT_SECRET=${randomBytes(32).toString("base64url")}`);
if (!has("NEXADESK_SITE_URL")) additions.push("NEXADESK_SITE_URL=http://127.0.0.1:3000");
if (!has("SMTP_HOST")) additions.push("SMTP_HOST=smtp.gmail.com");
if (!has("SMTP_PORT")) additions.push("SMTP_PORT=465");
if (!has("EMAIL_USER")) additions.push("EMAIL_USER=");
if (!has("EMAIL_USER_TOKEN")) additions.push("EMAIL_USER_TOKEN=");
if (!has("PRIVACY_CONTACT_EMAIL")) additions.push("PRIVACY_CONTACT_EMAIL=");
if (!has("PRIVACY_CONTROLLER_NAME")) additions.push("PRIVACY_CONTROLLER_NAME=");
if (additions.length) writeFileSync(path, `${current.trimEnd()}${current.trim() ? "\n" : ""}${additions.join("\n")}\n`, { mode: 0o600 });
chmodSync(path, 0o600);
console.log("Configuração local pronta em .env.local. Preencha EMAIL_USER e EMAIL_USER_TOKEN antes do cadastro.");
