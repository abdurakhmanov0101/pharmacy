import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface MobileScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function MobileScanner({ onScan, onClose }: MobileScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Create instance
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 150 }, 
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true 
      },
      false
    );

    // Render it
    scannerRef.current.render(
      (decodedText) => {
        onScan(decodedText);
        // Clear scanner after successful scan
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
        onClose();
      },
      (error) => {
        // Ignore scan failures as they happen continuously
      }
    );

    // Cleanup on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error("Failed to clear scanner", e));
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-border flex justify-between items-center glass-panel">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            📸 Kamera Skaner
          </h3>
          <button onClick={onClose} className="px-3 py-1 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg text-sm font-medium transition-colors">
            Yopish
          </button>
        </div>
        <div className="p-4 bg-white relative">
          <div id="qr-reader" className="w-full text-black"></div>
        </div>
      </div>
    </div>
  );
}
