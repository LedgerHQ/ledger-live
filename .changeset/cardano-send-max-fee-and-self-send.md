---
"@ledgerhq/coin-cardano": patch
---

cardano: fix Send Max showing a ~10× inflated network fee (the whole low balance) and instead report the real protocol fee; surface a clear min-UTXO error when the balance is below the sendable dust threshold; warn (non-blocking) when the recipient is one of the account's own addresses (self-send). Applies to both the account bridge and the CoinModule API paths (LIVE-33176).
