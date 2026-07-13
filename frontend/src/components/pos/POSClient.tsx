'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, X, ScanLine, Zap, CheckCircle2, Package } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

export default function POSClient({ initialMedicines }: { initialMedicines: any[] }) {
  const { t } = useLanguage();
  const [medicines, setMedicines] = useState(initialMedicines);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 36;
  const [cart, setCart] = useState<any[]>([]);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH or CARD

  // Barcode scanner settings & feedback
  const [autoCheckoutOnScan, setAutoCheckoutOnScan] = useState(false);
  const [scanNotification, setScanNotification] = useState<string | null>(null);
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  // Audio beep effect for barcode scanner
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  };

  // Fetch updated medicines to show real-time remaining inventory
  const fetchUpdatedMedicines = async (query = '') => {
    try {
      const url = query
        ? `http://localhost:3001/api/medicines?search=${encodeURIComponent(query)}&limit=100`
        : `http://localhost:3001/api/medicines?limit=300`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMedicines(data);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchUpdatedMedicines();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        fetchUpdatedMedicines(searchQuery.trim());
      } else if (searchQuery.trim().length === 0) {
        fetchUpdatedMedicines();
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Global Barcode Scanner Listener (Hardware scanner simulates rapid keyboard input ending in Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input/textarea except our search box
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      const now = Date.now();
      if (now - lastKeyTimeRef.current > 100) {
        barcodeBufferRef.current = '';
      }
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        // Check buffer or searchQuery if it looks like a barcode
        const codeToMatch = barcodeBufferRef.current.trim() || (isInput ? searchQuery.trim() : '');
        if (codeToMatch.length >= 4) {
          handleBarcodeScanned(codeToMatch);
          barcodeBufferRef.current = '';
          if (isInput) setSearchQuery('');
          e.preventDefault();
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [medicines, cart, autoCheckoutOnScan, searchQuery]);

  const showScanToast = (msg: string) => {
    setScanNotification(msg);
    setTimeout(() => {
      setScanNotification(null);
    }, 3500);
  };

  const handleBarcodeScanned = async (barcode: string) => {
    const found = medicines.find(m => m.barcode === barcode || m.name.toLowerCase() === barcode.toLowerCase());

    if (!found) {
      playBeep();
      showScanToast(`⚠️ Barkod topilmadi: "${barcode}"`);
      return;
    }

    playBeep();

    if (autoCheckoutOnScan) {
      // Instant 1-click checkout for scanner
      try {
        const payload = {
          items: [{ medicineId: found.id, quantity: 1, unitPrice: found.price }],
          totalAmount: found.price,
          paymentMethod: 'CASH'
        };
        const res = await fetch('http://localhost:3001/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showScanToast(`⚡ TEZKOR SOTUV (Skaner): "${found.name}" (1 dona) sotildi va ombordan kamaydi!`);
          fetchUpdatedMedicines();
        }
      } catch (err) {
        showScanToast(`❌ Sotuvda xatolik yuz berdi`);
      }
    } else {
      addToCart(found);
      showScanToast(`✅ Skanerlandi: "${found.name}" savatga qo'shildi!`);
    }
  };

  const filteredMedicines = medicines.filter(med => 
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (med.barcode && med.barcode.includes(searchQuery))
  );

  const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage) || 1;
  const paginatedMedicines = filteredMedicines.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const addToCart = (medicine: any) => {
    const existing = cart.find(item => item.id === medicine.id);
    if (existing) {
      setCart(cart.map(item => item.id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...medicine, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    try {
      const payload = {
        items: cart.map(item => ({
          medicineId: item.id,
          quantity: item.quantity,
          unitPrice: item.price
        })),
        totalAmount,
        paymentMethod
      };

      const res = await fetch('http://localhost:3001/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(t('pos.successMessage') || "✅ Sotuv muvaffaqiyatli amalga oshdi va dorilar ombordan chegirildi!");
        setCart([]);
        setIsCheckoutModalOpen(false);
        fetchUpdatedMedicines();
      } else {
        alert(t('pos.errorMessage') || "Sotuvda xatolik");
      }
    } catch (err) {
      console.error(err);
      alert(t('pos.errorMessage') || "Xatolik");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      {/* Toast Notification Banner for Scanner */}
      {scanNotification && (
        <div className="fixed top-6 right-6 z-50 bg-foreground text-background px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-border animate-in fade-in slide-in-from-top-4 duration-300">
          <ScanLine className="h-5 w-5 text-emerald-400 shrink-0 animate-pulse" />
          <span className="font-semibold text-sm">{scanNotification}</span>
        </div>
      )}

      {/* Catalog Section */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('pos.catalog') || "Sotuv (POS & Skaner)"}</h2>
            <p className="text-xs text-muted-foreground">Barkod skaner apparati yordamida yoki qo&apos;lda dorilarni qidiring</p>
          </div>

          {/* Instant Auto-Checkout Switch for Scanner */}
          <button
            type="button"
            onClick={() => setAutoCheckoutOnScan(!autoCheckoutOnScan)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              autoCheckoutOnScan
                ? "bg-amber-500/10 text-amber-600 border-amber-500/30 shadow-sm"
                : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
            }`}
          >
            <Zap className={`h-4 w-4 ${autoCheckoutOnScan ? "text-amber-500 fill-amber-500" : ""}`} />
            <span>Skanerda 1-Klik Sotish: {autoCheckoutOnScan ? "YONIQ" : "O'CHIQ"}</span>
          </button>
        </div>
        
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Skanerlang yoki Dori nomi / Barkod qidiring (Enter bosing)..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm font-medium"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-1 pb-10 md:pb-0 flex flex-col justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedMedicines.map((med: any) => {
              const qtyRemaining = med.inventory?.[0]?.quantity ?? 0;
              return (
                <div key={med.id} onClick={() => addToCart(med)} className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <p className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">{med.name}</p>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                        qtyRemaining > 10 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                      }`}>
                        {qtyRemaining} ta
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{med.dosage || med.genericName}</p>
                    {med.barcode && (
                      <p className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                        <ScanLine className="h-3 w-3" /> {med.barcode}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                    <p className="font-bold text-green-600">{med.price.toLocaleString()} UZS</p>
                    <div className="bg-primary/10 text-primary p-1.5 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity">
                      <Plus className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              );
            })}
            {paginatedMedicines.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                {t('medicines.noMedicinesFound') || "Dorilar topilmadi."}
              </div>
            )}
          </div>

          {/* POS Pagination Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t border-border">
            <span className="text-xs text-muted-foreground font-medium">
              Ko&apos;rsatildi: {paginatedMedicines.length} ta (Jami {filteredMedicines.length} ta dori)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-1.5 border border-border rounded-lg text-xs font-semibold disabled:opacity-40 hover:bg-muted transition-colors bg-card"
              >
                Oldingi
              </button>
              <span className="text-xs font-bold px-2">
                Sahifa {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3.5 py-1.5 border border-border rounded-lg text-xs font-semibold disabled:opacity-40 hover:bg-muted transition-colors bg-card"
              >
                Keyingi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-full lg:w-96 bg-card border border-border rounded-2xl flex flex-col h-full shadow-sm">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30 rounded-t-2xl">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" /> {t('pos.cart')}
          </h3>
          <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
            {cart.reduce((acc, item) => acc + item.quantity, 0)} dona
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm text-center px-6 py-12">
              <ScanLine className="h-10 w-10 mb-3 opacity-20" />
              <p>Savat bo&apos;sh. Barkod skanerlang yoki dorini tanlab qo&apos;shing.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center justify-between gap-3 p-3 bg-muted/20 rounded-xl border border-border/60">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-xs font-semibold text-green-600 mt-0.5">{item.price.toLocaleString()} UZS</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-background rounded-lg p-1 border border-border">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-muted rounded transition-colors"><Minus className="h-3 w-3" /></button>
                    <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-muted rounded transition-colors"><Plus className="h-3 w-3" /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-muted/30 border-t border-border rounded-b-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">{t('pos.total')}</span>
            <span className="text-2xl font-bold text-foreground">{totalAmount.toLocaleString()} UZS</span>
          </div>
          <button 
            disabled={cart.length === 0}
            onClick={() => setIsCheckoutModalOpen(true)}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-base hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="h-5 w-5" /> {t('pos.checkout')}
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-border">
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
              <h3 className="font-bold text-xl">{t('pos.checkoutTitle') || "To'lovni amalga oshirish"}</h3>
              <button onClick={() => setIsCheckoutModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">To&apos;lanadigan umumiy summa:</p>
                <p className="text-3xl font-bold text-primary">{totalAmount.toLocaleString()} UZS</p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium">To&apos;lov turini tanlang</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border font-semibold text-sm transition-all ${
                      paymentMethod === 'CASH'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <Banknote className="h-5 w-5" /> Naqd pul
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border font-semibold text-sm transition-all ${
                      paymentMethod === 'CARD'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <CreditCard className="h-5 w-5" /> Plastik karta / Click
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="flex-1 py-3 px-4 border border-border rounded-xl font-medium text-sm hover:bg-muted transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-md"
                >
                  Tasdiqlash & Sotish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
