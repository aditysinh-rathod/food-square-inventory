"use client";

import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";

type BarcodeScannerProps = {
  onScanSuccess: (barcode: string) => void;
  onClose?: () => void;
};

export default function BarcodeScanner({
  onScanSuccess,
  onClose,
}: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "barcode-reader",
      {
        fps: 10,
        qrbox: {
          width: 250,
          height: 180,
        },
        rememberLastUsedCamera: true,
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        if (scanned) return;

        setScanned(true);

        scanner.clear().catch(() => {});

        onScanSuccess(decodedText);
      },
      () => {
        // Ignore scan errors while camera searches for a barcode
      }
    );

    return () => {
      scanner.clear().catch(() => {});
      scannerRef.current = null;
    };
  }, [onScanSuccess, scanned]);

  return (
    <div className="scanner-overlay">
      <div className="scanner-modal">
        <div className="scanner-header">
          <div>
            <h2>Scan Barcode</h2>
            <p>Point your camera at the product barcode.</p>
          </div>

          <button
            type="button"
            className="scanner-close"
            onClick={() => {
              scannerRef.current?.clear().catch(() => {});
              onClose?.();
            }}
            aria-label="Close scanner"
          >
            ✕
          </button>
        </div>

        <div id="barcode-reader" />

        <p className="scanner-help">
          Make sure the barcode is clearly visible and well lit.
        </p>
      </div>
    </div>
  );
}
