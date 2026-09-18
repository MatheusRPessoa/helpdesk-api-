import request from "supertest"
import { UserRole } from "@prisma/client"

import { app } from "@/app"
import { prisma } from "@/database/prisma"
import { resetDatabase } from "./utils/reset-database"
import { createTestUser } from "./utils/create-user"

describe("Services", () => {
    beforeEach(async () => {
        await resetDatabase()
    })

    afterAll(async () => {
        await resetDatabase()
        await prisma.$disconnect()
    })

    describe("POST /services", () => {
        it("cria um serviço quando autenticado como admin", async () => {
            const { token } = await createTestUser({ role: UserRole.ADMIN })

            const response = await request(app)
              .post("/services")
              .set("Authorization", `Bearer ${token}`)
              .send({ title: "Suporte a impressoras", price: 90 })

            expect(response.status).toBe(201)
            expect(response.body.isActive).toBe(true)
            expect(Number(response.body.price)).toBe(90)
        })

        it("recusa título duplicado ignorando maiúsculas", async () => {
            const { token } = await createTestUser({ role: UserRole.ADMIN })

            await request(app)
              .post("/services")
              .set("Authorization", `Bearer ${token}`)
              .send({ title: "Backup de dados", price: 250 })
              .expect(201)

            const response = await request(app)
              .post("/services")
              .set("Authorization", `Bearer ${token}`)
              .send({ title: "backup de dados", price: 300 })

            expect(response.status).toBe(409)
        })

        it("recusa preço zero ou negativo", async () => {
            const { token } = await createTestUser({ role: UserRole.ADMIN })

            const zero = await request(app)
              .post("/services")
              .set("Authorization", `Bearer ${token}`)
              .send({ title: "Serviço Grátis", price: 0 })

            const negativo = await request(app)
              .post("/services")
              .set("Authorization", `Bearer ${token}`)
              .send({ title: "Serviço Grátis", price: -10 })

            expect(zero.status).toBe(400)
            expect(negativo.status).toBe(400)
        })

        it("recusa criação por técnico e por cliente", async () => {
            const technician = await createTestUser({ role: UserRole.TECHNICIAN })
            const customer = await createTestUser({ role: UserRole.CUSTOMER })

            const byTechnician = await request(app)
              .post("/services")
              .set("Authorization", `Bearer ${technician.token}`)
              .send({ title: "Serviço Proibido", price: 100 })

            const byCustomer = await request(app)
              .post("/services")
              .set("Authorization", `Bearer ${customer.token}`)
              .send({ title: "Serviço Proibido", price: 100 })

            expect(byTechnician.status).toBe(403)
            expect(byCustomer.status).toBe(403)
        })
    })

    describe("GET /services", () => {
      it("esconde serviços desativados de não-admins", async () => {
        const admin = await createTestUser({ role: UserRole.ADMIN })
        const customer = await createTestUser({ role: UserRole.CUSTOMER })

        await prisma.service.createMany({
          data: [
            { title: "Serviço Ativo", price: 100 },
            { title: "Serviço Inativo", price: 100, isActive: false },
          ],
        })

        const adminResponse = await request(app)
          .get("/services")
          .set("Authorization", `Bearer ${admin.token}`)

        const customerResponse = await request(app)
          .get("/services")
          .set("Authorization", `Bearer ${customer.token}`)

        expect(adminResponse.body).toHaveLength(2)
        expect(customerResponse.body).toHaveLength(1)
        expect(customerResponse.body[0].title).toBe("Serviço Ativo")
      })
    })

    describe("PATCH /services/:id/status", () => {
      it("desativa e reativa um serviço", async () => {
        const { token } = await createTestUser({ role: UserRole.ADMIN })
        const service = await prisma.service.create({
          data: { title: "Serviço Alternável", price: 120 },
        })

        const deactivate = await request(app)
          .patch(`/services/${service.id}/status`)
          .set("Authorization", `Bearer ${token}`)
          .send({ isActive: false })

        expect(deactivate.status).toBe(200)
        expect(deactivate.body.isActive).toBe(false)

        const reactivate = await request(app)
          .patch(`/services/${service.id}/status`)
          .set("Authorization", `Bearer ${token}`)
          .send({ isActive: true })

        expect(reactivate.body.isActive).toBe(true)
      })

      it("recusa desativar um serviço já desativado", async () => {
        const { token } = await createTestUser({ role: UserRole.ADMIN })
        const service = await prisma.service.create({
          data: { title: "Já desativado", price: 120, isActive: false },
        })

        const response = await request(app)
          .patch(`/services/${service.id}/status`)
          .set("Authorization", `Bearer ${token}`)
          .send({ isActive: false })

        expect(response.status).toBe(409)
      })
    })

    describe("PUT /services/:id", () => {
      it("atualiza o preço", async () => {
        const { token } = await createTestUser({ role: UserRole.ADMIN })
        const service = await prisma.service.create({
          data: { title: "Serviço Editável", price: 100 },
        })

        const response = await request(app)
          .put(`/services/${service.id}`)
          .set("Authorization", `Bearer ${token}`)
          .send({ price: 175.5 })

        expect(response.status).toBe(200)
        expect(Number(response.body.price)).toBe(175.5)
      })

      it("retorna 404 para serviço inexistente", async () => {
        const { token } = await createTestUser({ role: UserRole.ADMIN })

        const response = await request(app)
          .put("/services/00000000-0000-4000-8000-000000000000")
          .set("Authorization", `Bearer ${token}`)
          .send({ price: 100 })

        expect(response.status).toBe(404)
      })
    })
})
