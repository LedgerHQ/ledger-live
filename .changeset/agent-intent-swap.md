---
"@ledgerhq/wallet-cli": minor
---

feat(wallet-cli): add agent-intent swap to propose a swap for human review

`agent-intent swap --profile <id> --from <currency id> --to <currency id> --amount <amount>` quotes the swap with the Swap API, then signs and submits the best quote the Agent Intent frontend can prepare (oneinch, velora, okx or lifi, with no pending token approval or Permit2) as a Swap intent, and prints the review link. `--provider` narrows the quote, `--to-amount` replaces it, and `--dry-run` quotes and validates without submitting. Ethereum mainnet ETH and ERC-20 only; amounts are human units and stay exact.
