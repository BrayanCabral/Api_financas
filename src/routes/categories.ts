import { Router } from "express";
import { prisma } from "../prisma";
import { Prisma } from "../generated/prisma/client";
import {
  categorySchema,
  categoryGetSchema,
  categoriesGetId,
  categoriesPutName,
  categoriesPutId,
  categoriesDelId,
} from "../validacao";
import { autenticar } from "../middleware";

const router = Router();

router.get("/middleware", autenticar, async (req, res) => {
  return res.json({ message: "Chave Válida", userId: (req as any).userId });
});

router.post("/", autenticar, async (req, res) => {
  // 2. A VALIDAÇÃO — aplica o molde em cima do dado real que chegou nessa requisição
  const resultado = categorySchema.safeParse(req.body);

  // 3. Se não bateu com o molde, para aqui e responde erro (nem chega no Prisma)
  if (!resultado.success) {
    return res.status(400).json({ erro: resultado.error });
  }

  // 4. Se chegou até aqui, o dado é válido — pega ele já validado
  const { name } = resultado.data;
  const userId = (req as any).userId;
  try {
    const conect = await prisma.category.create({
      data: { name, userId },
    });

    return res.status(201).json(conect);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return res.status(400).json({ erro: "Usuário não encontrado" });
    }
    return res.status(500).json({ erro: "Erro ao criar categoria" });
  }
});

router.get("/", autenticar, async (req, res) => {
  const resultado = categoryGetSchema.safeParse(req.query);

  if (!resultado.success) {
    return res.status(400).json({ erro: resultado.error });
  }
  const userId = (req as any).userId;

  try {
    const conect = await prisma.category.findMany({
      where: { userId },
    });
    return res.status(200).json(conect);
  } catch {
    return res.status(500).json({ erro: "Erro ao buscar categorias" });
  }
});

router.get("/:id", autenticar, async (req, res) => {
  const resultado = categoriesGetId.safeParse(req.params);

  if (!resultado.success) {
    return res.status(400).json({ erro: resultado.error });
  }
  const { id } = resultado.data;
  const idUsuario = (req as any).userId;
  try {
    const conect = await prisma.category.findUnique({
      where: { id },
    });

    if (conect === null) {
      return res.status(404).json({ erro: "Categoria não encontrada" });
    }
    if (conect?.userId !== idUsuario) {
      return res.status(404).json({ erro: "Categoria não encontrada" });
    }
    return res.status(200).json(conect);
  } catch {
    return res.status(500).json({ erro: "Erro ao buscar ID" });
  }
});

router.put("/:id", autenticar, async (req, res) => {
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

  try {
    const categoria = await prisma.category.findUnique({
      where: { id },
    });

    if (categoria === null) {
      return res.status(404).json({ erro: "Categoria não encontrada" });
    }
    if (categoria.userId !== idUsuario) {
      return res.status(404).json({ erro: "Categoria não encontrada" });
    }

    const conect = await prisma.category.update({
      where: { id },
      data: { name },
    });

    return res.status(200).json(conect);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ erro: "Categoria não encontrada" });
    } else {
      return res.status(500).json({ erro: "Erro ao atualizar categoria" });
    }
  }
});

router.delete("/:id", autenticar, async (req, res) => {
  const resultadoId = categoriesDelId.safeParse(req.params);

  if (!resultadoId.success) {
    return res.status(400).json({ erro: resultadoId.error });
  }
  const id = (req as any).userId;

  try {
    const conect = await prisma.category.delete({
      where: { id },
    });
    return res.status(200).json(conect);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ erro: "ID não encontrado" });
    } else {
      return res.status(500).json({ erro: "Erro ao remover categoria" });
    }
  }
});

export default router;
