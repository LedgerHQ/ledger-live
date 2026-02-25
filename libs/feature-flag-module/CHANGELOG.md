# @ledgerhq/wallet-api-feature-flag-module

## 0.3.0

### Minor Changes

- [#14422](https://github.com/LedgerHQ/ledger-live/pull/14422) [`e7879f0`](https://github.com/LedgerHQ/ledger-live/commit/e7879f010edbff6df939662218ac4f007b2911ab) Thanks [@Justkant](https://github.com/Justkant)! - feat(wallet-api): add bitcoin.getAddresses handler for PSBT sign flow

  - Add bitcoinFamilyAccountGetAddressesLogic to return payment addresses for a Bitcoin account: first external, unused receive/change indices, and addresses with UTXOs; support optional intentions filter (e.g. "payment" only).
  - Register bitcoin.getAddresses handler in Wallet API server and add tracking (requested / fail / success).
  - Refactor useWalletAPIServer: keep a single WalletAPIServer instance via useRef and update config, permissions, and custom handlers in useEffect to avoid re-creation on re-renders.
  - Bump @ledgerhq/wallet-api-client (^1.13.0), @ledgerhq/wallet-api-core (^1.28.0), @ledgerhq/wallet-api-server (^3.1.0) and related packages across deeplink-, exchange-, feature-flag-, acre-module and dummy-wallet-app.
  - Add unit tests for bitcoinFamilyAccountGetAddressesLogic (intentions, error cases, address list shape, receive/change counts, UTXO addresses).

## 0.3.0-next.0

### Minor Changes

- [#14422](https://github.com/LedgerHQ/ledger-live/pull/14422) [`e7879f0`](https://github.com/LedgerHQ/ledger-live/commit/e7879f010edbff6df939662218ac4f007b2911ab) Thanks [@Justkant](https://github.com/Justkant)! - feat(wallet-api): add bitcoin.getAddresses handler for PSBT sign flow

  - Add bitcoinFamilyAccountGetAddressesLogic to return payment addresses for a Bitcoin account: first external, unused receive/change indices, and addresses with UTXOs; support optional intentions filter (e.g. "payment" only).
  - Register bitcoin.getAddresses handler in Wallet API server and add tracking (requested / fail / success).
  - Refactor useWalletAPIServer: keep a single WalletAPIServer instance via useRef and update config, permissions, and custom handlers in useEffect to avoid re-creation on re-renders.
  - Bump @ledgerhq/wallet-api-client (^1.13.0), @ledgerhq/wallet-api-core (^1.28.0), @ledgerhq/wallet-api-server (^3.1.0) and related packages across deeplink-, exchange-, feature-flag-, acre-module and dummy-wallet-app.
  - Add unit tests for bitcoinFamilyAccountGetAddressesLogic (intentions, error cases, address list shape, receive/change counts, UTXO addresses).

## 0.2.0

### Minor Changes

- [#13576](https://github.com/LedgerHQ/ledger-live/pull/13576) [`d215468`](https://github.com/LedgerHQ/ledger-live/commit/d21546860c915846e6fdf2dce07a7749fbf9f82f) Thanks [@sergiubreban](https://github.com/sergiubreban)! - Add wallet-api feature flag module for Live Apps to fetch feature flags from Ledger Live

## 0.2.0-next.0

### Minor Changes

- [#13576](https://github.com/LedgerHQ/ledger-live/pull/13576) [`d215468`](https://github.com/LedgerHQ/ledger-live/commit/d21546860c915846e6fdf2dce07a7749fbf9f82f) Thanks [@sergiubreban](https://github.com/sergiubreban)! - Add wallet-api feature flag module for Live Apps to fetch feature flags from Ledger Live
