import SalesClient from "@/components/sales/SalesClient";

export default async function SalesHistoryPage() {
  let sales = [];
  let error = null;

  try {
    const res = await fetch('http://localhost:3001/api/sales', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed');
    sales = await res.json();
  } catch (err) {
    error = "Could not fetch sales history.";
  }

  return (
    <div className="p-4 md:p-6 lg:p-10 flex flex-col h-full">
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-600 border border-red-200 rounded-lg">
          {error}
        </div>
      )}
      <SalesClient initialSales={Array.isArray(sales) ? sales : []} />
    </div>
  );
}
