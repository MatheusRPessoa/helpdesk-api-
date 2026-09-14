import { Request, Response } from "express";
import z from "zod";

import { ChangePasswordService } from "@/services/users/change-password.service";
import { UpdateAvatarService } from "@/services/users/update-avatar.service";
import { AppError } from "@/utils/AppError";

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

    updateAvatar = async (request: Request, response: Response) => {
        if (!request.file) {
            throw new AppError("Nenhum arquivo enviado", 400)
        }

        const service = new UpdateAvatarService()
        const user = await service.execute({
            userId: request.user!.id,
            fileName: request.file.filename,
        })

        return response.json(user)
    }
}
