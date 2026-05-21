---
"@ledgerhq/coin-evm": patch
---

Fix zkSync L1→L2 priority deposits (receipt type 0xff) producing a null net balance on the user's L2 account. We now parse `Mint(account, amount)` events into Transfer-equivalent ops with `peer = 0x0` (generic ERC20 mint convention). On zkSync L1→L2 priority txs, this surfaces the deposit credit, the bootloader fee, and the gas refund. On the native side, the cancelling self pair from `tx.value` is replaced with a single credit op (`peer = 0x0`). Mint-source ops on `0x0` are filtered out as accounting noise.
