import { execFile } from "node:child_process";
import http from "node:http";
import https from "node:https";
import net, { type AddressInfo } from "node:net";
import { sanitizeError } from "./index";

export type SpeculosScreenMode = "web" | "vnc";

let warnedUnknownMode = false;

/**
 * Live view of the device screen for local runs: `SPECULOS_SCREEN=web` opens the Speculos web page
 * of the Speculos the app talks to, `SPECULOS_SCREEN=vnc` a VNC viewer. Ignored in CI, where nobody
 * watches and each VNC viewer holds one of the 4 slots of a Speculinho session.
 */
export function getSpeculosScreenMode(): SpeculosScreenMode | undefined {
  const mode = process.env.SPECULOS_SCREEN?.trim().toLowerCase();
  if (!mode || process.env.CI) return undefined;
  if (mode === "web" || mode === "vnc") return mode;
  if (!warnedUnknownMode) {
    warnedUnknownMode = true;
    console.warn(`[speculosScreen] Ignoring SPECULOS_SCREEN=${mode}: use web or vnc`);
  }
  return undefined;
}

export type SpeculosVncEndpoint =
  /** Local Docker Speculos: its VNC server, mapped to a host port. */
  | { kind: "tcp"; port: number; password: string }
  /** Speculinho: the session gate's websocket, which VNC apps cannot open themselves. */
  | { kind: "websocket"; url: string; password: string; token?: string };

export type SpeculosScreenAccess = {
  /** Speculos API root, which serves the web page. Speculinho wants the session token on each request. */
  web?: { url: string; token?: string };
  vnc?: SpeculosVncEndpoint;
};

type LocalServer = { port: number; close: () => void };

const accesses = new Map<string, SpeculosScreenAccess>();
const servers = new Map<string, LocalServer>();

/** Records how to reach the device's screen. A no-op unless `SPECULOS_SCREEN` is on. */
export function registerSpeculosScreen(deviceId: string, access: SpeculosScreenAccess): void {
  if (!getSpeculosScreenMode()) return;
  accesses.set(deviceId, { ...accesses.get(deviceId), ...access });
}

export function forgetSpeculosScreen(deviceId: string): void {
  accesses.delete(deviceId);
  servers.get(deviceId)?.close();
  servers.delete(deviceId);
}

async function listenLocally(server: net.Server): Promise<number> {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  // A page or viewer left open must not keep the test process alive.
  server.unref();
  return (server.address() as AddressInfo).port;
}

// Hop-by-hop headers, and what the browser sends that is only meant for 127.0.0.1.
const DROPPED_REQUEST_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-connection",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "cookie",
  "origin",
  "referer",
]);
const DROPPED_RESPONSE_HEADERS = new Set(["connection", "keep-alive", "transfer-encoding"]);

function withoutHeaders(
  headers: http.IncomingHttpHeaders,
  dropped: Set<string>,
): http.OutgoingHttpHeaders {
  return Object.fromEntries(Object.entries(headers).filter(([name]) => !dropped.has(name)));
}

/**
 * Serves the Speculos web page of `target` on a local port, adding the session token that a
 * browser cannot send itself. Responses are streamed as they come, which keeps the page's screen
 * (`/events?stream=true`) live.
 */
export async function startSpeculosWebProxy(target: string, token: string): Promise<LocalServer> {
  const upstream = new URL(target);
  const send = upstream.protocol === "https:" ? https.request : http.request;
  let origin = "";

  const server = http.createServer((req, res) => {
    // Only this page may drive the device: not another site, nor a host name rebound to 127.0.0.1.
    const foreign =
      `http://${req.headers.host}` !== origin ||
      (req.headers.origin !== undefined && req.headers.origin !== origin);
    if (foreign || !req.url?.startsWith("/")) {
      res.writeHead(403).end();
      return;
    }

    const upstreamReq = send(
      {
        protocol: upstream.protocol,
        hostname: upstream.hostname,
        port: upstream.port || undefined,
        path: req.url,
        method: req.method,
        headers: {
          ...withoutHeaders(req.headers, DROPPED_REQUEST_HEADERS),
          host: upstream.host,
          authorization: `Bearer ${token}`,
        },
      },
      upstreamRes => {
        res.writeHead(
          upstreamRes.statusCode ?? 502,
          withoutHeaders(upstreamRes.headers, DROPPED_RESPONSE_HEADERS),
        );
        upstreamRes.on("error", () => res.destroy());
        upstreamRes.pipe(res);
      },
    );
    upstreamReq.on("error", () => {
      if (!res.headersSent) res.writeHead(502);
      res.end();
    });
    // A closed tab ends its event stream upstream too.
    res.on("close", () => {
      if (!res.writableFinished) upstreamReq.destroy();
    });
    req.pipe(upstreamReq);
  });

  const port = await listenLocally(server);
  origin = `http://127.0.0.1:${port}`;
  return {
    port,
    close: () => {
      server.close();
      server.closeAllConnections();
    },
  };
}

/**
 * Relays each VNC connection made to a local port over its own websocket to `url`. The session
 * token rides as a subprotocol, as Speculinho documents for noVNC.
 */
export async function startSpeculosVncBridge(url: string, token?: string): Promise<LocalServer> {
  const protocols = ["binary", ...(token ? [`speculinho.token.${token}`] : [])];
  const sockets = new Set<net.Socket>();

  const server = net.createServer(socket => {
    sockets.add(socket);
    const ws = new WebSocket(url, protocols);
    ws.binaryType = "arraybuffer";
    const pending: Uint8Array<ArrayBuffer>[] = [];

    socket.on("data", (chunk: Buffer) => {
      const bytes = new Uint8Array(chunk);
      if (ws.readyState === WebSocket.OPEN) ws.send(bytes);
      else pending.push(bytes);
    });
    socket.on("error", () => socket.destroy());
    socket.on("close", () => {
      sockets.delete(socket);
      ws.close();
    });
    ws.onopen = () => {
      for (const chunk of pending.splice(0)) ws.send(chunk);
    };
    ws.onmessage = event => socket.write(Buffer.from(event.data as ArrayBuffer));
    ws.onerror = () => socket.destroy();
    ws.onclose = () => socket.destroy();
  });

  const port = await listenLocally(server);
  return {
    port,
    close: () => {
      server.close();
      for (const socket of sockets) socket.destroy();
    },
  };
}

async function localServer(
  deviceId: string,
  start: () => Promise<LocalServer>,
): Promise<LocalServer> {
  let server = servers.get(deviceId);
  if (!server) {
    server = await start();
    servers.set(deviceId, server);
  }
  return server;
}

async function localWebUrl(
  deviceId: string,
  { url, token }: NonNullable<SpeculosScreenAccess["web"]>,
): Promise<string> {
  if (!token) return `${url}/`;
  const proxy = await localServer(deviceId, () => startSpeculosWebProxy(url, token));
  return `http://127.0.0.1:${proxy.port}/`;
}

async function localVncPort(deviceId: string, endpoint: SpeculosVncEndpoint): Promise<number> {
  if (endpoint.kind === "tcp") return endpoint.port;
  const bridge = await localServer(deviceId, () =>
    startSpeculosVncBridge(endpoint.url, endpoint.token),
  );
  return bridge.port;
}

const MACOS_OPEN = "/usr/bin/open";
const BROWSER_OPENERS: Partial<Record<NodeJS.Platform, string>> = {
  darwin: MACOS_OPEN,
  linux: "/usr/bin/xdg-open",
};

function openWebPage(deviceId: string, url: string): void {
  console.warn(`[speculosScreen] Showing the screen of ${deviceId} at ${url}`);
  const opener = BROWSER_OPENERS[process.platform];
  if (!opener) return;
  execFile(opener, [url], error => {
    if (error) {
      console.warn(`[speculosScreen] Could not open a browser, go to ${url}: ${error.message}`);
    }
  });
}

function openVncViewer(deviceId: string, port: number, password: string): void {
  const address = `vnc://127.0.0.1:${port}`;
  if (process.platform !== "darwin") {
    console.warn(`[speculosScreen] Screen of ${deviceId}: ${address} (password ${password})`);
    return;
  }
  // macOS Screen Sharing logs in with the password from the URL.
  execFile(MACOS_OPEN, [`vnc://:${encodeURIComponent(password)}@127.0.0.1:${port}`], error => {
    if (error) {
      console.warn(
        `[speculosScreen] Could not open a viewer, connect to ${address} (password ${password}): ${error.message}`,
      );
    }
  });
  console.warn(`[speculosScreen] Showing the screen of ${deviceId} at ${address}`);
}

/** Shows the device's screen the way `SPECULOS_SCREEN` asks, if it does. Never throws. */
export async function showSpeculosScreen(deviceId: string): Promise<void> {
  const mode = getSpeculosScreenMode();
  if (!mode) return;
  const access = accesses.get(deviceId);
  try {
    if (mode === "web" && access?.web) {
      openWebPage(deviceId, await localWebUrl(deviceId, access.web));
    } else if (mode === "vnc" && access?.vnc) {
      openVncViewer(deviceId, await localVncPort(deviceId, access.vnc), access.vnc.password);
    } else {
      console.warn(`[speculosScreen] No ${mode} access to ${deviceId}; see the warnings above`);
    }
  } catch (error) {
    console.warn(
      `[speculosScreen] Could not show the screen of ${deviceId}:`,
      sanitizeError(error),
    );
  }
}
