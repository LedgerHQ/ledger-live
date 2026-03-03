import WebSocket, { WebSocketServer } from "ws";
import { log } from "@ledgerhq/logs";
import type { WsClientMessage } from "@ledgerhq/live-dmk-ws-proxy-shared";
import { sendToClient, mapDiscoveredDeviceToWsProxyDeviceInfo } from "./messaging";
import { ProxyClientSessionHandler } from "./proxyClientSessionHandler";
import type { ProxyRuntimeContext } from "./createProxyContext";

type WireProxyClientLifecycleParams = {
  runtimeContext: ProxyRuntimeContext;
  wss: WebSocketServer;
};

const buildWsDisconnectBanner = (closeCode: number | string, closeReason: string): string =>
  [
    "",
    "============================================================",
    "WS CLIENT DISCONNECTED - ACTION REQUIRED",
    `close code: ${closeCode} | reason: ${closeReason}`,
    "LWM reconnect steps:",
    "1) Restart Ledger Wallet Mobile, OR",
    "2) In app: Settings > Debug > Connectivity, clear/reset the WS URL and set it again.",
    "Then go back to Select Device / My Ledger and select your Ledger again.",
    "============================================================",
    "",
  ].join("\n");

export const setupProxyClientLifecycle = ({
  runtimeContext,
  wss,
}: WireProxyClientLifecycleParams): void => {
  wss.on("connection", (ws: WebSocket) => {
    const sessionHandler = new ProxyClientSessionHandler(
      runtimeContext.dmk,
      runtimeContext.getDiscoveredDevices,
      ws,
      sendToClient,
    );
    runtimeContext.clients.add(ws);
    log("proxy", `WS client connected (${runtimeContext.clients.size} total)`);

    sendToClient(ws, {
      type: "discovered-devices-updated",
      discoveredDevices: runtimeContext
        .getDiscoveredDevices()
        .map(mapDiscoveredDeviceToWsProxyDeviceInfo),
    });

    ws.on("message", async (rawData: WebSocket.RawData) => {
      let msg: WsClientMessage;
      try {
        msg = JSON.parse(rawData.toString());
      } catch {
        sendToClient(ws, { type: "error", message: "Invalid JSON" });
        return;
      }

      switch (msg.type) {
        case "connect":
          await sessionHandler.handleConnect(msg.deviceId, msg.requestId);
          break;
        case "send-apdu": {
          const abortTimeoutMs =
            "abortTimeoutMs" in msg && typeof msg.abortTimeoutMs === "number"
              ? msg.abortTimeoutMs
              : undefined;
          await sessionHandler.handleSendApdu(
            msg.deviceId,
            msg.requestId,
            msg.data,
            abortTimeoutMs,
          );
          break;
        }
        case "disconnect":
          await sessionHandler.handleDisconnect(msg.deviceId);
          break;
      }
    });

    ws.on("close", (code?: number, reason?: Buffer) => {
      void sessionHandler.handleDisconnect();
      runtimeContext.clients.delete(ws);
      const closeCode = typeof code === "number" ? code : "unknown";
      const closeReason = reason?.toString() || "<empty>";
      log(
        "proxy",
        `WS client disconnected (code=${closeCode}, reason=${closeReason}, ${runtimeContext.clients.size} total)`,
      );
      log("proxy", buildWsDisconnectBanner(closeCode, closeReason));
    });
  });
};
