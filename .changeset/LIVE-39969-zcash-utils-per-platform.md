---
"@ledgerhq/coin-zcash": patch
"ledger-live-desktop": patch
---

Bump `@ledgerhq/zcash-utils` to 2.9.0, which ships each native binary in its own optional package. The desktop app now packages only the binaries it runs on (darwin arm64/x64, win32 x64, linux x64) instead of all six.
