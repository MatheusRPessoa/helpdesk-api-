import { Router } from "express";
import { UserRole } from "@prisma/client";

import { TicketsController } from "@/controllers/tickets.controller";
import { ensureAuthenticated } from "@/middlewares/ensure-authenticated.middleware";
import { verifyUserAuthorization } from "@/middlewares/verify-user-authorization.middleware";

export const ticketsRoutes = Router()
const ticketController = new TicketsController()

ticketsRoutes.use(ensureAuthenticated)

ticketsRoutes.post(
    "/",
    verifyUserAuthorization([UserRole.CUSTOMER]),
    ticketController.create,
)
