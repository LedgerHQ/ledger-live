import { WebSocket } from "ws";
import type {
  Device,
  RetrieveConnectedDevicesMessages,
} from "@devtools/protocols/retrieve-connected-devices";
import { encodeMessage } from "@devtools/transport";

export function createToolManager() {
  const tools = new Set<WebSocket>();
  const hosts = new Map<string, Device>();

  const kind: keyof RetrieveConnectedDevicesMessages = "RetrieveConnectedDevicesMessages:devices";

  function getDevices() {
    return [...hosts.values()];
  }

  function sendTo(ws: WebSocket, payload: Device[]) {
    if (ws.readyState === WebSocket.OPEN)
      ws.send(
        encodeMessage<RetrieveConnectedDevicesMessages, typeof kind>("relay", -1, kind, payload),
      );
  }

  function sendDevicesTo(ws: WebSocket) {
    const payload = getDevices();
    sendTo(ws, payload);
  }

  function sendDevicesToAll() {
    const payload = getDevices();
    for (const tool of tools) sendTo(tool, payload);
  }

  return {
    addHost: (uid: string, device: Device) => {
      hosts.set(uid, device);
    },
    removeHost: (uid: string) => {
      hosts.delete(uid);
    },
    addTool: (ws: WebSocket) => {
      tools.add(ws);
    },
    removeTool: (ws: WebSocket) => {
      tools.delete(ws);
    },
    sendDevicesToAll,
    sendDevicesTo,
    getDevices,
  };
}
