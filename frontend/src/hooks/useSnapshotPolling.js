import { useCallback, useEffect, useState } from 'react';
import { getSnapshot } from '../services/api';

const POLL_INTERVAL_MS = 5000;

export function useSnapshotPolling() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(async (signal) => {
    try {
      const data = await getSnapshot(signal);
      setSnapshot(data);
      setLastUpdated(new Date(data.updatedAt || Date.now()));
      setError(null);
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        console.error('[useSnapshotPolling] Fetch error:', requestError);
        setError('Unable to connect to the server. Retrying...');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    const interval = window.setInterval(() => refresh(), POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [refresh]);

  return { snapshot, loading, error, lastUpdated, refresh };
}
