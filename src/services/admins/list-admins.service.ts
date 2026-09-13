import { UserRole } from "@prisma/client"

import { prisma } from "@/database/prisma"
import { userSelect } from "@/utils/user-select"

export class ListAdminsService {
  async execute() {
    const admins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: userSelect,
      orderBy: { name: "asc" },
    })

    return admins
  }
}