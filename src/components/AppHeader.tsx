"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AppHeader() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    const supabase = createClient();

    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  return (
    <header className="app-header">
      <div className="app-header-brand">
        <div className="app-logo">FS</div>

        <div>
          <h1>Food Square</h1>
          <span>Inventory System</span>
        </div>
      </div>

      <div className="app-header-actions">
        <button
          type="button"
          className="header-icon-button"
          aria-label="Notifications"
        >
          🔔
        </button>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
          disabled={loading}
        >
          {loading ? "..." : "Logout"}
        </button>
      </div>
    </header>
  );
}
