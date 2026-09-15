import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";

interface ToggleServiceStatusRequest {
    serviceId: string
    isActive: boolean
}

export class ToggleServiceStatusService{
    async execute({ serviceId, isActive }: ToggleServiceStatusRequest) {
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
        })

        if (!service) {
            throw new AppError("Serviço não encontrado", 404)
        }

        if (service.isActive === isActive) {
            throw new AppError(
                isActive ? "Serviço já está ativo" : "Serviço já está desativado",
                409,
            )
        }

        const updated = await prisma.service.update({
            where: { id: serviceId },
            data: { isActive },
        })

        return updated
    }
}