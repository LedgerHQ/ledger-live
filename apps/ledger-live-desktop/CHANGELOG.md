# ledger-live-desktop

## 2.44.0-nightly.6

### Patch Changes

- Updated dependencies [2012b5477]
- Updated dependencies [e9decc277]
  - @ledgerhq/live-common@24.0.0-nightly.3

## 2.44.0-nightly.5

### Patch Changes

- ebb7deb1a: Fix regression when opening external windows from within a webview tag
- Updated dependencies [e1f2f07a2]
  - @ledgerhq/live-common@23.1.0-nightly.2

## 2.44.0-nightly.4

### Patch Changes

- Updated dependencies [e393b9bfa]
- Updated dependencies [d22452817]
- Updated dependencies [9c3e27f46]
  - @ledgerhq/react-ui@0.8.0-nightly.0
  - @ledgerhq/live-common@23.1.0-nightly.1

## 2.44.0-nightly.3

### Patch Changes

- cdcee7ad9: Replace webpack with esbuild for production builds.

## 2.44.0-nightly.2

### Minor Changes

- a35c6e9a3: Add Sentry support

### Patch Changes

- c5c3f48e4: Add basic support for macOS universal apps.
- Updated dependencies [c5c3f48e4]
  - @ledgerhq/hw-transport-node-hid-singleton@6.27.2-nightly.1

## 2.44.0-nightly.1

### Patch Changes

- 89e31c3c4: Fixed issue on CryptoCurrency Icon in transactions history (size issue)
- Updated dependencies [22531f3c3]
- Updated dependencies [1e4a5647b]
  - @ledgerhq/live-common@23.0.1-nightly.0

## 2.44.0-nightly.0

### Minor Changes

- 9c3b16bcc: Fix infinite loading when NFTs are load in gallery mode

### Patch Changes

- c78f7d6db: Fixed issue on Circulating Supply, removed currency in front of the value

## 2.43.1

### Patch Changes

- 2707fa19b: add release notes

## 2.43.0

### Minor Changes

- cefeff1d7: Display a modal at app launch to inform users terms of use got updated. Also refactor the way we assess terms update using date comparison instead of strict string equality.
- 64c2fdb06: Filecoin integration in LLD and LLM

### Patch Changes

- 8b2e24b6c: Fixing an issue with WalletConnect not accepting new connection after a first disconnection, resulting in an infite loading
- Updated dependencies [09648db7f]
- Updated dependencies [a66fbe852]
- Updated dependencies [0f59cfc10]
- Updated dependencies [8ee9c5568]
- Updated dependencies [899aa3300]
- Updated dependencies [89e82ed79]
- Updated dependencies [403ea8efe]
- Updated dependencies [98ecc6272]
- Updated dependencies [9a86fe231]
- Updated dependencies [8b2e24b6c]
- Updated dependencies [64c2fdb06]
- Updated dependencies [f686ec781]
- Updated dependencies [b688a592d]
- Updated dependencies [71ad84023]
- Updated dependencies [64c2fdb06]
  - @ledgerhq/live-common@23.0.0
  - @ledgerhq/react-ui@0.7.7

## 2.43.0-next.5

### Patch Changes

- 8b2e24b6c: Fixing an issue with WalletConnect not accepting new connection after a first disconnection, resulting in an infite loading
- Updated dependencies [8b2e24b6c]
  - @ledgerhq/live-common@23.0.0-next.4

## 2.43.0-next.4

### Patch Changes

- Updated dependencies [a66fbe852]
  - @ledgerhq/live-common@23.0.0-next.3

## 2.43.0-next.3

### Patch Changes

- Updated dependencies [8ee9c5568]
  - @ledgerhq/live-common@23.0.0-next.2

## 2.43.0-next.2

### Patch Changes

- Updated dependencies [98ecc6272]
  - @ledgerhq/live-common@23.0.0-next.1

## 2.43.0-next.1

### Minor Changes

- cefeff1d7: Display a modal at app launch to inform users terms of use got updated. Also refactor the way we assess terms update using date comparison instead of strict string equality.

## 2.43.0-next.0

### Minor Changes

- 64c2fdb06: Filecoin integration in LLD and LLM

### Patch Changes

- Updated dependencies [09648db7f]
- Updated dependencies [0f59cfc10]
- Updated dependencies [899aa3300]
- Updated dependencies [89e82ed79]
- Updated dependencies [403ea8efe]
- Updated dependencies [9a86fe231]
- Updated dependencies [64c2fdb06]
- Updated dependencies [f686ec781]
- Updated dependencies [b688a592d]
- Updated dependencies [71ad84023]
- Updated dependencies [64c2fdb06]
  - @ledgerhq/live-common@23.0.0-next.0
  - @ledgerhq/react-ui@0.7.7-next.0

## 2.42.0

### Minor Changes

- e0c187073: Change the NFT Media components and model to use the new image processing feature from our NFT Metadata Provider. We now have multiple images and we're supporting videos.
- ee44ffb17: Cosmos Staking V1 LLD and LLC rework of delegation
- 0252fab71: LIVE-1004 Hedera first integration in LLD
- daaf595c2: Add Chinese (ZH) and Spanish (ES) to discoverable languages. Also refactor the system language detection function.
- f913f6fdb: LIVE-2162 Solana staking UX improvements
- b054eb4d9: Fix wrong cosmos validator at summary step

### Patch Changes

- 1735fdd30: bugfix - market page lag issue during navigation fixed + removal of duplicated breadcrumb on market details page
- Updated dependencies [e0c187073]
- Updated dependencies [ee44ffb17]
- Updated dependencies [16be6e5c0]
- Updated dependencies [a26ee3f54]
- Updated dependencies [0252fab71]
- Updated dependencies [3f816efba]
- Updated dependencies [f2574d25d]
- Updated dependencies [f913f6fdb]
- Updated dependencies [403ea8efe]
- Updated dependencies [9a86fe231]
  - @ledgerhq/live-common@22.2.0

## 2.42.0-llmnext.3

### Patch Changes

- Updated dependencies [16be6e5c0]
  - @ledgerhq/live-common@22.2.0-llmnext.2

## 2.42.0-llmnext.2

### Patch Changes

- Updated dependencies [a26ee3f54]
  - @ledgerhq/live-common@22.2.0-llmnext.1

## 2.42.0-llmnext.1

### Minor Changes

- b054eb4d: Fix wrong cosmos validator at summary step

## 2.42.0-llmnext.0

### Minor Changes

- e0c187073: Change the NFT Media components and model to use the new image processing feature from our NFT Metadata Provider. We now have multiple images and we're supporting videos.
- ee44ffb17: Cosmos Staking V1 LLD and LLC rework of delegation
- 0252fab71: LIVE-1004 Hedera first integration in LLD
- daaf595c2: Add Chinese (ZH) and Spanish (ES) to discoverable languages. Also refactor the system language detection function.
- f913f6fdb: LIVE-2162 Solana staking UX improvements

### Patch Changes

- 1735fdd30: bugfix - market page lag issue during navigation fixed + removal of duplicated breadcrumb on market details page
- Updated dependencies [e0c187073]
- Updated dependencies [ee44ffb17]
- Updated dependencies [0252fab71]
- Updated dependencies [3f816efba]
- Updated dependencies [f2574d25d]
- Updated dependencies [f913f6fdb]
- Updated dependencies [403ea8efe]
- Updated dependencies [9a86fe231]
  - @ledgerhq/live-common@22.2.0-llmnext.0
