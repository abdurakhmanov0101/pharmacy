import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.employee.findMany({
      include: {
        leaves: true,
        payrolls: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({ 
      where: { id },
      include: { leaves: true, payrolls: true, attendanceEvents: true },
    });
    if (!employee) throw new NotFoundException('Xodim topilmadi');
    return employee;
  }

  async create(data: any) {
    return this.prisma.employee.create({
      data: {
        fullName: data.fullName,
        position: data.position,
        department: data.department,
        salary: data.salary ? parseFloat(data.salary) : 0,
        contactInfo: data.contactInfo,
        status: data.status || "ACTIVE",
        shiftStart: data.shiftStart,
        shiftEnd: data.shiftEnd,
        faceDescriptor: data.faceDescriptor,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.employee.delete({
      where: { id },
    });
  }

  async update(id: string, data: any) {
    const updateData: any = { ...data };
    if (data.salary !== undefined) {
      updateData.salary = parseFloat(data.salary);
    }
    return this.prisma.employee.update({
      where: { id },
      data: updateData,
    });
  }
}
