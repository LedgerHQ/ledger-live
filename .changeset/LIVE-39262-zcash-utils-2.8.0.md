---
"@ledgerhq/coin-zcash": patch
"ledger-live-desktop": patch
---

Bump `@ledgerhq/zcash-utils` to 2.8.0, built on the stable Zcash crates that set the NU7 mainnet activation height (3543405). A mainnet transaction whose target block is past that height is built under the NU7 branch id, with a 120-block default expiry.
