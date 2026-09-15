import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";

interface UpdateServiceRequest {
    serviceId: string
    title?: string
    price?: number
}

export class UpdateServiceService {
    async execute({ serviceId, title, price }: UpdateServiceRequest) {
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
        })

        if (!service) {
            throw new AppError("Serviço não encontrado", 404)
        }

        if (title && title.toLowerCase() !== service.title.toLowerCase()) {
            const serviceWithSameTitle = await prisma.service.findFirst({
                where: {
                    title: { equals: title, mode: "insensitive" },
                    id: { not: serviceId },
                },
            })

            if (serviceWithSameTitle) {
                throw new AppError("Já existe um serviço com este título", 409)
            }
        }

        const updated = await prisma.service.update({
            where: { id: serviceId },
            data: { title, price },
        })

        return updated
    }
}
