import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "../config";
import { AppError } from "../middlewares/errorHandler";
import { prisma } from "../prisma/client";

export type JwtPayload = {
  sub: string;
  nome: string;
  email: string;
};

function gerarToken(usuario: { id: string; nome: string; email: string }): string {
  const payload: JwtPayload = {
    sub: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
  };

  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, config.jwtSecret, options);
}

export class AuthController {
  async registrar(req: Request, res: Response, next: NextFunction) {
    try {
      const { nome, email, senha } = req.body;

      const usuarioExistente = await prisma.usuario.findUnique({
        where: { email },
      });

      if (usuarioExistente) {
        throw new AppError("E-mail ja cadastrado", 409);
      }

      const senhaHash = await bcrypt.hash(senha, 10);

      const usuario = await prisma.usuario.create({
        data: { nome, email, senha: senhaHash },
        select: { id: true, nome: true, email: true, criadoEm: true },
      });

      const token = gerarToken(usuario);

      res.status(201).json({ usuario, token });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, senha } = req.body;

      const usuario = await prisma.usuario.findUnique({
        where: { email },
      });

      if (!usuario) {
        throw new AppError("E-mail ou senha invalidos", 401);
      }

      const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

      if (!senhaCorreta) {
        throw new AppError("E-mail ou senha invalidos", 401);
      }

      const token = gerarToken(usuario);
      const { senha: _senha, ...usuarioSemSenha } = usuario;

      res.json({ usuario: usuarioSemSenha, token });
    } catch (error) {
      next(error);
    }
  }

  async perfil(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.usuario?.sub) {
        throw new AppError("Usuario nao autenticado", 401);
      }

      const usuario = await prisma.usuario.findUnique({
        where: { id: req.usuario.sub },
        select: { id: true, nome: true, email: true, criadoEm: true },
      });

      if (!usuario) {
        throw new AppError("Usuario nao encontrado", 404);
      }

      res.json(usuario);
    } catch (error) {
      next(error);
    }
  }
}
