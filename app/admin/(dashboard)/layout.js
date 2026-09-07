"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
  { name: "Dashboard", href: "/admin", icon: "📊" },
  { name: "Produk", href: "/admin/produk", icon: "👗" },      // Diubah dari /admin/products
  { name: "Kategori", href: "/admin/kategori", icon: "🏷️" },  // Diubah jika nama foldernya 'kategori'
  { name: "Pesanan", href: "/admin/pesanan", icon: "📦" },    // Diubah dari /admin/orders
  { name: "Diskon", href: "/admin/diskon", icon: "🎟️" },
  { name: "Pengaturan", href: "/admin/pengaturan", icon: "⚙️" },
];

  return (
    <div className="admin-shell min-h-screen flex flex-col md:flex-row relative">
      {/* Overlay Gelap Layar HP */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Admin */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 p-5 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 md:static ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "#95b4a4" }}
      >
        <div>
          <div className="flex items-center justify-between pb-5 border-b border-black/10">
            <h1 className="text-xl font-bold text-white tracking-wide">
              ALMAS <span className="text-amber-300">ADMIN</span>
            </h1>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-white text-xl font-bold p-1"
            >
              ✕
            </button>
          </div>

          <p className="admin-menu-label mt-4">Menu Utama</p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`admin-nav-item ${isActive ? "active" : ""}`}
                >
                  <span className="admin-nav-icon">{item.icon}</span>
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-black/10">
          <Link
            href="/"
            className="flex items-center gap-3 p-2 text-sm text-ink hover:bg-black/5 rounded-lg transition"
          >
            <span>🏠</span> Lihat Toko
          </Link>
        </div>
      </aside>

      {/* Area Konten Utama */}
      <main className="admin-main flex-1 p-4 md:p-8">
        {/* Topbar dengan Tombol Hamburger di Kiri Topbar */}
        <header className="admin-topbar flex items-center justify-between gap-4 mb-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            {/* Tombol Hamburger HP */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg bg-black/5 text-slate-800 text-xl flex items-center justify-center"
              aria-label="Open Menu"
            >
              ☰
            </button>
            <div>
              <p className="admin-eyebrow">ALMAS FASHION</p>
              <h2 className="admin-topbar-title">Panel Administrasi</h2>
            </div>
          </div>

          <div className="admin-user flex items-center gap-3">
            <div className="admin-avatar">A</div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}