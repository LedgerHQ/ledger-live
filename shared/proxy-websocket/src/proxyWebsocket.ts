import { HttpsProxyAgent } from "https-proxy-agent";
import WebSocket from "ws";

export type ProxyEnvironment = Readonly<Record<string, string | undefined>>;

export type ProxyAwareWebSocket = {
  send(data: string): void;
  close(): void;
  addEventListener(type: "open", listener: () => void): void;
  addEventListener(type: "message", listener: (event: { data: unknown }) => void): void;
  addEventListener(type: "error" | "close", listener: () => void): void;
};

type WebSocketConstructor = (url: string, options: WebSocket.ClientOptions) => ProxyAwareWebSocket;

const proxyVariableNames = {
  wss: ["https_proxy", "HTTPS_PROXY", "http_proxy", "HTTP_PROXY", "all_proxy", "ALL_PROXY"],
  ws: ["http_proxy", "HTTP_PROXY", "https_proxy", "HTTPS_PROXY", "all_proxy", "ALL_PROXY"],
} as const;

function environmentValue(
  environment: ProxyEnvironment,
  names: readonly string[],
): string | undefined {
  return names
    .map(name => environment[name]?.trim())
    .find((value): value is string => Boolean(value));
}

function targetPort(url: URL): string {
  if (url.port) return url.port;
  return url.protocol === "wss:" ? "443" : "80";
}

function excludesHost(noProxy: string, target: URL): boolean {
  const hostname = target.hostname.toLowerCase();
  const port = targetPort(target);

  return noProxy.split(/[\s,]+/).some(entry => {
    if (!entry) return false;
    if (entry === "*") return true;

    const match = /^(.+?)(?::(\d+))?$/.exec(entry);
    if (!match) return false;
    const [, rawHost, entryPort] = match;
    if (entryPort && entryPort !== port) return false;

    const host = rawHost.toLowerCase();
    if (host.startsWith("*")) return hostname.endsWith(host.slice(1));
    if (host.startsWith(".")) return hostname.endsWith(host);
    return hostname === host;
  });
}

export function resolveProxy(
  url: string,
  environment: ProxyEnvironment = process.env,
): string | undefined {
  const target = new URL(url);
  const noProxy = environmentValue(environment, ["no_proxy", "NO_PROXY"]);
  if (noProxy && excludesHost(noProxy, target)) return undefined;

  const names = proxyVariableNames[target.protocol === "wss:" ? "wss" : "ws"];
  return environmentValue(environment, names);
}

export function createProxyAwareWebSocketFactory(
  input: {
    environment?: ProxyEnvironment;
    createWebSocket?: WebSocketConstructor;
  } = {},
): (url: string) => ProxyAwareWebSocket {
  const {
    environment = process.env,
    createWebSocket = (url, options) => new WebSocket(url, options),
  } = input;

  return url => {
    const proxy = resolveProxy(url, environment);
    return createWebSocket(url, proxy ? { agent: new HttpsProxyAgent(proxy) } : {});
  };
}
