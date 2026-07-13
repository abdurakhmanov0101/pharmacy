const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed10k() {
  console.log("🚀 10,000 ta dori va ombor qoldiqlarini yaratish boshlandi...");

  let branch = await prisma.branch.findFirst();
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        name: 'Markaziy Filial',
        address: 'Toshkent sh., Chilonzor',
        contact: '+998 71 200 00 00',
      },
    });
  }

  const catNames = [
    'Analgetiklar', 'Antibiotiklar', 'Vitaminlar', 'Yurak-qon tomir',
    'Oshqozon-ichak', 'Antigistamin', 'Antiseptiklar', 'Nafas yo\'llari'
  ];
  const catIds = [];
  for (const name of catNames) {
    let cat = await prisma.category.findFirst({ where: { name } });
    if (!cat) {
      cat = await prisma.category.create({ data: { name } });
    }
    catIds.push(cat.id);
  }

  const baseMedicines = [
    "Trimol", "Analgin", "Paracetamol", "Nimesil", "Amoxicillin", "Azithromycin", "Ibuprofen",
    "Omeprazole", "Ciprofloxacin", "Ketorol", "Loratadine", "Cetirizine", "Vitamin C", "Vitamin D3",
    "B-Complex", "Enap", "Prestarium", "Concor", "Pancreatin", "Mezym", "Smecta", "Linex",
    "Enterol", "No-Shpa", "Drotaverine", "Spasmalgon", "Citramon", "Aspirin Cardio", "Trombo ACC",
    "Bisoprolol", "Amlodipine", "Lisinopril", "Losartan", "Atorvastatin", "Rosuvastatin", "Metformin",
    "Gliclazide", "Levothyroxine", "Euthyrox", "L-Thyroxine", "Diclofenac", "Meloxicam", "Celecoxib",
    "Dexamethasone", "Prednisolone", "Suprastin", "Tavegil", "Desloratadine", "Fexofenadine", "Ambroxol"
  ];

  const forms = [
    "100mg №10 tabletka", "500mg №20 tabletka", "250mg 5ml sirop",
    "400mg №14 kapsula", "10mg №30 tabletka", "20mg №28 tabletka",
    "50mg gel 40g", "sprey 15ml", "eritma 2ml №5 ampula", "forte 500mg №10"
  ];

  const totalToGenerate = 10000;
  const batchSize = 100;
  let count = 0;

  for (let b = 0; b < totalToGenerate / batchSize; b++) {
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < batchSize; i++) {
        const idx = b * batchSize + i + 1;
        const base = baseMedicines[idx % baseMedicines.length];
        const form = forms[idx % forms.length];
        const name = `${base} ${form} #${idx}`;
        const barcode = (4780000000000 + idx).toString();
        const price = Math.floor(Math.random() * 80 + 10) * 1000;
        const purchasePrice = Math.floor(price * 0.75);
        const categoryId = catIds[idx % catIds.length];

        const med = await tx.medicine.upsert({
          where: { barcode },
          update: { price, purchasePrice },
          create: {
            name,
            genericName: base,
            barcode,
            price,
            purchasePrice,
            dosage: form,
            categoryId,
            isActive: true,
          },
        });

        const existingInv = await tx.inventory.findFirst({
          where: { medicineId: med.id, branchId: branch.id },
        });

        if (!existingInv) {
          await tx.inventory.create({
            data: {
              medicineId: med.id,
              branchId: branch.id,
              quantity: Math.floor(Math.random() * 150) + 20,
            },
          });
        }
      }
    });
    count += batchSize;
    if (count % 1000 === 0) {
      console.log(`✅ ${count} / 10000 dori qo'shildi...`);
    }
  }

  console.log("🎉 BARCHA 10,000 TA DORI VA OMBOR QOLDIQLARI BAZAGA QO'SHILDI!");
}

seed10k()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
