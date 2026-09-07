"use client";

import { useCart } from "./CartContext";

export default function CartButton() {
  const { totalQty, setIsOpen } = useCart();
  return (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      className="relative flex flex-col items-center gap-0.5 text-[10px]"
      aria-haspopup="dialog"
      aria-label="Buka keranjang belanja"
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6" />
        <circle cx="9" cy="21" r="1" />
        <circle cx="18" cy="21" r="1" />
      </svg>
      <span className="hidden sm:inline">Keranjang</span>
      <span className="absolute -top-1.5 -right-2 bg-plum text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-semibold">
        {totalQty}
      </span>
    </button>
  );
}
