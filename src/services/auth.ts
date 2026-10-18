import { AuthUser, UserRole } from '../types';

const AUTH_STORAGE_KEY = 'peatdepth_authenticated_user_v1';

export interface DemoAccount {
  user: AuthUser;
  passwordHint: string;
  description: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    user: {
      id: 'USR-PUBLIK-01',
      name: 'Pengunjung Publik',
      email: 'publik@gambut.id',
      role: 'pengunjung',
      institution: 'Masyarakat Umum / Publik',
      badge: 'Pengunjung'
    },
    passwordHint: 'tamu123',
    description: 'Akses bebas melihat peta gambut, pantau karhutla, dan lapor cepat insiden tanpa kewajiban login.'
  },
  {
    user: {
      id: 'USR-KONTRIB-01',
      name: 'Bambang Trianto',
      email: 'surveyor@gambut.id',
      role: 'kontributor',
      institution: 'Masyarakat Peduli Gambut (MPG) Siak',
      badge: 'Surveyor Bersertifikat'
    },
    passwordHint: 'surveyor123',
    description: 'Dapat mencatat & mengunggah titik bor gambut baru beserta foto profil tanah.'
  },
  {
    user: {
      id: 'USR-VERIF-01',
      name: 'Dr. Ilham Ramadhani',
      email: 'verifikator@gambut.id',
      role: 'verifikator',
      institution: 'Pusat Studi Gambut & BRGM Riau',
      badge: 'Verifikator Ahli'
    },
    passwordHint: 'verif123',
    description: 'Wewenang menyetujui, menolak, atau meminta klarifikasi data survei lapangan.'
  },
  {
    user: {
      id: 'USR-ADMIN-01',
      name: 'Dr. Hendra Kusuma',
      email: 'admin@gambut.id',
      role: 'admin',
      institution: 'Badan Informasi Geospasial & Tim Koordinasi Nasional',
      badge: 'Administrator Sistem'
    },
    passwordHint: 'admin123',
    description: 'Akses penuh seluruh modul, manajemen data titik air, insiden, dan pengguna.'
  }
];

export function getStoredAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading auth user:', e);
    return null;
  }
}

export function saveAuthUser(user: AuthUser | null): void {
  try {
    if (!user) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } else {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    }
  } catch (e) {
    console.error('Error saving auth user:', e);
  }
}

export function loginWithCredentials(
  email: string,
  password: string
): { success: boolean; user?: AuthUser; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const account = DEMO_ACCOUNTS.find(a => a.user.email.toLowerCase() === cleanEmail);

  if (!account) {
    return {
      success: false,
      error: 'Akun tidak terdaftar. Gunakan salah satu akun demo yang disediakan.'
    };
  }

  // Allow either exact password or lenient simple password
  const validPasswords = [account.passwordHint, account.user.role, '123456'];
  if (!validPasswords.includes(password.trim())) {
    return {
      success: false,
      error: `Kata sandi tidak sesuai. Petunjuk kata sandi: "${account.passwordHint}"`
    };
  }

  saveAuthUser(account.user);
  return { success: true, user: account.user };
}

export function loginAsDemo(role: UserRole): AuthUser {
  const account = DEMO_ACCOUNTS.find(a => a.user.role === role) || DEMO_ACCOUNTS[0];
  saveAuthUser(account.user);
  return account.user;
}

export function logoutUser(): void {
  saveAuthUser(null);
}

// Permission checking helpers
export function canInputData(user: AuthUser | null): boolean {
  if (!user) return false;
  return user.role === 'kontributor' || user.role === 'admin';
}

export function canVerifyData(user: AuthUser | null): boolean {
  if (!user) return false;
  return user.role === 'verifikator' || user.role === 'admin';
}

export function canAccessAdmin(user: AuthUser | null): boolean {
  if (!user) return false;
  return user.role === 'admin';
}

