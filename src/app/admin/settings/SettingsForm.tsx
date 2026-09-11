"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsForm({ initial }: { initial: Record<string, any> }) {
  const [form, setForm] = useState({
    store_name: initial.store_name ?? "Pritam's",
    store_tagline: initial.store_tagline ?? "The Taste of Indian Household",
    whatsapp_number: initial.whatsapp_number ?? "916280060371",
    shipping_charge: ((initial.shipping_charge_paise ?? 6000) / 100).toString(),
    free_shipping_threshold: ((initial.free_shipping_threshold_paise ?? 99900) / 100).toString(),
    cod_enabled: !!initial.cod_enabled,
    cod_fee: ((initial.cod_fee_paise ?? 0) / 100).toString(),
    cod_max_order: ((initial.cod_max_order_paise ?? 200000) / 100).toString(),
    low_stock_threshold_default: (initial.low_stock_threshold_default ?? 5).toString(),
    estimated_delivery_days: initial.estimated_delivery_days ?? "4-6 business days",
    store_available: initial.store_available !== false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    const updates = [
      { key: "store_name", value: form.store_name },
      { key: "store_tagline", value: form.store_tagline },
      { key: "whatsapp_number", value: form.whatsapp_number },
      { key: "shipping_charge_paise", value: Math.round(parseFloat(form.shipping_charge) * 100) },
      { key: "free_shipping_threshold_paise", value: Math.round(parseFloat(form.free_shipping_threshold) * 100) },
      { key: "cod_enabled", value: form.cod_enabled },
      { key: "cod_fee_paise", value: Math.round(parseFloat(form.cod_fee) * 100) },
      { key: "cod_max_order_paise", value: Math.round(parseFloat(form.cod_max_order) * 100) },
      { key: "low_stock_threshold_default", value: parseInt(form.low_stock_threshold_default) },
      { key: "estimated_delivery_days", value: form.estimated_delivery_days },
      { key: "store_available", value: form.store_available },
    ];
    for (const u of updates) {
      await supabase.from("settings").upsert({ key: u.key, value: u.value, updated_at: new Date().toISOString() });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={save} className="card flex max-w-2xl flex-col gap-5 p-6">
      <Field label="Store Name">
        <input className="input" value={form.store_name} onChange={(e) => setForm((f) => ({ ...f, store_name: e.target.value }))} />
      </Field>
      <Field label="Store Tagline">
        <input className="input" value={form.store_tagline} onChange={(e) => setForm((f) => ({ ...f, store_tagline: e.target.value }))} />
      </Field>
      <Field label="WhatsApp Number (with country code, no + or spaces)">
        <input className="input" value={form.whatsapp_number} onChange={(e) => setForm((f) => ({ ...f, whatsapp_number: e.target.value }))} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Shipping Charge (₹)">
          <input className="input" type="number" step="0.01" value={form.shipping_charge} onChange={(e) => setForm((f) => ({ ...f, shipping_charge: e.target.value }))} />
        </Field>
        <Field label="Free Shipping Above (₹)">
          <input className="input" type="number" step="0.01" value={form.free_shipping_threshold} onChange={(e) => setForm((f) => ({ ...f, free_shipping_threshold: e.target.value }))} />
        </Field>
      </div>

      <Field label="Estimated Delivery Time">
        <input className="input" value={form.estimated_delivery_days} onChange={(e) => setForm((f) => ({ ...f, estimated_delivery_days: e.target.value }))} />
      </Field>

      <Field label="Default Low-Stock Threshold">
        <input className="input" type="number" value={form.low_stock_threshold_default} onChange={(e) => setForm((f) => ({ ...f, low_stock_threshold_default: e.target.value }))} />
      </Field>

      <div className="rounded-xl border border-earth-200 p-4">
        <label className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-earth-700">Cash on Delivery</p>
            <p className="text-xs text-earth-400">When OFF, only online payment is shown at checkout.</p>
          </div>
          <input type="checkbox" className="h-5 w-5" checked={form.cod_enabled} onChange={(e) => setForm((f) => ({ ...f, cod_enabled: e.target.checked }))} />
        </label>
        {form.cod_enabled && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="COD Fee (₹)">
              <input className="input" type="number" step="0.01" value={form.cod_fee} onChange={(e) => setForm((f) => ({ ...f, cod_fee: e.target.value }))} />
            </Field>
            <Field label="Max COD Order Value (₹)">
              <input className="input" type="number" step="0.01" value={form.cod_max_order} onChange={(e) => setForm((f) => ({ ...f, cod_max_order: e.target.value }))} />
            </Field>
          </div>
        )}
      </div>

      <label className="flex items-center justify-between gap-3 rounded-xl border border-earth-200 p-4">
        <div>
          <p className="font-semibold text-earth-700">Store Available</p>
          <p className="text-xs text-earth-400">Turn off temporarily to pause new orders (e.g. while restocking).</p>
        </div>
        <input type="checkbox" className="h-5 w-5" checked={form.store_available} onChange={(e) => setForm((f) => ({ ...f, store_available: e.target.checked }))} />
      </label>

      <button type="submit" disabled={saving} className="btn-primary w-fit">{saving ? "Saving…" : saved ? "Saved ✓" : "Save Settings"}</button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-earth-600">{label}</span>
      {children}
    </label>
  );
}
