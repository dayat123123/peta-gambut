import React, { useState } from 'react';
import { PeatPoint, VerificationStatus, AuthUser } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Filter, 
  ArrowLeft,
  Camera,
  MapPin,
  Check,
  ShieldCheck
} from 'lucide-react';

interface VerificationQueueProps {
  points: PeatPoint[];
  currentUser?: AuthUser | null;
  onUpdateStatus: (
    pointId: string,
    status: VerificationStatus,
    options?: { rejectionReason?: string; verifierNotes?: string }
  ) => void;
  selectedRegion: string;
}

export const VerificationQueue: React.FC<VerificationQueueProps> = ({
  points,
  currentUser,
  onUpdateStatus,
  selectedRegion
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Mobile detail view toggle
  const [showMobileDetail, setShowMobileDetail] = useState<boolean>(false);

  // Modals
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmationNotes, setConfirmationNotes] = useState<string>('');

  const filteredPoints = points.filter((p) => {
    const matchesRegion =
      selectedRegion === 'all' ||
      (selectedRegion === 'riau' && p.region.includes('Riau')) ||
      (selectedRegion === 'kalteng' && p.region.includes('Kalimantan Tengah'));

    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesSearch =
      searchTerm === '' ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.contributorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.region.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesRegion && matchesStatus && matchesSearch;
  });

  const activePoint = points.find((p) => p.id === (selectedPointId || filteredPoints[0]?.id));

  const handleSelectPoint = (id: string) => {
    setSelectedPointId(id);
    setShowMobileDetail(true);
  };

  const handleApprove = (pt: PeatPoint) => {
    onUpdateStatus(pt.id, 'verified');
  };

  const handleConfirmReject = () => {
    if (!activePoint || !rejectionReason.trim()) {
      alert('Alasan penolakan wajib dicantumkan.');
      return;
    }
    onUpdateStatus(activePoint.id, 'rejected', { rejectionReason });
    setShowRejectModal(false);
    setRejectionReason('');
  };

  const handleConfirmNeedClarification = () => {
    if (!activePoint || !confirmationNotes.trim()) {
      alert('Tuliskan catatan permohonan klarifikasi.');
      return;
    }
    onUpdateStatus(activePoint.id, 'need_confirmation', { verifierNotes: confirmationNotes });
    setShowConfirmModal(false);
    setConfirmationNotes('');
  };

  const pendingCount = points.filter((p) => p.status === 'pending').length;
  const verifiedCount = points.filter((p) => p.status === 'verified').length;
  const needConfirmCount = points.filter((p) => p.status === 'need_confirmation').length;
  const rejectedCount = points.filter((p) => p.status === 'rejected').length;

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-8 sm:py-12 space-y-8">
      
      {/* Header with generous breathing room */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Antrean & Verifikasi Data Survei Lapangan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Peninjauan bukti foto dan validasi koordinat sebelum titik bor dimasukkan ke dalam model spasial IDW.
        </p>

        {/* Status Count Cards with generous padding */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <button
            onClick={() => setFilterStatus('pending')}
            className={`p-4 sm:p-5 rounded-2xl border text-left transition-all ${
              filterStatus === 'pending'
                ? 'bg-amber-50 border-amber-300 shadow-sm ring-1 ring-amber-400/50'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <span className="text-xs block font-bold uppercase tracking-wider text-slate-500">Menunggu</span>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-700 mt-1 block">{pendingCount}</span>
          </button>

          <button
            onClick={() => setFilterStatus('need_confirmation')}
            className={`p-4 sm:p-5 rounded-2xl border text-left transition-all ${
              filterStatus === 'need_confirmation'
                ? 'bg-sky-50 border-sky-300 shadow-sm ring-1 ring-sky-400/50'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <span className="text-xs block font-bold uppercase tracking-wider text-slate-500">Klarifikasi</span>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-sky-700 mt-1 block">{needConfirmCount}</span>
          </button>

          <button
            onClick={() => setFilterStatus('verified')}
            className={`p-4 sm:p-5 rounded-2xl border text-left transition-all ${
              filterStatus === 'verified'
                ? 'bg-emerald-50 border-emerald-300 shadow-sm ring-1 ring-emerald-400/50'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <span className="text-xs block font-bold uppercase tracking-wider text-slate-500">Terverifikasi</span>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700 mt-1 block">{verifiedCount}</span>
          </button>

          <button
            onClick={() => setFilterStatus('rejected')}
            className={`p-4 sm:p-5 rounded-2xl border text-left transition-all ${
              filterStatus === 'rejected'
                ? 'bg-rose-50 border-rose-300 shadow-sm ring-1 ring-rose-400/50'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <span className="text-xs block font-bold uppercase tracking-wider text-slate-500">Ditolak</span>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-700 mt-1 block">{rejectedCount}</span>
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 mt-5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari ID Titik, nama kontributor, atau wilayah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 shadow-xs focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 font-medium shadow-xs focus:outline-none focus:border-emerald-600 w-full sm:w-auto"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu Verifikasi</option>
              <option value="need_confirmation">Perlu Konfirmasi</option>
              <option value="verified">Terverifikasi</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Dual Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: List (Hidden on mobile if detail is open) */}
        <div className={`lg:col-span-5 space-y-3 ${showMobileDetail ? 'hidden lg:block' : 'block'}`}>
          <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-700 px-1">
            <span>Daftar Titik Survei ({filteredPoints.length})</span>
          </div>

          <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
            {filteredPoints.length === 0 ? (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-xs sm:text-sm shadow-xs">
                Tidak ada data pada kategori ini.
              </div>
            ) : (
              filteredPoints.map((pt) => {
                const isSelected = activePoint?.id === pt.id;
                return (
                  <div
                    key={pt.id}
                    onClick={() => handleSelectPoint(pt.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                      isSelected
                        ? 'bg-emerald-50/50 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <img
                      src={pt.photoUrl}
                      alt="Foto bor"
                      className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {pt.id}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{pt.date}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-base font-extrabold font-mono text-amber-700">
                          {pt.depthCm} cm
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {pt.baseReached ? '(Dasar ✓)' : '(Batas bawah)'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 truncate mt-1 font-medium">
                        {pt.contributorName}
                      </div>

                      {(pt.anomalous || pt.duplicate) && (
                        <div className="flex items-center gap-2 mt-2">
                          {pt.anomalous && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-300">
                              Anomali Nilai
                            </span>
                          )}
                          {pt.duplicate && (
                            <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md border border-rose-300">
                              Duplikat
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detail Inspection Workspace */}
        <div className={`lg:col-span-7 ${!showMobileDetail ? 'hidden lg:block' : 'block'}`}>
          {activePoint ? (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm sticky top-24">
              
              {/* Mobile Back Button */}
              <div className="lg:hidden pb-3 border-b border-slate-100">
                <button
                  onClick={() => setShowMobileDetail(false)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Daftar Antrean</span>
                </button>
              </div>

              {/* Title & Status */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg font-mono font-bold text-emerald-800">
                      {activePoint.id}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-500 font-medium">• {activePoint.region}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Kontributor: <span className="text-slate-900 font-bold">{activePoint.contributorName}</span>
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-extrabold font-mono text-amber-700">
                    {activePoint.depthCm} cm
                  </div>
                  <span className="text-xs text-slate-500 mt-0.5 block font-medium">
                    {activePoint.baseReached ? 'Dasar mineral tercapai' : 'Batas bawah (> cm)'}
                  </span>
                </div>
              </div>

              {/* Photo & Properties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">
                    Foto Dokumentasi Bor:
                  </label>
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video shadow-xs">
                    <img
                      src={activePoint.photoUrl}
                      alt="Foto Bor"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 text-xs sm:text-sm space-y-3">
                  <div>
                    <span className="text-slate-500 block text-xs mb-0.5 font-medium">Koordinat & Akurasi:</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {activePoint.lat.toFixed(5)}°, {activePoint.lng.toFixed(5)}° (±{activePoint.gpsAccuracy}m)
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-xs mb-0.5 font-medium">Metode:</span>
                    <span className="text-slate-900 capitalize font-semibold">
                      {activePoint.method.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-xs mb-0.5 font-medium">Tutupan Lahan & Drainase:</span>
                    <span className="text-slate-900 capitalize font-semibold">
                      {activePoint.landCover} — {activePoint.drainage}
                    </span>
                  </div>

                  {activePoint.isObfuscated && (
                    <div className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200 leading-relaxed font-medium">
                      Titik di lahan privat: Koordinat dikaburkan radius 1 km pada tampilan publik.
                    </div>
                  )}
                </div>
              </div>

              {/* Field notes */}
              {activePoint.notes && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm">
                  <span className="text-slate-500 block text-xs mb-1 font-bold">Catatan Surveyor:</span>
                  <p className="text-slate-800 italic leading-relaxed">"{activePoint.notes}"</p>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs sm:text-sm text-slate-600 font-medium">
                  Status: <strong className="text-slate-900 uppercase font-bold">{activePoint.status}</strong>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 transition"
                  >
                    Tolak Titik
                  </button>

                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 transition"
                  >
                    Minta Konfirmasi
                  </button>

                  <button
                    onClick={() => handleApprove(activePoint)}
                    className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                  >
                    Setujui Titik
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-xs sm:text-sm shadow-xs">
              Pilih satu titik di daftar sebelah kiri untuk mulai meninjau rincian.
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && activePoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-rose-800">Tolak Titik {activePoint.id}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Cantumkan alasan penolakan secara jelas agar kontributor memahami penyebab data tidak lolos verifikasi.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contoh: Foto tidak menampilkan skala kedalaman pada mata bor..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-rose-600"
            />
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Konfirmasi Penolakan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Request Modal */}
      {showConfirmModal && activePoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-sky-800">Minta Konfirmasi {activePoint.id}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Kirimkan catatan permohonan klarifikasi ke kontributor mengenai pengukuran ini.
            </p>
            <textarea
              rows={3}
              value={confirmationNotes}
              onChange={(e) => setConfirmationNotes(e.target.value)}
              placeholder="Contoh: Mohon konfirmasi ulang skala kedalaman bor atau koordinat lokasi..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-sky-600"
            />
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmNeedClarification}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs"
              >
                Kirim Permintaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
