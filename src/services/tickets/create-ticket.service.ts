import { UserRole } from "@prisma/client";
import { ticketSelect } from "@/utils/ticket-select";

import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";
import { calculateTicketTotal } from "@/utils/calculate-ticket-total";

interface CreateTicketRequest {
    customerId: string
    technicianId: string
    serviceIds: string[]
    title: string
    description: string
}

export class CreateTicketService {
    async execute({
        customerId,
        technicianId,
        serviceIds,
        title,
        description,
    }: CreateTicketRequest) {
        const technician = await prisma.user.findUnique({
            where: { id: technicianId },
        })

        if (!technician || technician.role !== UserRole.TECHNICIAN) {
            throw new AppError("Técnico não encontrado", 404)
        }

        const uniqueServiceIds = [...new Set(serviceIds)]

        const services = await prisma.service.findMany({
            where: { id: { in: uniqueServiceIds } },
        })

        if (services.length !== uniqueServiceIds.length) {
            throw new AppError("Um ou mais serviços não foram encontradas", 404)
        }

        const inactiveService = services.find((service) => !service.isActive)

        if (inactiveService) {
            throw new AppError(
                `O serviço "${inactiveService.title}" não está disponível`,
                400,
            )
        }

        const ticket = await prisma.ticket.create({
            data: {
                title,
                description,
                customerId,
                technicianId,
                services: {
                    create: services.map((service) => ({
                        serviceId: service.id,
                        price: service.price,
                        isAdditional: false,
                    })),
                },
            },
            select: ticketSelect,
        })

        return {
            ...ticket,
            total: calculateTicketTotal(ticket.services),
        }
    }
}
