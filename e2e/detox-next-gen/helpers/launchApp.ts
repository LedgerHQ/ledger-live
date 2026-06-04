import { device } from "detox";
/**
 * Boot the app and open a fresh bridge socket.
 *
 * Pass `wsPort` via launchArgs — the in-app client reads it through
 * `LaunchArguments.value()["wsPort"]` and dials back in.
 */
import * as bridge from "../bridge/server";

export async function launchApp(): Promise<void> {
  // Idempotent: close any leftover socket from a previous spec.
  bridge.close();

  const port = await bridge.findFreePort();
  bridge.init(port);

  await device.launchApp({
    newInstance: true,
    delete: true,
    launchArgs: {
      wsPort: port,
      mock: "0", // disable in-app HTTP mock — we want real network paths
      IS_TEST: true,
    },
    languageAndLocale: { language: "en-US", locale: "en-US" },
    permissions: { camera: "YES" },
  });
}

/** Tear down the bridge. Call from `afterAll` so the port is released. */
export function closeApp(): void {
  bridge.close();
}
