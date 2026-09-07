# Almas Fashion — versi Full-Stack (Next.js + Supabase)

Versi ini mengganti prototipe statis sebelumnya dengan backend sungguhan:

| Kekurangan versi sebelumnya | Diselesaikan dengan |
|---|---|
| Tidak ada backend | API otomatis dari Supabase (PostgREST) via Server Actions Next.js |
| Data tidak tersimpan di database sungguhan | Tabel PostgreSQL asli (`products`, `categories`, `settings`, `profiles`, `orders`, `order_items`) |
| Tidak ada login/autentikasi/role admin | Supabase Auth + tabel `profiles.role` (`admin`/`customer`) + Row Level Security |
| Data hilang saat ganti device/browser | Data di server (Supabase), bukan localStorage |
| Tidak pakai framework modern | Next.js 14 (App Router) + React |
| Logika bisnis bisa diubah dari browser | Semua tulis-data (insert/update/delete) lewat Server Actions yang jalan di server, dijaga lagi oleh RLS di database — bukan sekadar dicegah di UI. Harga saat checkout juga **diverifikasi ulang di server**, bukan dipercaya dari browser |
| Skalabilitas terbatas | Query database asli dengan filter/pagination di server (`range()`), bukan memfilter array di client, plus index database di kolom yang sering di-query |
| Checkout tidak tersambung apa pun | Alur pesanan sungguhan: keranjang → checkout → tersimpan di tabel `orders`/`order_items` → bisa dikelola dari `/admin/pesanan` |

---

## 1. Siapkan Supabase (5–10 menit)

1. Buat akun & proyek baru gratis di **[supabase.com](https://supabase.com)**.
2. Setelah proyek dibuat, buka **SQL Editor** di sidebar kiri.
3. Buka file `supabase/schema.sql` di proyek ini, salin **seluruh isinya**, tempel ke SQL Editor, lalu klik **Run**.
   - Ini akan membuat semua tabel, aturan keamanan (RLS), dan mengisi beberapa kategori + produk contoh.
4. Buka **Project Settings > API**. Salin dua nilai ini:
   - `Project URL`
   - `anon public` key

## 2. Siapkan proyek di komputer kamu

```bash
npm install
cp .env.example .env.local
```

Buka `.env.local`, isi dengan nilai dari langkah 1:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=isi-dengan-anon-key-kamu
```

Jalankan:

```bash
npm run dev
```

Buka **http://localhost:3000** untuk toko, dan **http://localhost:3000/admin** untuk dashboard admin.

## 3. Buat akun admin pertama

1. Buka `http://localhost:3000/admin/login`, klik **"Belum punya akun? Daftar"**, daftar dengan email & kata sandi.
   - Kalau di Supabase kamu konfirmasi email masih aktif, cek inbox dulu sebelum bisa masuk (atau matikan di Authentication > Providers > Email > "Confirm email" saat masih tahap pengembangan).
2. Kembali ke **SQL Editor** Supabase, jalankan (ganti email sesuai akun kamu):

   ```sql
   update profiles set role = 'admin' where email = 'kamu@email.com';
   ```

3. Login ulang di `/admin/login`. Sekarang kamu masuk sebagai admin dan bisa mengelola produk, kategori, diskon, dan pengaturan toko.

Tanpa langkah ini, akun baru otomatis berperan sebagai `customer` dan akan melihat halaman "Akses Ditolak" saat mencoba membuka `/admin`.

## 4. Struktur proyek

```
app/
  layout.js                  → header, footer, cart provider (server component)
  page.js                    → halaman toko: query produk real-time dari Supabase
  checkout/
    page.js                  → server wrapper: ambil nomor WA toko, render CheckoutClient
    actions.js                → Server Action tipis: panggil RPC checkout_create_order + cek harga/stok terkini
  lacak/
    page.js                  → pelacakan pesanan publik (nomor pesanan + token)
    actions.js                → Server Action: panggil RPC get_order_status
  admin/
    login/                   → halaman masuk/daftar (di luar proteksi layout)
    (dashboard)/             → semua halaman admin, dilindungi oleh layout.js di sini
      layout.js              → cek sesi + role admin, tampilkan sidebar
      page.js                → statistik dashboard
      produk/                → daftar (dengan pagination), tambah, edit, hapus produk
      kategori/               → kelola kategori
      diskon/                 → diskon massal per kategori/semua produk
      pesanan/                 → daftar pesanan (dengan pagination) + ubah status
      pengaturan/              → nama toko, WhatsApp, ongkir
components/                  → komponen UI (server & client, dipisah per fungsi)
  CheckoutClient.js           → UI checkout (client component)
  ProductForm.js              → form tambah/edit produk, pakai useFormState untuk pesan error
lib/supabase/                → client Supabase (browser & server)
lib/validate.js               → validasi input terpusat untuk semua Server Action admin
middleware.js                → lindungi rute /admin/* dari akses tanpa login DAN tanpa role admin
supabase/schema.sql          → skema database lengkap + RLS + RPC checkout/tracking/status + data contoh
```

## 5. Keamanan yang sudah diterapkan

- **Autentikasi nyata** lewat Supabase Auth (email + kata sandi, di-hash di server Supabase — bukan disimpan sebagai teks biasa).
- **Row Level Security (RLS)** di database: bahkan jika seseorang mem-bypass antarmuka dan memanggil API Supabase langsung, database tetap menolak perubahan data dari akun yang bukan admin. Ini "kunci kedua" di luar pengecekan role di halaman. Tabel `orders`/`order_items` malah tidak punya policy *insert* publik sama sekali — satu-satunya jalan masuk adalah lewat function `checkout_create_order()` di database.
- **Checkout atomik lewat PostgreSQL function** (`checkout_create_order` di `supabase/schema.sql`): validasi, kunci baris stok (`for update`), insert pesanan, insert item, kurangi stok, tambah `sold`, dan hitung ongkir semuanya terjadi dalam **satu transaksi database**. Kalau ada langkah manapun gagal, semuanya dibatalkan otomatis (rollback) — tidak ada pesanan "setengah jadi", dan dua pembeli tidak bisa sama-sama lolos validasi stok yang sama di saat bersamaan.
- **Idempotency key**: klik ganda pada tombol "Buat Pesanan" atau retry jaringan tidak akan membuat pesanan duplikat.
- **Anti-spam ringan**: checkout dari nomor HP yang sama ditolak jika dilakukan kurang dari 60 detik dari checkout sebelumnya. Ini bukan pengganti CAPTCHA/rate-limiter sungguhan untuk trafik tinggi — lihat bagian 7.
- **Validasi server terpusat** (`lib/validate.js`): semua Server Action admin (produk, kategori, diskon, pengaturan, pesanan) memvalidasi ulang input di server — bilangan bulat positif, UUID valid, panjang teks, enum status — bukan cuma mengandalkan atribut `required`/`min`/`max` di HTML yang bisa dilewati siapa pun.
- **Semua error Supabase diperiksa**: operasi tulis yang gagal (update, delete, insert) sekarang menampilkan pesan error yang jelas ke admin, bukan gagal diam-diam seolah berhasil.
- **Server Actions**: semua operasi tulis berjalan di server Next.js, bukan di browser — pengguna tidak bisa mengubah logika bisnis lewat DevTools.
- **Proteksi berlapis untuk `/admin/*`**: `middleware.js` mengecek sesi login DAN role admin (redirect lebih awal sebelum halaman admin dirender), lalu `app/admin/(dashboard)/layout.js` mengecek ulang sebagai lapisan kedua. Baik middleware maupun layout hanyalah lapisan UX — batas keamanan sesungguhnya tetap RLS di database, karena keduanya bisa saja punya bug tapi RLS akan tetap menolak permintaan yang tidak sah.
- **Open redirect di halaman login ditutup**: parameter `?next=` hanya menerima path internal yang diawali `/admin`, menolak URL eksternal seperti `https://situs-lain.com` yang bisa dipakai untuk phishing.

## 6. Alur pesanan (checkout)

Toko ini sekarang punya alur pesanan yang tersambung ke database — dengan model **"konfirmasi manual"**, bukan pembayaran otomatis:

1. Pembeli isi keranjang → buka `/checkout`. Halaman ini otomatis mengecek ulang harga/stok terbaru dan memberi peringatan kalau ada yang berubah sejak produk dimasukkan ke keranjang.
2. Saat submit, semua logika (verifikasi harga, cek stok, hitung ongkir, simpan pesanan) berjalan atomik di database lewat function `checkout_create_order()` — lihat bagian 5.
3. Pembeli diarahkan ke halaman konfirmasi berisi **nomor pesanan**, **rincian ongkir & total**, tombol **"Konfirmasi via WhatsApp"**, dan link **"Lacak status pesanan ini"**.
4. Admin melihat & mengelola semua pesanan di `/admin/pesanan` (dengan pagination), bisa mengubah status: **Menunggu Konfirmasi → Diproses → Dikirim → Selesai** (atau **Dibatalkan**). Kalau pesanan dibatalkan, stok produk **otomatis dikembalikan** dan `sold` dikurangi lagi — dan sebaliknya, mengaktifkan kembali pesanan yang tadinya dibatalkan akan gagal dengan pesan jelas kalau stok sudah tidak cukup.
5. Pembeli bisa melacak status pesanannya sendiri di `/lacak`, memakai nomor pesanan + token acak (32 karakter, tidak bisa ditebak) yang didapat di layar konfirmasi — tanpa perlu bikin akun.

Kenapa bukan pembayaran otomatis? Karena itu butuh akun merchant di payment gateway (Midtrans/Xendit) yang harus kamu daftarkan sendiri — saya tidak bisa membuatkannya untukmu. Kolom `payment_status` sudah ada di tabel `orders`; menyambungkannya ke Midtrans nanti tinggal memanggil API mereka di `app/checkout/actions.js` dan memverifikasi webhook mereka di sebuah Route Handler baru.

## 7. Yang belum ada (langkah lanjutan yang wajar)

Ini proyek yang jauh lebih tahan uji dibanding versi sebelumnya (lihat riwayat perbaikan di bagian 5-6), tapi masih ada beberapa hal yang wajar untuk dikerjakan selanjutnya:

- **Pembayaran otomatis** — lihat bagian 6.
- **CAPTCHA/rate-limiter sungguhan** — anti-spam saat ini (bagian 5) hanya proteksi ringan berbasis database. Untuk trafik tinggi, tambahkan Cloudflare Turnstile/hCaptcha di form checkout, dan/atau rate limiter berbasis Redis (mis. Upstash) di level edge/middleware.
- **Upload gambar produk sungguhan** — saat ini masih pakai motif CSS sebagai placeholder visual. Supabase punya fitur **Storage** untuk upload file, bisa ditambahkan ke form produk.
- **Akun pelanggan** — pelacakan pesanan sekarang memakai token per-pesanan (bagian 6), belum ada akun customer yang bisa melihat *semua* riwayat pesanan sekaligus.
- **Manajemen banyak admin** — role sudah ada di database, tinggal ditambah halaman untuk admin mengubah role user lain.
- **Automated testing & CI** — belum ada unit/integration/e2e test, dan `next.config.js` masih men-skip ESLint saat build (`eslint.ignoreDuringBuilds: true`). Untuk produksi, aktifkan lint di CI dan tambah test untuk perhitungan harga/ongkir, race condition checkout, dan otorisasi tiap role.

## 8. Deploy ke internet (opsional, saat sudah siap)

Cara termudah: **Vercel** (dibuat oleh tim yang sama dengan Next.js, gratis untuk mulai).

1. Push folder ini ke repository GitHub.
2. Buka [vercel.com](https://vercel.com), **Import Project**, pilih repo tersebut.
3. Saat diminta **Environment Variables**, isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` (sama seperti di `.env.local`).
4. Klik **Deploy**. Setelah selesai, kamu dapat URL publik (mis. `almas-fashion.vercel.app`) yang bisa diakses siapa pun — datanya sudah dari database sungguhan, bukan lagi per-browser.

Kalau butuh, saya bisa bantu pandu langkah ini satu per satu saat kamu sudah siap deploy.
