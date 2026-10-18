import React from 'react';
import { ModelMetrics } from '../types';
import { AlertTriangle, Database, BookOpen, ShieldCheck } from 'lucide-react';

interface MethodologyViewProps {
  metrics: ModelMetrics;
}

export const MethodologyView: React.FC<MethodologyViewProps> = ({ metrics }) => {
  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-12 py-8 sm:py-12 space-y-8 text-slate-800">
      
      {/* Disclaimer Box with generous padding */}
      <div className="p-6 sm:p-7 rounded-2xl border border-amber-300 bg-amber-50 text-amber-950 text-xs sm:text-sm space-y-2 leading-relaxed shadow-xs">
        <div className="flex items-center gap-2.5 font-bold text-amber-900 text-sm sm:text-base">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-700" />
          <span>Pernyataan Keterbatasan & Penafian Resmi</span>
        </div>
        <p className="font-medium">
          Peta ketebalan gambut ini merupakan hasil pemodelan statistik spasial berbasis data kontribusi lapangan dan survei partisipatif. Informasi ini berfungsi sebagai rujukan pelengkap riset dan perencanaan, serta <strong>tidak menggantikan peta resmi atau survei penetapan oleh instansi berwenang</strong> (Kementerian Pertanian/BBSDLP, KLHK, BRGM, maupun Badan Informasi Geospasial).
        </p>
      </div>

      {/* Model Performance Metrics Card with generous padding */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Evaluasi Akurasi Model Spasial (Validasi Silang)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Dihitung langsung dari data bor lapangan yang telah lolos verifikasi.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Pembaruan Terakhir: {metrics.lastCalculated}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-xs text-slate-500 block font-bold">Root Mean Square Error (RMSE)</span>
            <div className="text-3xl font-extrabold font-mono text-emerald-700">
              ±{metrics.rmse} <span className="text-xs text-slate-500 font-sans font-medium">cm</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mt-1 font-medium">
              Standar deviasi residu prediksi terhadap titik uji lapangan (hold-out validation).
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-xs text-slate-500 block font-bold">Mean Absolute Error (MAE)</span>
            <div className="text-3xl font-extrabold font-mono text-amber-700">
              {metrics.mae} <span className="text-xs text-slate-500 font-sans font-medium">cm</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mt-1 font-medium">
              Rata-rata selisih absolut antara nilai estimasi dan bor aktual di lapangan.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-xs text-slate-500 block font-bold">Koefisien Determinasi (R²)</span>
            <div className="text-3xl font-extrabold font-mono text-sky-700">
              {metrics.r2}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mt-1 font-medium">
              Proporsi varians kedalaman yang berhasil dijelaskan oleh model spasial.
            </p>
          </div>
        </div>
      </div>

      {/* Tahapan Pemodelan Spasial */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Tahapan Metodologi Perhitungan Spasial
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs sm:text-sm">
          <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-emerald-800">MVP (Aktif)</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 font-bold">Operasional</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Inverse Distance Weighting (IDW)</h3>
            <p className="text-slate-600 leading-relaxed text-xs">
              Metode interpolasi deterministik berbasis pembobotan kuadrat kebalikan jarak (p=2.0). Prediksi dipotong secara presisi menggunakan masker sebaran gambut BBSDLP. Area dengan jarak &gt;18 km dari titik bor terdekat ditandai sebagai zona kurang data.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-700">Fase 2a</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">Riset</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Kriging Geostatistik</h3>
            <p className="text-slate-600 leading-relaxed text-xs">
              Memodelkan struktur korelasi spasial menggunakan fungsi semivariogram empiris. Menghasilkan peta variansi estimasi kuantitatif untuk memvisualisasikan ketidakpastian matematis.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-700">Fase 2b</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">Rencana</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Machine Learning (Random Forest)</h3>
            <p className="text-slate-600 leading-relaxed text-xs">
              Mengintegrasikan data bor dengan variabel lingkungan: topografi DEMNAS, Sentinel-1 SAR (karakteristik basah/kering), Sentinel-2 (NDWI/NDVI), dan jarak ke kanal drainase.
            </p>
          </div>
        </div>
      </div>

      {/* Sumber Data & Atribusi */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Sumber Data Pendukung & Lisensi
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase text-xs font-bold">
                <th className="py-3 pr-4">Dataset</th>
                <th className="py-3 pr-4">Institusi Penerbit</th>
                <th className="py-3 pr-4">Skala / Resolusi</th>
                <th className="py-3">Peruntukan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3.5 pr-4 font-bold text-slate-900">Peta Sebaran Lahan Gambut</td>
                <td className="py-3.5 pr-4">BBSDLP / Balitbangtan Kementan</td>
                <td className="py-3.5 pr-4 font-mono text-xs">1:250.000</td>
                <td className="py-3.5">Masker batas interpolasi kubah gambut</td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-bold text-slate-900">Batas Kesatuan Hidrologis Gambut (KHG)</td>
                <td className="py-3.5 pr-4">KLHK & BRGM</td>
                <td className="py-3.5 pr-4 font-mono text-xs">1:50.000</td>
                <td className="py-3.5">Zonasi batas lanskap hidrologis</td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-bold text-slate-900">DEMNAS</td>
                <td className="py-3.5 pr-4">Badan Informasi Geospasial (BIG)</td>
                <td className="py-3.5 pr-4 font-mono text-xs">~8.1 meter</td>
                <td className="py-3.5">Elevasi mikro dan analisis morfologi kubah</td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-bold text-slate-900">Global Wetlands Map</td>
                <td className="py-3.5 pr-4">CIFOR (Gumbricht et al. 2017)</td>
                <td className="py-3.5 pr-4 font-mono text-xs">~236 meter</td>
                <td className="py-3.5">Pembanding ketebalan gambut skala global</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Protokol & Panduan Keselamatan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-4 text-xs sm:text-sm shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base border-b border-slate-100 pb-3">
            Ringkasan Protokol Pengukuran Lapangan
          </h3>
          <ul className="space-y-2.5 text-slate-600 leading-relaxed list-disc list-inside font-medium">
            <li>Pastikan akurasi GPS pada perangkat mencapai \(\le 5\) meter sebelum mencatat koordinat.</li>
            <li>Singkirkan lapisan serasah daun segar hingga menyentuh permukaan gambut asli.</li>
            <li>Lakukan pengeboran vertikal bertahap dengan batang ekstensi 1 meter.</li>
            <li>Periksa mata bor terdalam: jika menyentuh lempung/pasir dasar, catat <em>Dasar Tercapai: Ya</em>. Jika terhalang kayu, catat <em>Tidak (Batas Bawah)</em>.</li>
            <li>Wajib mengambil foto skala meteran berdampingan dengan sampel bor.</li>
          </ul>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-4 text-xs sm:text-sm shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base border-b border-slate-100 pb-3">
            Panduan Keselamatan di Lahan Gambut
          </h3>
          <ul className="space-y-2.5 text-slate-600 leading-relaxed list-disc list-inside font-medium">
            <li>Survei wajib minimal berdua (buddy system). Jangan pernah masuk sendirian ke kubah gambut.</li>
            <li>Uji setiap pijakan tanah di dekat tepi kanal dengan tongkat kayu untuk mencegah amblas.</li>
            <li>Bawa persediaan air minum minimal 3 liter per hari dan perlengkapan P3K lapangan.</li>
            <li>Waspada bahaya asap dan kebakaran bawah tanah (*smouldering*) pada musim kemarau.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
