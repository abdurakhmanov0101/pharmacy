const payload = {
  items: [
    { medicineId: '0bbcb331-1835-445a-9fa2-4c7a46ff7a8f', quantity: 1, unitPrice: 15000 }
  ],
  totalAmount: 15000,
  paymentMethod: 'CASH'
};

fetch('http://localhost:3001/api/sales', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
  .then(res => res.text().then(text => ({ status: res.status, text })))
  .then(console.log)
  .catch(console.error);
