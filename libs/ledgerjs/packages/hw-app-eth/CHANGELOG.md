# @ledgerhq/hw-app-eth

## 6.29.2

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

- Updated dependencies [[`e142b9484`](https://github.com/LedgerHQ/ledger-live/commit/e142b9484e6371539fb392c002e1ebaf7802542b), [`816f2b7e9`](https://github.com/LedgerHQ/ledger-live/commit/816f2b7e942967bf0ed670dc43464521bd0b5d01), [`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f), [`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0)]:
  - @ledgerhq/cryptoassets@6.30.0
  - @ledgerhq/errors@6.10.1
  - @ledgerhq/hw-transport@6.27.2
  - @ledgerhq/hw-transport-mocker@6.27.2

## 6.29.2-next.2

### Patch Changes

- Updated dependencies [[`816f2b7e9`](https://github.com/LedgerHQ/ledger-live/commit/816f2b7e942967bf0ed670dc43464521bd0b5d01)]:
  - @ledgerhq/cryptoassets@6.30.0-next.2

## 6.29.2-next.1

### Patch Changes

- Updated dependencies [[`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0)]:
  - @ledgerhq/cryptoassets@6.30.0-next.1

## 6.29.2-next.0

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

- Updated dependencies [[`e142b9484`](https://github.com/LedgerHQ/ledger-live/commit/e142b9484e6371539fb392c002e1ebaf7802542b), [`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f)]:
  - @ledgerhq/cryptoassets@6.30.0-next.0
  - @ledgerhq/errors@6.10.1-next.0
  - @ledgerhq/hw-transport@6.27.2-next.0
  - @ledgerhq/hw-transport-mocker@6.27.2-next.0

## 6.29.1

### Patch Changes

- Updated dependencies [[`6e956f22b`](https://github.com/LedgerHQ/ledger-live/commit/6e956f22bdf96f7a902b48a8cd231a34053d459b)]:
  - @ledgerhq/cryptoassets@6.29.0

## 6.29.1-next.0

### Patch Changes

- Updated dependencies [6e956f22b]
  - @ledgerhq/cryptoassets@6.29.0-next.0

## 6.29.0

### Minor Changes

- c4be045f9: Add support for EIP712

## 6.29.0-next.0

### Minor Changes

- c4be045f9: Add support for EIP712
