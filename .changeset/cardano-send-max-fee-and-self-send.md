---
"@ledgerhq/coin-cardano": minor
"@ledgerhq/live-common": minor
---

cardano: fix Send Max showing a ~10× inflated network fee (the whole low balance) and instead report the real protocol fee; surface a clear min-UTXO error when the balance is below the sendable dust threshold (both the account bridge and the CoinModule API paths). Also warn (non-blocking) on a self-send: the bridge `getTransactionStatus` and the CoinModule `validateIntent` now flag a recipient that is one of the account's own addresses, and the cardano family descriptor `selfTransfer` policy is set to "warning" so the new send flow surfaces it without blocking (matches vechain/near) (LIVE-33176).
