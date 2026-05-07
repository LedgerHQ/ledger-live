---
"@ledgerhq/coin-tezos": minor
---

Reflect Paris staking positions in `getBalance` and `getStakes`. Both now expose up to three native staking entries per account: a delegation position (uid `delegation-{address}`, amount = `balance - stakedBalance`) when a delegate is set, an active staking position (uid `stake-{address}`, amount = `stakedBalance`) when `stakedBalance > 0`, and a deactivating unstake position (uid `unstaking-{address}`, amount = `unstakedBalance`, state `deactivating`) when `unstakedBalance > 0`. The native `Balance.value` continues to reflect `apiAccount.balance`.
