export default function SiteFooter({ settings }) {
  return (
    <footer className="home-footer mt-10 pt-14">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-10 pb-11 border-b border-white/10">
        <div>
          <p className="home-footer-brand font-display text-xl mb-3">{settings?.store_name || "Almas Fashion"}</p>
          <p className="text-sm text-cream/70 leading-relaxed">
            Merawat teknik batik tulis dan cap dari perajin lokal, dikerjakan untuk pemakaian sehari-hari.
          </p>
        </div>
        <div>
          <h2 className="text-xs uppercase tracking-wide font-semibold mb-4">Menu</h2>
          <a href="/" className="block text-sm text-cream/70 py-1.5">Home</a>
          <a href="/?sort=newest" className="block text-sm text-cream/70 py-1.5">Shop</a>
          <a href="#" className="block text-sm text-cream/70 py-1.5">Cara Berbelanja</a>
          <a href="#" className="block text-sm text-cream/70 py-1.5">Syarat &amp; Ketentuan</a>
        </div>
        <div>
          <h2 className="text-xs uppercase tracking-wide font-semibold mb-4">Kontak</h2>
          <p className="text-sm text-cream/70 py-1.5">📍 Jawa Tengah, Indonesia</p>
          {settings?.whatsapp && (
            <a href={`https://wa.me/${settings.whatsapp}`} className="block text-sm text-cream/70 py-1.5">
              WhatsApp: +{settings.whatsapp}
            </a>
          )}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-5 flex justify-between flex-wrap gap-2 text-xs text-cream/50">
        <span>&copy; 2026 {settings?.store_name || "Almas Fashion"}.</span>
        {/* <a href="/admin" className="underline hover:text-cream">Admin</a> */}
      </div>
    </footer>
  );
}
