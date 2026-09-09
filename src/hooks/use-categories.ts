import { Category, CategoryInput, CategoryType } from "@/types";
import { categoriesService } from "@/services/categories";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useCategories(type?: CategoryType) {
  return useQuery<Category[]>({
    queryKey: ["categories", type],
    queryFn: () => categoriesService.list(type),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryInput) => categoriesService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}
