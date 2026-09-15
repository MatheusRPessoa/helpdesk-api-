import { Router } from "express";
import { UserRole } from "@prisma/client";

import { ServiceController } from "@/controllers/service.controller";
import { ensureAuthenticated } from "@/middlewares/ensure-authenticated.middleware";
import { verifyUserAuthorization } from "@/middlewares/verify-user-authorization.middleware";

export const serviceRoutes = Router()
const servicesController = new ServiceController()

serviceRoutes.use(ensureAuthenticated)

serviceRoutes.post(
    "/",
    verifyUserAuthorization([UserRole.ADMIN]),
    servicesController.create,
)

serviceRoutes.get("/", servicesController.index)

serviceRoutes.put(
    "/:id",
    verifyUserAuthorization([UserRole.ADMIN]),
    servicesController.update
)