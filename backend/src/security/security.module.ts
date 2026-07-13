import { Module } from '@nestjs/common';
import { SecurityService } from './security.service';
import { SecurityController } from './security.controller';
import { PrismaService } from '../prisma.service';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [TelegramModule],
  controllers: [SecurityController],
  providers: [SecurityService, PrismaService],
})
export class SecurityModule {}
