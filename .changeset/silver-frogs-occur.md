---
"@ledgerhq/zcash-shielded": minor
"@ledgerhq/coin-bitcoin": minor
"ledger-live-desktop": minor
---

Implement native Rust engine for shielded synchronization. ZCash native (napi-rs) engine out of the Electron renderer and into a dedicated UtilityProcess bridged via IPC. Split `ZCashNative` into an in-process wrapper (for Node contexts: coin-tester, integration tests) and a `ZCashNativeIPC` client (for Electron renderer); both share the same public API via a single host-side `engine.ts` module.
