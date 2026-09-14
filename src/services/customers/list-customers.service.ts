import { UserRole } from "@prisma/client";

import { prisma } from "@/database/prisma";
import { userSelect } from "@/utils/user-select";

export class ListCustomersService {
    async execute() {
        const customers = await prisma.user.findMany({
            where: { role: UserRole.CUSTOMER },
            select: {
                ...userSelect,
                _count: {
                    select: { ticketsAsCustomer: true },
                },
            },
            orderBy: { name: "asc" },
        })

        return customers.map(({ _count, ...customer }) => ({
            ...customer,
            ticketsCount: _count.ticketsAsCustomer,
        }))
    }
}