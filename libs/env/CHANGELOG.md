# @ledgerhq/live-env

## 0.4.2

### Patch Changes

- [#4145](https://github.com/LedgerHQ/ledger-live/pull/4145) [`95088eab45`](https://github.com/LedgerHQ/ledger-live/commit/95088eab45f6af919e347a605cefefb6d7705808) Thanks [@ggilchrist-ledger](https://github.com/ggilchrist-ledger)! - Removing FTX and Wyre related code from LLD, LLM and LLC

## 0.4.2-next.0

### Patch Changes

- [#4145](https://github.com/LedgerHQ/ledger-live/pull/4145) [`95088eab45`](https://github.com/LedgerHQ/ledger-live/commit/95088eab45f6af919e347a605cefefb6d7705808) Thanks [@ggilchrist-ledger](https://github.com/ggilchrist-ledger)! - Removing FTX and Wyre related code from LLD, LLM and LLC

## 0.4.1

### Patch Changes

- [#3964](https://github.com/LedgerHQ/ledger-live/pull/3964) [`770842cdbe`](https://github.com/LedgerHQ/ledger-live/commit/770842cdbe94c629b6844f93d1b5d94d381931b1) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - rename optimism to op mainnet

## 0.4.1-next.0

### Patch Changes

- [#3964](https://github.com/LedgerHQ/ledger-live/pull/3964) [`770842cdbe`](https://github.com/LedgerHQ/ledger-live/commit/770842cdbe94c629b6844f93d1b5d94d381931b1) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - rename optimism to op mainnet

## 0.4.0

### Minor Changes

- [#3841](https://github.com/LedgerHQ/ledger-live/pull/3841) [`bae3b64dd2`](https://github.com/LedgerHQ/ledger-live/commit/bae3b64dd2710a3743552600166be986e93d9099) Thanks [@Justkant](https://github.com/Justkant)! - feat: recover on LLD

  Handle the recover deeplink
  Add a screen to redirect to the correct device onboarding automatically
  Rework of the recover feature flags
  Add upsell screen for recover after onboarding

### Patch Changes

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add polygon_as_evm_test_only & ethereum_as_evm_test_only to NFT_CURRENCIES

## 0.4.0-next.0

### Minor Changes

- [#3841](https://github.com/LedgerHQ/ledger-live/pull/3841) [`bae3b64dd2`](https://github.com/LedgerHQ/ledger-live/commit/bae3b64dd2710a3743552600166be986e93d9099) Thanks [@Justkant](https://github.com/Justkant)! - feat: recover on LLD

  Handle the recover deeplink
  Add a screen to redirect to the correct device onboarding automatically
  Rework of the recover feature flags
  Add upsell screen for recover after onboarding

### Patch Changes

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add polygon_as_evm_test_only & ethereum_as_evm_test_only to NFT_CURRENCIES

## 0.3.1

### Patch Changes

- [#3696](https://github.com/LedgerHQ/ledger-live/pull/3696) [`5af41b6fa1`](https://github.com/LedgerHQ/ledger-live/commit/5af41b6fa1e43037ccdb2df279c82e12ef3d2b1a) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Allow to enable listAppsV2 via feature flags instead of experimental settings

## 0.3.1-next.0

### Patch Changes

- [#3696](https://github.com/LedgerHQ/ledger-live/pull/3696) [`5af41b6fa1`](https://github.com/LedgerHQ/ledger-live/commit/5af41b6fa1e43037ccdb2df279c82e12ef3d2b1a) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Allow to enable listAppsV2 via feature flags instead of experimental settings

## 0.3.0

### Minor Changes

- [#3338](https://github.com/LedgerHQ/ledger-live/pull/3338) [`22491091f7`](https://github.com/LedgerHQ/ledger-live/commit/22491091f7b4e06ee6a0cdf964498aa5b08d6eb0) Thanks [@chabroA](https://github.com/chabroA)! - Restore full network logs under env var and with experimental setting

## 0.3.0-next.0

### Minor Changes

- [#3338](https://github.com/LedgerHQ/ledger-live/pull/3338) [`22491091f7`](https://github.com/LedgerHQ/ledger-live/commit/22491091f7b4e06ee6a0cdf964498aa5b08d6eb0) Thanks [@chabroA](https://github.com/chabroA)! - Restore full network logs under env var and with experimental setting

## 0.2.0

### Minor Changes

- [#3315](https://github.com/LedgerHQ/ledger-live/pull/3315) [`a1c1ea56aa`](https://github.com/LedgerHQ/ledger-live/commit/a1c1ea56aa2a9e106b831107d8fae24ea0f27d4d) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add env & exerimental feature for the base fee multiplier used to compose the maxFeePerGas of an EIP1559 transaction

- [#2809](https://github.com/LedgerHQ/ledger-live/pull/2809) [`51c01541df`](https://github.com/LedgerHQ/ledger-live/commit/51c01541df8a414851ea4ef493dc9045272ef949) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add Quicksilver, Persistence, Onomy, Axelar to Cosmos family

### Patch Changes

- [#3097](https://github.com/LedgerHQ/ledger-live/pull/3097) [`4500a00f21`](https://github.com/LedgerHQ/ledger-live/commit/4500a00f215f73e6c9bbf1d904cb6a4c3d67e678) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Introduce a new manager API for listApps, which should bring memory and time improvements.

## 0.2.0-next.0

### Minor Changes

- [#3315](https://github.com/LedgerHQ/ledger-live/pull/3315) [`a1c1ea56aa`](https://github.com/LedgerHQ/ledger-live/commit/a1c1ea56aa2a9e106b831107d8fae24ea0f27d4d) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add env & exerimental feature for the base fee multiplier used to compose the maxFeePerGas of an EIP1559 transaction

- [#2809](https://github.com/LedgerHQ/ledger-live/pull/2809) [`51c01541df`](https://github.com/LedgerHQ/ledger-live/commit/51c01541df8a414851ea4ef493dc9045272ef949) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add Quicksilver, Persistence, Onomy, Axelar to Cosmos family

### Patch Changes

- [#3097](https://github.com/LedgerHQ/ledger-live/pull/3097) [`4500a00f21`](https://github.com/LedgerHQ/ledger-live/commit/4500a00f215f73e6c9bbf1d904cb6a4c3d67e678) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Introduce a new manager API for listApps, which should bring memory and time improvements.

## 0.1.0

### Minor Changes

- [#3079](https://github.com/LedgerHQ/ledger-live/pull/3079) [`d9732f38ed`](https://github.com/LedgerHQ/ledger-live/commit/d9732f38ed891ce090c98645de55103208015a60) Thanks [@gre](https://github.com/gre)! - Sunset Compound Lending from Ledger Live 'native' codebase

## 0.1.0-next.0

### Minor Changes

- [#3079](https://github.com/LedgerHQ/ledger-live/pull/3079) [`d9732f38ed`](https://github.com/LedgerHQ/ledger-live/commit/d9732f38ed891ce090c98645de55103208015a60) Thanks [@gre](https://github.com/gre)! - Sunset Compound Lending from Ledger Live 'native' codebase
