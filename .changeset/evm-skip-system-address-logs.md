---
"@ledgerhq/coin-evm": patch
---

Skip logs emitted by SYSTEM_ADDRESS when parsing ERC20 transfers from receipts. EIP-7708 (Glamsterdam) makes every native transfer emit a log identical to an ERC20 `Transfer`, which would otherwise be reported as a transfer of a non-existent token.
