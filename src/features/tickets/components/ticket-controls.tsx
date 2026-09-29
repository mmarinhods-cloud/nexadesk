"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeTicketAction, addTagAction, aiAssistAction } from "@/features/tickets/actions";
import type { Agent, Priority, TicketStatus } from "@/lib/local/types";

export function PropertySelect({ ticketId, field, value, options, label }: { ticketId: string; field: "status" | "priority" | "assignee_id"; value: string; options: { value: string; label: string }[]; label: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();
  return <label className="property-field"><span>{label}</span><select className="role-select" value={value} disabled={pending} onChange={(event) => startTransition(async () => { try { await changeTicketAction(ticketId, field, event.target.value); setError(""); router.refresh(); } catch { setError("Não foi possível salvar."); } })}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{error && <small role="alert" className="form-error">{error}</small>}</label>;
}

export const statusOptions: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Aberto" }, { value: "in_progress", label: "Em andamento" },
  { value: "waiting_customer", label: "Aguardando cliente" }, { value: "resolved", label: "Resolvido" }, { value: "closed", label: "Fechado" },
];
export const priorityOptions: { value: Priority; label: string }[] = [
  { value: "low", label: "Baixa" }, { value: "medium", label: "Média" }, { value: "high", label: "Alta" }, { value: "urgent", label: "Urgente" },
];
export function agentOptions(agents: Agent[]) { return [{ value: "unassigned", label: "Sem responsável" }, ...agents.map((agent) => ({ value: agent.id, label: agent.name }))]; }

export function SuggestedTags({ ticketId, tags }: { ticketId: string; tags: string[] }) {
  const [remaining, setRemaining] = useState(tags);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  if (!remaining.length) return null;
  return <div className="suggestions"><div className="eyebrow">SUGESTÕES DE TAG · IA MOCK</div>{remaining.map((tag) => <div key={tag} className="suggestion-row"><span>{tag}</span><button type="button" disabled={pending} className="text-button" onClick={() => startTransition(async () => { await addTagAction(ticketId, tag); setRemaining((all) => all.filter((item) => item !== tag)); router.refresh(); })}>Aceitar</button><button type="button" className="text-button muted" onClick={() => setRemaining((all) => all.filter((item) => item !== tag))}>Dispensar</button></div>)}</div>;
}

export function SummaryButton({ ticketId }: { ticketId: string }) {
  const [summary, setSummary] = useState("");
  const [pending, startTransition] = useTransition();
  return <div><button type="button" className="button-secondary" disabled={pending} onClick={() => startTransition(async () => { const result = await aiAssistAction(ticketId, "summary"); setSummary(result.content); })}>{pending ? "Resumindo…" : "Resumir conversa"}</button>{summary && <div className="ai-summary"><strong>Resumo gerado · revise</strong><ul>{summary.split("\n").map((line) => <li key={line}>{line}</li>)}</ul></div>}</div>;
}
