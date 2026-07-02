---
"@ledgerhq/live-cli": patch
"@ledgerhq/live-common": patch
"@ledgerhq/coin-cardano": patch
"@ledgerhq/coin-multiversx": patch
"@ledgerhq/coin-bitcoin": patch
"@ledgerhq/coin-algorand": patch
"@ledgerhq/coin-solana": patch
"@ledgerhq/coin-near": patch
"@ledgerhq/coin-icon": patch
"@ledgerhq/coin-ton": patch
"@ledgerhq/coin-celo": patch
"@ledgerhq/coin-cosmos": patch
"@ledgerhq/coin-tron": patch
"@ledgerhq/coin-concordium": patch
"@ledgerhq/coin-filecoin": patch
"@ledgerhq/coin-kaspa": patch
"@ledgerhq/coin-mina": patch
"@ledgerhq/coin-polkadot": patch
"@ledgerhq/coin-hedera": patch
"@ledgerhq/coin-aptos": patch
"@ledgerhq/coin-stacks": patch
"@ledgerhq/coin-aleo": patch
"@ledgerhq/coin-sui": patch
"@ledgerhq/coin-internet_computer": patch
"@ledgerhq/coin-canton": patch
"@ledgerhq/coin-casper": patch
"@ledgerhq/coin-vechain": patch
"@ledgerhq/coin-module-boilerplate": patch
---

Drop the per-coin `cli.ts` / `cli-transaction.ts` / `test/cli.ts` (`makeCliTools`) contract from coin families and the `cliTools` field of `FamilySetup`. The only consumer was the `apps/cli` `send` command, and the only e2e path that used it was the EVM ERC20 token approval. That flow is now a dedicated, self-contained `tokenApproval` CLI command; the generic `send` command keeps the cross-family options only.
