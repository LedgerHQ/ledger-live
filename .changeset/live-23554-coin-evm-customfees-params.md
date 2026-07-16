---
"@ledgerhq/coin-evm": minor
"@ledgerhq/live-common": minor
---

coin-evm now reads `feesStrategy` and `sponsored` from the `customFees` fee-estimation parameters instead of the transaction intent. The generic-coin-framework bridge and the EVM swap job fold these fields into `customFees.parameters` accordingly, aligning with the coin-module framework where both are deprecated on `TransactionIntent`.
