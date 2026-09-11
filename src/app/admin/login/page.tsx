"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // "Forgot password" is a separate small flow on the same page, rather than
  // a new route, so it can share the sign-in form's styling and state.
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [resetEmail, setResetEmail] = useState("");
  const [resetSending, setResetSending] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      // Surface Supabase's actual reason (e.g. "Email not confirmed",
      // "Invalid login credentials") instead of a generic message that
      // hides what's actually wrong.
      setError(error.message || "Invalid email or password.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault();
    setResetSending(true);
    setResetError(null);
    const supabase = createClient();

    // window.location.origin resolves to http://localhost:3000 in local dev
    // (matching the required redirect target) and to the live domain in
    // production. This exact URL must be added to Supabase's Redirect URL
    // allow-list — see README / dashboard setup notes below.
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setResetSending(false);
    if (error) {
      setResetError("Could not send reset email. Please try again.");
      return;
    }
    setResetSent(true);
  }

  if (mode === "forgot") {
    return (
      <div className="container-px flex min-h-[70vh] items-center justify-center py-16">
        <div className="card w-full max-w-sm p-8">
          <h1 className="mb-1 font-serif text-2xl font-bold text-earth-800">Reset Password</h1>
          <p className="mb-6 text-sm text-earth-500">Pritam&apos;s Dashboard</p>

          {resetSent ? (
            <div className="flex flex-col gap-4 text-center">
              <p className="text-sm text-earth-600">
                If an account exists for <span className="font-medium text-earth-800">{resetEmail}</span>, a
                password reset link has been sent. Check your inbox (and spam folder).
              </p>
              <button
                onClick={() => {
                  setMode("signin");
                  setResetSent(false);
                  setResetEmail("");
                }}
                className="btn-secondary w-full"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetRequest} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-earth-600">Email</span>
                <input
                  className="input"
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </label>
              {resetError && <p className="text-sm text-spice-600">{resetError}</p>}
              <button type="submit" disabled={resetSending} className="btn-primary w-full disabled:opacity-60">
                {resetSending ? "Sending…" : "Send Reset Link"}
              </button>
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="text-sm font-medium text-earth-500 hover:text-earth-700"
              >
                ← Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container-px flex min-h-[70vh] items-center justify-center py-16">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm p-8">
        <h1 className="mb-1 font-serif text-2xl font-bold text-earth-800">Admin Login</h1>
        <p className="mb-6 text-sm text-earth-500">Pritam&apos;s Dashboard</p>
        <label className="mb-3 flex flex-col gap-1">
          <span className="text-sm font-medium text-earth-600">Email</span>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="mb-2 flex flex-col gap-1">
          <span className="text-sm font-medium text-earth-600">Password</span>
          <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button
          type="button"
          onClick={() => {
            setMode("forgot");
            setResetEmail(email);
          }}
          className="mb-4 self-end text-xs font-medium text-earth-500 hover:text-earth-700"
        >
          Forgot password?
        </button>
        {error && <p className="mb-3 text-sm text-spice-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
