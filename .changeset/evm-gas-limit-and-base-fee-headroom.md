---
"@ledgerhq/coin-evm": minor
"@shared/env": minor
---

Fix EVM transactions being signed with a zero gas limit, and widen the EIP-1559 max fee headroom.

When gas estimation failed, its `BigNumber(0)` fallback travelled back to the sign step, where it was read as a deliberate custom gas limit. That disabled re-estimation and produced a transaction the node rejected with `intrinsic gas too low`. A non-positive gas limit is no longer honoured as a custom value, so the estimation runs again, and crafting now fails rather than sending a zero gas limit to the device (LIVE-32644).

`EIP1559_BASE_FEE_MULTIPLIER` goes from 1.27 to 1.6, so an estimated transaction stays includable for 4 blocks instead of 2 (the base fee grows by at most 12.5% per block). Max fees displayed on chains using the Ledger gas tracker will be higher, but the amount actually paid is unchanged: EIP-1559 charges the base fee plus the priority fee, and the max fee is only a ceiling (LIVE-32650).
