import { createServerSupabase } from "@/lib/supabase/server";
import ProductsAdmin from "./ProductsAdmin";

export const revalidate = 0;

export default async function AdminProductsPage() {
  const supabase = createServerSupabase();
  const { data: products } = await supabase
    .from("products")
    .select("*, product_images(*), inventory(*)")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-bold text-earth-800">Products & Inventory</h1>
      <ProductsAdmin products={products ?? []} />
    </div>
  );
}
