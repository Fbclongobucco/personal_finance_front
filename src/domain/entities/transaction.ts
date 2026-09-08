import { Category, CategoryType } from "./category";

export type PaymentMethod = "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "INVOICE" | "TICKET" | "PIX";

export interface Transaction {
  id: string;
  description: string;
  category: Category;
  amount: number;
  userId: string;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  paid: boolean;
}

export interface TransactionInput {
  description: string;
  categoryId: string;
  amount: number;
  userId: string;
  paymentMethod: PaymentMethod;
  paid?: boolean;
  date?: string;
}

export interface TransactionFilters {
  start?: string;
  end?: string;
  type?: CategoryType;
}
