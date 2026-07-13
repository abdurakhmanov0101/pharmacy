import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ShiftService {
  constructor(private prisma: PrismaService) {}

  create(createShiftDto: any) {
    return this.prisma.shift.create({ data: createShiftDto });
  }

  findAll() {
    return this.prisma.shift.findMany();
  }

  findOne(id: string) {
    return this.prisma.shift.findUnique({ where: { id } });
  }

  update(id: string, updateShiftDto: any) {
    return this.prisma.shift.update({ where: { id }, data: updateShiftDto });
  }

  remove(id: string) {
    return this.prisma.shift.delete({ where: { id } });
  }
}
