import { Router } from "express";
import { UserRole } from "@prisma/client";

import { ServicesController } from "@/controllers/services.controller";
import { ensureAuthenticated } from "@/middlewares/ensure-authenticated.middleware";
import { verifyUserAuthorization } from "@/middlewares/verify-user-authorization.middleware";

export const servicesRoutes = Router()
const servicesController = new ServicesController()

servicesRoutes.use(ensureAuthenticated)

servicesRoutes.post(
    "/",
    verifyUserAuthorization([UserRole.ADMIN]),
    servicesController.create,
)
