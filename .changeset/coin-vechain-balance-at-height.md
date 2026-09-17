---
"@ledgerhq/coin-vechain": minor
---

Read balances at a block height

`getBalance` now honors `BalanceOptions.height`, threading it to Thor's `revision` query parameter
on `/accounts/{address}`, so a caller can ask for an account's VET and VTHO as of a given block
instead of only the chain head. `height: 0` is forwarded as the genesis revision rather than read as
absent.

Balance options the module cannot apply are now refused by name with an `InvalidParameterError`,
instead of going through the framework's all-or-nothing `rejectBalanceOptions`: `includeAssets` is
still rejected, an options object that requests nothing is accepted, and any balance option VeChain
has not opted into stays rejected — silently ignoring one would answer a different question than the
caller asked.

Requires a `@ledgerhq/coin-module-framework` that carries `height` on `BalanceOptions`. Only the
CoinModuleApi surface gains this; the legacy account bridge continues to read head state.
