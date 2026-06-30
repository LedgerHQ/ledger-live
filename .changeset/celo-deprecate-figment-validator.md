---
"@ledgerhq/coin-celo": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

celo: deprecate the "Ledger by Figment" validator. It is no longer shown or selectable in the vote flow and is never the default — the validator list is now ranked by TVL with none selected by default. Existing delegations remain fully manageable (unvote / unlock / withdraw).
