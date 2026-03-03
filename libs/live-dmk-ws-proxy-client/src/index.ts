export { wsProxyTransportFactory } from "./transport/WsProxyTransport";
export { WS_PROXY_IDENTIFIER, setWsProxyUrl } from "./transport/WsProxyTransport";
export { WsProxyLegacyTransportCompat } from "./transport/WsProxyLegacyTransportCompat";
export { useWsProxyDevicesDiscovery } from "./hooks/useWsProxyDevicesDiscovery";
export type {
  WsProxyDiscoveryState,
  WsProxyDiscoveredDevice,
} from "./hooks/useWsProxyDevicesDiscovery";
export type {
  WsProxyDeviceInfo,
  WsServerMessage,
  WsServerDiscoveredDevicesMessage,
  WsServerDeviceConnectedMessage,
  WsServerApduResponseMessage,
  WsServerErrorMessage,
  WsServerDeviceDisconnectedMessage,
  WsClientMessage,
  WsClientConnectMessage,
  WsClientSendApduMessage,
  WsClientDisconnectMessage,
} from "@ledgerhq/live-dmk-ws-proxy-shared";
