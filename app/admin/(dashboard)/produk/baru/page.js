import { createClient } from "@/lib/supabase/server";
import { createProduct } from "../actions";
import ProductForm from "@/components/ProductForm";

export default async function NewProductPage() {
  const supabase = createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("name");

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-6">Tambah Produk</h1>
      <ProductForm action={createProduct} categories={categories || []} />
    </div>
  );
}
