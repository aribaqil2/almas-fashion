"use client";

import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Ambil data dari localStorage saat komponen pertama kali dipasang (mount)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("almas_cart");
      if (saved) setItems(JSON.parse(saved));
    } catch (e) {
      console.error("Gagal membaca keranjang:", e);
    } finally {
      setIsInitialized(true); // Tandai bahwa pembacaan awal selesai
    }
  }, []);

  // 2. Simpan ke localStorage HANYA setelah pembacaan awal selesai (isInitialized === true)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("almas_cart", JSON.stringify(items));
    }
  }, [items, isInitialized]);

  function addItem(product) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setToastMsg("Produk ditambahkan ke keranjang.");
    setTimeout(() => setToastMsg(""), 3000);
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function clearCart() {
    setItems([]);
  }

  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, clearCart, totalQty, subtotal, isOpen, setIsOpen, toastMsg, isInitialized }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}