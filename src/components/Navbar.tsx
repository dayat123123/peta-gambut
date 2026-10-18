import React, { useState, useRef, useEffect } from 'react';
import { AuthUser, UserRole } from '../types';
import { 
  Map, 
  PlusCircle, 
  CheckSquare, 
  BookOpen, 
  Download, 
  Settings, 
  Menu, 
  X,
  Layers,
  MapPin,
  LogIn,
  LogOut,
  User,
  Shield,
  ChevronDown,
  Lock,
  Flame
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: AuthUser | null;
  onOpenLogin: (feature?: string) => void;
  onLogout: () => void;
  selectedRegion: string;
  setSelectedRegion: (region: string) => void;
  pendingReviewCount: number;
  activeHotspotCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onOpenLogin,
  onLogout,
  selectedRegion,
  setSelectedRegion,
  pendingReviewCount,
  activeHotspotCount
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isContributorOrAdmin = currentUser?.role === 'kontributor' || currentUser?.role === 'admin';
  const isVerifierOrAdmin = currentUser?.role === 'verifikator' || currentUser?.role === 'admin';
  const isAdmin = currentUser?.role === 'admin';

  const navItems = [
    { id: 'map', label: 'Peta', icon: Map, badge: null, badgeColor: '', locked: false },
    { 
      id: 'karhutla', 
      label: 'Karhutla', 
      icon: Flame, 
      badge: activeHotspotCount && activeHotspotCount > 0 ? String(activeHotspotCount) : null,
      badgeColor: 'bg-rose-50 text-rose-700 border border-rose-200 font-bold',
      locked: false 
    },
    { 
      id: 'input', 
      label: 'Input Data', 
      icon: PlusCircle, 
      badge: null,
      badgeColor: '',
      locked: !isContributorOrAdmin
    },
    { 
      id: 'verify', 
      label: 'Verifikasi', 
      icon: CheckSquare, 
      badge: pendingReviewCount > 0 ? String(pendingReviewCount) : null,
      badgeColor: 'bg-rose-50 text-rose-700 border border-rose-200 font-bold',
      locked: !isVerifierOrAdmin
    },
    { id: 'export', label: 'Unduh', icon: Download, badge: null, badgeColor: '', locked: false },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin', icon: Settings, badge: null, badgeColor: '', locked: false });
  }

  const handleNavClick = (tabId: string, isLocked: boolean, label: string) => {
    if (isLocked) {
      onOpenLogin(label);
      return;
    }
    setCurrentTab(tabId);
    setMobileMenuOpen(false);
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'verifikator':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'kontributor':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-2xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-13 gap-3">
          
          {/* Brand Identity - Sleek, compact */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
            onClick={() => setCurrentTab('map')}
          >
            <div className="w-7.5 h-7.5 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-2xs shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-bold text-sm tracking-tight text-slate-900">
                Peta Gambut
              </span>
              <span className="px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/90 rounded">
                Indonesia
              </span>
            </div>
          </div>

          {/* Center Navigation Tabs (Clean segmented control pill) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/80 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id, item.locked, item.label)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                  title={item.locked ? `Perlu login untuk mengakses ${item.label}` : item.label}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.locked && (
                    <Lock className="w-3 h-3 text-slate-400 ml-0.5 shrink-0" />
                  )}
                  {item.badge && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono leading-none shrink-0 ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools: Region & User Authentication */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Region Dropdown Filter */}
            <div className="hidden md:flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 gap-1.5 hover:bg-white transition">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-transparent text-slate-700 text-xs font-medium focus:outline-none cursor-pointer pr-1"
                aria-label="Pilih Wilayah"
              >
                <option value="all">Semua Wilayah</option>
                <option value="riau">Pilot Riau (Siak & Kampar)</option>
                <option value="kalteng">Pilot Kalteng (Pulang Pisau)</option>
              </select>
            </div>

            {/* Authentication: Login Button OR User Profile Menu */}
            {!currentUser ? (
              <button
                onClick={() => onOpenLogin()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </button>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 shadow-2xs transition"
                >
                  <div className="w-6 h-6 rounded-md bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <span className="block text-xs font-bold text-slate-800 leading-tight">
                      {currentUser.name.split(' ')[0]}
                    </span>
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(currentUser.role)}`}>
                    {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'verifikator' ? 'Verifikator' : 'Kontributor'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Profile Dropdown Card */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 text-xs space-y-3 animate-fadeIn">
                    <div className="border-b border-slate-100 pb-2.5">
                      <span className="font-bold text-slate-900 text-sm block">
                        {currentUser.name}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {currentUser.email}
                      </span>
                      {currentUser.institution && (
                        <span className="text-[10px] text-slate-400 block mt-1 line-clamp-1">
                          {currentUser.institution}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-slate-600">
                      <div className="flex items-center justify-between py-1">
                        <span>Wewenang:</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(currentUser.role)}`}>
                          {currentUser.role.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 text-rose-700 hover:text-rose-800 hover:bg-rose-50 rounded-lg text-xs font-semibold transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar (Logout)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
              aria-label="Buka Menu Navigasi"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-3 space-y-2.5 shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id, item.locked, item.label)}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold text-left transition ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.locked && <Lock className="w-3 h-3 text-slate-400" />}
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Wilayah:</span>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200 px-2.5 py-1 focus:outline-none"
              >
                <option value="all">Semua Wilayah</option>
                <option value="riau">Pilot Riau (Siak & Kampar)</option>
                <option value="kalteng">Pilot Kalteng (Pulang Pisau)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
