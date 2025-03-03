import { useRef, useEffect } from "react";
import { Subscription } from "rxjs";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { activeDeviceSessionSubject } from "../config/activeDeviceSession";

/**
 * Hook to disable the device session refresher when the device is connected.
 * @param {DeviceManagementKit} dmk Instance of DeviceManagementKit
 * @param {boolean} ffEnabled Whether the feature flag is enabled
 * @returns a function to reenable the device session refresher or undefined when:
 *   - the feature flag is disabled
 *   - there are no active device sessions
 */
export const useDisableDeviceSessionRefresher = (dmk: DeviceManagementKit, ffEnabled: boolean) => {
  const sessionId = useRef<string>();
  const sub = useRef<Subscription>();
  const enableRefresher = useRef<() => void>();

  useEffect(() => {
    if (!ffEnabled) return;
    sub.current = activeDeviceSessionSubject.subscribe({
      next: session => {
        console.log("[useDisableDeviceSessionRefresher] session", session);
        if (session) {
          if (sessionId.current !== session.sessionId) {
            sessionId.current = session.sessionId;
            console.log(
              "[useDisableDeviceSessionRefresher] disabling device session refresher on ",
              sessionId.current,
            );

            enableRefresher.current = dmk.disableDeviceSessionRefresher({
              sessionId: sessionId.current,
              blockerId: "[hook] useDisableDeviceSessionRefresher",
            });
          }
        }
      },
    });

    return () => {
      if (!ffEnabled) return;
      sub.current?.unsubscribe();
    };
  }, [dmk]);

  return enableRefresher.current;
};
