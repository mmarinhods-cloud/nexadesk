"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/app/actions";
import { Activity, BarChart3, Bell, BookOpen, ChevronLeft, ChevronRight, Columns3, Inbox, Layers3, LayoutDashboard, Menu, Plus, Search, Settings2, SunMoon, Ticket, Users, Workflow, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Workspace } from "@/lib/auth/workspace";
import type { Notification } from "@/lib/local/types";
import { LiveRefresh } from "@/components/live-refresh";
import { markNotificationsAction } from "@/features/tickets/actions";

const navigation: { label: string; href: string; icon: LucideIcon; restricted?: "manager" | "supervisor" }[] = [
  { label: "Visão geral", href: "/app", icon: LayoutDashboard },
  { label: "Inbox", href: "/app/inbox", icon: Inbox },
  { label: "Tickets", href: "/app/tickets", icon: Ticket },
  { label: "Kanban", href: "/app/kanban", icon: Columns3 },
  { label: "Clientes", href: "/app/customers", icon: Users },
  { label: "Base de conhecimento", href: "/app/knowledge", icon: BookOpen },
  { label: "Automações", href: "/app/automations", icon: Workflow, restricted: "supervisor" },
  { label: "Análises", href: "/app/analytics", icon: BarChart3, restricted: "supervisor" },
  { label: "Equipe", href: "/app/team", icon: Activity, restricted: "supervisor" },
  { label: "Configurações", href: "/app/settings", icon: Settings2, restricted: "manager" },
];

function ThemeButton() {
  useEffect(() => {
    const saved = localStorage.getItem("nexadesk-theme");
    if (saved === "light" || saved === "dark") {
      document.documentElement.dataset.theme = saved;
    }
  }, []);
  function cycle() {
    const current = localStorage.getItem("nexadesk-theme") || "system";
    const next = current === "system" ? "dark" : current === "dark" ? "light" : "system";
    if (next === "system") { delete document.documentElement.dataset.theme; localStorage.removeItem("nexadesk-theme"); }
    else { document.documentElement.dataset.theme = next; localStorage.setItem("nexadesk-theme", next); }
  }
  return <button className="icon-button" onClick={cycle} aria-label="Alternar tema entre sistema, escuro e claro" title="Alternar tema" type="button"><SunMoon size={17}/></button>;
}

type SearchItem = { label: string; type: string; href: string };

export function WorkspaceShell({ workspace, searchIndex, notifications, children }: { workspace: Workspace; searchIndex: SearchItem[]; notifications: Notification[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const activeRole = workspace.role;
  const initials = workspace.userName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  const canSeeSettings = activeRole === "owner" || activeRole === "admin";
  const canSeeOperations = canSeeSettings || activeRole === "supervisor";
  const unread = notifications.filter((item) => !item.read_at).length;
  const results = search.trim() ? searchIndex.filter((item) => item.label.toLowerCase().includes(search.toLowerCase())).slice(0, 8) : [];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen((open) => !open); }
      if (event.key === "Escape") { setCommandOpen(false); setNotificationsOpen(false); setMobileMenuOpen(false); }
      if ((event.target as HTMLElement)?.closest("input,textarea,[contenteditable=true],select")) return;
      if (event.key.toLowerCase() === "c" && !event.metaKey && !event.ctrlKey) router.push("/app/tickets/new");
    }
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); };
  }, [router]);

  return <div className={`app-shell ${collapsed ? "is-collapsed" : ""} ${mobileMenuOpen ? "mobile-menu-open" : ""}`}>
    <LiveRefresh/>{mobileMenuOpen && <button type="button" className="mobile-menu-backdrop" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)}/>}
    <aside className="sidebar" aria-label="Navegação principal">
      <div className="side-top"><span className="brand-mark"><Layers3 size={17}/></span>{(!collapsed || mobileMenuOpen) && <span className="brand-word">nexadesk</span>}</div>
      <nav className="side-nav"><div className="eyebrow side-nav-label">{collapsed && !mobileMenuOpen ? "" : "WORKSPACE"}</div>{navigation.map(({ label, href, icon: Icon }) => {
        const active = href === "/app" ? pathname === "/app" : pathname.startsWith(href);
        const restricted = navigation.find((item) => item.href === href)?.restricted;
        if (restricted === "manager" && !canSeeSettings || restricted === "supervisor" && !canSeeOperations) return null;
        return <Link key={label} href={href} className={`nav-link ${active ? "active" : ""}`} aria-current={active ? "page" : undefined} title={collapsed && !mobileMenuOpen ? label : undefined} onClick={() => setMobileMenuOpen(false)}><Icon size={17} aria-hidden="true"/>{(!collapsed || mobileMenuOpen) && label}</Link>;
      })}<Link href="/account" className="nav-link mobile-account-link" onClick={() => setMobileMenuOpen(false)}>Minha conta</Link></nav>
      <div className="side-bottom"><button className="nav-link" style={{ width: "100%", border: 0, color: "var(--muted)", background: "transparent", textAlign: "left" }} onClick={() => setCollapsed(!collapsed)} type="button" aria-label={collapsed ? "Expandir navegação" : "Recolher navegação"}>{collapsed ? <ChevronRight size={17}/> : <ChevronLeft size={17}/>} {!collapsed && "Recolher menu"}</button></div>
    </aside>
    <div style={{ minWidth: 0 }}>
      <header className="topbar"><div className="topbar-identity"><button className="icon-button mobile-menu-toggle" type="button" onClick={() => setMobileMenuOpen((open) => !open)} aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={mobileMenuOpen}><Menu size={19}/></button><span className="workspace-name">{workspace.name}</span><span className="muted topbar-separator">/</span><span className="muted topbar-location">{pathname === "/app" ? "Visão geral" : pathname.split("/").filter(Boolean).slice(-1)[0]}</span></div><div className="topbar-right"><button className="icon-button" type="button" onClick={() => setCommandOpen(true)} aria-label="Buscar e abrir comando" title="Buscar · Ctrl K"><Search size={17}/></button><div style={{ position: "relative" }}><button className="icon-button" type="button" onClick={() => setNotificationsOpen((value) => !value)} aria-label={`Notificações, ${unread} não lidas`} title="Notificações"><Bell size={17}/>{unread > 0 && <span className="notification-dot"/>}</button>{notificationsOpen && <div className="notification-popover panel"><div className="section-head"><strong>Notificações</strong><button className="text-button" onClick={() => { void markNotificationsAction(); setNotificationsOpen(false); }} type="button">Marcar todas como lidas</button></div><div style={{ maxHeight: 320, overflowY: "auto" }}>{notifications.length ? notifications.map((item) => <Link href={item.ticket_id ? `/app/tickets/${item.ticket_id}` : "/app"} key={item.id} className={`notification-item ${item.read_at ? "" : "unread"}`} onClick={() => { void markNotificationsAction(item.id); setNotificationsOpen(false); }}>{item.body}<small>{new Date(item.created_at).toLocaleString("pt-BR")}</small></Link>) : <p className="muted" style={{ padding: 20 }}>Sem notificações por enquanto.</p>}</div></div>}</div><Link href="/account" className="topbar-account" title="Minha conta">Minha conta</Link><form action={logout}><button type="submit" className="text-button">Sair</button></form><ThemeButton/><span className="avatar" title={workspace.userName}>{initials}</span></div></header>
      <main className="main-content">{children}</main>
      <nav className="mobile-nav" aria-label="Navegação móvel"><Link href="/app" className={pathname === "/app" ? "active" : ""}><LayoutDashboard size={19}/>Visão geral</Link><Link href="/app/tickets" className={pathname.startsWith("/app/tickets") ? "active" : ""}><Ticket size={19}/>Tickets</Link><Link href="/app/inbox" className={pathname === "/app/inbox" ? "active" : ""}><Inbox size={19}/>Inbox</Link><button type="button" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}><Menu size={19}/>Menu</button></nav>
    </div>
    {commandOpen && <div className="dialog-backdrop" onMouseDown={() => setCommandOpen(false)}><div className="command-dialog panel" role="dialog" aria-modal="true" aria-label="Busca global" onMouseDown={(event) => event.stopPropagation()}><div className="command-input-row"><Search size={20}/><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Busque tickets, clientes, artigos ou navegue..." aria-label="Buscar"/><button className="icon-button" onClick={() => setCommandOpen(false)} aria-label="Fechar" type="button"><X size={18}/></button></div><div className="command-results"><Link href="/app/tickets/new" onClick={() => setCommandOpen(false)}><Plus size={16}/>Criar ticket <small>Atalho C</small></Link>{results.map((item) => <Link key={item.href} href={item.href} onClick={() => setCommandOpen(false)}><Search size={15}/><span>{item.label}</span><small>{item.type}</small></Link>)}{!search && navigation.filter((item) => !item.restricted || item.restricted === "manager" && canSeeSettings || item.restricted === "supervisor" && canSeeOperations).slice(0, 6).map((item) => <Link key={item.href} href={item.href} onClick={() => setCommandOpen(false)}><item.icon size={16}/>{item.label}<small>Tela</small></Link>)}{search && results.length === 0 && <p className="muted" style={{ padding: 16 }}>Nenhum resultado encontrado.</p>}</div><div className="command-foot">Ctrl/⌘ K abre · Esc fecha</div></div></div>}
  </div>;
}
