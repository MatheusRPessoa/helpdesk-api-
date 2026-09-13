import { hash } from "bcryptjs"
import { UserRole } from "@prisma/client";

import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";
import { userSelect } from "@/utils/user-select";

interface UpdateTechnicianRequest {
    technicianId: string,
    name?: string,
    email?: string,
    password?: string,
    availabilities?: string[] 
}

export class UpdateTechnicianService {
    async execute({
        technicianId,
        name,
        email,
        password,
        availabilities,
    }: UpdateTechnicianRequest) {
        const technician = await prisma.user.findUnique({
            where: { id: technicianId },
        })

        if (!technician || technician.role !== UserRole.TECHNICIAN) {
            throw new AppError("Técnico não encontrado", 404)
        }

        if (email && email !== technician.email) {
            const userWithSameEmail = await prisma.user.findUnique({
                where: { email },
            })

            if (userWithSameEmail) {
                throw new AppError("Já existe um usuário com este e-mail", 409)
            }
        }

        const updated = await prisma.$transaction(async (tx) => {
            if (availabilities) {
                await tx.technicianAvailability.deleteMany({
                    where: { technicianId },
                })

                const hours = [...new Set(availabilities)]

                await tx.technicianAvailability.createMany({
                    data: hours.map((hour) => ({ technicianId, hour }))
                })
            }

            return tx.user.update({
                where: { id: technicianId },
                data: {
                    name,
                    email,
                    password: password ? await hash(password, 8) : undefined,
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
        })

        return updated
    }
}
