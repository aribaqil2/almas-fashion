"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePercent, ValidationError } from "@/lib/validate";

function fail(message) {
  redirect("/admin/diskon?error=" + encodeURIComponent(message));
}
function ok(message) {
  redirect("/admin/diskon?success=" + encodeURIComponent(message));
}

export async function applyBulkDiscount(formData) {
  const categoryId = formData.get("category_id") || null;
  let percent;
  try {
    percent = requirePercent(formData.get("percent"));
  } catch (e) {
    if (e instanceof ValidationError) return fail(e.message);
    throw e;
  }

  const supabase = createClient();
  let query = supabase.from("products").update({ discount_percent: percent });
  query = categoryId ? query.eq("category_id", categoryId) : query.gte("price", 0);

  const { error, count } = await query.select("id", { count: "exact" });
  revalidatePath("/admin/diskon");
  revalidatePath("/admin/produk");
  revalidatePath("/");

  if (error) return fail("Gagal menerapkan diskon (" + error.message + ").");
  return ok(`Diskon ${percent}% diterapkan ke ${count ?? 0} produk.`);
}

export async function clearDiscount(formData) {
  const id = formData.get("id");
  if (!id) return fail("ID produk tidak valid.");

  const supabase = createClient();
  const { error } = await supabase.from("products").update({ discount_percent: 0 }).eq("id", id);
  revalidatePath("/admin/diskon");
  revalidatePath("/admin/produk");
  revalidatePath("/");

  if (error) return fail("Gagal menghapus diskon (" + error.message + ").");
  return ok("Diskon dihapus.");
}

export async function clearAllDiscounts() {
  const supabase = createClient();
  const { error } = await supabase.from("products").update({ discount_percent: 0 }).gte("price", 0);
  revalidatePath("/admin/diskon");
  revalidatePath("/admin/produk");
  revalidatePath("/");

  if (error) return fail("Gagal menghapus semua diskon (" + error.message + ").");
  return ok("Semua diskon dihapus.");
}
