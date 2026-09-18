import request from "supertest"
import { hash } from "bcryptjs"
import { UserRole } from "@prisma/client"

import { app } from "@/app"
import { prisma } from "@/database/prisma"

describe("POST /sessions", () => {
    beforeAll(async () => {
        await prisma.user.create({
            data: {
                name: "Admin Teste",
                email: "admin-teste@helpdesk.com",
                password: await hash("123456", 8),
                role: UserRole.ADMIN,
            },
        })
    })

    afterAll(async () => {
        await prisma.user.deleteMany({
            where: { email: "admin-teste@helpdesk.com" },
        })
        await prisma.$disconnect()
    })

    it("deve autenticar com credenciais válidas", async () => {
        const response = await request(app).post("/sessions").send({
            email: "admin-teste@helpdesk.com",
            password: "123456",
        })

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty("token")
        expect(response.body.user).not.toHaveProperty("password")
    })

    it("deve recusar senha incorreta", async () => {
        const response = await request(app).post("/sessions").send({
            email: "admin-teste@helpdesk.com",
            password: "senha-incorreta"
        })

        expect(response.status).toBe(401)
    })

    it("deve recusar e-mail incorreta", async () => {
        const response = await request(app).post("/sessions").send({
            email: "errada@helpdesk.com",
            password: "123456"
        })

        expect(response.status).toBe(401)
    })

    it("deve recusar e-amail inválido", async () => {
        const response = await request(app).post("/sessions").send({
            email: "nao-e-email",
            password: "123456",
        })
        
        expect(response.status).toBe(400)
    })
})