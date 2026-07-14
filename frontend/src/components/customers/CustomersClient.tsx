"use client";
import { fetcher, swrFetcher } from '@/utils/fetcher';

import useSWR from "swr";
import { useState } from "react";
import { Plus, Users, Search, Phone, Award, X, ShoppingBag } from "lucide-react";


export default function CustomersClient() {
  const { data: customers = [], error, isValidating, mutate } = useSWR("http://localhost:3001/api/customers", swrFetcher, {
    refreshInterval: 5000
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const filteredCustomers = customers.filter((c: any) => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search))
  );

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetcher("http://localhost:3001/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: phone || undefined })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Xatolik yuz berdi");
      }
      setIsModalOpen(false);
      setName("");
      setPhone("");
      mutate();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mijozlar</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Daimiy mijozlar va ularning ballarini boshqarish</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" /> Mijoz Qo&apos;shish
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-12rem)] min-h-[500px]">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Ism yoki telefon orqali qidiring..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            Jami: {customers.length} nafar mijoz
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block flex-1 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/40 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 font-semibold">Mijoz Ismi</th>
                <th className="px-6 py-4 font-semibold">Telefon Raqami</th>
                <th className="px-6 py-4 font-semibold">To'plagan Ballari</th>
                <th className="px-6 py-4 font-semibold">Xaridlar Soni</th>
                <th className="px-6 py-4 font-semibold text-right">Qo'shilgan Sana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isValidating && customers.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Yuklanmoqda...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Mijozlar topilmadi</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                       <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        {c.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" /> {c.phone || "Kiritilmagan"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-bold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full w-max">
                        <Award className="h-4 w-4" /> {c.loyaltyPoints} ball
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" /> {c._count?.sales || 0} ta
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString('uz-UZ')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View */}
        <div className="block md:hidden divide-y divide-border overflow-y-auto max-h-[60vh]">
          {isValidating && customers.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">Yuklanmoqda...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              Mijozlar topilmadi
            </div>
          ) : (
            filteredCustomers.map((c: any) => (
              <div key={c.id} className="p-4 space-y-3 hover:bg-muted/10 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-foreground text-sm">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-xs text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full shrink-0">
                    <Award className="h-3.5 w-3.5" /> {c.loyaltyPoints} ball
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Telefon</p>
                    <p className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                      <Phone className="h-3.5 w-3.5" /> {c.phone || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Xaridlar soni</p>
                    <p className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                      <ShoppingBag className="h-3.5 w-3.5" /> {c._count?.sales || 0} ta
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                  <span>Qo'shilgan sana</span>
                  <span>{new Date(c.createdAt).toLocaleDateString('uz-UZ')}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-background rounded-2xl w-full max-w-md shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-border bg-muted/20">
              <h2 className="text-xl font-bold">Yangi Mijoz Qo&apos;shish</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-muted rounded-full text-muted-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Mijozning F.I.Sh *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan: Aliyev Vali"
                  className="w-full p-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">Telefon Raqami</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Masalan: +998901234567"
                  className="w-full p-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-border rounded-xl font-medium text-sm hover:bg-muted transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-md"
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
