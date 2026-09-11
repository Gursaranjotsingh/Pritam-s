import { createServerSupabase } from "@/lib/supabase/server";
import OrdersTable from "./OrdersTable";

export const revalidate = 0;

export default async function AdminOrdersPage() {
  const supabase = createServerSupabase();
  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-bold text-earth-800">Orders</h1>
      <OrdersTable orders={orders ?? []} />
    </div>
  );
}
