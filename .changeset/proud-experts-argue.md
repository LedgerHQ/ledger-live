---
"ledger-live-desktop": patch
---

fix(market): use the Settings countervalue in the Market list when asset discoverability is enabled

When the asset discoverability feature flag is enabled, the per-market countervalue selector is hidden, so the Market list now follows the app-wide Settings countervalue (validated against the supported list, defaulting to USD) for both fetching and displaying prices. When the flag is off, the market store remains the source of truth and the dropdown still drives the list.
