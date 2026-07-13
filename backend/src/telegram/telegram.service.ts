import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const TelegramBotModule = require('node-telegram-bot-api');
const TelegramBot = TelegramBotModule.default ?? TelegramBotModule;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpeg = require('fluent-ffmpeg');

import { PrismaService } from '../prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { ReportsService } from '../reports/reports.service';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const FormData = require('form-data');

// ffmpeg yo'lini sozlash
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

@Injectable()
export class TelegramService implements OnModuleInit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private bot: any;
  private readonly logger = new Logger(TelegramService.name);
  private userStates: Map<number, { state: string; data?: any }> = new Map();

  // Google Chrome'ning bepul STT API kaliti (API key talab qilmaydi)
  private readonly GOOGLE_STT_URL =
    'https://www.google.com/speech-api/v2/recognize?client=chromium&lang=uz&key=AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw';

  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    private reportsService: ReportsService,
  ) {}

  onModuleInit() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN topilmadi.');
      return;
    }
    this.bot = new TelegramBot(token, { polling: true });
    this.logger.log('✅ Telegram bot ishga tushdi (@saas_apteka_bot)');
    this.logger.log('🎤 Ovozli xabar funksiyasi (ffmpeg + Google STT) faol');
    this.setupHandlers();
  }

  private setupHandlers() {
    this.bot.onText(/\/start/, (msg: any) => {
      this.sendMainMenu(msg.chat.id, msg.from?.first_name || 'Foydalanuvchi');
    });

    this.bot.on('callback_query', async (query: any) => {
      const chatId = query.message?.chat.id;
      if (!chatId) return;
      await this.bot.answerCallbackQuery(query.id);
      await this.handleCallback(chatId, query.data || '', query.message?.message_id);
    });

    // 🎤 Ovozli xabar
    this.bot.on('voice', async (msg: any) => {
      await this.handleVoiceMessage(msg.chat.id, msg.voice);
    });

    // 🎤 Audio fayl (voice note emas, fayl shaklida)
    this.bot.on('audio', async (msg: any) => {
      await this.handleVoiceMessage(msg.chat.id, msg.audio);
    });

    // 💬 Matn — avtomatik dori qidiruv yoki sotish sonini kiritish
    this.bot.on('message', async (msg: any) => {
      if (!msg.text || msg.text.startsWith('/')) return;
      const chatId = msg.chat.id;
      const state = this.userStates.get(chatId);

      if (state?.state === 'selling_qty' && state.data?.medId) {
        const qty = parseInt(msg.text.trim(), 10);
        if (!isNaN(qty) && qty > 0) {
          const medId = state.data.medId;
          this.userStates.delete(chatId);
          await this.handleSellConfirm(chatId, medId, 'CASH', qty);
          return;
        } else {
          await this.bot.sendMessage(chatId, '❌ Iltimos, to\'g\'ri son kiriting (masalan: 3, 5, 12):');
          return;
        }
      }

      if (state?.state === 'searching') {
        this.userStates.delete(chatId);
      }
      await this.handleAutoSearch(chatId, msg.text);
    });
  }

  // ═══════════════════════════════════════════════════════
  //  🎤  OVOZLI XABAR — OGG → Whisper STT → Qidiruv
  // ═══════════════════════════════════════════════════════
  private async handleVoiceMessage(chatId: number, voice: any) {
    const processingMsg = await this.bot.sendMessage(
      chatId,
      '🎤 Ovoz qabul qilindi...\n⏳ Matnga aylantirilmoqda, biroz kuting...',
    );

    const tmpDir = os.tmpdir();
    const oggPath = path.join(tmpDir, `tg_voice_${chatId}_${Date.now()}.ogg`);

    try {
      // 1️⃣ Telegram dan OGG faylni yuklab olish
      const fileInfo = await this.bot.getFile(voice.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${fileInfo.file_path}`;

      const dlRes = await axios.get(fileUrl, { responseType: 'arraybuffer', timeout: 15000 });
      fs.writeFileSync(oggPath, Buffer.from(dlRes.data));
      this.logger.log(`✅ Ovoz fayli yuklandi: ${oggPath}`);

      // 2️⃣ Ovozni matnga o'girish (Groq → OpenAI → Google fallback)
      let transcript = '';
      
      if (process.env.GROQ_API_KEY) {
        this.logger.log('🚀 Groq Whisper orqali tahlil qilinmoqda...');
        transcript = await this.transcribeWithGroq(oggPath);
      } else if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()) {
        this.logger.log('🚀 OpenAI Whisper orqali tahlil qilinmoqda...');
        transcript = await this.transcribeWithOpenAI(oggPath);
      } else {
        // Fallback: Google STT
        const flacPath = oggPath.replace('.ogg', '.flac');
        await this.convertOggToFlac(oggPath, flacPath);
        transcript = await this.transcribeFlac(flacPath);
        this.cleanupFiles(flacPath);
      }
      
      this.cleanupFiles(oggPath);
      this.logger.log(`🎤 Transkriptsiya natijasi: "${transcript}"`);

      // 3️⃣ Natijani ko'rsatish
      if (!transcript || transcript.trim().length < 2) {
        await this.bot.editMessageText(
          '❌ Ovozdan so\'z ajratib olinmadi.\n\n💡 Maslahat:\n• Aniqroq va sekinroq gapiring\n• Dori nomini to\'liq ayting\n• Yaxshi mikrofon muhitida yozing',
          {
            chat_id: chatId,
            message_id: processingMsg.message_id,
            reply_markup: {
              inline_keyboard: [
                [{ text: '✍️ Matn orqali yozing', callback_data: 'search' }],
                [{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }],
              ],
            },
          },
        );
        return;
      }

      // 4️⃣ Transkriptsiya natijasini yangilash
      await this.bot.editMessageText(
        `🎤 Siz aytdingiz: *"${transcript}"*\n🔍 Dori qidirilmoqda...`,
        {
          chat_id: chatId,
          message_id: processingMsg.message_id,
          parse_mode: 'Markdown',
        },
      );

      // 5️⃣ Dori qidirish
      await this.handleSearch(chatId, transcript);

    } catch (err: any) {
      this.logger.error('Voice processing error:', err?.message || err);
      this.cleanupFiles(oggPath);

      await this.bot.editMessageText(
        `❌ Ovozni qayta ishlashda xatolik: ${err?.message || 'Noma\'lum xato'}\n\n✍️ Matn orqali yozib qidiring.`,
        {
          chat_id: chatId,
          message_id: processingMsg.message_id,
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔍 Matn bilan qidirish', callback_data: 'search' }],
              [{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }],
            ],
          },
        },
      ).catch(() => {});
    }
  }

  // OGG → FLAC (16kHz mono) — Google STT uchun zarur format
  private convertOggToFlac(oggPath: string, flacPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(oggPath)
        .audioChannels(1)          // mono
        .audioFrequency(16000)     // 16 kHz — Google STT optimal
        .audioCodec('flac')
        .output(flacPath)
        .on('end', () => resolve())
        .on('error', (err: any) => reject(new Error(`FFmpeg xatosi: ${err.message}`)))
        .run();
    });
  }

  // FLAC → Google STT → transkriptsiya matni (fallback)
  private async transcribeFlac(flacPath: string): Promise<string> {
    const audioData = fs.readFileSync(flacPath);
    const response = await axios.post(this.GOOGLE_STT_URL, audioData, {
      headers: { 'Content-Type': 'audio/x-flac; rate=16000' },
      timeout: 20000,
    });
    const rawText: string = response.data;
    const lines = rawText.split('\n').filter((l: string) => l.trim());
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        const results = parsed?.result;
        if (results && results.length > 0) {
          const alt = results[0]?.alternative;
          if (alt && alt.length > 0) {
            return alt[0].transcript || '';
          }
        }
      } catch {}
    }
    return '';
  }

  // OGG → Groq Whisper API (BEPUL va ANIQ — 100% ishlaydi)
  private async transcribeWithGroq(oggPath: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(oggPath));
      formData.append('model', 'whisper-large-v3');
      formData.append('language', 'uz');
      formData.append('response_format', 'json');

      const res = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        timeout: 30000,
      });

      return res.data?.text || '';
    } catch (err: any) {
      this.logger.error('Groq Whisper xatosi', err.response?.data || err.message);
      return '';
    }
  }

  // OGG → OpenAI Whisper API
  private async transcribeWithOpenAI(oggPath: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(oggPath));
      formData.append('model', 'whisper-1');
      formData.append('language', 'uz');

      const res = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        timeout: 30000,
      });

      return res.data?.text || '';
    } catch (err: any) {
      this.logger.error('OpenAI Whisper xatosi', err.response?.data || err.message);
      return '';
    }
  }

  // Vaqtinchalik fayllarni o'chirish
  private cleanupFiles(...paths: string[]) {
    for (const p of paths) {
      try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch {}
    }
  }

  // ═══════════════════════════════════════════════════════
  //  🔍  AVTOMATIK MATN QIDIRUVI
  // ═══════════════════════════════════════════════════════
  private async handleAutoSearch(chatId: number, text: string) {
    if (text.length < 2) return;

    const medicines = await this.prisma.medicine.findMany({
      where: {
        OR: [
          { name: { contains: text } },
          { genericName: { contains: text } },
        ],
      },
      include: { inventory: true },
      take: 10,
    });

    if (!medicines.length) {
      await this.bot.sendMessage(
        chatId,
        `💊 "${text}" nomi bilan dori topilmadi.\n\nBoshqa nom bilan yozing yoki menyu ko'ring.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '💊 Barcha dorilar', callback_data: 'medicines' }],
              [{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }],
            ],
          },
        },
      );
      return;
    }

    let resultText = `🔍 "${text}" bo'yicha ${medicines.length} ta natija:\n\n`;
    const keyboardRows: any[][] = [];

    for (const med of medicines) {
      const qty = med.inventory.reduce((s: number, i: any) => s + i.quantity, 0);
      const stockStatus = qty === 0 ? '🔴 Tugagan' : qty <= 20 ? `🟡 ${qty} dona (kam)` : `🟢 ${qty} dona`;
      resultText += `💊 *${med.name}*`;
      if (med.genericName) resultText += ` (${med.genericName})`;
      resultText += `\n   💵 ${med.price.toLocaleString()} UZS | 📦 ${stockStatus}\n\n`;

      if (qty > 0 && keyboardRows.length < 5) {
        keyboardRows.push([{ text: `🛒 Sotish: ${med.name} (${med.price.toLocaleString()} UZS)`, callback_data: `sell_${med.id}` }]);
      }
    }

    keyboardRows.push([
      { text: '🔍 Boshqa qidirish', callback_data: 'search' },
      { text: '💊 Barcha dorilar', callback_data: 'medicines' }
    ]);
    keyboardRows.push([{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }]);

    await this.bot.sendMessage(chatId, resultText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboardRows,
      },
    });
  }

  // ═══════════════════════════════════════════════════════
  //  🏠  MAIN MENU
  // ═══════════════════════════════════════════════════════
  private async sendMainMenu(chatId: number, name: string, messageId?: number) {
    const text =
      `🏥 AptekaOS — Bosh Menyu\n\n` +
      `Salom, ${name}!\n\n` +
      `💡 Dori nomini yozing — avtomatik qidiradi\n` +
      `🎤 Ovozli xabar yuboring — ovozdan dori qidiradi`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🛒 POS (Tezkor Kassa & Sotish)', callback_data: 'pos_menu' }],
        [{ text: '💊 Dorilar (+Sotish)', callback_data: 'medicines' }, { text: '📦 Ombor (+Sotish)', callback_data: 'inventory' }],
        [{ text: '📊 Dashboard', callback_data: 'dashboard' }, { text: '💵 Kassa & Foyda', callback_data: 'expenses_profit' }],
        [{ text: '💰 Sotuvlar Tarixi', callback_data: 'sales' }, { text: '👥 Xodimlar & Oylik', callback_data: 'employees_payroll' }],
        [{ text: '⚠️ Ogohlantirishlar', callback_data: 'alerts' }, { text: '📈 Hisobotlar', callback_data: 'reports' }],
        [{ text: '🔍 Dori Qidirish & Ovozli Sotish', callback_data: 'search' }],
      ],
    };

    if (messageId) {
      await this.bot
        .editMessageText(text, { chat_id: chatId, message_id: messageId, reply_markup: keyboard })
        .catch(() => this.bot.sendMessage(chatId, text, { reply_markup: keyboard }));
    } else {
      await this.bot.sendMessage(chatId, text, { reply_markup: keyboard });
    }
  }

  // ═══════════════════════════════════════════════════════
  //  🔀  CALLBACK HANDLER
  // ═══════════════════════════════════════════════════════
  private async handleCallback(chatId: number, data: string, messageId?: number) {
    try {
      if (data === 'main_menu') { await this.sendMainMenu(chatId, 'Siz', messageId); return; }
      if (data === 'dashboard') await this.sendDashboard(chatId, messageId);
      else if (data === 'expenses_profit') await this.sendExpensesProfit(chatId, messageId);
      else if (data === 'employees_payroll') await this.sendEmployeesPayroll(chatId, messageId);
      else if (data === 'medicines') await this.sendMedicinesList(chatId, messageId, 0);
      else if (data.startsWith('medicines_page_')) await this.sendMedicinesList(chatId, messageId, parseInt(data.replace('medicines_page_', '')));
      else if (data === 'inventory') await this.sendInventoryMenu(chatId, messageId);
      else if (data === 'inventory_low') await this.sendLowStock(chatId, messageId);
      else if (data === 'inventory_expiring') await this.sendExpiring(chatId, messageId, 30);
      else if (data === 'inventory_all') await this.sendAllInventory(chatId, messageId);
      else if (data === 'sales') await this.sendRecentSales(chatId, messageId);
      else if (data === 'alerts') await this.sendAlertsMenu(chatId, messageId);
      else if (data === 'alerts_7') await this.sendExpiring(chatId, messageId, 7);
      else if (data === 'alerts_15') await this.sendExpiring(chatId, messageId, 15);
      else if (data === 'alerts_30') await this.sendExpiring(chatId, messageId, 30);
      else if (data === 'reports') await this.sendReportsMenu(chatId, messageId);
      else if (data === 'report_daily') await this.sendReport(chatId, messageId, 'daily');
      else if (data === 'report_weekly') await this.sendReport(chatId, messageId, 'weekly');
      else if (data === 'report_monthly') await this.sendReport(chatId, messageId, 'monthly');
      else if (data === 'search') await this.promptSearch(chatId, messageId);
      else if (data === 'pos_menu') await this.sendPOSMenu(chatId, messageId);
      else if (data.startsWith('sell_confirm_')) {
        const rest = data.replace('sell_confirm_', '');
        const parts = rest.split('_');
        let medId = parts[0];
        let qty = 1;
        let method = 'CASH';
        if (parts.length === 2) {
          medId = parts[0];
          method = parts[1];
        } else if (parts.length >= 3) {
          medId = parts[0];
          qty = parseInt(parts[1], 10) || 1;
          method = parts[2];
        }
        await this.handleSellConfirm(chatId, medId, method, qty, messageId);
      }
      else if (data.startsWith('sell_customqty_')) {
        await this.promptCustomQty(chatId, data.replace('sell_customqty_', ''), messageId);
      }
      else if (data.startsWith('sell_')) {
        await this.handleSellPrompt(chatId, data.replace('sell_', ''), messageId);
      }
    } catch (err) {
      this.logger.error('Callback error:', err);
      await this.bot.sendMessage(chatId, 'Xatolik yuz berdi. /start bosing.').catch(() => {});
    }
  }

  // ─── DASHBOARD ─────────────────────────────────────────
  private async sendDashboard(chatId: number, messageId?: number) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [salesAgg, salesCount, lowStockCount, expiringCount, totalValue] = await Promise.all([
      this.prisma.sale.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: today } } }),
      this.prisma.sale.count({ where: { createdAt: { gte: today } } }),
      this.prisma.inventory.count({ where: { quantity: { lte: 20 } } }),
      this.prisma.inventory.count({ where: { expiryDate: { gte: new Date(), lte: new Date(Date.now() + 30 * 86400000) } } }),
      this.inventoryService.getTotalValue(),
    ]);

    const text =
      `📊 Dashboard — Bugun\n` +
      `${new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}\n\n` +
      `💰 Bugungi sotuv: ${(salesAgg._sum.totalAmount || 0).toLocaleString()} UZS\n` +
      `🛒 Buyurtmalar: ${salesCount} ta\n` +
      `📦 Ombor qiymati: ${(totalValue || 0).toLocaleString()} UZS\n\n` +
      `⚠️ Kam qolgan dorilar: ${lowStockCount} ta\n` +
      `🕐 30 kun ichida tugaydi: ${expiringCount} ta`;

    await this.editOrSend(chatId, text, {
      inline_keyboard: [
        [{ text: '⚠️ Ogohlantirishlar', callback_data: 'alerts' }, { text: '📈 Hisobot', callback_data: 'reports' }],
        [{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }],
      ],
    }, messageId);
  }

  // ─── POS MENU ───────────────────────────────────────────
  private async sendPOSMenu(chatId: number, messageId?: number) {
    this.userStates.set(chatId, { state: 'searching' });
    const topItems = await this.prisma.inventory.findMany({
      where: { quantity: { gt: 0 } },
      include: { medicine: true },
      orderBy: { quantity: 'desc' },
      take: 5,
    });

    const text =
      `🛒 *POS — TEZKOR KASSA VA SOTUV REJIMI*\n\n` +
      `💊 Dori nomini *yozing* yoki 🎤 *ovozli xabar* yuboring!\n` +
      `Yoki quyidagi eng ko'p mavjud dorilardan birini tanlab bir bosishda soting:`;

    const keyboardRows: any[][] = [];
    for (const item of topItems) {
      keyboardRows.push([
        {
          text: `🛒 Sotish: ${item.medicine.name} (${item.medicine.price.toLocaleString()} UZS | 📦 ${item.quantity} ta)`,
          callback_data: `sell_${item.medicine.id}`,
        },
      ]);
    }

    keyboardRows.push([
      { text: '💊 Barcha dorilar', callback_data: 'medicines' },
      { text: '🔍 Qidirish', callback_data: 'search' },
    ]);
    keyboardRows.push([{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }]);

    await this.editOrSend(chatId, text, { inline_keyboard: keyboardRows }, messageId);
  }

  // ─── MEDICINES LIST ─────────────────────────────────────
  private async sendMedicinesList(chatId: number, messageId?: number, page = 0) {
    const pageSize = 5;
    const [medicines, total] = await Promise.all([
      this.prisma.medicine.findMany({ include: { inventory: true }, orderBy: { name: 'asc' }, skip: page * pageSize, take: pageSize }),
      this.prisma.medicine.count(),
    ]);
    const totalPages = Math.ceil(total / pageSize);

    if (!medicines.length) {
      await this.editOrSend(chatId, "Dorilar ro'yxati bo'sh.", { inline_keyboard: [[{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }]] }, messageId);
      return;
    }

    let text = `💊 *Dorilar ro'yxati va Sotuv* (${page + 1}/${totalPages} — jami ${total} ta)\n_Sotish uchun dori nomidagi sotuv tugmasini bosing:_\n\n`;
    const keyboardRows: any[][] = [];

    for (const med of medicines) {
      const qty = med.inventory.reduce((s: number, i: any) => s + i.quantity, 0);
      const e = qty === 0 ? '🔴' : qty <= 20 ? '🟡' : '🟢';
      text += `${e} *${med.name}*`;
      if (med.genericName) text += ` (${med.genericName})`;
      text += `\n   💵 ${med.price.toLocaleString()} UZS  |  📦 ${qty} dona\n\n`;

      if (qty > 0) {
        keyboardRows.push([
          {
            text: `🛒 Sotish: ${med.name} (${med.price.toLocaleString()} UZS)`,
            callback_data: `sell_${med.id}`,
          },
        ]);
      }
    }

    const nav: any[] = [];
    if (page > 0) nav.push({ text: '⬅️ Oldingi', callback_data: `medicines_page_${page - 1}` });
    if (page < totalPages - 1) nav.push({ text: 'Keyingi ➡️', callback_data: `medicines_page_${page + 1}` });
    if (nav.length) keyboardRows.push(nav);

    keyboardRows.push([
      { text: '🛒 POS (Kassa)', callback_data: 'pos_menu' },
      { text: '🔍 Qidirish', callback_data: 'search' },
    ]);
    keyboardRows.push([{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }]);

    await this.editOrSend(chatId, text, { inline_keyboard: keyboardRows }, messageId);
  }

  // ─── INVENTORY ──────────────────────────────────────────
  private async sendInventoryMenu(chatId: number, messageId?: number) {
    const [total, low, exp] = await Promise.all([
      this.prisma.inventory.count({ where: { quantity: { gt: 0 } } }),
      this.prisma.inventory.count({ where: { quantity: { lte: 20 } } }),
      this.prisma.inventory.count({ where: { expiryDate: { gte: new Date(), lte: new Date(Date.now() + 30 * 86400000) } } }),
    ]);
    await this.editOrSend(chatId,
      `📦 Ombor holati\n\n✅ Jami: ${total} ta\n🟡 Kam qolgan (≤20): ${low} ta\n⏰ 30 kun ichida tugaydi: ${exp} ta`,
      { inline_keyboard: [
        [{ text: '📋 Barcha qoldiqlar', callback_data: 'inventory_all' }],
        [{ text: '🔴 Kam qolganlar', callback_data: 'inventory_low' }, { text: '⏰ Tugayotganlar', callback_data: 'inventory_expiring' }],
        [{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }],
      ]}, messageId);
  }

  private async sendAllInventory(chatId: number, messageId?: number) {
    const items = await this.prisma.inventory.findMany({ where: { quantity: { gt: 0 } }, include: { medicine: true }, orderBy: { quantity: 'asc' }, take: 6 });
    if (!items.length) { await this.editOrSend(chatId, "Ombor bo'sh.", { inline_keyboard: [[{ text: '🏠', callback_data: 'main_menu' }]] }, messageId); return; }
    let text = `📦 *Ombor qoldiqlari (Sotuv tugmasi bilan)*\n\n`;
    const keyboardRows: any[][] = [];
    for (const i of items) {
      text += `${i.quantity <= 5 ? '🔴' : i.quantity <= 20 ? '🟡' : '🟢'} ${i.medicine.name} — ${i.quantity} dona (${i.medicine.price.toLocaleString()} UZS)\n`;
      keyboardRows.push([{ text: `🛒 Sotish: ${i.medicine.name}`, callback_data: `sell_${i.medicine.id}` }]);
    }
    keyboardRows.push([{ text: '📦 Ombor Menyusi', callback_data: 'inventory' }, { text: '🏠 Bosh menyu', callback_data: 'main_menu' }]);
    await this.editOrSend(chatId, text, { inline_keyboard: keyboardRows }, messageId);
  }

  private async sendLowStock(chatId: number, messageId?: number) {
    const items = await this.inventoryService.getLowStock(6);
    if (!items.length) { await this.editOrSend(chatId, '✅ Barcha dorilar yetarli!', { inline_keyboard: [[{ text: '🏠', callback_data: 'main_menu' }]] }, messageId); return; }
    let text = `🔴 *Kam qolgan dorilar (≤20 dona) va Sotish*\n\n`;
    const keyboardRows: any[][] = [];
    for (const i of items) {
      text += `${i.quantity === 0 ? '❌' : i.quantity <= 5 ? '🔴' : '🟡'} ${i.medicine.name} — ${i.quantity} dona (${i.medicine.price.toLocaleString()} UZS)\n`;
      if (i.quantity > 0) {
        keyboardRows.push([{ text: `🛒 Sotish: ${i.medicine.name}`, callback_data: `sell_${i.medicine.id}` }]);
      }
    }
    keyboardRows.push([{ text: '📦 Ombor Menyusi', callback_data: 'inventory' }, { text: '🏠 Bosh menyu', callback_data: 'main_menu' }]);
    await this.editOrSend(chatId, text, { inline_keyboard: keyboardRows }, messageId);
  }

  private async sendExpiring(chatId: number, messageId?: number, days = 30) {
    const items = await this.inventoryService.getExpiring(days);
    if (!items.length) { await this.editOrSend(chatId, `✅ ${days} kun ichida tugaydigan dori yo'q!`, { inline_keyboard: [[{ text: '🏠', callback_data: 'main_menu' }]] }, messageId); return; }
    let text = `⚠️ ${days} kun ichida muddati tugaydiganlar\n\n`;
    for (const i of items.slice(0, 15)) {
      const expDate = i.expiryDate ? new Date(i.expiryDate).toLocaleDateString('uz-UZ') : '—';
      const dLeft = i.expiryDate ? Math.ceil((new Date(i.expiryDate).getTime() - Date.now()) / 86400000) : null;
      text += `🕐 ${i.medicine.name}\n   📅 ${expDate}`;
      if (dLeft !== null) text += ` (${dLeft} kun)`;
      text += `  |  📦 ${i.quantity} dona\n\n`;
    }
    if (items.length > 15) text += `...va yana ${items.length - 15} ta`;
    await this.editOrSend(chatId, text, { inline_keyboard: [[{ text: '⚠️ Ogohlantirishlar', callback_data: 'alerts' }, { text: '🏠', callback_data: 'main_menu' }]] }, messageId);
  }

  // ─── ALERTS ─────────────────────────────────────────────
  private async sendAlertsMenu(chatId: number, messageId?: number) {
    const [a7, a30, low] = await Promise.all([
      this.prisma.inventory.count({ where: { expiryDate: { gte: new Date(), lte: new Date(Date.now() + 7 * 86400000) } } }),
      this.prisma.inventory.count({ where: { expiryDate: { gte: new Date(), lte: new Date(Date.now() + 30 * 86400000) } } }),
      this.prisma.inventory.count({ where: { quantity: { lte: 20 } } }),
    ]);
    await this.editOrSend(chatId,
      `⚠️ Ogohlantirishlar\n\n🔴 7 kun: ${a7} ta\n🟡 30 kun: ${a30} ta\n📦 Kam qolgan: ${low} ta`,
      { inline_keyboard: [
        [{ text: `🔴 7 kun (${a7})`, callback_data: 'alerts_7' }],
        [{ text: `🟠 15 kun`, callback_data: 'alerts_15' }, { text: `🟡 30 kun (${a30})`, callback_data: 'alerts_30' }],
        [{ text: '🔴 Kam qolganlar', callback_data: 'inventory_low' }],
        [{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }],
      ]}, messageId);
  }

  // ─── SALES ──────────────────────────────────────────────
  private async sendRecentSales(chatId: number, messageId?: number) {
    const sales = await this.prisma.sale.findMany({ include: { items: { include: { medicine: true } } }, orderBy: { createdAt: 'desc' }, take: 10 });
    if (!sales.length) { await this.editOrSend(chatId, 'Hali sotuv yo\'q.', { inline_keyboard: [[{ text: '🏠', callback_data: 'main_menu' }]] }, messageId); return; }
    let text = `💰 Oxirgi ${sales.length} ta sotuv\n\n`;
    for (const sale of sales) {
      const time = new Date(sale.createdAt).toLocaleString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const pay = sale.paymentMethod === 'CASH' ? '💵' : sale.paymentMethod === 'CARD' ? '💳' : '📱';
      text += `${pay} ${sale.totalAmount.toLocaleString()} UZS — ${time}\n`;
      const str = sale.items.map((i: any) => `${i.medicine.name} x${i.quantity}`).join(', ');
      text += `   ${str.length > 60 ? str.slice(0, 60) + '...' : str}\n\n`;
    }
    await this.editOrSend(chatId, text, { inline_keyboard: [[{ text: '📈 Hisobot', callback_data: 'reports' }, { text: '🏠', callback_data: 'main_menu' }]] }, messageId);
  }

  // ─── REPORTS ────────────────────────────────────────────
  private async sendReportsMenu(chatId: number, messageId?: number) {
    await this.editOrSend(chatId, "📈 Hisobotlar — Qaysi davr?", {
      inline_keyboard: [
        [{ text: '📅 Bugungi', callback_data: 'report_daily' }],
        [{ text: '📆 Haftalik', callback_data: 'report_weekly' }],
        [{ text: '🗓 Oylik', callback_data: 'report_monthly' }],
        [{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }],
      ],
    }, messageId);
  }

  private async sendReport(chatId: number, messageId?: number, period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    const r = await this.reportsService.getSummary(period);
    const t = period === 'daily' ? 'Bugungi' : period === 'weekly' ? 'Haftalik' : 'Oylik';
    let text =
      `📈 ${t} hisobot\n${new Date(r.startDate).toLocaleDateString('uz-UZ')} — ${new Date(r.endDate).toLocaleDateString('uz-UZ')}\n\n` +
      `💰 Jami: ${r.totalRevenue.toLocaleString()} UZS\n` +
      `🛒 Sotuvlar: ${r.totalSales} ta\n` +
      `📊 O'rtacha: ${Math.round(r.averageSale).toLocaleString()} UZS\n\n`;
    if (r.topMedicines.length) {
      text += `🏆 Top 5:\n`;
      r.topMedicines.slice(0, 5).forEach((m: any, i: number) => {
        text += `${i + 1}. ${m.name} — ${m.totalQuantity} dona | ${m.totalRevenue.toLocaleString()} UZS\n`;
      });
    }
    await this.editOrSend(chatId, text, {
      inline_keyboard: [
        [{ text: '📅 Bugun', callback_data: 'report_daily' }, { text: '📆 Hafta', callback_data: 'report_weekly' }, { text: '🗓 Oy', callback_data: 'report_monthly' }],
        [{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }],
      ],
    }, messageId);
  }

  // ─── SEARCH ─────────────────────────────────────────────
  private async promptSearch(chatId: number, messageId?: number) {
    this.userStates.set(chatId, { state: 'searching' });
    const text = `🔍 Dori qidirish\n\nDori nomini yozing yoki 🎤 ovozli xabar yuboring:`;
    if (messageId) {
      await this.bot.editMessageText(text, {
        chat_id: chatId, message_id: messageId,
        reply_markup: { inline_keyboard: [[{ text: '❌ Bekor', callback_data: 'main_menu' }]] },
      }).catch(() => this.bot.sendMessage(chatId, text, { reply_markup: { inline_keyboard: [[{ text: '❌ Bekor', callback_data: 'main_menu' }]] } }));
    } else {
      await this.bot.sendMessage(chatId, text, { reply_markup: { inline_keyboard: [[{ text: '❌ Bekor', callback_data: 'main_menu' }]] } });
    }
  }

  async handleSearch(chatId: number, query: string) {
    const medicines = await this.prisma.medicine.findMany({
      where: { OR: [{ name: { contains: query } }, { genericName: { contains: query } }] },
      include: { inventory: true },
      take: 10,
    });

    if (!medicines.length) {
      await this.bot.sendMessage(chatId,
        `💊 "${query}" nomi bilan dori topilmadi.\n\nBoshqa nom yozing.`,
        { reply_markup: { inline_keyboard: [
          [{ text: '🔍 Qayta qidirish', callback_data: 'search' }],
          [{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }],
        ]}},
      );
      return;
    }

    let text = `🔍 "${query}" — ${medicines.length} ta natija:\n\n`;
    const keyboardRows: any[][] = [];

    for (const med of medicines) {
      const qty = med.inventory.reduce((s: number, i: any) => s + i.quantity, 0);
      const stock = qty === 0 ? '🔴 Tugagan' : qty <= 20 ? `🟡 ${qty} dona (kam)` : `🟢 ${qty} dona`;
      text += `💊 *${med.name}*`;
      if (med.genericName) text += ` (${med.genericName})`;
      text += `\n   💵 ${med.price.toLocaleString()} UZS  |  📦 ${stock}\n\n`;

      if (qty > 0 && keyboardRows.length < 5) {
        keyboardRows.push([{ text: `🛒 Sotish: ${med.name} (${med.price.toLocaleString()} UZS)`, callback_data: `sell_${med.id}` }]);
      }
    }

    keyboardRows.push([
      { text: '🔍 Qayta qidirish', callback_data: 'search' },
      { text: '💊 Barcha dorilar', callback_data: 'medicines' }
    ]);
    keyboardRows.push([{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }]);

    await this.bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboardRows },
    });
  }

  // ═══════════════════════════════════════════════════════
  //  🛒  TELEGRAM BOT POS SOTUV TIZIMI
  // ═══════════════════════════════════════════════════════
  private async handleSellPrompt(chatId: number, medId: string, messageId?: number) {
    const medicine = await this.prisma.medicine.findUnique({
      where: { id: medId },
      include: { inventory: true },
    });

    if (!medicine) {
      await this.editOrSend(chatId, "❌ Dori topilmadi.", { inline_keyboard: [[{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }]] }, messageId);
      return;
    }

    const totalQty = medicine.inventory.reduce((s: number, i: any) => s + i.quantity, 0);
    if (totalQty <= 0) {
      await this.editOrSend(chatId, `❌ "${medicine.name}" hozircha omborda qolmagan.`, {
        inline_keyboard: [
          [{ text: '🔍 Boshqa dori qidirish', callback_data: 'search' }],
          [{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }],
        ],
      }, messageId);
      return;
    }

    const text =
      `🛒 *SOTUV AMALGA OSHIRISH (KASSA)*\n\n` +
      `💊 *Mahsulot:* ${medicine.name}\n` +
      `💵 *1 dona narxi:* ${medicine.price.toLocaleString()} UZS\n` +
      `📦 *Ombordagi qoldiq:* ${totalQty} dona\n\n` +
      `Sotiladigan miqdor va to'lov turini tanlang:`;

    await this.editOrSend(chatId, text, {
      inline_keyboard: [
        [
          { text: '💵 1 dona (Naqd)', callback_data: `sell_confirm_${medId}_1_Naqd` },
          { text: '💳 1 dona (Karta)', callback_data: `sell_confirm_${medId}_1_Karta` },
        ],
        [
          { text: '💵 2 dona (Naqd)', callback_data: `sell_confirm_${medId}_2_Naqd` },
          { text: '💳 2 dona (Karta)', callback_data: `sell_confirm_${medId}_2_Karta` },
        ],
        [
          { text: '💵 3 dona (Naqd)', callback_data: `sell_confirm_${medId}_3_Naqd` },
          { text: '💵 5 dona (Naqd)', callback_data: `sell_confirm_${medId}_5_Naqd` },
        ],
        [
          { text: '💵 10 dona (Naqd)', callback_data: `sell_confirm_${medId}_10_Naqd` },
          { text: '✍️ Boshqa son yozish', callback_data: `sell_customqty_${medId}` },
        ],
        [{ text: '❌ Bekor qilish', callback_data: 'main_menu' }],
      ],
    }, messageId);
  }

  private async promptCustomQty(chatId: number, medId: string, messageId?: number) {
    const medicine = await this.prisma.medicine.findUnique({ where: { id: medId } });
    if (!medicine) return;
    this.userStates.set(chatId, { state: 'selling_qty', data: { medId } });
    const text = `✍️ *"${medicine.name}"* uchun sotiladigan sonni yozib yuboring (masalan: 4, 15, 20):`;
    await this.editOrSend(chatId, text, {
      inline_keyboard: [[{ text: '❌ Bekor qilish', callback_data: `sell_${medId}` }]],
    }, messageId);
  }

  private async handleSellConfirm(
    chatId: number,
    medId: string,
    paymentMethod: string,
    qty: number = 1,
    messageId?: number,
  ) {
    try {
      const medicine = await this.prisma.medicine.findUnique({
        where: { id: medId },
        include: { inventory: true },
      });

      if (!medicine) {
        await this.editOrSend(chatId, "❌ Dori topilmadi.", { inline_keyboard: [[{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }]] }, messageId);
        return;
      }

      const availableInv = medicine.inventory.find((i: any) => i.quantity > 0);
      if (!availableInv || availableInv.quantity < qty) {
        const currentQty = availableInv?.quantity || 0;
        await this.editOrSend(
          chatId,
          `❌ Omborda yetarli qoldiq yo'q. Mavjud: ${currentQty} dona. Siz so'radingiz: ${qty} dona.`,
          {
            inline_keyboard: [
              [{ text: '🛒 Mavjud boricha sotish', callback_data: currentQty > 0 ? `sell_confirm_${medId}_${currentQty}_${paymentMethod}` : 'main_menu' }],
              [{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }],
            ],
          },
          messageId,
        );
        return;
      }

      const branch = await this.prisma.branch.findFirst();
      const user = await this.prisma.user.findFirst();
      if (!branch || !user) {
        await this.editOrSend(chatId, "❌ Tizimda filial yoki foydalanuvchi topilmadi.", { inline_keyboard: [[{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }]] }, messageId);
        return;
      }

      const totalAmount = medicine.price * qty;
      const normalizedMethod =
        paymentMethod === 'Karta' || paymentMethod === 'Click' || paymentMethod === 'Payme' || paymentMethod === 'CARD'
          ? 'CARD'
          : 'CASH';

      // Create Sale + SaleItem in database
      const sale = await this.prisma.sale.create({
        data: {
          branchId: branch.id,
          userId: user.id,
          totalAmount: totalAmount,
          paymentMethod: normalizedMethod,
          items: {
            create: {
              medicineId: medicine.id,
              quantity: qty,
              unitPrice: medicine.price,
            },
          },
        },
      });

      // Deduct inventory
      const newQty = Math.max(0, availableInv.quantity - qty);
      await this.prisma.inventory.update({
        where: { id: availableInv.id },
        data: { quantity: newQty },
      });

      // Create inventory transaction log for auditing
      await this.prisma.inventoryTransaction.create({
        data: {
          inventoryId: availableInv.id,
          type: 'OUT',
          quantity: qty,
          notes: `Telegram Bot orqali sotildi (#BOT-${sale.id.slice(0, 8).toUpperCase()})`,
        },
      });

      const receiptText =
        `✅ *SOTUV MUVAFFAQIYATLI AMALGA OSHIRILDI (BAZADA YANGILANDI)!*\n\n` +
        `🧾 *Chek:* #BOT-${sale.id.slice(0, 8).toUpperCase()}\n` +
        `💊 *Mahsulot:* ${medicine.name}\n` +
        `📦 *Sotildi:* ${qty} dona\n` +
        `💵 *Jami summa:* ${totalAmount.toLocaleString()} UZS\n` +
        `💳 *To'lov turi:* ${paymentMethod}\n` +
        `📅 *Sana:* ${new Date().toLocaleTimeString('uz-UZ')}\n\n` +
        `📦 *Omborda yangi qoldiq:* ${newQty} dona`;

      await this.editOrSend(chatId, receiptText, {
        inline_keyboard: [
          [{ text: '🛒 POS Menyuga qaytish', callback_data: 'pos_menu' }],
          [{ text: '💊 Dorilar ro\'yxati', callback_data: 'medicines' }, { text: '🏠 Bosh menyu', callback_data: 'main_menu' }],
        ],
      }, messageId);

    } catch (err) {
      this.logger.error('Sale creation error:', err);
      await this.editOrSend(chatId, "❌ Sotuvni amalga oshirishda xatolik yuz berdi.", { inline_keyboard: [[{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }]] }, messageId);
    }
  }

  // ─── HELPER ─────────────────────────────────────────────
  private async editOrSend(chatId: number, text: string, keyboard: any, messageId?: number) {
    if (messageId) {
      try { await this.bot.editMessageText(text, { chat_id: chatId, message_id: messageId, reply_markup: keyboard }); }
      catch { await this.bot.sendMessage(chatId, text, { reply_markup: keyboard }); }
    } else {
      await this.bot.sendMessage(chatId, text, { reply_markup: keyboard });
    }
  }

  async sendEmployeesPayroll(chatId: number, messageId?: number) {
    const employees = await this.prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: { payrolls: true }
    });

    let text = `👥 *Xodimlar va Oyliklar ro'yxati*\n\n`;
    for (const emp of employees) {
      const totalPaid = emp.payrolls.reduce((sum, p) => sum + p.netSalary, 0);
      text += `👤 *${emp.fullName}* (${emp.position})\n`;
      text += `💵 Belgilangan oyligi: ${emp.salary.toLocaleString()} so'm\n`;
      text += `💰 To'langan: ${totalPaid.toLocaleString()} so'm\n\n`;
    }

    const keyboard = {
      inline_keyboard: [[{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }]]
    };

    if (messageId) {
      await this.bot.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: keyboard }).catch(() => {});
    } else {
      await this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: keyboard });
    }
  }

  async sendExpensesProfit(chatId: number, messageId?: number) {
    const sales = await this.prisma.sale.findMany({ include: { items: { include: { medicine: true } } } });
    const expenses = await this.prisma.expense.findMany();

    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalCost = sales.reduce((sum, s) => {
      return sum + s.items.reduce((acc, item) => acc + ((item.medicine?.purchasePrice || 0) * item.quantity), 0);
    }, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalCost - totalExpenses;

    const text =
      `💵 *Kassa & Moliya Hisoboti*\n\n` +
      `📈 *Jami Tushum:* ${totalRevenue.toLocaleString()} so'm\n` +
      `📦 *Tovarlar Tan Narxi:* ${totalCost.toLocaleString()} so'm\n` +
      `📉 *Kassa Chiqimlari:* ${totalExpenses.toLocaleString()} so'm\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `💰 *SOF FOYDA:* ${netProfit.toLocaleString()} so'm\n`;

    const keyboard = {
      inline_keyboard: [[{ text: '🏠 Bosh menyu', callback_data: 'main_menu' }]]
    };

    if (messageId) {
      await this.bot.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: keyboard }).catch(() => {});
    } else {
      await this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: keyboard });
    }
  }

  async sendNotification(chatId: number, message: string) {
    if (!this.bot) return;
    await this.bot.sendMessage(chatId, message);
  }

  async sendAdminAlert(message: string) {
    if (!this.bot) return;
    const adminChatId = process.env.ADMIN_CHAT_ID;
    if (adminChatId) {
      await this.bot.sendMessage(adminChatId, message).catch(() => {});
    } else {
      this.logger.warn(`Admin alert: ${message}`);
    }
  }

  async sendAdminPhoto(message: string, base64Photo: string) {
    if (!this.bot) return;
    const adminChatId = process.env.ADMIN_CHAT_ID;
    if (adminChatId && base64Photo) {
      try {
        const base64Data = base64Photo.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        await this.bot.sendPhoto(adminChatId, buffer, { caption: message });
      } catch (err) {
        this.logger.error('Failed to send photo to admin', err);
      }
    }
  }
}
