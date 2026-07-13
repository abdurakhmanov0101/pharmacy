import ReportsClient from "@/components/reports/ReportsClient";

export const metadata = {
  title: "Hisobotlar | AptekaOS",
  description: "Sotuv hisobotlari va tahlil",
};

export default async function ReportsPage() {
  let daily = null, weekly = null, monthly = null, chart = null, topMedicines = null;

  try {
    const [dRes, wRes, mRes, cRes, tRes] = await Promise.all([
      fetch("http://localhost:3001/api/reports/daily", { cache: "no-store" }),
      fetch("http://localhost:3001/api/reports/weekly", { cache: "no-store" }),
      fetch("http://localhost:3001/api/reports/monthly", { cache: "no-store" }),
      fetch("http://localhost:3001/api/reports/chart", { cache: "no-store" }),
      fetch("http://localhost:3001/api/reports/top-medicines?limit=10", { cache: "no-store" }),
    ]);

    if (dRes.ok) daily = await dRes.json();
    if (wRes.ok) weekly = await wRes.json();
    if (mRes.ok) monthly = await mRes.json();
    if (cRes.ok) chart = await cRes.json();
    if (tRes.ok) topMedicines = await tRes.json();
  } catch {}

  return <ReportsClient daily={daily} weekly={weekly} monthly={monthly} chart={chart} topMedicines={topMedicines} />;
}
