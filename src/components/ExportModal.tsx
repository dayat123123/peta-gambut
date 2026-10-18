import React, { useState } from 'react';
import { PeatPoint, IDWParameters } from '../types';
import { exportToGeoJSON, exportToCSV, exportRasterAscii } from '../services/export';
import { runIDWInterpolation } from '../services/idw';
import { Download, CheckCircle2, FileCode, FileSpreadsheet, Layers } from 'lucide-react';

interface ExportModalProps {
  points: PeatPoint[];
  selectedRegion: string;
  idwParams: IDWParameters;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  points,
  selectedRegion,
  idwParams
}) => {
  const [exportScope, setExportScope] = useState<'verified_only' | 'all'>('verified_only');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const targetPoints = points.filter((p) => {
    if (exportScope === 'verified_only' && p.status !== 'verified') return false;
    if (selectedRegion === 'riau' && !p.region.includes('Riau')) return false;
    if (selectedRegion === 'kalteng' && !p.region.includes('Kalimantan Tengah')) return false;
    return true;
  });

  const handleDownloadGeoJSON = () => {
    const filename = `titik-kedalaman-gambut-${selectedRegion}-${exportScope}.geojson`;
    exportToGeoJSON(targetPoints, filename);
    setDownloadSuccess(`File GeoJSON (${targetPoints.length} fitur titik) berhasil diunduh.`);
  };

  const handleDownloadCSV = () => {
    const filename = `titik-kedalaman-gambut-${selectedRegion}-${exportScope}.csv`;
    exportToCSV(targetPoints, filename);
    setDownloadSuccess(`File CSV (${targetPoints.length} baris data) berhasil diunduh.`);
  };

  const handleDownloadRaster = () => {
    const idwRes = runIDWInterpolation(points, selectedRegion, idwParams);
    const filename = `raster-idw-kedalaman-gambut-${selectedRegion}.asc`;
    exportRasterAscii(idwRes.cells, idwRes.bounds, idwParams.gridResolution, filename);
    setDownloadSuccess(`Raster ESRI ASCII Grid (${idwRes.cells.length} sel interpolasi) berhasil diunduh untuk SIG.`);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-12 py-8 sm:py-12 space-y-8 text-slate-800">
      
      {/* Title & Scope with generous padding */}
      <div className="border-b border-slate-200 pb-6 space-y-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Pusat Unduh & Ekspor Data Geospasial
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Data survei titik bor dan permukaan raster interpolasi ketebalan gambut dalam format standar SIG.
          </p>
        </div>

        {/* Scope Selector Box */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <span className="text-xs sm:text-sm font-bold text-slate-900 block">Kriteria Data Ekspor:</span>
            <span className="text-xs text-slate-500 mt-0.5 block">
              Total titik siap unduh: <strong className="text-emerald-700 font-mono font-bold">{targetPoints.length}</strong> titik (Wilayah: {selectedRegion.toUpperCase()})
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setExportScope('verified_only')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                exportScope === 'verified_only'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Hanya Terverifikasi
            </button>
            <button
              onClick={() => setExportScope('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                exportScope === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Semua Status
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {downloadSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{downloadSuccess}</span>
          </div>
          <button
            onClick={() => setDownloadSuccess(null)}
            className="text-slate-500 hover:text-slate-900 font-bold px-2 py-1"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Export Cards Grid with generous padding */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* GeoJSON Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-5 shadow-xs hover:border-slate-300 transition">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Vektor GeoJSON</h2>
              <span className="text-xs font-mono text-emerald-700 uppercase font-bold">.geojson (WGS84)</span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              Format standar pertukaran fitur spasial dengan koordinat WGS84, atribut penutup lahan, metode, drainase, dan URL foto.
            </p>
          </div>

          <button
            onClick={handleDownloadGeoJSON}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Unduh GeoJSON</span>
          </button>
        </div>

        {/* CSV Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-5 shadow-xs hover:border-slate-300 transition">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Tabel Data CSV</h2>
              <span className="text-xs font-mono text-amber-700 uppercase font-bold">.csv (Excel UTF-8)</span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              Format tabulasi tabular yang kompatibel langsung dengan Microsoft Excel, Google Sheets, R, dan Python Pandas.
            </p>
          </div>

          <button
            onClick={handleDownloadCSV}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Tabel CSV</span>
          </button>
        </div>

        {/* Raster ASCII Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-5 shadow-xs hover:border-slate-300 transition">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Raster Interpolasi</h2>
              <span className="text-xs font-mono text-sky-700 uppercase font-bold">ESRI ASCII Grid (.asc)</span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              Permukaan raster kontinu hasil pemodelan IDW terpotong masker gambut, siap dianalisis di QGIS, ArcGIS, dan GDAL.
            </p>
          </div>

          <button
            onClick={handleDownloadRaster}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Raster (.asc)</span>
          </button>
        </div>
      </div>

      {/* Licensing Info */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-600 leading-relaxed shadow-xs">
        <strong className="text-slate-900">Ketentuan Lisensi Data:</strong> Seluruh data terbuka didistribusikan di bawah lisensi terbuka <em>Creative Commons Attribution 4.0 International (CC BY 4.0)</em>. Pengguna bebas menyalin dan mengadaptasi data dengan mencantumkan atribusi kepada <em>PeatDepth ID dan para kontributor survei lapangan</em>.
      </div>
    </div>
  );
};
