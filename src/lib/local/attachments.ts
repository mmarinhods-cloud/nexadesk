import { randomUUID } from "node:crypto";
import { chmod, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getDb } from "@/lib/local/db";
import { publishLocalEvent } from "@/lib/local/realtime";
import { getTicket } from "@/lib/local/tickets";
import type { Actor } from "@/lib/local/types";

export type Attachment = { id: string; ticket_id: string; author_id: string; visibility: "public" | "internal"; file_name: string; mime_type: string; size_bytes: number; storage_path: string; created_at: string };
const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf", "text/plain"]);
const storageRoot = process.env.NEXADESK_ATTACHMENT_DIR || join(process.cwd(), ".data", "attachments");

function matchesContentType(bytes: Buffer, type: string): boolean {
  if (type === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (type === "image/jpeg") return bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/webp") return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (type === "application/pdf") return bytes.toString("ascii", 0, 5) === "%PDF-";
  if (type === "text/plain") {
    if (bytes.includes(0)) return false;
    try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes).length > 0; }
    catch { return false; }
  }
  return false;
}

export function listAttachments(actor: Actor, ticketId: string): Attachment[] {
  if (!getTicket(actor, ticketId)) return [];
  const visibility = actor.role === "customer" ? "and visibility='public'" : "";
  const rows = getDb().prepare(`select id,ticket_id,author_id,visibility,file_name,mime_type,size_bytes,storage_path,created_at from attachments where organization_id=? and ticket_id=? ${visibility} order by created_at desc`).all(actor.organizationId, ticketId) as Attachment[];
  return rows.map((row) => ({ ...row }));
}

export async function saveAttachment(actor: Actor, ticketId: string, file: File, visibility: "public" | "internal") {
  if (!getTicket(actor, ticketId)) throw new Error("Ticket não encontrado.");
  if (actor.role === "customer" && visibility !== "public") throw new Error("Cliente não pode anexar arquivo interno.");
  if (!allowedTypes.has(file.type) || file.size < 1 || file.size > 10 * 1024 * 1024) throw new Error("Arquivo inválido. Use PNG, JPEG, WebP, PDF ou TXT de até 10 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length !== file.size || !matchesContentType(bytes, file.type)) throw new Error("O conteúdo do arquivo não corresponde ao formato informado.");
  const fileName = file.name.replace(/[\x00-\x1f\x7f/\\]/g, "_").trim().slice(0, 180);
  if (!fileName) throw new Error("Nome de arquivo inválido.");
  const id = randomUUID();
  const path = join(storageRoot, id);
  await mkdir(storageRoot, { recursive: true, mode: 0o700 });
  await chmod(storageRoot, 0o700);
  await writeFile(path, bytes, { flag: "wx", mode: 0o600 });
  try {
    getDb().prepare("insert into attachments values (?,?,?,?,?,?,?,?,?,?)").run(id, actor.organizationId, ticketId, actor.id, visibility, fileName, file.type, file.size, path, new Date().toISOString());
  } catch (error) {
    await unlink(path).catch(() => {});
    throw error;
  }
  publishLocalEvent(actor.organizationId, ticketId);
}

export async function loadAttachment(actor: Actor, id: string): Promise<{ attachment: Attachment; bytes: Buffer } | null> {
  const row = getDb().prepare("select * from attachments where id=? and organization_id=?").get(id, actor.organizationId) as Attachment | undefined;
  if (!row || !getTicket(actor, row.ticket_id) || actor.role === "customer" && row.visibility !== "public") return null;
  return { attachment: { ...row }, bytes: await readFile(row.storage_path) };
}
