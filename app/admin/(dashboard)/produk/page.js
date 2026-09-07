import { createClient } from "@/lib/supabase/server";
import { deleteProduct } from "./actions";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import Pagination from "@/components/Pagination";

const fmt = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");
const finalPrice = (p) => p.price * (1 - (p.discount_percent || 0) / 100);
const PER_PAGE = 20;

export default async function ProdukPage({ searchParams }) {
  const supabase = createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("name");

  const page = Math.max(1, Number(searchParams.page || 1));
  const from = (page - 1) * PER_PAGE;

  let query = supabase
    .from("products")
    .select("*, categories(id, name)", { count: "exact" })
    .order("created_at", { ascending: false });
  if (searchParams.kategori) query = query.eq("category_id", searchParams.kategori);
  if (searchParams.q) query = query.ilike("name", `%${searchParams.q}%`);

  const { data: products, count } = await query.range(from, from + PER_PAGE - 1);
  const totalPages = Math.max(1, Math.ceil((count || 0) / PER_PAGE));
  const list = products || [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">Produk</h1>
        <a href="/admin/produk/baru" className="bg-plum text-white text-sm font-medium px-4 py-2.5 rounded-sm">+ Tambah Produk</a>
      </div>

      {searchParams.error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-sm px-3 py-2 mb-5">{searchParams.error}</p>
      )}
      {searchParams.success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-sm px-3 py-2 mb-5">{searchParams.success}</p>
      )}

      {/* Form Cari & Filter */}
      <form method="get" className="flex flex-wrap items-center gap-2.5 mb-5">
        <input
          type="text"
          name="q"
          defaultValue={searchParams.q || ""}
          placeholder="Cari produk..."
          className="border border-[var(--line)] rounded-sm px-3 py-2 text-sm w-full sm:w-52 bg-white"
        />
        <select name="kategori" defaultValue={searchParams.kategori || ""} className="border border-[var(--line)] rounded-sm px-3 py-2 text-sm bg-white flex-1 sm:flex-none">
          <option value="">Semua kategori</option>
          {(categories || []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button type="submit" className="border border-[var(--line)] text-sm font-medium px-4 py-2 rounded-sm bg-white">Cari</button>
      </form>

      <p className="text-xs text-ink/45 mb-3">{count || 0} produk total</p>

      {/* 1. TAMPILAN MOBILE: KARTU (Tampil hanya di layar HP) */}
      <div className="grid grid-cols-1 gap-3 md:hidden mb-6">
        {list.length === 0 ? (
          <div className="bg-white border border-[var(--line)] rounded-sm p-6 text-center text-ink/50 text-sm">
            Tidak ada produk yang cocok.
          </div>
        ) : (
          list.map((p) => (
            <div key={p.id} className="bg-white border border-[var(--line)] rounded-sm p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-base text-ink">{p.name}</h3>
                  <p className="text-xs text-ink/50">Motif {p.motif} &middot; {p.color}</p>
                </div>
                {p.status === "active" ? (
                  <span className="badge badge-active">Aktif</span>
                ) : (
                  <span className="badge badge-draft">Draf</span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-ink/60">
                <span className="bg-black/5 px-2 py-0.5 rounded">{p.categories?.name || "Tanpa Kategori"}</span>
                <span>•</span>
                <span>Stok: <strong>{p.stock}</strong></span>
                {p.stock === 0 && <span className="badge badge-out">Habis</span>}
                {p.stock > 0 && p.stock <= 5 && <span className="badge badge-low">Menipis</span>}
              </div>

              <div className="flex items-baseline gap-2 mt-1 pt-2 border-t border-[var(--line)]">
                <span className="font-semibold text-plum text-sm">{fmt(finalPrice(p))}</span>
                {p.discount_percent > 0 && (
                  <>
                    <span className="text-xs text-ink/40 line-through">{fmt(p.price)}</span>
                    <span className="badge badge-discount">-{p.discount_percent}%</span>
                  </>
                )}
              </div>

              {/* Tombol Aksi HP */}
              <div className="flex items-center justify-end gap-4 mt-2 pt-2 border-t border-[var(--line)]">
                <a href={`/admin/produk/${p.id}/edit`} className="text-xs underline text-plum font-medium">Edit</a>
                <form action={deleteProduct} className="inline">
                  <input type="hidden" name="id" value={p.id} />
                  <ConfirmSubmitButton message={`Hapus "${p.name}"?`} className="text-xs underline text-red-700 font-medium">
                    Hapus
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 2. TAMPILAN DESKTOP: TABEL (Tampil di Laptop/Tablet) */}
      <div className="hidden md:block bg-white border border-[var(--line)] rounded-sm overflow-x-auto mb-6">
        <table className="admin-table w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink/50">
              <th className="py-3 px-4">Produk</th>
              <th className="py-3 px-4">Kategori</th>
              <th className="py-3 px-4">Harga</th>
              <th className="py-3 px-4">Diskon</th>
              <th className="py-3 px-4">Harga Akhir</th>
              <th className="py-3 px-4">Stok</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td className="py-3 px-4">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-ink/45">Motif {p.motif} &middot; {p.color}</p>
                </td>
                <td className="py-3 px-4">{p.categories?.name || "—"}</td>
                <td className="py-3 px-4">{fmt(p.price)}</td>
                <td className="py-3 px-4">
                  {p.discount_percent > 0 ? <span className="badge badge-discount">{p.discount_percent}%</span> : "—"}
                </td>
                <td className="py-3 px-4 font-medium">{fmt(finalPrice(p))}</td>
                <td className="py-3 px-4">
                  {p.stock}
                  {p.stock === 0 && <span className="badge badge-out ml-1.5">Habis</span>}
                  {p.stock > 0 && p.stock <= 5 && <span className="badge badge-low ml-1.5">Menipis</span>}
                </td>
                <td className="py-3 px-4">
                  {p.status === "active" ? <span className="badge badge-active">Aktif</span> : <span className="badge badge-draft">Draf</span>}
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <a href={`/admin/produk/${p.id}/edit`} className="text-xs underline text-plum mr-3">Edit</a>
                  <form action={deleteProduct} className="inline">
                    <input type="hidden" name="id" value={p.id} />
                    <ConfirmSubmitButton message={`Hapus "${p.name}"? Tindakan ini tidak bisa dibatalkan.`} className="text-xs underline text-red-700">
                      Hapus
                    </ConfirmSubmitButton>
                  </form>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={8} className="text-center text-ink/50 py-10">Tidak ada produk yang cocok.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination searchParams={searchParams} currentPage={page} totalPages={totalPages} />
    </div>
  );
}