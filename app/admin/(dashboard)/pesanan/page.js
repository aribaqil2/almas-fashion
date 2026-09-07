import { createClient } from "@/lib/supabase/server";
import Pagination from "@/components/Pagination";

// Pemformat angka yang aman dari null/undefined/string
const fmt = (n) => "Rp" + Math.round(Number(n) || 0).toLocaleString("id-ID");
const PER_PAGE = 20;

const STATUS_LABEL = {
  pending: { text: "Menunggu Konfirmasi", cls: "badge-low" },
  diproses: { text: "Diproses", cls: "badge-discount" },
  dikirim: { text: "Dikirim", cls: "badge-discount" },
  selesai: { text: "Selesai", cls: "badge-active" },
  dibatalkan: { text: "Dibatalkan", cls: "badge-out" },
};

export default async function PesananPage({ searchParams }) {
  const supabase = createClient();

  const page = Math.max(1, Number(searchParams.page || 1));
  const from = (page - 1) * PER_PAGE;

  let query = supabase.from("orders").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (searchParams.status) query = query.eq("status", searchParams.status);

  const { data: orders, count } = await query.range(from, from + PER_PAGE - 1);
  const totalPages = Math.max(1, Math.ceil((count || 0) / PER_PAGE));

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-6">Pesanan</h1>

      <form method="get" className="flex flex-wrap items-center gap-2.5 mb-5">
        <select name="status" defaultValue={searchParams.status || ""} className="border border-[var(--line)] rounded-sm px-3 py-2 text-sm bg-white">
          <option value="">Semua status</option>
          {Object.entries(STATUS_LABEL).map(([val, { text }]) => (
            <option key={val} value={val}>{text}</option>
          ))}
        </select>
        <button type="submit" className="border border-[var(--line)] text-sm font-medium px-4 py-2 rounded-sm bg-white">Filter</button>
      </form>

      <p className="text-xs text-ink/45 mb-3">{count || 0} pesanan total</p>

      <div className="bg-white border border-[var(--line)] rounded-sm overflow-x-auto">
        <table className="admin-table w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink/50">
              <th className="py-3 px-4">No. Pesanan</th>
              <th className="py-3 px-4">Pelanggan</th>
              <th className="py-3 px-4">Ongkir</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Tanggal</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {(orders || []).map((o) => {
              const s = STATUS_LABEL[o.status] || STATUS_LABEL.pending;
              
              // Amankan nilai ongkir dan total dari database
              const shipping = Number(o.shipping_cost) || 0;
              const total = Number(o.total_amount || o.total || o.subtotal) || 0;
              const orderNum = o.order_number || `#${o.id.slice(0, 8)}`;

              return (
                <tr key={o.id}>
                  <td className="py-3 px-4 font-medium">{orderNum}</td>
                  <td className="py-3 px-4">{o.customer_name}</td>
                  <td className="py-3 px-4">{shipping === 0 ? "Gratis" : fmt(shipping)}</td>
                  <td className="py-3 px-4 font-medium">{fmt(total)}</td>
                  <td className="py-3 px-4"><span className={`badge ${s.cls}`}>{s.text}</span></td>
                  <td className="py-3 px-4 text-ink/50">{new Date(o.created_at).toLocaleDateString("id-ID")}</td>
                  <td className="py-3 px-4 text-right">
                    {/* Tombol Detail Bergaya Update */}
                    <a 
                      href={`/admin/pesanan/${o.id}`} 
                      className="inline-block bg-[#800020] hover:opacity-90 text-white text-xs font-medium px-3.5 py-1.5 rounded-full transition-all shadow-xs"
                    >
                      Detail
                    </a>
                  </td>
                </tr>
              );
            })}
            {(!orders || orders.length === 0) && (
              <tr><td colSpan={7} className="text-center text-ink/50 py-10">Belum ada pesanan masuk.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination searchParams={searchParams} currentPage={page} totalPages={totalPages} />
    </div>
  );
}