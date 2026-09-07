import { createClient } from "@/lib/supabase/server";
import CheckoutClient from "@/components/CheckoutClient";

export const metadata = { title: "Checkout — Almas Fashion" };

export default async function CheckoutPage() {
  const supabase = createClient();
  const { data: settings } = await supabase
    .from("settings")
    .select("whatsapp, free_shipping_min")
    .eq("id", 1)
    .single();

  return (
    <CheckoutClient
      storeWhatsapp={settings?.whatsapp}
      freeShippingMin={Number(settings?.free_shipping_min) || 0}
    />
  );
}
