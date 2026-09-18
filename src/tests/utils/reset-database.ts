import { prisma } from "@/database/prisma";

export async function resetDatabase() {
    await prisma.ticketService.deleteMany()
    await prisma.ticket.deleteMany()
    await prisma.technicianAvailability.deleteMany()
    await prisma.service.deleteMany()
    await prisma.user.deleteMany()
}
