import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { getLocalActor } from "@/lib/local/session";
import { listCompanies } from "@/lib/local/customers";

export const metadata: Metadata = { title: "Empresas" };
export default async function CompaniesPage() {
  const companies = listCompanies(await getLocalActor());
  return <><div className="page-heading"><div><div className="eyebrow">RELACIONAMENTO</div><h1>Empresas</h1><p className="muted">Contexto das contas atendidas.</p></div><Link href="/app/customers" className="button-secondary">Ver contatos</Link></div><div className="customer-grid">{companies.map((company) => <Link href={`/app/companies/${company.id}`} className="panel customer-card" key={company.id}><Building2 size={22} color="var(--info)"/><h2>{company.name}</h2><p>{company.plan} · {company.account_status}</p><div className="customer-card-bottom"><span>{company.customer_count} contatos</span><strong>{company.ticket_count} tickets</strong></div></Link>)}</div></>;
}
