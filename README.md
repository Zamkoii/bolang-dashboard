# Bolang Dashboard

Dashboard Next.js (App Router, TypeScript, Tailwind CSS v4) dari desain pen.dev:
sidebar tetap di kiri, panel kanan berganti sesuai menu.

| Menu | URL | File |
|---|---|---|
| Frontline AI | `/frontline-ai` | `app/(dashboard)/frontline-ai/page.tsx` |
| SupplyMind | `/supplymind` | `app/(dashboard)/supplymind/page.tsx` |
| DocuSync AI | `/docusync-ai` | `app/(dashboard)/docusync-ai/page.tsx` + `components/DocuSyncChat.tsx` |

`/` otomatis diarahkan ke `/frontline-ai`.

## Menjalankan

Butuh Node.js LTS terbaru.

```bash
npm install
npm run dev
```

Buka http://localhost:3000. Untuk produksi: `npm run build && npm start`.

## Struktur

```
app/
  layout.tsx            font (Inter + Baloo 2), metadata
  globals.css           warna tema (sidebar, canvas, line)
  page.tsx              redirect ke /frontline-ai
  (dashboard)/
    layout.tsx          sidebar + panel kanan
    frontline-ai/ supplymind/ docusync-ai/
components/
  Sidebar.tsx           menu + kartu dekoratif (menu aktif dari URL)
  Breadcrumb.tsx
  DocuSyncChat.tsx      dropzone, history chat, input (client component)
```

## Menyambungkan data

- **Frontline AI**: ganti array `CONVERSATIONS` dengan data dari API/database.
- **SupplyMind**: ganti array `STOCKS`. Tinggi bar dihitung dari `PX_PER_UNIT`.
- **DocuSync AI**: pada `addUserMessage` di `DocuSyncChat.tsx` ada `TODO` untuk
  mengirim pesan/file ke API AI Agent Anda dan menambahkan balasan bot.

## Catatan

- Font logo "Bolang" memakai **Baloo 2** sebagai pendekatan. Jika desain Anda
  memakai font lain, ubah di `app/layout.tsx`.
- Nilai warna dan ukuran diambil dari screenshot desain, jadi bisa berbeda
  1-2 px atau beberapa tingkat warna dari file aslinya di pen.dev.
