import { UserRole } from "@prisma/client";

import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";

interface DeleteCustomerRequest {
    customerId: string
    requesterId: string
    requesterRole: UserRole
}

export class DeleteCustomerService {
    async execute({
        customerId,
        requesterId,
        requesterRole,
    }: DeleteCustomerRequest) {
        const isAdmin = requesterRole === UserRole.ADMIN
        const isOwner = requesterId === customerId

        if (!isAdmin && !isOwner) {
            throw new AppError("Não autorizado", 403)
        }

        const customer = await prisma.user.findUnique({ where: { id: customerId } })

        if (!customer || customer.role !== UserRole.CUSTOMER) {
            throw new AppError("Cliente não encontrado", 404)
        }

        await prisma.user.delete({ where: { id: customerId } })
    }
}