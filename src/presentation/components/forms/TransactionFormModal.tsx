"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/presentation/components/ui/Button";
import { Input, Select } from "@/presentation/components/ui/FormField";
import { Modal } from "@/presentation/components/ui/Modal";
import { CategoryFormModal } from "@/presentation/components/forms/CategoryFormModal";
import { useCategories } from "@/presentation/hooks/use-categories";
import { useCreateTransaction } from "@/presentation/hooks/use-transactions";
import { extractErrorMessage, useAuth } from "@/presentation/providers/auth-provider";
import { useToast } from "@/presentation/providers/toast-provider";
import { PAYMENT_METHOD_LABELS } from "@/presentation/lib/formatters";
import { TransactionFormValues, transactionSchema } from "@/presentation/lib/validation";

const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABELS) as (keyof typeof PAYMENT_METHOD_LABELS)[];

export function TransactionFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { session } = useAuth();
  const toast = useToast();
  const { data: categories = [] } = useCategories();
  const createTransaction = useCreateTransaction();
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { description: "", categoryId: "", amount: 0, paymentMethod: "PIX", paid: false },
  });

  useEffect(() => {
    if (open) reset({ description: "", categoryId: "", amount: 0, paymentMethod: "PIX", paid: false });
  }, [open, reset]);

  // The just-created category only exists as a real <option> once the categories list has
  // refetched — setting the field before then leaves the <select> visually unselected.
  useEffect(() => {
    if (pendingCategoryId && categories.some((category) => category.id === pendingCategoryId)) {
      setValue("categoryId", pendingCategoryId, { shouldValidate: true });
      setPendingCategoryId(null);
    }
  }, [pendingCategoryId, categories, setValue]);

  const selectedCategory = categories.find((category) => category.id === watch("categoryId"));
  const isExpense = selectedCategory?.type === "EXPENSE";

  async function onSubmit(values: TransactionFormValues) {
    if (!session) return;
    try {
      await createTransaction.mutateAsync({
        description: values.description,
        categoryId: values.categoryId,
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        userId: session.user.id,
        paid: isExpense ? values.paid : true,
      });
      toast.success("Transação registrada com sucesso.");
      onClose();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova transação">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Descrição" required placeholder="Ex: Supermercado, Salário..." {...register("description")} error={errors.description?.message} />

        <Select
          label="Categoria"
          required
          labelAction={
            <button
              type="button"
              onClick={() => setCategoryModalOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Nova categoria
            </button>
          }
          {...register("categoryId")}
          error={errors.categoryId?.message}
        >
          <option value="">Selecione uma categoria</option>
          <optgroup label="Receitas">
            {categories
              .filter((category) => category.type === "INCOME")
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </optgroup>
          <optgroup label="Despesas">
            {categories
              .filter((category) => category.type === "EXPENSE")
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </optgroup>
        </Select>

        <Input
          label="Valor (R$)"
          required
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0,00"
          {...register("amount")}
          error={errors.amount?.message}
        />

        <Select label="Forma de pagamento" required {...register("paymentMethod")} error={errors.paymentMethod?.message}>
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {PAYMENT_METHOD_LABELS[method]}
            </option>
          ))}
        </Select>

        {isExpense && (
          <Controller
            control={control}
            name="paid"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500"
                />
                Já paguei esta despesa
              </label>
            )}
          />
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Salvar
          </Button>
        </div>
      </form>

      <CategoryFormModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onCreated={(category) => setPendingCategoryId(category.id)}
      />
    </Modal>
  );
}
