"use client";

import { useState, useRef, useEffect } from "react";

const STATUSES = ["pending", "diproses", "dikirim", "selesai", "dibatalkan"];
const STATUS_LABEL = {
  pending: "Menunggu Konfirmasi",
  diproses: "Diproses",
  dikirim: "Dikirim",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

export default function StatusSelect({ orderId, currentStatus, updateOrderStatus }) {
  const [selected, setSelected] = useState(currentStatus);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Menutup dropdown saat mengklik di luar area
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <form action={updateOrderStatus} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
      <input type="hidden" name="id" value={orderId} />
      <input type="hidden" name="status" value={selected} />

      {/* Custom Dropdown Container */}
      <div className="relative w-full sm:w-56" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between border border-[var(--line)] bg-white rounded-sm px-3 py-2 text-sm text-left focus:outline-none"
        >
          <span>{STATUS_LABEL[selected] || selected}</span>
          <svg className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* List Menu Pilihan Kustom */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-[var(--line)] rounded-sm shadow-lg max-h-60 overflow-auto">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSelected(s);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                  selected === s ? "bg-plum/10 text-plum font-semibold" : "text-ink"
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        className="bg-plum text-white text-sm font-medium px-4 py-2 rounded-sm hover:opacity-90 transition-opacity"
      >
        Update
      </button>
    </form>
  );
}