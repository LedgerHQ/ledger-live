---
"@ledgerhq/coin-stacks": patch
"@ledgerhq/live-common": patch
---

Align Stacks operations synced through the generic coin framework with the legacy bridge: a native STX send is no longer valued with its fee counted twice, a send-many is one OUT for the whole batch with a sub-operation per recipient, operations carry their nonce and fee payer, and an account switched back to the legacy bridge rebuilds its history instead of merging it.
