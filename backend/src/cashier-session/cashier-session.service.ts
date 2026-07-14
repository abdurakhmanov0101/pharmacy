import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CashierSessionService {
  constructor(private prisma: PrismaService) {}

  async getCurrentSession(userId: string) {
    return this.prisma.cashierSession.findFirst({
      where: { userId, status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
      include: { sales: true }
    });
  }

  async getDefaultUserAndBranch() {
    let branch = await this.prisma.branch.findFirst();
    if (!branch) {
      branch = await this.prisma.branch.create({
        data: { name: 'Asosiy Apteka Filiali', address: 'Toshkent', contact: '+998900000000' },
      });
    }

    let user = await this.prisma.user.findFirst();
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: 'admin@pharmauz.com', password: 'hashedpassword',
          firstName: 'Admin', lastName: 'User', branchId: branch.id,
        },
      });
    }
    return { user, branch };
  }

  async getCurrentDefaultSession() {
    const { user } = await this.getDefaultUserAndBranch();
    return this.getCurrentSession(user.id);
  }

  async openDefaultSession(startingCash: number) {
    const { user, branch } = await this.getDefaultUserAndBranch();
    return this.openSession(user.id, branch.id, startingCash);
  }

  async openSession(userId: string, branchId: string, startingCash: number) {
    const existing = await this.getCurrentSession(userId);
    if (existing) throw new BadRequestException("Sizda allaqachon ochiq smena mavjud!");

    return this.prisma.cashierSession.create({
      data: {
        userId,
        branchId,
        startingCash,
        status: 'OPEN',
      },
    });
  }

  async closeSession(sessionId: string, closingCash: number, notes?: string) {
    const session = await this.prisma.cashierSession.findUnique({
      where: { id: sessionId },
      include: { sales: true },
    });

    if (!session || session.status === 'CLOSED') {
      throw new BadRequestException("Smena topilmadi yoki allaqachon yopilgan!");
    }

    const cashSalesAmount = session.sales
      .filter((s) => s.paymentMethod === 'CASH')
      .reduce((sum, s) => sum + s.totalAmount, 0);
      
    const expectedCash = session.startingCash + cashSalesAmount;

    return this.prisma.cashierSession.update({
      where: { id: sessionId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closingCash,
        expectedCash,
        notes,
      },
    });
  }
}
