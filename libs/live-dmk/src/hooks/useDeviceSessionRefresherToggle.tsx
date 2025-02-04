import { useRef, useEffect, useCallback } from "react";
import { Subscription } from "rxjs";
import { activeDeviceSessionSubject } from "../config/activeDeviceSession";
import { useDeviceManagementKit } from "./useDeviceManagementKit";

export const useDeviceSessionRefresherToggle = (enabled: boolean) => {
  const sdk = useDeviceManagementKit();
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
                sdk.toggleDeviceSessionRefresher({
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
            sdk.toggleDeviceSessionRefresher({
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
        sdk.toggleDeviceSessionRefresher({
          sessionId: sessionId.current,
          enabled: true,
        });
      }
    };
  }, [sdk]);

  const resetRefresherState = useCallback(() => {
    sub.current?.unsubscribe();

    if (sessionId.current) {
      sdk.toggleDeviceSessionRefresher({
        sessionId: sessionId.current,
        enabled: true,
      });
    }
  }, [sdk]);

  return { resetRefresherState };
};
