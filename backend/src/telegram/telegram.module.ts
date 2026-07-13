import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { PrismaService } from '../prisma.service';
import { InventoryModule } from '../inventory/inventory.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [InventoryModule, ReportsModule],
  providers: [TelegramService, PrismaService],
  exports: [TelegramService],
})
export class TelegramModule {}
