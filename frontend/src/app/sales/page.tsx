import SalesClient from "@/components/sales/SalesClient";

export default async function SalesHistoryPage() {
  let sales = [];
  let error = null;

  try {
    const res = await fetch('http://localhost:3001/api/sales', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch data');
    sales = await res.json();
  } catch (err) {
    error = "Could not fetch sales history.";
  }

  return (
    <div className="h-full">
      {error && (
        <div className="m-6 p-4 bg-red-100 text-red-600 border border-red-200 rounded-lg">
          {error}
        </div>
      )}
      
      {!error && <SalesClient initialSales={sales} />}
    </div>
  );
}
