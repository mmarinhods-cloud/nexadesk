import { getWorkspace } from "@/lib/auth/workspace";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getLocalActor } from "@/lib/local/session";
import { listTickets, listNotifications } from "@/lib/local/tickets";
import { listCustomers } from "@/lib/local/customers";
import { listArticles } from "@/lib/local/knowledge";

export const runtime = "nodejs";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const workspace = await getWorkspace();
  const actor = await getLocalActor();
  const searchIndex = [
    ...listTickets(actor).map((ticket) => ({ label: `#${ticket.number} · ${ticket.subject}`, type: "Ticket", href: `/app/tickets/${ticket.id}` })),
    ...listCustomers(actor).map((customer) => ({ label: customer.name, type: "Cliente", href: `/app/customers/${customer.id}` })),
    ...listArticles(actor).map((article) => ({ label: article.title, type: "Artigo", href: `/app/knowledge/${article.id}` })),
  ];
  return <WorkspaceShell workspace={workspace} searchIndex={searchIndex} notifications={listNotifications(actor)}>{children}</WorkspaceShell>;
}
