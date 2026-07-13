import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  async create(createPayrollDto: any) {
    const payroll = await this.prisma.payroll.create({ data: createPayrollDto });
    // Also create Expense if it's paid or has amount
    if (createPayrollDto.netSalary > 0) {
      const emp = await this.prisma.employee.findUnique({ where: { id: createPayrollDto.employeeId } });
      await this.prisma.expense.create({
        data: {
          title: `Xodim oyligi: ${emp?.fullName || 'Xodim'} (${createPayrollDto.month || ''})`,
          category: 'OYLIK',
          amount: Number(createPayrollDto.netSalary),
          employeeId: createPayrollDto.employeeId,
          notes: createPayrollDto.notes || 'Oylik to\'lov',
        },
      });
    }
    return payroll;
  }

  async paySalary(data: {
    employeeId: string;
    type: 'AVANS' | 'TO_LIQ';
    amount: number;
    month?: string;
    notes?: string;
  }) {
    const emp = await this.prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!emp) throw new Error("Xodim topilmadi");

    const monthStr = data.month || new Date().toISOString().slice(0, 7);

    // Create Expense automatically
    const expense = await this.prisma.expense.create({
      data: {
        title: `${data.type === 'AVANS' ? 'Avans' : 'To\'liq Oylik'}: ${emp.fullName}`,
        category: data.type === 'AVANS' ? 'AVANS' : 'OYLIK',
        amount: Number(data.amount),
        employeeId: emp.id,
        notes: data.notes || `${data.type} to'lovi (${monthStr})`,
      },
    });

    // Check if payroll record exists for this month
    const existingPayroll = await this.prisma.payroll.findFirst({
      where: { employeeId: emp.id, month: monthStr },
    });

    if (existingPayroll) {
      return this.prisma.payroll.update({
        where: { id: existingPayroll.id },
        data: {
          netSalary: existingPayroll.netSalary + Number(data.amount),
          isPaid: true,
          notes: `${existingPayroll.notes || ''} | ${data.type}: ${data.amount.toLocaleString()} so'm`.trim(),
        },
        include: { employee: true },
      });
    } else {
      return this.prisma.payroll.create({
        data: {
          employeeId: emp.id,
          month: monthStr,
          baseSalary: emp.salary,
          netSalary: Number(data.amount),
          isPaid: true,
          notes: `${data.type}: ${data.amount.toLocaleString()} so'm`,
        },
        include: { employee: true },
      });
    }
  }

  findAll() {
    return this.prisma.payroll.findMany({
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.payroll.findUnique({ where: { id }, include: { employee: true } });
  }

  update(id: string, updatePayrollDto: any) {
    return this.prisma.payroll.update({ where: { id }, data: updatePayrollDto });
  }

  remove(id: string) {
    return this.prisma.payroll.delete({ where: { id } });
  }
}
