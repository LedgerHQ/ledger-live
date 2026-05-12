import {
  DeviceManagementKit,
  type DeviceSessionState,
  DeviceStatus,
} from "@ledgerhq/device-management-kit";
import { useState, useEffect } from "react";
import { activeDeviceSessionRegistry } from "../config/activeDeviceSession";

export const useDeviceSessionState = (
  dmk: DeviceManagementKit | null,
): DeviceSessionState | undefined => {
  const [sessionState, setSessionState] = useState<DeviceSessionState | undefined>(undefined);

  useEffect(() => {
    if (!dmk) return;
    let stateSubscription: { unsubscribe: () => void } | null = null;
    const subscription = activeDeviceSessionRegistry.subscribe(sessions => {
      stateSubscription?.unsubscribe();
      stateSubscription = null;

      const session = sessions.find(session => session.dmk === dmk) ?? sessions[0];

      if (!session) {
        setSessionState(undefined);
        return;
      }

      stateSubscription = session.dmk.getDeviceSessionState({ sessionId: session.sessionId }).subscribe({
        next: (state: DeviceSessionState) => {
          if (state.deviceStatus !== DeviceStatus.NOT_CONNECTED) {
            setSessionState(state);
          } else {
          setSessionState(undefined);
          }
        },
        error: (error: Error) => console.error("[useDeviceSessionState] error", error),
      });
    });

    return () => {
      stateSubscription?.unsubscribe();
      subscription.unsubscribe();
    };
  }, [dmk]);

  return sessionState;
};
