import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async createSale(payload: any) {
    const { items, totalAmount, paymentMethod, customerId, usePoints } = payload;

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
      const currentSession = await tx.cashierSession.findFirst({
        where: { userId: user.id, status: 'OPEN' },
        orderBy: { openedAt: 'desc' },
      });

      if (!currentSession) {
        throw new HttpException('Smena ochilmagan! Iltimos savdoni boshlash uchun smenani oching.', HttpStatus.BAD_REQUEST);
      }

      // Handle Cashback & Points
      let finalAmount = totalAmount;
      let usedPoints = 0;
      let earnedPoints = 0;

      if (customerId) {
        const customer = await tx.customer.findUnique({ where: { id: customerId } });
        if (customer) {
          if (usePoints && customer.loyaltyPoints > 0) {
            // Deduct points up to total amount
            usedPoints = Math.min(customer.loyaltyPoints, totalAmount);
            finalAmount -= usedPoints;

            await tx.customer.update({
              where: { id: customerId },
              data: { loyaltyPoints: { decrement: usedPoints } }
            });

            await tx.loyaltyTransaction.create({
              data: {
                customerId,
                type: 'SPEND',
                points: usedPoints,
                notes: 'To\'lov uchun ishlatildi'
              }
            });
          }

          // Earn 1% cashback on the final paid amount
          if (finalAmount > 0) {
            earnedPoints = Math.floor(finalAmount * 0.01);
            if (earnedPoints > 0) {
              await tx.customer.update({
                where: { id: customerId },
                data: { loyaltyPoints: { increment: earnedPoints } }
              });

              await tx.loyaltyTransaction.create({
                data: {
                  customerId,
                  type: 'EARN',
                  points: earnedPoints,
                  notes: 'Xarid uchun 1% bonus'
                }
              });
            }
          }
        }
      }

      // 1. Create Sale and SaleItems
      const sale = await tx.sale.create({
        data: {
          branchId: branch.id,
          userId: user.id,
          customerId: customerId || null,
          cashierSessionId: currentSession.id,
          totalAmount: finalAmount,
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
      if (finalAmount > 0) {
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
            data: { saleId: sale.id, amount: finalAmount, method: paymentMethod }
          });
        }
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
          const updatedInventory = await tx.inventory.update({
            where: { id: inventory.id },
            data: { quantity: { decrement: item.quantity } }
          });
          
          if (updatedInventory.quantity < 0) {
            throw new HttpException(`Omborda yetarli qoldiq yo'q (Dori ID: ${item.medicineId})`, HttpStatus.BAD_REQUEST);
          }
          currentInventoryId = inventory.id;
        } else {
          throw new HttpException(`Sotilayotgan dori omborda mavjud emas (Dori ID: ${item.medicineId})`, HttpStatus.BAD_REQUEST);
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

      // Link saleId to loyalty transactions
      if (usedPoints > 0 || earnedPoints > 0) {
        await tx.loyaltyTransaction.updateMany({
          where: { customerId, saleId: null },
          data: { saleId: sale.id }
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
