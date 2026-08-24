# @ledgerhq/devices

## 8.17.0

### Minor Changes

- [#18906](https://github.com/LedgerHQ/ledger-live/pull/18906) [`df96477`](https://github.com/LedgerHQ/ledger-live/commit/df964774bdaccd897e5e7414c172e9c26ff21f67) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add `getProductName` to `@ledgerhq/devices` returning the plain, canonical device product name (e.g. "Ledger Flex"), and deprecate the app-level `getProductName` utils that strip the "Ledger" prefix.

## 8.17.0-next.0

### Minor Changes

- [#18906](https://github.com/LedgerHQ/ledger-live/pull/18906) [`df96477`](https://github.com/LedgerHQ/ledger-live/commit/df964774bdaccd897e5e7414c172e9c26ff21f67) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add `getProductName` to `@ledgerhq/devices` returning the plain, canonical device product name (e.g. "Ledger Flex"), and deprecate the app-level `getProductName` utils that strip the "Ledger" prefix.

## 8.16.0

### Minor Changes

- [#18775](https://github.com/LedgerHQ/ledger-live/pull/18775) [`ebda9d8`](https://github.com/LedgerHQ/ledger-live/commit/ebda9d88805501f4c2c03fef0fe24f116a8a2a6c) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Reduce the scope of `@ledgerhq/devices` to the devices list only. The transport framing helpers (`hid-framing`, `ble/sendAPDU`, `ble/receiveAPDU`) are inlined into the transports that use them and the corresponding subpath exports are removed.

## 8.16.0-next.0

### Minor Changes

- [#18775](https://github.com/LedgerHQ/ledger-live/pull/18775) [`ebda9d8`](https://github.com/LedgerHQ/ledger-live/commit/ebda9d88805501f4c2c03fef0fe24f116a8a2a6c) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Reduce the scope of `@ledgerhq/devices` to the devices list only. The transport framing helpers (`hid-framing`, `ble/sendAPDU`, `ble/receiveAPDU`) are inlined into the transports that use them and the corresponding subpath exports are removed.

## 8.15.1

### Patch Changes

- Updated dependencies [[`8c0f5f2`](https://github.com/LedgerHQ/ledger-live/commit/8c0f5f22e66aa6a34a3363a256d3da2d98d07dc9)]:
  - @ledgerhq/errors@6.36.0

## 8.15.1-next.0

### Patch Changes

- Updated dependencies [[`8c0f5f2`](https://github.com/LedgerHQ/ledger-live/commit/8c0f5f22e66aa6a34a3363a256d3da2d98d07dc9)]:
  - @ledgerhq/errors@6.36.0-next.0

## 8.15.0

### Minor Changes

- [#17738](https://github.com/LedgerHQ/ledger-live/pull/17738) [`73afced`](https://github.com/LedgerHQ/ledger-live/commit/73afced223c37efeb24943ffb9cc1ee788b72a6f) Thanks [@paoun-ledger](https://github.com/paoun-ledger)! - correct app memory prediction

## 8.15.0-next.0

### Minor Changes

- [#17738](https://github.com/LedgerHQ/ledger-live/pull/17738) [`73afced`](https://github.com/LedgerHQ/ledger-live/commit/73afced223c37efeb24943ffb9cc1ee788b72a6f) Thanks [@paoun-ledger](https://github.com/paoun-ledger)! - correct app memory prediction

## 8.14.2

### Patch Changes

- Updated dependencies [[`d308b1a`](https://github.com/LedgerHQ/ledger-live/commit/d308b1a6b9c629839f051cf367a527f4232120c7)]:
  - @ledgerhq/errors@6.35.0

## 8.14.2-next.0

### Patch Changes

- Updated dependencies [[`d308b1a`](https://github.com/LedgerHQ/ledger-live/commit/d308b1a6b9c629839f051cf367a527f4232120c7)]:
  - @ledgerhq/errors@6.35.0-next.0

## 8.14.2

### Patch Changes

- Updated dependencies [[`202cc42`](https://github.com/LedgerHQ/ledger-live/commit/202cc423b09662b5b25012b84124aecd4dc7245d)]:
  - @ledgerhq/errors@6.34.1

## 8.14.2-hotfix.0

### Patch Changes

- Updated dependencies [[`202cc42`](https://github.com/LedgerHQ/ledger-live/commit/202cc423b09662b5b25012b84124aecd4dc7245d)]:
  - @ledgerhq/errors@6.34.1-hotfix.0

## 8.14.1

### Patch Changes

- Updated dependencies [[`4cf9b8c`](https://github.com/LedgerHQ/ledger-live/commit/4cf9b8cde388aebfe04a894e9a35584856d1713d)]:
  - @ledgerhq/errors@6.34.0

## 8.14.1-next.0

### Patch Changes

- Updated dependencies [[`4cf9b8c`](https://github.com/LedgerHQ/ledger-live/commit/4cf9b8cde388aebfe04a894e9a35584856d1713d)]:
  - @ledgerhq/errors@6.34.0-next.0

## 8.14.0

### Minor Changes

- [#15796](https://github.com/LedgerHQ/ledger-live/pull/15796) [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - Replace ESLint/Prettier with oxlint and document oxfmt for LedgerJS packages under libs/ledgerjs/packages.

### Patch Changes

- Updated dependencies [[`53df748`](https://github.com/LedgerHQ/ledger-live/commit/53df74819753f084ed3df4a2ab9082d398b54920), [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8)]:
  - @ledgerhq/errors@6.33.0
  - @ledgerhq/logs@6.17.0

## 8.14.0-next.0

### Minor Changes

- [#15796](https://github.com/LedgerHQ/ledger-live/pull/15796) [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - Replace ESLint/Prettier with oxlint and document oxfmt for LedgerJS packages under libs/ledgerjs/packages.

### Patch Changes

- Updated dependencies [[`53df748`](https://github.com/LedgerHQ/ledger-live/commit/53df74819753f084ed3df4a2ab9082d398b54920), [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8)]:
  - @ledgerhq/errors@6.33.0-next.0
  - @ledgerhq/logs@6.17.0-next.0

## 8.13.0

### Minor Changes

- [#14974](https://github.com/LedgerHQ/ledger-live/pull/14974) [`982d4af`](https://github.com/LedgerHQ/ledger-live/commit/982d4afbeb7faf3814c3e96ffb6e3e88b58dfe73) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update HID framing block types to use Uint8Array for cross-environment transport compatibility.

### Patch Changes

- Updated dependencies [[`6dac7f9`](https://github.com/LedgerHQ/ledger-live/commit/6dac7f974c28dcae409c110a60061996490c5088), [`8ce1cb7`](https://github.com/LedgerHQ/ledger-live/commit/8ce1cb755b3e68c8688f9e828596d3c2605ef3cb)]:
  - @ledgerhq/errors@6.32.0

## 8.13.0-next.0

### Minor Changes

- [#14974](https://github.com/LedgerHQ/ledger-live/pull/14974) [`982d4af`](https://github.com/LedgerHQ/ledger-live/commit/982d4afbeb7faf3814c3e96ffb6e3e88b58dfe73) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update HID framing block types to use Uint8Array for cross-environment transport compatibility.

### Patch Changes

- Updated dependencies [[`6dac7f9`](https://github.com/LedgerHQ/ledger-live/commit/6dac7f974c28dcae409c110a60061996490c5088), [`8ce1cb7`](https://github.com/LedgerHQ/ledger-live/commit/8ce1cb755b3e68c8688f9e828596d3c2605ef3cb)]:
  - @ledgerhq/errors@6.32.0-next.0

## 8.12.0

### Minor Changes

- [#15304](https://github.com/LedgerHQ/ledger-live/pull/15304) [`c8d7be6`](https://github.com/LedgerHQ/ledger-live/commit/c8d7be6964aa9d8defd77de0b77ba7d42f472025) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump Node.js runtime to 24. Proto/toolchain and pnpm catalog use Node 24 and @types/node 24; engines and .nvmrc updated. TSConfig lib set to ES2022 where needed; Jest configs updated for ESM (imports, \_\_dirname, createRequire). CI: Linux build deps in setup-caches/setup-build-desktop; optional native deps (cpu-features, node-hid, usb, unrs-resolver) removed from onlyBuiltDependencies so install succeeds.

### Patch Changes

- Updated dependencies [[`c8d7be6`](https://github.com/LedgerHQ/ledger-live/commit/c8d7be6964aa9d8defd77de0b77ba7d42f472025)]:
  - @ledgerhq/errors@6.31.0
  - @ledgerhq/logs@6.16.0

## 8.12.0-next.0

### Minor Changes

- [#15304](https://github.com/LedgerHQ/ledger-live/pull/15304) [`c8d7be6`](https://github.com/LedgerHQ/ledger-live/commit/c8d7be6964aa9d8defd77de0b77ba7d42f472025) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump Node.js runtime to 24. Proto/toolchain and pnpm catalog use Node 24 and @types/node 24; engines and .nvmrc updated. TSConfig lib set to ES2022 where needed; Jest configs updated for ESM (imports, \_\_dirname, createRequire). CI: Linux build deps in setup-caches/setup-build-desktop; optional native deps (cpu-features, node-hid, usb, unrs-resolver) removed from onlyBuiltDependencies so install succeeds.

### Patch Changes

- Updated dependencies [[`c8d7be6`](https://github.com/LedgerHQ/ledger-live/commit/c8d7be6964aa9d8defd77de0b77ba7d42f472025)]:
  - @ledgerhq/errors@6.31.0-next.0
  - @ledgerhq/logs@6.16.0-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
