import { UserRole } from "@prisma/client";

import { prisma } from "@/database/prisma";
import { userSelect } from "@/utils/user-select";

export class ListTechniciansService {
    async execute() {
        const technicians = await prisma.user.findMany({
            where: { role: UserRole.TECHNICIAN },
            select: {
                ...userSelect,
                availabilities: {
                    select: { id: true, hour: true },
                    orderBy: { hour: "asc" },
                },
            },
            orderBy: { name: "asc" },
        })

        return technicians
    }
}