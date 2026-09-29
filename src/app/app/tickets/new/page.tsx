import type { Metadata } from "next";
import Link from "next/link";
import { getLocalActor } from "@/lib/local/session";
import { listCustomers } from "@/lib/local/customers";
import { createTicketAction } from "@/features/tickets/actions";

export const metadata: Metadata = { title: "Novo ticket" };
export default async function NewTicketPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const actor = await getLocalActor();
  const customers = listCustomers(actor);
  const params = await searchParams;
  return <div style={{ maxWidth: 760 }}><div className="eyebrow">TICKETS / NOVO</div><h1 className="page-title">Abrir um ticket</h1><p className="muted">Registre a solicitação para manter a conversa e o histórico no mesmo lugar.</p>{params.error && <p className="form-error" role="alert">Preencha todos os campos com informações válidas.</p>}<form action={createTicketAction} className="panel form-panel"><label className="form-field">Assunto<input name="subject" className="text-input" minLength={5} maxLength={240} placeholder="Resumo claro do problema" required/></label><label className="form-field">Cliente<select name="customerId" className="text-input" required defaultValue=""><option value="" disabled>Selecione um cliente</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name} · {customer.company_name}</option>)}</select></label><label className="form-field">Prioridade<select name="priority" className="text-input" defaultValue="medium"><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="urgent">Urgente</option></select></label><label className="form-field">Descrição<textarea name="description" className="text-input" rows={8} minLength={15} maxLength={10000} placeholder="Descreva o contexto, o impacto e o que já foi tentado." required/></label><div className="form-actions"><Link href="/app/tickets" className="button-secondary">Cancelar</Link><button type="submit" className="button-primary">Criar ticket</button></div></form></div>;
}
