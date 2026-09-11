import { createClient } from "@/lib/supabase/client";
import type { Settings } from "@/lib/types";

const DEFAULTS: Settings = {
  store_name: "Pritam's",
  store_tagline: "The Taste of Indian Household",
  whatsapp_number: "916280060371",
  currency: "INR",
  shipping_charge_paise: 6000,
  free_shipping_threshold_paise: 99900,
  cod_enabled: false,
  cod_fee_paise: 0,
  cod_max_order_paise: 200000,
  low_stock_threshold_default: 5,
  estimated_delivery_days: "4-6 business days",
  store_available: true,
};

// Fetch all public settings as a typed object. Safe to call from client components.
export async function getSettings(): Promise<Settings> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("settings").select("key, value");
    if (error || !data) return DEFAULTS;
    const map: Record<string, unknown> = {};
    for (const row of data) map[row.key] = row.value;
    return { ...DEFAULTS, ...map } as Settings;
  } catch {
    return DEFAULTS;
  }
}
