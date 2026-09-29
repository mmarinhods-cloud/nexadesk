import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocalActor } from "@/lib/local/session";
import { getAnalytics } from "@/lib/local/analytics";
import { AnalyticsCharts } from "@/features/analytics/components/charts";

export const metadata: Metadata = { title: "Análises" };
export const dynamic = "force-dynamic";
export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const actor = await getLocalActor();
  if (actor.role === "agent" || actor.role === "customer") redirect("/app");
  const params = await searchParams;
  const days = params.days === "30" ? 30 : params.days === "90" ? 90 : 7;
  const data = getAnalytics(actor, days);
  return <><div className="page-heading"><div><div className="eyebrow">INTELIGÊNCIA OPERACIONAL</div><h1>Análises</h1><p className="muted">Métricas derivadas dos tickets e avaliações do workspace local.</p></div><div className="saved-views">{[7,30,90].map((value) => <Link href={`/app/analytics?days=${value}`} className={`view-chip ${days === value ? "selected" : ""}`} key={value}>{value} dias</Link>)}</div></div><div className="analytics-metrics"><div className="panel metric"><span className="metric-label">Tickets recebidos</span><strong className="metric-number">{data.total}</strong><span className="metric-foot">Período selecionado</span></div><div className="panel metric"><span className="metric-label">Primeira resposta</span><strong className="metric-number">{data.firstResponseMinutes}<small> min</small></strong><span className="metric-foot">Média dos respondidos</span></div><div className="panel metric"><span className="metric-label">Resolução</span><strong className="metric-number">{data.resolutionMinutes}<small> min</small></strong><span className="metric-foot">Média dos resolvidos</span></div><div className="panel metric"><span className="metric-label">SLA sem violação atual</span><strong className="metric-number">{data.slaCompliance}<small>%</small></strong><span className="metric-foot">Snapshot local</span></div><div className="panel metric"><span className="metric-label">CSAT</span><strong className="metric-number">{data.feedbackCount ? data.csat.toFixed(1) : "—"}</strong><span className="metric-foot">{data.feedbackCount} avaliação(ões)</span></div></div><AnalyticsCharts days={data.dayCounts} categories={data.byCategory}/><section className="panel" style={{ marginTop: 16 }}><div className="section-head"><h2>Distribuição por agente</h2></div>{data.byAgent.map((agent) => <div className="record-row" key={agent.id}><strong>{agent.name}</strong><span className="muted">{agent.active} ativos</span><span className="muted">{agent.resolved} resolvidos</span></div>)}</section></>;
}
