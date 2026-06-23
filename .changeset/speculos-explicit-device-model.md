---
"@ledgerhq/live-dmk-speculos": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

Allow passing an explicit device model to the Speculos DMK transport. The underlying transport cannot infer the emulated device and defaults to Stax, so the e2e setups now forward the real model (e.g. nanoX) when opening the transport.
