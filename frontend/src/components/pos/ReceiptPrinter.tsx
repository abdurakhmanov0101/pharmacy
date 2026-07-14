import React, { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface ReceiptPrinterProps {
  cart: any[];
  totalAmount: number;
  saleId: string;
  date: Date;
  fiscalReceiptId?: string;
  fiscalUrl?: string;
  fiscalSign?: string;
  onPrinted: () => void;
}

export default function ReceiptPrinter({ 
  cart, totalAmount, saleId, date, 
  fiscalReceiptId, fiscalUrl, fiscalSign, onPrinted 
}: ReceiptPrinterProps) {
  useEffect(() => {
    // Kichik kechikish bilan print chaqiramiz (DOM chizilishi uchun)
    const timer = setTimeout(() => {
      window.print();
      onPrinted();
    }, 500);
    return () => clearTimeout(timer);
  }, [onPrinted]);

  return (
    <>
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #printable-receipt, #printable-receipt * { visibility: visible; }
            #printable-receipt { 
              position: absolute; 
              left: 0; 
              top: 0; 
              width: 58mm; /* Standard 58mm thermal printer width */
              padding: 0;
              margin: 0;
              font-family: monospace;
              font-size: 12px;
              color: black;
            }
            @page { margin: 0; }
          }
          @media screen {
            #printable-receipt { display: none; }
          }
        `}
      </style>

      <div id="printable-receipt" className="p-2">
        <div className="text-center font-bold text-lg mb-1">DORIXONA</div>
        <div className="text-center text-xs mb-3 border-b border-black pb-2">
          Sotuv ID: {saleId ? saleId.slice(0,8).toUpperCase() : '---'}<br/>
          Sana: {date.toLocaleString('uz-UZ')}
        </div>
        
        <table className="w-full text-xs mb-2">
          <thead>
            <tr className="border-b border-dashed border-black">
              <th className="text-left pb-1">Nomi</th>
              <th className="text-right pb-1">Soni</th>
              <th className="text-right pb-1">Narx</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item, i) => (
              <React.Fragment key={i}>
                <tr>
                  <td className="py-1 break-words pr-1 max-w-[30mm]" colSpan={3}>
                    {item.name}
                    <div className="text-[10px] text-gray-600">
                      {/* @ts-ignore */}
                      MXIK: {item.mxikCode || '06903001001000000'} | QQS: {item.nds || 12}%
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="text-left py-1 align-top">{item.cartQuantity} x {item.price.toLocaleString()}</td>
                  <td className="text-right py-1 align-top"></td>
                  <td className="text-right py-1 align-top font-bold">{(item.price * item.cartQuantity).toLocaleString()}</td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>

        <div className="border-t border-dashed border-black pt-2 flex justify-between font-bold text-sm mb-4">
          <span>JAMI TO'LOV:</span>
          <span>{totalAmount.toLocaleString()} UZS</span>
        </div>

        {fiscalUrl && (
          <div className="flex flex-col items-center justify-center mt-4 border-t border-black pt-4">
            <QRCodeSVG value={fiscalUrl} size={120} />
            <div className="text-center mt-2 text-[10px]">
              <p>FM: FMD00001</p>
              <p>Chek raqami: {fiscalReceiptId}</p>
              <p>Fiskal belgi: {fiscalSign}</p>
            </div>
          </div>
        )}

        <div className="text-center text-[10px] italic mt-4">
          Xaridingiz uchun rahmat!<br/>
          Sog'lom bo'ling!
        </div>
      </div>
    </>
  );
}
