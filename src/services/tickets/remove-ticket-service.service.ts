import { TicketStatus } from "@prisma/client"

import { prisma } from "@/database/prisma"
import { AppError } from "@/utils/AppError"
import { ticketSelect } from "@/utils/ticket-select"
import { calculateTicketTotal } from "@/utils/calculate-ticket-total"

interface RemoveTicketServiceRequest {
  ticketId: string
  ticketServiceId: string
  technicianId: string
}

export class RemoveTicketServiceService {
  async execute({
    ticketId,
    ticketServiceId,
    technicianId,
  }: RemoveTicketServiceRequest) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })

    if (!ticket) {
      throw new AppError("Chamado não encontrado", 404)
    }

    if (ticket.technicianId !== technicianId) {
      throw new AppError("Você não é o técnico responsável por este chamado", 403)
    }

    if (ticket.status === TicketStatus.CLOSED) {
      throw new AppError("Não é possível alterar um chamado encerrado", 409)
    }

    const ticketService = await prisma.ticketService.findUnique({
      where: { id: ticketServiceId },
    })

    if (!ticketService || ticketService.ticketId !== ticketId) {
      throw new AppError("Serviço não encontrado neste chamado", 404)
    }

    if (!ticketService.isAdditional) {
      throw new AppError("Não é possível remover o serviço original do chamado", 400)
    }

    await prisma.ticketService.delete({ where: { id: ticketServiceId } })

    const updated = await prisma.ticket.findUniqueOrThrow({
      where: { id: ticketId },
      select: ticketSelect,
    })

    return { ...updated, total: calculateTicketTotal(updated.services) }
  }
}