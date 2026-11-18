# stickerio landing

Situs statis berbahasa Indonesia untuk stickerio: halaman utama, Privacy Policy,
Terms of Service, dan galeri mockup di bagian bawah halaman utama. HTML/CSS/JS
biasa, SVG orisinal, font sistem, tanpa framework atau dependency npm.

## Buka hasilnya

Buka `index.html` langsung di browser, atau dari folder `landing/`:

```sh
npm run preview
```

Buka `http://127.0.0.1:4173`. Hentikan server dengan Ctrl+C. Nomor port dapat
diganti dengan `PORT=4174 npm run preview`.

- `index.html`: halaman utama dan galeri yang dapat digeser di HP.
- `privacy.html`: Privacy Policy, termasuk perilaku HTTP deployment saat ini.
- `terms.html`: Terms of Service.
- `mockups.html`: lembar sumber mockup HTML/SVG dan tautan unduh PNG.
- `assets/store/`: lima mockup potret, feature graphic, dan ikon hasil ekspor.
- `previews/`: screenshot verifikasi desktop/mobile, hanya hasil lokal.

## Isi penerbit dan kontak nanti

Edit **`site.config.mjs`**, lalu jalankan:

```sh
npm run build
```

Nilai yang disiapkan:

```js
publisher: '',    // Nama penerbit publik
contactEmail: '', // Kontak privasi/laporan konten yang benar-benar bisa dihubungi
storeUrl: '',     // URL listing aplikasi setelah tersedia
siteUrl: '',      // URL dasar situs, termasuk subfolder bila ada
```

Tidak ada nama penerbit, alamat email, atau listing Play Store yang dikarang.
Selama penerbit/kontak kosong, dokumen menampilkan status belum dilengkapi dan
memakai `noindex`. Setelah dua nilai itu diisi, build menghapus penanda tersebut.
Isi kontak sebelum menjadikan kebijakan sebagai dokumen resmi. URL store yang
kosong membuat tombol mengarah ke fitur/galeri yang benar-benar tersedia.
`siteUrl` mengaktifkan canonical URL dan URL gambar Open Graph yang absolut.

Edit `content/legal.mjs` untuk memperbarui isi kebijakan. Edit
`scripts/build.mjs` untuk struktur/copy halaman dan spesifikasi mockup. HTML pada
root adalah hasil build yang siap dibuka/di-host; jangan mengedit hasil tersebut
jika perubahan ingin dipertahankan setelah build ulang.

## Ekspor PNG dari HTML dan SVG

```sh
npm run export
```

Prasyarat: Node.js 22+ dengan WebSocket bawaan serta Chrome/Chromium terpasang.
Tidak perlu `npm install`. Browser dideteksi dari lokasi umum macOS/Linux;
gunakan `CHROME_PATH=/path/to/chrome npm run export` jika perlu. Script membuat
profil browser sementara, menjalankan server di loopback pada port acak,
mengekspor artboard 1:1, lalu menutup browser/server dan menghapus profil tersebut.
Profil Chrome pribadi tidak dipakai. Tidak ada daemon yang dipasang.

| File di `assets/store/` | Ukuran | Format |
| --- | --- | --- |
| `01-create.png` | 1080 × 1920 | PNG RGB, 24-bit |
| `02-editor.png` | 1080 × 1920 | PNG RGB, 24-bit |
| `03-erase.png` | 1080 × 1920 | PNG RGB, 24-bit |
| `04-animated.png` | 1080 × 1920 | PNG RGB, 24-bit |
| `05-share.png` | 1080 × 1920 | PNG RGB, 24-bit |
| `feature-graphic.png` | 1024 × 500 | PNG RGB, 24-bit |
| `store-icon.png` | 512 × 512 | PNG RGBA, 32-bit |

Lima mockup listing memakai screenshot asli yang diberikan pengguna, berurutan
sebagai `assets/screens/listing-01.jpg` sampai `listing-05.jpg`. Gambar ditampilkan
utuh di area layar dengan ukuran bingkai yang tetap. Screenshot asli tidak
diubah. Aset PNG pengujian lain berasal dari `aplikasi/app/build/reports/ui/`;
hero landing tetap memakai screenshot sebelumnya. Logo berasal dari aset brand aplikasi. Ilustrasi kucing, balon
“halo!”, bintang, dan garis bawah dibuat sebagai SVG orisinal di `assets/art/`.
Tangkapan layar tidak diubah dengan manipulasi piksel; bingkai/komposisinya
dibuat dengan HTML/CSS dan SVG, lalu dirender Chrome menjadi PNG.

Ukuran mengacu pada [panduan preview assets Google Play](https://support.google.com/googleplay/android-developer/answer/9866151).
Gambar yang dihasilkan tetap perlu dipilih serta ditinjau penerbit untuk listing
akhir; ini bukan bukti penerimaan Google Play.

## Verifikasi

```sh
npm run check
```

Pemeriksaan memakai Chrome yang sama: tautan lokal/anchor, gambar, overflow
horizontal, navigasi mobile, dialog galeri dan unduhan, FAQ, reduced motion,
akses kebijakan tanpa JavaScript, serta dimensi/color type PNG. Tidak ada tes
yang menulis data ke backend aplikasi atau memanggil API produksi.

Hasil pada 18 November 2026: **7 kombinasi halaman/viewport, 7 PNG, dan 5
pemeriksaan interaksi lulus**. Ukuran viewport 1440, 390, dan 320 piksel;
tidak ditemukan error browser, gambar/tautan lokal rusak, overflow halaman,
atau permintaan resource eksternal. Screenshot dan laporan berada di
`previews/verification.json` serta `previews/*.png`.

## Hosting dan tautan dari aplikasi

### Repository terpisah

Folder ini memiliki repository Git sendiri. Proyek Android/backend mengabaikan
`/landing/`, sehingga situs tidak ikut commit proyek utama dan bukan submodule.

**`assets/store/` tidak masuk Git.** File PNG hasil ekspor tetap tersedia secara
lokal. Sumber HTML/CSS/SVG dan screenshot `assets/screens/` tetap masuk Git agar
gambar dapat dibuat ulang. `previews/` dan `node_modules/` juga diabaikan.

Setelah clone repository landing di komputer baru, jalankan `npm run export`
untuk menghasilkan PNG yang digunakan galeri sebelum preview, pemeriksaan,
atau deployment. Perintah ini memerlukan Chrome/Chromium seperti dijelaskan
di bagian ekspor. Menjalankan `npm run build` saja hanya membuat HTML dan tidak
menghasilkan PNG. Hosting tetap perlu menerima hasil PNG lokal tersebut meski
file tersebut tidak disimpan di Git.

Publikasikan empat HTML root beserta folder `assets/` ke static hosting pilihanmu.
Tidak ada build server, database, environment rahasia, atau API yang diperlukan.
Jangan memakai root seluruh repo sebagai document root; cukup direktori publik
HTML + `assets/`. Tidak ada deploy atau push GitHub yang dilakukan dalam tugas ini.

Setelah alamat publik tersedia, atur aplikasi dengan URL asli:

```sh
./scripts/build-aab.sh \
  '-Pstickerhub.privacyUrl=https://domain-milikmu/privacy.html' \
  '-Pstickerhub.termsUrl=https://domain-milikmu/terms.html'
```

Jalankan perintah itu dari `aplikasi/`, setelah signing release lengkap.
Nama domain di atas hanya contoh dokumentasi; tidak ditanam di situs/aplikasi.
Alamat API aplikasi tetap terpisah dari alamat situs kebijakan.

Isi dokumen mengikuti kode saat ini: penyimpanan lokal, paket publik di R2,
identitas instalasi, favorit/impor, antrean penghapusan, serta koneksi HTTP.
Tidak ada janji pemulihan akun, penarikan salinan yang sudah diunduh, enkripsi
TLS menyeluruh, masa retensi tetap, atau moderasi otomatis yang tidak tersedia.
Tinjau ulang dokumen jika implementasi berubah.

Referensi pihak ketiga yang digunakan untuk menyesuaikan pengungkapan:
[ML Kit data disclosure](https://developers.google.com/ml-kit/android-data-disclosure),
[subject segmentation Android](https://developers.google.com/ml-kit/vision/subject-segmentation/android),
[Google Play User Data](https://support.google.com/googleplay/android-developer/answer/10144311).
