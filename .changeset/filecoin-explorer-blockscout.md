---
"@domain/entity-currency-crypto": minor
"@ledgerhq/coin-filecoin": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

fix(filecoin): open transactions on Blockscout from operation details

Blockscout identifies a Filecoin message by its Ethereum-style hash, so the explorer link is now
built from the message CID's digest instead of the CID itself.
