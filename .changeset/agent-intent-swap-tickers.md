---
"@ledgerhq/wallet-cli": minor
---

`agent-intent swap` takes tickers and ERC-20 contract addresses in `--from` and `--to` as well as currency ids, and fails with the candidates' currency ids when a ticker is ambiguous. It refuses another chain's coin in Ledger's currency list by currency id, ticker or name in any case (`bitcoin`, `BTC`, `Solana`) instead of an ERC-20 token that shares its ticker, unless the `--account` holds a token with that ticker to sell. `USDC` resolves to its ERC-20 token
