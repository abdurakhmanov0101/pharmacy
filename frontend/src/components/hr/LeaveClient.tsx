'use client';

import { useState, useEffect } from "react";
import { Calendar, AlertCircle, Plus, CheckCircle2, XCircle, Clock, User, X, Trash2 } from "lucide-react";

export default function LeaveClient() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    type: "VACATION",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    reason: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLeaves();
    fetchEmployees();
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/leave");
      if (res.ok) {
        const data = await res.json();
        setLeaves(data);
      }
    } catch (err) {
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {}
  };

  const handleOpenModal = () => {
    setFormData({
      employeeId: employees.length > 0 ? employees[0].id : "",
      type: "VACATION",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      reason: ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) {
      alert("Iltimos, xodimni tanlang");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:3001/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error("Ta'til qo'shishda xatolik");

      setIsModalOpen(false);
      fetchLeaves();
      alert("✅ Xodim ta'tilga rasmiylashtirildi!");
    } catch (err: any) {
      alert(err.message || "Xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ta'til yozuvini o'chirasizmi?")) return;
    try {
      await fetch(`http://localhost:3001/api/leave/${id}`, { method: "DELETE" });
      fetchLeaves();
    } catch (err) {}
  };

  const getBadgeType = (type: string) => {
    switch (type) {
      case 'VACATION': return { text: 'Mehnat ta\'tili', classes: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
      case 'SICK': return { text: 'Kasallik varaqa', classes: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
      default: return { text: 'Hisobidan ta\'til', classes: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Ta&apos;tillar va Ruxsatnomalar</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Xodimlarni ta&apos;tilga chiqarish va ruxsat berish jarayoni</p>
        </div>

        <button
          onClick={handleOpenModal}
          className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all"
        >
          <Plus className="h-4 w-4" /> Xodimni Ta&apos;tilga Chiqarish
        </button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>
        ) : leaves.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
            Hali ta&apos;tillar qayd etilmagan. Yuqoridagi tugma orqali xodimni ta&apos;tilga chiqaring.
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
              <tr>
                <th className="p-4 font-medium">Xodim F.I.SH.</th>
                <th className="p-4 font-medium">Ta&apos;til Turi</th>
                <th className="p-4 font-medium">Boshlanish – Tugash sanasi</th>
                <th className="p-4 font-medium">Sabab / Izoh</th>
                <th className="p-4 font-medium">Holati</th>
                <th className="p-4 font-medium text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leaves.map((l) => {
                const badge = getBadgeType(l.type);
                return (
                  <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium text-foreground">{l.employee?.fullName || "—"}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.classes}`}>
                        {badge.text}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs">
                      {new Date(l.startDate).toLocaleDateString("uz-UZ")} — {new Date(l.endDate).toLocaleDateString("uz-UZ")}
                    </td>
                    <td className="p-4 text-muted-foreground">{l.reason || "—"}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Tasdiqlangan
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(l.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Xodimni Ta'tilga Chiqarish Modali */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-md border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
              <h2 className="text-xl font-bold">Xodimni Ta&apos;tilga Chiqarish</h2>
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
                      {emp.fullName} ({emp.position || "Xodim"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Ta&apos;til turi *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-xl bg-background text-sm font-medium"
                >
                  <option value="VACATION">🏖️ Mehnat ta&apos;tili (Oylik saqlanadi)</option>
                  <option value="SICK">🏥 Kasallik varaqa (Bolyuten)</option>
                  <option value="UNPAID">⏱️ Hisobidan ta&apos;til (Oyliksiz)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Boshlanish sanasi *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-xl bg-background text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Tugash sanasi *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-xl bg-background text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Sabab / Izoh</label>
                <input
                  type="text"
                  placeholder="Masalan: Yillik rejali ta'til"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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
                  {submitting ? "Saqlanmoqda..." : "Ta'tilni tasdiqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
