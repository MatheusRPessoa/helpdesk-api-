import express from "express"
import cors from "cors"
import { routes } from "./routes"
import { errorHandling } from "./middlewares/error-handling.middleware"
import { uploadConfig } from "./configs/upload"

export const app = express()

app.use(cors())
app.use(express.json())
app.use("/files", express.static(uploadConfig.UPLOADS_FOLDER))
app.use(routes)
app.use(errorHandling)
