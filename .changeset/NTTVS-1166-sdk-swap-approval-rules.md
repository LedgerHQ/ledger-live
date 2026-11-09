---
"@ledgerhq/wallet-cli": minor
---

`agent-intent swap` checks token approvals with the Agent Intent SDK rules: it skips quotes that approve the zero address, have malformed `approve` calldata, or need an approval on a non-DEX 1inch, Velora or OKX quote
