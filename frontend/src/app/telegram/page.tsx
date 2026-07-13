export const metadata = {
  title: "Telegram Bot | AptekaOS",
  description: "Telegram bot sozlamalari va qo'llanma",
};

export default function TelegramPage() {
  return <TelegramPageClient />;
}

function TelegramPageClient() {
  const commands = [
    { cmd: "/start", desc: "Botni ishga tushirish va bosh menyu" },
    { cmd: "📊 Dashboard", desc: "Bugungi sotuv, buyurtmalar, ombor holati" },
    { cmd: "💊 Dorilar", desc: "Barcha dorilar ro'yxati (sahifalangan)" },
    { cmd: "📦 Ombor", desc: "Ombor qoldiqlari, kam qolganlar" },
    { cmd: "💰 Sotuvlar", desc: "Oxirgi 10 ta sotuv" },
    { cmd: "⚠️ Ogohlantirishlar", desc: "Muddati tugayotgan dorilar (7/15/30 kun)" },
    { cmd: "📈 Hisobotlar", desc: "Kunlik / haftalik / oylik hisobot" },
    { cmd: "🔍 Dori qidirish", desc: "Dori nomini yozib qidirish" },
  ];

  const features = [
    { icon: "🔄", title: "Real vaqt", desc: "Barcha ma'lumotlar bazadan real vaqtda olinadi" },
    { icon: "📊", title: "To'liq statistika", desc: "Saytdagi barcha hisobotlar Telegramda ham mavjud" },
    { icon: "⚠️", title: "Ogohlantirishlar", desc: "Muddati tugayotgan va kam qolgan dorilar haqida" },
    { icon: "🔍", title: "Qidirish", desc: "Dori nomini yozib qidiring — nomi yoki tarkibi bo'yicha" },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="text-4xl mb-3">🤖</div>
            <h1 className="text-2xl font-bold mb-1">@saas_apteka_bot</h1>
            <p className="text-blue-100 text-sm leading-relaxed max-w-md">
              AptekaOS ning rasmiy Telegram boti. Barcha apteka ma'lumotlarini Telegram orqali
              boshqaring — hatto smartfoningizdan ham.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <a
              href="https://t.me/saas_apteka_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white text-blue-600 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm"
            >
              <span>Botni ochish</span>
              <span>↗</span>
            </a>
            <p className="text-xs text-blue-200 text-center">Telegram ilovasi kerak</p>
          </div>
        </div>
      </div>

      {/* Bot Status */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Bot holati</h2>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
          <p className="text-sm font-medium text-emerald-600">Bot faol va ishlayapti</p>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Bot username</p>
            <p className="font-mono text-sm font-medium">@saas_apteka_bot</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Rejim</p>
            <p className="text-sm font-medium">Polling (aktiv)</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Til</p>
            <p className="text-sm font-medium">O'zbekcha 🇺🇿</p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div>
        <h2 className="font-semibold mb-4 text-lg">Bot imkoniyatlari</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
              <span className="text-2xl">{f.icon}</span>
              <div>
                <p className="font-semibold text-sm">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commands List */}
      <div>
        <h2 className="font-semibold mb-4 text-lg">Buyruqlar va tugmalar</h2>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr className="text-muted-foreground text-xs uppercase tracking-wide">
                <th className="text-left p-4">Buyruq / Tugma</th>
                <th className="text-left p-4">Tavsif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {commands.map((c, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{c.cmd}</code>
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">{c.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* How to use */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4 text-lg">Qanday foydalanish</h2>
        <ol className="space-y-3">
          {[
            "Telegram ilovasini oching",
            "@saas_apteka_bot ni qidiring yoki yuqoridagi tugmani bosing",
            '/start buyrug\'ini yuboring',
            "Menyu tugmalaridan foydalaning",
            "Dori qidirish uchun \"🔍 Dori qidirish\" tugmasini bosib, dori nomini yozing",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-muted-foreground">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
