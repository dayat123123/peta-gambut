import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { 
  PeatPoint, 
  MeasurementMethod, 
  LandCover, 
  DrainageCondition, 
  AuthUser 
} from '../types';
import { validatePeatPoint } from '../services/validation';
import { addPoint, getStoredPoints } from '../services/storage';
import { 
  getDistanceKm, 
  PILOT_PEATLANDS, 
  isPointInPeatland, 
  getDistanceToPeatlandKm 
} from '../data/peatlandsGeo';
import { 
  Navigation, 
  AlertCircle, 
  CheckCircle2, 
  Upload, 
  MapPin, 
  Save, 
  Compass, 
  Layers, 
  Crosshair, 
  Sliders, 
  Copy, 
  Target, 
  RotateCcw, 
  Sparkles, 
  Droplet, 
  Activity, 
  FileCheck2, 
  ExternalLink,
  Info
} from 'lucide-react';

interface PointInputFormProps {
  isOffline?: boolean;
  currentUser?: AuthUser | null;
  onPointAdded: (newPoint: PeatPoint, isQueued: boolean) => void;
  onViewMapWithCoords?: (lat: number, lng: number) => void;
}

const DRAFT_STORAGE_KEY = 'peatdepth_survey_draft_v1';

export const PointInputForm: React.FC<PointInputFormProps> = ({
  isOffline = false,
  currentUser,
  onPointAdded,
}) => {
  // Coordinates & GPS
  const [lat, setLat] = useState<number>(1.3412);
  const [lng, setLng] = useState<number>(101.8921);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(3.2);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  // Radius Buffer Analysis (User requested: "pake radius")
  const [inspectionRadiusM, setInspectionRadiusM] = useState<number>(250);

  // Borehole Measurements & Stratigraphy (Field survey requirements)
  const [depthCm, setDepthCm] = useState<number>(185);
  const [baseReached, setBaseReached] = useState<boolean>(true);
  const [mineralSubstrate, setMineralSubstrate] = useState<string>('Lempung Marin (Marine Clay)');
  const [waterTableCm, setWaterTableCm] = useState<number>(-25); // TMAT (cm)
  const [peatMaturity, setPeatMaturity] = useState<'fibrik' | 'hemik' | 'saprik'>('hemik');
  const [peatPh, setPeatPh] = useState<number>(4.2);

  // Field Meta
  const [method, setMethod] = useState<MeasurementMethod>('bor_gambut');
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [landCover, setLandCover] = useState<LandCover>('hutan');
  const [drainage, setDrainage] = useState<DrainageCondition>('alami');
  const [region, setRegion] = useState<string>('Riau (Siak & Bengkalis)');
  const [notes, setNotes] = useState<string>('');
  const [contributorName, setContributorName] = useState<string>(currentUser?.name || 'Surveyor Mandiri');
  const [isPublicContributor, setIsPublicContributor] = useState<boolean>(true);
  const [isObfuscated, setIsObfuscated] = useState<boolean>(false);

  // Photo Documentation
  const [photoUrl, setPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80'
  );

  // Submission & Feedback State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Leaflet Map Picker References
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const targetMarkerRef = useRef<L.Marker | null>(null);
  const bufferCircleRef = useRef<L.Circle | null>(null);
  const surroundingGroupRef = useRef<L.LayerGroup | null>(null);

  // Load existing points for spatial proximity analysis
  const existingPoints = useMemo(() => getStoredPoints(), []);

  // Calculate Nearest Survey Point (User requested: "otomatis pilih titik terdekat")
  const nearestPointAnalysis = useMemo(() => {
    if (!existingPoints.length) return null;

    let minDistance = Infinity;
    let closest: PeatPoint | null = null;
    let countInRadius = 0;
    let totalDepthInRadius = 0;

    existingPoints.forEach((p) => {
      const dKm = getDistanceKm(lat, lng, p.lat, p.lng);
      const dMeters = dKm * 1000;

      if (dKm < minDistance) {
        minDistance = dKm;
        closest = p;
      }

      if (dMeters <= inspectionRadiusM) {
        countInRadius++;
        totalDepthInRadius += p.depthCm;
      }
    });

    const avgDepthInRadius = countInRadius > 0 ? Math.round(totalDepthInRadius / countInRadius) : null;
    const distanceMeters = Math.round(minDistance * 1000);

    return {
      point: closest as PeatPoint | null,
      distanceKm: minDistance,
      distanceMeters,
      isDuplicateCandidate: distanceMeters < 25,
      pointsInRadius: countInRadius,
      avgDepthInRadius
    };
  }, [lat, lng, existingPoints, inspectionRadiusM]);

  // Automated Multi-Rule Validation
  const validation = useMemo(() => {
    return validatePeatPoint(
      { lat, lng, depthCm, baseReached, photoUrl },
      existingPoints
    );
  }, [lat, lng, depthCm, baseReached, photoUrl, existingPoints]);

  // Initialize Map Picker
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 12,
      minZoom: 5,
      maxZoom: 18,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Reliable ESRI Topo Tiles (Free, no watermark)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '&copy; Esri, USGS',
        maxZoom: 18
      }
    ).addTo(map);

    // Peatland Polygons Overlay
    PILOT_PEATLANDS.forEach((peat) => {
      L.polygon(peat.coordinates, {
        color: '#047857',
        weight: 1.5,
        dashArray: '4, 4',
        fillColor: '#10b981',
        fillOpacity: 0.12
      }).bindTooltip(peat.name, { sticky: true }).addTo(map);
    });

    // Layer group for surrounding existing points
    const surroundingGroup = L.layerGroup().addTo(map);
    surroundingGroupRef.current = surroundingGroup;

    // Buffer circle
    const bufferCircle = L.circle([lat, lng], {
      radius: inspectionRadiusM,
      color: '#047857',
      weight: 1.5,
      dashArray: '3, 3',
      fillColor: '#059669',
      fillOpacity: 0.14
    }).addTo(map);
    bufferCircleRef.current = bufferCircle;

    // Custom Target Crosshair Pin
    const targetIcon = L.divIcon({
      className: 'target-pin',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f172a;
          color: #ffffff;
          border-radius: 9999px;
          border: 2.5px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          cursor: grab;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="22" y1="12" x2="18" y2="12"></line>
            <line x1="6" y1="12" x2="2" y2="12"></line>
            <line x1="12" y1="6" x2="12" y2="2"></line>
            <line x1="12" y1="22" x2="12" y2="18"></line>
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker([lat, lng], {
      icon: targetIcon,
      draggable: true
    }).addTo(map);

    marker.on('drag', (e) => {
      const pos = e.target.getLatLng();
      const newLat = Math.round(pos.lat * 100000) / 100000;
      const newLng = Math.round(pos.lng * 100000) / 100000;
      setLat(newLat);
      setLng(newLng);
    });

    // Map Click Listener to re-position pin
    map.on('click', (e) => {
      const newLat = Math.round(e.latlng.lat * 100000) / 100000;
      const newLng = Math.round(e.latlng.lng * 100000) / 100000;
      setLat(newLat);
      setLng(newLng);
    });

    targetMarkerRef.current = marker;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync Marker & Buffer Circle when lat/lng/radius updates
  useEffect(() => {
    if (!mapInstanceRef.current || !targetMarkerRef.current || !bufferCircleRef.current) return;

    targetMarkerRef.current.setLatLng([lat, lng]);
    bufferCircleRef.current.setLatLng([lat, lng]);
    bufferCircleRef.current.setRadius(inspectionRadiusM);

    // Auto-detect KHG region based on coordinates
    const { nearestPeatName, distanceKm } = getDistanceToPeatlandKm(lat, lng);
    if (distanceKm === 0) {
      if (nearestPeatName.includes('Siak') || nearestPeatName.includes('Rokan')) {
        setRegion('Riau (Siak & Bengkalis)');
      } else if (nearestPeatName.includes('Kampar')) {
        setRegion('Riau (Semenanjung Kampar)');
      } else if (nearestPeatName.includes('Sebangau') || nearestPeatName.includes('Kahayan')) {
        setRegion('Kalimantan Tengah (Pulang Pisau - Sebangau)');
      } else if (nearestPeatName.includes('Kapuas') || nearestPeatName.includes('Kubu')) {
        setRegion('Kalimantan Barat (Kubu Raya)');
      }
    }
  }, [lat, lng, inspectionRadiusM]);

  // Render surrounding points on the picker map
  useEffect(() => {
    const group = surroundingGroupRef.current;
    if (!group) return;

    group.clearLayers();

    // Render existing points nearby
    existingPoints.forEach((p) => {
      const dKm = getDistanceKm(lat, lng, p.lat, p.lng);
      // Only render points within 25km radius to keep map fast
      if (dKm > 25) return;

      const isInsideSelectedBuffer = (dKm * 1000) <= inspectionRadiusM;

      let pinColor = '#ea580c';
      if (p.depthCm >= 300) pinColor = '#3f1303';
      else if (p.depthCm < 100) pinColor = '#fb923c';

      const circle = L.circleMarker([p.lat, p.lng], {
        radius: isInsideSelectedBuffer ? 6 : 4,
        fillColor: pinColor,
        color: isInsideSelectedBuffer ? '#047857' : '#ffffff',
        weight: isInsideSelectedBuffer ? 2.5 : 1,
        fillOpacity: 0.9
      });

      circle.bindTooltip(
        `<div style="font-size:11px; font-weight:600;">
          ${p.id} • <strong>${p.depthCm} cm</strong><br/>
          <span style="font-weight:400; color:#64748b;">Jarak: ${dKm < 1 ? `${Math.round(dKm * 1000)} m` : `${dKm.toFixed(1)} km`}</span>
        </div>`,
        { sticky: true }
      );

      circle.on('click', () => {
        // Snap to this point on marker click
        handleSnapToPoint(p);
      });

      group.addLayer(circle);
    });
  }, [lat, lng, existingPoints, inspectionRadiusM]);

  // Auto-Save Draft to LocalStorage
  useEffect(() => {
    const draft = {
      lat, lng, gpsAccuracy, depthCm, baseReached, mineralSubstrate,
      waterTableCm, peatMaturity, peatPh, method, date, landCover,
      drainage, region, notes, photoUrl
    };
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch (e) {
      // ignore quota exceeded
    }
  }, [lat, lng, gpsAccuracy, depthCm, baseReached, mineralSubstrate, waterTableCm, peatMaturity, peatPh, method, date, landCover, drainage, region, notes, photoUrl]);

  // Load Draft from LocalStorage
  const handleLoadDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.lat) setLat(d.lat);
        if (d.lng) setLng(d.lng);
        if (d.depthCm) setDepthCm(d.depthCm);
        if (d.waterTableCm) setWaterTableCm(d.waterTableCm);
        if (d.mineralSubstrate) setMineralSubstrate(d.mineralSubstrate);
        if (d.peatMaturity) setPeatMaturity(d.peatMaturity);
        if (d.notes) setNotes(d.notes);
        mapInstanceRef.current?.flyTo([d.lat || lat, d.lng || lng], 13);
        setSubmitFeedback({ type: 'success', message: 'Draf survei terakhir berhasil dipulihkan.' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Snap to Nearest Point Action
  const handleSnapToPoint = (p: PeatPoint) => {
    setLat(p.lat);
    setLng(p.lng);
    mapInstanceRef.current?.flyTo([p.lat, p.lng], 14, { duration: 0.8 });
    setSubmitFeedback({
      type: 'success',
      message: `Koordinat diselaraskan ke titik patok ${p.id} (${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}).`
    });
  };

  // Copy Land Characteristics Action
  const handleCopyCharacteristics = (p: PeatPoint) => {
    setLandCover(p.landCover);
    setDrainage(p.drainage);
    setRegion(p.region);
    setSubmitFeedback({
      type: 'success',
      message: `Karakteristik tutupan lahan (${p.landCover}) dan drainase (${p.drainage}) berhasil disalin dari ${p.id}.`
    });
  };

  // High-Accuracy Geolocation Lock
  const handleGetLocation = () => {
    setIsLocating(true);
    setGpsStatus(null);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const userLat = Math.round(pos.coords.latitude * 100000) / 100000;
          const userLng = Math.round(pos.coords.longitude * 100000) / 100000;
          const acc = Math.round(pos.coords.accuracy * 10) / 10;
          setLat(userLat);
          setLng(userLng);
          setGpsAccuracy(acc);
          setGpsStatus(`GPS berhasil dikunci: Akurasi ±${acc}m (${acc <= 5 ? 'Akurasi Tinggi / RTK Baik' : 'Akurasi Standar'})`);
          mapInstanceRef.current?.flyTo([userLat, userLng], 14, { duration: 0.8 });
        },
        () => {
          setIsLocating(false);
          setGpsStatus('GPS perangkat tidak merespons. Menggunakan koordinat default Kubah Siak, Riau.');
          setLat(1.3412);
          setLng(101.8921);
          setGpsAccuracy(3.5);
          mapInstanceRef.current?.flyTo([1.3412, 101.8921], 13);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsLocating(false);
      setGpsStatus('Perangkat tidak mendukung API geolokasi.');
    }
  };

  // Quick Pilot Jump
  const handleJumpToPilot = (targetLat: number, targetLng: number, targetName: string) => {
    setLat(targetLat);
    setLng(targetLng);
    mapInstanceRef.current?.flyTo([targetLat, targetLng], 12, { duration: 0.8 });
  };

  // Handle Photo File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.isValid) {
      setSubmitFeedback({
        type: 'error',
        message: 'Formulir belum memenuhi kaidah validasi spasial. Mohon periksa koordinat atau nilai kedalaman.'
      });
      return;
    }

    setSubmitting(true);
    setSubmitFeedback(null);

    const pointId = `PT-${region.includes('Riau') ? 'RIAU' : region.includes('Kalimantan Tengah') ? 'KTG' : 'GB'}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPoint: PeatPoint = {
      id: pointId,
      lat,
      lng,
      gpsAccuracy,
      depthCm,
      baseReached,
      method,
      date,
      landCover,
      drainage,
      photoUrl,
      notes,
      contributorId: currentUser?.id || `CONTRIB-${Math.floor(100 + Math.random() * 900)}`,
      contributorName: contributorName.trim() || currentUser?.name || 'Surveyor Mandiri',
      isPublicContributor,
      isObfuscated,
      status: 'pending',
      region,
      waterTableCm,
      peatMaturity,
      mineralSubstrate: baseReached ? mineralSubstrate : undefined,
      ph: peatPh,
      anomalous: validation.anomalous,
      duplicate: validation.duplicate,
      validationFlags: validation.flags,
      createdAt: new Date().toISOString()
    };

    const res = addPoint(newPoint, isOffline);

    setTimeout(() => {
      setSubmitting(false);
      setSubmitFeedback({
        type: 'success',
        message: `Titik survei ${pointId} berhasil direkam ke antrean verifikasi spasial!`
      });
      onPointAdded(newPoint, res.queued);
    }, 400);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              Formulir Survei Lapangan & Pengukuran Bor Gambut
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md">
              Advanced GIS Logger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Penetapan koordinat interaktif, analisis radius buffer, deteksi titik patok terdekat, dan pencatatan biofisik gambut.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadDraft}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition"
            title="Pulihkan draf isian formulir terakhir"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Muat Draf</span>
          </button>
          {currentUser && (
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-semibold">
              Surveyor: <strong>{currentUser.name}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Submission Feedback Alert */}
      {submitFeedback && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm flex items-start justify-between gap-3 shadow-2xs animate-fadeIn ${
            submitFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {submitFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed font-medium">{submitFeedback.message}</span>
          </div>
          <button
            onClick={() => setSubmitFeedback(null)}
            className="text-slate-500 hover:text-slate-900 text-xs font-bold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main 2-Column Responsive Workspace */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Map Picker & Proximity Analysis (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Map Picker Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
            
            {/* Map Header Toolbar */}
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-xs text-slate-900">
                  Peta Penentu Lokasi (Map Picker)
                </span>
              </div>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-800 shadow-2xs transition"
              >
                <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin text-emerald-600' : 'text-slate-600'}`} />
                <span>{isLocating ? 'Mencari...' : 'Kunci GPS Saya'}</span>
              </button>
            </div>

            {/* Quick Pilot Jump Bar */}
            <div className="px-3 py-2 bg-slate-100/70 border-b border-slate-200/60 flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="text-slate-400 shrink-0 font-medium text-[10px]">Lompat:</span>
              <button
                type="button"
                onClick={() => handleJumpToPilot(1.35, 101.85, 'Siak')}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-200/70 text-slate-700 font-medium shrink-0 border border-slate-200"
              >
                Siak (Riau)
              </button>
              <button
                type="button"
                onClick={() => handleJumpToPilot(0.45, 102.85, 'Kampar')}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-200/70 text-slate-700 font-medium shrink-0 border border-slate-200"
              >
                Kampar
              </button>
              <button
                type="button"
                onClick={() => handleJumpToPilot(-2.75, 113.95, 'Kalteng')}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-200/70 text-slate-700 font-medium shrink-0 border border-slate-200"
              >
                Sebangau (Kalteng)
              </button>
              <button
                type="button"
                onClick={() => handleJumpToPilot(-0.45, 109.45, 'Kubu Raya')}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-200/70 text-slate-700 font-medium shrink-0 border border-slate-200"
              >
                Kubu Raya
              </button>
            </div>

            {/* Map Canvas */}
            <div className="relative w-full h-[320px] sm:h-[360px] bg-slate-100">
              <div ref={mapContainerRef} className="w-full h-full" />
              
              <div className="absolute bottom-2 left-2 z-10 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] text-slate-600 border border-slate-200 shadow-2xs">
                Klik peta atau seret pin hitam untuk memposisikan titik
              </div>
            </div>

            {/* Radius Buffer Slider (User requested: "bisa pake radius") */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                  Radius Buffer Pengamatan:
                </span>
                <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {inspectionRadiusM} meter
                </span>
              </div>
              <input
                type="range"
                min="25"
                max="1000"
                step="25"
                value={inspectionRadiusM}
                onChange={(e) => setInspectionRadiusM(parseInt(e.target.value))}
                className="w-full accent-emerald-700 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>25m (Batas Duplikat)</span>
                <span>250m (Standar Transek)</span>
                <span>1000m (Lansekap KHG)</span>
              </div>
            </div>
          </div>

          {/* Nearest Point Card (User requested: "otomatis pilih titik terdekat") */}
          {nearestPointAnalysis?.point && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-xs text-slate-900">
                    Titik Bor Terdekat Terdeteksi
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  nearestPointAnalysis.isDuplicateCandidate
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  Jarak: {nearestPointAnalysis.distanceMeters < 1000 
                    ? `${nearestPointAnalysis.distanceMeters} m` 
                    : `${(nearestPointAnalysis.distanceMeters / 1000).toFixed(2)} km`}
                </span>
              </div>

              {/* Point Meta Details */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 block text-[10px]">ID Patok</span>
                  <span className="font-mono font-bold text-emerald-800">{nearestPointAnalysis.point.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Kedalaman Gambut</span>
                  <span className="font-mono font-bold text-amber-800">{nearestPointAnalysis.point.depthCm} cm</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Tutupan / Drainase</span>
                  <span className="capitalize">{nearestPointAnalysis.point.landCover} ({nearestPointAnalysis.point.drainage})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Kontributor</span>
                  <span className="truncate block">{nearestPointAnalysis.point.contributorName}</span>
                </div>
              </div>

              {/* Duplicate Warning if <25m */}
              {nearestPointAnalysis.isDuplicateCandidate && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Peringatan Duplikasi:</strong> Lokasi berjarak kurang dari 25 meter dari titik <strong>{nearestPointAnalysis.point.id}</strong>.
                  </span>
                </div>
              )}

              {/* Depth Delta Comparison */}
              <div className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-600">Perbandingan Tebal:</span>
                <span className="font-mono font-bold text-slate-900">
                  Input ({depthCm} cm) vs Terdekat ({nearestPointAnalysis.point.depthCm} cm) = {' '}
                  <span className={Math.abs(depthCm - nearestPointAnalysis.point.depthCm) > 150 ? 'text-amber-700' : 'text-emerald-700'}>
                    {depthCm - nearestPointAnalysis.point.depthCm >= 0 ? '+' : ''}{depthCm - nearestPointAnalysis.point.depthCm} cm
                  </span>
                </span>
              </div>

              {/* Action Buttons for Auto-Select / Snap */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSnapToPoint(nearestPointAnalysis.point!)}
                  className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition shadow-2xs"
                  title="Gunakan koordinat persis dari titik terdekat ini"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Snap ke Titik Ini</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyCharacteristics(nearestPointAnalysis.point!)}
                  className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 border border-slate-200 transition"
                  title="Salin tutupan lahan dan kondisi drainase"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Salin Karakter</span>
                </button>
              </div>
            </div>
          )}

          {/* Buffer Points Summary */}
          {nearestPointAnalysis && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-950 flex items-center justify-between">
              <div>
                <span className="font-bold text-emerald-900">Dalam Radius {inspectionRadiusM}m:</span>
                <span className="ml-1 text-slate-600">{nearestPointAnalysis.pointsInRadius} titik survei eksis</span>
              </div>
              {nearestPointAnalysis.avgDepthInRadius && (
                <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                  Rata-rata: {nearestPointAnalysis.avgDepthInRadius} cm
                </span>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Structured Field Survey Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Section 1: Koordinat & Lokasi */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-900">
                1. Data Koordinat & Ketelitian GPS
              </h2>
            </div>

            {gpsStatus && (
              <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {gpsStatus}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Latitude (Lintang) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Longitude (Bujur) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Akurasi GPS (± meter)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={gpsAccuracy}
                  onChange={(e) => setGpsAccuracy(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kawasan Wilayah Gambut (KHG)
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:border-emerald-600"
              >
                <option value="Riau (Siak & Bengkalis)">Riau — Siak & Bengkalis</option>
                <option value="Riau (Semenanjung Kampar)">Riau — Semenanjung Kampar</option>
                <option value="Kalimantan Tengah (Pulang Pisau - Sebangau)">Kalimantan Tengah — Pulang Pisau & Sebangau</option>
                <option value="Kalimantan Barat (Kubu Raya)">Kalimantan Barat — Kubu Raya</option>
                <option value="Sumatera Selatan (OKI - Banyuasin)">Sumatera Selatan — OKI & Banyuasin</option>
                <option value="Wilayah Gambut Lainnya">Wilayah Gambut Lainnya di Indonesia</option>
              </select>
            </div>
          </div>

          {/* Section 2: Stratigrafi & Pengukuran Kedalaman */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Activity className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-900">
                2. Pengukuran Bor & Stratigrafi Gambut
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tebal Gambut (cm) <span className="text-rose-600">*</span>
                </label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="number"
                    min="0"
                    max="2000"
                    value={depthCm}
                    onChange={(e) => setDepthCm(parseInt(e.target.value) || 0)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-base font-bold font-mono text-amber-800 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-xs font-bold text-slate-600 shrink-0 bg-slate-100 px-2 py-2 rounded-lg border border-slate-200">
                    {(depthCm / 100).toFixed(2)} m
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tinggi Muka Air Tanah (TMAT cm)
                </label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="number"
                    min="-200"
                    max="50"
                    value={waterTableCm}
                    onChange={(e) => setWaterTableCm(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-base font-bold font-mono text-sky-800 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <span className={`text-[10px] font-bold px-2 py-2 rounded-lg border shrink-0 ${
                    waterTableCm < -40 
                      ? 'bg-rose-50 text-rose-800 border-rose-200' 
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {waterTableCm < -40 ? 'Rawan Kebakaran' : 'Ambang Aman'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Regulasi BRGM: TMAT minimal -40 cm dari permukaan
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kematangan Gambut (Von Post Scale)
                </label>
                <select
                  value={peatMaturity}
                  onChange={(e) => setPeatMaturity(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="fibrik">Fibrik (H1 - H3: Serat Kasar & Utuh)</option>
                  <option value="hemik">Hemik (H4 - H6: Setengah Lapuk)</option>
                  <option value="saprik">Saprik (H7 - H10: Lapuk Sempurna/Pekat)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tingkat Keasaman (pH)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="2.5"
                  max="8.0"
                  value={peatPh}
                  onChange={(e) => setPeatPh(parseFloat(e.target.value) || 4.0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Base Reached & Mineral Substrate */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Dasar Tanah Mineral Tercapai:</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="baseReached"
                      checked={baseReached === true}
                      onChange={() => setBaseReached(true)}
                      className="accent-emerald-700"
                    />
                    <span>Ya (Tembus Mineral)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="baseReached"
                      checked={baseReached === false}
                      onChange={() => setBaseReached(false)}
                      className="accent-emerald-700"
                    />
                    <span>Belum Tembus (&gt; cm)</span>
                  </label>
                </div>
              </div>

              {baseReached && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Jenis Substrat Tanah Mineral di Dasar:
                  </label>
                  <select
                    value={mineralSubstrate}
                    onChange={(e) => setMineralSubstrate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Lempung Marin (Marine Clay)">Lempung Marin (Marine Clay)</option>
                    <option value="Pasir Kuarsa (Quartz Sand)">Pasir Kuarsa (Quartz Sand)</option>
                    <option value="Endapan Liat Aluvial">Endapan Liat Aluvial</option>
                    <option value="Batuan Sedimen">Batuan Sedimen / Cadas</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Biofisik Lahan & Foto Survei */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Droplet className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-900">
                3. Karakteristik Lahan & Bukti Dokumentasi
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Metode Pengukuran
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as MeasurementMethod)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="bor_gambut">Bor Gambut Semi-Silinder (Eijkelkamp)</option>
                  <option value="probe">Tongkat Ukur / Probe Baja Bertanda</option>
                  <option value="ert">Geolistrik / Electrical Resistivity (ERT)</option>
                  <option value="lainnya">Metode Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tutupan Lahan
                </label>
                <select
                  value={landCover}
                  onChange={(e) => setLandCover(e.target.value as LandCover)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="hutan">Hutan Rawa Gambut Alami</option>
                  <option value="semak">Semak Belukar / Bekas Terbakar</option>
                  <option value="sawit">Perkebunan Kelapa Sawit</option>
                  <option value="kebun">Kebun Campuran / Karet / Sagu</option>
                  <option value="lahan_terbuka">Lahan Terbuka / Kliring</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kondisi Tata Air & Drainase
              </label>
              <select
                value={drainage}
                onChange={(e) => setDrainage(e.target.value as DrainageCondition)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-600"
              >
                <option value="alami">Alami (Tanpa Kanal Buatan, Tergenang Sebagian)</option>
                <option value="kanal">Berkanal dengan Sekat (Canal Blocking Aktif)</option>
                <option value="terdrainase_berat">Terdrainase Berat (Kanal Dalam Aktif Mengalir)</option>
              </select>
            </div>

            {/* Photo Preview & Upload */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Dokumentasi Foto Lapangan (Batang Bor / Teras Tanah) <span className="text-rose-600">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <img
                  src={photoUrl}
                  alt="Foto Survei"
                  className="w-full sm:w-28 h-24 object-cover rounded-xl border border-slate-200 shadow-2xs shrink-0"
                />
                <div className="space-y-2 w-full text-xs">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="block w-full text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Format: JPG/PNG. Foto wajib menampilkan skala meteran atau tabung auger tanah gambut.
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Lapangan & Aksesibilitas
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Titik berjarak 50m timur kanal sekunder, vegetasi dominan meranti rawa..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Validation Status & Action Buttons */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            
            {/* Validation Indicator */}
            <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              validation.isValid
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center gap-2">
                <FileCheck2 className={`w-4 h-4 ${validation.isValid ? 'text-emerald-700' : 'text-rose-600'}`} />
                <span className="font-semibold">
                  {validation.isValid ? 'Parameter Memenuhi Syarat Validasi Spasial' : 'Pemeriksaan Otomatis Belum Lengkap'}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase">
                {validation.isValid ? 'Valid' : 'Revisi Diperlukan'}
              </span>
            </div>

            {validation.flags.length > 0 && (
              <ul className="text-xs space-y-1 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {validation.flags.map((flag, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || !validation.isValid}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition"
              >
                <Save className="w-4 h-4" />
                <span>{submitting ? 'Merekam Data Lapangan...' : 'Kirim Data Titik Survei'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
