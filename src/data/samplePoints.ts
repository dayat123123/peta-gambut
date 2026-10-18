import { PeatPoint } from '../types';

// Pre-curated sample field photos showcasing peat sampling, core augers, and peatland canals
const SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80', // Peat forest
  'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=600&q=80', // Forest canopy / wetlands
  'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80', // Dense trees & soil
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80', // Landscape with wetland canal
  'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=600&q=80', // Peat water & root matrix
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80', // Wetland roots
  'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80', // Moss & organic matter
  'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80'  // Canopy and soil
];

const CONTRIBUTORS = [
  { id: 'USR-RIAU-01', name: 'Dr. Ilham Ramadhani (Pusat Studi Gambut UNRI)', org: true },
  { id: 'USR-RIAU-02', name: 'Siti Rahmawati (MPG Siak Mandiri)', org: false },
  { id: 'USR-RIAU-03', name: 'Bambang Trianto (Yayasan Gambut Lestari Riau)', org: true },
  { id: 'USR-RIAU-04', name: 'Ahmad Fauzi (Surveyor Independen Siak)', org: false },
  { id: 'USR-RIAU-05', name: 'Rahmat Hidayat (Tim Restorasi Gambut Bengkalis)', org: true },
  { id: 'USR-RIAU-06', name: 'Nurul Hasanah (Relawan Gambut Mandau)', org: false },
  { id: 'USR-RIAU-07', name: 'Ir. Hendra Kusuma (Staf DLHK Riau)', org: true },
  { id: 'USR-RIAU-08', name: 'Eko Prasetyo (Mahasiswa Kehutanan)', org: false },
  { id: 'USR-RIAU-09', name: 'Dedi Kurniawan (Kelompok Tani Peduli Gambut)', org: false },
  { id: 'USR-RIAU-10', name: 'Dewi Lestari (Peneliti BRIN Ekologi)', org: true },
  { id: 'USR-KALTENG-01', name: 'Prof. Yanto Gunawan (CIMTROP Univ Palangka Raya)', org: true },
  { id: 'USR-KALTENG-02', name: 'Budi Santoso (Masyarakat Peduli Gambut Kahayan)', org: false },
  { id: 'USR-KALTENG-03', name: 'Wahyu Pratama (Surveyor Katingan)', org: false },
  { id: 'USR-KALTENG-04', name: 'Laila Munirah (Balai TN Sebangau)', org: true },
  { id: 'USR-KALTENG-05', name: 'Agus Setiawan (Tim Restorasi Gambut Pulang Pisau)', org: true },
  { id: 'USR-KALTENG-06', name: 'Fajar Nugroho (Peneliti Hidrologi Gambut)', org: true },
  { id: 'USR-KALTENG-07', name: 'Rina Kusuma (Relawan Desa Jabiren)', org: false },
  { id: 'USR-KALTENG-08', name: 'Doni Simanjuntak (Asosiasi Surveyor Hutan)', org: false },
  { id: 'USR-KALTENG-09', name: 'Teguh Wibowo (Mahasiswa Magister Lingkungan UPR)', org: false },
  { id: 'USR-KALTENG-10', name: 'Maya Anggraini (GIS Specialist BRGM Kalteng)', org: true },
  { id: 'USR-KALBAR-01', name: 'M. Syarifuddin (Kubu Raya Peat Ranger)', org: false },
  { id: 'USR-KALBAR-02', name: 'Andi Saputra (Surveyor Ekosistem Gambut Untan)', org: true }
];

// Seed pseudo-random generator with fixed seed for consistent realistic data
function createSeededRandom(seed: number) {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

export function generateSeedPoints(): PeatPoint[] {
  const points: PeatPoint[] = [];
  const rand = createSeededRandom(42);

  // Region 1: Riau Peat Basin (Siak, Bengkalis, Kampar) ~ 190 points
  const riauCenterLat = 1.35;
  const riauCenterLng = 101.85;

  for (let i = 1; i <= 195; i++) {
    // Generate around 2 main dome centers
    const isKampar = rand() > 0.65;
    const centerLat = isKampar ? 0.45 : riauCenterLat;
    const centerLng = isKampar ? 102.85 : riauCenterLng;
    const latSpan = isKampar ? 0.45 : 0.6;
    const lngSpan = isKampar ? 0.6 : 0.8;

    const angle = rand() * Math.PI * 2;
    const distFactor = Math.pow(rand(), 0.7); // clustered around domes
    const lat = centerLat + Math.sin(angle) * (latSpan * distFactor) + (rand() - 0.5) * 0.05;
    const lng = centerLng + Math.cos(angle) * (lngSpan * distFactor) + (rand() - 0.5) * 0.05;

    // Realistic dome peat physics: thickest at dome center (up to 550cm), thinning to edges (30-80cm)
    const distFromCenter = Math.sqrt(Math.pow((lat - centerLat) / latSpan, 2) + Math.pow((lng - centerLng) / lngSpan, 2));
    let baseDepth = Math.max(25, Math.round(520 * (1 - Math.min(1, distFromCenter * 0.85)) + (rand() - 0.5) * 60));

    // Special cases:
    const baseReached = baseDepth > 450 ? (rand() > 0.4) : (rand() > 0.06);
    const depthCm = baseReached ? baseDepth : Math.min(baseDepth, 400 + Math.round(rand() * 100));

    // Contributor assignment
    const contrib = CONTRIBUTORS[Math.floor(rand() * 10)]!;

    // Methods
    const methodRand = rand();
    const method = methodRand < 0.65 ? 'bor_gambut' : methodRand < 0.85 ? 'probe' : methodRand < 0.95 ? 'ert' : 'lainnya';

    // Land cover
    const lcRand = rand();
    const landCover = lcRand < 0.45 ? 'hutan' : lcRand < 0.70 ? 'sawit' : lcRand < 0.85 ? 'semak' : lcRand < 0.95 ? 'kebun' : 'lahan_terbuka';

    // Drainage
    const drRand = rand();
    const drainage = landCover === 'hutan' 
      ? (drRand < 0.8 ? 'alami' : 'kanal')
      : (landCover === 'sawit' ? (drRand < 0.7 ? 'kanal' : 'terdrainase_berat') : (drRand < 0.5 ? 'kanal' : 'alami'));

    // Status: 180 verified, 10 pending, 3 need_confirmation, 2 rejected
    let status: PeatPoint['status'] = 'verified';
    let rejectionReason: string | undefined;
    let verifierNotes: string | undefined;
    let anomalous = false;

    if (i > 185) {
      status = 'pending';
    } else if (i === 184) {
      status = 'need_confirmation';
      verifierNotes = 'Foto bor terpotong dan koordinat GPS menunjukkan akurasi rendah (14m). Mohon unggah ulang foto meteran pengukuran.';
    } else if (i === 183) {
      status = 'need_confirmation';
      verifierNotes = 'Kedalaman 490 cm di area dekat pemukiman terindikasi anomali dari data sekitar (rata-rata 110 cm). Mohon konfirmasi titik bor.';
      anomalous = true;
    } else if (i === 182) {
      status = 'rejected';
      rejectionReason = 'Foto bukan sampel tanah gambut (terlihat tanah lempung/mineral) dan koordinat berada di luar kubah gambut.';
    } else if (i === 181) {
      status = 'rejected';
      rejectionReason = 'Titik duplikat persis dengan survei PT-RIAU-042 tanggal 2026-08-12 dengan data identik.';
    }

    const day = 1 + Math.floor(rand() * 27);
    const month = 4 + Math.floor(rand() * 6);
    const dateStr = `2026-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    points.push({
      id: `PT-RIAU-${i.toString().padStart(3, '0')}`,
      lat: Math.round(lat * 100000) / 100000,
      lng: Math.round(lng * 100000) / 100000,
      gpsAccuracy: Math.round((1.8 + rand() * 4.2) * 10) / 10,
      depthCm,
      baseReached,
      method,
      date: dateStr,
      landCover,
      drainage,
      photoUrl: SAMPLE_PHOTOS[Math.floor(rand() * SAMPLE_PHOTOS.length)]!,
      notes: baseReached 
        ? `Bor menembus lapisan saprik hingga hemik, kontak tanah mineral liat abu-abu di kedalaman ${depthCm} cm.`
        : `Mata bor terhenti pada sisa kayu gambut (wood remnant) pada kedalaman ${depthCm} cm, dasar belum tercapai.`,
      contributorId: contrib.id,
      contributorName: contrib.name,
      isPublicContributor: rand() > 0.15,
      isObfuscated: rand() < 0.08, // 8% obfuscated for concession privacy
      status,
      rejectionReason,
      verifierNotes,
      verifiedAt: status === 'verified' ? '2026-09-30 14:20' : undefined,
      verifiedBy: status === 'verified' ? 'Admin Verifikator (BBSDLP/BRGM)' : undefined,
      region: isKampar ? 'Riau (Semenanjung Kampar)' : 'Riau (Siak & Bengkalis)',
      anomalous,
      createdAt: dateStr + 'T09:00:00Z'
    });
  }

  // Region 2: Central Kalimantan (Pulang Pisau - Sebangau - Kahayan) ~ 130 points
  const kaltengCenterLat = -2.75;
  const kaltengCenterLng = 113.95;

  for (let j = 1; j <= 130; j++) {
    const latSpan = 0.55;
    const lngSpan = 0.45;

    const angle = rand() * Math.PI * 2;
    const distFactor = Math.pow(rand(), 0.7);
    const lat = kaltengCenterLat + Math.sin(angle) * (latSpan * distFactor) + (rand() - 0.5) * 0.04;
    const lng = kaltengCenterLng + Math.cos(angle) * (lngSpan * distFactor) + (rand() - 0.5) * 0.04;

    const distFromCenter = Math.sqrt(Math.pow((lat - kaltengCenterLat) / latSpan, 2) + Math.pow((lng - kaltengCenterLng) / lngSpan, 2));
    let baseDepth = Math.max(30, Math.round(580 * (1 - Math.min(1, distFromCenter * 0.88)) + (rand() - 0.5) * 70));

    const baseReached = baseDepth > 480 ? (rand() > 0.45) : (rand() > 0.05);
    const depthCm = baseReached ? baseDepth : Math.min(baseDepth, 420 + Math.round(rand() * 90));

    const contrib = CONTRIBUTORS[10 + Math.floor(rand() * 10)]!;

    const methodRand = rand();
    const method = methodRand < 0.70 ? 'bor_gambut' : methodRand < 0.88 ? 'probe' : methodRand < 0.96 ? 'ert' : 'lainnya';

    const lcRand = rand();
    const landCover = lcRand < 0.50 ? 'hutan' : lcRand < 0.72 ? 'semak' : lcRand < 0.88 ? 'sawit' : lcRand < 0.96 ? 'kebun' : 'lahan_terbuka';

    const drRand = rand();
    const drainage = landCover === 'hutan' 
      ? (drRand < 0.85 ? 'alami' : 'kanal')
      : (landCover === 'sawit' ? 'kanal' : (drRand < 0.6 ? 'kanal' : 'terdrainase_berat'));

    let status: PeatPoint['status'] = 'verified';
    let rejectionReason: string | undefined;
    let verifierNotes: string | undefined;
    let anomalous = false;

    if (j > 122) {
      status = 'pending';
    } else if (j === 121) {
      status = 'need_confirmation';
      verifierNotes = 'Foto lokasi kurang jelas menampilkan skala kedalaman bor. Mohon klarifikasi pembacaan cm.';
    } else if (j === 120) {
      status = 'rejected';
      rejectionReason = 'Koordinat berada di aliran sungai aktif, bukan tubuh gambut darat.';
    }

    const day = 1 + Math.floor(rand() * 27);
    const month = 5 + Math.floor(rand() * 5);
    const dateStr = `2026-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    points.push({
      id: `PT-KTG-${j.toString().padStart(3, '0')}`,
      lat: Math.round(lat * 100000) / 100000,
      lng: Math.round(lng * 100000) / 100000,
      gpsAccuracy: Math.round((2.0 + rand() * 3.8) * 10) / 10,
      depthCm,
      baseReached,
      method,
      date: dateStr,
      landCover,
      drainage,
      photoUrl: SAMPLE_PHOTOS[Math.floor(rand() * SAMPLE_PHOTOS.length)]!,
      notes: baseReached
        ? `Pengambilan sampel gambut ombrogenik tebal, substratum pasir kuarsa putih di dasar ${depthCm} cm.`
        : `Kedalaman bor mencapai ${depthCm} cm belum tembus substrat mineral karena keterbatasan batang ekstensi.`,
      contributorId: contrib.id,
      contributorName: contrib.name,
      isPublicContributor: rand() > 0.1,
      isObfuscated: rand() < 0.05,
      status,
      rejectionReason,
      verifierNotes,
      verifiedAt: status === 'verified' ? '2026-10-02 11:15' : undefined,
      verifiedBy: status === 'verified' ? 'Verifikator Wilayah Kalteng' : undefined,
      region: 'Kalimantan Tengah (Pulang Pisau - Sebangau)',
      anomalous,
      createdAt: dateStr + 'T10:15:00Z'
    });
  }

  return points;
}

