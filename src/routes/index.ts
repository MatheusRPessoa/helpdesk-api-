import { Router } from "express";
import { sessionsRoutes } from "./sessions.routes";
import { adminsRoutes } from "./admins.routes";
import { technicianRoutes } from "./technicians.routes";

export const routes = Router()

routes.get("/health", (_req, res) => {
    res.json({ status: "ok" })
})

routes.use("/sessions", sessionsRoutes)
routes.use("/admins", adminsRoutes)
routes.use("/technicians", technicianRoutes)
