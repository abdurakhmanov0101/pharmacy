import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class MedicinesService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, limit: number = 300) {
    const where: any = search
      ? {
          OR: [
            { name: { contains: search } },
            { genericName: { contains: search } },
            { barcode: { contains: search } },
          ],
        }
      : undefined;

    return this.prisma.medicine.findMany({
      where,
      take: Number(limit) || 300,
      include: {
        category: true,
        manufacturer: true,
        inventory: true,
      },
      orderBy: { name: 'asc' }
    });
  }

  async create(data: any) {
    if (data.price) data.price = Number(data.price);
    if (data.purchasePrice) data.purchasePrice = Number(data.purchasePrice);
    
    return this.prisma.medicine.create({
      data,
    });
  }

  async createMany(data: any[]) {
    const formattedData = data.map(item => ({
      ...item,
      price: item.price ? Number(item.price) : 0,
      barcode: item.barcode === '' || item.barcode === 'undefined' ? null : String(item.barcode).trim(),
      quantity: item.quantity ? Number(item.quantity) : 0,
      name: String(item.name || '').trim(),
    }));

    console.log('Received payload formatted:', JSON.stringify(formattedData, null, 2));

    let successCount = 0;
    let updatedCount = 0;
    let createdCount = 0;
    const branch = await this.prisma.branch.findFirst();
    const results: any[] = [];

    for (const item of formattedData) {
      if (!item.name) continue;
      try {
        let medicine = null;

        if (item.barcode) {
          medicine = await this.prisma.medicine.findUnique({ where: { barcode: item.barcode } });
        }

        if (!medicine && item.name) {
          // Case insensitive search
          const allMedicines = await this.prisma.medicine.findMany({
            where: { name: { contains: item.name } }
          });
          medicine = allMedicines.find(
            m => m.name.toLowerCase().trim() === item.name.toLowerCase().trim()
          ) || null;
        }

        if (!medicine) {
          let categoryId = null;
          if (item.categoryName) {
            let category = await this.prisma.category.findFirst({
              where: { name: { contains: item.categoryName } }
            });
            if (!category) {
              category = await this.prisma.category.create({
                data: { name: item.categoryName }
              });
            }
            categoryId = category.id;
          }

          medicine = await this.prisma.medicine.create({
            data: {
              name: item.name,
              genericName: item.genericName || null,
              categoryId: categoryId,
              price: item.price,
              dosage: item.dosage || null,
              barcode: item.barcode || null,
            }
          });
          createdCount++;
        } else {
          let updatedData: any = {};
          
          if (item.price && item.price !== medicine.price) {
            updatedData.price = item.price;
          }

          if (!medicine.categoryId && item.categoryName) {
            let category = await this.prisma.category.findFirst({
              where: { name: { contains: item.categoryName } }
            });
            if (!category) {
              category = await this.prisma.category.create({
                data: { name: item.categoryName }
              });
            }
            updatedData.categoryId = category.id;
          }

          if (Object.keys(updatedData).length > 0) {
            medicine = await this.prisma.medicine.update({
              where: { id: medicine.id },
              data: updatedData
            });
            updatedCount++;
          } else {
            updatedCount++;
          }
        }

        if (item.quantity > 0 && branch) {
          let inventory = await this.prisma.inventory.findFirst({
            where: { medicineId: medicine.id, branchId: branch.id }
          });

          const oldQty = inventory?.quantity ?? 0;

          if (inventory) {
            inventory = await this.prisma.inventory.update({
              where: { id: inventory.id },
              data: { quantity: { increment: item.quantity } }
            });
          } else {
            inventory = await this.prisma.inventory.create({
              data: {
                medicineId: medicine.id,
                branchId: branch.id,
                quantity: item.quantity
              }
            });
          }

          await this.prisma.inventoryTransaction.create({
            data: {
              inventoryId: inventory.id,
              type: 'IN',
              quantity: item.quantity,
              notes: `Excel orqali yuklandi: ${oldQty} + ${item.quantity} = ${oldQty + item.quantity}`
            }
          });
        }

        successCount++;
      } catch (err) {
        console.error('Error importing item:', item.name, err);
      }
    }
    return { count: successCount, created: createdCount, updated: updatedCount };
  }

  async update(id: string, data: any) {
    if (data.price) data.price = Number(data.price);
    if (data.purchasePrice) data.purchasePrice = Number(data.purchasePrice);

    return this.prisma.medicine.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.medicine.delete({
      where: { id },
    });
  }

  async findByBarcode(barcode: string) {
    return this.prisma.medicine.findUnique({
      where: { barcode },
      include: {
        category: true,
        manufacturer: true,
        inventory: true,
      },
    });
  }

  async seed10k() {
    let branch = await this.prisma.branch.findFirst();
    if (!branch) {
      branch = await this.prisma.branch.create({
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
    const catIds: string[] = [];
    for (const name of catNames) {
      let cat = await this.prisma.category.findFirst({ where: { name } });
      if (!cat) {
        cat = await this.prisma.category.create({ data: { name } });
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
    const batchSize = 500;
    let count = 0;

    for (let b = 0; b < totalToGenerate / batchSize; b++) {
      await this.prisma.$transaction(async (tx) => {
        for (let i = 0; i < batchSize; i++) {
          const idx = b * batchSize + i + 1;
          const base = baseMedicines[idx % baseMedicines.length];
          const form = forms[idx % forms.length];
          const name = `${base} ${form} #${idx}`;
          const barcode = (4780000000000 + idx).toString();
          const price = Math.floor(Math.random() * 80 + 10) * 1000;
          const purchasePrice = Math.floor(price * 0.75);
          const categoryId = catIds[idx % catIds.length];

          // Upsert medicine by barcode
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

          // Check if inventory exists
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
    }

    return { success: true, seededCount: count };
  }
}
