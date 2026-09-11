"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { useCart } from "@/lib/cart-context";
import { formatINR } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import type { Settings } from "@/lib/types";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const initialForm = {
  name: "",
  phone: "",
  email: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  pincode: "",
};

export default function CheckoutPage() {
  const { lines, subtotalPaise, clearCart } = useCart();
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [form, setForm] = useState(initialForm);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const shipping = settings
    ? subtotalPaise >= settings.free_shipping_threshold_paise
      ? 0
      : settings.shipping_charge_paise
    : 0;
  const codFee = paymentMethod === "cod" ? settings?.cod_fee_paise ?? 0 : 0;
  const total = subtotalPaise + shipping + codFee;

  function updateField(key: keyof typeof initialForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Please enter your full name.";
    if (!/^(?:\+91|91)?[6-9]\d{9}$/.test(form.phone.replace(/[\s-]/g, ""))) e.phone = "Enter a valid 10-digit mobile number.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (form.address_line1.trim().length < 4) e.address_line1 = "Address is required.";
    if (form.city.trim().length < 2) e.city = "City is required.";
    if (form.state.trim().length < 2) e.state = "State is required.";
    if (!/^[1-9][0-9]{5}$/.test(form.pincode.trim())) e.pincode = "Enter a valid 6-digit PIN code.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setSubmitError(null);
    if (lines.length === 0) {
      setSubmitError("Your cart is empty.");
      return;
    }
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          payment_method: paymentMethod,
          items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Something went wrong with your order. Please try again.");
        setLoading(false);
        return;
      }

      if (paymentMethod === "cod") {
        clearCart();
        router.push(`/order-success/${data.orderId}`);
        return;
      }

      // ONLINE: open Razorpay checkout
      const payRes = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.orderId }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) {
        setSubmitError(payData.error || "Something went wrong with your payment. Please try again.");
        setLoading(false);
        return;
      }

      if (!window.Razorpay) {
        setSubmitError("Payment is still loading. Please try again in a moment.");
        setLoading(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: payData.keyId,
        amount: payData.amount,
        currency: payData.currency,
        name: "Pritam's",
        description: `Order ${payData.orderNumber}`,
        image: "/logo.png",
        order_id: payData.razorpayOrderId,
        prefill: {
          name: payData.customerName,
          email: payData.customerEmail || undefined,
          contact: payData.customerPhone,
        },
        theme: { color: "#8F5A2E" },
        handler: async function (response: any) {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, orderId: data.orderId }),
          });
          if (verifyRes.ok) {
            clearCart();
            router.push(`/order-success/${data.orderId}`);
          } else {
            setSubmitError("Payment verification is in progress. If you were charged, please contact us on WhatsApp with your order number.");
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setSubmitError("Payment was cancelled. You can try again anytime.");
            setLoading(false);
          },
        },
      });

      rzp.on("payment.failed", function () {
        setSubmitError("Your payment failed. Please try again, or contact us on WhatsApp.");
        setLoading(false);
      });

      rzp.open();
    } catch {
      setSubmitError("Unable to place your order. Please contact us on WhatsApp.");
      setLoading(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="container-px flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-earth-500">Your cart is empty.</p>
        <Link href="/shop" className="btn-primary">Shop Achaar</Link>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <div className="container-px py-12 sm:py-16">
        <h1 className="mb-8 font-serif text-3xl font-bold text-earth-800">Checkout</h1>
        <div className="grid gap-10 lg:grid-cols-3">
          <form onSubmit={handleSubmit} className="card flex flex-col gap-4 p-6 lg:col-span-2">
            <h2 className="font-serif text-lg font-bold text-earth-700">Shipping Details</h2>

            <Field label="Full Name" error={errors.name}>
              <input className="input" value={form.name} onChange={(e) => updateField("name", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mobile Number" error={errors.phone}>
                <input className="input" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="98765 43210" />
              </Field>
              <Field label="Email (optional)" error={errors.email}>
                <input className="input" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
              </Field>
            </div>
            <Field label="Address Line 1" error={errors.address_line1}>
              <input className="input" value={form.address_line1} onChange={(e) => updateField("address_line1", e.target.value)} />
            </Field>
            <Field label="Address Line 2 (optional)">
              <input className="input" value={form.address_line2} onChange={(e) => updateField("address_line2", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City" error={errors.city}>
                <input className="input" value={form.city} onChange={(e) => updateField("city", e.target.value)} />
              </Field>
              <Field label="State" error={errors.state}>
                <input className="input" value={form.state} onChange={(e) => updateField("state", e.target.value)} />
              </Field>
              <Field label="PIN Code" error={errors.pincode}>
                <input className="input" value={form.pincode} onChange={(e) => updateField("pincode", e.target.value)} inputMode="numeric" maxLength={6} />
              </Field>
            </div>

            <h2 className="mt-4 font-serif text-lg font-bold text-earth-700">Payment Method</h2>
            <div className="flex flex-col gap-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-earth-200 p-3">
                <input type="radio" checked={paymentMethod === "online"} onChange={() => setPaymentMethod("online")} />
                <span className="text-sm font-medium text-earth-700">Pay Online (UPI, Cards, Netbanking, Wallets)</span>
              </label>
              {settings?.cod_enabled && (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-earth-200 p-3">
                  <input type="radio" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
                  <span className="text-sm font-medium text-earth-700">Cash on Delivery</span>
                </label>
              )}
            </div>

            {submitError && <p className="rounded-lg bg-spice-500/10 p-3 text-sm text-spice-600">{submitError}</p>}

            <button type="submit" disabled={loading} className="btn-primary mt-2 w-full disabled:opacity-60">
              {loading ? "Processing…" : paymentMethod === "cod" ? "Place Order" : `Pay ${formatINR(total)}`}
            </button>
          </form>

          <div className="card h-fit p-6">
            <h2 className="mb-4 font-serif text-lg font-bold text-earth-700">Order Summary</h2>
            <ul className="flex flex-col gap-2 text-sm text-earth-600">
              {lines.map((l) => (
                <li key={l.productId} className="flex justify-between">
                  <span>{l.name} × {l.quantity}</span>
                  <span>{formatINR(l.pricePaise * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-earth-100 pt-4 text-sm text-earth-600">
              <span>Subtotal</span><span>{formatINR(subtotalPaise)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm text-earth-600">
              <span>Shipping</span><span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
            </div>
            {codFee > 0 && (
              <div className="mt-2 flex justify-between text-sm text-earth-600">
                <span>COD Fee</span><span>{formatINR(codFee)}</span>
              </div>
            )}
            <div className="mt-4 flex justify-between border-t border-earth-100 pt-4 text-base font-bold text-earth-800">
              <span>Total</span><span>{formatINR(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-earth-600">{label}</span>
      {children}
      {error && <span className="text-xs text-spice-600">{error}</span>}
    </label>
  );
}
