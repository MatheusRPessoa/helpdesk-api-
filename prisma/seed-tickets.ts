import { PrismaClient, TicketStatus, UserRole } from "@prisma/client"

const prisma = new PrismaClient()

const TITLES = [
  { title: "Computador não liga", description: "A máquina não dá sinal ao apertar o botão de ligar" },
  { title: "Rede lenta", description: "A conexão cai várias vezes ao longo do dia" },
  { title: "Backup não está funcionando", description: "O backup automático parou de rodar na semana passada" },
  { title: "Impressora não responde", description: "A impressora aparece offline mesmo ligada na rede" },
  { title: "Computador lento", description: "A máquina trava ao abrir mais de dois programas" },
  { title: "Não consigo acessar a VPN", description: "O acesso remoto recusa minhas credenciais desde ontem" },
  { title: "Tela azul ao inicializar", description: "O sistema reinicia sozinho durante a inicialização" },
  { title: "Arquivos sumiram da pasta", description: "Documentos da pasta compartilhada não aparecem mais" },
]

const STATUSES = [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.CLOSED]

function pick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)]
}

async function main() {
  const customers = await prisma.user.findMany({ where: { role: UserRole.CUSTOMER } })
  const technicians = await prisma.user.findMany({ where: { role: UserRole.TECHNICIAN } })
  const services = await prisma.service.findMany({ where: { isActive: true } })

  if (!customers.length || !technicians.length || !services.length) {
    throw new Error("Cadastre clientes, técnicos e serviços antes de rodar este script")
  }

  const QUANTITY = 20

  for (let index = 0; index < QUANTITY; index++) {
    const content = pick(TITLES)
    const baseService = pick(services)
    const hasAdditional = Math.random() > 0.6

    const ticketServices = [
      { serviceId: baseService.id, price: baseService.price, isAdditional: false },
    ]

    if (hasAdditional) {
      const extra = pick(services.filter((item) => item.id !== baseService.id))

      if (extra) {
        ticketServices.push({
          serviceId: extra.id,
          price: extra.price,
          isAdditional: true,
        })
      }
    }

    await prisma.ticket.create({
      data: {
        title: content.title,
        description: content.description,
        status: pick(STATUSES),
        customerId: pick(customers).id,
        technicianId: pick(technicians).id,
        services: { create: ticketServices },
      },
    })
  }

  console.log(`${QUANTITY} chamados criados`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })