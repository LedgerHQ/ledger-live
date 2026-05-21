import { spawn } from "child_process";
import * as net from "net";
import * as path from "path";
import { openSync, promises as fs } from "fs";
import { log } from "detox";
import { sanitizeError } from "@ledgerhq/live-common/e2e/index";

const SCRIPTS_DIR = path.resolve(__dirname, "..", "scripts");
const ARTIFACTS_DIR = path.resolve(__dirname, "..", "artifacts");
const PID_FILE = path.join(ARTIFACTS_DIR, "mitm.pid");
const LOG_FILE = path.join(ARTIFACTS_DIR, "mitm.log");

const isEnabled = (): boolean => process.env.MITM === "1";

// Only Android is supported — the setup script talks to adb. Detect by the
// active Detox configuration name, which always starts with "android." for
// Android targets (see e2e/mobile/detox.config.js).
const isAndroidTarget = (): boolean =>
  (process.env.DETOX_CONFIGURATION ?? "").startsWith("android");

const waitForPort = async (port: number, timeoutMs = 15_000): Promise<void> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const reachable = await new Promise<boolean>(resolve => {
      const socket = new net.Socket();
      socket.setTimeout(500);
      const cleanup = (ok: boolean) => {
        socket.destroy();
        resolve(ok);
      };
      socket.once("connect", () => cleanup(true));
      socket.once("timeout", () => cleanup(false));
      socket.once("error", () => cleanup(false));
      socket.connect(port, "127.0.0.1");
    });
    if (reachable) return;
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error(`mitmweb did not start listening on port ${port} within ${timeoutMs}ms`);
};

const runScript = (script: string, args: string[] = []): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = spawn(path.join(SCRIPTS_DIR, script), args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", code =>
      code === 0
        ? resolve()
        : reject(new Error(`${script} ${args.join(" ")} exited with code ${code}`)),
    );
  });

export async function startMitm(): Promise<void> {
  if (!isEnabled()) return;
  if (!isAndroidTarget()) {
    log.warn(`[mitm] MITM=1 ignored: DETOX_CONFIGURATION="${process.env.DETOX_CONFIGURATION}" is not Android`);
    return;
  }

  const port = Number(process.env.MITM_PORT ?? 8080);

  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });

  // Redirect mitmdump stdout/stderr to a log file so we can diagnose startup
  // failures without polluting Detox's own log stream.
  const logFd = openSync(LOG_FILE, "w");
  const child = spawn(path.join(SCRIPTS_DIR, "mitm.sh"), [], {
    detached: true,
    stdio: ["ignore", logFd, logFd],
    env: { ...process.env, MITM_PORT: String(port) },
  });

  if (!child.pid) {
    throw new Error("Failed to spawn mitm.sh (no pid assigned)");
  }

  // Detach so mitmproxy survives this globalSetup process — globalTeardown,
  // which runs in a separate process, will SIGTERM it via the pid file.
  child.unref();
  await fs.writeFile(PID_FILE, String(child.pid));

  log.info(`[mitm] mitmdump spawning (pid ${child.pid}, log ${LOG_FILE})`);

  try {
    await waitForPort(port);
  } catch (err) {
    log.error(`[mitm] mitmdump failed to bind :${port}. See ${LOG_FILE}.`);
    await stopMitm().catch(() => {});
    throw err;
  }

  // Install CA + set system proxy on the running emulator.
  await runScript("setup-mitmproxy.sh");

  log.info(`[mitm] capture active — HAR will be written to artifacts/mitm.har on teardown`);
}

export async function stopMitm(): Promise<void> {
  if (!isEnabled()) return;

  // Clear the emulator proxy first so any tail-end teardown traffic does not
  // try to hit a mitmproxy that is already shutting down.
  if (isAndroidTarget()) {
    await runScript("setup-mitmproxy.sh", ["--clear"]).catch(err =>
      log.warn(`[mitm] setup-mitmproxy.sh --clear failed:`, sanitizeError(err)),
    );
  }

  let pid: number | null = null;
  try {
    pid = Number((await fs.readFile(PID_FILE, "utf-8")).trim());
  } catch {
    // No pid file → nothing to stop.
  }

  if (pid && Number.isFinite(pid)) {
    try {
      // SIGTERM lets mitmproxy's `hardump` option flush the HAR before exit.
      // SIGKILL would skip the dump.
      process.kill(pid, "SIGTERM");
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "ESRCH") {
        log.warn(`[mitm] could not signal mitmweb (pid ${pid}):`, sanitizeError(err));
      }
    }

    // Poll for the process to exit so we know the HAR is flushed.
    const deadline = Date.now() + 5_000;
    while (Date.now() < deadline) {
      try {
        process.kill(pid, 0);
        await new Promise(r => setTimeout(r, 100));
      } catch {
        break; // process is gone
      }
    }
    log.info(`[mitm] mitmdump stopped — HAR at ${ARTIFACTS_DIR}/mitm.har`);
  }

  await fs.unlink(PID_FILE).catch(() => {});
}
