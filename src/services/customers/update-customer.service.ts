import { hash } from "bcryptjs";
import { UserRole } from "@prisma/client";

import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";
import { userSelect } from "@/utils/user-select";

interface UpdateCustomerRequest {
    customerId: string
    requesterId: string
    requesterRole: UserRole
    name?: string
    email?: string
}

export class UpdateCustomerService {
    async execute({
        customerId,
        requesterId,
        requesterRole,
        name,
        email,
    }: UpdateCustomerRequest) {
        const isAdmin = requesterRole === UserRole.ADMIN
        const isOwner = requesterId === customerId

        if (!isAdmin && !isOwner) {
            throw new AppError("Não autorizado", 403)
        }

        const customer = await prisma.user.findUnique({ where: { id: customerId } })

        if (!customer || customer.role !== UserRole.CUSTOMER) {
            throw new AppError("Cliente não encontrado", 404)
        }

        if (email && email !== customer.email) {
            const userWithSameEmail = await prisma.user.findUnique({
                where: { email },
            })

            if (userWithSameEmail) {
                throw new AppError("Já existe um usuário com este e-mail", 409)
            }
        }

        const updated = await prisma.user.update({
            where: { id: customerId },
            data: { name, email },
            select: userSelect,
        })

        return updated
    }
}