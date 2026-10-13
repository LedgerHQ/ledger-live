---
"@domain/entity-currency-crypto": patch
"@ledgerhq/coin-filecoin": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

fix(filecoin): open transactions on Blockscout from operation details

Blockscout identifies a Filecoin message by its Ethereum-style hash, so the explorer link is now
built from the message CID's digest instead of the CID itself.
