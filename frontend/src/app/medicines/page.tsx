import MedicinesClient from "@/components/medicines/MedicinesClient";

export default async function MedicinesPage() {
  let medicines = [];
  let error = null;

  try {
    const res = await fetch('http://localhost:3001/api/medicines?limit=300', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch data');
    medicines = await res.json();
  } catch (err) {
    error = "Could not fetch medicines.";
  }

  return (
    <div className="p-6 md:p-10 flex flex-col h-full">
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-600 border border-red-200 rounded-lg">
          {error}
        </div>
      )}
      
      {!error && <MedicinesClient initialMedicines={medicines} />}
    </div>
  );
}
