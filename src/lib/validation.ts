import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

const phoneField = z
  .string()
  .min(1, "Informe o telefone")
  .refine((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length === 10 || digits.length === 11;
  }, "Telefone inválido (informe DDD + número)");

export const registerSchema = z
  .object({
    name: z.string().min(2, "Informe seu nome completo"),
    email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
    phone: phoneField,
    password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a senha"),
    initialBalance: z.coerce.number({ message: "Informe um valor" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const profileSchema = z.object({
  name: z.string().min(2, "Informe seu nome completo"),
  phone: phoneField,
});
export type ProfileFormValues = z.infer<typeof profileSchema>;

export const categorySchema = z.object({
  name: z.string().min(2, "Informe um nome para a categoria"),
  type: z.enum(["INCOME", "EXPENSE"]),
});
export type CategoryFormValues = z.infer<typeof categorySchema>;

export const transactionSchema = z.object({
  description: z.string().min(1, "Informe uma descrição"),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  amount: z.coerce.number({ message: "Informe um valor" }).positive("O valor deve ser maior que zero"),
  paymentMethod: z.enum(["CASH", "CREDIT_CARD", "DEBIT_CARD", "INVOICE", "TICKET", "PIX"]),
  paid: z.boolean(),
  date: z.string().min(1, "Informe a data"),
});
export type TransactionFormValues = z.infer<typeof transactionSchema>;
