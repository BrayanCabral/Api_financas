import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function autenticar(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];


if (!token) {
  return res.status(401).json({ erro: "Token malformado" });
}

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as unknown as {
      userId: number;
    };
    (req as any).userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido" });
  }
}
