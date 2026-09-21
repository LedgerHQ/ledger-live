---
"@ledgerhq/coin-cosmos": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

feat(coin-cosmos): add the Gonka currency configuration

Points Gonka at the Ledger-hosted LCD, sets its minimum gas price to 0 (the chain's fee
consensus parameter), and disables delegation, which the runtime rejects. Hides the account-header
stake action on Desktop and Mobile for any Cosmos chain whose config sets `disableDelegation`, and
stops a zero minimum gas price being mistaken for a missing config when preloaded data is restored.
