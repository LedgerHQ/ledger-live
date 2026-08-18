# @ledgerhq/coin-aleo

## 1.22.0

### Minor Changes

- [#20278](https://github.com/LedgerHQ/ledger-live/pull/20278) [`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `@ledgerhq/errors` dependency, completing the errors sunset (LIVE-32915).

  The `@ledgerhq/errors` package is removed from the monorepo: no workspace source imported it anymore, every error class it held now lives in the package that owns it (`@ledgerhq/ledger-wallet-framework/errors` for the ones shared across coin modules). `createCustomErrorClass` and the `serializeError` / `deserializeError` stack are gone with it — define errors as native classes and branch on `error.name`.

  `@ledgerhq/errors@6.37.0` stays on npm for external consumers, but is no longer published from this repo.

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

### Patch Changes

- Updated dependencies [[`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @ledgerhq/types-live@6.119.0
  - @ledgerhq/ledger-wallet-framework@2.8.0

## 1.22.0-next.0

### Minor Changes

- [#20278](https://github.com/LedgerHQ/ledger-live/pull/20278) [`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `@ledgerhq/errors` dependency, completing the errors sunset (LIVE-32915).

  The `@ledgerhq/errors` package is removed from the monorepo: no workspace source imported it anymore, every error class it held now lives in the package that owns it (`@ledgerhq/ledger-wallet-framework/errors` for the ones shared across coin modules). `createCustomErrorClass` and the `serializeError` / `deserializeError` stack are gone with it — define errors as native classes and branch on `error.name`.

  `@ledgerhq/errors@6.37.0` stays on npm for external consumers, but is no longer published from this repo.

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

### Patch Changes

- Updated dependencies [[`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @ledgerhq/types-live@6.119.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.8.0-next.0

## 1.21.0

### Minor Changes

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20206](https://github.com/LedgerHQ/ledger-live/pull/20206) [`e630ac7`](https://github.com/LedgerHQ/ledger-live/commit/e630ac7b3dd4523aa050a1316de98814c0daa5b2) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix(aleo): incorrect asset type in tx intent

### Patch Changes

- Updated dependencies [[`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9)]:
  - @ledgerhq/types-live@6.118.0
  - @ledgerhq/ledger-wallet-framework@2.7.0

## 1.21.0-next.0

### Minor Changes

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20206](https://github.com/LedgerHQ/ledger-live/pull/20206) [`e630ac7`](https://github.com/LedgerHQ/ledger-live/commit/e630ac7b3dd4523aa050a1316de98814c0daa5b2) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix(aleo): incorrect asset type in tx intent

### Patch Changes

- Updated dependencies [[`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9)]:
  - @ledgerhq/types-live@6.118.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.7.0-next.0

## 1.20.0

### Minor Changes

- [#19980](https://github.com/LedgerHQ/ledger-live/pull/19980) [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Convert error classes from createCustomErrorClass factory to native extends Error (LIVE-32915 tier 1a)

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa)]:
  - @ledgerhq/errors@7.0.0
  - @ledgerhq/ledger-wallet-framework@2.6.0
  - @ledgerhq/live-network@3.0.0
  - @ledgerhq/live-env@3.0.0
  - @ledgerhq/types-live@6.117.0

## 1.20.0-next.0

### Minor Changes

- [#19980](https://github.com/LedgerHQ/ledger-live/pull/19980) [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Convert error classes from createCustomErrorClass factory to native extends Error (LIVE-32915 tier 1a)

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa)]:
  - @ledgerhq/errors@7.0.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.6.0-next.0
  - @ledgerhq/live-network@3.0.0-next.0
  - @ledgerhq/live-env@3.0.0-next.0
  - @ledgerhq/types-live@6.117.0-next.0

## 1.19.0

### Minor Changes

- [#19540](https://github.com/LedgerHQ/ledger-live/pull/19540) [`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a) Thanks [@adussarps](https://github.com/adussarps)! - Expose the read-only smart-contract call API on EVM external RPC nodes and explicitly reject it on unsupported coin modules.

- [#19829](https://github.com/LedgerHQ/ledger-live/pull/19829) [`84e1dd9`](https://github.com/LedgerHQ/ledger-live/commit/84e1dd9f8bcba585aba241b0cacb63893af75093) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Refactor Aleo network apiClient and sdkClient to receive coin config directly instead of resolving it via currency lookup, removing redundant currency plumbing throughout the sync/signing paths

- [#19831](https://github.com/LedgerHQ/ledger-live/pull/19831) [`e2e5982`](https://github.com/LedgerHQ/ledger-live/commit/e2e59825b0b216e3b21deb51ae4170486ce7bc4b) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - test: improve aleo integration tests coverage

- [#19731](https://github.com/LedgerHQ/ledger-live/pull/19731) [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7) Thanks [@ysitbon](https://github.com/ysitbon)! - Relocate the token-store accessor imports from `@ledgerhq/cryptoassets/state` onto the wallet-framework port (`@ledgerhq/ledger-wallet-framework/cryptoAssetsStore`). Apps and coin-modules now read `getCryptoAssetsStore` from the framework's injectable singleton; apps inject at bootstrap via `setCryptoAssetsStore` from the same port.

### Patch Changes

- Updated dependencies [[`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7)]:
  - @ledgerhq/types-live@6.116.0
  - @ledgerhq/live-network@2.7.0
  - @ledgerhq/ledger-wallet-framework@2.5.0

## 1.19.0-next.0

### Minor Changes

- [#19540](https://github.com/LedgerHQ/ledger-live/pull/19540) [`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a) Thanks [@adussarps](https://github.com/adussarps)! - Expose the read-only smart-contract call API on EVM external RPC nodes and explicitly reject it on unsupported coin modules.

- [#19829](https://github.com/LedgerHQ/ledger-live/pull/19829) [`84e1dd9`](https://github.com/LedgerHQ/ledger-live/commit/84e1dd9f8bcba585aba241b0cacb63893af75093) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Refactor Aleo network apiClient and sdkClient to receive coin config directly instead of resolving it via currency lookup, removing redundant currency plumbing throughout the sync/signing paths

- [#19831](https://github.com/LedgerHQ/ledger-live/pull/19831) [`e2e5982`](https://github.com/LedgerHQ/ledger-live/commit/e2e59825b0b216e3b21deb51ae4170486ce7bc4b) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - test: improve aleo integration tests coverage

- [#19731](https://github.com/LedgerHQ/ledger-live/pull/19731) [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7) Thanks [@ysitbon](https://github.com/ysitbon)! - Relocate the token-store accessor imports from `@ledgerhq/cryptoassets/state` onto the wallet-framework port (`@ledgerhq/ledger-wallet-framework/cryptoAssetsStore`). Apps and coin-modules now read `getCryptoAssetsStore` from the framework's injectable singleton; apps inject at bootstrap via `setCryptoAssetsStore` from the same port.

### Patch Changes

- Updated dependencies [[`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7)]:
  - @ledgerhq/types-live@6.116.0-next.0
  - @ledgerhq/live-network@2.7.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.5.0-next.0

## 1.18.0

### Minor Changes

- [#19683](https://github.com/LedgerHQ/ledger-live/pull/19683) [`4b73f23`](https://github.com/LedgerHQ/ledger-live/commit/4b73f23260ecc28574f46a7fd0f5cd7627d6d13f) Thanks [@ysitbon](https://github.com/ysitbon)! - Consume currency accessors and currency types from `@ledgerhq/ledger-wallet-framework` instead of `@ledgerhq/cryptoassets`/`@ledgerhq/types-cryptoassets`. Value accessors now resolve through the framework's injected `CurrenciesResolver`; `CryptoCurrency`/`TokenCurrency`/`Unit`/`ExplorerView` types are imported from the framework.

- [#19662](https://github.com/LedgerHQ/ledger-live/pull/19662) [`26e7fbd`](https://github.com/LedgerHQ/ledger-live/commit/26e7fbd02929042b3f32c6d8cb73db6e3d070709) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Extract the Aleo private-send quick amount tier selection logic (Fast/Balanced/Full record boundaries) into `@ledgerhq/coin-aleo` and a shared `useAleoQuickAmountSelector` hook in `@ledgerhq/live-common`, and refactor the desktop QuickAmountSelector to consume it instead of duplicating the logic locally.

- [#19298](https://github.com/LedgerHQ/ledger-live/pull/19298) [`43d4872`](https://github.com/LedgerHQ/ledger-live/commit/43d487261dfb0681b561e4b114b2179acba5e2a8) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo mobile send flow customization

### Patch Changes

- Updated dependencies [[`8f30c75`](https://github.com/LedgerHQ/ledger-live/commit/8f30c75ecb553a720722f1e039b4aec53fce2a87), [`0f85077`](https://github.com/LedgerHQ/ledger-live/commit/0f850774ae3b46fd4a06c0da5762d3d4211b26af), [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d), [`bde85a7`](https://github.com/LedgerHQ/ledger-live/commit/bde85a7ef50cf7990efd2f9bcd7ccc34c0764fb7), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`d631f0d`](https://github.com/LedgerHQ/ledger-live/commit/d631f0dd2480950c5f20dec0c9b4aca515ec63f8), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158)]:
  - @ledgerhq/ledger-wallet-framework@2.4.0
  - @ledgerhq/cryptoassets@13.55.0
  - @ledgerhq/live-env@2.42.0
  - @ledgerhq/types-live@6.115.0
  - @ledgerhq/live-network@2.6.8

## 1.18.0-next.0

### Minor Changes

- [#19683](https://github.com/LedgerHQ/ledger-live/pull/19683) [`4b73f23`](https://github.com/LedgerHQ/ledger-live/commit/4b73f23260ecc28574f46a7fd0f5cd7627d6d13f) Thanks [@ysitbon](https://github.com/ysitbon)! - Consume currency accessors and currency types from `@ledgerhq/ledger-wallet-framework` instead of `@ledgerhq/cryptoassets`/`@ledgerhq/types-cryptoassets`. Value accessors now resolve through the framework's injected `CurrenciesResolver`; `CryptoCurrency`/`TokenCurrency`/`Unit`/`ExplorerView` types are imported from the framework.

- [#19662](https://github.com/LedgerHQ/ledger-live/pull/19662) [`26e7fbd`](https://github.com/LedgerHQ/ledger-live/commit/26e7fbd02929042b3f32c6d8cb73db6e3d070709) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Extract the Aleo private-send quick amount tier selection logic (Fast/Balanced/Full record boundaries) into `@ledgerhq/coin-aleo` and a shared `useAleoQuickAmountSelector` hook in `@ledgerhq/live-common`, and refactor the desktop QuickAmountSelector to consume it instead of duplicating the logic locally.

- [#19298](https://github.com/LedgerHQ/ledger-live/pull/19298) [`43d4872`](https://github.com/LedgerHQ/ledger-live/commit/43d487261dfb0681b561e4b114b2179acba5e2a8) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo mobile send flow customization

### Patch Changes

- Updated dependencies [[`8f30c75`](https://github.com/LedgerHQ/ledger-live/commit/8f30c75ecb553a720722f1e039b4aec53fce2a87), [`0f85077`](https://github.com/LedgerHQ/ledger-live/commit/0f850774ae3b46fd4a06c0da5762d3d4211b26af), [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d), [`bde85a7`](https://github.com/LedgerHQ/ledger-live/commit/bde85a7ef50cf7990efd2f9bcd7ccc34c0764fb7), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`d631f0d`](https://github.com/LedgerHQ/ledger-live/commit/d631f0dd2480950c5f20dec0c9b4aca515ec63f8), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158)]:
  - @ledgerhq/ledger-wallet-framework@2.4.0-next.0
  - @ledgerhq/cryptoassets@13.55.0-next.0
  - @ledgerhq/live-env@2.42.0-next.0
  - @ledgerhq/types-live@6.115.0-next.0
  - @ledgerhq/live-network@2.6.8-next.0

## 1.17.0

### Minor Changes

- [#18922](https://github.com/LedgerHQ/ledger-live/pull/18922) [`1d40088`](https://github.com/LedgerHQ/ledger-live/commit/1d40088e095cc064d9f3020e2fa6dd787aaca671) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo get transaction support for tokens

- [#19145](https://github.com/LedgerHQ/ledger-live/pull/19145) [`1e17c12`](https://github.com/LedgerHQ/ledger-live/commit/1e17c127178a871b665b25d6f4208d4613826dd1) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the per-coin `cli.ts` / `cli-transaction.ts` / `test/cli.ts` (`makeCliTools`) contract from coin families and the `cliTools` field of `FamilySetup`. The only consumer was the `apps/cli` `send` command, and the only e2e path that used it was the EVM ERC20 token approval. That flow is now a dedicated, self-contained `tokenApproval` CLI command; the generic `send` command keeps the cross-family options only.

- [#18967](https://github.com/LedgerHQ/ledger-live/pull/18967) [`43fc364`](https://github.com/LedgerHQ/ledger-live/commit/43fc36426f23a838e2b3c74692dbad29e54b4088) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - added support for Aleo tokens craftTransaction

### Patch Changes

- Updated dependencies [[`6df2017`](https://github.com/LedgerHQ/ledger-live/commit/6df20171a84b54e5b67eabefc938a98d7e3c3e43), [`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff), [`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11), [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d), [`38728f9`](https://github.com/LedgerHQ/ledger-live/commit/38728f9d9ac879c276def56ce88c5e49549e4b9d), [`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec), [`6400154`](https://github.com/LedgerHQ/ledger-live/commit/6400154daa131b225c6ec62c9134f1cd06370729), [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e), [`e6566ff`](https://github.com/LedgerHQ/ledger-live/commit/e6566ff55d95ff36832d5f77899d67d80842f418), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7), [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea), [`7fe5f11`](https://github.com/LedgerHQ/ledger-live/commit/7fe5f1129d6ac218ad274f2187a1a3dd83b8855a), [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc), [`d686e93`](https://github.com/LedgerHQ/ledger-live/commit/d686e93f8a548ff4e9ab3c877ad1f815510b35d9), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`c8b4ee7`](https://github.com/LedgerHQ/ledger-live/commit/c8b4ee77c03ca2117cbad039331b7b52e50d9620), [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4), [`fa0123a`](https://github.com/LedgerHQ/ledger-live/commit/fa0123a1da7b053d58afab498266cf830958e2ff), [`0e30cdc`](https://github.com/LedgerHQ/ledger-live/commit/0e30cdc29d7fb3cab5bf1f2ef7c24cf0a152516e), [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170), [`df96477`](https://github.com/LedgerHQ/ledger-live/commit/df964774bdaccd897e5e7414c172e9c26ff21f67), [`cf3aad1`](https://github.com/LedgerHQ/ledger-live/commit/cf3aad160bd9d2002a3154fbc70018fb1f7a6171), [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8), [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3), [`376915c`](https://github.com/LedgerHQ/ledger-live/commit/376915ca520ecc1708090ed9b3eba1ff7e780540), [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff), [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc), [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55), [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e), [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33), [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a)]:
  - @ledgerhq/cryptoassets@13.54.0
  - @ledgerhq/types-live@6.114.0
  - @ledgerhq/live-env@2.41.0
  - @ledgerhq/ledger-wallet-framework@2.3.0
  - @ledgerhq/types-cryptoassets@7.39.0
  - @ledgerhq/live-promise@0.3.0
  - @ledgerhq/devices@8.17.0
  - @ledgerhq/live-network@2.6.7

## 1.17.0-next.0

### Minor Changes

- [#18922](https://github.com/LedgerHQ/ledger-live/pull/18922) [`1d40088`](https://github.com/LedgerHQ/ledger-live/commit/1d40088e095cc064d9f3020e2fa6dd787aaca671) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo get transaction support for tokens

- [#19145](https://github.com/LedgerHQ/ledger-live/pull/19145) [`1e17c12`](https://github.com/LedgerHQ/ledger-live/commit/1e17c127178a871b665b25d6f4208d4613826dd1) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the per-coin `cli.ts` / `cli-transaction.ts` / `test/cli.ts` (`makeCliTools`) contract from coin families and the `cliTools` field of `FamilySetup`. The only consumer was the `apps/cli` `send` command, and the only e2e path that used it was the EVM ERC20 token approval. That flow is now a dedicated, self-contained `tokenApproval` CLI command; the generic `send` command keeps the cross-family options only.

- [#18967](https://github.com/LedgerHQ/ledger-live/pull/18967) [`43fc364`](https://github.com/LedgerHQ/ledger-live/commit/43fc36426f23a838e2b3c74692dbad29e54b4088) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - added support for Aleo tokens craftTransaction

### Patch Changes

- Updated dependencies [[`6df2017`](https://github.com/LedgerHQ/ledger-live/commit/6df20171a84b54e5b67eabefc938a98d7e3c3e43), [`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff), [`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11), [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d), [`38728f9`](https://github.com/LedgerHQ/ledger-live/commit/38728f9d9ac879c276def56ce88c5e49549e4b9d), [`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec), [`6400154`](https://github.com/LedgerHQ/ledger-live/commit/6400154daa131b225c6ec62c9134f1cd06370729), [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e), [`e6566ff`](https://github.com/LedgerHQ/ledger-live/commit/e6566ff55d95ff36832d5f77899d67d80842f418), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7), [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea), [`7fe5f11`](https://github.com/LedgerHQ/ledger-live/commit/7fe5f1129d6ac218ad274f2187a1a3dd83b8855a), [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc), [`d686e93`](https://github.com/LedgerHQ/ledger-live/commit/d686e93f8a548ff4e9ab3c877ad1f815510b35d9), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`c8b4ee7`](https://github.com/LedgerHQ/ledger-live/commit/c8b4ee77c03ca2117cbad039331b7b52e50d9620), [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4), [`fa0123a`](https://github.com/LedgerHQ/ledger-live/commit/fa0123a1da7b053d58afab498266cf830958e2ff), [`0e30cdc`](https://github.com/LedgerHQ/ledger-live/commit/0e30cdc29d7fb3cab5bf1f2ef7c24cf0a152516e), [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170), [`df96477`](https://github.com/LedgerHQ/ledger-live/commit/df964774bdaccd897e5e7414c172e9c26ff21f67), [`cf3aad1`](https://github.com/LedgerHQ/ledger-live/commit/cf3aad160bd9d2002a3154fbc70018fb1f7a6171), [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8), [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3), [`376915c`](https://github.com/LedgerHQ/ledger-live/commit/376915ca520ecc1708090ed9b3eba1ff7e780540), [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff), [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc), [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55), [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e), [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33), [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a)]:
  - @ledgerhq/cryptoassets@13.54.0-next.0
  - @ledgerhq/types-live@6.114.0-next.0
  - @ledgerhq/live-env@2.41.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.3.0-next.0
  - @ledgerhq/types-cryptoassets@7.39.0-next.0
  - @ledgerhq/live-promise@0.3.0-next.0
  - @ledgerhq/devices@8.17.0-next.0
  - @ledgerhq/live-network@2.6.7-next.0

## 1.16.0

### Minor Changes

- [#18715](https://github.com/LedgerHQ/ledger-live/pull/18715) [`c0c7ec8`](https://github.com/LedgerHQ/ledger-live/commit/c0c7ec86f23220e0167c8d54f13fb1671f94e99d) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add public token transfer intent mapping for Aleo craftTransaction (`transfer_token_public`, `transfer_token_public_to_private`).

- [#18693](https://github.com/LedgerHQ/ledger-live/pull/18693) [`8f52b91`](https://github.com/LedgerHQ/ledger-live/commit/8f52b918486943f9ad75dfa39dc386985ee1a8c5) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat: aleo private tokens utils and adjusted sync flow

- [#18769](https://github.com/LedgerHQ/ledger-live/pull/18769) [`da5c9fa`](https://github.com/LedgerHQ/ledger-live/commit/da5c9fae6d0d31df39b0fc68e4ddccbd6c719dc8) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - small fix to Aleo fee record logic

- [#18596](https://github.com/LedgerHQ/ledger-live/pull/18596) [`2165e75`](https://github.com/LedgerHQ/ledger-live/commit/2165e75054daa2cec7500219067c8e5db7e6e843) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo private tokens sync part 1

- [#18576](https://github.com/LedgerHQ/ledger-live/pull/18576) [`f0f1fa2`](https://github.com/LedgerHQ/ledger-live/commit/f0f1fa217b3e13e109fec8a53a117a49318901fe) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: handle o.closed in aleo signOperation

- [#18520](https://github.com/LedgerHQ/ledger-live/pull/18520) [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the dummy fee-estimation recipient out of `@ledgerhq/cryptoassets` (`abandonseed.ts`, now deleted) into each coin family. Every account bridge now exposes a required `getEstimationRecipient(account)` returning a valid recipient (or throwing for an unmapped currency, like the former `getAbandonSeedAddress`), and the swap layer dispatches through it instead of the central address map.

- [#18638](https://github.com/LedgerHQ/ledger-live/pull/18638) [`f9692f8`](https://github.com/LedgerHQ/ledger-live/commit/f9692f8dcd7af6e22f49ba36e87c2085430db2fc) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Aleo private tokens sync part 2

- [#18661](https://github.com/LedgerHQ/ledger-live/pull/18661) [`6eae9fc`](https://github.com/LedgerHQ/ledger-live/commit/6eae9fceab048a6485c2bcb717c3ea0c386217c8) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - build optimistic operations for aleo token transfers

- [#18723](https://github.com/LedgerHQ/ledger-live/pull/18723) [`fc2d6f1`](https://github.com/LedgerHQ/ledger-live/commit/fc2d6f11277b387d6ed34ba024a23d7608fc254b) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Re-sync from scratch when CAL token list changes (syncHash-based invalidation)

### Patch Changes

- Updated dependencies [[`636a4cb`](https://github.com/LedgerHQ/ledger-live/commit/636a4cbc5ae01364af425e3837cecf1ce4d3f3bc), [`48dbd53`](https://github.com/LedgerHQ/ledger-live/commit/48dbd533a7a505cbb37989f8ce94f273f84bc7d2), [`ad68778`](https://github.com/LedgerHQ/ledger-live/commit/ad68778ad71686c9e4f397276917e606a099f573), [`13aeeb6`](https://github.com/LedgerHQ/ledger-live/commit/13aeeb6186997b433785e542ed1dafa6afde2267), [`1f41eee`](https://github.com/LedgerHQ/ledger-live/commit/1f41eee5b4dc6aa50accd94e5a0d6c98fcf76e23), [`b8a0765`](https://github.com/LedgerHQ/ledger-live/commit/b8a0765d7ac1ac1a60456f9c604e7a694e38bd84), [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934), [`798081d`](https://github.com/LedgerHQ/ledger-live/commit/798081db3e427c8d2d09930ceb836703146ca1ba), [`1f11587`](https://github.com/LedgerHQ/ledger-live/commit/1f11587b4681429aa9be2dc50035f292e0394108), [`ebda9d8`](https://github.com/LedgerHQ/ledger-live/commit/ebda9d88805501f4c2c03fef0fe24f116a8a2a6c), [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292), [`37eba10`](https://github.com/LedgerHQ/ledger-live/commit/37eba10db15542fb7859bafac772e6d280650872), [`ca20506`](https://github.com/LedgerHQ/ledger-live/commit/ca20506c138a1cfb9c254f61e6bb930aea4c6ab8)]:
  - @ledgerhq/types-live@6.113.0
  - @ledgerhq/errors@6.37.0
  - @ledgerhq/live-env@2.40.0
  - @ledgerhq/cryptoassets@13.53.0
  - @ledgerhq/devices@8.16.0
  - @ledgerhq/ledger-wallet-framework@2.2.1
  - @ledgerhq/live-network@2.6.6

## 1.16.0-next.0

### Minor Changes

- [#18715](https://github.com/LedgerHQ/ledger-live/pull/18715) [`c0c7ec8`](https://github.com/LedgerHQ/ledger-live/commit/c0c7ec86f23220e0167c8d54f13fb1671f94e99d) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add public token transfer intent mapping for Aleo craftTransaction (`transfer_token_public`, `transfer_token_public_to_private`).

- [#18693](https://github.com/LedgerHQ/ledger-live/pull/18693) [`8f52b91`](https://github.com/LedgerHQ/ledger-live/commit/8f52b918486943f9ad75dfa39dc386985ee1a8c5) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat: aleo private tokens utils and adjusted sync flow

- [#18769](https://github.com/LedgerHQ/ledger-live/pull/18769) [`da5c9fa`](https://github.com/LedgerHQ/ledger-live/commit/da5c9fae6d0d31df39b0fc68e4ddccbd6c719dc8) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - small fix to Aleo fee record logic

- [#18596](https://github.com/LedgerHQ/ledger-live/pull/18596) [`2165e75`](https://github.com/LedgerHQ/ledger-live/commit/2165e75054daa2cec7500219067c8e5db7e6e843) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo private tokens sync part 1

- [#18576](https://github.com/LedgerHQ/ledger-live/pull/18576) [`f0f1fa2`](https://github.com/LedgerHQ/ledger-live/commit/f0f1fa217b3e13e109fec8a53a117a49318901fe) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: handle o.closed in aleo signOperation

- [#18520](https://github.com/LedgerHQ/ledger-live/pull/18520) [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the dummy fee-estimation recipient out of `@ledgerhq/cryptoassets` (`abandonseed.ts`, now deleted) into each coin family. Every account bridge now exposes a required `getEstimationRecipient(account)` returning a valid recipient (or throwing for an unmapped currency, like the former `getAbandonSeedAddress`), and the swap layer dispatches through it instead of the central address map.

- [#18638](https://github.com/LedgerHQ/ledger-live/pull/18638) [`f9692f8`](https://github.com/LedgerHQ/ledger-live/commit/f9692f8dcd7af6e22f49ba36e87c2085430db2fc) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Aleo private tokens sync part 2

- [#18661](https://github.com/LedgerHQ/ledger-live/pull/18661) [`6eae9fc`](https://github.com/LedgerHQ/ledger-live/commit/6eae9fceab048a6485c2bcb717c3ea0c386217c8) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - build optimistic operations for aleo token transfers

- [#18723](https://github.com/LedgerHQ/ledger-live/pull/18723) [`fc2d6f1`](https://github.com/LedgerHQ/ledger-live/commit/fc2d6f11277b387d6ed34ba024a23d7608fc254b) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Re-sync from scratch when CAL token list changes (syncHash-based invalidation)

### Patch Changes

- Updated dependencies [[`636a4cb`](https://github.com/LedgerHQ/ledger-live/commit/636a4cbc5ae01364af425e3837cecf1ce4d3f3bc), [`48dbd53`](https://github.com/LedgerHQ/ledger-live/commit/48dbd533a7a505cbb37989f8ce94f273f84bc7d2), [`ad68778`](https://github.com/LedgerHQ/ledger-live/commit/ad68778ad71686c9e4f397276917e606a099f573), [`13aeeb6`](https://github.com/LedgerHQ/ledger-live/commit/13aeeb6186997b433785e542ed1dafa6afde2267), [`1f41eee`](https://github.com/LedgerHQ/ledger-live/commit/1f41eee5b4dc6aa50accd94e5a0d6c98fcf76e23), [`b8a0765`](https://github.com/LedgerHQ/ledger-live/commit/b8a0765d7ac1ac1a60456f9c604e7a694e38bd84), [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934), [`798081d`](https://github.com/LedgerHQ/ledger-live/commit/798081db3e427c8d2d09930ceb836703146ca1ba), [`1f11587`](https://github.com/LedgerHQ/ledger-live/commit/1f11587b4681429aa9be2dc50035f292e0394108), [`ebda9d8`](https://github.com/LedgerHQ/ledger-live/commit/ebda9d88805501f4c2c03fef0fe24f116a8a2a6c), [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292), [`37eba10`](https://github.com/LedgerHQ/ledger-live/commit/37eba10db15542fb7859bafac772e6d280650872), [`ca20506`](https://github.com/LedgerHQ/ledger-live/commit/ca20506c138a1cfb9c254f61e6bb930aea4c6ab8)]:
  - @ledgerhq/types-live@6.113.0-next.0
  - @ledgerhq/errors@6.37.0-next.0
  - @ledgerhq/live-env@2.40.0-next.0
  - @ledgerhq/cryptoassets@13.53.0-next.0
  - @ledgerhq/devices@8.16.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.2.1-next.0
  - @ledgerhq/live-network@2.6.6-next.0

## 1.15.0

### Minor Changes

- [#18441](https://github.com/LedgerHQ/ledger-live/pull/18441) [`5e1a944`](https://github.com/LedgerHQ/ledger-live/commit/5e1a944f96531dec46e8d199bce4da3cd0fa12fa) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo getTvk and signOperation integration

- [#18455](https://github.com/LedgerHQ/ledger-live/pull/18455) [`1de6b9a`](https://github.com/LedgerHQ/ledger-live/commit/1de6b9afb239f8a2e2a8c573d661b95a8bcb8260) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo public sync logic for tokens

- [#18415](https://github.com/LedgerHQ/ledger-live/pull/18415) [`0b5a04a`](https://github.com/LedgerHQ/ledger-live/commit/0b5a04ac3a47c6d146b389ddab174c13c84d96e1) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo prepareTransaction with tokens support

- [#18486](https://github.com/LedgerHQ/ledger-live/pull/18486) [`6699b3c`](https://github.com/LedgerHQ/ledger-live/commit/6699b3cb896907abf8912d2d8ef77e2c8a31f7a2) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: aleo utils

- [#18405](https://github.com/LedgerHQ/ledger-live/pull/18405) [`8d77293`](https://github.com/LedgerHQ/ledger-live/commit/8d77293075748d0007872c1bf2b32eb50fad887d) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: prepare aleo utils for incoming tokens integration

- [#18385](https://github.com/LedgerHQ/ledger-live/pull/18385) [`56ccfb9`](https://github.com/LedgerHQ/ledger-live/commit/56ccfb9cf77bf3a1288404bb5d8996ac78736dd2) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo fixtures and base constants extended

### Patch Changes

- Updated dependencies [[`81ceb34`](https://github.com/LedgerHQ/ledger-live/commit/81ceb347c0b2167358c601a9922e2c7fa14a845b), [`9ddf006`](https://github.com/LedgerHQ/ledger-live/commit/9ddf006bc2897a2393f1a9595b3c6a43d0c35bf7), [`b9a2a9e`](https://github.com/LedgerHQ/ledger-live/commit/b9a2a9e5b85f9fb5556ef2de83bd0418e5326e89), [`bfbd74d`](https://github.com/LedgerHQ/ledger-live/commit/bfbd74d47f028d7398e1856c7b18442be3f8f6d7), [`da1c0c8`](https://github.com/LedgerHQ/ledger-live/commit/da1c0c87b3d2540eff9e51c665df8192b4486855), [`031097a`](https://github.com/LedgerHQ/ledger-live/commit/031097ac469c39e4ab475b92d9f6960ebb9a1ad3), [`9ab3a61`](https://github.com/LedgerHQ/ledger-live/commit/9ab3a6157abb3a382c3157eb292ce9d9d2c6df93), [`82a143f`](https://github.com/LedgerHQ/ledger-live/commit/82a143ff527c4a71e2c9ea79babc473ed395b42d), [`93a5bcd`](https://github.com/LedgerHQ/ledger-live/commit/93a5bcd8b7e361148f7bac751d072cc8bcec2cf9), [`e6c617b`](https://github.com/LedgerHQ/ledger-live/commit/e6c617b91062f82f70d020212189a806d2452166), [`04e3349`](https://github.com/LedgerHQ/ledger-live/commit/04e33498ffd5d7a81ad86436a75b1562ca263356), [`eb1dae8`](https://github.com/LedgerHQ/ledger-live/commit/eb1dae8fc14ff8e0bc1e1ce040712492a0328451)]:
  - @ledgerhq/live-env@2.39.0
  - @ledgerhq/types-live@6.112.0
  - @ledgerhq/cryptoassets@13.52.0
  - @ledgerhq/types-cryptoassets@7.38.0
  - @ledgerhq/ledger-wallet-framework@2.2.0
  - @ledgerhq/live-network@2.6.5

## 1.15.0-next.1

### Patch Changes

- Updated dependencies [[`93a5bcd`](https://github.com/LedgerHQ/ledger-live/commit/93a5bcd8b7e361148f7bac751d072cc8bcec2cf9)]:
  - @ledgerhq/cryptoassets@13.52.0-next.1
  - @ledgerhq/types-live@6.112.0-next.1
  - @ledgerhq/ledger-wallet-framework@2.2.0-next.1

## 1.15.0-next.0

### Minor Changes

- [#18441](https://github.com/LedgerHQ/ledger-live/pull/18441) [`5e1a944`](https://github.com/LedgerHQ/ledger-live/commit/5e1a944f96531dec46e8d199bce4da3cd0fa12fa) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo getTvk and signOperation integration

- [#18455](https://github.com/LedgerHQ/ledger-live/pull/18455) [`1de6b9a`](https://github.com/LedgerHQ/ledger-live/commit/1de6b9afb239f8a2e2a8c573d661b95a8bcb8260) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo public sync logic for tokens

- [#18415](https://github.com/LedgerHQ/ledger-live/pull/18415) [`0b5a04a`](https://github.com/LedgerHQ/ledger-live/commit/0b5a04ac3a47c6d146b389ddab174c13c84d96e1) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo prepareTransaction with tokens support

- [#18486](https://github.com/LedgerHQ/ledger-live/pull/18486) [`6699b3c`](https://github.com/LedgerHQ/ledger-live/commit/6699b3cb896907abf8912d2d8ef77e2c8a31f7a2) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: aleo utils

- [#18405](https://github.com/LedgerHQ/ledger-live/pull/18405) [`8d77293`](https://github.com/LedgerHQ/ledger-live/commit/8d77293075748d0007872c1bf2b32eb50fad887d) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: prepare aleo utils for incoming tokens integration

- [#18385](https://github.com/LedgerHQ/ledger-live/pull/18385) [`56ccfb9`](https://github.com/LedgerHQ/ledger-live/commit/56ccfb9cf77bf3a1288404bb5d8996ac78736dd2) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo fixtures and base constants extended

### Patch Changes

- Updated dependencies [[`81ceb34`](https://github.com/LedgerHQ/ledger-live/commit/81ceb347c0b2167358c601a9922e2c7fa14a845b), [`9ddf006`](https://github.com/LedgerHQ/ledger-live/commit/9ddf006bc2897a2393f1a9595b3c6a43d0c35bf7), [`b9a2a9e`](https://github.com/LedgerHQ/ledger-live/commit/b9a2a9e5b85f9fb5556ef2de83bd0418e5326e89), [`bfbd74d`](https://github.com/LedgerHQ/ledger-live/commit/bfbd74d47f028d7398e1856c7b18442be3f8f6d7), [`da1c0c8`](https://github.com/LedgerHQ/ledger-live/commit/da1c0c87b3d2540eff9e51c665df8192b4486855), [`031097a`](https://github.com/LedgerHQ/ledger-live/commit/031097ac469c39e4ab475b92d9f6960ebb9a1ad3), [`9ab3a61`](https://github.com/LedgerHQ/ledger-live/commit/9ab3a6157abb3a382c3157eb292ce9d9d2c6df93), [`82a143f`](https://github.com/LedgerHQ/ledger-live/commit/82a143ff527c4a71e2c9ea79babc473ed395b42d), [`e6c617b`](https://github.com/LedgerHQ/ledger-live/commit/e6c617b91062f82f70d020212189a806d2452166), [`04e3349`](https://github.com/LedgerHQ/ledger-live/commit/04e33498ffd5d7a81ad86436a75b1562ca263356), [`eb1dae8`](https://github.com/LedgerHQ/ledger-live/commit/eb1dae8fc14ff8e0bc1e1ce040712492a0328451)]:
  - @ledgerhq/live-env@2.39.0-next.0
  - @ledgerhq/types-live@6.112.0-next.0
  - @ledgerhq/cryptoassets@13.52.0-next.0
  - @ledgerhq/types-cryptoassets@7.38.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.2.0-next.0
  - @ledgerhq/live-network@2.6.5-next.0

## 1.14.0

### Minor Changes

- [#18030](https://github.com/LedgerHQ/ledger-live/pull/18030) [`b14d5cc`](https://github.com/LedgerHQ/ledger-live/commit/b14d5cc29cc75c6be2e565db3d4d0ab400cc56d9) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: unify aleo node endpoint env

### Patch Changes

- Updated dependencies [[`c606898`](https://github.com/LedgerHQ/ledger-live/commit/c606898e4994768eadd99f2dea9575f92b3f9339), [`9901502`](https://github.com/LedgerHQ/ledger-live/commit/990150200e70bc3ea55c5cfc41e1c77f24cc315b), [`0ebf28c`](https://github.com/LedgerHQ/ledger-live/commit/0ebf28cac81f6f25f356d54c891fab62f328e411), [`d149f27`](https://github.com/LedgerHQ/ledger-live/commit/d149f271f18a1727558fa046aa6bc38c391c2649), [`b14d5cc`](https://github.com/LedgerHQ/ledger-live/commit/b14d5cc29cc75c6be2e565db3d4d0ab400cc56d9), [`d649cf3`](https://github.com/LedgerHQ/ledger-live/commit/d649cf31ecf8b2e18ab78109e6b201ff9766cc33), [`d081ef1`](https://github.com/LedgerHQ/ledger-live/commit/d081ef1892a34fa1751fba4d774867ff11bae20b), [`d19f9de`](https://github.com/LedgerHQ/ledger-live/commit/d19f9debb00e15edbaa7d2cedfcb0d2b5ced4f80), [`ddfb84c`](https://github.com/LedgerHQ/ledger-live/commit/ddfb84cf0caf68cfaba75aa7c015b2029051fe78), [`ec38133`](https://github.com/LedgerHQ/ledger-live/commit/ec38133ab6b2c18d329e1c78320b7c2a1f80fbfc), [`8c0f5f2`](https://github.com/LedgerHQ/ledger-live/commit/8c0f5f22e66aa6a34a3363a256d3da2d98d07dc9), [`cc4dd4d`](https://github.com/LedgerHQ/ledger-live/commit/cc4dd4db5e312da55966a6f0a8daa90e75e4dd94), [`bbc72fe`](https://github.com/LedgerHQ/ledger-live/commit/bbc72fe2ad0cee010349ab3b2e5a1e369dd9e840), [`8c9596d`](https://github.com/LedgerHQ/ledger-live/commit/8c9596de8eeec00f8d660a42448c6eb65c3aa9b2), [`5842a85`](https://github.com/LedgerHQ/ledger-live/commit/5842a85907c7418a393b0dffee756bff52370024)]:
  - @ledgerhq/types-live@6.111.0
  - @ledgerhq/cryptoassets@13.51.0
  - @ledgerhq/ledger-wallet-framework@2.1.0
  - @ledgerhq/live-env@2.38.0
  - @ledgerhq/errors@6.36.0
  - @ledgerhq/live-network@2.6.4
  - @ledgerhq/devices@8.15.1

## 1.14.0-next.0

### Minor Changes

- [#18030](https://github.com/LedgerHQ/ledger-live/pull/18030) [`b14d5cc`](https://github.com/LedgerHQ/ledger-live/commit/b14d5cc29cc75c6be2e565db3d4d0ab400cc56d9) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: unify aleo node endpoint env

### Patch Changes

- Updated dependencies [[`c606898`](https://github.com/LedgerHQ/ledger-live/commit/c606898e4994768eadd99f2dea9575f92b3f9339), [`9901502`](https://github.com/LedgerHQ/ledger-live/commit/990150200e70bc3ea55c5cfc41e1c77f24cc315b), [`0ebf28c`](https://github.com/LedgerHQ/ledger-live/commit/0ebf28cac81f6f25f356d54c891fab62f328e411), [`d149f27`](https://github.com/LedgerHQ/ledger-live/commit/d149f271f18a1727558fa046aa6bc38c391c2649), [`b14d5cc`](https://github.com/LedgerHQ/ledger-live/commit/b14d5cc29cc75c6be2e565db3d4d0ab400cc56d9), [`d649cf3`](https://github.com/LedgerHQ/ledger-live/commit/d649cf31ecf8b2e18ab78109e6b201ff9766cc33), [`d081ef1`](https://github.com/LedgerHQ/ledger-live/commit/d081ef1892a34fa1751fba4d774867ff11bae20b), [`d19f9de`](https://github.com/LedgerHQ/ledger-live/commit/d19f9debb00e15edbaa7d2cedfcb0d2b5ced4f80), [`ddfb84c`](https://github.com/LedgerHQ/ledger-live/commit/ddfb84cf0caf68cfaba75aa7c015b2029051fe78), [`ec38133`](https://github.com/LedgerHQ/ledger-live/commit/ec38133ab6b2c18d329e1c78320b7c2a1f80fbfc), [`8c0f5f2`](https://github.com/LedgerHQ/ledger-live/commit/8c0f5f22e66aa6a34a3363a256d3da2d98d07dc9), [`cc4dd4d`](https://github.com/LedgerHQ/ledger-live/commit/cc4dd4db5e312da55966a6f0a8daa90e75e4dd94), [`bbc72fe`](https://github.com/LedgerHQ/ledger-live/commit/bbc72fe2ad0cee010349ab3b2e5a1e369dd9e840), [`8c9596d`](https://github.com/LedgerHQ/ledger-live/commit/8c9596de8eeec00f8d660a42448c6eb65c3aa9b2), [`5842a85`](https://github.com/LedgerHQ/ledger-live/commit/5842a85907c7418a393b0dffee756bff52370024)]:
  - @ledgerhq/types-live@6.111.0-next.0
  - @ledgerhq/cryptoassets@13.51.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.1.0-next.0
  - @ledgerhq/live-env@2.38.0-next.0
  - @ledgerhq/errors@6.36.0-next.0
  - @ledgerhq/live-network@2.6.4-next.0
  - @ledgerhq/devices@8.15.1-next.0

## 1.13.1

### Patch Changes

- Updated dependencies [[`812538e`](https://github.com/LedgerHQ/ledger-live/commit/812538e1788cf63aa3166d3842f0b27248400690), [`5fc817a`](https://github.com/LedgerHQ/ledger-live/commit/5fc817a5ee316396a327e5b10eccd8314bfb2df5), [`177e07f`](https://github.com/LedgerHQ/ledger-live/commit/177e07ffc6c733b4b9811d6f7dff6b75a106075c), [`44fd893`](https://github.com/LedgerHQ/ledger-live/commit/44fd8931435a52232cfd5abed3fec7a5b275a9be), [`65f87d9`](https://github.com/LedgerHQ/ledger-live/commit/65f87d938ac4158e0ae706593d2a46561097f5a9), [`5e2b764`](https://github.com/LedgerHQ/ledger-live/commit/5e2b76429c0b3024782dc179875a24c5f2655274), [`73afced`](https://github.com/LedgerHQ/ledger-live/commit/73afced223c37efeb24943ffb9cc1ee788b72a6f)]:
  - @ledgerhq/types-live@6.110.0
  - @ledgerhq/cryptoassets@13.50.0
  - @ledgerhq/live-env@2.37.0
  - @ledgerhq/ledger-wallet-framework@2.0.0
  - @ledgerhq/devices@8.15.0
  - @ledgerhq/live-network@2.6.3

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
