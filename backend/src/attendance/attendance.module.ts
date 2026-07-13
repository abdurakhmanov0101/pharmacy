import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { PrismaService } from '../prisma.service';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [TelegramModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, PrismaService],
})
export class AttendanceModule {}
