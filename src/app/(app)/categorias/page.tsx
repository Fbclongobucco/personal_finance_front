"use client";

import { useState } from "react";
import { Plus, Tags, Trash2 } from "lucide-react";

import { CategoryType } from "@/domain/entities/category";
import { CategoryFormModal } from "@/presentation/components/forms/CategoryFormModal";
import { Badge } from "@/presentation/components/ui/Badge";
import { Button } from "@/presentation/components/ui/Button";
import { Card } from "@/presentation/components/ui/Card";
import { ConfirmDialog } from "@/presentation/components/ui/ConfirmDialog";
import { EmptyState } from "@/presentation/components/ui/EmptyState";
import { PageHeader } from "@/presentation/components/ui/PageHeader";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { useCategories, useDeleteCategory } from "@/presentation/hooks/use-categories";
import { cn } from "@/presentation/lib/cn";
import { extractErrorMessage } from "@/presentation/providers/auth-provider";
import { useToast } from "@/presentation/providers/toast-provider";

export default function CategoriesPage() {
  const toast = useToast();
  const [tab, setTab] = useState<CategoryType>("EXPENSE");
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data: categories, isLoading } = useCategories(tab);
  const deleteCategory = useDeleteCategory();

  async function confirmDelete() {
    if (!categoryToDelete) return;
    try {
      await deleteCategory.mutateAsync(categoryToDelete.id);
      toast.success("Categoria excluída.");
      setCategoryToDelete(null);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <div>
      <PageHeader
        title="Categorias"
        description="Categorias que você usa para classificar suas receitas e despesas."
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova categoria
          </Button>
        }
      />

      <div className="mb-4 inline-flex rounded-lg border border-ink-100 bg-white p-1">
        {(["EXPENSE", "INCOME"] as CategoryType[]).map((type) => (
          <button
            key={type}
            onClick={() => setTab(type)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              tab === type ? "bg-brand-700 text-white" : "text-ink-600 hover:bg-ink-50"
            )}
          >
            {type === "EXPENSE" ? "Despesas" : "Receitas"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner label="Carregando categorias…" />
      ) : !categories || categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Nenhuma categoria cadastrada"
          description="Crie a primeira categoria deste tipo."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink-900">{category.name}</p>
                <Badge tone={category.type === "INCOME" ? "money" : "brand"} className="mt-1">
                  {category.type === "INCOME" ? "Receita" : "Despesa"}
                </Badge>
              </div>
              <button
                onClick={() => setCategoryToDelete({ id: category.id, name: category.name })}
                className="rounded-md p-2 text-ink-400 hover:bg-ink-50 hover:text-brand-700"
                title="Excluir categoria"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      <CategoryFormModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <ConfirmDialog
        open={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={confirmDelete}
        title="Excluir categoria"
        description={`Tem certeza que deseja excluir "${categoryToDelete?.name}"? Isso não é possível se houver transações usando esta categoria.`}
        confirmLabel="Excluir"
        danger
        isLoading={deleteCategory.isPending}
      />
    </div>
  );
}
