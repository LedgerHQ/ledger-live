import { useRef, useEffect } from "react";
import { Subscription } from "rxjs";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { activeDeviceSessionSubject } from "../config/activeDeviceSession";

/**
 * Hook to disable the device session refresher when the device is connected.
 * @param {DeviceManagementKit} dmk Instance of DeviceManagementKit
 * @returns react.ref to a function to reenable the device session refresher or undefined when:
 *   - the feature flag is disabled
 *   - there are no active device sessions
 */
export const useDisableDeviceSessionRefresher = (
  dmk: DeviceManagementKit | null,
): React.MutableRefObject<(() => void) | undefined> => {
  const sessionId = useRef<string>();
  const sub = useRef<Subscription>();
  const enableRefresher = useRef<() => void>();

  useEffect(() => {
    if (!dmk) return;
    sub.current = activeDeviceSessionSubject.subscribe({
      next: session => {
        if (session) {
          if (sessionId.current !== session.sessionId) {
            sessionId.current = session.sessionId;

            enableRefresher.current = dmk.disableDeviceSessionRefresher({
              sessionId: sessionId.current,
              blockerId: "[hook] useDisableDeviceSessionRefresher",
            });
          }
        }
      },
    });

    return () => {
      if (!dmk) return;
      sub.current?.unsubscribe();
    };
  }, [dmk]);

  return enableRefresher;
};
