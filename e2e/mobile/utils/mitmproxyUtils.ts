import { ChildProcess, spawn, execSync } from "node:child_process";
import { promises as fs, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { log } from "detox";

const ARTIFACTS_DIR = path.resolve(__dirname, "../artifacts");
const MITMPROXY_LOG_PATH = path.join(ARTIFACTS_DIR, "mitmproxy-requests.log");
const MITMPROXY_HAR_PATH = path.join(ARTIFACTS_DIR, "mitmproxy-requests.har");
const MITMPROXY_SCRIPT_PATH = path.resolve(__dirname, "../scripts/mitmproxy-addon.py");
const MITMPROXY_PID_FILE = path.join(ARTIFACTS_DIR, "mitmproxy.pid");
const MITMPROXY_STATE_FILE = path.join(ARTIFACTS_DIR, "mitmproxy-state.json");
const MITMPROXY_PORT = 8888;

interface MitmproxyState {
  pid: number;
  port: number;
  networkService: string | null;
}

function isMitmproxyEnabled(): boolean {
  return process.env.CI === "true" || process.env.ENABLE_MITMPROXY === "true";
}

function isIosPlatform(): boolean {
  return !process.env.DETOX_CONFIGURATION || process.env.DETOX_CONFIGURATION.startsWith("ios.sim");
}

/**
 * Reads persisted mitmproxy state from disk (works across Jest processes).
 */
function readState(): MitmproxyState | null {
  try {
    if (!existsSync(MITMPROXY_STATE_FILE)) return null;
    return JSON.parse(readFileSync(MITMPROXY_STATE_FILE, "utf-8"));
  } catch {
    return null;
  }
}

/**
 * Writes mitmproxy state to disk so other Jest processes can read it.
 */
async function writeState(state: MitmproxyState): Promise<void> {
  await fs.writeFile(MITMPROXY_STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * Detects the active macOS network service (Wi-Fi, Ethernet, etc.).
 */
function getActiveNetworkService(): string | null {
  try {
    const routeOutput = execSync("route -n get default 2>/dev/null | grep interface", {
      encoding: "utf-8",
    }).trim();
    const iface = routeOutput.split(":").pop()?.trim();
    if (!iface) return null;

    const services = execSync("networksetup -listallhardwareports", { encoding: "utf-8" });
    const lines = services.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`Device: ${iface}`)) {
        const match = /Hardware Port:\s*(.+)/.exec(lines[i - 1] ?? "");
        if (match) return match[1];
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Starts mitmproxy in the background, configures macOS system proxy,
 * and installs the CA cert on booted iOS simulators.
 *
 * Call this from globalSetup. The process is spawned detached so it
 * survives the globalSetup process. State is persisted to disk.
 */
export async function startMitmproxy(): Promise<void> {
  if (!isMitmproxyEnabled() || !isIosPlatform()) {
    log.info("[mitmproxy] Skipping – not enabled or not iOS");
    return;
  }

  try {
    execSync("command -v mitmdump", { stdio: "ignore" });
  } catch {
    log.warn("[mitmproxy] mitmdump not found in PATH – skipping proxy setup");
    return;
  }

  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });

  // Spawn detached so the process survives Jest process boundaries
  const child: ChildProcess = spawn(
    "mitmdump",
    [
      "--listen-port",
      String(MITMPROXY_PORT),
      "--ssl-insecure",
      "--set",
      `hardump=${MITMPROXY_HAR_PATH}`,
      "-s",
      MITMPROXY_SCRIPT_PATH,
      "--set",
      `logfile=${MITMPROXY_LOG_PATH}`,
    ],
    {
      stdio: "ignore",
      detached: true,
    },
  );
  child.unref();

  const pid = child.pid;
  if (!pid) {
    log.error("[mitmproxy] Failed to start – no PID returned");
    return;
  }

  // Wait for proxy to be ready
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("mitmproxy failed to start within 10 seconds"));
    }, 10_000);

    const checkReady = () => {
      try {
        execSync(`nc -z localhost ${MITMPROXY_PORT}`, { timeout: 1000, stdio: "ignore" });
        clearTimeout(timeout);
        resolve();
      } catch {
        setTimeout(checkReady, 500);
      }
    };
    setTimeout(checkReady, 1000);
  });

  log.info(`[mitmproxy] Started on port ${MITMPROXY_PORT} (PID ${pid})`);

  // Configure macOS system proxy (iOS simulator uses host network stack)
  const service = getActiveNetworkService();
  if (service) {
    try {
      execSync(`networksetup -setwebproxy "${service}" localhost ${MITMPROXY_PORT}`, {
        stdio: "ignore",
      });
      execSync(`networksetup -setsecurewebproxy "${service}" localhost ${MITMPROXY_PORT}`, {
        stdio: "ignore",
      });
      execSync(`networksetup -setwebproxystate "${service}" on`, { stdio: "ignore" });
      execSync(`networksetup -setsecurewebproxystate "${service}" on`, { stdio: "ignore" });
      log.info(`[mitmproxy] macOS system proxy set on "${service}" → localhost:${MITMPROXY_PORT}`);
    } catch (error) {
      log.warn(`[mitmproxy] Failed to configure system proxy: ${error}`);
    }
  } else {
    log.warn("[mitmproxy] Could not detect active network service – proxy not configured");
  }

  // Persist state for teardown (runs in a different process)
  await writeState({ pid, port: MITMPROXY_PORT, networkService: service });
}

/**
 * Stops mitmproxy, restores proxy settings, and cleans up state files.
 * Call this from globalTeardown. Reads state from disk.
 */
export async function stopMitmproxy(): Promise<void> {
  const state = readState();
  if (!state) {
    log.info("[mitmproxy] No state file found – nothing to stop");
    return;
  }

  // Restore macOS proxy settings
  if (state.networkService) {
    try {
      execSync(`networksetup -setwebproxystate "${state.networkService}" off`, {
        stdio: "ignore",
      });
      execSync(`networksetup -setsecurewebproxystate "${state.networkService}" off`, {
        stdio: "ignore",
      });
      log.info(`[mitmproxy] System proxy disabled on "${state.networkService}"`);
    } catch (error) {
      log.warn(`[mitmproxy] Failed to disable system proxy: ${error}`);
    }
  }

  // Kill mitmproxy process
  try {
    process.kill(state.pid, "SIGTERM");
    log.info(`[mitmproxy] Sent SIGTERM to PID ${state.pid}`);
    // Give it a moment to flush HAR/logs
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : null;
    const isProcessGone = err && "code" in err && String(err.code) === "ESRCH";
    if (!isProcessGone) {
      log.warn(`[mitmproxy] Failed to kill PID ${state.pid}: ${error}`);
    }
  }

  // Clean up state files
  await Promise.all([
    fs.unlink(MITMPROXY_STATE_FILE).catch(() => {}),
    fs.unlink(MITMPROXY_PID_FILE).catch(() => {}),
  ]);

  log.info("[mitmproxy] Stopped and cleaned up");
}

interface SimulatorDevice {
  state: string;
  udid: string;
}

interface SimulatorDeviceList {
  devices: Record<string, SimulatorDevice[]>;
}

/**
 * Installs the mitmproxy CA certificate on the booted iOS simulator.
 * Must be called after the simulator is booted and mitmproxy is running.
 */
export async function installMitmproxyCertOnSimulator(): Promise<void> {
  if (!isMitmproxyEnabled() || !isIosPlatform()) return;

  const certPath = path.join(process.env.HOME || "~", ".mitmproxy", "mitmproxy-ca-cert.pem");

  try {
    await fs.access(certPath);
  } catch {
    log.warn("[mitmproxy] CA cert not found – generating by running mitmdump briefly");
    try {
      execSync("mitmdump --listen-port 0 &>/dev/null & sleep 2 && kill $!", { stdio: "ignore" });
    } catch {
      // expected – the kill may fail if mitmdump already exited
    }
  }

  try {
    const devicesOutput = execSync("xcrun simctl list devices booted -j", { encoding: "utf-8" });
    const devices: SimulatorDeviceList = JSON.parse(devicesOutput);
    const bootedUDIDs: string[] = [];

    for (const runtime of Object.values(devices.devices)) {
      for (const device of runtime) {
        if (device.state === "Booted") {
          bootedUDIDs.push(device.udid);
        }
      }
    }

    for (const udid of bootedUDIDs) {
      log.info(`[mitmproxy] Installing CA cert on simulator ${udid}`);
      execSync(`xcrun simctl keychain ${udid} add-root-cert "${certPath}"`, { stdio: "ignore" });
    }

    log.info(`[mitmproxy] CA cert installed on ${bootedUDIDs.length} simulator(s)`);
  } catch (error) {
    log.error(`[mitmproxy] Failed to install CA cert: ${error}`);
  }
}
