---
"@ledgerhq/coin-tezos": patch
---

Fix: handle registered baker (tzkt `type: "delegate"`) accounts. Previously only `user` accounts were recognized, so a baker address reported a zero balance, no staking positions, an incorrect reveal state and next-sequence, and failed transaction validation. Account reads and manager-key logic now gate on a shared `hasManagerKey` guard covering both `user` and `delegate`.
