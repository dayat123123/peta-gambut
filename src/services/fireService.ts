import { HotspotPoint, FireIncidentReport, FireWaterSource, FireIncidentStatus, UserRole } from '../types';
import { SEED_HOTSPOTS, SEED_FIRE_INCIDENTS, SEED_WATER_SOURCES, calculatePeatFireEmissions } from '../data/fireData';

const FIRE_INCIDENTS_KEY = 'peatdepth_fire_incidents_v1';
const HOTSPOTS_KEY = 'peatdepth_hotspots_v1';
const WATER_SOURCES_KEY = 'peatdepth_water_sources_v1';

// ==========================================
// FIRE INCIDENTS STORAGE & MANAGEMENT
// ==========================================

export function getStoredFireIncidents(): FireIncidentReport[] {
  try {
    const raw = localStorage.getItem(FIRE_INCIDENTS_KEY);
    if (!raw) {
      localStorage.setItem(FIRE_INCIDENTS_KEY, JSON.stringify(SEED_FIRE_INCIDENTS));
      return SEED_FIRE_INCIDENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading fire incidents:', e);
    return SEED_FIRE_INCIDENTS;
  }
}

function notifyDataUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('karhutla_data_updated'));
  }
}

export function saveFireIncidents(incidents: FireIncidentReport[]): void {
  try {
    localStorage.setItem(FIRE_INCIDENTS_KEY, JSON.stringify(incidents));
    notifyDataUpdated();
  } catch (e) {
    console.error('Error saving fire incidents:', e);
  }
}

export function addFireIncident(
  data: Omit<FireIncidentReport, 'id' | 'reportedAt' | 'estimatedCo2Tons' | 'status'> & {
    status?: FireIncidentStatus;
  }
): FireIncidentReport {
  const incidents = getStoredFireIncidents();
  const emissions = calculatePeatFireEmissions(data.estimatedAreaHa, data.burnedPeatDepthCm);

  const newIncident: FireIncidentReport = {
    ...data,
    id: `INC-2026-${Math.floor(100 + Math.random() * 900)}`,
    reportedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' WIB',
    status: data.status || 'menunggu_verifikasi',
    estimatedCo2Tons: emissions.co2Tons
  };

  incidents.unshift(newIncident);
  saveFireIncidents(incidents);
  return newIncident;
}

export function updateFireIncidentStatus(
  incidentId: string,
  newStatus: FireIncidentStatus,
  options?: {
    verifiedBy?: string;
    verifierNotes?: string;
    assignedTeam?: string;
  }
): FireIncidentReport[] {
  const incidents = getStoredFireIncidents();
  const updated = incidents.map((inc) => {
    if (inc.id === incidentId) {
      return {
        ...inc,
        status: newStatus,
        verifiedBy: options?.verifiedBy ?? inc.verifiedBy,
        verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' WIB',
        verifierNotes: options?.verifierNotes ?? inc.verifierNotes,
        assignedTeam: options?.assignedTeam ?? inc.assignedTeam
      };
    }
    return inc;
  });

  saveFireIncidents(updated);
  return updated;
}

// ==========================================
// HOTSPOTS STORAGE & GROUNDCHECK MANAGEMENT
// ==========================================

export function getStoredHotspots(): HotspotPoint[] {
  try {
    const raw = localStorage.getItem(HOTSPOTS_KEY);
    if (!raw) {
      localStorage.setItem(HOTSPOTS_KEY, JSON.stringify(SEED_HOTSPOTS));
      return SEED_HOTSPOTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return SEED_HOTSPOTS;
  }
}

export function saveHotspots(hotspots: HotspotPoint[]): void {
  try {
    localStorage.setItem(HOTSPOTS_KEY, JSON.stringify(hotspots));
    notifyDataUpdated();
  } catch (e) {
    console.error('Error saving hotspots:', e);
  }
}

export function updateHotspotGroundcheck(
  hotspotId: string,
  groundcheckStatus: NonNullable<HotspotPoint['groundcheckStatus']>,
  options?: {
    notes?: string;
    checkedBy?: string;
  }
): HotspotPoint[] {
  const hotspots = getStoredHotspots();
  const updated = hotspots.map((hs) => {
    if (hs.id === hotspotId) {
      return {
        ...hs,
        groundcheckStatus,
        groundcheckNotes: options?.notes || hs.groundcheckNotes,
        checkedBy: options?.checkedBy || hs.checkedBy || 'Petugas Patroli Terpadu',
        checkedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' WIB'
      };
    }
    return hs;
  });

  saveHotspots(updated);
  return updated;
}

export function convertHotspotToIncident(
  hotspotId: string,
  reporter: { name: string; role: UserRole; phone?: string; institution?: string },
  incidentNotes?: string
): { incident: FireIncidentReport; updatedHotspots: HotspotPoint[] } {
  const hotspots = getStoredHotspots();
  const target = hotspots.find(h => h.id === hotspotId);

  // Mark hotspot as verified fire
  const updatedHotspots = updateHotspotGroundcheck(hotspotId, 'terverifikasi_api', {
    notes: `Ditingkatkan menjadi laporan insiden penanganan darat oleh ${reporter.name}.`,
    checkedBy: reporter.name
  });

  const incident = addFireIncident({
    lat: target ? target.lat : 1.4880,
    lng: target ? target.lng : 101.9180,
    region: target ? target.region : 'Riau',
    reporterName: reporter.name,
    reporterRole: reporter.role,
    reporterPhone: reporter.phone,
    reporterInstitution: reporter.institution || 'Patroli Terpadu Manggala Agni / MPA',
    fireType: 'gambut_dalam',
    estimatedAreaHa: 1.5,
    burnedPeatDepthCm: target?.threatenedPeatDepthCm ? Math.min(60, target.threatenedPeatDepthCm) : 30,
    hasDepthMeasurement: false, // Default estimasi visual tanpa alat sondir
    waterAvailability: 'cukup_tersedia',
    smokeDensity: 'tebal_pekat',
    notes: incidentNotes || `Hasil ground-check titik panas satelit ${target?.satellite || 'VIIRS'} (FRP ${target?.frp || 20} MW). Terkonfirmasi kebakaran aktif di lapangan.`,
    status: reporter.role === 'verifikator' || reporter.role === 'admin' ? 'operasi_pemadaman' : 'terkonfirmasi_aktif',
    assignedTeam: 'Manggala Agni & MPA Terdekat'
  });

  return { incident, updatedHotspots };
}

// ==========================================
// WATER INFRASTRUCTURE STORAGE & MANAGEMENT
// ==========================================

export function getStoredWaterSources(): FireWaterSource[] {
  try {
    const raw = localStorage.getItem(WATER_SOURCES_KEY);
    if (!raw) {
      localStorage.setItem(WATER_SOURCES_KEY, JSON.stringify(SEED_WATER_SOURCES));
      return SEED_WATER_SOURCES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading water sources:', e);
    return SEED_WATER_SOURCES;
  }
}

export function saveWaterSources(sources: FireWaterSource[]): void {
  try {
    localStorage.setItem(WATER_SOURCES_KEY, JSON.stringify(sources));
    notifyDataUpdated();
  } catch (e) {
    console.error('Error saving water sources:', e);
  }
}

export function addWaterSource(data: Omit<FireWaterSource, 'id'>): FireWaterSource {
  const sources = getStoredWaterSources();
  const prefix = data.type === 'sekat_kanal' ? 'WS-SK' : data.type === 'embung_air' ? 'WS-EMB' : 'WS-SB';
  const newSource: FireWaterSource = {
    ...data,
    id: `${prefix}-${Math.floor(100 + Math.random() * 900)}`,
    lastInspectedAt: new Date().toISOString().replace('T', ' ').substring(0, 10)
  };

  sources.unshift(newSource);
  saveWaterSources(sources);
  return newSource;
}

export function updateWaterSourceStatus(
  id: string,
  waterLevelStatus: FireWaterSource['waterLevelStatus'],
  capacityM3?: number,
  notes?: string
): FireWaterSource[] {
  const sources = getStoredWaterSources();
  const updated = sources.map((ws) => {
    if (ws.id === id) {
      return {
        ...ws,
        waterLevelStatus,
        capacityM3: capacityM3 !== undefined ? capacityM3 : ws.capacityM3,
        conditionNotes: notes !== undefined ? notes : ws.conditionNotes,
        lastInspectedAt: new Date().toISOString().replace('T', ' ').substring(0, 10)
      };
    }
    return ws;
  });

  saveWaterSources(updated);
  return updated;
}

export function deleteWaterSource(id: string): FireWaterSource[] {
  const sources = getStoredWaterSources();
  const updated = sources.filter(ws => ws.id !== id);
  saveWaterSources(updated);
  return updated;
}

// ==========================================
// OVERVIEW STATS ENGINE
// ==========================================

export interface KarhutlaOverviewStats {
  activeHotspotCount: number;
  highConfidenceHotspots: number;
  activeIncidentCount: number;
  inSuppressionCount: number;
  totalBurnedAreaHa: number;
  totalCo2EmittedTons: number;
}

export function getKarhutlaStats(): KarhutlaOverviewStats {
  const hotspots = getStoredHotspots();
  const incidents = getStoredFireIncidents();

  const activeHotspotCount = hotspots.length;
  const highConfidenceHotspots = hotspots.filter(h => h.confidence === 'high').length;

  const activeIncidents = incidents.filter(i => i.status === 'terkonfirmasi_aktif' || i.status === 'operasi_pemadaman');
  const inSuppressionCount = incidents.filter(i => i.status === 'operasi_pemadaman').length;

  const totalBurnedAreaHa = incidents
    .filter(i => i.status !== 'laporan_ditolak')
    .reduce((sum, i) => sum + (i.estimatedAreaHa || 0), 0);

  const totalCo2EmittedTons = incidents
    .filter(i => i.status !== 'laporan_ditolak')
    .reduce((sum, i) => sum + (i.estimatedCo2Tons || 0), 0);

  return {
    activeHotspotCount,
    highConfidenceHotspots,
    activeIncidentCount: activeIncidents.length,
    inSuppressionCount,
    totalBurnedAreaHa: Math.round(totalBurnedAreaHa * 10) / 10,
    totalCo2EmittedTons: Math.round(totalCo2EmittedTons * 10) / 10
  };
}
