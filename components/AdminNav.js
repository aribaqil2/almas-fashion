"use client";

import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/produk", label: "Produk", icon: "👗" },
  { href: "/admin/kategori", label: "Kategori", icon: "📂" },
  { href: "/admin/diskon", label: "Diskon", icon: "🏷️" },
  { href: "/admin/pesanan", label: "Pesanan", icon: "📦" },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: "⚙️" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <a
            key={l.href}
            href={l.href}
            className={`admin-nav-item px-3.5 py-2.5 rounded-sm text-sm font-medium ${
              active ? "active" : ""
            }`}
          >
            <span className="admin-nav-icon" aria-hidden="true">{l.icon}</span>
            <span>{l.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
