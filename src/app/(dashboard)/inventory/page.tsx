import PageHeader from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";

export default async function InventoryPage() {
  const db = await createClient();

  const { data: inventoryData, error } = await db
    .from("products")
    .select(`
      id,
      name,
      sku,
      unit,
      current_quantity,
      minimum_stock_level,
      categories(name)
    `)
    .order("name");

  if (error) {
    console.error("Inventory error:", error);
  }

  // Fix: Supabase data can be null
  const data = inventoryData ?? [];

  return (
    <div>
      <PageHeader
        title="Current Inventory"
        subtitle="Estimated inventory based on recorded stock movements"
      />

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Current Quantity</th>
              <th>Minimum Stock</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center" }}>
                  No inventory data found.
                </td>
              </tr>
            ) : (
              data.map((product) => {
                const currentQuantity = Number(
                  product.current_quantity ?? 0
                );

                const minimumStock = Number(
                  product.minimum_stock_level ?? 0
                );

                const isLowStock =
                  minimumStock > 0 &&
                  currentQuantity <= minimumStock;

                const category = Array.isArray(product.categories)
                  ? product.categories[0]
                  : product.categories;

                return (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                    </td>

                    <td>{product.sku ?? "—"}</td>

                    <td>{category?.name ?? "—"}</td>

                    <td>
                      {currentQuantity} {product.unit ?? ""}
                    </td>

                    <td>
                      {minimumStock} {product.unit ?? ""}
                    </td>

                    <td>
                      <span
                        className={`status ${
                          isLowStock ? "orange" : "green"
                        }`}
                      >
                        {isLowStock ? "LOW STOCK" : "OK"}
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
