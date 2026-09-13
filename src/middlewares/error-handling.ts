import { ErrorRequestHandler } from "express";
import { treeifyError, ZodError } from "zod";
import { AppError } from "@/utils/AppError";

export const errorHandling: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message })
    } 

    if (error instanceof ZodError) {
        return res.status(400).json({
            message: "Erro de validação",
            issues: treeifyError(error),
        })
    }

    console.error(error)
    return res.status(500).json({ message: "Erro interno do servidor" })
}
