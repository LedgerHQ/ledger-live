# @ledgerhq/live-countervalues

## 0.25.0

### Minor Changes

- [#21516](https://github.com/LedgerHQ/ledger-live/pull/21516) [`e42c12a`](https://github.com/LedgerHQ/ledger-live/commit/e42c12a392ba60ee839c9a71f4f0d409ad9430fa) Thanks [@ysitbon](https://github.com/ysitbon)! - Remove `fetchIdsSortedByMarketcap` from the legacy countervalues API client. The RTK Query client in `ledger-live-common` already covers the same endpoint and is the single source of truth going forward.

- [#21507](https://github.com/LedgerHQ/ledger-live/pull/21507) [`eb62268`](https://github.com/LedgerHQ/ledger-live/commit/eb622688cb7561882cd02b52c2eed569d5dc68f3) Thanks [@ysitbon](https://github.com/ysitbon)! - Move portfolio and account-coupled logic to live-common

  `portfolio.ts`, the React `portfolioReact.tsx`, the internal `ranges.ts` and `assetsDistribution.ts`
  helpers, and the `inferTrackingPairForAccounts*` tests migrate from the countervalues packages into
  `libs/ledger-live-common/src/portfolio/`. This removes the account-entity blocker from the
  countervalues epic: `live-countervalues` is now rate logic only.

  `live-countervalues`: `portfolio` entry point removed; `src/internal/` directory removed.
  `live-countervalues-react`: `portfolio` entry point removed; package now contains only `index.tsx`.
  `live-common`: `portfolio/portfolio` and `portfolio/portfolioReact` entry points added.

- [#21509](https://github.com/LedgerHQ/ledger-live/pull/21509) [`53dcdc9`](https://github.com/LedgerHQ/ledger-live/commit/53dcdc9bbef2324b48fac7469c2c1d0e66f7361f) Thanks [@ysitbon](https://github.com/ysitbon)! - wallet-analytics: inline `meaningfulPercentage` as a private utility, removing the `/portfolio` import edge. `live-countervalues`: un-export `meaningfulPercentage` (private implementation detail).

- [#21517](https://github.com/LedgerHQ/ledger-live/pull/21517) [`54124e4`](https://github.com/LedgerHQ/ledger-live/commit/54124e435c7adc3a2c3a9ed6cd1865fc68fa2584) Thanks [@ysitbon](https://github.com/ysitbon)! - rename CountervaluesBridge.useMarketcapIds to useSupportedCryptoIds and document why filterSupportedTrackingPairs guards against 422s

- [#21508](https://github.com/LedgerHQ/ledger-live/pull/21508) [`a19ffef`](https://github.com/LedgerHQ/ledger-live/commit/a19ffeff9dd4e173890d75d8634a33e53cc5a5d0) Thanks [@ysitbon](https://github.com/ysitbon)! - Reduce `portfolio.ts` export surface from 19 to 10. The 9 symbols that nothing outside the file imported (`startOfHour`, `startOfDay`, `startOfWeek`, `getRanges`, `getDates`, `getPortfolioRangeConfig`, `getPortfolioCountByDate`, `defaultAssetsDistribution`, `AssetsDistributionOpts`) are relocated to two internal modules (`src/internal/ranges.ts` and `src/internal/assetsDistribution.ts`) and re-imported by `portfolio.ts`. No behaviour change; the internal modules are a staging home until the package gains an explicit `exports` map.

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @ledgerhq/types-live@6.123.0
  - @ledgerhq/ledger-wallet-framework@3.3.0
  - @ledgerhq/live-env@4.0.0

## 0.25.0-next.0

### Minor Changes

- [#21516](https://github.com/LedgerHQ/ledger-live/pull/21516) [`e42c12a`](https://github.com/LedgerHQ/ledger-live/commit/e42c12a392ba60ee839c9a71f4f0d409ad9430fa) Thanks [@ysitbon](https://github.com/ysitbon)! - Remove `fetchIdsSortedByMarketcap` from the legacy countervalues API client. The RTK Query client in `ledger-live-common` already covers the same endpoint and is the single source of truth going forward.

- [#21507](https://github.com/LedgerHQ/ledger-live/pull/21507) [`eb62268`](https://github.com/LedgerHQ/ledger-live/commit/eb622688cb7561882cd02b52c2eed569d5dc68f3) Thanks [@ysitbon](https://github.com/ysitbon)! - Move portfolio and account-coupled logic to live-common

  `portfolio.ts`, the React `portfolioReact.tsx`, the internal `ranges.ts` and `assetsDistribution.ts`
  helpers, and the `inferTrackingPairForAccounts*` tests migrate from the countervalues packages into
  `libs/ledger-live-common/src/portfolio/`. This removes the account-entity blocker from the
  countervalues epic: `live-countervalues` is now rate logic only.

  `live-countervalues`: `portfolio` entry point removed; `src/internal/` directory removed.
  `live-countervalues-react`: `portfolio` entry point removed; package now contains only `index.tsx`.
  `live-common`: `portfolio/portfolio` and `portfolio/portfolioReact` entry points added.

- [#21509](https://github.com/LedgerHQ/ledger-live/pull/21509) [`53dcdc9`](https://github.com/LedgerHQ/ledger-live/commit/53dcdc9bbef2324b48fac7469c2c1d0e66f7361f) Thanks [@ysitbon](https://github.com/ysitbon)! - wallet-analytics: inline `meaningfulPercentage` as a private utility, removing the `/portfolio` import edge. `live-countervalues`: un-export `meaningfulPercentage` (private implementation detail).

- [#21517](https://github.com/LedgerHQ/ledger-live/pull/21517) [`54124e4`](https://github.com/LedgerHQ/ledger-live/commit/54124e435c7adc3a2c3a9ed6cd1865fc68fa2584) Thanks [@ysitbon](https://github.com/ysitbon)! - rename CountervaluesBridge.useMarketcapIds to useSupportedCryptoIds and document why filterSupportedTrackingPairs guards against 422s

- [#21508](https://github.com/LedgerHQ/ledger-live/pull/21508) [`a19ffef`](https://github.com/LedgerHQ/ledger-live/commit/a19ffeff9dd4e173890d75d8634a33e53cc5a5d0) Thanks [@ysitbon](https://github.com/ysitbon)! - Reduce `portfolio.ts` export surface from 19 to 10. The 9 symbols that nothing outside the file imported (`startOfHour`, `startOfDay`, `startOfWeek`, `getRanges`, `getDates`, `getPortfolioRangeConfig`, `getPortfolioCountByDate`, `defaultAssetsDistribution`, `AssetsDistributionOpts`) are relocated to two internal modules (`src/internal/ranges.ts` and `src/internal/assetsDistribution.ts`) and re-imported by `portfolio.ts`. No behaviour change; the internal modules are a staging home until the package gains an explicit `exports` map.

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @ledgerhq/types-live@6.123.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.3.0-next.0
  - @ledgerhq/live-env@4.0.0-next.0

## 0.24.5

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/types-live@6.122.0
  - @ledgerhq/ledger-wallet-framework@3.2.0
  - @ledgerhq/live-env@3.2.0

## 0.24.5-next.0

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/types-live@6.122.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.2.0-next.0
  - @ledgerhq/live-env@3.2.0-next.0

## 0.24.4

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/types-live@6.121.0
  - @ledgerhq/ledger-wallet-framework@3.1.0
  - @ledgerhq/live-env@3.1.0

## 0.24.4-next.0

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/types-live@6.121.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.1.0-next.0
  - @ledgerhq/live-env@3.1.0-next.0

## 0.24.3

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/types-live@6.120.0
  - @ledgerhq/ledger-wallet-framework@3.0.0

## 0.24.3-next.1

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8)]:
  - @ledgerhq/types-live@6.120.0-next.1
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.1

## 0.24.3-next.0

### Patch Changes

- Updated dependencies [[`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.0
  - @ledgerhq/types-live@6.120.0-next.0

## 0.24.2

### Patch Changes

- Updated dependencies [[`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @ledgerhq/types-live@6.119.0
  - @ledgerhq/ledger-wallet-framework@2.8.0

## 0.24.2-next.0

### Patch Changes

- Updated dependencies [[`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @ledgerhq/types-live@6.119.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.8.0-next.0

## 0.24.1

### Patch Changes

- Updated dependencies [[`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9)]:
  - @ledgerhq/types-live@6.118.0
  - @ledgerhq/ledger-wallet-framework@2.7.0

## 0.24.1-next.0

### Patch Changes

- Updated dependencies [[`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9)]:
  - @ledgerhq/types-live@6.118.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.7.0-next.0

## 0.24.0

### Minor Changes

- [#20070](https://github.com/LedgerHQ/ledger-live/pull/20070) [`52253f7`](https://github.com/LedgerHQ/ledger-live/commit/52253f70c302056cdc6b367cdd8b1db408b5e07d) Thanks [@ysitbon](https://github.com/ysitbon)! - Remove the now-dead `@ledgerhq/cryptoassets` currency/fiat store injection from the app bootstraps. Nothing reads the legacy currency/fiat accessors anymore (the runtime source of truth is the domain-backed wallet-framework currency resolver), so `setCryptoCurrenciesStore` / `setFiatCurrenciesStore` injected a store no consumer queried. Drop the calls, drop the `@ledgerhq/cryptoassets` dependency from the apps, and remove the remaining stale references to the package in comments.

### Patch Changes

- Updated dependencies [[`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa)]:
  - @ledgerhq/ledger-wallet-framework@2.6.0
  - @ledgerhq/live-network@3.0.0
  - @ledgerhq/live-env@3.0.0
  - @ledgerhq/types-live@6.117.0

## 0.24.0-next.0

### Minor Changes

- [#20070](https://github.com/LedgerHQ/ledger-live/pull/20070) [`52253f7`](https://github.com/LedgerHQ/ledger-live/commit/52253f70c302056cdc6b367cdd8b1db408b5e07d) Thanks [@ysitbon](https://github.com/ysitbon)! - Remove the now-dead `@ledgerhq/cryptoassets` currency/fiat store injection from the app bootstraps. Nothing reads the legacy currency/fiat accessors anymore (the runtime source of truth is the domain-backed wallet-framework currency resolver), so `setCryptoCurrenciesStore` / `setFiatCurrenciesStore` injected a store no consumer queried. Drop the calls, drop the `@ledgerhq/cryptoassets` dependency from the apps, and remove the remaining stale references to the package in comments.

### Patch Changes

- Updated dependencies [[`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa)]:
  - @ledgerhq/ledger-wallet-framework@2.6.0-next.0
  - @ledgerhq/live-network@3.0.0-next.0
  - @ledgerhq/live-env@3.0.0-next.0
  - @ledgerhq/types-live@6.117.0-next.0

## 0.23.0

### Minor Changes

- [#19818](https://github.com/LedgerHQ/ledger-live/pull/19818) [`f57602a`](https://github.com/LedgerHQ/ledger-live/commit/f57602a679ed08b437955a2858f84e3086d6e417) Thanks [@0xMM-L](https://github.com/0xMM-L)! - Enable Aleo as a swap currency. Register Aleo as Nano S–incompatible for swap (`INCOMPATIBLE_NANO_S_CURRENCY_KEYS`) with its incompatibility copy, and add Aleo to the live-countervalues mock registry so mocked countervalues cover it. Aleo becomes selectable as a swap source because the `aleo` family is present in `WALLET_API_FAMILIES` (via `@ledgerhq/wallet-api-core` `^1.35.0`, already a dependency), so it resolves through `currency.list`.

### Patch Changes

- Updated dependencies [[`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7)]:
  - @ledgerhq/types-live@6.116.0
  - @ledgerhq/live-network@2.7.0
  - @ledgerhq/ledger-wallet-framework@2.5.0

## 0.23.0-next.0

### Minor Changes

- [#19818](https://github.com/LedgerHQ/ledger-live/pull/19818) [`f57602a`](https://github.com/LedgerHQ/ledger-live/commit/f57602a679ed08b437955a2858f84e3086d6e417) Thanks [@0xMM-L](https://github.com/0xMM-L)! - Enable Aleo as a swap currency. Register Aleo as Nano S–incompatible for swap (`INCOMPATIBLE_NANO_S_CURRENCY_KEYS`) with its incompatibility copy, and add Aleo to the live-countervalues mock registry so mocked countervalues cover it. Aleo becomes selectable as a swap source because the `aleo` family is present in `WALLET_API_FAMILIES` (via `@ledgerhq/wallet-api-core` `^1.35.0`, already a dependency), so it resolves through `currency.list`.

### Patch Changes

- Updated dependencies [[`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7)]:
  - @ledgerhq/types-live@6.116.0-next.0
  - @ledgerhq/live-network@2.7.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.5.0-next.0

## 0.22.1

### Patch Changes

- Updated dependencies [[`8f30c75`](https://github.com/LedgerHQ/ledger-live/commit/8f30c75ecb553a720722f1e039b4aec53fce2a87), [`0f85077`](https://github.com/LedgerHQ/ledger-live/commit/0f850774ae3b46fd4a06c0da5762d3d4211b26af), [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d), [`bde85a7`](https://github.com/LedgerHQ/ledger-live/commit/bde85a7ef50cf7990efd2f9bcd7ccc34c0764fb7), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`d631f0d`](https://github.com/LedgerHQ/ledger-live/commit/d631f0dd2480950c5f20dec0c9b4aca515ec63f8), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158)]:
  - @ledgerhq/ledger-wallet-framework@2.4.0
  - @ledgerhq/live-env@2.42.0
  - @ledgerhq/types-live@6.115.0
  - @ledgerhq/live-network@2.6.8

## 0.22.1-next.0

### Patch Changes

- Updated dependencies [[`8f30c75`](https://github.com/LedgerHQ/ledger-live/commit/8f30c75ecb553a720722f1e039b4aec53fce2a87), [`0f85077`](https://github.com/LedgerHQ/ledger-live/commit/0f850774ae3b46fd4a06c0da5762d3d4211b26af), [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d), [`bde85a7`](https://github.com/LedgerHQ/ledger-live/commit/bde85a7ef50cf7990efd2f9bcd7ccc34c0764fb7), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`d631f0d`](https://github.com/LedgerHQ/ledger-live/commit/d631f0dd2480950c5f20dec0c9b4aca515ec63f8), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158)]:
  - @ledgerhq/ledger-wallet-framework@2.4.0-next.0
  - @ledgerhq/live-env@2.42.0-next.0
  - @ledgerhq/types-live@6.115.0-next.0
  - @ledgerhq/live-network@2.6.8-next.0

## 0.22.0

### Minor Changes

- [#18916](https://github.com/LedgerHQ/ledger-live/pull/18916) [`ba433a1`](https://github.com/LedgerHQ/ledger-live/commit/ba433a1a08fa65ce3d376bb0d60fe1d4241b422d) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add shared LineChart axis/formatters utilities, custom ranges prop, and chart label inset fix. Refactor AssetDetail chart VM to use shared helpers. Add Analytics all-time value change helpers and export `meaningfulPercentage` from live-countervalues.

### Patch Changes

- Updated dependencies [[`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff), [`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11), [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d), [`6400154`](https://github.com/LedgerHQ/ledger-live/commit/6400154daa131b225c6ec62c9134f1cd06370729), [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e), [`e6566ff`](https://github.com/LedgerHQ/ledger-live/commit/e6566ff55d95ff36832d5f77899d67d80842f418), [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7), [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`c8b4ee7`](https://github.com/LedgerHQ/ledger-live/commit/c8b4ee77c03ca2117cbad039331b7b52e50d9620), [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4), [`fa0123a`](https://github.com/LedgerHQ/ledger-live/commit/fa0123a1da7b053d58afab498266cf830958e2ff), [`0e30cdc`](https://github.com/LedgerHQ/ledger-live/commit/0e30cdc29d7fb3cab5bf1f2ef7c24cf0a152516e), [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170), [`cf3aad1`](https://github.com/LedgerHQ/ledger-live/commit/cf3aad160bd9d2002a3154fbc70018fb1f7a6171), [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8), [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3), [`376915c`](https://github.com/LedgerHQ/ledger-live/commit/376915ca520ecc1708090ed9b3eba1ff7e780540), [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff), [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc), [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55), [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e), [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33), [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a)]:
  - @ledgerhq/types-live@6.114.0
  - @ledgerhq/live-env@2.41.0
  - @ledgerhq/ledger-wallet-framework@2.3.0
  - @ledgerhq/types-cryptoassets@7.39.0
  - @ledgerhq/live-promise@0.3.0
  - @ledgerhq/live-network@2.6.7

## 0.22.0-next.0

### Minor Changes

- [#18916](https://github.com/LedgerHQ/ledger-live/pull/18916) [`ba433a1`](https://github.com/LedgerHQ/ledger-live/commit/ba433a1a08fa65ce3d376bb0d60fe1d4241b422d) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add shared LineChart axis/formatters utilities, custom ranges prop, and chart label inset fix. Refactor AssetDetail chart VM to use shared helpers. Add Analytics all-time value change helpers and export `meaningfulPercentage` from live-countervalues.

### Patch Changes

- Updated dependencies [[`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff), [`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11), [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d), [`6400154`](https://github.com/LedgerHQ/ledger-live/commit/6400154daa131b225c6ec62c9134f1cd06370729), [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e), [`e6566ff`](https://github.com/LedgerHQ/ledger-live/commit/e6566ff55d95ff36832d5f77899d67d80842f418), [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7), [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`c8b4ee7`](https://github.com/LedgerHQ/ledger-live/commit/c8b4ee77c03ca2117cbad039331b7b52e50d9620), [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4), [`fa0123a`](https://github.com/LedgerHQ/ledger-live/commit/fa0123a1da7b053d58afab498266cf830958e2ff), [`0e30cdc`](https://github.com/LedgerHQ/ledger-live/commit/0e30cdc29d7fb3cab5bf1f2ef7c24cf0a152516e), [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170), [`cf3aad1`](https://github.com/LedgerHQ/ledger-live/commit/cf3aad160bd9d2002a3154fbc70018fb1f7a6171), [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8), [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3), [`376915c`](https://github.com/LedgerHQ/ledger-live/commit/376915ca520ecc1708090ed9b3eba1ff7e780540), [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff), [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc), [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55), [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e), [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33), [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a)]:
  - @ledgerhq/types-live@6.114.0-next.0
  - @ledgerhq/live-env@2.41.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.3.0-next.0
  - @ledgerhq/types-cryptoassets@7.39.0-next.0
  - @ledgerhq/live-promise@0.3.0-next.0
  - @ledgerhq/live-network@2.6.7-next.0

## 0.21.0

### Minor Changes

- [#18757](https://github.com/LedgerHQ/ledger-live/pull/18757) [`36200f9`](https://github.com/LedgerHQ/ledger-live/commit/36200f969272f31c6737146b154b7dca8139d4cc) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix zero-balance asset trend display

- [#18773](https://github.com/LedgerHQ/ledger-live/pull/18773) [`b383bd5`](https://github.com/LedgerHQ/ledger-live/commit/b383bd51879861ab707bbf4795ac1b76393acb98) Thanks [@deepyjr](https://github.com/deepyjr)! - Filter unsupported countervalue tracking pairs before polling.

- [#18654](https://github.com/LedgerHQ/ledger-live/pull/18654) [`25101e2`](https://github.com/LedgerHQ/ledger-live/commit/25101e2991ea7c9ab54c7f3e4e5bc0bda8056d0b) Thanks [@deepyjr](https://github.com/deepyjr)! - Display a 1D variation for held assets instead of "-": when an asset's 24h portfolio value change is unavailable (e.g. freshly-acquired positions whose 24h-ago balance was zero), fall back to the asset's 1D price change computed locally from countervalues, expressed in the user's counter-value currency. This applies uniformly to crypto, stablecoins and stocks, and is handled in the shared trend hooks so generic display components stay decoupled from any asset category. A flat price now renders a real 0% (instead of "-"), and the fallback stays neutral when a rate is missing.

- [#18847](https://github.com/LedgerHQ/ledger-live/pull/18847) [`37eba10`](https://github.com/LedgerHQ/ledger-live/commit/37eba10db15542fb7859bafac772e6d280650872) Thanks [@semeano](https://github.com/semeano)! - Rename the native TON cryptocurrency to Gram

### Patch Changes

- Updated dependencies [[`636a4cb`](https://github.com/LedgerHQ/ledger-live/commit/636a4cbc5ae01364af425e3837cecf1ce4d3f3bc), [`ad68778`](https://github.com/LedgerHQ/ledger-live/commit/ad68778ad71686c9e4f397276917e606a099f573), [`13aeeb6`](https://github.com/LedgerHQ/ledger-live/commit/13aeeb6186997b433785e542ed1dafa6afde2267), [`1f41eee`](https://github.com/LedgerHQ/ledger-live/commit/1f41eee5b4dc6aa50accd94e5a0d6c98fcf76e23), [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934), [`798081d`](https://github.com/LedgerHQ/ledger-live/commit/798081db3e427c8d2d09930ceb836703146ca1ba), [`1f11587`](https://github.com/LedgerHQ/ledger-live/commit/1f11587b4681429aa9be2dc50035f292e0394108), [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292), [`ca20506`](https://github.com/LedgerHQ/ledger-live/commit/ca20506c138a1cfb9c254f61e6bb930aea4c6ab8)]:
  - @ledgerhq/types-live@6.113.0
  - @ledgerhq/live-env@2.40.0
  - @ledgerhq/ledger-wallet-framework@2.2.1
  - @ledgerhq/live-network@2.6.6

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
