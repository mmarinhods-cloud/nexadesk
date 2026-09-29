"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMessageAction } from "@/features/tickets/actions";
import { submitFeedbackAction } from "@/features/portal/actions";

export function PortalReply({ ticketId, resolved }: { ticketId: string; resolved: boolean }) {
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(0);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  function send() {
    startTransition(async () => { try { await sendMessageAction(ticketId, body, "public"); setBody(""); setError(""); router.refresh(); } catch { setError("Não foi possível enviar. Tente novamente."); } });
  }
  return <div className="portal-reply"><div className="panel form-panel"><label className="form-field">Responder à equipe<textarea className="text-input" rows={5} value={body} onChange={(event) => setBody(event.target.value)} minLength={1} placeholder="Escreva sua resposta"/></label>{error && <p role="alert" className="form-error">{error}</p>}<button type="button" className="button-primary" disabled={pending || !body.trim()} onClick={send}>Enviar resposta</button></div>{resolved && <div className="panel form-panel" style={{ marginTop: 18 }}><strong>Como foi o atendimento?</strong><p className="muted">Sua avaliação ajuda a melhorar o suporte.</p><div className="rating-row">{[1,2,3,4,5].map((value) => <button key={value} type="button" aria-label={`${value} estrelas`} aria-pressed={rating === value} className={rating >= value ? "selected" : ""} onClick={() => setRating(value)}>★</button>)}</div><button className="button-secondary" type="button" disabled={!rating || pending} onClick={() => startTransition(async () => { await submitFeedbackAction(ticketId, rating, ""); router.refresh(); })}>Salvar avaliação</button></div>}</div>;
}
