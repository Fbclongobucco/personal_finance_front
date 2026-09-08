import { Transaction, TransactionFilters, TransactionInput } from "../entities/transaction";

export interface TransactionRepository {
  list(userId: string, filters?: TransactionFilters): Promise<Transaction[]>;
  create(input: TransactionInput): Promise<Transaction>;
  delete(id: string): Promise<void>;
  settle(id: string): Promise<Transaction>;
}
