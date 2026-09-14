import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import { UserRole } from "@prisma/client";

import { authConfig } from "@/configs/auth";
import { AppError } from "@/utils/AppError";

interface TokenPayload {
    role: UserRole
    sub: string
}

export function ensureAuthenticated(
    request: Request,
    response: Response,
    next: NextFunction,
) {
    const authHeader = request.headers.authorization

    if (!authHeader) {
        throw new AppError("Token não informado", 401)
    }

    const [, token] = authHeader.split(" ")

    try {
        const { role, sub } = verify(token, authConfig.jwt.secret) as TokenPayload

        request.user = { id: sub, role }

        return next()
    } catch {
        throw new AppError("Toke inválido", 401)
    }
}
