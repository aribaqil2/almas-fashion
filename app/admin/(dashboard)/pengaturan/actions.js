"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireText, requirePositiveInt, ValidationError } from "@/lib/validate";

export async function updateSettings(formData) {
  let data;
  try {
    data = {
      store_name: requireText(formData.get("store_name"), { field: "Nama toko", max: 100 }),
      whatsapp: requireText(formData.get("whatsapp"), { field: "Nomor WhatsApp", max: 30 }),
      free_shipping_min: requirePositiveInt(formData.get("free_shipping_min"), { field: "Minimum gratis ongkir", max: 100_000_000 }),
      promo_text: requireText(formData.get("promo_text"), { field: "Teks promo", max: 200 }),
    };
  } catch (e) {
    if (e instanceof ValidationError) {
      redirect("/admin/pengaturan?error=" + encodeURIComponent(e.message));
    }
    throw e;
  }

  const supabase = createClient();
  const { error } = await supabase.from("settings").update(data).eq("id", 1);

  revalidatePath("/admin/pengaturan");
  revalidatePath("/");

  if (error) {
    redirect("/admin/pengaturan?error=" + encodeURIComponent("Gagal menyimpan pengaturan (" + error.message + ")."));
  }
  redirect("/admin/pengaturan?success=" + encodeURIComponent("Pengaturan disimpan."));
}
