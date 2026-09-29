"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DndContext, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { changeTicketAction } from "@/features/tickets/actions";
import type { Ticket, TicketStatus } from "@/lib/local/types";

const columns: { id: TicketStatus; label: string }[] = [
  { id: "open", label: "Aberto" }, { id: "in_progress", label: "Em andamento" },
  { id: "waiting_customer", label: "Aguardando cliente" }, { id: "resolved", label: "Resolvido" },
];

function Card({ ticket, onStatus }: { ticket: Ticket; onStatus: (id: string, status: TicketStatus) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: ticket.id });
  return <article ref={setNodeRef} className="kanban-card" style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? .45 : 1, zIndex: isDragging ? 2 : 1 }}><div className="kanban-card-top"><span className="muted">#{ticket.number}</span><button type="button" className="drag-handle" ref={undefined} {...attributes} {...listeners} aria-label={`Mover ticket ${ticket.number} arrastando`}>⋮⋮</button></div><Link href={`/app/tickets/${ticket.id}`} className="table-title">{ticket.subject}</Link><div className="ticket-meta">{ticket.customer_name} · {ticket.company_name}</div><div className="kanban-card-bottom"><span className={`plain-pill priority-${ticket.priority}`}>{ticket.priority}</span><select aria-label={`Mover ticket ${ticket.number} para status`} value={ticket.status} onChange={(event) => onStatus(ticket.id, event.target.value as TicketStatus)}><option value="open">Aberto</option><option value="in_progress">Em andamento</option><option value="waiting_customer">Aguardando</option><option value="resolved">Resolvido</option></select></div></article>;
}

function Column({ status, label, tickets, onStatus }: { status: TicketStatus; label: string; tickets: Ticket[]; onStatus: (id: string, status: TicketStatus) => void }) {
  const { isOver, setNodeRef } = useDroppable({ id: status });
  return <section ref={setNodeRef} className={`kanban-column ${isOver ? "over" : ""}`}><header><strong>{label}</strong><span>{tickets.length}</span></header><div className="kanban-stack">{tickets.length ? tickets.map((ticket) => <Card key={ticket.id} ticket={ticket} onStatus={onStatus}/>) : <div className="kanban-empty">Nenhum ticket aqui</div>}</div></section>;
}

export function KanbanBoard({ initialTickets }: { initialTickets: Ticket[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));
  function move(id: string, status: TicketStatus) {
    const before = tickets;
    setTickets((current) => current.map((ticket) => ticket.id === id ? { ...ticket, status } : ticket));
    setError("");
    startTransition(async () => {
      try { await changeTicketAction(id, "status", status); router.refresh(); }
      catch { setTickets(before); setError("Não foi possível mover o ticket. Tente novamente."); }
    });
  }
  function onDragEnd(event: DragEndEvent) {
    if (!event.over) return;
    const status = columns.find((column) => column.id === event.over!.id)?.id;
    if (status) move(String(event.active.id), status);
  }
  return <><p className="muted" style={{ fontSize: ".84rem" }}>Arraste entre colunas ou use o seletor de status em cada cartão. Alterações são salvas automaticamente.</p>{error && <div className="form-error" role="alert">{error}</div>}{pending && <div className="muted" role="status">Salvando alteração…</div>}<DndContext sensors={sensors} onDragEnd={onDragEnd}><div className="kanban-grid">{columns.map((column) => <Column key={column.id} status={column.id} label={column.label} tickets={tickets.filter((ticket) => ticket.status === column.id)} onStatus={move}/>)}</div></DndContext></>;
}
