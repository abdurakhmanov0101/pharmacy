"use client";

import { useState } from "react";
import { BarChart3, TrendingUp, ShoppingCart, Award, DollarSign, AlertTriangle, PackageX } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

import AnimatedNumber from "@/components/ui/AnimatedNumber";

interface ReportData {
  period: string;
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalSales: number;
  averageSale: number;
  topMedicines: { name: string; totalQuantity: number; totalRevenue: number }[];
  deadMedicines?: any[];
}

interface ChartDay {
  date: string;
  label: string;
  revenue: number;
  count: number;
}

interface TopMedicine {
  name: string;
  genericName?: string;
  totalSold: number;
  revenue: number;
  transactions: number;
}

export default function ReportsClient({
  daily,
  weekly,
  monthly,
  chart,
  topMedicines,
}: {
  daily: ReportData | null;
  weekly: ReportData | null;
  monthly: ReportData | null;
  chart: ChartDay[] | null;
  topMedicines: TopMedicine[] | null;
}) {
  const [activePeriod, setActivePeriod] = useState<"daily" | "weekly" | "monthly" | "custom">("monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [customData, setCustomData] = useState<ReportData | null>(null);
  const [isLoadingCustom, setIsLoadingCustom] = useState(false);

  const fetchCustomData = async () => {
    if (!customStart || !customEnd) return;
    setIsLoadingCustom(true);
    try {
      const res = await fetch(`http://localhost:3001/api/reports/custom?start=${customStart}&end=${customEnd}`);
      if (res.ok) {
        setCustomData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCustom(false);
    }
  };

  const report = activePeriod === "daily" ? daily : activePeriod === "weekly" ? weekly : activePeriod === "monthly" ? monthly : customData;
  const maxRevenue = chart ? Math.max(...chart.map((d) => d.revenue), 1) : 1;

  const periodLabels = {
    daily: "Bugun",
    weekly: "Haftalik (7 kun)",
    monthly: "Bu oy",
    custom: "Tanlash",
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Hisobotlar
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Sotuv tahlili va statistika</p>
        </div>
        {/* Period Switcher */}
        <div className="flex bg-muted rounded-lg p-1 gap-1 flex-wrap">
          {(["daily", "weekly", "monthly", "custom"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setActivePeriod(p)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activePeriod === p ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {activePeriod === "custom" && (
        <div className="flex flex-wrap items-end gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Boshlanish sanasi</label>
            <input type="date" className="p-2 border rounded-md bg-background text-sm focus:ring-2 focus:ring-primary/50 outline-none" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Tugash sanasi</label>
            <input type="date" className="p-2 border rounded-md bg-background text-sm focus:ring-2 focus:ring-primary/50 outline-none" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
          </div>
          <button 
            onClick={fetchCustomData}
            disabled={isLoadingCustom || !customStart || !customEnd}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isLoadingCustom ? "Yuklanmoqda..." : "Ko'rish"}
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
          title="Jami daromad"
          value={<>{report ? <AnimatedNumber value={report.totalRevenue} /> : "—"} UZS</>}
        />
        <SummaryCard
          icon={<ShoppingCart className="h-5 w-5 text-blue-500" />}
          title="Sotuvlar soni"
          value={<>{report ? <AnimatedNumber value={report.totalSales} /> : "—"} ta</>}
        />
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5 text-violet-500" />}
          title="O'rtacha chek"
          value={<>{report ? <AnimatedNumber value={Math.round(report.averageSale)} /> : "—"} UZS</>}
        />
      </div>

      {/* Chart */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold mb-6 text-lg">So'nggi 7 kunlik sotuv grafigi</h2>
        {chart && chart.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border rounded-lg bg-muted/20">
            Sotuv ma'lumotlari mavjud emas
          </div>
        )}
      </div>

      {/* Top Medicines Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Eng ko'p sotilgan dorilar (Top 10)
          </h2>
          {report?.topMedicines && report.topMedicines.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                    <th className="text-left pb-3 pr-4">#</th>
                    <th className="text-left pb-3 pr-4">Dori nomi</th>
                    <th className="text-right pb-3 pr-4">Sotildi</th>
                    <th className="text-right pb-3">Daromad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {report.topMedicines.map((med: any, i: number) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            i === 0
                              ? "bg-amber-100 text-amber-700"
                              : i === 1
                              ? "bg-slate-100 text-slate-600"
                              : i === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-medium">{med.name}</p>
                        {med.genericName && <p className="text-[10px] text-muted-foreground">{med.genericName}</p>}
                      </td>
                      <td className="py-3 pr-4 text-right font-semibold whitespace-nowrap">{med.totalQuantity || med.totalSold} dona</td>
                      <td className="py-3 text-right text-emerald-600 font-semibold whitespace-nowrap">
                        {(med.totalRevenue || med.revenue || 0).toLocaleString().replace(/,/g, ' ')} UZS
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Ma'lumot yo'q</p>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
          <h2 className="font-semibold mb-4 text-lg">Dorilar ulushi (Daromad)</h2>
          <div className="flex-1 w-full flex items-center justify-center min-h-[300px]">
            {report?.topMedicines && report.topMedicines.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={report.topMedicines}
                    dataKey="totalRevenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {report.topMedicines.map((entry: any, index: number) => {
                      const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#06b6d4', '#f43f5e', '#84cc16', '#d946ef'];
                      return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                    })}
                  </Pie>
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-foreground text-background text-sm px-3 py-2 rounded-lg shadow-xl border border-border">
                            <p className="font-medium text-xs opacity-80 mb-1">{payload[0].name}</p>
                            <p className="font-bold text-base">{Number(payload[0].value).toLocaleString().replace(/,/g, ' ')} UZS</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Ma'lumot yo'q</p>
            )}
          </div>
        </div>
      </div>

      {/* Dead Medicines Grid */}
      <div className="mt-6 bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2 text-red-500">
            <PackageX className="h-5 w-5" />
            Sotilmayotgan dorilar (Qotib qolgan tovarlar)
          </h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
            Tanlangan vaqt ichida umuman sotilmagan dorilar
          </span>
        </div>
        
        {report?.deadMedicines && report.deadMedicines.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="text-left pb-3 pr-4">#</th>
                  <th className="text-left pb-3 pr-4">Dori nomi</th>
                  <th className="text-left pb-3 pr-4">Kategoriyasi</th>
                  <th className="text-right pb-3">Ombordagi qoldiq</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.deadMedicines.map((med: any, i: number) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 pr-4">
                      <span className="text-muted-foreground font-mono text-xs">{i + 1}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-foreground">{med.name}</p>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground text-xs">
                      {med.categoryName}
                    </td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 text-red-600 font-bold text-xs">
                        {med.stockQuantity} dona
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 text-emerald-500/50 mb-2" />
            <p className="text-sm font-medium">Hammasi joyida!</p>
            <p className="text-xs">Omborda yotib qolgan dorilar topilmadi.</p>
          </div>
        )}
      </div>

    </div>
  );
}

function SummaryCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex items-center justify-between mb-3 relative z-10">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="p-2 bg-muted/50 rounded-xl group-hover:bg-muted transition-colors">{icon}</div>
      </div>
      <p className="text-3xl font-black relative z-10 tracking-tight">{value}</p>
      <div className="absolute -bottom-6 -right-6 opacity-[0.03] transform scale-150 group-hover:scale-125 transition-transform duration-500 pointer-events-none">
        {icon}
      </div>
    </div>
  );
}
