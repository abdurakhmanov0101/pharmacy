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

    // Get default branch and user since auth is not implemented yet
    const branch = await this.prisma.branch.findFirst();
    const user = await this.prisma.user.findFirst();

    if (!branch || !user) {
      throw new HttpException('No branch or user found to assign sale', HttpStatus.INTERNAL_SERVER_ERROR);
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
          // Deduct quantity
          await tx.inventory.update({
            where: { id: inventory.id },
            data: { quantity: { decrement: item.quantity } }
          });
          currentInventoryId = inventory.id;
        } else {
          // Create new inventory with negative quantity
          const newInventory = await tx.inventory.create({
            data: {
              medicineId: item.medicineId,
              branchId: branch.id,
              quantity: -item.quantity
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

  async findAll(limit: number = 100) {
    return this.prisma.sale.findMany({
      take: Number(limit) || 100,
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
