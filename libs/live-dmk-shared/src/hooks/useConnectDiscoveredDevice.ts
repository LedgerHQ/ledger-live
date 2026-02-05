import { useCallback, useEffect, useState } from "react";
import { DeviceManagementKit, DiscoveredDevice } from "@ledgerhq/device-management-kit";

export type Params =
  | {
      dmk: DeviceManagementKit;
      discoveredDevice: DiscoveredDevice;
      enabled: boolean;
    }
  | {
      enabled: false;
    };

export type Output = {
  sessionId: string | null;
  error: unknown | null;
  retry: () => void;
};

export function useConnectDiscoveredDevice(params: Params): Output {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!params.enabled) return;

    let cancelled = false;
    setError(null);
    setSessionId(null);

    params.dmk
      .connect({
        device: params.discoveredDevice,
        sessionRefresherOptions: { isRefresherDisabled: true },
      })
      .then(id => {
        if (!cancelled) {
          setSessionId(id);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [params.enabled, nonce, params.discoveredDevice, params.dmk]);

  const retry = useCallback(() => {
    setSessionId(null);
    setError(null);
    setNonce(n => n + 1);
  }, []);

  return {
    sessionId,
    error,
    retry,
  };
}
