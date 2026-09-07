"use server";

import { createClient } from "@/lib/supabase/server";

export async function lookupOrder(orderNumber, accessToken) {
  if (!orderNumber || !accessToken) return { error: "Nomor pesanan dan token wajib diisi." };

  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_order_status", {
    p_order_number: orderNumber.trim(),
    p_access_token: accessToken.trim(),
  });

  if (error || !data) {
    return { error: "Pesanan tidak ditemukan. Periksa kembali nomor pesanan dan link yang kamu gunakan." };
  }
  return { order: data };
}
