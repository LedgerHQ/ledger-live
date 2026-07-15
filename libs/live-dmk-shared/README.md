# live-dmk-shared

Platform-agnostic shared logic for the Ledger Device Management Kit (DMK) integration in Ledger Live. Contains device discovery interfaces, device-action orchestration, transport abstractions, and cross-platform services used by both the desktop and mobile DMK adapters.

## What it does

- Defines the `DeviceDiscoveryService` interface and a `DefaultDeviceDiscoveryService` implementation
- Provides device-action orchestration types and helpers for executing operations on a connected device
- Abstracts transport-level concepts shared across platforms
- Implements cross-platform services:
  - `LedgerLiveLogger` — logging adapter bridging DMK events to Ledger Live's log system
  - `LiveBlindSigningReporter` — reports blind-signing events for analytics/safety
  - `UserHashService` — hashed user identifier for DMK telemetry
- Centralises DMK configuration

## Key exports / concepts

- `DefaultDeviceDiscoveryService` — base discovery service both platforms extend
- `ConnectDeviceUIState` / `DeviceDiscoveryService` — core interfaces for device connection
- `DeviceDiscoveryStartArgs`, `MatchedDevice`, `KnownDevice` — discovery data types
- `LedgerLiveLogger`, `LiveBlindSigningReporter`, `UserHashService` — shared services
- `transport/` — shared transport interface definitions

## Usage context

Consumed by `libs/live-dmk-desktop` and `libs/live-dmk-mobile`. Not used directly by the apps.
