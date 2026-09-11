import { createServerSupabase } from "@/lib/supabase/server";
import SettingsForm from "./SettingsForm";

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const supabase = createServerSupabase();
  const { data } = await supabase.from("settings").select("key, value");
  const settings: Record<string, unknown> = {};
  for (const row of data ?? []) settings[row.key] = row.value;

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-bold text-earth-800">Settings</h1>
      <SettingsForm initial={settings} />
    </div>
  );
}
