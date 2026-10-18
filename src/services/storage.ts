import { PeatPoint, VerificationStatus } from '../types';
import { generateSeedPoints } from '../data/samplePoints';

const STORAGE_KEY = 'peatdepth_points_v1';
const OFFLINE_QUEUE_KEY = 'peatdepth_offline_queue_v1';
const CURRENT_USER_KEY = 'peatdepth_current_user_v1';

export function getStoredPoints(): PeatPoint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = generateSeedPoints();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading points from localStorage:', e);
    return generateSeedPoints();
  }
}

export function savePoints(points: PeatPoint[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
  } catch (e) {
    console.error('Error saving points to localStorage:', e);
  }
}

export function addPoint(point: PeatPoint, isOffline: boolean = false): { success: boolean; queued: boolean } {
  if (isOffline) {
    const queue = getOfflineQueue();
    queue.push(point);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    return { success: true, queued: true };
  }

  const existing = getStoredPoints();
  existing.unshift(point);
  savePoints(existing);
  return { success: true, queued: false };
}

export function getOfflineQueue(): PeatPoint[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function syncOfflineQueue(): { syncedCount: number } {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { syncedCount: 0 };

  const existing = getStoredPoints();
  const updated = [...queue, ...existing];
  savePoints(updated);
  localStorage.removeItem(OFFLINE_QUEUE_KEY);

  return { syncedCount: queue.length };
}

export function updatePointStatus(
  pointId: string,
  newStatus: VerificationStatus,
  options?: {
    rejectionReason?: string;
    verifierNotes?: string;
    verifierName?: string;
  }
): PeatPoint[] {
  const points = getStoredPoints();
  const updated = points.map(p => {
    if (p.id === pointId) {
      return {
        ...p,
        status: newStatus,
        rejectionReason: options?.rejectionReason ?? p.rejectionReason,
        verifierNotes: options?.verifierNotes ?? p.verifierNotes,
        verifiedAt: newStatus === 'verified' ? new Date().toISOString().replace('T', ' ').substring(0, 16) : p.verifiedAt,
        verifiedBy: options?.verifierName || (newStatus === 'verified' ? 'Tim Verifikator Lapangan' : p.verifiedBy)
      };
    }
    return p;
  });

  savePoints(updated);
  return updated;
}

export function resetToSeedData(): PeatPoint[] {
  const seed = generateSeedPoints();
  savePoints(seed);
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
  return seed;
}

