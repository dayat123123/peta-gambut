import { PeatPoint, ValidationResult } from '../types';
import { isInsideIndonesia, getDistanceToPeatlandKm, getDistanceKm } from '../data/peatlandsGeo';

export interface ValidationConfig {
  maxDepthCm: number;
  anomalyThresholdDiffCm: number;
  duplicateDistanceMeters: number;
  maxDistanceToPeatKm: number;
}

export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  maxDepthCm: 1500, // Reasonable maximum for tropical peat
  anomalyThresholdDiffCm: 250, // Warning if diff from neighbors > 250 cm
  duplicateDistanceMeters: 25, // Duplicate detection distance
  maxDistanceToPeatKm: 20 // Warning if point is > 20 km away from known peat polygons
};

export function validatePeatPoint(
  candidate: {
    lat: number;
    lng: number;
    depthCm: number;
    baseReached: boolean;
    photoUrl?: string;
  },
  existingPoints: PeatPoint[],
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): ValidationResult {
  const flags: string[] = [];
  let isValid = true;
  let isWarning = false;
  let anomalous = false;
  let duplicate = false;
  let duplicatePointId: string | undefined;

  // 1. Check if inside Indonesia
  if (!isInsideIndonesia(candidate.lat, candidate.lng)) {
    isValid = false;
    flags.push('Gagal Validasi: Koordinat berada di luar wilayah teritorial Republik Indonesia.');
  }

  // 2. Check proximity to known peatlands
  const { distanceKm, nearestPeatName } = getDistanceToPeatlandKm(candidate.lat, candidate.lng);
  if (distanceKm > config.maxDistanceToPeatKm) {
    isWarning = true;
    flags.push(`Peringatan Lokasi: Titik berjarak ${distanceKm} km dari kawasan gambut terdekat (${nearestPeatName}). Mohon pastikan kebenaran koordinat.`);
  }

  // 3. Reasonable Depth Check
  if (candidate.depthCm < 0) {
    isValid = false;
    flags.push('Gagal Validasi: Kedalaman gambut tidak boleh kurang dari 0 cm.');
  } else if (candidate.depthCm > config.maxDepthCm) {
    isValid = false;
    flags.push(`Gagal Validasi: Kedalaman ${candidate.depthCm} cm melampaui batas wajar maksimal (${config.maxDepthCm} cm).`);
  } else if (candidate.depthCm > 600) {
    isWarning = true;
    flags.push(`Peringatan Kedalaman: Nilai ${candidate.depthCm} cm tergolong gambut sangat tebal (>6m). Verifikator akan memeriksa foto skala bor secara seksama.`);
  }

  // 4. Duplicate Check
  const dupDistKm = config.duplicateDistanceMeters / 1000;
  for (const pt of existingPoints) {
    const dist = getDistanceKm(candidate.lat, candidate.lng, pt.lat, pt.lng);
    if (dist < dupDistKm) {
      if (Math.abs(pt.depthCm - candidate.depthCm) <= 2) {
        duplicate = true;
        duplicatePointId = pt.id;
        isWarning = true;
        flags.push(`Terdeteksi Duplikat: Titik sangat berdekatan (<${config.duplicateDistanceMeters}m) dengan titik ${pt.id} bernilai kedalaman hampir sama (${pt.depthCm} cm).`);
        break;
      }
    }
  }

  // 5. Anomaly Detection (Comparison with nearest neighbors)
  const nearbyPoints: { dist: number; depth: number }[] = [];
  for (const pt of existingPoints) {
    if (pt.status === 'verified') {
      const dist = getDistanceKm(candidate.lat, candidate.lng, pt.lat, pt.lng);
      if (dist <= 15) { // within 15 km
        nearbyPoints.push({ dist, depth: pt.depthCm });
      }
    }
  }

  if (nearbyPoints.length >= 3) {
    const avgNeighborDepth = nearbyPoints.reduce((sum, p) => sum + p.depth, 0) / nearbyPoints.length;
    const diff = Math.abs(candidate.depthCm - avgNeighborDepth);
    if (diff > config.anomalyThresholdDiffCm) {
      anomalous = true;
      isWarning = true;
      flags.push(`Penanda Anomali: Nilai kedalaman (${candidate.depthCm} cm) berbeda signifikan (${Math.round(diff)} cm) dari rata-rata ${nearbyPoints.length} titik sekitar (${Math.round(avgNeighborDepth)} cm).`);
    }
  }

  // 6. Photo requirement
  if (!candidate.photoUrl || candidate.photoUrl.trim() === '') {
    isValid = false;
    flags.push('Gagal Validasi: Foto dokumentasi pengukuran di lokasi wajib diunggah.');
  }

  return {
    isValid,
    isWarning,
    flags,
    anomalous,
    duplicate,
    duplicatePointId
  };
}

