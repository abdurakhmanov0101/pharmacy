const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAll() {
  console.log("🚀 Barcha bo'limlarga default ma'lumotlar qo'shish (Xodimlar, Oyliklar, Chiqimlar, Dorilar) boshlandi...");

  let branch = await prisma.branch.findFirst();
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        name: 'Markaziy Filial (Chilonzor)',
        address: 'Toshkent sh., Chilonzor tumani, Bunyodkor ko\'chasi 24',
        contact: '+998 71 200 00 00',
      },
    });
  }

  // 1. 10 ta xodim qo'shish
  console.log("👥 10 ta xodim qo'shilmoqda...");
  const employeesData = [
    { fullName: 'Abdurahmonov Azizbek', position: 'Bosh Farmatsevt', salary: 6500000, contactInfo: '+998 90 123 45 67', shiftStart: '08:00', shiftEnd: '17:00' },
    { fullName: 'Karimova Malika', position: 'Farmatsevt', salary: 4500000, contactInfo: '+998 91 234 56 78', shiftStart: '08:00', shiftEnd: '17:00' },
    { fullName: 'Rustamov Jasur', position: 'Farmatsevt', salary: 4500000, contactInfo: '+998 93 345 67 89', shiftStart: '16:00', shiftEnd: '23:00' },
    { fullName: 'Usmonova Shahnoza', position: 'Kassir', salary: 3800000, contactInfo: '+998 94 456 78 90', shiftStart: '08:00', shiftEnd: '17:00' },
    { fullName: 'Aliyev Bekzod', position: 'Ombor Mudiri', salary: 5200000, contactInfo: '+998 97 567 89 01', shiftStart: '09:00', shiftEnd: '18:00' },
    { fullName: 'Saidova Nigora', position: 'Kassir', salary: 3800000, contactInfo: '+998 99 678 90 12', shiftStart: '16:00', shiftEnd: '23:00' },
    { fullName: 'Xoliqov Sherzod', position: 'Tungi Farmatsevt', salary: 5000000, contactInfo: '+998 90 789 01 23', shiftStart: '22:00', shiftEnd: '08:00' },
    { fullName: 'Murodova Gulnoza', position: 'Katta Farmatsevt', salary: 5500000, contactInfo: '+998 91 890 12 34', shiftStart: '08:00', shiftEnd: '17:00' },
    { fullName: 'Toshmatov Dilshod', position: 'Logist & Ekspeditor', salary: 4000000, contactInfo: '+998 93 901 23 45', shiftStart: '09:00', shiftEnd: '18:00' },
    { fullName: 'Yusupova Dildora', position: 'Farmatsevt-Stajyor', salary: 2800000, contactInfo: '+998 94 012 34 56', shiftStart: '09:00', shiftEnd: '15:00' }
  ];

  const createdEmployees = [];
  for (const emp of employeesData) {
    let existing = await prisma.employee.findFirst({ where: { fullName: emp.fullName } });
    if (!existing) {
      existing = await prisma.employee.create({ data: { ...emp, status: 'ACTIVE' } });
    }
    createdEmployees.push(existing);
  }

  // 2. Xodimlarga Oylik va Avans to'lovlari kiritish (Payroll + Expense)
  console.log("💰 Xodimlarga oylik va avans to'lovlari (izohi bilan) yozilmoqda...");
  const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-07"
  const prevMonth = "2026-06";

  const payrollPayments = [
    { empIdx: 0, type: 'TO_LIQ', amount: 6500000, month: prevMonth, notes: "Iyun oyi uchun to'liq oylik maosh" },
    { empIdx: 1, type: 'AVANS', amount: 2000000, month: currentMonth, notes: "Iyul oyi 1-qism avans to'lovi" },
    { empIdx: 2, type: 'AVANS', amount: 1800000, month: currentMonth, notes: "Iyul oyi avansi (shaxsiy arizaga asosan)" },
    { empIdx: 3, type: 'TO_LIQ', amount: 3800000, month: prevMonth, notes: "Iyun oyi oyligi to'liq berildi" },
    { empIdx: 4, type: 'AVANS', amount: 2500000, month: currentMonth, notes: "Iyul oyi uchun avans to'lov" },
  ];

  for (const item of payrollPayments) {
    const emp = createdEmployees[item.empIdx];
    if (!emp) continue;

    // Create Payroll entry
    const existingPayroll = await prisma.payroll.findFirst({
      where: { employeeId: emp.id, month: item.month }
    });

    if (existingPayroll) {
      await prisma.payroll.update({
        where: { id: existingPayroll.id },
        data: {
          netSalary: existingPayroll.netSalary + item.amount,
          isPaid: true,
          notes: item.notes
        }
      });
    } else {
      await prisma.payroll.create({
        data: {
          employeeId: emp.id,
          month: item.month,
          baseSalary: emp.salary,
          netSalary: item.amount,
          isPaid: true,
          notes: `${item.type}: ${item.notes}`
        }
      });
    }

    // Create Expense automatically
    await prisma.expense.create({
      data: {
        title: `${item.type === 'AVANS' ? 'Avans' : 'To\'liq Oylik'}: ${emp.fullName}`,
        category: item.type === 'AVANS' ? 'AVANS' : 'OYLIK',
        amount: item.amount,
        employeeId: emp.id,
        notes: `${item.notes} (${item.month})`
      }
    });
  }

  // 3. Operational Chiqimlar qo'shish (Ijara, Kommunal, Transport)
  console.log("🏢 Operatsion chiqimlar (Ijara, Kommunal, Transport) qo'shilmoqda...");
  const operationalExpenses = [
    { title: "Dorixona ijarasi (Iyul 2026)", category: "IJARA", amount: 15000000, notes: "Oylik ijara to'lovi (Chilonzor filial)" },
    { title: "Elektr energiyasi va suv (Iyul)", category: "KOMMUNAL", amount: 2400000, notes: "Hududiy elektr tarmoqlari to'lovi" },
    { title: "Dorilarni ombordan tashib kelish", category: "TRANSPORT", amount: 850000, notes: "Yuk mashinasi xizmati" },
    { title: "Instagram & Telegram reklama", category: "REKLAMA", amount: 1200000, notes: "Targeting va kanallar reklamasi" }
  ];

  for (const exp of operationalExpenses) {
    await prisma.expense.create({ data: exp });
  }

  // 4. 1000 ta qo'shimcha dori va ombor qoldig'i qo'shish
  console.log("💊 1000 xil qo'shimcha dori va ombor qoldig'i qo'shilmoqda...");
  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({ data: { name: 'Umumiy Dorilar' } });
  }

  const batchSize = 100;
  for (let b = 0; b < 10; b++) {
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < batchSize; i++) {
        const idx = b * batchSize + i + 1;
        const barcode = (4789999000000 + idx).toString();
        const price = Math.floor(Math.random() * 90 + 15) * 1000;
        const purchasePrice = Math.floor(price * 0.75);

        const med = await tx.medicine.upsert({
          where: { barcode },
          update: { price, purchasePrice },
          create: {
            name: `FarmaPro Dori-Vositasi #${idx}`,
            genericName: `FarmaSubstance #${idx}`,
            barcode,
            price,
            purchasePrice,
            dosage: `500mg №${(i % 3 + 1) * 10}`,
            categoryId: category.id,
            isActive: true
          }
        });

        const existingInv = await tx.inventory.findFirst({
          where: { medicineId: med.id, branchId: branch.id }
        });

        if (!existingInv) {
          await tx.inventory.create({
            data: {
              medicineId: med.id,
              branchId: branch.id,
              quantity: Math.floor(Math.random() * 120) + 30
            }
          });
        }
      }
    });
  }

  console.log("🎉 BARCHA DEFAULT MA'LUMOTLAR (10 TA XODIM, OYLIKLAR, CHIQIMLAR VA DORILAR) QO'SHILDI!");
}

seedAll()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
