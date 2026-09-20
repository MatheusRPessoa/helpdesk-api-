import { UserRole } from "@prisma/client";

import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";
import { ticketSelect } from "@/utils/ticket-select";
import { calculateTicketTotal } from "@/utils/calculate-ticket-total";

interface ShowTicketRequest {
    ticketId: string
    requesterId: string
    requesterRole: UserRole
}

export class ShowTicketService {
    async execute({ ticketId, requesterId, requesterRole }: ShowTicketRequest) {
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            select: ticketSelect,
        })

        if(!ticket) {
            throw new AppError("Chamado não encontrado", 404)
        }

        const isAdmin = requesterRole === UserRole.ADMIN
        const isOwner = ticket.customer.id === requesterId
        const isAssigned = ticket.technician.id === requesterId

        if (!isAdmin && !isOwner && !isAssigned) {
            throw new AppError("Não autorizado", 403)
        }

        return { ...ticket, total: calculateTicketTotal(ticket.services) }
    }
}