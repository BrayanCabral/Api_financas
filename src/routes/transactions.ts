import { Router } from "express";
import { prisma } from "../prisma";
import { Prisma } from "../generated/prisma/client";
import {
  transactionGetSchema,
  transactionGetId,
  transactionPutBody,
  transactionPutId,
  postTransaction,
} from "../validacao";

const router = Router();

router.post("/", async (req, res) => {
  const resultado = postTransaction.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({ erro: resultado.error });
  }

  const { userId, valor, date, categoryId, type } = resultado.data;

  try {
    const conect = await prisma.transaction.create({
      data: { userId, valor, date, categoryId, type },
    });
    return res.status(201).json(conect);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      const mensagem =
        (error.meta as any)?.driverAdapterError?.cause?.originalMessage ?? "";

      if (mensagem.includes("categoryId")) {
        return res.status(400).json({ erro: "Categoria não encontrada" });
      }
      if (mensagem.includes("userId")) {
        return res.status(400).json({ erro: "Usuário não encontrado" });
      }
      return res.status(400).json({ erro: "Referência inválida" });
    }

    return res.status(500).json({ erro: "Erro ao criar transação" });
  }
});

router.get("/", async (req, res) => {
  const resultado = transactionGetSchema.safeParse(req.query);

  if (!resultado.success) {
    return res.status(400).json({ erro: resultado.error });
  }
  const { userId } = resultado.data;

  try {
    const conect = await prisma.transaction.findMany({
      where: { userId },
    });
    return res.status(200).json(conect);
  } catch {
    return res.status(500).json({ erro: "Erro ao buscar Transações" });
  }
});

router.get("/:id", async (req, res) => {
  const resultado = transactionGetId.safeParse(req.params);

  if (!resultado.success) {
    return res.status(400).json({ erro: resultado.error });
  }

  const { id } = resultado.data;

  try {
    const conect = await prisma.transaction.findUnique({
      where: { id },
    });
    if (conect == null) {
      return res.status(404).json({ erro: "Erro ao buscar Id de transação" });
    }
    return res.status(200).json(conect);
  } catch {
    return res.status(500).json({ erro: "Erro ao buscar transações " });
  }
});

router.put("/:id", async (req, res) => {
  const resultado = transactionPutId.safeParse(req.params);
  const resultadoName = transactionPutBody.safeParse(req.body);

  if (!resultado.success || !resultadoName.success) {
    return res.status(400).json({ erro: "Valores invalidos" });
  }
  const { id } = resultado.data;
  const { valor, type, date, categoryId } = resultadoName.data;

  try {
    const conect = await prisma.transaction.update({
      where: { id },
      data: { valor, type, date, categoryId },
    });
    return res.status(200).json(conect);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ erro: "Transação não encontrada" });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return res.status(400).json({ erro: "Categoria não encontrada" });
    }
    return res.status(500).json({ erro: "Erro ao atualizar transação" });
  }
});

router.delete("/:id", async (req, res) => {
  const resultadoId = transactionPutId.safeParse(req.params);

  if (!resultadoId.success) {
    return res.status(400).json({ erro: "Valores invalidos" });
  }
  const { id } = resultadoId.data;

  try {
    const conect = await prisma.transaction.delete({
      where: { id },
    });
    return res.status(200).json(conect);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ erro: "Transação não encontrada" });
    }
    return res.status(500).json({ erro: "Erro ao remover transação" });
  }
});

export default router;
