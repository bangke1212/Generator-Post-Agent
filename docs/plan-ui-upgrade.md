# UI Upgrade Plan — Generator Post Agent

## Arah desain

Tiga opsi visual dipertimbangkan: **Neon command center** (0.55), **Editorial creator desk** (0.30), dan **Soft productivity studio** (0.15). Dipilih **Neon command center** karena paling sesuai dengan fungsi AI generator yang perlu terasa cepat, teknis, dan tetap mudah dipakai.

- **Design movement:** dark SaaS command center dengan aksen violet-cyan.
- **Core principles:** hierarchy yang jelas, input sebagai focal point, feedback status yang terlihat, dan mobile navigation yang ringkas.
- **Color philosophy:** navy-black sebagai canvas yang tenang; violet menandai intelligence/generation; cyan menandai active/success; amber hanya untuk perhatian.
- **Layout paradigm:** persistent workspace rail di desktop, top utility bar, dan content canvas yang lega; mobile berubah menjadi drawer + compact header.
- **Signature elements:** brand mark orbit, status pill “AI ready”, dan gradient hairline pada section aktif.
- **Interaction philosophy:** setiap aksi utama punya state disabled/loading/success yang mudah dipahami.
- **Animation:** fade-up singkat untuk hasil baru, hover lift halus, tanpa animasi dekoratif berlebihan.
- **Typography:** Inter/system untuk body, monospace untuk status/model metadata.
- **Brand essence:** studio untuk mengubah ide mentah menjadi post yang siap dipublikasikan; tajam, cepat, praktis.

## Implementasi

- Upgrade shell aplikasi dengan sidebar desktop yang responsif dan mobile drawer.
- Upgrade header dengan workspace label, active provider/status, dan tombol aksi utama.
- Mempertahankan routing, generator, provider settings, local store, dan seluruh komponen halaman yang sudah ada.
- Memperkuat visual primitives global: cards, buttons, chips, inputs, scrollbars, focus states, responsive spacing.
- Tidak menambah API atau mengubah prompt engine.

## Struktur proyek

- `src/App.tsx`: shell, routing, sidebar, mobile drawer, footer.
- `src/components/Header.tsx`: top utility bar dan navigasi konteks.
- `src/pages/Ideas.tsx`: generator multi-ide existing flow.
- `src/pages/Generate.tsx`: single post existing flow.
- `src/pages/Settings.tsx`: provider/API key existing flow.
- `src/index.css`: design tokens dan responsive visual system.
