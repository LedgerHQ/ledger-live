---
"@ledgerhq/coin-tron": minor
---

Report the TRX and TRC10 that contracts move during a transaction (internal transactions): `getBlock` lists them for every successful transaction, and `listOperations` reads TronGrid's internal-transactions endpoint to list those moved to or from the account as `IN`/`OUT` operations with no fee, including in transactions the account did not send (a contract's SELFDESTRUCT naming it as beneficiary). Only the TRX ones carry `details.internal: true`; a TRC10 one is a plain operation of its token (`details.ledgerOpType`), since consumers add every `internal` operation to the native balance
