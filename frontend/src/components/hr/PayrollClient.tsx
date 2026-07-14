'use client';
import { fetcher } from '@/utils/fetcher';

import { useState, useEffect } from "react";
import { CreditCard, DollarSign, Search, CheckCircle2, AlertCircle, Plus, UserCheck, X, Calendar } from "lucide-react";

export default function PayrollClient() {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    type: "AVANS" as "AVANS" | "TO_LIQ",
    amount: "",
    month: new Date().toISOString().slice(0, 7),
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchPayrolls();
    fetchEmployees();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const res = await fetcher("http://localhost:3001/api/payroll");
      if (res.ok) {
        const data = await res.json();
        setPayrolls(data);
      }
    } catch (err) {
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetcher("http://localhost:3001/api/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {}
  };

  const handleOpenModal = () => {
    setFormData({
      employeeId: employees.length > 0 ? employees[0].id : "",
      type: "AVANS",
      amount: "",
      month: new Date().toISOString().slice(0, 7),
      notes: ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.amount) {
      alert("Iltimos, xodimni va summani kiriting");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetcher("http://localhost:3001/api/payroll/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: formData.employeeId,
          type: formData.type,
          amount: Number(formData.amount),
          month: formData.month,
          notes: formData.notes
        })
      });

      if (!res.ok) throw new Error("To'lovda xatolik");

      setIsModalOpen(false);
      fetchPayrolls();
      alert(`✅ ${formData.type === "AVANS" ? "Avans" : "Oylik"} to'lov muvaffaqiyatli saqlandi va Kassa chiqimlariga qo'shildi!`);
    } catch (err: any) {
      alert(err.message || "Xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPaid = payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);

  const currentMonthStr = mounted ? new Date().toISOString().slice(0, 7) : "2026-07";

  const filteredEmployees = employees.filter(emp =>
    emp.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    emp.position?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Oylik Maoshlar va Avanslar</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Xodimlarga avans va oylik to&apos;lovlarini amalga oshirish va nazorat qilish</p>
        </div>

        <button
          onClick={handleOpenModal}
          className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all"
        >
          <Plus className="h-4 w-4" /> Oylik / Avans To&apos;lash
        </button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-medium">Jami To&apos;langan Oylik / Avans</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{totalPaid.toLocaleString()} UZS</p>
          <p className="text-xs text-muted-foreground mt-1">{payrolls.length} ta to&apos;lov yozuvi</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-medium">Faol Xodimlar Soni</span>
            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{employees.length} kishi</p>
          <p className="text-xs text-muted-foreground mt-1">Tizimda qayd etilgan</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-medium">Joriy To&apos;lov Davri</span>
            <div className="p-2 bg-purple-500/10 text-purple-600 rounded-lg">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {mounted ? new Date().toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' }) : "Iyul, 2026"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Hozirgi hisobot oyi</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Xodim ismi bo'yicha qidiring..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
            Bunday xodim topilmadi.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto min-h-[400px]">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/40 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Xodim F.I.SH.</th>
                    <th className="px-6 py-4 font-semibold">Lavozim</th>
                    <th className="px-6 py-4 font-semibold">Asosiy Maosh</th>
                    <th className="px-6 py-4 font-semibold">To&apos;landi (Bu oy)</th>
                    <th className="px-6 py-4 font-semibold">Qoldiq</th>
                    <th className="px-6 py-4 font-semibold">Holati</th>
                    <th className="px-6 py-4 font-semibold text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEmployees.map((emp) => {
                    const employeePayments = payrolls.filter((p: any) => p.employeeId === emp.id && p.month === currentMonthStr);
                    const paidThisMonth = employeePayments.reduce((sum: number, p: any) => sum + (p.netSalary || 0), 0);
                    const remaining = Math.max(0, (emp.salary || 0) - paidThisMonth);
                    const isFullyPaid = paidThisMonth >= (emp.salary || 0) && (emp.salary || 0) > 0;
                    
                    return (
                      <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
                              {(emp.fullName || "X").charAt(0).toUpperCase()}
                            </div>
                            {emp.fullName || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{emp.position || "Xodim"}</td>
                        <td className="px-6 py-4 font-mono text-xs">
                          <span className="bg-muted px-2 py-1 rounded-md font-bold text-foreground">
                            {emp.salary?.toLocaleString().replace(/,/g, ' ')} UZS
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-blue-600">
                          {paidThisMonth > 0 ? `${paidThisMonth.toLocaleString().replace(/,/g, ' ')} UZS` : "0 UZS"}
                        </td>
                        <td className="px-6 py-4 font-bold text-red-500">
                          {remaining > 0 ? `${remaining.toLocaleString().replace(/,/g, ' ')} UZS` : "0 UZS"}
                        </td>
                        <td className="px-6 py-4">
                          {isFullyPaid ? (
                            <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3 py-1 rounded-full font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" /> To&apos;liq to&apos;langan
                            </span>
                          ) : paidThisMonth > 0 ? (
                            <span className="inline-flex items-center gap-1.5 text-xs bg-amber-500/10 text-amber-600 border border-amber-500/20 px-3 py-1 rounded-full font-medium">
                              Qisman to&apos;langan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs bg-red-500/10 text-red-600 border border-red-500/20 px-3 py-1 rounded-full font-medium">
                              To&apos;lanmagan
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => {
                              setFormData({ ...formData, employeeId: emp.id });
                              setIsModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-semibold transition-colors"
                          >
                            To&apos;lash
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden divide-y divide-border overflow-y-auto max-h-[calc(100vh-280px)]">
              {filteredEmployees.map((emp) => {
                const employeePayments = payrolls.filter((p: any) => p.employeeId === emp.id && p.month === currentMonthStr);
                const paidThisMonth = employeePayments.reduce((sum: number, p: any) => sum + (p.netSalary || 0), 0);
                const isFullyPaid = paidThisMonth >= (emp.salary || 0) && (emp.salary || 0) > 0;

                return (
                  <div key={emp.id} className="p-4 space-y-3 hover:bg-muted/10 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {(emp.fullName || "X").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground text-sm">{emp.fullName || "—"}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{emp.position || "Xodim"}</p>
                        </div>
                      </div>
                      {isFullyPaid ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                          To&apos;langan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                          Qarzdorlik
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] sm:text-xs bg-muted/30 p-2 rounded-lg">
                      <div>
                        <p className="text-muted-foreground">Asosiy maosh</p>
                        <p className="font-bold text-foreground">{emp.salary?.toLocaleString()} UZS</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Bu oy to&apos;landi</p>
                        <p className="font-bold text-blue-600">{paidThisMonth.toLocaleString()} UZS</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <button 
                        onClick={() => {
                          setFormData({ ...formData, employeeId: emp.id });
                          setIsModalOpen(true);
                        }}
                        className="w-full py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Pul ajratish
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Oylik / Avans To'lash Modali */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-md border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
              <h2 className="text-xl font-bold">Xodimga Oylik / Avans To&apos;lov</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Xodimni tanlang *</label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-xl bg-background text-sm"
                >
                  <option value="">-- Xodimni tanlang --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.position || "Xodim"} - Oylik: {emp.salary?.toLocaleString()} so&apos;m)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">To&apos;lov turi *</label>
                  <select
                    value={formData.type}
                    onChange={(e: any) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-xl bg-background text-sm font-medium"
                  >
                    <option value="AVANS">💰 Avans berish</option>
                    <option value="TO_LIQ">💵 To&apos;liq oylik</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Hisobot oyi *</label>
                  <input
                    type="month"
                    required
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-xl bg-background text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-emerald-600">Summa (so&apos;m) *</label>
                <input
                  type="number"
                  required
                  min="1000"
                  placeholder="Masalan: 1500000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full p-3 border border-border rounded-xl bg-background text-base font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Izoh (ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="Masalan: Iyul oyi 1-qism avansi"
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
                  className="px-5 py-2.5 text-sm bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-medium shadow-md transition-all"
                >
                  {submitting ? "Saqlanmoqda..." : "To'lovni tasdiqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
