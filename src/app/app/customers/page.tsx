import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Building2, Search } from "lucide-react";
import { getLocalActor } from "@/lib/local/session";
import { listCompanies, listCustomers } from "@/lib/local/customers";

export const metadata: Metadata = { title: "Clientes" };
export const dynamic = "force-dynamic";
export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const actor = await getLocalActor();
  const { q = "" } = await searchParams;
  const customers = listCustomers(actor, q);
  const companies = listCompanies(actor);
  return <><div className="page-heading"><div><div className="eyebrow">RELACIONAMENTO</div><h1>Clientes</h1><p className="muted">Pessoas, empresas e histórico de atendimento.</p></div><Link href="/app/companies" className="button-secondary"><Building2 size={16}/>Ver empresas</Link></div><form className="filter-bar panel" action="/app/customers"><Search size={17} className="muted"/><input className="text-input" name="q" defaultValue={q} placeholder="Buscar nome, e-mail ou empresa" aria-label="Buscar clientes"/><button type="submit" className="button-secondary">Buscar</button></form><div className="customer-grid">{customers.map((customer) => <Link href={`/app/customers/${customer.id}`} className="panel customer-card" key={customer.id}><div className="customer-card-top"><span className="avatar">{customer.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><ArrowUpRight size={17} className="muted"/></div><h2>{customer.name}</h2><p>{customer.email}</p><div className="customer-card-bottom"><span>{customer.company_name}</span><strong>{customer.ticket_count} tickets</strong></div></Link>)}</div>{customers.length === 0 && <div className="empty-state panel">Nenhum cliente corresponde à busca.</div>}<div className="eyebrow" style={{ marginTop: 35, marginBottom: 12 }}>EMPRESAS · {companies.length}</div><div className="company-strip">{companies.map((company) => <Link href={`/app/companies/${company.id}`} className="panel company-mini" key={company.id}><Building2 size={17}/><strong>{company.name}</strong><span className="muted">{company.plan}</span></Link>)}</div></>;
}
