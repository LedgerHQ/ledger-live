import { WebSocketServer } from "ws";
import type { ProxyRuntimeContext } from "./createProxyContext";
import { setupProxyClientLifecycle } from "./setupProxyClientLifecycle";
import { setupProxyServerStartupLogging } from "./setupProxyServerStartupLogging";

export const createProxyServer = (runtimeContext: ProxyRuntimeContext): WebSocketServer => {
  const wsPort = Number(runtimeContext.resolvedPort);

  if (!Number.isInteger(wsPort) || wsPort <= 0) {
    throw new Error(`Invalid port: ${runtimeContext.resolvedPort}`);
  }

  const wss = new WebSocketServer({ port: wsPort });
  setupProxyClientLifecycle({ wss, runtimeContext });
  setupProxyServerStartupLogging({ wss, runtimeContext });

  return wss;
};
