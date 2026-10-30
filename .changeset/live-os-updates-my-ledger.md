---
"@ledgerhq/live-dmk-shared": minor
"@ledgerhq/live-dmk-mobile": minor
"@ledgerhq/live-common": minor
"live-mobile": minor
---

Plug the OS Update Orchestrator into My Ledger on mobile, behind the `ldmkOsUpdates` feature flag.

- Connecting to My Ledger resolves the OS update path and stores the updates in a new `osUpdate` slice, while the connect bottom sheet stays in its loading state. A resolve failure still lands on My Ledger.
- The OS update banner (portfolio and My Ledger) is driven by that slice and gated by device model, firmware version and USB/BLE connection. From the portfolio, it redirects to My Ledger, which reconnects the device and opens the What's new page through the `firmwareUpdate` param.
- Confirming What's new starts the orchestrator. Once the updates are applied the slice is cleared, and a cancel or a crash reconnects through My Ledger, which resolves the path again.
- `@ledgerhq/live-dmk-mobile` adds `getActiveConnectedDevice`, which returns the connected device of the session the transports are using, as the DMK can hold several sessions at once.
- `@ledgerhq/live-dmk-shared` exports the `OsUpdate` type.
- `@ledgerhq/live-common` adds an optional `onCompleted` callback to `OsUpdatesOrchestratorComponent`.
