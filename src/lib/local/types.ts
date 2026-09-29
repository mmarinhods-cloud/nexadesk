import type { MemberRole } from "@/lib/auth/permissions";

export type Actor = { id: string; name: string; role: MemberRole; organizationId: string; customerId?: string };
export type TicketStatus = "open" | "in_progress" | "waiting_customer" | "resolved" | "closed";
export type Priority = "low" | "medium" | "high" | "urgent";
export type Ticket = {
  id: string; organization_id: string; number: number; subject: string; description: string;
  status: TicketStatus; priority: Priority; channel: "portal" | "web";
  customer_id: string; company_id: string | null; assignee_id: string | null;
  sla_policy_id: string | null; sentiment: string; created_at: string; updated_at: string;
  first_response_at: string | null; resolved_at: string | null;
  customer_name: string; customer_email: string; company_name: string | null; assignee_name: string | null;
  tags: string;
};
export type Message = { id: string; ticket_id: string; author_id: string | null; author_name: string; visibility: "public" | "internal"; body: string; created_at: string };
export type TicketEvent = { id: string; ticket_id: string; kind: string; actor_name: string; old_value: string | null; new_value: string | null; created_at: string };
export type Customer = { id: string; organization_id: string; company_id: string | null; name: string; email: string; plan: string; satisfaction: number | null; company_name: string | null; ticket_count: number };
export type Company = { id: string; organization_id: string; name: string; plan: string; mrr_cents: number; health_score: number; account_status: string; customer_count: number; ticket_count: number };
export type Article = { id: string; organization_id: string; category: string; title: string; slug: string; body: string; status: "draft" | "published"; author: string; views: number; helpful_votes: number; created_at: string; updated_at: string };
export type Automation = { id: string; organization_id: string; name: string; trigger_kind: string; condition_field: string; condition_value: string; action_kind: string; action_value: string; enabled: number; created_at: string; run_count: number };
export type Notification = { id: string; organization_id: string; recipient_id: string; kind: string; body: string; ticket_id: string | null; read_at: string | null; created_at: string };
export type SlaPolicy = { id: string; organization_id: string; name: string; first_response_minutes: number; resolution_minutes: number };
export type Macro = { id: string; organization_id: string; command: string; title: string; body: string; status: TicketStatus | null; priority: Priority | null; tag: string | null };
export type Agent = { id: string; organization_id: string; name: string; email: string; role: MemberRole };
