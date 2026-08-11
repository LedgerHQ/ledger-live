---
"@ledgerhq/coin-evm": patch
---

Fix EVM send-max on L2s (Scroll, Blast, Base) failing at broadcast with `InsufficientFunds`

The send-max amount is `balance - fees`, but the L2 → L1 data fee (`additionalFees`) was reserved with no headroom, unlike L2 execution gas which already carries ~2x headroom via `maxFeePerGas`. Because the L1 data fee tracks the volatile Ethereum L1 base fee, any upward drift between fee estimation and broadcast (device signing takes seconds) made the transaction overspend and the node rejected it.

- Reserve a 2x headroom on the L1 data fee for send-max only (normal sends keep an exact fee display).
- Query the OP-stack L1 gas oracle for Blast and Base on the Ledger node — they were falling through to a `0` L1 fee and being under-reserved.
- Point the external RPC node at the canonical OP-stack `GasPriceOracle` predeploy (`0x420000000000000000000000000000000000000F`) so the L1-fee lookup succeeds on all OP-stack chains.
