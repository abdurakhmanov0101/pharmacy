import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Branch
  const mainBranch = await prisma.branch.create({
    data: {
      name: 'Main Pharmacy Tashkent',
      address: 'Amir Temur Street 15',
      contact: '+998901234567',
    },
  });

  // Create User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@pharmauz.com',
      password: 'hashedpassword',
      firstName: 'Admin',
      lastName: 'User',
      branchId: mainBranch.id,
    },
  });

  // Create Categories
  const antibiotics = await prisma.category.create({ data: { name: 'Antibiotics' } });
  const painkillers = await prisma.category.create({ data: { name: 'Painkillers' } });
  const vitamins = await prisma.category.create({ data: { name: 'Vitamins' } });

  // Create Manufacturers
  const uzpharma = await prisma.manufacturer.create({ data: { name: 'UzPharma' } });
  const bayer = await prisma.manufacturer.create({ data: { name: 'Bayer' } });

  // Create Medicines
  const med1 = await prisma.medicine.create({
    data: {
      name: 'Amoxicillin',
      genericName: 'Amoxicillin 500mg',
      price: 15000,
      dosage: '500mg',
      categoryId: antibiotics.id,
      manufacturerId: uzpharma.id,
      barcode: '123456789012',
    },
  });

  const med2 = await prisma.medicine.create({
    data: {
      name: 'Paracetamol',
      genericName: 'Paracetamol 500mg',
      price: 5000,
      dosage: '500mg',
      categoryId: painkillers.id,
      manufacturerId: uzpharma.id,
      barcode: '987654321098',
    },
  });

  const med3 = await prisma.medicine.create({
    data: {
      name: 'Vitamin C',
      genericName: 'Ascorbic Acid',
      price: 12000,
      dosage: '1000mg',
      categoryId: vitamins.id,
      manufacturerId: bayer.id,
      barcode: '456123789012',
    },
  });

  // Create Inventory
  await prisma.inventory.create({
    data: {
      medicineId: med1.id,
      branchId: mainBranch.id,
      quantity: 150,
      batchNumber: 'A-100',
      expiryDate: new Date('2027-05-01'),
    },
  });

  await prisma.inventory.create({
    data: {
      medicineId: med2.id,
      branchId: mainBranch.id,
      quantity: 500,
      batchNumber: 'P-200',
      expiryDate: new Date('2026-08-01'), // Expiring soon
    },
  });

  await prisma.inventory.create({
    data: {
      medicineId: med3.id,
      branchId: mainBranch.id,
      quantity: 10, // Low stock
      batchNumber: 'V-300',
      expiryDate: new Date('2028-01-01'),
    },
  });

  // Create a Sale
  const sale = await prisma.sale.create({
    data: {
      branchId: mainBranch.id,
      userId: adminUser.id,
      totalAmount: 35000,
      paymentMethod: 'CARD',
      status: 'COMPLETED',
    },
  });

  await prisma.saleItem.create({
    data: {
      saleId: sale.id,
      medicineId: med1.id,
      quantity: 1,
      unitPrice: 15000,
    },
  });

  await prisma.saleItem.create({
    data: {
      saleId: sale.id,
      medicineId: med2.id,
      quantity: 4,
      unitPrice: 5000,
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
