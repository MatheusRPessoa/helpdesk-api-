import request from "supertest"
import { UserRole } from "@prisma/client"

import { app } from "@/app"
import { prisma } from "@/database/prisma"
import { resetDatabase } from "./utils/reset-database"
import { createTestUser } from "./utils/create-user"

describe("Admins", () => {
    beforeEach(async () => {
        await resetDatabase()
    })

    afterAll(async () => {
        await resetDatabase()
        await prisma.$disconnect()
    })

    describe("POST /admins", () => {
        it("cria um admin quando autenticado como admin", async () => {
            const { token } = await createTestUser({ role: UserRole.ADMIN })

            const response = await request(app)
              .post("/admins")
              .set("Authorization", `Bearer ${token}`)
              .send({
                name: "Novo Admin",
                email: "novo-admin@test.com",
                password: "123456",
              })
            
            expect(response.status).toBe(201)
            expect(response.body.role).toBe(UserRole.ADMIN)
            expect(response.body).not.toHaveProperty("password")
        })

        it("recusa sem autenticação", async () => {
            const response = await request(app).post("/admins").send({
                name: "Invasor",
                email: "invasor@test.com",
                password: "123456",
            })

            expect(response.status).toBe(401)
        })

        it("recusa quando autenticado como técnico", async () => {
            const { token } = await createTestUser({ role: UserRole.TECHNICIAN })

            const response = await request(app)
              .post("/admins")
              .set("Authorization", `Bearer ${token}`)
              .send({
                name: "Novo Admin",
                email: "novo-admin@test.com",
                password: "1234546"
            })
            
            expect(response.status).toBe(403)
        })

        it("recusa e-mail já cadastrado", async () => {
            const { token, user } = await createTestUser({ role: UserRole.ADMIN })

            const response = await request(app)
              .post("/admins")
              .set("Authorization", `Bearer ${token}`)
              .send({ name: "Duplicado", email: user.email, password: "123456" })

            expect(response.status).toBe(409)
        })
    })

    describe("DELETE /admins/:id", () => {
        it("impede excluir a própria conta", async () => {
            const { token, user } = await createTestUser({ role: UserRole.ADMIN })
            await createTestUser({ role: UserRole.ADMIN })

            const response = await request(app)
              .delete(`/admins/${user.id}`)
              .set("Authorization", `Bearer ${token}`)

            expect(response.status).toBe(403)
        })

        it("impede excluir o último admin", async () => {
            const { token } = await createTestUser({ role: UserRole.ADMIN })
            const other = await createTestUser({ role: UserRole.ADMIN })

            await request(app)
              .delete(`/admins/${other.user.id}`)
              .set("Authorization", `Bearer ${token}`)
              .expect(204)

            const response = await request(app)
              .delete(`/admins/${other.user.id}`)
              .set("Authorization", `Bearer ${token}`)

            expect(response.status).toBe(404)
        })
    })
})