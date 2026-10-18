import { PeatPoint, IDWParameters, ModelMetrics, CarbonEstimation } from '../types';
import { getDistanceKm, isPointInPeatland, isPointInPolygon, PILOT_PEATLANDS } from '../data/peatlandsGeo';

export const DEFAULT_IDW_PARAMS: IDWParameters = {
  power: 2.0,
  maxRadiusKm: 30,
  gridResolution: 0.025, // ~2.7 km grid spacing for fluid real-time render
  minPoints: 1,
  uncertaintyThresholdKm: 18 // areas further than 18km from points are marked uncharacterized
};

export interface IDWGridCell {
  lat: number;
  lng: number;
  depthCm: number;
  uncertaintyCm: number;
  distanceToNearestKm: number;
  isReliable: boolean;
  color: string;
}

export interface IDWInterpolationResult {
  cells: IDWGridCell[];
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  gridRows: number;
  gridCols: number;
  metrics: ModelMetrics;
  carbonStats: CarbonEstimation;
}

// Convert depth cm to standard color hex according to national peat classes
export function getDepthColor(depthCm: number, opacity: number = 0.75): string {
  // Shallow (<50cm): Pale Yellow
  if (depthCm < 50) return `rgba(250, 204, 21, ${opacity})`;
  // Moderate (50 - 100cm): Orange
  if (depthCm < 100) return `rgba(249, 115, 22, ${opacity})`;
  // Deep (100 - 200cm): Amber Brown
  if (depthCm < 200) return `rgba(217, 119, 6, ${opacity})`;
  // Very Deep (200 - 300cm): Dark Brown
  if (depthCm < 300) return `rgba(180, 83, 9, ${opacity})`;
  // Critically Deep (>300cm): Deep Purple/Dark Mahogany
  return `rgba(120, 53, 15, ${opacity})`;
}

// Cross-Validation (Hold-Out / Leave-One-Out) to compute real RMSE, MAE, R2
export function calculateCrossValidationMetrics(
  points: PeatPoint[],
  params: IDWParameters = DEFAULT_IDW_PARAMS
): ModelMetrics {
  // Only use verified points where base was reached
  const validPoints = points.filter(p => p.status === 'verified' && p.baseReached);

  if (validPoints.length < 5) {
    return {
      rmse: 0,
      mae: 0,
      r2: 0,
      sampleCount: validPoints.length,
      lastCalculated: new Date().toLocaleTimeString('id-ID'),
      meanDepth: 0,
      maxDepth: 0,
      minDepth: 0
    };
  }

  // To keep performance snappy on 300+ points, perform a representative 40-point sample cross-validation
  const sampleSize = Math.min(60, validPoints.length);
  const step = Math.max(1, Math.floor(validPoints.length / sampleSize));
  
  let totalSqErr = 0;
  let totalAbsErr = 0;
  let validEvaluations = 0;

  const depths = validPoints.map(p => p.depthCm);
  const meanZ = depths.reduce((a, b) => a + b, 0) / depths.length;
  let totalVariance = 0;

  for (let idx = 0; idx < validPoints.length; idx += step) {
    const testPoint = validPoints[idx]!;
    const trainingPoints = validPoints.filter((_, i) => i !== idx);

    let weightSum = 0;
    let weightedDepthSum = 0;

    for (const p of trainingPoints) {
      const dist = getDistanceKm(testPoint.lat, testPoint.lng, p.lat, p.lng);
      if (dist < params.maxRadiusKm) {
        const w = 1 / Math.pow(Math.max(dist, 0.05), params.power);
        weightSum += w;
        weightedDepthSum += w * p.depthCm;
      }
    }

    if (weightSum > 0) {
      const pred = weightedDepthSum / weightSum;
      const err = pred - testPoint.depthCm;
      totalSqErr += err * err;
      totalAbsErr += Math.abs(err);
      totalVariance += Math.pow(testPoint.depthCm - meanZ, 2);
      validEvaluations++;
    }
  }

  const rmse = validEvaluations > 0 ? Math.round(Math.sqrt(totalSqErr / validEvaluations) * 10) / 10 : 0;
  const mae = validEvaluations > 0 ? Math.round((totalAbsErr / validEvaluations) * 10) / 10 : 0;
  let r2 = totalVariance > 0 ? 1 - (totalSqErr / totalVariance) : 0;
  r2 = Math.max(0, Math.min(0.99, Math.round(r2 * 100) / 100));

  return {
    rmse,
    mae,
    r2,
    sampleCount: validPoints.length,
    lastCalculated: new Date().toLocaleTimeString('id-ID'),
    meanDepth: Math.round(meanZ),
    maxDepth: Math.max(...depths),
    minDepth: Math.min(...depths)
  };
}

// Run IDW Spatial Interpolation over active region
export function runIDWInterpolation(
  points: PeatPoint[],
  regionFilter: string,
  params: IDWParameters = DEFAULT_IDW_PARAMS
): IDWInterpolationResult {
  // Verified points only
  const validPoints = points.filter(p => p.status === 'verified' && p.baseReached);

  // Determine spatial bounding box based on selected region or points
  let bounds = { minLat: -3.5, maxLat: 2.0, minLng: 100.8, maxLng: 114.8 };

  if (regionFilter.includes('Riau') || regionFilter.includes('Siak') || regionFilter.includes('Kampar')) {
    bounds = { minLat: 0.0, maxLat: 2.0, minLng: 100.8, maxLng: 103.6 };
  } else if (regionFilter.includes('Kalteng') || regionFilter.includes('Kalimantan Tengah') || regionFilter.includes('Pulang Pisau')) {
    bounds = { minLat: -3.6, maxLat: -2.0, minLng: 113.3, maxLng: 114.6 };
  } else if (validPoints.length > 0) {
    const lats = validPoints.map(p => p.lat);
    const lngs = validPoints.map(p => p.lng);
    bounds = {
      minLat: Math.min(...lats) - 0.2,
      maxLat: Math.max(...lats) + 0.2,
      minLng: Math.min(...lngs) - 0.2,
      maxLng: Math.max(...lngs) + 0.2
    };
  }

  const res = params.gridResolution;
  const cells: IDWGridCell[] = [];

  let totalPeatCells = 0;
  let sumDepthMeters = 0;

  for (let lat = bounds.minLat; lat <= bounds.maxLat; lat += res) {
    for (let lng = bounds.minLng; lng <= bounds.maxLng; lng += res) {
      // 1. Masking: Only interpolate inside known peatland polygon (Section 6.4 & 7)
      if (!isPointInPeatland(lat, lng)) {
        continue;
      }

      // 2. IDW computation
      let weightSum = 0;
      let weightedDepthSum = 0;
      let minDistance = Infinity;
      let neighborCount = 0;

      for (const p of validPoints) {
        const dist = getDistanceKm(lat, lng, p.lat, p.lng);
        if (dist < minDistance) {
          minDistance = dist;
        }

        if (dist <= params.maxRadiusKm) {
          const w = 1 / Math.pow(Math.max(dist, 0.05), params.power);
          weightSum += w;
          weightedDepthSum += w * p.depthCm;
          neighborCount++;
        }
      }

      if (neighborCount >= params.minPoints && weightSum > 0) {
        const depthCm = Math.round(weightedDepthSum / weightSum);
        const isReliable = minDistance <= params.uncertaintyThresholdKm;
        
        // Uncertainty estimation: scales with distance from nearest sample point
        const uncertaintyCm = Math.round(15 + minDistance * 3.4);

        cells.push({
          lat: Math.round(lat * 1000) / 1000,
          lng: Math.round(lng * 1000) / 1000,
          depthCm,
          uncertaintyCm,
          distanceToNearestKm: Math.round(minDistance * 10) / 10,
          isReliable,
          color: getDepthColor(depthCm, isReliable ? 0.72 : 0.25)
        });

        if (isReliable) {
          totalPeatCells++;
          sumDepthMeters += depthCm / 100;
        }
      }
    }
  }

  // Cross validation metrics
  const metrics = calculateCrossValidationMetrics(validPoints, params);

  // Carbon and Volume estimation for the area
  // Approximate cell area: 0.025 deg * 111 km * 0.025 deg * 111 km ~ 7.7 km2 = 770 ha
  const cellAreaHa = (res * 111) * (res * 111) * 100;
  const areaHa = Math.round(totalPeatCells * cellAreaHa);
  const meanDepthMeter = totalPeatCells > 0 ? Math.round((sumDepthMeters / totalPeatCells) * 100) / 100 : 0;
  
  // Volume (m3) = area (m2) * depth (m)
  // 1 ha = 10,000 m2
  const volumeM3 = areaHa * 10000 * meanDepthMeter;
  const volumeMillionM3 = Math.round(volumeM3 / 1000000);

  // Carbon stock (Mt C) = volume (m3) * bulk density (0.09 t/m3) * C fraction (0.54)
  const carbonStockTonnes = volumeM3 * 0.09 * 0.54;
  const carbonStockMt = Math.round((carbonStockTonnes / 1000000) * 10) / 10;
  const co2EquivalentMt = Math.round(carbonStockMt * 3.67 * 10) / 10;

  const carbonStats: CarbonEstimation = {
    areaHa,
    meanDepthMeter,
    volumeMillionM3,
    carbonStockMt,
    co2EquivalentMt
  };

  const gridRows = Math.ceil((bounds.maxLat - bounds.minLat) / res);
  const gridCols = Math.ceil((bounds.maxLng - bounds.minLng) / res);

  return {
    cells,
    bounds,
    gridRows,
    gridCols,
    metrics,
    carbonStats
  };
}

