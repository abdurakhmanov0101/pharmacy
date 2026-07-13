import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const transactions = await prisma.inventoryTransaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { inventory: { include: { medicine: true } } }
  });
  console.log(JSON.stringify(transactions, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
