import { createClient } from "@/lib/supabase/server";
import { createCategory, renameCategory, deleteCategory } from "./actions";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";

export default async function KategoriPage({ searchParams }) {
  const supabase = createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("name");
  const { data: products } = await supabase.from("products").select("category_id");

  const list = categories || [];
  const countFor = (id) => (products || []).filter((p) => p.category_id === id).length;

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-6">Kategori</h1>

      {searchParams.error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-sm px-3 py-2 mb-5">{searchParams.error}</p>
      )}
      {searchParams.success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-sm px-3 py-2 mb-5">{searchParams.success}</p>
      )}

      {/* Form Tambah Kategori Baru */}
      <form action={createCategory} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 mb-6 bg-white border border-[var(--line)] rounded-sm p-4 sm:p-5">
        <div className="field flex-1">
          <label>Nama kategori baru</label>
          <input name="name" type="text" placeholder="mis. Loungewear" required />
        </div>
        <button type="submit" className="bg-plum text-white text-sm font-medium px-4 py-2.5 rounded-sm self-end w-full sm:w-auto">+ Tambah Kategori</button>
      </form>

      {/* 1. TAMPILAN MOBILE: KARTU */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {list.map((c) => (
          <div key={c.id} className="bg-white border border-[var(--line)] rounded-sm p-4 flex flex-col gap-3">
            <form action={renameCategory} className="flex items-center gap-2">
              <input type="hidden" name="id" value={c.id} />
              <input name="name" defaultValue={c.name} className="border border-[var(--line)] rounded-sm px-3 py-1.5 text-sm flex-1" />
              <button type="submit" className="text-xs bg-plum text-white px-3 py-1.5 rounded-sm">Simpan</button>
            </form>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--line)] text-xs text-ink/50">
              <span>Slug: <strong className="text-ink">{c.slug}</strong></span>
              <span>Produk: <strong className="text-ink">{countFor(c.id)}</strong></span>
            </div>

            <div className="text-right pt-1">
              <form action={deleteCategory}>
                <input type="hidden" name="id" value={c.id} />
                <ConfirmSubmitButton message={`Hapus kategori "${c.name}"?`} className="text-xs underline text-red-700 font-medium">
                  Hapus Kategori
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>
        ))}
      </div>

      {/* 2. TAMPILAN DESKTOP: TABEL */}
      <div className="hidden md:block bg-white border border-[var(--line)] rounded-sm overflow-x-auto">
        <table className="admin-table w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink/50">
              <th className="py-3 px-4">Nama</th>
              <th className="py-3 px-4">Slug</th>
              <th className="py-3 px-4">Jumlah Produk</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id}>
                <td className="py-2.5 px-4">
                  <form action={renameCategory} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={c.id} />
                    <input name="name" defaultValue={c.name} className="border border-[var(--line)] rounded-sm px-2.5 py-1.5 text-sm w-40" />
                    <button type="submit" className="text-xs underline text-plum">Simpan</button>
                  </form>
                </td>
                <td className="py-2.5 px-4 text-ink/50">{c.slug}</td>
                <td className="py-2.5 px-4">{countFor(c.id)}</td>
                <td className="py-2.5 px-4 text-right">
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={c.id} />
                    <ConfirmSubmitButton message={`Hapus kategori "${c.name}"?`} className="text-xs underline text-red-700">
                      Hapus
                    </ConfirmSubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}