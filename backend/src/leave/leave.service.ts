import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  create(createLeaveDto: any) {
    return this.prisma.leave.create({ data: createLeaveDto });
  }

  findAll() {
    return this.prisma.leave.findMany({ include: { employee: true } });
  }

  findOne(id: string) {
    return this.prisma.leave.findUnique({ where: { id }, include: { employee: true } });
  }

  update(id: string, updateLeaveDto: any) {
    return this.prisma.leave.update({ where: { id }, data: updateLeaveDto });
  }

  remove(id: string) {
    return this.prisma.leave.delete({ where: { id } });
  }
}
