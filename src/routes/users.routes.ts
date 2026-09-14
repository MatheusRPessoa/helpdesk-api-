import { Router } from "express";

import { UsersController } from "@/controllers/users.controller";
import { ensureAuthenticated } from "@/middlewares/ensure-authenticated.middleware";
import { uploadSingleImage } from "@/middlewares/upload.middleware";

export const usersRoutes = Router()
const usersController = new UsersController()

usersRoutes.use(ensureAuthenticated)

usersRoutes.patch("/password", usersController.changePassword)
usersRoutes.patch("/avatar", uploadSingleImage, usersController.updateAvatar)