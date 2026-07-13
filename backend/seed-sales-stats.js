const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedSalesStats() {
  console.log("🚀 So'nggi 7 kunlik va bugungi real sotuvlar (Sotuv statistikasi) qo'shilmoqda...");

  let branch = await prisma.branch.findFirst();
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        name: 'Markaziy Filial (Chilonzor)',
        address: 'Toshkent sh., Chilonzor tumani',
        contact: '+998 71 200 00 00',
      },
    });
  }

  const medicines = await prisma.medicine.findMany({
    where: { isActive: true },
    take: 30
  });

  if (medicines.length === 0) {
    console.log("⚠️ Dori topilmadi, oldin dorilarni yuklang.");
    return;
  }

  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        username: 'admin',
        password: 'password123',
        role: 'ADMIN',
      },
    });
  }

  // Generate sales for the last 7 days (days -6 to 0)
  for (let d = 6; d >= 0; d--) {
    const dayDate = new Date();
    dayDate.setDate(dayDate.getDate() - d);

    // Number of sales on this day
    const numSales = d === 0 ? 18 : Math.floor(Math.random() * 8) + 10; // today has 18 sales

    for (let s = 0; s < numSales; s++) {
      // Pick 1 to 3 random medicines
      const itemsCount = Math.floor(Math.random() * 3) + 1;
      let totalAmount = 0;
      const saleItemsData = [];

      for (let i = 0; i < itemsCount; i++) {
        const med = medicines[Math.floor(Math.random() * medicines.length)];
        const qty = Math.floor(Math.random() * 3) + 1;
        const linePrice = med.price * qty;
        totalAmount += linePrice;

        saleItemsData.push({
          medicineId: med.id,
          quantity: qty,
          unitPrice: med.price
        });
      }

      // Random hour between 8 and 21
      const saleDate = new Date(dayDate);
      saleDate.setHours(Math.floor(Math.random() * 13) + 8, Math.floor(Math.random() * 59), 0, 0);

      const sale = await prisma.sale.create({
        data: {
          branchId: branch.id,
          userId: user.id,
          totalAmount,
          paymentMethod: Math.random() > 0.4 ? 'CASH' : 'CARD',
          status: 'COMPLETED',
          createdAt: saleDate
        }
      });

      for (const item of saleItemsData) {
        await prisma.saleItem.create({
          data: {
            saleId: sale.id,
            medicineId: item.medicineId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }
        });
      }
    }
  }

  console.log("🎉 SO'NGGI 7 KUNLIK VA BUGUNGI SOTUV STATISTIKALARI MUVAFFAQIYATLI QO'SHILDI!");
}

seedSalesStats()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
