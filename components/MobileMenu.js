"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function MobileMenu({ categories }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
              {categories.map((c) => (
                <a 
                  key={c.id} 
                  href={`/?kategori=${c.slug}`} 
                  onClick={() => setOpen(false)}
                  className="py-3 border-b border-[var(--line)] text-sm font-medium hover:text-plum transition-colors"
                >
                  {c.name}
                </a>
              ))}
            </div>
          </nav>
        </div>,
        document.body
      )}
    </>
  );
}