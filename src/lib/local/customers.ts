import { getDb } from "@/lib/local/db";
import { assertStaff } from "@/lib/local/session";
import { plainRow, plainRows } from "@/lib/local/serialize";
import type { Actor, Company, Customer } from "@/lib/local/types";

const customerQuery = `select c.*,co.name company_name,(select count(*) from tickets t where t.customer_id=c.id and t.organization_id=c.organization_id) ticket_count from customers c left join companies co on co.id=c.company_id`;
const companyQuery = `select co.*,(select count(*) from customers c where c.company_id=co.id) customer_count,(select count(*) from tickets t where t.company_id=co.id) ticket_count from companies co`;

export function listCustomers(actor: Actor, query = ""): Customer[] {
  assertStaff(actor);
  return plainRows(getDb().prepare(`${customerQuery} where c.organization_id=? and (lower(c.name) like ? or lower(c.email) like ? or lower(co.name) like ?) order by c.name`).all(actor.organizationId, `%${query.toLowerCase()}%`, `%${query.toLowerCase()}%`, `%${query.toLowerCase()}%`) as unknown as Customer[]);
}

export function listCompanyCustomers(actor: Actor, companyId: string): Customer[] {
  assertStaff(actor);
  return plainRows(getDb().prepare(`${customerQuery} where c.organization_id=? and c.company_id=? order by c.name`).all(actor.organizationId, companyId) as unknown as Customer[]);
}

export function getCustomer(actor: Actor, id: string): Customer | null {
  assertStaff(actor);
  const row = getDb().prepare(`${customerQuery} where c.organization_id=? and c.id=?`).get(actor.organizationId, id) as Customer | undefined;
  if (!row) return null;
  const rating = getDb().prepare("select avg(rating) as satisfaction from feedback where organization_id=? and customer_id=?").get(actor.organizationId, id) as { satisfaction: number | null };
  return plainRow({ ...row, satisfaction: rating.satisfaction });
}

export function listCompanies(actor: Actor): Company[] {
  assertStaff(actor);
  return plainRows(getDb().prepare(`${companyQuery} where co.organization_id=? order by co.name`).all(actor.organizationId) as unknown as Company[]);
}

export function getCompany(actor: Actor, id: string): Company | null {
  assertStaff(actor);
  const row = getDb().prepare(`${companyQuery} where co.organization_id=? and co.id=?`).get(actor.organizationId, id) as Company | undefined;
  return row ? plainRow(row) : null;
}
