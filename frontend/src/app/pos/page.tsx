import POSClient from "@/components/pos/POSClient";

export default async function POSPage() {
  let medicines = [];
  let error = null;

  try {
    const res = await fetch('http://localhost:3001/api/medicines', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch data');
    medicines = await res.json();
  } catch (err) {
    error = "Could not fetch medicines.";
  }

  return (
    <div className="h-full">
      {error && (
        <div className="m-6 p-4 bg-red-100 text-red-600 border border-red-200 rounded-lg">
          {error}
        </div>
      )}
      
      {!error && <POSClient initialMedicines={medicines} />}
    </div>
  );
}
