import type { DeviceId } from "@ledgerhq/device-management-kit";
import type {
  WsClientConnectMessage,
  WsClientDisconnectMessage,
  WsClientSendApduMessage,
  WsServerMessage,
} from "@ledgerhq/live-dmk-ws-proxy-shared";

const toRawMessage = (data: unknown): string | null => {
  if (typeof data === "string") {
    return data;
  }

  if (data && typeof data === "object" && typeof data.toString === "function") {
    return data.toString();
  }

  return null;
};

export const parseServerMessage = (data: unknown): WsServerMessage | null => {
  const rawMessage = toRawMessage(data);
  if (!rawMessage) {
    return null;
  }

  try {
    return JSON.parse(rawMessage) as WsServerMessage;
  } catch {
    return null;
  }
};

export const createConnectMessage = (
  deviceId: DeviceId,
  requestId: string,
): WsClientConnectMessage => ({
  type: "connect",
  requestId,
  deviceId,
});

export const createDisconnectMessage = (
  deviceId: DeviceId,
  requestId: string,
): WsClientDisconnectMessage => ({
  type: "disconnect",
  requestId,
  deviceId,
});

export const createSendApduMessage = (
  deviceId: DeviceId,
  requestId: string,
  data: string,
  abortTimeoutMs?: number,
): WsClientSendApduMessage & { abortTimeoutMs?: number } => ({
  type: "send-apdu",
  requestId,
  deviceId,
  data,
  ...(typeof abortTimeoutMs === "number" ? { abortTimeoutMs } : {}),
});
