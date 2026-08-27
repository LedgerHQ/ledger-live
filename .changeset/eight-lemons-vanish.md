---
"@ledgerhq/coin-cardano": minor
---

cardano: stop injecting an ABSTAIN vote-delegation certificate (and an automatic reward withdrawal) into plain send transactions. The Conway `ConwayWdrlNotDelegatedToDRep` rule constrains only a transaction that withdraws rewards, so a send that does not touch the reward account is valid with zero certificates and zero withdrawals regardless of unclaimed rewards — injecting either silently changed the user's governance state and broke swaps (the device swap policy rejects any certificate or withdrawal). These reward/governance obligations now apply only to the delegate/undelegate flows, which are unchanged. Fixes Cardano swaps failing on accounts that hold staking rewards. Applies to both the account bridge (`buildTransaction`) and the CoinModule API (`craftTransaction`) paths.
