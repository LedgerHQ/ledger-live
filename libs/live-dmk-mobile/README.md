# live-dmk-mobile

> [!CAUTION]
> **Status: UNSTABLE** — Active Device Management Kit (DMK) migration in progress; API may change.

Mobile-specific integration of the Ledger Device Management Kit (DMK) for Ledger Live Mobile. Provides React Native BLE and USB-C transport adapters, device discovery flows, and React hooks for hardware wallet communication on iOS and Android.

## What it does

- Implements the DMK `Transport` interface over React Native BLE (Bluetooth Low Energy) and USB-C
- Provides device discovery and pairing flows specific to mobile OS constraints
- Exposes React hooks for managing connection state in mobile screens
- Maps DMK transport errors to mobile-specific Ledger Live error types
- Includes utilities for platform-specific quirks (background BLE, permissions, etc.)

## Key exports / concepts

- `transport/` — BLE and USB transport adapters implementing the DMK interface
- `connectDevice/` — mobile device discovery and connection orchestration
- `hooks/` — React hooks for device connection state
- `errors.ts` — mobile-specific error types extending DMK base errors
- `utils/` — platform helpers (permissions, reconnection logic)

## Usage context

Used exclusively by `apps/ledger-live-mobile`. Depends on `libs/live-dmk-shared` for shared interfaces and device-action logic. The desktop equivalent is `libs/live-dmk-desktop`.
