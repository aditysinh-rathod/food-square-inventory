import PageHeader from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";

export default async function LedgerPage() {
  const db = await createClient();

  const { data: ledgerData, error } = await db
    .from("inventory_ledger")
    .select(`
      *,
      products(name, unit),
      inventory_batches(batch_number),
      profiles(full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    console.error("Ledger error:", error);
  }

  // Fix: Supabase data can be null
  const data = ledgerData ?? [];

  return (
    <div>
      <PageHeader
        title="Inventory Ledger"
        subtitle="Complete record of all inventory movements"
      />

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>Batch</th>
              <th>Movement</th>
              <th>Stock In</th>
              <th>Stock Out</th>
              <th>Before</th>
              <th>After</th>
              <th>Reason</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center" }}>
                  No ledger transactions found.
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const product = Array.isArray(item.products)
                  ? item.products[0]
                  : item.products;

                const batch = Array.isArray(item.inventory_batches)
                  ? item.inventory_batches[0]
                  : item.inventory_batches;

                return (
                  <tr key={item.id}>
                    <td>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : "—"}
                    </td>

                    <td>{product?.name ?? "—"}</td>

                    <td>{batch?.batch_number ?? "—"}</td>

                    <td>{item.movement_type ?? "—"}</td>

                    <td>{item.quantity_in ?? 0}</td>

                    <td>{item.quantity_out ?? 0}</td>

                    <td>{item.quantity_before ?? 0}</td>

                    <td>{item.quantity_after ?? 0}</td>

                    <td>{item.reason ?? "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
