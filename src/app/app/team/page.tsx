import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocalActor } from "@/lib/local/session";
import { getDb } from "@/lib/local/db";
import { getAnalytics } from "@/lib/local/analytics";
import { listAgents } from "@/lib/local/tickets";

export const metadata: Metadata = { title: "Equipe" };
export default async function TeamPage() {
  const actor = await getLocalActor();
  const workspaceName = (getDb().prepare("select name from organizations where id=?").get(actor.organizationId) as { name: string } | undefined)?.name ?? "Workspace";
  if (actor.role === "agent" || actor.role === "customer") redirect("/app");
  const agents = listAgents(actor);
  const activity = getAnalytics(actor, 90).byAgent;
  return <><div className="page-heading"><div><div className="eyebrow">PESSOAS</div><h1>Equipe de suporte</h1><p className="muted">Carga de trabalho e contexto, sem ranking individual.</p></div></div><section className="panel"><div className="section-head"><h2>{agents.length} membros</h2><span className="muted">{workspaceName}</span></div>{agents.map((agent) => { const metrics = activity.find((item) => item.id === agent.id); return <div className="team-row" key={agent.id}><span className="avatar">{agent.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><div><strong>{agent.name}</strong><small>{agent.email}</small></div><span className="plain-pill">{agent.role}</span><div><strong>{metrics?.active ?? 0}</strong><small>ativos</small></div><div><strong>{metrics?.resolved ?? 0}</strong><small>resolvidos em 90d</small></div></div>; })}</section></>;
}
