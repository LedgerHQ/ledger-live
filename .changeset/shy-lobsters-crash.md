---
"@ledgerhq/coin-hedera": minor
"@ledgerhq/live-common": patch
---

Fix Hedera transactions that pack several fund movements being reported as a single operation, and fix the sync cursor skipping or duplicating operations. In the generic bridge, give each recipient of a multi-recipient transfer its own operation id, and report a token sent to several recipients in one transaction as one token operation. Also report the ERC20 transfers of relayed EVM transactions, sum ERC20 transfers to the same counterparty, keep the HBAR side of ERC20 swaps, charge an ERC20 transfer's fee only to the account that paid it, report HBAR a contract call pays to the account as incoming, charge each account its actual debit on a failed transaction, keep syncing past pages that hold no operation for the account, and address fees of child transactions to the fee collection account.
