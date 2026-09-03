"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      router.replace("/dashboard");
      router.refresh();

    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">

      <section className="auth-brand">
        <div className="auth-brand-logo">
          <div className="auth-brand-logo-box">FS</div>

          <div>
            <h1>Food Square</h1>
            <p>Inventory & Expiry Management System</p>
          </div>
        </div>

        <div className="auth-brand-content">
          <h2>
            Manage your inventory.
            <br />
            Reduce your wastage.
          </h2>

          <p>
            Track inventory, expiry dates, stock movements and wastage
            from one simple system.
          </p>
        </div>

        <div className="auth-brand-footer">
          © 2026 Food Square. All rights reserved.
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-card">

          <h2>Welcome back 👋</h2>

          <p className="auth-subtitle">
            Sign in to manage your inventory.
          </p>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={handleLogin}
          >
            <div className="form-group">
              <label>Email Address</label>

              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <div className="password-row">
                <label>Password</label>

                <Link
                  href="/forgot-password"
                  className="forgot-link"
                >
                  Forgot password?
                </Link>
              </div>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="auth-footer">
            Don&apos;t have an account?{" "}
            <Link href="/signup">
              Create account
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
