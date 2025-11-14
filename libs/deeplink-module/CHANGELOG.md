# @ledgerhq/wallet-api-deeplink-module

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
