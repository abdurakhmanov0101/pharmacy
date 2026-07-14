'use client';
import { fetcher, swrFetcher } from '@/utils/fetcher';

import useSWR from "swr";
import { useState } from "react";
import { Plus, Users, Search, AlertCircle, X } from "lucide-react";


export default function EmployeesClient() {
  const { data: employees = [], error: fetchError, isValidating: loading, mutate: fetchEmployees } = useSWR("http://localhost:3001/api/employees", swrFetcher, {
    refreshInterval: 5000
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEmpId, setCurrentEmpId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("Umumiy");
  const [salary, setSalary] = useState("0");
  const [contactInfo, setContactInfo] = useState("");
  const [shiftStart, setShiftStart] = useState("09:00");
  const [shiftEnd, setShiftEnd] = useState("18:00");



  const handleDelete = async (id: string) => {
    if (!confirm("Rostdan ham ushbu xodimni o'chirmoqchimisiz?")) return;
    try {
      const res = await fetcher(`http://localhost:3001/api/employees/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchEmployees();
      } else {
        alert("O'chirishda xatolik yuz berdi");
      }
    } catch (err) {
      alert("O'chirishda xatolik yuz berdi");
    }
  };

  const openEditModal = (emp: any) => {
    setFullName(emp.fullName);
    setPosition(emp.position || '');
    setDepartment(emp.department || 'Umumiy');
    setSalary(emp.salary ? emp.salary.toString() : '0');
    setContactInfo(emp.contactInfo || '');
    setShiftStart(emp.shiftStart || '09:00');
    setShiftEnd(emp.shiftEnd || '18:00');
    setCurrentEmpId(emp.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setFullName("");
    setPosition("");
    setDepartment("Umumiy");
    setSalary("0");
    setContactInfo("");
    setShiftStart("09:00");
    setShiftEnd("18:00");
    setCurrentEmpId(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!fullName) {
      alert("Iltimos, ism-sharifni kiriting");
      return;
    }

    try {
      const url = isEditMode && currentEmpId 
        ? `http://localhost:3001/api/employees/${currentEmpId}` 
        : 'http://localhost:3001/api/employees';
      
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetcher(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          position,
          department,
          salary,
          contactInfo,
          shiftStart,
          shiftEnd
        })
      });

      if (!res.ok) throw new Error("Saqlashda xatolik");
      
      closeModal();
      fetchEmployees();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Xodimlar</h1>
          <p className="text-muted-foreground mt-1">Xodimlarni boshqarish tizimi</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-5 w-5" />
          Yangi Xodim
        </button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="glass-panel rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse">Yuklanmoqda...</div>
        ) : employees.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Hali xodimlar qo'shilmagan.</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                    <th className="text-left p-4 font-medium">F.I.SH.</th>
                    <th className="text-left p-4 font-medium">Lavozim</th>
                    <th className="text-left p-4 font-medium">Ish jadvali</th>
                    <th className="text-left p-4 font-medium">Qo'shilgan sana</th>
                    <th className="text-right p-4 font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {employees.map((emp: any) => (
                    <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium">{emp.fullName}</td>
                      <td className="p-4 text-muted-foreground">{emp.position || "—"}</td>
                      <td className="p-4 text-muted-foreground">{emp.shiftStart} - {emp.shiftEnd}</td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(emp.createdAt).toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditModal(emp)} className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-primary/10">
                            O'zgartirish
                          </button>
                          <button onClick={() => handleDelete(emp.id)} className="p-2 text-muted-foreground hover:text-red-500 transition-colors rounded-md hover:bg-red-50">
                            O'chirish
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden divide-y divide-border overflow-y-auto max-h-[calc(100vh-280px)]">
              {employees.map((emp: any) => (
                <div key={emp.id} className="p-4 space-y-3 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{emp.fullName}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{emp.position || "Lavozim kiritilmagan"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] sm:text-xs">
                    <div>
                      <p className="text-muted-foreground">Ish jadvali</p>
                      <p className="font-medium text-foreground">{emp.shiftStart} - {emp.shiftEnd}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Qo'shilgan sana</p>
                      <p className="font-medium text-foreground">
                        {new Date(emp.createdAt).toLocaleDateString('uz-UZ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/50">
                    <button
                      type="button"
                      onClick={() => openEditModal(emp)}
                      className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-semibold transition-colors"
                    >
                      O'zgartirish
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(emp.id)}
                      className="px-3 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg text-xs font-semibold transition-colors"
                    >
                      O'chirish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
              <div>
                <h2 className="text-xl font-bold">{isEditMode ? "Xodimni Tahrirlash" : "Yangi Xodim Qo'shish"}</h2>
                <p className="text-sm text-muted-foreground mt-1">Xodim ma'lumotlarini kiriting.</p>
              </div>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">F.I.SH.</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl bg-background shadow-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    placeholder="Masalan: Dilnoza Karimova"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Lavozim</label>
                  <input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl bg-background shadow-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    placeholder="Masalan: Farmatsevt"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">Bo'lim</label>
                    <input
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full p-2.5 border border-border rounded-xl bg-background shadow-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                      placeholder="Masalan: Umumiy"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">Asosiy maosh (so'm)</label>
                    <input
                      type="number"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      className="w-full p-2.5 border border-border rounded-xl bg-background shadow-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Bog'lanish uchun (Telefon)</label>
                  <input
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl bg-background shadow-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    placeholder="+998 90 123 45 67"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">Ish boshlash (HH:mm)</label>
                    <input
                      type="time"
                      value={shiftStart}
                      onChange={(e) => setShiftStart(e.target.value)}
                      className="w-full p-2.5 border border-border rounded-xl bg-background shadow-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">Ish tugashi (HH:mm)</label>
                    <input
                      type="time"
                      value={shiftEnd}
                      onChange={(e) => setShiftEnd(e.target.value)}
                      className="w-full p-2.5 border border-border rounded-xl bg-background shadow-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-end gap-3 bg-muted/20">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-border rounded-xl font-medium hover:bg-muted transition-colors shadow-sm"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSave}
                disabled={!fullName}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
