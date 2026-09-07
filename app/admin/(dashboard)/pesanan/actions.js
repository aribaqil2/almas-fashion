"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUuid, requireEnum, ValidationError } from "@/lib/validate";

const VALID_STATUSES = ["pending", "diproses", "dikirim", "selesai", "dibatalkan"];

export async function updateOrderStatus(formData) {
  let id, status;
  try {
    id = requireUuid(formData.get("id"), "Pesanan");
    status = requireEnum(formData.get("status"), VALID_STATUSES, "Status");
  } catch (e) {
    if (e instanceof ValidationError) {
      redirect(`/admin/pesanan/${formData.get("id")}?error=${encodeURIComponent(e.message)}`);
    }
    throw e;
  }

  const supabase = createClient();
  // Runs through update_order_status() (see supabase/schema.sql) so stock
  // is automatically restored/re-deducted when an order is cancelled or
  // un-cancelled, in the same transaction as the status change.
  const { error } = await supabase.rpc("update_order_status", { p_order_id: id, p_status: status });

  revalidatePath("/admin/pesanan");
  revalidatePath(`/admin/pesanan/${id}`);
  revalidatePath("/admin/produk");
  revalidatePath("/");

  if (error) {
    const message =
      error.message?.includes("INSUFFICIENT_STOCK")
        ? "Tidak bisa mengaktifkan kembali pesanan ini — stok salah satu produk sudah tidak cukup."
        : "Gagal mengubah status pesanan (" + error.message + ").";
    redirect(`/admin/pesanan/${id}?error=${encodeURIComponent(message)}`);
  }
  redirect(`/admin/pesanan/${id}?success=${encodeURIComponent("Status pesanan diperbarui.")}`);
}
