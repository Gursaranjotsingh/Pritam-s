"use client";
import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { formatINR } from "@/lib/money";

export default function ProductsAdmin({ products }: { products: any[] }) {
  const [rows, setRows] = useState(products);
  const [showAdd, setShowAdd] = useState(false);

  async function updateProductField(id: string, field: string, value: unknown) {
    const supabase = createClient();
    await supabase.from("products").update({ [field]: value }).eq("id", id);
    setRows((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  async function adjustStock(productId: string, mode: "set" | "add" | "subtract" | "sold_out", value?: number) {
    const res = await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, mode, value }),
    });
    if (res.ok) {
      const data = await res.json();
      setRows((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, inventory: { ...p.inventory, quantity_available: data.quantity_available } } : p
        )
      );
    }
  }

  return (
    <div>
      <button onClick={() => setShowAdd((v) => !v)} className="btn-primary mb-6">
        {showAdd ? "Close" : "+ Add New Product"}
      </button>

      {showAdd && <AddProductForm onCreated={(p) => { setRows((prev) => [...prev, { ...p, inventory: { quantity_available: 0 }, product_images: [] }]); setShowAdd(false); }} />}

      <div className="mt-6 flex flex-col gap-4">
        {rows.map((p) => (
          <div key={p.id} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-earth-50">
              {p.product_images?.[0]?.url && <Image src={p.product_images[0].url} alt={p.name} fill sizes="80px" className="object-cover" />}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  className="input font-semibold"
                  defaultValue={p.name}
                  onBlur={(e) => updateProductField(p.id, "name", e.target.value)}
                />
                <select className="input text-xs" defaultValue={p.status} onChange={(e) => updateProductField(p.id, "status", e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                <label className="flex items-center gap-1 text-earth-500">
                  Price (₹)
                  <input
                    type="number"
                    className="input w-24"
                    defaultValue={(p.price_paise / 100).toFixed(2)}
                    onBlur={(e) => updateProductField(p.id, "price_paise", Math.round(parseFloat(e.target.value) * 100))}
                  />
                </label>
                <span className="text-earth-400">Current: {formatINR(p.price_paise)}</span>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${p.inventory?.quantity_available > 0 ? "text-earth-700" : "text-spice-600"}`}>
                  {p.inventory?.quantity_available ?? 0} in stock
                </span>
                {p.inventory?.quantity_available === 0 && <span className="rounded-full bg-earth-800 px-2 py-0.5 text-xs text-white">Sold Out</span>}
              </div>
              <div className="flex items-center gap-2">
                <StockAdjuster onSet={(v) => adjustStock(p.id, "set", v)} onAdd={(v) => adjustStock(p.id, "add", v)} onSubtract={(v) => adjustStock(p.id, "subtract", v)} />
                <button onClick={() => adjustStock(p.id, "sold_out")} className="rounded-lg border border-earth-200 px-2 py-1 text-xs text-earth-500 hover:bg-earth-50">
                  Mark Sold Out
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StockAdjuster({ onSet, onAdd, onSubtract }: { onSet: (v: number) => void; onAdd: (v: number) => void; onSubtract: (v: number) => void }) {
  const [value, setValue] = useState(1);
  return (
    <div className="flex items-center gap-1">
      <input type="number" className="input w-16 text-xs" value={value} onChange={(e) => setValue(parseInt(e.target.value) || 0)} />
      <button onClick={() => onAdd(value)} className="rounded-lg border border-earth-200 px-2 py-1 text-xs hover:bg-earth-50">+ Add</button>
      <button onClick={() => onSubtract(value)} className="rounded-lg border border-earth-200 px-2 py-1 text-xs hover:bg-earth-50">− Sub</button>
      <button onClick={() => onSet(value)} className="rounded-lg border border-earth-200 px-2 py-1 text-xs hover:bg-earth-50">Set</button>
    </div>
  );
}

function AddProductForm({ onCreated }: { onCreated: (p: any) => void }) {
  const [form, setForm] = useState({
    slug: "", name: "", short_description: "", price: "", weight_grams: "", initial_stock: "0", spice_level: "medium", image_url: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: form.slug || form.name.toLowerCase().trim().replace(/\s+/g, "-"),
        name: form.name,
        short_description: form.short_description,
        price_paise: Math.round(parseFloat(form.price || "0") * 100),
        weight_grams: form.weight_grams ? parseInt(form.weight_grams) : null,
        initial_stock: parseInt(form.initial_stock || "0"),
        spice_level: form.spice_level,
        image_url: form.image_url || null,
      }),
    });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Could not create product."); return; }
    onCreated(data);
  }

  return (
    <form onSubmit={submit} className="card grid gap-3 p-5 sm:grid-cols-2">
      <input className="input" placeholder="Product name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      <input className="input" placeholder="URL slug (optional)" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
      <input className="input" placeholder="Short description" value={form.short_description} onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))} />
      <input className="input" type="number" step="0.01" placeholder="Price (₹)" required value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
      <input className="input" type="number" placeholder="Weight (grams)" value={form.weight_grams} onChange={(e) => setForm((f) => ({ ...f, weight_grams: e.target.value }))} />
      <input className="input" type="number" placeholder="Initial stock" value={form.initial_stock} onChange={(e) => setForm((f) => ({ ...f, initial_stock: e.target.value }))} />
      <select className="input" value={form.spice_level} onChange={(e) => setForm((f) => ({ ...f, spice_level: e.target.value }))}>
        <option value="mild">Mild</option>
        <option value="medium">Medium</option>
        <option value="hot">Hot</option>
        <option value="extra_hot">Extra Hot</option>
      </select>
      <input className="input" placeholder="Image URL (e.g. /products/new-item.jpg)" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} />
      {error && <p className="text-sm text-spice-600 sm:col-span-2">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary sm:col-span-2">{loading ? "Creating…" : "Create Product (as Draft)"}</button>
      <p className="text-xs text-earth-400 sm:col-span-2">
        New products start as &ldquo;Draft&rdquo;. Upload the image to /public/products (or your image host) and switch status to &ldquo;Active&rdquo; below once it&apos;s ready.
      </p>
    </form>
  );
}
