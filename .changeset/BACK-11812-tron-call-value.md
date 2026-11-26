---
"@ledgerhq/coin-tron": minor
---

Report the TRX and TRC10 a sender attaches to a smart contract call (`call_value`, `call_token_value`): `getBlock` lists it as a transfer to the contract, along with a created contract's endowment, and `listOperations` as an `OUT` operation, which also gives a contract call with no TRC20 transfer its fee. `listOperations` does not report creation endowments
