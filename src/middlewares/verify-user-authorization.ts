import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";

import { AppError } from "@/utils/AppError";

export function verifyUserAuthorization(roles: UserRole[]) {
    return (request: Request, response: Response, next: NextFunction) => {
        if (!request.user) {
            throw new AppError("Não autorizado", 401)
        }

        if (!roles.includes(request.user.role)) {
            throw new AppError("Não autorizado", 403)
        }

        return next()
    }
}
