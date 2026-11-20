# @features/flow-device-onboarding-reconnect

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The sheets Ledger Wallet Mobile shows when the device disconnects: over the unseeded device setup
screen, and over the seeded checks screen when an updated device does not come back. The screen
stays up behind them.

## Exports

- `useSessionReconnect({ dropped, error, connect })`: reconnects once when the session drops and
  reports `reconnecting`, then `failed` on a connection error or after 30 seconds. `retry`
  reconnects and restarts the wait.
- `ReconnectSheet`: the reconnecting sheet (spinner, no action) and the failed sheet (**Try again**,
  **Get help**). Close hides the sheet until the next connection state, unless `onQuit` is given: then
  close calls it instead. `suspendSheets` hides it while another sheet (quit confirmation) takes
  the screen.
- `ReconnectSheetProps`, `SessionReconnect`, `SessionReconnectState`: the types.

The copy lives under `deviceOnboarding.setup.connection` in the mobile catalog.

## Consumers

The setup and checks screens of `apps/ledger-live-mobile/src/mvvm/features/DeviceOnboarding`.
