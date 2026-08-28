import { useEffect, useState } from "react";
import type { ConnectedDevice } from "@ledgerhq/device-management-kit";
import { mockserverIdentifier } from "@ledgerhq/device-transport-kit-mockserver";
import { activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import { getDeviceManagementKit } from "../hooks/useDeviceManagementKit";
import type { DeviceScreenState } from "./types";
import { useMockServerScreenApi } from "./useMockServerScreenApi";
import { useScreenPolling } from "./useScreenPolling";

export interface DeviceScreenSource {
  /**
   * The emulated device the screen belongs to, or null when none is connected
   * or the active one is a real device.
   */
  readonly device: ConnectedDevice | null;
  readonly state: DeviceScreenState;
}

/**
 * Tracks the device currently backed by the mock server transport. Only that
 * transport has a screen to show: WebHID devices are physical, and their screen
 * is the one on the desk.
 */
function useMockServerDevice(): ConnectedDevice | null {
  const [device, setDevice] = useState<ConnectedDevice | null>(null);

  useEffect(() => {
    const subscription = activeDeviceSessionSubject.subscribe(session => {
      if (!session) {
        setDevice(null);
        return;
      }
      try {
        const connected = getDeviceManagementKit().getConnectedDevice({
          sessionId: session.sessionId,
        });
        setDevice(connected.transport === mockserverIdentifier ? connected : null);
      } catch {
        // The session can be torn down between the emission and this lookup.
        setDevice(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return device;
}

/**
 * The only place that decides where the device screen comes from. Today that is
 * always the mock server, which proxies screenshot, button and finger calls
 * through to the Speculos instance backing the device.
 *
 * @param live whether the screen is on show. False while the panel is collapsed,
 * which stops the polling without unmounting the panel's header.
 */
export function useDeviceScreen(live: boolean): DeviceScreenSource {
  const device = useMockServerDevice();
  const api = useMockServerScreenApi(device?.id ?? "");
  const state = useScreenPolling(api, live && !!device);

  return { device, state: device ? state : { kind: "unavailable" } };
}
