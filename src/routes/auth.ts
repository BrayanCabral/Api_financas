import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { registerSchema } from "../validacao";
import { Prisma } from "../generated/prisma/client";
import { User } from "../generated/prisma/client";
import { loginSchema } from "../validacao";

const router = Router();

function getCleanUser(user: User): Omit<User, "password"> {
  const { password, ...UserSemSenha } = user;
  return UserSemSenha;
}

router.post("/register", async (req, res) => {
  const resultado = registerSchema.safeParse(req.body);
  const saltRounds = 10;
  if (!resultado.success) {
    return res.status(400).json({ erro: "Valores ausentes" });
  }
  const { email } = resultado.data;
  const { password } = resultado.data;

  const senhacriptografada = await bcrypt.hash(password, saltRounds);

  try {
    const conect = await prisma.user.create({
      data: { email, password: senhacriptografada },
    });

    return res.status(201).json(getCleanUser(conect));
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res
        .status(400)
        .json({ erro: "Erro ao criar usuário email já cadastrado" });
    }
    return res
      .status(500)
      .json({ erro: "Não foi possível processar a solicitação" });
  }
});

router.post("/login", async (req, res) => {
  const resultado = loginSchema.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({ erro: "Valores ausentes" });
  }

  const { email } = resultado.data;
  const { password } = resultado.data;

  try {
    const conect = await prisma.user.findUnique({
      where: { email },
    });
    if (conect === null) {
      return res.status(401).json({ erro: "Credenciais invalidas" });
    }
    const senha = await bcrypt.compare(password, conect.password);

    if (!senha) {
      return res.status(401).json({ erro: "Credenciais invalidas" });
    }
    return res.status(200).json("login efetuado");
  } catch {
    return res
      .status(500)
      .json({ erro: "Não foi possível processar a solicitação" });
  }
});
export default router;
