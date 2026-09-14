import { hash } from "bcryptjs";
import { UserRole } from "@prisma/client";

import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";
import { userSelect } from "@/utils/user-select";

interface CreateCustomerRequest {
    name: string,
    email: string,
    password: string,
}

export class CreateCustomerService {
    async execute({ name, email, password }: CreateCustomerRequest) {
        const userWithSameEmail = await prisma.user.findUnique({
            where: { email },
        })

        if (userWithSameEmail) {
            throw new AppError("Já existe um usuário com este e-mail", 409)
        }

        const hashedPassword = await hash(password, 8)

        const customer = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: UserRole.CUSTOMER,
            },
            select: userSelect
        })

        return customer
    }
}
