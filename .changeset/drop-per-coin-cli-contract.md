---
"@ledgerhq/live-cli": minor
"@ledgerhq/live-common": minor
"@ledgerhq/coin-cardano": minor
"@ledgerhq/coin-multiversx": minor
"@ledgerhq/coin-bitcoin": minor
"@ledgerhq/coin-algorand": minor
"@ledgerhq/coin-solana": minor
"@ledgerhq/coin-near": minor
"@ledgerhq/coin-icon": minor
"@ledgerhq/coin-ton": minor
"@ledgerhq/coin-celo": minor
"@ledgerhq/coin-cosmos": minor
"@ledgerhq/coin-tron": minor
"@ledgerhq/coin-concordium": minor
"@ledgerhq/coin-filecoin": minor
"@ledgerhq/coin-kaspa": minor
"@ledgerhq/coin-mina": minor
"@ledgerhq/coin-polkadot": minor
"@ledgerhq/coin-hedera": minor
"@ledgerhq/coin-aptos": minor
"@ledgerhq/coin-stacks": minor
"@ledgerhq/coin-aleo": minor
"@ledgerhq/coin-sui": minor
"@ledgerhq/coin-internet_computer": minor
"@ledgerhq/coin-canton": minor
"@ledgerhq/coin-casper": minor
"@ledgerhq/coin-vechain": minor
"@ledgerhq/coin-module-boilerplate": minor
---

Drop the per-coin `cli.ts` / `cli-transaction.ts` / `test/cli.ts` (`makeCliTools`) contract from coin families and the `cliTools` field of `FamilySetup`. The only consumer was the `apps/cli` `send` command, and the only e2e path that used it was the EVM ERC20 token approval. That flow is now a dedicated, self-contained `tokenApproval` CLI command; the generic `send` command keeps the cross-family options only.
