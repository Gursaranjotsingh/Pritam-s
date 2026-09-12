import Link from "next/link";
import Image from "next/image";
import { createServerSupabase } from "@/lib/supabase/server";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import AdminNav from "@/components/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The login page itself renders without this layout's chrome check —
  // middleware.ts already redirects unauthenticated users to /admin/login.
  if (!user) {
    return <div className="container-px py-16">{children}</div>;
  }

  const { data: admin } = await supabase.from("admin_users").select("full_name, role").eq("id", user.id).maybeSingle();

  if (!admin) {
    return (
      <div className="container-px py-16 text-center">
        <p className="text-earth-600">
          Your account isn&apos;t set up as an admin yet. Ask an existing admin to add you, or run the SQL in
          the README under &ldquo;How to create the first admin account&rdquo;.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] flex-col bg-earth-50 sm:flex-row">
      <aside className="flex flex-shrink-0 flex-col gap-4 border-b border-earth-100 bg-white p-4 sm:w-60 sm:border-b-0 sm:border-r sm:p-6">
        <Link href="/" target="_blank" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Pritam's" width={36} height={36} className="rounded-full" />
          <div>
            <p className="font-serif text-base font-bold text-earth-700">Pritam&apos;s Admin</p>
            <p className="text-xs text-earth-400">{admin.full_name || user.email}</p>
          </div>
        </Link>

        <AdminNav />

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-earth-500 hover:bg-earth-100"
        >
          <span aria-hidden>🔗</span> View Storefront
        </a>

        <div className="sm:mt-auto">
          <AdminLogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}
