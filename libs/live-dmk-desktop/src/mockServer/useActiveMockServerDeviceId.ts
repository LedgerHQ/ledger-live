import { useEffect, useState } from "react";
import { mockserverIdentifier } from "@ledgerhq/device-transport-kit-mockserver";
import { activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import { getDeviceManagementKit } from "../hooks/useDeviceManagementKit";

/**
 * Mock server id of the device behind the active session, or null when none is
 * connected or the active one is a physical device, whose screen is the one on
 * the desk.
 */
export function useActiveMockServerDeviceId(): string | null {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const subscription = activeDeviceSessionSubject.subscribe(session => {
      if (!session) {
        setDeviceId(null);
        return;
      }
      try {
        const connected = getDeviceManagementKit().getConnectedDevice({
          sessionId: session.sessionId,
        });
        setDeviceId(connected.transport === mockserverIdentifier ? connected.id : null);
      } catch {
        // The session can be torn down between the emission and this lookup.
        setDeviceId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return deviceId;
}
