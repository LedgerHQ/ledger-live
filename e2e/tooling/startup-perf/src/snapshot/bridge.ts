// The test side of the E2E bridge that apps/ledger-live-mobile/src/e2e/bridge/client.ts connects to,
// as e2e/mobile/bridge/server.ts runs it: enough to send a message and wait for the app's ACK.
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { once } from "node:events";
import type { IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";
import { WebSocketServer, type WebSocket } from "ws";

export interface Bridge {
  port: number;
  /** The app's `wsToken` launch argument: the bridge refuses a connection without it. */
  token: string;
  waitForApp(timeoutMs: number): Promise<void>;
  /** Resolves once the app acknowledged the message, which it does after handling it. */
  send(type: string, payload: string, timeoutMs: number): Promise<void>;
  close(): Promise<void>;
}

function hasToken(url: string | undefined, token: string): boolean {
  const received = Buffer.from(
    new URL(url ?? "/", "ws://localhost").searchParams.get("token") ?? "",
  );
  const expected = Buffer.from(token);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

function ackId(data: string): string | null {
  try {
    const message = JSON.parse(data) as { type?: unknown; id?: unknown };
    return message.type === "ACK" && typeof message.id === "string" ? message.id : null;
  } catch {
    return null;
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, what: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${what} within ${timeoutMs} ms`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Listens on the host's loopback: the simulator's localhost, the emulator's 10.0.2.2. */
export async function startBridge(): Promise<Bridge> {
  const token = randomBytes(32).toString("hex");
  const server = new WebSocketServer({
    host: "127.0.0.1",
    port: 0,
    verifyClient: ({ req }: { req: IncomingMessage }) => hasToken(req.url, token),
  });
  await once(server, "listening");
  let app: WebSocket | null = null;
  const waiting = new Set<() => void>();
  const acks = new Map<string, () => void>();

  server.on("connection", socket => {
    app?.terminate();
    app = socket;
    socket.on("message", data => {
      const id = ackId(String(data));
      if (id) acks.get(id)?.();
    });
    socket.on("close", () => {
      if (app === socket) app = null;
    });
    for (const resolve of waiting) resolve();
    waiting.clear();
  });

  return {
    port: (server.address() as AddressInfo).port,
    token,
    waitForApp(timeoutMs) {
      if (app) return Promise.resolve();
      const connected = new Promise<void>(resolve => waiting.add(resolve));
      return withTimeout(connected, timeoutMs, "the app did not connect to the bridge");
    },
    async send(type, payload, timeoutMs) {
      const socket = app;
      if (!socket) throw new Error(`no app connected to the bridge to send ${type} to`);
      const id = randomUUID();
      const acked = new Promise<void>(resolve => acks.set(id, resolve));
      socket.send(JSON.stringify({ type, id, payload }));
      try {
        await withTimeout(acked, timeoutMs, `the app did not acknowledge ${type}`);
      } finally {
        acks.delete(id);
      }
    },
    async close() {
      for (const client of server.clients) client.terminate();
      await new Promise<void>(resolve => server.close(() => resolve()));
    },
  };
}
