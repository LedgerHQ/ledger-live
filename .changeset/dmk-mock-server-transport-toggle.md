---
"@ledgerhq/live-dmk-desktop": minor
"ledger-live-desktop": minor
---

Add a "Mock server transport" toggle in the desktop developer settings. When enabled, the Device Management Kit registers the mock server transport (`@ledgerhq/device-transport-kit-mockserver`, pinned to the latest `develop` snapshot) so the app connects to a local device mock server instead of a physical device. The toggle is backed by a new `MOCK_SERVER_TRANSPORT` env variable; the mock server URL is a fixed `http://localhost:9752`.

While the transport is enabled, a developer top bar indicator (styled like the experimental and feature-flag buttons) is shown: a solid green circle when the mock server's `/health` endpoint responds, red when it is unreachable. Clicking the indicator copies the current mock server session token to the clipboard.
