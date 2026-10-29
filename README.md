# Bolang — AI Agent Dashboard for Enterprise Productivity

> Platform manajemen perusahaan berbasis tiga AI Agent yang saling terhubung:
> **Frontline AI** (layanan pelanggan), **SupplyMind** (perencanaan kebutuhan bahan baku),
> dan **DocuSync AI** (pemrosesan dokumen) — didukung marketplace sebagai sumber data transaksi nyata.

## 🎯 Latar Belakang

Perusahaan distribusi baterai menghadapi tiga masalah klasik: layanan pelanggan yang lambat
menanggapi komplain, stok bahan baku yang tidak terpantau sampai terlambat, dan data nota/faktur
vendor yang masuk manual. Bolang menjawab ketiganya dengan tiga AI Agent yang bekerja di atas
satu database yang sama — sehingga data mengalir dari pelanggan → analisis → keputusan tanpa
input ulang.

## 🤖 Fitur Utama

### Frontline AI — Customer Service Triage
- Daftar percakapan pelanggan real-time dari database, dikelompokkan per sesi.
- Pemilah percakapan berdasarkan 3 kategori: Informasi Produk & Estimasi,
  Ubah Data atau Kendala Pesanan, dan Laporan Masalah Pengiriman & Barang Rusak.
- Analisis otomatis: kategori, prioritas, sentimen, ringkasan, dan draf balasan
  yang siap digunakan admin dalam satu klik.

### SupplyMind — AI PPIC & MRP Analytics
- Grafik stok bahan baku dari database dengan skala dinamis (menyesuaikan nilai tertinggi).
- AI Insights: deteksi otomatis bahan baku di bawah batas aman + perhitungan kekurangan.
- Analisis Ulang Stok: memicu AI Agent memproses ulang data stok terbaru via n8n.
- Ajukan ke Finance: mengirim rekomendasi pengadaan ke workflow n8n untuk disetujui finance.

### DocuSync AI — OCR & Document Processing
- Zona drag & drop unggah faktur/nota vendor (PDF/PNG/JPG, maks 5 MB).
- File dikirim ke workflow n8n (DataFlow AI) untuk diekstraksi via Vision LLM.
- Status pemrosesan terlacak per dokumen (`processing` → `done`/`error`) di database.
- History Chat interaktif menampilkan riwayat unggahan dan hasil ekstraksi.

### Marketplace — Sumber Data Nyata
- Login/register, katalog produk, keranjang, dan checkout yang menulis ke database.
- Widget chat Frontline AI: pelanggan memilih kategori kendala sebelum bercakap,
  lengkap dengan lampiran foto untuk komplain barang rusak.
- Setiap transaksi dan chat langsung menjadi data hidup untuk ketiga AI Agent.

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Chart | Recharts |
| Otomasi | n8n Webhook (AI Agent workflows) |

## Struktur Database

| Tabel | Fungsi |
|---|---|
| `raw_materials` | Stok bahan baku — sumber grafik & analisis SupplyMind |
| `customer_chats` | Percakapan pelanggan (nama, kategori, pertanyaan) |
| `doc_processing_runs` | Riwayat pemrosesan dokumen & hasil ekstraksi |
| `orders` / `order_items` | Transaksi marketplace |
| `products` | Katalog produk marketplace |

## Struktur Proyek

app/
  (auth)/            → login & register
  (shop)/            → marketplace (katalog, keranjang, chat widget)
  (dashboard)/
    frontline-ai/    → Frontline AI
    supplymind/      → SupplyMind + Server Actions
    docusync/        → DocuSync AI + Server Actions
components/
  dashboard/         → sidebar, recent sale card
  shop/              → chat widget, katalog, keranjang
scripts/             → skrip verifikasi koneksi database

# Nama Tim 

| Nama | Peran |
|---|---|
| Abdurrahman Yazka | peran |
| Azzam Ramadhan Zaidansyah | peran |
| Zahra Aulia | peran |