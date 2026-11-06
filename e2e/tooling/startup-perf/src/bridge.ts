// Minimal WebSocket server speaking the E2E bridge protocol (apps/ledger-live-mobile/src/e2e/bridge/client.ts).
// Dependency-free so it runs from a sparse checkout; it accepts any token.
import { createServer } from "node:http";
import { createHash, randomUUID } from "node:crypto";
import type { Duplex } from "node:stream";

const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const REPLY_POLL_MS = 200;

interface Frame {
  fin: boolean;
  opcode: number;
  data: Buffer;
}

/** A message from the app; `raw` holds one that was not JSON. */
export interface BridgeMessage {
  type?: string;
  id?: string;
  payload?: unknown;
  raw?: string;
}

export function encodeFrame(text: string): Buffer {
  const payload = Buffer.from(text, "utf8");
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.from([0x81, len]);
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}

/** The payload length and where the mask or payload starts; null until the header is complete. */
function frameHeader(buffer: Buffer, offset: number): { len: number; pos: number } | null {
  const len = buffer[offset + 1] & 0x7f;
  const pos = offset + 2;
  if (len === 126) {
    return buffer.length < pos + 2 ? null : { len: buffer.readUInt16BE(pos), pos: pos + 2 };
  }
  if (len === 127) {
    return buffer.length < pos + 8
      ? null
      : { len: Number(buffer.readBigUInt64BE(pos)), pos: pos + 8 };
  }
  return { len, pos };
}

function unmask(data: Buffer, mask: Buffer): void {
  for (let i = 0; i < data.length; i++) data[i] ^= mask[i % 4];
}

function controlFrame(opcode: number, payload: Buffer = Buffer.alloc(0)): Buffer {
  return Buffer.concat([Buffer.from([0x80 | opcode, payload.length]), payload]);
}

// Parses complete client frames from `buffer`; returns the frames and the unconsumed rest.
export function decodeFrames(buffer: Buffer): { frames: Frame[]; rest: Buffer } {
  const frames: Frame[] = [];
  let offset = 0;
  while (buffer.length - offset >= 2) {
    const header = frameHeader(buffer, offset);
    if (!header) break;
    const masked = (buffer[offset + 1] & 0x80) !== 0;
    const start = header.pos + (masked ? 4 : 0);
    if (buffer.length < start + header.len) break;
    const data = Buffer.from(buffer.subarray(start, start + header.len));
    if (masked) unmask(data, buffer.subarray(header.pos, start));
    frames.push({ fin: (buffer[offset] & 0x80) !== 0, opcode: buffer[offset] & 0x0f, data });
    offset = start + header.len;
  }
  return { frames, rest: buffer.subarray(offset) };
}

export type Bridge = ReturnType<typeof startBridge>;

/**
 * Starts the bridge on 127.0.0.1:`port`. The Android emulator reaches it as 10.0.2.2, the iOS
 * simulator as localhost. One client at a time: a new connection replaces the previous one.
 */
export function startBridge(port = 8099, log: (message: string) => void = () => {}) {
  let socket: Duplex | null = null;
  let waiters: Array<() => void> = [];
  const received: BridgeMessage[] = [];

  const server = createServer((_req, res) => {
    res.writeHead(426).end();
  });

  server.on("upgrade", (req, sock: Duplex) => {
    const key = req.headers["sec-websocket-key"];
    if (!key) {
      sock.destroy();
      return;
    }
    const accept = createHash("sha1")
      .update(key + WS_GUID)
      .digest("base64");
    sock.write(
      "HTTP/1.1 101 Switching Protocols\r\n" +
        "Upgrade: websocket\r\n" +
        "Connection: Upgrade\r\n" +
        `Sec-WebSocket-Accept: ${accept}\r\n\r\n`,
    );
    socket?.destroy();
    socket = sock;
    log("client connected");

    let pending: Buffer = Buffer.alloc(0);
    let fragments: Buffer[] = [];
    sock.on("data", (chunk: Buffer) => {
      const { frames, rest } = decodeFrames(Buffer.concat([pending, chunk]));
      pending = rest;
      for (const frame of frames) {
        if (frame.opcode === 0x8) {
          sock.end(controlFrame(0x8));
        } else if (frame.opcode === 0x9) {
          sock.write(controlFrame(0xa, frame.data));
        } else if (frame.opcode === 0x1 || frame.opcode === 0x0) {
          fragments.push(frame.data);
          if (frame.fin) {
            const text = Buffer.concat(fragments).toString("utf8");
            fragments = [];
            try {
              received.push(JSON.parse(text));
            } catch {
              received.push({ raw: text });
            }
          }
        }
      }
    });
    sock.on("close", () => {
      if (socket === sock) socket = null;
      log("client disconnected");
    });
    sock.on("error", () => {});

    const ready = waiters;
    waiters = [];
    ready.forEach(resolve => resolve());
  });

  const listening = new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve());
  });

  return {
    listening,
    received,
    waitForClient(timeoutMs: number): Promise<void> {
      if (socket) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const waiter = () => {
          clearTimeout(timer);
          resolve();
        };
        const timer = setTimeout(() => {
          waiters = waiters.filter(w => w !== waiter);
          reject(new Error(`no app connected to the bridge within ${timeoutMs} ms`));
        }, timeoutMs);
        waiters.push(waiter);
      });
    },
    send(type: string, payload?: unknown): string {
      if (!socket) throw new Error(`bridge: no client to send ${type} to`);
      const message: { type: string; id: string; payload?: unknown } = { type, id: randomUUID() };
      if (payload !== undefined) message.payload = payload;
      socket.write(encodeFrame(JSON.stringify(message)));
      return message.id;
    },
    // The app's reply of this type to message `id`: "ACK" once its handler is done (a handler that
    // throws sends none), or e.g. "appEnvs" for getEnvs.
    async waitFor({
      id,
      type,
      timeoutMs,
    }: {
      id: string;
      type: string;
      timeoutMs: number;
    }): Promise<BridgeMessage> {
      const deadline = Date.now() + timeoutMs;
      for (;;) {
        const reply = received.find(m => m.id === id && m.type === type);
        if (reply) return reply;
        if (Date.now() > deadline)
          throw new Error(`bridge: no ${type} for ${id} within ${timeoutMs} ms`);
        await new Promise(resolve => setTimeout(resolve, REPLY_POLL_MS));
      }
    },
    close(): Promise<void> {
      socket?.destroy();
      socket = null;
      return new Promise(resolve => server.close(() => resolve()));
    },
  };
}
