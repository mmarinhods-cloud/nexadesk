import { getDb } from "@/lib/local/db";
import { assertStaff } from "@/lib/local/session";
import type { Actor } from "@/lib/local/types";

type AnalyticsTicket = {
  status: string;
  assignee_id: string | null;
  created_at: string;
  first_response_at: string | null;
  resolved_at: string | null;
  first_response_minutes: number | null;
  resolution_minutes: number | null;
};

export function getAnalytics(actor: Actor, days: number) {
  assertStaff(actor);
  const now = Date.now();
  const start = new Date(now - days * 86_400_000).toISOString();
  const db = getDb();
  const tickets = db.prepare(`select t.status,t.assignee_id,t.created_at,t.first_response_at,t.resolved_at,
    sp.first_response_minutes,sp.resolution_minutes from tickets t
    left join sla_policies sp on sp.id=t.sla_policy_id and sp.organization_id=t.organization_id
    where t.organization_id=? and t.created_at>=?`).all(actor.organizationId, start) as AnalyticsTicket[];
  const agents = db.prepare("select id,name from agents where organization_id=? order by name").all(actor.organizationId) as { id: string; name: string }[];
  const byAgentMap = new Map(agents.map((agent) => [agent.id, { ...agent, active: 0, resolved: 0 }]));
  const daily = new Map<string, number>();
  let open = 0;
  let resolved = 0;
  let responded = 0;
  let firstResponseTotal = 0;
  let resolutionTotal = 0;
  let slaSafe = 0;

  for (const ticket of tickets) {
    const done = ticket.status === "resolved" || ticket.status === "closed";
    if (!done) open++;
    if (ticket.resolved_at) {
      resolved++;
      resolutionTotal += (Date.parse(ticket.resolved_at) - Date.parse(ticket.created_at)) / 60_000;
    }
    if (ticket.first_response_at) {
      responded++;
      firstResponseTotal += (Date.parse(ticket.first_response_at) - Date.parse(ticket.created_at)) / 60_000;
    }
    const allowedMinutes = ticket.first_response_at ? ticket.resolution_minutes : ticket.first_response_minutes;
    if (done || allowedMinutes === null || Date.parse(ticket.created_at) + allowedMinutes * 60_000 >= now) slaSafe++;
    daily.set(ticket.created_at.slice(0, 10), (daily.get(ticket.created_at.slice(0, 10)) ?? 0) + 1);
    if (ticket.assignee_id) {
      const agent = byAgentMap.get(ticket.assignee_id);
      if (agent) agent[done ? "resolved" : "active"]++;
    }
  }

  const tagCounts = db.prepare(`select tags.name,count(*) as total from ticket_tags tt
    join tags on tags.id=tt.tag_id join tickets t on t.id=tt.ticket_id
    where t.organization_id=? and t.created_at>=? group by tags.name`).all(actor.organizationId, start) as { name: string; total: number }[];
  const tags = new Map(tagCounts.map((row) => [row.name, Number(row.total)]));
  const feedback = db.prepare("select avg(rating) average,count(*) count from feedback where organization_id=? and created_at>=?").get(actor.organizationId, start) as { average: number | null; count: number };
  const displayedDays = Math.min(days, 30);
  const dayCounts = Array.from({ length: displayedDays }, (_, index) => {
    const date = new Date(now - (displayedDays - index - 1) * 86_400_000).toISOString().slice(0, 10);
    return { date: date.slice(5), tickets: daily.get(date) ?? 0 };
  });
  const byCategory = ["billing", "api", "authentication", "integration", "account", "bug", "how-to"].map((name) => ({ name, count: tags.get(name) ?? 0 }));
  return {
    total: tickets.length,
    open,
    resolved,
    firstResponseMinutes: responded ? Math.round(firstResponseTotal / responded) : 0,
    resolutionMinutes: resolved ? Math.round(resolutionTotal / resolved) : 0,
    slaCompliance: tickets.length ? Math.round(slaSafe / tickets.length * 100) : 100,
    csat: feedback.average ?? 0,
    feedbackCount: Number(feedback.count),
    dayCounts,
    byCategory,
    byAgent: [...byAgentMap.values()],
  };
}
