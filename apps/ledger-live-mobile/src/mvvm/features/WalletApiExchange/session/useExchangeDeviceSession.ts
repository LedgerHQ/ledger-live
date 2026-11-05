import { useEffect, useSyncExternalStore } from "react";
import { exchangeDeviceSession, type ExchangeDeviceSession } from "./exchangeDeviceSession";
import type { ExchangeSession } from "./types";

/** The open exchange device session, or null while none is. */
export function useExchangeDeviceSession(
  store: ExchangeDeviceSession = exchangeDeviceSession,
): ExchangeSession | null {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

/**
 * The open exchange device session of `manifestId`, or null. Closes the session when the
 * webview of `manifestId` unmounts so the exchange is not left waiting on a drawer that is gone.
 */
export function useManifestExchangeDeviceSession(
  manifestId: string,
  store: ExchangeDeviceSession = exchangeDeviceSession,
): ExchangeSession | null {
  const session = useExchangeDeviceSession(store);

  useEffect(() => () => store.closeForManifest(manifestId), [manifestId, store]);

  return session?.manifest.id === manifestId ? session : null;
}
