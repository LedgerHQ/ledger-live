/**
 * Minimum Speculos lifecycle for detox-next-gen.
 *
 * Pre-reqs (out of band):
 *   SEED              24-word phrase Speculos boots with.
 *   COINAPPS          local mode: path to the coin-apps directory.
 *   REMOTE_SPECULOS   "true" to use Speculinho instead of local Docker.
 *   SPECULINHO_URL    required when REMOTE_SPECULOS=true.
 *   SPECULOS_DEVICE   model — LNS / LNSP / LNX / STAX / FLEX / NanoGen5
 *                     (defaults to nanoSP).
 *
 * Flow:
 *   1. startSpeculos(testName, specs[appName])  -> { id, port, appName }
 *   2. device.reverseTcpPort(port)              -> iOS sim can hit localhost:port
 *   3. bridge.addKnownSpeculos(address, model)  -> app routes DMK to the proxy
 *   4. setEnv("SPECULOS_API_PORT", port)        -> live-common helpers find it
 *
 * Teardown reverses each step.
 */
import { device } from "detox";
import { setEnv } from "@ledgerhq/live-env";
import { specs, startSpeculos, stopSpeculos } from "@ledgerhq/live-common/e2e/speculos";
import { getSpeculosModel } from "@ledgerhq/live-common/e2e/speculosAppVersion";
import * as bridge from "../bridge/server";

// live-common reads this env var to locate (and lazily fetch) the nano-app
// catalog used to resolve appVersion. Path is relative to jest's cwd, i.e.
// e2e/detox-next-gen — the file is created on first use if missing.
setEnv("E2E_NANO_APP_VERSION_PATH", "artifacts/nano-app-catalog.json");

export type SpeculosHandle = {
  id: string;
  port: number;
  appName: string;
  address: string;
};

function speculosAddress(port: number): string {
  // Allow override (e.g. when running detox against a remote sim or device).
  const configured = process.env.SPECULOS_ADDRESS?.replace(/\/+$/, "");
  if (!configured) return `http://127.0.0.1:${port}`;
  const withProto = configured.startsWith("http") ? configured : `http://${configured}`;
  return /:\d+$/.test(withProto) ? withProto : `${withProto}:${port}`;
}

/**
 * Spin up a Speculos for `appName` (one of the keys in `specs`, e.g. "Bitcoin"),
 * wire it into the running app via the bridge, and return the handle. Throws
 * if SEED / Docker / Speculinho aren't usable — there's no graceful fallback
 * because the test that follows depends on a working device.
 */
export async function launchSpeculos(appName: keyof typeof specs): Promise<SpeculosHandle> {
  const testName = expect.getState().currentTestName ?? "speculos";
  const result = await startSpeculos(testName, specs[appName]);
  if (!result?.port) {
    throw new Error(`[speculos] startSpeculos returned no port for ${String(appName)}`);
  }

  await device.reverseTcpPort(result.port);
  setEnv("SPECULOS_API_PORT", result.port);

  const address = speculosAddress(result.port);
  await bridge.addKnownSpeculos(address, getSpeculosModel());

  return {
    id: result.id,
    port: result.port,
    appName: result.appName ?? String(appName),
    address,
  };
}

/** Tear down: bridge first (so the app stops dialing), then Speculos, then unreverse. */
export async function shutdownSpeculos(handle: SpeculosHandle): Promise<void> {
  try {
    await bridge.removeKnownSpeculos(handle.address);
  } catch {
    /* best effort — bridge may already be down */
  }
  try {
    await stopSpeculos(handle.id);
  } catch {
    /* best effort */
  }
  try {
    await device.unreverseTcpPort(handle.port);
  } catch {
    /* best effort */
  }
  setEnv("SPECULOS_API_PORT", 0);
}
