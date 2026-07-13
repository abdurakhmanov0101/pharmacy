

async function test() {
  const payload = [
    {
      name: "Test Med 1",
      genericName: "Generic 1",
      price: 5000,
      dosage: "10mg",
      barcode: "111222333",
      quantity: 15
    }
  ];

  const res = await fetch('http://localhost:3001/api/medicines/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
}

test();
