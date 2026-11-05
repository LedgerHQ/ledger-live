---
"@ledgerhq/wallet-cli": minor
---

`agent-intent send` refuses an `--amount` ticker that names another chain's coin by currency id, ticker or name in any case (`1 BTC` or `1 Bitcoin` from an Ethereum account), as `agent-intent swap` does, instead of sending an ERC-20 or SPL token that shares its ticker. `USDC` on both networks, `POL` and `MNT` on Ethereum, and `HNT`, `KIN` and `NEON` on Solana still resolve to their tokens, and the network's own coin by name (`Ethereum`, `Solana`) is a native send
