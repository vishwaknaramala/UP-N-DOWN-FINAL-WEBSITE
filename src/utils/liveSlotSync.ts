import { getStoredConfig, saveConfig } from './developerStorage';
import { getDirectSupabaseCount } from './supabaseDirectClient';

let syncInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Synchronizes the global slot allocation count from the live database.
 * Tries the backend /api/db-status first, then directly queries Supabase.
 * Updates config.claimedSlots and notifies all UI components on any phone/device.
 */
export async function syncLiveSlotCount(): Promise<number> {
  let count: number | null = null;

  // 1. Try /api/db-status
  try {
    const res = await fetch('/api/db-status');
    if (res.ok) {
      const data = await res.json();
      if (typeof data.totalRegistrations === 'number') {
        count = data.totalRegistrations;
      }
    }
  } catch {
    // Non-fatal fallback
  }

  // 2. Fallback: query Supabase directly using anon key
  if (count === null) {
    try {
      count = await getDirectSupabaseCount();
    } catch {
      // Non-fatal fallback
    }
  }

  // 3. Update configuration if valid count returned
  if (count !== null && typeof count === 'number') {
    const current = getStoredConfig();
    if (current.claimedSlots !== count) {
      saveConfig({ claimedSlots: count });
    }
    return count;
  }

  return getStoredConfig().claimedSlots;
}

/**
 * Starts periodic polling so that all open devices update their remaining slot count live.
 */
export function startLiveSlotSyncPolling(intervalMs = 15000): () => void {
  // Initial sync immediately
  syncLiveSlotCount().catch(() => {});

  if (syncInterval) {
    clearInterval(syncInterval);
  }

  syncInterval = setInterval(() => {
    syncLiveSlotCount().catch(() => {});
  }, intervalMs);

  return () => {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  };
}
