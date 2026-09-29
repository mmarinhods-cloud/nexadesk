import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getLocalActor } from "@/lib/local/session";
import { listArticles } from "@/lib/local/knowledge";
import { PortalTicketForm } from "@/components/portal-ticket-form";

export const metadata: Metadata = { title: "Abrir solicitação" };
export default async function NewPortalTicketPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const articles = listArticles(await getLocalActor());
  const { error } = await searchParams;
  return <div style={{ maxWidth: 780 }}><Link href="/portal" className="back-link"><ArrowLeft size={14}/> Central de ajuda</Link><div className="eyebrow" style={{ marginTop: 24 }}>NOVO PEDIDO</div><h1 className="page-title">Conte como podemos ajudar</h1><p className="muted">Antes de enviar, mostraremos artigos que podem resolver sua dúvida imediatamente.</p>{error && <p role="alert" className="form-error">Preencha assunto e descrição para continuar.</p>}<PortalTicketForm articles={articles}/></div>;
}
