# live-dmk-desktop

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Desktop-specific integration of the Ledger Device Management Kit (DMK) for Ledger Live Desktop. Builds the DMK singleton with its transports, adapts it to the legacy `hw-transport` API and provides the React hooks that wire it into the LLD renderer process, enabling hardware wallet communication over USB and Bluetooth on macOS, Windows, and Linux.

## What it does

- Builds the DMK with the WebHID (USB) and Speculos transports, plus the mock server transport when `MOCK_SERVER_TRANSPORT` is set and the Web Bluetooth transport when `EXPERIMENTAL_BLE` is set at startup
- Adapts DMK sessions to the legacy `hw-transport` API (`DeviceManagementKitTransport`) used by `withDevice` flows
- Provides the device discovery sources of the Device Intent Executor (`connectDevice`)
- Exposes React hooks for device connection lifecycle (connect, disconnect, errors)
- Maps DMK-level transport errors to Ledger Live Desktop error types

## Key exports / concepts

- `transport/` — `DeviceManagementKitTransport`: legacy transport over a DMK session; `open(deviceId?)` is single-flight and targets the given device
- `hooks/` — DMK singleton (`getDeviceManagementKit`, `isBluetoothTransportEnabled`) and React context hooks
- `bluetooth/` — Web Bluetooth support: `requestBluetoothDevice` (asks the user to pick a Ledger device), `isBluetoothDevice`, `webBleTransportIdentifier`, and the transport wrappers (a discovered device stays available until it disconnects; debug activity for the `DEBUG_BLE` badge)
- `connectDevice/` — Device Intent Executor connection: discovery sources per transport and known-device matching
- `errors.ts` — Desktop-specific error types extending DMK base errors

## Usage context

Used exclusively by `apps/ledger-live-desktop`. Depends on `libs/live-dmk-shared` for shared device-action logic and interfaces. The mobile equivalent is `libs/live-dmk-mobile`.
