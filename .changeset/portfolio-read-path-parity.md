---
"@ledgerhq/live-common": minor
---

With `portfolio.enabled`, the generic bridge builds an address account from the portfolio layer's models through the same assembly as the legacy path: the network's balance list (stakes, locked parts and tokens, so sub-accounts, staking resources and positions are built), every operation the sync listed, the validators, and the family hooks reading the chain through the portfolio. Sync and validation errors cross as `ErrorView` and are revived as the class the family's coin module throws (a registry of the frameworks', Ledger Wallet's and each generic coin module's errors). The account module path reads its fresh address, outputs and synced height through the portfolio, the chain reads of entry points (broadcast, scan lookup) go through the currency's network portfolio, and the portfolio `syncHash` now carries the tokens hash: switching to it resyncs from scratch. Its local side lists operations under the same history bound as the legacy path
