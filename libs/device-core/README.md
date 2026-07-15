# device-core

`@ledgerhq/device-core` is the core library for interacting with Ledger hardware devices in Ledger Live. It provides low-level device commands (APDU wrappers), high-level flows (firmware update, manager API), capability detection, and custom lock screen support — shared across desktop and mobile.

## What it does

- Exposes typed APDU command wrappers for communicating with Ledger devices
- Implements firmware update flows (preparation, flashing, validation)
- Provides a client for the Ledger Manager API (app install/uninstall, device info)
- Detects device capabilities (e.g. supported features per firmware version)
- Handles custom lock screen (image encoding, transfer)
- Defines device-specific error types

## Key exports / concepts

- `commands/` — individual APDU command implementations
- `firmwareUpdate/` — multi-step firmware update orchestration
- `managerApi/` — HTTP + transport layer for the Ledger Manager service
- `capabilities/` — feature flags derived from device model and firmware
- `customLockScreen/` — image preparation and transfer logic
- `errors.ts` — device-specific error classes

## Usage context

Used by `apps/ledger-live-desktop` and `apps/ledger-live-mobile`, and by `@ledgerhq/device-intent` for higher-level device interaction flows. Also consumed by `@ledgerhq/live-common` for device-dependent operations.
