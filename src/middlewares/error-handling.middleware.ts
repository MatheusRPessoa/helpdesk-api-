import { ErrorRequestHandler } from "express";
import { treeifyError, ZodError } from "zod";
import { AppError } from "@/utils/AppError";
import { MulterError } from "multer";

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

    if (error instanceof MulterError) {
        const message =
          error.code === "LIMIT_FILE_SIZE"
            ? "Arquivo excede o tamanho máximo de 2MB"
            : "Erro no upload do arquivo"

        return res.status(400).json({ message })
    }

    console.error(error)
    return res.status(500).json({ message: "Erro interno do servidor" })
}
