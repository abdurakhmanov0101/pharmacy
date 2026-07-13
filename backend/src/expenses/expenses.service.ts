import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.expense.findMany({
      orderBy: { date: 'desc' },
    });
  }

  async create(data: {
    title: string;
    category: string;
    amount: number;
    employeeId?: string;
    branchId?: string;
    notes?: string;
  }) {
    return this.prisma.expense.create({
      data: {
        title: data.title,
        category: data.category || 'BOSHQA',
        amount: Number(data.amount),
        employeeId: data.employeeId || null,
        branchId: data.branchId || null,
        notes: data.notes || null,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.expense.delete({
      where: { id },
    });
  }

  async getFinancialSummary() {
    const allSales = await this.prisma.sale.findMany({
      where: { status: 'COMPLETED' },
      include: {
        items: {
          include: { medicine: true },
        },
      },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let totalRevenue = 0;
    let todayRevenue = 0;
    let totalCostOfGoods = 0;

    for (const sale of allSales) {
      totalRevenue += sale.totalAmount;
      if (new Date(sale.createdAt) >= todayStart) {
        todayRevenue += sale.totalAmount;
      }
      for (const item of sale.items) {
        const purchasePrice = item.medicine?.purchasePrice || 0;
        totalCostOfGoods += item.quantity * purchasePrice;
      }
    }

    const allExpenses = await this.prisma.expense.findMany();
    const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);

    const netProfit = totalRevenue - totalCostOfGoods - totalExpenses;

    // Group expenses by category
    const categoryMap: Record<string, number> = {};
    for (const exp of allExpenses) {
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
    }

    return {
      totalRevenue,
      todayRevenue,
      totalCostOfGoods,
      totalExpenses,
      netProfit,
      expensesByCategory: categoryMap,
    };
  }
}
