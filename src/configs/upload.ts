import path from "node:path";
import crypto from "node:crypto";
import multer from "multer";

const TMP_FOLDER = path.resolve(__dirname, "..", "..", "tmp")
const UPLOADS_FOLDER = path.resolve(TMP_FOLDER, "uploads")

const MAX_SIZE = 2 * 1024 * 1024
const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]

const storage = multer.diskStorage({
    destination: TMP_FOLDER,
    filename(request, file, callback) {
        const fileHash = crypto.randomBytes(10).toString("hex")
        const fileName = `${fileHash}-${file.originalname}`

        callback(null, fileName)
    },
})

export const uploadConfig = {
    TMP_FOLDER,
    UPLOADS_FOLDER,
    MAX_SIZE,
    ACCEPTED_MIME_TYPES,
    MULTER: { storage }
}
