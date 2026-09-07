---
"@ledgerhq/live-dmk-desktop": minor
"ledger-live-desktop": minor
---

Add a "Mock server transport" toggle in the desktop developer settings. When enabled, the Device Management Kit registers the mock server transport (`@ledgerhq/device-transport-kit-mockserver`) so the app connects to a device mock server instead of a physical device. The toggle is backed by a new `MOCK_SERVER_TRANSPORT` env variable. The server defaults to the shared deployment (`https://device-mock-server.aws.ldg-ps-default.ldg-tech.com`), matching the Device SDK sample app; set `MOCK_SERVER_TRANSPORT_URL` to point at a local instance instead (e.g. `http://localhost:9752`).

While the transport is enabled, a developer top bar indicator (styled like the experimental and feature-flag buttons) is shown: a solid green circle when the mock server's `/health` endpoint responds, red when it is unreachable. Clicking the indicator copies the current mock server session token to the clipboard.

At boot the transport provisions its own mock server session — it calls `/auth` for a token, then imports a session into it — and keeps the token in memory so the transport discovers the seeded device rather than starting from an empty session. The same token routes the legacy scriptrunner flows (genuine check, list apps, install, firmware/MCU) at the mock server's secure channel, via a `BASE_SOCKET_URL` override pushed to all threads.

The session the mock server is provisioned with is configurable. `MOCK_SERVER_SESSION` takes a `SessionExport` JSON (`{"devices":[…]}`) imported at boot, defaulting to the single USB Stax on firmware 1.9.1 that was previously hardcoded, and `MOCK_SERVER_SEED` takes a BIP39 mnemonic that the server forwards to Speculos on every app open (empty by default, which keeps the mock server's own seed). Both are settable from Developer › Env variable override; invalid session JSON falls back to the default rather than breaking boot.

`DeviceManagementKitTransport.open()` waits for the first non-empty discovery emission instead of grabbing the initial `[]`, which lets the mock transport's first poll populate the list; real devices are already discovered by then, so it is a no-op for them.
