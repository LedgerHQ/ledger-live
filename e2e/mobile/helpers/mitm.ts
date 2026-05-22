import { spawn } from "child_process";
import * as net from "net";
import * as path from "path";
import { openSync, promises as fs } from "fs";
import { log } from "detox";
import { sanitizeError } from "@ledgerhq/live-common/e2e/index";

const SCRIPTS_DIR = path.resolve(__dirname, "..", "scripts");
const DEFAULT_HAR_DIR = path.resolve(__dirname, "..", "artifacts", "mitm");
const PID_FILE = path.resolve(__dirname, "..", "artifacts", "mitm.pid");

// One entry per spawned mitmdump. Persisted as JSON in PID_FILE so the
// globalTeardown process (different Node process from globalSetup) can
// signal and clean up every instance.
type MitmInstance = {
  serial: string;
  port: number;
  pid: number;
  harPath: string;
  logPath: string;
};

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
  throw new Error(`mitmdump did not start listening on port ${port} within ${timeoutMs}ms`);
};

const runScript = (
  script: string,
  args: string[] = [],
  opts: { capture?: boolean } = {},
): Promise<{ stdout: string }> =>
  new Promise((resolve, reject) => {
    const captureStdout = opts.capture ?? false;
    const child = spawn(path.join(SCRIPTS_DIR, script), args, {
      stdio: captureStdout ? ["inherit", "pipe", "inherit"] : "inherit",
    });
    let stdout = "";
    if (captureStdout && child.stdout) {
      child.stdout.on("data", chunk => {
        stdout += chunk.toString();
      });
    }
    child.on("error", reject);
    child.on("exit", code =>
      code === 0
        ? resolve({ stdout })
        : reject(new Error(`${script} ${args.join(" ")} exited with code ${code}`)),
    );
  });

const harDir = (): string => process.env.MITM_HAR_DIR ?? DEFAULT_HAR_DIR;

export async function startMitm(): Promise<void> {
  if (!isEnabled()) return;
  if (!isAndroidTarget()) {
    log.warn(
      `[mitm] MITM=1 ignored: DETOX_CONFIGURATION="${process.env.DETOX_CONFIGURATION}" is not Android`,
    );
    return;
  }

  const outDir = harDir();
  await fs.mkdir(outDir, { recursive: true });
  await fs.mkdir(path.dirname(PID_FILE), { recursive: true });

  // 1. Discover every booted emulator. Same boot-wait the multi-emulator
  //    setup-mitmproxy.sh uses, just exposed via the `list-serials`
  //    subcommand so we get the list back here without re-implementing
  //    adb parsing in TS.
  const { stdout: listOut } = await runScript("setup-mitmproxy.sh", ["list-serials"], {
    capture: true,
  });
  const serials = listOut
    .split("\n")
    .map(s => s.trim())
    .filter(s => /^emulator-\d+$/.test(s));

  if (serials.length === 0) {
    throw new Error("[mitm] no booted emulators detected");
  }

  const basePort = Number(process.env.MITM_PORT ?? 8080);

  // 2. For each emulator, spawn a dedicated mitmdump and point that
  //    emulator at it. Doing the spawn+wait+configure serially per
  //    emulator avoids interleaved log output and keeps failures easy to
  //    attribute.
  const instances: MitmInstance[] = [];
  try {
    for (let i = 0; i < serials.length; i++) {
      const serial = serials[i];
      const port = basePort + i;
      const harPath = path.join(outDir, `mitm-${serial}.har`);
      const logPath = path.join(outDir, `mitm-${serial}.log`);

      // Per-instance log file — when one worker's HAR looks wrong, the
      // matching log makes it possible to diagnose which mitmdump
      // misbehaved without grepping a giant combined log.
      const logFd = openSync(logPath, "w");
      const child = spawn(path.join(SCRIPTS_DIR, "mitm.sh"), [], {
        detached: true,
        stdio: ["ignore", logFd, logFd],
        env: { ...process.env, MITM_PORT: String(port), MITM_HAR: harPath },
      });
      if (!child.pid) {
        throw new Error(`[mitm] failed to spawn mitm.sh for ${serial}`);
      }
      child.unref();

      try {
        await waitForPort(port);
      } catch (err) {
        log.error(`[mitm] mitmdump for ${serial} failed to bind :${port}. See ${logPath}.`);
        try {
          process.kill(child.pid, "SIGTERM");
        } catch {
          // ignore
        }
        throw err;
      }

      await runScript("setup-mitmproxy.sh", [
        "configure",
        "--serial",
        serial,
        "--port",
        String(port),
      ]);

      instances.push({ serial, port, pid: child.pid, harPath, logPath });
      log.info(
        `[mitm] ${serial} → :${port} (pid ${child.pid}, har ${harPath}, log ${logPath})`,
      );
    }

    await fs.writeFile(PID_FILE, JSON.stringify(instances));
    log.info(`[mitm] capture active on ${instances.length} emulator(s); HAR dir ${outDir}`);
  } catch (err) {
    // On any failure during multi-instance bring-up, tear down whatever
    // we already started so we don't leave orphan mitmdumps lying around.
    log.error("[mitm] start failed; rolling back", sanitizeError(err));
    await fs.writeFile(PID_FILE, JSON.stringify(instances)).catch(() => {});
    await stopMitm().catch(() => {});
    throw err;
  }
}

const isLiveProcess = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const waitForExit = async (pid: number, timeoutMs: number): Promise<void> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isLiveProcess(pid)) return;
    await new Promise(r => setTimeout(r, 100));
  }
};

export async function stopMitm(): Promise<void> {
  if (!isEnabled()) return;

  let instances: MitmInstance[] = [];
  try {
    const raw = (await fs.readFile(PID_FILE, "utf-8")).trim();
    if (raw) instances = JSON.parse(raw);
  } catch {
    // No pid file → nothing to stop.
    return;
  }

  // Clear emulator proxies first so any teardown traffic does not try to
  // hit a mitmproxy that is already shutting down. Failures are warnings
  // — a missing emulator does not block the rest of the teardown.
  if (isAndroidTarget()) {
    await Promise.all(
      instances.map(({ serial }) =>
        runScript("setup-mitmproxy.sh", ["clear", "--serial", serial]).catch(err =>
          log.warn(
            `[mitm] clear ${serial} failed:`,
            sanitizeError(err instanceof Error ? err : new Error(String(err))),
          ),
        ),
      ),
    );
  }

  // SIGTERM lets mitmproxy's `hardump` option flush each HAR before
  // exit. SIGKILL would skip the dump.
  await Promise.all(
    instances.map(async ({ serial, pid, harPath }) => {
      if (!Number.isFinite(pid)) return;
      try {
        process.kill(pid, "SIGTERM");
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code !== "ESRCH") {
          log.warn(
            `[mitm] could not signal ${serial} (pid ${pid}):`,
            sanitizeError(err instanceof Error ? err : new Error(String(err))),
          );
        }
        return;
      }
      await waitForExit(pid, 5_000);
      log.info(`[mitm] ${serial} stopped — HAR at ${harPath}`);
    }),
  );

  await fs.unlink(PID_FILE).catch(() => {});
}
