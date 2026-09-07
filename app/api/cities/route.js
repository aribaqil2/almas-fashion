import { NextResponse } from "next/server";

const CITIES = [
  { city_id: "105", city_name: "Cilacap", type: "Kabupaten", province: "Jawa Tengah" },
  { city_id: "385", city_name: "Banyumas / Purwokerto", type: "Kabupaten", province: "Jawa Tengah" },
  { city_id: "399", city_name: "Semarang", type: "Kota", province: "Jawa Tengah" },
  { city_id: "398", city_name: "Surakarta / Solo", type: "Kota", province: "Jawa Tengah" },
  { city_id: "501", city_name: "Yogyakarta / Sleman / Bantul", type: "Kota", province: "DI Yogyakarta" },
  { city_id: "386", city_name: "Pekalongan", type: "Kota", province: "Jawa Tengah" },
  { city_id: "387", city_name: "Tegal", type: "Kota", province: "Jawa Tengah" },
  { city_id: "388", city_name: "Magelang", type: "Kota", province: "Jawa Tengah" },
  { city_id: "152", city_name: "Jakarta (Semua Wilayah)", type: "Kota", province: "DKI Jakarta" },
  { city_id: "153", city_name: "Tangerang / Tangerang Selatan", type: "Kota", province: "Banten" },
  { city_id: "23", city_name: "Bandung", type: "Kota", province: "Jawa Barat" },
  { city_id: "24", city_name: "Bekasi", type: "Kota", province: "Jawa Barat" },
  { city_id: "25", city_name: "Bogor", type: "Kota", province: "Jawa Barat" },
  { city_id: "26", city_name: "Depok", type: "Kota", province: "Jawa Barat" },
  { city_id: "444", city_name: "Surabaya", type: "Kota", province: "Jawa Timur" },
  { city_id: "445", city_name: "Malang", type: "Kota", province: "Jawa Timur" },
  { city_id: "281", city_name: "Denpasar / Badung", type: "Kota", province: "Bali" },
  { city_id: "278", city_name: "Medan", type: "Kota", province: "Sumatera Utara" },
  { city_id: "279", city_name: "Palembang", type: "Kota", province: "Sumatera Selatan" },
  { city_id: "280", city_name: "Makassar", type: "Kota", province: "Sulawesi Selatan" },
  { city_id: "282", city_name: "Balikpapan / Samarinda", type: "Kota", province: "Kalimantan Timur" }
];

export async function GET() {
  return NextResponse.json(CITIES);
}