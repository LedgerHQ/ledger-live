---
"@ledgerhq/coin-tron": minor
---

Expose energy and bandwidth resource figures (required vs available) on the Tron transaction status, and make the TRC20 transfer fee energy-aware: it is now 0 TRX when staked energy and bandwidth cover the transfer, reflects the real shortfall cost otherwise, and falls back to the previous flat fee when the on-chain energy estimation cannot be determined. The "not enough energy" warning now derives from the real per-transaction energy estimate instead of a hardcoded constant.
