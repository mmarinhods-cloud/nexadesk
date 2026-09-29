import type { Metadata } from "next";
import Link from "next/link";
import { getLocalActor } from "@/lib/local/session";
import { getDb } from "@/lib/local/db";
import { logout } from "@/app/actions";
import { requestPrivacyAction, updateProfileAction } from "@/features/account/actions";

export const metadata: Metadata = { title: "Minha conta" };
export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const actor = await getLocalActor();
  const params = await searchParams;
  const row = getDb().prepare("select email,verified_at,created_at,privacy_ack_at from accounts where id=?").get(actor.id) as { email: string; verified_at: string; created_at: string; privacy_ack_at: string };
  const requests = getDb().prepare("select id,status,created_at from privacy_requests where account_id=? order by created_at desc").all(actor.id) as { id: string; status: string; created_at: string }[];
  return <main className="account-page"><Link href={actor.role === "customer" ? "/portal" : "/app"} className="back-link">← Voltar ao atendimento</Link><div className="page-heading"><div><div className="eyebrow">CONTA E PRIVACIDADE</div><h1>Minha conta</h1><p className="muted">Controle seus dados de acesso e solicitações de privacidade.</p></div></div>{params.notice && <p className="form-success" role="status">{params.notice === "saved" ? "Nome atualizado." : "Solicitação registrada. O responsável pelo workspace deve analisá-la."}</p>}{params.error && <p className="form-error" role="alert">Verifique as informações e tente novamente.</p>}<section className="panel form-panel"><h2>Dados da conta</h2><div className="account-meta"><span>E-mail</span><strong>{row.email}</strong><span>Papel</span><strong>{actor.role}</strong><span>Confirmado em</span><strong>{new Date(row.verified_at).toLocaleDateString("pt-BR")}</strong></div><form action={updateProfileAction}><label className="form-field">Nome<input className="text-input" name="name" defaultValue={actor.name} minLength={2} maxLength={80} required/></label><button className="button-primary" type="submit">Salvar nome</button></form></section><section className="panel form-panel"><h2>Seus dados pessoais</h2><p className="muted">Você pode obter uma cópia dos dados ligados à sua conta. O arquivo inclui seus tickets, mensagens e metadados de anexos, quando existirem.</p><a className="button-secondary" href="/api/account/export" download>Exportar meus dados em JSON</a><p className="muted">Para pedir eliminação dos dados, envie uma solicitação. Registros necessários para atender obrigações legais ou preservar o histórico do suporte podem exigir análise antes da exclusão.</p><form action={requestPrivacyAction}><input type="hidden" name="kind" value="deletion"/><button type="submit" className="button-secondary">Solicitar eliminação de dados</button></form>{requests.length > 0 && <p className="muted">Última solicitação: {requests[0].status === "pending" ? "pendente" : requests[0].status} · {new Date(requests[0].created_at).toLocaleDateString("pt-BR")}</p>}<Link href="/privacy">Ler aviso de privacidade</Link></section><form action={logout}><button type="submit" className="button-secondary">Sair da conta</button></form></main>;
}
