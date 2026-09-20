import { Router } from "express";
import { UserRole } from "@prisma/client";

import { TicketsController } from "@/controllers/tickets.controller";
import { ensureAuthenticated } from "@/middlewares/ensure-authenticated.middleware";
import { verifyUserAuthorization } from "@/middlewares/verify-user-authorization.middleware";

export const ticketsRoutes = Router()
const ticketsController = new TicketsController()

ticketsRoutes.use(ensureAuthenticated)

ticketsRoutes.post(
    "/",
    verifyUserAuthorization([UserRole.ADMIN, UserRole.CUSTOMER]),
    ticketsController.create,
)

ticketsRoutes.get("/", ticketsController.index)
ticketsRoutes.get("/:id", ticketsController.show)

ticketsRoutes.post(
    "/:id/services",
    verifyUserAuthorization([UserRole.ADMIN, UserRole.TECHNICIAN]),
    ticketsController.addServices
)

ticketsRoutes.patch(
    "/:id/status",
    verifyUserAuthorization([UserRole.ADMIN, UserRole.TECHNICIAN]),
    ticketsController.updateStatus,
)
