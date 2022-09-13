# @ledgerhq/react-native-hw-transport-ble

## 6.27.5

### Patch Changes

- [#1117](https://github.com/LedgerHQ/ledger-live/pull/1117) [`a7976db5d`](https://github.com/LedgerHQ/ledger-live/commit/a7976db5d3836d3d41ef0a0507373cad0bd8725c) Thanks [@github-actions](https://github.com/apps/github-actions)! - Fix crash when scanning for bluetooth devices

## 6.27.5-next.0

### Patch Changes

- [#1070](https://github.com/LedgerHQ/ledger-live/pull/1070) [`533e658dcd`](https://github.com/LedgerHQ/ledger-live/commit/533e658dcd7862d4e6c9cb1b55c400652c68ae26) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix crash when scanning for bluetooth devices

## 6.27.3

### Patch Changes

- [`3cc45438a8`](https://github.com/LedgerHQ/ledger-live/commit/3cc45438a8aced1922742ff077946d1216f63525) Thanks [@elbywan](https://github.com/elbywan)! - Use commonjs imports for @ledgerhq/devices. Fixes #777.

## 6.27.4

### Patch Changes

- [#970](https://github.com/LedgerHQ/ledger-live/pull/970) [`ecfdd1ebd8`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311) Thanks [@alexandremgo](https://github.com/alexandremgo)! - BLE scanning and pairing hooks

- Updated dependencies [[`ecfdd1ebd8`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311)]:
  - @ledgerhq/hw-transport@6.27.3

## 6.27.4-next.0

### Patch Changes

- [#970](https://github.com/LedgerHQ/ledger-live/pull/970) [`ecfdd1ebd`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311) Thanks [@alexandremgo](https://github.com/alexandremgo)! - BLE scanning and pairing hooks

- Updated dependencies [[`ecfdd1ebd`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311)]:
  - @ledgerhq/hw-transport@6.27.3-next.0

## 6.27.3

### Patch Changes

- [`3cc45438a8`](https://github.com/LedgerHQ/ledger-live/commit/3cc45438a8aced1922742ff077946d1216f63525) Thanks [@elbywan](https://github.com/elbywan)! - Use commonjs imports for @ledgerhq/devices. Fixes #777.

## 6.27.3-next.0

### Patch Changes

- [`3cc45438a`](https://github.com/LedgerHQ/ledger-live/commit/3cc45438a8aced1922742ff077946d1216f63525) Thanks [@elbywan](https://github.com/elbywan)! - Use commonjs imports for @ledgerhq/devices. Fixes #777.

## 6.27.2

### Patch Changes

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

- Updated dependencies [[`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f), [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/errors@6.10.1
  - @ledgerhq/devices@7.0.0
  - @ledgerhq/hw-transport@6.27.2

## 6.27.2-next.0

### Patch Changes

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

- Updated dependencies [[`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f), [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/errors@6.10.1-next.0
  - @ledgerhq/devices@7.0.0-next.0
  - @ledgerhq/hw-transport@6.27.2-next.0
