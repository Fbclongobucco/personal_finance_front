import { Transaction } from "@/domain/entities/transaction";

export interface MonthlyPoint {
  key: string;
  label: string;
  income: number;
  expense: number;
}

/** Builds the last `monthsBack` calendar months (oldest first), summing income/expense per month. */
export function buildMonthlySeries(transactions: Transaction[], monthsBack = 6): MonthlyPoint[] {
  const now = new Date();
  const months: MonthlyPoint[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date).replace(".", "");
    months.push({ key, label, income: 0, expense: 0 });
  }

  const byKey = new Map(months.map((month) => [month.key, month]));
  for (const transaction of transactions) {
    const date = new Date(transaction.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = byKey.get(key);
    if (!bucket) continue;
    if (transaction.category.type === "INCOME") bucket.income += transaction.amount;
    else bucket.expense += transaction.amount;
  }

  return months;
}

export interface CategorySlice {
  name: string;
  value: number;
}

/** Groups EXPENSE transactions by category, sorted descending, folding anything past `maxSlices` into "Outros". */
export function buildCategoryBreakdown(transactions: Transaction[], maxSlices = 8): CategorySlice[] {
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.category.type !== "EXPENSE") continue;
    totals.set(transaction.category.name, (totals.get(transaction.category.name) ?? 0) + transaction.amount);
  }

  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  if (sorted.length <= maxSlices) return sorted;

  const head = sorted.slice(0, maxSlices - 1);
  const tailTotal = sorted.slice(maxSlices - 1).reduce((sum, slice) => sum + slice.value, 0);
  return [...head, { name: "Outros", value: tailTotal }];
}
