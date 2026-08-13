---
"@ledgerhq/live-common": patch
"@ledgerhq/coin-evm": patch
"@ledgerhq/ledger-wallet-framework": patch
---

Fix an ERC-20 operation staying stuck on "Sending..." after a speed up or a cancel, which also kept
its amount locked out of the token spendable balance. A replaced transaction can only be retired by
its nonce, and token operations were not carrying one.
