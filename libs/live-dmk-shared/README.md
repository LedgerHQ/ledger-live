# live-dmk-shared

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Platform-agnostic shared logic for the Ledger Device Management Kit (DMK) integration in Ledger Live. Contains device discovery interfaces, device-action orchestration, transport abstractions, and cross-platform services used by both the desktop and mobile DMK adapters.

## What it does

- Defines the `DeviceDiscoveryService` interface and a `DefaultDeviceDiscoveryService` implementation
- Provides device-action orchestration types and helpers for executing operations on a connected device
- Abstracts transport-level concepts shared across platforms
- Implements cross-platform services:
  - `LedgerLiveLogger` — logging adapter bridging DMK events to Ledger Live's log system
  - `LiveBlindSigningReporter` — reports blind-signing events for analytics/safety
  - `UserHashService` — hashed user identifier for DMK telemetry
- `DeviceIntentTrackingProvider` / `useDeviceIntentTracking` — shared context contract for
  platform-specific Device Intent Executor tracking
- `DeviceIntentExecutorHeaderContext` / `OverrideDeviceIntentExecutorHeader` — shared
  header-override contract for platform-specific Device Intent Executor chrome
- Centralises DMK configuration

## Key exports / concepts

- `deviceConnectivity/` — code shared by the device connection flows:
  - `DeviceDiscoveryService` / `DefaultDeviceDiscoveryService` — discovery service both platforms extend
  - `Device`, `DeviceDiscoveryStartArgs`, `DeviceConnectionResult` — discovery and connection data types
  - `ConnectivityUIStateTypes` and the discovery, connection and unknown error UI states
- `connectDevice/` — the connect device state machine and use case:
  - `ConnectDeviceUIState` / `ConnectDeviceUIStateTypes` — its UI states, including the shared error states
  - `MatchedDevice`, `KnownDevice` (alias of `Device`) — data types for known devices
- `connectNewDevice/` — the state machine and use case that connect a device the user has not connected before:
  - `DefaultConnectNewDeviceStateMachine` — discovers devices, connects to the selected one, and owns the device not found and success delays
  - `connectNewDeviceUseCase` — exposes the state machine as an `Observable` of UI states, started on subscribe and stopped on unsubscribe
  - `ConnectNewDeviceUIState` / `ConnectNewDeviceUIStateTypes` — its UI states, including the shared error states
  - `SelectableDevice` — a device of the `Discovering` list. Its `key` stays the same while the list shows it: use it as the row key. Check `isAvailable` before you call `onSelect`: an available device has `isAvailable: true` and an `onSelect` callback. A device that discovery no longer reports has `isAvailable: false` and no `onSelect`.
  - `ConnectNewDeviceGetDiscoveredDeviceKey` — type of the `getDiscoveredDeviceKey` input. It returns the same key for the same device in every discovery update, so that the device list keeps its order.
- `LedgerLiveLogger`, `LiveBlindSigningReporter`, `UserHashService` — shared services
- `transport/` — shared transport interface definitions

## Usage context

Consumed by `libs/live-dmk-desktop` and `libs/live-dmk-mobile`. Not used directly by the apps.
