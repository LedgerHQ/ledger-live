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
import { useMockBleDevicesScanning } from "~/react-native-hw-transport-ble/useMockBle";

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

---

## Future Improvement: DMK-Level Mock Transport

The current UI-level mocking (`useMockBle.ts`) is a workaround. The proper solution is to implement a **DMK-compatible mock transport** that gets injected at the DMK builder level, allowing real hooks to work transparently.

### Why This Is Better

| Current Approach                           | Future Approach                         |
| ------------------------------------------ | --------------------------------------- |
| Mock at UI level (hooks)                   | Mock at transport level (DMK)           |
| Every component needs `Config.MOCK` checks | Components use real DMK hooks unchanged |
| Two code paths to maintain                 | Single code path                        |
| Only mocks scanning/pairing UI             | Mocks discovery, connection, AND APDUs  |

### Implementation Plan

#### Step 1: Add transport override to `live-dmk-mobile`

```typescript
// libs/live-dmk-mobile/src/hooks/useDeviceManagementKit.tsx

import { TransportFactory } from "@ledgerhq/device-management-kit";

export type DmkOptions = {
  /** Override default BLE transport with custom transports (e.g., for e2e testing) */
  overrideTransports?: TransportFactory[];
};

let instance: DeviceManagementKit | null = null;

export const getDeviceManagementKit = (options?: DmkOptions): DeviceManagementKit => {
  if (!instance) {
    const builder = new DeviceManagementKitBuilder();

    if (options?.overrideTransports?.length) {
      // Use provided transports (e.g., mock for e2e tests)
      options.overrideTransports.forEach(t => builder.addTransport(t));
    } else {
      // Default: real BLE transport
      builder.addTransport(RNBleTransportFactory);
    }

    // HID transport always added
    builder.addTransport(RNHidTransportFactory);

    instance = builder
      .addLogger(new LedgerLiveLogger(LogLevel.Debug))
      .addConfig({ firmwareDistributionSalt })
      .build();
  }
  return instance;
};

// Also update the context provider to accept options
```

#### Step 2: Create DMK-compatible mock transport in `ledger-live-mobile`

```typescript
// apps/ledger-live-mobile/src/transport/MockBleTransportFactory.ts

import { Either, Right, Left } from "purify-ts";
import { Observable, BehaviorSubject } from "rxjs";
import { filter, first } from "rxjs/operators";
import { firstValueFrom } from "rxjs";
import {
  Transport,
  TransportFactory,
  TransportArgs,
  TransportDiscoveredDevice,
  TransportConnectedDevice,
  TransportIdentifier,
  DeviceId,
  DmkError,
  ConnectError,
} from "@ledgerhq/device-management-kit";
import { e2eBridgeClient } from "../e2e/bridge/client";
import { createAPDUMock } from "../logic/createAPDUMock";

const MOCK_BLE_IDENTIFIER = "mockBle" as TransportIdentifier;

class MockBleTransport implements Transport {
  private discoveredDevices$ = new BehaviorSubject<TransportDiscoveredDevice[]>([]);
  private discovering = false;
  private apduMocks = new Map<string, ReturnType<typeof createAPDUMock>>();

  constructor(private args: TransportArgs) {
    // Listen to e2eBridgeClient for device discovery events
    e2eBridgeClient.subscribe(msg => {
      if (msg.type === "add" && this.discovering) {
        const device: TransportDiscoveredDevice = {
          id: msg.payload.id as DeviceId,
          name: msg.payload.name,
          transport: MOCK_BLE_IDENTIFIER,
          deviceModel: this.args.deviceModelDataSource.getDeviceModel("nanoX"),
        };

        const current = this.discoveredDevices$.value;
        if (!current.find(d => d.id === device.id)) {
          this.discoveredDevices$.next([...current, device]);
        }

        // Create APDU mock for this device
        this.apduMocks.set(device.id, createAPDUMock());
      }
    });
  }

  getIdentifier(): TransportIdentifier {
    return MOCK_BLE_IDENTIFIER;
  }

  isSupported(): boolean {
    return true;
  }

  startDiscovering(): Observable<TransportDiscoveredDevice> {
    this.discovering = true;
    this.discoveredDevices$.next([]);

    return new Observable(subscriber => {
      const sub = e2eBridgeClient.pipe(filter(msg => msg.type === "add")).subscribe(msg => {
        const device: TransportDiscoveredDevice = {
          id: msg.payload.id as DeviceId,
          name: msg.payload.name,
          transport: MOCK_BLE_IDENTIFIER,
          deviceModel: this.args.deviceModelDataSource.getDeviceModel("nanoX"),
        };
        subscriber.next(device);
      });

      return () => {
        sub.unsubscribe();
        this.discovering = false;
      };
    });
  }

  stopDiscovering(): void {
    this.discovering = false;
  }

  listenToAvailableDevices(): Observable<TransportDiscoveredDevice[]> {
    this.discovering = true;
    return this.discoveredDevices$.asObservable();
  }

  async connect(params: {
    deviceId: DeviceId;
    onDisconnect: (deviceId: DeviceId) => void;
  }): Promise<Either<ConnectError, TransportConnectedDevice>> {
    // Wait for "open" event from e2e bridge
    await firstValueFrom(
      e2eBridgeClient.pipe(
        filter(msg => msg.type === "open"),
        first(),
      ),
    );

    const apduMock = this.apduMocks.get(params.deviceId) || createAPDUMock();

    const connectedDevice = new TransportConnectedDevice({
      id: params.deviceId,
      deviceModel: this.args.deviceModelDataSource.getDeviceModel("nanoX"),
      type: "BLE",
      transport: MOCK_BLE_IDENTIFIER,
      name: "Mock Device",
      sendApdu: async (apdu: Uint8Array) => {
        try {
          const response = await apduMock.exchange(Buffer.from(apdu));
          return Right({
            data: new Uint8Array(response.slice(0, -2)),
            statusCode: new Uint8Array(response.slice(-2)),
          });
        } catch (error) {
          return Left(error as DmkError);
        }
      },
    });

    return Right(connectedDevice);
  }

  async disconnect(): Promise<Either<DmkError, void>> {
    return Right(undefined);
  }
}

/** DMK-compatible mock BLE transport factory for e2e tests */
export const MockBleTransportFactory: TransportFactory = (args: TransportArgs): Transport => {
  return new MockBleTransport(args);
};
```

#### Step 3: Inject mock transport in LLM when in mock mode

```typescript
// apps/ledger-live-mobile/src/context/DmkProvider.tsx (or wherever DMK is initialized)

import { getDeviceManagementKit } from "@ledgerhq/live-dmk-mobile";
import { MockBleTransportFactory } from "../transport/MockBleTransportFactory";
import Config from "react-native-config";

const isMockMode = Boolean(Config.MOCK || Config.DETOX);

// Initialize DMK with mock transport in e2e test mode
const dmk = getDeviceManagementKit(
  isMockMode ? { overrideTransports: [MockBleTransportFactory] } : undefined,
);
```

#### Step 4: Remove UI-level mocks

Once the DMK-level mock is working:

1. **Delete** `useMockBle.ts`
2. **Remove** `Config.MOCK` checks from components:
   - `SelectDevice2/index.tsx`
   - `DmkBleDevicesScanning.tsx`
   - `DmkBleDevicePairing.tsx`
3. Components use real DMK hooks directly - they work transparently with mock transport

### Architecture After Implementation

```
┌─────────────────┐         WebSocket         ┌─────────────────────────────────┐
│   Test Runner   │ ◄───────────────────────► │           App                   │
│  (server.ts)    │                           │                                 │
└─────────────────┘                           │  ┌─────────────────────────────┐│
        │                                     │  │     DMK                     ││
        │ addDevicesBT()                      │  │  ┌─────────────────────┐    ││
        │ open()                              │  │  │ MockBleTransport    │    ││
        ▼                                     │  │  │                     │    ││
┌─────────────────┐                           │  │  │ • startDiscovering()│◄───┼┼── e2eBridgeClient
│  Sends "add"    │ ──────────────────────────┼──┼──│► listenToAvailable()│    ││
│  Sends "open"   │ ──────────────────────────┼──┼──│► connect()          │    ││
│  Sends APDUs    │ ──────────────────────────┼──┼──│► sendApdu()         │    ││
└─────────────────┘                           │  │  └─────────────────────┘    ││
                                              │  └─────────────────────────────┘│
                                              │                                 │
                                              │  ┌─────────────────────────────┐│
                                              │  │ Real DMK Hooks (unchanged)  ││
                                              │  │ • useBleDevicesScanning()   ││
                                              │  │ • useBleDevicePairing()     ││
                                              │  └─────────────────────────────┘│
                                              └─────────────────────────────────┘
```

### Benefits

- ✅ **Single code path** - No `Config.MOCK` checks scattered in components
- ✅ **Full stack mocking** - Discovery, connection, AND APDU exchange
- ✅ **Transparent** - Real DMK hooks work with mock transport automatically
- ✅ **Maintainable** - Mock logic centralized in one transport class
- ✅ **Future-proof** - Aligns with DMK architecture, not legacy transport system
