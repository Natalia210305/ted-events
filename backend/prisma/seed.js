const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const hashed = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashed,
      firstName: 'Admin',
      lastName: 'System',
      email: 'admin@tedapp.gr',
      role: 'ADMIN',
      status: 'APPROVED',
    },
  })
  console.log('Admin created!')
}

main().catch(console.error).finally(() => prisma.$disconnect())