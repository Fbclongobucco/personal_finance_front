"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Category } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { useCreateCategory } from "@/hooks/use-categories";
import { extractErrorMessage } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { CategoryFormValues, categorySchema } from "@/lib/validation";

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
