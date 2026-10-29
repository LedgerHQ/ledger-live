---
"@ledgerhq/wallet-cli": patch
---

`agent-intent send` and `agent-intent swap` find a ticker in the Crypto Assets List in any case (`steth` finds stETH), and take the token whose mixed-case ticker is spelled as typed over one that matches only in another case, so `mETH` no longer fails as ambiguous with `METH`. An all-lowercase or all-uppercase ticker matches every case, so `METH` fails listing mETH and the token listed as `METH`, and a token listed as `usdc` can't stand in for USD Coin
