import { createClient } from "@/lib/supabase/server";

const fmt = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");

export default async function AdminDashboard() {
  const supabase = createClient();
  const { data: products } = await supabase.from("products").select("*, categories(name)");
  const { data: orders } = await supabase.from("orders").select("id, status, subtotal, created_at");

  const list = products || [];
  const total = list.length;
  const active = list.filter((p) => p.status === "active").length;
  const discounted = list.filter((p) => (p.discount_percent || 0) > 0).length;
  const attention = list.filter((p) => p.stock <= 5).sort((a, b) => a.stock - b.stock);

  const orderList = orders || [];
  const pendingOrders = orderList.filter((o) => o.status === "pending").length;

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-6">Dashboard</h1>

      {/* Tampilan HP paksa grid-cols-2 (1 baris 2 kotak) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
        <Stat label="Total Produk" value={total} />
        <Stat label="Produk Aktif" value={active} />
        <Stat label="Sedang Diskon" value={discounted} />
        <Stat label="Stok Menipis / Habis" value={attention.length} />
        <Stat label="Pesanan Menunggu" value={pendingOrders} href="/admin/pesanan?status=pending" />
      </div>

      <div className="bg-white border border-[var(--line)] rounded-sm">
        <div className="px-5 py-4 border-b border-[var(--line)] flex items-center justify-between">
          <h2 className="font-display text-lg">Perlu Perhatian</h2>
          <a href="/admin/produk" className="text-xs text-plum underline">Kelola semua produk</a>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink/50 border-b border-[var(--line)]">
                <th className="py-3 px-4">Produk</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Stok</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {attention.length === 0 ? (
                <tr><td colSpan={4} className="text-center text-ink/45 py-8">Semua stok aman.</td></tr>
              ) : (
                attention.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--line)]">
                    <td className="py-3 px-4 font-medium">{p.name}</td>
                    <td className="py-3 px-4">{p.categories?.name || "—"}</td>
                    <td className="py-3 px-4">{p.stock}</td>
                    <td className="py-3 px-4">
                      {p.stock === 0 ? (
                        <span className="badge badge-out">Stok Habis</span>
                      ) : (
                        <span className="badge badge-low">Stok Menipis</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, href }) {
  const content = (
    <div className="bg-white border border-[var(--line)] rounded-sm p-3.5 sm:p-5 h-full">
      <p className="text-xs text-ink/50 leading-tight">{label}</p>
      <p className="font-display text-2xl sm:text-3xl mt-1.5">{value}</p>
    </div>
  );
  return href ? <a href={href}>{content}</a> : content;
}