import { Request, Response } from "express"
import { z } from "zod"

import { AuthenticateUserService } from "@/services/sessions/authenticate-user.service"

const bodySchema = z.object({
  email: z.email(),
  password: z.string(),
})

export class SessionsController {
  create = async (request: Request, response: Response) => {
    const { email, password } = bodySchema.parse(request.body)

    const service = new AuthenticateUserService()
    const result = await service.execute({ email, password })

    return response.json(result)
  }
}