import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const [
      salesToday,
      ordersCount,
      lowStockCount,
      totalInventoryValue,
      expiringSoon,
      last7Days,
      topMedicines,
      monthlySales,
    ] = await Promise.all([
      // Today's revenue
      this.prisma.sale.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: today } },
      }),
      // Today's order count
      this.prisma.sale.count({
        where: { createdAt: { gte: today } },
      }),
      // Low stock count (<=20)
      this.prisma.inventory.count({
        where: { quantity: { lte: 20 } },
      }),
      // Real inventory value = sum(quantity * price)
      this.prisma.$queryRaw<[{ total: number }]>`
        SELECT COALESCE(SUM(i.quantity * m.price), 0) as total
        FROM Inventory i
        JOIN Medicine m ON i.medicineId = m.id
        WHERE i.quantity > 0
      `.then((res) => Number(res?.[0]?.total || 0)),
      // Expiring within 30 days
      this.prisma.inventory.findMany({
        where: {
          expiryDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        include: { medicine: true },
        take: 6,
        orderBy: { expiryDate: 'asc' },
      }),
      // Last 7 days chart data
      Promise.all(
        Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          const start = new Date(date);
          start.setHours(0, 0, 0, 0);
          const end = new Date(date);
          end.setHours(23, 59, 59, 999);
          return this.prisma.sale
            .aggregate({
              _sum: { totalAmount: true },
              _count: { id: true },
              where: { createdAt: { gte: start, lte: end } },
            })
            .then((agg) => ({
              date: start.toISOString().split('T')[0],
              label: start.toLocaleDateString('uz-UZ', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              }),
              revenue: agg._sum.totalAmount || 0,
              count: agg._count.id,
            }));
        }),
      ),
      // Top 5 medicines this month
      this.prisma.saleItem
        .groupBy({
          by: ['medicineId'],
          _sum: { quantity: true },
          where: { sale: { createdAt: { gte: thisMonthStart } } },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 5,
        })
        .then(async (items) =>
          Promise.all(
            items.map(async (item) => {
              const med = await this.prisma.medicine.findUnique({
                where: { id: item.medicineId },
                select: { name: true, price: true },
              });
              return {
                name: med?.name || 'Noma\'lum',
                totalSold: item._sum.quantity || 0,
                revenue: (item._sum.quantity || 0) * (med?.price || 0),
              };
            }),
          ),
        ),
      // This month sales
      this.prisma.sale.aggregate({
        _sum: { totalAmount: true },
        _count: { id: true },
        where: { createdAt: { gte: thisMonthStart } },
      }),
    ]);

    return {
      todaysSales: salesToday._sum.totalAmount || 0,
      orders: ordersCount,
      lowStockItems: lowStockCount,
      totalInventoryValue,
      monthlyRevenue: monthlySales._sum.totalAmount || 0,
      monthlySalesCount: monthlySales._count.id,
      expiringSoon: expiringSoon.map((item) => ({
        id: item.id,
        name: item.medicine.name,
        batch: item.batchNumber,
        qty: item.quantity,
        expiry: item.expiryDate,
      })),
      chartData: last7Days,
      topMedicines,
    };
  }
}
