import multer from "multer";
import { uploadConfig } from "@/configs/upload";
import { AppError } from "@/utils/AppError";

const upload = multer({
    storage: uploadConfig.MULTER.storage,
    limits: { fileSize: uploadConfig.MAX_SIZE },
    fileFilter(request, file, callback) {
        console.log("mimetype recebido:", file.mimetype)
        console.log("aceitos:", uploadConfig.ACCEPTED_MIME_TYPES)

        if (!uploadConfig.ACCEPTED_MIME_TYPES.includes(file.mimetype)) {
            return callback(new AppError("Formato de arquivo inválido. Use JPEG, PNG ou WebP", 400))
        }

        callback(null, true)
    },
})

export const uploadSingleImage = upload.single("file")
