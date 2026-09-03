"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "⌂" },
  { href: "/inventory", label: "Inventory", icon: "▣" },
  { href: "/receive", label: "Receive Stock", icon: "+" },
  { href: "/consumption", label: "Daily Consumption", icon: "◔" },
  { href: "/wastage", label: "Wastage", icon: "◫" },
  { href: "/audit", label: "Stock Audit", icon: "✓" },
  { href: "/ledger", label: "Inventory Ledger", icon: "≡" },
  { href: "/products", label: "Products", icon: "□" },
  { href: "/suppliers", label: "Suppliers", icon: "♙" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">FS</div>
        <div>
          <strong>Food Square</strong>
          <small>Inventory Control</small>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`sidebar-link ${active ? "active" : ""}`}
            >
              <span className="sidebar-link-icon">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-status-dot" />
        System ready
      </div>
    </aside>
  );
}
