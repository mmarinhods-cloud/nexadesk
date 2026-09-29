import Link from "next/link";
import { redirect } from "next/navigation";
import { Layers3 } from "lucide-react";
import { getLocalActor } from "@/lib/local/session";
import { getDb } from "@/lib/local/db";
import { LiveRefresh } from "@/components/live-refresh";
import { logout } from "@/app/actions";

export const runtime = "nodejs";
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const actor = await getLocalActor();
  if (actor.role !== "customer") redirect("/app");
  const organization = getDb().prepare("select name from organizations where id=?").get(actor.organizationId) as { name: string } | undefined;
  return <div className="portal-shell"><LiveRefresh/><header className="portal-header"><Link href="/portal" className="portal-brand"><span className="brand-mark"><Layers3 size={17}/></span><span className="brand-word">nexadesk</span><span className="portal-label">Central de ajuda</span></Link><nav aria-label="Navegação do portal"><Link href="/portal/articles">Artigos</Link><Link href="/portal/tickets">Minhas solicitações</Link><Link href="/portal/new-ticket" className="button-primary">Abrir solicitação</Link></nav></header><div className="portal-userbar"><span>Olá, <strong>{actor.name}</strong></span><div className="portal-user-actions"><Link href="/account">Minha conta</Link><form action={logout}><button type="submit">Sair</button></form></div></div><main className="portal-main">{children}</main><footer className="portal-footer">{organization?.name ?? "Workspace"} · Central de suporte NexaDesk</footer></div>;
}
