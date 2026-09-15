import { Request, Response } from "express";
import z from "zod";
import { CreateServiceService } from "@/services/services/create-service.service";
import { UserRole } from "@prisma/client";
import { ListServiceService } from "@/services/services/list-services.service";
import { UpdateServiceService } from "@/services/services/update-service.service";

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

export class ServiceController {
    create = async (request: Request, response: Response) => {
        const data = createBodySchema.parse(request.body)

        const Service = new CreateServiceService()
        const created = await Service.execute(data)

        return response.status(201).json(created)
    }

    index = async (request: Request, response: Response) => {
        const isAdmin = request.user!.role === UserRole.ADMIN

        const Service = new ListServiceService()
        const Services = await Service.execute({ onlyActive: !isAdmin })

        return response.json(Services)
    }

    update = async (request: Request, response: Response) => {
        const { id } = paramsSchema.parse(request.params)
        const data = updateBodySchema.parse(request.body)

        const Service = new UpdateServiceService()
        const updated = await Service.execute({ serviceId: id, ...data })

        return response.json(updated)
    }
}
