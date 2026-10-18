import React, { useState, useEffect, useMemo } from 'react';
import { 
  AuthUser, 
  FireIncidentReport, 
  HotspotPoint, 
  FireWaterSource, 
  FireIncidentStatus, 
  UserRole 
} from '../types';
import { 
  getStoredFireIncidents, 
  getStoredHotspots, 
  getStoredWaterSources, 
  updateFireIncidentStatus, 
  getKarhutlaStats,
  updateHotspotGroundcheck,
  convertHotspotToIncident,
  addWaterSource,
  updateWaterSourceStatus,
  deleteWaterSource
} from '../services/fireService';
import { 
  Flame, 
  AlertTriangle, 
  Droplets, 
  ShieldAlert, 
  MapPin, 
  Clock, 
  Activity, 
  CheckCircle2, 
  PlusCircle, 
  Filter, 
  Search, 
  Compass, 
  Radio, 
  Wind, 
  Eye, 
  Download, 
  Check, 
  X, 
  Truck, 
  Layers, 
  Info,
  Calendar,
  Thermometer,
  ShieldCheck,
  ChevronRight,
  Edit3,
  Trash2,
  Plus
} from 'lucide-react';

interface KarhutlaViewProps {
  currentUser: AuthUser | null;
  onOpenReportModal: () => void;
  onViewOnMap: (lat: number, lng: number) => void;
}

export const KarhutlaView: React.FC<KarhutlaViewProps> = ({
  currentUser,
  onOpenReportModal,
  onViewOnMap
}) => {
  const [incidents, setIncidents] = useState<FireIncidentReport[]>(getStoredFireIncidents());
  const [hotspots, setHotspots] = useState<HotspotPoint[]>(getStoredHotspots());
  const [waterSources, setWaterSources] = useState<FireWaterSource[]>(getStoredWaterSources());

  // Active view tab ('incidents' | 'hotspots' | 'water')
  const [subTab, setSubTab] = useState<'incidents' | 'hotspots' | 'water'>('incidents');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Verifier action modal state
  const [selectedIncidentForAction, setSelectedIncidentForAction] = useState<FireIncidentReport | null>(null);
  const [actionStatus, setActionStatus] = useState<FireIncidentStatus>('operasi_pemadaman');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [actionTeam, setActionTeam] = useState<string>('Manggala Agni Daops Siak');

  // Detail Modal state
  const [inspectedIncident, setInspectedIncident] = useState<FireIncidentReport | null>(null);

  // Hotspot Groundcheck Modal State
  const [groundcheckHotspot, setGroundcheckHotspot] = useState<HotspotPoint | null>(null);
  const [groundcheckStatus, setGroundcheckStatus] = useState<NonNullable<HotspotPoint['groundcheckStatus']>>('terverifikasi_api');
  const [groundcheckNotes, setGroundcheckNotes] = useState<string>('');
  const [groundcheckOfficer, setGroundcheckOfficer] = useState<string>(currentUser?.name || 'Petugas Patroli Terpadu MPA');

  // Water Infrastructure Add Modal State
  const [isAddWaterModalOpen, setIsAddWaterModalOpen] = useState<boolean>(false);
  const [newWaterName, setNewWaterName] = useState<string>('');
  const [newWaterType, setNewWaterType] = useState<FireWaterSource['type']>('sekat_kanal');
  const [newWaterLat, setNewWaterLat] = useState<number>(1.4880);
  const [newWaterLng, setNewWaterLng] = useState<number>(101.9180);
  const [newWaterRegion, setNewWaterRegion] = useState<string>('Riau (Siak & Bengkalis)');
  const [newWaterManagedBy, setNewWaterManagedBy] = useState<string>(currentUser?.institution || 'MPA Kampung Dayun & BRGM');
  const [newWaterStatus, setNewWaterStatus] = useState<FireWaterSource['waterLevelStatus']>('normal_berair');
  const [newWaterCapacity, setNewWaterCapacity] = useState<number>(1500);
  const [newWaterNotes, setNewWaterNotes] = useState<string>('');

  // Water Infrastructure Update Modal State
  const [selectedWaterForUpdate, setSelectedWaterForUpdate] = useState<FireWaterSource | null>(null);
  const [updateWaterStatus, setUpdateWaterStatus] = useState<FireWaterSource['waterLevelStatus']>('normal_berair');
  const [updateWaterCapacity, setUpdateWaterCapacity] = useState<number>(1500);
  const [updateWaterNotes, setUpdateWaterNotes] = useState<string>('');

  // Synchronize with external changes
  useEffect(() => {
    const handleSync = () => {
      setIncidents(getStoredFireIncidents());
      setHotspots(getStoredHotspots());
      setWaterSources(getStoredWaterSources());
    };
    window.addEventListener('karhutla_data_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('karhutla_data_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const stats = useMemo(() => getKarhutlaStats(), [incidents, hotspots]);

  const canVerify = currentUser?.role === 'verifikator' || currentUser?.role === 'admin';

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (statusFilter !== 'all' && inc.status !== statusFilter) return false;
      if (regionFilter !== 'all' && !inc.region.includes(regionFilter)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          inc.id.toLowerCase().includes(q) ||
          (inc.reporterName && inc.reporterName.toLowerCase().includes(q)) ||
          (inc.region && inc.region.toLowerCase().includes(q)) ||
          (inc.notes && inc.notes.toLowerCase().includes(q)) ||
          (inc.assignedTeam && inc.assignedTeam.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [incidents, statusFilter, regionFilter, searchQuery]);

  // Filtered hotspots
  const filteredHotspots = useMemo(() => {
    return hotspots.filter((hs) => {
      if (regionFilter !== 'all' && !hs.region.includes(regionFilter)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          hs.id.toLowerCase().includes(q) ||
          hs.satellite.toLowerCase().includes(q) ||
          hs.region.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [hotspots, regionFilter, searchQuery]);

  // Filtered water sources
  const filteredWater = useMemo(() => {
    return waterSources.filter((ws) => {
      if (regionFilter !== 'all' && !ws.region.includes(regionFilter)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          ws.name.toLowerCase().includes(q) ||
          ws.managedBy.toLowerCase().includes(q) ||
          ws.region.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [waterSources, regionFilter, searchQuery]);

  const handleApplyStatusChange = () => {
    if (!selectedIncidentForAction) return;

    const updated = updateFireIncidentStatus(selectedIncidentForAction.id, actionStatus, {
      verifiedBy: currentUser?.name || 'Tim Verifikator Ahli',
      verifierNotes: actionNotes,
      assignedTeam: actionTeam
    });

    setIncidents(updated);
    setSelectedIncidentForAction(null);
    setActionNotes('');
  };

  // Hotspot Groundcheck actions
  const handleOpenGroundcheck = (hs: HotspotPoint) => {
    setGroundcheckHotspot(hs);
    setGroundcheckStatus(hs.groundcheckStatus || 'terverifikasi_api');
    setGroundcheckNotes(hs.groundcheckNotes || '');
    setGroundcheckOfficer(hs.checkedBy || currentUser?.name || 'Petugas Patroli Terpadu MPA');
  };

  const handleSaveGroundcheck = () => {
    if (!groundcheckHotspot) return;
    const updated = updateHotspotGroundcheck(groundcheckHotspot.id, groundcheckStatus, {
      notes: groundcheckNotes,
      checkedBy: groundcheckOfficer
    });
    setHotspots(updated);
    setGroundcheckHotspot(null);
  };

  const handleEscalateHotspot = () => {
    if (!groundcheckHotspot) return;
    const { incident, updatedHotspots } = convertHotspotToIncident(
      groundcheckHotspot.id,
      {
        name: groundcheckOfficer || currentUser?.name || 'Petugas Patroli MPA',
        role: currentUser?.role || 'kontributor',
        phone: currentUser?.phone,
        institution: currentUser?.institution
      },
      groundcheckNotes
    );
    setHotspots(updatedHotspots);
    setIncidents(getStoredFireIncidents());
    setGroundcheckHotspot(null);
    setSubTab('incidents');
    setInspectedIncident(incident);
  };

  // Water Infrastructure actions
  const handleCreateWaterSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWaterName.trim()) return;

    addWaterSource({
      name: newWaterName.trim(),
      type: newWaterType,
      lat: newWaterLat,
      lng: newWaterLng,
      waterLevelStatus: newWaterStatus,
      capacityM3: newWaterCapacity,
      managedBy: newWaterManagedBy.trim() || 'Masyarakat Peduli Api (MPA)',
      region: newWaterRegion,
      conditionNotes: newWaterNotes.trim() || undefined
    });

    setWaterSources(getStoredWaterSources());
    setIsAddWaterModalOpen(false);
    setNewWaterName('');
    setNewWaterNotes('');
  };

  const handleOpenWaterUpdate = (ws: FireWaterSource) => {
    setSelectedWaterForUpdate(ws);
    setUpdateWaterStatus(ws.waterLevelStatus);
    setUpdateWaterCapacity(ws.capacityM3);
    setUpdateWaterNotes(ws.conditionNotes || '');
  };

  const handleSaveWaterUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWaterForUpdate) return;

    const updated = updateWaterSourceStatus(
      selectedWaterForUpdate.id,
      updateWaterStatus,
      updateWaterCapacity,
      updateWaterNotes.trim() || undefined
    );
    setWaterSources(updated);
    setSelectedWaterForUpdate(null);
  };

  const handleDeleteWater = (id: string) => {
    if (confirm('Yakin ingin menghapus data infrastruktur air ini?')) {
      const updated = deleteWaterSource(id);
      setWaterSources(updated);
    }
  };

  const exportIncidentsToCSV = () => {
    const headers = [
      'ID Laporan',
      'Waktu Lapor',
      'Wilayah',
      'Latitude',
      'Longitude',
      'Pelapor',
      'Peran Pelapor',
      'Tipe Api',
      'Estimasi Luas (Ha)',
      'Kedalaman Terbakar (cm)',
      'Status',
      'Akses Air',
      'Tim Ditugaskan',
      'Verifikator'
    ];

    const rows = incidents.map((inc) => [
      inc.id,
      `"${inc.reportedAt}"`,
      `"${inc.region}"`,
      inc.lat,
      inc.lng,
      `"${inc.reporterName}"`,
      inc.reporterRole,
      inc.fireType,
      inc.estimatedAreaHa,
      inc.burnedPeatDepthCm,
      inc.status,
      inc.waterAvailability,
      `"${inc.assignedTeam || '-'}"`,
      `"${inc.verifiedBy || '-'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_insiden_karhutla_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: FireIncidentStatus) => {
    switch (status) {
      case 'operasi_pemadaman':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'terkonfirmasi_aktif':
        return 'bg-rose-50 text-rose-800 border-rose-200 font-semibold';
      case 'padam_terkendali':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'menunggu_verifikasi':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'laporan_ditolak':
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getStatusLabel = (status: FireIncidentStatus) => {
    switch (status) {
      case 'operasi_pemadaman': return 'Operasi Pemadaman';
      case 'terkonfirmasi_aktif': return 'Terkonfirmasi Aktif';
      case 'padam_terkendali': return 'Padam Terkendali';
      case 'menunggu_verifikasi': return 'Menunggu Verifikasi';
      case 'laporan_ditolak': return 'Laporan Tidak Valid';
    }
  };

  const getGroundcheckBadge = (status?: HotspotPoint['groundcheckStatus']) => {
    switch (status) {
      case 'terverifikasi_api':
        return 'bg-rose-50 text-rose-800 border-rose-200 font-semibold';
      case 'terverifikasi_padam':
        return 'bg-sky-50 text-sky-800 border-sky-200 font-medium';
      case 'pantulan_bukan_api':
        return 'bg-amber-50 text-amber-800 border-amber-200 font-medium';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getGroundcheckLabel = (status?: HotspotPoint['groundcheckStatus']) => {
    switch (status) {
      case 'terverifikasi_api':
        return 'Api Terkonfirmasi';
      case 'terverifikasi_padam':
        return 'Sudah Padam';
      case 'pantulan_bukan_api':
        return 'Bukan Api (Pantulan)';
      default:
        return 'Belum Diperiksa';
    }
  };

  const getWaterStatusBadge = (status: FireWaterSource['waterLevelStatus']) => {
    switch (status) {
      case 'normal_berair':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'debit_rendah':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'kering':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getWaterStatusLabel = (status: FireWaterSource['waterLevelStatus']) => {
    switch (status) {
      case 'normal_berair':
        return 'Air Normal / Melimpah';
      case 'debit_rendah':
        return 'Debit Kritis / Rendah';
      case 'kering':
        return 'Kering Total';
      default:
        return status;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Institutional Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Sistem Informasi Geospasial Gambut Indonesia
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
              Modul Siaga Karhutla
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Pemantauan Titik Panas & Insiden Karhutla
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-3xl">
            Integrasi deteksi satelit Near-Real-Time NASA VIIRS & MODIS, validasi lapangan Masyarakat Peduli Api (MPA), koordinasi penugasan Manggala Agni, serta inventarisasi sekat kanal.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={exportIncidentsToCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition"
            title="Unduh seluruh rekap insiden dalam format CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Unduh Rekap</span>
          </button>

          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Lapor Insiden Lapangan</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards (Clean Institutional Metric Cards) */}
      {/* KPI Overview Cards (Clean Institutional Metric Cards - 4 Core Pillars) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Titik Panas Satelit</span>
            <Radio className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {stats.activeHotspotCount}
          </div>
          <span className="text-[11px] text-slate-500 block">
            <strong className="text-rose-700 font-semibold">{stats.highConfidenceHotspots}</strong> keyakinan tinggi (&gt;80%)
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Operasi Pemadaman</span>
            <Truck className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {stats.inSuppressionCount}
          </div>
          <span className="text-[11px] text-slate-500 block">
            Regu darat &amp; pompa aktif
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Insiden Lapangan</span>
            <Flame className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {incidents.length} <span className="text-xs font-normal text-slate-500 font-sans">Laporan</span>
          </div>
          <span className="text-[11px] text-slate-500 block">
            {stats.totalBurnedAreaHa} Ha luas terbakar
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Infrastruktur Air</span>
            <Droplets className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {waterSources.length} <span className="text-xs font-normal text-slate-500 font-sans">Unit</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-medium block">
            {waterSources.filter(w => w.waterLevelStatus === 'normal_berair').length} siap pompa pemadam
          </span>
        </div>
      </div>

      {/* Main Content Card with Navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        
        {/* Navigation Tabs Header */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Segmented Control */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/80 overflow-x-auto no-scrollbar shrink-0">
            <button
              onClick={() => setSubTab('incidents')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${
                subTab === 'incidents'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${subTab === 'incidents' ? 'text-rose-600' : 'text-slate-400'}`} />
              <span>Insiden Lapangan</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200/80 text-slate-700">
                {incidents.length}
              </span>
            </button>

            <button
              onClick={() => setSubTab('hotspots')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${
                subTab === 'hotspots'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${subTab === 'hotspots' ? 'text-rose-600' : 'text-slate-400'}`} />
              <span>Titik Panas Satelit</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200/80 text-slate-700">
                {hotspots.length}
              </span>
            </button>

            <button
              onClick={() => setSubTab('water')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${
                subTab === 'water'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Droplets className={`w-3.5 h-3.5 ${subTab === 'water' ? 'text-sky-600' : 'text-slate-400'}`} />
              <span>Infrastruktur Air</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200/80 text-slate-700">
                {waterSources.length}
              </span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari data..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-slate-400 w-44 transition"
              />
            </div>

            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white cursor-pointer"
            >
              <option value="all">Semua Wilayah</option>
              <option value="Riau">Riau</option>
              <option value="Kalimantan Tengah">Kalimantan Tengah</option>
            </select>

            {subTab === 'incidents' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="operasi_pemadaman">Operasi Pemadaman</option>
                <option value="terkonfirmasi_aktif">Terkonfirmasi Aktif</option>
                <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
                <option value="padam_terkendali">Padam Terkendali</option>
              </select>
            )}

            {subTab === 'water' && (
              <button
                onClick={() => setIsAddWaterModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-sky-400" />
                <span>+ Titik Air</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Laporan Insiden Lapangan */}
        {subTab === 'incidents' && (
          <div className="divide-y divide-slate-100">
            {filteredIncidents.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Tidak ada laporan insiden yang cocok dengan filter yang dipilih.
              </div>
            ) : (
              filteredIncidents.map((inc) => (
                <div 
                  key={inc.id}
                  className="p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {inc.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadge(inc.status)}`}>
                        {getStatusLabel(inc.status)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Dilaporkan: {inc.reportedAt}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 font-medium">
                      <span>{inc.region}</span>
                      <span className="text-slate-300 mx-1.5">•</span>
                      <span className="text-slate-500">Pelapor: {inc.reporterName} ({inc.reporterRole})</span>
                    </div>

                    {inc.notes && (
                      <p className="text-xs text-slate-500 line-clamp-1 italic">
                        "{inc.notes}"
                      </p>
                    )}

                    {/* Stats pills */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-600">
                      <div>Luas: <strong className="text-slate-900 font-mono">{inc.estimatedAreaHa} Ha</strong></div>
                      <span className="text-slate-200">|</span>
                      <div>Kedalaman: <strong className="text-slate-900 font-mono">{inc.burnedPeatDepthCm} cm</strong></div>
                      <span className="text-slate-200">|</span>
                      <div>Akses Air: <span className="capitalize text-slate-700 font-medium">{inc.waterAvailability.replace(/_/g, ' ')}</span></div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setInspectedIncident(inc)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                    >
                      Rincian
                    </button>

                    <button
                      onClick={() => onViewOnMap(inc.lat, inc.lng)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                    >
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>Peta</span>
                    </button>

                    {canVerify && (
                      <button
                        onClick={() => {
                          setSelectedIncidentForAction(inc);
                          setActionStatus(inc.status);
                          setActionTeam(inc.assignedTeam || 'Manggala Agni Daops Siak');
                          setActionNotes(inc.verifierNotes || '');
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition"
                      >
                        Kelola Status
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Titik Panas Satelit VIIRS / MODIS dengan Groundcheck Aktif */}
        {subTab === 'hotspots' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Sensor Satelit</th>
                  <th className="px-4 py-3">Waktu Akuisisi</th>
                  <th className="px-4 py-3">Kepercayaan</th>
                  <th className="px-4 py-3">FRP & Kecerahan</th>
                  <th className="px-4 py-3">Status Groundcheck Lapangan</th>
                  <th className="px-4 py-3">Wilayah & Tebal Gambut</th>
                  <th className="px-4 py-3 text-right">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHotspots.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                      Tidak ada data hotspot satelit yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filteredHotspots.map((hs) => {
                    const isHigh = hs.confidence === 'high';
                    return (
                      <tr key={hs.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-3.5 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                            <span className="font-mono">{hs.satellite}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block ml-4 font-mono">{hs.id}</span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {hs.acquisitionTime}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isHigh 
                              ? 'bg-rose-50 text-rose-800 border-rose-200' 
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {hs.confidence.toUpperCase()} ({hs.confidencePercent}%)
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-mono font-semibold text-slate-900 block">{hs.frp} MW</span>
                          <span className="text-[10px] font-mono text-slate-500">{hs.brightnessKelvin} K</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${getGroundcheckBadge(hs.groundcheckStatus)}`}>
                            {getGroundcheckLabel(hs.groundcheckStatus)}
                          </span>
                          {hs.checkedBy && (
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              Oleh: {hs.checkedBy}
                            </span>
                          )}
                          {hs.groundcheckNotes && (
                            <span className="text-[10px] text-slate-400 italic block mt-0.5 line-clamp-1">
                              "{hs.groundcheckNotes}"
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-medium text-slate-800 block">{hs.region}</span>
                          <span className="text-[11px] text-slate-500">Tebal: {hs.threatenedPeatDepthCm} cm</span>
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onViewOnMap(hs.lat, hs.lng)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition"
                              title="Tampilkan titik di peta"
                            >
                              <MapPin className="w-3 h-3 text-slate-500" />
                              <span>Peta</span>
                            </button>
                            <button
                              onClick={() => handleOpenGroundcheck(hs)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-2xs transition"
                              title="Kelola hasil verifikasi / groundcheck darat"
                            >
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              <span>Groundcheck</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Infrastruktur Air (Sekat Kanal & Embung) yang Dapat Dimanage */}
        {subTab === 'water' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Nama Infrastruktur</th>
                  <th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3">Status Ketersediaan Air</th>
                  <th className="px-4 py-3">Kapasitas</th>
                  <th className="px-4 py-3">Pengelola & Wilayah</th>
                  <th className="px-4 py-3">Inspeksi Terakhir & Kondisi</th>
                  <th className="px-4 py-3 text-right">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWater.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                      Tidak ada infrastruktur air yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filteredWater.map((ws) => {
                    return (
                      <tr key={ws.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-3.5 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <Droplets className="w-3.5 h-3.5 text-sky-600" />
                            <span>{ws.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block ml-5 font-mono">{ws.id}</span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 capitalize">
                          {ws.type.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${getWaterStatusBadge(ws.waterLevelStatus)}`}>
                            {getWaterStatusLabel(ws.waterLevelStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-medium text-slate-900">
                          {ws.capacityM3.toLocaleString('id-ID')} m³
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-medium text-slate-800 block">{ws.managedBy}</span>
                          <span className="text-[10px] text-slate-400">{ws.region}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-slate-700 font-mono block text-[11px]">
                            {ws.lastInspectedAt || 'Belum diinspeksi'}
                          </span>
                          {ws.conditionNotes ? (
                            <span className="text-[10px] text-slate-500 italic block line-clamp-1">
                              "{ws.conditionNotes}"
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Kondisi fisik normal</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onViewOnMap(ws.lat, ws.lng)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition"
                              title="Buka di peta"
                            >
                              <MapPin className="w-3 h-3 text-slate-500" />
                              <span>Peta</span>
                            </button>
                            <button
                              onClick={() => handleOpenWaterUpdate(ws)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-2xs transition"
                              title="Update status debit dan kondisi fisik"
                            >
                              <Edit3 className="w-3 h-3 text-sky-400" />
                              <span>Update Debit</span>
                            </button>
                            {canVerify && (
                              <button
                                onClick={() => handleDeleteWater(ws.id)}
                                className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition"
                                title="Hapus titik infrastruktur air"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Verifier Status Management Modal */}
      {selectedIncidentForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-fadeIn">
          <div 
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Kelola Status Operasional Insiden
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  {selectedIncidentForAction.id} • {selectedIncidentForAction.region}
                </span>
              </div>
              <button
                onClick={() => setSelectedIncidentForAction(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Ubah Status Operasional:
                </label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value as FireIncidentStatus)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-900 focus:outline-none focus:bg-white"
                >
                  <option value="terkonfirmasi_aktif">Terkonfirmasi Aktif (Perlu Respon Segera)</option>
                  <option value="operasi_pemadaman">Operasi Pemadaman (Regu Lapangan Ditugaskan)</option>
                  <option value="padam_terkendali">Padam Terkendali (Api Padam, Pendinginan Berhasil)</option>
                  <option value="laporan_ditolak">Laporan Tidak Valid / Ditolak (False Alarm)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Regu Lapangan yang Ditugaskan:
                </label>
                <input
                  type="text"
                  value={actionTeam}
                  onChange={(e) => setActionTeam(e.target.value)}
                  placeholder="Contoh: Manggala Agni Daops Siak & MPA Dayun"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Catatan Verifikator / Log Operasi:
                </label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Instruksi taktis pemadaman, ketersediaan selang, atau armada water bombing..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:bg-white resize-none"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedIncidentForAction(null)}
                className="px-3.5 py-2 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-medium transition"
              >
                Batal
              </button>
              <button
                onClick={handleApplyStatusChange}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incident Detail Modal */}
      {inspectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-fadeIn">
          <div 
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Rincian Laporan Insiden
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  {inspectedIncident.id}
                </span>
              </div>
              <button
                onClick={() => setInspectedIncident(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
              {inspectedIncident.photoUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <img 
                    src={inspectedIncident.photoUrl} 
                    alt="Foto Lapangan" 
                    className="w-full h-44 object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase">Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mt-1 border ${getStatusBadge(inspectedIncident.status)}`}>
                    {getStatusLabel(inspectedIncident.status)}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase">Koordinat</span>
                  <span className="font-mono font-medium text-slate-900 mt-1 block">
                    {inspectedIncident.lat}, {inspectedIncident.lng}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase">Estimasi Luas</span>
                  <span className="font-mono font-bold text-slate-900 mt-1 block text-sm">
                    {inspectedIncident.estimatedAreaHa} Ha
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase">Kedalaman Bakar</span>
                  <span className="font-mono font-bold text-slate-900 mt-1 block text-sm">
                    {inspectedIncident.burnedPeatDepthCm} cm
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pelapor:</span>
                  <strong className="text-slate-800">{inspectedIncident.reporterName} ({inspectedIncident.reporterRole})</strong>
                </div>
                {inspectedIncident.reporterPhone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kontak:</span>
                    <strong className="text-slate-800 font-mono">{inspectedIncident.reporterPhone}</strong>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Akses Air:</span>
                  <strong className="text-slate-800 capitalize">{inspectedIncident.waterAvailability.replace(/_/g, ' ')}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tim Lapangan:</span>
                  <strong className="text-slate-800">{inspectedIncident.assignedTeam || 'Belum ditugaskan'}</strong>
                </div>
              </div>

              {inspectedIncident.notes && (
                <div className="border-t border-slate-100 pt-3">
                  <span className="text-slate-500 block mb-1">Catatan Lapangan:</span>
                  <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700 italic">
                    "{inspectedIncident.notes}"
                  </p>
                </div>
              )}

              {inspectedIncident.verifierNotes && (
                <div className="border-t border-slate-100 pt-3">
                  <span className="text-slate-500 block mb-1">Catatan Verifikator ({inspectedIncident.verifiedBy}):</span>
                  <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800">
                    "{inspectedIncident.verifierNotes}"
                  </p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setInspectedIncident(null);
                  onViewOnMap(inspectedIncident.lat, inspectedIncident.lng);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Buka di Peta</span>
              </button>

              <button
                onClick={() => setInspectedIncident(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hotspot Groundcheck Modal */}
      {groundcheckHotspot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-fadeIn">
          <div 
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verifikasi Groundcheck Titik Panas</span>
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  {groundcheckHotspot.id} • Sensor {groundcheckHotspot.satellite} (FRP: {groundcheckHotspot.frp} MW)
                </span>
              </div>
              <button
                onClick={() => setGroundcheckHotspot(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Wilayah</span>
                  <strong className="text-slate-800">{groundcheckHotspot.region}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Koordinat</span>
                  <span className="font-mono text-slate-800 font-medium">
                    {groundcheckHotspot.lat}, {groundcheckHotspot.lng}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Kedalaman Gambut Terancam</span>
                  <strong className="text-amber-800">{groundcheckHotspot.threatenedPeatDepthCm} cm</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Waktu Deteksi Satelit</span>
                  <span className="text-slate-600">{groundcheckHotspot.acquisitionTime}</span>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Hasil Verifikasi / Temuan Lapangan:
                </label>
                <select
                  value={groundcheckStatus}
                  onChange={(e) => setGroundcheckStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-900 focus:outline-none focus:bg-white"
                >
                  <option value="belum_diperiksa">Belum Diperiksa (Menunggu Regu Patroli)</option>
                  <option value="terverifikasi_api">Api Terkonfirmasi Aktif (Kebakaran Gambut Nyata)</option>
                  <option value="terverifikasi_padam">Sudah Padam (Sisa Abu / Titik Panas Mendingin)</option>
                  <option value="pantulan_bukan_api">Bukan Api (Pantulan Atap / Industri / False Alarm)</option>
                </select>
              </div>

              {/* Officer / Tim */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Petugas / Tim Patroli Lapangan:
                </label>
                <input
                  type="text"
                  value={groundcheckOfficer}
                  onChange={(e) => setGroundcheckOfficer(e.target.value)}
                  placeholder="Nama petugas atau nama regu MPA"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:bg-white"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Catatan Lapangan & Rekomendasi Penanganan:
                </label>
                <textarea
                  rows={3}
                  value={groundcheckNotes}
                  onChange={(e) => setGroundcheckNotes(e.target.value)}
                  placeholder="Misal: Ditemukan kepulan asap smoldering sedalam ~20cm di tepi parit, butuh selang 200m dari sekat terdekat..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:bg-white resize-none"
                />
              </div>

              {/* Escalation Notice */}
              {groundcheckStatus === 'terverifikasi_api' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-rose-900">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Flame className="w-3.5 h-3.5 text-rose-600" />
                    <span>Api Gambut Aktif Terkonfirmasi</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    Anda dapat langsung menaikkan status hotspot ini menjadi <strong>Laporan Insiden Resmi</strong> untuk mengaktifkan pengerahan armada pemadaman dan respon darurat terpadu.
                  </p>
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setGroundcheckHotspot(null)}
                className="px-3.5 py-2 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-medium transition"
              >
                Batal
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveGroundcheck}
                  className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition"
                >
                  Simpan Status
                </button>

                {groundcheckStatus === 'terverifikasi_api' && (
                  <button
                    type="button"
                    onClick={handleEscalateHotspot}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Eskalasi ke Insiden</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Water Infrastructure Modal */}
      {isAddWaterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-fadeIn">
          <div 
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-sky-600" />
                  <span>Tambah Titik Infrastruktur Air Pemadam</span>
                </h3>
                <span className="text-xs text-slate-500">
                  Pencatatan sekat kanal, embung, atau sumur bor gambut
                </span>
              </div>
              <button
                onClick={() => setIsAddWaterModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWaterSource} className="p-5 space-y-3.5 text-xs max-h-[75vh] overflow-y-auto">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nama Titik / Bangunan Air:
                </label>
                <input
                  type="text"
                  required
                  value={newWaterName}
                  onChange={(e) => setNewWaterName(e.target.value)}
                  placeholder="Misal: Sekat Kanal SK-06 Parit Primer Dayun"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Jenis Infrastruktur:
                  </label>
                  <select
                    value={newWaterType}
                    onChange={(e) => setNewWaterType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:bg-white"
                  >
                    <option value="sekat_kanal">Sekat Kanal (Canal Blocking)</option>
                    <option value="embung_air">Embung Air / Kolam Retensi</option>
                    <option value="sumur_bor">Sumur Bor Pemadam</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Wilayah Gambut:
                  </label>
                  <input
                    type="text"
                    required
                    value={newWaterRegion}
                    onChange={(e) => setNewWaterRegion(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* Coordinates with GPS */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Titik Koordinat:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if ('geolocation' in navigator) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setNewWaterLat(parseFloat(pos.coords.latitude.toFixed(5)));
                            setNewWaterLng(parseFloat(pos.coords.longitude.toFixed(5)));
                          },
                          () => alert('Gagal mendeteksi GPS. Mohon isi manual.'),
                          { enableHighAccuracy: true, timeout: 5000 }
                        );
                      }
                    }}
                    className="text-[11px] text-sky-600 hover:text-sky-800 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Gunakan GPS Saya</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newWaterLat}
                    onChange={(e) => setNewWaterLat(parseFloat(e.target.value) || 0)}
                    placeholder="Latitude"
                    className="bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newWaterLng}
                    onChange={(e) => setNewWaterLng(parseFloat(e.target.value) || 0)}
                    placeholder="Longitude"
                    className="bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Status Ketersediaan Air:
                  </label>
                  <select
                    value={newWaterStatus}
                    onChange={(e) => setNewWaterStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:bg-white"
                  >
                    <option value="normal_berair">Air Melimpah / Normal</option>
                    <option value="debit_rendah">Debit Kritis / Menyusut</option>
                    <option value="kering">Kering Total</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Estimasi Kapasitas (m³):
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100000"
                    required
                    value={newWaterCapacity}
                    onChange={(e) => setNewWaterCapacity(parseInt(e.target.value) || 100)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Instansi / Tim Pengelola:
                </label>
                <input
                  type="text"
                  required
                  value={newWaterManagedBy}
                  onChange={(e) => setNewWaterManagedBy(e.target.value)}
                  placeholder="Misal: Masyarakat Peduli Api (MPA) & BRGM"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Catatan Kondisi Fisik & Akses Selang:
                </label>
                <textarea
                  rows={2}
                  value={newWaterNotes}
                  onChange={(e) => setNewWaterNotes(e.target.value)}
                  placeholder="Misal: Kondisi kayu sekat baik, air jernih gambut, akses motor roda tiga 100m dari jalan poros..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:bg-white resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddWaterModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition"
                >
                  Simpan Titik Air
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Water Infrastructure Status Modal */}
      {selectedWaterForUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-fadeIn">
          <div 
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-sky-600" />
                  <span>Update Status Ketersediaan Air</span>
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  {selectedWaterForUpdate.name} • {selectedWaterForUpdate.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedWaterForUpdate(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWaterUpdate} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Status Muka Air Lapangan Saat Ini:
                </label>
                <select
                  value={updateWaterStatus}
                  onChange={(e) => setUpdateWaterStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-900 focus:outline-none focus:bg-white"
                >
                  <option value="normal_berair">Normal / Air Melimpah (Siap Pasok Pompa)</option>
                  <option value="debit_rendah">Debit Rendah / Kritis (Ketinggian Air Berkurang)</option>
                  <option value="kering">Kering Total (Tidak Dapat Digunakan)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Kapasitas Tampung Saat Ini (m³):
                </label>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  required
                  value={updateWaterCapacity}
                  onChange={(e) => setUpdateWaterCapacity(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900 focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Catatan Kondisi Fisik & Hasil Inspeksi:
                </label>
                <textarea
                  rows={3}
                  value={updateWaterNotes}
                  onChange={(e) => setUpdateWaterNotes(e.target.value)}
                  placeholder="Misal: Pintu sekat kanal kayu ditutup rapat untuk menjaga TMAT kubah gambut, debit cukup untuk 3 unit pompa portabel..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:bg-white resize-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Tanggal inspeksi otomatis diperbarui ke hari ini.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWaterForUpdate(null)}
                  className="px-3.5 py-2 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition"
                >
                  Simpan Pembaruan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
