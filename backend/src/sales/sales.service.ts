import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async createSale(payload: any) {
    const { items, totalAmount, paymentMethod } = payload;

    if (!items || items.length === 0) {
      throw new HttpException('Cart is empty', HttpStatus.BAD_REQUEST);
    }

    // Get default branch and user or create fallback if missing
    let branch = await this.prisma.branch.findFirst();
    if (!branch) {
      branch = await this.prisma.branch.create({
        data: {
          name: 'Asosiy Apteka Filiali',
          address: 'Toshkent',
          contact: '+998900000000',
        },
      });
    }

    let user = await this.prisma.user.findFirst();
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: 'admin@pharmauz.com',
          password: 'hashedpassword',
          firstName: 'Admin',
          lastName: 'User',
          branchId: branch.id,
        },
      });
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Sale and SaleItems
      const sale = await tx.sale.create({
        data: {
          branchId: branch.id,
          userId: user.id,
          totalAmount,
          paymentMethod,
          items: {
            create: items.map((item: any) => ({
              medicineId: item.medicineId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            }))
          }
        },
        include: {
          items: true
        }
      });

      // 1.5 Create Payment records
      if (paymentMethod === 'MIXED' && payload.splitPayments) {
        if (payload.splitPayments.cash > 0) {
          await tx.payment.create({
            data: { saleId: sale.id, amount: payload.splitPayments.cash, method: 'CASH' }
          });
        }
        if (payload.splitPayments.card > 0) {
          await tx.payment.create({
            data: { saleId: sale.id, amount: payload.splitPayments.card, method: 'CARD' }
          });
        }
      } else {
        await tx.payment.create({
          data: { saleId: sale.id, amount: totalAmount, method: paymentMethod }
        });
      }

      // 2. Deduct Inventory and Log Transactions
      for (const item of items) {
        // Find existing inventory record
        const inventory = await tx.inventory.findFirst({
          where: {
            medicineId: item.medicineId,
            branchId: branch.id,
          }
        });

        let currentInventoryId;

        if (inventory) {
          const newQty = Math.max(0, inventory.quantity - item.quantity);
          await tx.inventory.update({
            where: { id: inventory.id },
            data: { quantity: newQty }
          });
          currentInventoryId = inventory.id;
        } else {
          const newInventory = await tx.inventory.create({
            data: {
              medicineId: item.medicineId,
              branchId: branch.id,
              quantity: 0
            }
          });
          currentInventoryId = newInventory.id;
        }

        // Create transaction log
        await tx.inventoryTransaction.create({
          data: {
            inventoryId: currentInventoryId,
            type: 'OUT',
            quantity: item.quantity,
            notes: `Sotuv orqali (ID: ${sale.id.slice(0,8)})`
          }
        });
      }

      return sale;
    });
  }

  async findAll(limit: number = 500) {
    return this.prisma.sale.findMany({
      take: Number(limit) || 500,
      include: {
        items: {
          include: {
            medicine: true
          }
        },
        user: true,
        branch: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
