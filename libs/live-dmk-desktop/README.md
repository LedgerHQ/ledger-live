# live-dmk-desktop

> [!CAUTION]
> **Status: UNSTABLE** — Active Device Management Kit (DMK) migration in progress; API may change.

Desktop-specific integration of the Ledger Device Management Kit (DMK) for Ledger Live Desktop. Provides the Electron/USB transport adapter and React hooks that wire the DMK into the LLD renderer process, enabling USB-based hardware wallet communication on macOS, Windows, and Linux.

## What it does

- Implements the DMK `Transport` interface over the Electron USB/HID bridge
- Exposes React hooks for device connection lifecycle (connect, disconnect, errors)
- Maps DMK-level transport errors to Ledger Live Desktop error types
- Integrates with the LLD main-process IPC channel for USB access

## Key exports / concepts

- `transport/` — USB/HID transport adapter implementing the DMK interface
- `hooks/` — React hooks for consuming device connection state in renderer components
- `errors.ts` — Desktop-specific error types extending DMK base errors

## Usage context

Used exclusively by `apps/ledger-live-desktop`. Depends on `libs/live-dmk-shared` for shared device-action logic and interfaces. The mobile equivalent is `libs/live-dmk-mobile`.
