"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function MobileMenu({ categories = [] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mainCategories = categories.filter((c) => !c.parent_id);

  return (
    <>
      <button 
        type="button" 
        onClick={() => setOpen(true)} 
        className="lg:hidden flex flex-col gap-1.5 p-1" 
        aria-label="Buka menu"
      >
        <span className="w-5 h-0.5 bg-ink" />
        <span className="w-5 h-0.5 bg-ink" />
        <span className="w-5 h-0.5 bg-ink" />
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[9999]">
          {/* Layar overlay gelap */}
          <div 
            className="fixed inset-0 bg-ink/60 backdrop-blur-sm" 
            onClick={() => setOpen(false)} 
          />

          {/* Panel menu melayang */}
          <nav className="fixed inset-y-0 right-0 w-[85vw] max-w-xs bg-paper p-6 shadow-2xl overflow-y-auto z-10 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--line)] mb-4">
              <p className="font-display text-lg font-semibold">Almas Fashion</p>
              <button 
                type="button" 
                onClick={() => setOpen(false)} 
                className="p-1 text-2xl leading-none text-ink/70 hover:text-ink" 
                aria-label="Tutup menu"
              >
                &times;
              </button>
            </div>

            <h2 className="text-xs uppercase tracking-wide text-ink/50 mb-3 font-semibold">
              Kategori
            </h2>

            <div className="flex flex-col">
              <a 
                href="/" 
                onClick={() => setOpen(false)}
                className="py-3 border-b border-[var(--line)] text-sm font-medium hover:text-plum transition-colors"
              >
                Home
              </a>

              {mainCategories.map((parent) => {
                const subCategories = categories.filter((sub) => sub.parent_id === parent.id);

                // Jika punya sub-kategori, klik di mana saja (teks / panah) akan membuka dropdown
                if (subCategories.length > 0) {
                  return (
                    <details key={parent.id} className="group border-b border-[var(--line)] py-2">
                      <summary className="flex justify-between items-center cursor-pointer text-sm font-medium py-1 list-none hover:text-plum transition-colors select-none">
                        <span>{parent.name}</span>
                        <span className="text-xs transition-transform group-open:rotate-180 text-ink/50 ml-2">
                          ▼
                        </span>
                      </summary>

                      {/* Sub Kategori */}
                      <div className="pl-3 mt-1 flex flex-col gap-1 border-l-2 border-[var(--line)] ml-1 pb-1">
                        <a
                          href={`/?kategori=${parent.slug}`}
                          onClick={() => setOpen(false)}
                          className="py-1 text-xs font-semibold text-plum hover:underline"
                        >
                          Lihat Semua {parent.name}
                        </a>
                        {subCategories.map((sub) => (
                          <a
                            key={sub.id}
                            href={`/?kategori=${sub.slug}`}
                            onClick={() => setOpen(false)}
                            className="py-1 text-xs text-ink/70 hover:text-plum transition-colors"
                          >
                            ↳ {sub.name}
                          </a>
                        ))}
                      </div>
                    </details>
                  );
                }

                // Jika tidak punya sub-kategori, langsung berfungsi sebagai link biasa
                return (
                  <a 
                    key={parent.id}
                    href={`/?kategori=${parent.slug}`}
                    onClick={() => setOpen(false)}
                    className="border-b border-[var(--line)] py-3 text-sm font-medium hover:text-plum transition-colors"
                  >
                    {parent.name}
                  </a>
                );
              })}
            </div>
          </nav>
        </div>,
        document.body
      )}
    </>
  );
}