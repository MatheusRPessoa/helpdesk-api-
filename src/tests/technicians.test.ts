import request from "supertest"
import { UserRole } from "@prisma/client"

import { app } from "@/app"
import { prisma } from "@/database/prisma"
import { resetDatabase } from "./utils/reset-database"
import { createTestUser } from "./utils/create-user"

describe("Technicians", () => {
    beforeEach(async () => {
        await resetDatabase()
    })

    afterAll(async () => {
        await resetDatabase()
        await prisma.$disconnect()
    })

    it("cria técnico com horário comercial por padrão", async () => {
        const { token } = await createTestUser({ role: UserRole.ADMIN })

        const response = await request(app)
          .post("/technicians")
          .set("Authorization", `Bearer ${token}`)
          .send({
            name: "Técnico Teste",
            email: "tecnico-teste@test.com",
            password: "provisoria",
          })
        
        expect(response.status).toBe(201)
        expect(response.body.availabilities).toHaveLength(8)
        expect(response.body.mustChangePassword).toBe(true)
    })

    it("cria técnico com horários customizados", async () => {
        const { token } = await createTestUser({ role: UserRole.ADMIN })

        const response = await request(app)
          .post("/technicians")
          .set("Authorization", `Bearer ${token}`)
          .send({
            name: "Técnico Teste",
            email: "tecnico-custom@test.com",
            password: "provisoria",
            availabilities: ["09:00", "10:00"],
          })

        expect(response.status).toBe(201)
        expect(response.body.availabilities).toHaveLength(2)
    })

    it("recusa horário fora do formato HH:00", async () => {
        const { token } = await createTestUser({ role: UserRole.ADMIN })

        const response = await request(app)
          .post("/technicians")
          .set("Authorization", `Bearer ${token}`)
          .send({
            name: "Técnico Teste",
            email: "tecnico-invalido@test.com",
            password: "provisoria",
            availabilities: ["08:30"],
          })
        
        expect(response.status).toBe(400)
    })

    it("substitui os horários ao atualizar", async () => {
        const { token } = await createTestUser({ role: UserRole.ADMIN })
        const { user } = await createTestUser({ role: UserRole.TECHNICIAN })

        const response = await request(app)
          .patch(`/technicians/${user.id}/availabilities`)
          .set("Authorization", `Bearer ${token}`)
          .send({ availabilities: ["14:00", "15:00", "16:00"] })

        expect(response.status).toBe(200)
        expect(response.body.availabilities).toHaveLength(3)
    })

    it("permite ao cliente listar técnicos disponíveis", async () => {
        await createTestUser({ role: UserRole.TECHNICIAN })
        const { token } = await createTestUser({ role: UserRole.CUSTOMER })

        const response = await request(app)
          .get("/technicians/available")
          .set("Authorization", `Bearer ${token}`)

        expect(response.status).toBe(200)
        expect(response.body[0]).not.toHaveProperty("email")
    })
})
