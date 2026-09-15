import { prisma } from "@/database/prisma";

interface ListServicesRequest {
    onlyActive: boolean
}

export class ListServicesService {
    async execute({ onlyActive }: ListServicesRequest) {
        const services = await prisma.service.findMany({
            where: onlyActive ? { isActive: true } : undefined,
            orderBy: { title: "asc" },
        })

        return services
    }
}
