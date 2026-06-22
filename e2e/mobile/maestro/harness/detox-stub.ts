/**
 * Minimal `detox` stand-in for the Maestro harness (mapped via moduleNameMapper in
 * harness/jest.config.js). Maestro owns the device; Detox's `device` port-forwarding is mostly a
 * no-op here. On an iOS simulator the host and sim share localhost, so Speculos at
 * localhost:<port> is reachable without `reverseTcpPort`.
 *
 * On ANDROID the emulator's 127.0.0.1 is NOT the host, so the Speculos device-proxy
 * (DEVICE_PROXY_URL = http://127.0.0.1:<speculosPort>) only works if that port is reversed. The
 * port is chosen dynamically by createSpeculosDevice, so we run a real `adb reverse` here (where
 * registerSpeculos calls device.reverseTcpPort) rather than from the orchestrator. `log` no-ops.
 */
import { execFileSync } from "child_process";

const noop = (..._args: unknown[]) => {};

type CallableLog = ((...args: unknown[]) => void) & Record<string, (...args: unknown[]) => void>;
const log = noop as unknown as CallableLog;
log.info = noop;
log.warn = noop;
log.error = noop;
log.debug = noop;
log.trace = noop;

const PLATFORM = (process.env.MAESTRO_PLATFORM ?? "ios").toLowerCase() === "android" ? "android" : "ios";
const ADB =
  process.env.ADB ||
  `${process.env.ANDROID_HOME || `${process.env.HOME}/Library/Android/sdk`}/platform-tools/adb`;

function adbReverse(args: string[]): void {
  if (PLATFORM !== "android") return;
  try {
    execFileSync(ADB, ["reverse", ...args], { stdio: "ignore" });
  } catch {
    // best-effort; a missing/duplicate reverse shouldn't crash the harness
  }
}

const device = {
  getPlatform: () => PLATFORM,
  reverseTcpPort: async (port: number) => adbReverse([`tcp:${port}`, `tcp:${port}`]),
  unreverseTcpPort: async (port: number) => adbReverse(["--remove", `tcp:${port}`]),
};

export { log, device };
export default { log, device };
