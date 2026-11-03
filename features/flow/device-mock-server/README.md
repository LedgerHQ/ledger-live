# @features/flow-device-mock-server

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

The device mock server settings of Ledger Wallet Mobile: turn the mock server on or off, start a
session or join one by its token, and open the server's configuration UI. Native only.

It is a flow rather than a `devtools/` tool: turning the mock server on swaps the device transport of
the whole app and restarts it, so it does not fit inside the DevTools shell.

## Usage

The app renders `MockServerSettingsForm` in its settings screen and passes:

- `settings`: the `{ enabled, url, token }` it persists;
- `defaultUrl`: the server URL shown when none is saved;
- `host`: a `MockServerHost` port, which saves the settings, forgets the mock devices of other
  sessions, gives the session to import, and persists the app state before restarting the app.

The server calls come from [`@features/platform-device-mock-server`](../../platform/device-mock-server).
