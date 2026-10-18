import React, { useState } from 'react';
import { AuthUser, UserRole } from '../types';
import { DEMO_ACCOUNTS, loginWithCredentials, loginAsDemo } from '../services/auth';
import { 
  X, 
  Lock, 
  Mail, 
  KeyRound, 
  ShieldCheck, 
  UserCheck, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  targetFeature?: string | null; // e.g. "Input Data" or "Verifikasi"
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  targetFeature
}) => {
  const [email, setEmail] = useState<string>('surveyor@gambut.id');
  const [password, setPassword] = useState<string>('surveyor123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = loginWithCredentials(email, password);
    if (res.success && res.user) {
      onLoginSuccess(res.user);
      onClose();
    } else {
      setErrorMsg(res.error || 'Gagal masuk. Periksa email dan kata sandi.');
    }
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    const user = loginAsDemo(role);
    onLoginSuccess(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-2xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Autentikasi Akses Sistem
              </h3>
              <p className="text-[11px] text-slate-500">
                Pilih peran tugas untuk mengelola data gambut
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Target Feature Notice */}
          {targetFeature && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Akses Terbatas:</strong> Anda perlu masuk dengan peran yang sesuai untuk membuka fitur <em>{targetFeature}</em>.
              </div>
            </div>
          )}

          {/* Quick Demo Switcher */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
              Pilih Akses Cepat (Akun Demo Resmi):
            </label>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((account) => {
                const role = account.user.role;
                let roleColor = 'border-slate-200 hover:border-slate-400 hover:bg-slate-50';
                let badgeBg = 'bg-slate-100 text-slate-800';
                let Icon = UserCheck;

                if (role === 'pengunjung') {
                  roleColor = 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/20';
                  badgeBg = 'bg-slate-100 text-slate-700';
                  Icon = UserCheck;
                } else if (role === 'kontributor') {
                  roleColor = 'border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50/30';
                  badgeBg = 'bg-emerald-100 text-emerald-800';
                  Icon = PlusCircle;
                } else if (role === 'verifikator') {
                  roleColor = 'border-sky-200 hover:border-sky-500 hover:bg-sky-50/30';
                  badgeBg = 'bg-sky-100 text-sky-800';
                  Icon = UserCheck;
                } else if (role === 'admin') {
                  roleColor = 'border-purple-200 hover:border-purple-500 hover:bg-purple-50/30';
                  badgeBg = 'bg-purple-100 text-purple-800';
                  Icon = ShieldCheck;
                }

                return (
                  <button
                    key={account.user.id}
                    type="button"
                    onClick={() => handleQuickDemoLogin(role)}
                    className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between group ${roleColor} bg-white shadow-2xs`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7.5 h-7.5 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            {account.user.name}
                          </span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${badgeBg}`}>
                            {account.user.role.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {account.description}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              atau gunakan kredensial
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Manual Form */}
          <form onSubmit={handleManualLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  placeholder="nama@gambut.id"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition"
            >
              Masuk ke Akun
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('pengunjung')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              Lanjutkan sebagai Pengunjung Publik
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

