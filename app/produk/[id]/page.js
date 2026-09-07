import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductDetailClient from "@/components/ProductDetailClient";

export default async function ProductDetailPage({ params }) {
  const supabase = createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*, categories(id, name, slug)")
    .eq("id", params.id)
    .eq("status", "active")
    .single();

  if (!product) notFound();

  const { data: recommendations } = await supabase
    .from("products")
    .select("id, name, price, discount_percent, color, pattern, image_url, stock, stock_by_size, sizes")
    .eq("status", "active")
    .eq("category_id", product.category_id)
    .neq("id", product.id)
    .order("sold", { ascending: false })
    .limit(4);

  const variants = [product, ...(recommendations || [])]
    .filter((item, index, list) => list.findIndex((candidate) => candidate.color === item.color) === index)
    .slice(0, 4);

  return (
    <main className="catalog-page min-h-screen text-ink">
      <div className="catalog-shell detail-shell max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <a href={`/?kategori=${product.categories?.slug || "blouse"}`} className="back-button">&larr; Kembali ke Koleksi</a>
        <nav aria-label="Breadcrumb" className="breadcrumb text-[11px] font-semibold tracking-wider text-ink/70 uppercase">
          <a href="/">HOME</a> <span>&gt;</span> <a href={`/?kategori=${product.categories?.slug || "blouse"}`}>SHOP</a> <span>&gt;</span>
          <a href={`/?kategori=${product.categories?.slug || "blouse"}`}>{product.categories?.name || "BLOUSE"}</a> <span>&gt;</span>
          <strong>{product.color || product.name}</strong>
        </nav>
        <ProductDetailClient product={product} variants={variants} recommendations={recommendations || []} />
      </div>
    </main>
  );
}
