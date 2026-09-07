"use client";

import { useState } from "react";
import { useCart } from "./CartContext";

const fmt = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");
const colors = {
  emas: "linear-gradient(145deg, #e8c97a, #d4a373, #c4955e)",
  plum: "linear-gradient(145deg, #7a4a5e, #5e3a4a, #4a2a3a)",
  "merah bata": "linear-gradient(145deg, #c95a4a, #a84332, #8a3328)",
  cokelat: "linear-gradient(145deg, #9a7a5e, #7a5a3e, #5a3e2a)",
};
const colorKey = (value) => String(value || "").toLowerCase();

function stockFor(product, size) {
  const bySize = product.stock_by_size || {};
  return bySize[size] ?? (bySize[size] === 0 ? 0 : product.stock);
}

export default function ProductDetailClient({ product, variants, recommendations }) {
  const { addItem, setIsOpen } = useCart();
  const [selectedProduct, setSelectedProduct] = useState(product);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "S");
  const [wishlist, setWishlist] = useState(false);

  const finalPrice = selectedProduct.price * (1 - (selectedProduct.discount_percent || 0) / 100);
  const selectedStock = stockFor(selectedProduct, selectedSize);
  const outOfStock = selectedStock <= 0 || selectedProduct.status !== "active";
  const selectedColor = colorKey(selectedProduct.color);
  const fallbackBackground = colors[selectedColor] || "linear-gradient(145deg, #e8c97a, #d4a373, #c4955e)";

  function chooseVariant(variant) {
    setSelectedProduct(variant);
    setSelectedSize(variant.sizes?.[0] || "S");
  }

  function addToCart(openCart = false) {
    if (outOfStock) return;
    addItem({
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: finalPrice,
      pattern: selectedProduct.pattern || "m1",
      size: selectedSize,
      color: selectedProduct.color,
    });
    if (openCart) setIsOpen(true);
  }

  return (
    <>
      <div className="detail-layout">
        <div className="gallery">
          <div className="gallery-main" style={{ background: fallbackBackground }}>
            {selectedProduct.image_url ? (
              <img src={selectedProduct.image_url} alt={selectedProduct.name} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className={`pattern absolute inset-0 ${selectedProduct.pattern || "m1"}`} />
            )}
            {!selectedProduct.image_url && <span className="baju-icon">👗</span>}
            <span className="img-label">{selectedProduct.motif} - {selectedProduct.color}</span>
          </div>
          <div className="gallery-thumbs">
            {variants.map((variant) => (
              <button
                type="button"
                key={variant.id}
                onClick={() => chooseVariant(variant)}
                className={`thumb ${selectedProduct.id === variant.id ? "active" : ""}`}
                style={{ background: colors[colorKey(variant.color)] || "linear-gradient(145deg, #e8c97a, #d4a373)" }}
                aria-label={`Pilih warna ${variant.color || variant.name}`}
              >
                {variant.image_url ? <img src={variant.image_url} alt="" className="h-full w-full object-cover" /> : "👗"}
              </button>
            ))}
          </div>
        </div>

        <div className="product-detail">
          <div className="detail-tag">✦ {selectedProduct.motif} - {selectedProduct.color}</div>
          <h1 className="detail-title">{selectedProduct.name}</h1>
          <div className="detail-rating">
            <span className="stars">★★★★★</span>
            {selectedProduct.rating}
            <span className="review-count">({selectedProduct.sold} ulasan)</span>
          </div>
          <div className="detail-price">
            <span className="current">{fmt(finalPrice)}</span>
            {selectedProduct.discount_percent > 0 && <span className="original">{fmt(selectedProduct.price)}</span>}
            {selectedProduct.discount_percent > 0 && <span className="discount-badge">Diskon {selectedProduct.discount_percent}%</span>}
          </div>

          <div className="size-section">
            <label>📏 UKURAN</label>
            <div className="size-options">
              {(selectedProduct.sizes?.length ? selectedProduct.sizes : ["S", "M", "L"]).map((size) => (
                <button type="button" key={size} onClick={() => setSelectedSize(size)} disabled={stockFor(selectedProduct, size) <= 0} className={`size-opt ${selectedSize === size ? "active" : ""} ${stockFor(selectedProduct, size) <= 0 ? "opacity-40 cursor-not-allowed" : ""}`}>
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="color-section">
            <label>🎨 WARNA</label>
            <div className="color-options">
              {variants.map((variant) => (
                <button type="button" key={variant.id} onClick={() => chooseVariant(variant)} className={`color-opt ${selectedProduct.id === variant.id ? "active" : ""}`}>
                  <span className="dot" style={{ background: colors[colorKey(variant.color)] || "#d4a373" }} /> {variant.color || "Pilihan"}
                </button>
              ))}
            </div>
          </div>

          <div className="info-stock">
            <span>📦 Stok: <strong className={outOfStock ? "text-red-700" : "in-stock"}>{outOfStock ? "Habis" : `${selectedStock} tersedia`}</strong></span>
            <span>🚚 Estimasi tiba: <strong>2-3 hari</strong></span>
            <span>🏷️ SKU: <strong>{selectedProduct.id.slice(0, 8).toUpperCase()}</strong></span>
          </div>

          <div className="action-buttons">
            <button type="button" onClick={() => addToCart(true)} disabled={outOfStock} className="btn-buy disabled:opacity-50">🛒 Beli Sekarang</button>
            <button type="button" onClick={() => addToCart()} disabled={outOfStock} className="btn-cart disabled:opacity-50">+ Tambah ke Keranjang</button>
            <button type="button" onClick={() => setWishlist((value) => !value)} className={`btn-wishlist ${wishlist ? "text-red-600" : ""}`} aria-label="Tambah ke wishlist">{wishlist ? "♥" : "♡"}</button>
          </div>
          <div className="promo-banner">🎉 <span>GRATIS ONGKIR SE-JAWA</span> UNTUK BELANJA MIN. Rp300.000</div>
        </div>
      </div>

      <section className="description-section">
        <h2>📖 Deskripsi Produk</h2>
        <p>{selectedProduct.description || `${selectedProduct.name} dengan motif ${selectedProduct.motif || "batik"} yang elegan, nyaman dipakai untuk acara santai hingga semi-formal.`}</p>
        <ul>
          <li><strong>Bahan:</strong> Katun Premium (100% Cotton)</li>
          <li><strong>Model:</strong> {selectedProduct.motif || "Batik Nusantara"}</li>
          <li><strong>Perawatan:</strong> Cuci tangan, jangan gunakan pemutih</li>
        </ul>
      </section>

      <section className="rekom-section">
        <h2>✨ Produk Serupa</h2>
        <div className="rekom-grid">
          {recommendations.map((item) => {
            const price = item.price * (1 - (item.discount_percent || 0) / 100);
            return (
              <a href={`/produk/${item.id}`} key={item.id} className="rekom-item">
                <div className={`rekom-img ${item.pattern || "m1"}`}>
                  {item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover rounded-xl" /> : "👗"}
                </div>
                <div className="rekom-name">{item.name}</div>
                <div className="rekom-price">{fmt(price)}</div>
              </a>
            );
          })}
        </div>
      </section>
    </>
  );
}
