---
"@ledgerhq/live-dmk-desktop": minor
"@ledgerhq/live-e2e-shared": minor
"ledger-live-desktop": minor
---

Add a "Mock server transport" toggle in the desktop developer settings. When enabled, the Device Management Kit registers the mock server transport (`@ledgerhq/device-transport-kit-mockserver`, pinned to the latest `develop` snapshot) so the app connects to a device mock server instead of a physical device. The toggle is backed by a new `MOCK_SERVER_TRANSPORT` env variable. The server defaults to the shared deployment (`https://device-mock-server.aws.ldg-ps-default.ldg-tech.com`), matching the Device SDK sample app; set `MOCK_SERVER_TRANSPORT_URL` to point at a local instance instead (e.g. `http://localhost:9752`).

While the transport is enabled, a developer top bar indicator (styled like the experimental and feature-flag buttons) is shown: a solid green circle when the mock server's `/health` endpoint responds, red when it is unreachable. Clicking the indicator copies the current mock server session token to the clipboard.

The session the mock server is provisioned with is configurable too. `MOCK_SERVER_SESSION` takes a `SessionExport` JSON (`{"devices":[…]}`) imported at boot, defaulting to the single USB Stax on firmware 1.9.1 that was previously hardcoded, and `MOCK_SERVER_SEED` takes a BIP39 mnemonic that the server forwards to Speculos on every app open (empty by default, which keeps the mock server's own seed). Both are settable from Developer › Env variable override; invalid session JSON falls back to the default rather than breaking boot.
