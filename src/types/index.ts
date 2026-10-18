export type UserRole = 'pengunjung' | 'kontributor' | 'verifikator' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  institution?: string;
  phone?: string;
  badge?: string;
}

export type MeasurementMethod = 'bor_gambut' | 'probe' | 'ert' | 'lainnya';

export type LandCover = 'hutan' | 'semak' | 'sawit' | 'kebun' | 'lahan_terbuka' | 'lainnya';

export type DrainageCondition = 'alami' | 'kanal' | 'terdrainase_berat';

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'need_confirmation';

export interface PeatPoint {
  id: string;
  lat: number;
  lng: number;
  gpsAccuracy: number; // in meters (e.g. 3.5)
  depthCm: number; // in centimeters (e.g. 175)
  baseReached: boolean; // if false, depth is a lower bound (>X cm)
  method: MeasurementMethod;
  date: string; // YYYY-MM-DD
  landCover: LandCover;
  drainage: DrainageCondition;
  photoUrl: string;
  notes?: string;
  contributorId: string;
  contributorName: string;
  isPublicContributor: boolean; // privacy: whether to show name
  isObfuscated: boolean; // privacy: blur location by ~1km for private concession
  status: VerificationStatus;
  rejectionReason?: string;
  verifierNotes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  region: string;
  anomalous?: boolean;
  duplicate?: boolean;
  waterTableCm?: number; // Tinggi Muka Air Tanah (TMAT) dalam cm (misal -25)
  peatMaturity?: 'fibrik' | 'hemik' | 'saprik'; // Skala kematangan Von Post
  mineralSubstrate?: string; // Substrat tanah dasar
  ph?: number; // Tingkat keasaman tanah gambut (misal 3.8)
  validationFlags?: string[];
  createdAt: string;
}

export interface ValidationResult {
  isValid: boolean;
  isWarning: boolean;
  flags: string[];
  anomalous: boolean;
  duplicate: boolean;
  duplicatePointId?: string;
}

export interface PeatlandPolygon {
  id: string;
  name: string;
  province: string;
  areaKm2: number;
  coordinates: [number, number][][]; // Lat, Lng rings
}

export interface ModelMetrics {
  rmse: number; // Root Mean Square Error (cm)
  mae: number; // Mean Absolute Error (cm)
  r2: number; // R-squared
  sampleCount: number;
  lastCalculated: string;
  meanDepth: number; // cm
  maxDepth: number; // cm
  minDepth: number; // cm
}

export interface IDWParameters {
  power: number; // p value, typically 2.0
  maxRadiusKm: number; // max distance for interpolation, e.g. 35km
  gridResolution: number; // grid step size in degrees (e.g. 0.02 deg ~ 2.2 km)
  minPoints: number; // min points to interpolate a cell
  uncertaintyThresholdKm: number; // distance beyond which area is flagged as uncharacterized
}

export interface CarbonEstimation {
  areaHa: number;
  meanDepthMeter: number;
  volumeMillionM3: number;
  carbonStockMt: number; // Megatonnes Carbon
  co2EquivalentMt: number;
}

export interface FilterOptions {
  region: string;
  status: string; // 'all' | VerificationStatus
  minDepth: number;
  maxDepth: number;
  method: string;
  landCover: string;
  drainage: string;
  baseReachedOnly: boolean;
  searchQuery: string;
}

// ==========================================
// PEATLAND & FOREST FIRE (KARHUTLA) DOMAIN
// ==========================================

export type HotspotConfidence = 'low' | 'medium' | 'high';

export interface HotspotPoint {
  id: string;
  lat: number;
  lng: number;
  satellite: 'SNPP-VIIRS' | 'NOAA-20' | 'MODIS-Terra' | 'MODIS-Aqua';
  confidence: HotspotConfidence;
  confidencePercent: number; // e.g. 88%
  frp: number; // Fire Radiative Power (MW)
  brightnessKelvin: number; // e.g. 342.1 K
  acquisitionTime: string; // YYYY-MM-DD HH:mm WIB
  region: string;
  threatenedPeatDepthCm: number; // underlying peat thickness
  distanceToNearestCanalM: number; // distance to nearest canal/water
  fireVulnerability: 'sangat_tinggi' | 'tinggi' | 'sedang';
  groundcheckStatus?: 'belum_diperiksa' | 'terverifikasi_api' | 'terverifikasi_padam' | 'pantulan_bukan_api';
  groundcheckNotes?: string;
  checkedBy?: string;
  checkedAt?: string;
}

export type FireIncidentStatus = 
  | 'menunggu_verifikasi' 
  | 'terkonfirmasi_aktif' 
  | 'operasi_pemadaman' 
  | 'padam_terkendali'
  | 'laporan_ditolak';

export type PeatFireType = 
  | 'gambut_dalam' 
  | 'asap_smoldering' 
  | 'api_permukaan' 
  | 'kombinasi';

export interface FireIncidentReport {
  id: string;
  lat: number;
  lng: number;
  region: string;
  reporterName: string;
  reporterRole: UserRole;
  reporterPhone?: string;
  reporterInstitution?: string;
  reportedAt: string;
  fireType: PeatFireType;
  estimatedAreaHa: number;
  burnedPeatDepthCm?: number; // Opsional bila di lapangan minim alat sondir
  hasDepthMeasurement?: boolean; // false bila estimasi visual
  waterAvailability: 'cukup_tersedia' | 'debit_kritis' | 'sumber_kering' | 'tidak_ada_kanal';
  status: FireIncidentStatus;
  smokeDensity: 'tebal_pekat' | 'sedang' | 'tipis';
  photoUrl?: string;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  verifierNotes?: string;
  assignedTeam?: string; // e.g. Manggala Agni Daops Riau, MPA Desa
  estimatedCo2Tons?: number; // Calculated carbon release (opsional/indikatif)
}

export interface FireWaterSource {
  id: string;
  name: string;
  type: 'sekat_kanal' | 'embung_air' | 'sumur_bor';
  lat: number;
  lng: number;
  capacityM3: number;
  waterLevelStatus: 'normal_berair' | 'debit_rendah' | 'kering';
  managedBy: string;
  region: string;
  lastInspectedAt?: string;
  conditionNotes?: string;
}


