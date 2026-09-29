import type { Metadata } from "next";
import Link from "next/link";
import { getLocalActor } from "@/lib/local/session";
import { getSla, listTickets } from "@/lib/local/tickets";
import { TicketTable } from "@/features/tickets/components/ticket-table";

export const metadata: Metadata = { title: "Inbox" };
export const dynamic = "force-dynamic";
export default async function InboxPage() {
  const actor = await getLocalActor();
  const tickets = listTickets(actor).filter((ticket) => !["resolved", "closed"].includes(ticket.status));
  return <><div className="page-heading"><div><div className="eyebrow">CAIXA DE ENTRADA</div><h1>Conversas ativas</h1><p className="muted">Solicitações abertas, em andamento e aguardando retorno.</p></div><Link href="/app/tickets/new" className="button-primary">Novo ticket</Link></div><section className="panel"><TicketTable tickets={tickets} slaLabels={Object.fromEntries(tickets.map((ticket) => [ticket.id, getSla(ticket)]))}/></section></>;
}
