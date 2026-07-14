# 🏥 AptekaSaaS — Zamonaviy Dorixona Boshqaruv Tizimi

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/NestJS-10-red?style=for-the-badge&logo=nestjs" />
  <img src="https://img.shields.io/badge/Prisma-5-blue?style=for-the-badge&logo=prisma" />
  <img src="https://img.shields.io/badge/SQLite-local-green?style=for-the-badge&logo=sqlite" />
  <img src="https://img.shields.io/badge/JWT-Auth-orange?style=for-the-badge&logo=jsonwebtokens" />
</p>

---

## 🚀 Xususiyatlar

| Modul | Tavsif |
|---|---|
| 🛒 **POS Kassa** | Barkod skaner, naqd/karta/aralash to'lov, smena nazorati |
| 📦 **Omborxona** | Partiya va muddati bilan kirim, FEFO chiqim, qoldiq hisobi |
| 💊 **Dorilar katalogi** | Excel import/export, MXIK kodi, QQS, barkod |
| 📊 **Analitika** | Kunlik/haftalik/oylik daromad, o'lik dorilar tahlili |
| 👥 **Mijozlar** | Telefon raqami, xaridlar tarixi, mobil-responsive dizayn |
| 💼 **Xodimlar** | Rol asosida (kassir/farmatsevt/menejer), maosh, davomad |
| 🔒 **Xavfsizlik** | JWT Auth, bcrypt parollar, RolesGuard, GlobalExceptionFilter |
| 🧾 **Fiskal Chek** | Soliq QR-kodi, MXIK, QQS (NDS), termal printer |
| 🤖 **Telegram Bot** | Ovozli va matnli buyruqlar, kunlik hisobot |

---

## 🛠 Texnologiyalar

**Backend:**
- NestJS (Node.js framework)
- Prisma ORM + SQLite
- JWT Authentication + bcrypt
- Telegram Bot API

**Frontend:**
- Next.js 16 (App Router)
- TypeScript + Tailwind CSS
- SWR (real-time yangilanish)
- qrcode.react (Fiskal QR)

---

## ⚡ Ishga Tushurish

### Talablar
- Node.js 18+
- npm yoki yarn

### Backend
```bash
cd backend
npm install
npx prisma db push
npx prisma generate
npm run start:dev
```
> Backend: http://localhost:3001

### Frontend
```bash
cd frontend
npm install
npm run dev
```
> Frontend: http://localhost:3000

---

## 🔑 Login

Birinchi kirish uchun `.env` faylidagi ma'lumotlar yoki `hash-passwords.js` skripti orqali yaratilgan vaqtinchalik paroldan foydalaning.

> ⚠️ Birinchi kirishda tizim yangi parol o'rnatishni talab qiladi.

---

## 📁 Loyiha Strukturasi

```
pharm/
├── backend/          # NestJS API
│   ├── src/
│   │   ├── auth/     # JWT Authentication
│   │   ├── sales/    # Sotuv va kassa
│   │   ├── medicines/# Dorilar katalogi
│   │   ├── inventory/# Omborxona
│   │   ├── reports/  # Hisobotlar
│   │   └── ...
│   └── prisma/       # Ma'lumotlar bazasi sxemasi
└── frontend/         # Next.js UI
    └── src/
        ├── app/      # Sahifalar (App Router)
        ├── components/# UI komponentlar
        └── utils/    # Yordamchi funksiyalar
```

---

## 📄 Litsenziya

MIT License — Erkin foydalaning ✅
