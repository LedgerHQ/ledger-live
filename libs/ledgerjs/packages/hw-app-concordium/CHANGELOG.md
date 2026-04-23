# @ledgerhq/hw-app-concordium

## 0.7.1

### Patch Changes

- Updated dependencies [[`c910c1b`](https://github.com/LedgerHQ/ledger-live/commit/c910c1bd9b4f7fbcc0e33fe19b33da44085ab7f9)]:
  - @ledgerhq/concordium-core@0.4.0
  - @ledgerhq/hw-transport@6.35.1

## 0.7.1-next.0

### Patch Changes

- Updated dependencies [[`c910c1b`](https://github.com/LedgerHQ/ledger-live/commit/c910c1bd9b4f7fbcc0e33fe19b33da44085ab7f9)]:
  - @ledgerhq/concordium-core@0.4.0-next.0
  - @ledgerhq/hw-transport@6.35.1-next.0

## 0.7.0

### Minor Changes

- [#15796](https://github.com/LedgerHQ/ledger-live/pull/15796) [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - Replace ESLint/Prettier with oxlint and document oxfmt for LedgerJS packages under libs/ledgerjs/packages.

### Patch Changes

- Updated dependencies [[`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8)]:
  - @ledgerhq/hw-transport@6.35.0

## 0.7.0-next.0

### Minor Changes

- [#15796](https://github.com/LedgerHQ/ledger-live/pull/15796) [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - Replace ESLint/Prettier with oxlint and document oxfmt for LedgerJS packages under libs/ledgerjs/packages.

### Patch Changes

- Updated dependencies [[`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8)]:
  - @ledgerhq/hw-transport@6.35.0-next.0

## 0.6.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.34.1

## 0.6.1-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.34.1-next.0

## 0.6.0

### Minor Changes

- [#15304](https://github.com/LedgerHQ/ledger-live/pull/15304) [`c8d7be6`](https://github.com/LedgerHQ/ledger-live/commit/c8d7be6964aa9d8defd77de0b77ba7d42f472025) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump Node.js runtime to 24. Proto/toolchain and pnpm catalog use Node 24 and @types/node 24; engines and .nvmrc updated. TSConfig lib set to ES2022 where needed; Jest configs updated for ESM (imports, \_\_dirname, createRequire). CI: Linux build deps in setup-caches/setup-build-desktop; optional native deps (cpu-features, node-hid, usb, unrs-resolver) removed from onlyBuiltDependencies so install succeeds.

### Patch Changes

- Updated dependencies [[`c8d7be6`](https://github.com/LedgerHQ/ledger-live/commit/c8d7be6964aa9d8defd77de0b77ba7d42f472025)]:
  - @ledgerhq/hw-transport@6.34.0

## 0.6.0-next.0

### Minor Changes

- [#15304](https://github.com/LedgerHQ/ledger-live/pull/15304) [`c8d7be6`](https://github.com/LedgerHQ/ledger-live/commit/c8d7be6964aa9d8defd77de0b77ba7d42f472025) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump Node.js runtime to 24. Proto/toolchain and pnpm catalog use Node 24 and @types/node 24; engines and .nvmrc updated. TSConfig lib set to ES2022 where needed; Jest configs updated for ESM (imports, \_\_dirname, createRequire). CI: Linux build deps in setup-caches/setup-build-desktop; optional native deps (cpu-features, node-hid, usb, unrs-resolver) removed from onlyBuiltDependencies so install succeeds.

### Patch Changes

- Updated dependencies [[`c8d7be6`](https://github.com/LedgerHQ/ledger-live/commit/c8d7be6964aa9d8defd77de0b77ba7d42f472025)]:
  - @ledgerhq/hw-transport@6.34.0-next.0

## 0.5.0

### Minor Changes

- [#14913](https://github.com/LedgerHQ/ledger-live/pull/14913) [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update TypeScript to latest 5.8.x

### Patch Changes

- Updated dependencies [[`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f)]:
  - @ledgerhq/hw-transport@6.33.0
  - @ledgerhq/concordium-core@0.3.0

## 0.5.0-next.0

### Minor Changes

- [#14913](https://github.com/LedgerHQ/ledger-live/pull/14913) [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update TypeScript to latest 5.8.x

### Patch Changes

- Updated dependencies [[`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f)]:
  - @ledgerhq/hw-transport@6.33.0-next.0
  - @ledgerhq/concordium-core@0.3.0-next.0

## 0.4.0

### Minor Changes

- [#14258](https://github.com/LedgerHQ/ledger-live/pull/14258) [`5f1c644`](https://github.com/LedgerHQ/ledger-live/commit/5f1c644fd5f757f48618b62e976faac274ced40d) Thanks [@lysyi3m](https://github.com/lysyi3m)! - added concordium proxy & grpc client and core functionality implementation; extracted shared concordium-core package with types, serialization, CBOR and address utilities; simplified hw-app-concordium API to single signTransaction method with type-based routing

### Patch Changes

- Updated dependencies [[`5f1c644`](https://github.com/LedgerHQ/ledger-live/commit/5f1c644fd5f757f48618b62e976faac274ced40d)]:
  - @ledgerhq/concordium-core@0.2.0

## 0.4.0-next.0

### Minor Changes

- [#14258](https://github.com/LedgerHQ/ledger-live/pull/14258) [`5f1c644`](https://github.com/LedgerHQ/ledger-live/commit/5f1c644fd5f757f48618b62e976faac274ced40d) Thanks [@lysyi3m](https://github.com/lysyi3m)! - added concordium proxy & grpc client and core functionality implementation; extracted shared concordium-core package with types, serialization, CBOR and address utilities; simplified hw-app-concordium API to single signTransaction method with type-based routing

### Patch Changes

- Updated dependencies [[`5f1c644`](https://github.com/LedgerHQ/ledger-live/commit/5f1c644fd5f757f48618b62e976faac274ced40d)]:
  - @ledgerhq/concordium-core@0.2.0-next.0

## 0.3.0

### Minor Changes

- [#14226](https://github.com/LedgerHQ/ledger-live/pull/14226) [`22a7682`](https://github.com/LedgerHQ/ledger-live/commit/22a7682dba09db84f80fbb08918b8da6804bfbf1) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Added transaction payload serializers reimplementation from Rust SDK

## 0.3.0-next.0

### Minor Changes

- [#14226](https://github.com/LedgerHQ/ledger-live/pull/14226) [`22a7682`](https://github.com/LedgerHQ/ledger-live/commit/22a7682dba09db84f80fbb08918b8da6804bfbf1) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Added transaction payload serializers reimplementation from Rust SDK
