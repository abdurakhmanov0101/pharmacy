import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const branch = await prisma.branch.findFirst();
  const user = await prisma.user.findFirst();
  const medicine = await prisma.medicine.findFirst();

  if (!branch || !user || !medicine) {
    console.log('Missing data:', { branch, user, medicine });
    return;
  }

  const payload = {
    branchId: branch.id,
    userId: user.id,
    totalAmount: medicine.price,
    paymentMethod: 'CASH',
    items: {
      create: [
        {
          medicineId: medicine.id,
          quantity: 1,
          unitPrice: medicine.price,
        }
      ]
    }
  };

  try {
    const sale = await prisma.sale.create({
      data: payload,
      include: {
        items: true
      }
    });
    console.log('Sale created successfully:', sale);
  } catch (err) {
    console.error('Error creating sale:', err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
