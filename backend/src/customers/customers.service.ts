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
    let normalizedPhone = data.phone;
    
    if (normalizedPhone) {
      // Remove all non-digit characters except +
      normalizedPhone = normalizedPhone.replace(/[^\d+]/g, '');
      
      // Basic validation for Uzbekistan numbers
      if (!/^\+998\d{9}$/.test(normalizedPhone)) {
        throw new ConflictException('Telefon raqami formati noto\'g\'ri (Masalan: +998901234567)');
      }

      const existing = await this.prisma.customer.findUnique({
        where: { phone: normalizedPhone }
      });
      if (existing) {
        throw new ConflictException('Bu telefon raqami bilan mijoz allaqachon mavjud');
      }
    }
    
    return this.prisma.customer.create({
      data: {
        name: data.name.trim(),
        phone: normalizedPhone || null,
        loyaltyPoints: 0
      }
    });
  }
}
