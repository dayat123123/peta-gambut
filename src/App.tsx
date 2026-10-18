import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, PeatPoint, VerificationStatus, IDWParameters, AuthUser } from './types';
import { getStoredPoints, updatePointStatus } from './services/storage';
import { DEFAULT_IDW_PARAMS } from './services/idw';
import { getStoredAuthUser, logoutUser, canInputData, canVerifyData, canAccessAdmin } from './services/auth';
import { Navbar } from './components/Navbar';
import { InteractiveMap } from './components/InteractiveMap';
import { PointInputForm } from './components/PointInputForm';
import { VerificationQueue } from './components/VerificationQueue';
import { ExportModal } from './components/ExportModal';
import { AdminPanel } from './components/AdminPanel';
import { PointDetailModal } from './components/PointDetailModal';
import { LoginModal } from './components/LoginModal';
import { KarhutlaView } from './components/KarhutlaView';
import { FireIncidentModal } from './components/FireIncidentModal';
import { getKarhutlaStats } from './services/fireService';
import { FireIncidentReport } from './types';
import { ShieldAlert, LogIn, ArrowLeft } from 'lucide-react';

const getInitialTab = (): string => {
  try {
    const hash = window.location.hash.replace('#', '');
    if (['map', 'karhutla', 'input', 'verify', 'export', 'admin'].includes(hash)) {
      return hash;
    }
  } catch (e) {}
  return 'map';
};

export const App: React.FC = () => {
  // App Navigation & Selected Region
  const [currentTab, setCurrentTab] = useState<string>(getInitialTab);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  // Synchronize hash with current tab
  useEffect(() => {
    window.location.hash = currentTab;
  }, [currentTab]);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['map', 'karhutla', 'input', 'verify', 'export', 'admin'].includes(hash)) {
        setCurrentTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getStoredAuthUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginTargetFeature, setLoginTargetFeature] = useState<string | null>(null);

  // Karhutla & Fire Incident State
  const [isFireModalOpen, setIsFireModalOpen] = useState<boolean>(false);
  const [mapFocusCoord, setMapFocusCoord] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [fireUpdateTrigger, setFireUpdateTrigger] = useState<number>(0);

  // Core Points Database State
  const [points, setPoints] = useState<PeatPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<PeatPoint | null>(null);

  // Model IDW Parameters State
  const [idwParams, setIdwParams] = useState<IDWParameters>(DEFAULT_IDW_PARAMS);

  // Toast / System Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load points on mount
  useEffect(() => {
    const loaded = getStoredPoints();
    setPoints(loaded);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auth Handlers
  const handleOpenLogin = (feature?: string) => {
    setLoginTargetFeature(feature || null);
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    showToast(`Berhasil masuk sebagai ${user.name} (${user.role.toUpperCase()})`);
    
    // If user was trying to access a specific feature, navigate there
    if (loginTargetFeature === 'Input Data' && canInputData(user)) {
      setCurrentTab('input');
    } else if (loginTargetFeature === 'Verifikasi' && canVerifyData(user)) {
      setCurrentTab('verify');
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    showToast('Anda telah keluar. Beralih ke mode Pengunjung Publik.');
    // If currently on a protected tab, redirect to map
    if (currentTab === 'input' || currentTab === 'verify' || currentTab === 'admin') {
      setCurrentTab('map');
    }
  };

  // Status update from Verification Queue or Detail Modal
  const handleUpdateStatus = (
    pointId: string,
    newStatus: VerificationStatus,
    options?: { rejectionReason?: string; verifierNotes?: string }
  ) => {
    const updated = updatePointStatus(pointId, newStatus, {
      ...options,
      verifierName: currentUser?.name || 'Verifikator Ahli'
    });
    setPoints(updated);

    if (newStatus === 'verified') {
      showToast(`Titik ${pointId} disetujui & dimasukkan ke dalam model spasial IDW!`);
    } else if (newStatus === 'rejected') {
      showToast(`Titik ${pointId} telah ditolak dengan alasan tercatat.`);
    } else if (newStatus === 'need_confirmation') {
      showToast(`Permintaan klarifikasi untuk titik ${pointId} telah dikirimkan.`);
    }
  };

  // When a new point is submitted by Contributor
  const handlePointAdded = (newPoint: PeatPoint) => {
    setPoints(getStoredPoints());
    showToast(`Titik ${newPoint.id} berhasil dikirim ke antrean verifikasi.`);
  };


  const pendingReviewCount = useMemo(() => {
    return points.filter((p) => p.status === 'pending').length;
  }, [points]);

  // Karhutla Overview Statistics for Navbar and Alerts
  const karhutlaStats = useMemo(() => {
    return getKarhutlaStats();
  }, [fireUpdateTrigger, currentTab]);

  const handleFireIncidentAdded = (incident: FireIncidentReport) => {
    setFireUpdateTrigger((prev) => prev + 1);
    setIsFireModalOpen(false);
    showToast(`Laporan Karhutla ${incident.id} berhasil dikirim (${incident.status.replace(/_/g, ' ')})`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Top Navigation - Sleek, compact, no offline toggle, login integration */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onOpenLogin={handleOpenLogin}
        onLogout={handleLogout}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        pendingReviewCount={pendingReviewCount}
        activeHotspotCount={karhutlaStats.activeHotspotCount}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-slate-700 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative">
        <div className={`flex-1 flex flex-col ${currentTab === 'map' ? 'flex' : 'hidden'}`}>
          <InteractiveMap
            points={points}
            selectedRegion={selectedRegion}
            onSelectPoint={(pt) => setSelectedPoint(pt)}
            idwParams={idwParams}
            onUpdateIdwParams={(p) => setIdwParams(p)}
            focusCoord={mapFocusCoord}
            onClearFocusCoord={() => setMapFocusCoord(null)}
            isVisible={currentTab === 'map'}
          />
        </div>

        {/* Karhutla & Satellite Hotspot Center */}
        {currentTab === 'karhutla' && (
          <KarhutlaView
            currentUser={currentUser}
            onOpenReportModal={() => setIsFireModalOpen(true)}
            onViewOnMap={(lat, lng) => {
              setMapFocusCoord({ lat, lng, zoom: 14 });
              setCurrentTab('map');
            }}
          />
        )}

        {/* Input Data Tab with Role Protection */}
        {currentTab === 'input' && (
          canInputData(currentUser) ? (
            <PointInputForm
              isOffline={false}
              currentUser={currentUser}
              onPointAdded={handlePointAdded}
              onViewMapWithCoords={() => setCurrentTab('map')}
            />
          ) : (
            <div className="max-w-xl mx-auto my-auto px-6 py-16 text-center space-y-4">
              <div className="w-14 h-14 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Akses Khusus Kontributor Lapangan
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                Fitur pencatatan dan unggah data titik bor gambut hanya dapat diakses oleh kontributor terdaftar atau administrator sistem.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => handleOpenLogin('Input Data')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk sebagai Kontributor</span>
                </button>
                <button
                  onClick={() => setCurrentTab('map')}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Peta</span>
                </button>
              </div>
            </div>
          )
        )}

        {/* Verification Queue with Role Protection */}
        {currentTab === 'verify' && (
          canVerifyData(currentUser) ? (
            <VerificationQueue
              points={points}
              currentUser={currentUser}
              onUpdateStatus={handleUpdateStatus}
              selectedRegion={selectedRegion}
            />
          ) : (
            <div className="max-w-xl mx-auto my-auto px-6 py-16 text-center space-y-4">
              <div className="w-14 h-14 bg-sky-50 border border-sky-200 text-sky-700 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Akses Wewenang Verifikator Ahli
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                Halaman ini diperuntukkan bagi tim verifikator ahli untuk memeriksa foto profil tanah, mendeteksi anomali, dan memvalidasi titik bor ke dalam model spasial nasional.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => handleOpenLogin('Verifikasi')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk sebagai Verifikator</span>
                </button>
                <button
                  onClick={() => setCurrentTab('map')}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Peta</span>
                </button>
              </div>
            </div>
          )
        )}

        {currentTab === 'export' && (
          <ExportModal
            points={points}
            selectedRegion={selectedRegion}
            idwParams={idwParams}
          />
        )}

        {currentTab === 'admin' && (
          canAccessAdmin(currentUser) ? (
            <AdminPanel
              points={points}
              onPointsReset={(updated) => setPoints(updated)}
              idwParams={idwParams}
              onUpdateIdwParams={(p) => setIdwParams(p)}
            />
          ) : (
            <div className="max-w-xl mx-auto my-auto px-6 py-16 text-center space-y-4">
              <div className="w-14 h-14 bg-purple-50 border border-purple-200 text-purple-700 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Akses Khusus Administrator
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                Konfigurasi parameter interpolasi IDW dan manajemen basis data hanya dapat diakses oleh Administrator Sistem.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => handleOpenLogin('Pengaturan')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk sebagai Admin</span>
                </button>
                <button
                  onClick={() => setCurrentTab('map')}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Peta</span>
                </button>
              </div>
            </div>
          )
        )}
      </main>

      {/* Point Detail Modal */}
      <PointDetailModal
        point={selectedPoint}
        onClose={() => setSelectedPoint(null)}
        canVerify={canVerifyData(currentUser)}
        onOpenVerify={() => {
          setSelectedPoint(null);
          setCurrentTab('verify');
        }}
      />

      {/* Authentication / Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        targetFeature={loginTargetFeature}
      />

      {/* Fire Incident Reporting Modal */}
      <FireIncidentModal
        isOpen={isFireModalOpen}
        onClose={() => setIsFireModalOpen(false)}
        currentUser={currentUser}
        onIncidentAdded={handleFireIncidentAdded}
      />
    </div>
  );
};

export default App;
