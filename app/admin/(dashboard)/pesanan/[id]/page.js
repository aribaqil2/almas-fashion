import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateOrderStatus } from "../actions";
import StatusSelect from "@/components/StatusSelect";

const fmt = (n) => "Rp" + Math.round(Number(n) || 0).toLocaleString("id-ID");

export default async function OrderDetailPage({ params, searchParams }) {
  const supabase = createClient();
  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", params.id).single(),
    supabase
      .from("order_items")
      .select("*, products(name)")
      .eq("order_id", params.id),
  ]);

  if (!order) notFound();

  const shippingCost = Number(order.shipping_cost) || 0;
  const totalAmount = Number(order.total_amount) || 0;

  return (
    <div className="max-w-2xl">
      <a href="/admin/pesanan" className="text-xs underline text-plum">
        &larr; Kembali ke daftar pesanan
      </a>

      {searchParams?.error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-sm px-3 py-2 mt-3">
          {searchParams.error}
        </p>
      )}
      {searchParams?.success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-sm px-3 py-2 mt-3">
          {searchParams.success}
        </p>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">
          {order.order_number || `Order #${order.id.slice(0, 8)}`}
        </h1>

        {/* Penggunaan Custom Dropdown */}
        <StatusSelect
          orderId={order.id}
          currentStatus={order.status}
          updateOrderStatus={updateOrderStatus}
        />
      </div>

      <div className="bg-white border border-[var(--line)] rounded-sm p-5 mb-5">
        <h2 className="font-display text-lg mb-3">Data Pelanggan</h2>
        <dl className="text-sm space-y-1.5">
          <div className="flex gap-2">
            <dt className="text-ink/50 w-28 flex-none">Nama</dt>
            <dd>{order.customer_name}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-ink/50 w-28 flex-none">Telepon</dt>
            <dd>{order.customer_phone}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-ink/50 w-28 flex-none">Alamat</dt>
            <dd>{order.shipping_address}</dd>
          </div>
          {order.notes && (
            <div className="flex gap-2">
              <dt className="text-ink/50 w-28 flex-none">Catatan</dt>
              <dd>{order.notes}</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="text-ink/50 w-28 flex-none">Tanggal</dt>
            <dd>{new Date(order.created_at).toLocaleString("id-ID")}</dd>
          </div>
        </dl>
      </div>

      <div className="bg-white border border-[var(--line)] rounded-sm p-5">
        <h2 className="font-display text-lg mb-3">Item Pesanan</h2>
        {(items || []).map((i) => {
          const productName = i.product_name || i.products?.name || "Produk";
          const qty = i.quantity || i.qty || 1;
          const itemPrice = Number(i.price) || 0;

          return (
            <div
              key={i.id}
              className="flex justify-between text-sm py-1.5 border-b border-[var(--line)] last:border-0"
            >
              <span>
                {productName} × {qty}
              </span>
              <span>{fmt(itemPrice * qty)}</span>
            </div>
          );
        })}
        <div className="flex justify-between text-sm py-1.5 text-ink/60">
          <span>Ongkos kirim</span>
          <span>{shippingCost === 0 ? "Gratis" : fmt(shippingCost)}</span>
        </div>
        <div className="flex justify-between text-sm py-1.5 text-ink/60">
          <span>Status pembayaran</span>
          <span className="capitalize">{order.payment_status || "Pending"}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold pt-3 mt-3 border-t border-[var(--line)]">
          <span>Total</span>
          <span>{fmt(totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}