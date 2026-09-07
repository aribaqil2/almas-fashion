"use client";

import { useState } from "react";
import AdminNav from "@/components/AdminNav";

export default function AdminSidebarMobile({ user, signOut }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Tombol Hamburger (Mobile Only) */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="md:hidden p-2 -ml-2 rounded-md hover:bg-black/5 text-ink focus:outline-none"
        aria-label="Toggle Menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay Gelap Latar Belakang (Mobile Only) */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity" 
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar fixed md:static inset-y-0 left-0 z-50 w-[250px] bg-[#95b4a4] text-ink flex-none flex flex-col p-5 transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="flex items-center justify-between mb-8">
          <a href="/" className="admin-logo font-display text-lg font-semibold block text-ink">
            <span>Almas</span> Fashion
          </a>
          <button 
            onClick={() => setIsOpen(false)} 
            className="md:hidden text-ink p-1 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        <p className="admin-menu-label text-ink/70 font-bold text-[11px] tracking-wider uppercase mb-2">Menu Utama</p>
        <AdminNav />

        <div className="admin-sidebar-footer mt-auto pt-6 border-t border-black/10 space-y-3">
          <p className="text-[11px] text-ink/70 px-1 truncate">{user?.email}</p>
          <form action={signOut}>
            <button type="submit" className="text-sm font-semibold text-ink hover:text-black">Keluar</button>
          </form>
          <a href="/" target="_blank" rel="noopener" className="block text-sm font-semibold text-ink hover:text-black">
            Lihat Toko ↗
          </a>
        </div>
      </aside>
    </>
  );
}