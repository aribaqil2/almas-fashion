import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProduct } from "../../actions";
import ProductForm from "@/components/ProductForm";

export default async function EditProductPage({ params }) {
  const supabase = createClient();
  const [{ data: categories }, { data: product }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("products").select("*").eq("id", params.id).single(),
  ]);

  if (!product) notFound();

  const boundUpdate = updateProduct.bind(null, params.id);

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-6">Edit Produk</h1>
      <ProductForm action={boundUpdate} categories={categories || []} product={product} />
    </div>
  );
}
