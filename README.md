# PeatDepth ID — Peta Kedalaman Gambut Indonesia (Platform Web Partisipatif)

Platform web geospasial berbasis kontribusi data lapangan (*crowdsourced field survey*) untuk pemetaan kedalaman gambut kontinu di Indonesia, dilengkapi pemodelan spasial *Inverse Distance Weighting* (IDW), estimasi ketidakpastian, perhitungan stok karbon, kontrol kualitas otomatis, dan alur verifikasi data bertingkat.

Proyek ini dibangun berdasarkan spesifikasi lengkap dari dokumen **Brief Proyek: Peta Kedalaman Gambut Indonesia (Draf 1 · Oktober 2026)**.

---

## 🚀 Fitur Utama Sesuai Spesifikasi Brief

### 1. Peta Interaktif & Visualisasi Spasial (Bagian 6.4 & 7)
- **Multi-layer Geospatial Web Map (Leaflet)**:
  - **Titik Survei Lapangan**: Disimbolkan menurut kelas kedalaman resmi:
    - 🟡 Dangkal: `< 50 cm`
    - 🟠 Sedang: `50 - 100 cm`
    - 🟤 Dalam: `100 - 200 cm`
    - 🌰 Sangat Dalam: `200 - 300 cm`
    - 🟣 Sangat Tebal / Kritis: `> 300 cm`
  - **Peta Kedalaman Kontinu (IDW Raster Grid)**: Permukaan interpolasi spasial halus dengan parameter bobot \(p=2.0\).
  - **Masker Sebaran Gambut Resmi (BBSDLP / KHG)**: Membatasi estimasi hanya pada wilayah sebaran gambut.
  - **Peta Ketidakpastian (Uncertainty & Data Gaps)**: Menandai area dengan jarak \(>18\text{ km}\) dari titik bor terdekat sebagai *"Area Tanpa Data Memadai"*, mencegah kesalahpahaman bahwa model akurat di zona tanpa data.
  - **Peta Dasar**: Pilihan Citra Satelit Resolusi Tinggi (ESRI World Imagery), Mode Gelap (CartoDB Dark Matter), dan Peta Terang (OpenStreetMap).
- **HUD Estimasi Biofisik & Karbon Real-Time (Bagian 5 & 6)**:
  - Luas Area Terinterpolasi (Hektare)
  - Rata-rata Kedalaman Gambut (Meter)
  - Total Estimasi Volume Gambut (Juta \(\text{m}^3\))
  - Estimasi Cadangan Karbon Gambut (Megaton C / \(\text{Mt C}\)) berdasarkan densitas kamba tropis \(\rho = 0.09\text{ g/cm}^3\) dan fraksi karbon \(54\%\).
  - Setara Emisi \(\text{CO}_2\text{e}\) (\(\times 3.67\)).
- **Inspector Titik Detail**: Pop-up dan modal interaktif menampilkan foto skala meteran, koordinat, akurasi GPS (\(\pm\text{m}\)), status apakah dasar tanah mineral tercapai, metode ukur, kondisi drainase, dan penutup lahan.

### 2. Formulir Input Data Lapangan & PWA Offline (Bagian 6.1 & 10)
- **Otomatisasi GPS**: Pengambilan koordinat langsung melalui sensor GPS peramban dengan indikator akurasi (\(\pm\text{m}\)) dan opsi penyesuaian manual.
- **Validasi Otomatis Real-Time (Bagian 6.2)**:
  - Batas teritorial Republik Indonesia.
  - Kedekatan dengan kawasan gambut (peringatan jika \(>20\text{ km}\) dari kubah gambut).
  - Pemeriksaan batas wajar kedalaman (peringatan jika \(>600\text{ cm}\), tolak jika \(<0\) atau \(>1500\text{ cm}\)).
  - Deteksi titik duplikat (jarak \(<25\text{ m}\) dengan nilai kedalaman identik).
  - Penanda anomali (peringatan otomatis jika deviasi \(>250\text{ cm}\) dari rata-rata titik terdekat).
- **Perlakuan Khusus Batas Bawah**: Pilihan *"Dasar Mineral Tercapai: Ya/Tidak"*. Jika *Tidak*, nilai dicatat sebagai batas bawah (\(>X\text{ cm}\)) dan tidak dijadikan nilai pasti dalam interpolasi IDW.
- **Dokumentasi Foto**: Unggah foto langsung dari kamera HP atau file, dilengkapi *preset* foto profil bor gambut.
- **Opsi Privasi Konsesi & Lahan Privat (Bagian 10)**: Opsi mengaburkan lokasi publik radius \(1\text{ km}\) dan opsi anonimitas nama kontributor.
- **Dukungan Lapangan Offline (PWA)**: Titik yang diinput di daerah tanpa sinyal disimpan di *IndexedDB/LocalStorage* dan dapat disinkronkan (*1-Click Sync*) ketika kembali terhubung ke jaringan.

### 3. Alur Verifikasi & Kontrol Kualitas (Bagian 6.3)
- **Antrean Verifikasi Berdampingan**:
  - Tampilan berdampingan antara foto bor, catatan surveyor, dan koordinat lingkungan.
  - Indikator peringatan anomali dan duplikat otomatis.
  - Tiga tindakan verifikator: **Setujui Titik**, **Tolak Titik (Wajib Alasan)**, dan **Minta Konfirmasi Kontributor**.
  - **Prinsip Kualitas**: Hanya titik yang berstatus *Terverifikasi* yang diikutsertakan dalam kalkulasi IDW dan metrik akurasi.

### 4. Metodologi, Metrik Akurasi & Transparansi (Bagian 6.5, 7, 8 & 11)
- **Metrik Validasi Silang (Cross-Validation) Real-Time**:
  - Root Mean Square Error (**RMSE**)
  - Mean Absolute Error (**MAE**)
  - Koefisien Determinasi (**\(R^2\)**)
- **Dokumentasi Roadmap Pemodelan**:
  - Fase 1 (MVP): IDW Cepat & Transparan
  - Fase 2a: Ordinary Kriging dengan Variogram spasial
  - Fase 2b: Random Forest Machine Learning dengan kovariat DEMNAS, Sentinel-1 SAR, Sentinel-2 NDWI, dan jarak sungai.
- **Atribusi Sumber Data Resmi**: BBSDLP 1:250.000, KLHK/BRGM KHG, BIG DEMNAS, CIFOR Gumbricht 2017, WRI GFW Peatlands.
- **Protokol Lapangan 1 Halaman**: Panduan standar bor Eijkelkamp / Russian corer.
- **Panduan Keselamatan**: Mitigasi risiko keselamatan di rawa gambut (buddy system, lubang runtuh, hidrasi, bahaya asap).
- **Penafian Resmi (Disclaimer)**: Penegasan bahwa situs ini merupakan pelengkap riset partisipatif dan bukan pengganti survei resmi pemerintah.

### 5. Pusat Ekspor Data Terbuka (Bagian 5 & 6.4)
- **GeoJSON (.geojson RFC 7946)**: Lengkap dengan seluruh properti lingkungan, metode, dan foto.
- **Tabel Data CSV (.csv UTF-8 BOM)**: Siap dibuka di Microsoft Excel, Google Sheets, R, dan Python.
- **Raster Grid ESRI ASCII (.asc)**: File raster bergeoreferensi standar yang siap dianalisis di QGIS, ArcGIS, dan GDAL.

---

## 🛠️ Tech Stack JavaScript

- **Runtime & Package Manager**: [Bun](https://bun.com) v1.4.3
- **Frontend Framework**: React 19 + TypeScript
- **Build Tool**: Vite v8.3
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Mapping & GIS Engine**: Leaflet 1.9 + Custom Canvas/Polygon Spatial Raster Engine
- **Icons**: Lucide React

---

## 📦 Menjalankan Proyek Secara Lokal

1. **Pasang Dependensi**:
   ```bash
   bun install
   ```

2. **Jalankan Server Pengembangan (Dev Server)**:
   ```bash
   bun run dev
   ```
   Aplikasi akan berjalan di `http://localhost:5173`.

3. **Membangun Versi Produksi (Production Build)**:
   ```bash
   bun run build
   ```

4. **Uji Coba Hasil Build**:
   ```bash
   bun run preview
   ```

---

## 📂 Struktur Direktori

```
geospasial/
├── Brief Proyek Peta Kedalaman Gambut Indonesia.pdf  # Dokumen spesifikasi asli
├── src/
│   ├── types/
│   │   └── index.ts               # Interface TypeScript (PeatPoint, IDW, Metrik, Filter)
│   ├── data/
│   │   ├── peatlandsGeo.ts        # Poligon spasial batas kubah gambut (Riau & Kalteng)
│   │   └── samplePoints.ts        # 325+ titik survei awal (Indikator keberhasilan MVP)
│   ├── services/
│   │   ├── idw.ts                 # Algoritma interpolasi IDW, masker, validasi silang (RMSE/R2)
│   │   ├── validation.ts          # Mesin validasi otomatis (batas RI, anomali, duplikat)
│   │   ├── storage.ts             # Penyimpanan lokal & antrean sinkronisasi offline (PWA)
│   │   └── export.ts              # Generator unduh GeoJSON, CSV, & ESRI ASCII Grid
│   ├── components/
│   │   ├── Navbar.tsx             # Navigasi, ganti peran (Publik/Kontributor/Verifikator/Admin)
│   │   ├── InteractiveMap.tsx     # Peta Leaflet, raster IDW, ketidakpastian, legenda, HUD karbon
│   │   ├── PointInputForm.tsx     # Formulir lapangan, GPS, unggah foto, validasi, offline queue
│   │   ├── VerificationQueue.tsx  # Dashboard verifikasi berdampingan, tolak/setujui/klarifikasi
│   │   ├── PointDetailModal.tsx   # Modal inspeksi foto & profil bor titik
│   │   ├── MethodologyView.tsx    # Laporan metrik RMSE, perbandingan metode, protokol & safety
│   │   ├── ExportModal.tsx        # Pusat unduh GeoJSON, CSV, dan Raster GIS
│   │   └── AdminPanel.tsx         # Konfigurasi parameter model & pemeliharaan basis data
│   ├── App.tsx                    # Komponen induk pengelola status & notifikasi
│   ├── main.tsx                   # Titik masuk React
│   └── index.css                  # Konfigurasi Tailwind CSS v4 & kustomisasi peta Leaflet
├── index.html                     # Dokumen HTML utama
├── vite.config.ts                 # Konfigurasi Vite & Tailwind plugin
├── tsconfig.json                  # Konfigurasi TypeScript
└── package.json                   # Dependensi dan skrip proyek
```
# peta-gambut
