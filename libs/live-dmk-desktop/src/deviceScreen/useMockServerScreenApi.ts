import { useMemo } from "react";
import { MockClient } from "@ledgerhq/device-mockserver-client";
import { DmkNetworkClientError } from "@ledgerhq/device-management-kit";
import {
  getMockServerSessionToken,
  getMockServerTransportUrl,
} from "../hooks/useDeviceManagementKit";
import type { ScreenApi } from "./screenApi";

/** The Speculos proxy answers 409 when the device has no active instance. */
const isNoInstance = (error: unknown): boolean =>
  error instanceof DmkNetworkClientError && error.status === 409;

/**
 * Reaches the device's screen through the mock server, which proxies to the
 * Speculos instance backing it. That instance only exists while an app is
 * running; once it is gone the proxy answers 409 and the device's own record
 * stands in.
 *
 * Reuses the session token seeded at boot, so the screen sees the same device
 * the transport is driving rather than provisioning a session of its own.
 */
export function useMockServerScreenApi(deviceId: string): ScreenApi {
  const token = getMockServerSessionToken();
  const baseUrl = getMockServerTransportUrl();

  const client = useMemo(() => new MockClient(baseUrl, { token }), [baseUrl, token]);

  return useMemo<ScreenApi>(
    () => ({
      screenshot: async () => {
        try {
          return await client.getScreenshot(deviceId);
        } catch (error) {
          if (isNoInstance(error)) return null;
          throw error;
        }
      },
      idle: async () => ({ kind: "os-info", device: await client.getDevice(deviceId) }),
      pressButton: (button, action) => client.pressButton(deviceId, button, action),
      touch: (x, y, action) => client.touchScreen(deviceId, x, y, action),
    }),
    [client, deviceId],
  );
}
