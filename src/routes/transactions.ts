import { Router } from "express";
import { prisma } from "../prisma";
import {
  transactionGetSchema,
  transactionGetId,
  transactionPutBody,
  transactionPutId,
  postTransaction,
} from "../validacao";
import { autenticar, asyncHandler } from "../middleware";
import { AppError } from "../appError";

const router = Router();

router.post(
  "/",
  autenticar,
  asyncHandler(async (req, res) => {
    const resultado = postTransaction.safeParse(req.body);

    if (!resultado.success) {
      return res.status(400).json({ erro: resultado.error });
    }

    const { valor, date, categoryId, type } = resultado.data;
    const userId = (req as any).userId;

    const validacao = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (validacao?.userId !== userId) {
      throw new AppError(400, "Referência inválida");
    }
    const conect = await prisma.transaction.create({
      data: { userId, valor, date, categoryId, type },
    });

    return res.status(201).json(conect);
  }),
);

router.get(
  "/",
  autenticar,
  asyncHandler(async (req, res) => {
    const resultado = transactionGetSchema.safeParse(req.query);

    if (!resultado.success) {
      return res.status(400).json({ erro: resultado.error });
    }
    const userId = (req as any).userId;

    const conect = await prisma.transaction.findMany({
      where: { userId },
    });
    return res.status(200).json(conect);
  }),
);

router.get(
  "/:id",
  autenticar,
  asyncHandler(async (req, res) => {
    const resultado = transactionGetId.safeParse(req.params);

    if (!resultado.success) {
      return res.status(400).json({ erro: resultado.error });
    }

    const { id } = resultado.data;
    const idUsuario = (req as any).userId;

    const conect = await prisma.transaction.findUnique({
      where: { id },
    });

    if (conect?.userId !== idUsuario) {
      throw new AppError(404, "Transação não encontrada");
    }

    return res.status(200).json(conect);
  }),
);

router.put(
  "/:id",
  autenticar,
  asyncHandler(async (req, res) => {
    const resultado = transactionPutId.safeParse(req.params);
    const resultadoName = transactionPutBody.safeParse(req.body);

    if (!resultado.success || !resultadoName.success) {
      return res.status(400).json({ erro: "Valores invalidos" });
    }
    const { id } = resultado.data;
    const { valor, type, date, categoryId } = resultadoName.data;
    const idUsuario = (req as any).userId;

    const validacaoTransacao = await prisma.transaction.findUnique({
      where: { id },
    });

    if (validacaoTransacao?.userId !== idUsuario) {
      throw new AppError(404, "Transação não encontrada");
    }

    const validacaoCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (validacaoCategory?.userId !== idUsuario) {
      throw new AppError(400, "Referência inválida");
    }

    const conect = await prisma.transaction.update({
      where: { id },
      data: { valor, type, date, categoryId },
    });
    return res.status(200).json(conect);
  }),
);

router.delete(
  "/:id",
  autenticar,
  asyncHandler(async (req, res) => {
    const resultadoId = transactionPutId.safeParse(req.params);

    if (!resultadoId.success) {
      return res.status(400).json({ erro: "Valores invalidos" });
    }
    const { id } = resultadoId.data;
    const idUsuario = (req as any).userId;

    const transacao = await prisma.transaction.findUnique({
      where: { id },
    });

    if (transacao?.userId !== idUsuario) {
      throw new AppError(404, "Transação não encontrada");
    }

    const conect = await prisma.transaction.delete({
      where: { id },
    });
    return res.status(200).json(conect);
  }),
);

export default router;
