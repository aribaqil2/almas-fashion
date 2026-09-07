"use client";

import { usePathname } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function StoreLayoutWrapper({ categories, settings, children }) {
  const pathname = usePathname();
  // Cek apakah halaman berada di jalur /admin
  const isAdminPage = pathname?.startsWith("/admin");

  // Jika halaman admin, render anak komponen saja TANPA Header & Footer toko
  if (isAdminPage) {
    return <>{children}</>;
  }

  // Jika halaman pembeli biasa, tampilkan Header & Footer
  return (
    <>
      <SiteHeader categories={categories} settings={settings} />
      {children}
      <SiteFooter settings={settings} />
    </>
  );
}