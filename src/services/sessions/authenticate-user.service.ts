import { compare } from "bcryptjs"
import { sign } from "jsonwebtoken"

import { prisma } from "@/database/prisma"
import { authConfig } from "@/configs/auth"
import { AppError } from "@/utils/AppError"

interface AuthenticateUserRequest {
  email: string
  password: string
}

export class AuthenticateUserService {
  async execute({ email, password }: AuthenticateUserRequest) {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      throw new AppError("E-mail ou senha inválidos", 401)
    }

    const passwordMatched = await compare(password, user.password)

    if (!passwordMatched) {
      throw new AppError("E-mail ou senha inválidos", 401)
    }

    const token = sign({ role: user.role }, authConfig.jwt.secret, {
      subject: user.id,
      expiresIn: authConfig.jwt.expiresIn,
    })

    const { password: _, ...userWithoutPassword } = user

    return { token, user: userWithoutPassword }
  }
}
