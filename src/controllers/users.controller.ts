import { Request, Response } from "express";
import z from "zod";

import { ChangePasswordService } from "@/services/users/change-password.service";
import { request } from "node:http";

const bodySchema = z.object({
    currentPassword: z.string().min(1, "Senha atual é obrigatória"),
    newPassword: z.string().min(6, "Nova senha deve ter ao menos 6 caracteres"),
})

export class UsersController {
    changePassword = async (request: Request, response: Response) => {
        const { currentPassword, newPassword } = bodySchema.parse(request.body)

        const service = new ChangePasswordService()
        await service.execute({
            userId: request.user!.id,
            currentPassword,
            newPassword,
        })

        return response.status(204).send()
    }
}
