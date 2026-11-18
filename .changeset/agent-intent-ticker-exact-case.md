---
"@ledgerhq/wallet-cli": minor
---

`agent-intent send` and `agent-intent swap` find a ticker in the Crypto Assets List in any case (`steth` finds stETH), and take the token whose mixed-case ticker is spelled as typed over one that matches only in another case, so `mETH` no longer fails as ambiguous with `METH`. An all-lowercase or all-uppercase ticker matches every case, so `METH` fails listing mETH and the token listed as `METH`, and a token listed as `usdc` can't stand in for USD Coin. When the search for other letter cases fails or is cut off, the exact ticker lookups still answer, and stderr says another token may share the ticker
