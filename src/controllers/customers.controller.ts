import { Request, Response } from "express";
import z from "zod";

import { CreateCustomerService } from "@/services/customers/create-customer.service";
import { ListCustomersService } from "@/services/customers/list-customers.service";
import { UpdateCustomerService } from "@/services/customers/update-customer.service"

const createBodySchema = z.object({
    name: z.string().trim().min(3, "Nome deve ter ao menos 3 caracteres."),
    email: z.email("E-mail inválido"),
    password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
})

const paramsSchema = z.object({
    id: z.uuid("ID inválido"),
})

const updateBodySchema = z.object({
    name: z.string().trim().min(3, "Nome deve ter ao menos 3 caracteres").optional(),
    email: z.email("E-mail inválido").optional(),
})

export class CustomersController {
    create = async (request: Request, response: Response) => {
        const data = createBodySchema.parse(request.body)

        const service = new CreateCustomerService()
        const customer = await service.execute(data)

        return response.status(201).json(customer)
    }

    index = async (_request: Request, response: Response) => {
        const service = new ListCustomersService()
        const customers = await service.execute()

        return response.json(customers)
    }

    update = async (request: Request, response: Response) => {
        const { id } = paramsSchema.parse(request.params)
        const data = updateBodySchema.parse(request.body)

        const service = new UpdateCustomerService()
        const customer = await service.execute({
            customerId: id,
            requesterId: request.user!.id,
            requesterRole: request.user!.role,
            ...data,
        })

        return response.json(customer)
    }
}
