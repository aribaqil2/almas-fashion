function toArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export default function FilterSidebar({ searchParams, categories, currentCategory }) {
  const sizes = toArray(searchParams.ukuran);
  const colors = toArray(searchParams.warna);
  const motifs = toArray(searchParams.motif);
  const maxPrice = searchParams.harga || "400000";
  const q = searchParams.q || "";
  const sort = searchParams.sort || "trend";

  const sizeOptions = ["S", "M", "L", "XL", "XXL"];
  const colorOptions = ["Plum", "Cokelat", "Merah Bata", "Emas", "Krem"];
  const motifOptions = ["Parang", "Kawung", "Ceplok", "Mega Mendung"];

  return (
    <form method="get" className="filter-sidebar hidden lg:block">
      <input type="hidden" name="kategori" value={currentCategory} />

      <div className="py-5 border-b border-[var(--line)]">
        <h2 className="text-xs uppercase tracking-wide font-semibold mb-3.5">Cari</h2>
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Cari produk..."
          className="w-full border border-[var(--line)] rounded-full px-3 py-2 text-sm"
        />
      </div>

      <div className="py-5 border-b border-[var(--line)]">
        <h2 className="text-xs uppercase tracking-wide font-semibold mb-3.5">Harga maksimum</h2>
        <div className="grid gap-1 text-sm text-ink/75">
          {[250000, 300000, 400000].map((price) => (
            <label key={price} className="flex items-center gap-2 py-1">
              <input type="radio" name="harga" value={price} defaultChecked={String(price) === String(maxPrice)} className="accent-gold" />
              Rp{price === 400000 ? "400rb (semua)" : `${price / 1000}rb`}
            </label>
          ))}
        </div>
      </div>

      <div className="py-5 border-b border-[var(--line)]">
        <h2 className="text-xs uppercase tracking-wide font-semibold mb-3.5">Ukuran</h2>
        <div className="flex flex-wrap gap-2">
          {sizeOptions.map((s) => (
            <label key={s} className="text-xs border border-[var(--line)] rounded-sm px-3 py-1.5 cursor-pointer has-[:checked]:bg-plum has-[:checked]:text-white has-[:checked]:border-plum">
              <input type="checkbox" name="ukuran" value={s} defaultChecked={sizes.includes(s)} className="sr-only" />
              {s}
            </label>
          ))}
        </div>
      </div>

      <div className="py-5 border-b border-[var(--line)]">
        <h2 className="text-xs uppercase tracking-wide font-semibold mb-3.5">Warna</h2>
        {colorOptions.map((c) => (
          <label key={c} className="flex items-center gap-2.5 text-sm py-1 cursor-pointer">
            <input type="checkbox" name="warna" value={c} defaultChecked={colors.includes(c)} className="accent-plum" /> {c}
          </label>
        ))}
      </div>

      <div className="py-5 border-b border-[var(--line)]">
        <h2 className="text-xs uppercase tracking-wide font-semibold mb-3.5">Motif</h2>
        {motifOptions.map((m) => (
          <label key={m} className="flex items-center gap-2.5 text-sm py-1 cursor-pointer">
            <input type="checkbox" name="motif" value={m} defaultChecked={motifs.includes(m)} className="accent-plum" /> {m}
          </label>
        ))}
      </div>

      <div className="py-5 border-b border-[var(--line)]">
        <h2 className="text-xs uppercase tracking-wide font-semibold mb-3.5">Urutkan</h2>
        <select name="sort" defaultValue={sort} className="w-full border border-[var(--line)] rounded-sm px-3 py-2 text-sm bg-white">
          <option value="trend">Sedang tren</option>
          <option value="rating">Rating tertinggi</option>
          <option value="newest">Terbaru</option>
          <option value="cheap">Harga terendah</option>
          <option value="expensive">Harga tertinggi</option>
        </select>
      </div>

      <button type="submit" className="filter-submit w-full text-sm font-medium py-2.5 rounded-full mt-4">
        Terapkan Filter
      </button>
      <a href={`?kategori=${currentCategory}`} className="block text-center text-xs underline text-plum mt-3">
        Hapus semua filter
      </a>
    </form>
  );
}
