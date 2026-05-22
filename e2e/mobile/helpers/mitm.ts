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
// globalTeardown process AND the test workers (each in its own Node
// process) can rediscover the running instances:
//   - globalTeardown reads it to signal + clean up
//   - per-test hooks (e2e/mobile/helpers/mitm-test.ts) read it to find
//     the control port for their assigned worker / emulator
export type MitmInstance = {
  serial: string;
  port: number;
  controlPort: number;
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

// Try to bind a TCP server on 127.0.0.1:<port>. If the bind succeeds the
// port is free and we close again immediately. If we get EADDRINUSE (or
// any other error) we treat the port as occupied. There is an unavoidable
// TOCTOU window between this probe and the subsequent mitmdump spawn —
// fine in practice for an opt-in capture mode.
const isPortFree = (port: number): Promise<boolean> =>
  new Promise(resolve => {
    const server = net.createServer();
    server.unref();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, "127.0.0.1");
  });

const findFreePort = async (start: number, span = 100): Promise<number> => {
  for (let p = start; p < start + span; p++) {
    if (await isPortFree(p)) return p;
  }
  throw new Error(`no free port in [${start}, ${start + span}) for mitmdump`);
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
  const baseControlPort = Number(process.env.MITM_CONTROL_PORT ?? 9080);
  // Walk forward through each port range as we allocate, so the next
  // probe starts past the port we just claimed. Without this, two
  // emulators could otherwise be assigned the same "next free" port.
  let nextProxyFrom = basePort;
  let nextControlFrom = baseControlPort;

  // 2. For each emulator, spawn a dedicated mitmdump and point that
  //    emulator at it. Doing the spawn+wait+configure serially per
  //    emulator avoids interleaved log output and keeps failures easy to
  //    attribute.
  const instances: MitmInstance[] = [];
  try {
    for (let i = 0; i < serials.length; i++) {
      const serial = serials[i];
      // Find an actually-free port instead of assuming basePort+i is
      // available. On dev machines :8080 is often already taken; if we
      // just hand it to mitmdump it crashes with EADDRINUSE while our
      // `waitForPort` sees the squatter and reports "ready" — silently
      // routing the emulator to the wrong process.
      const port = await findFreePort(nextProxyFrom);
      nextProxyFrom = port + 1;
      const controlPort = await findFreePort(nextControlFrom);
      nextControlFrom = controlPort + 1;

      const harPath = path.join(outDir, `mitm-${serial}.har`);
      const logPath = path.join(outDir, `mitm-${serial}.log`);

      // Per-instance log file — when one worker's HAR looks wrong, the
      // matching log makes it possible to diagnose which mitmdump
      // misbehaved without grepping a giant combined log.
      const logFd = openSync(logPath, "w");
      const child = spawn(path.join(SCRIPTS_DIR, "mitm.sh"), [], {
        detached: true,
        stdio: ["ignore", logFd, logFd],
        // MITM_CONTROL_PORT + MITM_SERIAL light up the per-test control
        // endpoint inside mitm-emulator-addon.py. Without them the addon
        // falls back to a plain proxy (still useful for the per-emulator
        // fallback HAR via hardump).
        env: {
          ...process.env,
          MITM_PORT: String(port),
          MITM_HAR: harPath,
          MITM_CONTROL_PORT: String(controlPort),
          MITM_SERIAL: serial,
        },
      });
      if (!child.pid) {
        throw new Error(`[mitm] failed to spawn mitm.sh for ${serial}`);
      }
      child.unref();

      // Race: child exits early (e.g. mitmdump bind failure that slipped
      // through the probe) vs. proxy port becoming reachable. The first
      // outcome wins. Without the race a startup failure would deadlock
      // waitForPort.
      let earlyExit: number | null = null;
      const exitPromise = new Promise<"exited">(resolve => {
        child.once("exit", code => {
          earlyExit = code ?? -1;
          resolve("exited");
        });
      });
      const portPromise = waitForPort(port).then(() => "ready" as const);
      const outcome = await Promise.race([exitPromise, portPromise]);
      if (outcome === "exited") {
        throw new Error(
          `[mitm] mitmdump for ${serial} exited during startup (code ${earlyExit}). See ${logPath}.`,
        );
      }

      await runScript("setup-mitmproxy.sh", [
        "configure",
        "--serial",
        serial,
        "--port",
        String(port),
      ]);

      instances.push({ serial, port, controlPort, pid: child.pid, harPath, logPath });
      log.info(
        `[mitm] ${serial} → proxy:${port} control:${controlPort} ` +
          `(pid ${child.pid}, har ${harPath}, log ${logPath})`,
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
