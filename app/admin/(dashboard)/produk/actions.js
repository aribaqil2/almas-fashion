"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  requireText,
  requireUuid,
  requirePrice,
  requirePercent,
  requireEnum,
  requireSizes,
  requireStockBySize,
  optionalText,
  ValidationError,
} from "@/lib/validate";

function parseProductForm(formData) {
  const sizes = requireSizes(formData.getAll("sizes"));
  const stockBySize = requireStockBySize(formData.get("stock_by_size"), sizes);
  return {
    name: requireText(formData.get("name"), { field: "Nama produk", max: 200 }),
    category_id: requireUuid(formData.get("category_id"), "Kategori"),
    status: requireEnum(formData.get("status"), ["active", "draft"], "Status"),
    price: requirePrice(formData.get("price")),
    discount_percent: requirePercent(formData.get("discount_percent")),
    stock: Object.values(stockBySize).reduce((total, stock) => total + stock, 0),
    stock_by_size: stockBySize,
    description: optionalText(formData.get("description"), { max: 5000 }),
    motif: requireText(formData.get("motif"), { field: "Motif", max: 100 }),
    color: requireText(formData.get("color"), { field: "Warna", max: 100 }),
    pattern: requireEnum(formData.get("pattern") || "m1", ["m1", "m2", "m3", "m4", "m5", "m6"], "Pola"),
    is_new: formData.get("is_new") === "on",
    sizes,
    image_url: formData.get("image_url") || null, // <-- Tambahkan baris ini
  };
}

export async function createProduct(prevState, formData) {
  let data;
  try {
    data = parseProductForm(formData);
  } catch (e) {
    if (e instanceof ValidationError) return { error: e.message };
    throw e;
  }

  const supabase = createClient();
  const { error } = await supabase.from("products").insert(data);
  if (error) return { error: "Gagal menyimpan produk. Coba lagi (" + error.message + ")." };

  revalidatePath("/admin/produk");
  revalidatePath("/");
  redirect("/admin/produk");
}

export async function updateProduct(id, prevState, formData) {
  let data;
  try {
    requireUuid(id, "Produk");
    data = parseProductForm(formData);
  } catch (e) {
    if (e instanceof ValidationError) return { error: e.message };
    throw e;
  }

  const supabase = createClient();
  const { error } = await supabase.from("products").update(data).eq("id", id);
  if (error) return { error: "Gagal menyimpan perubahan. Coba lagi (" + error.message + ")." };

  revalidatePath("/admin/produk");
  revalidatePath("/");
  redirect("/admin/produk");
}

export async function deleteProduct(formData) {
  const id = formData.get("id");
  try {
    requireUuid(id, "Produk");
  } catch {
    redirect("/admin/produk?error=" + encodeURIComponent("ID produk tidak valid."));
  }

  const supabase = createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  revalidatePath("/admin/produk");
  revalidatePath("/");

  if (error) {
    redirect("/admin/produk?error=" + encodeURIComponent("Gagal menghapus produk (" + error.message + ")."));
  }
  redirect("/admin/produk?success=" + encodeURIComponent("Produk dihapus."));
}