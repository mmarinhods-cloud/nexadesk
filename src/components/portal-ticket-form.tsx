"use client";

import { useState } from "react";
import { createTicketAction } from "@/features/tickets/actions";
import { ArticleDeflection, type ArticleResult } from "@/components/portal-search";

export function PortalTicketForm({ articles }: { articles: ArticleResult[] }) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  return <form action={createTicketAction} className="panel form-panel"><label className="form-field">Assunto<input name="subject" className="text-input" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Em poucas palavras, o que aconteceu?" minLength={5} maxLength={240} required/></label><label className="form-field">Categoria<select className="text-input" name="category" defaultValue="Account"><option>Account</option><option>Billing</option><option>Integrations</option><option>Troubleshooting</option><option>Getting Started</option></select></label><ArticleDeflection articles={articles} query={subject + " " + description}/><label className="form-field">Descrição<textarea name="description" className="text-input" rows={8} value={description} onChange={(event) => setDescription(event.target.value)} minLength={15} maxLength={10000} placeholder="Conte o que tentou e o resultado esperado." required/></label><p className="muted" style={{ fontSize: ".8rem" }}>Sua solicitação ficará visível apenas para você e a equipe de suporte.</p><div className="form-actions"><button type="submit" className="button-primary">Enviar solicitação</button></div></form>;
}
