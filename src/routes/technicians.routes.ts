import { Router } from "express";
import { UserRole } from "@prisma/client";

import { TechniciansController } from "@/controllers/technicians.controller";
import { ensureAuthenticated } from "@/middlewares/ensure-authenticated";
import { verifyUserAuthorization } from "@/middlewares/verify-user-authorization";

export const technicianRoutes = Router()
const techniciansController = new TechniciansController()

technicianRoutes.use(ensureAuthenticated)

technicianRoutes.get("/available", techniciansController.available)

technicianRoutes.post(
    "/",
    verifyUserAuthorization([UserRole.ADMIN]), 
    techniciansController.create,
)

technicianRoutes.get(
    "/",
    verifyUserAuthorization([UserRole.ADMIN]), 
    techniciansController.index,
)

technicianRoutes.put(
    "/:id",
    verifyUserAuthorization([UserRole.ADMIN]), 
    techniciansController.update,
)

technicianRoutes.patch(
    "/:id/availabilities",
    verifyUserAuthorization([UserRole.ADMIN]),
    techniciansController.updateAvailabilities,
)
