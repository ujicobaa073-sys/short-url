# Pintasan — Penyingkat Tautan Minimalis

Aplikasi web penyingkat tautan (URL Shortener) berbasis peramban (client-side) tanpa dependensi eksternal, tanpa pelacak, dan siap dipublikasikan langsung ke GitHub Pages.

## Fitur Utama

- **Tiga Metode Ringkas**:
  - **GitHub Pages Langsung**: Menggunakan hash routing (`#/alias` atau `#go:<base64>`) yang berjalan 100% mandiri di GitHub Pages tanpa backend server.
  - **TinyURL API**: Perpendek ke tautan publik global TinyURL.
  - **is.gd API**: Perpendek ke tautan publik global is.gd.
- **Kustom Alias**: Dukungan slug khusus sesuai keinginan (misal: `#/proyek-saya`).
- **Generator QR Code**: Menghasilkan kode QR langsung di canvas browser dengan opsi unduh PNG.
- **Riwayat Lokal & Manajemen Data**:
  - Tersimpan aman di `localStorage` peramban.
  - Penghitung jumlah klik per tautan.
  - Ekspor riwayat ke file JSON dan impor kembali kapan saja.
- **Antarmuka & Aksesibilitas**:
  - Tampilan utilitarian / Swiss typography tanpa elemen AI generik.
  - Dukungan Tema Terang dan Gelap otomatis serta manual.
  - Umpan balik audio sintetis (synthesized mechanical click via Web Audio API, dapat dimatikan).
  - Pintasan keyboard: `/` atau `Ctrl+K` untuk fokus input, `Esc` untuk reset, `Enter` untuk submit.

## Cara Mengaktifkan GitHub Pages

1. Masuk ke repositori GitHub proyek ini.
2. Buka menu **Settings** > **Pages**.
3. Pada bagian **Build and deployment** > **Branch**, pilih branch `master` (atau `main`) dan folder `/ (root)`.
4. Klik **Save**.
5. Tautan situs web Anda akan aktif di `https://<username>.github.io/<nama-repo>/`.
