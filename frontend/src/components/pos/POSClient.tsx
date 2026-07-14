'use client';
import { fetcher, swrFetcher } from '@/utils/fetcher';

import useSWR from 'swr';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, X, ScanLine, Zap, CheckCircle2, Package, Camera, Wallet, Lock, LogOut, Clock } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import MobileScanner from './MobileScanner';
import ReceiptPrinter from "./ReceiptPrinter";


export default function POSClient({ initialMedicines }: { initialMedicines: any[] }) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 36;
  const [cart, setCart] = useState<any[]>([]);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH or CARD or MIXED
  const [cashAmount, setCashAmount] = useState<string>('');
  const [activeMobileTab, setActiveMobileTab] = useState<'catalog' | 'cart'>('catalog');
  const [isMobileScannerOpen, setIsMobileScannerOpen] = useState(false);

  // Barcode scanner settings & feedback
  const [autoCheckoutOnScan, setAutoCheckoutOnScan] = useState(true);
  const [scanNotification, setScanNotification] = useState<string | null>(null);
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const [receiptData, setReceiptData] = useState<any>(null);

  // Session states
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [startingCash, setStartingCash] = useState<string>('');
  const [closingCash, setClosingCash] = useState<string>('');
  const [isClosingSession, setIsClosingSession] = useState(false);

  const { data: currentSession, mutate: mutateSession } = useSWR(
    `http://localhost:3001/api/sessions/current-default`, swrFetcher,
    { refreshInterval: 5000 }
  );

  const { data: dailySales } = useSWR(
    `http://localhost:3001/api/reports/daily`, swrFetcher,
    { refreshInterval: 10000 }
  );

  const { data: customersData = [] } = useSWR(
    `http://localhost:3001/api/customers`,
    swrFetcher
  );

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

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

  const { data: medicinesData = { data: initialMedicines }, mutate: mutateMedicines } = useSWR(
    searchQuery.trim().length >= 2
      ? `http://localhost:3001/api/medicines?search=${encodeURIComponent(searchQuery.trim())}&limit=100`
      : `http://localhost:3001/api/medicines?limit=300`, swrFetcher,
    { fallbackData: { data: initialMedicines }, refreshInterval: 5000 }
  );
  
  const medicines = Array.isArray(medicinesData) ? medicinesData : (medicinesData?.data || []);

  // Global Barcode Scanner Listener (Hardware scanner simulates rapid keyboard input ending in Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input/textarea except our search box
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      const now = Date.now();
      if (now - lastKeyTimeRef.current > 250) {
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

  const lastScanTimeRef = useRef<number>(0);

  const handleBarcodeScanned = async (barcode: string) => {
    const now = Date.now();
    if (now - lastScanTimeRef.current < 500) {
      return; // Debounce
    }
    lastScanTimeRef.current = now;

    const found = medicines.find((m: any) => m.barcode === barcode || m.name.toLowerCase() === barcode.toLowerCase());

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
        const res = await fetcher('http://localhost:3001/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showScanToast(`⚡ TEZKOR SOTUV (Skaner): "${found.name}" (1 dona) sotildi va ombordan kamaydi!`);
          mutateMedicines();
          mutateSession();
        } else {
          throw new Error('Sotuvda xatolik yuz berdi');
        }
      } catch (err: any) {
        showScanToast(`❌ ${err.message || 'Sotuvda xatolik yuz berdi'}`);
      }
    } else {
      addToCart(found);
      showScanToast(`✅ Skanerlandi: "${found.name}" savatga qo'shildi!`);
    }
  };

  const filteredMedicines = useMemo(() => {
    return medicines.filter((med: any) => 
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (med.barcode && med.barcode.includes(searchQuery))
    );
  }, [medicines, searchQuery]);

  const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage) || 1;
  const paginatedMedicines = useMemo(() => {
    return filteredMedicines.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredMedicines, currentPage, itemsPerPage]);

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
      const payload: any = {
        items: cart.map(item => ({
          medicineId: item.id,
          quantity: item.quantity,
          unitPrice: item.price
        })),
        totalAmount,
        paymentMethod,
        customerId: selectedCustomer?.id,
        usePoints
      };

      if (paymentMethod === 'MIXED') {
        const cash = Number(cashAmount) || 0;
        const card = totalAmount - cash;
        if (cash < 0 || card < 0) {
          alert("Aralash to'lov summasi noto'g'ri kiritildi!");
          return;
        }
        payload.splitPayments = { cash, card };
      }

      const res = await fetcher('http://localhost:3001/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const resultData = await res.json();
        setReceiptData({
          cart: [...cart],
          totalAmount,
          saleId: resultData.id || '',
          date: new Date(),
          fiscalReceiptId: resultData.fiscalReceiptId,
          fiscalUrl: resultData.fiscalUrl,
          fiscalSign: resultData.fiscalSign
        });
      } else {
        alert(t('pos.errorMessage') || "Sotuvda xatolik");
      }
    } catch (err) {
      console.error(err);
      alert(t('pos.errorMessage') || "Xatolik");
    }
  };

  const handlePrintDone = () => {
    setReceiptData(null);
    setCart([]);
    setCashAmount('');
    setSelectedCustomer(null);
    setCustomerSearch('');
    setUsePoints(false);
    setIsCheckoutModalOpen(false);
    mutateMedicines();
    mutateSession();
  };

  const handleOpenSession = async () => {
    try {
      const res = await fetcher('http://localhost:3001/api/sessions/open-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startingCash: Number(startingCash) || 0 }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Xatolik yuz berdi");
      }
      setIsSessionModalOpen(false);
      setStartingCash('');
      mutateSession();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCloseSession = async () => {
    if (!currentSession?.id) return;
    try {
      const res = await fetcher(`http://localhost:3001/api/sessions/close/${currentSession.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closingCash: Number(closingCash) || 0 }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Xatolik yuz berdi");
      }
      setIsSessionModalOpen(false);
      setIsClosingSession(false);
      setClosingCash('');
      mutateSession();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-12 h-full p-3 sm:p-6 md:p-8 w-full max-w-full mx-auto overflow-hidden">
      {/* Toast Notification Banner for Scanner */}
      {scanNotification && (
        <div className="fixed top-6 right-6 z-50 bg-foreground text-background px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-border animate-in fade-in slide-in-from-top-4 duration-300">
          <ScanLine className="h-5 w-5 text-emerald-400 shrink-0 animate-pulse" />
          <span className="font-semibold text-sm">{scanNotification}</span>
        </div>
      )}

      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden bg-muted p-1 rounded-xl gap-1 mb-2 w-full shrink-0 relative">
        {(!currentSession || currentSession.status === 'CLOSED') && (
            <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
              <button
                onClick={() => {
                  setIsClosingSession(false);
                  setIsSessionModalOpen(true);
                }}
                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl shadow-lg"
              >
                Smenani Ochish
              </button>
            </div>
          )}
        <button
          type="button"
          onClick={() => setActiveMobileTab('catalog')}
          className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeMobileTab === 'catalog'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Katalog</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileTab('cart')}
          className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 relative ${
            activeMobileTab === 'cart'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Savat</span>
          {cart.length > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
              {cart.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Catalog Section */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden ${activeMobileTab === 'catalog' ? 'flex' : 'hidden lg:flex'}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                Sotuv Oynasi
              </h1>
              {currentSession && currentSession.status === 'OPEN' && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold text-[10px] sm:text-xs border border-emerald-500/20">
                    <Clock className="h-3 w-3" /> Smena ochiq: {new Date(currentSession.openedAt).toLocaleTimeString('uz-UZ')}
                  </span>
                  {dailySales && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-semibold text-[10px] sm:text-xs border border-blue-500/20">
                      <Banknote className="h-3 w-3" /> Bugungi tushum: {dailySales.totalRevenue?.toLocaleString()} UZS
                    </span>
                  )}
                </div>
              )}
            </div>            </div>
            </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {currentSession?.id && (
              <button
                onClick={() => {
                  setIsClosingSession(true);
                  setIsSessionModalOpen(true);
                }}
                className="px-4 py-2 bg-red-500/10 text-red-600 font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors border border-red-500/20 shadow-sm"
              >
                <LogOut className="h-4 w-4" />
                Smenani Yopish
              </button>
            )}

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
        </div>
        
        <div className="relative mb-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Skanerlang yoki Dori nomi / Barkod qidiring (Enter bosing)..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm font-medium"
            />
          </div>
          <button
            onClick={() => setIsMobileScannerOpen(true)}
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-sm font-medium shrink-0"
          >
            <Camera className="h-5 w-5" />
            <span className="hidden sm:inline">Kamera Skaner</span>
          </button>
        </div>

        <div className="flex-1 bg-card border-r border-border overflow-y-auto flex flex-col relative">
          {(!currentSession || currentSession.status === 'CLOSED') && (
            <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
              <div className="bg-card p-8 rounded-2xl shadow-xl border border-border max-w-sm w-full">
                <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-50" />
                <h2 className="text-2xl font-bold mb-2">Smena Yopiq</h2>
                <p className="text-muted-foreground text-sm mb-8">Savdo qilish uchun avval smenani ochishingiz kerak.</p>
                <button
                  onClick={() => {
                    setIsClosingSession(false);
                    setIsSessionModalOpen(true);
                  }}
                  className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-md"
                >
                  Smenani Ochish
                </button>
              </div>
            </div>
          )}
          
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-24">
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t border-border p-4">
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
      <div className={`w-full lg:w-96 bg-card border border-border rounded-2xl flex flex-col h-full shadow-sm ${activeMobileTab === 'cart' ? 'flex' : 'hidden lg:flex'}`}>
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

            <div className="p-6 space-y-4">
              
              <div className="bg-muted/30 border border-border p-4 rounded-xl space-y-3">
                <label className="block text-sm font-medium">Mijoz (Telefon raqam yoki Ism)</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Mijoz qidirish..."
                    className="w-full p-2 border border-border rounded-lg text-sm bg-background"
                  />
                  {customerSearch && !selectedCustomer && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                      {customersData.filter((c: any) => c.phone?.includes(customerSearch) || c.name.toLowerCase().includes(customerSearch.toLowerCase())).map((c: any) => (
                        <div key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(c.name); }} className="p-2 hover:bg-muted cursor-pointer text-sm">
                          <span className="font-bold">{c.name}</span> - {c.phone} (Bonus: <span className="text-green-600">{c.loyaltyPoints}</span>)
                        </div>
                      ))}
                      {customersData.filter((c: any) => c.phone?.includes(customerSearch) || c.name.toLowerCase().includes(customerSearch.toLowerCase())).length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground text-center">Mijoz topilmadi. Mijozlar sahifasidan qo'shing.</div>
                      )}
                    </div>
                  )}
                  {selectedCustomer && (
                    <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {selectedCustomer && (
                  <div className="flex items-center justify-between bg-green-50/50 p-2 border border-green-100 rounded-lg">
                    <span className="text-sm font-semibold text-green-800">{selectedCustomer.name}</span>
                    {selectedCustomer.loyaltyPoints > 0 && (
                      <label className="text-xs font-bold text-green-700 flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} className="w-4 h-4 rounded text-green-600" />
                        Bonus ishl. ({selectedCustomer.loyaltyPoints} UZS)
                      </label>
                    )}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">To&apos;lanadigan umumiy summa:</p>
                <p className="text-3xl font-bold text-primary">
                  {usePoints && selectedCustomer ? Math.max(0, totalAmount - selectedCustomer.loyaltyPoints).toLocaleString() : totalAmount.toLocaleString()} UZS
                  {usePoints && selectedCustomer && selectedCustomer.loyaltyPoints > 0 && (
                    <span className="text-sm text-green-600 ml-2 line-through">{totalAmount.toLocaleString()}</span>
                  )}
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium">To&apos;lov turini tanlang</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-semibold text-xs sm:text-sm transition-all ${
                      paymentMethod === 'CASH'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <Banknote className="h-4 w-4 sm:h-5 sm:w-5" /> Naqd pul
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-semibold text-xs sm:text-sm transition-all ${
                      paymentMethod === 'CARD'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" /> Karta
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('MIXED')}
                    className={`col-span-2 sm:col-span-1 flex items-center justify-center gap-2 p-3 rounded-xl border font-semibold text-xs sm:text-sm transition-all ${
                      paymentMethod === 'MIXED'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <Wallet className="h-4 w-4 sm:h-5 sm:w-5" /> Aralash
                  </button>
                </div>

                {paymentMethod === 'MIXED' && (
                  <div className="flex gap-3 mt-4 p-4 border border-border rounded-xl bg-muted/20 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Naqd pul qismi</label>
                      <input 
                        type="number" 
                        value={cashAmount} 
                        onChange={(e) => setCashAmount(e.target.value)} 
                        placeholder="Summani kiriting..." 
                        className="w-full p-2.5 bg-background border border-border rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Karta qismi (Avto)</label>
                      <div className="w-full p-2.5 border border-border rounded-lg bg-background text-foreground font-bold text-sm">
                        {Math.max(0, totalAmount - (Number(cashAmount) || 0)).toLocaleString()} UZS
                      </div>
                    </div>
                  </div>
                )}
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
      {isMobileScannerOpen && (
        <MobileScanner 
          onScan={handleBarcodeScanned}
          onClose={() => setIsMobileScannerOpen(false)}
        />
      )}

      {/* Session Modal */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-6 relative">
            <button
              onClick={() => setIsSessionModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-muted/50 text-muted-foreground rounded-full hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold mb-6">
              {isClosingSession ? 'Smenani Yopish (Z-Otchyot)' : 'Smenani Ochish'}
            </h2>
            
            {isClosingSession ? (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-xl space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ochilgan vaqt:</span>
                    <span className="font-medium">{new Date(currentSession.openedAt).toLocaleString('uz-UZ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kassadagi boshlang'ich pul:</span>
                    <span className="font-medium">{currentSession.startingCash.toLocaleString()} UZS</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold border-t border-border/50 pt-2 mt-2">
                    <span>Kassada bo'lishi kerak bo'lgan pul (Kutilyotgan):</span>
                    <span>
                      {(() => {
                        const cashSales = currentSession.sales?.filter((s: any) => s.paymentMethod === 'CASH').reduce((sum: number, s: any) => sum + s.totalAmount, 0) || 0;
                        return (currentSession.startingCash + cashSales).toLocaleString() + ' UZS';
                      })()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Haqiqatda kassadagi pul (UZS)</label>
                  <input
                    type="number"
                    value={closingCash}
                    onChange={(e) => setClosingCash(e.target.value)}
                    className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/50 outline-none"
                    placeholder="Qo'lingizdagi naqd pulni yozing..."
                  />
                </div>
                
                <button
                  onClick={handleCloseSession}
                  className="w-full mt-4 bg-red-600 text-white font-bold py-3.5 rounded-xl hover:bg-red-700 transition-colors shadow-lg"
                >
                  Smenani Yopish va Xisobotni Saqlash
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Boshlang'ich kassadagi pul (UZS)</label>
                  <input
                    type="number"
                    value={startingCash}
                    onChange={(e) => setStartingCash(e.target.value)}
                    className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/50 outline-none"
                    placeholder="Ertalabki qoldiq pul..."
                  />
                </div>
                <button
                  onClick={handleOpenSession}
                  className="w-full mt-4 bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg"
                >
                  Smenani Ochish va Savdoni Boshlash
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* YASHIRIN CHEK PRINTERI */}
      {receiptData && (
        <ReceiptPrinter 
          cart={receiptData.cart} 
          totalAmount={receiptData.totalAmount}
          saleId={receiptData.saleId}
          date={receiptData.date}
          fiscalReceiptId={receiptData.fiscalReceiptId}
          fiscalUrl={receiptData.fiscalUrl}
          fiscalSign={receiptData.fiscalSign}
          onPrinted={handlePrintDone}
        />
      )}
    </div>
  );
}
