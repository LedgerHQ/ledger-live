---
"ledger-live-desktop": minor
---

fix(desktop): persist the CAL token cache again

The persistence middleware matched CAL actions on the hardcoded `cryptoAssetsApi/` prefix, which stopped matching when the CAL api moved to the `calApi` reducer path. It now derives the prefix from `cryptoAssetsApi.reducerPath`.
