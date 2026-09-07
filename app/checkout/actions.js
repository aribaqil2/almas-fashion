"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Re-checks current price, discount, and stock for cart items when the
 * checkout page loads.
 */
export async function getLiveCartInfo(ids) {
  if (!ids || ids.length === 0) return { products: [] };
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, discount_percent, stock, status")
    .in("id", ids);
  if (error) return { products: [] };
  return {
    products: (data || []).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price * (1 - (p.discount_percent || 0) / 100),
      stock: p.stock,
      available: p.status === "active",
    })),
  };
}

/**
 * Menerjemahkan kode error dari checkout_create_order() (lihat
 * supabase/schema.sql) menjadi pesan yang bisa dibaca pembeli. Function
 * itu memakai `raise exception 'KODE'`, dan beberapa di antaranya
 * menempelkan nama produk setelah titik dua.
 */
function checkoutErrorMessage(raw) {
  const message = String(raw || "");
  const productName = message.split(":")[1]?.trim();

  if (message.includes("INSUFFICIENT_STOCK")) {
    return productName
      ? `Stok ${productName} sudah tidak mencukupi. Kurangi jumlahnya lalu coba lagi.`
      : "Stok salah satu produk sudah tidak mencukupi. Kurangi jumlahnya lalu coba lagi.";
  }
  if (message.includes("PRODUCT_INACTIVE")) {
    return productName
      ? `${productName} sudah tidak tersedia. Hapus dari keranjang lalu coba lagi.`
      : "Salah satu produk sudah tidak tersedia. Perbarui keranjang lalu coba lagi.";
  }
  if (message.includes("PRODUCT_NOT_FOUND")) {
    return "Salah satu produk di keranjang sudah tidak ada. Perbarui keranjang lalu coba lagi.";
  }
  if (message.includes("RATE_LIMITED")) {
    return "Nomor ini baru saja membuat pesanan. Tunggu sebentar sebelum mencoba lagi.";
  }
  if (message.includes("INVALID_NAME")) return "Nama lengkap tidak valid (maksimal 200 karakter).";
  if (message.includes("INVALID_PHONE")) return "Nomor WhatsApp tidak valid.";
  if (message.includes("INVALID_ADDRESS")) return "Alamat pengiriman tidak valid (maksimal 500 karakter).";
  if (message.includes("NOTES_TOO_LONG")) return "Catatan terlalu panjang (maksimal 500 karakter).";
  if (message.includes("CART_EMPTY") || message.includes("INVALID_ITEM_COUNT")) {
    return "Keranjang kosong atau berisi terlalu banyak jenis produk (maksimal 50).";
  }
  if (message.includes("INVALID_QTY") || message.includes("INVALID_ITEM_SHAPE")) {
    return "Ada item keranjang yang tidak valid. Muat ulang halaman lalu coba lagi.";
  }
  return "Gagal membuat pesanan. Coba lagi sebentar lagi.";
}

/**
 * Membuat pesanan lewat RPC checkout_create_order() di database.
 *
 * Kenapa lewat RPC dan bukan insert langsung ke tabel `orders`:
 *  - Harga tiap item dihitung ULANG di database dari products.price dan
 *    products.discount_percent, jadi client tidak bisa mengirim harga
 *    palsu. Itu sebabnya kita hanya mengirim { product_id, qty }.
 *  - Validasi stok, pengurangan stok, penambahan `sold`, insert order,
 *    dan insert order_items terjadi dalam SATU transaksi dengan baris
 *    produk terkunci (`for update`) — tidak ada order setengah jadi dan
 *    tidak ada dua pembeli yang lolos validasi stok yang sama.
 *  - Row Level Security memang menutup insert langsung ke `orders` /
 *    `order_items` dari anon key. Membukanya berarti membuka juga akses
 *    baca ke alamat & nomor HP seluruh pelanggan.
 *  - Ongkir tetap ditentukan pilihan kota/kurir pembeli, tapi database
 *    yang memutuskan gratis-atau-tidak berdasarkan settings.free_shipping_min.
 */
export async function createOrder({
  customer,
  items,
  shippingCost = 0,
  idempotencyKey = null,
  destinationId = null,
  courier = null,
}) {
  if (!items || items.length === 0) {
    return { error: "Keranjang kosong." };
  }

  // Validasi ringan di sini hanya supaya pesan errornya cepat & spesifik.
  // Pemeriksaan yang mengikat tetap ada di dalam checkout_create_order().
  if (!customer?.name?.trim()) return { error: "Nama lengkap wajib diisi." };
  if (!customer?.phone?.trim()) return { error: "Nomor WhatsApp wajib diisi." };
  if (!customer?.address?.trim()) return { error: "Alamat pengiriman wajib diisi." };

  const supabase = createClient();

  const { data, error } = await supabase.rpc("checkout_create_order", {
    p_customer_name: customer.name.trim(),
    p_customer_phone: customer.phone.trim(),
    p_customer_address: customer.address.trim(),
    p_notes: customer.notes?.trim() || null,
    p_items: items.map((i) => ({ product_id: i.id, qty: Number(i.qty) || 1 })),
    p_shipping_cost: Math.max(0, Number(shippingCost) || 0),
    p_idempotency_key: idempotencyKey,
    p_shipping_city_id: destinationId,
    p_shipping_courier: courier,
  });

  if (error) {
    console.error("checkout_create_order gagal:", error);
    return { error: checkoutErrorMessage(error.message) };
  }
  if (!data) {
    return { error: "Gagal membuat pesanan. Coba lagi sebentar lagi." };
  }

  // Angka yang dipakai untuk ditampilkan diambil dari hasil database,
  // bukan hitungan ulang di sini — supaya yang dilihat pembeli persis
  // sama dengan yang tersimpan (termasuk ongkir yang digratiskan).
  return {
    success: true,
    orderNumber: data.order_number,
    accessToken: data.access_token,
    subtotal: Number(data.subtotal) || 0,
    shippingCost: Number(data.shipping_cost) || 0,
    total: Number(data.total) || 0,
    items: Array.isArray(data.items) ? data.items : [],
  };
}
