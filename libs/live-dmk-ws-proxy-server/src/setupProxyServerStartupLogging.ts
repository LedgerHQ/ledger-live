import { log } from "@ledgerhq/logs";
import type { WebSocketServer } from "ws";
import type { ProxyRuntimeContext } from "./createProxyContext";
import { listProxyUrls } from "./listProxyUrls";

type SetupProxyServerStartupLoggingParams = {
  wss: WebSocketServer;
  runtimeContext: ProxyRuntimeContext;
};

export const setupProxyServerStartupLogging = ({
  wss,
  runtimeContext,
}: SetupProxyServerStartupLoggingParams): void => {
  const proxyUrls = listProxyUrls(runtimeContext.resolvedPort);
  for (const url of proxyUrls) {
    log("proxy", `DEVICE_PROXY_URL=${url}`);
  }

  const logStartup = () => {
    const discoveredDevices = runtimeContext.getDiscoveredDevices();
    const deviceInfo =
      discoveredDevices.length > 0
        ? discoveredDevices.map(d => `${d.deviceModel.name} (${d.id.slice(0, 8)})`).join(", ")
        : "waiting for devices...";
    const startupHost = proxyUrls[1]?.replace(/^ws:\/\//, "").split(":")[0] ?? "localhost";
    log("proxy", `\nProxy started on ${startupHost} — ${deviceInfo}\n`);
  };

  if (wss.address()) {
    logStartup();
    return;
  }

  wss.once("listening", logStartup);
};
