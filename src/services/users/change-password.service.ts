import { compare, hash } from "bcryptjs";

import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";

interface ChangePasswordRequest {
    userId: string
    currentPassword: string
    newPassword: string
}

export class ChangePasswordService {
    async execute({ userId, currentPassword, newPassword }: ChangePasswordRequest) {
        const user = await prisma.user.findUnique({ where: { id: userId } })

        if (!user) {
            throw new AppError("Usuário não encontrado", 404)
        }

        const passwordMatched = await compare(currentPassword, user.password)

        if (!passwordMatched) {
            throw new AppError("Senha atual incorreta", 401)
        }

        const samePassword = await compare(newPassword, user.password)

        if (samePassword) {
            throw new AppError("A nova senha deve ser diferente da atual", 400)
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                password: await hash(newPassword, 8),
                mustChangePassword: false,
            },
        })
    }
}