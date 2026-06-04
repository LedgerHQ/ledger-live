/**
 * Minimal Detox <-> Ledger Live Mobile bridge (server side).
 *
 * Counterpart lives in `apps/ledger-live-mobile/e2e/bridge/client.ts`
 * (compiled into the app when Config.DETOX=1). The app dials this socket
 * on boot, then this side pushes typed messages that the client dispatches
 * straight into the Redux store.
 *
 * Why: Detox is UI-only. The bridge lets us seed state, override feature
 * flags, and inject mock device events without driving the onboarding UI.
 */
import net from "node:net";
import { WebSocketServer, WebSocket } from "ws";

type Message =
  | { type: "acceptTerms" }
  | { type: "importSettings"; payload: Record<string, unknown> }
  | { type: "importAccounts"; payload: unknown[] }
  | { type: "navigate"; payload: string }
  | { type: "overrideFeatureFlag"; payload: { id: string; value: unknown } };

const state: { wss?: WebSocketServer; ws?: WebSocket } = {};
let counter = 0;

/** Pick a random unused TCP port. Each Jest worker gets its own. */
export function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, () => {
      const port = (srv.address() as net.AddressInfo).port;
      srv.close(() => resolve(port));
    });
  });
}

/** Open the bridge socket. Call once per `device.launchApp()`. */
export function init(port: number): void {
  state.wss = new WebSocketServer({ port });
  state.wss.on("connection", ws => {
    state.ws = ws;
  });
}

/** Close the bridge. Safe to call when nothing is open. */
export function close(): void {
  state.ws?.close();
  state.wss?.close();
  state.ws = undefined;
  state.wss = undefined;
}

/** Wait until the app has dialed back in. */
async function waitForClient(timeoutMs = 15_000): Promise<void> {
  const start = Date.now();
  while (state.ws?.readyState !== WebSocket.OPEN) {
    if (Date.now() - start > timeoutMs) {
      throw new Error("[bridge] app did not connect — is Config.DETOX set in the build?");
    }
    await new Promise(r => setTimeout(r, 50));
  }
}

/** Send one message and await delivery. Adds an auto-incrementing id. */
export async function send(message: Message): Promise<void> {
  await waitForClient();
  state.ws!.send(JSON.stringify({ id: String(++counter), ...message }));
}
