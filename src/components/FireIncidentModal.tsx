import React, { useState } from 'react';
import { AuthUser, FireIncidentReport, PeatFireType, UserRole } from '../types';
import { addFireIncident } from '../services/fireService';
import { 
  X, 
  Flame, 
  MapPin, 
  Navigation, 
  Camera, 
  Droplets, 
  Wind, 
  AlertTriangle, 
  CheckCircle2, 
  FileText,
  ShieldCheck
} from 'lucide-react';

interface FireIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onIncidentAdded: (newIncident: FireIncidentReport) => void;
  initialCoords?: { lat: number; lng: number } | null;
}

export const FireIncidentModal: React.FC<FireIncidentModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onIncidentAdded,
  initialCoords
}) => {
  const [lat, setLat] = useState<number>(initialCoords?.lat || 1.4880);
  const [lng, setLng] = useState<number>(initialCoords?.lng || 101.9180);
  const [region, setRegion] = useState<string>('Riau (Siak & Bengkalis)');
  const [reporterName, setReporterName] = useState<string>(currentUser?.name || '');
  const [reporterPhone, setReporterPhone] = useState<string>(currentUser?.phone || '');
  const [fireType, setFireType] = useState<PeatFireType>('gambut_dalam');
  const [estimatedAreaHa, setEstimatedAreaHa] = useState<number>(1.5);
  const [hasDepthMeasurement, setHasDepthMeasurement] = useState<boolean>(false);
  const [burnedPeatDepthCm, setBurnedPeatDepthCm] = useState<number>(40);
  const [waterAvailability, setWaterAvailability] = useState<'cukup_tersedia' | 'debit_kritis' | 'sumber_kering' | 'tidak_ada_kanal'>('cukup_tersedia');
  const [smokeDensity, setSmokeDensity] = useState<'tebal_pekat' | 'sedang' | 'tipis'>('tebal_pekat');
  const [assignedTeam, setAssignedTeam] = useState<string>('Manggala Agni & MPA Terdekat');
  const [notes, setNotes] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const isProfessional = currentUser?.role === 'kontributor' || currentUser?.role === 'verifikator' || currentUser?.role === 'admin';

  const handleGetGPS = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          setLat(Math.round(pos.coords.latitude * 100000) / 100000);
          setLng(Math.round(pos.coords.longitude * 100000) / 100000);
        },
        () => {
          setIsLocating(false);
          alert('Gagal mengambil titik GPS. Koordinat diset default Siak.');
          setLat(1.4880);
          setLng(101.9180);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporterName.trim()) {
      alert('Nama pelapor wajib diisi.');
      return;
    }

    setSubmitting(true);

    const initialStatus = isProfessional 
      ? (currentUser?.role === 'verifikator' || currentUser?.role === 'admin' ? 'operasi_pemadaman' : 'terkonfirmasi_aktif')
      : 'menunggu_verifikasi';

    const newIncident = addFireIncident({
      lat,
      lng,
      region,
      reporterName: reporterName.trim(),
      reporterRole: currentUser?.role || 'pengunjung',
      reporterPhone: reporterPhone.trim() || undefined,
      reporterInstitution: currentUser?.institution || (isProfessional ? 'Masyarakat Peduli Api (MPA)' : 'Warga Masyarakat'),
      fireType,
      estimatedAreaHa,
      burnedPeatDepthCm: hasDepthMeasurement ? burnedPeatDepthCm : undefined,
      hasDepthMeasurement,
      waterAvailability,
      smokeDensity,
      photoUrl: photoUrl.trim() || undefined,
      notes,
      assignedTeam: isProfessional ? assignedTeam : undefined,
      status: initialStatus
    });

    setTimeout(() => {
      setSubmitting(false);
      onIncidentAdded(newIncident);
      onClose();
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-2xs">
              <Flame className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {isProfessional ? 'Laporan Insiden Karhutla Terpadu (MPA / Ahli)' : 'Lapor Cepat Kejadian Karhutla (Warga / Publik)'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Pencatatan data titik koordinat, karakteristik kebakaran gambut, dan estimasi emisi karbon
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(85vh-5rem)] overflow-y-auto text-xs">
          
          {/* Identity Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-slate-700">
            <div>
              <span className="font-semibold block">Pelapor Insiden:</span>
              <span className="text-slate-500">{currentUser ? `${currentUser.name} (${currentUser.role.toUpperCase()})` : 'Masyarakat / Pengunjung Publik'}</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              isProfessional ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'
            }`}>
              {isProfessional ? 'Terverifikasi Lapangan' : 'Laporan Publik'}
            </span>
          </div>

          {/* Basic Reporter Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Lengkap Pelapor <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                required
                placeholder="Misal: Budi Santoso"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                placeholder="0812-xxxx-xxxx"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600"
              />
            </div>
          </div>

          {/* Coordinates & Region */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                Lokasi Koordinat Titik Api
              </span>
              <button
                type="button"
                onClick={handleGetGPS}
                disabled={isLocating}
                className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-800"
              >
                <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Mengunci GPS...' : 'Gunakan GPS Saya'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-slate-900"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-slate-900"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Wilayah</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800"
                >
                  <option value="Riau (Siak & Bengkalis)">Siak & Bengkalis (Riau)</option>
                  <option value="Riau (Semenanjung Kampar)">Semenanjung Kampar (Riau)</option>
                  <option value="Kalimantan Tengah (Pulang Pisau - Sebangau)">Pulang Pisau (Kalteng)</option>
                  <option value="Wilayah Gambut Lainnya">Wilayah Lainnya</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fire Characteristics */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              Karakteristik Kebakaran Gambut
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Jenis Kebakaran
                </label>
                <select
                  value={fireType}
                  onChange={(e) => setFireType(e.target.value as PeatFireType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                >
                  <option value="gambut_dalam">Gambut Dalam (Smoldering di Bawah Permukaan)</option>
                  <option value="asap_smoldering">Kepulan Asap Tebal Tanpa Lidah Api</option>
                  <option value="api_permukaan">Api Tajuk / Permukaan Semak Belukar</option>
                  <option value="kombinasi">Kombinasi (Permukaan & Bawah Tanah)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Kepekatan Asap
                </label>
                <select
                  value={smokeDensity}
                  onChange={(e) => setSmokeDensity(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                >
                  <option value="tebal_pekat">Tebal Pekat (Jarak Pandang &lt; 50m, Berbau Belerang)</option>
                  <option value="sedang">Sedang (Jarak Pandang 50 - 200m)</option>
                  <option value="tipis">Tipis (Asap Awal)</option>
                </select>
              </div>
            </div>

            {/* Luas Terbakar & Quick Preset */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-semibold text-xs">
                  Estimasi Luas Terbakar (Hektare)
                </label>
                <span className="text-[10px] text-slate-400">Pilih cepat atau ketik angka</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1000"
                  value={estimatedAreaHa}
                  onChange={(e) => setEstimatedAreaHa(parseFloat(e.target.value) || 0.1)}
                  className="w-28 bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold text-rose-700 text-xs"
                  required
                />
                <div className="flex flex-wrap gap-1">
                  {[0.5, 1.0, 2.0, 5.0, 10.0].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setEstimatedAreaHa(preset)}
                      className={`px-2 py-1 rounded text-[11px] font-medium border transition ${
                        estimatedAreaHa === preset
                          ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {preset} Ha
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Opsional Sondir / Pengukuran Gambut (Minim Infrastruktur) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDepthMeasurement}
                  onChange={(e) => setHasDepthMeasurement(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800">
                    Memiliki Alat Ukur Kedalaman Gambut (Bor / Sondir Manual)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Centang hanya jika tim di lapangan membawa bor gambut fisik. Jika tidak ada alat, sistem otomatis memakai rata-rata indikatif nasional (~20 cm) agar laporan darurat tetap terkirim cepat tanpa kendala alat.
                  </p>
                </div>
              </label>

              {hasDepthMeasurement && (
                <div className="pt-2 pl-6 border-t border-slate-200/60 mt-2">
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                    Kedalaman Gambut Terbakar Terukur (cm)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="5"
                      max="400"
                      value={burnedPeatDepthCm}
                      onChange={(e) => setBurnedPeatDepthCm(parseInt(e.target.value) || 20)}
                      className="w-32 bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-amber-800 text-xs"
                      required={hasDepthMeasurement}
                    />
                    <span className="text-[11px] text-slate-500">
                      cm terbakar di bawah muka gambut
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Water Availability & Assignment */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-sky-600" />
              Kondisi Sumber Air Pemadam
            </span>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Ketersediaan Air di Sekitar Lokasi
              </label>
              <select
                value={waterAvailability}
                onChange={(e) => setWaterAvailability(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
              >
                <option value="cukup_tersedia">Kanal / Embung Berair (Siap untuk Pompa Portabel)</option>
                <option value="debit_kritis">Debit Kritis / Kanal Menyusut</option>
                <option value="sumber_kering">Kanal / Parit Kering (Perlu Pasokan Selang Jauh)</option>
                <option value="tidak_ada_kanal">Tidak Ada Sumber Air (Butuh Water Bombing Helikopter)</option>
              </select>
            </div>

            {isProfessional && (
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Tugaskan Tim / Regu Terdekat
                </label>
                <input
                  type="text"
                  value={assignedTeam}
                  onChange={(e) => setAssignedTeam(e.target.value)}
                  placeholder="Misal: Manggala Agni Daops Siak & MPA Dayun"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-semibold">
                  Foto Bukti Lapangan (Opsional)
                </label>
                <span className="text-[10px] text-slate-400">Tidak wajib jika sinyal lemah</span>
              </div>
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Tautan URL foto kamera / drone (bila tersedia)"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Catatan Situasi Lapangan & Hambatan Akses
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Lokasi 200m timur sekat kanal SK-01, semak pakis rapat, angin bertiup ke utara..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-2xs transition"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>{submitting ? 'Mengirim Laporan...' : 'Kirim Laporan Karhutla'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

