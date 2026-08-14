---
"@features/flow-pay-card-balance": minor
"ledger-live-desktop": minor
---

Add the Pay action tiles to the LWD Card screen: mount the shared ActionTiles view-model under the balance hero (Add stablecoin / Request / New payment), add per-tile `appearance` support to the ActionTiles component, and extract the PayTab action-tiles and balance labels into dedicated hooks.
