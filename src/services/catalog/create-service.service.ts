import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";

interface CreateServiceRequest {
    title: string
    price: number
}

export class CreateServiceService {
    async execute({ title, price }: CreateServiceRequest) {
        const serviceWithSameTitle = await prisma.service.findFirst({
            where: { title: { equals: title, mode: "insensitive" } },
        })

        if (serviceWithSameTitle) {
            throw new AppError("Já existe um serviço com este título", 409)
        }

        const service = await prisma.service.create({
            data: { title, price }
        })

        return service
    }
}