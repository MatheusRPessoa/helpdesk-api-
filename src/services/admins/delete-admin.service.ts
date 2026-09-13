import { UserRole } from "@prisma/client"

import { prisma } from "@/database/prisma"
import { AppError } from "@/utils/AppError"

interface DeleteAdminRequest {
  adminId: string
  requesterId: string
}

export class DeleteAdminService {
  async execute({ adminId, requesterId }: DeleteAdminRequest) {
    const admin = await prisma.user.findUnique({ where: { id: adminId } })

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new AppError("Administrador não encontrado", 404)
    }

    if (requesterId === adminId) {
      throw new AppError("Não é possível excluir a própria conta", 403)
    }

    const adminCount = await prisma.user.count({
      where: { role: UserRole.ADMIN },
    })

    if (adminCount <= 1) {
      throw new AppError("Não é possível excluir o último administrador", 409)
    }

    await prisma.user.delete({ where: { id: adminId } })
  }
}