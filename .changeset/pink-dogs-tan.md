---
"@ledgerhq/cryptoassets": minor
"@ledgerhq/wallet-api-acre-module": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/live-common": minor
"@ledgerhq/dummy-wallet-app": minor
"@ledgerhq/wallet-api-deeplink-module": minor
"@ledgerhq/wallet-api-exchange-module": minor
"@ledgerhq/coin-framework": minor
---

refactor(wallet-api): migrate to lazy account/currency loading pattern

Refactor Wallet & Platform APIs to lazy-load currencies/accounts via CAL API.

Highlights:

- Replace precomputed currency/account datasets with on-demand fetching (pagination supported).
- account.request: now uses currencyIds: string[]; removes Observable parameter; upfront ID mapping helper added.
- currency.list: dynamic token retrieval; supports patterns (** / family/** / specific); adds delisted warnings.
- Remove legacy hooks (useWalletAPIAccounts, useWalletAPICurrencies, useGetAccountIds); introduce useSetWalletAPIAccounts & useDAppManifestCurrencyIds.
- Async token/address lookup; simplified modular drawer (no accounts$ / observable registry).
- Desktop/mobile components now operate on currencyIds; streamlined account/currency selection flows.
- Platform API: async listing with minimatch filtering; dropped multiple filtering helpers.
- Added tracking for currency.list & account.list; fixed areCurrenciesFiltered logic (LIVE-23089).
- Package bumps: wallet-api-client ^1.12.5, wallet-api-core ^1.26.1, wallet-api-server ^2.0.0; unify bignumber.js 9.1.2.
  Impact: lower memory, faster startup, improved scalability, clearer API surface.
