import React from 'react';
import { PeatPoint } from '../types';
import { X, CheckCircle2, Clock, AlertTriangle, XCircle, MapPin, Camera } from 'lucide-react';

interface PointDetailModalProps {
  point: PeatPoint | null;
  onClose: () => void;
  onOpenVerify?: (point: PeatPoint) => void;
  canVerify?: boolean;
}

export const PointDetailModal: React.FC<PointDetailModalProps> = ({
  point,
  onClose,
  onOpenVerify,
  canVerify
}) => {
  if (!point) return null;

  const getStatusBadge = (status: PeatPoint['status']) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800">
            <Clock className="w-3.5 h-3.5" /> Menunggu
          </span>
        );
      case 'need_confirmation':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-950/80 text-sky-400 border border-sky-800">
            <AlertTriangle className="w-3.5 h-3.5" /> Konfirmasi
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-400 border border-rose-800">
            <XCircle className="w-3.5 h-3.5" /> Ditolak
          </span>
        );
    }
  };

  const getDepthClassLabel = (depth: number) => {
    if (depth < 50) return 'Dangkal (<50 cm)';
    if (depth < 100) return 'Sedang (50-100 cm)';
    if (depth < 200) return 'Dalam (100-200 cm)';
    if (depth < 300) return 'Sangat Dalam (200-300 cm)';
    return 'Sangat Tebal (>300 cm)';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-slate-200">
        
        {/* Header with generous padding */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-[#111827] z-10">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-sm px-3 py-1 rounded-lg bg-[#0a0e17] border border-slate-700 text-emerald-400">
              {point.id}
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100 truncate max-w-xs sm:max-w-md">
                {point.region}
              </h2>
              <span className="text-xs text-slate-400 block mt-0.5">Survei Lapangan: {point.date}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body with generous padding */}
        <div className="p-6 sm:p-8 space-y-6 text-xs sm:text-sm">
          
          {/* Depth Highlight */}
          <div className="p-5 rounded-2xl bg-[#0a0e17] border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block uppercase font-semibold">
                Kedalaman Gambut Terukur:
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold font-mono text-amber-400">
                  {point.depthCm}
                </span>
                <span className="text-sm text-slate-400 font-medium">cm ({(point.depthCm / 100).toFixed(2)} m)</span>
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                Kelas Ketebalan: {getDepthClassLabel(point.depthCm)}
              </span>
            </div>

            <div className="text-right space-y-2">
              <div>{getStatusBadge(point.status)}</div>
              <div className="text-xs text-slate-400">
                {point.baseReached ? '✓ Dasar mineral tercapai' : '⚠ Batas bawah (> cm)'}
              </div>
            </div>
          </div>

          {/* Photo & Properties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-2">Foto Dokumentasi Lapangan:</span>
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#0a0e17] aspect-video">
                <img
                  src={point.photoUrl}
                  alt={`Dokumentasi ${point.id}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="bg-[#0a0e17] p-4 sm:p-5 rounded-xl border border-slate-800 space-y-3">
              <div>
                <span className="text-slate-400 block text-xs mb-0.5">Koordinat & Akurasi:</span>
                <span className="font-mono text-slate-200 font-semibold">
                  {point.lat.toFixed(5)}°, {point.lng.toFixed(5)}°
                </span>
                <span className="text-xs text-slate-500 block">Akurasi GPS: ±{point.gpsAccuracy} meter</span>
              </div>

              <div>
                <span className="text-slate-400 block text-xs mb-0.5">Metode Pengukuran:</span>
                <span className="capitalize text-slate-200 font-medium">{point.method.replace('_', ' ')}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-xs mb-0.5">Tutupan Lahan & Drainase:</span>
                <span className="capitalize text-slate-200 font-medium">
                  {point.landCover} — {point.drainage}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-xs mb-0.5">Kontributor:</span>
                <span className="text-emerald-300 font-medium">
                  {point.isPublicContributor ? point.contributorName : 'Anonim (Permintaan Kontributor)'}
                </span>
              </div>
            </div>
          </div>

          {/* Surveyor notes */}
          {point.notes && (
            <div className="bg-[#0a0e17] p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1 font-semibold">Catatan Lapangan:</span>
              <p className="text-slate-300 italic leading-relaxed">"{point.notes}"</p>
            </div>
          )}

          {/* Rejection / Confirmation history */}
          {point.rejectionReason && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200">
              <strong className="block text-rose-400 mb-1">Alasan Penolakan:</strong>
              <p className="leading-relaxed">{point.rejectionReason}</p>
            </div>
          )}

          {point.verifierNotes && (
            <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-800 text-sky-200">
              <strong className="block text-sky-400 mb-1">Permintaan Klarifikasi:</strong>
              <p className="leading-relaxed">{point.verifierNotes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-slate-800 flex justify-between items-center bg-[#111827] rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm text-slate-300 transition"
          >
            Tutup
          </button>

          {canVerify && point.status !== 'verified' && onOpenVerify && (
            <button
              onClick={() => {
                onClose();
                onOpenVerify(point);
              }}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-emerald-950/50 transition"
            >
              Tinjau di Verifikasi
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
