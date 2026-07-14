'use client';

import { useState } from "react";
import { Settings as SettingsIcon, Bell, Shield, Database, Save, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("AptekaOS - Markaziy Dorixona");
  const [currency, setCurrency] = useState("UZS");
  const [telegramAlerts, setTelegramAlerts] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tizim Sozlamalari</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Dorixona, AI kamera va bildirishnoma sozlamalarini boshqaring.</p>
      </div>

      {saved && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">Sozlamalar muvaffaqiyatli saqlandi!</span>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
        <h3 className="text-lg font-bold flex items-center gap-2 border-b border-border pb-4">
          <SettingsIcon className="w-5 h-5 text-primary" />
          Umumiy Sozlamalar
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Dorixona / Tizim Nomi</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Asosiy Valyuta</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground"
            >
              <option value="UZS">UZS (So&apos;m)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
        </div>

        <h3 className="text-lg font-bold flex items-center gap-2 border-b border-border pb-4 pt-4">
          <Bell className="w-5 h-5 text-primary" />
          Telegram Bildirishnomalari
        </h3>

        <div className="space-y-4">

          <label className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border cursor-pointer">
            <div>
              <div className="font-semibold">Telegram Bot Xabarnomalari</div>
              <div className="text-xs text-muted-foreground">Xodim ishga kelganida va sotuv bo&apos;lganda Telegramga yuborish</div>
            </div>
            <input
              type="checkbox"
              checked={telegramAlerts}
              onChange={(e) => setTelegramAlerts(e.target.checked)}
              className="w-5 h-5 accent-primary"
            />
          </label>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl shadow flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" /> Sozlamalarni Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}
