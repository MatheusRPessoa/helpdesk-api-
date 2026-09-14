import { Request, Response } from "express";
import z from "zod";

import { CreateCustomerService } from "@/services/customers/create-customer.service";
import { ListCustomersService } from "@/services/customers/list-customers.service";

const createBodySchema = z.object({
    name: z.string().trim().min(3, "Nome deve ter ao menos 3 caracteres."),
    email: z.email("E-mail inválido"),
    password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
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
}
