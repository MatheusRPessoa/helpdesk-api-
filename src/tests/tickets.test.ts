import request from "supertest"
import { TicketStatus, UserRole } from "@prisma/client"

import { app } from "@/app"
import { prisma } from "@/database/prisma"
import { resetDatabase } from "./utils/reset-database"
import { createTestUser } from "./utils/create-user"
import { CreateTicketService } from "@/services/tickets/create-ticket.service"
import { createTicketScenario } from "./utils/create-ticket"

describe("Tickets", () => {
    beforeEach(async () => {
        await resetDatabase()
    })

    afterAll(async () => {
        await resetDatabase()
        await prisma.$disconnect()
    })

    describe("POST /tickets", () => {
        it("cria chamado com técnico e serviço escolhidos", async () => {
            const customer = await createTestUser({ role: UserRole.CUSTOMER })
            const technician = await createTestUser({ role: UserRole.TECHNICIAN })
            const service = await prisma.service.create({
                data: { title: "Instalação de software", price: 120 },
            })

            const response = await request(app)
              .post("/tickets")
              .set("Authorization", `Bearer ${customer.token}`)
              .send({
                title: "Preciso instalar o Office",
                description: "Máquina nova sem pacote instalado",
                technicianId: technician.user.id,
                serviceIds: [service.id],
              })
            
            expect(response.status).toBe(201)
            expect(response.body.status).toBe(TicketStatus.OPEN)
            expect(response.body.services).toHaveLength(1)
            expect(response.body.services[0].isAdditional).toBe(false)
            expect(Number(response.body.total)).toBe(120)
        })

        it("recusa criação por técnico", async () => {
            const technician = await createTestUser({ role: UserRole.TECHNICIAN })
            const service = await prisma.service.create({
                data: { title: "Serviço X", price: 100 }
            })

            const payload = {
                title: "Chamado indevido",
                description: "Não deveria ser permitido",
                technicianId: technician.user.id,
                serviceIds: [service.id],
            }

            const byTechnician = await request(app)
              .post("/tickets")
              .set("Authorization", `Bearer ${technician.token}`)
              .send(payload)

            expect(byTechnician.status).toBe(403)
        })

        it("recusa serviço desativado", async () => {
            const customer = await createTestUser({ role: UserRole.CUSTOMER })
            const technician = await createTestUser({ role: UserRole.TECHNICIAN })
            const service = await prisma.service.create({
                data: { title: "Serviço Fora de Catálogo", price: 100, isActive: false },
            })

            const response = await request(app)
              .post("/tickets")
              .set("Authorization", `Bearer ${customer.token}`)
              .send({
                title: "Chamado com serviço inativo",
                description: "Serviço não deveria estar disponível",
                technicianId: technician.user.id,
                serviceIds: [service.id],
              })

            expect(response.status).toBe(400)
        })
        
        it("exige ao menos um serviço", async () => {
            const customer = await createTestUser({ role: UserRole.CUSTOMER })
            const technician = await createTestUser({ role: UserRole.TECHNICIAN })

            const response = await request(app)
              .post("/tickets")
              .set("Authorization", `Bearer ${customer.token}`)
              .send({
                title: "Chamado sem serviço",
                description: "Nenhum serviço selecionado",
                technicianId: technician.user.id,
                serviceIds: [],
              })
            
            expect(response.status).toBe(400)
        })

        it("recusa técnico que não é técnico", async () => {
            const customer = await createTestUser({ role: UserRole.CUSTOMER })
            const other = await createTestUser({ role: UserRole.CUSTOMER })
            const service = await prisma.service.create({
                data: { title: "Serviço Y", price: 100 },
            })

            const response = await request(app)
              .post("/tickets")
              .set("Authorization", `Bearer ${customer.token}`)
              .send({
                title: "Chamado sem serviço",
                description: "Nenhum serviço selecionado",
                technicianId: other.user.id,
                serviceIds: [service.id],
            })

            expect(response.status).toBe(404)
        })
    })

    describe("GET /tickets", () => {
        it("filtra por papel", async () => {
            const scenario = await createTicketScenario()
            const otherCustomer = await createTestUser({ role: UserRole.CUSTOMER })
            const otherTechnician = await createTestUser({ role: UserRole.TECHNICIAN })

            const asOwner = await request(app)
              .get("/tickets")
              .set("Authorization", `Bearer ${scenario.customer.token}`)

            const asOtherCustomer = await request(app)
              .get("/tickets")
              .set("Authorization", `Bearer ${otherCustomer.token}`)

            const asAssignedTechnician = await request(app)
              .get("/tickets")
              .set("Authorization", `Bearer ${scenario.technician.token}`)

            const asOtherTechnician = await request(app)
              .get("/tickets")
              .set("Authorization", `Bearer ${otherTechnician.token}`)
            
            const asAdmin = await request(app)
              .get("/tickets")
              .set("Authorization", `Bearer ${scenario.admin.token}`)

            expect(asOwner.body).toHaveLength(1)
            expect(asOtherCustomer.body).toHaveLength(0)
            expect(asAssignedTechnician.body).toHaveLength(1)
            expect(asOtherTechnician.body).toHaveLength(0)
            expect(asAdmin.body).toHaveLength(1)
        })
    })

    describe("POST /tickets/:id/services", () => {
        it("permite ao técnico responsável adicionar serviço", async () => {
            const { technician, ticket } = await createTicketScenario()
            const extra = await prisma.service.create({
                data: { title: "Serviço extra", price: 50 },
            })
            
            const response = await request(app)
              .post(`/tickets/${ticket.id}/services`)
              .set("Authorization", `Bearer ${technician.token}`)
              .send({ serviceIds: [extra.id] })

            expect(response.status).toBe(201)
            expect(response.body.services).toHaveLength(2)
            expect(Number(response.body.total)).toBe(150)

            const additional = response.body.services.find(
                (item: { isAdditional: boolean }) => item.isAdditional,
            )

            expect(additional).toBeDefined()
        })

        it("recusa técnico não responsável", async () => {
            const { ticket } = await createTicketScenario()
            const otherTechnician = await createTestUser({ role: UserRole.TECHNICIAN })
            const extra = await prisma.service.create({
                data: { title: "Serviço extra", price: 50 },
            })

            const response = await request(app)
              .post(`/tickets/${ticket.id}/services`)
              .set("Authorization", `Bearer ${otherTechnician.token}`)
              .send({ serviceIds: [extra.id] })

            expect(response.status).toBe(403)
        })

        it("recusa adicionar serviço em chamado encerrado", async () => {
            const { technician, ticket } = await createTicketScenario()
            const extra = await prisma.service.create({
                data: { title: "Serviço extra", price: 50 },
            })

            await prisma.ticket.update({
                where: { id: ticket.id },
                data: { status: TicketStatus.CLOSED }
            })

            const response = await request(app)
              .post(`/tickets/${ticket.id}/services`)
              .set("Authorization", `Bearer ${technician.token}`)
              .send({ serviceIds: [extra.id] })
            
            expect(response.status).toBe(409)
        })
    })

    describe("PATCH /tickets/:id/status", () => {
        it("permite ao técnico responsável mudar o status", async () => {
            const { technician, ticket } = await createTicketScenario()

            const response = await request(app)
              .patch(`/tickets/${ticket.id}/status`)
              .set("Authorization", `Bearer ${technician.token}`)
              .send({ status: TicketStatus.IN_PROGRESS  })

            expect(response.status).toBe(200)
            expect(response.body.status).toBe(TicketStatus.IN_PROGRESS)
        })

        it("permite ao admin mudar o status", async () => {
            const { admin, ticket } = await createTicketScenario()

            const response = await request(app)
              .patch(`/tickets/${ticket.id}/status`)
              .set("Authorization", `Bearer ${admin.token}`)
              .send({ status: TicketStatus.CLOSED  })

            expect(response.status).toBe(200)
            expect(response.body.status).toBe(TicketStatus.CLOSED)
        })

        it("recusa alteração pelo cliente dono do chamado", async () => {
            const { customer, ticket } = await createTicketScenario()

            const response = await request(app)
              .patch(`/tickets/${ticket.id}/status`)
              .set("Authorization", `Bearer ${customer.token}`)
              .send({ status: TicketStatus.CLOSED  })

            expect(response.status).toBe(403)
        })

        it("recusa status inválido", async () => {
            const { technician, ticket } = await createTicketScenario()

            const response = await request(app)
              .patch(`/tickets/${ticket.id}/status`)
              .set("Authorization", `Bearer ${technician.token}`)
              .send({ status: "FECHADO"  })

            expect(response.status).toBe(400)
        })
    })

    describe("regras de negócio", () => {
        it("mantém o preço histórico após alteração no catálogo", async () => {
            const { customer, service, ticket } = await createTicketScenario()

            await prisma.service.update({
                where: { id: service.id },
                data: { price: 999 },
            })

            const response = await request(app)
              .get("/tickets")
              .set("Authorization", `Bearer ${customer.token}`)

            const found = response.body.find(
                (item: { id: string }) => item.id === ticket.id
            )

            expect(Number(found.services[0].price)).toBe(100)
            expect(Number(found.total)).toBe(100)
        })

        it("mantém serviço desativado nos chamados já criados", async () => {
            const { customer, service, ticket } = await createTicketScenario()

            await prisma.service.update({
                where: { id: service.id },
                data: { isActive: false },
            })

            const response = await request(app)
              .get("/tickets")
              .set("Authorization", `Bearer ${customer.token}`)

            const found = response.body.find(
                (item: { id: string }) => item.id === ticket.id
            )

            expect(found.services).toHaveLength(1)
            expect(found.services[0].service.title).toBe("Serviço Base")
        })

        it("exclui os chamados ao excluir a conta do cliente", async () => {
            const { admin, customer, ticket } = await createTicketScenario()

            await request(app)
              .delete(`/customers/${customer.user.id}`)
              .set("Authorization", `Bearer ${admin.token}`)
              .expect(204)
            
            const remainingTicket = await prisma.ticket.findUnique({
              where: { id: ticket.id },
            })
            const remainingServices = await prisma.ticketService.findMany({
              where: { ticketId: ticket.id },
            })

            expect(remainingTicket).toBeNull()
            expect(remainingServices).toHaveLength(0)
        })
    })

    describe("DELETE /tickets/:id/services/:serviceId", () => {
        it("remove um serviço adicional e recalcula o total", async () => {
            const { technician, ticket } = await createTicketScenario()
            const extra = await prisma.service.create({
                data: { title: "Serviço Extra", price: 50 },
            })

            const added = await request(app)
                .post(`/tickets/${ticket.id}/services`)
                .set("Authorization", `Bearer ${technician.token}`)
                .send({ serviceIds: [extra.id] })
                .expect(201)

            expect(Number(added.body.total)).toBe(150)

            const additional = added.body.services.find(
                (item: { isAdditional: boolean }) => item.isAdditional,
            )

            const response = await request(app)
                .delete(`/tickets/${ticket.id}/services/${additional.id}`)
                .set("Authorization", `Bearer ${technician.token}`)

            expect(response.status).toBe(200)
            expect(response.body.services).toHaveLength(1)
            expect(Number(response.body.total)).toBe(100)
        })

        it("retorna 404 quando o chamado não existe", async () => {
            const { technician } = await createTicketScenario()

            const response = await request(app)
            .delete(
                "/tickets/00000000-0000-4000-8000-000000000000/services/00000000-0000-4000-8000-000000000001",
            )
            .set("Authorization", `Bearer ${technician.token}`)

            expect(response.status).toBe(404)
        })

        it("recusa técnico que não é responsável", async () => {
            const { technician, ticket } = await createTicketScenario()
            const otherTechnician = await createTestUser({
                role: UserRole.TECHNICIAN
            })
            const extra = await prisma.service.create({
                data: { title: "Serviço Extra", price: 50 },
            })

            const added = await request(app)
              .post(`/tickets/${ticket.id}/services`)
              .set("Authorization", `Bearer ${technician.token}`)
              .send({ serviceIds: [extra.id] })
              .expect(201)

            const additional = added.body.services.find(
                (item: { isAdditional: boolean }) => item.isAdditional,
            )

            const response = await request(app)
              .delete(`/tickets/${ticket.id}/services/${additional.id}`)
              .set("Authorization", `Bearer ${otherTechnician.token}`)
            
            expect(response.status).toBe(403)
        })

        it("recusa admin e cliente pelo middleware", async () => {
            const { admin, customer, technician, ticket } = await createTicketScenario()
            const extra = await prisma.service.create({
                data: { title: "Serviço Extra", price: 50 }
            })

            const added = await request(app)
                .post(`/tickets/${ticket.id}/services`)
                .set("Authorization", `Bearer ${technician.token}`)
                .send({ serviceIds: [extra.id] })
                .expect(201)

            const additional = added.body.services.find(
                (item: { isAdditional: boolean }) => item.isAdditional,
            )

            const byAdmin = await request(app)
                .delete(`/tickets/${ticket.id}/services/${additional.id}`)
                .set("Authorization", `Bearer ${admin.token}`)

            const byCustomer = await request(app)
                .delete(`/tickets/${ticket.id}/services/${additional.id}`)
                .set("Authorization", `Bearer ${customer.token}`)

            expect(byAdmin.status).toBe(403)
            expect(byCustomer.status).toBe(403)
        })

        it("recusa remoção em chamado encerrado", async () => {
            const { technician, ticket } = await createTicketScenario()
            const extra = await prisma.service.create({
                data: { title: "Serviço extra", price: 50 }
            })

            const added = await request(app)
                .post(`/tickets/${ticket.id}/services`)
                .set("Authorization", `Bearer ${technician.token}`)
                .send({ serviceIds: [extra.id] })
                .expect(201)

            const additional = added.body.services.find(
                (item: { isAdditional: boolean }) => item.isAdditional,
            )

            await prisma.ticket.update({
                where: { id: ticket.id },
                data: { status: TicketStatus.CLOSED },
            })

            const response = await request(app)
              .delete(`/tickets/${ticket.id}/services/${additional.id}`)
              .set("Authorization", `Bearer ${technician.token}`)
            
            expect(response.status).toBe(409)
        })

        it("retorna 404 quando o serviço pertence a outro chamado", async () => {
            const scenario = await createTicketScenario()
            const extra = await prisma.service.create({
            data: { title: "Serviço Extra", price: 50 },
            })

            const otherTicket = await prisma.ticket.create({
                data: {
                    title: "Outro chamado",
                    description: "Chamado usado para o teste de vínculo",
                    customerId: scenario.customer.user.id,
                    technicianId: scenario.technician.user.id,
                    services: {
                        create: [
                            { serviceId: scenario.service.id, price: scenario.service.price },
                            { serviceId: extra.id, price: extra.price, isAdditional: true },
                        ],
                    },
                },
                include: { services: true },
            })

            const foreignService = otherTicket.services.find(
                (item) => item.isAdditional,
            )!

            const response = await request(app)
              .delete(`/tickets/${scenario.ticket.id}/services/${foreignService.id}`)
              .set("Authorization", `Bearer ${scenario.technician.token}`)

            expect(response.status).toBe(404)
        })

        it("recusa remover o serviço original do chamado", async () => {
            const { technician, ticket } = await createTicketScenario()

            const ticketServices = await prisma.ticketService.findMany({
                where: { ticketId: ticket.id },
            })

            const original = ticketServices.find((item) => !item.isAdditional)!

            const response = await request(app)
                .delete(`/tickets/${ticket.id}/services/${original.id}`)
                .set("Authorization", `Bearer ${technician.token}`)

            expect(response.status).toBe(400)
        })

        it("recusa UUID inválido nos params", async () => {
            const { technician, ticket } = await createTicketScenario()

            const invalidTicketId = await request(app)
            .delete(`/tickets/nao-e-uuid/services/${ticket.id}`)
            .set("Authorization", `Bearer ${technician.token}`)

            const invalidServiceId = await request(app)
            .delete(`/tickets/${ticket.id}/services/nao-e-uuid`)
            .set("Authorization", `Bearer ${technician.token}`)

            expect(invalidTicketId.status).toBe(400)
            expect(invalidServiceId.status).toBe(400)
        })
    })
})