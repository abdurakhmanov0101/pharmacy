import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(branchId?: string) {
    return this.prisma.inventory.findMany({
      where: branchId ? { branchId } : undefined,
      include: {
        medicine: {
          include: { category: true, manufacturer: true },
        },
        branch: true,
      },
      orderBy: { medicine: { name: 'asc' } },
    });
  }

  async getLowStock(threshold = 20, branchId?: string) {
    return this.prisma.inventory.findMany({
      where: { 
        quantity: { lte: threshold },
        ...(branchId ? { branchId } : {})
      },
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

  async getTotalValue(branchId?: string) {
    const inventories = await this.prisma.inventory.findMany({
      where: { 
        quantity: { gt: 0 },
        ...(branchId ? { branchId } : {})
      },
      include: { medicine: true },
    });

    return inventories.reduce((sum, inv) => {
      return sum + inv.quantity * (inv.medicine.price || 0);
    }, 0);
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

    let inv = await this.prisma.inventory.findFirst({
      where: { medicineId, branchId: data.branchId },
    });

    const parsedExpiry = data.expiryDate ? new Date(data.expiryDate) : null;

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
