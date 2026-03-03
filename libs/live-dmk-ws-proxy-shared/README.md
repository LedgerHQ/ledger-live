# @ledgerhq/live-dmk-ws-proxy-shared

Shared protocol types for the DMK WebSocket proxy.

This package centralizes wire message contracts used by:

- `@ledgerhq/live-dmk-ws-proxy-client`
- `@ledgerhq/live-dmk-ws-proxy-server`

## Protocol overview

Client -> server messages:

- `connect { requestId, deviceId }`
- `send-apdu { requestId, deviceId, data, abortTimeoutMs? }`
- `disconnect { requestId?, deviceId }`

Server -> client messages:

- `discovered-devices-updated { discoveredDevices[] }`
- `device-connected { requestId, deviceId, sessionId, deviceModel }`
- `apdu-response { requestId, deviceId, data }`
- `error { requestId?, deviceId?, message }`
- `device-disconnected { deviceId }`
