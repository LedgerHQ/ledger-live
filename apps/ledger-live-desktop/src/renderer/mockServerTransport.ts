import network from "@ledgerhq/live-network";
import { getEnv } from "@shared/env";
import {
  setMockServerSessionToken,
  getMockServerSessionToken,
  getMockScriptRunnerBaseUrl,
  MOCK_SERVER_TRANSPORT_URL,
} from "@ledgerhq/live-dmk-desktop";
import { setEnvOnAllThreads } from "~/helpers/env";

/**
 * localStorage key backing the developer "Mock server transport" toggle. The
 * enable flag lives here (not in a launch env) so it survives a renderer reload;
 * it is restored into the `MOCK_SERVER_TRANSPORT` live-env var at boot (below)
 * so the DMK build and the internal thread's scriptrunner both see it.
 */
export const MOCK_SERVER_TRANSPORT_STORAGE_KEY = "MOCK_SERVER_TRANSPORT";

/**
 * When the DMK mock server transport is enabled, create a single mock server
 * session and seed a default device into it, then keep the session token in
 * memory. The transport (and the top bar indicator) reuse this token, so the
 * transport discovers the seeded device instead of starting from an empty
 * session. Must run before the DMK is built.
 */
export async function bootstrapMockServerTransport(): Promise<void> {
  // Restore the persisted toggle state onto all threads before anything reads
  // the flag (bootstrap below, the DMK build, and socket/index.ts on the
  // internal thread). Sync both true and false: the internal thread is not
  // reloaded by reloadRenderer, so a stale value must be overwritten.
  const persistedEnabled =
    window.localStorage.getItem(MOCK_SERVER_TRANSPORT_STORAGE_KEY) === "1";
  setEnvOnAllThreads("MOCK_SERVER_TRANSPORT", persistedEnabled);

  const enabled = getEnv("MOCK_SERVER_TRANSPORT");
  const existingToken = getMockServerSessionToken();

  if (!enabled) {
    return;
  }
  if (existingToken) {
    return;
  }

  const baseUrl = MOCK_SERVER_TRANSPORT_URL;
  try {
    const { data } = await network<{ token?: string }>({
      method: "POST",
      url: `${baseUrl}/auth`,
      data: {},
      timeout: 4000,
    });
    const token = data?.token;
    if (!token) throw new Error("no token returned by /auth");

    // Seed a USB Stax on the dashboard with explicit metadata so the mock
    // derives a realistic firmware/app handshake (an empty body left firmware at
    // "0.0.0", which confuses the connect flow). Firmware 1.9.1 leaves an OS
    // update available so the firmware-update flow can be exercised.
    await network({
      method: "POST",
      url: `${baseUrl}/devices`,
      data: {
        name: "Ledger Stax",
        device_type: "stax",
        connectivity_type: "USB",
        firmware_version: "1.9.1",
        apps: [{ name: "BOLOS", version: "1.4.0" }],
      },
      headers: { Authorization: `Bearer ${token}` },
      timeout: 4000,
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
    console.error("Failed to bootstrap mock server transport", error);
  }
}
