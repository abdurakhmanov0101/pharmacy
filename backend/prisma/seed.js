const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo data...');

  // ─── ROLLAR ───────────────────────────────────────────────
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Tizim administratori' },
  });
  const managerRole = await prisma.role.upsert({
    where: { name: 'MANAGER' },
    update: {},
    create: { name: 'MANAGER', description: 'Menejr' },
  });
  const cashierRole = await prisma.role.upsert({
    where: { name: 'CASHIER' },
    update: {},
    create: { name: 'CASHIER', description: 'Kassir / Sotuvchi' },
  });
  const pharmacistRole = await prisma.role.upsert({
    where: { name: 'PHARMACIST' },
    update: {},
    create: { name: 'PHARMACIST', description: 'Farmatsevt' },
  });

  console.log('✅ Rollar yaratildi');

  // ─── FILIAL ───────────────────────────────────────────────
  const branch = await prisma.branch.upsert({
    where: { id: 'demo-branch-001' },
    update: {},
    create: {
      id: 'demo-branch-001',
      name: 'Markaziy Dorixona №1',
      address: "Toshkent, Chilonzor ko'chasi 12",
      contact: '+998 71 123 45 67',
      isActive: true,
    },
  });

  console.log('✅ Filial yaratildi');

  // ─── FOYDALANUVCHILAR ─────────────────────────────────────
  const users = [
    {
      id: 'demo-admin-001',
      email: 'admin@apteka.uz',
      password: 'Admin1234',
      firstName: 'Admin',
      lastName: 'Rahimov',
      roleId: adminRole.id,
    },
    {
      id: 'demo-manager-001',
      email: 'manager@apteka.uz',
      password: 'Manager123',
      firstName: 'Sardor',
      lastName: 'Karimov',
      roleId: managerRole.id,
    },
    {
      id: 'demo-cashier-001',
      email: 'sotuvchi1@apteka.uz',
      password: 'Sotuvchi1',
      firstName: 'Aziz',
      lastName: 'Toshmatov',
      roleId: cashierRole.id,
    },
    {
      id: 'demo-cashier-002',
      email: 'sotuvchi2@apteka.uz',
      password: 'Sotuvchi2',
      firstName: 'Malika',
      lastName: 'Yusupova',
      roleId: cashierRole.id,
    },
    {
      id: 'demo-pharmacist-001',
      email: 'farmatsevt@apteka.uz',
      password: 'Farma123',
      firstName: 'Dilnoza',
      lastName: 'Nazarova',
      roleId: pharmacistRole.id,
    },
  ];

  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { id: u.id },
      update: { password: hashed, mustChangePassword: false },
      create: {
        id: u.id,
        email: u.email,
        password: hashed,
        firstName: u.firstName,
        lastName: u.lastName,
        roleId: u.roleId,
        branchId: branch.id,
        mustChangePassword: false,
      },
    });
  }

  console.log('✅ Foydalanuvchilar yaratildi');

  // ─── KATEGORIYALAR ────────────────────────────────────────
  const categories = [
    { id: 'cat-001', name: 'Antibiotiklar' },
    { id: 'cat-002', name: 'Vitaminalr' },
    { id: 'cat-003', name: 'Og\'riq qoldiruvchilar' },
    { id: 'cat-004', name: 'Yurak-tomir' },
    { id: 'cat-005', name: 'Qon bosimi' },
    { id: 'cat-006', name: 'Shamollash' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name },
    });
  }

  console.log('✅ Kategoriyalar yaratildi');

  // ─── DORILAR + OMBOR ─────────────────────────────────────
  const medicines = [
    { id: 'med-001', name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', price: 12500, dosage: 'Kapsul', barcode: '4600000000001', categoryId: 'cat-001', mxikCode: '06903001001000000', nds: 12, qty: 150 },
    { id: 'med-002', name: 'Augmentin 625mg', genericName: 'Amoxicillin+Clavulanate', price: 45000, dosage: 'Tabletka', barcode: '4600000000002', categoryId: 'cat-001', mxikCode: '06903001001000001', nds: 12, qty: 80 },
    { id: 'med-003', name: 'Vitamin C 500mg', genericName: 'Ascorbic acid', price: 8500, dosage: 'Tabletka', barcode: '4600000000003', categoryId: 'cat-002', mxikCode: '06903001002000000', nds: 12, qty: 200 },
    { id: 'med-004', name: 'Complivit', genericName: 'Multivitamin', price: 32000, dosage: 'Tabletka', barcode: '4600000000004', categoryId: 'cat-002', mxikCode: '06903001002000001', nds: 12, qty: 60 },
    { id: 'med-005', name: 'Paracetamol 500mg', genericName: 'Paracetamol', price: 3500, dosage: 'Tabletka', barcode: '4600000000005', categoryId: 'cat-003', mxikCode: '06903001003000000', nds: 12, qty: 300 },
    { id: 'med-006', name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', price: 7500, dosage: 'Tabletka', barcode: '4600000000006', categoryId: 'cat-003', mxikCode: '06903001003000001', nds: 12, qty: 180 },
    { id: 'med-007', name: 'No-Spa 40mg', genericName: 'Drotaverine', price: 15000, dosage: 'Tabletka', barcode: '4600000000007', categoryId: 'cat-003', mxikCode: '06903001003000002', nds: 12, qty: 120 },
    { id: 'med-008', name: 'Enalapril 10mg', genericName: 'Enalapril', price: 18000, dosage: 'Tabletka', barcode: '4600000000008', categoryId: 'cat-005', mxikCode: '06903001005000000', nds: 12, qty: 90 },
    { id: 'med-009', name: 'Amlodipine 5mg', genericName: 'Amlodipine', price: 22000, dosage: 'Tabletka', barcode: '4600000000009', categoryId: 'cat-005', mxikCode: '06903001005000001', nds: 12, qty: 75 },
    { id: 'med-010', name: 'Aspirin 100mg', genericName: 'Acetylsalicylic acid', price: 5500, dosage: 'Tabletka', barcode: '4600000000010', categoryId: 'cat-004', mxikCode: '06903001004000000', nds: 12, qty: 250 },
    { id: 'med-011', name: 'Nurofen 200mg', genericName: 'Ibuprofen', price: 25000, dosage: 'Tabletka', barcode: '4600000000011', categoryId: 'cat-003', mxikCode: '06903001003000003', nds: 12, qty: 110 },
    { id: 'med-012', name: 'Theraflu', genericName: 'Paracetamol+Pheniramine', price: 18500, dosage: 'Kukun', barcode: '4600000000012', categoryId: 'cat-006', mxikCode: '06903001006000000', nds: 12, qty: 95 },
    { id: 'med-013', name: 'Strepsils', genericName: 'Amylmetacresol', price: 35000, dosage: 'Pastilka', barcode: '4600000000013', categoryId: 'cat-006', mxikCode: '06903001006000001', nds: 12, qty: 130 },
    { id: 'med-014', name: 'Ciprofloxacin 500mg', genericName: 'Ciprofloxacin', price: 28000, dosage: 'Tabletka', barcode: '4600000000014', categoryId: 'cat-001', mxikCode: '06903001001000002', nds: 12, qty: 60 },
    { id: 'med-015', name: 'Metronidazol 400mg', genericName: 'Metronidazole', price: 9500, dosage: 'Tabletka', barcode: '4600000000015', categoryId: 'cat-001', mxikCode: '06903001001000003', nds: 12, qty: 140 },
  ];

  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 2);

  const categoryMap = {};
  for (const cat of categories) {
    const found = await prisma.category.findFirst({ where: { name: cat.name } });
    if (found) categoryMap[cat.id] = found.id;
  }

  for (const m of medicines) {
    const { qty, categoryId, ...medData } = m;
    const resolvedCatId = categoryMap[categoryId];
    await prisma.medicine.upsert({
      where: { id: medData.id },
      update: { price: medData.price },
      create: { ...medData, categoryId: resolvedCatId },
    });

    const existingInv = await prisma.inventory.findFirst({
      where: { medicineId: medData.id, branchId: branch.id },
    });

    if (!existingInv) {
      await prisma.inventory.create({
        data: {
          medicineId: medData.id,
          branchId: branch.id,
          quantity: qty,
          expiryDate,
          batchNumber: `BATCH-${medData.id.toUpperCase()}`,
        },
      });
    }
  }

  console.log('✅ 15 ta dori va ombor yaratildi');

  // ─── MIJOZLAR ─────────────────────────────────────────────
  const customers = [
    { id: 'cust-001', name: 'Bobur Aliyev', phone: '+998901234567', loyaltyPoints: 150 },
    { id: 'cust-002', name: 'Nilufar Hasanova', phone: '+998907654321', loyaltyPoints: 320 },
    { id: 'cust-003', name: 'Jasur Mirzayev', phone: '+998909876543', loyaltyPoints: 75 },
  ];

  for (const c of customers) {
    await prisma.customer.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }

  console.log('✅ Namuna mijozlar yaratildi');
  console.log('\n🎉 Seed muvaffaqiyatli yakunlandi!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('DEMO AKKAUNTLAR:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  users.forEach(u => {
    console.log(`${u.firstName} ${u.lastName} | ${u.email} | ${u.password}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
