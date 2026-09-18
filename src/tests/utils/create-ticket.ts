import { UserRole } from "@prisma/client";

import { prisma } from "@/database/prisma";
import { createTestUser } from "./create-user";

export async function createTicketScenario() {
    const customer = await createTestUser({ role: UserRole.CUSTOMER })
    const technician = await createTestUser({ role: UserRole.TECHNICIAN })
    const admin = await createTestUser({ role: UserRole.ADMIN })

    const service = await prisma.service.create({
        data: { title: "Serviço Base", price: 100 },
    })

    const ticket = await prisma.ticket.create({
        data: {
            title: "Chamado de teste",
            description: "Descrição do chamado de teste",
            customerId: customer.user.id,
            technicianId: technician.user.id,
            services: {
                create: [{ serviceId: service.id, price: service.price, isAdditional: false }],
            },
        },
    })

    return { customer, technician, admin, service, ticket }
}
