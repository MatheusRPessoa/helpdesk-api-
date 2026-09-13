import { UserRole } from "@prisma/client";

import { prisma } from "@/database/prisma";

export class ListAvailableTechniciansService {
    async execute() {
        const technicians = await prisma.user.findMany({
            where: { role: UserRole.TECHNICIAN },
            select: {
                id: true,
                name: true,
                avatarUrl: true,
                availabilities: {
                    select: { hour: true },
                    orderBy: { hour: "asc" },
                },
            },
            orderBy: { name: "asc" },
        })

        return technicians.map((technician) => ({
            id: technician.id,
            name: technician.name,
            avatarUrl: technician.avatarUrl,
            availabilities: technician.availabilities.map((a) => a.hour),
        }))
    }
}