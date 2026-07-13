'use client';

import { Bell, AlertTriangle, AlertCircle, PackageX } from "lucide-react";
import Link from "next/link";

export default function AlertsClient({
  expiring7,
  expiring15,
  expiring30,
  lowStock,
  expired
}: any) {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ogohlantirishlar</h1>
        <p className="text-muted-foreground mt-1">Ombor holati bo'yicha muhim xabarlar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Low Stock */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/20 text-red-600 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-red-700">Kam qolganlar (≤20)</h3>
          </div>
          <p className="text-3xl font-bold text-red-700">{lowStock?.length || 0} ta</p>
        </div>

        {/* Expiring soon */}
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-500/20 text-orange-600 rounded-lg">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-orange-700">Yaqinda tugaydi (30 kun)</h3>
          </div>
          <p className="text-3xl font-bold text-orange-700">{(expiring30?.length || 0)} ta</p>
        </div>

        {/* Expired */}
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-destructive/20 text-destructive rounded-lg">
              <PackageX className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-destructive">Muddati o'tganlar</h3>
          </div>
          <p className="text-3xl font-bold text-destructive">{expired?.length || 0} ta</p>
        </div>
      </div>
      
      <div className="flex justify-end">
         <Link href="/inventory" className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">Omborga o'tish</Link>
      </div>
    </div>
  );
}
