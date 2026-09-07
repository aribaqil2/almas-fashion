import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";

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
  const category = (categories || []).find((c) => c.slug === categorySlug) || categories?.[0];

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

  if (categorySlug && category) query = query.eq("category_id", category.id);
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

  let bestQuery = supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .lte("price", maxPrice)
    .order("sold", { ascending: false })
    .limit(4);
  if (categorySlug && category) bestQuery = bestQuery.eq("category_id", category.id);
  if (q) bestQuery = bestQuery.ilike("name", `%${q}%`);
  const { data: bestProducts } = await bestQuery;

  const totalPages = Math.max(1, Math.ceil((count || 0) / PER_PAGE));

  const newestProducts = (products || []).slice(0, 8);
  const activeProducts = newestProducts.length ? newestProducts : (bestProducts || []).slice(0, 8);

  return (
    <main className="home-page min-h-screen text-ink">
      <section className="home-hero">
        <div className="home-hero-content">
          <span className="home-hero-badge">✦ Collection 2026</span>
          <h1>Elegan &amp; <span>Modest</span><br />Fashion</h1>
          <p>Temukan koleksi blouse, dress, dan outerwear terbaru dari Almas Fashion. Nyaman, stylish, dan berkualitas premium.</p>
          <a href="#produk-terbaru" className="home-hero-button">Belanja Sekarang <span aria-hidden="true">→</span></a>
        </div>
        <div className="home-hero-art" aria-hidden="true">👗</div>
      </section>



      <section id="produk-terbaru" className="home-section">
        <div className="home-section-header">
          <h2>✨ <span>Produk</span> Terbaru</h2>
          <a href={categorySlug ? `/?kategori=${categorySlug}&sort=newest` : "?sort=newest"}>Lihat Semua →</a>
        </div>
        {activeProducts.length > 0 ? (
          <div className="home-product-grid">
            {activeProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <p className="home-empty">Belum ada produk yang cocok dengan pilihanmu.</p>
        )}
      </section>

      <section className="home-section home-section-tight">
        <div className="home-promo">
          <div><h3>🎉 <span>Gratis Ongkir</span> se-Jawa</h3><p>Untuk belanja minimum Rp{Number(settings?.free_shipping_min || 300000).toLocaleString("id-ID")}. Periode terbatas!</p></div>
          <a href="#produk-terbaru">Belanja Sekarang →</a>
        </div>
      </section>

      <section className="home-section home-section-tight">
        <div className="home-section-header">
          <h2>🔥 <span>Produk</span> Laris</h2>
          <a href={categorySlug ? `/?kategori=${categorySlug}&sort=trend` : "?sort=trend"}>Lihat Semua →</a>
        </div>
        <div className="home-product-grid">
          {(bestProducts || []).slice(0, 4).map((p) => <ProductCard key={`best-${p.id}`} product={p} />)}
        </div>
      </section>

      <Pagination searchParams={searchParams} currentPage={page} totalPages={totalPages} />
    </main>
  );
}