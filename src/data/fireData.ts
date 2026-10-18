import { HotspotPoint, FireIncidentReport, FireWaterSource } from '../types';

// Realistic near-realtime satellite hotspots (NASA FIRMS VIIRS & MODIS / LAPAN-BMKG Simulation)
export const SEED_HOTSPOTS: HotspotPoint[] = [
  // Cluster 1: Siak & Bengkalis Peat Dome Fringe (Riau)
  {
    id: 'HS-VIIRS-RIAU-01',
    lat: 1.4820,
    lng: 101.9120,
    satellite: 'SNPP-VIIRS',
    confidence: 'high',
    confidencePercent: 94,
    frp: 38.6,
    brightnessKelvin: 348.2,
    acquisitionTime: '2026-10-18 03:15 WIB',
    region: 'Riau (Siak & Bengkalis)',
    threatenedPeatDepthCm: 320,
    distanceToNearestCanalM: 320,
    fireVulnerability: 'sangat_tinggi'
  },
  {
    id: 'HS-VIIRS-RIAU-02',
    lat: 1.4910,
    lng: 101.9250,
    satellite: 'NOAA-20',
    confidence: 'high',
    confidencePercent: 91,
    frp: 45.2,
    brightnessKelvin: 352.0,
    acquisitionTime: '2026-10-18 03:20 WIB',
    region: 'Riau (Siak & Bengkalis)',
    threatenedPeatDepthCm: 340,
    distanceToNearestCanalM: 180,
    fireVulnerability: 'sangat_tinggi'
  },
  {
    id: 'HS-MODIS-RIAU-03',
    lat: 1.4210,
    lng: 101.8340,
    satellite: 'MODIS-Terra',
    confidence: 'medium',
    confidencePercent: 68,
    frp: 18.4,
    brightnessKelvin: 326.5,
    acquisitionTime: '2026-10-18 05:40 WIB',
    region: 'Riau (Siak & Bengkalis)',
    threatenedPeatDepthCm: 210,
    distanceToNearestCanalM: 750,
    fireVulnerability: 'tinggi'
  },
  {
    id: 'HS-VIIRS-RIAU-04',
    lat: 1.5510,
    lng: 102.0410,
    satellite: 'SNPP-VIIRS',
    confidence: 'high',
    confidencePercent: 88,
    frp: 29.1,
    brightnessKelvin: 339.8,
    acquisitionTime: '2026-10-18 03:18 WIB',
    region: 'Riau (Siak & Bengkalis)',
    threatenedPeatDepthCm: 285,
    distanceToNearestCanalM: 410,
    fireVulnerability: 'sangat_tinggi'
  },

  // Cluster 2: Semenanjung Kampar Peat Dome (Riau)
  {
    id: 'HS-VIIRS-KAMPAR-01',
    lat: 0.5420,
    lng: 102.7210,
    satellite: 'SNPP-VIIRS',
    confidence: 'medium',
    confidencePercent: 74,
    frp: 22.0,
    brightnessKelvin: 331.4,
    acquisitionTime: '2026-10-18 04:05 WIB',
    region: 'Riau (Semenanjung Kampar)',
    threatenedPeatDepthCm: 480,
    distanceToNearestCanalM: 890,
    fireVulnerability: 'sangat_tinggi'
  },
  {
    id: 'HS-MODIS-KAMPAR-02',
    lat: 0.4910,
    lng: 102.7840,
    satellite: 'MODIS-Aqua',
    confidence: 'low',
    confidencePercent: 49,
    frp: 9.8,
    brightnessKelvin: 318.2,
    acquisitionTime: '2026-10-18 06:12 WIB',
    region: 'Riau (Semenanjung Kampar)',
    threatenedPeatDepthCm: 410,
    distanceToNearestCanalM: 1200,
    fireVulnerability: 'tinggi'
  },

  // Cluster 3: Pulang Pisau & KHG Sebangau-Kahayan (Kalimantan Tengah)
  {
    id: 'HS-VIIRS-KTG-01',
    lat: -2.7820,
    lng: 114.1120,
    satellite: 'SNPP-VIIRS',
    confidence: 'high',
    confidencePercent: 96,
    frp: 52.8,
    brightnessKelvin: 361.4,
    acquisitionTime: '2026-10-18 02:40 WIB',
    region: 'Kalimantan Tengah (Pulang Pisau - Sebangau)',
    threatenedPeatDepthCm: 390,
    distanceToNearestCanalM: 250,
    fireVulnerability: 'sangat_tinggi'
  },
  {
    id: 'HS-VIIRS-KTG-02',
    lat: -2.8120,
    lng: 114.1450,
    satellite: 'NOAA-20',
    confidence: 'high',
    confidencePercent: 92,
    frp: 41.5,
    brightnessKelvin: 349.0,
    acquisitionTime: '2026-10-18 02:45 WIB',
    region: 'Kalimantan Tengah (Pulang Pisau - Sebangau)',
    threatenedPeatDepthCm: 420,
    distanceToNearestCanalM: 310,
    fireVulnerability: 'sangat_tinggi'
  },
  {
    id: 'HS-MODIS-KTG-03',
    lat: -2.6950,
    lng: 114.0410,
    satellite: 'MODIS-Terra',
    confidence: 'medium',
    confidencePercent: 71,
    frp: 19.3,
    brightnessKelvin: 327.9,
    acquisitionTime: '2026-10-18 05:22 WIB',
    region: 'Kalimantan Tengah (Pulang Pisau - Sebangau)',
    threatenedPeatDepthCm: 260,
    distanceToNearestCanalM: 640,
    fireVulnerability: 'tinggi'
  },
  {
    id: 'HS-VIIRS-KTG-04',
    lat: -2.9150,
    lng: 114.2150,
    satellite: 'SNPP-VIIRS',
    confidence: 'medium',
    confidencePercent: 65,
    frp: 14.7,
    brightnessKelvin: 323.0,
    acquisitionTime: '2026-10-18 02:50 WIB',
    region: 'Kalimantan Tengah (Pulang Pisau - Sebangau)',
    threatenedPeatDepthCm: 310,
    distanceToNearestCanalM: 920,
    fireVulnerability: 'tinggi'
  }
];

// Ground-truth field fire incidents with role tracking
export const SEED_FIRE_INCIDENTS: FireIncidentReport[] = [
  {
    id: 'INC-2026-081',
    lat: 1.4880,
    lng: 101.9180,
    region: 'Riau (Siak & Bengkalis)',
    reporterName: 'Bambang Trianto (MPA Siak Mandiri)',
    reporterRole: 'kontributor',
    reporterPhone: '0812-7645-9921',
    reporterInstitution: 'Masyarakat Peduli Api (MPA) Kampung Dayun',
    reportedAt: '2026-10-18 06:30 WIB',
    fireType: 'gambut_dalam',
    estimatedAreaHa: 4.5,
    burnedPeatDepthCm: 80,
    waterAvailability: 'cukup_tersedia',
    status: 'operasi_pemadaman',
    smokeDensity: 'tebal_pekat',
    photoUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80',
    notes: 'Asap putih tebal keluar dari bawah permukaan gambut. Api bawah menjalar ke arah timur. 2 regu Manggala Agni sedang pemadaman darat memakai mesin pompa Tohatsu.',
    assignedTeam: 'Manggala Agni Daops Siak & MPA Dayun',
    verifiedBy: 'Dr. Ilham Ramadhani',
    verifiedAt: '2026-10-18 07:15 WIB',
    verifierNotes: 'Laporan terkonfirmasi sesuai satelit VIIRS FRP 45.2 MW. Prioritas pemadaman agar tidak tembus ke kubah inti.',
    estimatedCo2Tons: 1069.9
  },
  {
    id: 'INC-2026-082',
    lat: -2.7950,
    lng: 114.1280,
    region: 'Kalimantan Tengah (Pulang Pisau - Sebangau)',
    reporterName: 'Agus Setiawan (TRG Pulang Pisau)',
    reporterRole: 'kontributor',
    reporterPhone: '0852-4411-8092',
    reporterInstitution: 'Tim Restorasi Gambut Daerah Pulang Pisau',
    reportedAt: '2026-10-18 05:45 WIB',
    fireType: 'kombinasi',
    estimatedAreaHa: 6.2,
    burnedPeatDepthCm: 95,
    waterAvailability: 'debit_kritis',
    status: 'operasi_pemadaman',
    smokeDensity: 'tebal_pekat',
    photoUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
    notes: 'Kanal sekunder mulai mengering. Dibutuhkan bantuan selang tambahan dari embung desa sejauh 600 meter.',
    assignedTeam: 'Manggala Agni Daops Kapuas & BPBD Kalteng',
    verifiedBy: 'Dr. Ilham Ramadhani',
    verifiedAt: '2026-10-18 06:20 WIB',
    verifierNotes: 'Status Darurat Siaga 1. Koordinasi helikopter water bombing diajukan ke BNPB.',
    estimatedCo2Tons: 1746.4
  },
  {
    id: 'INC-2026-083',
    lat: 1.5450,
    lng: 102.0350,
    region: 'Riau (Siak & Bengkalis)',
    reporterName: 'Warga Dusun Belutu',
    reporterRole: 'pengunjung',
    reporterPhone: '0821-9988-1234',
    reportedAt: '2026-10-18 08:10 WIB',
    fireType: 'asap_smoldering',
    estimatedAreaHa: 1.2,
    burnedPeatDepthCm: 40,
    waterAvailability: 'cukup_tersedia',
    status: 'menunggu_verifikasi',
    smokeDensity: 'sedang',
    notes: 'Terlihat kepulan asap berbau belerang gambut dari semak belukar belakang kebun karet.',
    estimatedCo2Tons: 142.6
  },
  {
    id: 'INC-2026-079',
    lat: 0.5350,
    lng: 102.7150,
    region: 'Riau (Semenanjung Kampar)',
    reporterName: 'Rahmat Hidayat (Surveyor Gambut)',
    reporterRole: 'kontributor',
    reportedAt: '2026-10-17 14:00 WIB',
    fireType: 'api_permukaan',
    estimatedAreaHa: 2.0,
    burnedPeatDepthCm: 30,
    waterAvailability: 'cukup_tersedia',
    status: 'padam_terkendali',
    smokeDensity: 'tipis',
    verifiedBy: 'Dr. Ilham Ramadhani',
    verifiedAt: '2026-10-17 18:30 WIB',
    verifierNotes: 'Berhasil dipadamkan oleh tim patroli terpadu sebelum menjalar ke lapisan gambut dalam.',
    estimatedCo2Tons: 178.3
  }
];

// Peat Fire Water Infrastructure: Canal Blocks (Sekat Kanal) & Water Retentions (Embung)
export const SEED_WATER_SOURCES: FireWaterSource[] = [
  {
    id: 'WS-SK-RIAU-01',
    name: 'Sekat Kanal SK-01 Sungai Rawa',
    type: 'sekat_kanal',
    lat: 1.4850,
    lng: 101.9050,
    capacityM3: 4500,
    waterLevelStatus: 'normal_berair',
    managedBy: 'BRGM & Pokmas Dayun Sejahtera',
    region: 'Riau (Siak & Bengkalis)'
  },
  {
    id: 'WS-EMB-RIAU-02',
    name: 'Embung Air Pemadam Siak Timur',
    type: 'embung_air',
    lat: 1.4950,
    lng: 101.9300,
    capacityM3: 12000,
    waterLevelStatus: 'normal_berair',
    managedBy: 'Manggala Agni Daops Siak',
    region: 'Riau (Siak & Bengkalis)'
  },
  {
    id: 'WS-SK-RIAU-03',
    name: 'Sekat Kanal SK-04 Bengkalis Lestari',
    type: 'sekat_kanal',
    lat: 1.5580,
    lng: 102.0480,
    capacityM3: 3800,
    waterLevelStatus: 'debit_rendah',
    managedBy: 'Masyarakat Peduli Gambut Mandau',
    region: 'Riau (Siak & Bengkalis)'
  },
  {
    id: 'WS-EMB-KTG-01',
    name: 'Embung Induk Karhutla Pulang Pisau',
    type: 'embung_air',
    lat: -2.7750,
    lng: 114.1050,
    capacityM3: 18000,
    waterLevelStatus: 'debit_rendah',
    managedBy: 'BPBD Kabupaten Pulang Pisau',
    region: 'Kalimantan Tengah (Pulang Pisau - Sebangau)'
  },
  {
    id: 'WS-SK-KTG-02',
    name: 'Sekat Kanal Taruna Jabiren SK-08',
    type: 'sekat_kanal',
    lat: -2.8190,
    lng: 114.1520,
    capacityM3: 5200,
    waterLevelStatus: 'normal_berair',
    managedBy: 'TRGD Kalteng & KPHP Kahayan Tengah',
    region: 'Kalimantan Tengah (Pulang Pisau - Sebangau)'
  }
];

/**
 * Calculate CO2 emissions from burned peatland
 * Equation: Area (ha) * 10,000 m2/ha * Depth (m) * Bulk Density (0.15 t/m3) * Carbon Fraction (0.54) * (44/12 CO2 factor ~ 3.667)
 * When depth measuring sondir is unavailable in the field, defaults to Tier 1 indicative average (20 cm).
 */
export function calculatePeatFireEmissions(areaHa: number, burnedDepthCm?: number | null): {
  carbonTons: number;
  co2Tons: number;
  isEstimatedDefault: boolean;
} {
  const isEstimatedDefault = burnedDepthCm === undefined || burnedDepthCm === null || burnedDepthCm <= 0;
  const effectiveDepthCm = isEstimatedDefault ? 20 : burnedDepthCm;
  const depthM = Math.max(0, effectiveDepthCm) / 100;
  const volumeM3 = (areaHa || 0) * 10000 * depthM;
  const bulkDensity = 0.15; // t/m3 average for degraded tropical peat
  const biomassTons = volumeM3 * bulkDensity;
  const carbonTons = biomassTons * 0.54; // 54% organic carbon content
  const co2Tons = carbonTons * 3.667;

  return {
    carbonTons: Math.round(carbonTons * 10) / 10,
    co2Tons: Math.round(co2Tons * 10) / 10,
    isEstimatedDefault
  };
}

