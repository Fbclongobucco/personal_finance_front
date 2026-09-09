/** Every entity returned by / sent to the backend, in one place. */

/* ---------------------------------------------------------------- user ---- */

export type UserRole = "ADMIN" | "USER";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  balance: number;
  /** Balance after pending (unpaid) expenses are subtracted — returned by the backend alongside `balance`. */
  settledBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession extends TokenPair {
  user: User;
}

/** Campos editáveis do perfil. E-mail fica de fora: é o subject do JWT, trocá-lo invalidaria a sessão. */
export interface UserUpdateInput {
  name: string;
  phone: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  initialBalance: number;
}

/* ------------------------------------------------------------ category ---- */

export type CategoryType = "INCOME" | "EXPENSE";

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  /** Id of the user who owns this category — every category belongs to exactly one user. */
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInput {
  name: string;
  type: CategoryType;
}

/* --------------------------------------------------------- transaction ---- */

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
