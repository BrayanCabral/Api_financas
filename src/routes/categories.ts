import { Router } from "express";
import { prisma } from "../prisma";
import {
  categorySchema,
  categoryGetSchema,
  categoriesGetId,
  categoriesPutName,
  categoriesPutId,
  categoriesDelId,
} from "../validacao";
import { autenticar, asyncHandler } from "../middleware";
import { AppError } from "../appError";

const router = Router();

router.post(
  "/",
  autenticar,
  asyncHandler(async (req, res) => {
    // 2. A VALIDAÇÃO — aplica o molde em cima do dado real que chegou nessa requisição
    const resultado = categorySchema.safeParse(req.body);

    // 3. Se não bateu com o molde, para aqui e responde erro (nem chega no Prisma)
    if (!resultado.success) {
      return res.status(400).json({ erro: resultado.error });
    }

    // 4. Se chegou até aqui, o dado é válido — pega ele já validado
    const { name } = resultado.data;
    const userId = (req as any).userId;
    const conect = await prisma.category.create({
      data: { name, userId },
    });

    return res.status(201).json(conect);
  }),
);

router.get(
  "/",
  autenticar,
  asyncHandler(async (req, res) => {
    const resultado = categoryGetSchema.safeParse(req.query);

    if (!resultado.success) {
      return res.status(400).json({ erro: resultado.error });
    }
    const userId = (req as any).userId;

    const conect = await prisma.category.findMany({
      where: { userId },
    });

    return res.status(200).json(conect);
  }),
);

router.get(
  "/:id",
  autenticar,
  asyncHandler(async (req, res) => {
    const resultado = categoriesGetId.safeParse(req.params);

    if (!resultado.success) {
      return res.status(400).json({ erro: resultado.error });
    }
    const { id } = resultado.data;
    const idUsuario = (req as any).userId;

    const conect = await prisma.category.findUnique({
      where: { id },
    });

    if (conect?.userId !== idUsuario) {
      throw new AppError(404, "Categoria não encontrada");
    }
    return res.status(200).json(conect);
  }),
);

router.put(
  "/:id",
  autenticar,
  asyncHandler(async (req, res) => {
    const resultado = categoriesPutName.safeParse(req.body);
    const resultadoId = categoriesPutId.safeParse(req.params);
    if (!resultado.success) {
      return res.status(400).json({ erro: resultado.error });
    }
    if (!resultadoId.success) {
      return res.status(400).json({ erro: resultadoId.error });
    }
    const { name } = resultado.data;
    const { id } = resultadoId.data;
    const idUsuario = (req as any).userId;

    const categoria = await prisma.category.findUnique({
      where: { id },
    });

    if (categoria?.userId !== idUsuario) {
      throw new AppError(404, "Categoria não encontrada");
    }

    const conect = await prisma.category.update({
      where: { id },
      data: { name },
    });

    return res.status(200).json(conect);
  }),
);

router.delete(
  "/:id",
  autenticar,
  asyncHandler(async (req, res) => {
    const resultadoId = categoriesDelId.safeParse(req.params);

    if (!resultadoId.success) {
      return res.status(400).json({ erro: resultadoId.error });
    }
    const { id } = resultadoId.data;
    const idUsuario = (req as any).userId;

    const categoria = await prisma.category.findUnique({
      where: { id },
    });

    if (categoria?.userId !== idUsuario) {
      throw new AppError(404, "Categoria não encontrada");
    }

    const conect = await prisma.category.delete({
      where: { id },
    });
    return res.status(200).json(conect);
  }),
);

export default router;
