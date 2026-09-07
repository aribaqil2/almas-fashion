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

// 1. Tambah Kategori Utama (Tanpa Parent)
export async function createParentCategory(formData) {
  let name;
  try {
    name = requireText(formData.get("name"), { field: "Nama kategori utama", max: 100 });
  } catch (e) {
    if (e instanceof ValidationError) return fail(e.message);
    throw e;
  }

  const supabase = createClient();
  const { error } = await supabase.from("categories").insert({ 
    name, 
    slug: slugify(name),
    parent_id: null 
  });

  revalidatePath("/admin/kategori");
  revalidatePath("/");

  if (error) {
    if (error.code === "23505") return fail("Kategori utama dengan nama serupa sudah ada.");
    return fail("Gagal menambah kategori utama (" + error.message + ").");
  }
  return ok("Kategori utama berhasil ditambahkan.");
}

// 2. Tambah Sub-Kategori (Harus Memilih Parent)
export async function createSubCategory(formData) {
  let name, parentId;
  try {
    name = requireText(formData.get("name"), { field: "Nama sub-kategori", max: 100 });
    parentId = requireUuid(formData.get("parent_id"), "Kategori Utama");
  } catch (e) {
    if (e instanceof ValidationError) return fail(e.message);
    throw e;
  }

  const supabase = createClient();
  const { error } = await supabase.from("categories").insert({ 
    name, 
    slug: slugify(name),
    parent_id: parentId 
  });

  revalidatePath("/admin/kategori");
  revalidatePath("/");

  if (error) {
    if (error.code === "23505") return fail("Sub-kategori dengan nama serupa sudah ada.");
    return fail("Gagal menambah sub-kategori (" + error.message + ").");
  }
  return ok("Sub-kategori berhasil ditambahkan.");
}

// 3. Update Nama Kategori/Sub-Kategori
export async function updateCategory(formData) {
  let id, name, parentId = null;
  try {
    id = requireUuid(formData.get("id"), "Kategori");
    name = requireText(formData.get("name"), { field: "Nama kategori", max: 100 });
    
    const rawParent = formData.get("parent_id");
    if (rawParent) {
      parentId = requireUuid(rawParent, "Induk Kategori");
    }
  } catch (e) {
    if (e instanceof ValidationError) return fail(e.message);
    throw e;
  }

  const supabase = createClient();
  const { error } = await supabase.from("categories").update({ 
    name, 
    slug: slugify(name),
    parent_id: parentId 
  }).eq("id", id);

  revalidatePath("/admin/kategori");
  revalidatePath("/");

  if (error) {
    if (error.code === "23505") return fail("Kategori dengan nama serupa sudah ada.");
    return fail("Gagal menyimpan perubahan (" + error.message + ").");
  }
  return ok("Kategori diperbarui.");
}

// 4. Hapus Kategori / Sub-Kategori
export async function deleteCategory(formData) {
  let id;
  try {
    id = requireUuid(formData.get("id"), "Kategori");
  } catch (e) {
    if (e instanceof ValidationError) return fail(e.message);
    throw e;
  }

  const supabase = createClient();

  // Cek produk
  const { count, error: countError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if (countError) return fail("Gagal memeriksa produk (" + countError.message + ").");
  if (count && count > 0) {
    return fail("Kategori ini masih dipakai oleh produk. Pindahkan atau hapus produknya dahulu.");
  }

  // Cek sub-kategori
  const { count: subCount, error: subError } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", id);

  if (subError) return fail("Gagal memeriksa sub-kategori (" + subError.message + ").");
  if (subCount && subCount > 0) {
    return fail("Kategori utama ini masih memiliki sub-kategori. Hapus sub-kategorinya terlebih dahulu.");
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/admin/kategori");
  revalidatePath("/");

  if (error) return fail("Gagal menghapus kategori (" + error.message + ").");
  return ok("Kategori dihapus.");
}