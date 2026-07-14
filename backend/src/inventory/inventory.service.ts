import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(branchId?: string, page: number = 1, limit: number = 50, search?: string) {
    const where: any = {
      ...(branchId ? { branchId } : {}),
      ...(search
        ? {
            medicine: {
              OR: [
                { name: { contains: search } },
                { genericName: { contains: search } },
                { barcode: { contains: search } },
              ],
            },
          }
        : {}),
    };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          medicine: {
            include: { category: true, manufacturer: true },
          },
          branch: true,
        },
        orderBy: { medicine: { name: 'asc' } },
      }),
      this.prisma.inventory.count({ where })
    ]);

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getLowStock(threshold = 20, branchId?: string) {
    return this.prisma.inventory.findMany({
      where: { 
        quantity: { lte: threshold },
        ...(branchId ? { branchId } : {})
      },
      take: 200,
      include: {
        medicine: { include: { category: true } },
        branch: true,
      },
      orderBy: { quantity: 'asc' },
    });
  }

  async getExpiring(days = 30, branchId?: string) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.inventory.findMany({
      where: {
        expiryDate: {
          gte: now,
          lte: futureDate,
        },
        ...(branchId ? { branchId } : {})
      },
      take: 200,
      include: {
        medicine: { include: { category: true } },
        branch: true,
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async getExpired(branchId?: string) {
    const now = new Date();
    return this.prisma.inventory.findMany({
      where: {
        expiryDate: { lt: now },
        quantity: { gt: 0 },
        ...(branchId ? { branchId } : {})
      },
      take: 200,
      include: {
        medicine: true,
        branch: true,
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async adjust(medicineId: string, quantity: number, notes: string, branchId: string) {
    if (!branchId) throw new Error('Filial (branchId) tanlanmagan');
    
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new Error('Filial topilmadi');

    let inventory = await this.prisma.inventory.findFirst({
      where: { medicineId, branchId: branch.id },
    });

    if (inventory) {
      inventory = await this.prisma.inventory.update({
        where: { id: inventory.id },
        data: { quantity },
      });
    } else {
      inventory = await this.prisma.inventory.create({
        data: { medicineId, branchId: branch.id, quantity },
      });
    }

    await this.prisma.inventoryTransaction.create({
      data: {
        inventoryId: inventory.id,
        type: 'ADJUSTMENT',
        quantity,
        notes: notes || 'Qo\'lda to\'g\'irlash',
      },
    });

    return inventory;
  }

  async writeOff(medicineId: string, quantity: number, reason: string, branchId: string) {
    if (!branchId) throw new Error('Filial (branchId) tanlanmagan');
    if (quantity <= 0) throw new Error('Yaroqsiz qilib chiqarilayotgan soni 0 dan katta bo\'lishi kerak');
    
    return this.prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findFirst({
        where: { medicineId, branchId }
      });

      if (!inventory) {
        throw new Error('Omborda bunday dori topilmadi');
      }

      const updatedInventory = await tx.inventory.update({
        where: { id: inventory.id },
        data: { quantity: { decrement: quantity } }
      });

      if (updatedInventory.quantity < 0) {
        throw new Error('Omborda hisobdan chiqarish uchun yetarli qoldiq yo\'q');
      }

      await tx.inventoryTransaction.create({
        data: {
          inventoryId: inventory.id,
          type: 'WRITE_OFF',
          quantity: quantity,
          notes: `Spisaniya (Sabab: ${reason})`
        }
      });

      return updatedInventory;
    });
  }

  async getTotalValue(branchId?: string) {
    if (branchId) {
      const result: any = await this.prisma.$queryRaw`
        SELECT COALESCE(SUM(i.quantity * m.price), 0) as total
        FROM Inventory i
        JOIN Medicine m ON i.medicineId = m.id
        WHERE i.quantity > 0 AND i.branchId = ${branchId}
      `;
      return Number(result?.[0]?.total || 0);
    }
    const result: any = await this.prisma.$queryRaw`
      SELECT COALESCE(SUM(i.quantity * m.price), 0) as total
      FROM Inventory i
      JOIN Medicine m ON i.medicineId = m.id
      WHERE i.quantity > 0
    `;
    return Number(result?.[0]?.total || 0);
  }

  async receiveStock(data: {
    medicineId?: string;
    name?: string;
    genericName?: string;
    price: number;
    purchasePrice: number;
    branchId: string;
    quantity: number;
    expiryDate?: string;
    batchNumber?: string;
  }) {
    if (!data.branchId) throw new Error('Filial tanlanmagan');
    let medicineId = data.medicineId;

    if (medicineId) {
      await this.prisma.medicine.update({
        where: { id: medicineId },
        data: {
          price: data.price,
          purchasePrice: data.purchasePrice,
        },
      });
    } else if (data.name) {
      const newMed = await this.prisma.medicine.create({
        data: {
          name: data.name,
          genericName: data.genericName || null,
          price: data.price,
          purchasePrice: data.purchasePrice,
        },
      });
      medicineId = newMed.id;
    } else {
      throw new Error('Dori tanlanmagan yoki nomi kiritilmagan');
    }

    const parsedExpiry = data.expiryDate ? new Date(data.expiryDate) : null;

    let inv = await this.prisma.inventory.findFirst({
      where: { 
        medicineId, 
        branchId: data.branchId,
        ...(data.batchNumber ? { batchNumber: data.batchNumber } : {}),
        ...(parsedExpiry ? { expiryDate: parsedExpiry } : {})
      },
    });

    if (inv) {
      inv = await this.prisma.inventory.update({
        where: { id: inv.id },
        data: {
          quantity: inv.quantity + data.quantity,
          expiryDate: parsedExpiry || inv.expiryDate,
          batchNumber: data.batchNumber || inv.batchNumber,
        },
      });
    } else {
      inv = await this.prisma.inventory.create({
        data: {
          medicineId,
          branchId: data.branchId,
          quantity: data.quantity,
          expiryDate: parsedExpiry,
          batchNumber: data.batchNumber,
        },
      });
    }

    await this.prisma.inventoryTransaction.create({
      data: {
        inventoryId: inv.id,
        type: 'IN',
        quantity: data.quantity,
        notes: `Kirim qilingan (Kelish: ${data.purchasePrice.toLocaleString()} so'm, Sotish: ${data.price.toLocaleString()} so'm)`,
      },
    });

    return inv;
  }
}
