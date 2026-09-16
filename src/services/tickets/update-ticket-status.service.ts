import { TicketStatus, UserRole } from "@prisma/client";

import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";
import { ticketSelect } from "@/utils/ticket-select";
import { calculateTicketTotal } from "@/utils/calculate-ticket-total";

interface UpdateTicketStatusRequest {
    ticketId: string,
    requesterId: string,
    requesterRole: UserRole
    status: TicketStatus
}

export class UpdateTicketStatusService {
    async execute({
        ticketId,
        requesterId,
        requesterRole,
        status,
    }: UpdateTicketStatusRequest) {
        const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })

        if (!ticket) {
            throw new AppError("Chamado não encontrado", 404)
        }

        const isAdmin = requesterRole === UserRole.ADMIN
        const isAssignedTechnician = ticket.technicianId === requesterId

        if (!isAdmin && !isAssignedTechnician) {
            throw new AppError("Você não é o técnico responsável por este chamado", 403)
        }

        if (ticket.status === status) {
            throw new AppError("O chamado já está neste status", 409)
        }

        const updated = await prisma.ticket.update({
            where: { id: ticketId },
            data: { status },
            select: ticketSelect,
        })

        return {
            ...updated,
            total: calculateTicketTotal(updated.services),
        }
    }
}
