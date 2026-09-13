import { Router } from "express";

import { UsersController } from "@/controllers/users.controller";
import { ensureAuthenticated } from "@/middlewares/ensure-authenticated";

export const usersRoutes = Router()
const usersController = new UsersController()

usersRoutes.use(ensureAuthenticated)

usersRoutes.patch("/password", usersController.changePassword)
