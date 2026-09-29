import { getOptionalActor } from "@/lib/local/session";
import { readSession } from "@/lib/auth/local";
import { getDb } from "@/lib/local/db";
import { subscribeLocalEvents } from "@/lib/local/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const actor = await getOptionalActor();
  if (!actor) return new Response("Não autorizado", { status: 401 });
  const session = await readSession();
  if (!session) return new Response("Não autorizado", { status: 401 });
  const encoder = new TextEncoder();
  let stop = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(": connected\n\n"));
      stop = subscribeLocalEvents(actor.organizationId, (payload) => {
        const active = getDb().prepare("select 1 from sessions s join accounts a on a.id=s.account_id where s.id=? and s.revoked_at is null and s.expires_at>? and a.status='active'").get(session.sessionId, new Date().toISOString());
        if (!active) { stop(); try { controller.close(); } catch { /* already closed */ } return; }
        const event = JSON.parse(payload) as { ticketId?: string };
        if (actor.role === "customer" && event.ticketId) {
          const owned = getDb().prepare("select 1 from tickets where id=? and organization_id=? and customer_id=?").get(event.ticketId, actor.organizationId, actor.customerId ?? "");
          if (!owned) return;
        }
        try { controller.enqueue(encoder.encode(`data: ${payload}\n\n`)); } catch { /* disconnected */ }
      });
      request.signal.addEventListener("abort", () => { stop(); try { controller.close(); } catch { /* already closed */ } }, { once: true });
    },
    cancel() { stop(); },
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream", "cache-control": "no-cache, no-transform", connection: "keep-alive" } });
}
