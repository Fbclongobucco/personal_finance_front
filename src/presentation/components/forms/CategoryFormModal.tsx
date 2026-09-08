"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Category } from "@/domain/entities/category";
import { Button } from "@/presentation/components/ui/Button";
import { Input, Select } from "@/presentation/components/ui/FormField";
import { Modal } from "@/presentation/components/ui/Modal";
import { useCreateCategory } from "@/presentation/hooks/use-categories";
import { extractErrorMessage } from "@/presentation/providers/auth-provider";
import { useToast } from "@/presentation/providers/toast-provider";
import { CategoryFormValues, categorySchema } from "@/presentation/lib/validation";

export function CategoryFormModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (category: Category) => void;
}) {
  const toast = useToast();
  const createCategory = useCreateCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", type: "EXPENSE" },
  });

  async function onSubmit(values: CategoryFormValues) {
    try {
      const category = await createCategory.mutateAsync(values);
      toast.success("Categoria criada com sucesso.");
      reset();
      onCreated?.(category);
      onClose();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova categoria">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Nome" required placeholder="Ex: Lazer, Salário..." {...register("name")} error={errors.name?.message} />
        <Select label="Tipo" required {...register("type")} error={errors.type?.message}>
          <option value="EXPENSE">Despesa</option>
          <option value="INCOME">Receita</option>
        </Select>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
