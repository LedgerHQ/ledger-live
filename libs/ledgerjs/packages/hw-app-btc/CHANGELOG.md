# @ledgerhq/hw-app-btc

## 9.0.0

### Patch Changes

- Updated dependencies [[`d3c91a53e0`](https://github.com/LedgerHQ/ledger-live/commit/d3c91a53e06f9f47817e96c452f69e2d9f71d80f)]:
  - @ledgerhq/hw-transport@6.27.7

## 9.0.0-next.0

### Major Changes

- [#1493](https://github.com/LedgerHQ/ledger-live/pull/1493) [`658303322b`](https://github.com/LedgerHQ/ledger-live/commit/658303322b767f5ed3821def8384b5342ab03089) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Change hw-app-btc to remove any dependency to the legacy Bitcoin Nano app API. Update hw-app-btc API (refer to hw-app-btc/src/Btc.ts for new method signature)

### Patch Changes

- Updated dependencies [[`d3c91a53e0`](https://github.com/LedgerHQ/ledger-live/commit/d3c91a53e06f9f47817e96c452f69e2d9f71d80f)]:
  - @ledgerhq/hw-transport@6.27.7-next.0

## 8.1.1

### Patch Changes

- [#1356](https://github.com/LedgerHQ/ledger-live/pull/1356) [`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Updated readme.md of packages

- Updated dependencies [[`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa)]:
  - @ledgerhq/hw-transport@6.27.6
  - @ledgerhq/logs@6.10.1

## 8.1.1-next.0

### Patch Changes

- [#1356](https://github.com/LedgerHQ/ledger-live/pull/1356) [`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Updated readme.md of packages

- Updated dependencies [[`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa)]:
  - @ledgerhq/hw-transport@6.27.6-next.0
  - @ledgerhq/logs@6.10.1-next.0

## 8.1.0

### Minor Changes

- [#836](https://github.com/LedgerHQ/ledger-live/pull/836) [`68a0b01efc`](https://github.com/LedgerHQ/ledger-live/commit/68a0b01efcfd481cb8fe71ec22a2fc7217f25ec9) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Support zcash v5 format transaction

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.27.5

## 8.1.0-next.0

### Minor Changes

- [#836](https://github.com/LedgerHQ/ledger-live/pull/836) [`68a0b01efc`](https://github.com/LedgerHQ/ledger-live/commit/68a0b01efcfd481cb8fe71ec22a2fc7217f25ec9) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Support zcash v5 format transaction

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.27.5-next.0

## 8.0.2

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.27.4

## 8.0.2-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.27.4-next.0

## 8.0.1

### Patch Changes

- Updated dependencies [[`ecfdd1ebd8`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311)]:
  - @ledgerhq/hw-transport@6.27.3

## 8.0.1-next.0

### Patch Changes

- Updated dependencies [[`ecfdd1ebd`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311)]:
  - @ledgerhq/hw-transport@6.27.3-next.0

## 8.0.0

### Major Changes

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

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.27.2

## 8.0.0-next.0

### Major Changes

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

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.27.2-next.0

## 7.0.0

### Major Changes

- [#523](https://github.com/LedgerHQ/ledger-live/pull/523) [`89387dee6`](https://github.com/LedgerHQ/ledger-live/commit/89387dee6dfc2a63fa29665ab5524f3950d3ce0e) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix zen transaction parser. Jira ticket: https://ledgerhq.atlassian.net/browse/LIVE-1869

## 7.0.0-next.0

### Major Changes

- [#523](https://github.com/LedgerHQ/ledger-live/pull/523) [`89387dee6`](https://github.com/LedgerHQ/ledger-live/commit/89387dee6dfc2a63fa29665ab5524f3950d3ce0e) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix zen transaction parser. Jira ticket: https://ledgerhq.atlassian.net/browse/LIVE-1869
