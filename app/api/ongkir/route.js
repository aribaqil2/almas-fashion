import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { destination, weight, courier } = await request.json();

    // Panggil API RajaOngkir / Provider Ekspedisi
    const res = await fetch("https://api.rajaongkir.com/starter/cost", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        key: process.env.RAJAONGKIR_API_KEY, // Simpan API Key di .env
      },
      body: new URLSearchParams({
        origin: "501", // ID Kota Asal Toko Anda (contoh: Yogyakarta)
        destination: destination, // ID Kota Tujuan Pembeli
        weight: weight || 1000, // Berat dalam gram
        courier: courier, // jne, pos, atau tiki
      }),
    });

    const data = await res.json();
    const costs = data.rajaongkir.results[0].costs;

    return NextResponse.json({ success: true, costs });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}