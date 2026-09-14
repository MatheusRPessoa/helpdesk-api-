import { UserRole } from "@prisma/client";

import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";
import { userSelect } from "@/utils/user-select";

interface UpdateTechnicianAvailabilitiesRequest {
    technicianId: string
    availabilities: string[]
}

export class UpdateTechnicianAvailabilitiesService {
    async execute({
        technicianId,
        availabilities,
    }: UpdateTechnicianAvailabilitiesRequest) {
        const technician = await prisma.user.findUnique({
            where: { id: technicianId },
        })

        if (!technician || technician.role !== UserRole.TECHNICIAN) {
            throw new AppError("Técnico não encontrado", 404)
        }

        return prisma.$transaction(async (tx) => {
            await tx.technicianAvailability.deleteMany({ where: { technicianId } })

            const hours = [...new Set(availabilities)]

            if (hours.length) {
                await tx.technicianAvailability.createMany({
                    data: hours.map((hour) => ({ technicianId, hour })),
                })
            }

            return tx.user.findUniqueOrThrow({
                where: { id: technicianId },
                select: {
                    ...userSelect,
                    availabilities: {
                        select: { id: true, hour: true },
                        orderBy: { hour: "asc" },
                    },
                },
            })
        })
    }
}