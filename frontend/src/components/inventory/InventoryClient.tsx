"use client";

import { useState, useEffect, useMemo } from "react";
import { Package, Search, Plus, Store, X, ArrowDownLeft, CheckCircle2, Printer } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import BarcodePrinter from "./BarcodePrinter";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function InventoryClient() {
  const { t } = useLanguage();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [medicines, setMedicines] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const { data: branches = [] } = useSWR("http://localhost:3001/api/branches", fetcher, {
    onSuccess: (data) => {
      if (data.length > 0 && !selectedBranchId) setSelectedBranchId(data[0].id);
    }
  });

  const { data: inventory = [], isValidating: loading, mutate: fetchInventory } = useSWR(
    selectedBranchId ? `http://localhost:3001/api/inventory?branchId=${selectedBranchId}` : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewMed, setIsNewMed] = useState(false);
  const [formData, setFormData] = useState({
    medicineId: "",
    name: "",
    genericName: "",
    purchasePrice: "",
    price: "",
    quantity: "10",
    expiryDate: "",
    batchNumber: "",
    barcode: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [printItem, setPrintItem] = useState<any>(null);



  const openKirimModal = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/medicines");
      const meds = await res.json();
      setMedicines(meds);
    } catch (err) {}

    setIsNewMed(false);
    setFormData({
      medicineId: "",
      name: "",
      genericName: "",
      purchasePrice: "",
      price: "",
      quantity: "10",
      expiryDate: "",
      batchNumber: "",
      barcode: ""
    });
    setIsModalOpen(true);
  };

  const handleSelectMedicine = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const medId = e.target.value;
    if (medId === "NEW") {
      setIsNewMed(true);
      setFormData({ ...formData, medicineId: "" });
      return;
    }
    setIsNewMed(false);
    const found = medicines.find(m => m.id === medId);
    setFormData({
      ...formData,
      medicineId: medId,
      name: found ? found.name : "",
      price: found ? String(found.price || "") : "",
      purchasePrice: found && found.purchasePrice ? String(found.purchasePrice) : ""
    });
  };

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) {
      alert("Iltimos, filialni tanlang");
      return;
    }
    if (!formData.purchasePrice || !formData.price || !formData.quantity) {
      alert("Iltimos, barcha narx va miqdorlarni kiriting");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        medicineId: isNewMed ? undefined : formData.medicineId || undefined,
        name: isNewMed ? formData.name : undefined,
        genericName: isNewMed ? formData.genericName : undefined,
        purchasePrice: Number(formData.purchasePrice),
        price: Number(formData.price),
        quantity: Number(formData.quantity),
        branchId: selectedBranchId,
        expiryDate: formData.expiryDate || undefined,
        batchNumber: formData.batchNumber || undefined,
        barcode: formData.barcode || (isNewMed ? Math.floor(10000000 + Math.random() * 90000000).toString() : undefined)
      };

      const res = await fetch("http://localhost:3001/api/inventory/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Kirim qilishda xatolik");

      setIsModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      alert(err.message || "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const filteredInventory = useMemo(() => {
    return inventory.filter((inv: any) => 
      inv.medicine?.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [inventory, search]);

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage) || 1;
  const paginatedInventory = useMemo(() => {
    return filteredInventory.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredInventory, currentPage, itemsPerPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Ombor Qoldiqlari</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Ombordagi tovarlarni boshqarish va kirim qilish</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Dori nomini qidiring..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg outline-none focus:border-primary transition-colors text-sm"
          />
        </div>
        <button
          onClick={openKirimModal}
          className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-md transition-all"
        >
          <Plus className="h-4 w-4" /> Kirim qilish (Omborga tovar qo&apos;shish)
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Dori nomi</th>
                <th className="px-6 py-4">Kategoriya</th>
                <th className="px-6 py-4">Kelish narxi</th>
                <th className="px-6 py-4">Sotish narxi</th>
                <th className="px-6 py-4">Qoldiq (soni)</th>
                <th className="px-6 py-4 text-right">Harakat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">Yuklanmoqda...</td>
                </tr>
              ) : paginatedInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    Omborda hozircha tovarlar yo&apos;q
                  </td>
                </tr>
              ) : (
                paginatedInventory.map((item: any) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{item.medicine.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.medicine.category?.name || '-'}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {item.medicine.purchasePrice ? `${item.medicine.purchasePrice.toLocaleString()} so'm` : "—"}
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {item.medicine.price.toLocaleString()} so&apos;m
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.quantity > 20 ? 'bg-emerald-500/10 text-emerald-600' : item.quantity > 0 ? 'bg-orange-500/10 text-orange-600' : 'bg-red-500/10 text-red-600'}`}>
                        {item.quantity} dona
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                      <button 
                        onClick={() => setPrintItem({
                          name: item.medicine.name,
                          price: item.medicine.price,
                          barcode: item.medicine.barcode || item.medicine.id
                        })}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Barkodni Xprinter'ga chiqarish"
                      >
                        <Printer className="w-5 h-5" />
                      </button>
                      <button onClick={openKirimModal} className="text-primary hover:underline text-xs font-medium">Kirim</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View */}
        <div className="block md:hidden divide-y divide-border overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">Yuklanmoqda...</div>
          ) : paginatedInventory.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
              Omborda hozircha tovarlar yo&apos;q
            </div>
          ) : (
            paginatedInventory.map((item: any) => (
              <div key={item.id} className="p-4 space-y-3 hover:bg-muted/10 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">{item.medicine.name}</h4>
                    {item.medicine.category?.name && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                        {item.medicine.category.name}
                      </span>
                    )}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                    item.quantity > 20 
                      ? 'bg-emerald-500/10 text-emerald-600' 
                      : item.quantity > 0 
                      ? 'bg-orange-500/10 text-orange-600' 
                      : 'bg-red-500/10 text-red-600'
                  }`}>
                    {item.quantity} dona
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] sm:text-xs">
                  <div>
                    <p className="text-muted-foreground">Kelish narxi</p>
                    <p className="font-medium text-foreground">
                      {item.medicine.purchasePrice ? `${item.medicine.purchasePrice.toLocaleString()} so'm` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sotish narxi</p>
                    <p className="font-semibold text-green-600">{item.medicine.price.toLocaleString()} so'm</p>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-border/50">
                  <button
                    type="button"
                    onClick={openKirimModal}
                    className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Qo'shimcha kirim
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Inventory Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border">
          <span className="text-xs sm:text-sm text-muted-foreground font-medium">
            Ko&apos;rsatildi: {paginatedInventory.length} ta (Jami {filteredInventory.length} ta dori)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-1.5 border border-border rounded-lg text-xs font-semibold disabled:opacity-40 hover:bg-muted transition-colors"
            >
              Oldingi
            </button>
            <span className="text-xs font-bold px-2">
              Sahifa {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3.5 py-1.5 border border-border rounded-lg text-xs font-semibold disabled:opacity-40 hover:bg-muted transition-colors"
            >
              Keyingi
            </button>
          </div>
        </div>
      </div>

      {/* Kirim Qilish Modali */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ArrowDownLeft className="h-5 w-5 text-primary" /> Omborga yangi kirim
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Dorining kelish narxi va sotish narxini aniq kiriting.
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleReceiveSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Dorini tanlang</label>
                <select
                  value={isNewMed ? "NEW" : formData.medicineId}
                  onChange={handleSelectMedicine}
                  className="w-full p-2.5 border border-border rounded-xl bg-background text-sm"
                >
                  <option value="">-- Mavjud dorilar ro&apos;yxatidan tanlang --</option>
                  <option value="NEW">➕ YANGI DORI QO&apos;SHISH</option>
                  {medicines.slice(0, 150).map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.price?.toLocaleString()} so&apos;m)</option>
                  ))}
                </select>
              </div>

              {isNewMed && (
                <div className="space-y-3 bg-muted/30 p-3.5 rounded-xl border border-border">
                  <div>
                    <label className="block text-xs font-medium mb-1">Yangi dori nomi *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Masalan: Trimol 100mg"
                      className="w-full p-2 border border-border rounded-lg bg-background text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Xalqaro nomi / Turi</label>
                    <input
                      type="text"
                      value={formData.genericName}
                      onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                      placeholder="Masalan: Paracetamol"
                      className="w-full p-2 border border-border rounded-lg bg-background text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-emerald-600">Kelish narxi (so&apos;m) *</label>
                  <input
                    type="number"
                    required
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    placeholder="Masalan: 15000"
                    className="w-full p-2.5 border border-border rounded-xl bg-background text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-0.5">Omborga kelish narxi</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-blue-600">Sotish narxi (so&apos;m) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Masalan: 20000"
                    className="w-full p-2.5 border border-border rounded-xl bg-background text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-0.5">Mijozlarga sotilish narxi</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Miqdori (dona) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-xl bg-background text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Yaroqlilik muddati</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-xl bg-background text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Seriya raqami</label>
                  <input
                    type="text"
                    placeholder="BATCH-101"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-xl bg-background text-sm"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-muted font-medium transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-medium shadow-md transition-all flex items-center gap-2"
                >
                  {submitting ? "Saqlanmoqda..." : "Kirimni tasdiqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {printItem && (
        <BarcodePrinter 
          name={printItem.name} 
          price={printItem.price} 
          barcode={printItem.barcode} 
          onPrinted={() => setPrintItem(null)} 
        />
      )}
    </div>
  );
}
