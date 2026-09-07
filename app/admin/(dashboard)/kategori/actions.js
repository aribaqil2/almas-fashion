"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireText, requireUuid, ValidationError } from "@/lib/validate";

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function fail(message) {
  redirect("/admin/kategori?error=" + encodeURIComponent(message));
}
function ok(message) {
  redirect("/admin/kategori?success=" + encodeURIComponent(message));
}

export async function createCategory(formData) {
  let name;
  try {
    name = requireText(formData.get("name"), { field: "Nama kategori", max: 100 });
  } catch (e) {
    if (e instanceof ValidationError) return fail(e.message);
    throw e;
  }

  const supabase = createClient();
  const { error } = await supabase.from("categories").insert({ name, slug: slugify(name) });
  revalidatePath("/admin/kategori");
  revalidatePath("/");

  if (error) {
    if (error.code === "23505") return fail("Kategori dengan nama serupa sudah ada.");
    return fail("Gagal menambah kategori (" + error.message + ").");
  }
  return ok("Kategori ditambahkan.");
}

export async function renameCategory(formData) {
  let id, name;
  try {
    id = requireUuid(formData.get("id"), "Kategori");
    name = requireText(formData.get("name"), { field: "Nama kategori", max: 100 });
  } catch (e) {
    if (e instanceof ValidationError) return fail(e.message);
    throw e;
  }

  const supabase = createClient();
  const { error } = await supabase.from("categories").update({ name, slug: slugify(name) }).eq("id", id);
  revalidatePath("/admin/kategori");
  revalidatePath("/");

  if (error) {
    if (error.code === "23505") return fail("Kategori dengan nama serupa sudah ada.");
    return fail("Gagal menyimpan perubahan kategori (" + error.message + ").");
  }
  return ok("Kategori diperbarui.");
}

export async function deleteCategory(formData) {
  let id;
  try {
    id = requireUuid(formData.get("id"), "Kategori");
  } catch (e) {
    if (e instanceof ValidationError) return fail(e.message);
    throw e;
  }

  const supabase = createClient();

  const { count, error: countError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if (countError) return fail("Gagal memeriksa kategori (" + countError.message + ").");
  if (count && count > 0) {
    return fail("Kategori ini masih dipakai oleh produk. Pindahkan produknya dulu.");
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/admin/kategori");
  revalidatePath("/");

  if (error) return fail("Gagal menghapus kategori (" + error.message + ").");
  return ok("Kategori dihapus.");
}
