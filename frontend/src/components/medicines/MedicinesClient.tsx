'use client';
import { fetcher } from '@/utils/fetcher';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useLanguage } from '@/i18n/LanguageContext';

export default function MedicinesClient({ initialMedicines }: { initialMedicines: any[] }) {
  const { t } = useLanguage();
  const [medicines, setMedicines] = useState(initialMedicines);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(initialMedicines.length);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentMedicineId, setCurrentMedicineId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    price: '',
    dosage: '',
    barcode: '',
    categoryName: '',
    quantity: '',
    mxikCode: '',
    nds: '12'
  });

  // Server-side pagination means medicines is already paginated
  const paginatedMedicines = medicines;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentMedicineId(null);
    setFormData({ name: '', genericName: '', price: '', dosage: '', barcode: '', categoryName: '', quantity: '', mxikCode: '', nds: '12' });
    setIsModalOpen(true);
  };

  const openEditModal = (med: any) => {
    setIsEditMode(true);
    setCurrentMedicineId(med.id);
    setFormData({
      name: med.name,
      genericName: med.genericName || '',
      price: med.price.toString(),
      dosage: med.dosage || '',
      barcode: med.barcode || '',
      categoryName: med.category?.name || '',
      quantity: med.inventory?.[0]?.quantity?.toString() || '',
      mxikCode: med.mxikCode || '',
      nds: (med.nds || 12).toString()
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fetchMedicines = async (query = '', page = 1) => {
    try {
      const url = `http://localhost:3001/api/medicines?search=${encodeURIComponent(query)}&page=${page}&limit=${itemsPerPage}`;
      const res = await fetcher(url);
      if (res.ok) {
        const result = await res.json();
        if (result.data && result.meta) {
          setMedicines(result.data);
          setTotalPages(result.meta.totalPages || 1);
          setTotalItems(result.meta.total || 0);
        } else {
          // Fallback if old API
          setMedicines(result);
        }
      }
    } catch (err) {
      console.error('Failed to fetch medicines');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMedicines(searchQuery.trim(), currentPage);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, currentPage]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false }) as any[];
        
        const payload = jsonData.map((rawRow: any) => {
          const row: any = {};
          for (const key in rawRow) {
            row[key.trim().toLowerCase()] = rawRow[key];
          }

          const parseNumber = (val: any) => {
            if (!val) return 0;
            if (typeof val === 'number') return val;
            const str = String(val).replace(/[^0-9.]/g, '');
            return Number(str) || 0;
          };

          const getVal = (keys: string[]) => {
            for (const k of keys) {
              if (row[k] !== undefined) return row[k];
            }
            return '';
          };

          const priceVal = getVal(['price', 'narx', 'narxi', 'narxi (uzs)', 'цена']);
          const qtyVal = getVal(['quantity', 'qty', 'soni', 'qoldiq', 'stock', 'остаток', 'кол-во', 'miqdor', 'miqdori', 'soni (ombor)']);
          const barcodeVal = getVal(['barcode', 'barkod', 'штрихкод', 'shtrix-kod', 'shtrix kod', 'shtrixkod']);

          return {
            name: String(row.name || row.nomi || row.наименование || row.maxsulot || row['dori nomi'] || row.tovar || row.mahsulot || '').trim(),
            genericName: String(row['generic name'] || row.genericname || row.tarkibi || row.состав || '').trim(),
            categoryName: String(row.category || row.kategoriya || row.категория || '').trim(),
            price: parseNumber(priceVal),
            dosage: String(row.dosage || row.dozasi || row.дозировка || '').trim(),
            barcode: String(barcodeVal || '').trim(),
            quantity: parseNumber(qtyVal)
          };
        }).filter((med: any) => med.name); // faqat nomi borlarini olamiz

        if (payload.length === 0) {
          alert(t('medicines.alerts.noValidExcel'));
          return;
        }

        const chunkSize = 500;
        let successCount = 0;
        let hasError = false;

        for (let i = 0; i < payload.length; i += chunkSize) {
          const chunk = payload.slice(i, i + chunkSize);
          const res = await fetcher('http://localhost:3001/api/medicines/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chunk),
          });

          if (res.ok) {
            successCount += chunk.length;
          } else {
            hasError = true;
            console.error(`Chunk ${i} failed`);
          }
        }

        if (successCount > 0) {
          await fetchMedicines();
          alert(`${successCount} / ${payload.length} ${t('medicines.alerts.importSuccess')} ${hasError ? '(Ba\'zilari xato)' : ''}`);
        } else {
          alert(t('medicines.alerts.importError'));
        }
      } catch (err) {
        console.error(err);
        alert(t('medicines.alerts.excelParseError'));
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
      const payload = {
        name: formData.name,
        genericName: formData.genericName,
        price: Number(formData.price),
        dosage: formData.dosage,
        barcode: formData.barcode,
        categoryName: formData.categoryName,
        quantity: formData.quantity ? Number(formData.quantity) : 0,
        mxikCode: formData.mxikCode,
        nds: Number(formData.nds)
      };

    try {
      if (isEditMode) {
        const res = await fetcher(`http://localhost:3001/api/medicines/${currentMedicineId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetcher('http://localhost:3001/api/medicines/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([payload]),
        });
        if (!res.ok) throw new Error();
      }
      
      await fetchMedicines();
      closeModal();
    } catch (err) {
      alert(t('medicines.alerts.saveError'));
    }
  };

  const handleExportExcel = () => {
    // Prepare data for export
    const dataToExport = medicines.map((med: any) => ({
      [t('medicines.columns.name')]: med.name,
      [t('medicines.columns.genericName')]: med.genericName || '',
      [t('medicines.columns.category')]: med.category?.name || '',
      [t('medicines.columns.dosage')]: med.dosage || '',
      [t('medicines.columns.price')]: med.price,
      [t('medicines.columns.stock')]: med.inventory?.reduce((sum: number, inv: any) => sum + inv.quantity, 0) || 0,
      [t('medicines.columns.barcode')]: med.barcode || ''
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Medicines');

    // Generate Excel file and trigger download
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, 'medicines_export.xlsx');
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Nomi": "Paratsetamol",
        "Tarkibi": "Paratsetamol 500mg",
        "Kategoriya": "Isitma tushiruvchi",
        "Narxi": 2500,
        "Dozasi": "500 mg",
        "Shtrix-kod": "4780000000001",
        "Soni (Ombor)": 100
      },
      {
        "Nomi": "Trimol",
        "Tarkibi": "Paratsetamol + Kofein",
        "Kategoriya": "Og'riq qoldiruvchi",
        "Narxi": 4500,
        "Dozasi": "Tab",
        "Shtrix-kod": "4780000000002",
        "Soni (Ombor)": 50
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Shablon');
    XLSX.writeFile(workbook, 'dori_qoshish_shabloni.xlsx');
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('medicines.alerts.confirmDelete'))) return;
    try {
      const res = await fetcher(`http://localhost:3001/api/medicines/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchMedicines();
      } else {
        alert(t('medicines.alerts.deleteError'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            {t('medicines.title')}
            <span className="text-xs sm:text-sm px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {totalItems} ta
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t('medicines.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleFileUpload} 
          />
          <div className="flex gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-blue-500/10 text-blue-600 font-semibold rounded-xl flex items-center gap-2 hover:bg-blue-500/20 transition-colors border border-blue-500/20"
            >
              <Download className="h-4 w-4" /> Shablon
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-emerald-500/10 text-emerald-600 font-semibold rounded-xl flex items-center gap-2 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
            >
              <Upload className="h-4 w-4" /> {t('medicines.importExcel')}
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-amber-500/10 text-amber-600 font-semibold rounded-xl flex items-center gap-2 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
            >
              <Download className="h-4 w-4" /> {t('medicines.exportExcel')}
            </button>
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 text-xs sm:text-sm bg-primary text-primary-foreground px-3 sm:px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> {t('medicines.addMedicine')}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder={t('medicines.searchPlaceholder')} 
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
      </div>

      <div className="border border-border rounded-lg bg-card overflow-hidden flex-1 flex flex-col">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">{t('medicines.columns.name')}</th>
                <th className="px-6 py-4 font-medium">{t('medicines.columns.genericName')}</th>
                <th className="px-6 py-4 font-medium">{t('medicines.columns.category')}</th>
                <th className="px-6 py-4 font-medium">{t('medicines.columns.dosage')}</th>
                <th className="px-6 py-4 font-medium">{t('medicines.columns.price')}</th>
                <th className="px-6 py-4 font-medium">{t('medicines.columns.stock')}</th>
                <th className="px-6 py-4 font-medium">{t('medicines.columns.barcode')}</th>
                <th className="px-6 py-4 text-right font-medium">{t('medicines.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMedicines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                    {t('medicines.noMedicinesFound')}
                  </td>
                </tr>
              ) : (
                paginatedMedicines.map((med: any) => (
                  <tr key={med.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{med.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{med.genericName}</td>
                    <td className="px-6 py-4 text-muted-foreground">{med.category?.name}</td>
                    <td className="px-6 py-4">{med.dosage}</td>
                    <td className="px-6 py-4 font-medium text-green-600">{med.price.toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-primary">
                      {med.inventory?.reduce((sum: number, inv: any) => sum + inv.quantity, 0) || 0}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{med.barcode || 'N/A'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(med)} className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-primary/10">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(med.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View */}
        <div className="block md:hidden divide-y divide-border overflow-y-auto max-h-[60vh]">
          {paginatedMedicines.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              {t('medicines.noMedicinesFound')}
            </div>
          ) : (
            paginatedMedicines.map((med: any) => {
              const stock = med.inventory?.reduce((sum: number, inv: any) => sum + inv.quantity, 0) || 0;
              return (
                <div key={med.id} className="p-4 space-y-3 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{med.name}</h4>
                      {med.genericName && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{med.genericName}</p>
                      )}
                    </div>
                    {med.category?.name && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary shrink-0">
                        {med.category.name}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] sm:text-xs">
                    <div>
                      <p className="text-muted-foreground">Dozasi / Shakli</p>
                      <p className="font-medium text-foreground">{med.dosage || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Barkod</p>
                      <p className="font-mono text-foreground truncate max-w-[120px]">{med.barcode || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Narxi</p>
                      <p className="font-semibold text-green-600">{med.price.toLocaleString()} UZS</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Qoldiq</p>
                      <p className={`font-bold ${stock > 10 ? 'text-primary' : 'text-destructive'}`}>
                        {stock} dona
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/50">
                    <button
                      type="button"
                      onClick={() => openEditModal(med)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Tahrirlash</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(med.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>O'chirish</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border bg-card">
          <span className="text-xs sm:text-sm text-muted-foreground font-medium">
            Ko&apos;rsatildi: {paginatedMedicines.length} ta (Jami {totalItems} ta dori)
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-lg">{isEditMode ? t('medicines.editMedicine') : t('medicines.addMedicine')}</h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              <form id="medicineForm" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('medicines.form.name')} <span className="text-red-500">*</span></label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t('medicines.form.genericName')}</label>
                    <input name="genericName" value={formData.genericName} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Kategoriya</label>
                    <input name="categoryName" value={formData.categoryName || ''} onChange={handleInputChange} placeholder="Yangi yoki mavjud" className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t('medicines.form.price')} <span className="text-red-500">*</span></label>
                    <input required type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t('medicines.form.dosage')}</label>
                    <input name="dosage" value={formData.dosage} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t('medicines.form.barcode')}</label>
                    <input name="barcode" value={formData.barcode} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">QQS (NDS) %</label>
                    <input name="nds" type="number" value={formData.nds} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Soliq Katalog Kodi (MXIK)</label>
                  <input name="mxikCode" value={formData.mxikCode} onChange={handleInputChange} placeholder="06903001001000000" className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm" />
                </div>
                {!isEditMode && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-primary">Soni (Nechta kirim qilish)</label>
                    <input type="number" name="quantity" value={formData.quantity || ''} onChange={handleInputChange} placeholder="0" className="w-full px-3 py-2 border border-primary/30 rounded-lg outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                )}
              </form>
            </div>
            <div className="p-5 border-t bg-muted/20 flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="px-5 py-2.5 border rounded-lg hover:bg-muted font-medium transition-colors">{t('medicines.cancel')}</button>
              <button type="submit" form="medicineForm" className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium shadow-sm transition-colors">
                {isEditMode ? t('medicines.saveChanges') : t('medicines.addMedicine')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
