import { execFile } from "node:child_process";
import { randomBytes, timingSafeEqual } from "node:crypto";
import http from "node:http";
import https from "node:https";
import net, { type AddressInfo } from "node:net";
import type { WebSocket as UndiciWebSocket } from "undici";
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

export type SpeculosWebProxy = LocalServer & {
  /** Address that opens the page in a browser: it works once, within 5 minutes. */
  signInUrl: () => string;
};

const accesses = new Map<string, SpeculosScreenAccess>();
const webProxies = new Map<string, SpeculosWebProxy>();
const vncBridges = new Map<string, LocalServer>();

/** Records how to reach the device's screen. A no-op unless `SPECULOS_SCREEN` is on. */
export function registerSpeculosScreen(deviceId: string, access: SpeculosScreenAccess): void {
  if (!getSpeculosScreenMode()) return;
  accesses.set(deviceId, { ...accesses.get(deviceId), ...access });
}

export function forgetSpeculosScreen(deviceId: string): void {
  accesses.delete(deviceId);
  for (const servers of [webProxies, vncBridges]) {
    servers.get(deviceId)?.close();
    servers.delete(deviceId);
  }
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

const SCREEN_PATH = "/__speculos-screen";
const SIGN_IN_PATH = `${SCREEN_PATH}/sign-in`;
const WORKER_PATH = `${SCREEN_PATH}/worker.js`;
const SIGN_IN_TTL_MS = 5 * 60_000;
const KEY_HEADER = "x-speculos-screen-key";

// Hop-by-hop headers, and what the browser sends that is only meant for 127.0.0.1.
const DROPPED_REQUEST_HEADERS = new Set([
  KEY_HEADER,
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

function newSecret(): string {
  return randomBytes(32).toString("base64url");
}

function sameSecret(value: string | undefined, secret: string): boolean {
  const given = Buffer.from(value ?? "");
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// Adds the proxy key to every request of the page, which only this origin's worker can do: unlike
// a cookie, it never reaches another service on 127.0.0.1. Navigations are left alone: any site can
// start one (e.g. a form posting here), so they reach the proxy as the browser made them, keyless.
const WORKER_SOURCE = `const key = new URL(self.location.href).searchParams.get("key");
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.mode === "navigate" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const headers = new Headers(request.headers);
    headers.set("${KEY_HEADER}", key);
    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    return fetch(request.url, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      mode: "same-origin",
      credentials: "omit",
      redirect: "follow",
      signal: request.signal,
    });
  })());
});
`;

function signInPage(key: string): string {
  return `<!doctype html>
<meta charset="utf-8">
<title>Speculos screen</title>
<p id="status">Opening the Speculos screen…</p>
<script>
(async () => {
  const worker = new URL("${WORKER_PATH}?key=${key}", location.href).href;
  const registration = await navigator.serviceWorker.register(worker, { scope: "/" });
  for (let wait = 0; registration.active?.scriptURL !== worker || registration.active.state !== "activated"; wait++) {
    if (wait === 200) throw new Error("its service worker did not start");
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  location.replace("/");
})().catch(error => {
  document.getElementById("status").textContent = "Could not open the Speculos screen: " + error.message;
});
</script>
`;
}

/**
 * Serves the Speculos web page of `target` on a local port, adding the session token that a
 * browser cannot send itself. Responses are streamed as they come, which keeps the page's screen
 * (`/events?stream=true`) live.
 *
 * Any local process can reach the port, and a browser shares its 127.0.0.1 cookies with every port,
 * so requests must carry a key that only this proxy's origin holds: the page that `signInUrl` opens
 * installs a service worker that adds it to each request the Speculos page makes. Only that page
 * (`GET /`), static HTML, loads without the key. The session token never leaves the proxy.
 */
export async function startSpeculosWebProxy(
  target: string,
  token: string,
): Promise<SpeculosWebProxy> {
  const upstream = new URL(target);
  const basePath = upstream.pathname.replace(/\/+$/, "");
  const send = upstream.protocol === "https:" ? https.request : http.request;
  const secret = newSecret();
  const signIns = new Map<string, number>();
  let origin = "";

  const server = http.createServer((req, res) => {
    // Only this page may drive the device: not another site or local page, nor a host name rebound
    // to 127.0.0.1.
    const fetchSite = req.headers["sec-fetch-site"];
    const foreign =
      `http://${req.headers.host}` !== origin ||
      (req.headers.origin !== undefined && req.headers.origin !== origin) ||
      (fetchSite !== undefined && fetchSite !== "same-origin" && fetchSite !== "none");
    if (foreign || !req.url?.startsWith("/")) {
      res.writeHead(403).end();
      return;
    }

    const queryStart = req.url.indexOf("?");
    const path = queryStart === -1 ? req.url : req.url.slice(0, queryStart);
    const query = new URLSearchParams(queryStart === -1 ? "" : req.url.slice(queryStart + 1));
    if (path === SIGN_IN_PATH) {
      const code = query.get("code") ?? "";
      const expiry = signIns.get(code);
      signIns.delete(code);
      if (expiry === undefined || expiry < Date.now()) {
        res.writeHead(403).end();
        return;
      }
      res
        .writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" })
        .end(signInPage(secret));
      return;
    }
    if (path === WORKER_PATH) {
      if (!sameSecret(query.get("key") ?? undefined, secret)) {
        res.writeHead(403).end();
        return;
      }
      res
        .writeHead(200, {
          "content-type": "text/javascript; charset=utf-8",
          "cache-control": "no-store",
          "service-worker-allowed": "/",
        })
        .end(WORKER_SOURCE);
      return;
    }
    // The page arrives as a navigation, which the worker leaves keyless; it holds nothing.
    const page = (req.method === "GET" || req.method === "HEAD") && path === "/";
    const key = req.headers[KEY_HEADER];
    if (!page && !sameSecret(typeof key === "string" ? key : undefined, secret)) {
      res.writeHead(403).end();
      return;
    }

    const upstreamReq = send(
      {
        protocol: upstream.protocol,
        hostname: upstream.hostname,
        port: upstream.port || undefined,
        path: basePath + req.url,
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
    signInUrl: () => {
      const code = newSecret();
      signIns.set(code, Date.now() + SIGN_IN_TTL_MS);
      return `${origin}${SIGN_IN_PATH}?code=${code}`;
    },
    close: () => {
      server.close();
      server.closeAllConnections();
    },
  };
}

/**
 * Relays each VNC connection made to a local port over its own websocket to `url`. The session
 * token goes in the `Authorization` header, as Speculinho documents for VNC apps: noVNC's
 * `speculinho.token.<token>` subprotocol cannot carry a token with `/` or `=`.
 */
export async function startSpeculosVncBridge(url: string, token?: string): Promise<LocalServer> {
  const { WebSocket } = await import("undici");
  const headers: Record<string, string> = token ? { authorization: `Bearer ${token}` } : {};
  const sockets = new Set<net.Socket>();

  const server = net.createServer(socket => {
    let ws: UndiciWebSocket;
    try {
      ws = new WebSocket(url, { protocols: ["binary"], headers });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(
        `[speculosScreen] Could not connect to ${url}: ${token ? reason.replaceAll(token, "<token>") : reason}`,
      );
      socket.destroy();
      return;
    }
    sockets.add(socket);
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

async function startOnce<T extends LocalServer>(
  started: Map<string, T>,
  deviceId: string,
  start: () => Promise<T>,
): Promise<T> {
  let server = started.get(deviceId);
  if (!server) {
    server = await start();
    started.set(deviceId, server);
  }
  return server;
}

async function localWebUrl(
  deviceId: string,
  { url, token }: NonNullable<SpeculosScreenAccess["web"]>,
): Promise<string> {
  if (!token) return `${url}/`;
  const proxy = await startOnce(webProxies, deviceId, () => startSpeculosWebProxy(url, token));
  return proxy.signInUrl();
}

async function localVncPort(deviceId: string, endpoint: SpeculosVncEndpoint): Promise<number> {
  if (endpoint.kind === "tcp") return endpoint.port;
  const bridge = await startOnce(vncBridges, deviceId, () =>
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
