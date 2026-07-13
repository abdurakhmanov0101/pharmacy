'use client';

import { Activity, DollarSign, Package, AlertCircle, TrendingUp, ShoppingCart, Bot, ChevronRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import AnimatedNumber from "@/components/ui/AnimatedNumber";

import { useState, useEffect } from "react";

export default function DashboardClient({ stats: initialStats, error }: { stats: any; error: string | null }) {
  const { t } = useLanguage();
  const [stats, setStats] = useState(initialStats);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchDashboard = () => {
      fetch("http://localhost:3001/api/dashboard")
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) setStats(data);
        })
        .catch(() => {});
    };
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 5000);
    return () => clearInterval(interval);
  }, []);

  const chartData = stats?.chartData || [];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p suppressHydrationWarning className="text-xs sm:text-sm text-muted-foreground mt-1">
            {mounted ? new Date().toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric", weekday: "long" }) : "2026-yil, Iyul"}
          </p>
        </div>
        <Link
          href="/telegram"
          className="inline-flex items-center gap-2 text-xs sm:text-sm bg-blue-500/10 text-blue-600 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors self-start sm:self-auto"
        >
          <Bot className="h-4 w-4" />
          <span>Telegram Bot</span>
        </Link>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3 relative z-10">
            <p className="text-sm font-medium text-muted-foreground">Bugungi sotuv</p>
            <div className="p-2 bg-emerald-100/50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600 relative z-10 tracking-tight">
            {stats ? <AnimatedNumber value={stats.todaysSales} /> : "—"} UZS
          </p>
          <p className="text-xs text-muted-foreground mt-1">{stats?.orders || 0} ta buyurtma</p>
          <div className="absolute -bottom-6 -right-6 opacity-[0.03] transform scale-150 group-hover:scale-125 transition-transform duration-500 pointer-events-none text-emerald-600">
            <DollarSign className="h-24 w-24" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3 relative z-10">
            <p className="text-sm font-medium text-muted-foreground">Oylik daromad</p>
            <div className="p-2 bg-blue-100/50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-blue-600 relative z-10 tracking-tight">
            {stats ? <AnimatedNumber value={stats.monthlyRevenue} /> : "—"} UZS
          </p>
          <p className="text-xs text-muted-foreground mt-1">{stats?.monthlySalesCount || 0} ta sotuv</p>
          <div className="absolute -bottom-6 -right-6 opacity-[0.03] transform scale-150 group-hover:scale-125 transition-transform duration-500 pointer-events-none text-blue-600">
            <TrendingUp className="h-24 w-24" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3 relative z-10">
            <p className="text-sm font-medium text-muted-foreground">Ombor qiymati</p>
            <div className="p-2 bg-purple-100/50 text-purple-600 rounded-xl group-hover:bg-purple-100 transition-colors">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-purple-600 relative z-10 tracking-tight">
            {stats ? <AnimatedNumber value={stats.totalInventoryValue} /> : "—"} UZS
          </p>
          <p className="text-xs text-muted-foreground mt-1">Joriy qoldiqlar</p>
          <div className="absolute -bottom-6 -right-6 opacity-[0.03] transform scale-150 group-hover:scale-125 transition-transform duration-500 pointer-events-none text-purple-600">
            <Package className="h-24 w-24" />
          </div>
        </div>

        <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3 relative z-10">
            <p className="text-sm font-medium text-amber-800">Kam qolgan dorilar</p>
            <div className="p-2 bg-amber-100/80 text-amber-600 rounded-xl group-hover:bg-amber-200 transition-colors">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-700 relative z-10 tracking-tight">
            {stats ? <AnimatedNumber value={stats.lowStockItems} /> : "—"} ta
          </p>
          <p className="text-xs text-amber-700/70 mt-1">E'tibor talab qiladi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-lg">So'nggi 7 kunlik sotuv</h2>
            <Link href="/reports" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
              Batafsil <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenueDash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="label" 
                    tickFormatter={(val) => val.split(", ")[0]}
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "#6b7280" }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "#6b7280" }} 
                    tickFormatter={(val) => val === 0 ? "0" : `${(val / 1000).toFixed(0)}k`}
                  />
                  <RechartsTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-foreground text-background text-sm px-3 py-2 rounded-lg shadow-xl border border-border">
                            <p className="font-medium text-xs opacity-80 mb-1">{label}</p>
                            <p className="font-bold text-base">{payload[0].value?.toLocaleString().replace(/,/g, ' ')} UZS</p>
                            <p className="text-xs opacity-80">{payload[0].payload.count} ta sotuv</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenueDash)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border rounded-lg bg-muted/20">
              Ma'lumot yo'q. Sotuvlar amalga oshirilgandan keyin ko'rinadi.
            </div>
          )}
        </div>

        {/* Expiring Soon */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              Muddati tugayotganlar
            </h2>
            <Link href="/alerts" className="text-xs text-primary hover:underline flex items-center gap-1">
              Barchasi <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.expiringSoon?.length > 0 ? (
              stats.expiringSoon.map((item: any) => {
                const expDate = new Date(item.expiry);
                const daysLeft = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const color =
                  daysLeft <= 7 ? "text-destructive" : daysLeft <= 15 ? "text-amber-500" : "text-muted-foreground";
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.batch ? `Seriya: ${item.batch}` : "Seriya yo'q"} · {item.qty} dona
                      </p>
                    </div>
                    <div className="text-right ml-2 shrink-0">
                      <p className={`text-xs font-semibold ${color}`}>
                        {daysLeft <= 0 ? "Muddati o'tgan!" : `${daysLeft} kun`}
                      </p>
                      <p suppressHydrationWarning className="text-[10px] text-muted-foreground">{expDate.toLocaleDateString("uz-UZ")}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {stats ? "Muddati tugayotgan dori yo'q ✅" : "Yuklanmoqda..."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Medicines + Telegram Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Medicines */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base">Bu oy eng ko'p sotilganlar</h2>
            <Link href="/reports" className="text-xs text-primary hover:underline flex items-center gap-1">
              To'liq hisobot <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {stats?.topMedicines?.length > 0 ? (
            <div className="space-y-2">
              {stats.topMedicines.map((med: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0
                          ? "bg-amber-100 text-amber-700"
                          : i === 1
                          ? "bg-slate-100 text-slate-700"
                          : i === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">{med.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{med.totalSold} dona</p>
                    <p className="text-xs text-muted-foreground">{med.revenue.toLocaleString()} UZS</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {stats ? "Bu oy hali sotuv yo'q" : "Yuklanmoqda..."}
            </p>
          )}
        </div>

        {/* Telegram Bot Banner */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3">
              <Bot className="h-5 w-5" />
            </div>
            <h2 className="font-bold text-base mb-1">Telegram Bot</h2>
            <p className="text-sm text-blue-100 leading-relaxed">
              @saas_apteka_bot orqali barcha ma'lumotlarni Telegram'dan boshqaring
            </p>
          </div>
          <div className="mt-4 space-y-2">
            <a
              href="https://t.me/saas_apteka_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-white text-blue-600 text-sm font-semibold py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Botni ochish ↗
            </a>
            <Link
              href="/telegram"
              className="block w-full text-center bg-white/20 text-white text-sm font-medium py-2 rounded-lg hover:bg-white/30 transition-colors"
            >
              Bot sozlamalari
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  icon,
  color,
  warning = false,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  warning?: boolean;
}) {
  const bg: Record<string, string> = {
    emerald: "bg-emerald-50 border-emerald-200",
    blue: "bg-blue-50 border-blue-200",
    violet: "bg-violet-50 border-violet-200",
    amber: "bg-amber-50 border-amber-200",
  };

  return (
    <div
      className={`rounded-xl p-5 border transition-all hover:shadow-md ${
        warning ? bg["amber"] : "bg-card border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <div className="p-1.5 bg-background rounded-lg border border-border shadow-sm">{icon}</div>
      </div>
      <p className="text-xl font-bold leading-tight mb-0.5">{value}</p>
      <p className={`text-xs ${warning ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>{sub}</p>
    </div>
  );
}
