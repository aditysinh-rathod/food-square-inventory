"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSignup(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signupError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

      if (signupError) {
        setError(signupError.message);
        return;
      }

      /*
        If email confirmation is enabled,
        Supabase may not create an active
        session immediately.
      */

      if (!data.session) {
        setSuccess(
          "Account created! Please check your email and confirm your account before signing in."
        );
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
            Take control of
            <br />
            your inventory.
          </h2>

          <p>
            Create your account and start managing inventory,
            expiry dates, stock movements and wastage from one
            simple platform.
          </p>
        </div>

        <div className="auth-brand-footer">
          © 2026 Food Square. All rights reserved.
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-card">

          <h2>Create Account 🚀</h2>

          <p className="auth-subtitle">
            Get started with Food Square Inventory.
          </p>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-success">
              {success}
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={handleSignup}
          >
            <div className="form-group">
              <label>Full Name</label>

              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

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
              <label>Password</label>

              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>

              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading
                ? "Creating account..."
                : "Create Account"}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?{" "}
            <Link href="/login">
              Sign In
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
