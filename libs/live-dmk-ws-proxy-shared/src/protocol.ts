/**
 * WebSocket proxy protocol types.
 *
 * Shared between the CLI proxy server and the mobile client transport.
 * All messages are JSON-encoded strings sent over a single WebSocket connection.
 */

// -- Device info exchanged over the wire --

export type WsProxyDeviceInfo = {
  id: string;
  deviceModel: { id: string; productName: string };
};

// -- Server -> Client messages --

export type WsServerDiscoveredDevicesMessage = {
  type: "discovered-devices-updated";
  discoveredDevices: WsProxyDeviceInfo[];
};

export type WsServerDeviceConnectedMessage = {
  type: "device-connected";
  requestId: string;
  deviceId: string;
  sessionId: string;
  deviceModel: { id: string; productName: string };
};

export type WsServerApduResponseMessage = {
  type: "apdu-response";
  requestId: string;
  deviceId: string;
  data: string;
};

export type WsServerErrorMessage = {
  type: "error";
  requestId?: string;
  deviceId?: string;
  message: string;
};

export type WsServerDeviceDisconnectedMessage = {
  type: "device-disconnected";
  deviceId: string;
};

export type WsServerMessage =
  | WsServerDiscoveredDevicesMessage
  | WsServerDeviceConnectedMessage
  | WsServerApduResponseMessage
  | WsServerErrorMessage
  | WsServerDeviceDisconnectedMessage;

// -- Client -> Server messages --

export type WsClientConnectMessage = {
  type: "connect";
  requestId: string;
  deviceId: string;
};

export type WsClientSendApduMessage = {
  type: "send-apdu";
  requestId: string;
  deviceId: string;
  data: string;
  abortTimeoutMs?: number;
};

export type WsClientDisconnectMessage = {
  type: "disconnect";
  requestId?: string;
  deviceId: string;
};

export type WsClientMessage =
  | WsClientConnectMessage
  | WsClientSendApduMessage
  | WsClientDisconnectMessage;
