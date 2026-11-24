---
"@ledgerhq/coin-algorand": minor
---

Include recursively nested inner transactions in Algorand operation history. Account transaction amounts are now read losslessly, so ASA amounts above `Number.MAX_SAFE_INTEGER` are exact in the operation history and in the Ledger Live account sync.
