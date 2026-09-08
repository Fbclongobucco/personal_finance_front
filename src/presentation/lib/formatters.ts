import { PaymentMethod } from "@/domain/entities/transaction";

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatDate(value: string | null | undefined): string {
  const date = parseServerDateTime(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  const date = parseServerDateTime(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * The backend stores naive LocalDateTime (no timezone) in the server's wall clock. The deployed
 * server runs UTC, so "2026-09-08T01:00:00" means 2026-09-08 01:00 UTC. Parsing it as UTC (appending
 * "Z") yields the correct local instant for display and month bucketing. Date-only values
 * ("2026-09-07", e.g. user.createdAt) are simple calendar dates and are parsed as local midnight.
 */
export function parseServerDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const hasOffset = /[zZ]|[+-]\d{2}:\d{2}$/.test(value);
  if (isDateOnly) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const normalized = hasOffset ? value : `${value}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Dinheiro",
  CREDIT_CARD: "Cartão de crédito",
  DEBIT_CARD: "Cartão de débito",
  INVOICE: "Boleto/Fatura",
  TICKET: "Vale/Ticket",
  PIX: "Pix",
};

/**
 * Backend LocalDateTime has no timezone — the deployed server keeps UTC wall clock, so the naive
 * string we send must be the UTC wall-clock representation of the desired instant. Otherwise a
 * transaction created after ~21:00 local lands "tomorrow" server-side and falls outside the month
 * window, leaving the dashboard's month summary at zero (verified: register at 21:13 -03 returns
 * createdAt 2026-09-08T00:13, i.e. server is exactly UTC).
 */
export function toServerDateTimeParam(date: Date): string {
  return date.toISOString().slice(0, 19);
}

export function startOfDayParam(date: Date): string {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return toServerDateTimeParam(start);
}

export function endOfDayParam(date: Date): string {
  const end = new Date(date);
  end.setHours(23, 59, 59, 0);
  return toServerDateTimeParam(end);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** yyyy-MM-dd, for <input type="date"> */
export function toDateInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
