"use client";

// Reached via the link in Supabase's "Reset your password" email
// (configured to redirect to /reset-password — see README/Supabase dashboard
// notes). Supabase's browser client automatically detects the recovery
// code/token in the URL and turns it into a temporary "recovery session",
// firing a PASSWORD_RECOVERY auth event. We wait for that event before
// showing the new-password form — this is what proves the visitor arrived
// via a valid, unexpired recovery link rather than just guessing the URL.
//
// Uses the SAME browser client as the rest of the app (lib/supabase/client.ts) —
// no separate Supabase client is created here.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "ready" | "invalid" | "success";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Supabase sends expired/invalid links back with error params instead of
    // a working session — catch that immediately rather than waiting it out.
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (params.get("error") || hashParams.get("error")) {
      setStatus("invalid");
      return;
    }

    // The official way to detect a valid recovery link: Supabase's client
    // exchanges the URL's code/token for a session on load and emits this
    // event. This works whether the app uses the hash-based or PKCE flow.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setStatus("ready");
      }
    });

    // Fallback: if the event already fired before this listener attached,
    // there will already be an active session by the time we check here.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus((current) => (current === "checking" && session ? "ready" : current));
    });

    // If neither of the above happened within a few seconds, the link was
    // missing, already used, or expired.
    const timeout = setTimeout(() => {
      setStatus((current) => (current === "checking" ? "invalid" : current));
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      // A recovery session can expire between page load and submit — treat
      // that the same way as an invalid link rather than a generic error.
      if (/expired|session/i.test(error.message)) {
        setStatus("invalid");
        return;
      }
      setFormError(error.message || "Could not update your password. Please try again.");
      return;
    }

    // Require a fresh sign-in with the new password rather than continuing
    // on the temporary recovery session.
    await supabase.auth.signOut();
    setStatus("success");
    setTimeout(() => router.push("/admin/login"), 1800);
  }

  return (
    <div className="container-px flex min-h-[70vh] items-center justify-center py-16">
      <div className="card w-full max-w-sm p-8">
        <h1 className="mb-1 font-serif text-2xl font-bold text-earth-800">Reset Password</h1>
        <p className="mb-6 text-sm text-earth-500">Pritam&apos;s Dashboard</p>

        {status === "checking" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-earth-300 border-t-earth-600" />
            <p className="text-sm text-earth-500">Verifying your reset link…</p>
          </div>
        )}

        {status === "invalid" && (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-sm text-spice-600">
              This password reset link is invalid or has expired. Reset links are only valid for a short time
              and can only be used once.
            </p>
            <Link href="/admin/login" className="btn-primary w-full">
              Back to Login
            </Link>
            <p className="text-xs text-earth-400">
              You can request a new reset link from the login page.
            </p>
          </div>
        )}

        {status === "ready" && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-earth-600">Enter a new password for your admin account.</p>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-earth-600">New Password</span>
              <input
                className="input"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-earth-600">Confirm New Password</span>
              <input
                className="input"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
            {formError && <p className="text-sm text-spice-600">{formError}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
              {submitting ? "Updating…" : "Set New Password"}
            </button>
          </form>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="text-3xl">✓</div>
            <p className="text-sm font-medium text-earth-700">Your password has been updated.</p>
            <p className="text-xs text-earth-400">Redirecting you to login…</p>
          </div>
        )}
      </div>
    </div>
  );
}
