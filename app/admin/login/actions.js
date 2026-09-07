"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Only allow redirecting to an internal path (starts with a single "/",
// never "//" or "/\" which browsers/some routers still treat as
// protocol-relative external URLs, and never an absolute URL like
// "https://..."). Anything else falls back to /admin. This closes the
// open-redirect hole where a crafted /admin/login?next=https://evil.example
// link could otherwise send a just-authenticated user off to a phishing site.
function safeInternalPath(value) {
  if (typeof value !== "string" || value.length === 0) return "/admin";
  if (!value.startsWith("/")) return "/admin";
  if (value.startsWith("//") || value.startsWith("/\\")) return "/admin";
  if (!value.startsWith("/admin")) return "/admin";
  return value;
}

export async function signIn(prevState, formData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const next = safeInternalPath(formData.get("next"));

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email atau kata sandi salah." };
  }
  redirect(next);
}

export async function signUp(prevState, formData) {
  const email = formData.get("signup-email");
  const password = formData.get("signup-password");

  if (!password || password.length < 6) {
    return { error: "Kata sandi minimal 6 karakter." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }
  return {
    success:
      "Akun dibuat. Jika konfirmasi email aktif di proyek Supabase kamu, cek inbox dulu sebelum masuk. Untuk menjadikan akun ini admin, jalankan query di README pada Supabase SQL Editor.",
  };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
