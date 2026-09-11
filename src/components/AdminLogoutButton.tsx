"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLogoutButton() {
  const router = useRouter();
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }
  return (
    <button onClick={handleLogout} className="rounded-lg px-3 py-2 text-left text-sm font-medium text-spice-600 hover:bg-spice-50">
      Log Out
    </button>
  );
}
