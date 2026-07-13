'use client';

import { useState, useEffect } from "react";
import { ShieldAlert, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export default function SecurityAlertsClient() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/security");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markReviewed = async (id: string) => {
    try {
      await fetch(`http://localhost:3001/api/security/${id}/review`, { method: 'PUT' });
      fetchEvents();
    } catch (err) {}
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Xavfsizlik Jurnali</h1>
        <p className="text-muted-foreground mt-1">Kamera tizimi tomonidan aniqlangan shubhali holatlar ro'yxati</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3 opacity-80" />
            <p className="text-lg font-medium text-foreground">Hammasi joyida</p>
            <p className="text-muted-foreground mt-1">Hech qanday shubhali holat aniqlanmagan.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                <th className="text-left p-4 font-medium">Holat Turi</th>
                <th className="text-left p-4 font-medium">Kamera</th>
                <th className="text-left p-4 font-medium">Xavf Darajasi</th>
                <th className="text-left p-4 font-medium">Sana va Vaqt</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Harakat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map(event => (
                <tr key={event.id} className={`hover:bg-muted/30 transition-colors ${!event.reviewed ? 'bg-red-500/5' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className={`h-4 w-4 ${!event.reviewed ? 'text-red-500' : 'text-muted-foreground'}`} />
                      <span className="font-medium">
                        {event.eventType === 'zone_exit_no_checkout' ? "Kassadan o'tmasdan chiqish" : event.eventType}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{event.cameraId || "Noma'lum"}</td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${
                      event.riskScore >= 80 ? 'bg-red-100 text-red-700' : 
                      event.riskScore >= 50 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {event.riskScore} / 100
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(event.createdAt).toLocaleString('uz-UZ')}
                    </div>
                  </td>
                  <td className="p-4">
                    {event.reviewed ? (
                      <span className="text-emerald-600 flex items-center gap-1 text-xs font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Ko'rildi
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center gap-1 text-xs font-medium">
                        <AlertCircle className="h-3.5 w-3.5" /> Yangi
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {!event.reviewed && (
                      <button 
                        onClick={() => markReviewed(event.id)}
                        className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Tekshirildi
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
