import * as net from "net";
import * as path from "path";
import { promises as fs } from "fs";
import { log } from "detox";
import { sanitizeError } from "@ledgerhq/live-common/e2e/index";
import type { MitmInstance } from "./mitm";

// Per-test capture client. Talks to the mitm addon's TCP control
// endpoint (one per spawned mitmdump — see e2e/mobile/helpers/mitm.ts
// and e2e/mobile/scripts/mitm-emulator-addon.py).
//
// Each Jest worker is statically paired with one mitmdump instance:
//   worker 1 (JEST_WORKER_ID=1) -> instances[0] -> emulator-5554
//   worker 2 (JEST_WORKER_ID=2) -> instances[1] -> emulator-5556
//   worker 3 (JEST_WORKER_ID=3) -> instances[2] -> emulator-5558
//
// Worker IDs are issued in 1..N order by Jest, and helpers/mitm.ts
// writes the pidfile in the same order the boot script booted them
// (and the same order `${targetConfig.device}${workerId}` in
// jest.environment.ts assigns devices). Drift would just mis-tag HARs,
// not break captures: each worker still talks to *some* live mitmdump.

const PID_FILE = path.resolve(__dirname, "..", "artifacts", "mitm.pid");
const HOST = "127.0.0.1";
const TIMEOUT_MS = 3_000;

type EndResponse = {
  harPath?: string;
  flowCount: number;
};

// Cached for the lifetime of this worker process — the pidfile doesn't
// change between tests within a Jest run.
let cachedInstance: MitmInstance | null | undefined;

const resolveInstance = async (): Promise<MitmInstance | null> => {
  if (cachedInstance !== undefined) return cachedInstance;

  try {
    const raw = (await fs.readFile(PID_FILE, "utf-8")).trim();
    if (!raw) {
      cachedInstance = null;
      return null;
    }
    const instances = JSON.parse(raw) as MitmInstance[];
    const workerId = Number(process.env.JEST_WORKER_ID ?? "1");
    const idx = Math.max(0, workerId - 1);
    const instance = instances[idx];
    if (!instance) {
      log.warn(
        `[mitm-per-test] no instance at index ${idx} (worker ${workerId}, pidfile has ${instances.length} entries)`,
      );
      cachedInstance = null;
      return null;
    }
    cachedInstance = instance;
    log.info(
      `[mitm-per-test] worker ${workerId} → ${instance.serial} (control :${instance.controlPort})`,
    );
    return instance;
  } catch (err) {
    log.warn(`[mitm-per-test] could not load pidfile:`, sanitizeError(err as Error));
    cachedInstance = null;
    return null;
  }
};

type Action = "start" | "end";

const send = (
  controlPort: number,
  action: Action,
  name: string,
): Promise<EndResponse | null> =>
  new Promise(resolve => {
    const socket = new net.Socket();
    let settled = false;
    let buf = "";

    const finish = (result: EndResponse | null, warn?: string) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (warn) log.warn(`[mitm-per-test] ${action} "${name}": ${warn}`);
      resolve(result);
    };

    socket.setTimeout(TIMEOUT_MS);
    socket.once("timeout", () => finish(null, "timeout"));
    socket.once("error", err => finish(null, err.message));

    socket.on("data", chunk => {
      buf += chunk.toString();
      const newline = buf.indexOf("\n");
      if (newline < 0) return;
      const line = buf.slice(0, newline);
      try {
        const msg = JSON.parse(line);
        if (msg.status !== "ok") {
          finish(null, `addon error: ${msg.error ?? "unknown"}`);
          return;
        }
        finish({
          harPath: msg.path,
          flowCount: typeof msg.flowCount === "number" ? msg.flowCount : 0,
        });
      } catch (parseErr) {
        finish(null, `malformed response: ${(parseErr as Error).message}`);
      }
    });

    socket.connect(controlPort, HOST, () => {
      socket.write(JSON.stringify({ action, name }) + "\n");
    });
  });

export const isPerTestCaptureEnabled = (): boolean => process.env.MITM === "1";

export const startTestCapture = async (name: string): Promise<void> => {
  if (!isPerTestCaptureEnabled()) return;
  const instance = await resolveInstance();
  if (!instance) return;
  await send(instance.controlPort, "start", name);
};

export const endTestCapture = async (name: string): Promise<EndResponse> => {
  if (!isPerTestCaptureEnabled()) return { flowCount: 0 };
  const instance = await resolveInstance();
  if (!instance) return { flowCount: 0 };
  return (await send(instance.controlPort, "end", name)) ?? { flowCount: 0 };
};
