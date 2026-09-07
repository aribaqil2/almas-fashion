"use client";

import AddToCartButton from "./AddToCartButton";

const fmt = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");

export default function ProductCard({ product }) {
  const finalPrice = product.price * (1 - (product.discount_percent || 0) / 100);
  const outOfStock = product.stock <= 0 || product.status !== "active";
  const badge = product.is_new
    ? { text: "Baru", cls: "bg-plum text-white" }
    : product.discount_percent > 0
    ? { text: "Diskon", cls: "bg-gold text-ink" }
    : null;

  return (
    <article className="group relative bg-paper rounded-2xl border border-slate-200/80 overflow-hidden flex flex-col justify-between h-full hover:shadow-md transition-all duration-300">
      
      {/* Tautan Pembungkus Seluruh Kartu */}
      <a href={`/produk/${product.id}`} className="absolute inset-0 z-0" aria-label={product.name} />

      {/* Bagian Atas: Gambar + Informasi Produk */}
      <div className="relative z-10 pointer-events-none">
        {/* Container Gambar Produk */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-cream">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
              No Image
            </div>
          )}

          {/* Badge Baru / Diskon */}
          {badge && (
            <span className={`absolute top-2.5 left-2.5 z-10 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${badge.cls}`}>
              {badge.text}
            </span>
          )}

          {/* Tombol Favorit Mini */}
          <button 
            type="button"
            aria-label="Tambah ke Favorit" 
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-auto absolute top-2.5 right-2.5 z-20 p-1.5 rounded-full bg-white/80 backdrop-blur-xs text-slate-600 hover:text-red-500 transition-colors shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Tombol Tambah Keranjang Melayang */}
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="pointer-events-auto absolute inset-x-2 bottom-2 z-20"
          >
            <AddToCartButton
              outOfStock={outOfStock}
              product={{
                id: product.id,
                name: product.name,
                price: finalPrice,
                pattern: product.pattern || "m1",
              }}
            />
          </div>
        </div>

        {/* Informasi Produk */}
        <div className="p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gold truncate">
            {product.motif} {product.color ? `- ${product.color}` : ""}
          </p>
          
          <h3 className="font-semibold text-xs sm:text-sm text-ink line-clamp-2 mt-1 min-h-[36px] sm:min-h-[40px] leading-snug">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
            <span className="text-amber-400">★</span>
            <span className="font-bold text-slate-700">{product.rating || "4.9"}</span>
            <span className="text-slate-400">({product.sold || product.reviews_count || 305})</span>
          </div>

          {/* Harga */}
          <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
            <span className="font-extrabold text-sm sm:text-base text-ink">{fmt(finalPrice)}</span>
            {product.discount_percent > 0 && (
              <span className="text-[11px] text-slate-400 line-through">{fmt(product.price)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Kartu */}
      <div className="relative z-10 p-3 pt-0 flex items-center justify-between border-t border-slate-100/60 mt-1 gap-2">
        {/* Tombol Detail hanya muncul di layar desktop (sm:) */}
        <a 
          href={`/produk/${product.id}`} 
          className="hidden sm:inline-block text-xs font-semibold text-ink bg-slate-100 hover:bg-gold hover:text-white px-3 py-1.5 rounded-lg transition-colors text-center flex-1"
        >
          Lihat Detail
        </a>
        
        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-1 rounded-md tracking-wider uppercase whitespace-nowrap">
          Gratis Ongkir
        </span>
      </div>

    </article>
  );
}