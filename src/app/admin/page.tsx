import { createServerSupabase } from "@/lib/supabase/server";
import { formatINR } from "@/lib/money";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const supabase = createServerSupabase();

  const { data: orders } = await supabase.from("orders").select("*");
  const { data: lowStock } = await supabase
    .from("inventory")
    .select("product_id, quantity_available, low_stock_threshold, products(name)")
    .order("quantity_available", { ascending: true });

  const all = orders ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const todaysOrders = all.filter((o) => o.created_at?.slice(0, 10) === today);
  const totalSales = all.filter((o) => o.payment_status === "paid" || o.order_status !== "pending").reduce((s, o) => s + (o.payment_status === "paid" || o.payment_method === "cod" ? o.total_paise : 0), 0);

  const counts: Record<string, number> = {};
  for (const o of all) counts[o.order_status] = (counts[o.order_status] ?? 0) + 1;

  const stats = [
    { label: "Total Orders", value: all.length },
    { label: "Today's Orders", value: todaysOrders.length },
    { label: "Pending", value: counts.pending ?? 0 },
    { label: "Paid", value: counts.paid ?? 0 },
    { label: "Processing", value: counts.processing ?? 0 },
    { label: "Shipped", value: counts.shipped ?? 0 },
    { label: "Delivered", value: counts.delivered ?? 0 },
    { label: "Cancelled / Refunded", value: (counts.cancelled ?? 0) + (counts.refunded ?? 0) },
  ];

  const lowStockItems = (lowStock ?? []).filter((i: any) => i.quantity_available <= i.low_stock_threshold);

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-bold text-earth-800">Dashboard</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-earth-400">Total Sales</p>
          <p className="mt-1 text-2xl font-bold text-earth-800">{formatINR(totalSales)}</p>
        </div>
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-xs uppercase tracking-wide text-earth-400">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-earth-800">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="mb-4 font-serif text-lg font-bold text-earth-700">Low Stock Products</h2>
        {lowStockItems.length === 0 ? (
          <p className="text-sm text-earth-500">No low-stock products right now.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {lowStockItems.map((i: any) => (
              <li key={i.product_id} className="flex items-center justify-between rounded-lg bg-spice-500/5 px-4 py-2 text-sm">
                <span className="font-medium text-earth-700">{i.products?.name}</span>
                <span className="font-semibold text-spice-600">{i.quantity_available} left</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
