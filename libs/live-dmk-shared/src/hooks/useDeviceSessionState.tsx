import {
  DeviceManagementKit,
  type DeviceSessionState,
  DeviceStatus,
} from "@ledgerhq/device-management-kit";
import { useState, useEffect } from "react";
import { activeDeviceSessionSubject } from "../config/activeDeviceSession";

export const useDeviceSessionState = (
  dmk: DeviceManagementKit | null,
): DeviceSessionState | undefined => {
  const [sessionState, setSessionState] = useState<DeviceSessionState | undefined>(undefined);

  useEffect(() => {
    if (!dmk) return;
    const subscription = activeDeviceSessionSubject.subscribe({
      next: session => {
        if (!session) {
          setSessionState(undefined);
        } else {
          const { sessionId } = session;
          const stateSubscription = dmk.getDeviceSessionState({ sessionId }).subscribe({
            next: (state: DeviceSessionState) => {
              state.deviceStatus !== DeviceStatus.NOT_CONNECTED
                ? setSessionState(state)
                : setSessionState(undefined);
            },
            error: (error: Error) => console.error("[useDeviceSessionState] error", error),
          });
          return () => stateSubscription.unsubscribe();
        }
      },
      error: error => console.error("[useDeviceSessionState] subscription error", error),
    });

    return () => subscription.unsubscribe();
  }, [dmk]);

  return sessionState;
};
