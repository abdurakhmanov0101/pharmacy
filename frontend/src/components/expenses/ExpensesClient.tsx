'use client';
import { fetcher } from '@/utils/fetcher';

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus, Trash2, Search, Calendar, Tag, X, AlertCircle } from "lucide-react";

export default function ExpensesClient() {
  const [summary, setSummary] = useState<any>({
    totalRevenue: 0,
    todayRevenue: 0,
    totalCostOfGoods: 0,
    totalExpenses: 0,
    netProfit: 0,
    expensesByCategory: {}
  });
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "BOSHQA",
    amount: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sumRes, expRes] = await Promise.all([
        fetcher("http://localhost:3001/api/expenses/summary"),
        fetcher("http://localhost:3001/api/expenses")
      ]);
      if (sumRes.ok) setSummary(await sumRes.json());
      if (expRes.ok) setExpenses(await expRes.json());
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) {
      alert("Iltimos, nomini va summani kiriting");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetcher("http://localhost:3001/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          amount: Number(formData.amount),
          notes: formData.notes
        })
      });

      if (!res.ok) throw new Error("Chiqim qo'shishda xatolik");

      setIsModalOpen(false);
      setFormData({ title: "", category: "BOSHQA", amount: "", notes: "" });
      fetchAll();
    } catch (err: any) {
      alert(err.message || "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Chiqimni o'chirishni xohlaysizmi?")) return;
    try {
      await fetcher(`http://localhost:3001/api/expenses/${id}`, { method: "DELETE" });
      fetchAll();
    } catch (err) {}
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'OYLIK': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'AVANS': return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20';
      case 'IJARA': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'KOMMUNAL': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'TRANSPORT': return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const filteredExpenses = expenses.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase()) ||
    (e.notes && e.notes.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Kassa, Moliya & Sof Foyda</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Real vaqtda umumiy tushum, barcha xarajatlar va sof foyda hisobi</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-5 py-2.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all"
        >
          <Plus className="h-4 w-4" /> Chiqim Qo&apos;shish
        </button>
      </div>

      {/* 4 Big Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Jami Tushum (Savdo)</span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 tracking-tight">
            {(summary.totalRevenue || 0).toLocaleString()} UZS
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Bugun: {(summary.todayRevenue || 0).toLocaleString()} UZS
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Tovarlar Tan Narxi</span>
            <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl">
              <Tag className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 tracking-tight">
            {(summary.totalCostOfGoods || 0).toLocaleString()} UZS
          </p>
          <p className="text-xs text-muted-foreground mt-1">Sotilgan dorilarning kelish narxi</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Kassa Chiqimlari</span>
            <div className="p-2.5 bg-red-500/10 text-red-600 rounded-xl">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-600 tracking-tight">
            {(summary.totalExpenses || 0).toLocaleString()} UZS
          </p>
          <p className="text-xs text-muted-foreground mt-1">Oylik, avans, ijara va kommunal</p>
        </div>

        <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border-2 border-primary/40 rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-primary">SOF FOYDA (Net Profit)</span>
            <div className="p-2.5 bg-primary text-primary-foreground rounded-xl shadow-sm">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <p className={`text-2xl font-black tracking-tight ${summary.netProfit >= 0 ? 'text-primary' : 'text-red-600'}`}>
            {(summary.netProfit || 0).toLocaleString()} UZS
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Barcha harajatlardan tashqari sof foyda</p>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold">Kassa Chiqimlari Tarixi</h2>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Chiqim nomini qidiring..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-3 opacity-20" />
            Hali kassa chiqimlari kiritilmagan.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                  <tr>
                    <th className="p-4 font-medium">Chiqim Nomi</th>
                    <th className="p-4 font-medium">Toifa</th>
                    <th className="p-4 font-medium">Izoh</th>
                    <th className="p-4 font-medium">Summa (UZS)</th>
                    <th className="p-4 font-medium">Sana</th>
                    <th className="p-4 font-medium text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-semibold text-foreground">{exp.title}</td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(exp.category)}`}>
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">{exp.notes || "—"}</td>
                      <td className="p-4 font-bold text-red-600">
                        -{exp.amount?.toLocaleString()} so&apos;m
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(exp.date).toLocaleDateString("uz-UZ", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden divide-y divide-border overflow-y-auto max-h-[60vh]">
              {filteredExpenses.map((exp) => (
                <div key={exp.id} className="p-4 space-y-3 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{exp.title}</h4>
                      <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getCategoryColor(exp.category)}`}>
                        {exp.category}
                      </span>
                    </div>
                    <p className="font-bold text-red-600 text-sm shrink-0">
                      -{exp.amount?.toLocaleString()} so'm
                    </p>
                  </div>

                  {exp.notes && (
                    <p className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-lg">
                      {exp.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                    <span>
                      {new Date(exp.date).toLocaleDateString("uz-UZ", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(exp.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Chiqim Qo'shish Modali */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-md border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
              <h2 className="text-xl font-bold">Yangi Chiqim Qo&apos;shish</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Chiqim nomi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Elektr energiyasi uchun"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-xl bg-background text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Toifa *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-xl bg-background text-sm font-medium"
                  >
                    <option value="IJARA">🏢 Ijara to&apos;lovi</option>
                    <option value="KOMMUNAL">⚡ Kommunal to&apos;lovlar</option>
                    <option value="TRANSPORT">🚗 Transport & Yetkazib berish</option>
                    <option value="REKLAMA">📢 Reklama & Marketing</option>
                    <option value="SOLIQ">🏛️ Soliq & Yig&apos;imlar</option>
                    <option value="BOSHQA">📌 Boshqa operatsion harajat</option>
                  </select>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    💡 Oylik maoshlar &quot;Oylik Maoshlar&quot; bo&apos;limidan to&apos;langanda avtomatik tushadi.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-red-600">Summa (UZS) *</label>
                  <input
                    type="number"
                    required
                    min="100"
                    placeholder="500000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-xl bg-background text-sm font-bold text-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Qo&apos;shimcha izoh</label>
                <input
                  type="text"
                  placeholder="Masalan: Iyul oyi uchun"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-xl bg-background text-sm"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm border border-border rounded-xl hover:bg-muted font-medium transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm bg-destructive text-destructive-foreground rounded-xl hover:bg-destructive/90 font-medium shadow-md transition-all"
                >
                  {submitting ? "Saqlanmoqda..." : "Chiqimni tasdiqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
