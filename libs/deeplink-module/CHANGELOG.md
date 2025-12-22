# @ledgerhq/wallet-api-deeplink-module

## 0.4.0

### Minor Changes

- [#12775](https://github.com/LedgerHQ/ledger-live/pull/12775) [`6d0c6b2`](https://github.com/LedgerHQ/ledger-live/commit/6d0c6b2eda60049d8eebda5de2c54e8f0be7d009) Thanks [@Justkant](https://github.com/Justkant)! - refactor(wallet-api): migrate to lazy account/currency loading pattern

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

## 0.4.0-next.0

### Minor Changes

- [#12775](https://github.com/LedgerHQ/ledger-live/pull/12775) [`6d0c6b2`](https://github.com/LedgerHQ/ledger-live/commit/6d0c6b2eda60049d8eebda5de2c54e8f0be7d009) Thanks [@Justkant](https://github.com/Justkant)! - refactor(wallet-api): migrate to lazy account/currency loading pattern

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

## 0.3.0

### Minor Changes

- [#12252](https://github.com/LedgerHQ/ledger-live/pull/12252) [`958aaa4`](https://github.com/LedgerHQ/ledger-live/commit/958aaa480d9d42d71bf4dc46b2e5710ad9848152) Thanks [@Justkant](https://github.com/Justkant)! - feat(coin-ton): support new TON payload types (tonwhales deposit/withdraw, vesting comment)

  Adds typed payload variants and serialization/deserialization for:

  - tonwhales-pool-deposit
  - tonwhales-pool-withdraw
  - vesting-send-msg-comment

  Updates unit tests to cover new payloads and retains an explicit unsupported payload test case (lint-suppressed locally). Also bumps TON-related and wallet-api dependencies and replaces the @ton/core patch file reference.

## 0.3.0-next.0

### Minor Changes

- [#12252](https://github.com/LedgerHQ/ledger-live/pull/12252) [`958aaa4`](https://github.com/LedgerHQ/ledger-live/commit/958aaa480d9d42d71bf4dc46b2e5710ad9848152) Thanks [@Justkant](https://github.com/Justkant)! - feat(coin-ton): support new TON payload types (tonwhales deposit/withdraw, vesting comment)

  Adds typed payload variants and serialization/deserialization for:

  - tonwhales-pool-deposit
  - tonwhales-pool-withdraw
  - vesting-send-msg-comment

  Updates unit tests to cover new payloads and retains an explicit unsupported payload test case (lint-suppressed locally). Also bumps TON-related and wallet-api dependencies and replaces the @ton/core patch file reference.

## 0.2.0

### Minor Changes

- [#12066](https://github.com/LedgerHQ/ledger-live/pull/12066) [`53e4b19`](https://github.com/LedgerHQ/ledger-live/commit/53e4b19f556cbfd325816a70736552f09aa29df8) Thanks [@vcluzeau-ledger](https://github.com/vcluzeau-ledger)! - feat(wallet-api): add deeplink module for LLD & LLM

## 0.2.0-next.0

### Minor Changes

- [#12066](https://github.com/LedgerHQ/ledger-live/pull/12066) [`53e4b19`](https://github.com/LedgerHQ/ledger-live/commit/53e4b19f556cbfd325816a70736552f09aa29df8) Thanks [@vcluzeau-ledger](https://github.com/vcluzeau-ledger)! - feat(wallet-api): add deeplink module for LLD & LLM
