---
"ledger-live-desktop": minor
"@ledgerhq/coin-zcash": minor
---

Build the desktop renderer as a web target instead of `electron-renderer`: Node builtins resolve at build time rather than as runtime `require()` calls, and the bundle has no externals. `process` reads are supplied from a snapshot captured in main at startup, deliberately not a `process/browser` polyfill, which would report `platform === "browser"`. A build-time guard fails the build on an unguarded `process` read or a bare `setImmediate`/`clearImmediate`, rather than letting it surface as a runtime crash.

ZCash shielded sync receives its IPC channel through `setZCashIpcRenderer` instead of reaching for `electron`; the desktop app supplies it over the preload bridge.
