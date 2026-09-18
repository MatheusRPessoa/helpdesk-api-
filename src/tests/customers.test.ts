import request from "supertest"
import { UserRole } from "@prisma/client"

import { app } from "@/app"
import { prisma } from "@/database/prisma"
import { resetDatabase } from "./utils/reset-database"
import { createTestUser } from "./utils/create-user"

describe("Customers", () => {
    beforeEach(async () => {
        await resetDatabase()
    })

    afterAll(async () => {
        await resetDatabase()
        await prisma.$disconnect()
    })

    it("permite cadastro público", async () => {
        const response = await request(app).post("/customers").send({
            name: "Cliente novo",
            email: "cliente-novo@test.com",
            password: "123456",
        })

        expect(response.status).toBe(201)
        expect(response.body.role).toBe(UserRole.CUSTOMER)
    })

    it("ignora role enviado no body", async () => {
        const response = await request(app).post("/customers").send({
            name: "Esperto",
            email: "esperto@test.com",
            password: "123456",
            role: UserRole.ADMIN,
        })

        expect(response.status).toBe(201)
        expect(response.body.role).toBe(UserRole.CUSTOMER)
    })

    it("impede um cliente de editar outro", async () => {
        const clientA = await createTestUser({ role: UserRole.CUSTOMER })
        const clientB = await createTestUser({ role: UserRole.CUSTOMER })

        const response = await request(app)
          .put(`/customers/${clientB.user.id}`)
          .set("Authorization", `Bearer ${clientA.token}`)
          .send({ name: "Invasão" })
        
        expect(response.status).toBe(403)
    })

    it("permite ao cliente editar a própria conta", async () => {
        const { token, user } = await createTestUser({ role: UserRole.CUSTOMER })

        const response = await request(app)
          .put(`/customers/${user.id}`)
          .set("Authorization", `Bearer ${token}`)
          .send({ name: "Nome Atualizado" })

        expect(response.status).toBe(200)
        expect(response.body.name).toBe("Nome Atualizado")
    })

    it("impede o técnico de listar clientes", async () => {
        const { token } = await createTestUser({ role: UserRole.TECHNICIAN })

        const response = await request(app)
          .get("/customers")
          .set("Authorization", `Bearer ${token}`)

        expect(response.status).toBe(403)
    })
})
