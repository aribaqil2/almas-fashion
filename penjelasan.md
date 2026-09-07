# Penjelasan Project Almas Fashion

Dokumen ini menjelaskan struktur, fungsi setiap file, alur data, dan lokasi yang perlu diedit ketika ingin mengubah tampilan/template toko.

---

## 1. Gambaran Umum Project

Project ini adalah toko online fashion berbasis:

- **Next.js 14 App Router**: mengatur halaman, routing, Server Component, dan Server Action.
- **React 18**: membuat komponen antarmuka yang interaktif.
- **Supabase**: menyediakan database PostgreSQL dan autentikasi pengguna.
- **Tailwind CSS**: styling melalui class seperti `bg-paper`, `text-plum`, `grid`, dan `px-5`.
- **PostCSS dan Autoprefixer**: memproses CSS agar kompatibel dengan browser.

Aplikasi memiliki dua area utama:

1. **Toko publik**: halaman katalog, filter produk, keranjang, checkout, dan pelacakan pesanan.
2. **Dashboard admin**: login admin, statistik, pengelolaan produk, kategori, diskon, pesanan, dan pengaturan toko.

Database adalah sumber data utama. Data produk, kategori, pengaturan, dan pesanan tidak ditulis permanen di browser. Keranjang sementara disimpan di `localStorage` browser.

---

## 2. Struktur Folder

```text
almas-fashion-nextjs/
├── app/                         Halaman dan route Next.js
│   ├── globals.css              CSS global dan motif produk
│   ├── layout.js                Layout utama seluruh aplikasi
│   ├── page.js                  Halaman katalog toko
│   ├── checkout/                Halaman checkout
│   ├── lacak/                   Halaman pelacakan pesanan
│   └── admin/                   Login dan dashboard admin
├── components/                  Komponen UI yang digunakan ulang
├── lib/                         Helper dan konfigurasi library
│   ├── supabase/                Client Supabase server/browser
│   └── validate.js              Validasi input di server
├── supabase/
│   └── schema.sql               Tabel, RLS, function, data awal, dan index database
├── middleware.js                Proteksi route admin dan refresh sesi
├── next.config.js               Konfigurasi Next.js
├── tailwind.config.js           Warna dan font custom Tailwind
├── postcss.config.js            Konfigurasi pemrosesan CSS
├── jsconfig.json                Alias import `@/`
├── package.json                 Dependency dan perintah project
├── .env.example                 Contoh environment variable Supabase
└── .gitignore                   File/folder yang tidak di-commit
```

Folder `.next/` dan `node_modules/` adalah hasil build/dependency. Keduanya bukan source utama dan biasanya tidak perlu diedit.

---

## 3. File Utama Untuk Mengubah Template

Bagian ini adalah panduan paling praktis saat ingin mengubah desain.

### Mengubah warna, font, dan style global

Edit file berikut:

- `app/globals.css`: warna CSS variable, motif produk, footer, drawer keranjang, badge, input, dan style global.
- `tailwind.config.js`: nama warna custom dan keluarga font Tailwind.
- `app/layout.js`: font Google, class pada `body`, metadata, header, footer, dan provider.

Warna custom yang tersedia:

- `ink`: `#2b2622`, warna teks gelap.
- `paper`: `#8BA296`, warna latar utama bernuansa hijau.
- `cream`: `#f3ead9`, warna teks/latar krem.
- `plum`: `#7a2e3e`, warna tombol dan aksen merah plum.
- `gold`: `#c9a661`, warna aksen emas.

Contoh penggunaan class: `bg-plum`, `text-cream`, `bg-paper`, `text-ink`, dan `from-plum to-gold`.

### Mengubah header dan navigasi toko

Edit `components/SiteHeader.js` untuk logo, banner promo, navigasi kategori, tombol akun, dan tombol keranjang.

Edit `components/MobileMenu.js` untuk menu navigasi versi mobile.

### Mengubah katalog dan kartu produk

- `app/page.js`: susunan halaman katalog, breadcrumb, toolbar filter/sortir, grid produk, dan pesan produk kosong.
- `components/ProductCard.js`: kartu produk, label baru/diskon, motif, wishlist, rating, harga, dan tombol tambah ke keranjang.
- `components/FilterSidebar.js`: field pencarian, harga maksimum, ukuran, warna, motif, dan sortir.
- `components/Pagination.js`: navigasi halaman katalog/admin.

### Mengubah keranjang

- `components/CartContext.js`: state keranjang, tambah/hapus item, subtotal, penyimpanan `localStorage`, dan notifikasi.
- `components/CartButton.js`: ikon keranjang dan jumlah item di header.
- `components/CartDrawer.js`: panel keranjang yang muncul dari kanan.
- `components/AddToCartButton.js`: tombol tambah produk ke keranjang.

### Mengubah checkout

- `app/checkout/page.js`: mengambil nomor WhatsApp toko dari database lalu memanggil UI checkout.
- `components/CheckoutClient.js`: form pelanggan, ringkasan belanja, peringatan perubahan harga/stok, hasil pesanan, dan tombol WhatsApp.
- `app/checkout/actions.js`: komunikasi ke database untuk cek harga dan membuat pesanan. Jangan mengubah jika hanya ingin mengubah tampilan.

### Mengubah footer

Edit `components/SiteFooter.js` untuk nama toko, deskripsi, link bantuan, WhatsApp, copyright, dan link admin.

### Mengubah dashboard admin

- `app/admin/(dashboard)/layout.js`: sidebar, pembatas area admin, dan layout dashboard.
- `components/AdminNav.js`: daftar menu dashboard admin.
- File `page.js` di masing-masing folder admin: isi halaman yang ditampilkan.
- `components/ProductForm.js`: form tambah dan edit produk.

---

## 4. Penjelasan Folder `app`

Di Next.js App Router, setiap folder di dalam `app` dapat menjadi route. File `page.js` menghasilkan halaman, `layout.js` membungkus halaman, dan `actions.js` berisi Server Action.

---

## 5. `app/layout.js`

Ini adalah layout global yang digunakan semua halaman.

Tugasnya:

1. Mengimpor `globals.css`.
2. Membuat client Supabase server.
3. Mengambil kategori dan pengaturan toko dari database.
4. Memasang font `Playfair Display` dan `Inter` dari Google Fonts.
5. Menyediakan `CartProvider` untuk seluruh halaman.
6. Menampilkan `SiteHeader`, isi halaman, `SiteFooter`, dan `CartDrawer`.
7. Menentukan metadata judul dan deskripsi website.

Perubahan template yang cocok di sini:

- Mengganti font.
- Mengubah metadata SEO dasar.
- Mengubah urutan header, isi, footer, dan drawer.
- Mengganti class `body` global.

Jangan memindahkan `CartProvider` keluar dari pembungkus komponen yang membutuhkan `useCart`.

---

## 6. `app/page.js`

Ini adalah halaman utama katalog toko pada route `/`.

Prosesnya:

1. Membaca query URL seperti `kategori`, `ukuran`, `warna`, `motif`, `harga`, `q`, `sort`, dan `page`.
2. Mengambil kategori dari Supabase.
3. Membuat query produk aktif dengan filter yang dipilih.
4. Mengurutkan produk berdasarkan tren, rating, terbaru, harga termurah, atau termahal.
5. Mengambil produk secara pagination, maksimal 10 produk per halaman.
6. Menampilkan breadcrumb, toolbar, sidebar filter, grid `ProductCard`, dan `Pagination`.

Perubahan template yang cocok:

- Breadcrumb.
- Layout grid produk.
- Toolbar filter/sortir.
- Teks ketika produk tidak ditemukan.
- Jumlah kolom dan jarak antar kartu.

Logika query sebaiknya tetap dipertahankan jika hanya mengubah visual.

---

## 7. Folder `app/checkout`

### `app/checkout/page.js`

Server Component untuk route `/checkout`. File ini mengambil nomor WhatsApp toko dari tabel `settings`, lalu mengirimkannya ke `CheckoutClient`.

File ini cocok diedit jika checkout membutuhkan data pengaturan tambahan dari database. Tampilan form bukan berada di sini, tetapi di `components/CheckoutClient.js`.

### `app/checkout/actions.js`

Server Action untuk operasi checkout.

- `getLiveCartInfo(ids)`: membaca harga, diskon, stok, dan status produk terbaru.
- `createOrder(...)`: mengirim data pelanggan dan item ke function PostgreSQL `checkout_create_order`.
- `friendlyError(...)`: mengubah error database menjadi pesan yang mudah dipahami.

Harga final dihitung ulang di server/database. Data harga dari browser tidak dipercaya sebagai sumber akhir.

### `components/CheckoutClient.js`

Client Component karena membutuhkan state React dan interaksi pengguna.

Tugasnya:

- Membaca isi keranjang.
- Mengecek data harga/stok terbaru ketika halaman dibuka.
- Menampilkan peringatan jika harga berubah atau stok kurang.
- Menyediakan form nama, nomor HP, alamat, dan catatan.
- Mengirim pesanan melalui `createOrder`.
- Menampilkan nomor pesanan dan total setelah berhasil.
- Membuat link konfirmasi WhatsApp.
- Menyediakan link ke halaman `/lacak`.

Edit file ini untuk mengubah tampilan checkout, tetapi jangan menghapus pemanggilan `createOrder`, validasi form, atau `clearCart` setelah order berhasil.

---

## 8. Folder `app/lacak`

### `app/lacak/page.js`

Client Component untuk route `/lacak`.

Pengguna mengisi nomor pesanan dan token akses. Jika URL berasal dari halaman konfirmasi checkout, field otomatis diisi dari query `nomor` dan `token`. Hasil yang ditampilkan adalah status pesanan, item, ongkir, dan total.

Edit file ini untuk mengubah desain halaman pelacakan dan kartu hasil.

### `app/lacak/actions.js`

Server Action yang memanggil RPC `get_order_status` di Supabase. Pesanan hanya dapat ditemukan jika nomor pesanan dan token cocok.

File ini mengatur keamanan akses data pelacakan. Tidak perlu diubah untuk perubahan visual.

---

## 9. Folder `app/admin`

### `app/admin/login/page.js`

Halaman login dan pendaftaran admin pada route `/admin/login`.

Fungsinya:

- Menampilkan form login email dan password.
- Menampilkan form daftar akun baru.
- Membaca parameter `next` untuk kembali ke halaman admin sebelumnya.
- Menampilkan pesan jika akun berhasil login tetapi belum memiliki role admin.
- Menggunakan `useFormState` untuk menerima hasil dari Server Action.

Edit file ini untuk mengubah desain login. Proses autentikasi tetap berada di `actions.js`.

### `app/admin/login/actions.js`

Berisi Server Action autentikasi:

- `signIn`: login menggunakan email dan password Supabase.
- `signUp`: membuat akun baru, minimal password 6 karakter.
- `signOut`: mengakhiri sesi dan mengarahkan ke halaman login.
- `safeInternalPath`: mencegah redirect ke URL eksternal melalui parameter `next`.

File ini mengatur perilaku dan keamanan login, bukan tampilan.

### `app/admin/(dashboard)/layout.js`

Layout khusus semua halaman admin selain login.

Fungsinya:

1. Membaca user dan profil menggunakan `getCurrentUser`.
2. Mengarahkan user yang belum login ke `/admin/login`.
3. Menolak user yang role-nya bukan `admin`.
4. Menampilkan sidebar admin, `AdminNav`, email user, tombol keluar, dan link ke toko.

Tanda kurung pada `(dashboard)` adalah route group. Nama folder tersebut tidak menjadi bagian URL, sehingga halaman tetap berada di `/admin`, `/admin/produk`, dan seterusnya.

### `app/admin/(dashboard)/page.js`

Halaman dashboard pada `/admin`.

Mengambil produk dan pesanan, lalu menghitung:

- Total produk.
- Produk aktif.
- Produk yang sedang diskon.
- Produk dengan stok maksimal 5.
- Pesanan berstatus pending.

Bagian tabel `Perlu Perhatian` menampilkan produk dengan stok menipis atau habis.

### `app/admin/(dashboard)/produk/page.js`

Daftar produk admin pada `/admin/produk`.

Menyediakan:

- Pencarian nama produk.
- Filter kategori.
- Pagination 20 produk per halaman.
- Harga normal, diskon, harga akhir, stok, dan status.
- Link edit.
- Tombol hapus dengan konfirmasi.

### `app/admin/(dashboard)/produk/baru/page.js`

Halaman `/admin/produk/baru` untuk menambah produk. Mengambil kategori dari database dan mengirim action `createProduct` ke `ProductForm`.

### `app/admin/(dashboard)/produk/[id]/edit/page.js`

Halaman edit produk berdasarkan parameter ID URL. Mengambil kategori dan data produk, lalu mengikat `updateProduct` dengan ID produk.

### `app/admin/(dashboard)/produk/actions.js`

Server Action CRUD produk:

- `parseProductForm`: membaca dan memvalidasi data form.
- `createProduct`: insert produk baru.
- `updateProduct`: memperbarui produk.
- `deleteProduct`: menghapus produk.

Setelah perubahan, cache route admin dan toko di-refresh menggunakan `revalidatePath`.

### `app/admin/(dashboard)/kategori/page.js`

Halaman `/admin/kategori` untuk menambah, mengganti nama, dan menghapus kategori. Halaman ini juga menghitung jumlah produk dalam setiap kategori.

### `app/admin/(dashboard)/kategori/actions.js`

Server Action kategori:

- `slugify`: mengubah nama kategori menjadi slug URL.
- `createCategory`: membuat kategori.
- `renameCategory`: mengubah nama dan slug.
- `deleteCategory`: menghapus kategori hanya jika tidak sedang digunakan produk.

### `app/admin/(dashboard)/diskon/page.js`

Halaman `/admin/diskon` untuk menerapkan diskon massal berdasarkan kategori dan melihat produk yang sedang diskon.

### `app/admin/(dashboard)/diskon/actions.js`

Server Action diskon:

- `applyBulkDiscount`: menerapkan persentase diskon ke semua produk atau satu kategori.
- `clearDiscount`: menghapus diskon satu produk.
- `clearAllDiscounts`: menghapus semua diskon.

### `app/admin/(dashboard)/pengaturan/page.js`

Form pengaturan toko pada `/admin/pengaturan`.

Field yang tersedia:

- Nama toko.
- Nomor WhatsApp.
- Teks promo.
- Minimum belanja gratis ongkir.

Nilai ini digunakan oleh header, footer, checkout, dan function database untuk menghitung ongkir.

### `app/admin/(dashboard)/pengaturan/actions.js`

Memvalidasi dan menyimpan pengaturan ke baris `settings` dengan `id = 1`. Setelah berhasil, halaman admin dan toko di-refresh.

### `app/admin/(dashboard)/pesanan/page.js`

Daftar pesanan pada `/admin/pesanan`.

Menyediakan filter status, pagination, nomor pesanan, pelanggan, ongkir, total, status, tanggal, dan link detail.

### `app/admin/(dashboard)/pesanan/actions.js`

`updateOrderStatus` memvalidasi ID dan status, lalu memanggil RPC `update_order_status`.

Perubahan status juga mengatur pengembalian atau pengurangan stok secara atomik di database jika pesanan dibatalkan atau diaktifkan kembali.

### `app/admin/(dashboard)/pesanan/[id]/page.js`

Halaman detail pesanan pada `/admin/pesanan/[id]`.

Menampilkan:

- Nomor pesanan.
- Form perubahan status.
- Data pelanggan.
- Alamat dan catatan.
- Item pesanan.
- Ongkir, status pembayaran, dan total.

Edit file ini untuk mengubah tampilan detail pesanan.

---

## 10. Penjelasan Folder `components`

Komponen dibuat terpisah agar satu bagian UI dapat digunakan di beberapa halaman.

### `components/SiteHeader.js`

Header toko publik. Menampilkan banner promo, logo/nama toko, navigasi kategori desktop, menu mobile, tombol akun, dan tombol keranjang.

### `components/SiteFooter.js`

Footer toko. Menampilkan identitas toko, deskripsi, link bantuan, WhatsApp, copyright, dan link admin.

### `components/MobileMenu.js`

Menu navigasi mobile berbentuk panel dari sisi kanan. Menggunakan portal agar panel dirender langsung di `document.body` dan berada di atas konten.

### `components/ProductCard.js`

Kartu produk di katalog. Menghitung harga setelah diskon, menentukan status stok, menampilkan badge, motif CSS, rating, jumlah terjual, dan tombol keranjang.

### `components/FilterSidebar.js`

Form filter katalog. Semua filter dikirim sebagai query GET sehingga URL dapat disalin dan dibuka kembali.

### `components/Pagination.js`

Membuat link halaman sebelumnya, nomor halaman, dan halaman berikutnya. Filter yang sedang aktif dipertahankan saat berpindah halaman.

### `components/CartContext.js`

Pusat state keranjang menggunakan React Context.

Menyediakan:

- `items`.
- `addItem`.
- `removeItem`.
- `clearCart`.
- `totalQty`.
- `subtotal`.
- `isOpen` dan `setIsOpen`.
- `toastMsg`.

Isi keranjang disimpan dengan key `almas_cart` di `localStorage`.

### `components/CartButton.js`

Tombol keranjang di header. Menampilkan ikon dan total jumlah barang, lalu membuka drawer ketika diklik.

### `components/CartDrawer.js`

Panel keranjang dari kanan. Menampilkan produk, jumlah, subtotal, tombol hapus, dan link menuju checkout. Komponen ini juga menampilkan toast setelah produk ditambahkan.

### `components/AddToCartButton.js`

Tombol pada kartu produk. Tombol dinonaktifkan jika stok habis atau produk tidak aktif.

### `components/ProductForm.js`

Form bersama untuk tambah dan edit produk. Menerima `action`, `categories`, dan optional `product` sehingga tidak perlu membuat dua form berbeda.

Field-nya meliputi nama, kategori, status, harga, diskon, stok, motif, warna, pola, ukuran, dan penanda produk baru.

### `components/CheckoutClient.js`

Komponen interaktif checkout. Penjelasan lengkap berada pada bagian folder `app/checkout`.

### `components/AdminNav.js`

Daftar link sidebar admin dan penanda menu yang sedang aktif berdasarkan pathname.

### `components/ConfirmSubmitButton.js`

Button kecil yang menampilkan `confirm()` browser sebelum form dikirim. Dipakai sebelum menghapus produk, kategori, atau diskon.

---

## 11. `app/globals.css`

File CSS global yang diimpor dari `app/layout.js`.

Isinya:

- Directive Tailwind: `@tailwind base`, `components`, dan `utilities`.
- CSS variable warna global.
- Style body dan scroll.
- `.facet-sm` dan `.facet-line` untuk bentuk dekoratif.
- `.m1` sampai `.m6` untuk motif batik berbasis CSS.
- `.toast` dan `.toast.show` untuk notifikasi.
- `#cart-drawer` dan `.show` untuk animasi drawer.
- `.overlay` untuk lapisan gelap di belakang drawer.
- Style focus keyboard.
- Badge admin: aktif, draf, diskon, stok menipis, stok habis.
- Style tabel admin dan field input.

Jika ingin mengganti tema warna seluruh aplikasi, file ini dan `tailwind.config.js` adalah tempat pertama yang perlu diperiksa.

Catatan: motif produk sekarang bukan gambar asli. Motif tersebut dibuat dengan CSS gradient berdasarkan class `m1` sampai `m6`.

---

## 12. File `lib`

### `lib/supabase/client.js`

Membuat client Supabase untuk browser. Digunakan bila komponen client perlu berkomunikasi langsung dengan Supabase.

### `lib/supabase/server.js`

Membuat client Supabase untuk Server Component dan Server Action menggunakan cookies sesi.

Fungsi `getCurrentUser()` mengambil user yang sedang login dan profilnya dari tabel `profiles`.

### `lib/validate.js`

Validasi server terpusat:

- `requireUuid`: memastikan ID berbentuk UUID.
- `requireText`: teks wajib dan memiliki batas panjang.
- `optionalText`: teks opsional.
- `requirePositiveInt`: bilangan bulat dalam rentang tertentu.
- `requirePrice`: validasi harga.
- `requirePercent`: validasi persentase diskon.
- `requireEnum`: memastikan nilai termasuk pilihan yang diizinkan.
- `requireSizes`: menyaring ukuran ke S, M, L, XL, dan XXL.

Validasi ini penting karena validasi HTML browser dapat dilewati. Jangan menghapus validasi server ketika mengubah form.

---

## 13. `middleware.js`

Middleware berjalan sebelum route admin diproses.

Dengan matcher `/admin/:path*`, file ini:

1. Membaca sesi Supabase dari cookies.
2. Mengarahkan user tanpa login ke `/admin/login`.
3. Mengambil role dari tabel `profiles`.
4. Mengarahkan user non-admin kembali ke login dengan pesan `not_admin`.
5. Membantu memperbarui sesi Supabase.

Middleware adalah perlindungan awal dan pengalaman pengguna. Keamanan database tetap ditegakkan oleh RLS di Supabase.

---

## 14. File Konfigurasi

### `package.json`

Menyimpan nama project, versi, dependency, dan script:

- `npm run dev`: menjalankan server development.
- `npm run build`: membuat build production.
- `npm run start`: menjalankan hasil build production.
- `npm run lint`: menjalankan lint, jika didukung oleh versi Next.js yang digunakan.

### `next.config.js`

Mengaktifkan React Strict Mode. Konfigurasi saat ini juga melewati error ESLint ketika build melalui `ignoreDuringBuilds: true`.

### `tailwind.config.js`

Menentukan file yang dipindai Tailwind, warna custom, dan font `display` serta `sans`.

Jika menambah class Tailwind pada file baru, pastikan lokasinya tercakup oleh `content`.

### `postcss.config.js`

Mengaktifkan plugin Tailwind CSS dan Autoprefixer.

### `jsconfig.json`

Mengatur alias import `@/`. Contoh:

```js
import ProductCard from "@/components/ProductCard";
```

Alias tersebut berarti mulai dari root project.

### `.env.example`

Contoh nama environment variable yang diperlukan:

- `NEXT_PUBLIC_SUPABASE_URL`.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

File `.env.local` dipakai saat development dan dikecualikan oleh `.gitignore`. Jangan membagikan isi `.env.local` ke publik. Jika key yang pernah dibagikan adalah key Supabase yang masih aktif, sebaiknya periksa dan rotasi key melalui dashboard Supabase.

### `.gitignore`

Mengecualikan `node_modules`, `.next`, `.env`, dan `.env.local` dari Git.

---

## 15. `supabase/schema.sql`

File ini adalah fondasi database project. Jalankan di SQL Editor Supabase.

### Tabel

- `categories`: nama dan slug kategori.
- `products`: nama, kategori, harga, diskon, stok, status, motif, warna, ukuran, rating, jumlah terjual, dan pola.
- `settings`: satu baris pengaturan toko.
- `profiles`: profil user dan role `admin` atau `customer`.
- `orders`: data pesanan, status, pembayaran, ongkir, total, token akses, dan idempotency key.
- `order_items`: salinan nama produk, harga saat checkout, dan jumlah item.

### Function database

- `set_updated_at`: memperbarui `updated_at` otomatis.
- `handle_new_user`: membuat profil customer ketika user baru mendaftar.
- `is_admin`: mengecek role admin.
- `checkout_create_order`: membuat pesanan secara atomik, memeriksa stok, mengurangi stok, menghitung ongkir, dan menyimpan item.
- `get_order_status`: mengembalikan status pesanan berdasarkan nomor dan token.
- `update_order_status`: mengubah status serta mengembalikan atau mengurangi stok saat pesanan dibatalkan/diaktifkan kembali.

### RLS

Row Level Security mengatur hak akses di tingkat database:

- Publik dapat membaca kategori dan pengaturan.
- Publik hanya dapat melihat produk aktif.
- Hanya admin yang dapat mengubah produk, kategori, diskon, pengaturan, dan membaca pesanan.
- Pesanan tidak dapat dibuat melalui insert tabel langsung; harus melalui function checkout.

### Data awal dan index

Schema juga memasukkan pengaturan, kategori, dan beberapa produk contoh. Index ditambahkan pada kolom yang sering digunakan untuk filter, status, tanggal, token, dan relasi item pesanan.

Jika hanya mengubah template, jangan mengubah schema database.

---

## 16. Alur Data Utama

### Alur membuka toko

1. Browser meminta `/`.
2. `app/layout.js` mengambil kategori dan pengaturan.
3. `app/page.js` membaca filter URL dan mengambil produk aktif.
4. `ProductCard` menampilkan setiap produk.
5. `CartProvider` memulihkan keranjang dari `localStorage`.

### Alur menambah ke keranjang

1. User menekan tombol di `AddToCartButton`.
2. `CartContext.addItem` menambah atau menaikkan jumlah item.
3. State disimpan ke `localStorage`.
4. `CartDrawer` dan `CartButton` otomatis diperbarui.

### Alur checkout

1. User membuka `/checkout`.
2. `CheckoutClient` meminta harga/stok terbaru.
3. User mengisi data pelanggan.
4. `createOrder` memanggil RPC `checkout_create_order`.
5. Database memvalidasi produk, mengunci stok, menghitung total, dan membuat pesanan.
6. Halaman menampilkan nomor pesanan dan link WhatsApp.

### Alur admin

1. Middleware memeriksa sesi pada route `/admin`.
2. Layout dashboard memeriksa user dan role sekali lagi.
3. Halaman admin mengambil data melalui Supabase server client.
4. Form mengirim Server Action.
5. Server Action memvalidasi input dan mengubah database.
6. `revalidatePath` memperbarui cache halaman terkait.

---

## 17. Panduan Edit Berdasarkan Kebutuhan

| Kebutuhan | File utama |
|---|---|
| Ganti warna tema | `app/globals.css`, `tailwind.config.js` |
| Ganti font | `app/layout.js`, `tailwind.config.js` |
| Ganti logo/nama di header | `components/SiteHeader.js` |
| Ganti menu mobile | `components/MobileMenu.js` |
| Ganti kartu produk | `components/ProductCard.js` |
| Ganti motif visual produk | `app/globals.css` dan data `pattern` |
| Ganti filter produk | `components/FilterSidebar.js`, `app/page.js` |
| Ganti layout katalog | `app/page.js` |
| Ganti keranjang | `components/CartDrawer.js`, `CartButton.js`, `CartContext.js` |
| Ganti tampilan checkout | `components/CheckoutClient.js` |
| Ganti tampilan lacak pesanan | `app/lacak/page.js` |
| Ganti footer | `components/SiteFooter.js` |
| Ganti sidebar admin | `app/admin/(dashboard)/layout.js`, `components/AdminNav.js` |
| Ganti form produk | `components/ProductForm.js` |
| Ganti tabel produk admin | `app/admin/(dashboard)/produk/page.js` |
| Ganti pengaturan toko | `app/admin/(dashboard)/pengaturan/page.js` |
| Ganti aturan harga/stok/order | `app/checkout/actions.js`, `supabase/schema.sql` |
| Ganti validasi input | `lib/validate.js` dan action terkait |

---

## 18. Hal Yang Sebaiknya Tidak Diubah Saat Hanya Mengubah Template

Jangan mengubah bagian berikut kecuali memang ingin mengubah perilaku aplikasi:

- Pemanggilan `createOrder` dan RPC checkout.
- Validasi pada `lib/validate.js`.
- `middleware.js` dan pengecekan role admin.
- RLS dan function keamanan di `supabase/schema.sql`.
- Struktur data yang dikirim dari `ProductCard` ke `AddToCartButton`.
- Nama field form yang dibaca oleh Server Action, misalnya `name`, `price`, `stock`, dan `category_id`.
- Key `almas_cart` jika tidak ingin menghilangkan keranjang yang tersimpan.

Saat mengganti tampilan form, pertahankan `name` input dan fungsi submit yang sudah ada.

---

## 19. Cara Menjalankan dan Memeriksa Perubahan

Dari root project:

```bash
npm install
npm run dev
```

Buka `http://localhost:3000` untuk toko dan `http://localhost:3000/admin/login` untuk login admin.

Setelah mengubah template, periksa:

1. Halaman desktop dan mobile.
2. Header, menu mobile, kartu produk, dan footer.
3. Filter dan pagination.
4. Tambah ke keranjang serta checkout.
5. Login admin dan tabel dashboard.
6. Console browser dan terminal development untuk error.

Untuk memeriksa build production:

```bash
npm run build
```

Dokumen ini menjelaskan kondisi source saat ini. Jika struktur atau nama route berubah, dokumentasi ini perlu diperbarui kembali.
