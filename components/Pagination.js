function buildUrl(searchParams, page) {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (key === "page") return;
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    else if (value) params.set(key, value);
  });
  params.set("page", String(page));
  return `?${params.toString()}`;
}

export default function Pagination({ searchParams, currentPage, totalPages }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="flex justify-center items-center gap-2 mt-14" aria-label="Navigasi halaman">
      <a
        href={buildUrl(searchParams, Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        className={`w-9 h-9 border border-[var(--line)] bg-white text-sm flex items-center justify-center ${
          currentPage === 1 ? "opacity-30 pointer-events-none" : ""
        }`}
      >
        &lsaquo;
      </a>
      {pages.map((p) => (
        <a
          key={p}
          href={buildUrl(searchParams, p)}
          className={`w-9 h-9 border text-sm flex items-center justify-center ${
            p === currentPage ? "bg-ink text-white border-ink" : "bg-white border-[var(--line)]"
          }`}
        >
          {p}
        </a>
      ))}
      <a
        href={buildUrl(searchParams, Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        className={`w-9 h-9 border border-[var(--line)] bg-white text-sm flex items-center justify-center ${
          currentPage === totalPages ? "opacity-30 pointer-events-none" : ""
        }`}
      >
        &rsaquo;
      </a>
    </nav>
  );
}
