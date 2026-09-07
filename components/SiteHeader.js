import CartButton from "./CartButton";
import MobileMenu from "./MobileMenu";

export default function SiteHeader({ categories, settings }) {
  return (
    <>
      <div className="home-promo-strip text-xs overflow-hidden whitespace-nowrap">
        <div className="py-2 text-center">
          {settings?.promo_text} Rp{Number(settings?.free_shipping_min || 0).toLocaleString("id-ID")}
        </div>
      </div>

      <header className="home-header sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
          
          {/* Kiri: Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <MobileMenu categories={categories} />
          </div>

          {/* Tengah (Mobile) / Kiri (Desktop): Logo */}
          <a href="/" className="home-logo flex items-center gap-2 font-display text-lg sm:text-2xl font-bold tracking-tight">
            {(settings?.store_name || "Almas Fashion").replace(/\s+Fashion$/i, "")}
          </a>

          {/* Tengah (Desktop): Navigasi Kategori */}
          <nav aria-label="Navigasi utama" className="home-nav hidden lg:flex items-center gap-7">
            <a href="/" className="home-nav-link">Home</a>
            {categories.map((c) => (
              <a key={c.id} href={`/?kategori=${c.slug}`} className="home-nav-link">
                {c.name}
              </a>
            ))}
          </nav>

          {/* Kanan: Action Icons */}
          <div className="home-header-actions flex items-center gap-3">
            <form action="/" method="get" className="hidden sm:block">
              <input name="q" defaultValue="" type="search" placeholder="Cari produk..." aria-label="Cari produk" />
            </form>
            <CartButton />
          </div>

        </div>
      </header>
    </>
  );
}