import { UserRole, Prisma } from "@prisma/client";

import { prisma } from "@/database/prisma";
import { ticketSelect } from "@/utils/ticket-select";
import { calculateTicketTotal } from "@/utils/calculate-ticket-total"

interface ListTicketsRequest {
    requesterId: string
    requesterRole: UserRole
}

export class ListTicketsService {
    async execute({ requesterId, requesterRole }: ListTicketsRequest) {
        const where: Prisma.TicketWhereInput = {}

        if (requesterRole === UserRole.CUSTOMER) {
            where.customerId = requesterId
        }

        if (requesterRole === UserRole.TECHNICIAN) {
            where.technicianId = requesterId
        }

        const tickets = await prisma.ticket.findMany({
            where,
            select: ticketSelect,
            orderBy: { createdAt: "desc" },
        })

        return tickets.map((ticket) => ({
        ...ticket,
        total: calculateTicketTotal(ticket.services),
        }))
    }
}
