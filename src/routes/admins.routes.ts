import { Router } from "express";
import { UserRole } from "@prisma/client";

import { AdminsController } from "@/controllers/admins.controller";
import { ensureAuthenticated } from "@/middlewares/ensure-authenticated";
import { verifyUserAuthorization } from "@/middlewares/verify-user-authorization";

export const adminsRoutes = Router()
const adminsController = new AdminsController()

adminsRoutes.use(ensureAuthenticated)
adminsRoutes.use(verifyUserAuthorization([UserRole.ADMIN]))

adminsRoutes.post("/", adminsController.create)
adminsRoutes.get("/", adminsController.index)
adminsRoutes.put("/:id", adminsController.update)
adminsRoutes.delete("/:id", adminsController.delete)
