import { Category, CategoryInput, CategoryType } from "@/domain/entities/category";
import { container } from "@/infrastructure/container";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useCategories(type?: CategoryType) {
  return useQuery<Category[]>({
    queryKey: ["categories", type],
    queryFn: () => container.categories.list(type),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryInput) => container.categories.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => container.categories.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}
