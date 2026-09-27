import { useState, useEffect, useCallback } from "react";
import { offlineSyncManager } from "../lib/offlineSync";

export function useOfflineSync(onSyncComplete?: (count: number) => void) {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(() =>
    offlineSyncManager.getPendingCount()
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const syncQueue = useCallback(async () => {
    if (!navigator.onLine) return;
    const count = offlineSyncManager.getPendingCount();
    if (count === 0) return;

    setIsSyncing(true);
    try {
      const { syncedCount } = await offlineSyncManager.flushQueue();
      setPendingCount(offlineSyncManager.getPendingCount());
      if (syncedCount > 0 && onSyncComplete) {
        onSyncComplete(syncedCount);
      }
    } catch (e) {
      console.warn("[useOfflineSync] Error flushing queue:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [onSyncComplete]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Silently flush offline queue as soon as connection is restored!
      syncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setPendingCount(offlineSyncManager.getPendingCount());
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check on mount
    if (navigator.onLine && offlineSyncManager.getPendingCount() > 0) {
      syncQueue();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncQueue]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    syncQueue,
  };
}
