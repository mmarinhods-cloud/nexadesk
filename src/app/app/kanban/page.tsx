import type { Metadata } from "next";
import { getLocalActor } from "@/lib/local/session";
import { listTickets } from "@/lib/local/tickets";
import { KanbanBoard } from "@/features/tickets/components/kanban-board";

export const metadata: Metadata = { title: "Kanban" };
export const dynamic = "force-dynamic";
export default async function KanbanPage() {
  const actor = await getLocalActor();
  const tickets = listTickets(actor).filter((ticket) => ticket.status !== "closed");
  return <><div className="page-heading"><div><div className="eyebrow">OPERAÇÃO / KANBAN</div><h1>Fluxo de tickets</h1><p className="muted">Uma visão por etapa, sincronizada com a fila.</p></div></div><KanbanBoard initialTickets={tickets}/></>;
}
