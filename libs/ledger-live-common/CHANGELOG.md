# @ledgerhq/live-common

## 22.3.0-nightly.1

### Minor Changes

- 8861c4fe0: upgrade dependencies

### Patch Changes

- 8323d2eaa: Fix: Infinite Loading Spinner if no nano connected at start of funding flow [LIVE-2447]

## 22.2.1-nightly.0

### Patch Changes

- 09648db7f: refactor of the top perfs filter
- 0f59cfc10: Fix crash related to the way polkadot/crypto handles environments that lack WASM support.
- 71ad84023: Track in Sentry the uncaught errors thrown in the bridge transaction flow.

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
