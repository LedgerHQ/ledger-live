---
"@ledgerhq/wallet-btc": patch
"@ledgerhq/coin-bitcoin": patch
---

Fix an undecodable/corrupted xpub crashing the whole Bitcoin address-scan block. `getPubkeyAt` now throws a typed `InvalidXpub` error; `checkAddressesBlock` uses `Promise.allSettled` so a bad xpub no longer aborts the block scan.
