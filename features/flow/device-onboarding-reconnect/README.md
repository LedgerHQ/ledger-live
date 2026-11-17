# @features/flow-device-onboarding-reconnect

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The sheets Ledger Wallet Mobile shows over the unseeded device setup screen when the device
disconnects. The setup stage stays up behind them.

## Exports

- `useSessionReconnect({ dropped, error, connect })`: reconnects once when the session drops and
  reports `reconnecting`, then `failed` on a connection error or after 30 seconds. `retry`
  reconnects and restarts the wait.
- `ReconnectSheet`: the reconnecting sheet (spinner, no action) and the failed sheet (**Try again**,
  **Get help**). Close hides the sheet until the next connection state. `suspendSheets` hides it
  while another sheet (quit confirmation) takes the screen.
- `ReconnectSheetProps`, `SessionReconnect`, `SessionReconnectState`: the types.

The copy lives under `deviceOnboarding.setup.connection` in the mobile catalog.

## Consumers

The setup screen of `apps/ledger-live-mobile/src/mvvm/features/DeviceOnboarding`.
