'use client';

import { useState, useEffect } from "react";
import { MapPin, Plus, Phone, Clock, Building2, CheckCircle2, X, Trash2 } from "lucide-react";

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/branches");
      if (res.ok) {
        const data = await res.json();
        setBranches(data);
      }
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:3001/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ name: "", address: "", phone: "" });
        fetchBranches();
        alert("✅ Yangi filial muvaffaqiyatli qo'shildi!");
      }
    } catch (err) {
      alert("Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu filialni o'chirmoqchimisiz?")) return;
    try {
      await fetch(`http://localhost:3001/api/branches/${id}`, { method: "DELETE" });
      fetchBranches();
    } catch (err) {}
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dorixona Filiallari</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Barcha filiallar va ularning ish holatini boshqaring.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all"
        >
          <Plus className="h-4 w-4" /> Filial Qo&apos;shish
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Filiallar yuklanmoqda...</div>
      ) : branches.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground border border-border rounded-2xl">
          Hozircha filiallar yo&apos;q. Yuqoridagi tugma orqali yangi filial qo&apos;shing.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <div key={branch.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Faol
                    </span>
                    <button
                      onClick={() => handleDelete(branch.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-foreground">{branch.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    {branch.address || "Manzil kiritilmagan"}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Telefon:
                    </span>
                    <span className="font-medium text-foreground">{branch.phone || "+998 71 200-00-00"}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Ish vaqti:
                    </span>
                    <span className="font-medium text-foreground">08:00 - 23:00</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filial Qo'shish Modali */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-md border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
              <h2 className="text-xl font-bold">Yangi Filial Qo&apos;shish</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddBranch} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Filial nomi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Chilonzor filiali"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-xl bg-background text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Manzili</label>
                <input
                  type="text"
                  placeholder="Masalan: Toshkent sh., Bunyodkor ko'chasi 24"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-xl bg-background text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Telefon raqami</label>
                <input
                  type="text"
                  placeholder="+998 71 200-00-01"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                  {submitting ? "Saqlanmoqda..." : "Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
