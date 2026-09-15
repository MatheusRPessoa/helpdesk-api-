import { prisma } from "@/database/prisma";

interface ListServiceRequest {
    onlyActive: boolean
}

export class ListServiceService {
    async execute({ onlyActive }: ListServiceRequest) {
        const services = await prisma.service.findMany({
            where: onlyActive ? { isActive: true } : undefined,
            orderBy: { title: "asc" },
        })

        return services
    }
}
