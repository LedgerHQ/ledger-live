# DMK Transport Migration Plan

> **Status**: Proposal  
> **Author**: Generated from architecture analysis  
> **Date**: January 2026

This document describes the current transport architecture across Ledger Live platforms and proposes a unified approach using the Device Management Kit (DMK) directly.

---

## Table of Contents

1. [Current Architecture](#current-architecture)
2. [Problems with Current Approach](#problems-with-current-approach)
3. [Critical Implementation Details](#critical-implementation-details)
4. [Proposed Architecture](#proposed-architecture)
5. [Implementation Plan](#implementation-plan)
   - [Phase 0: Current State](#phase-0-current-state-before-migration)
   - [Phase 1: Infrastructure](#phase-1-infrastructure-week-1-2)
   - [Phase 2: Platform Initialization](#phase-2-platform-initialization-week-2-3)
   - [Phase 3: New Transport Factories](#phase-3-new-transport-factories-week-3-4)
     - [Transport Coverage Matrix](#transport-coverage-matrix)
     - [Desktop IPC Transport Clarification](#desktop-ipc-transport-clarification)
   - [Phase 4: Consumer Migration](#phase-4-gradual-consumer-migration-week-4-8)
     - [Phase 4a: Infrastructure & Feature Flag](#phase-4a-infrastructure--feature-flag-week-4)
     - [Phase 4b: Device Actions & Manager](#phase-4b-device-actions--manager-week-5)
     - [Phase 4c: Firmware & Recovery](#phase-4c-firmware--recovery-week-6)
     - [Phase 4d: Account Operations](#phase-4d-account-operations-week-7)
     - [Phase 4e: Remaining Consumers & Cleanup](#phase-4e-remaining-consumers--cleanup-week-8)
   - [Phase 5: Cleanup](#phase-5-cleanup-week-8-10)
   - [Phase Summary Table](#phase-summary-table)
6. [Testing Strategy](#testing-strategy)
7. [Rollback Strategy](#rollback-strategy)
8. [Success Metrics](#success-metrics)
9. [Platform-Specific Details](#platform-specific-details)
10. [Device ID → DiscoveredDevice Mapping](#device-id--discovereddevice-mapping-strategy)
11. [Device Discovery Migration](#device-discovery-migration)
12. [Can We Fully Remove Legacy Dependencies?](#can-we-fully-remove-legacy-dependencies)
13. [Risks and Mitigations](#risks-and-mitigations)
14. [Open Questions](#open-questions)

---

## Current Architecture

### Overview

The current transport system uses a legacy abstraction layer built around `@ledgerhq/hw-transport`. The core mechanism is:

```typescript
// libs/ledger-live-common/src/hw/index.ts
registerTransportModule({
  id: string,
  open: (deviceId, timeoutMs?, context?, matchDeviceByName?) => Promise<Transport> | null,
  close?: (transport, id) => Promise<void> | null,
  disconnect: (id) => Promise<void> | null,
  discovery?: Observable<DeviceEvent>,
});
```

The `withDevice` function (in `libs/ledger-live-common/src/hw/deviceAccess.ts`) orchestrates device access:

```typescript
export const withDevice =
  (deviceId: string, options?: OpenOptions) =>
  <T>(job: (t: Transport) => Observable<T>): Observable<T> => {
    // 1. Queue management (one device = one active job)
    // 2. Call open() from registered transport modules
    // 3. Execute job with Transport instance
    // 4. Close transport when done
  };
```

### Platform Transport Summary

| Platform | Transport ID                   | Implementation                         | Notes                       |
| -------- | ------------------------------ | -------------------------------------- | --------------------------- |
| **LLM**  | `hid`                          | `DeviceManagementKitHIDTransport`      | Wrapped in legacy interface |
| **LLM**  | `ble`                          | `DeviceManagementKitBLETransport`      | Wrapped in legacy interface |
| **LLM**  | `httpdebug`                    | `@ledgerhq/hw-transport-http`          | Dev mode only               |
| **LLD**  | `deviceManagementKitTransport` | `DeviceManagementKitTransport`         | WebHID via DMK              |
| **LLD**  | `ipc-transport`                | `IPCTransport`                         | For Speculos/proxy          |
| **LLD**  | `vault-transport`              | `VaultTransport`                       | Enterprise feature          |
| **CLI**  | `hid`                          | `@ledgerhq/hw-transport-node-hid`      | Pure legacy                 |
| **CLI**  | `mock`                         | `openTransportReplayer`                | APDU recording              |
| **CLI**  | `http`                         | `@ledgerhq/hw-transport-http`          | HTTP proxy                  |
| **CLI**  | `speculos-http`                | `DeviceManagementKitTransportSpeculos` | Wrapped DMK                 |
| **CLI**  | `tcp`                          | `SpeculosTransport`                    | Legacy TCP speculos         |

### Detailed Platform Analysis

#### Ledger Live Mobile (LLM)

**File**: `apps/ledger-live-mobile/src/services/registerTransports.ts`

```typescript
export const registerTransports = (isLDMKEnabled: boolean) => {
  // HID Transport
  registerTransportModule({
    id: "hid",
    open: (id, timeoutMs, traceContext) => {
      if (id.startsWith("usb|")) {
        return hidTransport.open(devicePath, timeoutMs, traceContext);
      }
      return null;
    },
    disconnect: id => hidTransport.disconnect(),
    discovery: new Observable(o => hidTransport.listen(o)).pipe(...),
  });

  // HTTP Debug Transport (dev mode)
  registerTransportModule({
    id: "httpdebug",
    open: id => id.startsWith("httpdebug|") ? DebugHttpProxy.open(id.slice(10)) : null,
    disconnect: id => id.startsWith("httpdebug|") ? Promise.resolve() : null,
  });

  // BLE Transport (fallback)
  registerTransportModule({
    id: "ble",
    open: (id, timeoutMs, traceContext, matchDeviceByName) =>
      getBLETransport().open(id, timeoutMs, traceContext, { matchDeviceByName }),
    disconnect: id => getBLETransport().disconnectDevice(id),
  });
};
```

**Key insight**: Both `hidTransport` and `getBLETransport()` return DMK-based transports (`DeviceManagementKitHIDTransport`, `DeviceManagementKitBLETransport`), but they're wrapped to provide the legacy `Transport` interface.

#### Ledger Live Desktop (LLD)

**File**: `apps/ledger-live-desktop/src/renderer/live-common-setup.ts`

```typescript
export function registerTransportModules(_store: Store) {
  function whichTransportModuleToUse(deviceId: string): RendererTransportModule {
    if (deviceId.startsWith(vaultTransportPrefixID)) return RendererTransportModule.Vault;
    if (getEnv("SPECULOS_API_PORT") || getEnv("DEVICE_PROXY_URL"))
      return RendererTransportModule.IPC;
    return RendererTransportModule.DeviceManagementKit;
  }

  // DMK Transport (WebHID)
  registerTransportModule({
    id: "deviceManagementKitTransport",
    open: (id, timeoutMs, context) => {
      if (whichTransportModuleToUse(id) !== RendererTransportModule.DeviceManagementKit) return;
      return DeviceManagementKitTransport.open();
    },
    disconnect: () => Promise.resolve(),
  });

  // IPC Transport (Speculos/Proxy via internal process)
  registerTransportModule({
    id: "ipc-transport",
    open: (id, timeoutMs, context) => {
      if (whichTransportModuleToUse(id) !== RendererTransportModule.IPC) return;
      return retry(() => IPCTransport.open(descriptor, timeoutMs, context), {...});
    },
    disconnect: () => Promise.resolve(),
  });

  // Vault Transport
  registerTransportModule({
    id: "vault-transport",
    open: (id) => {
      if (whichTransportModuleToUse(id) !== RendererTransportModule.Vault) return;
      return retry(() => VaultTransport.open(host).then(...));
    },
    disconnect: () => Promise.resolve(),
  });
}
```

#### CLI

**File**: `apps/cli/src/live-common-setup.ts`

```typescript
// Mock transport for testing
registerTransportModule({
  id: "mock",
  open: id => (id in mockTransports) ? mockTransports[id] : undefined,
  disconnect: () => Promise.resolve(),
});

// HTTP Proxy
if (DEVICE_PROXY_URL) {
  const Tr = createTransportHttp(DEVICE_PROXY_URL.split("|"));
  registerTransportModule({
    id: "http",
    open: () => retry(() => Tr.create(3000, 5000), {...}),
    disconnect: () => Promise.resolve(),
  });
}

// Speculos HTTP (DMK-based)
if (SPECULOS_API_PORT) {
  registerTransportModule({
    id: "speculos-http",
    open: () => retry(() => DeviceManagementKitTransportSpeculos.open(req)),
    disconnect: () => Promise.resolve(),
  });
}

// Node HID (legacy)
registerTransportModule({
  id: "hid",
  open: devicePath => retry(() => TransportNodeHid.open(devicePath), {...}),
  discovery: new Observable(TransportNodeHid.listen).pipe(...),
  disconnect: () => Promise.resolve(),
});
```

### E2E Test Architecture

#### Mobile E2E with Speculos

**File**: `e2e/mobile/bridge/proxy.ts`

The proxy acts as an intermediary between the mobile app and Speculos:

```typescript
transport = {
  id: `speculos-http-${speculosApiPort}`,
  open: id =>
    id.includes(port.toString())
      ? retry(() => DeviceManagementKitTransportSpeculos.open(req))
      : null,
  disconnect: () => Promise.resolve(),
};
registerTransportModule(transport);
```

**File**: `e2e/mobile/utils/cliUtils.ts`

```typescript
registerSpeculosTransport: function (apiPort: string, speculosAddress = "http://localhost") {
  unregisterAllTransportModules();
  registerTransportModule({
    id: "speculos-http",
    open: () => retry(() => DeviceManagementKitTransportSpeculos.open(req)),
    disconnect: () => Promise.resolve(),
  });
}
```

**Current E2E flow**:

```
┌──────────────────┐      WebSocket       ┌─────────────────────┐
│  Mobile App      │ ◄──────────────────► │      Proxy          │
│  (Emulator)      │                      │   (proxy.ts)        │
│                  │                      │                     │
│  DEVICE_PROXY_URL│                      │  registerTransport- │
│  = ws://...      │                      │  Module(speculos)   │
└──────────────────┘                      └──────────┬──────────┘
                                                     │ HTTP
                                                     ▼
                                          ┌─────────────────────┐
                                          │ DeviceManagementKit │
                                          │ TransportSpeculos   │
                                          │ (legacy wrapper)    │
                                          └──────────┬──────────┘
                                                     │ HTTP POST /apdu
                                                     ▼
                                          ┌─────────────────────┐
                                          │  Speculos Docker    │
                                          │  (port 5000)        │
                                          └─────────────────────┘
```

---

## Problems with Current Approach

### 1. Multiple DMK Instances

The `DeviceManagementKitTransportSpeculos` wrapper creates its own DMK instance internally:

```typescript
// libs/live-dmk-speculos/src/transport/DeviceManagementKitTransportSpeculos.ts
private static ensureEntry(baseUrl: string, connectionTimeoutMs: number): DmkEntry {
  let deviceManagementEntry = this.byBase.get(baseUrl);
  if (!deviceManagementEntry) {
    const deviceManagementKit = new DeviceManagementKitBuilder()
      .addTransport(speculosTransportFactory(baseUrl, true))  // Creates new DMK!
      .build();
    // ...
  }
}
```

This means when using Speculos, there are **two separate DMK instances**:

- One in the app (for BLE/HID)
- One in the Speculos wrapper

### 2. Legacy Transport Interface Required

All code must go through the legacy `Transport` interface:

```typescript
interface Transport {
  exchange(apdu: Buffer): Promise<Buffer>;
  close(): Promise<void>;
  // ... other methods
}
```

DMK provides a richer interface with session management, device state observables, etc., but these can't be leveraged through the legacy pattern.

### 3. Wrapper Overhead

Every DMK transport needs a wrapper class:

- `DeviceManagementKitBLETransport extends Transport`
- `DeviceManagementKitHIDTransport extends Transport`
- `DeviceManagementKitTransport extends Transport`
- `DeviceManagementKitTransportSpeculos extends Transport`

These wrappers duplicate code and add complexity.

### 4. No Unified Device State

The `registerTransportModule` pattern doesn't provide:

- Device connection state observables
- Session management
- Automatic reconnection
- Device discovery across transports

### 5. E2E Test Complexity

For mobile e2e tests, the current BLE mocking requires:

- UI-level mock hooks (`useMockBleDevicesScanning`, `useMockBleDevicePairing`)
- `Config.MOCK` checks in components
- Two code paths to maintain

---

## Critical Implementation Details

> **⚠️ Migration Complexity Warning**
>
> The current transport layer contains significant complexity that has evolved to handle real-world edge cases. Any migration **must preserve** this behavior. The naive approach of "just call `dmk.connect(deviceId)`" will not work.

This section documents the non-trivial logic currently embedded in the transport wrappers that **must be preserved** in any migration.

### 1. Device Queue Management

The current `withDevice` uses `DeviceQueuedJobsManager` to serialize access to each device:

```typescript
// From libs/ledger-live-common/src/hw/deviceAccess.ts

/**
 * Careful: a USB-connected device has no unique id, and its `deviceId` will be an empty string.
 *
 * The queue object `queuedJobsByDevice` only stores, for each device, the latest void promise
 * that will resolve when the device is ready to be opened again.
 */
export class DeviceQueuedJobsManager {
  private queuedJobsByDevice: { [deviceId: string]: QueuedJob };
  // ...
}
```

**Key insight**: USB devices share the same queue (empty string ID), preventing concurrent access.

### 2. Retry Logic

The current system provides two levels of retry:

```typescript
// Level 1: withDevicePolling - retries the entire job based on error type
export const withDevicePolling =
  (deviceId: string) =>
  <T>(
    job: (arg0: Transport) => Observable<T>,
    acceptError: (arg0: Error) => boolean = genericCanRetryOnError,
  ): Observable<T> =>
    withDevice(deviceId)(job).pipe(retryWhen(retryWhileErrors(acceptError)));

// genericCanRetryOnError returns false for permanent errors:
// - WrongAppForCurrency, WrongDeviceForAccount, CantOpenDevice
// - BluetoothRequired, UpdateYourApp, FirmwareOrAppUpdateRequired
// - DeviceHalted, TransportWebUSBGestureRequired, TransportInterfaceNotAvailable
```

```typescript
// Level 2: Inside DeviceManagementKitBLETransport.open() - connection retry
subscription = devicesObs.pipe(
  // ... find and connect logic ...
  retry({
    delay: (error, retryAttempt) => {
      getDeviceManagementKit().stopDiscovering();

      // Don't retry on permanent errors
      if (error instanceof PairingRefusedError) {
        return throwError(() => new PairingFailed());
      } else if (error instanceof PeerRemovedPairing || error instanceof OpeningConnectionError) {
        return throwError(() => error);
      }

      // Retry up to 5 times with 500ms delay
      if (retryAttempt < 5) {
        return timer(500);
      }
      return throwError(() => error);
    },
  }),
);
```

### 3. Session Reuse (BLE)

The BLE transport avoids unnecessary reconnections by checking for existing sessions:

```typescript
// From DeviceManagementKitBLETransport.open()

// Check if there's an active session we can reuse
const activeSessionId = activeDeviceSessionSubject.value?.sessionId;

if (activeSessionId) {
  const deviceSessionState = await firstValueFrom(
    getDeviceManagementKit().getDeviceSessionState({ sessionId: activeSessionId }),
  );

  const connectedDevice = getDeviceManagementKit().getConnectedDevice({
    sessionId: activeSessionId,
  });

  const isSameDeviceId = connectedDevice.id === deviceOrId;
  const isSameDeviceNameButDifferentId =
    !isSameDeviceId &&
    matchDeviceByName({
      oldDevice: { deviceName: options?.matchDeviceByName },
      newDevice: { deviceName: connectedDevice.name },
    });

  // Reuse if: same device OR same name (BLE IDs can change!)
  if (
    deviceSessionState?.deviceStatus !== DeviceStatus.NOT_CONNECTED &&
    connectedDevice.type === "BLE" &&
    (isSameDeviceId || isSameDeviceNameButDifferentId)
  ) {
    return activeDeviceSessionSubject.value.transport; // Reuse!
  }
}
```

**Why device name matching?** BLE device IDs can change between connections. The `matchDeviceByName` option allows reconnecting to the "same" device by name even if the ID changed.

### 4. USB Devices Have No Stable ID

USB devices don't have unique identifiers in the same way BLE devices do:

```typescript
// From DeviceManagementKitHIDTransport.open()

static async open(deviceId: string, timeoutMs?: number, ...) {
  // deviceId is typically "usb|something" or just ignored

  // For USB, we just connect to the FIRST available device
  const device = await firstValueFrom(
    dmk.listenToAvailableDevices({ transport: rnHidTransportIdentifier }).pipe(
      first(devices => devices.length > 0),  // Just take the first!
      timeoutMs ? timeout(timeoutMs) : tap(),
    ),
  );

  const sessionId = await dmk.connect({
    device: device[0],  // Connect to first available
    sessionRefresherOptions: { isRefresherDisabled: true },
  });
}
```

### 5. DMK Requires DiscoveredDevice, Not Just ID

The DMK `connect()` method expects a full `DiscoveredDevice` object:

```typescript
// DMK connect signature
dmk.connect({
  device: DiscoveredDevice,  // NOT just a string ID!
  sessionRefresherOptions?: { isRefresherDisabled?: boolean },
}): Promise<string>  // Returns sessionId
```

**Current flow** (when caller only has a deviceId string):

```
withDevice(deviceId: string)
    │
    ▼
Transport.open(deviceId: string)
    │
    ├─► dmk.listenToAvailableDevices()
    │       │
    │       ▼
    │   Find matching DiscoveredDevice
    │   (by ID match or name match)
    │       │
    │       ▼
    └─► dmk.connect({ device: DiscoveredDevice })
```

This means the new `withDeviceDmk` **cannot** simply cast the deviceId to a DiscoveredDevice. It must:

1. Listen to available devices
2. Find a matching device (by ID, or by name for BLE reconnection)
3. Then call `dmk.connect()`

#### Platform-Specific Device ID Behavior

| Platform         | How deviceId is obtained                                     | Value                         |
| ---------------- | ------------------------------------------------------------ | ----------------------------- |
| **LLM BLE**      | `SelectDevice2` → `useBleDevicesScanning()` → user selection | BLE device UUID (can change!) |
| **LLM HID**      | `SelectDevice2` → `discoverDevices()` → `usb\|...` prefix    | `"usb\|<path>"`               |
| **LLD WebHID**   | `useListenToHidDevices` → `descriptor \|\| ""`               | **Empty string `""`**         |
| **LLD Speculos** | `getCurrentDevice` → env check                               | `""`                          |
| **LLD Vault**    | `getCurrentDevice` → `"vault-transport:..."`                 | Vault connection string       |

#### The Device Type (Current)

```typescript
// libs/ledger-live-common/src/hw/actions/types.ts
export type Device = {
  deviceId: string; // Used by withDevice()
  deviceName?: string; // Used for BLE reconnection
  modelId: DeviceModelId;
  wired: boolean;
};
```

#### The DiscoveredDevice Type (DMK)

```typescript
// From @ledgerhq/device-management-kit
export type DiscoveredDevice = {
  id: DeviceId; // Unique device identifier
  name: string; // Display name
  transport: TransportIdentifier; // "rnBle", "rnHid", "webHid", etc.
  deviceModel: {
    model: InternalDeviceModel; // NanoX, NanoSP, etc.
    name: string;
  };
  type: "BLE" | "USB";
};
```

**Key differences:**

- `DiscoveredDevice` has `transport` (needed to know which DMK transport to use)
- `DiscoveredDevice` has full `deviceModel` (needed for error messages)
- `Device.deviceId` may be empty string (USB) - requires special handling

### 6. Error Remapping (Complex, Multi-Layer)

Error remapping happens at **multiple levels** with **transport-specific behavior**:

#### Layer 1: Transport-Specific Connection Errors

**BLE Transport:**

```typescript
// Connection errors
if (error instanceof PairingRefusedError) → new PairingFailed()
if (isPeerRemovedPairingError(error)) → new PeerRemovedPairing({ productName })
// OpeningConnectionError → don't retry, rethrow as-is
```

**HID Transport:**

```typescript
// No connection error remapping - just rethrows
```

**Desktop Transport:**

```typescript
// No connection error remapping - just rethrows
```

#### Layer 2: Transport-Specific Exchange Errors

**BLE Transport:**

```typescript
// No exchange error remapping
```

**HID Transport:**

```typescript
// Exchange errors → DisconnectedDevice
if (
  error instanceof SendApduEmptyResponseError ||
  error instanceof DeviceDisconnectedWhileSendingError ||
  error instanceof DeviceDisconnectedBeforeSendingApdu
) {
  throw new DisconnectedDevice();
}
```

**Desktop Transport:**

```typescript
// No error remapping, BUT has auto-reconnect logic:
async exchange(apdu: Buffer) {
  // If device disconnected during session, reconnect automatically
  if (!devices.some(d => d.sessionId === this.sessionId)) {
    const [discoveredDevice] = await firstValueFrom(dmk.listenToAvailableDevices({}));
    this.sessionId = await dmk.connect({ device: discoveredDevice, ... });
  }
  return this.dmk.sendApdu({ sessionId: this.sessionId, apdu });
}
```

#### Layer 3: deviceAccess.ts (live-common)

```typescript
// Status code remapping (applies to ALL transports)
const initialErrorRemapping = (error: unknown) => {
  if (error instanceof TransportStatusError) {
    if (error.statusCode === 0x6faa) return new DeviceHalted(error.message);
    if (error.statusCode === 0x6b00) return new FirmwareOrAppUpdateRequired(error.message);
  }
  return error;
};

// After initialErrorRemapping, apply customizable errorRemapping
// (set via setErrorRemapping() - used by LLD for specific flows)
```

#### Layer 4: genericCanRetryOnError (for withDevicePolling)

```typescript
// These errors should NOT trigger retry:
export const genericCanRetryOnError = (err: unknown): boolean => {
  if (err instanceof WrongAppForCurrency) return false;
  if (err instanceof WrongDeviceForAccount) return false;
  if (err instanceof CantOpenDevice) return false;
  if (err instanceof BluetoothRequired) return false;
  if (err instanceof UpdateYourApp) return false;
  if (err instanceof FirmwareOrAppUpdateRequired) return false;
  if (err instanceof DeviceHalted) return false;
  if (err instanceof TransportWebUSBGestureRequired) return false;
  if (err instanceof TransportInterfaceNotAvailable) return false;
  return true; // Retry for transient errors
};
```

#### Error Remapping Summary Table

| Layer            | Location             | BLE                                                          | HID                           | Desktop        |
| ---------------- | -------------------- | ------------------------------------------------------------ | ----------------------------- | -------------- |
| **Connection**   | Transport.open()     | PairingRefused→PairingFailed, PeerRemoved→PeerRemovedPairing | None                          | None           |
| **Exchange**     | Transport.exchange() | None                                                         | DMK errors→DisconnectedDevice | Auto-reconnect |
| **Status codes** | deviceAccess.ts      | 0x6faa→DeviceHalted, 0x6b00→FirmwareOrAppUpdateRequired      | Same                          | Same           |
| **Retry gate**   | withDevicePolling    | 9 error types block retry                                    | Same                          | Same           |

### 7. Disconnect Event Propagation

The transports listen to DMK session state and emit legacy `disconnect` events:

```typescript
// From DeviceManagementKitBLETransport
listenToDisconnect = () => {
  this.dmk.getDeviceSessionState({ sessionId: this.sessionId }).subscribe({
    next: state => {
      if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) {
        activeDeviceSessionSubject.next(null);
        this.emit("disconnect"); // Legacy event
      }
    },
  });
};
```

---

## Proposed Architecture

### Goal

Replace the `registerTransportModule` + `withDevice` pattern with direct DMK usage:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        withDevice() - REWRITTEN                              │
│                                   │                                          │
│                                   ▼                                          │
│                      getDmk().connect(deviceId)                              │
│                                   │                                          │
│                    Returns: DmkDeviceConnection                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Single DMK Instance                                │
│                                                                              │
│   new DeviceManagementKitBuilder()                                           │
│     .addTransport(RNBleTransportFactory)       // Mobile BLE                 │
│     .addTransport(RNHidTransportFactory)       // Mobile HID                 │
│     .addTransport(WebHidTransportFactory)      // Desktop WebHID             │
│     .addTransport(speculosTransportFactory())  // Speculos (when enabled)    │
│     .addTransport(mockBleTransportFactory())   // E2E mocks                  │
│     .build()                                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### New Abstraction Layer

```typescript
// libs/ledger-live-common/src/hw/dmk/index.ts

import {
  DeviceManagementKit,
  DeviceManagementKitBuilder,
  TransportFactory,
  DiscoveredDevice,
  DeviceStatus,
  LoggerPublisherService,
  SendApduEmptyResponseError,
  DeviceDisconnectedWhileSendingError,
  DeviceDisconnectedBeforeSendingApdu,
} from "@ledgerhq/device-management-kit";
import { Observable, firstValueFrom, throwError, Subscription } from "rxjs";
import { first, timeout, tap, catchError, finalize, map } from "rxjs/operators";
import { TraceContext, LocalTracer } from "@ledgerhq/logs";
import {
  CantOpenDevice,
  PairingFailed,
  PeerRemovedPairing,
  DisconnectedDevice,
  DeviceHalted,
  FirmwareOrAppUpdateRequired,
  WrongAppForCurrency,
  WrongDeviceForAccount,
  BluetoothRequired,
  UpdateYourApp,
  TransportWebUSBGestureRequired,
  TransportInterfaceNotAvailable,
  TransportStatusError,
} from "@ledgerhq/errors";
import {
  PairingRefusedError,
  OpeningConnectionError,
  isPeerRemovedPairingError,
} from "@ledgerhq/device-management-kit"; // DMK errors
import { DeviceQueuedJobsManager } from "./queue";
import { deviceRegistry } from "./deviceRegistry";
import { getDeviceModel } from "@ledgerhq/devices";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";

/**
 * Connection handle returned by withDeviceDmk.
 *
 * ⚠️ NOTE: This is a PROPOSED helper type, NOT a DMK type!
 *
 * DMK's connect() only returns a sessionId (string). You then use the
 * DMK instance + sessionId for all operations:
 *   - dmk.sendApdu({ sessionId, apdu })
 *   - dmk.disconnect({ sessionId })
 *   - dmk.getDeviceSessionState({ sessionId })
 *
 * DmkDeviceConnection bundles these together as a convenience wrapper:
 *   - sessionId: what DMK connect() returns
 *   - dmk instance: implicitly captured in sendApdu/close closures
 *   - metadata: deviceId, deviceName, transportType
 *
 * This allows job functions to have a simpler interface.
 */
export type DmkDeviceConnection = {
  sessionId: string;
  deviceId: string;
  deviceName?: string; // Useful for BLE reconnection matching
  transportType: TransportType; // Needed for transport-specific error handling
  sendApdu: (
    apdu: Uint8Array,
    options?: { abortTimeoutMs?: number },
  ) => Promise<{ data: Uint8Array; statusCode: Uint8Array }>;
  close: () => Promise<void>;
};

// All supported transport types
export type TransportType = "ble" | "usb" | "webhid" | "speculos" | "mockBle";

/**
 * Context passed to job functions alongside the connection.
 * Provides access to DMK instance and device info for advanced use cases.
 */
export type DmkJobContext = {
  dmk: DeviceManagementKit;
  device: DiscoveredDevice;
};

// Configuration for DMK initialization
export type DmkInitConfig = {
  transports: TransportFactory[];
  logger?: LoggerPublisherService;
};

let dmkInstance: DeviceManagementKit | null = null;

/**
 * Initialize the DMK singleton with platform-specific transports.
 * Should be called once at app startup.
 */
export const initDmk = (config: DmkInitConfig): DeviceManagementKit => {
  if (dmkInstance) {
    console.warn("DMK already initialized, returning existing instance");
    return dmkInstance;
  }

  const builder = new DeviceManagementKitBuilder();
  config.transports.forEach(t => builder.addTransport(t));

  if (config.logger) {
    builder.addLogger(config.logger);
  }

  dmkInstance = builder.build();
  return dmkInstance;
};

/**
 * Get the DMK singleton. Throws if not initialized.
 */
export const getDmk = (): DeviceManagementKit => {
  if (!dmkInstance) {
    throw new Error("DMK not initialized. Call initDmk() first.");
  }
  return dmkInstance;
};

/**
 * Reset DMK instance (for testing).
 */
export const resetDmk = (): void => {
  if (dmkInstance) {
    dmkInstance.close();
    dmkInstance = null;
  }
};

/**
 * Listen to available devices across all registered transports.
 * Returns arrays of currently visible devices (raw DMK behavior).
 *
 * For add/remove events, see discoverDevicesDmk() in discovery.ts
 */
export const listenToDevicesDmk = (options?: {
  transport?: string;
}): Observable<DiscoveredDevice[]> => {
  return getDmk().listenToAvailableDevices(options ?? {});
};

// Options for withDeviceDmk
export type WithDeviceDmkOptions = {
  openTimeoutMs?: number;
  matchDeviceByName?: string; // For BLE reconnection when ID changes
  transportHint?: "ble" | "usb" | "any"; // Which transport to search
  traceContext?: TraceContext; // For logging/debugging
};

// Active session cache (mirrors current pattern)
const activeSessionCache = new Map<string, { sessionId: string; transport: string }>();

/**
 * Job function type for withDeviceDmk.
 * Receives both the connection handle and context (dmk + device).
 */
export type DmkJob<T> = (connection: DmkDeviceConnection, context: DmkJobContext) => Observable<T>;

/**
 * New withDevice implementation using DMK directly.
 *
 * IMPORTANT: This implementation must handle:
 * 1. Queue management (one job per device at a time)
 * 2. Device discovery (dmk.connect needs DiscoveredDevice, not just ID)
 * 3. Session reuse (avoid reconnecting if already connected)
 * 4. USB devices (no stable ID - connect to first available)
 * 5. BLE name matching (ID can change between connections)
 * 6. Retry logic (transient connection failures)
 *
 * @param deviceId - The device ID (or "" for USB)
 * @param options - Configuration options
 */
export const withDeviceDmk =
  (deviceId: string, options?: WithDeviceDmkOptions) =>
  <T>(job: DmkJob<T>): Observable<T> => {
    return new Observable(subscriber => {
      const dmk = getDmk();
      const queueManager = DeviceQueuedJobsManager.getInstance();
      const previousJob = queueManager.getLastQueuedJob(deviceId);

      let resolveQueuedJob: () => void;
      const jobId = queueManager.setLastQueuedJob(
        deviceId,
        new Promise(resolve => {
          resolveQueuedJob = resolve;
        }),
      );

      let sessionId: string | null = null;
      let unsubscribed = false;

      const findAndConnect = async (): Promise<{ sessionId: string; device: DiscoveredDevice }> => {
        // Step 1: Check for existing reusable session
        const existingSession = activeSessionCache.get(deviceId);
        if (existingSession) {
          try {
            const state = await firstValueFrom(
              dmk.getDeviceSessionState({ sessionId: existingSession.sessionId }),
            );
            if (state.deviceStatus !== DeviceStatus.NOT_CONNECTED) {
              const connectedDevice = dmk.getConnectedDevice({
                sessionId: existingSession.sessionId,
              });
              return {
                sessionId: existingSession.sessionId,
                device: connectedDevice as DiscoveredDevice,
              };
            }
          } catch {
            activeSessionCache.delete(deviceId);
          }
        }

        // Step 2: Discover devices
        const transportFilter =
          options?.transportHint === "ble"
            ? { transport: "rnBle" }
            : options?.transportHint === "usb"
              ? { transport: "rnHid" }
              : {};

        const discoveredDevice = await firstValueFrom(
          dmk.listenToAvailableDevices(transportFilter).pipe(
            map(devices => {
              // For USB (empty deviceId), just take the first device
              if (!deviceId || deviceId === "" || deviceId.startsWith("usb|")) {
                return devices.find(d => d.type === "USB") || null;
              }

              // For BLE, match by ID first
              const byId = devices.find(d => d.id === deviceId);
              if (byId) return byId;

              // If not found by ID, try matching by name (BLE IDs can change)
              if (options?.matchDeviceByName) {
                return (
                  devices.find(d =>
                    d.name?.toLowerCase().includes(options.matchDeviceByName!.toLowerCase()),
                  ) || null
                );
              }

              return null;
            }),
            first(device => device !== null),
            options?.openTimeoutMs ? timeout(options.openTimeoutMs) : tap(),
          ),
        );

        if (!discoveredDevice) {
          throw new CantOpenDevice("No matching device found");
        }

        // Step 3: Connect with retry logic
        const MAX_RETRIES = 5;
        const RETRY_DELAY = 500;
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          try {
            const newSessionId = await dmk.connect({
              device: discoveredDevice,
              sessionRefresherOptions: { isRefresherDisabled: true },
            });

            // Cache the session for reuse
            activeSessionCache.set(deviceId, {
              sessionId: newSessionId,
              transport: discoveredDevice.transport,
            });

            return { sessionId: newSessionId, device: discoveredDevice };
          } catch (error) {
            lastError = error as Error;

            // Don't retry on permanent connection errors
            if (isPermanentConnectionError(error)) {
              throw remapError(error, {
                phase: "connection",
                transportType: inferTransportType(discoveredDevice),
                device: discoveredDevice,
              });
            }

            // Wait before retry
            if (attempt < MAX_RETRIES - 1) {
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            }
          }
        }

        throw lastError || new CantOpenDevice("Connection failed after retries");
      };

      const execute = async () => {
        try {
          // Wait for previous job to complete
          await previousJob.job;

          if (unsubscribed) {
            resolveQueuedJob!();
            return;
          }

          // Find and connect to device
          const { sessionId: connectedSessionId, device } = await findAndConnect();
          sessionId = connectedSessionId;

          if (unsubscribed) {
            await dmk.disconnect({ sessionId });
            activeSessionCache.delete(deviceId);
            resolveQueuedJob!();
            return;
          }

          // Determine transport type for error handling
          const transportType = inferTransportType(device);

          const connection: DmkDeviceConnection = {
            sessionId,
            deviceId: device.id,
            deviceName: device.name,
            transportType,
            sendApdu: async (apdu: Uint8Array, sendOptions?: { abortTimeoutMs?: number }) => {
              try {
                // Desktop-specific: auto-reconnect if session lost
                if (transportType === "webhid") {
                  const devices = dmk.listConnectedDevices();
                  if (!devices.some(d => d.sessionId === sessionId)) {
                    // Session lost, reconnect
                    const [newDevice] = await firstValueFrom(dmk.listenToAvailableDevices({}));
                    const newSessionId = await dmk.connect({
                      device: newDevice,
                      sessionRefresherOptions: { isRefresherDisabled: true },
                    });
                    sessionId = newSessionId;
                    activeSessionCache.set(deviceId, {
                      sessionId: newSessionId,
                      transport: device.transport,
                    });
                  }
                }

                return dmk.sendApdu({
                  sessionId: sessionId!,
                  apdu,
                  abortTimeout: sendOptions?.abortTimeoutMs,
                });
              } catch (error) {
                // Apply transport-specific error remapping
                throw remapError(error, { phase: "exchange", transportType, device });
              }
            },
            close: async () => {
              // Disconnect the DMK session
              if (sessionId) {
                await dmk.disconnect({ sessionId }).catch(() => {});
                activeSessionCache.delete(deviceId);
              }
            },
          };

          // Build job context
          const context: DmkJobContext = { dmk, device };

          // Execute the job with connection AND context
          job(connection, context)
            .pipe(
              catchError(error =>
                throwError(() => remapError(error, { phase: "job", transportType, device })),
              ),
              finalize(() => {
                resolveQueuedJob!();
              }),
            )
            .subscribe({
              next: value => subscriber.next(value),
              error: error => subscriber.error(error),
              complete: () => subscriber.complete(),
            });
        } catch (error) {
          resolveQueuedJob!();
          // At this point we may not have device info, so infer transport from options
          const fallbackTransportType: TransportType =
            options?.transportHint === "usb"
              ? "usb"
              : options?.transportHint === "ble"
                ? "ble"
                : deviceId === "" || deviceId.startsWith("usb|")
                  ? "usb"
                  : "ble";
          subscriber.error(
            remapError(error as Error, {
              phase: "connection",
              transportType: fallbackTransportType,
              device: undefined,
            }),
          );
        }
      };

      execute();

      return () => {
        unsubscribed = true;
      };
    });
  };

// ============================================================================
// ERROR HANDLING HELPERS
// These must replicate the multi-layer error handling from current transports
// ============================================================================

/**
 * Errors that should NOT trigger connection retry
 * (from current transport implementations)
 */
function isPermanentConnectionError(error: unknown): boolean {
  return (
    // BLE-specific
    error instanceof PairingRefusedError ||
    error instanceof PeerRemovedPairing ||
    error instanceof OpeningConnectionError
  );
}

/**
 * Errors that should NOT trigger job retry (from genericCanRetryOnError)
 */
function isPermanentJobError(error: unknown): boolean {
  return (
    error instanceof WrongAppForCurrency ||
    error instanceof WrongDeviceForAccount ||
    error instanceof CantOpenDevice ||
    error instanceof BluetoothRequired ||
    error instanceof UpdateYourApp ||
    error instanceof FirmwareOrAppUpdateRequired ||
    error instanceof DeviceHalted ||
    error instanceof TransportWebUSBGestureRequired ||
    error instanceof TransportInterfaceNotAvailable
  );
}

/**
 * Remap connection errors (BLE-specific)
 */
function remapConnectionError(error: unknown, device?: DiscoveredDevice): Error {
  if (error instanceof PairingRefusedError) {
    return new PairingFailed();
  }
  if (isPeerRemovedPairingError(error) && device) {
    return new PeerRemovedPairing(undefined, {
      productName: getDeviceModel(dmkToLedgerDeviceIdMap[device.deviceModel.model])?.productName,
    });
  }
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Remap APDU exchange errors
 * NOTE: This is transport-specific in current implementation!
 * - HID: DMK disconnect errors → DisconnectedDevice
 * - BLE: No remapping
 * - Desktop: No remapping (but has auto-reconnect)
 * - Speculos/Mock: No remapping
 */
function remapExchangeError(error: unknown, transportType: TransportType): Error {
  if (transportType === "usb") {
    // HID-specific: DMK disconnect errors → DisconnectedDevice
    if (
      error instanceof SendApduEmptyResponseError ||
      error instanceof DeviceDisconnectedWhileSendingError ||
      error instanceof DeviceDisconnectedBeforeSendingApdu
    ) {
      return new DisconnectedDevice();
    }
  }
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Remap status code errors (from deviceAccess.ts initialErrorRemapping)
 * Applies to ALL transports
 */
function remapStatusCodeError(error: unknown): Error {
  if (error instanceof TransportStatusError) {
    if (error.statusCode === 0x6faa) {
      return new DeviceHalted(error.message);
    }
    if (error.statusCode === 0x6b00) {
      return new FirmwareOrAppUpdateRequired(error.message);
    }
  }
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Error remapping context
 */
type ErrorRemapContext = {
  phase: "connection" | "exchange" | "job";
  transportType: TransportType;
  device?: DiscoveredDevice;
};

/**
 * Full error remapping pipeline
 */
function remapError(error: unknown, context: ErrorRemapContext): Error {
  let mappedError = error;

  if (context.phase === "connection") {
    mappedError = remapConnectionError(mappedError, context.device);
  } else if (context.phase === "exchange") {
    mappedError = remapExchangeError(mappedError, context.transportType);
    mappedError = remapStatusCodeError(mappedError);
  } else if (context.phase === "job") {
    // Job errors: apply status code mapping, then check if retryable
    mappedError = remapStatusCodeError(mappedError);
  }

  return mappedError instanceof Error ? mappedError : new Error(String(mappedError));
}

/**
 * Infer transport type from DiscoveredDevice
 * Used for transport-specific error handling
 */
function inferTransportType(device: DiscoveredDevice): TransportType {
  // This depends on DMK's transport identifier convention
  switch (device.transport) {
    case "rnBle":
      return "ble";
    case "rnHid":
      return "usb";
    case "webHid":
      return "webhid";
    case "speculos":
      return "speculos";
    case "mockBle":
      return "mockBle";
    default:
      // Fallback based on device type
      return device.type === "BLE" ? "ble" : "usb";
  }
}
```

### Compatibility Layer

For gradual migration, we provide `DmkTransportCompat` - a wrapper that makes DMK look like the legacy `Transport`. This is required for compatibility with `hw-app-*` packages.

> **See the full implementation in [Can We Fully Remove Legacy Dependencies?](#can-we-fully-remove-legacy-dependencies) → [Solution: Compatibility Layer](#solution-compatibility-layer)**

The key components are:

- **`DmkTransportCompat`**: Wraps `DmkDeviceConnection` to provide the `Transport.exchange()` interface
- **`withDevice(deviceId)`**: Drop-in replacement that uses `withDeviceDmk` internally
- **`withDevicePromise(deviceId, fn)`**: Promise-based version for async/await code

---

## Implementation Plan

This section details each migration phase with architecture diagrams showing the system state at each step.

---

### Phase 0: Current State (Before Migration)

**Architecture Diagram:**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION LAYER                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │    LLM (Mobile)     │  │    LLD (Desktop)    │  │         CLI             │  │
│  └──────────┬──────────┘  └──────────┬──────────┘  └────────────┬────────────┘  │
└─────────────┼────────────────────────┼──────────────────────────┼───────────────┘
              │                        │                          │
              ▼                        ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          LIVE-COMMON (hw/index.ts)                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  registerTransportModule({                                                │   │
│  │    id: "ble" | "hid" | "webhid" | "speculos",                            │   │
│  │    open: (id) => Transport,                                               │   │
│  │    discovery?: Observable<DeviceEvent>                                    │   │
│  │  })                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  withDevice(deviceId: string)(job: (t: Transport) => Observable<T>)      │   │
│  │    • Queue management (DeviceQueuedJobsManager)                           │   │
│  │    • Calls registered module.open()                                       │   │
│  │    • No session reuse                                                     │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
              │                        │                          │
              ▼                        ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        TRANSPORT WRAPPER CLASSES                                 │
│  ┌────────────────────────┐  ┌─────────────────────┐  ┌──────────────────────┐  │
│  │ DeviceMgmtKit-         │  │ DeviceMgmtKit-      │  │ DeviceMgmtKit-       │  │
│  │ BLETransport           │  │ HIDTransport        │  │ Transport (Desktop)  │  │
│  │ extends Transport      │  │ extends Transport   │  │ extends Transport    │  │
│  ├────────────────────────┤  ├─────────────────────┤  ├──────────────────────┤  │
│  │ • Session reuse        │  │ • Session reuse     │  │ • Auto-reconnect     │  │
│  │ • Retry logic          │  │ • Error remapping   │  │   in exchange()      │  │
│  │ • Error remapping      │  │ • Disconnect events │  │ • Disconnect events  │  │
│  │ • Name matching        │  │                     │  │                      │  │
│  └───────────┬────────────┘  └──────────┬──────────┘  └───────────┬──────────┘  │
└──────────────┼──────────────────────────┼─────────────────────────┼──────────────┘
               │                          │                         │
               ▼                          ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DMK INSTANCES (MULTIPLE!)                           │
│  ┌────────────────────────┐  ┌─────────────────────┐  ┌──────────────────────┐  │
│  │   DMK Instance 1       │  │   DMK Instance 2    │  │   DMK Instance 3     │  │
│  │   (Mobile App)         │  │   (Desktop App)     │  │   (Speculos!)        │  │
│  │   ┌─────────────────┐  │  │   ┌───────────────┐ │  │   ┌────────────────┐ │  │
│  │   │ RNBleTransport  │  │  │   │ WebHidTrans.  │ │  │   │ SpeculosTrans. │ │  │
│  │   │ RNHidTransport  │  │  │   └───────────────┘ │  │   └────────────────┘ │  │
│  │   └─────────────────┘  │  │                     │  │                      │  │
│  └────────────────────────┘  └─────────────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘

❌ PROBLEMS:
   • Multiple DMK instances (one per app, plus extras for Speculos)
   • Wrapper classes duplicate logic (session reuse, retries, error handling)
   • Legacy Transport interface limits DMK capabilities
   • E2E mocking requires UI-level hacks
```

---

### Phase 1: Infrastructure (Week 1-2)

**Goal:** Create the new DMK abstraction module in `live-common` without breaking existing code.

**Architecture Diagram:**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION LAYER                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │    LLM (Mobile)     │  │    LLD (Desktop)    │  │         CLI             │  │
│  └──────────┬──────────┘  └──────────┬──────────┘  └────────────┬────────────┘  │
└─────────────┼────────────────────────┼──────────────────────────┼───────────────┘
              │                        │                          │
              ▼                        ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        LIVE-COMMON (hw/ directory)                               │
│                                                                                  │
│  ┌────────────────────────────────────────┐  ┌──────────────────────────────┐   │
│  │  hw/index.ts (LEGACY - unchanged)      │  │  hw/dmk/index.ts (NEW!)      │   │
│  │  • registerTransportModule             │  │  • initDmk()                 │   │
│  │  • withDevice()                        │  │  • getDmk()                  │   │
│  │  • discoverDevices()                   │  │  • withDeviceDmk()           │   │
│  └────────────────────────────────────────┘  │  • DmkDeviceConnection       │   │
│                                              │  • TransportType             │   │
│                                              └──────────────────────────────┘   │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  hw/dmk/compat.ts (NEW!)                                                   │ │
│  │  • DmkTransportCompat extends Transport                                    │ │
│  │  • withDevice() (DMK-based, same API as legacy)                           │ │
│  │  • withDevicePromise()                                                     │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  hw/dmk/deviceRegistry.ts (NEW!)                                           │ │
│  │  • DeviceRegistry class (Map<deviceId, DiscoveredDevice>)                  │ │
│  │  • register(), unregister(), get(), findByName()                           │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  hw/dmk/discovery.ts (NEW!)                                                │ │
│  │  • discoverDevicesDmk() - unified discovery                                │ │
│  │  • DeviceEvent type (add/remove events)                                    │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘

✅ DELIVERABLES:
   • New hw/dmk/ module with all core functions
   • Unit tests for initDmk, withDeviceDmk, deviceRegistry
   • Integration tests with mock transport
   • No changes to existing code paths - apps still use legacy
```

**Tasks:**

1. **Create DMK abstraction module**

   - `libs/ledger-live-common/src/hw/dmk/index.ts`
   - `libs/ledger-live-common/src/hw/dmk/compat.ts`
   - `libs/ledger-live-common/src/hw/dmk/deviceRegistry.ts`
   - `libs/ledger-live-common/src/hw/dmk/discovery.ts`
   - Export types and functions

2. **Add tests**
   - Unit tests for `initDmk`, `withDeviceDmk`, `DeviceRegistry`
   - Integration tests with mock transport

---

### Phase 2: Platform Initialization (Week 2-3)

**Goal:** Each platform initializes a single DMK instance at startup with its transports.

**Architecture Diagram:**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION LAYER                                   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                         LLM (Mobile)                                        ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐   ││
│  │  │  src/dmk/init.ts (NEW!)                                              │   ││
│  │  │  initMobileDmk({                                                     │   ││
│  │  │    transports: [                                                     │   ││
│  │  │      Config.MOCK ? mockBleTransportFactory(e2eBridgeClient)         │   ││
│  │  │                  : RNBleTransportFactory,                            │   ││
│  │  │      RNHidTransportFactory,                                          │   ││
│  │  │    ]                                                                 │   ││
│  │  │  })                                                                  │   ││
│  │  └─────────────────────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                         LLD (Desktop)                                       ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐   ││
│  │  │  src/renderer/dmk/init.ts (NEW!)                                     │   ││
│  │  │  initDesktopDmk({                                                    │   ││
│  │  │    transports: [                                                     │   ││
│  │  │      getEnv("SPECULOS_API_PORT") ? speculosTransportFactory(url)    │   ││
│  │  │                                  : WebHidTransportFactory,           │   ││
│  │  │    ]                                                                 │   ││
│  │  │  })                                                                  │   ││
│  │  └─────────────────────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                         CLI                                                 ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐   ││
│  │  │  src/dmk/init.ts (NEW!)                                              │   ││
│  │  │  initCliDmk({                                                        │   ││
│  │  │    transports: [                                                     │   ││
│  │  │      process.env.SPECULOS_API_PORT ? speculosTransportFactory(url)  │   ││
│  │  │                                    : NodeHidTransportFactory,        │   ││
│  │  │    ]                                                                 │   ││
│  │  │  })                                                                  │   ││
│  │  └─────────────────────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SINGLE DMK INSTANCE (per platform)                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                        DeviceManagementKit                                │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │   │
│  │  │ BLE Factory  │ │ HID Factory  │ │ WebHID Fact. │ │ Speculos Factory │ │   │
│  │  │ (if mobile)  │ │ (if mobile)  │ │ (if desktop) │ │ (if enabled)     │ │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘ │   │
│  │                                                                           │   │
│  │  • connect(DiscoveredDevice) → sessionId                                  │   │
│  │  • sendApdu({ sessionId, apdu })                                          │   │
│  │  • disconnect({ sessionId })                                              │   │
│  │  • listenToAvailableDevices()                                             │   │
│  │  • getDeviceSessionState({ sessionId })                                   │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘

✅ DELIVERABLES:
   • Each platform has a single init file for DMK
   • E2E mock transport injected at init time (not UI level)
   • Speculos is just another transport (no separate DMK instance)
   • Both LEGACY and NEW paths work in parallel
```

#### LLM (Mobile)

```typescript
// apps/ledger-live-mobile/src/dmk/init.ts
import { initDmk } from "@ledgerhq/live-common/hw/dmk";
import { RNBleTransportFactory } from "@ledgerhq/device-transport-kit-react-native-ble";
import { RNHidTransportFactory } from "@ledgerhq/device-transport-kit-react-native-hid";
import { mockBleTransportFactory } from "./mockBleTransportFactory";
import Config from "react-native-config";
import { e2eBridgeClient } from "../e2e/bridge/client";

export const initMobileDmk = () => {
  const transports: TransportFactory[] = [];

  // E2E mock mode
  if (Config.MOCK || Config.DETOX) {
    transports.push(mockBleTransportFactory(e2eBridgeClient));
  } else {
    transports.push(RNBleTransportFactory);
  }

  // HID always available
  transports.push(RNHidTransportFactory);

  return initDmk({ transports });
};
```

#### LLD (Desktop)

```typescript
// apps/ledger-live-desktop/src/renderer/dmk/init.ts
import { initDmk } from "@ledgerhq/live-common/hw/dmk";
import { WebHidTransportFactory } from "@ledgerhq/device-transport-kit-web-hid";
import { speculosTransportFactory } from "@ledgerhq/device-transport-kit-speculos";
import { getEnv } from "@ledgerhq/live-env";

export const initDesktopDmk = () => {
  const transports: TransportFactory[] = [];

  // Speculos mode
  if (getEnv("SPECULOS_API_PORT")) {
    const speculosUrl = `http://localhost:${getEnv("SPECULOS_API_PORT")}`;
    transports.push(speculosTransportFactory(speculosUrl, true));
  } else {
    transports.push(WebHidTransportFactory);
  }

  return initDmk({ transports });
};
```

#### CLI

```typescript
// apps/cli/src/dmk/init.ts
import { initDmk } from "@ledgerhq/live-common/hw/dmk";
import { speculosTransportFactory } from "@ledgerhq/device-transport-kit-speculos";
// Note: NodeHidTransportFactory would need to be created

export const initCliDmk = () => {
  const transports: TransportFactory[] = [];

  if (process.env.SPECULOS_API_PORT) {
    const speculosUrl = `http://localhost:${process.env.SPECULOS_API_PORT}`;
    transports.push(speculosTransportFactory(speculosUrl, true));
  }
  // else: add NodeHidTransportFactory when available

  return initDmk({ transports });
};
```

### Phase 3: New Transport Factories (Week 3-4)

**Goal:** Fill gaps in transport coverage by creating missing DMK-native factories.

#### Transport Coverage Matrix

| Transport                     | Platform   | Status         | Priority | Notes                              |
| ----------------------------- | ---------- | -------------- | -------- | ---------------------------------- |
| **RNBleTransportFactory**     | Mobile     | ✅ Exists      | -        | From DMK team                      |
| **RNHidTransportFactory**     | Mobile     | ✅ Exists      | -        | From DMK team                      |
| **WebHidTransportFactory**    | Desktop    | ✅ Exists      | -        | From DMK team                      |
| **speculosTransportFactory**  | All        | ✅ Exists      | -        | From `@ledgerhq/live-dmk-speculos` |
| **NodeHidTransportFactory**   | CLI        | 🔄 In Progress | High     | Coordinate with existing work      |
| **mockBleTransportFactory**   | Mobile E2E | 📝 To Create   | High     | Uses `e2eBridgeClient`             |
| **VaultTransportFactory**     | Desktop    | 📝 To Create   | Medium   | Enterprise feature                 |
| **MockTransportFactory**      | Unit tests | 📝 To Create   | Medium   | APDU recording/playback            |
| **HttpDebugTransportFactory** | Mobile dev | ⏭️ Optional    | Low      | Simple HTTP proxy wrapper          |

#### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        DMK TRANSPORT FACTORIES                                   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                           EXISTING (from DMK team)                          ││
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ ││
│  │  │ RNBleTransport  │  │ RNHidTransport  │  │ WebHidTransportFactory      │ ││
│  │  │ Factory         │  │ Factory         │  │                             │ ││
│  │  │ (Mobile BLE)    │  │ (Mobile USB)    │  │ (Desktop WebHID)            │ ││
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘ ││
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ ││
│  │  │ speculosTransportFactory (from @ledgerhq/live-dmk-speculos)             │ ││
│  │  └─────────────────────────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                      IN PROGRESS / TO CREATE (this phase)                   ││
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ ││
│  │  │ NodeHidTransport│  │ VaultTransport  │  │ MockTransportFactory        │ ││
│  │  │ Factory         │  │ Factory         │  │                             │ ││
│  │  │ 🔄 IN PROGRESS  │  │ (LLD Enterprise │  │ (Unit tests, APDU           │ ││
│  │  │ (coordinate!)   │  │  Vault feature) │  │  recording/playback)        │ ││
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘ ││
│  │  ┌───────────────────────────────┐  ┌────────────────────────────────────┐ ││
│  │  │ mockBleTransportFactory       │  │ HttpDebugTransportFactory          │ ││
│  │  │ (Mobile E2E, e2eBridgeClient) │  │ (Mobile dev mode, optional)        │ ││
│  │  └───────────────────────────────┘  └────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘

✅ DELIVERABLES:
   • NodeHidTransportFactory - Coordinate with existing in-progress implementation
   • mockBleTransportFactory - E2E tests mock at transport level
   • VaultTransportFactory - Enterprise feature works with DMK
   • MockTransportFactory - Unit tests don't need real device
   • (Optional) HttpDebugTransportFactory - Dev mode debugging
```

#### Tasks

1. **NodeHidTransportFactory** (for CLI) - 🔄 **IN PROGRESS**

   > ⚠️ **Note:** Implementation already in progress. Coordinate with existing work to ensure DMK `Transport` interface compatibility.

   - Verify it implements DMK `Transport` interface correctly
   - Ensure `listenToAvailableDevices()` works for device discovery
   - Test with CLI commands

2. **mockBleTransportFactory** (for Mobile E2E) - **HIGH PRIORITY**

   - Implement DMK `Transport` interface
   - Subscribe to `e2eBridgeClient` for mock events
   - Handle `add`, `open`, and APDU exchange via bridge
   - See detailed implementation in [Platform-Specific Details](#mobile-e2e-mock-transport)

3. **VaultTransportFactory** (for LLD enterprise)

   - Implement DMK `Transport` interface
   - Wrap existing `VaultTransport` logic
   - Considerations:
     - Session management with Vault backend
     - Authentication token handling
     - Enterprise feature flag integration
     - Error mapping specific to Vault errors

4. **MockTransportFactory** (for unit tests)

   - Implement DMK `Transport` interface
   - Support APDU recording/playback (like existing `openTransportReplayer`)
   - Enable deterministic testing without real device

5. **HttpDebugTransportFactory** (for Mobile dev mode) - **OPTIONAL**

   - Simple wrapper around `@ledgerhq/hw-transport-http`
   - Only needed if dev mode debugging is actively used
   - Can be deferred or skipped

#### Desktop IPC Transport Clarification

The current Desktop uses `IPCTransport` for Speculos/proxy communication. With the new architecture:

```
BEFORE (Desktop with Speculos):
┌──────────────┐     IPC      ┌──────────────┐    HTTP    ┌──────────────┐
│   Renderer   │ ◄──────────► │ Main Process │ ◄────────► │   Speculos   │
│ IPCTransport │              │    Proxy     │            │              │
└──────────────┘              └──────────────┘            └──────────────┘

AFTER (Desktop with Speculos):
┌──────────────┐               HTTP (direct)              ┌──────────────┐
│   Renderer   │ ◄──────────────────────────────────────► │   Speculos   │
│ speculosTrans│                                          │              │
│ portFactory  │                                          │              │
└──────────────┘                                          └──────────────┘
```

**Decision:** When `SPECULOS_API_PORT` is set, inject `speculosTransportFactory` directly at DMK init. The renderer communicates directly with Speculos via HTTP - no IPC layer needed.

> **Note:** If network isolation is required (Speculos only accessible from main process), an `IPCTransportFactory` would be needed. This is unlikely for typical dev/test scenarios.

---

### Phase 4: Gradual Consumer Migration (Week 4-8)

**Goal:** Migrate consumers from legacy `withDevice` to the new DMK-based implementation.

**Architecture Diagram:**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION CODE                                    │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                        CONSUMER CODE (e.g., hw-app-btc)                   │   │
│  │                                                                           │   │
│  │   // STEP 1: Change import (drop-in replacement)                          │   │
│  │   // import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess"; │   │
│  │   import { withDevice } from "@ledgerhq/live-common/hw/dmk/compat";       │   │
│  │                                                                           │   │
│  │   withDevice(deviceId)(transport => {                                     │   │
│  │     const btc = new Btc({ transport });  // Still works!                 │   │
│  │     return from(btc.getAddress(...));                                     │   │
│  │   });                                                                     │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  hw/dmk/compat.ts                                                         │   │
│  │  ┌────────────────────────────────────────────────────────────────────┐  │   │
│  │  │ withDevice(deviceId)(job)                                           │  │   │
│  │  │   └─► withDeviceDmk(deviceId)((connection, context) => {           │  │   │
│  │  │         const transport = createTransportCompat(connection, ...);   │  │   │
│  │  │         return job(transport);  // Wraps DmkDeviceConnection        │  │   │
│  │  │       })                                                            │  │   │
│  │  └────────────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  DmkTransportCompat extends Transport                                     │   │
│  │  ┌────────────────────────────────────────────────────────────────────┐  │   │
│  │  │ exchange(apdu: Buffer): Promise<Buffer>                             │  │   │
│  │  │   └─► connection.sendApdu(Uint8Array(apdu))                        │  │   │
│  │  │       └─► dmk.sendApdu({ sessionId, apdu })                        │  │   │
│  │  │                                                                     │  │   │
│  │  │ Provides: setScrambleKey(), decorateAppAPIMethods(), close()        │  │   │
│  │  │ Emits: "disconnect" event (from DMK session state)                  │  │   │
│  │  └────────────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘

```

#### Phase 4 Sub-Phases (Detailed Breakdown)

Phase 4 is the largest phase. Breaking it into sub-phases allows for incremental validation:

##### Phase 4a: Infrastructure & Feature Flag (Week 4)

**Goal:** Enable parallel operation of legacy and new code paths.

| Task                     | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| Add feature flag         | `ENABLE_DMK_DIRECT_TRANSPORT` - allows toggling per-platform |
| Create import shim       | New `withDevice` import auto-selects based on flag           |
| Add deprecation warnings | Legacy `withDevice` logs warning when called                 |
| CI/CD setup              | Run tests with both flag states                              |

```typescript
// libs/ledger-live-common/src/hw/index.ts
import { withDevice as withDeviceLegacy } from "./deviceAccess";
import { withDevice as withDeviceDmk } from "./dmk/compat";
import { getEnv } from "@ledgerhq/live-env";

/** @deprecated Use import from @ledgerhq/live-common/hw/dmk/compat */
export const withDevice = (...args) => {
  if (getEnv("ENABLE_DMK_DIRECT_TRANSPORT")) {
    return withDeviceDmk(...args);
  }
  console.warn("withDevice: Using legacy implementation. Migrate to hw/dmk/compat");
  return withDeviceLegacy(...args);
};
```

##### Phase 4b: Device Actions & Manager (Week 5)

**Goal:** Migrate critical device operations.

| Flow                        | Files                                | Risk   |
| --------------------------- | ------------------------------------ | ------ |
| Device connect              | `connectApp.ts`, `connectManager.ts` | Medium |
| Open app                    | `hw/actions/app.ts`                  | Medium |
| Genuine check               | `hw/actions/genuineCheck.ts`         | High   |
| Manager (install/uninstall) | `hw/actions/manager.ts`              | High   |
| Device info                 | `hw/getDeviceInfo.ts`                | Low    |

**Validation:**

- E2E tests: onboarding, manager flows
- Manual QA: connect device, open apps, install/uninstall

##### Phase 4c: Firmware & Recovery (Week 6)

**Goal:** Migrate firmware update flows (highest risk).

| Flow               | Files                         | Risk         |
| ------------------ | ----------------------------- | ------------ |
| Firmware update    | `hw/firmwareUpdate*.ts`       | **Critical** |
| Recovery mode      | `hw/actions/staxRecovery*.ts` | High         |
| Custom lock screen | `hw/customLockScreen*.ts`     | Medium       |

**Validation:**

- Staged rollout with firmware update
- Extensive QA on all device models
- Rollback plan ready

##### Phase 4d: Account Operations (Week 7)

**Goal:** Migrate account sync, signing, derivation.

| Flow                | Files                       | Risk   |
| ------------------- | --------------------------- | ------ |
| Account sync        | `families/*/bridge.ts`      | Medium |
| Transaction signing | `families/*/transaction.ts` | High   |
| Address derivation  | `hw/getAddress.ts`          | Medium |
| Message signing     | `hw/signMessage.ts`         | Medium |

**Validation:**

- Test each coin family
- Verify transaction signing on real devices
- Check address derivation matches legacy

##### Phase 4e: Remaining Consumers & Cleanup (Week 8)

**Goal:** Migrate remaining flows and enable flag by default.

| Task        | Description                                   |
| ----------- | --------------------------------------------- |
| Swap flows  | `exchange/swap/*.ts`                          |
| Sell flows  | `exchange/sell/*.ts`                          |
| Stake flows | Per-family staking operations                 |
| Enable flag | `ENABLE_DMK_DIRECT_TRANSPORT=true` by default |
| Monitor     | Watch Sentry for regressions                  |

#### Rollout Strategy

```
Week 4: Flag OFF by default, internal testing only
Week 5: Flag ON for 5% of users (canary)
Week 6: Flag ON for 25% of users
Week 7: Flag ON for 50% of users
Week 8: Flag ON for 100%, remove flag in Phase 5
```

#### Deliverables Summary

✅ All `withDevice` imports changed to `hw/dmk/compat`
✅ Feature flag for parallel operation
✅ High-priority flows migrated and tested
✅ Deprecation warnings in legacy code
✅ Migration guide documentation
✅ Staged rollout to catch regressions

---

### Phase 5: Cleanup (Week 8-10)

**Goal:** Remove all legacy code now that everything uses DMK.

**Architecture Diagram (Final State):**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION LAYER                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │    LLM (Mobile)     │  │    LLD (Desktop)    │  │         CLI             │  │
│  │                     │  │                     │  │                         │  │
│  │  initMobileDmk()    │  │  initDesktopDmk()   │  │  initCliDmk()           │  │
│  └──────────┬──────────┘  └──────────┬──────────┘  └────────────┬────────────┘  │
└─────────────┼────────────────────────┼──────────────────────────┼───────────────┘
              │                        │                          │
              ▼                        ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          LIVE-COMMON (hw/dmk/)                                   │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  withDeviceDmk(deviceId, options)(job: DmkJob<T>)                        │   │
│  │                                                                           │   │
│  │  Features (all consolidated here):                                        │   │
│  │    • Queue management (DeviceQueuedJobsManager)                           │   │
│  │    • Session reuse (activeSessionCache)                                   │   │
│  │    • Device discovery (DeviceRegistry + DMK)                              │   │
│  │    • Retry logic (connection + auto-reconnect)                            │   │
│  │    • Error remapping (per transport type)                                 │   │
│  │    • USB fallback (empty ID → first available)                            │   │
│  │    • BLE name matching (ID can change)                                    │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  DmkTransportCompat (for hw-app-* compatibility)                          │   │
│  │    • Wraps DmkDeviceConnection → Transport interface                      │   │
│  │    • exchange() → sendApdu()                                              │   │
│  │    • Emits "disconnect" event                                             │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  discoverDevicesDmk() + DeviceRegistry                                    │   │
│  │    • Unified discovery across all transports                              │   │
│  │    • Auto-populates registry for withDeviceDmk                            │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
              │                        │                          │
              ▼                        ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SINGLE DMK INSTANCE (per platform)                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                        DeviceManagementKit                                │   │
│  │                                                                           │   │
│  │  Transports (platform-specific, injected at init):                        │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │   │
│  │  │ RNBle        │ │ RNHid        │ │ WebHid       │ │ Speculos         │ │   │
│  │  │ (Mobile)     │ │ (Mobile)     │ │ (Desktop)    │ │ (E2E/Dev)        │ │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘ │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                      │   │
│  │  │ MockBle      │ │ NodeHid      │ │ Vault        │                      │   │
│  │  │ (E2E tests)  │ │ (CLI)        │ │ (Enterprise) │                      │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘                      │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ❌ REMOVED (all legacy code)
┌─────────────────────────────────────────────────────────────────────────────────┐
│  • registerTransportModule() / unregisterAllTransportModules()                  │
│  • Legacy withDevice() in hw/deviceAccess.ts                                    │
│  • discoverDevices() in hw/index.ts                                             │
│  • DeviceManagementKitBLETransport (wrapper class)                              │
│  • DeviceManagementKitHIDTransport (wrapper class)                              │
│  • DeviceManagementKitTransport (wrapper class)                                 │
│  • DeviceManagementKitTransportSpeculos (wrapper class)                         │
│  • registerTransports.ts (LLM)                                                  │
│  • registerTransportModules() (LLD)                                             │
│  • Transport registration in CLI                                                │
└─────────────────────────────────────────────────────────────────────────────────┘

✅ FINAL STATE:
   • Single DMK instance per platform
   • All device access through withDeviceDmk
   • Transport-level mocking (no UI hacks)
   • Unified device discovery
   • All complexity in one place (live-common)
   • Legacy wrappers removed
```

**Tasks:**

1. Remove legacy wrapper classes:

   - `DeviceManagementKitBLETransport`
   - `DeviceManagementKitHIDTransport`
   - `DeviceManagementKitTransport`
   - `DeviceManagementKitTransportSpeculos`

2. Remove legacy registration:

   - `registerTransports.ts` in LLM
   - `registerTransportModules` in LLD
   - Transport registration in CLI

3. Remove compatibility layer (only if all hw-app-\* consumers migrated to DMK-native API)

---

### Phase Summary Table

| Phase     | Duration     | Key Deliverable                      | Breaking Changes |
| --------- | ------------ | ------------------------------------ | ---------------- |
| Phase 0   | -            | Current state (baseline)             | -                |
| Phase 1   | 2 weeks      | New `hw/dmk/` module in live-common  | None             |
| Phase 2   | 1 week       | Platform-specific DMK initialization | None             |
| Phase 3   | 1 week       | Missing transport factories          | None             |
| Phase 4   | 4 weeks      | Consumer migration + deprecation     | Deprecations     |
| Phase 5   | 2 weeks      | Remove legacy code                   | Yes (removals)   |
| **Total** | **10 weeks** |                                      |                  |

---

### Testing Strategy

Each phase requires specific testing to ensure behavior parity with the legacy implementation.

#### Test Types

| Type                           | Description                                                                 | When      |
| ------------------------------ | --------------------------------------------------------------------------- | --------- |
| **Unit Tests**                 | Test individual functions (`withDeviceDmk`, `remapError`, `DeviceRegistry`) | Phase 1   |
| **Integration Tests**          | Test with mock transport (APDU recording/playback)                          | Phase 1-3 |
| **E2E Tests (Detox/Speculos)** | Full device flows on emulator                                               | Phase 2-4 |
| **Manual QA**                  | Real device testing on all models                                           | Phase 4-5 |
| **Regression Tests**           | Existing e2e suite with new flag enabled                                    | Phase 4   |

#### Test Matrix by Phase

| Phase   | Unit        | Integration | E2E           | Manual QA        |
| ------- | ----------- | ----------- | ------------- | ---------------- |
| Phase 1 | ✅ Required | ✅ Required | ⬜ N/A        | ⬜ N/A           |
| Phase 2 | ✅ Update   | ✅ Update   | ✅ Required   | ⬜ Optional      |
| Phase 3 | ✅ Required | ✅ Required | ✅ Required   | ⬜ Optional      |
| Phase 4 | ✅ Update   | ✅ Update   | ✅ Required   | ✅ Required      |
| Phase 5 | ✅ Cleanup  | ✅ Cleanup  | ✅ Full suite | ✅ Full coverage |

#### Behavior Parity Checklist

For each migrated flow, verify:

- [ ] Same APDU sequences sent to device
- [ ] Same error types thrown for same failure conditions
- [ ] Same retry behavior (count, delays)
- [ ] Session reuse works identically
- [ ] Disconnect events propagate correctly
- [ ] Timeout behavior matches
- [ ] Queue serialization works (no concurrent device access)

#### Device Coverage

Test on all supported device models:

| Device          | BLE | USB | Priority |
| --------------- | --- | --- | -------- |
| Nano X          | ✅  | ✅  | High     |
| Nano S Plus     | ⬜  | ✅  | High     |
| Stax            | ✅  | ✅  | High     |
| Flex            | ✅  | ✅  | High     |
| Nano S (legacy) | ⬜  | ✅  | Medium   |

---

### Rollback Strategy

Each phase must be independently rollback-able to minimize risk.

#### Feature Flag Approach

```typescript
// libs/ledger-live-common/src/hw/index.ts

const USE_DMK_TRANSPORT = getEnv("ENABLE_DMK_DIRECT_TRANSPORT");

export const withDevice = USE_DMK_TRANSPORT ? withDeviceDmk : withDeviceLegacy;
```

#### Rollback Triggers

| Trigger                                | Action                                 | Owner    |
| -------------------------------------- | -------------------------------------- | -------- |
| E2E test failures > 5%                 | Disable flag, investigate              | QA       |
| Sentry error spike (transport-related) | Disable flag for % of users            | On-call  |
| Manual QA finds critical bug           | Block release, fix forward or rollback | Dev team |
| Firmware update failures               | Immediate rollback                     | Dev team |

#### Rollback Procedures

**Phase 4 Rollback (feature flag):**

```bash
# Disable for all users
export ENABLE_DMK_DIRECT_TRANSPORT=false

# Or gradual rollback
# 100% → 50% → 25% → 5% → 0%
```

**Phase 5 Rollback (code removed):**

- Requires code revert (git revert)
- More complex - avoid by ensuring Phase 4 is stable

#### Parallel Operation Period

During Phase 4, both code paths coexist:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Phase 4 Operation                        │
│                                                                 │
│   withDevice()                                                  │
│       │                                                         │
│       ├── Flag ON ──► withDeviceDmk() ──► DMK directly         │
│       │                                                         │
│       └── Flag OFF ─► withDeviceLegacy() ─► registerTransport  │
│                                                                 │
│   Both paths available until Phase 5                            │
└─────────────────────────────────────────────────────────────────┘
```

---

### Success Metrics

Define measurable criteria for migration success.

#### Quantitative Metrics

| Metric                  | Target                      | Measurement       |
| ----------------------- | --------------------------- | ----------------- |
| E2E test pass rate      | ≥ 98% (same as baseline)    | CI dashboard      |
| Sentry transport errors | No increase vs baseline     | Sentry alerts     |
| Session reuse rate      | Measurable (new capability) | Analytics         |
| Connection time (P95)   | ≤ baseline + 10%            | Performance tests |
| Memory usage            | ≤ baseline                  | Profiling         |

#### Qualitative Metrics

| Metric             | Target                              | Measurement          |
| ------------------ | ----------------------------------- | -------------------- |
| Code reduction     | ~40% fewer lines in transport layer | `wc -l` before/after |
| Wrapper classes    | 0 (all removed in Phase 5)          | Code search          |
| DMK instances      | 1 per platform                      | Code review          |
| Config.MOCK checks | 0 in UI components                  | Code search          |

#### Monitoring Dashboard

Track during Phase 4 rollout:

```
┌─────────────────────────────────────────────────────────────────┐
│  DMK Migration Dashboard                                        │
├─────────────────────────────────────────────────────────────────┤
│  Flag Rollout:      [████████░░] 80%                           │
│  E2E Pass Rate:     98.5% (baseline: 98.2%)  ✅                │
│  Sentry Errors:     23/day (baseline: 25/day) ✅               │
│  P95 Connect Time:  1.2s (baseline: 1.1s)    ⚠️               │
│  Session Reuse:     67% (new metric)         📊               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Platform-Specific Details

### Mobile E2E Mock Transport

The mock BLE transport factory for mobile e2e tests:

```typescript
// apps/ledger-live-mobile/src/transport/mockBleTransportFactory.ts

import { Transport, TransportFactory, TransportArgs, ... } from "@ledgerhq/device-management-kit";
import { BehaviorSubject, Observable } from "rxjs";
import { filter, first } from "rxjs/operators";
import { firstValueFrom } from "rxjs";
import { Right, Left } from "purify-ts";
import { Subject } from "rxjs";
import { createAPDUMock } from "../logic/createAPDUMock";

const MOCK_BLE_IDENTIFIER = "mockBle";

class MockBleTransport implements Transport {
  private discoveredDevices$ = new BehaviorSubject<TransportDiscoveredDevice[]>([]);
  private apduMocks = new Map<string, ReturnType<typeof createAPDUMock>>();
  private logger;

  constructor(
    loggerServiceFactory: (tag: string) => LoggerPublisherService,
    private config: DmkConfig,
    private bridgeClient: Subject<any>,
  ) {
    this.logger = loggerServiceFactory("MockBleTransport");

    // Listen for "add" events from e2e bridge
    this.bridgeClient.subscribe(msg => {
      if (msg.type === "add") {
        const device: TransportDiscoveredDevice = {
          id: msg.payload.id,
          name: msg.payload.name,
          transport: MOCK_BLE_IDENTIFIER,
          deviceModel: { id: DeviceModelId.NANO_X, ... },
        };

        const current = this.discoveredDevices$.value;
        if (!current.find(d => d.id === device.id)) {
          this.discoveredDevices$.next([...current, device]);
          this.apduMocks.set(device.id, createAPDUMock());
        }
      }
    });
  }

  getIdentifier() { return MOCK_BLE_IDENTIFIER; }
  isSupported() { return true; }

  listenToAvailableDevices(): Observable<TransportDiscoveredDevice[]> {
    return this.discoveredDevices$.asObservable();
  }

  startDiscovering(): Observable<TransportDiscoveredDevice> {
    return new Observable(subscriber => {
      const sub = this.bridgeClient
        .pipe(filter(msg => msg.type === "add"))
        .subscribe(msg => {
          subscriber.next({
            id: msg.payload.id,
            name: msg.payload.name,
            transport: MOCK_BLE_IDENTIFIER,
            deviceModel: { id: DeviceModelId.NANO_X },
          });
        });
      return () => sub.unsubscribe();
    });
  }

  stopDiscovering() {}

  async connect(params: { deviceId: DeviceId; onDisconnect: DisconnectHandler }) {
    this.logger.debug("connect - waiting for 'open' from bridge");

    // Wait for "open" event from e2e bridge
    await firstValueFrom(
      this.bridgeClient.pipe(filter(msg => msg.type === "open"), first())
    );

    const apduMock = this.apduMocks.get(params.deviceId) || createAPDUMock();

    const connectedDevice = new TransportConnectedDevice({
      id: params.deviceId,
      deviceModel: { id: DeviceModelId.NANO_X, productName: "Mock Nano X" },
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

  async disconnect() {
    return Right(undefined);
  }
}

/**
 * Factory function for mock BLE transport.
 * Mirrors the pattern of speculosTransportFactory.
 */
export const mockBleTransportFactory = (
  bridgeClient: Subject<any>
): TransportFactory => {
  return ({ config, loggerServiceFactory }: TransportArgs) => {
    return new MockBleTransport(loggerServiceFactory, config, bridgeClient);
  };
};
```

### Benefits Summary

| Aspect                   | Before                            | After                         |
| ------------------------ | --------------------------------- | ----------------------------- |
| **DMK instances**        | Multiple (app + Speculos wrapper) | Single per app                |
| **Transport interface**  | Legacy `@ledgerhq/hw-transport`   | Native DMK `Transport`        |
| **Wrappers needed**      | Yes (4+ wrapper classes)          | No                            |
| **Device state**         | Not observable                    | Observable via DMK            |
| **E2E mocking**          | UI-level hooks + Config checks    | Transport-level (transparent) |
| **Code paths**           | Two (legacy + DMK)                | One (DMK)                     |
| **Speculos integration** | Separate DMK + legacy wrapper     | Just another transport        |

### Complexity That Must Be Preserved

| Aspect                   | Current Location                      | New Location                        |
| ------------------------ | ------------------------------------- | ----------------------------------- |
| **Queue management**     | `DeviceQueuedJobsManager`             | Keep in `withDeviceDmk`             |
| **Session reuse**        | `DeviceManagementKit*Transport.open`  | Move to `withDeviceDmk`             |
| **Retry logic**          | `withDevicePolling` + transport.open  | Consolidate in `withDeviceDmk`      |
| **Device discovery**     | Each transport wrapper                | Centralize in `withDeviceDmk`       |
| **Name matching (BLE)**  | `matchDeviceByName` in BLE transport  | Keep in `withDeviceDmk` options     |
| **USB fallback**         | HID transport (first available)       | Keep in `withDeviceDmk` logic       |
| **Connection errors**    | BLE transport (PairingFailed, etc.)   | `remapConnectionError()` helper     |
| **Exchange errors**      | HID transport (→DisconnectedDevice)   | `remapExchangeError()` helper       |
| **Status code errors**   | deviceAccess (DeviceHalted, etc.)     | `remapStatusCodeError()` helper     |
| **Auto-reconnect**       | Desktop transport exchange()          | Embedded in `sendApdu()` for webhid |
| **Non-retryable errors** | `genericCanRetryOnError`              | `isPermanentJobError()` helper      |
| **Disconnect events**    | Each transport (`listenToDisconnect`) | Subscribe to DMK session state      |

---

## Device ID → DiscoveredDevice Mapping Strategy

This is a critical architectural decision. The current API uses `withDevice(deviceId: string)` but DMK requires `DiscoveredDevice` objects.

### Option A: Device Registry (Cache-Based)

**Approach**: Maintain a global `Map<deviceId, DiscoveredDevice>` populated during discovery.

```typescript
// Global device registry
const deviceRegistry = new Map<string, DiscoveredDevice>();

// During discovery (in SelectDevice2, useListenToHidDevices, etc.)
dmk.listenToAvailableDevices().subscribe(devices => {
  for (const device of devices) {
    deviceRegistry.set(device.id, device);
  }
});

// In withDeviceDmk
const discoveredDevice = deviceRegistry.get(deviceId);
if (!discoveredDevice) {
  // Fallback: re-discover (current behavior)
}
```

**Pros:**

- Minimal API changes - keep `withDevice(deviceId: string)`
- Backwards compatible
- Can be implemented incrementally

**Cons:**

- Cache invalidation complexity (device unplugged, BLE ID changes)
- USB devices share empty string ID - needs special handling
- Memory management (when to clear old entries?)

**Special case handling needed:**

```typescript
// USB devices: empty string → "any USB device"
if (deviceId === "" || deviceId.startsWith("usb|")) {
  // Find any USB device in registry
  const usbDevice = [...deviceRegistry.values()].find(d => d.type === "USB");
}

// BLE devices: ID might have changed, try name match
if (!foundDevice && options?.matchDeviceByName) {
  const byName = [...deviceRegistry.values()].find(d =>
    d.name?.toLowerCase().includes(options.matchDeviceByName.toLowerCase()),
  );
}
```

### Option B: Change API to DiscoveredDevice

**Approach**: Change `withDevice` signature to accept `DiscoveredDevice`.

```typescript
// New signature
export const withDeviceDmk =
  (device: DiscoveredDevice) =>
  <T>(job: (connection: DmkDeviceConnection) => Observable<T>): Observable<T> => {
    // ...
  };

// All call sites must change
// Before:
withDevice(device.deviceId)(job);

// After:
withDeviceDmk(device.discoveredDevice)(job);
```

**Pros:**

- Clean, no caching issues
- Full device info available at connection time
- Eliminates redundant discovery in `open()`

**Cons:**

- Major refactor across the codebase
- Need to propagate `DiscoveredDevice` through component tree
- `Device` type needs to include `DiscoveredDevice` or be replaced

**Migration path:**

1. Add `discoveredDevice?: DiscoveredDevice` to `Device` type
2. Update discovery flows to populate it
3. Update `withDevice` to use it if available
4. Gradually migrate all callers

### Option C: Hybrid (Recommended)

**Approach**: Support both patterns with a smooth migration path.

```typescript
// Overloaded withDeviceDmk
export function withDeviceDmk(device: DiscoveredDevice): <T>(job: ...) => Observable<T>;
export function withDeviceDmk(deviceId: string, options?: { matchDeviceByName?: string }): <T>(job: ...) => Observable<T>;
export function withDeviceDmk(
  deviceOrId: DiscoveredDevice | string,
  options?: { matchDeviceByName?: string }
) {
  return <T>(job: (connection: DmkDeviceConnection) => Observable<T>): Observable<T> => {
    // If DiscoveredDevice passed directly, use it
    if (typeof deviceOrId !== 'string') {
      return connectAndRun(deviceOrId, job);
    }

    // Otherwise, look up in registry or re-discover
    const fromRegistry = deviceRegistry.get(deviceOrId);
    if (fromRegistry) {
      return connectAndRun(fromRegistry, job);
    }

    // Fallback: discover and find matching device
    return discoverAndConnect(deviceOrId, options, job);
  };
}
```

**Pros:**

- Backwards compatible (existing code keeps working)
- New code can pass `DiscoveredDevice` directly
- Gradual migration possible
- Registry optimizes repeated connections

**Cons:**

- Two code paths to maintain during migration
- Slightly more complex implementation

### Recommended Approach: Option C (Hybrid)

**Phase 1 (Immediate):**

1. Implement device registry populated during discovery
2. `withDeviceDmk(deviceId)` uses registry with fallback to re-discovery
3. All existing code continues to work

**Phase 2 (Short-term):**

1. Add `discoveredDevice?: DiscoveredDevice` to `Device` type
2. Update `SelectDevice2` and `useListenToHidDevices` to populate it
3. Update high-traffic flows to pass `DiscoveredDevice` directly

**Phase 3 (Long-term):**

1. Deprecate `withDeviceDmk(deviceId: string)` overload
2. Migrate remaining callers
3. Remove registry once all callers pass `DiscoveredDevice`

### Device Registry Implementation

```typescript
// libs/ledger-live-common/src/hw/dmk/deviceRegistry.ts

import { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { BehaviorSubject } from "rxjs";

class DeviceRegistry {
  private devices = new Map<string, DiscoveredDevice>();
  private devices$ = new BehaviorSubject<Map<string, DiscoveredDevice>>(new Map());

  /**
   * Register a discovered device.
   * Called by discovery flows (SelectDevice2, useListenToHidDevices).
   */
  register(device: DiscoveredDevice): void {
    this.devices.set(device.id, device);
    // For USB, also register under empty string key
    if (device.type === "USB") {
      this.devices.set("", device);
    }
    this.devices$.next(new Map(this.devices));
  }

  /**
   * Unregister a device (e.g., on disconnect).
   */
  unregister(deviceId: string): void {
    const device = this.devices.get(deviceId);
    this.devices.delete(deviceId);
    // If it was the USB device registered under ""
    if (device?.type === "USB" && this.devices.get("")?.id === deviceId) {
      this.devices.delete("");
    }
    this.devices$.next(new Map(this.devices));
  }

  /**
   * Get a device by ID.
   */
  get(deviceId: string): DiscoveredDevice | undefined {
    return this.devices.get(deviceId);
  }

  /**
   * Find a device by name (for BLE reconnection when ID changed).
   */
  findByName(name: string): DiscoveredDevice | undefined {
    for (const device of this.devices.values()) {
      if (device.name?.toLowerCase().includes(name.toLowerCase())) {
        return device;
      }
    }
    return undefined;
  }

  /**
   * Find any USB device (for empty deviceId case).
   */
  findUsb(): DiscoveredDevice | undefined {
    for (const device of this.devices.values()) {
      if (device.type === "USB") {
        return device;
      }
    }
    return undefined;
  }

  /**
   * Observable of all registered devices (for debugging/UI).
   */
  observe() {
    return this.devices$.asObservable();
  }

  /**
   * Clear all devices (e.g., on app background).
   */
  clear(): void {
    this.devices.clear();
    this.devices$.next(new Map());
  }
}

export const deviceRegistry = new DeviceRegistry();
```

---

## Device Discovery Migration

### Current Discovery Architecture

Device discovery is currently **split across two systems**:

#### 1. Legacy `discoverDevices()` (via registerTransportModule)

```typescript
// libs/ledger-live-common/src/hw/index.ts
export type TransportModule = {
  id: string;
  open: (...) => Promise<Transport> | null;
  disconnect: (id: string) => Promise<void> | null;
  discovery?: Observable<DeviceEvent>;  // ← Optional discovery
};

// Aggregates all registered modules' discovery observables
export const discoverDevices = (accept: (module: TransportModule) => boolean): Discovery => {
  const all: Discovery[] = [];
  for (const m of modules) {
    if (m.discovery && accept(m)) {
      all.push(m.discovery);
    }
  }
  return merge(...all);
};
```

#### 2. Direct DMK calls (newer code)

```typescript
// LLM: useBleDevicesScanning from @ledgerhq/live-dmk-mobile
const { scannedDevices } = useBleDevicesScanning();

// LLD: DeviceManagementKitTransport.listen()
new Observable(DeviceManagementKitTransport.listen).subscribe(...)
```

### Current Usage by Platform

| Platform | Transport  | Discovery Method                                       |
| -------- | ---------- | ------------------------------------------------------ |
| **LLM**  | BLE        | DMK directly (`useBleDevicesScanning`)                 |
| **LLM**  | HID        | Legacy (`discoverDevices()` → `hidTransport.listen()`) |
| **LLM**  | HTTP Debug | Legacy (`discoverDevices()`)                           |
| **LLD**  | WebHID     | DMK directly (`DeviceManagementKitTransport.listen`)   |
| **CLI**  | Node HID   | Legacy (`TransportNodeHid.listen`)                     |

### Code Examples

**LLM SelectDevice2 - Hybrid approach:**

```typescript
// BLE: Uses DMK hook directly
const { scannedDevices } = useBleDevicesScanning();

// HID: Uses legacy discoverDevices
useEffect(() => {
  const filter = ({ id }) => ["hid", "httpdebug"].includes(id);
  const sub = discoverDevices(filter).subscribe(e => {
    if (e.type === "add") {
      setUSBDevice({ deviceName: e.name, modelId: e.deviceModel.id, ... });
    }
  });
  return () => sub.unsubscribe();
}, []);
```

**LLM registerTransports.ts - HID discovery registration:**

```typescript
registerTransportModule({
  id: "hid",
  open: (id, timeoutMs, traceContext) => {
    if (id.startsWith("usb|")) {
      return hidTransport.open(JSON.parse(id.slice(4)), timeoutMs, traceContext);
    }
    return null;
  },
  discovery: new Observable(o => hidTransport.listen(o)).pipe(
    map(({ type, descriptor, deviceModel }) => ({
      type,
      id: `usb|${JSON.stringify(descriptor)}`,
      deviceModel,
      wired: true,
      name: deviceModel?.productName ?? "",
    })),
  ),
});
```

**LLD useListenToHidDevices - DMK directly:**

```typescript
const dmkListen = DeviceManagementKitTransport.listen;

sub = new Observable(dmkListen).subscribe({
  next: ({ descriptor, device, deviceModel, type }) => {
    const deviceId = descriptor || "";
    if (type === "add") dispatch(addDevice({ deviceId, modelId: deviceModel.id, ... }));
    if (type === "remove") dispatch(removeDevice({ deviceId, ... }));
  },
});
```

### Proposed Migration: Unified DMK Discovery

Replace `discoverDevices()` with a new function that uses DMK directly:

```typescript
// libs/ledger-live-common/src/hw/dmk/discovery.ts

import { DeviceManagementKit, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { Observable, merge } from "rxjs";
import { map, startWith, pairwise } from "rxjs/operators";
import { getDmk } from "./index";
import { deviceRegistry } from "./deviceRegistry";

export type DeviceEvent = {
  type: "add" | "remove";
  device: DiscoveredDevice;
  // Legacy fields for backwards compatibility
  id: string;
  name: string;
  deviceModel: DeviceModel;
  wired: boolean;
};

/**
 * Unified device discovery using DMK.
 * Replaces legacy discoverDevices() from @ledgerhq/live-common/hw/index
 */
export const discoverDevicesDmk = (options?: {
  transports?: string[];
}): Observable<DeviceEvent> => {
  const dmk = getDmk();

  return dmk
    .listenToAvailableDevices(options?.transports ? { transport: options.transports } : {})
    .pipe(
      startWith<DiscoveredDevice[]>([]),
      pairwise(),
      // Convert [prev, curr] arrays to add/remove events
      map(([prev, curr]) => {
        const events: DeviceEvent[] = [];

        // Find added devices
        for (const device of curr) {
          if (!prev.find(p => p.id === device.id)) {
            // Register in device registry for later lookup
            deviceRegistry.register(device);

            events.push({
              type: "add",
              device,
              // Legacy compatibility fields
              id: formatLegacyId(device),
              name: device.name,
              deviceModel: toLegacyDeviceModel(device.deviceModel),
              wired: device.type === "USB",
            });
          }
        }

        // Find removed devices
        for (const device of prev) {
          if (!curr.find(c => c.id === device.id)) {
            deviceRegistry.unregister(device.id);

            events.push({
              type: "remove",
              device,
              id: formatLegacyId(device),
              name: device.name,
              deviceModel: toLegacyDeviceModel(device.deviceModel),
              wired: device.type === "USB",
            });
          }
        }

        return events;
      }),
      // Flatten array of events into individual events
      mergeMap(events => events),
    );
};

/**
 * Format device ID for legacy compatibility
 */
function formatLegacyId(device: DiscoveredDevice): string {
  if (device.type === "USB") {
    // LLM expects "usb|<descriptor>", LLD expects ""
    return device.transport === "rnHid" ? `usb|${JSON.stringify(device.id)}` : "";
  }
  // BLE: just use the device ID
  return device.id;
}

/**
 * Convert DMK device model to legacy DeviceModel
 */
function toLegacyDeviceModel(dmkModel: DiscoveredDevice["deviceModel"]): DeviceModel {
  return getDeviceModel(dmkToLedgerDeviceIdMap[dmkModel.model]);
}
```

### Migration Path for Discovery

**Phase 1: Add new discovery function (non-breaking)**

```typescript
// In SelectDevice2
// Before:
const sub = discoverDevices(filter).subscribe(...)

// After (option A - use new function):
const sub = discoverDevicesDmk({ transports: ["rnHid"] }).subscribe(...)

// After (option B - use hook):
const { scannedDevices } = useDevicesScanning({ transports: ["hid"] });
```

**Phase 2: Remove legacy discovery from registerTransportModule**

```typescript
// Before:
registerTransportModule({
  id: "hid",
  open: ...,
  discovery: new Observable(o => hidTransport.listen(o)).pipe(...),  // ← Remove
});

// After:
registerTransportModule({
  id: "hid",
  open: ...,
  // No discovery - handled by discoverDevicesDmk
});
```

**Phase 3: Deprecate and remove discoverDevices**

```typescript
// libs/ledger-live-common/src/hw/index.ts

/**
 * @deprecated Use discoverDevicesDmk from @ledgerhq/live-common/hw/dmk/discovery
 */
export const discoverDevices = (...) => {
  console.warn("discoverDevices is deprecated, use discoverDevicesDmk");
  // ... keep working for backwards compatibility
};
```

### Unified Discovery Hook (for React components)

```typescript
// libs/ledger-live-common/src/hw/dmk/hooks/useDevicesScanning.ts

import { useState, useEffect } from "react";
import { discoverDevicesDmk, DeviceEvent } from "../discovery";
import { DiscoveredDevice } from "@ledgerhq/device-management-kit";

export type UseDevicesScanningOptions = {
  enabled?: boolean;
  transports?: ("ble" | "usb" | "all")[];
};

export type UseDevicesScanningResult = {
  devices: DiscoveredDevice[];
  isScanning: boolean;
  error: Error | null;
};

/**
 * Unified hook for device discovery across all transports.
 * Replaces:
 * - useBleDevicesScanning (for BLE)
 * - discoverDevices subscription (for HID)
 * - useListenToHidDevices (for LLD)
 */
export const useDevicesScanning = (
  options: UseDevicesScanningOptions = {},
): UseDevicesScanningResult => {
  const { enabled = true, transports = ["all"] } = options;
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setDevices([]);
      return;
    }

    const transportFilter = transports.includes("all")
      ? undefined
      : transports.map(t => (t === "ble" ? "rnBle" : t === "usb" ? "rnHid" : t));

    const sub = discoverDevicesDmk({ transports: transportFilter }).subscribe({
      next: event => {
        setDevices(prev => {
          if (event.type === "add") {
            // Avoid duplicates
            if (prev.find(d => d.id === event.device.id)) return prev;
            return [...prev, event.device];
          } else {
            return prev.filter(d => d.id !== event.device.id);
          }
        });
      },
      error: err => setError(err),
    });

    return () => sub.unsubscribe();
  }, [enabled, transports.join(",")]);

  return { devices, isScanning: enabled, error };
};
```

### Updated SelectDevice2 (After Migration)

```typescript
// apps/ledger-live-mobile/src/components/SelectDevice2/index.tsx

import { useDevicesScanning } from "@ledgerhq/live-common/hw/dmk/hooks/useDevicesScanning";

export default function SelectDevice({ onSelect, ... }) {
  // BEFORE (hybrid):
  // - useBleDevicesScanning() for BLE
  // - discoverDevices() subscription for HID

  // AFTER (unified):
  const { devices, isScanning, error } = useDevicesScanning({
    enabled: !stopScanning,
    transports: ["ble", "usb"],
  });

  // Devices now includes both BLE and USB, with full DiscoveredDevice info
  const bleDevices = devices.filter(d => d.type === "BLE");
  const usbDevices = devices.filter(d => d.type === "USB");

  const handleSelect = (device: DiscoveredDevice) => {
    // Now we have the full DiscoveredDevice, not just deviceId!
    onSelect({
      deviceId: device.id,
      deviceName: device.name,
      modelId: dmkToLedgerDeviceIdMap[device.deviceModel.model],
      wired: device.type === "USB",
      // NEW: Include the full DiscoveredDevice for direct DMK usage
      discoveredDevice: device,
    });
  };
}
```

### Benefits of Unified Discovery

| Aspect                         | Before                          | After                       |
| ------------------------------ | ------------------------------- | --------------------------- |
| **Discovery APIs**             | 2 (discoverDevices + DMK hooks) | 1 (discoverDevicesDmk)      |
| **Device registry**            | Not populated during discovery  | Auto-populated              |
| **DiscoveredDevice available** | No (only deviceId string)       | Yes                         |
| **Code in components**         | Hybrid subscriptions            | Single hook                 |
| **Transport awareness**        | Implicit (prefix-based)         | Explicit (device.transport) |

---

## Can We Fully Remove Legacy Dependencies?

### Summary

| Component                              | Can Remove?   | Blocker                                  |
| -------------------------------------- | ------------- | ---------------------------------------- |
| `registerTransportModule`              | ✅ Yes        | Replace with DMK-based discovery/connect |
| `discoverDevices()`                    | ✅ Yes        | Replace with `discoverDevicesDmk()`      |
| `withDevice()` / `withDevicePolling()` | ✅ Yes        | Replace with `withDeviceDmk()`           |
| Legacy `Transport` class               | ⚠️ Partially  | Required by `hw-app-*` packages          |
| `hw-app-*` packages                    | ❌ Not easily | Would require rewriting 20+ packages     |

### The Critical Blocker: `hw-app-*` Packages

The **~20 `@ledgerhq/hw-app-*` packages** all expect a `Transport` instance:

```typescript
// libs/ledgerjs/packages/hw-app-btc/src/Btc.ts
import type Transport from "@ledgerhq/hw-transport";

export default class Btc {
  private _transport: Transport;

  constructor({ transport }: { transport: Transport }) {
    this._transport = transport;
    this._transport.decorateAppAPIMethods(this, [...], scrambleKey);
    // ...
  }
}
```

**Packages requiring Transport:**

- `@ledgerhq/hw-app-btc`
- `@ledgerhq/hw-app-eth`
- `@ledgerhq/hw-app-cosmos`
- `@ledgerhq/hw-app-polkadot`
- `@ledgerhq/hw-app-solana`
- ... (20+ total)

**How they're used:**

```typescript
// libs/ledger-live-common/src/families/bitcoin/setup.ts
const createSigner = (transport: Transport, currency: CryptoCurrency) => {
  return new Btc({ transport, currency: currency.id }); // ← Needs Transport!
};
```

### Current Usage Statistics

| Category                    | Files | Calls |
| --------------------------- | ----- | ----- |
| Files importing `Transport` | 30+   | -     |
| `withDevice()` usages       | 26    | 37    |
| `hw-app-*` dependencies     | -     | 20    |

### Solution: Compatibility Layer

To remove `registerTransportModule` and `withDevice()` while keeping `hw-app-*` packages working, we need `DmkTransportCompat`:

````typescript
// libs/ledger-live-common/src/hw/dmk/DmkTransportCompat.ts

import Transport from "@ledgerhq/hw-transport";
import { DeviceModel } from "@ledgerhq/devices";
import { DisconnectedDevice } from "@ledgerhq/errors";
import { TraceContext, LocalTracer } from "@ledgerhq/logs";
import {
  DeviceManagementKit,
  DeviceStatus,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { Subscription } from "rxjs";
import { DmkDeviceConnection } from "./index";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";

/**
 * Wraps a DMK connection in the legacy Transport interface.
 * Required for compatibility with hw-app-* packages.
 *
 * This class bridges the gap between:
 * - New: DmkDeviceConnection (our wrapper around DMK's sessionId + dmk.sendApdu())
 * - Old: Transport's exchange() expected by hw-app-btc, hw-app-eth, etc.
 *
 * Note: DmkDeviceConnection is NOT a DMK type - it's a convenience wrapper
 * we create that bundles sessionId + the sendApdu/close closures.
 * DMK's connect() only returns a sessionId string.
 *
 * Key responsibilities:
 * 1. Implement exchange() using connection.sendApdu() (which calls dmk.sendApdu())
 * 2. Handle disconnect events from DMK and emit "disconnect"
 * 3. Provide setScrambleKey() / decorateAppAPIMethods() for hw-app-* packages
 * 4. Convert errors to legacy error types
 */
export class DmkTransportCompat extends Transport {
  private connection: DmkDeviceConnection;
  private dmk: DeviceManagementKit;
  private disconnectSubscription: Subscription | null = null;
  private _closed = false;

  /**
   * The device ID used to identify this transport (for logging, debugging)
   */
  readonly id: string;

  constructor(
    connection: DmkDeviceConnection,
    dmk: DeviceManagementKit,
    device: DiscoveredDevice,
    context?: TraceContext,
  ) {
    super({ context, logType: "dmk-transport-compat" });

    this.connection = connection;
    this.dmk = dmk;
    this.id = connection.deviceId;

    // Set device model for Transport consumers
    this.deviceModel = this.toDeviceModel(device);

    // Subscribe to DMK session state for disconnect detection
    this.listenToDisconnect();

    this.tracer.trace("DmkTransportCompat created", {
      deviceId: connection.deviceId,
      sessionId: connection.sessionId,
      transportType: connection.transportType,
    });
  }

  /**
   * Convert DMK device model to legacy DeviceModel
   */
  private toDeviceModel(device: DiscoveredDevice): DeviceModel | null {
    try {
      const legacyModelId = dmkToLedgerDeviceIdMap[device.deviceModel.model];
      // getDeviceModel from @ledgerhq/devices would be used here
      return {
        id: legacyModelId,
        productName: device.deviceModel.name,
        // ... other DeviceModel fields
      } as DeviceModel;
    } catch {
      return null;
    }
  }

  /**
   * Subscribe to DMK session state to detect disconnections.
   * Emits "disconnect" event when device disconnects.
   */
  private listenToDisconnect(): void {
    this.disconnectSubscription = this.dmk
      .getDeviceSessionState({ sessionId: this.connection.sessionId })
      .subscribe({
        next: state => {
          if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) {
            this.tracer.trace("Device disconnected, emitting disconnect event");
            this._closed = true;
            this.emit("disconnect");
          }
        },
        error: error => {
          this.tracer.trace("Error in session state subscription", { error });
          this.emit("disconnect");
        },
        complete: () => {
          this.tracer.trace("Session state subscription completed");
          this.emit("disconnect");
        },
      });
  }

  /**
   * Core method: Send APDU to device and receive response.
   * This is called by all hw-app-* packages.
   *
   * @param apdu - The APDU buffer to send
   * @param options - Optional timeout settings
   * @returns Promise resolving to response buffer (data + status code)
   */
  async exchange(
    apdu: Buffer,
    { abortTimeoutMs }: { abortTimeoutMs?: number } = {},
  ): Promise<Buffer> {
    if (this._closed) {
      throw new DisconnectedDevice("Transport is closed");
    }

    const tracer = this.tracer.withUpdatedContext({ function: "exchange" });

    tracer.trace("Sending APDU", {
      apduLength: apdu.length,
      apduHex: apdu.toString("hex").slice(0, 20) + "...",
    });

    try {
      // Use exchangeAtomicImpl to prevent race conditions
      // This is inherited from Transport base class
      return await this.exchangeAtomicImpl(async () => {
        const response = await this.connection.sendApdu(new Uint8Array(apdu), {
          abortTimeoutMs,
        });

        // Convert Uint8Array response to Buffer
        // Response format: [data bytes] + [2 status code bytes]
        const responseBuffer = Buffer.from([...response.data, ...response.statusCode]);

        tracer.trace("Received response", {
          responseLength: responseBuffer.length,
          statusCode: responseBuffer.slice(-2).toString("hex"),
        });

        return responseBuffer;
      });
    } catch (error) {
      tracer.trace("Exchange error", { error });

      // Remap errors to legacy types if needed
      // (This would use the remapExchangeError helper from earlier in the doc)
      throw error;
    }
  }

  /**
   * Set the scramble key for the next exchanges.
   * Called by hw-app-* packages via decorateAppAPIMethods.
   *
   * Note: DMK doesn't use scramble keys, but we keep this for compatibility.
   * The actual scrambling (if any) happens at a lower level in DMK transports.
   */
  setScrambleKey(_key: string): void {
    // No-op for DMK - scrambling is handled internally
  }

  /**
   * Close the transport.
   *
   * Note: This doesn't disconnect the DMK session by default.
   * Session lifecycle is managed by withDeviceDmk, which may reuse sessions.
   */
  async close(): Promise<void> {
    this.tracer.trace("Closing transport");

    if (this.disconnectSubscription) {
      this.disconnectSubscription.unsubscribe();
      this.disconnectSubscription = null;
    }

    this._closed = true;
    return Promise.resolve();
  }

  /**
   * Forcefully disconnect the device.
   * This will close the DMK session.
   */
  async disconnect(): Promise<void> {
    this.tracer.trace("Disconnecting device");

    await this.close();
    await this.connection.close();
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a DmkTransportCompat from a DMK connection.
 * Used internally by withDevice().
 */
export function createTransportCompat(
  connection: DmkDeviceConnection,
  dmk: DeviceManagementKit,
  device: DiscoveredDevice,
  context?: TraceContext,
): DmkTransportCompat {
  return new DmkTransportCompat(connection, dmk, device, context);
}

// ============================================================================
// LEGACY withDevice REPLACEMENT
// ============================================================================

/**
 * Drop-in replacement for legacy withDevice.
 * Returns a Transport-compatible object for hw-app-* packages.
 *
 * Usage:
 * ```typescript
 * import { withDevice } from "@ledgerhq/live-common/hw/dmk/compat";
 * import Btc from "@ledgerhq/hw-app-btc";
 *
 * withDevice(deviceId)(transport => {
 *   const btc = new Btc({ transport });  // Works!
 *   return from(btc.getAddress(...));
 * }).subscribe(...);
 * ```
 */
export const withDevice =
  (deviceId: string, options?: WithDeviceDmkOptions) =>
  <T>(job: (transport: Transport) => Observable<T>): Observable<T> => {
    return withDeviceDmk(
      deviceId,
      options,
    )((connection, context) => {
      // Create Transport-compatible wrapper using context.dmk and context.device
      const transport = createTransportCompat(
        connection,
        context.dmk,
        context.device,
        options?.traceContext,
      );

      // Run the job with the transport
      return job(transport).pipe(
        // Ensure transport is closed after job completes
        finalize(() => {
          transport.close().catch(e => {
            console.warn("Error closing transport", e);
          });
        }),
      );
    });
  };

/**
 * Promise-based version of withDevice.
 */
export const withDevicePromise = async <T>(
  deviceId: string,
  fn: (transport: Transport) => Promise<T>,
  options?: WithDeviceDmkOptions,
): Promise<T> => {
  return firstValueFrom(withDevice(deviceId, options)(transport => from(fn(transport))));
};
````

### Key Implementation Details

#### 1. Exchange Method

The `exchange()` method is the core of the Transport interface:

```typescript
async exchange(apdu: Buffer): Promise<Buffer> {
  // Use atomic impl to prevent race conditions (hw-app-* packages may call concurrently)
  return this.exchangeAtomicImpl(async () => {
    const response = await this.connection.sendApdu(new Uint8Array(apdu));
    // Response = [data] + [2-byte status code]
    return Buffer.from([...response.data, ...response.statusCode]);
  });
}
```

#### 2. Disconnect Handling

DMK session state is observed to emit legacy `disconnect` events:

```typescript
this.dmk.getDeviceSessionState({ sessionId }).subscribe({
  next: state => {
    if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) {
      this.emit("disconnect"); // Legacy event for Transport consumers
    }
  },
});
```

#### 3. Inherited Methods

The `Transport` base class provides these methods that work automatically:

| Method                         | Description                            |
| ------------------------------ | -------------------------------------- |
| `send(cla, ins, p1, p2, data)` | High-level APDU send (uses `exchange`) |
| `exchangeBulk(apdus)`          | Batch APDU send (uses `exchange`)      |
| `exchangeAtomicImpl(fn)`       | Race condition prevention              |
| `decorateAppAPIMethods()`      | Method decoration for hw-app-\*        |
| `on/off/emit()`                | Event emitter (inherited)              |

#### 4. What We DON'T Implement

These static methods are NOT needed on the compat class:

```typescript
// NOT NEEDED - discovery is handled by discoverDevicesDmk
static isSupported(): Promise<boolean>;
static list(): Promise<any[]>;
static listen(observer): Subscription;
static open(descriptor): Promise<Transport>;
```

### What Can Be Removed (with compat layer)

| Component                     | Status       | Notes                                   |
| ----------------------------- | ------------ | --------------------------------------- |
| `registerTransportModule()`   | ✅ Remove    | DMK handles transport selection         |
| `unregisterTransportModule()` | ✅ Remove    | No longer needed                        |
| `discoverDevices()`           | ✅ Remove    | Replace with `discoverDevicesDmk()`     |
| `open()` from hw/index.ts     | ✅ Remove    | DMK's `connect()` replaces this         |
| `close()` from hw/index.ts    | ✅ Remove    | DMK's `disconnect()` replaces this      |
| Legacy `withDevice()`         | ✅ Remove    | Replace with DMK-based `withDevice()`   |
| `DeviceQueuedJobsManager`     | ⚠️ Keep/Move | Still needed, move to DMK layer         |
| `Transport` class             | ⚠️ Keep      | Required for `DmkTransportCompat`       |
| Transport wrapper classes     | ✅ Remove    | `DeviceManagementKit*Transport` classes |

### What Must Be Kept (for now)

1. **`@ledgerhq/hw-transport` package** - Required as interface for compat layer
2. **`DmkTransportCompat` class** - Bridges DMK to hw-app-\* packages

### Long-Term: Full Removal of Transport

To fully remove the `Transport` class, all `hw-app-*` packages would need to be refactored:

**Option A: Accept sendApdu function**

```typescript
// Future hw-app-btc
type SendApdu = (apdu: Uint8Array) => Promise<{ data: Uint8Array; statusCode: Uint8Array }>;

class Btc {
  constructor({ sendApdu }: { sendApdu: SendApdu }) {
    this.sendApdu = sendApdu;
  }
}
```

**Option B: Accept DMK connection directly**

```typescript
// Future hw-app-btc
import { DmkDeviceConnection } from "@ledgerhq/device-management-kit";

class Btc {
  constructor({ connection }: { connection: DmkDeviceConnection }) {
    this.connection = connection;
  }
}
```

**Effort estimate:** 20+ packages × ~2-5 days each = **40-100 developer days**

### Recommended Migration Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PHASE 1 (Current PR scope)                       │
│  - Keep registerTransportModule                                          │
│  - Keep legacy withDevice                                                │
│  - Add UI-level mocks for e2e (already done)                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PHASE 2 (Next milestone)                         │
│  - Implement DmkTransportCompat                                          │
│  - Implement withDeviceDmk with full complexity                          │
│  - Implement device registry + discoverDevicesDmk                        │
│  - Add DMK-level mock transport for e2e                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PHASE 3 (Migration)                              │
│  - Migrate LLM to use withDeviceDmk + discoverDevicesDmk                │
│  - Migrate LLD to use withDeviceDmk + discoverDevicesDmk                │
│  - Migrate CLI to use withDeviceDmk                                      │
│  - Remove registerTransportModule                                        │
│  - Remove legacy discoverDevices                                         │
│  - Remove Transport wrapper classes                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PHASE 4 (Future - Optional)                      │
│  - Refactor hw-app-* packages to not require Transport                   │
│  - Remove @ledgerhq/hw-transport dependency                              │
│  - Remove DmkTransportCompat                                             │
└─────────────────────────────────────────────────────────────────────────┘
```

### Answer to the Question

**Can we completely get rid of `registerTransportModule`, legacy `deviceAccess`, and `Transport` class?**

- **`registerTransportModule`**: ✅ **YES** - fully removable
- **Legacy `deviceAccess` (`withDevice`, etc.)**: ✅ **YES** - replaceable with `withDeviceDmk`
- **`Transport` class**: ⚠️ **PARTIALLY** - Must keep `DmkTransportCompat` to support `hw-app-*` packages

**To fully remove `Transport`**, we'd need to refactor all 20+ `hw-app-*` packages, which is a separate initiative (~40-100 dev days).

---

## Risks and Mitigations

### Risk Matrix

| Risk                                  | Impact   | Likelihood | Mitigation                                                   |
| ------------------------------------- | -------- | ---------- | ------------------------------------------------------------ |
| **Firmware update failures**          | Critical | Low        | Extensive QA on all models; staged rollout; instant rollback |
| **Session reuse bugs**                | High     | Medium     | Behavior parity tests; feature flag for disable              |
| **Error remapping gaps**              | Medium   | Medium     | Comprehensive error handling matrix; logging                 |
| **10-week timeline slip**             | Medium   | High       | Phase gates; parallel workstreams where possible             |
| **NodeHID transport delays**          | Low      | Medium     | Coordinate with existing work; fallback to legacy for CLI    |
| **Vault transport complexity**        | Medium   | Low        | Enterprise feature can be deferred; minimal user impact      |
| **hw-app-\* package incompatibility** | High     | Low        | DmkTransportCompat designed for this; no breaking changes    |
| **Memory/performance regression**     | Medium   | Low        | Profile during Phase 4; DMK should be leaner                 |

### Critical Risk: Firmware Updates

Firmware update is the highest-risk flow. Special precautions:

1. **No same-day release**: Firmware update migration should not ship same day as Phase 4 goes to 100%
2. **Canary period**: 2 weeks at 5% before wider rollout
3. **Monitoring**: Real-time Sentry alerts for firmware update errors
4. **Rollback**: Maintain legacy firmware update path until Phase 5

### Timeline Risk Mitigation

If Phase 4 takes longer than expected:

- **Option A**: Extend timeline (safest)
- **Option B**: Ship with feature flag for specific flows (partial migration)
- **Option C**: Reduce scope (defer Vault, HTTP Debug transports)

---

## Open Questions

### Architecture Questions

| #   | Question                         | Status     | Notes                                                                |
| --- | -------------------------------- | ---------- | -------------------------------------------------------------------- |
| 1   | **DMK API: Connect by ID only?** | ❓ Open    | Proposed `DeviceRegistry` + overloaded `withDeviceDmk` as workaround |
| 2   | **Session management ownership** | ✅ Decided | In `withDeviceDmk` (not DMK itself)                                  |
| 3   | **USB device identification**    | ✅ Decided | Keep empty string behavior + fallback in `withDeviceDmk`             |

### Implementation Questions

| #   | Question                  | Status         | Notes                                  |
| --- | ------------------------- | -------------- | -------------------------------------- |
| 4   | **NodeHID DMK Transport** | 🔄 In Progress | Being developed separately; coordinate |
| 5   | **Vault Transport**       | ❓ Open        | Needs enterprise team input            |
| 6   | **WebBLE for Desktop**    | ⏸️ Deferred    | Not in scope for this migration        |
| 7   | **HTTP Debug Transport**  | ⏸️ Deferred    | Low priority; can use legacy fallback  |

### Migration Questions

| #   | Question                     | Status     | Notes                                                            |
| --- | ---------------------------- | ---------- | ---------------------------------------------------------------- |
| 8   | **Breaking changes**         | ✅ Decided | No major version bump; use deprecation + feature flag            |
| 9   | **Retry logic ownership**    | ✅ Decided | Stays in `withDeviceDmk`; DMK handles transport-level retry only |
| 10  | **Error type compatibility** | ✅ Decided | Keep `@ledgerhq/errors`; remap from DMK errors                   |

### New Questions (from analysis)

| #   | Question                      | Status     | Notes                                |
| --- | ----------------------------- | ---------- | ------------------------------------ |
| 11  | **IPC Transport for Desktop** | ✅ Decided | Not needed; inject Speculos directly |
| 12  | **TCP Speculos for CLI**      | ❓ Open    | Is it still used? Can we drop it?    |
| 13  | **Mock/Replayer transport**   | ❓ Open    | Needed for unit tests; priority TBD  |

---

## References

- DMK Documentation: https://developers.ledger.com/docs/device-interaction
- Current transport implementations:
  - `libs/live-dmk-mobile/src/transport/`
  - `libs/live-dmk-desktop/src/transport/`
  - `libs/live-dmk-speculos/src/transport/`
- Legacy transport module: `libs/ledger-live-common/src/hw/index.ts`
