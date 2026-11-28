import path from "node:path";
import { run } from "./exec.ts";
import type { PlatformName } from "../types.ts";
import type { Maestro } from "./types.ts";

export const FLOWS_DIR = path.join(import.meta.dirname, "..", "..", "flows");

// One per simulator, so the calls of a flow reuse one driver.
const IOS_DRIVER_PORT = 22087;

export function createMaestro({
  binary,
  platform,
  devices,
}: {
  binary: string;
  platform: PlatformName;
  devices: string[];
}): Maestro {
  const env = Object.fromEntries(
    Object.entries({
      ...process.env,
      MAESTRO_DISABLE_UPDATE_CHECK: "true",
      MAESTRO_CLI_NO_ANALYTICS: "1",
      MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED: "true",
    }).filter(([key]) => platform !== "ios" || !(key === "ANDROID" || key.startsWith("ANDROID_"))),
  );
  return {
    async invoke({ device, command, args = [], timeoutMs }) {
      const port = platform === "ios" ? IOS_DRIVER_PORT + devices.indexOf(device) : null;
      return run(
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
    },
  };
}
