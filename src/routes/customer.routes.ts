import { Router } from "express";
import { UserRole } from "@prisma/client";
import { ensureAuthenticated } from "@/middlewares/ensure-authenticated.middleware";
import { verifyUserAuthorization } from "@/middlewares/verify-user-authorization.middleware"
import { CustomersController } from "@/controllers/customers.controller";

export const customersRoutes = Router()
const customersController = new CustomersController()

customersRoutes.post("/", customersController.create)
customersRoutes.get(
    "/",
    ensureAuthenticated,
    verifyUserAuthorization([UserRole.ADMIN]),
    customersController.index,
)
