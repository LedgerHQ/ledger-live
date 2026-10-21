// Minimal WebSocket server speaking the E2E bridge protocol (apps/ledger-live-mobile/src/e2e/bridge/client.ts).
// Dependency-free so it runs from a sparse checkout, and it accepts any token so it also works with
// older app builds that connect without one.
import { createServer } from "node:http";
import { createHash, randomUUID } from "node:crypto";

const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

function encodeFrame(text) {
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

function controlFrame(opcode, payload = Buffer.alloc(0)) {
  return Buffer.concat([Buffer.from([0x80 | opcode, payload.length]), payload]);
}

// Parses complete client frames from `buffer`; returns the frames and the unconsumed rest.
function decodeFrames(buffer) {
  const frames = [];
  let offset = 0;
  while (buffer.length - offset >= 2) {
    const b0 = buffer[offset];
    const b1 = buffer[offset + 1];
    let len = b1 & 0x7f;
    let pos = offset + 2;
    if (len === 126) {
      if (buffer.length < pos + 2) break;
      len = buffer.readUInt16BE(pos);
      pos += 2;
    } else if (len === 127) {
      if (buffer.length < pos + 8) break;
      len = Number(buffer.readBigUInt64BE(pos));
      pos += 8;
    }
    const masked = (b1 & 0x80) !== 0;
    const maskLen = masked ? 4 : 0;
    if (buffer.length < pos + maskLen + len) break;
    const mask = masked ? buffer.subarray(pos, pos + 4) : null;
    pos += maskLen;
    const data = Buffer.from(buffer.subarray(pos, pos + len));
    if (mask) for (let i = 0; i < data.length; i++) data[i] ^= mask[i % 4];
    frames.push({ fin: (b0 & 0x80) !== 0, opcode: b0 & 0x0f, data });
    offset = pos + len;
  }
  return { frames, rest: buffer.subarray(offset) };
}

/**
 * Starts the bridge on 127.0.0.1:`port`. The Android emulator reaches it as 10.0.2.2, the iOS
 * simulator as localhost. One client at a time: a new connection replaces the previous one.
 */
export function startBridge(port = 8099, log = () => {}) {
  let socket = null;
  let waiters = [];
  const received = [];

  const server = createServer((_req, res) => {
    res.writeHead(426).end();
  });

  server.on("upgrade", (req, sock) => {
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

    let pending = Buffer.alloc(0);
    let fragments = [];
    sock.on("data", chunk => {
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

  const listening = new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });

  return {
    listening,
    received,
    waitForClient(timeoutMs) {
      if (socket) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error(`no app connected to the bridge within ${timeoutMs} ms`)),
          timeoutMs,
        );
        waiters.push(() => {
          clearTimeout(timer);
          resolve();
        });
      });
    },
    send(type, payload) {
      if (!socket) throw new Error(`bridge: no client to send ${type} to`);
      const message = { type, id: randomUUID() };
      if (payload !== undefined) message.payload = payload;
      socket.write(encodeFrame(JSON.stringify(message)));
    },
    close() {
      socket?.destroy();
      socket = null;
      return new Promise(resolve => server.close(() => resolve()));
    },
  };
}
