import { app } from "@/app";
import { env } from "@/configs/env";

app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`)
})
