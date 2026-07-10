---
"ledger-live-desktop": patch
---

Fix the Cosmos-family "Undelegating" tooltip in the account summary footer, which hardcoded a 21-day timelock for every chain. It now uses each chain's actual unbonding period (e.g. ~2 days for Babylon, 14 for Osmosis, 30 for dYdX), matching the value already shown in the delegation section.
