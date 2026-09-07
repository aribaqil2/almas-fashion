import { createClient } from "@/lib/supabase/server";
import { updateSettings } from "./actions";

export default async function PengaturanPage({ searchParams }) {
  const supabase = createClient();
  const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-6">Pengaturan Toko</h1>

      {searchParams.error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-sm px-3 py-2 mb-5 max-w-md">{searchParams.error}</p>
      )}
      {searchParams.success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-sm px-3 py-2 mb-5 max-w-md">{searchParams.success}</p>
      )}
      <form action={updateSettings} className="bg-white border border-[var(--line)] rounded-sm p-6 max-w-md space-y-4">
        <div className="field">
          <label>Nama toko</label>
          <input name="store_name" type="text" defaultValue={settings?.store_name} required />
        </div>
        <div className="field">
          <label>Nomor WhatsApp (format 62...)</label>
          <input name="whatsapp" type="text" defaultValue={settings?.whatsapp} placeholder="628xxxxxxxxxx" />
        </div>
        <div className="field">
          <label>Teks promo ongkir</label>
          <input name="promo_text" type="text" defaultValue={settings?.promo_text} />
        </div>
        <div className="field">
          <label>Minimum belanja gratis ongkir (Rp)</label>
          <input name="free_shipping_min" type="number" min="0" step="10000" defaultValue={settings?.free_shipping_min} required />
        </div>
        <button type="submit" className="bg-plum text-white text-sm font-medium px-5 py-2.5 rounded-sm">Simpan Pengaturan</button>
      </form>
    </div>
  );
}
