# ledger-live-desktop

## 2.45.0-next.4

### Minor Changes

- [#659](https://github.com/LedgerHQ/ledger-live/pull/659) [`eb83f93b1`](https://github.com/LedgerHQ/ledger-live/commit/eb83f93b1663404c2826692f2cc5f0be8cdd4bdd) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLD - buy and sell - redirect entry points of exchange app towards the new incoming live app

## 2.45.0-next.3

### Minor Changes

- [#81](https://github.com/LedgerHQ/ledger-live/pull/81) [`76b2825e8`](https://github.com/LedgerHQ/ledger-live/commit/76b2825e84730e9d5a2f7906abd7c00a191de4db) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - feat: add ERC20 token support to the Platform API

### Patch Changes

- Updated dependencies [[`76b2825e8`](https://github.com/LedgerHQ/ledger-live/commit/76b2825e84730e9d5a2f7906abd7c00a191de4db)]:
  - @ledgerhq/live-common@25.0.0-next.3

## 2.45.0-next.2

### Patch Changes

- Updated dependencies [[`345706e24`](https://github.com/LedgerHQ/ledger-live/commit/345706e24e91ba4c397d4a6ffc1b2b174a0ddc84)]:
  - @ledgerhq/live-common@25.0.0-next.2

## 2.45.0-next.1

### Minor Changes

- [#471](https://github.com/LedgerHQ/ledger-live/pull/471) [`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of Stellar assets (tokens)

### Patch Changes

- Updated dependencies [[`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0)]:
  - @ledgerhq/live-common@25.0.0-next.1

## 2.45.0-next.0

### Minor Changes

- [#602](https://github.com/LedgerHQ/ledger-live/pull/602) [`7c15869a7`](https://github.com/LedgerHQ/ledger-live/commit/7c15869a7a2cf74f849f8cf0fe13b66133ff673a) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Accept new message.sign call from the live-app-sdk

### Patch Changes

- [#386](https://github.com/LedgerHQ/ledger-live/pull/386) [`8917ca143`](https://github.com/LedgerHQ/ledger-live/commit/8917ca1436e780e3a52f66f968f8224ad35362b4) Thanks [@gre](https://github.com/gre)! - Log experimental and feature flags in Sentry error reports.

* [#415](https://github.com/LedgerHQ/ledger-live/pull/415) [`6ef54d871`](https://github.com/LedgerHQ/ledger-live/commit/6ef54d871740f1b5378d2e259864c239aaea9c99) Thanks [@laure-lebon](https://github.com/laure-lebon)! - Ellipsis added to memo for Cosmos

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

- Updated dependencies [[`2de4b99c0`](https://github.com/LedgerHQ/ledger-live/commit/2de4b99c0c36766474d5ea037615f9f69942e905), [`e0516e387`](https://github.com/LedgerHQ/ledger-live/commit/e0516e3877fbbef458ec4da9e06bd9d7db09d0ee), [`7c15869a7`](https://github.com/LedgerHQ/ledger-live/commit/7c15869a7a2cf74f849f8cf0fe13b66133ff673a), [`e4b7dc326`](https://github.com/LedgerHQ/ledger-live/commit/e4b7dc32664d32b43dfae2821c29715ae94a6ab4), [`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f), [`3be077f54`](https://github.com/LedgerHQ/ledger-live/commit/3be077f547cce51d8640a13fd37583d7782ab8a2), [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/live-common@25.0.0-next.0
  - @ledgerhq/react-ui@0.8.1-next.0
  - @ledgerhq/errors@6.10.1-next.0
  - @ledgerhq/devices@7.0.0-next.0
  - @ledgerhq/hw-transport@6.27.2-next.0
  - @ledgerhq/hw-transport-http@6.27.2-next.0
  - @ledgerhq/hw-transport-node-hid-singleton@6.27.3-next.0

## 2.44.1

### Patch Changes

- Updated dependencies [[`4c02cf2e0`](https://github.com/LedgerHQ/ledger-live/commit/4c02cf2e0c393ad8d9cc5339e7b63eefb297e2cb)]:
  - @ledgerhq/live-common@24.1.0-next.1
- Updated dependencies [[`60fb9efdc`](https://github.com/LedgerHQ/ledger-live/commit/60fb9efdcc9dbf72f651fd7b388d175a12bf859b), [`3969bac02`](https://github.com/LedgerHQ/ledger-live/commit/3969bac02d6028ff543e61d4b67d95a6bfb14dfe), [`414fa596a`](https://github.com/LedgerHQ/ledger-live/commit/414fa596a88aafdce676ac3fb349f41f302ea860)]:
  - @ledgerhq/live-common@24.1.0-next.0

## 2.44.1-next.1

### Patch Changes

- Updated dependencies [[`4c02cf2e0`](https://github.com/LedgerHQ/ledger-live/commit/4c02cf2e0c393ad8d9cc5339e7b63eefb297e2cb)]:
  - @ledgerhq/live-common@24.1.0-next.1

## 2.44.1-next.0

### Patch Changes

- Updated dependencies [[`60fb9efdc`](https://github.com/LedgerHQ/ledger-live/commit/60fb9efdcc9dbf72f651fd7b388d175a12bf859b), [`3969bac02`](https://github.com/LedgerHQ/ledger-live/commit/3969bac02d6028ff543e61d4b67d95a6bfb14dfe), [`414fa596a`](https://github.com/LedgerHQ/ledger-live/commit/414fa596a88aafdce676ac3fb349f41f302ea860)]:
  - @ledgerhq/live-common@24.1.0-next.0

## 2.44.0

### Minor Changes

- [#444](https://github.com/LedgerHQ/ledger-live/pull/444) [`0e076b0f3`](https://github.com/LedgerHQ/ledger-live/commit/0e076b0f3aa34ee8e56db5623b99ddb9c8d71700) Thanks [@Justkant](https://github.com/Justkant)! - feat: integration of alternate DEX on swap page [LIVE-2677]

* [#92](https://github.com/LedgerHQ/ledger-live/pull/92) [`ce02e4e78`](https://github.com/LedgerHQ/ledger-live/commit/ce02e4e78f575efb1c3a7e5da9ed116e9ef850b3) Thanks [@Justkant](https://github.com/Justkant)! - feat(swap): Add Changelly's Terms of Use in the confirmation screen [LIVE-1195]

- [#275](https://github.com/LedgerHQ/ledger-live/pull/275) [`a35c6e9a3`](https://github.com/LedgerHQ/ledger-live/commit/a35c6e9a310f9bc711b24303ab5397041d64c199) Thanks [@gre](https://github.com/gre)! - Add Sentry support

* [#499](https://github.com/LedgerHQ/ledger-live/pull/499) [`b531aa0bc`](https://github.com/LedgerHQ/ledger-live/commit/b531aa0bc0b18304813b5a2b08a6107c587ea6ba) Thanks [@github-actions](https://github.com/apps/github-actions)! - NFT counter value added on LLM and LLD with feature flagging

- [#499](https://github.com/LedgerHQ/ledger-live/pull/499) [`b531aa0bc`](https://github.com/LedgerHQ/ledger-live/commit/b531aa0bc0b18304813b5a2b08a6107c587ea6ba) Thanks [@github-actions](https://github.com/apps/github-actions)! - Bitcoin Rbf new implementation. Jira ticket: LIVE-1414, LIVE-1415, LIVE-1416

### Patch Changes

- [#186](https://github.com/LedgerHQ/ledger-live/pull/186) [`cdcee7ad9`](https://github.com/LedgerHQ/ledger-live/commit/cdcee7ad98767c117f854fd9ddcb9e1962ecc6cf) Thanks [@elbywan](https://github.com/elbywan)! - Replace webpack with esbuild for production builds.

* [#432](https://github.com/LedgerHQ/ledger-live/pull/432) [`ebb7deb1a`](https://github.com/LedgerHQ/ledger-live/commit/ebb7deb1af2b35b9e0d3a55f7e141136b3acebf8) Thanks [@elbywan](https://github.com/elbywan)! - Fix regression when opening external windows from within a webview tag

- [#499](https://github.com/LedgerHQ/ledger-live/pull/499) [`6f2aaedab`](https://github.com/LedgerHQ/ledger-live/commit/6f2aaedabe97e313f8a0d5b9725324220582ddf4) Thanks [@github-actions](https://github.com/apps/github-actions)! - Fix swap TOS styling

* [#499](https://github.com/LedgerHQ/ledger-live/pull/499) [`4de067e7c`](https://github.com/LedgerHQ/ledger-live/commit/4de067e7cffabf0fef5ee896f316b5374bed6365) Thanks [@github-actions](https://github.com/apps/github-actions)! - Swap: Fixes styling issues

- [#324](https://github.com/LedgerHQ/ledger-live/pull/324) [`89e31c3c4`](https://github.com/LedgerHQ/ledger-live/commit/89e31c3c46570f9ffe21f48a5e76ddc1bcfbc668) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Fixed issue on CryptoCurrency Icon in transactions history (size issue)

* [#499](https://github.com/LedgerHQ/ledger-live/pull/499) [`8ecc114d9`](https://github.com/LedgerHQ/ledger-live/commit/8ecc114d9693c2da7d51c000612ecf72cb3f9b55) Thanks [@github-actions](https://github.com/apps/github-actions)! - Handle all non final (i.e: non OK nor KO) status as pending

- [#499](https://github.com/LedgerHQ/ledger-live/pull/499) [`b531aa0bc`](https://github.com/LedgerHQ/ledger-live/commit/b531aa0bc0b18304813b5a2b08a6107c587ea6ba) Thanks [@github-actions](https://github.com/apps/github-actions)! - Adding optimistic operations to NFT transfers

* [#499](https://github.com/LedgerHQ/ledger-live/pull/499) [`b531aa0bc`](https://github.com/LedgerHQ/ledger-live/commit/b531aa0bc0b18304813b5a2b08a6107c587ea6ba) Thanks [@github-actions](https://github.com/apps/github-actions)! - Add loading spinner on "From amount" field in Swap form when using "Send max" toggle

- [#499](https://github.com/LedgerHQ/ledger-live/pull/499) [`b531aa0bc`](https://github.com/LedgerHQ/ledger-live/commit/b531aa0bc0b18304813b5a2b08a6107c587ea6ba) Thanks [@github-actions](https://github.com/apps/github-actions)! - Add basic support for macOS universal apps.

## 2.44.0-next.1

### Patch Changes

- [#499](https://github.com/LedgerHQ/ledger-live/pull/499) [`4de067e7c`](https://github.com/LedgerHQ/ledger-live/commit/4de067e7cffabf0fef5ee896f316b5374bed6365) Thanks [@github-actions](https://github.com/apps/github-actions)! - Swap: Fixes styling issues

## 2.44.0-next.0

### Minor Changes

- [#502](https://github.com/LedgerHQ/ledger-live/pull/502) [`bdc76d75f`](https://github.com/LedgerHQ/ledger-live/commit/bdc76d75f9643129384c76ac9868e160c4b52062) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Bitcoin Rbf new implementation. Jira ticket: LIVE-1414, LIVE-1415, LIVE-1416

### Patch Changes

- [#499](https://github.com/LedgerHQ/ledger-live/pull/499) [`6f2aaedab`](https://github.com/LedgerHQ/ledger-live/commit/6f2aaedabe97e313f8a0d5b9725324220582ddf4) Thanks [@github-actions](https://github.com/apps/github-actions)! - Fix swap TOS styling

- Updated dependencies [[`bdc76d75f`](https://github.com/LedgerHQ/ledger-live/commit/bdc76d75f9643129384c76ac9868e160c4b52062)]:
  - @ledgerhq/live-common@24.0.0-next.4

## 2.44.0-next.4

### Minor Changes

- 5145781e5: NFT counter value added on LLM and LLD with feature flagging

### Patch Changes

- Updated dependencies [5145781e5]
  - @ledgerhq/live-common@24.0.0-next.3

## 2.44.0-next.3

### Minor Changes

- ce02e4e78: feat(swap): Add Changelly's Terms of Use in the confirmation screen [LIVE-1195]

## 2.44.0-next.2

### Minor Changes

- 0e076b0f3: feat: integration of alternate DEX on swap page [LIVE-2677]

## 2.43.2-next.1

### Patch Changes

- c5714333b: Adding optimistic operations to NFT transfers
- Updated dependencies [c5714333b]
  - @ledgerhq/live-common@24.0.0-next.2

## 2.43.2-next.0

### Patch Changes

- 99cc5bbc1: Handle all non final (i.e: non OK nor KO) status as pending
- 99cc5bbc1: Add loading spinner on "From amount" field in Swap form when using "Send max" toggle
- Updated dependencies [99cc5bbc1]
- Updated dependencies [99cc5bbc1]
  - @ledgerhq/live-common@24.0.0-next.1

## 2.45.0-next.0

### Minor Changes

- a35c6e9a3: Add Sentry support

### Patch Changes

- cdcee7ad9: Replace webpack with esbuild for production builds.
- ebb7deb1a: Fix regression when opening external windows from within a webview tag
- 89e31c3c4: Fixed issue on CryptoCurrency Icon in transactions history (size issue)
- c5c3f48e4: Add basic support for macOS universal apps.
- Updated dependencies [22531f3c3]
- Updated dependencies [e393b9bfa]
- Updated dependencies [d22452817]
- Updated dependencies [2012b5477]
- Updated dependencies [10440ec3c]
- Updated dependencies [e1f2f07a2]
- Updated dependencies [9c3e27f46]
- Updated dependencies [1e4a5647b]
- Updated dependencies [c5c3f48e4]
- Updated dependencies [ef01a3cc2]
- Updated dependencies [508e4c23b]
- Updated dependencies [b1e396dd8]
- Updated dependencies [e9decc277]
  - @ledgerhq/live-common@24.0.0-next.0
  - @ledgerhq/react-ui@0.8.0-next.0
  - @ledgerhq/hw-transport-node-hid-singleton@6.27.2-next.0

## 2.44.0

### Minor Changes

- 4db0f58ca: Updated learn feature url to be remote configurable
- 9c3b16bcc: Fix infinite loading when NFTs are load in gallery mode

### Patch Changes

- 4a676321f: Remove unecessary 'sqlite' cleanup that no longer is needed after libcore sunset
- c78f7d6db: Fixed issue on Circulating Supply, removed currency in front of the value
- Updated dependencies [8323d2eaa]
- Updated dependencies [bf12e0f65]
- Updated dependencies [8861c4fe0]
- Updated dependencies [ec5c4fa3d]
- Updated dependencies [608010c9d]
- Updated dependencies [78a64769d]
- Updated dependencies [0c2c6682b]
  - @ledgerhq/live-common@23.1.0
  - @ledgerhq/react-ui@0.7.8

## 2.44.0-next.6

### Patch Changes

- Updated dependencies [78a64769d]
  - @ledgerhq/live-common@23.1.0-next.4

## 2.44.0-next.5

### Patch Changes

- Updated dependencies [0c2c6682b]
  - @ledgerhq/react-ui@0.7.8-next.0

## 2.44.0-next.4

### Patch Changes

- Updated dependencies [ec5c4fa3d]
  - @ledgerhq/live-common@23.1.0-next.3

## 2.44.0-next.3

### Patch Changes

- Updated dependencies [bf12e0f65]
  - @ledgerhq/live-common@23.1.0-next.2

## 2.44.0-next.2

### Minor Changes

- 4db0f58ca: Updated learn feature url to be remote configurable

## 2.44.0-next.1

### Patch Changes

- Updated dependencies [608010c9d]
  - @ledgerhq/live-common@23.1.0-next.1

## 2.44.0-next.0

### Minor Changes

- 9c3b16bcc: Fix infinite loading when NFTs are load in gallery mode

### Patch Changes

- 4a676321f: Remove unecessary 'sqlite' cleanup that no longer is needed after libcore sunset
- c78f7d6db: Fixed issue on Circulating Supply, removed currency in front of the value
- Updated dependencies [8323d2eaa]
- Updated dependencies [8861c4fe0]
  - @ledgerhq/live-common@23.1.0-next.0

## 2.43.1

### Patch Changes

- 2707fa19b: add release notes

## 2.43.0

### Minor Changes

- cefeff1d7: Display a modal at app launch to inform users terms of use got updated. Also refactor the way we assess terms update using date comparison instead of strict string equality.
- 64c2fdb06: Filecoin integration in LLD and LLM

### Patch Changes

- 8b2e24b6c: Fixing an issue with WalletConnect not accepting new connection after a first disconnection, resulting in an infite loading
- Updated dependencies [09648db7f]
- Updated dependencies [a66fbe852]
- Updated dependencies [0f59cfc10]
- Updated dependencies [8ee9c5568]
- Updated dependencies [899aa3300]
- Updated dependencies [89e82ed79]
- Updated dependencies [403ea8efe]
- Updated dependencies [98ecc6272]
- Updated dependencies [9a86fe231]
- Updated dependencies [8b2e24b6c]
- Updated dependencies [64c2fdb06]
- Updated dependencies [f686ec781]
- Updated dependencies [b688a592d]
- Updated dependencies [71ad84023]
- Updated dependencies [64c2fdb06]
  - @ledgerhq/live-common@23.0.0
  - @ledgerhq/react-ui@0.7.7

## 2.43.0-next.5

### Patch Changes

- 8b2e24b6c: Fixing an issue with WalletConnect not accepting new connection after a first disconnection, resulting in an infite loading
- Updated dependencies [8b2e24b6c]
  - @ledgerhq/live-common@23.0.0-next.4

## 2.43.0-next.4

### Patch Changes

- Updated dependencies [a66fbe852]
  - @ledgerhq/live-common@23.0.0-next.3

## 2.43.0-next.3

### Patch Changes

- Updated dependencies [8ee9c5568]
  - @ledgerhq/live-common@23.0.0-next.2

## 2.43.0-next.2

### Patch Changes

- Updated dependencies [98ecc6272]
  - @ledgerhq/live-common@23.0.0-next.1

## 2.43.0-next.1

### Minor Changes

- cefeff1d7: Display a modal at app launch to inform users terms of use got updated. Also refactor the way we assess terms update using date comparison instead of strict string equality.

## 2.43.0-next.0

### Minor Changes

- 64c2fdb06: Filecoin integration in LLD and LLM

### Patch Changes

- Updated dependencies [09648db7f]
- Updated dependencies [0f59cfc10]
- Updated dependencies [899aa3300]
- Updated dependencies [89e82ed79]
- Updated dependencies [403ea8efe]
- Updated dependencies [9a86fe231]
- Updated dependencies [64c2fdb06]
- Updated dependencies [f686ec781]
- Updated dependencies [b688a592d]
- Updated dependencies [71ad84023]
- Updated dependencies [64c2fdb06]
  - @ledgerhq/live-common@23.0.0-next.0
  - @ledgerhq/react-ui@0.7.7-next.0

## 2.42.0

### Minor Changes

- e0c187073: Change the NFT Media components and model to use the new image processing feature from our NFT Metadata Provider. We now have multiple images and we're supporting videos.
- ee44ffb17: Cosmos Staking V1 LLD and LLC rework of delegation
- 0252fab71: LIVE-1004 Hedera first integration in LLD
- daaf595c2: Add Chinese (ZH) and Spanish (ES) to discoverable languages. Also refactor the system language detection function.
- f913f6fdb: LIVE-2162 Solana staking UX improvements
- b054eb4d9: Fix wrong cosmos validator at summary step

### Patch Changes

- 1735fdd30: bugfix - market page lag issue during navigation fixed + removal of duplicated breadcrumb on market details page
- Updated dependencies [e0c187073]
- Updated dependencies [ee44ffb17]
- Updated dependencies [16be6e5c0]
- Updated dependencies [a26ee3f54]
- Updated dependencies [0252fab71]
- Updated dependencies [3f816efba]
- Updated dependencies [f2574d25d]
- Updated dependencies [f913f6fdb]
- Updated dependencies [403ea8efe]
- Updated dependencies [9a86fe231]
  - @ledgerhq/live-common@22.2.0

## 2.42.0-llmnext.3

### Patch Changes

- Updated dependencies [16be6e5c0]
  - @ledgerhq/live-common@22.2.0-llmnext.2

## 2.42.0-llmnext.2

### Patch Changes

- Updated dependencies [a26ee3f54]
  - @ledgerhq/live-common@22.2.0-llmnext.1

## 2.42.0-llmnext.1

### Minor Changes

- b054eb4d: Fix wrong cosmos validator at summary step

## 2.42.0-llmnext.0

### Minor Changes

- e0c187073: Change the NFT Media components and model to use the new image processing feature from our NFT Metadata Provider. We now have multiple images and we're supporting videos.
- ee44ffb17: Cosmos Staking V1 LLD and LLC rework of delegation
- 0252fab71: LIVE-1004 Hedera first integration in LLD
- daaf595c2: Add Chinese (ZH) and Spanish (ES) to discoverable languages. Also refactor the system language detection function.
- f913f6fdb: LIVE-2162 Solana staking UX improvements

### Patch Changes

- 1735fdd30: bugfix - market page lag issue during navigation fixed + removal of duplicated breadcrumb on market details page
- Updated dependencies [e0c187073]
- Updated dependencies [ee44ffb17]
- Updated dependencies [0252fab71]
- Updated dependencies [3f816efba]
- Updated dependencies [f2574d25d]
- Updated dependencies [f913f6fdb]
- Updated dependencies [403ea8efe]
- Updated dependencies [9a86fe231]
  - @ledgerhq/live-common@22.2.0-llmnext.0
