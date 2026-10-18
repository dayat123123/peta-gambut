import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { PeatPoint, IDWParameters, HotspotPoint, FireIncidentReport, FireWaterSource } from '../types';
import { PILOT_PEATLANDS } from '../data/peatlandsGeo';
import { runIDWInterpolation, IDWInterpolationResult, DEFAULT_IDW_PARAMS } from '../services/idw';
import { getStoredHotspots, getStoredFireIncidents, getStoredWaterSources } from '../services/fireService';
import { 
  Layers, 
  BarChart3, 
  ListFilter, 
  X,
  Compass,
  Map as MapIcon,
  Globe,
  Sun,
  Flame,
  Droplets,
  AlertTriangle
} from 'lucide-react';

interface InteractiveMapProps {
  points: PeatPoint[];
  selectedRegion: string;
  onSelectPoint: (point: PeatPoint) => void;
  idwParams: IDWParameters;
  onUpdateIdwParams: (params: IDWParameters) => void;
  focusCoord?: { lat: number; lng: number; zoom?: number } | null;
  onClearFocusCoord?: () => void;
  isVisible?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  points,
  selectedRegion,
  onSelectPoint,
  idwParams,
  onUpdateIdwParams,
  focusCoord,
  onClearFocusCoord,
  isVisible
}) => {
  const prevRegionRef = useRef(selectedRegion);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Basemap tile layers
  const baseTilesRef = useRef<{ [key: string]: L.TileLayer }>({});
  const pointsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const idwLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const peatlandMaskGroupRef = useRef<L.LayerGroup | null>(null);
  const uncertaintyLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const regionBadgesGroupRef = useRef<L.LayerGroup | null>(null);
  const hotspotsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const fireIncidentsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const waterSourcesLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Map state
  const [currentZoom, setCurrentZoom] = useState<number>(6);
  const [activeBasemap, setActiveBasemap] = useState<'topo' | 'osm_hot' | 'satellite'>('topo');

  // Layer visibility toggles
  const [showPoints, setShowPoints] = useState<boolean>(true);
  const [showIdwSurface, setShowIdwSurface] = useState<boolean>(true);
  const [showPeatMask, setShowPeatMask] = useState<boolean>(true);
  const [showUncertainty, setShowUncertainty] = useState<boolean>(false);
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [showFireIncidents, setShowFireIncidents] = useState<boolean>(true);
  const [showWaterSources, setShowWaterSources] = useState<boolean>(true);

  // Fire Data - Live reactive
  const [hotspots, setHotspots] = useState<HotspotPoint[]>(getStoredHotspots);
  const [fireIncidents, setFireIncidents] = useState<FireIncidentReport[]>(getStoredFireIncidents);
  const [waterSources, setWaterSources] = useState<FireWaterSource[]>(getStoredWaterSources);

  useEffect(() => {
    const handleUpdate = () => {
      setHotspots(getStoredHotspots());
      setFireIncidents(getStoredFireIncidents());
      setWaterSources(getStoredWaterSources());
    };
    window.addEventListener('karhutla_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('karhutla_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Filter state
  const [depthFilter, setDepthFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [baseReachedOnly, setBaseReachedOnly] = useState<boolean>(false);

  // Active floating panel ('layers' | 'stats' | 'legend' | 'params' | 'filter' | null)
  const [activePanel, setActivePanel] = useState<string | null>(null);

  // Calculate IDW Spatial Interpolation
  const idwResult: IDWInterpolationResult = useMemo(() => {
    return runIDWInterpolation(points, selectedRegion, idwParams);
  }, [points, selectedRegion, idwParams]);

  // Filtered Points
  const displayedPoints = useMemo(() => {
    return points.filter((p) => {
      if (selectedRegion === 'riau' && !p.region.includes('Riau')) return false;
      if (selectedRegion === 'kalteng' && !p.region.includes('Kalimantan Tengah')) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (baseReachedOnly && !p.baseReached) return false;

      if (depthFilter === '<50' && p.depthCm >= 50) return false;
      if (depthFilter === '50-100' && (p.depthCm < 50 || p.depthCm > 100)) return false;
      if (depthFilter === '100-200' && (p.depthCm < 100 || p.depthCm > 200)) return false;
      if (depthFilter === '200-300' && (p.depthCm < 200 || p.depthCm > 300)) return false;
      if (depthFilter === '>300' && p.depthCm <= 300) return false;

      return true;
    });
  }, [points, selectedRegion, statusFilter, baseReachedOnly, depthFilter]);

  // Color mapper for peat depth
  const getPeatDepthColor = (depthCm: number) => {
    if (depthCm >= 300) return '#3f1303'; // Kubah inti (>3m)
    if (depthCm >= 200) return '#991b1b'; // Sangat Dalam (2-3m)
    if (depthCm >= 100) return '#ea580c'; // Dalam (1-2m)
    if (depthCm >= 50) return '#fb923c';  // Sedang (0.5-1m)
    return '#facc15';                      // Dangkal (<0.5m)
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Western & Central Indonesia peat belt (Sumatra & Kalimantan)
    const map = L.map(mapContainerRef.current, {
      center: [-0.2, 107.5],
      zoom: 6,
      minZoom: 5,
      maxZoom: 18,
      zoomControl: false
    });

    // Zoom control at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Track zoom level changes for adaptive marker scaling
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    // ESRI World Topo Map: clean, high clarity, reliable, no watermark
    const topo = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '&copy; Esri, HERE, Garmin, USGS',
        maxZoom: 18
      }
    );

    // OpenStreetMap Humanitarian (HOT): bright, beautiful green & road topography
    const osm_hot = L.tileLayer(
      'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors, Humanitarian OpenStreetMap Team',
        subdomains: ['a', 'b', 'c'],
        maxZoom: 19
      }
    );

    // Esri World Imagery (Satellite)
    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '&copy; Esri, Maxar, Earthstar Geographics',
        maxZoom: 18
      }
    );

    topo.addTo(map);
    baseTilesRef.current = { topo, osm_hot, satellite };

    // Register Layer Groups
    idwLayerGroupRef.current = L.layerGroup().addTo(map);
    peatlandMaskGroupRef.current = L.layerGroup().addTo(map);
    uncertaintyLayerGroupRef.current = L.layerGroup().addTo(map);
    regionBadgesGroupRef.current = L.layerGroup().addTo(map);
    pointsLayerGroupRef.current = L.layerGroup().addTo(map);
    waterSourcesLayerGroupRef.current = L.layerGroup().addTo(map);
    hotspotsLayerGroupRef.current = L.layerGroup().addTo(map);
    fireIncidentsLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      try {
        map.stop();
      } catch (e) {}
      try {
        map.remove();
      } catch (e) {}
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle visibility and resize invalidation
  useEffect(() => {
    if (isVisible !== false && mapInstanceRef.current) {
      const timer = setTimeout(() => {
        try {
          mapInstanceRef.current?.invalidateSize();
        } catch (e) {}
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Handle Target Coordinate Focus (from Karhutla View or External action)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !focusCoord || typeof focusCoord.lat !== 'number' || typeof focusCoord.lng !== 'number' || isNaN(focusCoord.lat) || isNaN(focusCoord.lng)) {
      return;
    }

    try {
      const size = map.getSize();
      if (!size || size.x <= 0 || size.y <= 0) {
        map.setView([focusCoord.lat, focusCoord.lng], focusCoord.zoom || 13);
      } else {
        map.invalidateSize();
        map.flyTo([focusCoord.lat, focusCoord.lng], focusCoord.zoom || 13, { duration: 1.2 });
      }
    } catch (e) {
      try {
        map.setView([focusCoord.lat, focusCoord.lng], focusCoord.zoom || 13);
      } catch (err) {}
    }

    if (onClearFocusCoord) {
      onClearFocusCoord();
    }
  }, [focusCoord, onClearFocusCoord]);

  // Handle Basemap Switcher
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !baseTilesRef.current) return;

    Object.values(baseTilesRef.current).forEach((layer) => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

    const targetLayer = baseTilesRef.current[activeBasemap];
    if (targetLayer) {
      targetLayer.addTo(map);
    }
  }, [activeBasemap]);

  // Handle Region Flying (only when region explicitly changes, using setView if container unmeasured)
  useEffect(() => {
    if (prevRegionRef.current === selectedRegion) {
      return;
    }
    prevRegionRef.current = selectedRegion;

    const map = mapInstanceRef.current;
    if (!map) return;

    const targetCoords: [number, number] = 
      selectedRegion === 'riau' ? [1.15, 102.1] :
      selectedRegion === 'kalteng' ? [-2.8, 114.1] :
      [-0.2, 107.5];
    const targetZoom = selectedRegion === 'all' ? 6 : 8;

    try {
      const size = map.getSize();
      if (!size || size.x <= 0 || size.y <= 0) {
        map.setView(targetCoords, targetZoom);
        return;
      }

      map.invalidateSize();
      map.flyTo(targetCoords, targetZoom, { duration: 0.9 });
    } catch (e) {
      try {
        map.setView(targetCoords, targetZoom);
      } catch (err) {}
    }
  }, [selectedRegion]);

  // Render Peatland Mask Boundaries (BBSDLP / KHG)
  useEffect(() => {
    const group = peatlandMaskGroupRef.current;
    if (!group) return;

    group.clearLayers();
    if (!showPeatMask) return;

    PILOT_PEATLANDS.forEach((peat) => {
      const polygon = L.polygon(peat.coordinates, {
        color: '#047857',
        weight: 1.8,
        dashArray: '5, 5',
        fillColor: '#10b981',
        fillOpacity: 0.14
      });

      polygon.bindTooltip(
        `<div style="font-size:12px; font-weight:600; padding:2px 4px;">
          <span style="color:#065f46;">${peat.name}</span><br/>
          <span style="font-weight:400; color:#64748b; font-size:11px;">Luas Sebaran: ${peat.areaKm2.toLocaleString('id-ID')} km²</span>
        </div>`,
        { sticky: true }
      );

      group.addLayer(polygon);
    });
  }, [showPeatMask]);

  // Render IDW Continuous Depth Raster Cells
  useEffect(() => {
    const group = idwLayerGroupRef.current;
    if (!group) return;

    group.clearLayers();
    if (!showIdwSurface) return;

    const halfRes = idwParams.gridResolution / 2;

    idwResult.cells.forEach((cell) => {
      if (!cell.isReliable && !showUncertainty) {
        return;
      }

      const bounds: L.LatLngBoundsExpression = [
        [cell.lat - halfRes, cell.lng - halfRes],
        [cell.lat + halfRes, cell.lng + halfRes]
      ];

      const rect = L.rectangle(bounds, {
        color: cell.color,
        weight: 0.05,
        fillColor: cell.color,
        fillOpacity: cell.isReliable ? 0.65 : 0.22
      });

      rect.bindTooltip(
        `<div style="font-size:12px; padding:3px; line-height:1.4;">
          <span style="font-weight:700; color:#0f172a;">Tebal Prediksi: ${cell.depthCm} cm</span> (${(cell.depthCm / 100).toFixed(2)} m)<br/>
          <span style="color:#64748b; font-size:11px;">Jarak Titik Bor Terdekat: ${cell.distanceToNearestKm} km</span><br/>
          <span style="color:${cell.isReliable ? '#047857' : '#b45309'}; font-weight:600; font-size:11px;">
            ${cell.isReliable ? '✓ Data Andal (<18 km)' : '⚠ Zona Kurang Data'}
          </span>
        </div>`,
        { sticky: true }
      );

      group.addLayer(rect);
    });
  }, [idwResult, showIdwSurface, showUncertainty, idwParams.gridResolution]);

  // Render Uncertainty Zone (Data Gap Overlay)
  useEffect(() => {
    const group = uncertaintyLayerGroupRef.current;
    if (!group) return;

    group.clearLayers();
    if (!showUncertainty) return;

    const halfRes = idwParams.gridResolution / 2;

    idwResult.cells.forEach((cell) => {
      if (!cell.isReliable) {
        const bounds: L.LatLngBoundsExpression = [
          [cell.lat - halfRes, cell.lng - halfRes],
          [cell.lat + halfRes, cell.lng + halfRes]
        ];

        const uncertRect = L.rectangle(bounds, {
          color: '#be123c',
          weight: 1,
          dashArray: '3, 3',
          fillColor: '#9f1239',
          fillOpacity: 0.28
        });

        uncertRect.bindTooltip(
          `<div style="font-size:12px; padding:2px;">
            <strong style="color:#be123c;">Zona Kurang Data Survei</strong><br/>
            Jarak ke bor terdekat: ${cell.distanceToNearestKm} km
          </div>`,
          { sticky: true }
        );

        group.addLayer(uncertRect);
      }
    });
  }, [idwResult, showUncertainty, idwParams.gridResolution]);

  // Render Regional Centroid Chips at Low Zoom (avoiding marker clutter)
  useEffect(() => {
    const group = regionBadgesGroupRef.current;
    if (!group) return;

    group.clearLayers();

    // Only display region overview pills when zoomed out (zoom <= 7)
    if (currentZoom <= 7) {
      const regions = [
        {
          name: 'Pilot 1: Gambut Riau',
          subtitle: 'Siak & Kampar',
          lat: 2.3,
          lng: 101.85,
          pointCount: points.filter(p => p.region.includes('Riau')).length,
          avgDepth: 242,
          targetLat: 1.25,
          targetLng: 102.1
        },
        {
          name: 'Pilot 2: Gambut Kalteng',
          subtitle: 'Pulang Pisau & Sebangau',
          lat: -1.8,
          lng: 114.1,
          pointCount: points.filter(p => p.region.includes('Kalimantan Tengah')).length,
          avgDepth: 294,
          targetLat: -2.8,
          targetLng: 114.1
        }
      ];

      regions.forEach((r) => {
        const badgeIcon = L.divIcon({
          className: 'custom-region-badge',
          html: `
            <div style="
              background: #ffffff;
              color: #0f172a;
              border: 1px solid #cbd5e1;
              box-shadow: 0 4px 14px rgba(15, 23, 42, 0.14);
              border-radius: 9999px;
              padding: 5px 12px;
              display: flex;
              align-items: center;
              gap: 8px;
              font-family: inherit;
              white-space: nowrap;
              cursor: pointer;
            ">
              <span style="
                width: 8px;
                height: 8px;
                border-radius: 9999px;
                background-color: #047857;
                display: inline-block;
              "></span>
              <span style="font-weight: 700; font-size: 11px;">${r.name}</span>
              <span style="
                background: #f1f5f9;
                color: #475569;
                font-size: 10px;
                font-weight: 600;
                padding: 1px 6px;
                border-radius: 4px;
              ">${r.pointCount} Titik</span>
            </div>
          `,
          iconSize: [210, 30],
          iconAnchor: [105, 15]
        });

        const marker = L.marker([r.lat, r.lng], { icon: badgeIcon });
        marker.on('click', () => {
          const map = mapInstanceRef.current;
          if (!map) return;
          const size = map.getSize();
          if (!size || size.x <= 0 || size.y <= 0) {
            map.setView([r.targetLat, r.targetLng], 9);
          } else {
            map.flyTo([r.targetLat, r.targetLng], 9, { duration: 1.0 });
          }
        });
        group.addLayer(marker);
      });
    }
  }, [currentZoom, points]);

  // Render Survey Points with Adaptive Sizing
  useEffect(() => {
    const group = pointsLayerGroupRef.current;
    if (!group) return;

    group.clearLayers();
    if (!showPoints) return;

    const isZoomedOut = currentZoom <= 7;

    displayedPoints.forEach((p) => {
      const pinColor = getPeatDepthColor(p.depthCm);

      // Sizing: subtle 3.5px micro-dots at low zoom; crisp 5.5px circles at high zoom
      const radius = isZoomedOut ? 3.5 : 5.5;
      const weight = isZoomedOut ? 0.75 : 1.5;

      const marker = L.circleMarker([p.lat, p.lng], {
        radius,
        fillColor: pinColor,
        color: '#ffffff',
        weight,
        opacity: 1,
        fillOpacity: 0.92
      });

      // Hover feedback
      marker.on('mouseover', () => {
        marker.setRadius(radius + 2.5);
        marker.setStyle({ weight: 2 });
      });
      marker.on('mouseout', () => {
        marker.setRadius(radius);
        marker.setStyle({ weight });
      });

      // Popup card
      const popup = document.createElement('div');
      popup.className = 'p-3.5 text-slate-800 max-w-[240px] space-y-2';
      popup.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f5f9; padding-bottom:5px;">
          <span style="font-family:monospace; font-weight:700; color:#047857; font-size:12px;">${p.id}</span>
          <span style="font-size:10px; font-weight:600; text-transform:uppercase; color:#64748b; background:#f8fafc; border:1px solid #e2e8f0; padding:1px 5px; border-radius:4px;">
            ${p.status}
          </span>
        </div>
        <div>
          <div style="font-size:20px; font-weight:800; color:#9a3412; font-family:monospace; line-height:1.2;">
            ${p.depthCm} cm
          </div>
          <div style="font-size:11px; color:#64748b; margin-top:2px;">
            ${p.baseReached ? '✓ Dasar mineral tercapai' : '⚠ Belum tembus (> cm)'}
          </div>
        </div>
        <div style="font-size:11px; color:#475569; border-top:1px solid #f8fafc; padding-top:5px; display:grid; grid-template-columns:1fr 1fr; gap:3px;">
          <div>Metode: <strong>${p.method.replace('_', ' ')}</strong></div>
          <div>Lahan: <strong>${p.landCover}</strong></div>
        </div>
      `;

      const btn = document.createElement('button');
      btn.className = 'w-full mt-1.5 py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold shadow-2xs transition';
      btn.innerText = 'Buka Rincian Lapangan';
      btn.onclick = () => onSelectPoint(p);
      popup.appendChild(btn);

      marker.bindPopup(popup);
      group.addLayer(marker);
    });
  }, [displayedPoints, showPoints, currentZoom, onSelectPoint]);

  // Render Near-Real-Time Satellite Hotspots (VIIRS & MODIS)
  useEffect(() => {
    const group = hotspotsLayerGroupRef.current;
    if (!group) return;

    group.clearLayers();
    if (!showHotspots) return;

    hotspots.forEach((hs) => {
      const isHigh = hs.confidence === 'high';
      const color = isHigh ? '#e11d48' : '#ea580c';

      const icon = L.divIcon({
        className: 'custom-hotspot-marker',
        html: `
          <div class="${isHigh ? 'hotspot-pulse-icon' : ''}" style="
            background: ${color};
            color: #ffffff;
            width: 22px;
            height: 22px;
            border-radius: 9999px;
            border: 2px solid #ffffff;
            box-shadow: 0 0 10px ${color}aa, 0 2px 5px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            cursor: pointer;
          ">
            🔥
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = L.marker([hs.lat, hs.lng], { icon });

      const gcStatus = hs.groundcheckStatus || 'belum_diperiksa';
      const gcLabels: Record<string, { label: string; bg: string; color: string }> = {
        belum_diperiksa: { label: 'Belum Di-groundcheck', bg: '#f1f5f9', color: '#475569' },
        terverifikasi_api: { label: 'Api Terverifikasi Lapangan', bg: '#fee2e2', color: '#991b1b' },
        terverifikasi_padam: { label: 'Sudah Padam', bg: '#dbeafe', color: '#1e40af' },
        pantulan_bukan_api: { label: 'Bukan Api (Pantulan)', bg: '#fef3c7', color: '#92400e' }
      };
      const gc = gcLabels[gcStatus] || gcLabels.belum_diperiksa;

      const popup = document.createElement('div');
      popup.className = 'p-3 text-slate-800 max-w-[240px] space-y-2';
      popup.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f5f9; padding-bottom:5px;">
          <span style="font-family:monospace; font-weight:700; color:#e11d48; font-size:12px;">${hs.satellite}</span>
          <span style="font-size:10px; font-weight:700; text-transform:uppercase; color:${isHigh ? '#be123c' : '#c2410c'}; background:${isHigh ? '#ffe4e6' : '#ffedd5'}; padding:2px 6px; border-radius:4px;">
            ${hs.confidence} (${hs.confidencePercent || 85}%)
          </span>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; font-size:11px;">
          <div style="background:#f8fafc; padding:4px 6px; border-radius:6px; border:1px solid #e2e8f0;">
            <span style="color:#64748b; font-size:10px; display:block;">Radiative Power</span>
            <strong style="color:#0f172a; font-family:monospace;">${hs.frp} MW</strong>
          </div>
          <div style="background:#f8fafc; padding:4px 6px; border-radius:6px; border:1px solid #e2e8f0;">
            <span style="color:#64748b; font-size:10px; display:block;">Suhu Kecerahan</span>
            <strong style="color:#0f172a; font-family:monospace;">${hs.brightnessKelvin || 330} K</strong>
          </div>
        </div>
        <div style="font-size:11px; color:#475569; border-top:1px solid #f1f5f9; padding-top:4px; space-y-1;">
          <div>Wilayah: <strong>${hs.region}</strong></div>
          <div>Kedalaman Gambut Terancam: <strong style="color:#9a3412;">${hs.threatenedPeatDepthCm || 200} cm</strong></div>
          <div>Jarak ke Kanal Air: <strong>${hs.distanceToNearestCanalM || 500} meter</strong></div>
          <div style="color:#64748b; font-size:10px; margin-top:2px;">Terdeteksi: ${hs.acquisitionTime || 'Hari ini'}</div>
          <div style="background:${gc.bg}; color:${gc.color}; font-size:10px; font-weight:600; padding:3px 6px; border-radius:4px; margin-top:4px;">
            ${gc.label}
          </div>
          ${hs.groundcheckNotes ? `<div style="font-size:10px; color:#475569; font-style:italic; margin-top:2px;">"${hs.groundcheckNotes}"</div>` : ''}
        </div>
      `;

      marker.bindPopup(popup);
      group.addLayer(marker);
    });
  }, [hotspots, showHotspots]);

  // Render Ground Fire Incidents
  useEffect(() => {
    const group = fireIncidentsLayerGroupRef.current;
    if (!group) return;

    group.clearLayers();
    if (!showFireIncidents) return;

    fireIncidents.forEach((inc) => {
      const isAktif = inc.status === 'terkonfirmasi_aktif';
      const isPemadaman = inc.status === 'operasi_pemadaman';

      const bgBadge = isAktif ? '#e11d48' : isPemadaman ? '#d97706' : '#059669';
      const iconEmoji = isAktif ? '🚨' : isPemadaman ? '🚒' : '✓';
      const labelText = isAktif ? 'Api Aktif' : isPemadaman ? 'Pemadaman' : 'Padam';

      const icon = L.divIcon({
        className: 'custom-fire-incident-marker',
        html: `
          <div class="${isAktif ? 'fire-pulse-icon' : ''}" style="
            background: ${bgBadge};
            color: #ffffff;
            border: 2px solid #ffffff;
            border-radius: 9999px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
            padding: 3px 8px;
            display: flex;
            align-items: center;
            gap: 4px;
            font-weight: 700;
            font-size: 10px;
            font-family: inherit;
            white-space: nowrap;
            cursor: pointer;
          ">
            <span>${iconEmoji}</span>
            <span>${labelText}</span>
          </div>
        `,
        iconSize: [85, 24],
        iconAnchor: [42, 12]
      });

      const marker = L.marker([inc.lat, inc.lng], { icon });

      const waterLabel = inc.waterAvailability ? inc.waterAvailability.replace(/_/g, ' ') : 'tersedia';

      const popup = document.createElement('div');
      popup.className = 'p-3 text-slate-800 max-w-[260px] space-y-2';
      popup.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f5f9; padding-bottom:5px;">
          <span style="font-family:monospace; font-weight:700; color:#0f172a; font-size:12px;">${inc.id}</span>
          <span style="font-size:10px; font-weight:700; text-transform:uppercase; color:#ffffff; background:${bgBadge}; padding:2px 6px; border-radius:4px;">
            ${labelText}
          </span>
        </div>
        <div style="font-size:11px; color:#334155;">
          <strong>${inc.region}</strong>
          <div style="color:#64748b; font-size:10px; margin-top:2px;">Pelapor: ${inc.reporterName || 'Petugas'} (${(inc.reporterRole || 'kontributor').toUpperCase()})</div>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; font-size:11px;">
          <div style="background:#fef2f2; border:1px solid #fee2e2; padding:4px 6px; border-radius:6px;">
            <span style="color:#991b1b; font-size:10px; display:block;">Estimasi Luas</span>
            <strong style="color:#7f1d1d; font-family:monospace;">${inc.estimatedAreaHa || 0} Ha</strong>
          </div>
          <div style="background:#fef2f2; border:1px solid #fee2e2; padding:4px 6px; border-radius:6px;">
            <span style="color:#991b1b; font-size:10px; display:block;">Kedalaman Bakar</span>
            <strong style="color:#7f1d1d; font-family:monospace;">${inc.burnedPeatDepthCm || 0} cm</strong>
          </div>
        </div>
        <div style="background:#fff7ed; border:1px solid #ffedd5; padding:6px; border-radius:6px; font-size:11px; color:#9a3412;">
          <div style="display:flex; justify-content:space-between; font-weight:600;">
            <span>Emisi Karbon:</span>
            <span style="font-family:monospace; font-weight:800;">${(inc.estimatedCo2Tons || 0).toLocaleString('id-ID')} ton CO₂</span>
          </div>
        </div>
        <div style="font-size:10px; color:#64748b; border-top:1px solid #f1f5f9; padding-top:4px;">
          <div>Tim Lapangan: <strong>${inc.assignedTeam || 'Sedang dikoordinasikan'}</strong></div>
          <div>Akses Air: <strong style="text-transform:capitalize;">${waterLabel}</strong></div>
        </div>
      `;

      marker.bindPopup(popup);
      group.addLayer(marker);
    });
  }, [fireIncidents, showFireIncidents]);

  // Render Water Infrastructure (Sekat Kanal & Embung)
  useEffect(() => {
    const group = waterSourcesLayerGroupRef.current;
    if (!group) return;

    group.clearLayers();
    if (!showWaterSources) return;

    waterSources.forEach((ws) => {
      const isDam = ws.type === 'sekat_kanal';
      const icon = L.divIcon({
        className: 'custom-water-marker',
        html: `
          <div style="
            background: #0284c7;
            color: #ffffff;
            width: 22px;
            height: 22px;
            border-radius: 9999px;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 6px rgba(2, 132, 199, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            cursor: pointer;
          ">
            💧
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = L.marker([ws.lat, ws.lng], { icon });

      const statusText = ws.waterLevelStatus ? ws.waterLevelStatus.replace(/_/g, ' ').toUpperCase() : 'NORMAL';
      const isLow = ws.waterLevelStatus === 'debit_rendah' || ws.waterLevelStatus === 'kering';

      const popup = document.createElement('div');
      popup.className = 'p-3 text-slate-800 max-w-[240px] space-y-2';
      popup.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f5f9; padding-bottom:5px;">
          <span style="font-weight:700; color:#0284c7; font-size:12px;">${ws.name}</span>
          <span style="font-size:10px; font-weight:700; text-transform:uppercase; color:#0369a1; background:#e0f2fe; padding:2px 6px; border-radius:4px;">
            ${isDam ? 'Sekat Kanal' : 'Embung'}
          </span>
        </div>
        <div style="font-size:11px; color:#475569; space-y-1;">
          <div>Status Muka Air: <strong style="color:${isLow ? '#d97706' : '#047857'}; font-weight:700;">${statusText}</strong></div>
          <div>Kapasitas Tampung: <strong>${(ws.capacityM3 || 0).toLocaleString('id-ID')} m³</strong></div>
          <div>Pengelola: <strong>${ws.managedBy || 'BRGM / Pokmas'}</strong></div>
          ${ws.lastInspectedAt ? `<div>Inspeksi Terakhir: <strong style="color:#0f172a;">${ws.lastInspectedAt}</strong></div>` : ''}
          ${ws.conditionNotes ? `<div style="color:#64748b; font-size:10px; font-style:italic; margin-top:2px;">"${ws.conditionNotes}"</div>` : ''}
          <div style="color:#64748b; font-size:10px; margin-top:2px;">Wilayah: ${ws.region}</div>
        </div>
      `;

      marker.bindPopup(popup);
      group.addLayer(marker);
    });
  }, [waterSources, showWaterSources]);

  const togglePanel = (panelName: string) => {
    setActivePanel(activePanel === panelName ? null : panelName);
  };

  return (
    <div className="relative w-full h-[calc(100vh-3.25rem)] overflow-hidden bg-slate-100">
      
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Modern Toolbar (Top-Right) */}
      <div className="absolute top-4 right-4 sm:right-6 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-1 shadow-sm">
        
        {/* Layer toggle button */}
        <button
          onClick={() => togglePanel('layers')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activePanel === 'layers'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Pengaturan Lapisan Peta"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Lapisan</span>
        </button>

        {/* Filter button */}
        <button
          onClick={() => togglePanel('filter')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activePanel === 'filter'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Filter Data Titik Survei"
        >
          <ListFilter className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden sm:inline">Filter</span>
        </button>

        {/* Statistics button */}
        <button
          onClick={() => togglePanel('stats')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activePanel === 'stats'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Ringkasan Data & Lapangan"
        >
          <BarChart3 className="w-3.5 h-3.5 text-sky-600" />
          <span className="hidden sm:inline">Ringkasan Data</span>
        </button>

        {/* Legend button */}
        <button
          onClick={() => togglePanel('legend')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activePanel === 'legend'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Legenda Simbologi"
        >
          <Compass className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Legenda</span>
        </button>
      </div>

      {/* Floating Bottom-Left Compact Legend */}
      <div className="hidden md:flex absolute bottom-6 left-6 z-10 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl px-4 py-2.5 text-xs items-center gap-4 text-slate-700 shadow-sm">
        <span className="font-bold text-slate-900 text-xs">Kedalaman Gambut:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border border-white shadow-2xs" style={{ backgroundColor: '#facc15' }} />
          <span className="text-[11px]">&lt;50 cm</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border border-white shadow-2xs" style={{ backgroundColor: '#fb923c' }} />
          <span className="text-[11px]">50-100</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border border-white shadow-2xs" style={{ backgroundColor: '#ea580c' }} />
          <span className="text-[11px]">100-200</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border border-white shadow-2xs" style={{ backgroundColor: '#991b1b' }} />
          <span className="text-[11px]">200-300</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border border-white shadow-2xs" style={{ backgroundColor: '#3f1303' }} />
          <span className="text-[11px] font-semibold">&gt;300 cm (Kubah)</span>
        </div>
      </div>

      {/* Floating Quick Basemap Switcher (Positioned cleanly above Leaflet zoom) */}
      <div className="absolute bottom-30 right-3.5 z-10 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-1 shadow-md flex flex-col gap-1">
        <button
          onClick={() => setActiveBasemap('topo')}
          className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-center transition ${
            activeBasemap === 'topo'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Peta Topografi & Kontur (Esri Topo)"
        >
          <MapIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => setActiveBasemap('osm_hot')}
          className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-center transition ${
            activeBasemap === 'osm_hot'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Peta Terang Tematik (OSM)"
        >
          <Sun className="w-4 h-4" />
        </button>
        <button
          onClick={() => setActiveBasemap('satellite')}
          className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-center transition ${
            activeBasemap === 'satellite'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Citra Satelit Ortofoto (Esri World Imagery)"
        >
          <Globe className="w-4 h-4" />
        </button>
      </div>

      {/* Slide-over Popover Panel */}
      {activePanel && (
        <div className="absolute top-16 right-4 sm:right-6 z-30 w-[calc(100vw-32px)] sm:w-88 max-h-[calc(100vh-6rem)] overflow-y-auto bg-white/98 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl p-5 text-xs text-slate-700 space-y-4 animate-fadeIn">
          
          {/* Panel Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-bold text-slate-900 text-sm">
              {activePanel === 'layers' && 'Lapisan Peta Tematik'}
              {activePanel === 'filter' && 'Filter Data Titik Survei'}
              {activePanel === 'stats' && 'Ringkasan Data & Lapangan'}
              {activePanel === 'legend' && 'Legenda Simbologi'}
            </span>
            <button
              onClick={() => setActivePanel(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              aria-label="Tutup Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Panel 1: Layers */}
          {activePanel === 'layers' && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Data Biofisik & Model Gambut
                </span>
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer py-0.5">
                    <span className="font-medium">Titik Survei Lapangan ({displayedPoints.length})</span>
                    <input
                      type="checkbox"
                      checked={showPoints}
                      onChange={(e) => setShowPoints(e.target.checked)}
                      className="accent-emerald-700 rounded w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer py-0.5">
                    <span className="font-medium">Permukaan Kedalaman IDW Kontinu</span>
                    <input
                      type="checkbox"
                      checked={showIdwSurface}
                      onChange={(e) => setShowIdwSurface(e.target.checked)}
                      className="accent-emerald-700 rounded w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer py-0.5">
                    <span className="font-medium">Batas Sebaran Gambut (BBSDLP)</span>
                    <input
                      type="checkbox"
                      checked={showPeatMask}
                      onChange={(e) => setShowPeatMask(e.target.checked)}
                      className="accent-emerald-700 rounded w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer py-0.5">
                    <span className="font-medium">Zona Kurang Data (&gt;18 km)</span>
                    <input
                      type="checkbox"
                      checked={showUncertainty}
                      onChange={(e) => setShowUncertainty(e.target.checked)}
                      className="accent-emerald-700 rounded w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Siaga & Tanggap Karhutla</span>
                </span>
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer py-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">🔥</span>
                      <span className="font-medium">Titik Panas Satelit ({hotspots.length})</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showHotspots}
                      onChange={(e) => setShowHotspots(e.target.checked)}
                      className="accent-rose-600 rounded w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer py-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">🚒</span>
                      <span className="font-medium">Insiden Karhutla ({fireIncidents.length})</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showFireIncidents}
                      onChange={(e) => setShowFireIncidents(e.target.checked)}
                      className="accent-rose-600 rounded w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer py-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">💧</span>
                      <span className="font-medium">Infrastruktur Air ({waterSources.length})</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showWaterSources}
                      onChange={(e) => setShowWaterSources(e.target.checked)}
                      className="accent-sky-600 rounded w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs text-slate-500 font-semibold block">Peta Dasar (Basemap):</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setActiveBasemap('topo')}
                    className={`py-2 rounded-lg text-center text-xs font-semibold border transition ${
                      activeBasemap === 'topo'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Topografi
                  </button>
                  <button
                    onClick={() => setActiveBasemap('osm_hot')}
                    className={`py-2 rounded-lg text-center text-xs font-semibold border transition ${
                      activeBasemap === 'osm_hot'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Tematik
                  </button>
                  <button
                    onClick={() => setActiveBasemap('satellite')}
                    className={`py-2 rounded-lg text-center text-xs font-semibold border transition ${
                      activeBasemap === 'satellite'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Satelit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Panel 2: Filter */}
          {activePanel === 'filter' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-600 font-semibold block mb-1.5">Rentang Kedalaman:</label>
                <select
                  value={depthFilter}
                  onChange={(e) => setDepthFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-xs font-medium focus:outline-none focus:border-emerald-600"
                >
                  <option value="all">Semua Kedalaman</option>
                  <option value="<50">&lt; 50 cm (Dangkal)</option>
                  <option value="50-100">50 - 100 cm (Sedang)</option>
                  <option value="100-200">100 - 200 cm (Dalam)</option>
                  <option value="200-300">200 - 300 cm (Sangat Dalam)</option>
                  <option value=">300">&gt; 300 cm (Sangat Tebal/Kubah)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 font-semibold block mb-1.5">Status Verifikasi:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-xs font-medium focus:outline-none focus:border-emerald-600"
                >
                  <option value="all">Semua Status</option>
                  <option value="verified">Terverifikasi Saja</option>
                  <option value="pending">Menunggu Verifikasi</option>
                  <option value="need_confirmation">Perlu Konfirmasi</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={baseReachedOnly}
                  onChange={(e) => setBaseReachedOnly(e.target.checked)}
                  className="accent-emerald-700 rounded w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-medium">Hanya titik dengan dasar tanah tercapai</span>
              </label>

              <button
                onClick={() => {
                  setDepthFilter('all');
                  setStatusFilter('all');
                  setBaseReachedOnly(false);
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
              >
                Reset Semua Filter
              </button>
            </div>
          )}

          {/* Panel 3: Stats */}
          {activePanel === 'stats' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2.5 text-slate-800">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Luas Gambut</span>
                  <span className="text-lg font-bold font-mono text-emerald-800 mt-0.5 block">
                    {idwResult.carbonStats.areaHa.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-slate-400">hektare terpetakan</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Rata-Rata Tebal</span>
                  <span className="text-lg font-bold font-mono text-amber-800 mt-0.5 block">
                    {idwResult.carbonStats.meanDepthMeter}
                  </span>
                  <span className="text-[10px] text-slate-400">meter kedalaman</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Titik Panas Satelit</span>
                  <span className="text-lg font-bold font-mono text-rose-800 mt-0.5 block">
                    {hotspots.length}
                  </span>
                  <span className="text-[10px] text-slate-400">pantauan aktif</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Infrastruktur Air</span>
                  <span className="text-lg font-bold font-mono text-sky-800 mt-0.5 block">
                    {waterSources.length}
                  </span>
                  <span className="text-[10px] text-slate-400">sekat &amp; embung</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="flex justify-between">
                  <span>Insiden Karhutla Dilaporkan:</span>
                  <strong className="text-rose-700 font-bold font-mono">{fireIncidents.length} lokasi</strong>
                </div>
                <div className="flex justify-between">
                  <span>Infrastruktur Air Siap Pompa:</span>
                  <strong className="text-emerald-700 font-bold font-mono">
                    {waterSources.filter(w => w.waterLevelStatus === 'normal_berair').length} dari {waterSources.length} unit
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Titik Bor Terverifikasi:</span>
                  <strong className="text-slate-900 font-mono">{idwResult.metrics.sampleCount} titik survei</strong>
                </div>
              </div>
            </div>
          )}

          {/* Panel 4: Legend */}
          {activePanel === 'legend' && (
            <div className="space-y-3 text-xs text-slate-700">
              <span className="text-xs font-bold text-slate-900 block">Klasifikasi Kedalaman Gambut (BBSDLP):</span>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-200 shadow-2xs" style={{ backgroundColor: '#facc15' }} />
                  <span className="font-medium">&lt; 50 cm — Gambut Dangkal</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-200 shadow-2xs" style={{ backgroundColor: '#fb923c' }} />
                  <span className="font-medium">50 - 100 cm — Gambut Sedang</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-200 shadow-2xs" style={{ backgroundColor: '#ea580c' }} />
                  <span className="font-medium">100 - 200 cm — Gambut Dalam</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-200 shadow-2xs" style={{ backgroundColor: '#991b1b' }} />
                  <span className="font-medium">200 - 300 cm — Gambut Sangat Dalam</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-200 shadow-2xs" style={{ backgroundColor: '#3f1303' }} />
                  <span className="font-medium">&gt; 300 cm — Gambut Sangat Tebal (Kubah)</span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border border-emerald-700 bg-white" />
                  <span>Lingkar Hijau: Terverifikasi</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 border border-dashed border-emerald-700 bg-emerald-50/50" />
                  <span>Garis Putus Hijau: Deliniasi Kubah BBSDLP</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 border border-dashed border-rose-600 bg-rose-50" />
                  <span>Arsir Merah: Zona Kurang Data (&gt;18 km)</span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-900 block">Simbologi Karhutla & Hidrologi:</span>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center font-bold">🔥</span>
                    <span>Titik Panas Satelit (VIIRS / MODIS)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-bold">🚨 Api Aktif</span>
                    <span>Insiden Terkonfirmasi Api Gambut</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-600 text-white text-[9px] font-bold">🚒 Pemadaman</span>
                    <span>Operasi Pemadaman (Manggala Agni / MPA)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-sky-600 text-white text-[9px] flex items-center justify-center font-bold">💧</span>
                    <span>Sekat Kanal & Embung Air Gambut</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
