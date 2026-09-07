"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { lookupOrder } from "./actions";

const fmt = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");
const STATUS_LABEL = {
  pending: "Menunggu Konfirmasi",
  diproses: "Diproses",
  dikirim: "Dikirim",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

export default function LacakPage() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get("nomor") || "");
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  async function runLookup(num, tok) {
    setPending(true);
    setError("");
    const res = await lookupOrder(num, tok);
    setPending(false);
    if (res.error) {
      setError(res.error);
      setOrder(null);
      return;
    }
    setOrder(res.order);
  }

  useEffect(() => {
    const num = searchParams.get("nomor");
    const tok = searchParams.get("token");
    if (num && tok) runLookup(num, tok);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(e) {
    e.preventDefault();
    runLookup(orderNumber, token);
  }

  return (
    <main className="max-w-lg mx-auto px-5 py-16">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-2">Lacak Pesanan</h1>
      <p className="text-sm text-ink/60 mb-6">
        Masukkan nomor pesanan dan token yang kamu terima di halaman konfirmasi checkout.
      </p>

      <form onSubmit={handleSubmit} className="bg-white border border-[var(--line)] rounded-sm p-5 space-y-4 mb-8">
        {error && <p className="text-sm text-red-700 bg-red-50 rounded-sm px-3 py-2">{error}</p>}
        <div className="field">
          <label className="block text-xs font-semibold mb-1.5 text-ink/65">Nomor pesanan</label>
          <input
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="ALM-260903-1234"
            className="w-full border border-[var(--line)] rounded-sm px-3 py-2 text-sm"
          />
        </div>
        <div className="field">
          <label className="block text-xs font-semibold mb-1.5 text-ink/65">Token</label>
          <input
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full border border-[var(--line)] rounded-sm px-3 py-2 text-sm"
          />
        </div>
        <button type="submit" disabled={pending} className="w-full bg-plum text-white text-sm font-medium py-2.5 rounded-sm disabled:opacity-60">
          {pending ? "Mencari..." : "Lacak Pesanan"}
        </button>
      </form>

      {order && (
        <div className="bg-white border border-[var(--line)] rounded-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg">{order.order_number}</h2>
            <span className="text-xs font-semibold bg-cream px-2.5 py-1 rounded-full">{STATUS_LABEL[order.status] || order.status}</span>
          </div>
          {order.items.map((i, idx) => (
            <div key={idx} className="flex justify-between text-sm py-1.5 border-b border-[var(--line)] last:border-0">
              <span>{i.product_name} × {i.qty}</span>
              <span>{fmt(i.price * i.qty)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm py-1.5 text-ink/60">
            <span>Ongkos kirim</span>
            <span>{order.shipping_cost === 0 ? "Gratis" : fmt(order.shipping_cost)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold pt-2.5 mt-2.5 border-t border-[var(--line)]">
            <span>Total</span>
            <span>{fmt(order.total)}</span>
          </div>
        </div>
      )}
    </main>
  );
}
