import WebSocket from "ws";
import { log } from "@ledgerhq/logs";
import type { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import type { WsProxyDeviceInfo, WsServerMessage } from "@ledgerhq/live-dmk-ws-proxy-shared";

export function sendToClient(ws: WebSocket, msg: WsServerMessage): boolean {
  if (ws.readyState !== WebSocket.OPEN) {
    return false;
  }

  try {
    ws.send(JSON.stringify(msg));
    return true;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    log("proxy", `WS send failed (${msg.type}): ${errMsg}`);
    return false;
  }
}

export function broadcastToClients(clients: Set<WebSocket>, msg: WsServerMessage): void {
  for (const ws of clients) {
    sendToClient(ws, msg);
  }
}

export function mapDiscoveredDeviceToWsProxyDeviceInfo(
  device: DiscoveredDevice,
): WsProxyDeviceInfo {
  return {
    id: device.id,
    deviceModel: {
      id: device.deviceModel.model,
      productName: device.deviceModel.name,
    },
  };
}
