"use client";
import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { formatINR } from "@/lib/money";
import SpiceLevel from "@/components/SpiceLevel";

export default function ProductsAdmin({ products }: { products: any[] }) {
  const [rows, setRows] = useState(products);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function updateProductField(id: string, field: string, value: unknown) {
    const supabase = createClient();
    await supabase.from("products").update({ [field]: value }).eq("id", id);
    setRows((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  async function adjustStock(productId: string, mode: "set" | "add" | "subtract" | "sold_out", value?: number, lowStockThreshold?: number) {
    const res = await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, mode, value, lowStockThreshold }),
    });
    if (res.ok) {
      const data = await res.json();
      setRows((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, inventory: { ...p.inventory, quantity_available: data.quantity_available, ...(lowStockThreshold !== undefined ? { low_stock_threshold: lowStockThreshold } : {}) } }
            : p
        )
      );
    }
  }

  async function saveImageUrl(product: any, url: string) {
    const supabase = createClient();
    const existing = product.product_images?.[0];
    if (existing) {
      await supabase.from("product_images").update({ url, alt_text: product.name }).eq("id", existing.id);
    } else {
      await supabase.from("product_images").insert({ product_id: product.id, url, alt_text: product.name, sort_order: 1 });
    }
    setRows((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? { ...p, product_images: existing ? [{ ...existing, url }] : [{ id: "temp", url, alt_text: product.name, sort_order: 1 }] }
          : p
      )
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-earth-500">
          Everything about a product — description, ingredients, spice level, images and stock — is editable right here.
        </p>
        <button onClick={() => setShowAdd((v) => !v)} className="btn-primary flex-shrink-0">
          {showAdd ? "Close" : "+ Add New Product"}
        </button>
      </div>

      {showAdd && (
        <div className="mb-6">
          <AddProductForm onCreated={(p) => { setRows((prev) => [...prev, { ...p, inventory: { quantity_available: 0, low_stock_threshold: 5 }, product_images: [] }]); setShowAdd(false); }} />
        </div>
      )}

      <div className="flex flex-col gap-4">
        {rows.map((p) => {
          const expanded = expandedId === p.id;
          return (
            <div key={p.id} className="card overflow-hidden">
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
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
                    <SpiceLevel level={p.spice_level} />
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
                  <button
                    onClick={() => setExpandedId(expanded ? null : p.id)}
                    className="text-xs font-semibold text-earth-600 underline decoration-earth-300 underline-offset-2 hover:text-spice-600"
                  >
                    {expanded ? "Hide Details ▲" : "Edit Details ▾"}
                  </button>
                </div>
              </div>

              {expanded && (
                <ProductDetailsEditor
                  product={p}
                  onSaveFields={(fields) => setRows((prev) => prev.map((r) => (r.id === p.id ? { ...r, ...fields } : r)))}
                  onSaveLowStock={(threshold) => adjustStock(p.id, "add", 0, threshold)}
                  onSaveImage={(url) => saveImageUrl(p, url)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductDetailsEditor({
  product,
  onSaveFields,
  onSaveLowStock,
  onSaveImage,
}: {
  product: any;
  onSaveFields: (fields: Record<string, unknown>) => void;
  onSaveLowStock: (threshold: number) => void;
  onSaveImage: (url: string) => void;
}) {
  const [form, setForm] = useState({
    short_description: product.short_description ?? "",
    description: product.description ?? "",
    ingredients: product.ingredients ?? "",
    spice_level: product.spice_level ?? "medium",
    weight_grams: product.weight_grams?.toString() ?? "",
    max_qty_per_order: product.max_qty_per_order?.toString() ?? "10",
    low_stock_threshold: product.inventory?.low_stock_threshold?.toString() ?? "5",
    image_url: product.product_images?.[0]?.url ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const fields = {
      short_description: form.short_description || null,
      description: form.description || null,
      ingredients: form.ingredients || null,
      spice_level: form.spice_level,
      weight_grams: form.weight_grams ? parseInt(form.weight_grams) : null,
      max_qty_per_order: parseInt(form.max_qty_per_order) || 10,
    };
    await supabase.from("products").update(fields).eq("id", product.id);
    onSaveFields(fields);

    const threshold = parseInt(form.low_stock_threshold) || 5;
    onSaveLowStock(threshold);

    if (form.image_url && form.image_url !== product.product_images?.[0]?.url) {
      onSaveImage(form.image_url);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="border-t border-earth-100 bg-earth-50/60 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-sm font-medium text-earth-600">Short Description (shown on product cards)</span>
          <input className="input" value={form.short_description} onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))} />
        </label>

        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-sm font-medium text-earth-600">Full Description</span>
          <textarea className="input min-h-[90px]" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </label>

        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-sm font-medium text-earth-600">Ingredients (comma-separated)</span>
          <textarea
            className="input min-h-[70px]"
            placeholder="e.g. Raw mango, mustard oil, red chilli powder, fenugreek seeds, mustard seeds, turmeric, salt"
            value={form.ingredients}
            onChange={(e) => setForm((f) => ({ ...f, ingredients: e.target.value }))}
          />
          <span className="text-xs text-earth-400">Shown as individual tags on the product page — separate each ingredient with a comma.</span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-earth-600">Spice Level</span>
          <select className="input" value={form.spice_level} onChange={(e) => setForm((f) => ({ ...f, spice_level: e.target.value }))}>
            <option value="mild">Mild</option>
            <option value="medium">Medium</option>
            <option value="hot">Hot</option>
            <option value="extra_hot">Extra Hot</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-earth-600">Weight (grams)</span>
          <input type="number" className="input" value={form.weight_grams} onChange={(e) => setForm((f) => ({ ...f, weight_grams: e.target.value }))} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-earth-600">Max Quantity Per Order</span>
          <input type="number" className="input" value={form.max_qty_per_order} onChange={(e) => setForm((f) => ({ ...f, max_qty_per_order: e.target.value }))} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-earth-600">Low-Stock Threshold</span>
          <input type="number" className="input" value={form.low_stock_threshold} onChange={(e) => setForm((f) => ({ ...f, low_stock_threshold: e.target.value }))} />
          <span className="text-xs text-earth-400">Below this number, the site shows &ldquo;Only N jars left&rdquo;.</span>
        </label>

        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-sm font-medium text-earth-600">Main Image URL</span>
          <input className="input" placeholder="/products/your-photo.jpg" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} />
        </label>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary mt-4 disabled:opacity-60">
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save Product Details"}
      </button>
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
    slug: "", name: "", short_description: "", description: "", ingredients: "", price: "", weight_grams: "", initial_stock: "0", max_qty_per_order: "10", spice_level: "medium", image_url: "",
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
        description: form.description || null,
        ingredients: form.ingredients || null,
        price_paise: Math.round(parseFloat(form.price || "0") * 100),
        weight_grams: form.weight_grams ? parseInt(form.weight_grams) : null,
        initial_stock: parseInt(form.initial_stock || "0"),
        max_qty_per_order: parseInt(form.max_qty_per_order || "10"),
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
      <input className="input sm:col-span-2" placeholder="Short description" value={form.short_description} onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))} />
      <textarea className="input sm:col-span-2" placeholder="Full description (optional)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      <textarea className="input sm:col-span-2" placeholder="Ingredients, comma-separated (e.g. Raw mango, mustard oil, spices)" value={form.ingredients} onChange={(e) => setForm((f) => ({ ...f, ingredients: e.target.value }))} />
      <input className="input" type="number" step="0.01" placeholder="Price (₹)" required value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
      <input className="input" type="number" placeholder="Weight (grams)" value={form.weight_grams} onChange={(e) => setForm((f) => ({ ...f, weight_grams: e.target.value }))} />
      <input className="input" type="number" placeholder="Initial stock" value={form.initial_stock} onChange={(e) => setForm((f) => ({ ...f, initial_stock: e.target.value }))} />
      <input className="input" type="number" placeholder="Max quantity per order" value={form.max_qty_per_order} onChange={(e) => setForm((f) => ({ ...f, max_qty_per_order: e.target.value }))} />
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
        New products start as &ldquo;Draft&rdquo;. Switch status to &ldquo;Active&rdquo; below (or in the row&apos;s dropdown) once it&apos;s ready to sell.
      </p>
    </form>
  );
}
