export function plainRow<T extends object>(row: T): T { return { ...row }; }
export function plainRows<T extends object>(rows: T[]): T[] { return rows.map(plainRow); }
