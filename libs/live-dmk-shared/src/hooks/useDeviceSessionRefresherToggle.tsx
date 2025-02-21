import { useRef, useEffect, useCallback } from "react";
import { Subscription } from "rxjs";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { activeDeviceSessionSubject } from "../config/activeDeviceSession";

export const useDeviceSessionRefresherToggle = (dmk: DeviceManagementKit, enabled: boolean) => {
  const sessionId = useRef<string>();
  const sub = useRef<Subscription>();
  useEffect(() => {
    if (!enabled) return;
    sub.current = activeDeviceSessionSubject.subscribe({
      next: session => {
        if (session) {
          if (sessionId.current !== session.sessionId) {
            if (sessionId.current) {
              try {
                dmk.toggleDeviceSessionRefresher({
                  sessionId: sessionId.current,
                  enabled: true,
                });
              } catch (error) {
                console.error(
                  `[useDeviceSessionRefresherToggle] error toggling back device session refresher ${sessionId.current}`,
                  error,
                );
              }
            }

            sessionId.current = session.sessionId;
            dmk.toggleDeviceSessionRefresher({
              sessionId: sessionId.current,
              enabled: false,
            });
          }
        }
      },
    });

    return () => {
      if (!enabled) return;
      sub.current?.unsubscribe();
      if (sessionId.current) {
        dmk.toggleDeviceSessionRefresher({
          sessionId: sessionId.current,
          enabled: true,
        });
      }
    };
  }, [dmk]);

  const resetRefresherState = useCallback(() => {
    sub.current?.unsubscribe();

    if (sessionId.current) {
      dmk.toggleDeviceSessionRefresher({
        sessionId: sessionId.current,
        enabled: true,
      });
    }
  }, [dmk]);

  return { resetRefresherState };
};
