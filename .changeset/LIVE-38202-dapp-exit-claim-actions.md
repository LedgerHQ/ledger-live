---
"@ledgerhq/transaction-observability": patch
---

Map the ETH staking dApp exit and claim calls that reached `earn_transaction_*` as `transaction_type: unknown`.

Every name comes from a completed stake in production, not from the selector list: Chorus One `enterExitQueue` and `claimExitedAssets`, Coinbase and Kiln `requestExit` and `multiClaim`, Kiln `requestValidatorsExit`, Lido `requestWithdrawalsWithPermit` and Kelp `completeWithdrawal` are withdraws, Kelp `requestRedeem` is a redeem, and Kiln `batchWithdrawCLFee` is a reward claim.
