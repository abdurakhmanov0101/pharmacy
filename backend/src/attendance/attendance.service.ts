import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
  ) {}

  async findAll() {
    return this.prisma.attendanceEvent.findMany({
      orderBy: { eventTime: 'desc' },
      include: { employee: true },
      take: 50,
    });
  }

  async checkIn(data: { employeeId: string; cameraId?: string; image?: string; type?: string }) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: data.employeeId },
    });

    if (!employee) throw new Error('Xodim topilmadi');

    const eventType = data.type || 'check_in';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.attendanceEvent.findFirst({
      where: {
        employeeId: data.employeeId,
        eventType: eventType,
        eventTime: { gte: today },
      },
    });

    if (existing) {
      return { message: `Already ${eventType} today`, event: existing };
    }

    // Calculate if late (faqat check_in uchun)
    let isLate = false;
    let minutesDiff = 0;
    const now = new Date();

    if (eventType === 'check_in' && employee.shiftStart) {
      const [hours, minutes] = employee.shiftStart.split(':').map(Number);
      const shiftTime = new Date();
      shiftTime.setHours(hours, minutes, 0, 0);

      const diff = now.getTime() - shiftTime.getTime();
      if (diff > 0) {
        minutesDiff = Math.floor(diff / 60000);
        if (minutesDiff > 5) {
          isLate = true;
        }
      }
    }

    const event = await this.prisma.attendanceEvent.create({
      data: {
        employeeId: data.employeeId,
        eventType: eventType,
        cameraId: data.cameraId || 'Bosh kirish',
        isLate,
        minutesDiff,
      },
    });

    // Send Telegram alert
    const timeStr = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    let msg = `👤 Davomat: ${employee.fullName}\n`;
    
    if (eventType === 'check_in') {
      msg += `✅ Keldi: ${timeStr} (Jadval: ${employee.shiftStart || 'Belgilanmagan'})\n`;
      if (isLate) {
        msg += `⚠️ ${minutesDiff} daqiqa kech qoldi!\n`;
      }
    } else {
      msg += `🛑 Ketdi: ${timeStr} (Jadval: ${employee.shiftEnd || 'Belgilanmagan'})\n`;
    }
    
    if (data.image) {
      this.telegramService.sendAdminPhoto(msg, data.image);
    } else {
      this.telegramService.sendAdminAlert(msg);
    }

    return event;
  }
}
