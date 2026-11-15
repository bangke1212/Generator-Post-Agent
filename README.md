# PostPilot — AI Post Studio

Dashboard untuk membuat draft dan mempublikasikan post ke X menggunakan Xingchi API. Dibangun dengan React, Vite, TypeScript, dan Netlify Functions.

## Fitur
- Generator satu post dan multi-ide dengan pilihan tone/bahasa.
- Riwayat draft tersimpan lokal di browser.
- Panggilan Xingchi dilakukan dari Netlify Function; API key tidak dikirim ke browser.
- Publikasi langsung ke X melalui endpoint server-side (memerlukan OAuth 2.0 User Context token).
- Responsive dashboard untuk desktop dan mobile.

## Jalankan lokal
```bash
npm install
npm run dev
npx netlify dev
```

## Environment variables Netlify
Atur di Site configuration → Environment variables:
- `XINGCHI_API_KEY`: API key Xingchi yang baru.
- `XINGCHI_BASE_URL`: default `https://api.xingchiapi.com/v1`.
- `XINGCHI_MODEL`: default `gpt-6.1-sol`; pastikan alias ini tersedia pada akun Xingchi.
- `X_USER_ACCESS_TOKEN` (opsional): OAuth 2.0 User Context token X dengan scope `tweet.write` untuk publikasi langsung.

Setelah mengubah environment variables, lakukan redeploy. Jangan pernah menaruh secret di `VITE_*`, source frontend, atau Git.

## Deploy
Import repository ini di Netlify. Build command `npm run build`, publish directory `dist`; konfigurasi sudah tersedia di `netlify.toml`.

Catatan: Xingchi API key hanya untuk menghasilkan teks, bukan untuk mempublikasikan ke X. Publikasi langsung memerlukan token dan akses API X.
