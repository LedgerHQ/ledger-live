---
"@ledgerhq/coin-cardano": minor
---

cardano: stop counting unclaimed staking rewards as spendable. A send never withdraws rewards (the device swap policy rejects withdrawals), so whatever the dRep delegation the account-sync spendable balance now excludes them, the CoinModule `getBalance` reports them as `locked`, and an ADA send is validated against the spendable balance instead of the total balance. Sends and swaps of an amount only the rewards would cover now fail early with `NotEnoughBalance` instead of a build-time `CardanoNotEnoughFunds`, including on an account holding only rewards (no UTXO). Send Max skips that pre-check and is left to the transaction builder.
