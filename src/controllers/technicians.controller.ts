import { Request, Response } from "express";
import z from "zod";

import { CreateTechnicianService } from "@/services/technicians/create-technician.service";
import { ListTechniciansService } from "@/services/technicians/list-technicians.service";
import { ListAvailableTechniciansService } from "@/services/technicians/list-available-technicians.service";
import { UpdateTechnicianService } from "@/services/technicians/update-technician.service";

const hourSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):00$/, "Horário deve estar no formato HH:00")

const paramsSchema = z.object({
    id: z.uuid("ID inválido")
})

const createBodySchema = z.object({
    name: z.string().trim().min(3, "Nome deve ter ao menos 3 caracteres"),
    email: z.email("E-mail inválido"),
    password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
    availabilities: z.array(hourSchema).optional(),
})

const updateBodySchema = z.object({
    name: z.string().trim().min(3, "Nome deve ter ao menos 3 caracteres").optional(),
    email: z.email("E-mail inválido"). optional(),
    password: z.string().min(6, "Senha deve ter ao menos 6 caracteres").optional(),
    availabilities: z.array(hourSchema).optional(),
})

export class TechniciansController {
    create = async (request: Request, response: Response) => {
        const data = createBodySchema.parse(request.body)

        const service = new CreateTechnicianService()
        const technician = await service.execute(data)

        return response.status(201).json(technician)
    }

    index = async (_request: Request, response: Response) => {
        const service = new ListTechniciansService()
        const technicians = await service.execute()

        return response.json(technicians)
    }

    available = async (_request: Request, response: Response) => {
        const service = new ListAvailableTechniciansService()
        const technicians = await service.execute()

        return response.json(technicians)
    }

    update = async (request: Request, response: Response) => {
        const { id } = paramsSchema.parse(request.params)
        const data = updateBodySchema.parse(request.body)

        const service = new UpdateTechnicianService()
        const technician = await service.execute({ technicianId: id, ...data })

        return response.json(technician)
    }
}
