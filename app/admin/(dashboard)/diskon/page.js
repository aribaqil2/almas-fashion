import { createClient } from "@/lib/supabase/server";
import { applyBulkDiscount, clearDiscount, clearAllDiscounts } from "./actions";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";

const fmt = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");
const finalPrice = (p) => p.price * (1 - (p.discount_percent || 0) / 100);

export default async function DiskonPage({ searchParams }) {
  const supabase = createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("name");
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .gt("discount_percent", 0)
    .order("discount_percent", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-6">Diskon</h1>

      {searchParams.error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-sm px-3 py-2 mb-5">{searchParams.error}</p>
      )}
      {searchParams.success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-sm px-3 py-2 mb-5">{searchParams.success}</p>
      )}

      <div className="bg-white border border-[var(--line)] rounded-sm p-5 mb-6">
        <h2 className="font-display text-lg mb-4">Terapkan Diskon Massal</h2>
        <form action={applyBulkDiscount} className="flex flex-wrap items-end gap-3">
          <div className="field w-48">
            <label>Kategori</label>
            <select name="category_id" defaultValue="">
              <option value="">Semua kategori</option>
              {(categories || []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="field w-32">
            <label>Diskon (%)</label>
            <input name="percent" type="number" min="0" max="90" step="1" defaultValue="15" required />
          </div>
          <button type="submit" className="bg-plum text-white text-sm font-medium px-4 py-2.5 rounded-sm">Terapkan</button>
        </form>
        <form action={clearAllDiscounts} className="mt-3">
          <ConfirmSubmitButton message="Hapus diskon dari semua produk?" className="border border-[var(--line)] text-sm font-medium px-4 py-2.5 rounded-sm">
            Hapus semua diskon
          </ConfirmSubmitButton>
        </form>
      </div>

      <div className="bg-white border border-[var(--line)] rounded-sm">
        <div className="px-5 py-4 border-b border-[var(--line)]">
          <h2 className="font-display text-lg">Produk Sedang Diskon</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink/50">
                <th className="py-3 px-4">Produk</th>
                <th className="py-3 px-4">Harga Normal</th>
                <th className="py-3 px-4">Diskon</th>
                <th className="py-3 px-4">Harga Akhir</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {(products || []).map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5 px-4 font-medium">{p.name}</td>
                  <td className="py-2.5 px-4">{fmt(p.price)}</td>
                  <td className="py-2.5 px-4"><span className="badge badge-discount">{p.discount_percent}%</span></td>
                  <td className="py-2.5 px-4 font-medium">{fmt(finalPrice(p))}</td>
                  <td className="py-2.5 px-4 text-right">
                    <form action={clearDiscount}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="text-xs underline text-plum">Hapus diskon</button>
                    </form>
                  </td>
                </tr>
              ))}
              {(!products || products.length === 0) && (
                <tr><td colSpan={5} className="text-center text-ink/50 py-10">Belum ada produk yang sedang didiskon.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
