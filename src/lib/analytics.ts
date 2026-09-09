import { Transaction } from "@/types";
import { endOfDayParam, parseServerDateTime, startOfDayParam } from "@/lib/formatters";

export interface PeriodSummary {
  income: number;
  expense: number;
  /** Receitas menos despesas do período (não é o saldo geral da conta). */
  balance: number;
  pending: Transaction[];
}

/** Totais de receitas/despesas de uma lista de transações já filtrada por período. */
export function summarize(transactions: Transaction[] | undefined): PeriodSummary {
  const items = transactions ?? [];
  const income = items.filter((t) => t.category.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
  const expense = items.filter((t) => t.category.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
  return { income, expense, balance: income - expense, pending: items.filter((t) => !t.paid) };
}

/** Identifica um mês de calendário sem depender de fuso: apenas ano + mês (0-11). */
export interface MonthRef {
  year: number;
  month: number;
}

export function currentMonth(): MonthRef {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export function shiftMonth({ year, month }: MonthRef, delta: number): MonthRef {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function monthKey({ year, month }: MonthRef): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function monthLabel({ year, month }: MonthRef): string {
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(year, month, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Filtros start/end (LocalDateTime naive em UTC) cobrindo o mês inteiro. */
export function monthFilters({ year, month }: MonthRef) {
  return {
    start: startOfDayParam(new Date(year, month, 1)),
    end: endOfDayParam(new Date(year, month + 1, 0)),
  };
}

/** Os `count` meses anteriores ao mês corrente, do mais recente para o mais antigo. */
export function previousMonths(count: number): MonthRef[] {
  const base = currentMonth();
  return Array.from({ length: count }, (_, index) => shiftMonth(base, -(index + 1)));
}

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
    const date = parseServerDateTime(transaction.createdAt) ?? new Date(0);
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
