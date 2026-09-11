"use client";
import { useMemo, useState } from "react";
import { formatINR } from "@/lib/money";

const ORDER_STATUSES = ["pending", "paid", "processing", "packed", "shipped", "delivered", "cancelled", "refunded"];

export default function OrdersTable({ orders }: { orders: any[] }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState(orders);
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return rows.filter((o) => {
      if (statusFilter !== "all" && o.order_status !== statusFilter) return false;
      if (paymentFilter !== "all" && o.payment_method !== paymentFilter) return false;
      if (search && !`${o.order_number} ${o.customer_name} ${o.customer_phone}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [rows, statusFilter, paymentFilter, search]);

  async function updateStatus(orderId: string, order_status: string) {
    setUpdating(orderId);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRows((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o)));
    }
    setUpdating(null);
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input className="input flex-1" placeholder="Search order #, name, or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
          <option value="all">All Payment Methods</option>
          <option value="online">Online</option>
          <option value="cod">COD</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl2 bg-white shadow-card">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-earth-100 text-xs uppercase tracking-wide text-earth-400">
              <th className="p-3">Order #</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Items</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-b border-earth-50 align-top">
                <td className="p-3 font-medium text-earth-700">{o.order_number}</td>
                <td className="p-3">
                  <p className="font-medium text-earth-700">{o.customer_name}</p>
                  <p className="text-xs text-earth-400">{o.customer_phone}</p>
                </td>
                <td className="p-3 text-xs text-earth-500">
                  {o.order_items?.map((i: any) => `${i.product_name} ×${i.quantity}`).join(", ")}
                </td>
                <td className="p-3 font-semibold text-earth-700">{formatINR(o.total_paise)}</td>
                <td className="p-3">
                  <span className="text-xs">{o.payment_method === "cod" ? "COD" : "Online"}</span>
                  <br />
                  <span className={`text-xs font-semibold ${o.payment_status === "paid" ? "text-green-600" : "text-earth-400"}`}>{o.payment_status}</span>
                </td>
                <td className="p-3">
                  <select
                    className="input text-xs"
                    value={o.order_status}
                    disabled={updating === o.id}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                  >
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="p-3 text-xs text-earth-400">{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-earth-400">No orders match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
