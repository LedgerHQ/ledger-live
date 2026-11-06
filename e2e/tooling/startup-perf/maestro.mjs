import path from "node:path";
import { run } from "./exec.mjs";

/** @import { Maestro } from "./types.mjs" */

export const MAESTRO_FLOW_TIMEOUT_MS = 120_000;
export const MAESTRO_SCROLL_TIMEOUT_MS = 60_000;
export const MAESTRO_HIERARCHY_TIMEOUT_MS = 60_000;

// One per simulator, so the calls of a read reuse one driver.
const IOS_DRIVER_PORT = 22087;

/**
 * @param {{ binary: string, platform: "android" | "ios", devices: string[] }} options
 * @returns {Maestro}
 */
export function createMaestro({ binary, platform, devices }) {
  const env = Object.fromEntries(
    Object.entries({
      ...process.env,
      MAESTRO_DISABLE_UPDATE_CHECK: "true",
      MAESTRO_CLI_NO_ANALYTICS: "1",
      MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED: "true",
    }).filter(([key]) => platform !== "ios" || !(key === "ANDROID" || key.startsWith("ANDROID_"))),
  );
  return {
    calls: [],
    async invoke({ device, command, args = [], timeoutMs }) {
      const port = platform === "ios" ? IOS_DRIVER_PORT + devices.indexOf(device) : null;
      const startedAt = Date.now();
      const result = await run(
        binary,
        [
          ...(port === null ? [] : ["--driver-host-port", String(port)]),
          "--device",
          device,
          command,
          "--no-reinstall-driver",
          ...args,
        ],
        { timeoutMs, allowFail: true, env },
      );
      this.calls.push({
        command,
        flow: args[0] ? path.basename(args[0]) : null,
        ms: Date.now() - startedAt,
        ...(result.failed
          ? { error: `${result.stdout}\n${result.stderr}`.trim().slice(-400) }
          : {}),
      });
      return result;
    },
  };
}
