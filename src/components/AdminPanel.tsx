import React, { useState } from 'react';
import { PeatPoint, IDWParameters } from '../types';
import { DEFAULT_IDW_PARAMS } from '../services/idw';
import { resetToSeedData, savePoints } from '../services/storage';
import { Sliders, RefreshCw, CheckCircle2 } from 'lucide-react';

interface AdminPanelProps {
  points: PeatPoint[];
  onPointsReset: (newPoints: PeatPoint[]) => void;
  idwParams: IDWParameters;
  onUpdateIdwParams: (params: IDWParameters) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  points,
  onPointsReset,
  idwParams,
  onUpdateIdwParams
}) => {
  const [power, setPower] = useState<number>(idwParams.power);
  const [maxRadiusKm, setMaxRadiusKm] = useState<number>(idwParams.maxRadiusKm);
  const [gridRes, setGridRes] = useState<number>(idwParams.gridResolution);
  const [uncertaintyThresholdKm, setUncertaintyThresholdKm] = useState<number>(idwParams.uncertaintyThresholdKm);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSaveParams = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateIdwParams({
      ...idwParams,
      power,
      maxRadiusKm,
      gridResolution: gridRes,
      uncertaintyThresholdKm
    });
    setFeedback('Parameter model IDW berhasil diperbarui.');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleResetSeed = () => {
    if (window.confirm('Reset database ke data percontohan awal (325 titik)?')) {
      const seed = resetToSeedData();
      onPointsReset(seed);
      setFeedback('Database berhasil direset ke data percontohan.');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleAddTestPoints = () => {
    const testPoints: PeatPoint[] = [];
    const now = new Date().toISOString().substring(0, 10);
    for (let i = 1; i <= 10; i++) {
      const lat = 1.30 + Math.random() * 0.3;
      const lng = 101.75 + Math.random() * 0.4;
      const depth = Math.round(90 + Math.random() * 250);
      testPoints.push({
        id: `PT-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
        lat: Math.round(lat * 100000) / 100000,
        lng: Math.round(lng * 100000) / 100000,
        gpsAccuracy: 3.0,
        depthCm: depth,
        baseReached: true,
        method: 'bor_gambut',
        date: now,
        landCover: 'hutan',
        drainage: 'alami',
        photoUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80',
        notes: 'Titik uji coba verifikasi.',
        contributorId: 'TESTER',
        contributorName: 'Penguji Sistem',
        isPublicContributor: true,
        isObfuscated: false,
        status: 'pending',
        region: 'Riau (Siak & Bengkalis)',
        createdAt: new Date().toISOString()
      });
    }

    const updated = [...testPoints, ...points];
    savePoints(updated);
    onPointsReset(updated);
    setFeedback('10 titik uji baru ditambahkan ke antrean verifikasi.');
    setTimeout(() => setFeedback(null), 3000);
  };

  const uniqueContributors = new Set(points.map(p => p.contributorName)).size;
  const verifiedCount = points.filter(p => p.status === 'verified').length;
  const pendingCount = points.filter(p => p.status === 'pending').length;

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-12 py-8 sm:py-12 space-y-8 text-slate-800">
      
      {/* Title & Quick Stats with generous padding */}
      <div className="border-b border-slate-200 pb-6 space-y-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Pengaturan Sistem & Parameter Spasial
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Konfigurasi formula matematika pemodelan IDW dan pemeliharaan basis data survei.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 text-xs sm:text-sm">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 block text-xs uppercase font-bold">Total Titik</span>
            <span className="text-2xl font-extrabold font-mono text-slate-900 mt-1 block">{points.length}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 block text-xs uppercase font-bold">Terverifikasi</span>
            <span className="text-2xl font-extrabold font-mono text-emerald-700 mt-1 block">{verifiedCount}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 block text-xs uppercase font-bold">Antrean Pending</span>
            <span className="text-2xl font-extrabold font-mono text-amber-700 mt-1 block">{pendingCount}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 block text-xs uppercase font-bold">Kontributor Aktif</span>
            <span className="text-2xl font-extrabold font-mono text-sky-700 mt-1 block">{uniqueContributors}</span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center gap-2.5 shadow-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Model Parameter Form with generous padding */}
      <form onSubmit={handleSaveParams} className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-6 text-xs sm:text-sm shadow-xs">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-600" />
            <span>Konfigurasi Parameter Pemodelan IDW</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Power Parameter (p): <strong className="text-slate-900 font-mono">{power}</strong>
            </label>
            <input
              type="range"
              min="1.0"
              max="4.0"
              step="0.1"
              value={power}
              onChange={(e) => setPower(parseFloat(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <span className="text-xs text-slate-500 block mt-1 font-medium">Nilai standar p=2.0 (Inverse Distance Squared).</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Radius Cari Maksimal: <strong className="text-slate-900 font-mono">{maxRadiusKm} km</strong>
            </label>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={maxRadiusKm}
              onChange={(e) => setMaxRadiusKm(parseInt(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Resolusi Grid Spasial:
            </label>
            <select
              value={gridRes}
              onChange={(e) => setGridRes(parseFloat(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:border-emerald-600"
            >
              <option value="0.04">0.040° (~4.4 km) — Cepat</option>
              <option value="0.025">0.025° (~2.7 km) — Standar Rekomendasi</option>
              <option value="0.015">0.015° (~1.6 km) — Rinci</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Ambang Batas Kurang Data: <strong className="text-rose-700 font-mono">{uncertaintyThresholdKm} km</strong>
            </label>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={uncertaintyThresholdKm}
              onChange={(e) => setUncertaintyThresholdKm(parseInt(e.target.value))}
              className="w-full accent-rose-600"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs"
          >
            Terapkan Perubahan Parameter
          </button>
        </div>
      </form>

      {/* Database Tools with generous padding */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-5 text-xs sm:text-sm shadow-xs">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">
            Alat Pengujian & Pemeliharaan Database
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Tambah Titik Simulasi Uji Coba</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Buat 10 titik acak baru di wilayah Riau untuk menguji alur verifikasi.
            </p>
            <button
              onClick={handleAddTestPoints}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold transition shadow-xs"
            >
              + 10 Titik Uji
            </button>
          </div>

          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-rose-700 text-sm">Reset Data MVP</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Kembalikan basis data ke kondisi awal 325 titik survei percontohan.
            </p>
            <button
              onClick={handleResetSeed}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Database</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
