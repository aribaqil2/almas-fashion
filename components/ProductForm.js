"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createClient } from "@/lib/supabase/client";

const SIZE_OPTIONS = ["S", "M", "L", "XL", "XXL"];
const PATTERN_OPTIONS = ["m1", "m2", "m3", "m4", "m5", "m6"];

function SubmitButton({ uploading }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || uploading}
      className="bg-plum text-white text-sm font-medium px-5 py-2.5 rounded-sm disabled:opacity-60"
    >
      {pending ? "Menyimpan..." : "Simpan Produk"}
    </button>
  );
}

export default function ProductForm({ action, categories = [], product }) {
  const [state, formAction] = useFormState(action, {});
  const [selectedSizes, setSelectedSizes] = useState(product?.sizes || ["S", "M", "L"]);
  const initialStockBySize = product?.stock_by_size && Object.keys(product.stock_by_size).length
    ? product.stock_by_size
    : product?.stock
    ? { [product.sizes?.[0] || "S"]: product.stock }
    : {};
  const [stockBySize, setStockBySize] = useState(initialStockBySize);
  const [imageUrl, setImageUrl] = useState(product?.image_url || "");
  const [uploading, setUploading] = useState(false);

  // --- LOGIKA KATEGORI BERTINGKAT ---
  const mainCategories = categories.filter((c) => !c.parent_id);
  
  // Tentukan parent & sub awal saat halaman/produk dimuat
  const currentCategory = categories.find((c) => c.id === product?.category_id);
  const initialParentId = currentCategory?.parent_id || (currentCategory ? currentCategory.id : "");
  const initialSubId = currentCategory?.parent_id ? currentCategory.id : "";

  const [selectedParentId, setSelectedParentId] = useState(initialParentId);
  const [selectedSubId, setSelectedSubId] = useState(initialSubId);

  // Daftar sub-kategori berdasarkan parent yang dipilih
  const subCategoryOptions = categories.filter((c) => c.parent_id === selectedParentId);

  // ID Kategori final yang dikirim ke backend
  const finalCategoryId = selectedSubId || selectedParentId;

  function toggleSize(s) {
    setSelectedSizes((prev) => {
      if (prev.includes(s)) return prev.filter((x) => x !== s);
      setStockBySize((stocks) => ({ ...stocks, [s]: stocks[s] || 0 }));
      return [...prev, s];
    });
  }

  function updateStock(size, value) {
    setStockBySize((prev) => ({ ...prev, [size]: value }));
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("products").getPublicUrl(fileName);
      setImageUrl(data.publicUrl);
    } catch (err) {
      alert("Gagal mengunggah foto: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="bg-white border border-[var(--line)] rounded-sm p-6 max-w-2xl">
      {state?.error && <p className="text-sm text-red-700 bg-red-50 rounded-sm px-3 py-2 mb-4">{state.error}</p>}

      {/* Input hidden untuk membawa URL gambar, stok per ukuran, dan ID kategori terpilih */}
      <input type="hidden" name="image_url" value={imageUrl} />
      <input type="hidden" name="stock_by_size" value={JSON.stringify(stockBySize)} />
      <input type="hidden" name="category_id" value={finalCategoryId} />

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Input Gambar Produk */}
        <div className="field sm:col-span-2">
          <label>Foto Produk</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:bg-paper file:text-ink hover:file:opacity-80 cursor-pointer"
          />
          {uploading && <p className="text-xs text-slate-500 mt-1">Mengunggah gambar...</p>}
          
          {imageUrl && (
            <div className="mt-3 relative aspect-[3/4] w-24 overflow-hidden rounded-sm border border-[var(--line)]">
              <img src={imageUrl} alt="Preview Foto Produk" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="field sm:col-span-2">
          <label>Nama produk</label>
          <input name="name" type="text" defaultValue={product?.name} required />
        </div>
        <div className="field sm:col-span-2">
          <label>Deskripsi produk</label>
          <textarea name="description" rows="5" defaultValue={product?.description || ""} placeholder="Jelaskan bahan, model, ukuran, dan cara perawatan produk." />
        </div>

        {/* DROPDOWN KATEGORI BERTINGKAT */}
        <div className="field">
          <label>Kategori Utama</label>
          <select
            value={selectedParentId}
            onChange={(e) => {
              setSelectedParentId(e.target.value);
              setSelectedSubId(""); // Reset sub-kategori ketika parent berganti
            }}
            required
          >
            <option value="">-- Pilih Kategori Utama --</option>
            {mainCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Sub-Kategori</label>
          <select
            value={selectedSubId}
            onChange={(e) => setSelectedSubId(e.target.value)}
            disabled={subCategoryOptions.length === 0}
          >
            <option value="">
              {subCategoryOptions.length > 0 ? "-- Pilih Sub-Kategori --" : "Tidak ada sub-kategori"}
            </option>
            {subCategoryOptions.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Status</label>
          <select name="status" defaultValue={product?.status || "active"}>
            <option value="active">Aktif</option>
            <option value="draft">Draf (tidak tampil)</option>
          </select>
        </div>
        <div className="field">
          <label>Harga normal (Rp)</label>
          <input name="price" type="number" min="0" step="1000" defaultValue={product?.price} required />
        </div>
        <div className="field">
          <label>Diskon (%)</label>
          <input name="discount_percent" type="number" min="0" max="90" step="1" defaultValue={product?.discount_percent || 0} />
        </div>
        <div className="field">
          <label>Motif</label>
          <input name="motif" type="text" placeholder="mis. Parang" defaultValue={product?.motif} required />
        </div>
        <div className="field">
          <label>Warna</label>
          <input name="color" type="text" placeholder="mis. Plum" defaultValue={product?.color} required />
        </div>
        <div className="field">
          <label>Pola tampilan (Fallback)</label>
          <select name="pattern" defaultValue={product?.pattern || "m1"}>
            {PATTERN_OPTIONS.map((p, i) => (
              <option key={p} value={p}>Pola {i + 1}</option>
            ))}
          </select>
        </div>
        <div className="field sm:col-span-2">
          <label>Ukuran tersedia</label>
          <div className="flex flex-wrap gap-2">
            {SIZE_OPTIONS.map((s) => (
              <label key={s} className={`text-xs border rounded-sm px-3 py-1.5 cursor-pointer ${selectedSizes.includes(s) ? "bg-plum text-white border-plum" : "border-[var(--line)] bg-white"}`}>
                <input type="checkbox" name="sizes" value={s} checked={selectedSizes.includes(s)} onChange={() => toggleSize(s)} className="sr-only" />
                {s}
              </label>
            ))}
          </div>
        </div>
        <div className="field sm:col-span-2">
          <label>Stok per ukuran</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {SIZE_OPTIONS.filter((size) => selectedSizes.includes(size)).map((size) => (
              <div key={size}>
                <label className="text-xs text-ink/60">Ukuran {size}</label>
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  step="1"
                  value={stockBySize[size] ?? 0}
                  onChange={(event) => updateStock(size, event.target.value)}
                  required
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-ink/50 mt-2">Total stok dihitung otomatis dari stok setiap ukuran.</p>
        </div>
        <label className="flex items-center gap-2.5 text-sm sm:col-span-2">
          <input type="checkbox" name="is_new" defaultChecked={product?.is_new} className="accent-plum" /> Tandai sebagai produk baru
        </label>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <a href="/admin/produk" className="border border-[var(--line)] text-sm font-medium px-4 py-2.5 rounded-sm">Batal</a>
        <SubmitButton uploading={uploading} />
      </div>
    </form>
  );
}