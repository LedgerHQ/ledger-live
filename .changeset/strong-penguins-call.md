---
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/live-common": minor
"@ledgerhq/live-cli": minor
"@ledgerhq/cryptoassets": minor
---

Osmosis Send, Receive and Staking + Cosmos refactor

For additional context on what changed:

- Ledger Live Desktop: functionality for Osmosis send, receive and staking.
- Ledger Live Desktop: refactor of some Cosmos components to enable reusing some components for Osmosis.
  and easily integrate future Cosmos-based cryptocurrencies.

- Ledger Live Common: functionality for Osmosis send, receive and staking.
- Ledger Live Common: refactor of some Cosmos modules to enable reusing code for Osmosis.
  Notable changes are: renaming the hook useCosmosPreloadData to useCosmosFamilyPreloadData and turning
  validators.ts and js-synchronisation.ts into classes.

- Ledger Live Mobile: only marked as major because the useCosmosPreloadData hook changed name, which is a breaking change.

- Cryptoassets: updated a URL in the Osmosis cryptocurrency definition.

- Live CLI: updated references to cosmosSourceValidators to sourceValidators for re-usability.
