import { Router } from "express";
import { sessionsRoutes } from "./sessions.routes";
import { adminsRoutes } from "./admins.routes";
import { technicianRoutes } from "./technicians.routes";
import { usersRoutes } from "./users.routes";
import { customersRoutes } from "./customer.routes";
import { serviceRoutes } from "./services.routes";
import { ticketsRoutes } from "./tickets.routes";

export const routes = Router()

routes.get("/health", (_req, res) => {
    res.json({ status: "ok" })
})

routes.use("/sessions", sessionsRoutes)
routes.use("/admins", adminsRoutes)
routes.use("/technicians", technicianRoutes)
routes.use("/users", usersRoutes)
routes.use("/customers", customersRoutes)
routes.use("/services", serviceRoutes)
routes.use("/tickets", ticketsRoutes)
