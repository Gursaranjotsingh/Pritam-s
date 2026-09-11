import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import AdminLogoutButton from "@/components/AdminLogoutButton";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/settings", label: "Settings" },
];

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
      <aside className="flex flex-shrink-0 flex-row items-center justify-between gap-2 border-b border-earth-100 bg-white p-4 sm:w-56 sm:flex-col sm:items-stretch sm:border-b-0 sm:border-r sm:p-6">
        <div>
          <p className="mb-4 hidden font-serif text-lg font-bold text-earth-700 sm:block">Pritam&apos;s Admin</p>
          <nav className="flex gap-2 sm:flex-col">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-medium text-earth-600 hover:bg-earth-100">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <AdminLogoutButton />
      </aside>
      <main className="flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}
