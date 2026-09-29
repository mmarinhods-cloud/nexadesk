import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/local";
import { getDb } from "@/lib/local/db";

export const runtime = "nodejs";
export async function GET() {
  const current = await readSession();
  if (!current) return new NextResponse("Não autorizado", { status: 401 });
  const account = current.account;
  const db = getDb();
  const tickets = db.prepare("select id,number,subject,description,status,priority,created_at,updated_at from tickets where organization_id=? and customer_id=? order by created_at").all(account.organization_id, account.id);
  const messages = account.role === "customer"
    ? db.prepare("select m.ticket_id,m.author_name,m.visibility,m.body,m.created_at from messages m join tickets t on t.id=m.ticket_id and t.organization_id=m.organization_id where m.organization_id=? and t.customer_id=? and m.visibility='public' order by m.created_at").all(account.organization_id, account.id)
    : db.prepare("select ticket_id,author_name,visibility,body,created_at from messages where organization_id=? and author_id=? order by created_at").all(account.organization_id, account.id);
  const attachments = account.role === "customer"
    ? db.prepare("select a.ticket_id,a.file_name,a.mime_type,a.size_bytes,a.created_at from attachments a join tickets t on t.id=a.ticket_id and t.organization_id=a.organization_id where a.organization_id=? and t.customer_id=? and a.visibility='public' order by a.created_at").all(account.organization_id, account.id)
    : db.prepare("select ticket_id,file_name,mime_type,size_bytes,created_at from attachments where organization_id=? and author_id=? order by created_at").all(account.organization_id, account.id);
  const payload = { account: { name: account.name, email: account.email, role: account.role, status: account.status, verified_at: account.verified_at }, tickets, messages, attachments };
  return new NextResponse(JSON.stringify(payload, null, 2), { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": "attachment; filename=nexadesk-meus-dados.json", "cache-control": "private, no-store", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer" } });
}
