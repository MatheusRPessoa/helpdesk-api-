import { Request, Response } from "express";
import z from "zod";
import { CreateServiceService } from "@/services/services/create-service.service";
import { UserRole } from "@prisma/client";
import { ListServiceService } from "@/services/services/list-services.service";
import { UpdateServiceService } from "@/services/services/update-service.service";
import { ToggleServiceStatusService } from "@/services/services/toggle-service-status.service";
import { request } from "node:http";

const createBodySchema = z.object({
    title: z.string().trim().min(3, "Título deve ter ao menos 3 caracteres"),
    price: z
      .number()
      .positive("Preço deve ser maior que zero")
      .max(99999999.99, "Preço excede o limite permitido"),
})

const paramsSchema = z.object({
    id: z.uuid("ID inválido")
})

const updateBodySchema = z.object({
    title: z.string().trim().min(3, "Título deve ter ao menos 3 caracteres").optional(),
    price: z
      .number()
      .positive("Preço deve ser maior que zero")
      .max(99999999.99, "Preço excede o limite permitido")
      .optional(),
})

const statusBodySchema = z.object({
    isActive: z.boolean(),
})

export class ServiceController {
    create = async (request: Request, response: Response) => {
        const data = createBodySchema.parse(request.body)

        const service = new CreateServiceService()
        const created = await service.execute(data)

        return response.status(201).json(created)
    }

    index = async (request: Request, response: Response) => {
        const isAdmin = request.user!.role === UserRole.ADMIN

        const service = new ListServiceService()
        const services = await service.execute({ onlyActive: !isAdmin })

        return response.json(services)
    }

    update = async (request: Request, response: Response) => {
        const { id } = paramsSchema.parse(request.params)
        const data = updateBodySchema.parse(request.body)

        const service = new UpdateServiceService()
        const updated = await service.execute({ serviceId: id, ...data })

        return response.json(updated)
    }

    updateStatus = async (request: Request, response: Response) => {
        const { id } = paramsSchema.parse(request.params)
        const { isActive } = statusBodySchema.parse(request.body)
        
        const service = new ToggleServiceStatusService()
        const updated = await service.execute({ serviceId: id, isActive })

        return response.json(updated)
    }
}
