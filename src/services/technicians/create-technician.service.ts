import { hash } from "bcryptjs";
import { UserRole } from "@prisma/client";

import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";
import { userSelect } from "@/utils/user-select";
import { DEFAULT_BUSINESS_HOURS } from "@/utils/business-hours";

interface CreateTechnicianRequest {
    name: string
    email: string
    password: string
    availabilities?: string[]
}

export class CreateTechnicianService {
    async execute({
        name,
        email,
        password,
        availabilities,
    }: CreateTechnicianRequest) {
        const userWithSameEmail = await prisma.user.findUnique({
            where: { email },
        })

        if (userWithSameEmail) {
            throw new AppError("Já existe um usuário com este e-mail", 409)
        }

        const hours = availabilities?.length
          ? [...new Set(availabilities)]
          : [...DEFAULT_BUSINESS_HOURS]

        const hashedPassword = await hash(password, 8)

        const technician = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: UserRole.TECHNICIAN,
                mustChangePassword: true,
                availabilities: {
                    create: hours.map((hour) => ({ hour })),
                },
            },
            select: {
                ...userSelect,
                mustChangePassword: true,
                availabilities: {
                    select: { id: true, hour: true },
                    orderBy: { hour: "asc" }
                },
            },
        })

        return technician
    }
}