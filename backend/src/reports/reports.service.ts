import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private getDateRange(period: 'daily' | 'weekly' | 'monthly') {
    const now = new Date();
    const start = new Date();

    if (period === 'daily') {
      start.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'monthly') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    }

    return { start, end: now };
  }

  async getSummary(period: 'daily' | 'weekly' | 'monthly') {
    const { start, end } = this.getDateRange(period);
    return this.getSummaryForDates(start, end, period);
  }

  async getCustomSummary(startDate: Date, endDate: Date) {
    return this.getSummaryForDates(startDate, endDate, 'custom');
  }

  private async getSummaryForDates(start: Date, end: Date, period: string) {

    const [salesAgg, salesCount, topMedicines] = await Promise.all([
      this.prisma.sale.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: start, lte: end } },
      }),
      this.prisma.sale.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      this.prisma.saleItem.groupBy({
        by: ['medicineId'],
        _sum: { quantity: true, unitPrice: true },
        _count: { id: true },
        where: { sale: { createdAt: { gte: start, lte: end } } },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
    ]);

    const topMedicinesWithNames = await Promise.all(
      topMedicines.map(async (item) => {
        const medicine = await this.prisma.medicine.findUnique({
          where: { id: item.medicineId },
          select: { name: true, genericName: true, price: true },
        });
        return {
          medicineId: item.medicineId,
          name: medicine?.name || 'Noma\'lum',
          genericName: medicine?.genericName,
          totalQuantity: item._sum.quantity || 0,
          totalRevenue: (item._sum.quantity || 0) * (medicine?.price || 0),
          salesCount: item._count.id,
        };
      }),
    );

    return {
      period,
      startDate: start,
      endDate: end,
      totalRevenue: salesAgg._sum.totalAmount || 0,
      totalSales: salesCount,
      averageSale: salesCount > 0 ? (salesAgg._sum.totalAmount || 0) / salesCount : 0,
      topMedicines: topMedicinesWithNames,
    };
  }

  async getLast7DaysSales() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      const agg = await this.prisma.sale.aggregate({
        _sum: { totalAmount: true },
        _count: { id: true },
        where: { createdAt: { gte: start, lte: end } },
      });

      days.push({
        date: start.toISOString().split('T')[0],
        label: start.toLocaleDateString('uz-UZ', { weekday: 'short', month: 'short', day: 'numeric' }),
        revenue: agg._sum.totalAmount || 0,
        count: agg._count.id,
      });
    }
    return days;
  }

  async getTopMedicines(limit = 10) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const items = await this.prisma.saleItem.groupBy({
      by: ['medicineId'],
      _sum: { quantity: true },
      _count: { id: true },
      where: { sale: { createdAt: { gte: startOfMonth } } },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    return Promise.all(
      items.map(async (item) => {
        const medicine = await this.prisma.medicine.findUnique({
          where: { id: item.medicineId },
          select: { name: true, genericName: true, price: true },
        });
        return {
          name: medicine?.name || 'Noma\'lum',
          genericName: medicine?.genericName,
          totalSold: item._sum.quantity || 0,
          revenue: (item._sum.quantity || 0) * (medicine?.price || 0),
          transactions: item._count.id,
        };
      }),
    );
  }

  async getPaymentMethodStats(period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
    const { start, end } = this.getDateRange(period);

    const sales = await this.prisma.sale.groupBy({
      by: ['paymentMethod'],
      _sum: { totalAmount: true },
      _count: { id: true },
      where: { createdAt: { gte: start, lte: end } },
    });

    return sales.map((s) => ({
      method: s.paymentMethod,
      total: s._sum.totalAmount || 0,
      count: s._count.id,
    }));
  }
}
