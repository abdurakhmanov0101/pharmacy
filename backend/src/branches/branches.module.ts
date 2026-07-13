import { Module } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [BranchesService, PrismaService],
  controllers: [BranchesController]
})
export class BranchesModule {}
