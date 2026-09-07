"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/CartContext";
import { createOrder, getLiveCartInfo } from "@/app/checkout/actions";

const fmt = (n) => "Rp" + Math.round(Number(n) || 0).toLocaleString("id-ID");

function makeIdempotencyKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function CheckoutClient({ storeWhatsapp, freeShippingMin = 0 }) {
  const { items, subtotal, clearCart } = useCart();
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [liveInfo, setLiveInfo] = useState(null);
  const [idempotencyKey] = useState(makeIdempotencyKey);

  // State Data Kota RajaOngkir
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);

  // State Pilihan Pengiriman
  const [destinationId, setDestinationId] = useState("");
  const [courier, setCourier] = useState("jne");
  const [shippingCost, setShippingCost] = useState(0);

  // 1. Fetch data kota dari API Route (/api/cities) saat komponen dibuka
  useEffect(() => {
    async function fetchCities() {
      try {
        const res = await fetch("/api/cities");
        const data = await res.json();
        if (Array.isArray(data)) {
          setCities(data);
        }
      } catch (err) {
        console.error("Gagal memuat kota:", err);
      } finally {
        setLoadingCities(false);
      }
    }
    fetchCities();
  }, []);

  // 2. Re-check harga & stok produk
  useEffect(() => {
    if (items.length === 0) return;
    getLiveCartInfo(items.map((i) => i.id)).then((res) => setLiveInfo(res.products || []));
  }, []);

  // 3. Kalkulasi Ongkir Sederhana setelah Kota dipilih
  useEffect(() => {
    if (!destinationId) {
      setShippingCost(0);
      return;
    }
    // Tarif contoh, nilai ini akan dikirim ke Server Action.
    // Aturan gratis ongkir ikut dihitung di sini supaya angka di ringkasan
    // sama dengan yang nanti disimpan database — checkout_create_order()
    // juga menggratiskan ongkir kalau subtotal >= settings.free_shipping_min,
    // dan database-lah yang jadi penentu akhirnya.
    const gratisOngkir = freeShippingMin > 0 && subtotal >= freeShippingMin;
    setShippingCost(gratisOngkir ? 0 : 18000);
  }, [destinationId, courier, subtotal, freeShippingMin]);

  const totalWithShipping = subtotal + shippingCost;

  const priceChanges = (liveInfo || [])
    .map((live) => {
      const cartItem = items.find((i) => i.id === live.id);
      if (!cartItem) return null;
      if (!live.available) return { ...live, cartQty: cartItem.qty, issue: "unavailable" };
      if (live.stock < cartItem.qty) return { ...live, cartQty: cartItem.qty, issue: "stock" };
      if (Math.round(live.price) !== Math.round(cartItem.price)) return { ...live, cartQty: cartItem.qty, issue: "price" };
      return null;
    })
    .filter(Boolean);

  async function handleSubmit(e) {
    e.preventDefault();
    if (pending) return;

    if (!destinationId) {
      setError("Silakan pilih kota / wilayah pengiriman terlebih dahulu.");
      return;
    }

    setPending(true);
    setError("");

    // Hanya id + qty yang dikirim: harga tiap item dihitung ulang di
    // database dari products.price & discount_percent (lihat
    // checkout_create_order() di supabase/schema.sql), jadi harga tidak
    // bisa dipalsukan dari browser.
    const res = await createOrder({
      customer: form,
      items: items.map((i) => ({ id: i.id, qty: i.qty })),
      shippingCost: shippingCost,
      idempotencyKey,
      destinationId,
      courier,
    });

    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setResult(res);
    clearCart();
  }

  if (result) {
    const waText = encodeURIComponent(
      `Halo Almas Fashion, saya sudah checkout dengan nomor pesanan ${result.orderNumber} atas nama ${form.name}. Total: ${fmt(result.total)}. Mohon info langkah pembayarannya ya.`
    );
    const waHref = storeWhatsapp ? `https://wa.me/${storeWhatsapp}?text=${waText}` : `https://wa.me/?text=${waText}`;
    const trackingUrl = `/lacak?nomor=${encodeURIComponent(result.orderNumber)}&token=${encodeURIComponent(result.accessToken)}`;
    
    return (
      <main className="max-w-lg mx-auto px-5 py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-5 text-2xl">✓</div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-2">Pesanan Diterima</h1>
        <p className="text-sm text-ink/60 mb-6">
          Nomor pesanan kamu <strong className="text-ink">{result.orderNumber}</strong>. Simpan nomor ini untuk referensi.
        </p>
        <div className="bg-white border border-[var(--line)] rounded-sm p-5 text-left mb-6">
          {(result.items || []).map((i) => (
            <div key={i.product_id} className="flex justify-between text-sm py-1.5">
              <span>{i.product_name} × {i.qty}</span>
              <span>{fmt(i.price * i.qty)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm py-1.5 text-ink/60">
            <span>Ongkos kirim</span>
            <span>{result.shippingCost === 0 ? "Gratis" : fmt(result.shippingCost)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold pt-2.5 mt-2.5 border-t border-[var(--line)]">
            <span>Total</span>
            <span>{fmt(result.total)}</span>
          </div>
        </div>
        <p className="text-sm text-ink/60 mb-5">
          Pesanan ini belum terhubung ke pembayaran otomatis — konfirmasi dan info transfer akan kami kirim lewat WhatsApp.
        </p>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-[#25D366] text-white text-sm font-medium px-6 py-3 rounded-sm mb-3"
        >
          Konfirmasi via WhatsApp
        </a>
        <a href={trackingUrl} className="block text-sm underline text-plum mt-2">Lacak status pesanan ini</a>
        <a href="/" className="block text-sm underline text-ink/50 mt-2">Kembali belanja</a>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="max-w-lg mx-auto px-5 py-24 text-center">
        <h1 className="font-display text-2xl mb-3">Keranjang kosong</h1>
        <p className="text-sm text-ink/60 mb-5">Belum ada produk di keranjang kamu.</p>
        <a href="/" className="text-sm underline text-plum">Kembali belanja</a>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-5 sm:px-8 py-12">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-8">Checkout</h1>

      {priceChanges.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-sm px-4 py-3 mb-6">
          <p className="font-medium mb-1">Ada perubahan sejak produk masuk keranjang:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {priceChanges.map((c) => (
              <li key={c.id}>
                {c.issue === "unavailable" && `${c.name} sudah tidak tersedia.`}
                {c.issue === "stock" && `${c.name} — sisa stok ${c.stock}, keranjang kamu ${c.cartQty}.`}
                {c.issue === "price" && `${c.name} — harga sekarang ${fmt(c.price)}.`}
              </li>
            ))}
          </ul>
          <p className="mt-1.5">Kamu tetap bisa lanjut — total akhir akan memakai harga &amp; stok terbaru saat pesanan dibuat.</p>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-10">
        <form onSubmit={handleSubmit} className="bg-white border border-[var(--line)] rounded-sm p-6 space-y-4">
          {error && <p className="text-sm text-red-700 bg-red-50 rounded-sm px-3 py-2">{error}</p>}
          
          <div className="field">
            <label className="block text-xs font-semibold mb-1.5 text-ink/65">Nama lengkap</label>
            <input
              required
              maxLength={200}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-[var(--line)] rounded-sm px-3 py-2 text-sm"
            />
          </div>

          <div className="field">
            <label className="block text-xs font-semibold mb-1.5 text-ink/65">Nomor HP / WhatsApp</label>
            <input
              required
              maxLength={30}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="08xxxxxxxxxx"
              className="w-full border border-[var(--line)] rounded-sm px-3 py-2 text-sm"
            />
          </div>

          {/* Opsi Kota dari API RajaOngkir */}
          <div className="field">
            <label className="block text-xs font-semibold mb-1.5 text-ink/65">Kota / Wilayah Tujuan</label>
            <select
              required
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="w-full border border-[var(--line)] rounded-sm px-3 py-2 text-sm bg-white"
              disabled={loadingCities}
            >
              <option value="">
                {loadingCities ? "Memuat daftar kota..." : "-- Pilih Kota/Wilayah --"}
              </option>
              {cities.map((c) => (
                <option key={c.city_id} value={c.city_id}>
                  {c.type} {c.city_name} ({c.province})
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="block text-xs font-semibold mb-1.5 text-ink/65">Alamat lengkap pengiriman</label>
            <textarea
              required
              maxLength={500}
              rows={3}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Jalan, No. Rumah, RT/RW, Kecamatan"
              className="w-full border border-[var(--line)] rounded-sm px-3 py-2 text-sm"
            />
          </div>

          <div className="field">
            <label className="block text-xs font-semibold mb-1.5 text-ink/65">Catatan (opsional)</label>
            <textarea
              maxLength={500}
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full border border-[var(--line)] rounded-sm px-3 py-2 text-sm"
            />
          </div>

          <button type="submit" disabled={pending} className="w-full bg-plum text-white text-sm font-medium py-3 rounded-sm disabled:opacity-60">
            {pending ? "Memproses..." : "Buat Pesanan"}
          </button>
        </form>

        <div className="bg-white border border-[var(--line)] rounded-sm p-5 h-fit">
          <h2 className="font-display text-lg mb-4">Ringkasan</h2>
          {items.map((i) => (
            <div key={i.id} className="flex justify-between text-sm py-1.5">
              <span>{i.name} × {i.qty}</span>
              <span>{fmt(i.price * i.qty)}</span>
            </div>
          ))}

          <div className="flex justify-between text-sm py-1.5 text-ink/60 border-t border-[var(--line)] mt-3 pt-3">
            <span>Subtotal</span>
            <span>{fmt(subtotal)}</span>
          </div>

          <div className="flex justify-between text-sm py-1.5 text-ink/60">
            <span>Ongkos kirim</span>
            <span>
              {!destinationId ? "Pilih wilayah" : shippingCost === 0 ? "Gratis" : fmt(shippingCost)}
            </span>
          </div>

          <div className="flex justify-between text-sm font-semibold pt-3 mt-3 border-t border-[var(--line)]">
            <span>Total Bayar</span>
            <span>{fmt(totalWithShipping)}</span>
          </div>
        </div>
      </div>
    </main>
  );
}