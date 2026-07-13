import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class SecurityService {
  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
  ) {}

  async findAll() {
    return this.prisma.customerEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markAsReviewed(id: string) {
    return this.prisma.customerEvent.update({
      where: { id },
      data: { reviewed: true },
    });
  }

  async reportSuspiciousEvent(data: {
    trackId: string;
    cameraId?: string;
    eventType: string;
    riskScore: number;
  }) {
    const event = await this.prisma.customerEvent.create({
      data: {
        trackId: data.trackId,
        cameraId: data.cameraId || 'Bosh kirish',
        eventType: data.eventType,
        riskScore: data.riskScore,
      },
    });

    if (data.riskScore >= 70) {
      const timeStr = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
      let msg = `🚨 <b>EHTIMOLIY SHUBHALI HARAKAT</b>\n\n`;
      msg += `📍 Kamera: ${data.cameraId}\n`;
      msg += `⏰ Vaqt: ${timeStr}\n`;
      msg += `📝 Tur: ${data.eventType === 'zone_exit_no_checkout' ? "Kassadan o'tmasdan chiqishga urindi" : data.eventType}\n`;
      msg += `⚠️ Xavf darajasi: <b>${data.riskScore}/100</b>\n\n`;
      msg += `Kuzatuv oynasi orqali zudlik bilan tekshiring!`;

      this.telegramService.sendAdminAlert(msg);
    }

    return event;
  }
}
