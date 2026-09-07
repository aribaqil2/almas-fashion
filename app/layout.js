import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { CartProvider } from "@/components/CartContext";
import CartDrawer from "@/components/CartDrawer";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "Almas Fashion — Blouse Batik Wanita",
  description:
    "Belanja blouse batik wanita di Almas Fashion — motif Parang, Kawung, Ceplok, dan Mega Mendung, potongan nyaman untuk kerja maupun acara resmi.",
};

export default async function RootLayout({ children }) {
  const supabase = createClient();
  const [{ data: categories }, { data: settings }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("settings").select("*").eq("id", 1).single(),
  ]);

  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans text-ink bg-paper antialiased">
        <CartProvider>
          <SiteHeader categories={categories || []} settings={settings} />
          {children}
          <SiteFooter settings={settings} />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
