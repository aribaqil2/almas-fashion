"use client";

import { useCart } from "./CartContext";

export default function AddToCartButton({ product, outOfStock }) {
  const { addItem } = useCart();
  return (
    <button
      type="button"
      disabled={outOfStock}
      onClick={() => addItem(product)}
      className={`absolute left-0 right-0 bottom-0 bg-ink text-cream text-xs font-medium py-3 tracking-wide ${
        outOfStock ? "opacity-60 cursor-not-allowed" : ""
      }`}
    >
      {outOfStock ? "Stok Habis" : "+ Tambah ke Keranjang"}
    </button>
  );
}
