import { Request, Response, NextFunction } from "express";
import { AppError } from "./appError";
import { Prisma } from "./generated/prisma/client";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ erro: err.message });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      return res.status(404).json({ erro: "Registro não encontrado" });
    }
    if (err.code === "P2003") {
      return res.status(400).json({ erro: "Referência inválida" });
    }
    if (err.code === "P2002") {
      return res
        .status(400)
        .json({ erro: "Já existe um registro com esse valor" });
    }
  }

  console.error(err);
  return res.status(500).json({ erro: "Erro interno" });
}
