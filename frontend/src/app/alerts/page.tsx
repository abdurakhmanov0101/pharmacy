import AlertsClient from "@/components/alerts/AlertsClient";

export const metadata = {
  title: "Ogohlantirishlar | AptekaOS",
  description: "Muddati tugayotgan va kam qolgan dorilar",
};

export default async function AlertsPage() {
  let expiring7 = null, expiring15 = null, expiring30 = null, lowStock = null, expired = null;

  try {
    const [e7Res, e15Res, e30Res, lsRes, exRes] = await Promise.all([
      fetch("http://localhost:3001/api/inventory/expiring?days=7", { cache: "no-store" }),
      fetch("http://localhost:3001/api/inventory/expiring?days=15", { cache: "no-store" }),
      fetch("http://localhost:3001/api/inventory/expiring?days=30", { cache: "no-store" }),
      fetch("http://localhost:3001/api/inventory/low-stock?threshold=20", { cache: "no-store" }),
      fetch("http://localhost:3001/api/inventory/expired", { cache: "no-store" }),
    ]);
    if (e7Res.ok) expiring7 = await e7Res.json();
    if (e15Res.ok) expiring15 = await e15Res.json();
    if (e30Res.ok) expiring30 = await e30Res.json();
    if (lsRes.ok) lowStock = await lsRes.json();
    if (exRes.ok) expired = await exRes.json();
  } catch {}

  return (
    <AlertsClient
      expiring7={expiring7}
      expiring15={expiring15}
      expiring30={expiring30}
      lowStock={lowStock}
      expired={expired}
    />
  );
}
