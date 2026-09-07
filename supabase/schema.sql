-- Almas Fashion — skema database Supabase (Postgres)
-- Cara pakai: buka proyek Supabase kamu > SQL Editor > tempel seluruh isi
-- file ini > Run. Aman dijalankan berulang kali (idempoten), baik di
-- proyek baru maupun di proyek yang sudah pernah menjalankan versi lama.
--
-- Skema ini disusun mengikuti runtutan kebutuhan aplikasi:
--   1. Storefront (/)                -> baca categories + products (filter warna/motif/ukuran/harga, sort, paginasi)
--   2. Keranjang & checkout          -> baca harga/stok terbaru, lalu buat order via RPC checkout_create_order()
--   3. Ongkir (/api/cities,/ongkir)  -> kota tujuan + kurir dipilih pembeli, lalu disimpan di orders
--   4. Lacak pesanan (/lacak)        -> RPC get_order_status(order_number, access_token)
--   5. Admin produk                  -> CRUD products termasuk foto (Supabase Storage bucket "products")
--   6. Admin kategori/diskon/setting -> CRUD categories, bulk update discount_percent, settings baris tunggal
--   7. Admin pesanan                 -> baca orders/order_items, ubah status via RPC update_order_status()

-- ============================================================
-- 0. EXTENSION & SEARCH PATH
-- ============================================================
-- PENTING: di Supabase, extension TIDAK dipasang di schema `public` tapi di
-- schema khusus bernama `extensions`. Jadi function seperti gen_random_bytes()
-- dan operator class seperti gin_trgm_ops hanya terlihat kalau `extensions`
-- ada di search_path. Kalau lupa, gejalanya:
--   ERROR 42883: function gen_random_bytes(integer) does not exist
-- muncul saat aplikasi memanggil RPC — padahal file ini jalan mulus di SQL
-- Editor (sesi SQL Editor kebetulan sudah punya `extensions` di search_path).
--
-- Dua pengamanan dipakai di file ini:
--   1. `set search_path` di bawah — supaya DDL di file ini (default kolom,
--      operator class index) bisa me-resolve nama dari schema extensions.
--   2. Setiap function di bawah memakai `set search_path = public, extensions`
--      supaya saat DIJALANKAN dari aplikasi pun nama-nama itu tetap ketemu.
set search_path = public, extensions;

-- pg_trgm: index untuk pencarian nama produk `ilike '%kata%'` di storefront.
-- pgcrypto: tidak wajib lagi (gen_random_uuid() sudah bawaan Postgres 13+),
-- tetap dipasang untuk kompatibilitas proyek lama.
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ============================================================
-- 1. TABEL
-- ============================================================

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references categories(id) on delete set null,
  price numeric not null default 0,
  discount_percent numeric not null default 0 check (discount_percent >= 0 and discount_percent <= 90),
  stock integer not null default 0 check (stock >= 0),
  stock_by_size jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'draft')),
  motif text,
  color text,
  description text,
  sizes text[] not null default '{}',
  -- pattern = pola latar CSS yang dipakai ProductCard kalau produk belum
  -- punya foto (fallback), lihat components/ProductCard.js.
  pattern text not null default 'm1',
  -- image_url = URL publik foto produk hasil upload ke Storage bucket
  -- "products" (lihat components/ProductForm.js). Boleh null: produk tanpa
  -- foto tetap tampil memakai `pattern` di atas.
  image_url text,
  rating numeric not null default 4.5,
  sold integer not null default 0,
  is_new boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists settings (
  id integer primary key default 1,
  store_name text not null default 'Almas Fashion',
  whatsapp text not null default '',
  free_shipping_min numeric not null default 300000,
  promo_text text not null default 'Gratis ongkir se-Jawa untuk belanja min.',
  constraint single_row check (id = 1)
);

-- Setiap user Supabase Auth punya baris profil dengan role.
-- role 'admin' = boleh kelola produk/kategori/diskon/pengaturan/pesanan.
-- role 'customer' = default untuk akun baru yang mendaftar.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'customer' check (role in ('admin', 'customer')),
  created_at timestamptz not null default now()
);

-- Pesanan checkout. Model "konfirmasi manual" (transfer/COD + follow-up
-- WhatsApp) — belum terhubung payment gateway.
-- Semua insert ke tabel ini WAJIB lewat function checkout_create_order()
-- di bawah — bukan insert langsung dari client — supaya harga, stok,
-- ongkir, dan total selalu dihitung server dan tidak bisa dipalsukan.
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'diproses', 'dikirim', 'selesai', 'dibatalkan')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'refunded')),
  subtotal numeric not null default 0,
  shipping_cost numeric not null default 0,
  total numeric not null default 0,
  -- Tujuan pengiriman yang dipilih pembeli di halaman checkout
  -- (app/api/cities/route.js + app/api/ongkir/route.js). Disimpan supaya
  -- admin tahu harus kirim ke kota mana dan pakai kurir apa.
  shipping_city_id text,
  shipping_courier text,
  access_token text not null unique default translate(gen_random_uuid()::text, '-', ''),
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  -- product_name & price disimpan ulang (snapshot) supaya riwayat pesanan
  -- tidak berubah kalau produknya nanti diganti nama/harga atau dihapus.
  product_name text not null,
  price numeric not null,
  qty integer not null check (qty > 0)
);

-- ============================================================
-- 2. MIGRASI AMAN UNTUK DATABASE YANG SUDAH ADA
-- ============================================================
-- Menambah kolom baru tanpa menghapus data yang sudah tersimpan.
alter table products add column if not exists image_url text;
alter table products add column if not exists description text;
alter table products add column if not exists stock_by_size jsonb not null default '{}'::jsonb;

alter table orders add column if not exists payment_status text not null default 'unpaid';
alter table orders add column if not exists shipping_cost numeric not null default 0;
alter table orders add column if not exists total numeric not null default 0;
alter table orders add column if not exists shipping_city_id text;
alter table orders add column if not exists shipping_courier text;
alter table orders add column if not exists access_token text unique default translate(gen_random_uuid()::text, '-', '');
alter table orders add column if not exists idempotency_key text;

-- `add column if not exists` tidak mengubah kolom yang sudah ada, jadi default
-- lamanya (encode(gen_random_bytes(16),'hex') — bergantung pgcrypto) perlu
-- diganti eksplisit ke versi tanpa extension.
alter table orders alter column access_token
  set default translate(gen_random_uuid()::text, '-', '');

update orders set total = subtotal + coalesce(shipping_cost, 0) where total = 0 and subtotal > 0;

-- `pattern` dibatasi ke m1..m6 sesuai pilihan di components/ProductForm.js.
-- `not valid` = baris lama tidak diperiksa ulang, jadi migrasi tidak gagal
-- kalau ada data lama di luar daftar; baris baru tetap divalidasi.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_pattern_check') then
    alter table products add constraint products_pattern_check
      check (pattern in ('m1', 'm2', 'm3', 'm4', 'm5', 'm6')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_shipping_cost_check') then
    alter table orders add constraint orders_shipping_cost_check
      check (shipping_cost >= 0 and shipping_cost <= 500000) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_shipping_courier_check') then
    alter table orders add constraint orders_shipping_courier_check
      check (shipping_courier is null or shipping_courier in ('jne', 'pos', 'tiki')) not valid;
  end if;
end $$;

-- ============================================================
-- 3. KOLOM ALIAS UNTUK HALAMAN ADMIN PESANAN
-- ============================================================
-- Halaman app/admin/(dashboard)/pesanan/[id]/page.js membaca
-- `order.shipping_address` dan `order.total_amount`, sedangkan kolom
-- kanoniknya bernama `customer_address` dan `total`. Tanpa alias ini
-- alamat tampil kosong dan Total selalu "Rp0".
--
-- Dibuat sebagai GENERATED COLUMN (read-only, selalu ikut nilai kolom
-- aslinya) supaya tetap ada SATU sumber kebenaran — tidak ada risiko dua
-- kolom berisi angka berbeda seperti kalau kolomnya diduplikasi manual.
alter table orders add column if not exists shipping_address text
  generated always as (customer_address) stored;
alter table orders add column if not exists total_amount numeric
  generated always as (total) stored;

-- ============================================================
-- 4. AUTO-UPDATE updated_at
-- ============================================================
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at
  before update on products
  for each row execute function set_updated_at();

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- ============================================================
-- 5. AUTO-CREATE PROFILE saat ada user baru daftar
-- ============================================================
-- Dipakai oleh tab "Daftar" di /admin/login (app/admin/login/actions.js).
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Lengkapi profil untuk user yang sudah terdaftar sebelum trigger ini ada.
insert into profiles (id, email, role)
select u.id, u.email, 'customer' from auth.users u
on conflict (id) do nothing;

-- ============================================================
-- 6. HELPER: cek apakah user yang sedang login adalah admin
-- ============================================================
create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public, extensions
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- 7. CHECKOUT ATOMIK (mencegah race condition stok & order setengah jadi)
-- ============================================================
-- Semua langkah checkout — validasi, kunci baris stok, insert order,
-- insert item, kurangi stok, tambah sold, hitung ongkir — terjadi dalam
-- SATU transaksi database. Kalau ada langkah manapun gagal (stok kurang,
-- produk nonaktif, dsb), seluruh transaksi dibatalkan otomatis (rollback)
-- dan tidak ada baris yang tersimpan sama sekali — tidak ada order
-- "setengah jadi". `for update` mengunci baris produk yang sedang dicek
-- sehingga dua checkout bersamaan tidak bisa sama-sama lolos validasi
-- stok yang sama.
--
-- PENTING — kenapa client hanya boleh mengirim {product_id, qty}:
-- harga tiap item dihitung ULANG di sini dari products.price dan
-- products.discount_percent, dan subtotal/total dihitung dari hasil itu.
-- Jadi pembeli tidak bisa mengirim harga palsu. Satu-satunya angka dari
-- client adalah ongkir (p_shipping_cost, hasil pilihan kota/kurir), dan
-- itu pun dibatasi check constraint 0..500000 serta digratiskan otomatis
-- kalau subtotal sudah melewati settings.free_shipping_min.

-- Hapus semua varian signature lama supaya tidak tertinggal sebagai
-- function overload yang membingungkan (Postgres membedakan function
-- berdasarkan daftar parameternya, bukan hanya namanya).
drop function if exists checkout_create_order(text, text, text, text, jsonb);
drop function if exists checkout_create_order(text, text, text, text, jsonb, text);

create or replace function checkout_create_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text,
  p_notes text,
  p_items jsonb,
  p_shipping_cost numeric default 0,
  p_idempotency_key text default null,
  p_shipping_city_id text default null,
  p_shipping_courier text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_access_token text;
  v_item jsonb;
  v_product products%rowtype;
  v_qty integer;
  v_price numeric;
  v_subtotal numeric := 0;
  v_shipping numeric := 0;
  v_free_min numeric;
  v_courier text;
  v_items_out jsonb := '[]'::jsonb;
  v_item_count integer;
  v_existing jsonb;
begin
  -- idempotency: kalau request yang sama (klik ganda / retry jaringan)
  -- sudah pernah tersimpan, kembalikan hasil yang sama tanpa membuat
  -- order baru.
  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    select jsonb_build_object(
      'order_id', o.id,
      'order_number', o.order_number,
      'access_token', o.access_token,
      'subtotal', o.subtotal,
      'shipping_cost', o.shipping_cost,
      'total', o.total,
      'items', coalesce((
        select jsonb_agg(jsonb_build_object(
          'product_id', oi.product_id, 'product_name', oi.product_name,
          'price', oi.price, 'qty', oi.qty
        )) from order_items oi where oi.order_id = o.id
      ), '[]'::jsonb)
    ) into v_existing
    from orders o where o.idempotency_key = p_idempotency_key
    limit 1;
    if v_existing is not null then
      return v_existing;
    end if;
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'CART_EMPTY';
  end if;
  v_item_count := jsonb_array_length(p_items);
  if v_item_count = 0 or v_item_count > 50 then
    raise exception 'INVALID_ITEM_COUNT';
  end if;

  if p_customer_name is null or length(trim(p_customer_name)) = 0 or length(p_customer_name) > 200 then
    raise exception 'INVALID_NAME';
  end if;
  if p_customer_phone is null or length(regexp_replace(p_customer_phone, '[^0-9]', '', 'g')) < 8
     or length(p_customer_phone) > 30 then
    raise exception 'INVALID_PHONE';
  end if;
  if p_customer_address is null or length(trim(p_customer_address)) = 0 or length(p_customer_address) > 500 then
    raise exception 'INVALID_ADDRESS';
  end if;
  if p_notes is not null and length(p_notes) > 500 then
    raise exception 'NOTES_TOO_LONG';
  end if;

  -- Kurir di luar daftar yang didukung /api/ongkir disimpan sebagai null
  -- daripada menggagalkan checkout — data pengiriman bisa dilengkapi admin.
  v_courier := lower(nullif(trim(coalesce(p_shipping_courier, '')), ''));
  if v_courier is not null and v_courier not in ('jne', 'pos', 'tiki') then
    v_courier := null;
  end if;

  -- anti-spam ringan: tolak jika nomor HP yang sama baru saja checkout
  -- kurang dari 60 detik lalu. Untuk trafik besar, ganti dengan rate
  -- limiter di edge (Upstash/Redis) + CAPTCHA — lihat README.
  if exists (
    select 1 from orders
    where customer_phone = trim(p_customer_phone)
      and created_at > now() - interval '60 seconds'
  ) then
    raise exception 'RATE_LIMITED';
  end if;

  -- Nomor pesanan: tanggal (mudah dibaca manusia) + 6 hex acak. Kalau
  -- toh bentrok, unique constraint akan menolak dan transaksi rollback —
  -- pembeli tinggal mengulang, tidak ada data rusak.
  v_order_number := 'ALM-' || to_char(now(), 'YYMMDD') || '-' ||
                    upper(substr(translate(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into orders (
    order_number, customer_name, customer_phone, customer_address, notes,
    shipping_city_id, shipping_courier, idempotency_key
  )
  values (
    v_order_number, trim(p_customer_name), trim(p_customer_phone), trim(p_customer_address),
    nullif(trim(coalesce(p_notes, '')), ''),
    nullif(trim(coalesce(p_shipping_city_id, '')), ''), v_courier,
    nullif(trim(coalesce(p_idempotency_key, '')), '')
  )
  returning id, access_token into v_order_id, v_access_token;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    if not (v_item ? 'product_id') or not (v_item ? 'qty') then
      raise exception 'INVALID_ITEM_SHAPE';
    end if;

    begin
      v_qty := (v_item->>'qty')::integer;
    exception when others then
      raise exception 'INVALID_QTY';
    end;
    if v_qty is null or v_qty <= 0 or v_qty > 100 then
      raise exception 'INVALID_QTY';
    end if;

    -- `for update` mengunci baris ini sampai transaksi selesai — checkout
    -- lain yang mencoba produk yang sama harus menunggu giliran, sehingga
    -- validasi stok tidak bisa "dilewati bersamaan" oleh dua pembeli.
    select * into v_product from products
      where id = (v_item->>'product_id')::uuid
      for update;

    if not found then
      raise exception 'PRODUCT_NOT_FOUND';
    end if;
    if v_product.status <> 'active' then
      raise exception 'PRODUCT_INACTIVE: %', v_product.name;
    end if;
    if v_product.stock < v_qty then
      raise exception 'INSUFFICIENT_STOCK: %', v_product.name;
    end if;

    v_price := round(v_product.price * (1 - coalesce(v_product.discount_percent, 0) / 100.0));

    update products
      set stock = stock - v_qty, sold = sold + v_qty
      where id = v_product.id;

    insert into order_items (order_id, product_id, product_name, price, qty)
    values (v_order_id, v_product.id, v_product.name, v_price, v_qty);

    v_subtotal := v_subtotal + (v_price * v_qty);
    v_items_out := v_items_out || jsonb_build_object(
      'product_id', v_product.id, 'product_name', v_product.name, 'price', v_price, 'qty', v_qty
    );
  end loop;

  -- Ongkir: pakai angka dari pilihan kota/kurir pembeli, dibatasi rentang
  -- yang wajar, lalu digratiskan kalau subtotal sudah memenuhi minimum
  -- gratis ongkir yang dijanjikan di banner promo (settings.promo_text).
  v_shipping := least(greatest(coalesce(p_shipping_cost, 0), 0), 500000);
  select free_shipping_min into v_free_min from settings where id = 1;
  if v_free_min is not null and v_subtotal >= v_free_min then
    v_shipping := 0;
  end if;

  update orders
    set subtotal = v_subtotal, shipping_cost = v_shipping, total = v_subtotal + v_shipping
    where id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'access_token', v_access_token,
    'subtotal', v_subtotal,
    'shipping_cost', v_shipping,
    'total', v_subtotal + v_shipping,
    'items', v_items_out
  );
end;
$$;

-- Dipanggil dari halaman pelacakan pesanan publik (/lacak). Hanya
-- mengembalikan data jika order_number DAN access_token cocok persis —
-- access_token adalah string acak yang tidak bisa ditebak, jadi ini aman
-- dipakai tanpa login selama link/token-nya dijaga pembeli.
create or replace function get_order_status(p_order_number text, p_access_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_order orders%rowtype;
  v_items jsonb;
begin
  if p_order_number is null or p_access_token is null then
    return null;
  end if;

  select * into v_order from orders
    where order_number = trim(p_order_number) and access_token = trim(p_access_token);

  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'product_name', product_name, 'price', price, 'qty', qty
  )), '[]'::jsonb) into v_items
  from order_items where order_id = v_order.id;

  return jsonb_build_object(
    'order_number', v_order.order_number,
    'status', v_order.status,
    'payment_status', v_order.payment_status,
    'customer_name', v_order.customer_name,
    'subtotal', v_order.subtotal,
    'shipping_cost', v_order.shipping_cost,
    'total', v_order.total,
    'shipping_courier', v_order.shipping_courier,
    'created_at', v_order.created_at,
    'items', v_items
  );
end;
$$;

grant execute on function checkout_create_order(text, text, text, text, jsonb, numeric, text, text, text) to anon, authenticated;
grant execute on function get_order_status(text, text) to anon, authenticated;

-- Dipanggil dari admin saat mengubah status pesanan. Kalau status baru
-- 'dibatalkan' (dan sebelumnya bukan dibatalkan), stok dikembalikan dan
-- `sold` dikurangi lagi — supaya angka stok/terjual tetap akurat, bukan
-- cuma menghapus baris order-nya. Kalau pesanan yang tadinya dibatalkan
-- diaktifkan lagi, stok dicoba dikurangi ulang (bisa gagal kalau stok
-- sudah tidak cukup — itu perilaku yang benar, bukan bug).
--
-- Catatan konsistensi: logika ini hanya benar kalau stok memang sudah
-- dikurangi saat pesanan dibuat. Itulah sebabnya checkout WAJIB lewat
-- checkout_create_order() dan bukan insert langsung ke tabel orders.
create or replace function update_order_status(p_order_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_current_status text;
  v_item record;
begin
  if not is_admin() then
    raise exception 'NOT_AUTHORIZED';
  end if;

  if p_status not in ('pending', 'diproses', 'dikirim', 'selesai', 'dibatalkan') then
    raise exception 'INVALID_STATUS';
  end if;

  select status into v_current_status from orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_current_status = p_status then
    return; -- tidak ada perubahan
  end if;

  if p_status = 'dibatalkan' and v_current_status <> 'dibatalkan' then
    for v_item in select product_id, qty from order_items where order_id = p_order_id and product_id is not null
    loop
      update products set stock = stock + v_item.qty, sold = greatest(0, sold - v_item.qty) where id = v_item.product_id;
    end loop;
  elsif v_current_status = 'dibatalkan' and p_status <> 'dibatalkan' then
    -- Kunci dulu semua produk terkait, baru periksa, baru kurangi —
    -- supaya tidak ada checkout lain yang menyelip di antara pemeriksaan
    -- dan pengurangan stok.
    for v_item in
      select oi.product_id, oi.qty, p.stock
      from order_items oi join products p on p.id = oi.product_id
      where oi.order_id = p_order_id
      order by oi.product_id
      for update of p
    loop
      if v_item.stock < v_item.qty then
        raise exception 'INSUFFICIENT_STOCK';
      end if;
      update products set stock = stock - v_item.qty, sold = sold + v_item.qty where id = v_item.product_id;
    end loop;
  end if;

  update orders set status = p_status where id = p_order_id;
end;
$$;

grant execute on function update_order_status(uuid, text) to authenticated;

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================
alter table categories enable row level security;
alter table products enable row level security;
alter table settings enable row level security;
alter table profiles enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- categories: publik boleh baca, hanya admin boleh ubah
drop policy if exists "categories_public_read" on categories;
create policy "categories_public_read" on categories for select using (true);
drop policy if exists "categories_admin_write" on categories;
create policy "categories_admin_write" on categories for all using (is_admin()) with check (is_admin());

-- products: publik hanya lihat yang 'active', admin lihat & ubah semua
drop policy if exists "products_public_read_active" on products;
create policy "products_public_read_active" on products for select using (status = 'active' or is_admin());
drop policy if exists "products_admin_write" on products;
create policy "products_admin_write" on products for all using (is_admin()) with check (is_admin());

-- settings: publik boleh baca, hanya admin boleh ubah
drop policy if exists "settings_public_read" on settings;
create policy "settings_public_read" on settings for select using (true);
drop policy if exists "settings_admin_write" on settings;
create policy "settings_admin_write" on settings for all using (is_admin()) with check (is_admin());

-- profiles: user boleh baca profilnya sendiri, admin boleh baca semua
drop policy if exists "profiles_read_own" on profiles;
create policy "profiles_read_own" on profiles for select using (auth.uid() = id or is_admin());
drop policy if exists "profiles_admin_update" on profiles;
create policy "profiles_admin_update" on profiles for update using (is_admin()) with check (is_admin());

-- orders / order_items: TIDAK ADA policy insert publik di sini secara
-- sengaja. Satu-satunya cara membuat pesanan adalah lewat function
-- checkout_create_order() di atas (SECURITY DEFINER, jadi ia melewati
-- RLS dari dalam function itu sendiri). Ini menutup celah "insert order
-- dengan harga/total palsu langsung ke API Supabase" — permintaan insert
-- langsung ke tabel ini akan ditolak RLS, baik dari anon maupun user
-- biasa. Pembeli membaca pesanannya sendiri lewat get_order_status()
-- (butuh access_token), bukan lewat policy select.
drop policy if exists "orders_public_insert" on orders;
drop policy if exists "orders_admin_read" on orders;
create policy "orders_admin_read" on orders for select using (is_admin());
drop policy if exists "orders_admin_update" on orders;
create policy "orders_admin_update" on orders for update using (is_admin()) with check (is_admin());

drop policy if exists "order_items_public_insert" on order_items;
drop policy if exists "order_items_admin_read" on order_items;
create policy "order_items_admin_read" on order_items for select using (is_admin());

-- ============================================================
-- 9. STORAGE: BUCKET FOTO PRODUK
-- ============================================================
-- components/ProductForm.js mengunggah foto ke bucket "products" lalu
-- memanggil getPublicUrl(), jadi bucket-nya harus ada DAN public.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Siapa saja boleh melihat foto (dipakai <img> di storefront), tapi hanya
-- admin yang boleh mengunggah/mengganti/menghapus.
--
-- Kalau blok ini gagal dengan "must be owner of table objects" (terjadi di
-- sebagian proyek Supabase), lewati saja bagian policy ini dan buat empat
-- policy yang sama lewat Dashboard > Storage > products > Policies.
-- Bucket-nya sendiri (perintah insert di atas) tetap berhasil.
drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'products');

drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert" on storage.objects
  for insert with check (bucket_id = 'products' and is_admin());

drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update" on storage.objects
  for update using (bucket_id = 'products' and is_admin())
  with check (bucket_id = 'products' and is_admin());

drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'products' and is_admin());

-- ============================================================
-- 10. INDEX (kinerja query saat data membesar)
-- ============================================================
-- Storefront (app/page.js) memfilter status + category_id + price, lalu
-- mengurutkan berdasarkan sold / rating / created_at / price.
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_status on products(status);
create index if not exists idx_products_active_sold on products(status, sold desc);
create index if not exists idx_products_active_price on products(status, price);
create index if not exists idx_products_active_rating on products(status, rating desc);
create index if not exists idx_products_active_created on products(status, created_at desc);
-- Filter sidebar: warna & motif (`in`), ukuran (`overlaps` pada array).
create index if not exists idx_products_color on products(color);
create index if not exists idx_products_motif on products(motif);
create index if not exists idx_products_sizes on products using gin (sizes);
-- Pencarian nama `ilike '%kata%'` — butuh index trigram, index B-tree biasa
-- tidak terpakai untuk pola yang diawali wildcard.
create index if not exists idx_products_name_trgm on products using gin (name gin_trgm_ops);

create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created_at on orders(created_at desc);
create index if not exists idx_orders_status_created on orders(status, created_at desc);
create index if not exists idx_orders_access_token on orders(access_token);
create index if not exists idx_orders_order_number on orders(order_number);
create index if not exists idx_orders_idempotency on orders(idempotency_key);
-- Dipakai pemeriksaan anti-spam 60 detik di checkout_create_order().
create index if not exists idx_orders_phone_created on orders(customer_phone, created_at desc);

create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_order_items_product on order_items(product_id);

-- ============================================================
-- 11. DATA AWAL (pengaturan, kategori, produk contoh)
-- ============================================================
insert into settings (id, store_name, whatsapp, free_shipping_min, promo_text)
values (1, 'Almas Fashion', '628112647167', 300000, 'Gratis ongkir se-Jawa untuk belanja min.')
on conflict (id) do nothing;

insert into categories (name, slug) values
  ('Blouse', 'blouse'),
  ('Dress', 'dress'),
  ('Outerwear', 'outerwear'),
  ('Busana Muslim', 'busana-muslim'),
  ('Rok', 'rok')
on conflict (slug) do nothing;

-- Produk contoh untuk SEMUA kategori — sebelumnya hanya 'blouse' yang
-- terisi, sehingga memilih kategori lain di FilterSidebar selalu tampil
-- "tidak ada produk". Warna & motif contoh sengaja dipilih dari daftar
-- pilihan di components/FilterSidebar.js supaya filternya benar-benar
-- menghasilkan sesuatu.
--
-- `where not exists (select 1 from products)` = seed hanya jalan di
-- database yang masih kosong, jadi menjalankan ulang file ini tidak
-- menduplikasi katalog dan tidak menimpa produk asli kamu.
insert into products (name, category_id, price, discount_percent, stock, status, motif, color, sizes, pattern, rating, sold, is_new)
select v.name, c.id, v.price, v.discount_percent, v.stock, 'active', v.motif, v.color, v.sizes, v.pattern, v.rating, v.sold, v.is_new
from (values
  -- Blouse
  ('blouse',        'Blouse Parang Senja',        259000, 0,  24, 'Parang',       'Plum',       array['S','M','L'],        'm1', 4.8, 214, true),
  ('blouse',        'Blouse Kawung Larasati',     349000, 20, 15, 'Kawung',       'Cokelat',    array['M','L','XL'],       'm2', 4.6, 187, false),
  ('blouse',        'Blouse Ceplok Kartika',      239000, 0,  40, 'Ceplok',       'Emas',       array['S','M','L','XL'],   'm3', 4.9, 302, false),
  ('blouse',        'Blouse Mega Mendung Biru',   299000, 0,  8,  'Mega Mendung', 'Krem',       array['S','M'],            'm4', 4.5, 96,  true),
  ('blouse',        'Blouse Sekar Jagad',         389000, 19, 12, 'Parang',       'Merah Bata', array['M','L','XL','XXL'], 'm5', 4.7, 158, false),
  ('blouse',        'Blouse Truntum Ayu',         249000, 0,  30, 'Kawung',       'Plum',       array['S','M','L'],        'm6', 4.4, 74,  false),
  -- Dress
  ('dress',         'Dress Parang Kencana',       399000, 0,  18, 'Parang',       'Cokelat',    array['S','M','L'],        'm1', 4.7, 121, true),
  ('dress',         'Dress Kawung Anggun',        359000, 15, 10, 'Kawung',       'Plum',       array['M','L','XL'],       'm2', 4.6, 88,  false),
  ('dress',         'Dress Mega Mendung Lestari', 289000, 0,  22, 'Mega Mendung', 'Krem',       array['S','M','L','XL'],   'm3', 4.5, 64,  false),
  -- Outerwear
  ('outerwear',     'Outer Ceplok Nirmala',       329000, 0,  14, 'Ceplok',       'Emas',       array['M','L','XL'],       'm4', 4.6, 57,  true),
  ('outerwear',     'Outer Parang Wastra',        375000, 10, 9,  'Parang',       'Merah Bata', array['S','M','L'],        'm5', 4.8, 103, false),
  -- Busana Muslim
  ('busana-muslim', 'Gamis Kawung Salima',        385000, 0,  20, 'Kawung',       'Cokelat',    array['M','L','XL','XXL'], 'm6', 4.9, 176, true),
  ('busana-muslim', 'Tunik Mega Mendung Nafisa',  265000, 12, 26, 'Mega Mendung', 'Krem',       array['S','M','L'],        'm1', 4.5, 92,  false),
  -- Rok
  ('rok',           'Rok Plisket Ceplok Ratih',   215000, 0,  35, 'Ceplok',       'Plum',       array['S','M','L','XL'],   'm2', 4.4, 141, false),
  ('rok',           'Rok Lilit Parang Ndalem',    239000, 0,  16, 'Parang',       'Emas',       array['M','L'],            'm3', 4.6, 68,  true)
) as v(cat_slug, name, price, discount_percent, stock, motif, color, sizes, pattern, rating, sold, is_new)
join categories c on c.slug = v.cat_slug
where not exists (select 1 from products);

-- ============================================================
-- 12. CARA MENJADIKAN AKUN SEBAGAI ADMIN
-- ============================================================
-- 1) Daftar akun dulu lewat halaman /admin/login (tab "Daftar") atau
--    lewat Supabase Dashboard > Authentication > Users > Add user.
-- 2) Jalankan query berikut, ganti email sesuai akun kamu:
--
--    update profiles set role = 'admin' where email = 'kamu@email.com';
--
-- 3) Logout lalu login lagi supaya sesi membawa role yang baru.
