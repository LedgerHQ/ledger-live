import network from "@ledgerhq/live-network";
import { getEnv } from "@shared/env";
import { activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import {
  DeviceManagementKitTransport,
  setMockServerSessionToken,
  getMockServerSessionToken,
  getMockScriptRunnerBaseUrl,
  getMockServerTransportUrl,
} from "@ledgerhq/live-dmk-desktop";
import { setEnvOnAllThreads } from "~/helpers/env";
import {
  buildMockServerDeviceConfig,
  mockServerSessionImport,
  writeMockServerDevice,
  type MockServerDeviceSelection,
} from "./mockServerDevice";

const REQUEST_TIMEOUT_MS = 4000;

/**
 * localStorage key backing the developer "Mock server transport" toggle. The
 * enable flag lives here (not in a launch env) so it survives a renderer reload;
 * it is restored into the `MOCK_SERVER_TRANSPORT` live-env var at boot (below)
 * so the DMK build and the internal thread's scriptrunner both see it.
 */
export const MOCK_SERVER_TRANSPORT_STORAGE_KEY = "MOCK_SERVER_TRANSPORT";

/**
 * When the DMK mock server transport is enabled, create a single mock server
 * session and seed a device into it, then keep the session token in memory. The
 * transport (and the top bar indicator) reuse this token, so the transport
 * discovers the seeded device instead of starting from an empty session. Must
 * run before the DMK is built.
 */
export async function bootstrapMockServerTransport(): Promise<void> {
  // Restore the persisted toggle state onto all threads before anything reads
  // the flag (bootstrap below, the DMK build, and socket/index.ts on the
  // internal thread). Sync both true and false: the internal thread is not
  // reloaded by reloadRenderer, so a stale value must be overwritten.
  const persistedEnabled = window.localStorage.getItem(MOCK_SERVER_TRANSPORT_STORAGE_KEY) === "1";
  setEnvOnAllThreads("MOCK_SERVER_TRANSPORT", persistedEnabled);

  const enabled = getEnv("MOCK_SERVER_TRANSPORT");
  const existingToken = getMockServerSessionToken();

  if (!enabled) {
    return;
  }
  if (existingToken) {
    return;
  }

  const baseUrl = getMockServerTransportUrl();
  try {
    const { data } = await network<{ token?: string }>({
      method: "POST",
      url: `${baseUrl}/auth`,
      data: {},
      timeout: REQUEST_TIMEOUT_MS,
    });
    const token = data?.token;
    if (!token) throw new Error("no token returned by /auth");

    const auth = { Authorization: `Bearer ${token}` };

    // Pushed before the devices land: the endpoint rejects an empty seed, so a
    // bad mnemonic fails before the session is half-provisioned.
    const seedOverride = getEnv("MOCK_SERVER_SEED").trim();
    if (seedOverride) {
      await network({
        method: "PUT",
        url: `${baseUrl}/sessions/current/seed`,
        data: { seed: seedOverride },
        headers: auth,
        timeout: REQUEST_TIMEOUT_MS,
      });
    }

    await network({
      method: "POST",
      url: `${baseUrl}/import`,
      data: mockServerSessionImport(),
      headers: auth,
      timeout: REQUEST_TIMEOUT_MS,
    });

    setMockServerSessionToken(token);

    // Route the legacy scriptrunner flows (genuine check, list apps, install,
    // firmware/MCU) at the mock server too. They read `BASE_SOCKET_URL` from
    // `getEnv` at call time and run on the internal thread, so we push the mock
    // secure-channel URL (with token) to all threads instead of importing the
    // token into platform-agnostic ledger-live-common.
    const scriptRunnerUrl = getMockScriptRunnerBaseUrl(baseUrl, token);
    if (scriptRunnerUrl) {
      setEnvOnAllThreads("BASE_SOCKET_URL", scriptRunnerUrl);
    }
  } catch (error) {
    console.warn("Failed to bootstrap mock server transport", error);
  }
}

/**
 * Move the live mock server session onto a different device: the new one is
 * attached and connected before the old one is removed, so the session is never
 * deviceless. Throws when the mock server rejects a call.
 */
export async function swapMockServerDevice(selection: MockServerDeviceSelection): Promise<void> {
  writeMockServerDevice(selection);

  const hasNoSessionToSwapWithin = !getMockServerSessionToken();
  if (hasNoSessionToSwapWithin) {
    await bootstrapMockServerTransport();
    return;
  }

  const baseUrl = getMockServerTransportUrl();
  const auth = { Authorization: `Bearer ${getMockServerSessionToken()}` };

  const { data: previousDevices } = await network<{ id: string }[]>({
    method: "GET",
    url: `${baseUrl}/devices`,
    headers: auth,
    timeout: REQUEST_TIMEOUT_MS,
  });

  const { data: newDevice } = await network<{ id: string }>({
    method: "POST",
    url: `${baseUrl}/devices`,
    data: buildMockServerDeviceConfig(selection),
    headers: auth,
    timeout: REQUEST_TIMEOUT_MS,
  });

  // Cleared eagerly: the transport only clears it once the device session
  // reports NOT_CONNECTED, too late for the reopen below to avoid reusing it.
  const activeSession = activeDeviceSessionSubject.value;
  if (activeSession) {
    try {
      await activeSession.transport.disconnect();
    } catch (error) {
      console.warn("Failed to disconnect the previous mock server device", error);
    }
    activeDeviceSessionSubject.next(null);
  }

  await DeviceManagementKitTransport.open({ deviceId: newDevice.id });

  const staleDevices = previousDevices.filter(device => device.id !== newDevice.id);
  for (const device of staleDevices) {
    await network({
      method: "DELETE",
      url: `${baseUrl}/devices/${device.id}`,
      headers: auth,
      timeout: REQUEST_TIMEOUT_MS,
    });
  }
}
