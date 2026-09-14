import fs from "node:fs/promises"
import path from "node:path"

import { prisma } from "@/database/prisma"
import { uploadConfig } from "@/configs/upload"
import { AppError } from "@/utils/AppError"
import { userSelect } from "@/utils/user-select"

interface UpdateAvatarRequest {
    userId: string
    fileName: string
}

export class UpdateAvatarService {
    async execute({ userId, fileName }: UpdateAvatarRequest) {
        const user = await prisma.user.findUnique({ where: { id: userId } })

        if (!user) {
            await this.deleteTmpFile(fileName)
            throw new AppError("Usuário não encontrado", 404)
        }

        if (user.avatarUrl) {
            await this.deleteFile(user.avatarUrl)
        }

        await fs.rename(
            path.resolve(uploadConfig.TMP_FOLDER, fileName),
            path.resolve(uploadConfig.UPLOADS_FOLDER, fileName),
        )

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { avatarUrl: fileName },
            select: userSelect,
        })

        return updated
    }

    private async deleteTmpFile(filename: string) {
        await fs.unlink(path.resolve(uploadConfig.TMP_FOLDER, filename)).catch(() => {})
    }

    private async deleteFile(fileName: string) {
        await fs.unlink(path.resolve(uploadConfig.UPLOADS_FOLDER, fileName)).catch(() => {})
    }
    
}