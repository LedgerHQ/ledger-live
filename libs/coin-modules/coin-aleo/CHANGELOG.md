# @ledgerhq/coin-aleo

## 1.20.0-next.0

### Minor Changes

- [#19980](https://github.com/LedgerHQ/ledger-live/pull/19980) [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Convert error classes from createCustomErrorClass factory to native extends Error (LIVE-32915 tier 1a)

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f)]:
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

## 1.13.1-next.0

### Patch Changes

- Updated dependencies [[`812538e`](https://github.com/LedgerHQ/ledger-live/commit/812538e1788cf63aa3166d3842f0b27248400690), [`5fc817a`](https://github.com/LedgerHQ/ledger-live/commit/5fc817a5ee316396a327e5b10eccd8314bfb2df5), [`177e07f`](https://github.com/LedgerHQ/ledger-live/commit/177e07ffc6c733b4b9811d6f7dff6b75a106075c), [`44fd893`](https://github.com/LedgerHQ/ledger-live/commit/44fd8931435a52232cfd5abed3fec7a5b275a9be), [`65f87d9`](https://github.com/LedgerHQ/ledger-live/commit/65f87d938ac4158e0ae706593d2a46561097f5a9), [`5e2b764`](https://github.com/LedgerHQ/ledger-live/commit/5e2b76429c0b3024782dc179875a24c5f2655274), [`73afced`](https://github.com/LedgerHQ/ledger-live/commit/73afced223c37efeb24943ffb9cc1ee788b72a6f)]:
  - @ledgerhq/types-live@6.110.0-next.0
  - @ledgerhq/cryptoassets@13.50.0-next.0
  - @ledgerhq/live-env@2.37.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.0.0-next.0
  - @ledgerhq/devices@8.15.0-next.0
  - @ledgerhq/live-network@2.6.3-next.0

## 1.13.0

### Minor Changes

- [#17573](https://github.com/LedgerHQ/ledger-live/pull/17573) [`97349fe`](https://github.com/LedgerHQ/ledger-live/commit/97349fe48706a83d88dafe18a6c080ea56b0df6c) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo sign operation with nested calls

- [#17253](https://github.com/LedgerHQ/ledger-live/pull/17253) [`fe04e44`](https://github.com/LedgerHQ/ledger-live/commit/fe04e44e0cd41ea9dd896defcea18c010fe36490) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - chore(ADR-025): rename `AlpacaApi` -> `CoinModuleApi`

### Patch Changes

- Updated dependencies [[`839537d`](https://github.com/LedgerHQ/ledger-live/commit/839537d42f9c2bf87ad0faf64e51966250976055), [`ef47541`](https://github.com/LedgerHQ/ledger-live/commit/ef47541f67995474a82446c416e0825623b5d063), [`a04a4c0`](https://github.com/LedgerHQ/ledger-live/commit/a04a4c0a8bbee5140f685836014409e98af33d02), [`9b75461`](https://github.com/LedgerHQ/ledger-live/commit/9b754610e67e4d31d3d49b566ba1590194265c6f), [`822bc92`](https://github.com/LedgerHQ/ledger-live/commit/822bc92945248ddd31304aa7ca90854c849d217f), [`2eabd7f`](https://github.com/LedgerHQ/ledger-live/commit/2eabd7f56680e1399926a96b4bdeaf628e435999), [`62ec3e5`](https://github.com/LedgerHQ/ledger-live/commit/62ec3e5917ceee80c0384eea6ee0901faa58b08a), [`9ccd154`](https://github.com/LedgerHQ/ledger-live/commit/9ccd1540f6ea912107d9651fa9b66ffd12948111), [`603f343`](https://github.com/LedgerHQ/ledger-live/commit/603f343d64c9b69a5708b419eb7ebfe7cec94554), [`a61f904`](https://github.com/LedgerHQ/ledger-live/commit/a61f90478795bff6956d2a9083ec47d44e6e9a46), [`5de991c`](https://github.com/LedgerHQ/ledger-live/commit/5de991c8686f473d2323b9c6536c53b7badf5f3d)]:
  - @ledgerhq/cryptoassets@13.49.0
  - @ledgerhq/types-cryptoassets@7.37.0
  - @ledgerhq/types-live@6.109.0
  - @ledgerhq/ledger-wallet-framework@1.6.0
  - @ledgerhq/live-env@2.36.0
  - @ledgerhq/live-network@2.6.2

## 1.13.0-next.0

### Minor Changes

- [#17573](https://github.com/LedgerHQ/ledger-live/pull/17573) [`97349fe`](https://github.com/LedgerHQ/ledger-live/commit/97349fe48706a83d88dafe18a6c080ea56b0df6c) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo sign operation with nested calls

- [#17253](https://github.com/LedgerHQ/ledger-live/pull/17253) [`fe04e44`](https://github.com/LedgerHQ/ledger-live/commit/fe04e44e0cd41ea9dd896defcea18c010fe36490) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - chore(ADR-025): rename `AlpacaApi` -> `CoinModuleApi`

### Patch Changes

- Updated dependencies [[`839537d`](https://github.com/LedgerHQ/ledger-live/commit/839537d42f9c2bf87ad0faf64e51966250976055), [`ef47541`](https://github.com/LedgerHQ/ledger-live/commit/ef47541f67995474a82446c416e0825623b5d063), [`a04a4c0`](https://github.com/LedgerHQ/ledger-live/commit/a04a4c0a8bbee5140f685836014409e98af33d02), [`9b75461`](https://github.com/LedgerHQ/ledger-live/commit/9b754610e67e4d31d3d49b566ba1590194265c6f), [`822bc92`](https://github.com/LedgerHQ/ledger-live/commit/822bc92945248ddd31304aa7ca90854c849d217f), [`2eabd7f`](https://github.com/LedgerHQ/ledger-live/commit/2eabd7f56680e1399926a96b4bdeaf628e435999), [`62ec3e5`](https://github.com/LedgerHQ/ledger-live/commit/62ec3e5917ceee80c0384eea6ee0901faa58b08a), [`9ccd154`](https://github.com/LedgerHQ/ledger-live/commit/9ccd1540f6ea912107d9651fa9b66ffd12948111), [`603f343`](https://github.com/LedgerHQ/ledger-live/commit/603f343d64c9b69a5708b419eb7ebfe7cec94554), [`a61f904`](https://github.com/LedgerHQ/ledger-live/commit/a61f90478795bff6956d2a9083ec47d44e6e9a46), [`5de991c`](https://github.com/LedgerHQ/ledger-live/commit/5de991c8686f473d2323b9c6536c53b7badf5f3d)]:
  - @ledgerhq/cryptoassets@13.49.0-next.0
  - @ledgerhq/types-cryptoassets@7.37.0-next.0
  - @ledgerhq/types-live@6.109.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.6.0-next.0
  - @ledgerhq/live-env@2.36.0-next.0
  - @ledgerhq/live-network@2.6.2-next.0

## 1.12.0

### Minor Changes

- [#17164](https://github.com/LedgerHQ/ledger-live/pull/17164) [`6a50a01`](https://github.com/LedgerHQ/ledger-live/commit/6a50a01fb073cec9c9c77d57f14106c4909a815d) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Support multi-record private transfer intents in coin-aleo

- [#17206](https://github.com/LedgerHQ/ledger-live/pull/17206) [`3c3f0cc`](https://github.com/LedgerHQ/ledger-live/commit/3c3f0cc853ee29278eb2ce3fd78ba27aca75f761) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: ignore unnecessary aleo transitions in listOperations

- [#17088](https://github.com/LedgerHQ/ledger-live/pull/17088) [`a1deb69`](https://github.com/LedgerHQ/ledger-live/commit/a1deb694261add0d43446b13ee3363e5ab8a882b) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: support validation for more than one aleo record

- [#17248](https://github.com/LedgerHQ/ledger-live/pull/17248) [`5d6707e`](https://github.com/LedgerHQ/ledger-live/commit/5d6707e03dfc469193865d12c877f209ab977d2a) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add an Aleo `enableTokens` config flag.

- [#17187](https://github.com/LedgerHQ/ledger-live/pull/17187) [`729b3b4`](https://github.com/LedgerHQ/ledger-live/commit/729b3b481f0e5db3a0a795e99af9863d5c4f44b2) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - updated stepAmount for Aleo

### Patch Changes

- Updated dependencies [[`f39fede`](https://github.com/LedgerHQ/ledger-live/commit/f39fede0a6eb4e427a15219e5a3c8fbc3302815f), [`b812751`](https://github.com/LedgerHQ/ledger-live/commit/b8127519474e63c543b1b937a2d3b11ad162a78e), [`3b746ee`](https://github.com/LedgerHQ/ledger-live/commit/3b746eea7f3f2be633947e8e9112987457c864a5), [`1368afd`](https://github.com/LedgerHQ/ledger-live/commit/1368afdc7218a68c803672e6e412f8f9f6e62142), [`abdb866`](https://github.com/LedgerHQ/ledger-live/commit/abdb8662fba3784399a747ece63a11cc4f6e23bb), [`5177d5e`](https://github.com/LedgerHQ/ledger-live/commit/5177d5e6311047cc7485a66dbcb8971c9a8c0a5c), [`3cd7abb`](https://github.com/LedgerHQ/ledger-live/commit/3cd7abb4d6f6072bad62073108d797faf23f9e8c), [`c6170d7`](https://github.com/LedgerHQ/ledger-live/commit/c6170d7b61bc37ef80f8d3e5e608611f9b8ecd67), [`912e673`](https://github.com/LedgerHQ/ledger-live/commit/912e673368baa0342316c882653768d570b71262), [`6e832a0`](https://github.com/LedgerHQ/ledger-live/commit/6e832a044bd7abb704f0a45ea782e55c1b25487c), [`2257d43`](https://github.com/LedgerHQ/ledger-live/commit/2257d43630933127549300f39ade1e2b01f94cb8), [`08762c2`](https://github.com/LedgerHQ/ledger-live/commit/08762c286e38136293108c19efa72ae8fbd1286b)]:
  - @ledgerhq/types-live@6.108.0
  - @ledgerhq/ledger-wallet-framework@1.5.0
  - @ledgerhq/cryptoassets@13.48.0
  - @ledgerhq/live-env@2.35.0
  - @ledgerhq/live-network@2.6.1

## 1.12.0-next.0

### Minor Changes

- [#17164](https://github.com/LedgerHQ/ledger-live/pull/17164) [`6a50a01`](https://github.com/LedgerHQ/ledger-live/commit/6a50a01fb073cec9c9c77d57f14106c4909a815d) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Support multi-record private transfer intents in coin-aleo

- [#17206](https://github.com/LedgerHQ/ledger-live/pull/17206) [`3c3f0cc`](https://github.com/LedgerHQ/ledger-live/commit/3c3f0cc853ee29278eb2ce3fd78ba27aca75f761) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: ignore unnecessary aleo transitions in listOperations

- [#17088](https://github.com/LedgerHQ/ledger-live/pull/17088) [`a1deb69`](https://github.com/LedgerHQ/ledger-live/commit/a1deb694261add0d43446b13ee3363e5ab8a882b) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: support validation for more than one aleo record

- [#17248](https://github.com/LedgerHQ/ledger-live/pull/17248) [`5d6707e`](https://github.com/LedgerHQ/ledger-live/commit/5d6707e03dfc469193865d12c877f209ab977d2a) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add an Aleo `enableTokens` config flag.

- [#17187](https://github.com/LedgerHQ/ledger-live/pull/17187) [`729b3b4`](https://github.com/LedgerHQ/ledger-live/commit/729b3b481f0e5db3a0a795e99af9863d5c4f44b2) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - updated stepAmount for Aleo

### Patch Changes

- Updated dependencies [[`f39fede`](https://github.com/LedgerHQ/ledger-live/commit/f39fede0a6eb4e427a15219e5a3c8fbc3302815f), [`b812751`](https://github.com/LedgerHQ/ledger-live/commit/b8127519474e63c543b1b937a2d3b11ad162a78e), [`3b746ee`](https://github.com/LedgerHQ/ledger-live/commit/3b746eea7f3f2be633947e8e9112987457c864a5), [`1368afd`](https://github.com/LedgerHQ/ledger-live/commit/1368afdc7218a68c803672e6e412f8f9f6e62142), [`abdb866`](https://github.com/LedgerHQ/ledger-live/commit/abdb8662fba3784399a747ece63a11cc4f6e23bb), [`5177d5e`](https://github.com/LedgerHQ/ledger-live/commit/5177d5e6311047cc7485a66dbcb8971c9a8c0a5c), [`3cd7abb`](https://github.com/LedgerHQ/ledger-live/commit/3cd7abb4d6f6072bad62073108d797faf23f9e8c), [`c6170d7`](https://github.com/LedgerHQ/ledger-live/commit/c6170d7b61bc37ef80f8d3e5e608611f9b8ecd67), [`912e673`](https://github.com/LedgerHQ/ledger-live/commit/912e673368baa0342316c882653768d570b71262), [`6e832a0`](https://github.com/LedgerHQ/ledger-live/commit/6e832a044bd7abb704f0a45ea782e55c1b25487c), [`2257d43`](https://github.com/LedgerHQ/ledger-live/commit/2257d43630933127549300f39ade1e2b01f94cb8), [`08762c2`](https://github.com/LedgerHQ/ledger-live/commit/08762c286e38136293108c19efa72ae8fbd1286b)]:
  - @ledgerhq/types-live@6.108.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.5.0-next.0
  - @ledgerhq/cryptoassets@13.48.0-next.0
  - @ledgerhq/live-env@2.35.0-next.0
  - @ledgerhq/live-network@2.6.1-next.0

## 1.11.0

### Minor Changes

- [#16680](https://github.com/LedgerHQ/ledger-live/pull/16680) [`2a9b637`](https://github.com/LedgerHQ/ledger-live/commit/2a9b637916076295e048a43e9e4613693e0fc674) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: auto-recover aleo account from 422 error from record scanner
  fix: add missing retry button to private sync step in aleo send flows

- [#16712](https://github.com/LedgerHQ/ledger-live/pull/16712) [`c48ebba`](https://github.com/LedgerHQ/ledger-live/commit/c48ebba05aa578c7c25e6bf30c469b6ffba6ac01) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - added filters to owned records api calls for Aleo

- [#16675](https://github.com/LedgerHQ/ledger-live/pull/16675) [`054a8e8`](https://github.com/LedgerHQ/ledger-live/commit/054a8e8c7d4e1be511232a53a015d0bcc111e62e) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - extended private sync progress tracking for Aleo

- [#16877](https://github.com/LedgerHQ/ledger-live/pull/16877) [`cb0987a`](https://github.com/LedgerHQ/ledger-live/commit/cb0987a8dcad760c194838a61a6675535cee67c9) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: algorithm for aleo auto record picking

- [#16905](https://github.com/LedgerHQ/ledger-live/pull/16905) [`add6026`](https://github.com/LedgerHQ/ledger-live/commit/add60262f879ec9288802a687f31fcc476b81ff9) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add Aleo record-picking strategy config and update send back-navigation behavior

- [#16236](https://github.com/LedgerHQ/ledger-live/pull/16236) [`802a58c`](https://github.com/LedgerHQ/ledger-live/commit/802a58c742513f73322deb5777b804674c33e529) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Refactor Aleo private record enrichment to reuse existing transition types, simplify outgoing transfer handling, and keep semi-private history sync behavior clearer and safer.

- [#17028](https://github.com/LedgerHQ/ledger-live/pull/17028) [`465447d`](https://github.com/LedgerHQ/ledger-live/commit/465447d5227e2ee395f9507d846b3b2aa54899cf) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - feat: migrate aleo private transaction field to amountRecordCommitments

- [#17063](https://github.com/LedgerHQ/ledger-live/pull/17063) [`f65aae9`](https://github.com/LedgerHQ/ledger-live/commit/f65aae969b9cfde47c7cd52a8af6789fbab032e2) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - getEstimatedSigningTime util function for Aleo

- [#16900](https://github.com/LedgerHQ/ledger-live/pull/16900) [`ca0b7ff`](https://github.com/LedgerHQ/ledger-live/commit/ca0b7ff2fe93d465e05282356ffabd3b1b544b3d) Thanks [@henri-ly](https://github.com/henri-ly)! - add error on broadcast

- [#17068](https://github.com/LedgerHQ/ledger-live/pull/17068) [`bc980b8`](https://github.com/LedgerHQ/ledger-live/commit/bc980b842addd8b1d2a76d19383ab6ae06ae9aab) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: support auto record picking strategy in aleo prepareTransaction

- [#17083](https://github.com/LedgerHQ/ledger-live/pull/17083) [`ce84add`](https://github.com/LedgerHQ/ledger-live/commit/ce84addfa3a9c955ea20f1f5ac4d7b959893c580) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: aleo typecheck

### Patch Changes

- Updated dependencies [[`ed0dc8a`](https://github.com/LedgerHQ/ledger-live/commit/ed0dc8abc2c8f5054e655c4e12efe6fb433fbaca), [`4ddd97a`](https://github.com/LedgerHQ/ledger-live/commit/4ddd97a99bab5b581ad5ccfd36eb420ec4ee6352), [`7fafa10`](https://github.com/LedgerHQ/ledger-live/commit/7fafa10d8af581f4433a60ea908980a726d3a777), [`ac26c8b`](https://github.com/LedgerHQ/ledger-live/commit/ac26c8bffa9b5cc9f28bed5ce3d44e32982d655c), [`fb79639`](https://github.com/LedgerHQ/ledger-live/commit/fb79639eb81258bae4830ed6ffe375ae625054ad), [`0d11df6`](https://github.com/LedgerHQ/ledger-live/commit/0d11df6ef8dc781171071824ad1c39e3beed7730), [`b866ea6`](https://github.com/LedgerHQ/ledger-live/commit/b866ea67bcbd408a33dbc9233ef55298e2a8ef25), [`321a0e2`](https://github.com/LedgerHQ/ledger-live/commit/321a0e2ce948fac11f7bdf0e106eb0af57168caa), [`d308b1a`](https://github.com/LedgerHQ/ledger-live/commit/d308b1a6b9c629839f051cf367a527f4232120c7), [`21e69fe`](https://github.com/LedgerHQ/ledger-live/commit/21e69fea49cffc0b1204903e539a64b83e4b28f0), [`e6dc658`](https://github.com/LedgerHQ/ledger-live/commit/e6dc658b83ebd2102e19a1fead021443457c05d9), [`fb4d165`](https://github.com/LedgerHQ/ledger-live/commit/fb4d1656be8dc8e933e55600970a2e991fbaeebb), [`5bd95a9`](https://github.com/LedgerHQ/ledger-live/commit/5bd95a9ceaac4d08c87d635f721265357368f8ee), [`73bfe05`](https://github.com/LedgerHQ/ledger-live/commit/73bfe055ec23e0d630f2da9f4dbc9731b6fe5190)]:
  - @ledgerhq/types-live@6.107.0
  - @ledgerhq/ledger-wallet-framework@1.4.0
  - @ledgerhq/live-env@2.34.0
  - @ledgerhq/errors@6.35.0
  - @ledgerhq/cryptoassets@13.47.0
  - @ledgerhq/live-network@2.6.0
  - @ledgerhq/devices@8.14.2

## 1.11.0-next.1

### Patch Changes

- Updated dependencies [[`e6dc658`](https://github.com/LedgerHQ/ledger-live/commit/e6dc658b83ebd2102e19a1fead021443457c05d9)]:
  - @ledgerhq/cryptoassets@13.47.0-next.1
  - @ledgerhq/ledger-wallet-framework@1.4.0-next.1

## 1.11.0-next.0

### Minor Changes

- [#16680](https://github.com/LedgerHQ/ledger-live/pull/16680) [`2a9b637`](https://github.com/LedgerHQ/ledger-live/commit/2a9b637916076295e048a43e9e4613693e0fc674) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: auto-recover aleo account from 422 error from record scanner
  fix: add missing retry button to private sync step in aleo send flows

- [#16712](https://github.com/LedgerHQ/ledger-live/pull/16712) [`c48ebba`](https://github.com/LedgerHQ/ledger-live/commit/c48ebba05aa578c7c25e6bf30c469b6ffba6ac01) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - added filters to owned records api calls for Aleo

- [#16675](https://github.com/LedgerHQ/ledger-live/pull/16675) [`054a8e8`](https://github.com/LedgerHQ/ledger-live/commit/054a8e8c7d4e1be511232a53a015d0bcc111e62e) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - extended private sync progress tracking for Aleo

- [#16877](https://github.com/LedgerHQ/ledger-live/pull/16877) [`cb0987a`](https://github.com/LedgerHQ/ledger-live/commit/cb0987a8dcad760c194838a61a6675535cee67c9) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: algorithm for aleo auto record picking

- [#16905](https://github.com/LedgerHQ/ledger-live/pull/16905) [`add6026`](https://github.com/LedgerHQ/ledger-live/commit/add60262f879ec9288802a687f31fcc476b81ff9) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add Aleo record-picking strategy config and update send back-navigation behavior

- [#16236](https://github.com/LedgerHQ/ledger-live/pull/16236) [`802a58c`](https://github.com/LedgerHQ/ledger-live/commit/802a58c742513f73322deb5777b804674c33e529) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Refactor Aleo private record enrichment to reuse existing transition types, simplify outgoing transfer handling, and keep semi-private history sync behavior clearer and safer.

- [#17028](https://github.com/LedgerHQ/ledger-live/pull/17028) [`465447d`](https://github.com/LedgerHQ/ledger-live/commit/465447d5227e2ee395f9507d846b3b2aa54899cf) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - feat: migrate aleo private transaction field to amountRecordCommitments

- [#17063](https://github.com/LedgerHQ/ledger-live/pull/17063) [`f65aae9`](https://github.com/LedgerHQ/ledger-live/commit/f65aae969b9cfde47c7cd52a8af6789fbab032e2) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - getEstimatedSigningTime util function for Aleo

- [#16900](https://github.com/LedgerHQ/ledger-live/pull/16900) [`ca0b7ff`](https://github.com/LedgerHQ/ledger-live/commit/ca0b7ff2fe93d465e05282356ffabd3b1b544b3d) Thanks [@henri-ly](https://github.com/henri-ly)! - add error on broadcast

- [#17068](https://github.com/LedgerHQ/ledger-live/pull/17068) [`bc980b8`](https://github.com/LedgerHQ/ledger-live/commit/bc980b842addd8b1d2a76d19383ab6ae06ae9aab) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: support auto record picking strategy in aleo prepareTransaction

- [#17083](https://github.com/LedgerHQ/ledger-live/pull/17083) [`ce84add`](https://github.com/LedgerHQ/ledger-live/commit/ce84addfa3a9c955ea20f1f5ac4d7b959893c580) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: aleo typecheck

### Patch Changes

- Updated dependencies [[`ed0dc8a`](https://github.com/LedgerHQ/ledger-live/commit/ed0dc8abc2c8f5054e655c4e12efe6fb433fbaca), [`4ddd97a`](https://github.com/LedgerHQ/ledger-live/commit/4ddd97a99bab5b581ad5ccfd36eb420ec4ee6352), [`7fafa10`](https://github.com/LedgerHQ/ledger-live/commit/7fafa10d8af581f4433a60ea908980a726d3a777), [`ac26c8b`](https://github.com/LedgerHQ/ledger-live/commit/ac26c8bffa9b5cc9f28bed5ce3d44e32982d655c), [`fb79639`](https://github.com/LedgerHQ/ledger-live/commit/fb79639eb81258bae4830ed6ffe375ae625054ad), [`0d11df6`](https://github.com/LedgerHQ/ledger-live/commit/0d11df6ef8dc781171071824ad1c39e3beed7730), [`b866ea6`](https://github.com/LedgerHQ/ledger-live/commit/b866ea67bcbd408a33dbc9233ef55298e2a8ef25), [`321a0e2`](https://github.com/LedgerHQ/ledger-live/commit/321a0e2ce948fac11f7bdf0e106eb0af57168caa), [`d308b1a`](https://github.com/LedgerHQ/ledger-live/commit/d308b1a6b9c629839f051cf367a527f4232120c7), [`21e69fe`](https://github.com/LedgerHQ/ledger-live/commit/21e69fea49cffc0b1204903e539a64b83e4b28f0), [`fb4d165`](https://github.com/LedgerHQ/ledger-live/commit/fb4d1656be8dc8e933e55600970a2e991fbaeebb), [`5bd95a9`](https://github.com/LedgerHQ/ledger-live/commit/5bd95a9ceaac4d08c87d635f721265357368f8ee), [`73bfe05`](https://github.com/LedgerHQ/ledger-live/commit/73bfe055ec23e0d630f2da9f4dbc9731b6fe5190)]:
  - @ledgerhq/types-live@6.107.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.4.0-next.0
  - @ledgerhq/live-env@2.34.0-next.0
  - @ledgerhq/errors@6.35.0-next.0
  - @ledgerhq/cryptoassets@13.47.0-next.0
  - @ledgerhq/live-network@2.6.0-next.0
  - @ledgerhq/devices@8.14.2-next.0

## 1.10.2

### Patch Changes

- Updated dependencies [[`202cc42`](https://github.com/LedgerHQ/ledger-live/commit/202cc423b09662b5b25012b84124aecd4dc7245d)]:
  - @ledgerhq/errors@6.34.1
  - @ledgerhq/ledger-wallet-framework@1.3.2
  - @ledgerhq/cryptoassets@13.46.2
  - @ledgerhq/devices@8.14.2
  - @ledgerhq/live-network@2.5.2

## 1.10.2-hotfix.0

### Patch Changes

- Updated dependencies [[`202cc42`](https://github.com/LedgerHQ/ledger-live/commit/202cc423b09662b5b25012b84124aecd4dc7245d)]:
  - @ledgerhq/errors@6.34.1-hotfix.0
  - @ledgerhq/ledger-wallet-framework@1.3.2-hotfix.0
  - @ledgerhq/cryptoassets@13.46.2-hotfix.0
  - @ledgerhq/devices@8.14.2-hotfix.0
  - @ledgerhq/live-network@2.5.2-hotfix.0

## 1.10.1

### Patch Changes

- Updated dependencies [[`fbff5f4`](https://github.com/LedgerHQ/ledger-live/commit/fbff5f407027cb2b24834fea53ef21a3ef93bf95), [`e377079`](https://github.com/LedgerHQ/ledger-live/commit/e3770793670b73d4409bd5be2081ca922e8679ac), [`45e134c`](https://github.com/LedgerHQ/ledger-live/commit/45e134c63f204444a5997109f4807447f51469ee)]:
  - @ledgerhq/types-live@6.106.0
  - @ledgerhq/ledger-wallet-framework@1.3.1
  - @ledgerhq/cryptoassets@13.46.1

## 1.10.1-next.0

### Patch Changes

- Updated dependencies [[`fbff5f4`](https://github.com/LedgerHQ/ledger-live/commit/fbff5f407027cb2b24834fea53ef21a3ef93bf95), [`e377079`](https://github.com/LedgerHQ/ledger-live/commit/e3770793670b73d4409bd5be2081ca922e8679ac), [`45e134c`](https://github.com/LedgerHQ/ledger-live/commit/45e134c63f204444a5997109f4807447f51469ee)]:
  - @ledgerhq/types-live@6.106.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.3.1-next.0
  - @ledgerhq/cryptoassets@13.46.1-next.0

## 1.10.0

### Minor Changes

- [#16297](https://github.com/LedgerHQ/ledger-live/pull/16297) [`edffff8`](https://github.com/LedgerHQ/ledger-live/commit/edffff80b500e50cd30311a79ac7590f81546c59) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: add missing log for invalid aleo raw tx details

- [#15887](https://github.com/LedgerHQ/ledger-live/pull/15887) [`5fefc2e`](https://github.com/LedgerHQ/ledger-live/commit/5fefc2e6a4c6e4fdcaae0139f2f8d6f9011b33c8) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Remove @ledgerhq/types-cryptoassets dependency from coin-framework by replacing CryptoCurrency parameters with currencyId strings in CoinConfig and getCurrencyConfiguration

- [#16045](https://github.com/LedgerHQ/ledger-live/pull/16045) [`f9d1e38`](https://github.com/LedgerHQ/ledger-live/commit/f9d1e389082a3e13a4988cfc342e86f7c592bbc3) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - changes to aleo self transfer flow

- [#16307](https://github.com/LedgerHQ/ledger-live/pull/16307) [`8733fc5`](https://github.com/LedgerHQ/ledger-live/commit/8733fc55b61d0c76776674f80b9899344da38508) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - chore: remove unused nodeUrl from coin-aleo config
  fix: optimize private balance calculation in coin-aleo
  fix: aleo pending operation is removed too early

- [#16273](https://github.com/LedgerHQ/ledger-live/pull/16273) [`a95484e`](https://github.com/LedgerHQ/ledger-live/commit/a95484ef0a49cfdfae610a7e734899389cd236b8) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: temporary workaround for missing config in deviceTransactionConfig.ts

- [#15823](https://github.com/LedgerHQ/ledger-live/pull/15823) [`24656de`](https://github.com/LedgerHQ/ledger-live/commit/24656dea461d4d99dcb5f5e2e4b4e949b0823eeb) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Reduce redundant eth_call calls to node by implementing includeAssets from BalanceOptions

- [#16149](https://github.com/LedgerHQ/ledger-live/pull/16149) [`750e564`](https://github.com/LedgerHQ/ledger-live/commit/750e564d8b0fa25608dc3a3766159c2dca892d2c) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo provable api status endpoint error handling

- [#16043](https://github.com/LedgerHQ/ledger-live/pull/16043) [`7baf75d`](https://github.com/LedgerHQ/ledger-live/commit/7baf75d216d420c8bdfecd587a299a60814edffc) Thanks [@0xMM-L](https://github.com/0xMM-L)! - Handle fee sponsoring for private transfers

- [#15679](https://github.com/LedgerHQ/ledger-live/pull/15679) [`c353f29`](https://github.com/LedgerHQ/ledger-live/commit/c353f29b9174c20c708662c160f55c597020ee58) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - chore(coin-modules): add oxfmt with shared config (Prettier parity)

  - Add libs/coin-modules/.oxfmtrc.json aligned with root .prettierrc and desktop/mobile oxfmt
  - Add format, format:check, and run oxfmt before oxlint in lint:fix; add oxfmt devDependency
  - Remove coin-ton prettier script; turbo format/format:check tasks
  - Initial oxfmt pass on src

- [#16233](https://github.com/LedgerHQ/ledger-live/pull/16233) [`f36e748`](https://github.com/LedgerHQ/ledger-live/commit/f36e74881c03a25164c0eac24b13765bbbbbb440) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: enable aleo encrypted prove + remove jwt management

- [#16184](https://github.com/LedgerHQ/ledger-live/pull/16184) [`f9c30a8`](https://github.com/LedgerHQ/ledger-live/commit/f9c30a86fcc8b1cc75149c7c8df2a5e166754226) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add fee records errors in cases when fee record is insufficient and only one record present

- [#16112](https://github.com/LedgerHQ/ledger-live/pull/16112) [`02bc6dc`](https://github.com/LedgerHQ/ledger-live/commit/02bc6dc47314be74eba9f4855d7f6c3a54f29ad7) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Fix for private transaction send amount validation

- [#15798](https://github.com/LedgerHQ/ledger-live/pull/15798) [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore: use `coin-module-framework` from npmjs and remove the now migrated `coin-framework`

- [#16287](https://github.com/LedgerHQ/ledger-live/pull/16287) [`9bc46de`](https://github.com/LedgerHQ/ledger-live/commit/9bc46de7716aa3a942b6c27593639db40b04277d) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: avoid unnecessary aleo syncs with postSync clean up

- [#16285](https://github.com/LedgerHQ/ledger-live/pull/16285) [`3929c6e`](https://github.com/LedgerHQ/ledger-live/commit/3929c6e5dce8affbb433fb4ef7158a9af297d9ee) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - added missing record pagination for aleo

### Patch Changes

- Updated dependencies [[`ad5a37d`](https://github.com/LedgerHQ/ledger-live/commit/ad5a37d077dced734defcd464f120825e7bbf5e9), [`2d5c7e0`](https://github.com/LedgerHQ/ledger-live/commit/2d5c7e0cc27f45babe247b39b513d4e848707b01), [`78acbfa`](https://github.com/LedgerHQ/ledger-live/commit/78acbfae7319c5b3fb1453f8727e2210e895669c), [`1bd0cac`](https://github.com/LedgerHQ/ledger-live/commit/1bd0cac7957422fa06e18424e9e2706c39072078), [`7aa0706`](https://github.com/LedgerHQ/ledger-live/commit/7aa070618866e7a4c70876e674f07fde9630ccfb), [`3b83607`](https://github.com/LedgerHQ/ledger-live/commit/3b83607a045142a8408784c92b57d8bde01445df), [`24656de`](https://github.com/LedgerHQ/ledger-live/commit/24656dea461d4d99dcb5f5e2e4b4e949b0823eeb), [`c910c1b`](https://github.com/LedgerHQ/ledger-live/commit/c910c1bd9b4f7fbcc0e33fe19b33da44085ab7f9), [`139cdbf`](https://github.com/LedgerHQ/ledger-live/commit/139cdbfd48120247ff54f5f7863ce866a6a755d0), [`4cf9b8c`](https://github.com/LedgerHQ/ledger-live/commit/4cf9b8cde388aebfe04a894e9a35584856d1713d), [`97d7278`](https://github.com/LedgerHQ/ledger-live/commit/97d727824cef6a5b5a2d034d9b029e4f977f1754), [`63b5b9a`](https://github.com/LedgerHQ/ledger-live/commit/63b5b9a3f3b88fa41f02983350cdb6e73a887839), [`f36e748`](https://github.com/LedgerHQ/ledger-live/commit/f36e74881c03a25164c0eac24b13765bbbbbb440), [`46e78cf`](https://github.com/LedgerHQ/ledger-live/commit/46e78cf3a057a9de39a5abbb49fe779655db6507), [`cd59c95`](https://github.com/LedgerHQ/ledger-live/commit/cd59c95d04bd886114802ca887e1209d2191eaee), [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21)]:
  - @ledgerhq/cryptoassets@13.46.0
  - @ledgerhq/types-live@6.105.0
  - @ledgerhq/live-env@2.33.0
  - @ledgerhq/ledger-wallet-framework@1.3.0
  - @ledgerhq/errors@6.34.0
  - @ledgerhq/live-network@2.5.1
  - @ledgerhq/devices@8.14.1

## 1.10.0-next.0

### Minor Changes

- [#16297](https://github.com/LedgerHQ/ledger-live/pull/16297) [`edffff8`](https://github.com/LedgerHQ/ledger-live/commit/edffff80b500e50cd30311a79ac7590f81546c59) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: add missing log for invalid aleo raw tx details

- [#15887](https://github.com/LedgerHQ/ledger-live/pull/15887) [`5fefc2e`](https://github.com/LedgerHQ/ledger-live/commit/5fefc2e6a4c6e4fdcaae0139f2f8d6f9011b33c8) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Remove @ledgerhq/types-cryptoassets dependency from coin-framework by replacing CryptoCurrency parameters with currencyId strings in CoinConfig and getCurrencyConfiguration

- [#16045](https://github.com/LedgerHQ/ledger-live/pull/16045) [`f9d1e38`](https://github.com/LedgerHQ/ledger-live/commit/f9d1e389082a3e13a4988cfc342e86f7c592bbc3) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - changes to aleo self transfer flow

- [#16307](https://github.com/LedgerHQ/ledger-live/pull/16307) [`8733fc5`](https://github.com/LedgerHQ/ledger-live/commit/8733fc55b61d0c76776674f80b9899344da38508) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - chore: remove unused nodeUrl from coin-aleo config
  fix: optimize private balance calculation in coin-aleo
  fix: aleo pending operation is removed too early

- [#16273](https://github.com/LedgerHQ/ledger-live/pull/16273) [`a95484e`](https://github.com/LedgerHQ/ledger-live/commit/a95484ef0a49cfdfae610a7e734899389cd236b8) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: temporary workaround for missing config in deviceTransactionConfig.ts

- [#15823](https://github.com/LedgerHQ/ledger-live/pull/15823) [`24656de`](https://github.com/LedgerHQ/ledger-live/commit/24656dea461d4d99dcb5f5e2e4b4e949b0823eeb) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Reduce redundant eth_call calls to node by implementing includeAssets from BalanceOptions

- [#16149](https://github.com/LedgerHQ/ledger-live/pull/16149) [`750e564`](https://github.com/LedgerHQ/ledger-live/commit/750e564d8b0fa25608dc3a3766159c2dca892d2c) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo provable api status endpoint error handling

- [#16043](https://github.com/LedgerHQ/ledger-live/pull/16043) [`7baf75d`](https://github.com/LedgerHQ/ledger-live/commit/7baf75d216d420c8bdfecd587a299a60814edffc) Thanks [@0xMM-L](https://github.com/0xMM-L)! - Handle fee sponsoring for private transfers

- [#15679](https://github.com/LedgerHQ/ledger-live/pull/15679) [`c353f29`](https://github.com/LedgerHQ/ledger-live/commit/c353f29b9174c20c708662c160f55c597020ee58) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - chore(coin-modules): add oxfmt with shared config (Prettier parity)

  - Add libs/coin-modules/.oxfmtrc.json aligned with root .prettierrc and desktop/mobile oxfmt
  - Add format, format:check, and run oxfmt before oxlint in lint:fix; add oxfmt devDependency
  - Remove coin-ton prettier script; turbo format/format:check tasks
  - Initial oxfmt pass on src

- [#16233](https://github.com/LedgerHQ/ledger-live/pull/16233) [`f36e748`](https://github.com/LedgerHQ/ledger-live/commit/f36e74881c03a25164c0eac24b13765bbbbbb440) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: enable aleo encrypted prove + remove jwt management

- [#16184](https://github.com/LedgerHQ/ledger-live/pull/16184) [`f9c30a8`](https://github.com/LedgerHQ/ledger-live/commit/f9c30a86fcc8b1cc75149c7c8df2a5e166754226) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add fee records errors in cases when fee record is insufficient and only one record present

- [#16112](https://github.com/LedgerHQ/ledger-live/pull/16112) [`02bc6dc`](https://github.com/LedgerHQ/ledger-live/commit/02bc6dc47314be74eba9f4855d7f6c3a54f29ad7) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Fix for private transaction send amount validation

- [#15798](https://github.com/LedgerHQ/ledger-live/pull/15798) [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore: use `coin-module-framework` from npmjs and remove the now migrated `coin-framework`

- [#16287](https://github.com/LedgerHQ/ledger-live/pull/16287) [`9bc46de`](https://github.com/LedgerHQ/ledger-live/commit/9bc46de7716aa3a942b6c27593639db40b04277d) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: avoid unnecessary aleo syncs with postSync clean up

- [#16285](https://github.com/LedgerHQ/ledger-live/pull/16285) [`3929c6e`](https://github.com/LedgerHQ/ledger-live/commit/3929c6e5dce8affbb433fb4ef7158a9af297d9ee) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - added missing record pagination for aleo

### Patch Changes

- Updated dependencies [[`ad5a37d`](https://github.com/LedgerHQ/ledger-live/commit/ad5a37d077dced734defcd464f120825e7bbf5e9), [`2d5c7e0`](https://github.com/LedgerHQ/ledger-live/commit/2d5c7e0cc27f45babe247b39b513d4e848707b01), [`78acbfa`](https://github.com/LedgerHQ/ledger-live/commit/78acbfae7319c5b3fb1453f8727e2210e895669c), [`1bd0cac`](https://github.com/LedgerHQ/ledger-live/commit/1bd0cac7957422fa06e18424e9e2706c39072078), [`7aa0706`](https://github.com/LedgerHQ/ledger-live/commit/7aa070618866e7a4c70876e674f07fde9630ccfb), [`3b83607`](https://github.com/LedgerHQ/ledger-live/commit/3b83607a045142a8408784c92b57d8bde01445df), [`24656de`](https://github.com/LedgerHQ/ledger-live/commit/24656dea461d4d99dcb5f5e2e4b4e949b0823eeb), [`c910c1b`](https://github.com/LedgerHQ/ledger-live/commit/c910c1bd9b4f7fbcc0e33fe19b33da44085ab7f9), [`139cdbf`](https://github.com/LedgerHQ/ledger-live/commit/139cdbfd48120247ff54f5f7863ce866a6a755d0), [`4cf9b8c`](https://github.com/LedgerHQ/ledger-live/commit/4cf9b8cde388aebfe04a894e9a35584856d1713d), [`97d7278`](https://github.com/LedgerHQ/ledger-live/commit/97d727824cef6a5b5a2d034d9b029e4f977f1754), [`63b5b9a`](https://github.com/LedgerHQ/ledger-live/commit/63b5b9a3f3b88fa41f02983350cdb6e73a887839), [`f36e748`](https://github.com/LedgerHQ/ledger-live/commit/f36e74881c03a25164c0eac24b13765bbbbbb440), [`46e78cf`](https://github.com/LedgerHQ/ledger-live/commit/46e78cf3a057a9de39a5abbb49fe779655db6507), [`cd59c95`](https://github.com/LedgerHQ/ledger-live/commit/cd59c95d04bd886114802ca887e1209d2191eaee), [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21)]:
  - @ledgerhq/cryptoassets@13.46.0-next.0
  - @ledgerhq/types-live@6.105.0-next.0
  - @ledgerhq/live-env@2.33.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.3.0-next.0
  - @ledgerhq/errors@6.34.0-next.0
  - @ledgerhq/live-network@2.5.1-next.0
  - @ledgerhq/devices@8.14.1-next.0

## 1.9.0

### Minor Changes

- [#15887](https://github.com/LedgerHQ/ledger-live/pull/15887) [`5fefc2e`](https://github.com/LedgerHQ/ledger-live/commit/5fefc2e6a4c6e4fdcaae0139f2f8d6f9011b33c8) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Remove @ledgerhq/types-cryptoassets dependency from coin-framework by replacing CryptoCurrency parameters with currencyId strings in CoinConfig and getCurrencyConfiguration

- [#15919](https://github.com/LedgerHQ/ledger-live/pull/15919) [`45a4b84`](https://github.com/LedgerHQ/ledger-live/commit/45a4b8472b2584f90b803e9de982ef4c1067c1df) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Adjust send max to work properly

- [#15893](https://github.com/LedgerHQ/ledger-live/pull/15893) [`e9dab3e`](https://github.com/LedgerHQ/ledger-live/commit/e9dab3e5039f907453d0213022b7cdaa1bbd1b96) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Adjust transaction summary step

- [#15679](https://github.com/LedgerHQ/ledger-live/pull/15679) [`c353f29`](https://github.com/LedgerHQ/ledger-live/commit/c353f29b9174c20c708662c160f55c597020ee58) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - chore(coin-modules): add oxfmt with shared config (Prettier parity)

  - Add libs/coin-modules/.oxfmtrc.json aligned with root .prettierrc and desktop/mobile oxfmt
  - Add format, format:check, and run oxfmt before oxlint in lint:fix; add oxfmt devDependency
  - Remove coin-ton prettier script; turbo format/format:check tasks
  - Initial oxfmt pass on src

- [#15798](https://github.com/LedgerHQ/ledger-live/pull/15798) [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore: use `coin-module-framework` from npmjs and remove the now migrated `coin-framework`

### Patch Changes

- Updated dependencies [[`24e8f80`](https://github.com/LedgerHQ/ledger-live/commit/24e8f80dc314619f954e6966aff8698591d6e05e), [`ea34195`](https://github.com/LedgerHQ/ledger-live/commit/ea34195c1115aaa40c69259ee2d2ee581e0349ab), [`7ffc0c5`](https://github.com/LedgerHQ/ledger-live/commit/7ffc0c5a7623aea32cdff2e093c14fae87352e71), [`53df748`](https://github.com/LedgerHQ/ledger-live/commit/53df74819753f084ed3df4a2ab9082d398b54920), [`9413def`](https://github.com/LedgerHQ/ledger-live/commit/9413def2fb1eccfc0ec8ce38bbcaf982981a0dd9), [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8), [`2ece647`](https://github.com/LedgerHQ/ledger-live/commit/2ece647f386e40f261662fc6e4e6624f302ee34f), [`55c01bc`](https://github.com/LedgerHQ/ledger-live/commit/55c01bcd8e43f9a54e93a41bb383d6d5c633b35f), [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21)]:
  - @ledgerhq/types-live@6.104.0
  - @ledgerhq/live-env@2.32.0
  - @ledgerhq/errors@6.33.0
  - @ledgerhq/ledger-wallet-framework@1.2.0
  - @ledgerhq/cryptoassets@13.45.0
  - @ledgerhq/devices@8.14.0
  - @ledgerhq/logs@6.17.0
  - @ledgerhq/types-cryptoassets@7.36.0
  - @ledgerhq/live-network@2.5.0
  - @ledgerhq/live-promise@0.2.3

## 1.9.0-next.0

### Minor Changes

- [#15887](https://github.com/LedgerHQ/ledger-live/pull/15887) [`5fefc2e`](https://github.com/LedgerHQ/ledger-live/commit/5fefc2e6a4c6e4fdcaae0139f2f8d6f9011b33c8) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Remove @ledgerhq/types-cryptoassets dependency from coin-framework by replacing CryptoCurrency parameters with currencyId strings in CoinConfig and getCurrencyConfiguration

- [#15919](https://github.com/LedgerHQ/ledger-live/pull/15919) [`45a4b84`](https://github.com/LedgerHQ/ledger-live/commit/45a4b8472b2584f90b803e9de982ef4c1067c1df) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Adjust send max to work properly

- [#15893](https://github.com/LedgerHQ/ledger-live/pull/15893) [`e9dab3e`](https://github.com/LedgerHQ/ledger-live/commit/e9dab3e5039f907453d0213022b7cdaa1bbd1b96) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Adjust transaction summary step

- [#15679](https://github.com/LedgerHQ/ledger-live/pull/15679) [`c353f29`](https://github.com/LedgerHQ/ledger-live/commit/c353f29b9174c20c708662c160f55c597020ee58) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - chore(coin-modules): add oxfmt with shared config (Prettier parity)

  - Add libs/coin-modules/.oxfmtrc.json aligned with root .prettierrc and desktop/mobile oxfmt
  - Add format, format:check, and run oxfmt before oxlint in lint:fix; add oxfmt devDependency
  - Remove coin-ton prettier script; turbo format/format:check tasks
  - Initial oxfmt pass on src

- [#15798](https://github.com/LedgerHQ/ledger-live/pull/15798) [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore: use `coin-module-framework` from npmjs and remove the now migrated `coin-framework`

### Patch Changes

- Updated dependencies [[`24e8f80`](https://github.com/LedgerHQ/ledger-live/commit/24e8f80dc314619f954e6966aff8698591d6e05e), [`ea34195`](https://github.com/LedgerHQ/ledger-live/commit/ea34195c1115aaa40c69259ee2d2ee581e0349ab), [`7ffc0c5`](https://github.com/LedgerHQ/ledger-live/commit/7ffc0c5a7623aea32cdff2e093c14fae87352e71), [`53df748`](https://github.com/LedgerHQ/ledger-live/commit/53df74819753f084ed3df4a2ab9082d398b54920), [`9413def`](https://github.com/LedgerHQ/ledger-live/commit/9413def2fb1eccfc0ec8ce38bbcaf982981a0dd9), [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8), [`2ece647`](https://github.com/LedgerHQ/ledger-live/commit/2ece647f386e40f261662fc6e4e6624f302ee34f), [`55c01bc`](https://github.com/LedgerHQ/ledger-live/commit/55c01bcd8e43f9a54e93a41bb383d6d5c633b35f), [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21)]:
  - @ledgerhq/types-live@6.104.0-next.0
  - @ledgerhq/live-env@2.32.0-next.0
  - @ledgerhq/errors@6.33.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.2.0-next.0
  - @ledgerhq/cryptoassets@13.45.0-next.0
  - @ledgerhq/devices@8.14.0-next.0
  - @ledgerhq/logs@6.17.0-next.0
  - @ledgerhq/types-cryptoassets@7.36.0-next.0
  - @ledgerhq/live-network@2.5.0-next.0
  - @ledgerhq/live-promise@0.2.3-next.0

## 1.8.0

### Minor Changes

- [#15809](https://github.com/LedgerHQ/ledger-live/pull/15809) [`d3f2070`](https://github.com/LedgerHQ/ledger-live/commit/d3f20708585c3a9c2a6b3a9d7861e26bb9a94f2d) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - add “sponsored by provable” text if fee sponsorship is enabled in the coin config

- [#15758](https://github.com/LedgerHQ/ledger-live/pull/15758) [`66c4add`](https://github.com/LedgerHQ/ledger-live/commit/66c4add957a7e3a3d042d5babe9663dfde52b1cf) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - add aleo getTransactionStatus for private

- [#15525](https://github.com/LedgerHQ/ledger-live/pull/15525) [`3a896bf`](https://github.com/LedgerHQ/ledger-live/commit/3a896bf20639a8090e266a7d05c604b8fe796b15) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add aleo private craft transaction

- [#15617](https://github.com/LedgerHQ/ledger-live/pull/15617) [`e0de96e`](https://github.com/LedgerHQ/ledger-live/commit/e0de96e6311de7e34715784da5941e60ed5c51cc) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: update aleo derivation path

- [#15597](https://github.com/LedgerHQ/ledger-live/pull/15597) [`6ed2cc3`](https://github.com/LedgerHQ/ledger-live/commit/6ed2cc3e388df915015f6e4083917015ef800804) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo encrypted prove integration in broadcast

- [#15640](https://github.com/LedgerHQ/ledger-live/pull/15640) [`08aba09`](https://github.com/LedgerHQ/ledger-live/commit/08aba094d4ce594fdde2167f9120b7d9c45b21ba) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: integrate with development version of aleo signer kit
  feat: aleo sign operation

- [#15518](https://github.com/LedgerHQ/ledger-live/pull/15518) [`91517d9`](https://github.com/LedgerHQ/ledger-live/commit/91517d95480cc44ffa9195adbf572b9817360efa) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: add "last synced: recently" to aleo public balance selector
  fix: empty extra.functionId in aleo optimistic operation
  fix: ensure multiple pending aleo operations are visible
  fix: broken "close modal" in aleo self transfer
  fix: return zero fees when fee sponsorship is enabled

- [#15568](https://github.com/LedgerHQ/ledger-live/pull/15568) [`2bd3190`](https://github.com/LedgerHQ/ledger-live/commit/2bd3190658bd9baeb616251273eba48d1f677be9) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add estimateMaxSpendable for private in aleo module

- [#15696](https://github.com/LedgerHQ/ledger-live/pull/15696) [`633b6ee`](https://github.com/LedgerHQ/ledger-live/commit/633b6eef8a38e1d8bd9219a69c75c9ca35ccf066) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - add aleo prepareTransaction for private

- [#15639](https://github.com/LedgerHQ/ledger-live/pull/15639) [`43b1de5`](https://github.com/LedgerHQ/ledger-live/commit/43b1de5d23a5760cbe1801a18d3691b393184920) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: exclude already spent records from aleo private balance

- [#15647](https://github.com/LedgerHQ/ledger-live/pull/15647) [`332b7b9`](https://github.com/LedgerHQ/ledger-live/commit/332b7b9c0f44b5dff3dd06e5da029d6add8825d8) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo private sync with rxjs

### Patch Changes

- Updated dependencies [[`4af828d`](https://github.com/LedgerHQ/ledger-live/commit/4af828d0790bb3568dd095f89dd9f239f7565e84), [`1bf4e7e`](https://github.com/LedgerHQ/ledger-live/commit/1bf4e7efa2fbb310f9c3db8f5d72e68294f0f3fe), [`d0559d8`](https://github.com/LedgerHQ/ledger-live/commit/d0559d84e119c844d92dc82c7648d0d9dc6c6e20), [`deec161`](https://github.com/LedgerHQ/ledger-live/commit/deec16153656d444336f067970dcda5fff016d95), [`e0de96e`](https://github.com/LedgerHQ/ledger-live/commit/e0de96e6311de7e34715784da5941e60ed5c51cc), [`41d172e`](https://github.com/LedgerHQ/ledger-live/commit/41d172e74bc074995b7290c4bb6d129276a484ff), [`c5c58e4`](https://github.com/LedgerHQ/ledger-live/commit/c5c58e4efab303a5b6bccc463f91241f4e0f72bc)]:
  - @ledgerhq/coin-framework@7.1.0
  - @ledgerhq/types-live@6.103.0
  - @ledgerhq/cryptoassets@13.44.0
  - @ledgerhq/ledger-wallet-framework@1.1.0
  - @ledgerhq/live-env@2.31.0
  - @ledgerhq/live-network@2.4.3

## 1.8.0-next.0

### Minor Changes

- [#15809](https://github.com/LedgerHQ/ledger-live/pull/15809) [`d3f2070`](https://github.com/LedgerHQ/ledger-live/commit/d3f20708585c3a9c2a6b3a9d7861e26bb9a94f2d) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - add “sponsored by provable” text if fee sponsorship is enabled in the coin config

- [#15758](https://github.com/LedgerHQ/ledger-live/pull/15758) [`66c4add`](https://github.com/LedgerHQ/ledger-live/commit/66c4add957a7e3a3d042d5babe9663dfde52b1cf) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - add aleo getTransactionStatus for private

- [#15525](https://github.com/LedgerHQ/ledger-live/pull/15525) [`3a896bf`](https://github.com/LedgerHQ/ledger-live/commit/3a896bf20639a8090e266a7d05c604b8fe796b15) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add aleo private craft transaction

- [#15617](https://github.com/LedgerHQ/ledger-live/pull/15617) [`e0de96e`](https://github.com/LedgerHQ/ledger-live/commit/e0de96e6311de7e34715784da5941e60ed5c51cc) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: update aleo derivation path

- [#15597](https://github.com/LedgerHQ/ledger-live/pull/15597) [`6ed2cc3`](https://github.com/LedgerHQ/ledger-live/commit/6ed2cc3e388df915015f6e4083917015ef800804) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo encrypted prove integration in broadcast

- [#15640](https://github.com/LedgerHQ/ledger-live/pull/15640) [`08aba09`](https://github.com/LedgerHQ/ledger-live/commit/08aba094d4ce594fdde2167f9120b7d9c45b21ba) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: integrate with development version of aleo signer kit
  feat: aleo sign operation

- [#15518](https://github.com/LedgerHQ/ledger-live/pull/15518) [`91517d9`](https://github.com/LedgerHQ/ledger-live/commit/91517d95480cc44ffa9195adbf572b9817360efa) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: add "last synced: recently" to aleo public balance selector
  fix: empty extra.functionId in aleo optimistic operation
  fix: ensure multiple pending aleo operations are visible
  fix: broken "close modal" in aleo self transfer
  fix: return zero fees when fee sponsorship is enabled

- [#15568](https://github.com/LedgerHQ/ledger-live/pull/15568) [`2bd3190`](https://github.com/LedgerHQ/ledger-live/commit/2bd3190658bd9baeb616251273eba48d1f677be9) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add estimateMaxSpendable for private in aleo module

- [#15696](https://github.com/LedgerHQ/ledger-live/pull/15696) [`633b6ee`](https://github.com/LedgerHQ/ledger-live/commit/633b6eef8a38e1d8bd9219a69c75c9ca35ccf066) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - add aleo prepareTransaction for private

- [#15639](https://github.com/LedgerHQ/ledger-live/pull/15639) [`43b1de5`](https://github.com/LedgerHQ/ledger-live/commit/43b1de5d23a5760cbe1801a18d3691b393184920) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: exclude already spent records from aleo private balance

- [#15647](https://github.com/LedgerHQ/ledger-live/pull/15647) [`332b7b9`](https://github.com/LedgerHQ/ledger-live/commit/332b7b9c0f44b5dff3dd06e5da029d6add8825d8) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo private sync with rxjs

### Patch Changes

- Updated dependencies [[`4af828d`](https://github.com/LedgerHQ/ledger-live/commit/4af828d0790bb3568dd095f89dd9f239f7565e84), [`1bf4e7e`](https://github.com/LedgerHQ/ledger-live/commit/1bf4e7efa2fbb310f9c3db8f5d72e68294f0f3fe), [`d0559d8`](https://github.com/LedgerHQ/ledger-live/commit/d0559d84e119c844d92dc82c7648d0d9dc6c6e20), [`deec161`](https://github.com/LedgerHQ/ledger-live/commit/deec16153656d444336f067970dcda5fff016d95), [`e0de96e`](https://github.com/LedgerHQ/ledger-live/commit/e0de96e6311de7e34715784da5941e60ed5c51cc), [`41d172e`](https://github.com/LedgerHQ/ledger-live/commit/41d172e74bc074995b7290c4bb6d129276a484ff), [`c5c58e4`](https://github.com/LedgerHQ/ledger-live/commit/c5c58e4efab303a5b6bccc463f91241f4e0f72bc)]:
  - @ledgerhq/coin-framework@7.1.0-next.0
  - @ledgerhq/types-live@6.103.0-next.0
  - @ledgerhq/cryptoassets@13.44.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.1.0-next.0
  - @ledgerhq/live-env@2.31.0-next.0
  - @ledgerhq/live-network@2.4.3-next.0

## 1.7.0

### Minor Changes

- [#15291](https://github.com/LedgerHQ/ledger-live/pull/15291) [`a221ae8`](https://github.com/LedgerHQ/ledger-live/commit/a221ae85b846c6d5dc6efb55ed873942d7720b05) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat: add `ledger-wallet-framework`

- [#15398](https://github.com/LedgerHQ/ledger-live/pull/15398) [`46ab4d6`](https://github.com/LedgerHQ/ledger-live/commit/46ab4d6b9303295c42e866a12b4f0fc3a123f79f) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: aleo config type
  chore: more generic name for aleo learn more url

- [#15451](https://github.com/LedgerHQ/ledger-live/pull/15451) [`87d5457`](https://github.com/LedgerHQ/ledger-live/commit/87d5457cffd6c56a80025fd701e50e3429a85e5a) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat: aleo transaction.properties for private transaction details

### Patch Changes

- Updated dependencies [[`a221ae8`](https://github.com/LedgerHQ/ledger-live/commit/a221ae85b846c6d5dc6efb55ed873942d7720b05), [`a270b43`](https://github.com/LedgerHQ/ledger-live/commit/a270b438bf8aca99b795679fecce1b55dc249c12), [`982d4af`](https://github.com/LedgerHQ/ledger-live/commit/982d4afbeb7faf3814c3e96ffb6e3e88b58dfe73), [`6dac7f9`](https://github.com/LedgerHQ/ledger-live/commit/6dac7f974c28dcae409c110a60061996490c5088), [`8ce1cb7`](https://github.com/LedgerHQ/ledger-live/commit/8ce1cb755b3e68c8688f9e828596d3c2605ef3cb), [`01c81b1`](https://github.com/LedgerHQ/ledger-live/commit/01c81b112ab326eff436f0f3279a1225c073f897), [`3ede91a`](https://github.com/LedgerHQ/ledger-live/commit/3ede91a3674a80c9309d305b871ec3b6e9849b41)]:
  - @ledgerhq/coin-framework@7.0.0
  - @ledgerhq/types-live@6.102.0
  - @ledgerhq/devices@8.13.0
  - @ledgerhq/errors@6.32.0
  - @ledgerhq/cryptoassets@13.43.0
  - @ledgerhq/ledger-wallet-framework@1.0.1
  - @ledgerhq/live-network@2.4.2

## 1.7.0-next.0

### Minor Changes

- [#15291](https://github.com/LedgerHQ/ledger-live/pull/15291) [`a221ae8`](https://github.com/LedgerHQ/ledger-live/commit/a221ae85b846c6d5dc6efb55ed873942d7720b05) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat: add `ledger-wallet-framework`

- [#15398](https://github.com/LedgerHQ/ledger-live/pull/15398) [`46ab4d6`](https://github.com/LedgerHQ/ledger-live/commit/46ab4d6b9303295c42e866a12b4f0fc3a123f79f) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: aleo config type
  chore: more generic name for aleo learn more url

- [#15451](https://github.com/LedgerHQ/ledger-live/pull/15451) [`87d5457`](https://github.com/LedgerHQ/ledger-live/commit/87d5457cffd6c56a80025fd701e50e3429a85e5a) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat: aleo transaction.properties for private transaction details

### Patch Changes

- Updated dependencies [[`a221ae8`](https://github.com/LedgerHQ/ledger-live/commit/a221ae85b846c6d5dc6efb55ed873942d7720b05), [`a270b43`](https://github.com/LedgerHQ/ledger-live/commit/a270b438bf8aca99b795679fecce1b55dc249c12), [`982d4af`](https://github.com/LedgerHQ/ledger-live/commit/982d4afbeb7faf3814c3e96ffb6e3e88b58dfe73), [`6dac7f9`](https://github.com/LedgerHQ/ledger-live/commit/6dac7f974c28dcae409c110a60061996490c5088), [`8ce1cb7`](https://github.com/LedgerHQ/ledger-live/commit/8ce1cb755b3e68c8688f9e828596d3c2605ef3cb), [`01c81b1`](https://github.com/LedgerHQ/ledger-live/commit/01c81b112ab326eff436f0f3279a1225c073f897), [`3ede91a`](https://github.com/LedgerHQ/ledger-live/commit/3ede91a3674a80c9309d305b871ec3b6e9849b41)]:
  - @ledgerhq/coin-framework@7.0.0-next.0
  - @ledgerhq/types-live@6.102.0-next.0
  - @ledgerhq/devices@8.13.0-next.0
  - @ledgerhq/errors@6.32.0-next.0
  - @ledgerhq/cryptoassets@13.43.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.0.1-next.0
  - @ledgerhq/live-network@2.4.2-next.0

## 1.6.0

### Minor Changes

- [#15268](https://github.com/LedgerHQ/ledger-live/pull/15268) [`952e4b9`](https://github.com/LedgerHQ/ledger-live/commit/952e4b92acc41b8166c86653a7c52f6b4d02bfe5) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo balance selector

- [#15137](https://github.com/LedgerHQ/ledger-live/pull/15137) [`f1394b5`](https://github.com/LedgerHQ/ledger-live/commit/f1394b53e582fc5be8c06a7ba4df4eb5f54a73c0) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: adjust aleo available balance in get transaction status

- [#15186](https://github.com/LedgerHQ/ledger-live/pull/15186) [`be5e542`](https://github.com/LedgerHQ/ledger-live/commit/be5e5428e7ee38dddb0a893b54a0bdb0c06c8de9) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: use tx.mode instead of tx.type in coin-aleo

- [#15205](https://github.com/LedgerHQ/ledger-live/pull/15205) [`695fc5e`](https://github.com/LedgerHQ/ledger-live/commit/695fc5ed3646f47e81fc622c24514768543e4a10) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo device transaction config

- [#15242](https://github.com/LedgerHQ/ledger-live/pull/15242) [`7038137`](https://github.com/LedgerHQ/ledger-live/commit/703813747349288325fdc661637644d980073b9d) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-framework): move functions to `AlpacaApi`

- [#15229](https://github.com/LedgerHQ/ledger-live/pull/15229) [`a81e55a`](https://github.com/LedgerHQ/ledger-live/commit/a81e55a2c0d8f08017fca5fe0b5c7c8057fbcfa3) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add aleo broadcast method

- [#15237](https://github.com/LedgerHQ/ledger-live/pull/15237) [`312d92d`](https://github.com/LedgerHQ/ledger-live/commit/312d92dbd9d115a2ec6ad6628445c31d45806aea) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-framework): duplicate `BroadcastConfig` inside coin framework

- [#15255](https://github.com/LedgerHQ/ledger-live/pull/15255) [`ad8cf9e`](https://github.com/LedgerHQ/ledger-live/commit/ad8cf9e8e2bef40d868c561ba0a4149f45d9dec5) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add Aleo currency config flag `isFeeSponsored` to control sponsored-fee behavior for private send flows.

- [#15037](https://github.com/LedgerHQ/ledger-live/pull/15037) [`7863b7e`](https://github.com/LedgerHQ/ledger-live/commit/7863b7ed71110b17f999b2092863b7fa2833a4d1) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Increase coverage in aleo for api and bridge

### Patch Changes

- Updated dependencies [[`c8d7be6`](https://github.com/LedgerHQ/ledger-live/commit/c8d7be6964aa9d8defd77de0b77ba7d42f472025), [`ffb3c46`](https://github.com/LedgerHQ/ledger-live/commit/ffb3c46acd292b9ac0f46a2b84509d02775a5f20), [`7cbfb7d`](https://github.com/LedgerHQ/ledger-live/commit/7cbfb7dd2d52ad8380ab4d37b02f63292699cd68), [`bfa4315`](https://github.com/LedgerHQ/ledger-live/commit/bfa4315d2f3b4b95c5a742ffd6e05272662f4550), [`17e1fb3`](https://github.com/LedgerHQ/ledger-live/commit/17e1fb3fdb92d6dab9af72adcbcde62bdd772a71), [`75dfb86`](https://github.com/LedgerHQ/ledger-live/commit/75dfb86c871a026aa90136d0184637878d484484), [`7038137`](https://github.com/LedgerHQ/ledger-live/commit/703813747349288325fdc661637644d980073b9d), [`e6f26e0`](https://github.com/LedgerHQ/ledger-live/commit/e6f26e0f475763aaf3271e2d4ed6cf36fb1f5060), [`42bf9b7`](https://github.com/LedgerHQ/ledger-live/commit/42bf9b7c40c04c7d2eeffba30b778be0b123bfd0), [`164788e`](https://github.com/LedgerHQ/ledger-live/commit/164788e4a7e9c063d7769d44393708632854cb0a), [`9f559e9`](https://github.com/LedgerHQ/ledger-live/commit/9f559e98a1af37073e0e79ee5bb54b4aaecfb8c4), [`312d92d`](https://github.com/LedgerHQ/ledger-live/commit/312d92dbd9d115a2ec6ad6628445c31d45806aea), [`08ee941`](https://github.com/LedgerHQ/ledger-live/commit/08ee9414908ec1f7489493c98b9a823a20cce550), [`fd24208`](https://github.com/LedgerHQ/ledger-live/commit/fd242082615ef0af25f0f5f96389b7406fc194dc), [`8cb2da1`](https://github.com/LedgerHQ/ledger-live/commit/8cb2da1f175f143666abcb66ef94bd230456846d), [`173946c`](https://github.com/LedgerHQ/ledger-live/commit/173946ce652ffef216f04d82b680b14f5686500e), [`70f6288`](https://github.com/LedgerHQ/ledger-live/commit/70f6288597722a1e8fd6b5884d843f27be87e9d8), [`ad66568`](https://github.com/LedgerHQ/ledger-live/commit/ad66568fd9c96cfa08d11123a711e3fa79705f65), [`79f2f0e`](https://github.com/LedgerHQ/ledger-live/commit/79f2f0e3e8b8089664d2aee7c3dd25c7685aec2c), [`4cc02f3`](https://github.com/LedgerHQ/ledger-live/commit/4cc02f3c1ba0bdb93917b5427a375ab44cd5d208), [`37bc15e`](https://github.com/LedgerHQ/ledger-live/commit/37bc15e245107ce1044f36b57d191552a77329e6)]:
  - @ledgerhq/cryptoassets@13.42.0
  - @ledgerhq/devices@8.12.0
  - @ledgerhq/errors@6.31.0
  - @ledgerhq/logs@6.16.0
  - @ledgerhq/types-cryptoassets@7.35.0
  - @ledgerhq/types-live@6.101.0
  - @ledgerhq/coin-framework@6.20.0
  - @ledgerhq/live-env@2.30.0
  - @ledgerhq/live-network@2.4.1
  - @ledgerhq/live-promise@0.2.2

## 1.6.0-next.0

### Minor Changes

- [#15268](https://github.com/LedgerHQ/ledger-live/pull/15268) [`952e4b9`](https://github.com/LedgerHQ/ledger-live/commit/952e4b92acc41b8166c86653a7c52f6b4d02bfe5) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo balance selector

- [#15137](https://github.com/LedgerHQ/ledger-live/pull/15137) [`f1394b5`](https://github.com/LedgerHQ/ledger-live/commit/f1394b53e582fc5be8c06a7ba4df4eb5f54a73c0) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: adjust aleo available balance in get transaction status

- [#15186](https://github.com/LedgerHQ/ledger-live/pull/15186) [`be5e542`](https://github.com/LedgerHQ/ledger-live/commit/be5e5428e7ee38dddb0a893b54a0bdb0c06c8de9) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: use tx.mode instead of tx.type in coin-aleo

- [#15205](https://github.com/LedgerHQ/ledger-live/pull/15205) [`695fc5e`](https://github.com/LedgerHQ/ledger-live/commit/695fc5ed3646f47e81fc622c24514768543e4a10) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo device transaction config

- [#15242](https://github.com/LedgerHQ/ledger-live/pull/15242) [`7038137`](https://github.com/LedgerHQ/ledger-live/commit/703813747349288325fdc661637644d980073b9d) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-framework): move functions to `AlpacaApi`

- [#15229](https://github.com/LedgerHQ/ledger-live/pull/15229) [`a81e55a`](https://github.com/LedgerHQ/ledger-live/commit/a81e55a2c0d8f08017fca5fe0b5c7c8057fbcfa3) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add aleo broadcast method

- [#15237](https://github.com/LedgerHQ/ledger-live/pull/15237) [`312d92d`](https://github.com/LedgerHQ/ledger-live/commit/312d92dbd9d115a2ec6ad6628445c31d45806aea) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-framework): duplicate `BroadcastConfig` inside coin framework

- [#15255](https://github.com/LedgerHQ/ledger-live/pull/15255) [`ad8cf9e`](https://github.com/LedgerHQ/ledger-live/commit/ad8cf9e8e2bef40d868c561ba0a4149f45d9dec5) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add Aleo currency config flag `isFeeSponsored` to control sponsored-fee behavior for private send flows.

- [#15037](https://github.com/LedgerHQ/ledger-live/pull/15037) [`7863b7e`](https://github.com/LedgerHQ/ledger-live/commit/7863b7ed71110b17f999b2092863b7fa2833a4d1) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Increase coverage in aleo for api and bridge

### Patch Changes

- Updated dependencies [[`c8d7be6`](https://github.com/LedgerHQ/ledger-live/commit/c8d7be6964aa9d8defd77de0b77ba7d42f472025), [`ffb3c46`](https://github.com/LedgerHQ/ledger-live/commit/ffb3c46acd292b9ac0f46a2b84509d02775a5f20), [`7cbfb7d`](https://github.com/LedgerHQ/ledger-live/commit/7cbfb7dd2d52ad8380ab4d37b02f63292699cd68), [`bfa4315`](https://github.com/LedgerHQ/ledger-live/commit/bfa4315d2f3b4b95c5a742ffd6e05272662f4550), [`17e1fb3`](https://github.com/LedgerHQ/ledger-live/commit/17e1fb3fdb92d6dab9af72adcbcde62bdd772a71), [`75dfb86`](https://github.com/LedgerHQ/ledger-live/commit/75dfb86c871a026aa90136d0184637878d484484), [`7038137`](https://github.com/LedgerHQ/ledger-live/commit/703813747349288325fdc661637644d980073b9d), [`e6f26e0`](https://github.com/LedgerHQ/ledger-live/commit/e6f26e0f475763aaf3271e2d4ed6cf36fb1f5060), [`42bf9b7`](https://github.com/LedgerHQ/ledger-live/commit/42bf9b7c40c04c7d2eeffba30b778be0b123bfd0), [`164788e`](https://github.com/LedgerHQ/ledger-live/commit/164788e4a7e9c063d7769d44393708632854cb0a), [`9f559e9`](https://github.com/LedgerHQ/ledger-live/commit/9f559e98a1af37073e0e79ee5bb54b4aaecfb8c4), [`312d92d`](https://github.com/LedgerHQ/ledger-live/commit/312d92dbd9d115a2ec6ad6628445c31d45806aea), [`08ee941`](https://github.com/LedgerHQ/ledger-live/commit/08ee9414908ec1f7489493c98b9a823a20cce550), [`fd24208`](https://github.com/LedgerHQ/ledger-live/commit/fd242082615ef0af25f0f5f96389b7406fc194dc), [`8cb2da1`](https://github.com/LedgerHQ/ledger-live/commit/8cb2da1f175f143666abcb66ef94bd230456846d), [`173946c`](https://github.com/LedgerHQ/ledger-live/commit/173946ce652ffef216f04d82b680b14f5686500e), [`70f6288`](https://github.com/LedgerHQ/ledger-live/commit/70f6288597722a1e8fd6b5884d843f27be87e9d8), [`ad66568`](https://github.com/LedgerHQ/ledger-live/commit/ad66568fd9c96cfa08d11123a711e3fa79705f65), [`79f2f0e`](https://github.com/LedgerHQ/ledger-live/commit/79f2f0e3e8b8089664d2aee7c3dd25c7685aec2c), [`4cc02f3`](https://github.com/LedgerHQ/ledger-live/commit/4cc02f3c1ba0bdb93917b5427a375ab44cd5d208), [`37bc15e`](https://github.com/LedgerHQ/ledger-live/commit/37bc15e245107ce1044f36b57d191552a77329e6)]:
  - @ledgerhq/cryptoassets@13.42.0-next.0
  - @ledgerhq/devices@8.12.0-next.0
  - @ledgerhq/errors@6.31.0-next.0
  - @ledgerhq/logs@6.16.0-next.0
  - @ledgerhq/types-cryptoassets@7.35.0-next.0
  - @ledgerhq/types-live@6.101.0-next.0
  - @ledgerhq/coin-framework@6.20.0-next.0
  - @ledgerhq/live-env@2.30.0-next.0
  - @ledgerhq/live-network@2.4.1-next.0
  - @ledgerhq/live-promise@0.2.2-next.0

## 1.5.0

### Minor Changes

- [#14846](https://github.com/LedgerHQ/ledger-live/pull/14846) [`17dd498`](https://github.com/LedgerHQ/ledger-live/commit/17dd4980f045f06a45c9faf4377a5b14ff34b30a) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - This PR adds craftTransaction method to coin-aleo package.

- [#14913](https://github.com/LedgerHQ/ledger-live/pull/14913) [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update TypeScript to latest 5.8.x

- [#14785](https://github.com/LedgerHQ/ledger-live/pull/14785) [`b13ac3b`](https://github.com/LedgerHQ/ledger-live/commit/b13ac3b935eac9d01921d38e3af0c27cab8cb5be) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo patch semi public operations

- [#14914](https://github.com/LedgerHQ/ledger-live/pull/14914) [`a578266`](https://github.com/LedgerHQ/ledger-live/commit/a578266bb6dd141a92eda0710c03b86f0ae76e8e) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo operation details extra

- [#14880](https://github.com/LedgerHQ/ledger-live/pull/14880) [`a2d3b72`](https://github.com/LedgerHQ/ledger-live/commit/a2d3b727a455710ee9d50eda50440e34bae46fed) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add estimateMaxSpendable to the bridge

### Patch Changes

- Updated dependencies [[`748b933`](https://github.com/LedgerHQ/ledger-live/commit/748b933f3786e48ec9dd434c76263c2c9a642c99), [`0dbbca3`](https://github.com/LedgerHQ/ledger-live/commit/0dbbca3f0226347b5abc034a066fe4ad89bfe462), [`9f9ae16`](https://github.com/LedgerHQ/ledger-live/commit/9f9ae16843e5db339c1d40c844a66f75fff498fb), [`ba4d56f`](https://github.com/LedgerHQ/ledger-live/commit/ba4d56fa223b87b89d621de2d1885c5a55922ef4), [`697f2e6`](https://github.com/LedgerHQ/ledger-live/commit/697f2e6f5b24ff023a46cbbbf5c9f85bac90a4c4), [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f)]:
  - @ledgerhq/types-live@6.100.0
  - @ledgerhq/errors@6.30.0
  - @ledgerhq/coin-framework@6.19.0
  - @ledgerhq/cryptoassets@13.41.0
  - @ledgerhq/types-cryptoassets@7.34.0
  - @ledgerhq/devices@8.11.0
  - @ledgerhq/logs@6.15.0
  - @ledgerhq/live-network@2.4.0
  - @ledgerhq/live-promise@0.2.1

## 1.5.0-next.0

### Minor Changes

- [#14846](https://github.com/LedgerHQ/ledger-live/pull/14846) [`17dd498`](https://github.com/LedgerHQ/ledger-live/commit/17dd4980f045f06a45c9faf4377a5b14ff34b30a) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - This PR adds craftTransaction method to coin-aleo package.

- [#14913](https://github.com/LedgerHQ/ledger-live/pull/14913) [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update TypeScript to latest 5.8.x

- [#14785](https://github.com/LedgerHQ/ledger-live/pull/14785) [`b13ac3b`](https://github.com/LedgerHQ/ledger-live/commit/b13ac3b935eac9d01921d38e3af0c27cab8cb5be) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo patch semi public operations

- [#14914](https://github.com/LedgerHQ/ledger-live/pull/14914) [`a578266`](https://github.com/LedgerHQ/ledger-live/commit/a578266bb6dd141a92eda0710c03b86f0ae76e8e) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo operation details extra

- [#14880](https://github.com/LedgerHQ/ledger-live/pull/14880) [`a2d3b72`](https://github.com/LedgerHQ/ledger-live/commit/a2d3b727a455710ee9d50eda50440e34bae46fed) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add estimateMaxSpendable to the bridge

### Patch Changes

- Updated dependencies [[`748b933`](https://github.com/LedgerHQ/ledger-live/commit/748b933f3786e48ec9dd434c76263c2c9a642c99), [`0dbbca3`](https://github.com/LedgerHQ/ledger-live/commit/0dbbca3f0226347b5abc034a066fe4ad89bfe462), [`9f9ae16`](https://github.com/LedgerHQ/ledger-live/commit/9f9ae16843e5db339c1d40c844a66f75fff498fb), [`ba4d56f`](https://github.com/LedgerHQ/ledger-live/commit/ba4d56fa223b87b89d621de2d1885c5a55922ef4), [`697f2e6`](https://github.com/LedgerHQ/ledger-live/commit/697f2e6f5b24ff023a46cbbbf5c9f85bac90a4c4), [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f)]:
  - @ledgerhq/types-live@6.100.0-next.0
  - @ledgerhq/errors@6.30.0-next.0
  - @ledgerhq/coin-framework@6.19.0-next.0
  - @ledgerhq/cryptoassets@13.41.0-next.0
  - @ledgerhq/types-cryptoassets@7.34.0-next.0
  - @ledgerhq/devices@8.11.0-next.0
  - @ledgerhq/logs@6.15.0-next.0
  - @ledgerhq/live-network@2.4.0-next.0
  - @ledgerhq/live-promise@0.2.1-next.0

## 1.4.0

### Minor Changes

- [#14647](https://github.com/LedgerHQ/ledger-live/pull/14647) [`4d23157`](https://github.com/LedgerHQ/ledger-live/commit/4d2315778bca18edd5532099f72c6f8197a05123) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo private balance integration

- [#14728](https://github.com/LedgerHQ/ledger-live/pull/14728) [`aee681e`](https://github.com/LedgerHQ/ledger-live/commit/aee681e950fdac80aa8adc4189e330fc6839da39) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - add aleo getTransactionStatus

- [#14639](https://github.com/LedgerHQ/ledger-live/pull/14639) [`480aeaf`](https://github.com/LedgerHQ/ledger-live/commit/480aeaf728fb6f3597ed11403188aee023bb0ff1) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo createTransaction & prepareTransaction

- [#14645](https://github.com/LedgerHQ/ledger-live/pull/14645) [`3a53226`](https://github.com/LedgerHQ/ledger-live/commit/3a53226459a92d731911f42695457bf8138d71c6) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - feat: aleo validateAddress

- [#14699](https://github.com/LedgerHQ/ledger-live/pull/14699) [`ec8a2d6`](https://github.com/LedgerHQ/ledger-live/commit/ec8a2d619b85117e2d74c595c6eae5cae6fda433) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo private operations list

- [#14636](https://github.com/LedgerHQ/ledger-live/pull/14636) [`efc9d1b`](https://github.com/LedgerHQ/ledger-live/commit/efc9d1bf37871d0715a6580e8d67686b34543198) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo estimateFees

- [#13986](https://github.com/LedgerHQ/ledger-live/pull/13986) [`07fdf5a`](https://github.com/LedgerHQ/ledger-live/commit/07fdf5a4bcd12cb0cc5100389c8e355800d3aec0) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - Alpaca API cleanup and documentation

- [#14689](https://github.com/LedgerHQ/ledger-live/pull/14689) [`5af4762`](https://github.com/LedgerHQ/ledger-live/commit/5af47625517d3b86d4e72f4e6d895448dca9ad83) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: adapt aleo private sync to latest changes

- [#14531](https://github.com/LedgerHQ/ledger-live/pull/14531) [`b7dec5c`](https://github.com/LedgerHQ/ledger-live/commit/b7dec5c2a41520114593701c82192ff8ae8ce06f) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo provable api access

- [#14480](https://github.com/LedgerHQ/ledger-live/pull/14480) [`255cfc4`](https://github.com/LedgerHQ/ledger-live/commit/255cfc4d3583a950b793ee013f5a043e52ee2bdb) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat: aleo transparent list operations

- [#14700](https://github.com/LedgerHQ/ledger-live/pull/14700) [`79953e1`](https://github.com/LedgerHQ/ledger-live/commit/79953e1b18f5fa36939192478f25f3d509f5de37) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo build optimistic operation

### Patch Changes

- Updated dependencies [[`a96dc83`](https://github.com/LedgerHQ/ledger-live/commit/a96dc83916684e22c041904c479c615a3095303b), [`e954c1e`](https://github.com/LedgerHQ/ledger-live/commit/e954c1e0f0e45efe3b0e8c3fda9e6d5b22b5bc01), [`e292df3`](https://github.com/LedgerHQ/ledger-live/commit/e292df30514168181545d7a572f723e31df78e77), [`17149ee`](https://github.com/LedgerHQ/ledger-live/commit/17149ee26eeef8a600d650a6f4903c52320a0d8d), [`ec8a2d6`](https://github.com/LedgerHQ/ledger-live/commit/ec8a2d619b85117e2d74c595c6eae5cae6fda433), [`2ca4f6c`](https://github.com/LedgerHQ/ledger-live/commit/2ca4f6c337a29cd81874261c697d74c82a312eee), [`3bb5c2e`](https://github.com/LedgerHQ/ledger-live/commit/3bb5c2e335c05945b1a7bc8c77d19d0ea03156a6), [`07fdf5a`](https://github.com/LedgerHQ/ledger-live/commit/07fdf5a4bcd12cb0cc5100389c8e355800d3aec0), [`b7dec5c`](https://github.com/LedgerHQ/ledger-live/commit/b7dec5c2a41520114593701c82192ff8ae8ce06f), [`f51402e`](https://github.com/LedgerHQ/ledger-live/commit/f51402ebb8a4f05a933df3c3ef499756fbde5cc8), [`5f1c644`](https://github.com/LedgerHQ/ledger-live/commit/5f1c644fd5f757f48618b62e976faac274ced40d), [`c7ed360`](https://github.com/LedgerHQ/ledger-live/commit/c7ed36086280d60631e235d375cc2db5f60e8aab), [`cc4c8f5`](https://github.com/LedgerHQ/ledger-live/commit/cc4c8f57e38586d77b89f32d359e65cc700912af)]:
  - @ledgerhq/types-live@6.99.0
  - @ledgerhq/cryptoassets@13.40.0
  - @ledgerhq/live-env@2.29.0
  - @ledgerhq/coin-framework@6.18.0
  - @ledgerhq/live-network@2.3.0

## 1.4.0-next.0

### Minor Changes

- [#14647](https://github.com/LedgerHQ/ledger-live/pull/14647) [`4d23157`](https://github.com/LedgerHQ/ledger-live/commit/4d2315778bca18edd5532099f72c6f8197a05123) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo private balance integration

- [#14728](https://github.com/LedgerHQ/ledger-live/pull/14728) [`aee681e`](https://github.com/LedgerHQ/ledger-live/commit/aee681e950fdac80aa8adc4189e330fc6839da39) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - add aleo getTransactionStatus

- [#14639](https://github.com/LedgerHQ/ledger-live/pull/14639) [`480aeaf`](https://github.com/LedgerHQ/ledger-live/commit/480aeaf728fb6f3597ed11403188aee023bb0ff1) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo createTransaction & prepareTransaction

- [#14645](https://github.com/LedgerHQ/ledger-live/pull/14645) [`3a53226`](https://github.com/LedgerHQ/ledger-live/commit/3a53226459a92d731911f42695457bf8138d71c6) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - feat: aleo validateAddress

- [#14699](https://github.com/LedgerHQ/ledger-live/pull/14699) [`ec8a2d6`](https://github.com/LedgerHQ/ledger-live/commit/ec8a2d619b85117e2d74c595c6eae5cae6fda433) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo private operations list

- [#14636](https://github.com/LedgerHQ/ledger-live/pull/14636) [`efc9d1b`](https://github.com/LedgerHQ/ledger-live/commit/efc9d1bf37871d0715a6580e8d67686b34543198) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo estimateFees

- [#13986](https://github.com/LedgerHQ/ledger-live/pull/13986) [`07fdf5a`](https://github.com/LedgerHQ/ledger-live/commit/07fdf5a4bcd12cb0cc5100389c8e355800d3aec0) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - Alpaca API cleanup and documentation

- [#14689](https://github.com/LedgerHQ/ledger-live/pull/14689) [`5af4762`](https://github.com/LedgerHQ/ledger-live/commit/5af47625517d3b86d4e72f4e6d895448dca9ad83) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: adapt aleo private sync to latest changes

- [#14531](https://github.com/LedgerHQ/ledger-live/pull/14531) [`b7dec5c`](https://github.com/LedgerHQ/ledger-live/commit/b7dec5c2a41520114593701c82192ff8ae8ce06f) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo provable api access

- [#14480](https://github.com/LedgerHQ/ledger-live/pull/14480) [`255cfc4`](https://github.com/LedgerHQ/ledger-live/commit/255cfc4d3583a950b793ee013f5a043e52ee2bdb) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat: aleo transparent list operations

- [#14700](https://github.com/LedgerHQ/ledger-live/pull/14700) [`79953e1`](https://github.com/LedgerHQ/ledger-live/commit/79953e1b18f5fa36939192478f25f3d509f5de37) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo build optimistic operation

### Patch Changes

- Updated dependencies [[`a96dc83`](https://github.com/LedgerHQ/ledger-live/commit/a96dc83916684e22c041904c479c615a3095303b), [`e954c1e`](https://github.com/LedgerHQ/ledger-live/commit/e954c1e0f0e45efe3b0e8c3fda9e6d5b22b5bc01), [`e292df3`](https://github.com/LedgerHQ/ledger-live/commit/e292df30514168181545d7a572f723e31df78e77), [`17149ee`](https://github.com/LedgerHQ/ledger-live/commit/17149ee26eeef8a600d650a6f4903c52320a0d8d), [`ec8a2d6`](https://github.com/LedgerHQ/ledger-live/commit/ec8a2d619b85117e2d74c595c6eae5cae6fda433), [`2ca4f6c`](https://github.com/LedgerHQ/ledger-live/commit/2ca4f6c337a29cd81874261c697d74c82a312eee), [`3bb5c2e`](https://github.com/LedgerHQ/ledger-live/commit/3bb5c2e335c05945b1a7bc8c77d19d0ea03156a6), [`07fdf5a`](https://github.com/LedgerHQ/ledger-live/commit/07fdf5a4bcd12cb0cc5100389c8e355800d3aec0), [`b7dec5c`](https://github.com/LedgerHQ/ledger-live/commit/b7dec5c2a41520114593701c82192ff8ae8ce06f), [`f51402e`](https://github.com/LedgerHQ/ledger-live/commit/f51402ebb8a4f05a933df3c3ef499756fbde5cc8), [`5f1c644`](https://github.com/LedgerHQ/ledger-live/commit/5f1c644fd5f757f48618b62e976faac274ced40d), [`c7ed360`](https://github.com/LedgerHQ/ledger-live/commit/c7ed36086280d60631e235d375cc2db5f60e8aab), [`cc4c8f5`](https://github.com/LedgerHQ/ledger-live/commit/cc4c8f57e38586d77b89f32d359e65cc700912af)]:
  - @ledgerhq/types-live@6.99.0-next.0
  - @ledgerhq/cryptoassets@13.40.0-next.0
  - @ledgerhq/live-env@2.29.0-next.0
  - @ledgerhq/coin-framework@6.18.0-next.0
  - @ledgerhq/live-network@2.3.0-next.0

## 1.3.0

### Minor Changes

- [#14388](https://github.com/LedgerHQ/ledger-live/pull/14388) [`71c413a`](https://github.com/LedgerHQ/ledger-live/commit/71c413abb359a47c493e26d5e4e2d71d262f9835) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo view key resolver

- [#14407](https://github.com/LedgerHQ/ledger-live/pull/14407) [`19e62ca`](https://github.com/LedgerHQ/ledger-live/commit/19e62ca57461e3201ce8186023d7896411fce0e0) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - lastBlock method implementation and network api client for Aleo

- [#14561](https://github.com/LedgerHQ/ledger-live/pull/14561) [`b2c6cce`](https://github.com/LedgerHQ/ledger-live/commit/b2c6cce06e2f8cacb16270c11f34522d7fcb4dae) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: api setup for aleo transparent transactions list

- [#14431](https://github.com/LedgerHQ/ledger-live/pull/14431) [`83474a0`](https://github.com/LedgerHQ/ledger-live/commit/83474a0756acd876883407fcc72c74ce7d69ad38) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - getBalance method for Aleo

- [#14510](https://github.com/LedgerHQ/ledger-live/pull/14510) [`1b1fe80`](https://github.com/LedgerHQ/ledger-live/commit/1b1fe80e8be9934b94d2374543b593b2a30d1197) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: store aleo view key in account.id

### Patch Changes

- Updated dependencies [[`e08c1be`](https://github.com/LedgerHQ/ledger-live/commit/e08c1be127e6a9c246c285ba818530e6756033e0), [`19e62ca`](https://github.com/LedgerHQ/ledger-live/commit/19e62ca57461e3201ce8186023d7896411fce0e0), [`d02f203`](https://github.com/LedgerHQ/ledger-live/commit/d02f2035e4f2ac6c3b446cf4107cd017ea4faf43), [`e12fd1e`](https://github.com/LedgerHQ/ledger-live/commit/e12fd1eb27189a668cd8e61798256a0c20c0f078)]:
  - @ledgerhq/types-live@6.98.0
  - @ledgerhq/live-env@2.28.0
  - @ledgerhq/coin-framework@6.17.0
  - @ledgerhq/cryptoassets@13.39.1
  - @ledgerhq/live-network@2.2.3

## 1.3.0-next.0

### Minor Changes

- [#14388](https://github.com/LedgerHQ/ledger-live/pull/14388) [`71c413a`](https://github.com/LedgerHQ/ledger-live/commit/71c413abb359a47c493e26d5e4e2d71d262f9835) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo view key resolver

- [#14407](https://github.com/LedgerHQ/ledger-live/pull/14407) [`19e62ca`](https://github.com/LedgerHQ/ledger-live/commit/19e62ca57461e3201ce8186023d7896411fce0e0) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - lastBlock method implementation and network api client for Aleo

- [#14561](https://github.com/LedgerHQ/ledger-live/pull/14561) [`b2c6cce`](https://github.com/LedgerHQ/ledger-live/commit/b2c6cce06e2f8cacb16270c11f34522d7fcb4dae) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: api setup for aleo transparent transactions list

- [#14431](https://github.com/LedgerHQ/ledger-live/pull/14431) [`83474a0`](https://github.com/LedgerHQ/ledger-live/commit/83474a0756acd876883407fcc72c74ce7d69ad38) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - getBalance method for Aleo

- [#14510](https://github.com/LedgerHQ/ledger-live/pull/14510) [`1b1fe80`](https://github.com/LedgerHQ/ledger-live/commit/1b1fe80e8be9934b94d2374543b593b2a30d1197) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: store aleo view key in account.id

### Patch Changes

- Updated dependencies [[`e08c1be`](https://github.com/LedgerHQ/ledger-live/commit/e08c1be127e6a9c246c285ba818530e6756033e0), [`19e62ca`](https://github.com/LedgerHQ/ledger-live/commit/19e62ca57461e3201ce8186023d7896411fce0e0), [`d02f203`](https://github.com/LedgerHQ/ledger-live/commit/d02f2035e4f2ac6c3b446cf4107cd017ea4faf43), [`e12fd1e`](https://github.com/LedgerHQ/ledger-live/commit/e12fd1eb27189a668cd8e61798256a0c20c0f078)]:
  - @ledgerhq/types-live@6.98.0-next.0
  - @ledgerhq/live-env@2.28.0-next.0
  - @ledgerhq/coin-framework@6.17.0-next.0
  - @ledgerhq/cryptoassets@13.39.1-next.0
  - @ledgerhq/live-network@2.2.3-next.0

## 1.2.0

### Minor Changes

- [#14387](https://github.com/LedgerHQ/ledger-live/pull/14387) [`8a258aa`](https://github.com/LedgerHQ/ledger-live/commit/8a258aa0655123d22f955067acffaf9f74661165) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo derivation config
  fix: missing verify in aleo getAddress
  chore: better error handling in mocked aleo DMK

### Patch Changes

- Updated dependencies [[`03b3105`](https://github.com/LedgerHQ/ledger-live/commit/03b3105efe8094b79ba70432e475fdc5d945c2c4), [`d5da9e0`](https://github.com/LedgerHQ/ledger-live/commit/d5da9e04d7a92b3f7f9df9d462bdd101cadbd300), [`7896aa2`](https://github.com/LedgerHQ/ledger-live/commit/7896aa2dacc12e6781267fa3ca2965aa6fb018d2), [`8a258aa`](https://github.com/LedgerHQ/ledger-live/commit/8a258aa0655123d22f955067acffaf9f74661165), [`c61dc02`](https://github.com/LedgerHQ/ledger-live/commit/c61dc0268072ca43cf726efd17dc11f21eb37ce8), [`8006565`](https://github.com/LedgerHQ/ledger-live/commit/8006565f77487fa0e38bf5f8d7bb4cda4cdba1f5), [`2ec4196`](https://github.com/LedgerHQ/ledger-live/commit/2ec419630bceab7a9600711742a18034ba9ff3cc), [`fe678a1`](https://github.com/LedgerHQ/ledger-live/commit/fe678a1d16eeda84cf8d802eee53026ea677be58), [`de9d068`](https://github.com/LedgerHQ/ledger-live/commit/de9d068800ed2ae72aca0126855480d3eeb12989)]:
  - @ledgerhq/coin-framework@6.16.0
  - @ledgerhq/cryptoassets@13.39.0
  - @ledgerhq/types-live@6.97.0
  - @ledgerhq/types-cryptoassets@7.33.0

## 1.2.0-next.0

### Minor Changes

- [#14387](https://github.com/LedgerHQ/ledger-live/pull/14387) [`8a258aa`](https://github.com/LedgerHQ/ledger-live/commit/8a258aa0655123d22f955067acffaf9f74661165) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo derivation config
  fix: missing verify in aleo getAddress
  chore: better error handling in mocked aleo DMK

### Patch Changes

- Updated dependencies [[`03b3105`](https://github.com/LedgerHQ/ledger-live/commit/03b3105efe8094b79ba70432e475fdc5d945c2c4), [`d5da9e0`](https://github.com/LedgerHQ/ledger-live/commit/d5da9e04d7a92b3f7f9df9d462bdd101cadbd300), [`7896aa2`](https://github.com/LedgerHQ/ledger-live/commit/7896aa2dacc12e6781267fa3ca2965aa6fb018d2), [`8a258aa`](https://github.com/LedgerHQ/ledger-live/commit/8a258aa0655123d22f955067acffaf9f74661165), [`c61dc02`](https://github.com/LedgerHQ/ledger-live/commit/c61dc0268072ca43cf726efd17dc11f21eb37ce8), [`8006565`](https://github.com/LedgerHQ/ledger-live/commit/8006565f77487fa0e38bf5f8d7bb4cda4cdba1f5), [`2ec4196`](https://github.com/LedgerHQ/ledger-live/commit/2ec419630bceab7a9600711742a18034ba9ff3cc), [`fe678a1`](https://github.com/LedgerHQ/ledger-live/commit/fe678a1d16eeda84cf8d802eee53026ea677be58), [`de9d068`](https://github.com/LedgerHQ/ledger-live/commit/de9d068800ed2ae72aca0126855480d3eeb12989)]:
  - @ledgerhq/coin-framework@6.16.0-next.0
  - @ledgerhq/cryptoassets@13.39.0-next.0
  - @ledgerhq/types-live@6.97.0-next.0
  - @ledgerhq/types-cryptoassets@7.33.0-next.0

## 1.1.3

### Patch Changes

- Updated dependencies [[`d7b6d27`](https://github.com/LedgerHQ/ledger-live/commit/d7b6d27d86cade7fcae8013ae66df72532aec3df), [`da660cc`](https://github.com/LedgerHQ/ledger-live/commit/da660ccccf87d97bfdff2b2a066c8b3b422b2d93), [`2d750da`](https://github.com/LedgerHQ/ledger-live/commit/2d750da3bcda547e8c4639e655c5129580baeaad), [`96acd67`](https://github.com/LedgerHQ/ledger-live/commit/96acd679f345729cddcdf73191d4b2a0f948ad5a), [`bf34cf5`](https://github.com/LedgerHQ/ledger-live/commit/bf34cf516a26081ddd493bb01042b1a0e462b029), [`7a75642`](https://github.com/LedgerHQ/ledger-live/commit/7a75642c2f56e27c778106d60a44049917d04014)]:
  - @ledgerhq/types-live@6.96.0
  - @ledgerhq/coin-framework@6.15.0
  - @ledgerhq/live-env@2.27.0
  - @ledgerhq/cryptoassets@13.38.1

## 1.1.3-next.0

### Patch Changes

- Updated dependencies [[`d7b6d27`](https://github.com/LedgerHQ/ledger-live/commit/d7b6d27d86cade7fcae8013ae66df72532aec3df), [`da660cc`](https://github.com/LedgerHQ/ledger-live/commit/da660ccccf87d97bfdff2b2a066c8b3b422b2d93), [`2d750da`](https://github.com/LedgerHQ/ledger-live/commit/2d750da3bcda547e8c4639e655c5129580baeaad), [`96acd67`](https://github.com/LedgerHQ/ledger-live/commit/96acd679f345729cddcdf73191d4b2a0f948ad5a), [`bf34cf5`](https://github.com/LedgerHQ/ledger-live/commit/bf34cf516a26081ddd493bb01042b1a0e462b029), [`7a75642`](https://github.com/LedgerHQ/ledger-live/commit/7a75642c2f56e27c778106d60a44049917d04014)]:
  - @ledgerhq/types-live@6.96.0-next.0
  - @ledgerhq/coin-framework@6.15.0-next.0
  - @ledgerhq/live-env@2.27.0-next.0
  - @ledgerhq/cryptoassets@13.38.1-next.0

## 1.1.2

### Patch Changes

- Updated dependencies [[`dd1122e`](https://github.com/LedgerHQ/ledger-live/commit/dd1122eeb6e9c582541446ff82a488928fa340c2), [`363b630`](https://github.com/LedgerHQ/ledger-live/commit/363b63050ab007266d2c1158a27e4fce79081983), [`cb69f67`](https://github.com/LedgerHQ/ledger-live/commit/cb69f67326834079695935103530d0b24ad3772d), [`1d2d196`](https://github.com/LedgerHQ/ledger-live/commit/1d2d19635c28db69adb04dcd21219b51836186f5), [`9a99ae9`](https://github.com/LedgerHQ/ledger-live/commit/9a99ae9c6b4a99cdda500ae0e216037799de5cd5), [`556dd22`](https://github.com/LedgerHQ/ledger-live/commit/556dd22dd505b4b5ae865ffe36fc5b5aa22a4f81)]:
  - @ledgerhq/coin-framework@6.14.0
  - @ledgerhq/cryptoassets@13.38.0
  - @ledgerhq/types-live@6.95.0

## 1.1.2-next.0

### Patch Changes

- Updated dependencies [[`dd1122e`](https://github.com/LedgerHQ/ledger-live/commit/dd1122eeb6e9c582541446ff82a488928fa340c2), [`363b630`](https://github.com/LedgerHQ/ledger-live/commit/363b63050ab007266d2c1158a27e4fce79081983), [`cb69f67`](https://github.com/LedgerHQ/ledger-live/commit/cb69f67326834079695935103530d0b24ad3772d), [`1d2d196`](https://github.com/LedgerHQ/ledger-live/commit/1d2d19635c28db69adb04dcd21219b51836186f5), [`9a99ae9`](https://github.com/LedgerHQ/ledger-live/commit/9a99ae9c6b4a99cdda500ae0e216037799de5cd5), [`556dd22`](https://github.com/LedgerHQ/ledger-live/commit/556dd22dd505b4b5ae865ffe36fc5b5aa22a4f81)]:
  - @ledgerhq/coin-framework@6.14.0-next.0
  - @ledgerhq/cryptoassets@13.38.0-next.0
  - @ledgerhq/types-live@6.95.0-next.0

## 1.1.1

### Patch Changes

- Updated dependencies [[`c84be03`](https://github.com/LedgerHQ/ledger-live/commit/c84be039f162fd3af72861fd1605f4141c8f0792), [`819d969`](https://github.com/LedgerHQ/ledger-live/commit/819d96907febd9a68a6407c1bad06f475d044a4d), [`6532080`](https://github.com/LedgerHQ/ledger-live/commit/6532080d2a0f5e49052aeab0bf532ee5cd52694a), [`069d298`](https://github.com/LedgerHQ/ledger-live/commit/069d2982cd36c9525addf9d1f9df762a8799b3bb)]:
  - @ledgerhq/types-live@6.94.0
  - @ledgerhq/live-env@2.26.0
  - @ledgerhq/coin-framework@6.13.1
  - @ledgerhq/cryptoassets@13.37.1

## 1.1.1-next.0

### Patch Changes

- Updated dependencies [[`c84be03`](https://github.com/LedgerHQ/ledger-live/commit/c84be039f162fd3af72861fd1605f4141c8f0792), [`819d969`](https://github.com/LedgerHQ/ledger-live/commit/819d96907febd9a68a6407c1bad06f475d044a4d), [`6532080`](https://github.com/LedgerHQ/ledger-live/commit/6532080d2a0f5e49052aeab0bf532ee5cd52694a), [`069d298`](https://github.com/LedgerHQ/ledger-live/commit/069d2982cd36c9525addf9d1f9df762a8799b3bb)]:
  - @ledgerhq/types-live@6.94.0-next.0
  - @ledgerhq/live-env@2.26.0-next.0
  - @ledgerhq/coin-framework@6.13.1-next.0
  - @ledgerhq/cryptoassets@13.37.1-next.0

## 1.1.0

### Minor Changes

- [#13314](https://github.com/LedgerHQ/ledger-live/pull/13314) [`3ac5f26`](https://github.com/LedgerHQ/ledger-live/commit/3ac5f26111f8596327fa7e588e514509de3f8a59) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: coin-aleo template

### Patch Changes

- Updated dependencies [[`537a975`](https://github.com/LedgerHQ/ledger-live/commit/537a975536ca3669d3b88371e1e1f651c4cb9a1b), [`cbcae7c`](https://github.com/LedgerHQ/ledger-live/commit/cbcae7c0ba9b54b1167d26e4227bd2b847207cb9), [`8754614`](https://github.com/LedgerHQ/ledger-live/commit/87546149a62b81f8a25bb6222626592ead629f62), [`50bae0f`](https://github.com/LedgerHQ/ledger-live/commit/50bae0f13a95ef166b2c5609ccbcf5ef01ba1579), [`cf08174`](https://github.com/LedgerHQ/ledger-live/commit/cf0817462e9f0210fceff29ec60b0699e4e69b71), [`b9a3e43`](https://github.com/LedgerHQ/ledger-live/commit/b9a3e431be33943ab4feb4294d6a7f27b966e61b), [`3ac5f26`](https://github.com/LedgerHQ/ledger-live/commit/3ac5f26111f8596327fa7e588e514509de3f8a59), [`7f05536`](https://github.com/LedgerHQ/ledger-live/commit/7f0553665e9c8721f263825cc79994bfc6729d9b)]:
  - @ledgerhq/cryptoassets@13.37.0
  - @ledgerhq/coin-framework@6.13.0
  - @ledgerhq/types-live@6.93.0
  - @ledgerhq/live-env@2.25.0
  - @ledgerhq/types-cryptoassets@7.32.0
  - @ledgerhq/devices@8.10.0

## 1.1.0-next.0

### Minor Changes

- [#13314](https://github.com/LedgerHQ/ledger-live/pull/13314) [`3ac5f26`](https://github.com/LedgerHQ/ledger-live/commit/3ac5f26111f8596327fa7e588e514509de3f8a59) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: coin-aleo template

### Patch Changes

- Updated dependencies [[`537a975`](https://github.com/LedgerHQ/ledger-live/commit/537a975536ca3669d3b88371e1e1f651c4cb9a1b), [`cbcae7c`](https://github.com/LedgerHQ/ledger-live/commit/cbcae7c0ba9b54b1167d26e4227bd2b847207cb9), [`8754614`](https://github.com/LedgerHQ/ledger-live/commit/87546149a62b81f8a25bb6222626592ead629f62), [`50bae0f`](https://github.com/LedgerHQ/ledger-live/commit/50bae0f13a95ef166b2c5609ccbcf5ef01ba1579), [`cf08174`](https://github.com/LedgerHQ/ledger-live/commit/cf0817462e9f0210fceff29ec60b0699e4e69b71), [`b9a3e43`](https://github.com/LedgerHQ/ledger-live/commit/b9a3e431be33943ab4feb4294d6a7f27b966e61b), [`3ac5f26`](https://github.com/LedgerHQ/ledger-live/commit/3ac5f26111f8596327fa7e588e514509de3f8a59), [`7f05536`](https://github.com/LedgerHQ/ledger-live/commit/7f0553665e9c8721f263825cc79994bfc6729d9b)]:
  - @ledgerhq/cryptoassets@13.37.0-next.0
  - @ledgerhq/coin-framework@6.13.0-next.0
  - @ledgerhq/types-live@6.93.0-next.0
  - @ledgerhq/live-env@2.25.0-next.0
  - @ledgerhq/types-cryptoassets@7.32.0-next.0
  - @ledgerhq/devices@8.10.0-next.0
