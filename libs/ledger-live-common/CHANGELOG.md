# @ledgerhq/live-common

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

## 22.2.1-hotfix.0

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
