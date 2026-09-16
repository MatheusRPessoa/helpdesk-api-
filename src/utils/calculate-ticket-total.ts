import { Prisma } from "@prisma/client";

export function calculateTicketTotal(services: { price: Prisma.Decimal }[]) {
    return services.reduce(
        (sum, item) => sum.add(item.price),
        new Prisma.Decimal(0),
    )
}
