import { Module } from '@nestjs/common';
import { CashierSessionController } from './cashier-session.controller';
import { CashierSessionService } from './cashier-session.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [CashierSessionController],
  providers: [CashierSessionService, PrismaService],
  exports: [CashierSessionService],
})
export class CashierSessionModule {}
