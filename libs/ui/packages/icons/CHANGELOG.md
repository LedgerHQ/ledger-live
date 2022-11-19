# @ledgerhq/icons-ui

## 0.3.0

### Minor Changes

- [#1784](https://github.com/LedgerHQ/ledger-live/pull/1784) [`7495373f8b`](https://github.com/LedgerHQ/ledger-live/commit/7495373f8b4690ce5b7b48410f3e4e47bf2555f4) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Adding new icons in Ui Kit (Icons-UI)

### Patch Changes

- [#1748](https://github.com/LedgerHQ/ledger-live/pull/1748) [`f7a162c356`](https://github.com/LedgerHQ/ledger-live/commit/f7a162c356a0cd84b6eb635493ee56af06e306e5) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Updated payment providers icons

* [#1141](https://github.com/LedgerHQ/ledger-live/pull/1141) [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd) Thanks [@valpinkman](https://github.com/valpinkman)! - Collateral changes due to solving all LLM typescript/eslint issues/warnings.

## 0.3.0-next.0

### Minor Changes

- [#1784](https://github.com/LedgerHQ/ledger-live/pull/1784) [`7495373f8b`](https://github.com/LedgerHQ/ledger-live/commit/7495373f8b4690ce5b7b48410f3e4e47bf2555f4) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Adding new icons in Ui Kit (Icons-UI)

### Patch Changes

- [#1748](https://github.com/LedgerHQ/ledger-live/pull/1748) [`f7a162c356`](https://github.com/LedgerHQ/ledger-live/commit/f7a162c356a0cd84b6eb635493ee56af06e306e5) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Updated payment providers icons

* [#1141](https://github.com/LedgerHQ/ledger-live/pull/1141) [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd) Thanks [@valpinkman](https://github.com/valpinkman)! - Collateral changes due to solving all LLM typescript/eslint issues/warnings.

## 0.2.7

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

## 0.2.7-next.0

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

## 0.2.6

### Patch Changes

- [#463](https://github.com/LedgerHQ/ledger-live/pull/463) [`429df1cff`](https://github.com/LedgerHQ/ledger-live/commit/429df1cff3cf204ff57200553a808d25c8ff413f) Thanks [@elbywan](https://github.com/elbywan)! - Enhance subpath exports to improve node17+ and jest compatibilty.

## 0.2.6-next.0

### Patch Changes

- 429df1cff: Enhance subpath exports to improve node17+ and jest compatibilty.

## 0.2.5

### Patch Changes

- 0c2c6682b: ui packages - release

## 0.2.5-next.0

### Patch Changes

- 0c2c6682b: ui packages - release
