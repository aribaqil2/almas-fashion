import { createClient } from "@/lib/supabase/server";
import { createParentCategory, createSubCategory, updateCategory, deleteCategory } from "./actions";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";

export default async function KategoriPage({ searchParams }) {
  const supabase = createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("name");
  const { data: products } = await supabase.from("products").select("category_id");

  const list = categories || [];
  const parentCategories = list.filter((c) => !c.parent_id);
  const countFor = (id) => (products || []).filter((p) => p.category_id === id).length;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold">Kelola Kategori & Sub-Kategori</h1>

      {searchParams?.error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-sm px-3 py-2">{searchParams.error}</p>
      )}
      {searchParams?.success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-sm px-3 py-2">{searchParams.success}</p>
      )}

      {/* BOX INPUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* FORM 1: INPUT KATEGORI UTAMA */}
        <form action={createParentCategory} className="bg-white border border-[var(--line)] rounded-sm p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div>
            <h2 className="font-medium text-sm text-ink mb-1">1. Tambah Kategori Utama</h2>
            <p className="text-xs text-ink/50 mb-3">Kategori tingkat atas (mis. Koleksi Batik Pria, Koleksi Wanita)</p>
            
            <input 
              name="name" 
              type="text" 
              placeholder="mis. Koleksi Batik Pria" 
              required 
              className="border border-[var(--line)] rounded-sm px-3 py-2 text-sm w-full" 
            />
          </div>

          <button type="submit" className="bg-plum text-white text-sm font-medium px-4 py-2 rounded-sm self-start hover:opacity-90 transition">
            Simpan Kategori Utama
          </button>
        </form>

        {/* FORM 2: INPUT SUB-KATEGORI */}
        <form action={createSubCategory} className="bg-white border border-[var(--line)] rounded-sm p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div>
            <h2 className="font-medium text-sm text-ink mb-1">2. Tambah Sub-Kategori</h2>
            <p className="text-xs text-ink/50 mb-3">Turunan yang masuk ke dalam kategori utama</p>

            <div className="space-y-2">
              <select name="parent_id" required className="border border-[var(--line)] rounded-sm px-3 py-2 text-sm bg-white w-full">
                <option value="">-- Pilih Kategori Utama --</option>
                {parentCategories.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name}
                  </option>
                ))}
              </select>

              <input 
                name="name" 
                type="text" 
                placeholder="mis. Kemeja Pria Lengan Panjang" 
                required 
                className="border border-[var(--line)] rounded-sm px-3 py-2 text-sm w-full" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={parentCategories.length === 0}
            className="bg-plum text-white text-sm font-medium px-4 py-2 rounded-sm self-start hover:opacity-90 transition disabled:opacity-50"
          >
            Simpan Sub-Kategori
          </button>
        </form>
      </div>

      {/* TABEL LIST & EDIT */}
      <div className="bg-white border border-[var(--line)] rounded-sm overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-[var(--line)] text-xs uppercase tracking-wide text-ink/50 font-semibold grid grid-cols-12 items-center">
          <span className="col-span-5 sm:col-span-4">Nama Struktur</span>
          <span className="col-span-3 sm:col-span-3">Slug</span>
          <span className="col-span-2 sm:col-span-2">Jumlah Produk</span>
          <span className="col-span-2 sm:col-span-3 text-right">Aksi</span>
        </div>

        <div className="divide-y divide-[var(--line)]">
          {parentCategories.map((parent) => {
            const subCategories = list.filter((sub) => sub.parent_id === parent.id);

            return (
              <div key={parent.id} className="bg-white">
                {/* BARIS KATEGORI UTAMA */}
                <div className="p-3 sm:p-4 grid grid-cols-12 items-center bg-gray-50/70 border-b border-gray-100">
                  <div className="col-span-5 sm:col-span-4 pr-2">
                    <input 
                      form={`update-${parent.id}`}
                      name="name" 
                      defaultValue={parent.name} 
                      className="border border-[var(--line)] rounded-sm px-2.5 py-1.5 text-sm font-semibold w-full bg-white" 
                    />
                  </div>

                  <span className="col-span-3 sm:col-span-3 text-xs text-ink/50">{parent.slug}</span>
                  <span className="col-span-2 sm:col-span-2 text-xs font-semibold">{countFor(parent.id)}</span>
                  
                  {/* AKSI: SIMPAN & HAPUS BERADA DI KOLOM PALING KANAN */}
                  <div className="col-span-2 sm:col-span-3 flex items-center justify-end gap-2">
                    <form id={`update-${parent.id}`} action={updateCategory} className="inline">
                      <input type="hidden" name="id" value={parent.id} />
                      <button type="submit" className="bg-plum text-white px-3 py-1.5 rounded-sm text-xs font-medium hover:opacity-90">
                        Simpan
                      </button>
                    </form>

                    <form action={deleteCategory} className="inline">
                      <input type="hidden" name="id" value={parent.id} />
                      <ConfirmSubmitButton 
                        message={`Hapus kategori utama "${parent.name}"?`} 
                        className="border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-sm text-xs font-medium"
                      >
                        Hapus
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>

                {/* BARIS SUB-KATEGORI */}
                {subCategories.map((sub) => (
                  <div key={sub.id} className="p-3 pl-6 sm:pl-10 grid grid-cols-12 items-center border-t border-gray-100 text-sm hover:bg-gray-50/30">
                    <div className="col-span-5 sm:col-span-4 flex items-center gap-2 pr-2">
                      <span className="text-ink/30 select-none">└</span>
                      <input 
                        form={`update-${sub.id}`}
                        name="name" 
                        defaultValue={sub.name} 
                        className="border border-[var(--line)] rounded-sm px-2 py-1 text-sm w-full bg-white" 
                      />

                      {/* Dropdown Induk */}
                      <select 
                        form={`update-${sub.id}`}
                        name="parent_id" 
                        defaultValue={sub.parent_id} 
                        className="border border-[var(--line)] rounded-sm px-1.5 py-1 text-xs bg-white hidden sm:block w-36"
                      >
                        {parentCategories.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <span className="col-span-3 sm:col-span-3 text-xs text-ink/50">{sub.slug}</span>
                    <span className="col-span-2 sm:col-span-2 text-xs">{countFor(sub.id)}</span>
                    
                    {/* AKSI: SIMPAN & HAPUS BERADA DI KOLOM PALING KANAN */}
                    <div className="col-span-2 sm:col-span-3 flex items-center justify-end gap-2">
                      <form id={`update-${sub.id}`} action={updateCategory} className="inline">
                        <input type="hidden" name="id" value={sub.id} />
                        <button type="submit" className="bg-plum text-white px-3 py-1 rounded-sm text-xs font-medium hover:opacity-90">
                          Simpan
                        </button>
                      </form>

                      <form action={deleteCategory} className="inline">
                        <input type="hidden" name="id" value={sub.id} />
                        <ConfirmSubmitButton 
                          message={`Hapus sub-kategori "${sub.name}"?`} 
                          className="border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1 rounded-sm text-xs font-medium"
                        >
                          Hapus
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {parentCategories.length === 0 && (
            <div className="p-8 text-center text-ink/50 text-sm">Belum ada kategori utama. Tambahkan di atas terlebih dahulu.</div>
          )}
        </div>
      </div>
    </div>
  );
}