---
"@ledgerhq/coin-zcash": patch
"ledger-live-desktop": patch
---

Bump `@ledgerhq/zcash-utils` to 2.10.0. `parsePczt` returns the unified address the user entered for an output (`userAddress`, `userAddressReceivers`), and the Windows binary links the C runtime statically, so it loads on a machine without the Visual C++ Redistributable.
