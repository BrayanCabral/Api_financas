import express from "express";
import { prisma } from "./prisma";
import { z } from "zod";
import { Prisma } from "./generated/prisma/client";

const app = express();
const port = 4001;

app.use(express.json());

// 1. O MOLDE — definido uma vez, fora da rota (não depende de nenhuma requisição específica)
const categorySchema = z.object({
  name: z.string().min(3, { message: "Nome inválido" }),
  userId: z.int().min(1, { message: "Valor inválido" }),
});

const categoryGetSchema = z.object({
  userId: z.coerce.number({ message: "Valor invalido" }),
});

const categoriesGetId = z.object({
  id: z.coerce.number({ message: "valor Invalido" }),
});

const categoriesPutName = z.object({
  name: z.string().min(3, { message: "Valor invalido" }),
});

const categoriesPutId = z.object({
  id: z.coerce.number({ message: "Valor invalido" }),
});

app.post("/categories", async (req, res) => {
  // 2. A VALIDAÇÃO — aplica o molde em cima do dado real que chegou nessa requisição
  const resultado = categorySchema.safeParse(req.body);

  // 3. Se não bateu com o molde, para aqui e responde erro (nem chega no Prisma)
  if (!resultado.success) {
    return res.status(400).json({ erro: resultado.error });
  }

  // 4. Se chegou até aqui, o dado é válido — pega ele já validado
  const { name, userId } = resultado.data;

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
    return res.status(500).json({ erro: "Erro ao buscar usuário" });
  }
});

app.get("/categories", async (req, res) => {
  const resultado = categoryGetSchema.safeParse(req.query);

  if (!resultado.success) {
    return res.status(400).json({ erro: resultado.error });
  }
  const { userId } = resultado.data;

  try {
    const conect = await prisma.category.findMany({
      where: { userId },
    });
    return res.status(200).json(conect);
  } catch {
    return res.status(500).json({ erro: "Erro ao buscar categorias" });
  }
});

app.get("/categories/:id", async (req, res) => {
  const resultado = categoriesGetId.safeParse(req.params);

  if (!resultado.success) {
    return res.status(400).json({ erro: resultado.error });
  }
  const { id } = resultado.data;

  try {
    const conect = await prisma.category.findUnique({
      where: { id },
    });

    if (conect === null) {
      return res.status(404).json({ erro: "Categoria não encontrada" });
    }
    return res.status(200).json(conect);
  } catch {
    return res.status(500).json({ erro: "Erro ao buscar ID" });
  }
});

app.put("/categories/:id", async (req, res) => {
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

  try {
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
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
