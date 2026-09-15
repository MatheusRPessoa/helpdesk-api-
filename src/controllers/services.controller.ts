import { Request, Response } from "express";
import z from "zod";
import { CreateServiceService } from "@/services/catalog/create-service.service";
import { UserRole } from "@prisma/client";
import { ListServicesService } from "@/services/catalog/list-services.service";

const createBodySchema = z.object({
    title: z.string().trim().min(3, "Título deve ter ao menos 3 caracteres"),
    price: z
      .number()
      .positive("Preço deve ser maior que zero")
      .max(99999999.99, "Preço excede o limite permitido"),
})

export class ServicesController {
    create = async (request: Request, response: Response) => {
        const data = createBodySchema.parse(request.body)

        const service = new CreateServiceService()
        const created = await service.execute(data)

        return response.status(201).json(created)
    }

    index = async (request: Request, response: Response) => {
        const isAdmin = request.user!.role === UserRole.ADMIN

        const service = new ListServicesService()
        const services = await service.execute({ onlyActive: !isAdmin })

        return response.json(services)
    }
}
