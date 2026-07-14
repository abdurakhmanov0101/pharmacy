import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { sales: true }
        }
      }
    });
  }

  async create(data: { name: string; phone?: string }) {
    if (data.phone) {
      const existing = await this.prisma.customer.findUnique({
        where: { phone: data.phone }
      });
      if (existing) {
        throw new ConflictException('Bu telefon raqami bilan mijoz allaqachon mavjud');
      }
    }
    
    return this.prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        loyaltyPoints: 0
      }
    });
  }
}
