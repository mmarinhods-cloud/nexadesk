import "server-only";
import { z } from "zod";

const emailSchema = z.email().max(254);
const nameSchema = z.string().min(2).max(80);
const passwordSchema = z.string().min(8).max(128);

export function validEmail(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 254 || Buffer.byteLength(value, "utf8") > 512) return null;
  return emailSchema.safeParse(value.trim().toLowerCase()).data ?? null;
}

export function validName(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 80 || Buffer.byteLength(value, "utf8") > 320) return null;
  return nameSchema.safeParse(value.trim().replace(/\s+/g, " ")).data ?? null;
}

export function validPassword(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 128 || Buffer.byteLength(value, "utf8") > 512) return null;
  return passwordSchema.safeParse(value).data ?? null;
}

export function validWorkspaceName(value: unknown): string | null { return validName(value); }
export function validWorkspaceCode(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 50) return null;
  const code = value.trim().toLowerCase();
  return z.string().regex(/^[a-z0-9][a-z0-9-]{2,49}$/).safeParse(code).data ?? null;
}
