---
"@ledgerhq/wallet-cli": minor
---

`agent-intent swap` skips quotes whose token approval the Agent Intent frontend refuses: a zero-address spender, malformed `approve` calldata, or a non-DEX 1inch, Velora or OKX quote
