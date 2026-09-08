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
