import { Category, CategoryInput, CategoryType } from "../entities/category";

export interface CategoryRepository {
  list(type?: CategoryType): Promise<Category[]>;
  create(input: CategoryInput): Promise<Category>;
  delete(id: string): Promise<void>;
}
