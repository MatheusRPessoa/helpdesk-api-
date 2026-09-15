export const ticketSelect = {
    id: true,
    title: true,
    description: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    customer: {
        select: { id: true, name: true, email: true, avatarUrl: true },
    },
    technician: {
        select: { id: true, name: true, email: true, avatarUrl: true },
    },
    services: {
        select: {    
            id: true,
            price: true,
            isAdditional: true,
            service: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "asc" },
    },
} as const