import { hash } from "bcryptjs"
import { UserRole } from "@prisma/client"

import { prisma } from "@/database/prisma"
import { AppError } from "@/utils/AppError"
import { userSelect } from "@/utils/user-select"

interface UpdateAdminRequest {
  adminId: string
  name?: string
  email?: string
  password?: string
}

export class UpdateAdminService {
  async execute({ adminId, name, email, password }: UpdateAdminRequest) {
    const admin = await prisma.user.findUnique({ where: { id: adminId } })

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new AppError("Administrador não encontrado", 404)
    }

    if (email && email !== admin.email) {
      const userWithSameEmail = await prisma.user.findUnique({
        where: { email },
      })

      if (userWithSameEmail) {
        throw new AppError("Já existe um usuário com este e-mail", 409)
      }
    }

    const updated = await prisma.user.update({
      where: { id: adminId },
      data: {
        name,
        email,
        password: password ? await hash(password, 8) : undefined,
      },
      select: userSelect,
    })

    return updated
  }
}