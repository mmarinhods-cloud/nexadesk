import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocalActor } from "@/lib/local/session";
import { listAgents } from "@/lib/local/tickets";
import { listAutomationRuns, listAutomations } from "@/lib/local/automations";
import { toggleAutomationAction } from "@/features/automations/actions";
import { AutomationBuilder } from "@/features/automations/components/automation-builder";

export const metadata: Metadata = { title: "Automações" };
export const dynamic = "force-dynamic";
export default async function AutomationsPage() {
  const actor = await getLocalActor();
  if (actor.role === "agent" || actor.role === "customer") redirect("/app");
  const rules = listAutomations(actor);
  const runs = listAutomationRuns(actor);
  const canManage = actor.role === "owner" || actor.role === "admin";
  return <><div className="page-heading"><div><div className="eyebrow">OPERAÇÃO / REGRAS</div><h1>Automações</h1><p className="muted">Regras simples, execução registrada e controle humano.</p></div></div><div className="section-grid"><div><section className="panel"><div className="section-head"><h2>Regras</h2><span className="muted">{rules.filter((rule) => rule.enabled).length} ativas</span></div>{rules.map((rule) => <div className="automation-row" key={rule.id}><div><strong>{rule.name}</strong><div className="automation-logic"><span>WHEN {rule.trigger_kind.replaceAll("_", " ")}</span><span>IF {rule.condition_field} = {rule.condition_value}</span><span>THEN {rule.action_kind} → {rule.action_value}</span></div><small className="muted">{rule.run_count} execuções</small></div>{canManage && <form action={toggleAutomationAction.bind(null, rule.id)}><button type="submit" className={`toggle-button ${rule.enabled ? "on" : ""}`} aria-label={`${rule.enabled ? "Desativar" : "Ativar"} ${rule.name}`} aria-pressed={Boolean(rule.enabled)}><span/></button></form>}</div>)}</section><section className="panel" style={{ marginTop: 16 }}><div className="section-head"><h2>Histórico de execução</h2></div>{runs.length ? runs.map((run) => <div className="record-row" key={run.id}><strong>{run.automation_name}</strong><span className="muted">{run.details}</span><small className="muted">{new Date(run.created_at).toLocaleString("pt-BR")}</small></div>) : <div className="empty-state">As regras ainda não foram executadas. Crie ou altere um ticket para ativá-las.</div>}</section></div>{canManage && <AutomationBuilder agents={listAgents(actor)}/>}</div></>;
}
