import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = 'admin@facturapro.test'
  const userEmail = 'user@facturapro.test'
  const password = 'Admin1234!'

  const adminHash = await bcrypt.hash(password, 10)
  const userHash = await bcrypt.hash('User1234!', 10)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN', passwordHash: adminHash },
    create: { email: adminEmail, role: 'ADMIN', passwordHash: adminHash },
  })

  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: { role: 'USER', passwordHash: userHash },
    create: { email: userEmail, role: 'USER', passwordHash: userHash },
  })

  // Facturas demo para el usuario estándar
  const demo = [
    { number: 'INV-2024-001', vendor: 'Adobe Systems', invoiceDate: new Date('2024-05-12'), totalCents: 4599, status: 'PAID' },
    { number: 'INV-2024-042', vendor: 'Amazon Web Services', invoiceDate: new Date('2024-05-10'), totalCents: 124000, status: 'PENDING' },
    { number: 'INV-2024-089', vendor: 'Digital Ocean Inc', invoiceDate: new Date('2024-05-08'), totalCents: 8900, status: 'PAID' },
    { number: 'INV-2024-112', vendor: 'Stripe Payments', invoiceDate: new Date('2024-05-05'), totalCents: 21050, status: 'PENDING' },
  ]

  for (const it of demo) {
    await prisma.invoice.create({
      data: {
        userId: user.id,
        number: it.number,
        vendor: it.vendor,
        invoiceDate: it.invoiceDate,
        totalCents: it.totalCents,
        status: it.status,
        history: {
          create: {
            from: it.status === 'PAID' ? 'PENDING' : 'PAID',
            to: it.status,
          },
        },
      },
    })
  }

  console.log('Seed OK')
  console.log('Admin:', adminEmail, password)
  console.log('User :', userEmail, 'User1234!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
