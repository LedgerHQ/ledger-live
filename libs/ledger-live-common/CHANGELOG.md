# @ledgerhq/live-common

## 24.0.0-nightly.3

### Minor Changes

- [#525](https://github.com/LedgerHQ/ledger-live/pull/525) [`3969bac02`](https://github.com/LedgerHQ/ledger-live/commit/3969bac02d6028ff543e61d4b67d95a6bfb14dfe) Thanks [@laure-lebon](https://github.com/laure-lebon)! - Filter added to empty delegation inside array when amount is egal to zero

### Patch Changes

- [#560](https://github.com/LedgerHQ/ledger-live/pull/560) [`414fa596a`](https://github.com/LedgerHQ/ledger-live/commit/414fa596a88aafdce676ac3fb349f41f302ea860) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix crash when there is a transaction with no input for bitcoin. LIVE-2748

## 24.0.0-nightly.2

### Minor Changes

- [#346](https://github.com/LedgerHQ/ledger-live/pull/346) [`60fb9efdc`](https://github.com/LedgerHQ/ledger-live/commit/60fb9efdcc9dbf72f651fd7b388d175a12bf859b) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Synchronized onboarding logic with:

  - Function to extract the device onboarding state from byte flags
  - Polling mechanism to retrieve the device onboarding state
  - Polling mechanism available as a react hook for LLM and LLD

### Patch Changes

- Updated dependencies [[`89387dee6`](https://github.com/LedgerHQ/ledger-live/commit/89387dee6dfc2a63fa29665ab5524f3950d3ce0e)]:
  - @ledgerhq/hw-app-btc@7.0.0-nightly.1

## 24.0.0-nightly.1

### Minor Changes

- 508e4c23b: Update ledger-live-common dependency stellar-sdk to v10.1.1

### Patch Changes

- Updated dependencies [6e956f22b]
  - @ledgerhq/cryptoassets@6.29.0-nightly.1
  - @ledgerhq/hw-app-eth@6.29.1-nightly.0

## 24.0.0-nightly.0

### Major Changes

- b1e396dd8: satstack issue fix Jira ticket: LIVE-2208 and LIVE-2170

### Minor Changes

- 10440ec3c: XRP: add retry to api call

## 23.1.0

### Minor Changes

- 8861c4fe0: upgrade dependencies
- ec5c4fa3d: Fix incremental sync for Cardano, use blockHeight from last operation instead of from account

### Patch Changes

- 8323d2eaa: Fix: Infinite Loading Spinner if no nano connected at start of funding flow [LIVE-2447]
- bf12e0f65: feat: sell and fund flow [LIVE-784]
- 608010c9d: Add a purchase device page embedding a webview from the ecommerce team. Also abstract webview pages logic into its own component (include Learn page's webview). Add a delayed tracking provider to send events to Adjust or Segment with an anonymised timestamp for sensible data.
- 78a64769d: Fix experimental EIP712 variable not working correctly

## 23.1.0-next.4

### Patch Changes

- 78a64769d: Fix experimental EIP712 variable not working correctly

## 23.1.0-next.3

### Minor Changes

- ec5c4fa3d: Fix incremental sync for Cardano, use blockHeight from last operation instead of from account

## 23.1.0-next.2

### Patch Changes

- bf12e0f65: feat: sell and fund flow [LIVE-784]

## 23.1.0-next.1

### Patch Changes

- 608010c9d: Add a purchase device page embedding a webview from the ecommerce team. Also abstract webview pages logic into its own component (include Learn page's webview). Add a delayed tracking provider to send events to Adjust or Segment with an anonymised timestamp for sensible data.

## 23.1.0-next.0

### Minor Changes

- 8861c4fe0: upgrade dependencies

### Patch Changes

- 8323d2eaa: Fix: Infinite Loading Spinner if no nano connected at start of funding flow [LIVE-2447]

## 23.0.0

### Major Changes

- 64c2fdb06: fix collision between bip44 and glif nomral derivation modes

### Minor Changes

- a66fbe852: import fix for Cardano (ADA) when doing a send it may cause invalid address
- 899aa3300: Use of the maxSpendable for bot testing instead of amount balance
- 89e82ed79: Crypto Icons - Add support for Abachi tokens icons
- 403ea8efe: Update cosmos snapshot
- 98ecc6272: First integration of Cardano (sync/send/receive)
- 64c2fdb06: Filecoin integration in LLD and LLM

### Patch Changes

- 09648db7f: refactor of the top perfs filter
- 0f59cfc10: Fix crash related to the way polkadot/crypto handles environments that lack WASM support.
- 8ee9c5568: Fix: Infinite Loading Spinner if no nano connected at start of funding flow [LIVE-2447]
- 9a86fe231: Fix the click on browse assets button on the market screen
- 8b2e24b6c: Fixing an issue with WalletConnect not accepting new connection after a first disconnection, resulting in an infite loading
- b688a592d: fix swap rate formula
- 71ad84023: Track in Sentry the uncaught errors thrown in the bridge transaction flow.
- Updated dependencies [c4be045f9]
  - @ledgerhq/hw-app-eth@6.29.0

## 23.0.0-next.4

### Patch Changes

- 8b2e24b6c: Fixing an issue with WalletConnect not accepting new connection after a first disconnection, resulting in an infite loading

## 23.0.0-next.3

### Minor Changes

- a66fbe852: import fix for Cardano (ADA) when doing a send it may cause invalid address

## 23.0.0-next.2

### Patch Changes

- 8ee9c5568: Fix: Infinite Loading Spinner if no nano connected at start of funding flow [LIVE-2447]

## 23.0.0-next.1

### Minor Changes

- 98ecc6272: First integration of Cardano (sync/send/receive)

## 23.0.0-next.0

### Major Changes

- 64c2fdb06: fix collision between bip44 and glif nomral derivation modes

### Minor Changes

- 899aa3300: Use of the maxSpendable for bot testing instead of amount balance
- 89e82ed79: Crypto Icons - Add support for Abachi tokens icons
- 403ea8efe: Update cosmos snapshot
- 64c2fdb06: Filecoin integration in LLD and LLM

### Patch Changes

- 09648db7f: refactor of the top perfs filter
- 0f59cfc10: Fix crash related to the way polkadot/crypto handles environments that lack WASM support.
- 9a86fe231: Fix the click on browse assets button on the market screen
- b688a592d: fix swap rate formula
- 71ad84023: Track in Sentry the uncaught errors thrown in the bridge transaction flow.
- Updated dependencies [c4be045f9]
  - @ledgerhq/hw-app-eth@6.29.0-next.0

## 22.2.1

### Patch Changes

- 6bcf42ecd: Fix: Infinite Loading Spinner if no nano connected at start of funding flow [LIVE-2447]

## 22.2.0

### Minor Changes

- e0c187073: Change the NFT Media components and model to use the new image processing feature from our NFT Metadata Provider. We now have multiple images and we're supporting videos.
- ee44ffb17: Cosmos Staking V1 LLD and LLC rework of delegation
- 0252fab71: LIVE-1004 Hedera first integration in LLD
- f913f6fdb: LIVE-2162 Solana staking UX improvements
- 9dadffa88: Update cosmos snapshot

### Patch Changes

- 3f816efba: Update stellar-sdk to 10.1.0
- f2574d25d: LIVE-2380 Update min Cosmos Nano app version to 2.34.4
- 04ad3813d: Add missing condition in Account page to check if account type before using isNFTActive helper. Also adds typing and unit tests to all NFT related helpers from live-common.

## 22.2.0-next.2

### Minor Changes

- 9dadffa88: Update cosmos snapshot

## 22.2.0-next.1

### Patch Changes

- 04ad3813d: Add missing condition in Account page to check if account type before using isNFTActive helper. Also adds typing and unit tests to all NFT related helpers from live-common.

## 22.2.0-next.0

### Minor Changes

- e0c18707: Change the NFT Media components and model to use the new image processing feature from our NFT Metadata Provider. We now have multiple images and we're supporting videos.
- ee44ffb1: Cosmos Staking V1 LLD and LLC rework of delegation
- 0252fab7: LIVE-1004 Hedera first integration in LLD
- f913f6fd: LIVE-2162 Solana staking UX improvements

### Patch Changes

- 3f816efb: Update stellar-sdk to 10.1.0
- f2574d25: LIVE-2380 Update min Cosmos Nano app version to 2.34.4
