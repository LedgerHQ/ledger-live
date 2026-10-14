import {
  getMockServerSessionToken,
  getMockServerTransportUrl,
  useActiveMockServerDeviceId,
} from "@ledgerhq/live-dmk-desktop";
import type { MockServerDeviceWindowViewModel } from "./types";

/** Same gate as `isPlaywrightRun` in the main process. */
const isPlaywrightRun = (): boolean => {
  const value = process.env.PLAYWRIGHT_RUN;
  return !!value && value !== "0" && value !== "false";
};

/**
 * Visible only while the mock server transport drives the active session: the
 * device id is only set for a mock server device, and that transport is only
 * registered when it is enabled. The session token is the one seeded at boot,
 * so the window shows the device the transport is talking to.
 *
 * Hidden in E2E runs, where it floats over the controls the tests click.
 *
 * The token is read on each render rather than subscribed to: it is set at
 * boot, before any session exists, and the device id that follows a session
 * re-renders this hook.
 */
export function useMockServerDeviceWindowViewModel(): MockServerDeviceWindowViewModel {
  const deviceId = useActiveMockServerDeviceId();
  const token = getMockServerSessionToken();

  if (isPlaywrightRun() || !deviceId || !token) return { isVisible: false };

  return { isVisible: true, url: getMockServerTransportUrl(), token, deviceId };
}
