import { Request, Response } from "express";
import z from "zod";

import { CreateTicketService } from "@/services/tickets/create-ticket.service";
import { ListTicketsService } from "@/services/tickets/list-tickets.service";
import { AddTicketServicesService } from "@/services/tickets/add-ticket-services.service";
import { TicketStatus } from "@prisma/client";
import { UpdateTicketStatusService } from "@/services/tickets/update-ticket-status.service";
import { ShowTicketService } from "@/services/tickets/show-ticket.service";
import { RemoveTicketServiceService } from "@/services/tickets/remove-ticket-service.service";

const paramsSchema = z.object({
    id: z.uuid("ID inválido")
})

const addServicesBodySchema = z.object({
    serviceIds: z
      .array(z.uuid("Serviço inválido"))
      .min(1, "Selecione ao menos um serviço"),
})

const createBodySchema = z.object({
    title: z.string().trim().min(3, "Título deve ter ao menos 3 caracteres"),
    description: z.string().trim().min(10, "Descrição deve ter ao menos 10 caracteres"),
    technicianId: z.uuid("Técnico inválido"),
    serviceIds: z
      .array(z.uuid("Serviço inválido"))
      .min(1, "Selecione ao menos um serviço"),
})

const statusBodySchema = z.object({
    status: z.enum(TicketStatus),
})

const removeServiceParamsSchema = z.object({
  id: z.uuid("ID inválido"),
  serviceId: z.uuid("ID inválido"),
})

export class TicketsController {
    create = async (request: Request, response: Response) => {
        const data = createBodySchema.parse(request.body)

        const service = new CreateTicketService()
        const ticket = await service.execute({
            customerId: request.user!.id,
            ...data,
        })

        return response.status(201).json(ticket)
    }

    index = async (request: Request, response: Response) => {
        const service = new ListTicketsService()
        const tickets = await service.execute({
            requesterId: request.user!.id,
            requesterRole: request.user!.role,
        })

        return response.json(tickets)
    }

    addServices = async (request: Request, response: Response) => {
        const { id } = paramsSchema.parse(request.params)
        const { serviceIds } = addServicesBodySchema.parse(request.body)

        const service = new AddTicketServicesService()
        const ticket = await service.execute({
            ticketId: id,
            technicianId: request.user!.id,
            serviceIds,
        })

        return response.status(201).json(ticket)
    }

    updateStatus = async (request: Request, response: Response) => {
        const { id } = paramsSchema.parse(request.params)
        const { status } = statusBodySchema.parse(request.body)

        const service = new UpdateTicketStatusService()
        const ticket = await service.execute({
            ticketId: id,
            requesterId: request.user!.id,
            requesterRole: request.user!.role,
            status,
        })

        return response.json(ticket)
    }

    show = async (request: Request, response: Response) => {
        const { id } = paramsSchema.parse(request.params)

        const service = new ShowTicketService()
        const ticket = await service.execute({
            ticketId: id,
            requesterId: request.user!.id,
            requesterRole: request.user!.role,
        })

        return response.json(ticket)
    }

    removeService = async (request: Request, response: Response) => {
        const { id, serviceId } = removeServiceParamsSchema.parse(request.params)

        const service = new RemoveTicketServiceService()
        const ticket = await service.execute({
            ticketId: id,
            ticketServiceId: serviceId,
            technicianId: request.user!.id,
        })

        return response.json(ticket)
    }
}
