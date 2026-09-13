import { Request, Response } from "express"
import { z } from "zod"

import { CreateAdminService } from "@/services/admins/create-admin.service"
import { ListAdminsService } from "@/services/admins/list-admins.service"
import { UpdateAdminService } from "@/services/admins/update-admin.service"
import { DeleteAdminService } from "@/services/admins/delete-admin.service"

const paramsSchema = z.object({
  id: z.uuid("ID inválido"),
})

const createBodySchema = z.object({
  name: z.string().trim().min(3, "Nome deve ter ao menos 3 caracteres"),
  email: z.email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
})

const updateBodySchema = z.object({
  name: z.string().trim().min(3, "Nome deve ter ao menos 3 caracteres").optional(),
  email: z.email("E-mail inválido").optional(),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres").optional(),
})

export class AdminsController {
  create = async (request: Request, response: Response) => {
    const data = createBodySchema.parse(request.body)

    const service = new CreateAdminService()
    const admin = await service.execute(data)

    return response.status(201).json(admin)
  }

  index = async (_request: Request, response: Response) => {
    const service = new ListAdminsService()
    const admins = await service.execute()

    return response.json(admins)
  }

  update = async (request: Request, response: Response) => {
    const { id } = paramsSchema.parse(request.params)
    const data = updateBodySchema.parse(request.body)

    const service = new UpdateAdminService()
    const admin = await service.execute({ adminId: id, ...data })

    return response.json(admin)
  }

  delete = async (request: Request, response: Response) => {
    const { id } = paramsSchema.parse(request.params)

    const service = new DeleteAdminService()
    await service.execute({
      adminId: id,
      requesterId: request.user!.id,
    })

    return response.status(204).send()
  }
}
