# @ledgerhq/devices

## 8.0.1

### Patch Changes

- Updated dependencies [[`1d0b2d19eb`](https://github.com/LedgerHQ/ledger-live/commit/1d0b2d19ebc5acd058930b842c6d37f8daf2a5a3), [`ef945b05c0`](https://github.com/LedgerHQ/ledger-live/commit/ef945b05c01a791281687abb28e639e1bcc4e472), [`5fa68510b4`](https://github.com/LedgerHQ/ledger-live/commit/5fa68510b49334cfd80c30793dfe68900f1b9b3b)]:
  - @ledgerhq/errors@6.12.4

## 8.0.1-next.0

### Patch Changes

- Updated dependencies [[`1d0b2d19eb`](https://github.com/LedgerHQ/ledger-live/commit/1d0b2d19ebc5acd058930b842c6d37f8daf2a5a3), [`ef945b05c0`](https://github.com/LedgerHQ/ledger-live/commit/ef945b05c01a791281687abb28e639e1bcc4e472), [`5fa68510b4`](https://github.com/LedgerHQ/ledger-live/commit/5fa68510b49334cfd80c30793dfe68900f1b9b3b)]:
  - @ledgerhq/errors@6.12.4-next.0

## 8.0.0

### Major Changes

- [#1991](https://github.com/LedgerHQ/ledger-live/pull/1991) [`62af25493e`](https://github.com/LedgerHQ/ledger-live/commit/62af25493e2becf897d517af42542db208b971c7) Thanks [@valpinkman](https://github.com/valpinkman)! - Remove the support for imports ending with `/` mapping to the `index.js` file.

  For instance:

  ```js
  import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/";
  ```

  Should be rewritten to:

  ```js
  import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
  ```

  This trailing slash is poorly supported by some tools like `vite.js` and was meant as a transitional change.
  Time has come to remove the support for thos shorthand.

## 8.0.0-next.0

### Major Changes

- [#1991](https://github.com/LedgerHQ/ledger-live/pull/1991) [`62af25493e`](https://github.com/LedgerHQ/ledger-live/commit/62af25493e2becf897d517af42542db208b971c7) Thanks [@valpinkman](https://github.com/valpinkman)! - Remove the support for imports ending with `/` mapping to the `index.js` file.

  For instance:

  ```js
  import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/";
  ```

  Should be rewritten to:

  ```js
  import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
  ```

  This trailing slash is poorly supported by some tools like `vite.js` and was meant as a transitional change.
  Time has come to remove the support for thos shorthand.

## 7.0.7

### Patch Changes

- [#2066](https://github.com/LedgerHQ/ledger-live/pull/2066) [`3a267c1424`](https://github.com/LedgerHQ/ledger-live/commit/3a267c14241ebc9184490e7eb81b5d4bcc94b092) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - nanoFTS productName changed to "Ledger Stax"

* [#2144](https://github.com/LedgerHQ/ledger-live/pull/2144) [`1f65abb76f`](https://github.com/LedgerHQ/ledger-live/commit/1f65abb76f1a36b428b5c33dd3ad6c58b4d96aa2) Thanks [@juan-cortes](https://github.com/juan-cortes)! - libs - rename nano fts to stax

- [#2150](https://github.com/LedgerHQ/ledger-live/pull/2150) [`e7c1eaa6a2`](https://github.com/LedgerHQ/ledger-live/commit/e7c1eaa6a24d36aa535df7a06f17c55858de5475) Thanks [@alexandremgo](https://github.com/alexandremgo)! - support: string to DeviceModelId helper function

- Updated dependencies [[`3df451dafb`](https://github.com/LedgerHQ/ledger-live/commit/3df451dafb7233f5e3f897478aee22e89f6e5339), [`20c5c5e109`](https://github.com/LedgerHQ/ledger-live/commit/20c5c5e1099885173aaa5ea3199052044066ac98)]:
  - @ledgerhq/errors@6.12.3

## 7.0.7-next.0

### Patch Changes

- [#2066](https://github.com/LedgerHQ/ledger-live/pull/2066) [`3a267c1424`](https://github.com/LedgerHQ/ledger-live/commit/3a267c14241ebc9184490e7eb81b5d4bcc94b092) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - nanoFTS productName changed to "Ledger Stax"

* [#2144](https://github.com/LedgerHQ/ledger-live/pull/2144) [`1f65abb76f`](https://github.com/LedgerHQ/ledger-live/commit/1f65abb76f1a36b428b5c33dd3ad6c58b4d96aa2) Thanks [@juan-cortes](https://github.com/juan-cortes)! - libs - rename nano fts to stax

- [#2150](https://github.com/LedgerHQ/ledger-live/pull/2150) [`e7c1eaa6a2`](https://github.com/LedgerHQ/ledger-live/commit/e7c1eaa6a24d36aa535df7a06f17c55858de5475) Thanks [@alexandremgo](https://github.com/alexandremgo)! - support: string to DeviceModelId helper function

- Updated dependencies [[`3df451dafb`](https://github.com/LedgerHQ/ledger-live/commit/3df451dafb7233f5e3f897478aee22e89f6e5339), [`20c5c5e109`](https://github.com/LedgerHQ/ledger-live/commit/20c5c5e1099885173aaa5ea3199052044066ac98)]:
  - @ledgerhq/errors@6.12.3-next.0

## 7.0.6

### Patch Changes

- Updated dependencies [[`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5)]:
  - @ledgerhq/errors@6.12.2

## 7.0.6-next.0

### Patch Changes

- Updated dependencies [[`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5)]:
  - @ledgerhq/errors@6.12.2-next.0

## 7.0.5

### Patch Changes

- Updated dependencies [[`856f49374e`](https://github.com/LedgerHQ/ledger-live/commit/856f49374ec9b49f005676e270acdb81b78879c8), [`77056e3692`](https://github.com/LedgerHQ/ledger-live/commit/77056e369256112188c183823a2c3fabfea2cba8)]:
  - @ledgerhq/errors@6.12.1

## 7.0.5-next.0

### Patch Changes

- Updated dependencies [[`856f49374e`](https://github.com/LedgerHQ/ledger-live/commit/856f49374ec9b49f005676e270acdb81b78879c8), [`77056e3692`](https://github.com/LedgerHQ/ledger-live/commit/77056e369256112188c183823a2c3fabfea2cba8)]:
  - @ledgerhq/errors@6.12.1-next.0

## 7.0.4

### Patch Changes

- Updated dependencies [[`0308e8c6ae`](https://github.com/LedgerHQ/ledger-live/commit/0308e8c6ae721a99bc50f5dc60db0d11ea8ea1ff), [`df8cbb8dd1`](https://github.com/LedgerHQ/ledger-live/commit/df8cbb8dd166a66325eb96d8192f3f985b71df60), [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6), [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd)]:
  - @ledgerhq/errors@6.12.0

## 7.0.4-next.0

### Patch Changes

- Updated dependencies [[`0308e8c6ae`](https://github.com/LedgerHQ/ledger-live/commit/0308e8c6ae721a99bc50f5dc60db0d11ea8ea1ff), [`df8cbb8dd1`](https://github.com/LedgerHQ/ledger-live/commit/df8cbb8dd166a66325eb96d8192f3f985b71df60), [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6), [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd)]:
  - @ledgerhq/errors@6.12.0-next.0

## 7.0.3

### Patch Changes

- [#1356](https://github.com/LedgerHQ/ledger-live/pull/1356) [`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Updated readme.md of packages

- Updated dependencies [[`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa)]:
  - @ledgerhq/errors@6.11.1
  - @ledgerhq/logs@6.10.1

## 7.0.3-next.0

### Patch Changes

- [#1356](https://github.com/LedgerHQ/ledger-live/pull/1356) [`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Updated readme.md of packages

- Updated dependencies [[`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa)]:
  - @ledgerhq/errors@6.11.1-next.0
  - @ledgerhq/logs@6.10.1-next.0

## 7.0.2

### Patch Changes

- [#1278](https://github.com/LedgerHQ/ledger-live/pull/1278) [`e0915b34ba`](https://github.com/LedgerHQ/ledger-live/commit/e0915b34ba37d9906b6c65e7e42f87893c088325) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Update values for memory and block size for FTS

- Updated dependencies [[`1a94cbf28a`](https://github.com/LedgerHQ/ledger-live/commit/1a94cbf28aaa2917c70719e22f446148cd66cef6)]:
  - @ledgerhq/errors@6.11.0

## 7.0.2-next.0

### Patch Changes

- [#1278](https://github.com/LedgerHQ/ledger-live/pull/1278) [`e0915b34ba`](https://github.com/LedgerHQ/ledger-live/commit/e0915b34ba37d9906b6c65e7e42f87893c088325) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Update values for memory and block size for FTS

- Updated dependencies [[`1a94cbf28a`](https://github.com/LedgerHQ/ledger-live/commit/1a94cbf28aaa2917c70719e22f446148cd66cef6)]:
  - @ledgerhq/errors@6.11.0-next.0

## 7.0.1

### Patch Changes

- Updated dependencies [[`ae5e33e15e`](https://github.com/LedgerHQ/ledger-live/commit/ae5e33e15e8a107d0ba8a3688a63eda2c0d43ce7)]:
  - @ledgerhq/errors@6.10.2

## 7.0.1-next.0

### Patch Changes

- Updated dependencies [[`ae5e33e15`](https://github.com/LedgerHQ/ledger-live/commit/ae5e33e15e8a107d0ba8a3688a63eda2c0d43ce7)]:
  - @ledgerhq/errors@6.10.2-next.0

## 7.0.0

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

- Updated dependencies [[`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f)]:
  - @ledgerhq/errors@6.10.1

## 7.0.0-next.0

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

- Updated dependencies [[`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f)]:
  - @ledgerhq/errors@6.10.1-next.0
