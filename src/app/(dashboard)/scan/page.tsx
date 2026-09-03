"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BarcodeScanner from "@/components/BarcodeScanner";
import { createClient } from "@/lib/supabase/client";

export default function ScanPage() {
  const router = useRouter();

  const [message, setMessage] = useState(
    "Opening camera scanner..."
  );

  async function handleScan(barcode: string) {
    setMessage("Barcode scanned. Finding product...");

    const supabase = createClient();

    const { data, error } = await supabase
      .from("products")
      .select("id, name, barcode")
      .eq("barcode", barcode)
      .maybeSingle();

    if (error) {
      setMessage("Unable to search for this product.");
      return;
    }

    if (!data) {
      setMessage(
        `Product not found for barcode: ${barcode}`
      );
      return;
    }

    router.push(`/products/${data.id}`);
  }

  return (
    <main className="scan-page">
      <BarcodeScanner
        onScanSuccess={handleScan}
        onClose={() => router.back()}
      />

      <div className="scan-status">
        {message}
      </div>
    </main>
  );
}
