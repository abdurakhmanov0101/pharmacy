import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { PrismaService } from '../prisma.service';
import { FiscalService } from './fiscal.service';

@Module({
  controllers: [SalesController],
  providers: [SalesService, PrismaService, FiscalService],
})
export class SalesModule {}
