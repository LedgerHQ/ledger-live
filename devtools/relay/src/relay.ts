import { WebSocketServer, WebSocket } from "ws";
import { parseIdentity } from "@devtools/transport";
import { createSessionRegistry } from "./sessionRegistry";

export type RelayHubOptions = {
  /** Bind address. Defaults to 127.0.0.1 (localhost). Overriding this may expose the server to the network. */
  host?: string;
  /** Port. Defaults to 9090. */
  port?: number;
};

/**
 *  A pairing broker
 *
 * Identity rides in the connect URL (no hello frame): a client dials
 * `ws://…/?role=tool&id=web-tools&target=desktop`. This function is only the
 * socket shell — it accepts connections, forwards each message to its peer, and
 * logs. All pairing state lives in {@link createSessionRegistry}.
 */

export function createRelayHub(options: RelayHubOptions = {}) {
  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? 9090;

  const registry = createSessionRegistry<WebSocket>();
  const ws = new WebSocketServer({ port: port, host: host });

  ws.once("listening", () => {
    const address = ws.address();
    const actualPort = typeof address === "object" && address ? address.port : port;
    console.log(`[relay] listening on ws://${host}:${actualPort}`);
  });

  ws.on("connection", (socket, req) => {
    const me = parseIdentity(req.url);
    if (!me) {
      console.warn(`[relay] connection without valid identity (url=${req.url}) — closing`);
      socket.terminate();
      return;
    }

    const attached = registry.attach(me, socket);
    if (attached.status === "sessionless") {
      console.warn(`[relay] tool "${me.id}" connected without a target — idle, cannot pair`);
    } else {
      if (attached.evicted)
        console.log(`[relay] evicted previous ${attached.role} of "${attached.hostId}"`);
      console.log(`[relay] ${attached.role} "${me.id}" → "${attached.hostId}"`);
      if (attached.paired) console.log(`[relay] paired tool ⇄ host "${attached.hostId}"`);
    }

    const peerRole = me.role === "tool" ? "host" : "tool";
    socket.on("message", (data, isBinary) => {
      const peer = registry.peerOf(socket);
      if (peer && peer.readyState === WebSocket.OPEN) {
        peer.send(data, { binary: isBinary });
        console.log(`[relay] "${me.id}" → ${peerRole} (${isBinary ? "binary" : "text"})`);
      } else {
        console.log(
          `[relay] "${me.id}" dropped ${isBinary ? "binary" : "text"} — no ${peerRole} connected`,
        );
      }
    });

    socket.on("close", () => {
      const entry = registry.detach(socket);
      if (entry)
        console.log(`[relay] ${entry.role} "${me.id}" disconnected from "${entry.hostId}"`);
      else console.log(`[relay] tool "${me.id}" disconnected`);
    });

    socket.on("error", err => console.error("[relay] socket error:", err.message));
  });

  ws.on("error", err => console.error("[relay] server error:", err.message));

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
