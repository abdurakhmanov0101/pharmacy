import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class FiscalService {
  private readonly logger = new Logger(FiscalService.name);

  /**
   * Mock Fiscal Integration
   * In a real production scenario, this connects to Soliq OFD (e.g. UzKassa, Jowi, Payme POS).
   */
  async sendReceipt(saleData: any, items: any[]): Promise<{
    fiscalReceiptId: string;
    fiscalUrl: string;
    fiscalSign: string;
  } | null> {
    try {
      this.logger.log(`OFD Ga chek yuborilmoqda: Sotuv ID = ${saleData.id}`);

      // MOCK LOGIC: Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // MOCK DATA: Generate realistic looking fiscal fields
      const fiscalSign = crypto.randomBytes(6).toString('hex').toUpperCase(); // e.g. 9B4F8A22B10C
      const receiptId = `F-${Math.floor(Math.random() * 1000000)}`; // e.g. F-948293
      
      // Real Uzb Soliq URL format contains terminal id, receipt id, time and fiscal sign
      const timeStr = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14);
      
      // Real QR URL usually looks like: https://ofd.soliq.uz/check?t=...
      const fiscalUrl = `https://ofd.soliq.uz/check?t=FMD00001&r=${receiptId}&time=${timeStr}&s=${fiscalSign}`;

      this.logger.log(`Fiskal chek muvaffaqiyatli shakllandi: ${receiptId}`);

      return {
        fiscalReceiptId: receiptId,
        fiscalUrl,
        fiscalSign
      };
    } catch (error) {
      this.logger.error('OFD bilan bog\'lanishda xatolik:', error);
      // In offline mode, or if OFD is down, we might return null and sync later
      return null;
    }
  }
}
