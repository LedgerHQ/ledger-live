---
"@ledgerhq/live-common": patch
"@ledgerhq/coin-evm": patch
---

Fix balance semantics in generic-alpaca extractBalances: expose total balance as `value` and non-spendable part as `locked`, restoring staking flows (e.g. Solana stake withdraw fee covered by the unstake reserve). Update coin-evm `computeAmount`/`validateAmount` to compute spendable funds as `value - locked`, preserving the existing EVM send-all behavior for staking-enabled accounts.
