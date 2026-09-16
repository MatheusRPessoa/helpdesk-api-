import { TicketStatus } from "@prisma/client";

import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";
import { ticketSelect } from "@/utils/ticket-select";
import { calculateTicketTotal } from "@/utils/calculate-ticket-total";

interface AddTicketServicesRequest {
    ticketId: string
    technicianId: string
    serviceIds: string[]
}

export class AddTicketServicesService {
    async execute({
        ticketId,
        technicianId,
        serviceIds,
    }: AddTicketServicesRequest) {
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
        })

        if (!ticket) {
            throw new AppError("Chamado não encontrado", 404)
        }

        if (ticket.technicianId !== technicianId) {
            throw new AppError("Você não é o técnico responsável por este chamado", 403)
        }

        if (ticket.status === TicketStatus.CLOSED) {
            throw new AppError(
                "Não é possível adicionar serviços a um chamado encerrado",
                409,
            )
        }

        const uniqueServiceIds = [...new Set(serviceIds)]

        const services = await prisma.service.findMany({
            where: { id: { in: uniqueServiceIds } },
        })

        if (services.length !== uniqueServiceIds.length) {
            throw new AppError("Um ou mais serviços não foram encontrados", 404)
        }

        const inactiveService = services.find((service) => !service.isActive)

        if (inactiveService) {
            throw new AppError(
                `O serviço "${inactiveService.title}" não está disponível`,
                400,
            )
        }

        await prisma.ticketService.createMany({
            data: services.map((service) => ({
                ticketId,
                serviceId: service.id,
                price: service.price,
                isAdditional: true,
            })),
        })

        const updated = await prisma.ticket.findUniqueOrThrow({
            where: { id: ticketId },
            select: ticketSelect,
        })

        return {
            ...updated,
            total: calculateTicketTotal(updated.services),
        }
    }
}
