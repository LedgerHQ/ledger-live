---
"@ledgerhq/coin-ton": minor
---

Fix error precedence in `validateAmount`: `TonMinimumRequired` no longer overwrites `NotEnoughBalance` when both conditions are true. The keep-alive minimum error now only surfaces when it is the binding constraint.
