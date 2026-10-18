import { PeatPoint } from '../types';
import { IDWGridCell } from './idw';

// Trigger download in browser
function downloadBlob(content: BlobPart, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 1. Export Points to GeoJSON
export function exportToGeoJSON(points: PeatPoint[], filename = 'titik-kedalaman-gambut.geojson'): void {
  const featureCollection = {
    type: 'FeatureCollection',
    name: 'Titik_Kedalaman_Gambut_Indonesia',
    crs: {
      type: 'name',
      properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' }
    },
    features: points.map(p => {
      // If point is obfuscated, lat/lng might have small offset or flag
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [p.lng, p.lat]
        },
        properties: {
          id: p.id,
          kedalaman_cm: p.depthCm,
          dasar_tercapai: p.baseReached ? 'Ya' : 'Tidak (Batas Bawah)',
          metode: p.method,
          tanggal: p.date,
          penutup_lahan: p.landCover,
          kondisi_drainase: p.drainage,
          status_verifikasi: p.status,
          akurasi_gps_m: p.gpsAccuracy,
          kontributor: p.isPublicContributor ? p.contributorName : 'Anonim',
          wilayah: p.region,
          catatan: p.notes || '',
          url_foto: p.photoUrl,
          terverifikasi_oleh: p.verifiedBy || '',
          tanggal_verifikasi: p.verifiedAt || ''
        }
      };
    })
  };

  const jsonString = JSON.stringify(featureCollection, null, 2);
  downloadBlob(jsonString, filename, 'application/geo+json');
}

// 2. Export Points to CSV
export function exportToCSV(points: PeatPoint[], filename = 'titik-kedalaman-gambut.csv'): void {
  const headers = [
    'ID Titik',
    'Latitude',
    'Longitude',
    'Akurasi GPS (m)',
    'Kedalaman Gambut (cm)',
    'Dasar Tercapai',
    'Metode Pengukuran',
    'Tanggal Survei',
    'Penutup Lahan',
    'Kondisi Drainase',
    'Status Verifikasi',
    'Kontributor',
    'Wilayah',
    'Catatan Lapangan',
    'URL Foto'
  ];

  const rows = points.map(p => [
    p.id,
    p.lat,
    p.lng,
    p.gpsAccuracy,
    p.depthCm,
    p.baseReached ? 'Ya' : 'Tidak',
    p.method,
    p.date,
    p.landCover,
    p.drainage,
    p.status,
    `"${(p.isPublicContributor ? p.contributorName : 'Anonim').replace(/"/g, '""')}"`,
    `"${p.region.replace(/"/g, '""')}"`,
    `"${(p.notes || '').replace(/"/g, '""')}"`,
    p.photoUrl
  ]);

  // UTF-8 BOM for Microsoft Excel compatibility
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

// 3. Export Raster Grid as standard ESRI ASCII Grid (.asc) for QGIS/ArcGIS import
export function exportRasterAscii(
  cells: IDWGridCell[],
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  resolution = 0.025,
  filename = 'model-kedalaman-gambut-idw.asc'
): void {
  const ncols = Math.round((bounds.maxLng - bounds.minLng) / resolution);
  const nrows = Math.round((bounds.maxLat - bounds.minLat) / resolution);
  const xllcorner = bounds.minLng;
  const yllcorner = bounds.minLat;
  const cellsize = resolution;
  const NODATA_value = -9999;

  // Build 2D matrix
  const matrix: number[][] = Array.from({ length: nrows }, () =>
    Array.from({ length: ncols }, () => NODATA_value)
  );

  for (const c of cells) {
    const col = Math.floor((c.lng - xllcorner) / cellsize);
    const row = Math.floor((bounds.maxLat - c.lat) / cellsize); // row 0 is topmost north
    if (row >= 0 && row < nrows && col >= 0 && col < ncols) {
      matrix[row]![col] = c.depthCm;
    }
  }

  let asc = `ncols         ${ncols}\n`;
  asc += `nrows         ${nrows}\n`;
  asc += `xllcorner     ${xllcorner.toFixed(4)}\n`;
  asc += `yllcorner     ${yllcorner.toFixed(4)}\n`;
  asc += `cellsize      ${cellsize.toFixed(4)}\n`;
  asc += `NODATA_value  ${NODATA_value}\n`;

  for (let r = 0; r < nrows; r++) {
    asc += matrix[r]!.join(' ') + '\n';
  }

  downloadBlob(asc, filename, 'text/plain;charset=utf-8;');
}

