# @ledgerhq/react-ui

## 0.9.1

### Patch Changes

- [#1293](https://github.com/LedgerHQ/ledger-live/pull/1293) [`b0a7e35a0f`](https://github.com/LedgerHQ/ledger-live/commit/b0a7e35a0f7a85732d1f7bef6ae3144fdf0b8b24) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Improvements for the crypto icons library

## 0.9.1-next.0

### Patch Changes

- [#1293](https://github.com/LedgerHQ/ledger-live/pull/1293) [`b0a7e35a0f`](https://github.com/LedgerHQ/ledger-live/commit/b0a7e35a0f7a85732d1f7bef6ae3144fdf0b8b24) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Improvements for the crypto icons library

## 0.9.0

### Minor Changes

- [#935](https://github.com/LedgerHQ/ledger-live/pull/935) [`432cfa8994`](https://github.com/LedgerHQ/ledger-live/commit/432cfa8994e21c2e67d72bd0e6e94a64d7cc2dfb) Thanks [@LFBarreto](https://github.com/LFBarreto)! - UI - Crypto icons added as a standalone package + added helper components to integrate them and ensure color contrast

### Patch Changes

- Updated dependencies [[`432cfa8994`](https://github.com/LedgerHQ/ledger-live/commit/432cfa8994e21c2e67d72bd0e6e94a64d7cc2dfb)]:
  - @ledgerhq/crypto-icons-ui@0.2.0

## 0.9.0-next.0

### Minor Changes

- [#935](https://github.com/LedgerHQ/ledger-live/pull/935) [`432cfa899`](https://github.com/LedgerHQ/ledger-live/commit/432cfa8994e21c2e67d72bd0e6e94a64d7cc2dfb) Thanks [@LFBarreto](https://github.com/LFBarreto)! - UI - Crypto icons added as a standalone package + added helper components to integrate them and ensure color contrast

### Patch Changes

- Updated dependencies [[`432cfa899`](https://github.com/LedgerHQ/ledger-live/commit/432cfa8994e21c2e67d72bd0e6e94a64d7cc2dfb)]:
  - @ledgerhq/crypto-icons-ui@0.2.0-next.0

## 0.8.3

### Patch Changes

- [#772](https://github.com/LedgerHQ/ledger-live/pull/772) [`9f5d214c72`](https://github.com/LedgerHQ/ledger-live/commit/9f5d214c72849221ac52b40a175c10caacb6405a) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - fix button size

* [#762](https://github.com/LedgerHQ/ledger-live/pull/762) [`eb74f06064`](https://github.com/LedgerHQ/ledger-live/commit/eb74f06064404051b182e0f6b0e9f2a3e2f2dc9f) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Add optional size prop to button

## 0.8.3-next.0

### Patch Changes

- [#772](https://github.com/LedgerHQ/ledger-live/pull/772) [`9f5d214c7`](https://github.com/LedgerHQ/ledger-live/commit/9f5d214c72849221ac52b40a175c10caacb6405a) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - fix button size

* [#762](https://github.com/LedgerHQ/ledger-live/pull/762) [`eb74f0606`](https://github.com/LedgerHQ/ledger-live/commit/eb74f06064404051b182e0f6b0e9f2a3e2f2dc9f) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Add optional size prop to button

## 0.8.2

### Patch Changes

- [#680](https://github.com/LedgerHQ/ledger-live/pull/680) [`a9da2596e`](https://github.com/LedgerHQ/ledger-live/commit/a9da2596ee15bb55449c4a12acfc2dd5432857e5) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Migrate Vertical timeline component from native to UI

## 0.8.2-next.0

### Patch Changes

- [#680](https://github.com/LedgerHQ/ledger-live/pull/680) [`a9da2596e`](https://github.com/LedgerHQ/ledger-live/commit/a9da2596ee15bb55449c4a12acfc2dd5432857e5) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Migrate Vertical timeline component from native to UI

## 0.8.1

### Patch Changes

- [#667](https://github.com/LedgerHQ/ledger-live/pull/667) [`e0516e387`](https://github.com/LedgerHQ/ledger-live/commit/e0516e3877fbbef458ec4da9e06bd9d7db09d0ee) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix background color of Popin & Drawer components

* [#667](https://github.com/LedgerHQ/ledger-live/pull/667) [`3be077f54`](https://github.com/LedgerHQ/ledger-live/commit/3be077f547cce51d8640a13fd37583d7782ab8a2) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix overlay color of Popin component

- [#364](https://github.com/LedgerHQ/ledger-live/pull/364) [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8) Thanks [@elbywan](https://github.com/elbywan)! - #### Replace [webpack](https://webpack.js.org/) with [vite.js](https://vitejs.dev/) to speed up the ledger live desktop development process.

  To fully embrace the "bundleless" vite.js approach, it is necessary to transpile our packages contained in the monorepository to the ESM format, and [subpath exports](https://nodejs.org/api/packages.html#subpath-exports) have been added to silently map to commonjs or esm depending on the need.

  #### 🔥 BREAKING CHANGES for `@ledgerhq/live-common`, `@ledgerhq/devices` and `@ledgerhq/hw-app-btc` consumers.

  As highlighted [here](https://github.com/nodejs/node#39994), it is not possible to target folders directly when using subpath exports.

  The workaround is to suffix the call with `/index` (or `/`).

  For instance…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies";
  ```

  …must be rewritten to…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/index;";
  ```

  …or:

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/;";
  ```

- Updated dependencies [[`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/icons-ui@0.2.7

## 0.8.1-next.0

### Patch Changes

- [#667](https://github.com/LedgerHQ/ledger-live/pull/667) [`e0516e387`](https://github.com/LedgerHQ/ledger-live/commit/e0516e3877fbbef458ec4da9e06bd9d7db09d0ee) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix background color of Popin & Drawer components

* [#667](https://github.com/LedgerHQ/ledger-live/pull/667) [`3be077f54`](https://github.com/LedgerHQ/ledger-live/commit/3be077f547cce51d8640a13fd37583d7782ab8a2) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix overlay color of Popin component

- [#364](https://github.com/LedgerHQ/ledger-live/pull/364) [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8) Thanks [@elbywan](https://github.com/elbywan)! - #### Replace [webpack](https://webpack.js.org/) with [vite.js](https://vitejs.dev/) to speed up the ledger live desktop development process.

  To fully embrace the "bundleless" vite.js approach, it is necessary to transpile our packages contained in the monorepository to the ESM format, and [subpath exports](https://nodejs.org/api/packages.html#subpath-exports) have been added to silently map to commonjs or esm depending on the need.

  #### 🔥 BREAKING CHANGES for `@ledgerhq/live-common`, `@ledgerhq/devices` and `@ledgerhq/hw-app-btc` consumers.

  As highlighted [here](https://github.com/nodejs/node#39994), it is not possible to target folders directly when using subpath exports.

  The workaround is to suffix the call with `/index` (or `/`).

  For instance…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies";
  ```

  …must be rewritten to…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/index;";
  ```

  …or:

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/;";
  ```

- Updated dependencies [[`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/icons-ui@0.2.7-next.0

## 0.8.0

### Minor Changes

- [#405](https://github.com/LedgerHQ/ledger-live/pull/405) [`e393b9bfa`](https://github.com/LedgerHQ/ledger-live/commit/e393b9bfaea9f9f41b1845d6ae9a1048588b7ecf) Thanks [@pdeville-ledger](https://github.com/pdeville-ledger)! - fix checkbox on ui:react

* [#403](https://github.com/LedgerHQ/ledger-live/pull/403) [`9c3e27f46`](https://github.com/LedgerHQ/ledger-live/commit/9c3e27f4661a41c654056941db5adae0d9d94f97) Thanks [@pdeville-ledger](https://github.com/pdeville-ledger)! - add breakpoints to desktop ui

### Patch Changes

- [#452](https://github.com/LedgerHQ/ledger-live/pull/452) [`ef01a3cc2`](https://github.com/LedgerHQ/ledger-live/commit/ef01a3cc25785835dd334360fda3399636b2a34b) Thanks [@Justkant](https://github.com/Justkant)! - fix(Tip): missing colon in StyledIconContainer

- Updated dependencies [[`429df1cff`](https://github.com/LedgerHQ/ledger-live/commit/429df1cff3cf204ff57200553a808d25c8ff413f)]:
  - @ledgerhq/icons-ui@0.2.6

## 0.8.0-next.0

### Minor Changes

- e393b9bfa: fix checkbox on ui:react
- 9c3e27f46: add breakpoints to desktop ui

### Patch Changes

- ef01a3cc2: fix(Tip): missing colon in StyledIconContainer
- Updated dependencies [429df1cff]
  - @ledgerhq/icons-ui@0.2.6-next.0

## 0.7.8

### Patch Changes

- 0c2c6682b: ui packages - release
- Updated dependencies [0c2c6682b]
  - @ledgerhq/ui-shared@0.1.9
  - @ledgerhq/icons-ui@0.2.5

## 0.7.8-next.0

### Patch Changes

- 0c2c6682b: ui packages - release
- Updated dependencies [0c2c6682b]
  - @ledgerhq/ui-shared@0.1.9-next.0
  - @ledgerhq/icons-ui@0.2.5-next.0

## 0.7.7

### Patch Changes

- f686ec781: UI - shared colors - added new colors to shared themes
- Updated dependencies [f686ec781]
  - @ledgerhq/ui-shared@0.1.8

## 0.7.7-next.0

### Patch Changes

- f686ec781: UI - shared colors - added new colors to shared themes
- Updated dependencies [f686ec781]
  - @ledgerhq/ui-shared@0.1.8-next.0
