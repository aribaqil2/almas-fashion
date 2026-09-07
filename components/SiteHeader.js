import CartButton from "./CartButton";
import MobileMenu from "./MobileMenu";

export default function SiteHeader({ categories = [], settings }) {
  // 1. Filter Kategori Utama (yang tidak memiliki parent_id)
  const mainCategories = categories.filter((c) => !c.parent_id);

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

          {/* Tengah (Desktop): Navigasi Kategori dengan Dropdown */}
          <nav aria-label="Navigasi utama" className="home-nav hidden lg:flex items-center gap-7">
  <a href="/" className="home-nav-link">Home</a>
  
  {mainCategories.map((parent) => {
    const subCategories = categories.filter((sub) => sub.parent_id === parent.id);
    const hasSub = subCategories.length > 0;

    return (
      <div key={parent.id} className="relative group py-2">
        <a href={`/?kategori=${parent.slug}`} className="home-nav-link flex items-center gap-1.5 py-1">
          {parent.name}
          {hasSub && (
            <svg 
              className="w-3.5 h-3.5 opacity-60 group-hover:rotate-180 group-hover:opacity-100 transition-all duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </a>

        {/* Dropdown dengan Inline Style untuk Menembus CSS Bawaan */}
        {hasSub && (
          <div 
            className="absolute left-1/2 -translate-x-1/2 top-full hidden group-hover:block w-48 rounded-md py-1 shadow-2xl z-[999]"
            style={{ 
              backgroundColor: '#ffffff', 
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)'
            }}
          >
            {subCategories.map((sub) => (
              <a
                key={sub.id}
                href={`/?kategori=${sub.slug}`}
                className="block px-4 py-2 text-xs font-semibold hover:bg-slate-100 transition-colors"
                style={{ color: '#0f172a', textDecoration: 'none' }}
              >
                {sub.name}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  })}
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