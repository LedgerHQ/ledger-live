# @ledgerhq/hw-app-exchange

## 0.30.0

### Minor Changes

- [#23108](https://github.com/LedgerHQ/ledger-live/pull/23108) [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@noble/curves` to 2.4.0 (ESM-only), use the `.js` subpaths and pass `prehash: false` where a digest is signed or verified. CommonJS consumers of `@ledgerhq/hw-app-btc` and `@ledgerhq/wallet-btc` now need Node >= 20.19 (synchronous `require(esm)`) or an ESM-capable bundler.

## 0.30.0-next.0

### Minor Changes

- [#23108](https://github.com/LedgerHQ/ledger-live/pull/23108) [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@noble/curves` to 2.4.0 (ESM-only), use the `.js` subpaths and pass `prehash: false` where a digest is signed or verified. CommonJS consumers of `@ledgerhq/hw-app-btc` and `@ledgerhq/wallet-btc` now need Node >= 20.19 (synchronous `require(esm)`) or an ESM-capable bundler.

## 0.29.0

### Minor Changes

- [#23021](https://github.com/LedgerHQ/ledger-live/pull/23021) [`3dacfc2`](https://github.com/LedgerHQ/ledger-live/commit/3dacfc29377ad8a8ac25ad51f2207c882491bb7e) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Bump `@ledgerhq/device-management-kit` to 1.11.0 and `@ledgerhq/dmk-ledger-wallet` to 0.7.0.

- [#23225](https://github.com/LedgerHQ/ledger-live/pull/23225) [`1731458`](https://github.com/LedgerHQ/ledger-live/commit/17314582789efaad9ba35a5cf5e434a3140d6132) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `protobufjs` to 8.4.1 and `protobufjs-cli` to 2.4.1 (security), regenerate hw-app-exchange protobuf bindings. Absent protobuf string fields now decode as `undefined` instead of `""`.

## 0.29.0-next.0

### Minor Changes

- [#23021](https://github.com/LedgerHQ/ledger-live/pull/23021) [`3dacfc2`](https://github.com/LedgerHQ/ledger-live/commit/3dacfc29377ad8a8ac25ad51f2207c882491bb7e) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Bump `@ledgerhq/device-management-kit` to 1.11.0 and `@ledgerhq/dmk-ledger-wallet` to 0.7.0.

- [#23225](https://github.com/LedgerHQ/ledger-live/pull/23225) [`1731458`](https://github.com/LedgerHQ/ledger-live/commit/17314582789efaad9ba35a5cf5e434a3140d6132) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `protobufjs` to 8.4.1 and `protobufjs-cli` to 2.4.1 (security), regenerate hw-app-exchange protobuf bindings. Absent protobuf string fields now decode as `undefined` instead of `""`.

## 0.28.0

### Minor Changes

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

## 0.28.0-next.0

### Minor Changes

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

## 0.27.0

### Minor Changes

- [#21544](https://github.com/LedgerHQ/ledger-live/pull/21544) [`34767ef`](https://github.com/LedgerHQ/ledger-live/commit/34767ef352530bb832c95e10c63b8688648d6a5f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Format the generated protobuf files in `prebuild`. `pbjs`/`pbts` emit their own style while the committed `generate-protocol.js`/`.d.ts` are oxfmt-formatted, so regenerating them always dirtied the tree and failed the CLI job's `git diff` check. Only visible on an nx cache miss, which is why it went unnoticed.

## 0.27.0-next.0

### Minor Changes

- [#21544](https://github.com/LedgerHQ/ledger-live/pull/21544) [`34767ef`](https://github.com/LedgerHQ/ledger-live/commit/34767ef352530bb832c95e10c63b8688648d6a5f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Format the generated protobuf files in `prebuild`. `pbjs`/`pbts` emit their own style while the committed `generate-protocol.js`/`.d.ts` are oxfmt-formatted, so regenerating them always dirtied the tree and failed the CLI job's `git diff` check. Only visible on an nx cache miss, which is why it went unnoticed.

## 0.26.0

### Minor Changes

- [#21059](https://github.com/LedgerHQ/ledger-live/pull/21059) [`31f1f89`](https://github.com/LedgerHQ/ledger-live/commit/31f1f89cd4bec9b092e5ddf726414cd3c803c3dd) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - fix CSP unsafe-eval by switching protobuf decode to a static-module build

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

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
