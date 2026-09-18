import { z } from "zod";

const idNumerico = z.number().min(1, { message: "Valor invalido" });
const idNumericoCoagido = z.coerce
  .number()
  .min(1, { message: "Valor invalido" });
const valorMonetario = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, { message: "Use o formato 0.00" })
  .refine((v) => Number(v) > 0, { message: "Valor precisa ser positivo" });

// 1. O MOLDE — definido uma vez, fora da rota (não depende de nenhuma requisição específica)
export const categorySchema = z.object({
  name: z.string().min(3, { message: "Nome inválido" }),
  userId: idNumerico,
});

export const categoryGetSchema = z.object({
  userId: idNumericoCoagido,
});

export const categoriesGetId = z.object({
  id: idNumericoCoagido,
});

export const categoriesPutName = z.object({
  name: z.string().min(3, { message: "Valor invalido" }),
});

export const categoriesPutId = z.object({
  id: idNumericoCoagido,
});

export const categoriesDelId = z.object({
  id: idNumericoCoagido,
});

export const transactionGetSchema = z.object({
  userId: idNumericoCoagido,
});

export const transactionGetId = z.object({
  id: idNumericoCoagido,
});

export const transactionPutBody = z.object({
  valor: valorMonetario,
  type: z.enum(["INCOME", "EXPENSE"]),
  date: z.coerce.date(),
  categoryId: idNumerico,
});

export const transactionPutId = z.object({
  id: idNumericoCoagido,
});

export const postTransaction = z.object({
  userId: idNumerico,
  valor: valorMonetario,
  date: z.coerce.date(),
  categoryId: idNumerico,
  type: z.enum(["INCOME", "EXPENSE"]),
});

