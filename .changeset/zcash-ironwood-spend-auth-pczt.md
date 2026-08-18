---
"@ledgerhq/coin-zcash": minor
---

Forward Ironwood spend-auth signatures to PCZT finalization (LIVE-35956).

`signOperation` now passes the device's Ironwood `spendAuthSig` values to `combine`, so a V6 PCZT (any shielded or shielding send) finalizes through the same `finalizeTransaction` entry point as a V5 one — `@ledgerhq/zcash-utils` (bumped to 2.1.1) injects both pools' signatures and extracts the signed transaction. `ironwoodSignatures` is omitted rather than sent empty when the device signed no Ironwood action, because zcash-utils length-checks each pool's list against the PCZT.
