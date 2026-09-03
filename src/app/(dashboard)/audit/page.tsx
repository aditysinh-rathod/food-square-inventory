import PageHeader from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";

export default async function AuditPage() {
  const db = await createClient();

  const { data: auditData, error } = await db
    .from("stock_audits")
    .select(`
      *,
      products(name),
      profiles(full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Audit error:", error);
  }

  // Fix: Supabase data can be null
  const data = auditData ?? [];

  return (
    <div>
      <PageHeader
        title="Physical Stock Audit"
        subtitle="Compare physical stock with estimated system inventory"
      />

      <div className="card">
        <h3>How Stock Audits Work</h3>

        <p>
          Staff performs a physical stock count and submits the actual
          quantity.
        </p>

        <p>
          The system compares the physical quantity with the estimated system
          quantity.
        </p>

        <p>
          Any difference can be reviewed and approved before an inventory
          adjustment is created.
        </p>
      </div>

      <div className="card table-wrap" style={{ marginTop: "16px" }}>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>System Quantity</th>
              <th>Physical Quantity</th>
              <th>Difference</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center" }}>
                  No stock audits found.
                </td>
              </tr>
            ) : (
              data.map((audit) => {
                const product = Array.isArray(audit.products)
                  ? audit.products[0]
                  : audit.products;

                return (
                  <tr key={audit.id}>
                    <td>
                      {audit.created_at
                        ? new Date(audit.created_at).toLocaleString()
                        : "—"}
                    </td>

                    <td>{product?.name ?? "—"}</td>

                    <td>{audit.system_quantity ?? 0}</td>

                    <td>{audit.physical_quantity ?? 0}</td>

                    <td>{audit.difference ?? 0}</td>

                    <td>
                      <span className="status">
                        {audit.status ?? "PENDING"}
                      </span>
                    </td>
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
