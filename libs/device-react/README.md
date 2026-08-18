# device-react

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

`@ledgerhq/device-react` is a thin React layer on top of `@ledgerhq/device-core`, exposing React hooks for device-related operations in Ledger Live. It handles the async lifecycle of device queries (mounting/unmounting, state updates) so UI components don't have to.

## What it does

- Wraps `device-core` async calls in React hooks with proper effect cleanup
- Manages loading/result state for device queries within React components
- Provides shared types for hook options used across desktop and mobile

## Key exports / concepts

- `useGetLatestFirmware(options)` — fetches the latest available firmware for a connected device once on mount and returns a `FirmwareUpdateContextEntity | null`
- `UseGetLatestFirmwareForDeviceOptions` — typed options (deviceInfo, providerId, userId, managerApiRepository)

## Usage context

Used by both `ledger-live-desktop` and `ledger-live-mobile` in firmware-update flows. Depends on `@ledgerhq/device-core` for the underlying logic and the `HttpManagerApiRepository` for Manager API calls.
