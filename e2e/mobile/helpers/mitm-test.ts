import * as net from "net";
import { log } from "detox";

// Minimal TCP client for the mitm addon's control endpoint (see
// e2e/mobile/scripts/mitm-emulator-addon.py). The protocol is one
// newline-terminated JSON message per request; the addon responds with
// a single newline-terminated JSON message and closes.
//
// All sends are best-effort: a missing or unresponsive proxy must never
// fail a test. We log a warning and let the spec continue.

const HOST = "127.0.0.1";
const PORT = Number(process.env.MITM_CONTROL_PORT ?? 8090);
const TIMEOUT_MS = 2_000;

type Action = "start" | "end";

const send = (action: Action, name: string): Promise<void> =>
  new Promise(resolve => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (warn?: string) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (warn) log.warn(`[mitm-per-test] ${action} ${name}: ${warn}`);
      resolve();
    };

    socket.setTimeout(TIMEOUT_MS);
    socket.once("timeout", () => finish("timeout"));
    socket.once("error", err => finish(err.message));

    let buf = "";
    socket.on("data", chunk => {
      buf += chunk.toString();
      if (buf.includes("\n")) finish();
    });

    socket.connect(PORT, HOST, () => {
      socket.write(JSON.stringify({ action, name }) + "\n");
    });
  });

export const startTestCapture = (name: string) => send("start", name);
export const endTestCapture = (name: string) => send("end", name);

export const isPerTestCaptureEnabled = () =>
  process.env.MITM === "1" && Boolean(process.env.MITM_HAR_DIR);
