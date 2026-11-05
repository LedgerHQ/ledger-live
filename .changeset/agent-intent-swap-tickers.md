---
"@ledgerhq/wallet-cli": minor
---

`agent-intent swap` takes tickers in `--from` and `--to` as well as currency ids, fails with the candidates' currency ids when a ticker is ambiguous, and refuses the coin of another chain Ledger Wallet supports by currency id, ticker or name in any case (`bitcoin`, `BTC`, `Solana`) instead of an ERC-20 token that shares its ticker. `USDC`, `POL` and `MNT` are the exceptions and resolve to their ERC-20 tokens
