"use client";

import { useCart } from "./CartContext";

const fmt = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");

export default function CartDrawer() {
  const { items, removeItem, subtotal, isOpen, setIsOpen, toastMsg } = useCart();

  return (
    <>
      <div
        className={`overlay fixed inset-0 bg-ink/45 z-[60] ${isOpen ? "show" : ""}`}
        onClick={() => setIsOpen(false)}
      />
      <aside
        id="cart-drawer"
        className={`fixed top-0 right-0 bottom-0 w-[380px] max-w-[88vw] bg-paper z-[70] flex flex-col ${isOpen ? "show" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        aria-label="Keranjang belanja"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--line)]">
          <h2 className="font-display text-lg">Keranjang Belanja</h2>
          <button type="button" onClick={() => setIsOpen(false)} className="text-2xl leading-none" aria-label="Tutup keranjang">
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            <p className="text-center text-sm text-ink/50 py-16">Keranjang kamu masih kosong.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 py-4 border-b border-[var(--line)]">
                <div className={`w-16 h-20 flex-none rounded-sm ${item.pattern}`} />
                <div className="flex-1">
                  <h5 className="font-display text-sm">{item.name}</h5>
                  <p className="text-xs text-ink/50 mt-1">Qty {item.qty}</p>
                  <p className="text-sm font-semibold mt-1.5">{fmt(item.price * item.qty)}</p>
                  <button type="button" onClick={() => removeItem(item.id)} className="text-xs underline text-plum mt-1.5">
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="px-6 py-5 border-t border-[var(--line)]">
          <div className="flex justify-between text-sm mb-3.5">
            <span>Subtotal</span>
            <strong className="text-base">{fmt(subtotal)}</strong>
          </div>
          {items.length === 0 ? (
            <button type="button" disabled className="w-full bg-ink/30 text-cream text-sm font-medium py-3.5 cursor-not-allowed">
              Lanjut ke Pembayaran
            </button>
          ) : (
            <a href="/checkout" onClick={() => setIsOpen(false)} className="block w-full text-center bg-ink text-cream text-sm font-medium py-3.5">
              Lanjut ke Pembayaran
            </a>
          )}
        </div>
      </aside>

      <div className={`toast bg-ink text-cream text-sm px-5 py-3 rounded-sm ${toastMsg ? "show" : ""}`}>{toastMsg}</div>
    </>
  );
}
