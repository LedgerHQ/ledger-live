---
"@ledgerhq/coin-cosmos": patch
"ledger-live-desktop": patch
---

Fix the Cosmos-family "Undelegating" tooltip in the desktop account summary footer, which hardcoded a 21-day timelock for every chain. It now uses each chain's actual unbonding period (e.g. ~2 days for Babylon, 14 for Osmosis, 30 for dYdX), matching the value already shown in the delegation section.

Also make the Cosmos chain factory alias the crypto_org_croeseid testnet to crypto_org, so it resolves chain params instead of throwing (previously only the osmosis alias was handled).
