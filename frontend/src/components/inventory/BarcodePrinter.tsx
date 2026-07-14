import React, { useEffect } from 'react';
import Barcode from 'react-barcode';

interface BarcodePrinterProps {
  name: string;
  price: number;
  barcode: string;
  onPrinted: () => void;
}

export default function BarcodePrinter({ name, price, barcode, onPrinted }: BarcodePrinterProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
      onPrinted();
    }, 500);
    return () => clearTimeout(timer);
  }, [onPrinted]);

  return (
    <div id="printable-barcode">
      <p style={{ fontSize: '10px', fontWeight: 'bold', textAlign: 'center', marginBottom: '2px', lineHeight: '1.2', color: '#000' }}>
        {name.substring(0, 25)}
      </p>
      <Barcode 
        value={barcode} 
        width={1.5} 
        height={35} 
        fontSize={11} 
        margin={0} 
        displayValue={true} 
      />
      <p style={{ fontSize: '12px', fontWeight: '900', marginTop: '2px', color: '#000' }}>
        {price.toLocaleString()} UZS
      </p>
    </div>
  );
}
