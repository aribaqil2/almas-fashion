import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import FilterSidebar from "@/components/FilterSidebar";

const PER_PAGE = 10;

function toArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export default async function StorefrontPage({ searchParams }) {
  const supabase = createClient();

  const categorySlug = searchParams.kategori || "";
  const [{ data: categories }, { data: settings }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("settings").select("*").eq("id", 1).single(),
  ]);

  // FIX 1: Dapatkan kategori yang dicari TANPA fallback ke categories[0]
  const category = categorySlug ? (categories || []).find((c) => c.slug === categorySlug) : null;

  // FIX 2: Jika kategori utama dipilih, ambil seluruh ID sub-kategori di bawahnya
  let categoryIdsToFilter = [];
  if (category) {
    categoryIdsToFilter.push(category.id);
    const subCategories = (categories || []).filter((c) => c.parent_id === category.id);
    subCategories.forEach((sub) => categoryIdsToFilter.push(sub.id));
  }

  const sizes = toArray(searchParams.ukuran);
  const colors = toArray(searchParams.warna);
  const motifs = toArray(searchParams.motif);
  const maxPrice = Number(searchParams.harga || 400000);
  const q = searchParams.q || "";
  const sort = searchParams.sort || "trend";
  const page = Math.max(1, Number(searchParams.page || 1));

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("status", "active")
    .lte("price", maxPrice);

  // Filter menggunakan in() agar mencakup kategori utama DAN sub-kategorinya
  if (categoryIdsToFilter.length > 0) {
    query = query.in("category_id", categoryIdsToFilter);
  }

  if (colors.length) query = query.in("color", colors);
  if (motifs.length) query = query.in("motif", motifs);
  if (q) query = query.ilike("name", `%${q}%`);
  if (sizes.length) query = query.overlaps("sizes", sizes);

  switch (sort) {
    case "rating":
      query = query.order("rating", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "cheap":
      query = query.order("price", { ascending: true });
      break;
    case "expensive":
      query = query.order("price", { ascending: false });
      break;
    default:
      query = query.order("sold", { ascending: false });
  }

  const from = (page - 1) * PER_PAGE;
  const { data: products, count } = await query.range(from, from + PER_PAGE - 1);

  const totalPages = Math.max(1, Math.ceil((count || 0) / PER_PAGE));

  // Tentukan apakah user sedang memfilter/mencari produk atau di Homepage
  const isFiltering = categorySlug || q || colors.length || motifs.length || sizes.length;

  return (
    <main className="home-page min-h-screen text-ink bg-[#f8f6f0]">
      {/* TAMPILAN 1: BILA MEMILIH KATEGORI / FILTER (Sama seperti Layout Foto ke-2) */}
      {isFiltering ? (
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
          {/* Sidebar Filter Sisi Kiri */}
          <aside className="w-full md:w-64 shrink-0">
            <FilterSidebar searchParams={searchParams} categories={categories || []} />
          </aside>

          {/* Katalog Produk Sisi Kanan */}
          <main className="flex-1 min-w-0">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-center justify-between mb-6 shadow-xs">
              <h1 className="font-bold text-slate-800 text-sm sm:text-base uppercase tracking-wide">
                KOLEKSI {category ? category.name : "PRODUK"}
              </h1>
              <span className="text-xs text-slate-500 font-medium">
                {count || 0} Produk
              </span>
            </div>

            {products && products.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200/80">
                Belum ada produk yang cocok dengan pilihanmu.
              </div>
            )}

            <div className="mt-8">
              <Pagination searchParams={searchParams} currentPage={page} totalPages={totalPages} />
            </div>
          </main>
        </div>
      ) : (
        /* TAMPILAN 2: HOMEPAGE UTAMA (Sama seperti Layout Foto ke-1) */
        <>
          <section className="home-hero">
            <div className="home-hero-content">
              <span className="home-hero-badge">✦ Collection 2026</span>
              <h1>Elegan &amp; <span>Modest</span><br />Fashion</h1>
              <p>Temukan koleksi blouse, dress, dan outerwear terbaru dari Almas Fashion. Nyaman, stylish, dan berkualitas premium.</p>
              <a href="#produk-terbaru" className="home-hero-button">Belanja Sekarang <span aria-hidden="true">→</span></a>
            </div>
            <div className="home-hero-art flex items-center justify-center">
              <img
                src="/logo.jpeg"
                alt="Almas Fashion & Boutique Logo"
                className="w-full max-w-md h-auto object-contain rounded-2xl"
              />
            </div>
          </section>

          <section id="produk-terbaru" className="home-section">
            <div className="home-section-header">
              <h2>✨ <span>Produk</span> Terbaru</h2>
              <a href="?sort=newest">Lihat Semua →</a>
            </div>
            {products && products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {products.slice(0, 8).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <p className="home-empty">Belum ada produk.</p>
            )}
          </section>

          <section className="home-section home-section-tight">
            <div className="home-promo">
              <div>
                <h3>🎉 <span>Gratis Ongkir</span> se-Jawa</h3>
                <p>Untuk belanja minimum Rp{Number(settings?.free_shipping_min || 300000).toLocaleString("id-ID")}. Periode terbatas!</p>
              </div>
              <a href="#produk-terbaru">Belanja Sekarang →</a>
            </div>
          </section>

          <Pagination searchParams={searchParams} currentPage={page} totalPages={totalPages} />
        </>
      )}
    </main>
  );
}