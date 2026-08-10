import { WebSocketServer, WebSocket } from "ws";
import qrcode from "qrcode-terminal";
import { parseIdentity } from "@devtools/transport";
import { createSessionRegistry } from "./sessionRegistry";
import { getLanIp as defaultGetLanIp } from "./ip";
import { generateToken, isLoopback, validateToken } from "./token";
import { createLogger } from "./log";
import type { Logger, LanIpResolver } from "./types";
import { msg } from "./messages";

export type RelayHubOptions = {
  /** Bind address. Defaults to 0.0.0.0 (all interfaces, including Wi-Fi). */
  host?: string;
  /** Port. Defaults to 9090. */
  port?: number;
  /** Enable token-based auth for non-loopback connections. Defaults to true. Set to false only on trusted networks (e.g. USB localhost). */
  secure?: boolean;
  /** Log per-message events. Defaults to true. Set to false to reduce noise. */
  verbose?: boolean;
  /** Redirect all logs to a file instead of stdout. */
  logFile?: string;
  /** Injectable logger. Defaults to createLogger({ verbose, logFile }). */
  logger?: Logger;
  /** Injectable LAN IP resolver. Defaults to node:os networkInterfaces lookup. */
  getLanIp?: LanIpResolver;
};

/**
 * A pairing broker.
 *
 * Identity rides in the connect URL (no hello frame): a client dials
 * `ws://…/?role=tool&id=web-tools&target=<uid>`. This function is only the
 * socket shell — it accepts connections, forwards each message to its peer, and
 * logs. All pairing state lives in {@link createSessionRegistry}.
 */
export function createRelayHub(options: RelayHubOptions = {}) {
  const host = options.host ?? "0.0.0.0";
  const port = options.port ?? 9090;
  const token = (options.secure ?? true) ? generateToken() : null;
  const {
    log,
    warn,
    trace,
    write,
    close: closeLogger,
  } = options.logger ??
  createLogger({
    verbose: options.verbose,
    logFile: options.logFile,
  });
  const getLanIp = options.getLanIp ?? defaultGetLanIp;

  const registry = createSessionRegistry<WebSocket>();
  const ws = new WebSocketServer({ port, host });

  ws.once("listening", () => {
    const address = ws.address();
    const actualPort = typeof address === "object" && address ? address.port : port;
    const lanIp = getLanIp();
    log(msg.listening(actualPort));
    if (lanIp) {
      const url = token
        ? `ws://${lanIp}:${actualPort}?token=${token}`
        : `ws://${lanIp}:${actualPort}`;
      log(msg.wifiUrl(url) + "\n");
      qrcode.generate(url, { small: true }, (s: string) => write(s));
    } else {
      warn(msg.noWifiIp);
    }
  });

  ws.on("connection", (socket, req) => {
    const remoteAddress = req.socket.remoteAddress;

    if (token && !isLoopback(remoteAddress)) {
      if (!validateToken(req.url, token)) {
        warn(msg.tokenRejected(remoteAddress));
        socket.terminate();
        return;
      }
    }

    const me = parseIdentity(req.url);
    if (!me) {
      warn(msg.invalidIdentity(req.url));
      socket.terminate();
      return;
    }

    const attached = registry.attach(me, socket);
    if (attached.status === "sessionless") {
      warn(msg.sessionless(me.id));
    } else {
      log(msg.attached(attached.role, me.id, attached.descriptor?.uid ?? "unknown"));
      if (attached.paired) log(msg.paired(attached.descriptor?.uid ?? "unknown"));
    }

    const peerRole = me.role === "tool" ? "host" : "tool";
    socket.on("message", (data, isBinary) => {
      const peers = registry.peersOf(socket);
      const kind = isBinary ? "binary" : "text";
      if (peers) {
        for (const peer of peers)
          if (peer && peer.readyState === WebSocket.OPEN) {
            peer.send(data, { binary: isBinary });
            trace(msg.forwarded(me.id, peerRole, kind));
          } else {
            trace(msg.dropped(me.id, kind, peerRole));
          }
      } else {
        trace(msg.dropped(me.id, kind, peerRole));
      }
    });

    socket.on("close", () => {
      const entry = registry.detach(socket);
      if (entry) log(msg.disconnectedPeer(entry.role, me.id, entry.descriptor?.uid ?? "unknown"));
      else log(msg.disconnected(me.id));
      closeLogger();
    });

    socket.on("error", err => warn(msg.socketError(err.message)));
  });

  ws.on("error", err => warn(msg.serverError(err.message)));

  return {
    ws,
    close: (): Promise<void> => {
      return new Promise((resolve, reject) => {
        for (const client of ws.clients) client.terminate();
        ws.close(err => {
          if (err) reject(err);
          else resolve();
        });
      });
    },
  };
}
