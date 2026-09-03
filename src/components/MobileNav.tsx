"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: "⌂", label: "Home" },
  { href: "/inventory", icon: "▣", label: "Stock" },
  { href: "/scan", icon: "▣", label: "Scan" },
  { href: "/receive", icon: "+", label: "Receive" },
  { href: "/wastage", icon: "◫", label: "Wastage" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-item ${active ? "active" : ""}`}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
