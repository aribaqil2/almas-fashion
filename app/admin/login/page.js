"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { signIn, signUp } from "./actions";

function SubmitButton({ children }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-plum text-white text-sm font-medium py-2.5 rounded-sm disabled:opacity-60"
    >
      {pending ? "Memproses..." : children}
    </button>
  );
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";
  const deniedReason = searchParams.get("error");

  const [signInState, signInAction] = useFormState(signIn, {});
  const [signUpState, signUpAction] = useFormState(signUp, {});

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span
            className="w-8 h-8 bg-gradient-to-br from-plum to-gold inline-block mb-3"
            style={{ clipPath: "polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 7px 100%, 0 calc(100% - 7px))" }}
          />
          <h1 className="font-display text-2xl">Admin Almas Fashion</h1>
        </div>

        {deniedReason === "not_admin" && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2.5 mb-5">
            Akun kamu berhasil masuk tapi belum berperan sebagai admin. Minta admin lain menaikkan role-mu, lihat langkah di README.md.
          </p>
        )}

        <form action={signInAction} className="bg-white border border-[var(--line)] rounded-sm p-6 space-y-4">
          <input type="hidden" name="next" value={next} />
          <h2 className="font-display text-lg">Masuk</h2>
          {signInState?.error && <p className="text-sm text-red-700 bg-red-50 rounded-sm px-3 py-2">{signInState.error}</p>}
          <div className="field">
            <label className="block text-xs font-semibold mb-1.5 text-ink/65">Email</label>
            <input name="email" type="email" required className="w-full border border-[var(--line)] rounded-sm px-3 py-2 text-sm" />
          </div>
          <div className="field">
            <label className="block text-xs font-semibold mb-1.5 text-ink/65">Kata sandi</label>
            <input name="password" type="password" required className="w-full border border-[var(--line)] rounded-sm px-3 py-2 text-sm" />
          </div>
          <SubmitButton>Masuk</SubmitButton>
        </form>

        <details className="mt-5 bg-white border border-[var(--line)] rounded-sm p-6">
          <summary className="font-display text-lg cursor-pointer">Belum punya akun? Daftar</summary>
          <form action={signUpAction} className="space-y-4 mt-4">
            {signUpState?.error && <p className="text-sm text-red-700 bg-red-50 rounded-sm px-3 py-2">{signUpState.error}</p>}
            {signUpState?.success && <p className="text-sm text-green-700 bg-green-50 rounded-sm px-3 py-2">{signUpState.success}</p>}
            <div className="field">
              <label className="block text-xs font-semibold mb-1.5 text-ink/65">Email</label>
              <input name="signup-email" type="email" required className="w-full border border-[var(--line)] rounded-sm px-3 py-2 text-sm" />
            </div>
            <div className="field">
              <label className="block text-xs font-semibold mb-1.5 text-ink/65">Kata sandi</label>
              <input name="signup-password" type="password" required minLength={6} className="w-full border border-[var(--line)] rounded-sm px-3 py-2 text-sm" />
            </div>
            <SubmitButton>Daftar</SubmitButton>
            <p className="text-xs text-ink/50 leading-relaxed">
              Akun baru berperan sebagai "customer" secara default. Untuk akses admin, ikuti langkah di README.md setelah mendaftar.
            </p>
          </form>
        </details>
      </div>
    </main>
  );
}
