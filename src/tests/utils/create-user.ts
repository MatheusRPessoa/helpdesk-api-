import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { UserRole } from "@prisma/client";

import { prisma } from "@/database/prisma";
import { authConfig } from "@/configs/auth";

interface CreateTestUserParams {
    role: UserRole
    email?: string
    password?: string
    name?: string
}

export async function createTestUser({
    role,
    email = `${role.toLowerCase()}-${Date.now()}-${Math.random()}@test.com`,
    password = "123456",
    name = `Usuário ${role}`,
}: CreateTestUserParams) {
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: await hash(password, 8),
            role,
        },
    })
    
    const token = sign({ role: user.role }, authConfig.jwt.secret, {
        subject: user.id,
        expiresIn: authConfig.jwt.expiresIn,
    })

    return { user, token, plainPassword: password }
}
