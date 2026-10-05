---
"@ledgerhq/transaction-observability": patch
---

Map the ETH staking dApp exit calls that reached `earn_transaction_*` as `transaction_type: unknown`.

Every name comes from a completed stake in production, not from the selector list: Chorus One `enterExitQueue` and `claimExitedAssets`, Coinbase and Kiln `requestExit` and `multiClaim`, Kiln `requestValidatorsExit`, Lido `requestWithdrawalsWithPermit` and Kelp `completeWithdrawal` are withdraws, and Kelp `requestRedeem` is a redeem.

Kiln `batchWithdrawCLFee` stays unmapped on purpose. It sweeps rewards, but after a validator exit the same call returns the principal, so either mapping would be wrong for some calls.
