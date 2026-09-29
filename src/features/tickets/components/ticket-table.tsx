"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { bulkStatusAction } from "@/features/tickets/actions";
import type { Ticket } from "@/lib/local/types";

const statusNames: Record<string, string> = { open: "Aberto", in_progress: "Em andamento", waiting_customer: "Aguardando", resolved: "Resolvido", closed: "Fechado" };
const priorityNames: Record<string, string> = { low: "Baixa", medium: "Média", high: "Alta", urgent: "Urgente" };

export function TicketTable({ tickets, slaLabels }: { tickets: Ticket[]; slaLabels: Record<string, { label: string; state: string }> }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const allSelected = tickets.length > 0 && tickets.every((ticket) => selected.includes(ticket.id));

  function bulk(status: string) {
    startTransition(async () => { await bulkStatusAction(selected, status); setSelected([]); router.refresh(); });
  }

  return <div className="table-scroll"><div className="table-toolbar"><span className="muted">{tickets.length} ticket{tickets.length === 1 ? "" : "s"} na fila</span>{selected.length > 0 && <div className="bulk-actions"><strong>{selected.length} selecionado(s)</strong><select className="role-select" aria-label="Alterar status em massa" disabled={pending} defaultValue="" onChange={(event) => { if (event.target.value) bulk(event.target.value); }}><option value="">Alterar status…</option><option value="in_progress">Em andamento</option><option value="waiting_customer">Aguardando cliente</option><option value="resolved">Resolvido</option></select></div>}</div><table className="data-table"><thead><tr><th><input type="checkbox" aria-label="Selecionar todos" checked={allSelected} onChange={() => setSelected(allSelected ? [] : tickets.map((ticket) => ticket.id))}/></th><th>ID</th><th>Assunto</th><th>Cliente</th><th>Prioridade</th><th>Status</th><th>Responsável</th><th>Tags</th><th>SLA</th><th>Atualizado</th></tr></thead><tbody>{tickets.map((ticket) => <tr key={ticket.id}><td><input type="checkbox" aria-label={`Selecionar ticket ${ticket.number}`} checked={selected.includes(ticket.id)} onChange={() => setSelected((current) => current.includes(ticket.id) ? current.filter((id) => id !== ticket.id) : [...current, ticket.id])}/></td><td className="muted">#{ticket.number}</td><td><Link href={`/app/tickets/${ticket.id}`} className="table-title">{ticket.subject}</Link><small>{ticket.company_name}</small></td><td>{ticket.customer_name}</td><td><span className={`plain-pill priority-${ticket.priority}`}>{priorityNames[ticket.priority]}</span></td><td><span className={`plain-pill status-${ticket.status}`}>{statusNames[ticket.status]}</span></td><td>{ticket.assignee_name ?? <span className="muted">Sem responsável</span>}</td><td className="muted">{ticket.tags || "—"}</td><td><span className={`plain-pill sla-${slaLabels[ticket.id]?.state}`}>{slaLabels[ticket.id]?.label ?? "—"}</span></td><td className="muted">{new Date(ticket.updated_at).toLocaleDateString("pt-BR")}</td></tr>)}</tbody></table>{tickets.length === 0 && <div className="empty-state"><strong>Nenhum ticket nesta fila</strong><p>Novas conversas aparecerão aqui quando os clientes entrarem em contato.</p><Link href="/app/tickets/new" className="button-secondary">Criar ticket</Link></div>}</div>;
}
