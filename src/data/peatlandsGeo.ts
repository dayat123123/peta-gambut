import { PeatlandPolygon } from '../types';

// Pilot Peatland polygons approximating BBSDLP / KHG boundaries
export const PILOT_PEATLANDS: PeatlandPolygon[] = [
  {
    id: 'khg-riau-siak-bengkalis',
    name: 'KHG Sungai Siak - Sungai Rokan (Riau)',
    province: 'Riau',
    areaKm2: 4820,
    coordinates: [[
      [1.65, 101.10],
      [1.80, 101.45],
      [1.75, 102.10],
      [1.50, 102.40],
      [1.15, 102.35],
      [0.90, 102.00],
      [0.85, 101.50],
      [1.05, 101.15],
      [1.40, 100.95],
      [1.65, 101.10]
    ]]
  },
  {
    id: 'khg-riau-kampar',
    name: 'KHG Semenanjung Kampar (Riau)',
    province: 'Riau',
    areaKm2: 6700,
    coordinates: [[
      [0.75, 102.40],
      [0.85, 102.85],
      [0.65, 103.35],
      [0.30, 103.45],
      [0.10, 103.10],
      [0.15, 102.60],
      [0.45, 102.35],
      [0.75, 102.40]
    ]]
  },
  {
    id: 'khg-kalteng-sebangau-kahayan',
    name: 'KHG Sungai Sebangau - Sungai Kahayan (Kalteng)',
    province: 'Kalimantan Tengah',
    areaKm2: 5640,
    coordinates: [[
      [-2.15, 113.60],
      [-2.10, 114.15],
      [-2.45, 114.35],
      [-2.95, 114.40],
      [-3.35, 114.10],
      [-3.40, 113.70],
      [-3.05, 113.45],
      [-2.50, 113.50],
      [-2.15, 113.60]
    ]]
  },
  {
    id: 'khg-kalbar-kubu-raya',
    name: 'KHG Sungai Kapuas - Sungai Mendawak (Kalbar)',
    province: 'Kalimantan Barat',
    areaKm2: 3200,
    coordinates: [[
      [-0.10, 109.15],
      [-0.15, 109.65],
      [-0.45, 109.85],
      [-0.85, 109.70],
      [-0.80, 109.30],
      [-0.40, 109.10],
      [-0.10, 109.15]
    ]]
  }
];

// Calculate Haversine distance in km between two lat/lng pairs
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Ray-casting algorithm to test if point is inside a polygon ring
export function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [lat, lng] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]!;
    const [xj, yj] = polygon[j]!;
    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Check if a point is within any known peatland polygon
export function isPointInPeatland(lat: number, lng: number): boolean {
  for (const peat of PILOT_PEATLANDS) {
    for (const ring of peat.coordinates) {
      if (isPointInPolygon([lat, lng], ring)) {
        return true;
      }
    }
  }
  return false;
}

// Check distance to closest peatland polygon boundary or center (in km)
export function getDistanceToPeatlandKm(lat: number, lng: number): { distanceKm: number; nearestPeatName: string } {
  if (isPointInPeatland(lat, lng)) {
    return { distanceKm: 0, nearestPeatName: 'Di dalam kawasan gambut' };
  }

  let minDistance = Infinity;
  let nearestName = 'Kawasan Gambut';

  for (const peat of PILOT_PEATLANDS) {
    for (const ring of peat.coordinates) {
      for (const [pLat, pLng] of ring) {
        const d = getDistanceKm(lat, lng, pLat, pLng);
        if (d < minDistance) {
          minDistance = d;
          nearestName = peat.name;
        }
      }
    }
  }

  return { distanceKm: Math.round(minDistance * 10) / 10, nearestPeatName: nearestName };
}

// Boundary of Indonesia: Lat -11.0 to 6.0, Lng 95.0 to 141.0
export function isInsideIndonesia(lat: number, lng: number): boolean {
  return lat >= -11.0 && lat <= 6.0 && lng >= 95.0 && lng <= 141.0;
}

