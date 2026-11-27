---
"@ledgerhq/live-common": minor
---

EVM: let `validateIntent` report a refused fee estimation (`validatesRefusedEstimation`), needed for coin-evm versions whose `estimateFees` rejects a failed gas estimation instead of returning a 0 gas limit
