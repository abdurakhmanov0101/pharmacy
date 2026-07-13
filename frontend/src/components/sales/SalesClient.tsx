'use client';

import { useState, useEffect } from 'react';
import { Search, Eye, X, Receipt, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

export default function SalesClient({ initialSales }: { initialSales: any[] }) {
  const { t } = useLanguage();
  const [sales, setSales] = useState(initialSales);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchSales = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/sales');
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchSales();
    const interval = setInterval(fetchSales, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setLoading(true);
    await fetchSales();
    setLoading(false);
  };

  const filteredSales = sales.filter(sale => 
    sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.items?.some((i: any) => i.medicine?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 md:p-10 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('salesHistory.title')}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t('salesHistory.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder={t('header.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yangilash
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border sticky top-0">
              <tr>
                <th className="px-6 py-4 font-medium">{t('salesHistory.columns.id')}</th>
                <th className="px-6 py-4 font-medium">{t('salesHistory.columns.date')}</th>
                <th className="px-6 py-4 font-medium">{t('salesHistory.columns.amount')}</th>
                <th className="px-6 py-4 font-medium">{t('salesHistory.columns.paymentMethod')}</th>
                <th className="px-6 py-4 font-medium">{t('salesHistory.columns.items')}</th>
                <th className="px-6 py-4 font-medium text-right">{t('salesHistory.columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{sale.id.slice(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(sale.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-green-600">
                    {sale.totalAmount.toLocaleString()} UZS
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${sale.paymentMethod === 'CASH' ? 'bg-amber-100 text-amber-700' : sale.paymentMethod === 'MIXED' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {sale.paymentMethod === 'CASH' ? t('pos.cash') : sale.paymentMethod === 'MIXED' ? 'Aralash' : t('pos.card')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-xs text-foreground">
                      {sale.items?.map((item: any) => item.medicine?.name).filter(Boolean).join(', ') || 'Dorilar'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Jami: {sale.items?.reduce((sum: number, item: any) => sum + item.quantity, 0)} dona
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedSale(sale)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors text-xs font-medium"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {t('salesHistory.viewDetails')}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    {t('salesHistory.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Details Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-border flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                {t('salesHistory.detailsTitle')}
              </h3>
              <button onClick={() => setSelectedSale(null)} className="text-muted-foreground hover:bg-muted p-1 rounded-md transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex justify-between text-sm mb-6 pb-6 border-b border-border">
                <div>
                  <p className="text-muted-foreground mb-1">{t('salesHistory.columns.date')}</p>
                  <p className="font-medium">{new Date(selectedSale.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground mb-1">{t('salesHistory.columns.paymentMethod')}</p>
                  <p className="font-medium">{selectedSale.paymentMethod === 'CASH' ? t('pos.cash') : selectedSale.paymentMethod === 'MIXED' ? 'Aralash' : t('pos.card')}</p>
                </div>
              </div>

              <div className="space-y-4">
                {selectedSale.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{item.medicine?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} x {item.unitPrice.toLocaleString()} UZS</p>
                    </div>
                    <p className="font-semibold text-sm">{(item.quantity * item.unitPrice).toLocaleString()} UZS</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-muted/30 border-t border-border mt-auto">
              <div className="flex items-center justify-between mb-6">
                <span className="font-medium text-muted-foreground">{t('pos.total')}</span>
                <span className="text-2xl font-black text-primary">{selectedSale.totalAmount.toLocaleString()} UZS</span>
              </div>
              <button 
                onClick={() => setSelectedSale(null)}
                className="w-full py-3 rounded-xl font-bold border border-border bg-background hover:bg-muted transition-colors shadow-sm"
              >
                {t('salesHistory.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
