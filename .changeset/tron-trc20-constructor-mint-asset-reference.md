---
"@ledgerhq/coin-tron": patch
---

fix(tron): resolve the TRC20 contract address of a transfer minted by a contract creation

A TRC20 minted from a contract's constructor was reported without its contract address: TronGrid
has no `token_info` for a contract created in that very transaction, and a `CreateSmartContract`
carries no `contract_address` parameter, so the operation shipped a `trc20` asset with no
`assetReference`. Both `listOperations` and `getBlock` now take the token from the transaction's
own `Transfer` event logs, under one rule: a token transfer is reported only when the logs name
its token, otherwise no token asset is emitted at all — `listOperations` drops the operation and
`getBlock` reports a plain contract operation. `getBlock` also reports these constructor mints as
transfers now, instead of omitting them.
