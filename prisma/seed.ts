import { DEFAULT_BUSINESS_HOURS } from "@/utils/business-hours";
import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient()

const BUSINESS_HOURS = DEFAULT_BUSINESS_HOURS

const TECH2_HOURS =[
    "10:00", "11:00", "12:00", "13:00",
    "16:00", "17:00", "18:00", "19:00"
]

const TECH3_HOURS =[
    "12:00", "13:00", "14:00", "15:00",
    "18:00", "19:00", "20:00", "21:00"
]

const TECHNICIANS = [
    {
        name: "Técnico Um",
        email: "tecnico1@helpdesk.com",
        hours: BUSINESS_HOURS,
    },
    {
        name: "Técnico dois",
        email: "tecnico2@helpdesk.com",
        hours: TECH2_HOURS,
    },
    {
        name: "Técnico três",
        email: "tecnico3@helpdesk.com",
        hours: TECH3_HOURS,
    },
]

const SERVICES = [
    { title: "Instalação e atualização de softwares", price: 120.0 },
    { title: "Instalação e atualização de hardwares", price: 180.0 },
    { title: "Diagnóstico e remoção de vírus", price: 150.0 },
    { title: "Suporte a impressoras", price: 90.0 },
    { title: "Solução de problemas de conectividade", price: 110.0 },
    { title: "Backup e recuperação de dados", price: 250.0 },
]

async function main() {
    const defaultPassword = await hash("123456", 8)

    await prisma.user.upsert({
        where: { email: "admin@helpdesk.com" },
        update: {},
        create: {
            name: "Administrador",
            email: "admin@helpdesk.com",
            password: defaultPassword,
            role: UserRole.ADMIN,
        },
    })

    for (const tech of TECHNICIANS) {
        await prisma.user.upsert({
            where: { email: tech.email },
            update: {},
            create: {
                name: tech.name,
                email: tech.email,
                password: defaultPassword,
                role: UserRole.TECHNICIAN,
                mustChangePassword: true,
                availabilities: {
                    create: tech.hours.map((hour) => ({ hour }))
                },
            },
        })
    }

    for (const service of SERVICES) {
        const exists = await prisma.service.findFirst({
            where: { title: service.title },
        })
        if (!exists) {
            await prisma.service.create({ data: service })
        }
    }

    console.log("Seed executada com sucesso")
}

main()
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })