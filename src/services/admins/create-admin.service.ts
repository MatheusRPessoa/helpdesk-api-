import { hash } from "bcryptjs"
import { UserRole } from "@prisma/client"

import { prisma } from "@/database/prisma"
import { AppError } from "@/utils/AppError"
import { userSelect } from "@/utils/user-select"

interface CreateAdminRequest {
  name: string
  email: string
  password: string
}

export class CreateAdminService {
  async execute({ name, email, password }: CreateAdminRequest) {
    const userWithSameEmail = await prisma.user.findUnique({
      where: { email },
    })

    if (userWithSameEmail) {
      throw new AppError("Já existe um usuário com este e-mail", 409)
    }

    const hashedPassword = await hash(password, 8)

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: UserRole.ADMIN,
      },
      select: userSelect,
    })

    return admin
  }
}