import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { signOut } from "../login/actions";
import AdminNav from "@/components/AdminNav";

export default async function AdminDashboardLayout({ children }) {
  const { user, profile } = await getCurrentUser();

  if (!user) redirect("/admin/login");

  if (!profile || profile.role !== "admin") {
    return (
      <main className="min-h-screen flex items-center justify-center px-5 text-center">
        <div className="max-w-sm">
          <h1 className="font-display text-2xl mb-3">Akses Ditolak</h1>
          <p className="text-sm text-ink/60 mb-6">
            Akun <strong>{user.email}</strong> masuk sebagai "{profile?.role || "customer"}", bukan admin. Minta admin lain
            menaikkan role kamu lewat Supabase, lihat langkah di README.md.
          </p>
          <form action={signOut}>
            <button type="submit" className="text-sm underline text-plum">Keluar &amp; coba akun lain</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="admin-shell flex min-h-screen bg-paper text-ink font-sans">
      <aside className="admin-sidebar w-[250px] bg-ink text-cream flex-none flex flex-col p-5">
        <a href="/" className="admin-logo font-display text-lg font-semibold mb-8 block">
          <span>Almas</span> Fashion
        </a>
        <p className="admin-menu-label">Menu Utama</p>
        <AdminNav />
        <div className="admin-sidebar-footer mt-auto pt-6 border-t border-white/10 space-y-3">
          <p className="text-[11px] text-cream/50 px-1">{user.email}</p>
          <form action={signOut}>
            <button type="submit" className="text-sm text-cream/80 hover:text-white">Keluar</button>
          </form>
          <a href="/" target="_blank" rel="noopener" className="block text-sm text-cream/80 hover:text-white">
            Lihat Toko ↗
          </a>
        </div>
      </aside>
      <div className="admin-main flex-1 min-w-0 p-6 sm:p-8">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">Almas Fashion</p>
            <p className="admin-topbar-title">Panel Administrasi</p>
          </div>
          <div className="admin-user">
            <span>Halo, Admin</span>
            <span className="admin-avatar">A</span>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
