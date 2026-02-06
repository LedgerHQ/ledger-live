# BLE Transport Mocking for E2E Tests

This folder contains BLE transport implementations, including mocks for e2e testing.

> **⚠️ Temporary Solution**
>
> The current BLE mocking approach (`useMockBle.ts`) is a workaround that requires
> each component using DMK BLE hooks to explicitly check for mock mode and use
> mock hooks instead. This is not future-proof and adds maintenance burden.
>
> **Future improvement:** Transport-level mocking should be implemented in DMK
> itself, allowing the real hooks to work transparently with mocked transports.
> This would eliminate the need for BLE-specific mock hooks and the conditional
> logic in components.

## Files

| File            | Description                                                                        |
| --------------- | ---------------------------------------------------------------------------------- |
| `index.ts`      | Entry point - returns mock or real transport based on `Config.MOCK`/`Config.DETOX` |
| `makeMock.ts`   | Mock transport for APDU exchange (used by `registerTransports`)                    |
| `useMockBle.ts` | Mock React hooks for BLE scanning & pairing UI                                     |

## Architecture

BLE mocking operates at two levels:

### 1. Transport Level (`makeMock.ts`)

Used by `registerTransports.ts` for device communication:

- `open()` - Opens mock connection (waits for e2e bridge "open" event)
- `exchange()` - Exchanges APDU commands with mock device
- `observeState()` - Returns `PoweredOn` state

### 2. UI Level (`useMockBle.ts`)

React hooks that mock the DMK BLE hooks for scanning/pairing UI:

- **`useMockBleDevicesScanning`** - Uses `makeMock.listen()` to receive "add" events
- **`useMockBleDevicePairing`** - Uses `makeMock.open()` to wait for "open" events

```
┌─────────────────┐         WebSocket         ┌─────────────────┐
│   Test Runner   │ ◄───────────────────────► │       App       │
│  (server.ts)    │                           │   (client.ts)   │
└─────────────────┘                           └─────────────────┘
        │                                              │
        │ addDevicesBT()                               │ e2eBridgeClient.next()
        │ open()                                       │
        ▼                                              ▼
┌─────────────────┐                           ┌─────────────────────────────┐
│  Sends "add"    │ ──────────────────────────│► makeMock.listen()          │
│  Sends "open"   │ ──────────────────────────│► makeMock.open()            │
└─────────────────┘                           └─────────────────────────────┘
```

## E2E Test Flow

When a test calls `app.common.addDeviceViaBluetooth()`:

1. **Test runner** calls `bridge.addDevicesBT({ id, name, serviceUUID })`
2. **Bridge server** sends `{ type: "add", payload: {...} }` via WebSocket
3. **Bridge client** receives message and pushes to `e2eBridgeClient` Subject
4. **`useMockBleDevicesScanning`** calls `getBLETransport().listen()` → `makeMock.listen()` receives the event
5. **Hook** adds device to scanned list, **UI** displays the device
6. **User action** (simulated): test taps on the device
7. **Test runner** calls `bridge.open()`
8. **`useMockBleDevicePairing`** calls `getBLETransport().open()` → `makeMock.open()` receives the event
9. **Hook** sets `isPaired = true`, **UI** shows pairing success

## Usage in Components

Components that perform BLE scanning must check for mock mode:

```typescript
import Config from "react-native-config";
import { useBleDevicesScanning } from "@ledgerhq/live-dmk-mobile";
import { useMockBleDevicesScanning } from "~/transport/bleTransport/useMockBle";

const isMockMode = Boolean(Config.MOCK || Config.DETOX);
const scanningEnabled = /* your condition */;

const mockState = useMockBleDevicesScanning(isMockMode && scanningEnabled);
const realState = useBleDevicesScanning(!isMockMode && scanningEnabled);

const bleScanningState = isMockMode ? mockState : realState;
```

Currently implemented in:

- `SelectDevice2/index.tsx`
- `BleDevicePairingFlow/DmkBleDevicesScanning.tsx`
- `BleDevicePairingFlow/DmkBleDevicePairing.tsx`
