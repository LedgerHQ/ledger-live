# @ledgerhq/hw-app-exchange

## 0.26.0-next.0

### Minor Changes

- [#21059](https://github.com/LedgerHQ/ledger-live/pull/21059) [`31f1f89`](https://github.com/LedgerHQ/ledger-live/commit/31f1f89cd4bec9b092e5ddf726414cd3c803c3dd) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - fix CSP unsafe-eval by switching protobuf decode to a static-module build

## 0.25.0

### Minor Changes

- [#20618](https://github.com/LedgerHQ/ledger-live/pull/20618) [`04a4ea2`](https://github.com/LedgerHQ/ledger-live/commit/04a4ea23d789d334b0938637f49c08e5616b98c1) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add missing inExtraId to fund payload and align FundPayload key with the protocol contract

## 0.25.0-next.0

### Minor Changes

- [#20618](https://github.com/LedgerHQ/ledger-live/pull/20618) [`04a4ea2`](https://github.com/LedgerHQ/ledger-live/commit/04a4ea23d789d334b0938637f49c08e5616b98c1) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add missing inExtraId to fund payload and align FundPayload key with the protocol contract

## 0.24.0

### Minor Changes

- [#19690](https://github.com/LedgerHQ/ledger-live/pull/19690) [`e6a9b97`](https://github.com/LedgerHQ/ledger-live/commit/e6a9b973d05af98987c094d591342031f273b31c) Thanks [@CremaFR](https://github.com/CremaFR)! - feat(swap): enrich the device's generic payload deserialization error with the exact Exchange app protobuf field that exceeds its limit

  When the Exchange device app rejects a swap `NewTransactionResponse` with the generic `DESERIALIZATION_FAILED` (0x6a81) status, we now decode the payload locally and, if a field is larger than the device's protobuf `max_size` (mirrored from app-exchange `protocol.options`), surface a precise `SwapPayloadFieldExceedsLimit` carrying the field name, limit and actual size (e.g. an oversized `payin_extra_id`).

  The device remains the source of truth: this check only runs **after** the device has already rejected the payload, never gates the flow, and silently falls back to the device's error if our hardcoded limits ever drift from the app. The user-facing flow and step (`PROCESS_TRANSACTION`) are unchanged; the added precision is only meant to speed up investigations.

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.7

## 0.24.0-next.0

### Minor Changes

- [#19690](https://github.com/LedgerHQ/ledger-live/pull/19690) [`e6a9b97`](https://github.com/LedgerHQ/ledger-live/commit/e6a9b973d05af98987c094d591342031f273b31c) Thanks [@CremaFR](https://github.com/CremaFR)! - feat(swap): enrich the device's generic payload deserialization error with the exact Exchange app protobuf field that exceeds its limit

  When the Exchange device app rejects a swap `NewTransactionResponse` with the generic `DESERIALIZATION_FAILED` (0x6a81) status, we now decode the payload locally and, if a field is larger than the device's protobuf `max_size` (mirrored from app-exchange `protocol.options`), surface a precise `SwapPayloadFieldExceedsLimit` carrying the field name, limit and actual size (e.g. an oversized `payin_extra_id`).

  The device remains the source of truth: this check only runs **after** the device has already rejected the payload, never gates the flow, and silently falls back to the device's error if our hardcoded limits ever drift from the app. The user-facing flow and step (`PROCESS_TRANSACTION`) are unchanged; the added precision is only meant to speed up investigations.

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.7-next.0

## 0.23.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.6

## 0.23.1-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.6-next.0

## 0.23.0

### Minor Changes

- [#18627](https://github.com/LedgerHQ/ledger-live/pull/18627) [`7fcf623`](https://github.com/LedgerHQ/ledger-live/commit/7fcf62387e642e10b23503a786e230b11d051cb6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump Device Management Kit to 1.7.1

### Patch Changes

- Updated dependencies [[`48dbd53`](https://github.com/LedgerHQ/ledger-live/commit/48dbd533a7a505cbb37989f8ce94f273f84bc7d2)]:
  - @ledgerhq/errors@6.37.0
  - @ledgerhq/hw-transport@6.35.5

## 0.23.0-next.0

### Minor Changes

- [#18627](https://github.com/LedgerHQ/ledger-live/pull/18627) [`7fcf623`](https://github.com/LedgerHQ/ledger-live/commit/7fcf62387e642e10b23503a786e230b11d051cb6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump Device Management Kit to 1.7.1

### Patch Changes

- Updated dependencies [[`48dbd53`](https://github.com/LedgerHQ/ledger-live/commit/48dbd533a7a505cbb37989f8ce94f273f84bc7d2)]:
  - @ledgerhq/errors@6.37.0-next.0
  - @ledgerhq/hw-transport@6.35.5-next.0

## 0.22.4

### Patch Changes

- Updated dependencies [[`8c0f5f2`](https://github.com/LedgerHQ/ledger-live/commit/8c0f5f22e66aa6a34a3363a256d3da2d98d07dc9)]:
  - @ledgerhq/errors@6.36.0
  - @ledgerhq/hw-transport@6.35.4

## 0.22.4-next.0

### Patch Changes

- Updated dependencies [[`8c0f5f2`](https://github.com/LedgerHQ/ledger-live/commit/8c0f5f22e66aa6a34a3363a256d3da2d98d07dc9)]:
  - @ledgerhq/errors@6.36.0-next.0
  - @ledgerhq/hw-transport@6.35.4-next.0

## 0.22.3

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.3

## 0.22.3-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.3-next.0

## 0.22.2

### Patch Changes

- Updated dependencies [[`d308b1a`](https://github.com/LedgerHQ/ledger-live/commit/d308b1a6b9c629839f051cf367a527f4232120c7)]:
  - @ledgerhq/errors@6.35.0
  - @ledgerhq/hw-transport@6.35.2

## 0.22.2-next.0

### Patch Changes

- Updated dependencies [[`d308b1a`](https://github.com/LedgerHQ/ledger-live/commit/d308b1a6b9c629839f051cf367a527f4232120c7)]:
  - @ledgerhq/errors@6.35.0-next.0
  - @ledgerhq/hw-transport@6.35.2-next.0

## 0.22.2

### Patch Changes

- Updated dependencies [[`202cc42`](https://github.com/LedgerHQ/ledger-live/commit/202cc423b09662b5b25012b84124aecd4dc7245d)]:
  - @ledgerhq/errors@6.34.1
  - @ledgerhq/hw-transport@6.35.2

## 0.22.2-hotfix.0

### Patch Changes

- Updated dependencies [[`202cc42`](https://github.com/LedgerHQ/ledger-live/commit/202cc423b09662b5b25012b84124aecd4dc7245d)]:
  - @ledgerhq/errors@6.34.1-hotfix.0
  - @ledgerhq/hw-transport@6.35.2-hotfix.0

## 0.22.1

### Patch Changes

- Updated dependencies [[`4cf9b8c`](https://github.com/LedgerHQ/ledger-live/commit/4cf9b8cde388aebfe04a894e9a35584856d1713d)]:
  - @ledgerhq/errors@6.34.0
  - @ledgerhq/hw-transport@6.35.1

## 0.22.1-next.0

### Patch Changes

- Updated dependencies [[`4cf9b8c`](https://github.com/LedgerHQ/ledger-live/commit/4cf9b8cde388aebfe04a894e9a35584856d1713d)]:
  - @ledgerhq/errors@6.34.0-next.0
  - @ledgerhq/hw-transport@6.35.1-next.0

## 0.22.0

### Minor Changes

- [#15754](https://github.com/LedgerHQ/ledger-live/pull/15754) [`6f5c0b2`](https://github.com/LedgerHQ/ledger-live/commit/6f5c0b21bfc2106a4dd051a9b7be7fc4732c00a3) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(exchange): add more error status

- [#15796](https://github.com/LedgerHQ/ledger-live/pull/15796) [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - Replace ESLint/Prettier with oxlint and document oxfmt for LedgerJS packages under libs/ledgerjs/packages.

### Patch Changes

- Updated dependencies [[`53df748`](https://github.com/LedgerHQ/ledger-live/commit/53df74819753f084ed3df4a2ab9082d398b54920), [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8)]:
  - @ledgerhq/errors@6.33.0
  - @ledgerhq/hw-transport@6.35.0

## 0.22.0-next.0

### Minor Changes

- [#15754](https://github.com/LedgerHQ/ledger-live/pull/15754) [`6f5c0b2`](https://github.com/LedgerHQ/ledger-live/commit/6f5c0b21bfc2106a4dd051a9b7be7fc4732c00a3) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(exchange): add more error status

- [#15796](https://github.com/LedgerHQ/ledger-live/pull/15796) [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - Replace ESLint/Prettier with oxlint and document oxfmt for LedgerJS packages under libs/ledgerjs/packages.

### Patch Changes

- Updated dependencies [[`53df748`](https://github.com/LedgerHQ/ledger-live/commit/53df74819753f084ed3df4a2ab9082d398b54920), [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8)]:
  - @ledgerhq/errors@6.33.0-next.0
  - @ledgerhq/hw-transport@6.35.0-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
