# @ledgerhq/coin-concordium

## 0.18.0-next.0

### Minor Changes

- [#19980](https://github.com/LedgerHQ/ledger-live/pull/19980) [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Convert error classes from createCustomErrorClass factory to native extends Error (LIVE-32915 tier 1a)

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f)]:
  - @ledgerhq/errors@7.0.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.6.0-next.0
  - @ledgerhq/live-network@3.0.0-next.0
  - @ledgerhq/live-env@3.0.0-next.0
  - @ledgerhq/types-live@6.117.0-next.0

## 0.17.0

### Minor Changes

- [#19540](https://github.com/LedgerHQ/ledger-live/pull/19540) [`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a) Thanks [@adussarps](https://github.com/adussarps)! - Expose the read-only smart-contract call API on EVM external RPC nodes and explicitly reject it on unsupported coin modules.

### Patch Changes

- Updated dependencies [[`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7)]:
  - @ledgerhq/types-live@6.116.0
  - @ledgerhq/live-network@2.7.0
  - @ledgerhq/ledger-wallet-framework@2.5.0

## 0.17.0-next.0

### Minor Changes

- [#19540](https://github.com/LedgerHQ/ledger-live/pull/19540) [`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a) Thanks [@adussarps](https://github.com/adussarps)! - Expose the read-only smart-contract call API on EVM external RPC nodes and explicitly reject it on unsupported coin modules.

### Patch Changes

- Updated dependencies [[`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7)]:
  - @ledgerhq/types-live@6.116.0-next.0
  - @ledgerhq/live-network@2.7.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.5.0-next.0

## 0.16.0

### Minor Changes

- [#19683](https://github.com/LedgerHQ/ledger-live/pull/19683) [`4b73f23`](https://github.com/LedgerHQ/ledger-live/commit/4b73f23260ecc28574f46a7fd0f5cd7627d6d13f) Thanks [@ysitbon](https://github.com/ysitbon)! - Consume currency accessors and currency types from `@ledgerhq/ledger-wallet-framework` instead of `@ledgerhq/cryptoassets`/`@ledgerhq/types-cryptoassets`. Value accessors now resolve through the framework's injected `CurrenciesResolver`; `CryptoCurrency`/`TokenCurrency`/`Unit`/`ExplorerView` types are imported from the framework.

### Patch Changes

- Updated dependencies [[`8f30c75`](https://github.com/LedgerHQ/ledger-live/commit/8f30c75ecb553a720722f1e039b4aec53fce2a87), [`0f85077`](https://github.com/LedgerHQ/ledger-live/commit/0f850774ae3b46fd4a06c0da5762d3d4211b26af), [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d), [`bde85a7`](https://github.com/LedgerHQ/ledger-live/commit/bde85a7ef50cf7990efd2f9bcd7ccc34c0764fb7), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`d631f0d`](https://github.com/LedgerHQ/ledger-live/commit/d631f0dd2480950c5f20dec0c9b4aca515ec63f8), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158)]:
  - @ledgerhq/ledger-wallet-framework@2.4.0
  - @ledgerhq/live-env@2.42.0
  - @ledgerhq/types-live@6.115.0
  - @ledgerhq/live-network@2.6.8

## 0.16.0-next.0

### Minor Changes

- [#19683](https://github.com/LedgerHQ/ledger-live/pull/19683) [`4b73f23`](https://github.com/LedgerHQ/ledger-live/commit/4b73f23260ecc28574f46a7fd0f5cd7627d6d13f) Thanks [@ysitbon](https://github.com/ysitbon)! - Consume currency accessors and currency types from `@ledgerhq/ledger-wallet-framework` instead of `@ledgerhq/cryptoassets`/`@ledgerhq/types-cryptoassets`. Value accessors now resolve through the framework's injected `CurrenciesResolver`; `CryptoCurrency`/`TokenCurrency`/`Unit`/`ExplorerView` types are imported from the framework.

### Patch Changes

- Updated dependencies [[`8f30c75`](https://github.com/LedgerHQ/ledger-live/commit/8f30c75ecb553a720722f1e039b4aec53fce2a87), [`0f85077`](https://github.com/LedgerHQ/ledger-live/commit/0f850774ae3b46fd4a06c0da5762d3d4211b26af), [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d), [`bde85a7`](https://github.com/LedgerHQ/ledger-live/commit/bde85a7ef50cf7990efd2f9bcd7ccc34c0764fb7), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`d631f0d`](https://github.com/LedgerHQ/ledger-live/commit/d631f0dd2480950c5f20dec0c9b4aca515ec63f8), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158)]:
  - @ledgerhq/ledger-wallet-framework@2.4.0-next.0
  - @ledgerhq/live-env@2.42.0-next.0
  - @ledgerhq/types-live@6.115.0-next.0
  - @ledgerhq/live-network@2.6.8-next.0

## 0.15.0

### Minor Changes

- [#19145](https://github.com/LedgerHQ/ledger-live/pull/19145) [`1e17c12`](https://github.com/LedgerHQ/ledger-live/commit/1e17c127178a871b665b25d6f4208d4613826dd1) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the per-coin `cli.ts` / `cli-transaction.ts` / `test/cli.ts` (`makeCliTools`) contract from coin families and the `cliTools` field of `FamilySetup`. The only consumer was the `apps/cli` `send` command, and the only e2e path that used it was the EVM ERC20 token approval. That flow is now a dedicated, self-contained `tokenApproval` CLI command; the generic `send` command keeps the cross-family options only.

### Patch Changes

- Updated dependencies [[`6df2017`](https://github.com/LedgerHQ/ledger-live/commit/6df20171a84b54e5b67eabefc938a98d7e3c3e43), [`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff), [`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11), [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d), [`38728f9`](https://github.com/LedgerHQ/ledger-live/commit/38728f9d9ac879c276def56ce88c5e49549e4b9d), [`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec), [`6400154`](https://github.com/LedgerHQ/ledger-live/commit/6400154daa131b225c6ec62c9134f1cd06370729), [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e), [`e6566ff`](https://github.com/LedgerHQ/ledger-live/commit/e6566ff55d95ff36832d5f77899d67d80842f418), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7), [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea), [`7fe5f11`](https://github.com/LedgerHQ/ledger-live/commit/7fe5f1129d6ac218ad274f2187a1a3dd83b8855a), [`67c6acb`](https://github.com/LedgerHQ/ledger-live/commit/67c6acb22afafa7671eebe94e60e672480b71728), [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc), [`d686e93`](https://github.com/LedgerHQ/ledger-live/commit/d686e93f8a548ff4e9ab3c877ad1f815510b35d9), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`c8b4ee7`](https://github.com/LedgerHQ/ledger-live/commit/c8b4ee77c03ca2117cbad039331b7b52e50d9620), [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4), [`fa0123a`](https://github.com/LedgerHQ/ledger-live/commit/fa0123a1da7b053d58afab498266cf830958e2ff), [`0e30cdc`](https://github.com/LedgerHQ/ledger-live/commit/0e30cdc29d7fb3cab5bf1f2ef7c24cf0a152516e), [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170), [`cf3aad1`](https://github.com/LedgerHQ/ledger-live/commit/cf3aad160bd9d2002a3154fbc70018fb1f7a6171), [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8), [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3), [`376915c`](https://github.com/LedgerHQ/ledger-live/commit/376915ca520ecc1708090ed9b3eba1ff7e780540), [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff), [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc), [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55), [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e), [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33), [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a)]:
  - @ledgerhq/cryptoassets@13.54.0
  - @ledgerhq/types-live@6.114.0
  - @ledgerhq/live-env@2.41.0
  - @ledgerhq/ledger-wallet-framework@2.3.0
  - @ledgerhq/concordium-core@0.5.0
  - @ledgerhq/live-promise@0.3.0
  - @ledgerhq/live-network@2.6.7

## 0.15.0-next.0

### Minor Changes

- [#19145](https://github.com/LedgerHQ/ledger-live/pull/19145) [`1e17c12`](https://github.com/LedgerHQ/ledger-live/commit/1e17c127178a871b665b25d6f4208d4613826dd1) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the per-coin `cli.ts` / `cli-transaction.ts` / `test/cli.ts` (`makeCliTools`) contract from coin families and the `cliTools` field of `FamilySetup`. The only consumer was the `apps/cli` `send` command, and the only e2e path that used it was the EVM ERC20 token approval. That flow is now a dedicated, self-contained `tokenApproval` CLI command; the generic `send` command keeps the cross-family options only.

### Patch Changes

- Updated dependencies [[`6df2017`](https://github.com/LedgerHQ/ledger-live/commit/6df20171a84b54e5b67eabefc938a98d7e3c3e43), [`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff), [`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11), [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d), [`38728f9`](https://github.com/LedgerHQ/ledger-live/commit/38728f9d9ac879c276def56ce88c5e49549e4b9d), [`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec), [`6400154`](https://github.com/LedgerHQ/ledger-live/commit/6400154daa131b225c6ec62c9134f1cd06370729), [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e), [`e6566ff`](https://github.com/LedgerHQ/ledger-live/commit/e6566ff55d95ff36832d5f77899d67d80842f418), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7), [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea), [`7fe5f11`](https://github.com/LedgerHQ/ledger-live/commit/7fe5f1129d6ac218ad274f2187a1a3dd83b8855a), [`67c6acb`](https://github.com/LedgerHQ/ledger-live/commit/67c6acb22afafa7671eebe94e60e672480b71728), [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc), [`d686e93`](https://github.com/LedgerHQ/ledger-live/commit/d686e93f8a548ff4e9ab3c877ad1f815510b35d9), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`c8b4ee7`](https://github.com/LedgerHQ/ledger-live/commit/c8b4ee77c03ca2117cbad039331b7b52e50d9620), [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4), [`fa0123a`](https://github.com/LedgerHQ/ledger-live/commit/fa0123a1da7b053d58afab498266cf830958e2ff), [`0e30cdc`](https://github.com/LedgerHQ/ledger-live/commit/0e30cdc29d7fb3cab5bf1f2ef7c24cf0a152516e), [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170), [`cf3aad1`](https://github.com/LedgerHQ/ledger-live/commit/cf3aad160bd9d2002a3154fbc70018fb1f7a6171), [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8), [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3), [`376915c`](https://github.com/LedgerHQ/ledger-live/commit/376915ca520ecc1708090ed9b3eba1ff7e780540), [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff), [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc), [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55), [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e), [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33), [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a)]:
  - @ledgerhq/cryptoassets@13.54.0-next.0
  - @ledgerhq/types-live@6.114.0-next.0
  - @ledgerhq/live-env@2.41.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.3.0-next.0
  - @ledgerhq/concordium-core@0.5.0-next.0
  - @ledgerhq/live-promise@0.3.0-next.0
  - @ledgerhq/live-network@2.6.7-next.0

## 0.14.0

### Minor Changes

- [#18520](https://github.com/LedgerHQ/ledger-live/pull/18520) [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the dummy fee-estimation recipient out of `@ledgerhq/cryptoassets` (`abandonseed.ts`, now deleted) into each coin family. Every account bridge now exposes a required `getEstimationRecipient(account)` returning a valid recipient (or throwing for an unmapped currency, like the former `getAbandonSeedAddress`), and the swap layer dispatches through it instead of the central address map.

### Patch Changes

- Updated dependencies [[`636a4cb`](https://github.com/LedgerHQ/ledger-live/commit/636a4cbc5ae01364af425e3837cecf1ce4d3f3bc), [`48dbd53`](https://github.com/LedgerHQ/ledger-live/commit/48dbd533a7a505cbb37989f8ce94f273f84bc7d2), [`ad68778`](https://github.com/LedgerHQ/ledger-live/commit/ad68778ad71686c9e4f397276917e606a099f573), [`13aeeb6`](https://github.com/LedgerHQ/ledger-live/commit/13aeeb6186997b433785e542ed1dafa6afde2267), [`1f41eee`](https://github.com/LedgerHQ/ledger-live/commit/1f41eee5b4dc6aa50accd94e5a0d6c98fcf76e23), [`b8a0765`](https://github.com/LedgerHQ/ledger-live/commit/b8a0765d7ac1ac1a60456f9c604e7a694e38bd84), [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934), [`798081d`](https://github.com/LedgerHQ/ledger-live/commit/798081db3e427c8d2d09930ceb836703146ca1ba), [`1f11587`](https://github.com/LedgerHQ/ledger-live/commit/1f11587b4681429aa9be2dc50035f292e0394108), [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292), [`37eba10`](https://github.com/LedgerHQ/ledger-live/commit/37eba10db15542fb7859bafac772e6d280650872), [`ca20506`](https://github.com/LedgerHQ/ledger-live/commit/ca20506c138a1cfb9c254f61e6bb930aea4c6ab8)]:
  - @ledgerhq/types-live@6.113.0
  - @ledgerhq/errors@6.37.0
  - @ledgerhq/live-env@2.40.0
  - @ledgerhq/cryptoassets@13.53.0
  - @ledgerhq/ledger-wallet-framework@2.2.1
  - @ledgerhq/live-network@2.6.6

## 0.14.0-next.0

### Minor Changes

- [#18520](https://github.com/LedgerHQ/ledger-live/pull/18520) [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the dummy fee-estimation recipient out of `@ledgerhq/cryptoassets` (`abandonseed.ts`, now deleted) into each coin family. Every account bridge now exposes a required `getEstimationRecipient(account)` returning a valid recipient (or throwing for an unmapped currency, like the former `getAbandonSeedAddress`), and the swap layer dispatches through it instead of the central address map.

### Patch Changes

- Updated dependencies [[`636a4cb`](https://github.com/LedgerHQ/ledger-live/commit/636a4cbc5ae01364af425e3837cecf1ce4d3f3bc), [`48dbd53`](https://github.com/LedgerHQ/ledger-live/commit/48dbd533a7a505cbb37989f8ce94f273f84bc7d2), [`ad68778`](https://github.com/LedgerHQ/ledger-live/commit/ad68778ad71686c9e4f397276917e606a099f573), [`13aeeb6`](https://github.com/LedgerHQ/ledger-live/commit/13aeeb6186997b433785e542ed1dafa6afde2267), [`1f41eee`](https://github.com/LedgerHQ/ledger-live/commit/1f41eee5b4dc6aa50accd94e5a0d6c98fcf76e23), [`b8a0765`](https://github.com/LedgerHQ/ledger-live/commit/b8a0765d7ac1ac1a60456f9c604e7a694e38bd84), [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934), [`798081d`](https://github.com/LedgerHQ/ledger-live/commit/798081db3e427c8d2d09930ceb836703146ca1ba), [`1f11587`](https://github.com/LedgerHQ/ledger-live/commit/1f11587b4681429aa9be2dc50035f292e0394108), [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292), [`37eba10`](https://github.com/LedgerHQ/ledger-live/commit/37eba10db15542fb7859bafac772e6d280650872), [`ca20506`](https://github.com/LedgerHQ/ledger-live/commit/ca20506c138a1cfb9c254f61e6bb930aea4c6ab8)]:
  - @ledgerhq/types-live@6.113.0-next.0
  - @ledgerhq/errors@6.37.0-next.0
  - @ledgerhq/live-env@2.40.0-next.0
  - @ledgerhq/cryptoassets@13.53.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.2.1-next.0
  - @ledgerhq/live-network@2.6.6-next.0

## 0.13.1

### Patch Changes

- Updated dependencies [[`81ceb34`](https://github.com/LedgerHQ/ledger-live/commit/81ceb347c0b2167358c601a9922e2c7fa14a845b), [`9ddf006`](https://github.com/LedgerHQ/ledger-live/commit/9ddf006bc2897a2393f1a9595b3c6a43d0c35bf7), [`b9a2a9e`](https://github.com/LedgerHQ/ledger-live/commit/b9a2a9e5b85f9fb5556ef2de83bd0418e5326e89), [`bfbd74d`](https://github.com/LedgerHQ/ledger-live/commit/bfbd74d47f028d7398e1856c7b18442be3f8f6d7), [`da1c0c8`](https://github.com/LedgerHQ/ledger-live/commit/da1c0c87b3d2540eff9e51c665df8192b4486855), [`031097a`](https://github.com/LedgerHQ/ledger-live/commit/031097ac469c39e4ab475b92d9f6960ebb9a1ad3), [`9ab3a61`](https://github.com/LedgerHQ/ledger-live/commit/9ab3a6157abb3a382c3157eb292ce9d9d2c6df93), [`82a143f`](https://github.com/LedgerHQ/ledger-live/commit/82a143ff527c4a71e2c9ea79babc473ed395b42d), [`93a5bcd`](https://github.com/LedgerHQ/ledger-live/commit/93a5bcd8b7e361148f7bac751d072cc8bcec2cf9), [`e6c617b`](https://github.com/LedgerHQ/ledger-live/commit/e6c617b91062f82f70d020212189a806d2452166), [`04e3349`](https://github.com/LedgerHQ/ledger-live/commit/04e33498ffd5d7a81ad86436a75b1562ca263356), [`eb1dae8`](https://github.com/LedgerHQ/ledger-live/commit/eb1dae8fc14ff8e0bc1e1ce040712492a0328451)]:
  - @ledgerhq/live-env@2.39.0
  - @ledgerhq/types-live@6.112.0
  - @ledgerhq/cryptoassets@13.52.0
  - @ledgerhq/ledger-wallet-framework@2.2.0
  - @ledgerhq/live-network@2.6.5

## 0.13.1-next.1

### Patch Changes

- Updated dependencies [[`93a5bcd`](https://github.com/LedgerHQ/ledger-live/commit/93a5bcd8b7e361148f7bac751d072cc8bcec2cf9)]:
  - @ledgerhq/cryptoassets@13.52.0-next.1
  - @ledgerhq/types-live@6.112.0-next.1
  - @ledgerhq/ledger-wallet-framework@2.2.0-next.1

## 0.13.1-next.0

### Patch Changes

- Updated dependencies [[`81ceb34`](https://github.com/LedgerHQ/ledger-live/commit/81ceb347c0b2167358c601a9922e2c7fa14a845b), [`9ddf006`](https://github.com/LedgerHQ/ledger-live/commit/9ddf006bc2897a2393f1a9595b3c6a43d0c35bf7), [`b9a2a9e`](https://github.com/LedgerHQ/ledger-live/commit/b9a2a9e5b85f9fb5556ef2de83bd0418e5326e89), [`bfbd74d`](https://github.com/LedgerHQ/ledger-live/commit/bfbd74d47f028d7398e1856c7b18442be3f8f6d7), [`da1c0c8`](https://github.com/LedgerHQ/ledger-live/commit/da1c0c87b3d2540eff9e51c665df8192b4486855), [`031097a`](https://github.com/LedgerHQ/ledger-live/commit/031097ac469c39e4ab475b92d9f6960ebb9a1ad3), [`9ab3a61`](https://github.com/LedgerHQ/ledger-live/commit/9ab3a6157abb3a382c3157eb292ce9d9d2c6df93), [`82a143f`](https://github.com/LedgerHQ/ledger-live/commit/82a143ff527c4a71e2c9ea79babc473ed395b42d), [`e6c617b`](https://github.com/LedgerHQ/ledger-live/commit/e6c617b91062f82f70d020212189a806d2452166), [`04e3349`](https://github.com/LedgerHQ/ledger-live/commit/04e33498ffd5d7a81ad86436a75b1562ca263356), [`eb1dae8`](https://github.com/LedgerHQ/ledger-live/commit/eb1dae8fc14ff8e0bc1e1ce040712492a0328451)]:
  - @ledgerhq/live-env@2.39.0-next.0
  - @ledgerhq/types-live@6.112.0-next.0
  - @ledgerhq/cryptoassets@13.52.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.2.0-next.0
  - @ledgerhq/live-network@2.6.5-next.0

## 0.13.0

### Minor Changes

- [#18245](https://github.com/LedgerHQ/ledger-live/pull/18245) [`8c0f5f2`](https://github.com/LedgerHQ/ledger-live/commit/8c0f5f22e66aa6a34a3363a256d3da2d98d07dc9) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add max-fee display for Concordium app 5.6.0+. `ConcordiumSigner.signTransaction` takes a required `maxFee: bigint` (µCCD) forwarded to the device for on-screen rendering. New `ConcordiumInvalidMaxFeeError` typed error for invalid input.

### Patch Changes

- Updated dependencies [[`c606898`](https://github.com/LedgerHQ/ledger-live/commit/c606898e4994768eadd99f2dea9575f92b3f9339), [`9901502`](https://github.com/LedgerHQ/ledger-live/commit/990150200e70bc3ea55c5cfc41e1c77f24cc315b), [`0ebf28c`](https://github.com/LedgerHQ/ledger-live/commit/0ebf28cac81f6f25f356d54c891fab62f328e411), [`d149f27`](https://github.com/LedgerHQ/ledger-live/commit/d149f271f18a1727558fa046aa6bc38c391c2649), [`b14d5cc`](https://github.com/LedgerHQ/ledger-live/commit/b14d5cc29cc75c6be2e565db3d4d0ab400cc56d9), [`d649cf3`](https://github.com/LedgerHQ/ledger-live/commit/d649cf31ecf8b2e18ab78109e6b201ff9766cc33), [`d081ef1`](https://github.com/LedgerHQ/ledger-live/commit/d081ef1892a34fa1751fba4d774867ff11bae20b), [`d19f9de`](https://github.com/LedgerHQ/ledger-live/commit/d19f9debb00e15edbaa7d2cedfcb0d2b5ced4f80), [`ddfb84c`](https://github.com/LedgerHQ/ledger-live/commit/ddfb84cf0caf68cfaba75aa7c015b2029051fe78), [`ec38133`](https://github.com/LedgerHQ/ledger-live/commit/ec38133ab6b2c18d329e1c78320b7c2a1f80fbfc), [`8c0f5f2`](https://github.com/LedgerHQ/ledger-live/commit/8c0f5f22e66aa6a34a3363a256d3da2d98d07dc9), [`cc4dd4d`](https://github.com/LedgerHQ/ledger-live/commit/cc4dd4db5e312da55966a6f0a8daa90e75e4dd94), [`bbc72fe`](https://github.com/LedgerHQ/ledger-live/commit/bbc72fe2ad0cee010349ab3b2e5a1e369dd9e840), [`8c9596d`](https://github.com/LedgerHQ/ledger-live/commit/8c9596de8eeec00f8d660a42448c6eb65c3aa9b2), [`5842a85`](https://github.com/LedgerHQ/ledger-live/commit/5842a85907c7418a393b0dffee756bff52370024)]:
  - @ledgerhq/types-live@6.111.0
  - @ledgerhq/cryptoassets@13.51.0
  - @ledgerhq/ledger-wallet-framework@2.1.0
  - @ledgerhq/live-env@2.38.0
  - @ledgerhq/errors@6.36.0
  - @ledgerhq/live-network@2.6.4

## 0.13.0-next.0

### Minor Changes

- [#18245](https://github.com/LedgerHQ/ledger-live/pull/18245) [`8c0f5f2`](https://github.com/LedgerHQ/ledger-live/commit/8c0f5f22e66aa6a34a3363a256d3da2d98d07dc9) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add max-fee display for Concordium app 5.6.0+. `ConcordiumSigner.signTransaction` takes a required `maxFee: bigint` (µCCD) forwarded to the device for on-screen rendering. New `ConcordiumInvalidMaxFeeError` typed error for invalid input.

### Patch Changes

- Updated dependencies [[`c606898`](https://github.com/LedgerHQ/ledger-live/commit/c606898e4994768eadd99f2dea9575f92b3f9339), [`9901502`](https://github.com/LedgerHQ/ledger-live/commit/990150200e70bc3ea55c5cfc41e1c77f24cc315b), [`0ebf28c`](https://github.com/LedgerHQ/ledger-live/commit/0ebf28cac81f6f25f356d54c891fab62f328e411), [`d149f27`](https://github.com/LedgerHQ/ledger-live/commit/d149f271f18a1727558fa046aa6bc38c391c2649), [`b14d5cc`](https://github.com/LedgerHQ/ledger-live/commit/b14d5cc29cc75c6be2e565db3d4d0ab400cc56d9), [`d649cf3`](https://github.com/LedgerHQ/ledger-live/commit/d649cf31ecf8b2e18ab78109e6b201ff9766cc33), [`d081ef1`](https://github.com/LedgerHQ/ledger-live/commit/d081ef1892a34fa1751fba4d774867ff11bae20b), [`d19f9de`](https://github.com/LedgerHQ/ledger-live/commit/d19f9debb00e15edbaa7d2cedfcb0d2b5ced4f80), [`ddfb84c`](https://github.com/LedgerHQ/ledger-live/commit/ddfb84cf0caf68cfaba75aa7c015b2029051fe78), [`ec38133`](https://github.com/LedgerHQ/ledger-live/commit/ec38133ab6b2c18d329e1c78320b7c2a1f80fbfc), [`8c0f5f2`](https://github.com/LedgerHQ/ledger-live/commit/8c0f5f22e66aa6a34a3363a256d3da2d98d07dc9), [`cc4dd4d`](https://github.com/LedgerHQ/ledger-live/commit/cc4dd4db5e312da55966a6f0a8daa90e75e4dd94), [`bbc72fe`](https://github.com/LedgerHQ/ledger-live/commit/bbc72fe2ad0cee010349ab3b2e5a1e369dd9e840), [`8c9596d`](https://github.com/LedgerHQ/ledger-live/commit/8c9596de8eeec00f8d660a42448c6eb65c3aa9b2), [`5842a85`](https://github.com/LedgerHQ/ledger-live/commit/5842a85907c7418a393b0dffee756bff52370024)]:
  - @ledgerhq/types-live@6.111.0-next.0
  - @ledgerhq/cryptoassets@13.51.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.1.0-next.0
  - @ledgerhq/live-env@2.38.0-next.0
  - @ledgerhq/errors@6.36.0-next.0
  - @ledgerhq/live-network@2.6.4-next.0

## 0.12.1

### Patch Changes

- Updated dependencies [[`812538e`](https://github.com/LedgerHQ/ledger-live/commit/812538e1788cf63aa3166d3842f0b27248400690), [`5fc817a`](https://github.com/LedgerHQ/ledger-live/commit/5fc817a5ee316396a327e5b10eccd8314bfb2df5), [`177e07f`](https://github.com/LedgerHQ/ledger-live/commit/177e07ffc6c733b4b9811d6f7dff6b75a106075c), [`44fd893`](https://github.com/LedgerHQ/ledger-live/commit/44fd8931435a52232cfd5abed3fec7a5b275a9be), [`65f87d9`](https://github.com/LedgerHQ/ledger-live/commit/65f87d938ac4158e0ae706593d2a46561097f5a9), [`5e2b764`](https://github.com/LedgerHQ/ledger-live/commit/5e2b76429c0b3024782dc179875a24c5f2655274)]:
  - @ledgerhq/types-live@6.110.0
  - @ledgerhq/cryptoassets@13.50.0
  - @ledgerhq/live-env@2.37.0
  - @ledgerhq/ledger-wallet-framework@2.0.0
  - @ledgerhq/live-network@2.6.3

## 0.12.1-next.0

### Patch Changes

- Updated dependencies [[`812538e`](https://github.com/LedgerHQ/ledger-live/commit/812538e1788cf63aa3166d3842f0b27248400690), [`5fc817a`](https://github.com/LedgerHQ/ledger-live/commit/5fc817a5ee316396a327e5b10eccd8314bfb2df5), [`177e07f`](https://github.com/LedgerHQ/ledger-live/commit/177e07ffc6c733b4b9811d6f7dff6b75a106075c), [`44fd893`](https://github.com/LedgerHQ/ledger-live/commit/44fd8931435a52232cfd5abed3fec7a5b275a9be), [`65f87d9`](https://github.com/LedgerHQ/ledger-live/commit/65f87d938ac4158e0ae706593d2a46561097f5a9), [`5e2b764`](https://github.com/LedgerHQ/ledger-live/commit/5e2b76429c0b3024782dc179875a24c5f2655274)]:
  - @ledgerhq/types-live@6.110.0-next.0
  - @ledgerhq/cryptoassets@13.50.0-next.0
  - @ledgerhq/live-env@2.37.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.0.0-next.0
  - @ledgerhq/live-network@2.6.3-next.0

## 0.12.0

### Minor Changes

- [#17253](https://github.com/LedgerHQ/ledger-live/pull/17253) [`fe04e44`](https://github.com/LedgerHQ/ledger-live/commit/fe04e44e0cd41ea9dd896defcea18c010fe36490) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - chore(ADR-025): rename `AlpacaApi` -> `CoinModuleApi`

### Patch Changes

- Updated dependencies [[`839537d`](https://github.com/LedgerHQ/ledger-live/commit/839537d42f9c2bf87ad0faf64e51966250976055), [`ef47541`](https://github.com/LedgerHQ/ledger-live/commit/ef47541f67995474a82446c416e0825623b5d063), [`a04a4c0`](https://github.com/LedgerHQ/ledger-live/commit/a04a4c0a8bbee5140f685836014409e98af33d02), [`9b75461`](https://github.com/LedgerHQ/ledger-live/commit/9b754610e67e4d31d3d49b566ba1590194265c6f), [`822bc92`](https://github.com/LedgerHQ/ledger-live/commit/822bc92945248ddd31304aa7ca90854c849d217f), [`2eabd7f`](https://github.com/LedgerHQ/ledger-live/commit/2eabd7f56680e1399926a96b4bdeaf628e435999), [`62ec3e5`](https://github.com/LedgerHQ/ledger-live/commit/62ec3e5917ceee80c0384eea6ee0901faa58b08a), [`9ccd154`](https://github.com/LedgerHQ/ledger-live/commit/9ccd1540f6ea912107d9651fa9b66ffd12948111), [`603f343`](https://github.com/LedgerHQ/ledger-live/commit/603f343d64c9b69a5708b419eb7ebfe7cec94554), [`a61f904`](https://github.com/LedgerHQ/ledger-live/commit/a61f90478795bff6956d2a9083ec47d44e6e9a46), [`5de991c`](https://github.com/LedgerHQ/ledger-live/commit/5de991c8686f473d2323b9c6536c53b7badf5f3d)]:
  - @ledgerhq/cryptoassets@13.49.0
  - @ledgerhq/types-live@6.109.0
  - @ledgerhq/ledger-wallet-framework@1.6.0
  - @ledgerhq/live-env@2.36.0
  - @ledgerhq/live-network@2.6.2

## 0.12.0-next.0

### Minor Changes

- [#17253](https://github.com/LedgerHQ/ledger-live/pull/17253) [`fe04e44`](https://github.com/LedgerHQ/ledger-live/commit/fe04e44e0cd41ea9dd896defcea18c010fe36490) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - chore(ADR-025): rename `AlpacaApi` -> `CoinModuleApi`

### Patch Changes

- Updated dependencies [[`839537d`](https://github.com/LedgerHQ/ledger-live/commit/839537d42f9c2bf87ad0faf64e51966250976055), [`ef47541`](https://github.com/LedgerHQ/ledger-live/commit/ef47541f67995474a82446c416e0825623b5d063), [`a04a4c0`](https://github.com/LedgerHQ/ledger-live/commit/a04a4c0a8bbee5140f685836014409e98af33d02), [`9b75461`](https://github.com/LedgerHQ/ledger-live/commit/9b754610e67e4d31d3d49b566ba1590194265c6f), [`822bc92`](https://github.com/LedgerHQ/ledger-live/commit/822bc92945248ddd31304aa7ca90854c849d217f), [`2eabd7f`](https://github.com/LedgerHQ/ledger-live/commit/2eabd7f56680e1399926a96b4bdeaf628e435999), [`62ec3e5`](https://github.com/LedgerHQ/ledger-live/commit/62ec3e5917ceee80c0384eea6ee0901faa58b08a), [`9ccd154`](https://github.com/LedgerHQ/ledger-live/commit/9ccd1540f6ea912107d9651fa9b66ffd12948111), [`603f343`](https://github.com/LedgerHQ/ledger-live/commit/603f343d64c9b69a5708b419eb7ebfe7cec94554), [`a61f904`](https://github.com/LedgerHQ/ledger-live/commit/a61f90478795bff6956d2a9083ec47d44e6e9a46), [`5de991c`](https://github.com/LedgerHQ/ledger-live/commit/5de991c8686f473d2323b9c6536c53b7badf5f3d)]:
  - @ledgerhq/cryptoassets@13.49.0-next.0
  - @ledgerhq/types-live@6.109.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.6.0-next.0
  - @ledgerhq/live-env@2.36.0-next.0
  - @ledgerhq/live-network@2.6.2-next.0

## 0.11.0

### Minor Changes

- [#17089](https://github.com/LedgerHQ/ledger-live/pull/17089) [`08762c2`](https://github.com/LedgerHQ/ledger-live/commit/08762c286e38136293108c19efa72ae8fbd1286b) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Switch Concordium derivation to canonical 6-segment path `m/44'/<coin>'/0'/0'/0'/<account>'` and split mainnet/testnet coin types (`919`/`1`, the BIP-44 generic testnet). Replaces the previous non-canonical `44'/919'/404'/404'/<account>'` override and aligns with the upstream SDK and device firmware.

### Patch Changes

- Updated dependencies [[`f39fede`](https://github.com/LedgerHQ/ledger-live/commit/f39fede0a6eb4e427a15219e5a3c8fbc3302815f), [`b812751`](https://github.com/LedgerHQ/ledger-live/commit/b8127519474e63c543b1b937a2d3b11ad162a78e), [`3b746ee`](https://github.com/LedgerHQ/ledger-live/commit/3b746eea7f3f2be633947e8e9112987457c864a5), [`1368afd`](https://github.com/LedgerHQ/ledger-live/commit/1368afdc7218a68c803672e6e412f8f9f6e62142), [`abdb866`](https://github.com/LedgerHQ/ledger-live/commit/abdb8662fba3784399a747ece63a11cc4f6e23bb), [`5177d5e`](https://github.com/LedgerHQ/ledger-live/commit/5177d5e6311047cc7485a66dbcb8971c9a8c0a5c), [`3cd7abb`](https://github.com/LedgerHQ/ledger-live/commit/3cd7abb4d6f6072bad62073108d797faf23f9e8c), [`c6170d7`](https://github.com/LedgerHQ/ledger-live/commit/c6170d7b61bc37ef80f8d3e5e608611f9b8ecd67), [`912e673`](https://github.com/LedgerHQ/ledger-live/commit/912e673368baa0342316c882653768d570b71262), [`6e832a0`](https://github.com/LedgerHQ/ledger-live/commit/6e832a044bd7abb704f0a45ea782e55c1b25487c), [`2257d43`](https://github.com/LedgerHQ/ledger-live/commit/2257d43630933127549300f39ade1e2b01f94cb8), [`08762c2`](https://github.com/LedgerHQ/ledger-live/commit/08762c286e38136293108c19efa72ae8fbd1286b)]:
  - @ledgerhq/types-live@6.108.0
  - @ledgerhq/ledger-wallet-framework@1.5.0
  - @ledgerhq/cryptoassets@13.48.0
  - @ledgerhq/live-env@2.35.0
  - @ledgerhq/live-network@2.6.1

## 0.11.0-next.0

### Minor Changes

- [#17089](https://github.com/LedgerHQ/ledger-live/pull/17089) [`08762c2`](https://github.com/LedgerHQ/ledger-live/commit/08762c286e38136293108c19efa72ae8fbd1286b) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Switch Concordium derivation to canonical 6-segment path `m/44'/<coin>'/0'/0'/0'/<account>'` and split mainnet/testnet coin types (`919`/`1`, the BIP-44 generic testnet). Replaces the previous non-canonical `44'/919'/404'/404'/<account>'` override and aligns with the upstream SDK and device firmware.

### Patch Changes

- Updated dependencies [[`f39fede`](https://github.com/LedgerHQ/ledger-live/commit/f39fede0a6eb4e427a15219e5a3c8fbc3302815f), [`b812751`](https://github.com/LedgerHQ/ledger-live/commit/b8127519474e63c543b1b937a2d3b11ad162a78e), [`3b746ee`](https://github.com/LedgerHQ/ledger-live/commit/3b746eea7f3f2be633947e8e9112987457c864a5), [`1368afd`](https://github.com/LedgerHQ/ledger-live/commit/1368afdc7218a68c803672e6e412f8f9f6e62142), [`abdb866`](https://github.com/LedgerHQ/ledger-live/commit/abdb8662fba3784399a747ece63a11cc4f6e23bb), [`5177d5e`](https://github.com/LedgerHQ/ledger-live/commit/5177d5e6311047cc7485a66dbcb8971c9a8c0a5c), [`3cd7abb`](https://github.com/LedgerHQ/ledger-live/commit/3cd7abb4d6f6072bad62073108d797faf23f9e8c), [`c6170d7`](https://github.com/LedgerHQ/ledger-live/commit/c6170d7b61bc37ef80f8d3e5e608611f9b8ecd67), [`912e673`](https://github.com/LedgerHQ/ledger-live/commit/912e673368baa0342316c882653768d570b71262), [`6e832a0`](https://github.com/LedgerHQ/ledger-live/commit/6e832a044bd7abb704f0a45ea782e55c1b25487c), [`2257d43`](https://github.com/LedgerHQ/ledger-live/commit/2257d43630933127549300f39ade1e2b01f94cb8), [`08762c2`](https://github.com/LedgerHQ/ledger-live/commit/08762c286e38136293108c19efa72ae8fbd1286b)]:
  - @ledgerhq/types-live@6.108.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.5.0-next.0
  - @ledgerhq/cryptoassets@13.48.0-next.0
  - @ledgerhq/live-env@2.35.0-next.0
  - @ledgerhq/live-network@2.6.1-next.0

## 0.10.0

### Minor Changes

- [#16996](https://github.com/LedgerHQ/ledger-live/pull/16996) [`3be5049`](https://github.com/LedgerHQ/ledger-live/commit/3be5049c9462d5760d6fec2c99647f0b9773b5b2) Thanks [@YazhuEth](https://github.com/YazhuEth)! - fix: ensure broadcast throws on network errors at all layers (canton, concordium, mina)

- [#16919](https://github.com/LedgerHQ/ledger-live/pull/16919) [`d308b1a`](https://github.com/LedgerHQ/ledger-live/commit/d308b1a6b9c629839f051cf367a527f4232120c7) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Wire live-signer-concordium to new DMK verifyAddress trusted backend based

- [#17188](https://github.com/LedgerHQ/ledger-live/pull/17188) [`e6dc658`](https://github.com/LedgerHQ/ledger-live/commit/e6dc658b83ebd2102e19a1fead021443457c05d9) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Switch Concordium derivation to canonical 6-segment path `m/44'/<coin>'/0'/0'/0'/<account>'` and split mainnet/testnet coin types (`919`/`1`, the BIP-44 generic testnet). Replaces the previous non-canonical `44'/919'/404'/404'/<account>'` override and aligns with the upstream SDK and device firmware.

### Patch Changes

- Updated dependencies [[`ed0dc8a`](https://github.com/LedgerHQ/ledger-live/commit/ed0dc8abc2c8f5054e655c4e12efe6fb433fbaca), [`4ddd97a`](https://github.com/LedgerHQ/ledger-live/commit/4ddd97a99bab5b581ad5ccfd36eb420ec4ee6352), [`7fafa10`](https://github.com/LedgerHQ/ledger-live/commit/7fafa10d8af581f4433a60ea908980a726d3a777), [`ac26c8b`](https://github.com/LedgerHQ/ledger-live/commit/ac26c8bffa9b5cc9f28bed5ce3d44e32982d655c), [`fb79639`](https://github.com/LedgerHQ/ledger-live/commit/fb79639eb81258bae4830ed6ffe375ae625054ad), [`0d11df6`](https://github.com/LedgerHQ/ledger-live/commit/0d11df6ef8dc781171071824ad1c39e3beed7730), [`b866ea6`](https://github.com/LedgerHQ/ledger-live/commit/b866ea67bcbd408a33dbc9233ef55298e2a8ef25), [`321a0e2`](https://github.com/LedgerHQ/ledger-live/commit/321a0e2ce948fac11f7bdf0e106eb0af57168caa), [`d308b1a`](https://github.com/LedgerHQ/ledger-live/commit/d308b1a6b9c629839f051cf367a527f4232120c7), [`21e69fe`](https://github.com/LedgerHQ/ledger-live/commit/21e69fea49cffc0b1204903e539a64b83e4b28f0), [`e6dc658`](https://github.com/LedgerHQ/ledger-live/commit/e6dc658b83ebd2102e19a1fead021443457c05d9), [`fb4d165`](https://github.com/LedgerHQ/ledger-live/commit/fb4d1656be8dc8e933e55600970a2e991fbaeebb), [`5bd95a9`](https://github.com/LedgerHQ/ledger-live/commit/5bd95a9ceaac4d08c87d635f721265357368f8ee), [`73bfe05`](https://github.com/LedgerHQ/ledger-live/commit/73bfe055ec23e0d630f2da9f4dbc9731b6fe5190)]:
  - @ledgerhq/types-live@6.107.0
  - @ledgerhq/ledger-wallet-framework@1.4.0
  - @ledgerhq/live-env@2.34.0
  - @ledgerhq/errors@6.35.0
  - @ledgerhq/cryptoassets@13.47.0
  - @ledgerhq/live-network@2.6.0

## 0.10.0-next.1

### Minor Changes

- [#17188](https://github.com/LedgerHQ/ledger-live/pull/17188) [`e6dc658`](https://github.com/LedgerHQ/ledger-live/commit/e6dc658b83ebd2102e19a1fead021443457c05d9) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Switch Concordium derivation to canonical 6-segment path `m/44'/<coin>'/0'/0'/0'/<account>'` and split mainnet/testnet coin types (`919`/`1`, the BIP-44 generic testnet). Replaces the previous non-canonical `44'/919'/404'/404'/<account>'` override and aligns with the upstream SDK and device firmware.

### Patch Changes

- Updated dependencies [[`e6dc658`](https://github.com/LedgerHQ/ledger-live/commit/e6dc658b83ebd2102e19a1fead021443457c05d9)]:
  - @ledgerhq/cryptoassets@13.47.0-next.1
  - @ledgerhq/ledger-wallet-framework@1.4.0-next.1

## 0.10.0-next.0

### Minor Changes

- [#16996](https://github.com/LedgerHQ/ledger-live/pull/16996) [`3be5049`](https://github.com/LedgerHQ/ledger-live/commit/3be5049c9462d5760d6fec2c99647f0b9773b5b2) Thanks [@YazhuEth](https://github.com/YazhuEth)! - fix: ensure broadcast throws on network errors at all layers (canton, concordium, mina)

- [#16919](https://github.com/LedgerHQ/ledger-live/pull/16919) [`d308b1a`](https://github.com/LedgerHQ/ledger-live/commit/d308b1a6b9c629839f051cf367a527f4232120c7) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Wire live-signer-concordium to new DMK verifyAddress trusted backend based

### Patch Changes

- Updated dependencies [[`ed0dc8a`](https://github.com/LedgerHQ/ledger-live/commit/ed0dc8abc2c8f5054e655c4e12efe6fb433fbaca), [`4ddd97a`](https://github.com/LedgerHQ/ledger-live/commit/4ddd97a99bab5b581ad5ccfd36eb420ec4ee6352), [`7fafa10`](https://github.com/LedgerHQ/ledger-live/commit/7fafa10d8af581f4433a60ea908980a726d3a777), [`ac26c8b`](https://github.com/LedgerHQ/ledger-live/commit/ac26c8bffa9b5cc9f28bed5ce3d44e32982d655c), [`fb79639`](https://github.com/LedgerHQ/ledger-live/commit/fb79639eb81258bae4830ed6ffe375ae625054ad), [`0d11df6`](https://github.com/LedgerHQ/ledger-live/commit/0d11df6ef8dc781171071824ad1c39e3beed7730), [`b866ea6`](https://github.com/LedgerHQ/ledger-live/commit/b866ea67bcbd408a33dbc9233ef55298e2a8ef25), [`321a0e2`](https://github.com/LedgerHQ/ledger-live/commit/321a0e2ce948fac11f7bdf0e106eb0af57168caa), [`d308b1a`](https://github.com/LedgerHQ/ledger-live/commit/d308b1a6b9c629839f051cf367a527f4232120c7), [`21e69fe`](https://github.com/LedgerHQ/ledger-live/commit/21e69fea49cffc0b1204903e539a64b83e4b28f0), [`fb4d165`](https://github.com/LedgerHQ/ledger-live/commit/fb4d1656be8dc8e933e55600970a2e991fbaeebb), [`5bd95a9`](https://github.com/LedgerHQ/ledger-live/commit/5bd95a9ceaac4d08c87d635f721265357368f8ee), [`73bfe05`](https://github.com/LedgerHQ/ledger-live/commit/73bfe055ec23e0d630f2da9f4dbc9731b6fe5190)]:
  - @ledgerhq/types-live@6.107.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.4.0-next.0
  - @ledgerhq/live-env@2.34.0-next.0
  - @ledgerhq/errors@6.35.0-next.0
  - @ledgerhq/cryptoassets@13.47.0-next.0
  - @ledgerhq/live-network@2.6.0-next.0

## 0.9.2

### Patch Changes

- Updated dependencies [[`202cc42`](https://github.com/LedgerHQ/ledger-live/commit/202cc423b09662b5b25012b84124aecd4dc7245d)]:
  - @ledgerhq/errors@6.34.1
  - @ledgerhq/ledger-wallet-framework@1.3.2
  - @ledgerhq/cryptoassets@13.46.2
  - @ledgerhq/live-network@2.5.2

## 0.9.2-hotfix.0

### Patch Changes

- Updated dependencies [[`202cc42`](https://github.com/LedgerHQ/ledger-live/commit/202cc423b09662b5b25012b84124aecd4dc7245d)]:
  - @ledgerhq/errors@6.34.1-hotfix.0
  - @ledgerhq/ledger-wallet-framework@1.3.2-hotfix.0
  - @ledgerhq/cryptoassets@13.46.2-hotfix.0
  - @ledgerhq/live-network@2.5.2-hotfix.0

## 0.9.1

### Patch Changes

- Updated dependencies [[`fbff5f4`](https://github.com/LedgerHQ/ledger-live/commit/fbff5f407027cb2b24834fea53ef21a3ef93bf95), [`e377079`](https://github.com/LedgerHQ/ledger-live/commit/e3770793670b73d4409bd5be2081ca922e8679ac), [`45e134c`](https://github.com/LedgerHQ/ledger-live/commit/45e134c63f204444a5997109f4807447f51469ee)]:
  - @ledgerhq/types-live@6.106.0
  - @ledgerhq/ledger-wallet-framework@1.3.1
  - @ledgerhq/cryptoassets@13.46.1

## 0.9.1-next.0

### Patch Changes

- Updated dependencies [[`fbff5f4`](https://github.com/LedgerHQ/ledger-live/commit/fbff5f407027cb2b24834fea53ef21a3ef93bf95), [`e377079`](https://github.com/LedgerHQ/ledger-live/commit/e3770793670b73d4409bd5be2081ca922e8679ac), [`45e134c`](https://github.com/LedgerHQ/ledger-live/commit/45e134c63f204444a5997109f4807447f51469ee)]:
  - @ledgerhq/types-live@6.106.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.3.1-next.0
  - @ledgerhq/cryptoassets@13.46.1-next.0

## 0.9.0

### Minor Changes

- [#15887](https://github.com/LedgerHQ/ledger-live/pull/15887) [`5fefc2e`](https://github.com/LedgerHQ/ledger-live/commit/5fefc2e6a4c6e4fdcaae0139f2f8d6f9011b33c8) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Remove @ledgerhq/types-cryptoassets dependency from coin-framework by replacing CryptoCurrency parameters with currencyId strings in CoinConfig and getCurrencyConfiguration

- [#15823](https://github.com/LedgerHQ/ledger-live/pull/15823) [`24656de`](https://github.com/LedgerHQ/ledger-live/commit/24656dea461d4d99dcb5f5e2e4b4e949b0823eeb) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Reduce redundant eth_call calls to node by implementing includeAssets from BalanceOptions

- [#15679](https://github.com/LedgerHQ/ledger-live/pull/15679) [`c353f29`](https://github.com/LedgerHQ/ledger-live/commit/c353f29b9174c20c708662c160f55c597020ee58) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - chore(coin-modules): add oxfmt with shared config (Prettier parity)

  - Add libs/coin-modules/.oxfmtrc.json aligned with root .prettierrc and desktop/mobile oxfmt
  - Add format, format:check, and run oxfmt before oxlint in lint:fix; add oxfmt devDependency
  - Remove coin-ton prettier script; turbo format/format:check tasks
  - Initial oxfmt pass on src

- [#15998](https://github.com/LedgerHQ/ledger-live/pull/15998) [`d9adb6d`](https://github.com/LedgerHQ/ledger-live/commit/d9adb6dac6fa0a23cf7d9a0af1c38e21dfbacff8) Thanks [@amaslakov](https://github.com/amaslakov)! - Replace dynamic import of @walletconnect/sign-client with static import and add rspack ProvidePlugin for TextDecoder polyfill to fix mobile code splitting and startup crash

- [#15798](https://github.com/LedgerHQ/ledger-live/pull/15798) [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore: use `coin-module-framework` from npmjs and remove the now migrated `coin-framework`

### Patch Changes

- Updated dependencies [[`ad5a37d`](https://github.com/LedgerHQ/ledger-live/commit/ad5a37d077dced734defcd464f120825e7bbf5e9), [`2d5c7e0`](https://github.com/LedgerHQ/ledger-live/commit/2d5c7e0cc27f45babe247b39b513d4e848707b01), [`78acbfa`](https://github.com/LedgerHQ/ledger-live/commit/78acbfae7319c5b3fb1453f8727e2210e895669c), [`1bd0cac`](https://github.com/LedgerHQ/ledger-live/commit/1bd0cac7957422fa06e18424e9e2706c39072078), [`7aa0706`](https://github.com/LedgerHQ/ledger-live/commit/7aa070618866e7a4c70876e674f07fde9630ccfb), [`3b83607`](https://github.com/LedgerHQ/ledger-live/commit/3b83607a045142a8408784c92b57d8bde01445df), [`24656de`](https://github.com/LedgerHQ/ledger-live/commit/24656dea461d4d99dcb5f5e2e4b4e949b0823eeb), [`c910c1b`](https://github.com/LedgerHQ/ledger-live/commit/c910c1bd9b4f7fbcc0e33fe19b33da44085ab7f9), [`139cdbf`](https://github.com/LedgerHQ/ledger-live/commit/139cdbfd48120247ff54f5f7863ce866a6a755d0), [`4cf9b8c`](https://github.com/LedgerHQ/ledger-live/commit/4cf9b8cde388aebfe04a894e9a35584856d1713d), [`97d7278`](https://github.com/LedgerHQ/ledger-live/commit/97d727824cef6a5b5a2d034d9b029e4f977f1754), [`63b5b9a`](https://github.com/LedgerHQ/ledger-live/commit/63b5b9a3f3b88fa41f02983350cdb6e73a887839), [`f36e748`](https://github.com/LedgerHQ/ledger-live/commit/f36e74881c03a25164c0eac24b13765bbbbbb440), [`46e78cf`](https://github.com/LedgerHQ/ledger-live/commit/46e78cf3a057a9de39a5abbb49fe779655db6507), [`cd59c95`](https://github.com/LedgerHQ/ledger-live/commit/cd59c95d04bd886114802ca887e1209d2191eaee), [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21)]:
  - @ledgerhq/cryptoassets@13.46.0
  - @ledgerhq/types-live@6.105.0
  - @ledgerhq/live-env@2.33.0
  - @ledgerhq/ledger-wallet-framework@1.3.0
  - @ledgerhq/concordium-core@0.4.0
  - @ledgerhq/errors@6.34.0
  - @ledgerhq/live-network@2.5.1

## 0.9.0-next.0

### Minor Changes

- [#15887](https://github.com/LedgerHQ/ledger-live/pull/15887) [`5fefc2e`](https://github.com/LedgerHQ/ledger-live/commit/5fefc2e6a4c6e4fdcaae0139f2f8d6f9011b33c8) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Remove @ledgerhq/types-cryptoassets dependency from coin-framework by replacing CryptoCurrency parameters with currencyId strings in CoinConfig and getCurrencyConfiguration

- [#15823](https://github.com/LedgerHQ/ledger-live/pull/15823) [`24656de`](https://github.com/LedgerHQ/ledger-live/commit/24656dea461d4d99dcb5f5e2e4b4e949b0823eeb) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Reduce redundant eth_call calls to node by implementing includeAssets from BalanceOptions

- [#15679](https://github.com/LedgerHQ/ledger-live/pull/15679) [`c353f29`](https://github.com/LedgerHQ/ledger-live/commit/c353f29b9174c20c708662c160f55c597020ee58) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - chore(coin-modules): add oxfmt with shared config (Prettier parity)

  - Add libs/coin-modules/.oxfmtrc.json aligned with root .prettierrc and desktop/mobile oxfmt
  - Add format, format:check, and run oxfmt before oxlint in lint:fix; add oxfmt devDependency
  - Remove coin-ton prettier script; turbo format/format:check tasks
  - Initial oxfmt pass on src

- [#15998](https://github.com/LedgerHQ/ledger-live/pull/15998) [`d9adb6d`](https://github.com/LedgerHQ/ledger-live/commit/d9adb6dac6fa0a23cf7d9a0af1c38e21dfbacff8) Thanks [@amaslakov](https://github.com/amaslakov)! - Replace dynamic import of @walletconnect/sign-client with static import and add rspack ProvidePlugin for TextDecoder polyfill to fix mobile code splitting and startup crash

- [#15798](https://github.com/LedgerHQ/ledger-live/pull/15798) [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore: use `coin-module-framework` from npmjs and remove the now migrated `coin-framework`

### Patch Changes

- Updated dependencies [[`ad5a37d`](https://github.com/LedgerHQ/ledger-live/commit/ad5a37d077dced734defcd464f120825e7bbf5e9), [`2d5c7e0`](https://github.com/LedgerHQ/ledger-live/commit/2d5c7e0cc27f45babe247b39b513d4e848707b01), [`78acbfa`](https://github.com/LedgerHQ/ledger-live/commit/78acbfae7319c5b3fb1453f8727e2210e895669c), [`1bd0cac`](https://github.com/LedgerHQ/ledger-live/commit/1bd0cac7957422fa06e18424e9e2706c39072078), [`7aa0706`](https://github.com/LedgerHQ/ledger-live/commit/7aa070618866e7a4c70876e674f07fde9630ccfb), [`3b83607`](https://github.com/LedgerHQ/ledger-live/commit/3b83607a045142a8408784c92b57d8bde01445df), [`24656de`](https://github.com/LedgerHQ/ledger-live/commit/24656dea461d4d99dcb5f5e2e4b4e949b0823eeb), [`c910c1b`](https://github.com/LedgerHQ/ledger-live/commit/c910c1bd9b4f7fbcc0e33fe19b33da44085ab7f9), [`139cdbf`](https://github.com/LedgerHQ/ledger-live/commit/139cdbfd48120247ff54f5f7863ce866a6a755d0), [`4cf9b8c`](https://github.com/LedgerHQ/ledger-live/commit/4cf9b8cde388aebfe04a894e9a35584856d1713d), [`97d7278`](https://github.com/LedgerHQ/ledger-live/commit/97d727824cef6a5b5a2d034d9b029e4f977f1754), [`63b5b9a`](https://github.com/LedgerHQ/ledger-live/commit/63b5b9a3f3b88fa41f02983350cdb6e73a887839), [`f36e748`](https://github.com/LedgerHQ/ledger-live/commit/f36e74881c03a25164c0eac24b13765bbbbbb440), [`46e78cf`](https://github.com/LedgerHQ/ledger-live/commit/46e78cf3a057a9de39a5abbb49fe779655db6507), [`cd59c95`](https://github.com/LedgerHQ/ledger-live/commit/cd59c95d04bd886114802ca887e1209d2191eaee), [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21)]:
  - @ledgerhq/cryptoassets@13.46.0-next.0
  - @ledgerhq/types-live@6.105.0-next.0
  - @ledgerhq/live-env@2.33.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.3.0-next.0
  - @ledgerhq/concordium-core@0.4.0-next.0
  - @ledgerhq/errors@6.34.0-next.0
  - @ledgerhq/live-network@2.5.1-next.0

## 0.8.0

### Minor Changes

- [#15887](https://github.com/LedgerHQ/ledger-live/pull/15887) [`5fefc2e`](https://github.com/LedgerHQ/ledger-live/commit/5fefc2e6a4c6e4fdcaae0139f2f8d6f9011b33c8) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Remove @ledgerhq/types-cryptoassets dependency from coin-framework by replacing CryptoCurrency parameters with currencyId strings in CoinConfig and getCurrencyConfiguration

- [#15679](https://github.com/LedgerHQ/ledger-live/pull/15679) [`c353f29`](https://github.com/LedgerHQ/ledger-live/commit/c353f29b9174c20c708662c160f55c597020ee58) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - chore(coin-modules): add oxfmt with shared config (Prettier parity)

  - Add libs/coin-modules/.oxfmtrc.json aligned with root .prettierrc and desktop/mobile oxfmt
  - Add format, format:check, and run oxfmt before oxlint in lint:fix; add oxfmt devDependency
  - Remove coin-ton prettier script; turbo format/format:check tasks
  - Initial oxfmt pass on src

- [#16101](https://github.com/LedgerHQ/ledger-live/pull/16101) [`8320e62`](https://github.com/LedgerHQ/ledger-live/commit/8320e626e47aada5de3e29c57c9e1f57de9d01ae) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Replace dynamic import of @walletconnect/sign-client with static import and add rspack ProvidePlugin for TextDecoder polyfill to fix mobile code splitting and startup crash

- [#15798](https://github.com/LedgerHQ/ledger-live/pull/15798) [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore: use `coin-module-framework` from npmjs and remove the now migrated `coin-framework`

### Patch Changes

- Updated dependencies [[`24e8f80`](https://github.com/LedgerHQ/ledger-live/commit/24e8f80dc314619f954e6966aff8698591d6e05e), [`ea34195`](https://github.com/LedgerHQ/ledger-live/commit/ea34195c1115aaa40c69259ee2d2ee581e0349ab), [`7ffc0c5`](https://github.com/LedgerHQ/ledger-live/commit/7ffc0c5a7623aea32cdff2e093c14fae87352e71), [`53df748`](https://github.com/LedgerHQ/ledger-live/commit/53df74819753f084ed3df4a2ab9082d398b54920), [`9413def`](https://github.com/LedgerHQ/ledger-live/commit/9413def2fb1eccfc0ec8ce38bbcaf982981a0dd9), [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8), [`2ece647`](https://github.com/LedgerHQ/ledger-live/commit/2ece647f386e40f261662fc6e4e6624f302ee34f), [`55c01bc`](https://github.com/LedgerHQ/ledger-live/commit/55c01bcd8e43f9a54e93a41bb383d6d5c633b35f), [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21)]:
  - @ledgerhq/types-live@6.104.0
  - @ledgerhq/live-env@2.32.0
  - @ledgerhq/errors@6.33.0
  - @ledgerhq/ledger-wallet-framework@1.2.0
  - @ledgerhq/cryptoassets@13.45.0
  - @ledgerhq/logs@6.17.0
  - @ledgerhq/live-network@2.5.0
  - @ledgerhq/live-promise@0.2.3

## 0.8.0-next.1

### Minor Changes

- [#16101](https://github.com/LedgerHQ/ledger-live/pull/16101) [`8320e62`](https://github.com/LedgerHQ/ledger-live/commit/8320e626e47aada5de3e29c57c9e1f57de9d01ae) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Replace dynamic import of @walletconnect/sign-client with static import and add rspack ProvidePlugin for TextDecoder polyfill to fix mobile code splitting and startup crash

## 0.8.0-next.0

### Minor Changes

- [#15887](https://github.com/LedgerHQ/ledger-live/pull/15887) [`5fefc2e`](https://github.com/LedgerHQ/ledger-live/commit/5fefc2e6a4c6e4fdcaae0139f2f8d6f9011b33c8) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Remove @ledgerhq/types-cryptoassets dependency from coin-framework by replacing CryptoCurrency parameters with currencyId strings in CoinConfig and getCurrencyConfiguration

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
  - @ledgerhq/logs@6.17.0-next.0
  - @ledgerhq/live-network@2.5.0-next.0
  - @ledgerhq/live-promise@0.2.3-next.0

## 0.7.1

### Patch Changes

- Updated dependencies [[`4af828d`](https://github.com/LedgerHQ/ledger-live/commit/4af828d0790bb3568dd095f89dd9f239f7565e84), [`1bf4e7e`](https://github.com/LedgerHQ/ledger-live/commit/1bf4e7efa2fbb310f9c3db8f5d72e68294f0f3fe), [`d0559d8`](https://github.com/LedgerHQ/ledger-live/commit/d0559d84e119c844d92dc82c7648d0d9dc6c6e20), [`deec161`](https://github.com/LedgerHQ/ledger-live/commit/deec16153656d444336f067970dcda5fff016d95), [`e0de96e`](https://github.com/LedgerHQ/ledger-live/commit/e0de96e6311de7e34715784da5941e60ed5c51cc), [`41d172e`](https://github.com/LedgerHQ/ledger-live/commit/41d172e74bc074995b7290c4bb6d129276a484ff), [`c5c58e4`](https://github.com/LedgerHQ/ledger-live/commit/c5c58e4efab303a5b6bccc463f91241f4e0f72bc)]:
  - @ledgerhq/coin-framework@7.1.0
  - @ledgerhq/types-live@6.103.0
  - @ledgerhq/cryptoassets@13.44.0
  - @ledgerhq/ledger-wallet-framework@1.1.0
  - @ledgerhq/live-env@2.31.0
  - @ledgerhq/live-network@2.4.3

## 0.7.1-next.0

### Patch Changes

- Updated dependencies [[`4af828d`](https://github.com/LedgerHQ/ledger-live/commit/4af828d0790bb3568dd095f89dd9f239f7565e84), [`1bf4e7e`](https://github.com/LedgerHQ/ledger-live/commit/1bf4e7efa2fbb310f9c3db8f5d72e68294f0f3fe), [`d0559d8`](https://github.com/LedgerHQ/ledger-live/commit/d0559d84e119c844d92dc82c7648d0d9dc6c6e20), [`deec161`](https://github.com/LedgerHQ/ledger-live/commit/deec16153656d444336f067970dcda5fff016d95), [`e0de96e`](https://github.com/LedgerHQ/ledger-live/commit/e0de96e6311de7e34715784da5941e60ed5c51cc), [`41d172e`](https://github.com/LedgerHQ/ledger-live/commit/41d172e74bc074995b7290c4bb6d129276a484ff), [`c5c58e4`](https://github.com/LedgerHQ/ledger-live/commit/c5c58e4efab303a5b6bccc463f91241f4e0f72bc)]:
  - @ledgerhq/coin-framework@7.1.0-next.0
  - @ledgerhq/types-live@6.103.0-next.0
  - @ledgerhq/cryptoassets@13.44.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.1.0-next.0
  - @ledgerhq/live-env@2.31.0-next.0
  - @ledgerhq/live-network@2.4.3-next.0

## 0.7.0

### Minor Changes

- [#15291](https://github.com/LedgerHQ/ledger-live/pull/15291) [`a221ae8`](https://github.com/LedgerHQ/ledger-live/commit/a221ae85b846c6d5dc6efb55ed873942d7720b05) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat: add `ledger-wallet-framework`

- [#15340](https://github.com/LedgerHQ/ledger-live/pull/15340) [`f0e0303`](https://github.com/LedgerHQ/ledger-live/commit/f0e0303e07f9ab97586d261bba55addc218ebb0c) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Removed gRPC-powered getBlock

- [#15513](https://github.com/LedgerHQ/ledger-live/pull/15513) [`8ce1cb7`](https://github.com/LedgerHQ/ledger-live/commit/8ce1cb755b3e68c8688f9e828596d3c2605ef3cb) Thanks [@lysyi3m](https://github.com/lysyi3m)! - share onboarding error types between desktop and mobile

- [#15383](https://github.com/LedgerHQ/ledger-live/pull/15383) [`b76ebac`](https://github.com/LedgerHQ/ledger-live/commit/b76ebac99eb485e5a8dc0607ab8325639ef30a9e) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Removed gRPC client and proto files; added blockHeight-based operations history incremental sync.

- [#15387](https://github.com/LedgerHQ/ledger-live/pull/15387) [`5eeb5c0`](https://github.com/LedgerHQ/ledger-live/commit/5eeb5c0af77c9930de849fd23d4a724be7b3bee5) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-xrp): remove unused `feeCustomUnit`

### Patch Changes

- Updated dependencies [[`a221ae8`](https://github.com/LedgerHQ/ledger-live/commit/a221ae85b846c6d5dc6efb55ed873942d7720b05), [`a270b43`](https://github.com/LedgerHQ/ledger-live/commit/a270b438bf8aca99b795679fecce1b55dc249c12), [`6dac7f9`](https://github.com/LedgerHQ/ledger-live/commit/6dac7f974c28dcae409c110a60061996490c5088), [`8ce1cb7`](https://github.com/LedgerHQ/ledger-live/commit/8ce1cb755b3e68c8688f9e828596d3c2605ef3cb), [`01c81b1`](https://github.com/LedgerHQ/ledger-live/commit/01c81b112ab326eff436f0f3279a1225c073f897), [`3ede91a`](https://github.com/LedgerHQ/ledger-live/commit/3ede91a3674a80c9309d305b871ec3b6e9849b41)]:
  - @ledgerhq/coin-framework@7.0.0
  - @ledgerhq/types-live@6.102.0
  - @ledgerhq/errors@6.32.0
  - @ledgerhq/cryptoassets@13.43.0
  - @ledgerhq/ledger-wallet-framework@1.0.1
  - @ledgerhq/live-network@2.4.2

## 0.7.0-next.0

### Minor Changes

- [#15291](https://github.com/LedgerHQ/ledger-live/pull/15291) [`a221ae8`](https://github.com/LedgerHQ/ledger-live/commit/a221ae85b846c6d5dc6efb55ed873942d7720b05) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat: add `ledger-wallet-framework`

- [#15340](https://github.com/LedgerHQ/ledger-live/pull/15340) [`f0e0303`](https://github.com/LedgerHQ/ledger-live/commit/f0e0303e07f9ab97586d261bba55addc218ebb0c) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Removed gRPC-powered getBlock

- [#15513](https://github.com/LedgerHQ/ledger-live/pull/15513) [`8ce1cb7`](https://github.com/LedgerHQ/ledger-live/commit/8ce1cb755b3e68c8688f9e828596d3c2605ef3cb) Thanks [@lysyi3m](https://github.com/lysyi3m)! - share onboarding error types between desktop and mobile

- [#15383](https://github.com/LedgerHQ/ledger-live/pull/15383) [`b76ebac`](https://github.com/LedgerHQ/ledger-live/commit/b76ebac99eb485e5a8dc0607ab8325639ef30a9e) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Removed gRPC client and proto files; added blockHeight-based operations history incremental sync.

- [#15387](https://github.com/LedgerHQ/ledger-live/pull/15387) [`5eeb5c0`](https://github.com/LedgerHQ/ledger-live/commit/5eeb5c0af77c9930de849fd23d4a724be7b3bee5) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-xrp): remove unused `feeCustomUnit`

### Patch Changes

- Updated dependencies [[`a221ae8`](https://github.com/LedgerHQ/ledger-live/commit/a221ae85b846c6d5dc6efb55ed873942d7720b05), [`a270b43`](https://github.com/LedgerHQ/ledger-live/commit/a270b438bf8aca99b795679fecce1b55dc249c12), [`6dac7f9`](https://github.com/LedgerHQ/ledger-live/commit/6dac7f974c28dcae409c110a60061996490c5088), [`8ce1cb7`](https://github.com/LedgerHQ/ledger-live/commit/8ce1cb755b3e68c8688f9e828596d3c2605ef3cb), [`01c81b1`](https://github.com/LedgerHQ/ledger-live/commit/01c81b112ab326eff436f0f3279a1225c073f897), [`3ede91a`](https://github.com/LedgerHQ/ledger-live/commit/3ede91a3674a80c9309d305b871ec3b6e9849b41)]:
  - @ledgerhq/coin-framework@7.0.0-next.0
  - @ledgerhq/types-live@6.102.0-next.0
  - @ledgerhq/errors@6.32.0-next.0
  - @ledgerhq/cryptoassets@13.43.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.0.1-next.0
  - @ledgerhq/live-network@2.4.2-next.0

## 0.6.0

### Minor Changes

- [#15300](https://github.com/LedgerHQ/ledger-live/pull/15300) [`7e97cac`](https://github.com/LedgerHQ/ledger-live/commit/7e97cacb31ded3dfd9428766693aad2c7b72cfbf) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Migrate last finalized block fetching from gRPC to wallet-proxy REST API for cross-platform support

- [#15157](https://github.com/LedgerHQ/ledger-live/pull/15157) [`2883c86`](https://github.com/LedgerHQ/ledger-live/commit/2883c86ee3748ed2281e81d7a32c6fe390f8105e) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - chore(concordium): include protobufs in package

- [#15055](https://github.com/LedgerHQ/ledger-live/pull/15055) [`f77c5bf`](https://github.com/LedgerHQ/ledger-live/commit/f77c5bf0b3f0a0412229d31f00612987b92dd62c) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Decouple coin-concordium module from CryptoCurrency type, using currencyId: string throughout network, logic, bridge, and API layers.

- [#15242](https://github.com/LedgerHQ/ledger-live/pull/15242) [`7038137`](https://github.com/LedgerHQ/ledger-live/commit/703813747349288325fdc661637644d980073b9d) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-framework): move functions to `AlpacaApi`

- [#15309](https://github.com/LedgerHQ/ledger-live/pull/15309) [`dba04e6`](https://github.com/LedgerHQ/ledger-live/commit/dba04e6bbf4e973cd71f856e734b22e86e7d5554) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Migrate getBlockInfo from gRPC to wallet-proxy REST endpoints (/v0/blocksAtHeight, /v0/blockInfo), removing gRPC dependency from the block info flow.

- [#15237](https://github.com/LedgerHQ/ledger-live/pull/15237) [`312d92d`](https://github.com/LedgerHQ/ledger-live/commit/312d92dbd9d115a2ec6ad6628445c31d45806aea) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-framework): duplicate `BroadcastConfig` inside coin framework

- [#15124](https://github.com/LedgerHQ/ledger-live/pull/15124) [`9c1cb42`](https://github.com/LedgerHQ/ledger-live/commit/9c1cb42b2d74ab8aa6543cae384b264e331a888c) Thanks [@lysyi3m](https://github.com/lysyi3m)! - coin-concordium: add grpcClient.web.ts stub and browser field override to prevent @grpc/grpc-js from being bundled in web environments.

### Patch Changes

- Updated dependencies [[`c8d7be6`](https://github.com/LedgerHQ/ledger-live/commit/c8d7be6964aa9d8defd77de0b77ba7d42f472025), [`ffb3c46`](https://github.com/LedgerHQ/ledger-live/commit/ffb3c46acd292b9ac0f46a2b84509d02775a5f20), [`7cbfb7d`](https://github.com/LedgerHQ/ledger-live/commit/7cbfb7dd2d52ad8380ab4d37b02f63292699cd68), [`bfa4315`](https://github.com/LedgerHQ/ledger-live/commit/bfa4315d2f3b4b95c5a742ffd6e05272662f4550), [`17e1fb3`](https://github.com/LedgerHQ/ledger-live/commit/17e1fb3fdb92d6dab9af72adcbcde62bdd772a71), [`75dfb86`](https://github.com/LedgerHQ/ledger-live/commit/75dfb86c871a026aa90136d0184637878d484484), [`7038137`](https://github.com/LedgerHQ/ledger-live/commit/703813747349288325fdc661637644d980073b9d), [`e6f26e0`](https://github.com/LedgerHQ/ledger-live/commit/e6f26e0f475763aaf3271e2d4ed6cf36fb1f5060), [`42bf9b7`](https://github.com/LedgerHQ/ledger-live/commit/42bf9b7c40c04c7d2eeffba30b778be0b123bfd0), [`164788e`](https://github.com/LedgerHQ/ledger-live/commit/164788e4a7e9c063d7769d44393708632854cb0a), [`9f559e9`](https://github.com/LedgerHQ/ledger-live/commit/9f559e98a1af37073e0e79ee5bb54b4aaecfb8c4), [`312d92d`](https://github.com/LedgerHQ/ledger-live/commit/312d92dbd9d115a2ec6ad6628445c31d45806aea), [`08ee941`](https://github.com/LedgerHQ/ledger-live/commit/08ee9414908ec1f7489493c98b9a823a20cce550), [`fd24208`](https://github.com/LedgerHQ/ledger-live/commit/fd242082615ef0af25f0f5f96389b7406fc194dc), [`8cb2da1`](https://github.com/LedgerHQ/ledger-live/commit/8cb2da1f175f143666abcb66ef94bd230456846d), [`173946c`](https://github.com/LedgerHQ/ledger-live/commit/173946ce652ffef216f04d82b680b14f5686500e), [`70f6288`](https://github.com/LedgerHQ/ledger-live/commit/70f6288597722a1e8fd6b5884d843f27be87e9d8), [`ad66568`](https://github.com/LedgerHQ/ledger-live/commit/ad66568fd9c96cfa08d11123a711e3fa79705f65), [`79f2f0e`](https://github.com/LedgerHQ/ledger-live/commit/79f2f0e3e8b8089664d2aee7c3dd25c7685aec2c), [`4cc02f3`](https://github.com/LedgerHQ/ledger-live/commit/4cc02f3c1ba0bdb93917b5427a375ab44cd5d208), [`37bc15e`](https://github.com/LedgerHQ/ledger-live/commit/37bc15e245107ce1044f36b57d191552a77329e6)]:
  - @ledgerhq/cryptoassets@13.42.0
  - @ledgerhq/errors@6.31.0
  - @ledgerhq/logs@6.16.0
  - @ledgerhq/types-live@6.101.0
  - @ledgerhq/coin-framework@6.20.0
  - @ledgerhq/live-env@2.30.0
  - @ledgerhq/live-network@2.4.1
  - @ledgerhq/live-promise@0.2.2

## 0.6.0-next.0

### Minor Changes

- [#15300](https://github.com/LedgerHQ/ledger-live/pull/15300) [`7e97cac`](https://github.com/LedgerHQ/ledger-live/commit/7e97cacb31ded3dfd9428766693aad2c7b72cfbf) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Migrate last finalized block fetching from gRPC to wallet-proxy REST API for cross-platform support

- [#15157](https://github.com/LedgerHQ/ledger-live/pull/15157) [`2883c86`](https://github.com/LedgerHQ/ledger-live/commit/2883c86ee3748ed2281e81d7a32c6fe390f8105e) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - chore(concordium): include protobufs in package

- [#15055](https://github.com/LedgerHQ/ledger-live/pull/15055) [`f77c5bf`](https://github.com/LedgerHQ/ledger-live/commit/f77c5bf0b3f0a0412229d31f00612987b92dd62c) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Decouple coin-concordium module from CryptoCurrency type, using currencyId: string throughout network, logic, bridge, and API layers.

- [#15242](https://github.com/LedgerHQ/ledger-live/pull/15242) [`7038137`](https://github.com/LedgerHQ/ledger-live/commit/703813747349288325fdc661637644d980073b9d) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-framework): move functions to `AlpacaApi`

- [#15309](https://github.com/LedgerHQ/ledger-live/pull/15309) [`dba04e6`](https://github.com/LedgerHQ/ledger-live/commit/dba04e6bbf4e973cd71f856e734b22e86e7d5554) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Migrate getBlockInfo from gRPC to wallet-proxy REST endpoints (/v0/blocksAtHeight, /v0/blockInfo), removing gRPC dependency from the block info flow.

- [#15237](https://github.com/LedgerHQ/ledger-live/pull/15237) [`312d92d`](https://github.com/LedgerHQ/ledger-live/commit/312d92dbd9d115a2ec6ad6628445c31d45806aea) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-framework): duplicate `BroadcastConfig` inside coin framework

- [#15124](https://github.com/LedgerHQ/ledger-live/pull/15124) [`9c1cb42`](https://github.com/LedgerHQ/ledger-live/commit/9c1cb42b2d74ab8aa6543cae384b264e331a888c) Thanks [@lysyi3m](https://github.com/lysyi3m)! - coin-concordium: add grpcClient.web.ts stub and browser field override to prevent @grpc/grpc-js from being bundled in web environments.

### Patch Changes

- Updated dependencies [[`c8d7be6`](https://github.com/LedgerHQ/ledger-live/commit/c8d7be6964aa9d8defd77de0b77ba7d42f472025), [`ffb3c46`](https://github.com/LedgerHQ/ledger-live/commit/ffb3c46acd292b9ac0f46a2b84509d02775a5f20), [`7cbfb7d`](https://github.com/LedgerHQ/ledger-live/commit/7cbfb7dd2d52ad8380ab4d37b02f63292699cd68), [`bfa4315`](https://github.com/LedgerHQ/ledger-live/commit/bfa4315d2f3b4b95c5a742ffd6e05272662f4550), [`17e1fb3`](https://github.com/LedgerHQ/ledger-live/commit/17e1fb3fdb92d6dab9af72adcbcde62bdd772a71), [`75dfb86`](https://github.com/LedgerHQ/ledger-live/commit/75dfb86c871a026aa90136d0184637878d484484), [`7038137`](https://github.com/LedgerHQ/ledger-live/commit/703813747349288325fdc661637644d980073b9d), [`e6f26e0`](https://github.com/LedgerHQ/ledger-live/commit/e6f26e0f475763aaf3271e2d4ed6cf36fb1f5060), [`42bf9b7`](https://github.com/LedgerHQ/ledger-live/commit/42bf9b7c40c04c7d2eeffba30b778be0b123bfd0), [`164788e`](https://github.com/LedgerHQ/ledger-live/commit/164788e4a7e9c063d7769d44393708632854cb0a), [`9f559e9`](https://github.com/LedgerHQ/ledger-live/commit/9f559e98a1af37073e0e79ee5bb54b4aaecfb8c4), [`312d92d`](https://github.com/LedgerHQ/ledger-live/commit/312d92dbd9d115a2ec6ad6628445c31d45806aea), [`08ee941`](https://github.com/LedgerHQ/ledger-live/commit/08ee9414908ec1f7489493c98b9a823a20cce550), [`fd24208`](https://github.com/LedgerHQ/ledger-live/commit/fd242082615ef0af25f0f5f96389b7406fc194dc), [`8cb2da1`](https://github.com/LedgerHQ/ledger-live/commit/8cb2da1f175f143666abcb66ef94bd230456846d), [`173946c`](https://github.com/LedgerHQ/ledger-live/commit/173946ce652ffef216f04d82b680b14f5686500e), [`70f6288`](https://github.com/LedgerHQ/ledger-live/commit/70f6288597722a1e8fd6b5884d843f27be87e9d8), [`ad66568`](https://github.com/LedgerHQ/ledger-live/commit/ad66568fd9c96cfa08d11123a711e3fa79705f65), [`79f2f0e`](https://github.com/LedgerHQ/ledger-live/commit/79f2f0e3e8b8089664d2aee7c3dd25c7685aec2c), [`4cc02f3`](https://github.com/LedgerHQ/ledger-live/commit/4cc02f3c1ba0bdb93917b5427a375ab44cd5d208), [`37bc15e`](https://github.com/LedgerHQ/ledger-live/commit/37bc15e245107ce1044f36b57d191552a77329e6)]:
  - @ledgerhq/cryptoassets@13.42.0-next.0
  - @ledgerhq/errors@6.31.0-next.0
  - @ledgerhq/logs@6.16.0-next.0
  - @ledgerhq/types-live@6.101.0-next.0
  - @ledgerhq/coin-framework@6.20.0-next.0
  - @ledgerhq/live-env@2.30.0-next.0
  - @ledgerhq/live-network@2.4.1-next.0
  - @ledgerhq/live-promise@0.2.2-next.0

## 0.5.0

### Minor Changes

- [#14987](https://github.com/LedgerHQ/ledger-live/pull/14987) [`0bd5738`](https://github.com/LedgerHQ/ledger-live/commit/0bd5738ebd994c6dd7ace206fa5e7a2cd487e1a8) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Refactor API and network layers: simplify craftRawTransaction, estimateFees, and wallet-proxy method signatures for consistency.

- [#14926](https://github.com/LedgerHQ/ledger-live/pull/14926) [`e3628db`](https://github.com/LedgerHQ/ledger-live/commit/e3628db2abf9df401333a4040fe0f87ce48f2e9e) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Move Concordium gRPC React Native overrides to coin-concordium level

- [#14913](https://github.com/LedgerHQ/ledger-live/pull/14913) [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update TypeScript to latest 5.8.x

### Patch Changes

- Updated dependencies [[`748b933`](https://github.com/LedgerHQ/ledger-live/commit/748b933f3786e48ec9dd434c76263c2c9a642c99), [`0dbbca3`](https://github.com/LedgerHQ/ledger-live/commit/0dbbca3f0226347b5abc034a066fe4ad89bfe462), [`9f9ae16`](https://github.com/LedgerHQ/ledger-live/commit/9f9ae16843e5db339c1d40c844a66f75fff498fb), [`ba4d56f`](https://github.com/LedgerHQ/ledger-live/commit/ba4d56fa223b87b89d621de2d1885c5a55922ef4), [`697f2e6`](https://github.com/LedgerHQ/ledger-live/commit/697f2e6f5b24ff023a46cbbbf5c9f85bac90a4c4), [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f)]:
  - @ledgerhq/types-live@6.100.0
  - @ledgerhq/errors@6.30.0
  - @ledgerhq/coin-framework@6.19.0
  - @ledgerhq/cryptoassets@13.41.0
  - @ledgerhq/logs@6.15.0
  - @ledgerhq/concordium-core@0.3.0
  - @ledgerhq/live-network@2.4.0
  - @ledgerhq/live-promise@0.2.1

## 0.5.0-next.0

### Minor Changes

- [#14987](https://github.com/LedgerHQ/ledger-live/pull/14987) [`0bd5738`](https://github.com/LedgerHQ/ledger-live/commit/0bd5738ebd994c6dd7ace206fa5e7a2cd487e1a8) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Refactor API and network layers: simplify craftRawTransaction, estimateFees, and wallet-proxy method signatures for consistency.

- [#14926](https://github.com/LedgerHQ/ledger-live/pull/14926) [`e3628db`](https://github.com/LedgerHQ/ledger-live/commit/e3628db2abf9df401333a4040fe0f87ce48f2e9e) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Move Concordium gRPC React Native overrides to coin-concordium level

- [#14913](https://github.com/LedgerHQ/ledger-live/pull/14913) [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update TypeScript to latest 5.8.x

### Patch Changes

- Updated dependencies [[`748b933`](https://github.com/LedgerHQ/ledger-live/commit/748b933f3786e48ec9dd434c76263c2c9a642c99), [`0dbbca3`](https://github.com/LedgerHQ/ledger-live/commit/0dbbca3f0226347b5abc034a066fe4ad89bfe462), [`9f9ae16`](https://github.com/LedgerHQ/ledger-live/commit/9f9ae16843e5db339c1d40c844a66f75fff498fb), [`ba4d56f`](https://github.com/LedgerHQ/ledger-live/commit/ba4d56fa223b87b89d621de2d1885c5a55922ef4), [`697f2e6`](https://github.com/LedgerHQ/ledger-live/commit/697f2e6f5b24ff023a46cbbbf5c9f85bac90a4c4), [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f)]:
  - @ledgerhq/types-live@6.100.0-next.0
  - @ledgerhq/errors@6.30.0-next.0
  - @ledgerhq/coin-framework@6.19.0-next.0
  - @ledgerhq/cryptoassets@13.41.0-next.0
  - @ledgerhq/logs@6.15.0-next.0
  - @ledgerhq/concordium-core@0.3.0-next.0
  - @ledgerhq/live-network@2.4.0-next.0
  - @ledgerhq/live-promise@0.2.1-next.0

## 0.4.0

### Minor Changes

- [#13986](https://github.com/LedgerHQ/ledger-live/pull/13986) [`07fdf5a`](https://github.com/LedgerHQ/ledger-live/commit/07fdf5a4bcd12cb0cc5100389c8e355800d3aec0) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - Alpaca API cleanup and documentation

- [#14258](https://github.com/LedgerHQ/ledger-live/pull/14258) [`5f1c644`](https://github.com/LedgerHQ/ledger-live/commit/5f1c644fd5f757f48618b62e976faac274ced40d) Thanks [@lysyi3m](https://github.com/lysyi3m)! - added concordium proxy & grpc client and core functionality implementation; extracted shared concordium-core package with types, serialization, CBOR and address utilities; simplified hw-app-concordium API to single signTransaction method with type-based routing

### Patch Changes

- Updated dependencies [[`a96dc83`](https://github.com/LedgerHQ/ledger-live/commit/a96dc83916684e22c041904c479c615a3095303b), [`e954c1e`](https://github.com/LedgerHQ/ledger-live/commit/e954c1e0f0e45efe3b0e8c3fda9e6d5b22b5bc01), [`e292df3`](https://github.com/LedgerHQ/ledger-live/commit/e292df30514168181545d7a572f723e31df78e77), [`17149ee`](https://github.com/LedgerHQ/ledger-live/commit/17149ee26eeef8a600d650a6f4903c52320a0d8d), [`ec8a2d6`](https://github.com/LedgerHQ/ledger-live/commit/ec8a2d619b85117e2d74c595c6eae5cae6fda433), [`2ca4f6c`](https://github.com/LedgerHQ/ledger-live/commit/2ca4f6c337a29cd81874261c697d74c82a312eee), [`3bb5c2e`](https://github.com/LedgerHQ/ledger-live/commit/3bb5c2e335c05945b1a7bc8c77d19d0ea03156a6), [`07fdf5a`](https://github.com/LedgerHQ/ledger-live/commit/07fdf5a4bcd12cb0cc5100389c8e355800d3aec0), [`b7dec5c`](https://github.com/LedgerHQ/ledger-live/commit/b7dec5c2a41520114593701c82192ff8ae8ce06f), [`f51402e`](https://github.com/LedgerHQ/ledger-live/commit/f51402ebb8a4f05a933df3c3ef499756fbde5cc8), [`5f1c644`](https://github.com/LedgerHQ/ledger-live/commit/5f1c644fd5f757f48618b62e976faac274ced40d), [`c7ed360`](https://github.com/LedgerHQ/ledger-live/commit/c7ed36086280d60631e235d375cc2db5f60e8aab), [`cc4c8f5`](https://github.com/LedgerHQ/ledger-live/commit/cc4c8f57e38586d77b89f32d359e65cc700912af)]:
  - @ledgerhq/types-live@6.99.0
  - @ledgerhq/cryptoassets@13.40.0
  - @ledgerhq/live-env@2.29.0
  - @ledgerhq/coin-framework@6.18.0
  - @ledgerhq/live-network@2.3.0
  - @ledgerhq/concordium-core@0.2.0

## 0.4.0-next.0

### Minor Changes

- [#13986](https://github.com/LedgerHQ/ledger-live/pull/13986) [`07fdf5a`](https://github.com/LedgerHQ/ledger-live/commit/07fdf5a4bcd12cb0cc5100389c8e355800d3aec0) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - Alpaca API cleanup and documentation

- [#14258](https://github.com/LedgerHQ/ledger-live/pull/14258) [`5f1c644`](https://github.com/LedgerHQ/ledger-live/commit/5f1c644fd5f757f48618b62e976faac274ced40d) Thanks [@lysyi3m](https://github.com/lysyi3m)! - added concordium proxy & grpc client and core functionality implementation; extracted shared concordium-core package with types, serialization, CBOR and address utilities; simplified hw-app-concordium API to single signTransaction method with type-based routing

### Patch Changes

- Updated dependencies [[`a96dc83`](https://github.com/LedgerHQ/ledger-live/commit/a96dc83916684e22c041904c479c615a3095303b), [`e954c1e`](https://github.com/LedgerHQ/ledger-live/commit/e954c1e0f0e45efe3b0e8c3fda9e6d5b22b5bc01), [`e292df3`](https://github.com/LedgerHQ/ledger-live/commit/e292df30514168181545d7a572f723e31df78e77), [`17149ee`](https://github.com/LedgerHQ/ledger-live/commit/17149ee26eeef8a600d650a6f4903c52320a0d8d), [`ec8a2d6`](https://github.com/LedgerHQ/ledger-live/commit/ec8a2d619b85117e2d74c595c6eae5cae6fda433), [`2ca4f6c`](https://github.com/LedgerHQ/ledger-live/commit/2ca4f6c337a29cd81874261c697d74c82a312eee), [`3bb5c2e`](https://github.com/LedgerHQ/ledger-live/commit/3bb5c2e335c05945b1a7bc8c77d19d0ea03156a6), [`07fdf5a`](https://github.com/LedgerHQ/ledger-live/commit/07fdf5a4bcd12cb0cc5100389c8e355800d3aec0), [`b7dec5c`](https://github.com/LedgerHQ/ledger-live/commit/b7dec5c2a41520114593701c82192ff8ae8ce06f), [`f51402e`](https://github.com/LedgerHQ/ledger-live/commit/f51402ebb8a4f05a933df3c3ef499756fbde5cc8), [`5f1c644`](https://github.com/LedgerHQ/ledger-live/commit/5f1c644fd5f757f48618b62e976faac274ced40d), [`c7ed360`](https://github.com/LedgerHQ/ledger-live/commit/c7ed36086280d60631e235d375cc2db5f60e8aab), [`cc4c8f5`](https://github.com/LedgerHQ/ledger-live/commit/cc4c8f57e38586d77b89f32d359e65cc700912af)]:
  - @ledgerhq/types-live@6.99.0-next.0
  - @ledgerhq/cryptoassets@13.40.0-next.0
  - @ledgerhq/live-env@2.29.0-next.0
  - @ledgerhq/coin-framework@6.18.0-next.0
  - @ledgerhq/live-network@2.3.0-next.0
  - @ledgerhq/concordium-core@0.2.0-next.0

## 0.3.5

### Patch Changes

- Updated dependencies [[`e08c1be`](https://github.com/LedgerHQ/ledger-live/commit/e08c1be127e6a9c246c285ba818530e6756033e0), [`19e62ca`](https://github.com/LedgerHQ/ledger-live/commit/19e62ca57461e3201ce8186023d7896411fce0e0), [`d02f203`](https://github.com/LedgerHQ/ledger-live/commit/d02f2035e4f2ac6c3b446cf4107cd017ea4faf43), [`e12fd1e`](https://github.com/LedgerHQ/ledger-live/commit/e12fd1eb27189a668cd8e61798256a0c20c0f078)]:
  - @ledgerhq/types-live@6.98.0
  - @ledgerhq/live-env@2.28.0
  - @ledgerhq/coin-framework@6.17.0
  - @ledgerhq/cryptoassets@13.39.1
  - @ledgerhq/live-network@2.2.3

## 0.3.5-next.0

### Patch Changes

- Updated dependencies [[`e08c1be`](https://github.com/LedgerHQ/ledger-live/commit/e08c1be127e6a9c246c285ba818530e6756033e0), [`19e62ca`](https://github.com/LedgerHQ/ledger-live/commit/19e62ca57461e3201ce8186023d7896411fce0e0), [`d02f203`](https://github.com/LedgerHQ/ledger-live/commit/d02f2035e4f2ac6c3b446cf4107cd017ea4faf43), [`e12fd1e`](https://github.com/LedgerHQ/ledger-live/commit/e12fd1eb27189a668cd8e61798256a0c20c0f078)]:
  - @ledgerhq/types-live@6.98.0-next.0
  - @ledgerhq/live-env@2.28.0-next.0
  - @ledgerhq/coin-framework@6.17.0-next.0
  - @ledgerhq/cryptoassets@13.39.1-next.0
  - @ledgerhq/live-network@2.2.3-next.0

## 0.3.4

### Patch Changes

- Updated dependencies [[`03b3105`](https://github.com/LedgerHQ/ledger-live/commit/03b3105efe8094b79ba70432e475fdc5d945c2c4), [`d5da9e0`](https://github.com/LedgerHQ/ledger-live/commit/d5da9e04d7a92b3f7f9df9d462bdd101cadbd300), [`7896aa2`](https://github.com/LedgerHQ/ledger-live/commit/7896aa2dacc12e6781267fa3ca2965aa6fb018d2), [`8a258aa`](https://github.com/LedgerHQ/ledger-live/commit/8a258aa0655123d22f955067acffaf9f74661165), [`c61dc02`](https://github.com/LedgerHQ/ledger-live/commit/c61dc0268072ca43cf726efd17dc11f21eb37ce8), [`8006565`](https://github.com/LedgerHQ/ledger-live/commit/8006565f77487fa0e38bf5f8d7bb4cda4cdba1f5), [`2ec4196`](https://github.com/LedgerHQ/ledger-live/commit/2ec419630bceab7a9600711742a18034ba9ff3cc), [`fe678a1`](https://github.com/LedgerHQ/ledger-live/commit/fe678a1d16eeda84cf8d802eee53026ea677be58), [`de9d068`](https://github.com/LedgerHQ/ledger-live/commit/de9d068800ed2ae72aca0126855480d3eeb12989)]:
  - @ledgerhq/coin-framework@6.16.0
  - @ledgerhq/cryptoassets@13.39.0
  - @ledgerhq/types-live@6.97.0

## 0.3.4-next.0

### Patch Changes

- Updated dependencies [[`03b3105`](https://github.com/LedgerHQ/ledger-live/commit/03b3105efe8094b79ba70432e475fdc5d945c2c4), [`d5da9e0`](https://github.com/LedgerHQ/ledger-live/commit/d5da9e04d7a92b3f7f9df9d462bdd101cadbd300), [`7896aa2`](https://github.com/LedgerHQ/ledger-live/commit/7896aa2dacc12e6781267fa3ca2965aa6fb018d2), [`8a258aa`](https://github.com/LedgerHQ/ledger-live/commit/8a258aa0655123d22f955067acffaf9f74661165), [`c61dc02`](https://github.com/LedgerHQ/ledger-live/commit/c61dc0268072ca43cf726efd17dc11f21eb37ce8), [`8006565`](https://github.com/LedgerHQ/ledger-live/commit/8006565f77487fa0e38bf5f8d7bb4cda4cdba1f5), [`2ec4196`](https://github.com/LedgerHQ/ledger-live/commit/2ec419630bceab7a9600711742a18034ba9ff3cc), [`fe678a1`](https://github.com/LedgerHQ/ledger-live/commit/fe678a1d16eeda84cf8d802eee53026ea677be58), [`de9d068`](https://github.com/LedgerHQ/ledger-live/commit/de9d068800ed2ae72aca0126855480d3eeb12989)]:
  - @ledgerhq/coin-framework@6.16.0-next.0
  - @ledgerhq/cryptoassets@13.39.0-next.0
  - @ledgerhq/types-live@6.97.0-next.0

## 0.3.3

### Patch Changes

- Updated dependencies [[`d7b6d27`](https://github.com/LedgerHQ/ledger-live/commit/d7b6d27d86cade7fcae8013ae66df72532aec3df), [`da660cc`](https://github.com/LedgerHQ/ledger-live/commit/da660ccccf87d97bfdff2b2a066c8b3b422b2d93), [`2d750da`](https://github.com/LedgerHQ/ledger-live/commit/2d750da3bcda547e8c4639e655c5129580baeaad), [`96acd67`](https://github.com/LedgerHQ/ledger-live/commit/96acd679f345729cddcdf73191d4b2a0f948ad5a), [`bf34cf5`](https://github.com/LedgerHQ/ledger-live/commit/bf34cf516a26081ddd493bb01042b1a0e462b029), [`7a75642`](https://github.com/LedgerHQ/ledger-live/commit/7a75642c2f56e27c778106d60a44049917d04014)]:
  - @ledgerhq/types-live@6.96.0
  - @ledgerhq/coin-framework@6.15.0
  - @ledgerhq/live-env@2.27.0
  - @ledgerhq/cryptoassets@13.38.1
  - @ledgerhq/live-network@2.2.2

## 0.3.3-next.0

### Patch Changes

- Updated dependencies [[`d7b6d27`](https://github.com/LedgerHQ/ledger-live/commit/d7b6d27d86cade7fcae8013ae66df72532aec3df), [`da660cc`](https://github.com/LedgerHQ/ledger-live/commit/da660ccccf87d97bfdff2b2a066c8b3b422b2d93), [`2d750da`](https://github.com/LedgerHQ/ledger-live/commit/2d750da3bcda547e8c4639e655c5129580baeaad), [`96acd67`](https://github.com/LedgerHQ/ledger-live/commit/96acd679f345729cddcdf73191d4b2a0f948ad5a), [`bf34cf5`](https://github.com/LedgerHQ/ledger-live/commit/bf34cf516a26081ddd493bb01042b1a0e462b029), [`7a75642`](https://github.com/LedgerHQ/ledger-live/commit/7a75642c2f56e27c778106d60a44049917d04014)]:
  - @ledgerhq/types-live@6.96.0-next.0
  - @ledgerhq/coin-framework@6.15.0-next.0
  - @ledgerhq/live-env@2.27.0-next.0
  - @ledgerhq/cryptoassets@13.38.1-next.0
  - @ledgerhq/live-network@2.2.2-next.0

## 0.3.2

### Patch Changes

- Updated dependencies [[`dd1122e`](https://github.com/LedgerHQ/ledger-live/commit/dd1122eeb6e9c582541446ff82a488928fa340c2), [`363b630`](https://github.com/LedgerHQ/ledger-live/commit/363b63050ab007266d2c1158a27e4fce79081983), [`cb69f67`](https://github.com/LedgerHQ/ledger-live/commit/cb69f67326834079695935103530d0b24ad3772d), [`1d2d196`](https://github.com/LedgerHQ/ledger-live/commit/1d2d19635c28db69adb04dcd21219b51836186f5), [`9a99ae9`](https://github.com/LedgerHQ/ledger-live/commit/9a99ae9c6b4a99cdda500ae0e216037799de5cd5), [`556dd22`](https://github.com/LedgerHQ/ledger-live/commit/556dd22dd505b4b5ae865ffe36fc5b5aa22a4f81)]:
  - @ledgerhq/coin-framework@6.14.0
  - @ledgerhq/cryptoassets@13.38.0
  - @ledgerhq/types-live@6.95.0

## 0.3.2-next.0

### Patch Changes

- Updated dependencies [[`dd1122e`](https://github.com/LedgerHQ/ledger-live/commit/dd1122eeb6e9c582541446ff82a488928fa340c2), [`363b630`](https://github.com/LedgerHQ/ledger-live/commit/363b63050ab007266d2c1158a27e4fce79081983), [`cb69f67`](https://github.com/LedgerHQ/ledger-live/commit/cb69f67326834079695935103530d0b24ad3772d), [`1d2d196`](https://github.com/LedgerHQ/ledger-live/commit/1d2d19635c28db69adb04dcd21219b51836186f5), [`9a99ae9`](https://github.com/LedgerHQ/ledger-live/commit/9a99ae9c6b4a99cdda500ae0e216037799de5cd5), [`556dd22`](https://github.com/LedgerHQ/ledger-live/commit/556dd22dd505b4b5ae865ffe36fc5b5aa22a4f81)]:
  - @ledgerhq/coin-framework@6.14.0-next.0
  - @ledgerhq/cryptoassets@13.38.0-next.0
  - @ledgerhq/types-live@6.95.0-next.0

## 0.3.1

### Patch Changes

- Updated dependencies [[`c84be03`](https://github.com/LedgerHQ/ledger-live/commit/c84be039f162fd3af72861fd1605f4141c8f0792), [`819d969`](https://github.com/LedgerHQ/ledger-live/commit/819d96907febd9a68a6407c1bad06f475d044a4d), [`6532080`](https://github.com/LedgerHQ/ledger-live/commit/6532080d2a0f5e49052aeab0bf532ee5cd52694a), [`069d298`](https://github.com/LedgerHQ/ledger-live/commit/069d2982cd36c9525addf9d1f9df762a8799b3bb)]:
  - @ledgerhq/types-live@6.94.0
  - @ledgerhq/live-env@2.26.0
  - @ledgerhq/coin-framework@6.13.1
  - @ledgerhq/cryptoassets@13.37.1
  - @ledgerhq/live-network@2.2.1

## 0.3.1-next.0

### Patch Changes

- Updated dependencies [[`c84be03`](https://github.com/LedgerHQ/ledger-live/commit/c84be039f162fd3af72861fd1605f4141c8f0792), [`819d969`](https://github.com/LedgerHQ/ledger-live/commit/819d96907febd9a68a6407c1bad06f475d044a4d), [`6532080`](https://github.com/LedgerHQ/ledger-live/commit/6532080d2a0f5e49052aeab0bf532ee5cd52694a), [`069d298`](https://github.com/LedgerHQ/ledger-live/commit/069d2982cd36c9525addf9d1f9df762a8799b3bb)]:
  - @ledgerhq/types-live@6.94.0-next.0
  - @ledgerhq/live-env@2.26.0-next.0
  - @ledgerhq/coin-framework@6.13.1-next.0
  - @ledgerhq/cryptoassets@13.37.1-next.0
  - @ledgerhq/live-network@2.2.1-next.0

## 0.3.0

### Minor Changes

- [#13396](https://github.com/LedgerHQ/ledger-live/pull/13396) [`b9a3e43`](https://github.com/LedgerHQ/ledger-live/commit/b9a3e431be33943ab4feb4294d6a7f27b966e61b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update Jest to v30

### Patch Changes

- Updated dependencies [[`537a975`](https://github.com/LedgerHQ/ledger-live/commit/537a975536ca3669d3b88371e1e1f651c4cb9a1b), [`cbcae7c`](https://github.com/LedgerHQ/ledger-live/commit/cbcae7c0ba9b54b1167d26e4227bd2b847207cb9), [`8754614`](https://github.com/LedgerHQ/ledger-live/commit/87546149a62b81f8a25bb6222626592ead629f62), [`50bae0f`](https://github.com/LedgerHQ/ledger-live/commit/50bae0f13a95ef166b2c5609ccbcf5ef01ba1579), [`cf08174`](https://github.com/LedgerHQ/ledger-live/commit/cf0817462e9f0210fceff29ec60b0699e4e69b71), [`b9a3e43`](https://github.com/LedgerHQ/ledger-live/commit/b9a3e431be33943ab4feb4294d6a7f27b966e61b), [`3ac5f26`](https://github.com/LedgerHQ/ledger-live/commit/3ac5f26111f8596327fa7e588e514509de3f8a59), [`7f05536`](https://github.com/LedgerHQ/ledger-live/commit/7f0553665e9c8721f263825cc79994bfc6729d9b)]:
  - @ledgerhq/cryptoassets@13.37.0
  - @ledgerhq/coin-framework@6.13.0
  - @ledgerhq/types-live@6.93.0
  - @ledgerhq/live-env@2.25.0
  - @ledgerhq/devices@8.10.0
  - @ledgerhq/errors@6.29.0
  - @ledgerhq/live-network@2.2.0

## 0.3.0-next.0

### Minor Changes

- [#13396](https://github.com/LedgerHQ/ledger-live/pull/13396) [`b9a3e43`](https://github.com/LedgerHQ/ledger-live/commit/b9a3e431be33943ab4feb4294d6a7f27b966e61b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update Jest to v30

### Patch Changes

- Updated dependencies [[`537a975`](https://github.com/LedgerHQ/ledger-live/commit/537a975536ca3669d3b88371e1e1f651c4cb9a1b), [`cbcae7c`](https://github.com/LedgerHQ/ledger-live/commit/cbcae7c0ba9b54b1167d26e4227bd2b847207cb9), [`8754614`](https://github.com/LedgerHQ/ledger-live/commit/87546149a62b81f8a25bb6222626592ead629f62), [`50bae0f`](https://github.com/LedgerHQ/ledger-live/commit/50bae0f13a95ef166b2c5609ccbcf5ef01ba1579), [`cf08174`](https://github.com/LedgerHQ/ledger-live/commit/cf0817462e9f0210fceff29ec60b0699e4e69b71), [`b9a3e43`](https://github.com/LedgerHQ/ledger-live/commit/b9a3e431be33943ab4feb4294d6a7f27b966e61b), [`3ac5f26`](https://github.com/LedgerHQ/ledger-live/commit/3ac5f26111f8596327fa7e588e514509de3f8a59), [`7f05536`](https://github.com/LedgerHQ/ledger-live/commit/7f0553665e9c8721f263825cc79994bfc6729d9b)]:
  - @ledgerhq/cryptoassets@13.37.0-next.0
  - @ledgerhq/coin-framework@6.13.0-next.0
  - @ledgerhq/types-live@6.93.0-next.0
  - @ledgerhq/live-env@2.25.0-next.0
  - @ledgerhq/devices@8.10.0-next.0
  - @ledgerhq/errors@6.29.0-next.0
  - @ledgerhq/live-network@2.2.0-next.0

## 0.2.2

### Patch Changes

- Updated dependencies [[`6e6a12c`](https://github.com/LedgerHQ/ledger-live/commit/6e6a12cdfd79b752839bf664bab5156cea9c9e23), [`398b3d8`](https://github.com/LedgerHQ/ledger-live/commit/398b3d85d2de4a520d5ae78a18135f8d163aad5b), [`7e12cd3`](https://github.com/LedgerHQ/ledger-live/commit/7e12cd30f47d42cd8dac35cfa475abdd9ad44e19), [`a8c59da`](https://github.com/LedgerHQ/ledger-live/commit/a8c59da888c8cb3c200a9f62869ca54aba706cae), [`4455451`](https://github.com/LedgerHQ/ledger-live/commit/445545117cf0196d7c5a303df21041c23b91844c), [`8cb7d40`](https://github.com/LedgerHQ/ledger-live/commit/8cb7d40e0a55e47f42adc5cd522740cab1fd4de4), [`fba1e31`](https://github.com/LedgerHQ/ledger-live/commit/fba1e31386e589a93adb19bc4f6eae55129e19ea), [`e57fa40`](https://github.com/LedgerHQ/ledger-live/commit/e57fa40a1bb480ebcc03120a1aab3b02e249bf8d), [`e844b3b`](https://github.com/LedgerHQ/ledger-live/commit/e844b3bd5f8a4b21cf94e0a598c22a2a42791490), [`c2d4259`](https://github.com/LedgerHQ/ledger-live/commit/c2d425989b600732f4fb0a88993e2673e93698a7), [`9e80ecc`](https://github.com/LedgerHQ/ledger-live/commit/9e80ecc5ef6da4f39a184d3c555c8d7c439754a8), [`ffa9e7e`](https://github.com/LedgerHQ/ledger-live/commit/ffa9e7e58dd60d0f568362a95e14ba5d130c2d07), [`4caf2ef`](https://github.com/LedgerHQ/ledger-live/commit/4caf2eff2aff2a6f1048ccf8e94295c954554ae1), [`c4045c7`](https://github.com/LedgerHQ/ledger-live/commit/c4045c714ee0fb1f02f6e75cae04e99cdea01ae4)]:
  - @ledgerhq/cryptoassets@13.36.0
  - @ledgerhq/coin-framework@6.12.0
  - @ledgerhq/types-live@6.92.0
  - @ledgerhq/devices@8.9.0
  - @ledgerhq/live-env@2.24.0
  - @ledgerhq/live-network@2.1.5

## 0.2.2-next.1

### Patch Changes

- Updated dependencies [[`398b3d8`](https://github.com/LedgerHQ/ledger-live/commit/398b3d85d2de4a520d5ae78a18135f8d163aad5b)]:
  - @ledgerhq/coin-framework@6.12.0-next.1

## 0.2.2-next.0

### Patch Changes

- Updated dependencies [[`6e6a12c`](https://github.com/LedgerHQ/ledger-live/commit/6e6a12cdfd79b752839bf664bab5156cea9c9e23), [`7e12cd3`](https://github.com/LedgerHQ/ledger-live/commit/7e12cd30f47d42cd8dac35cfa475abdd9ad44e19), [`a8c59da`](https://github.com/LedgerHQ/ledger-live/commit/a8c59da888c8cb3c200a9f62869ca54aba706cae), [`4455451`](https://github.com/LedgerHQ/ledger-live/commit/445545117cf0196d7c5a303df21041c23b91844c), [`8cb7d40`](https://github.com/LedgerHQ/ledger-live/commit/8cb7d40e0a55e47f42adc5cd522740cab1fd4de4), [`fba1e31`](https://github.com/LedgerHQ/ledger-live/commit/fba1e31386e589a93adb19bc4f6eae55129e19ea), [`e57fa40`](https://github.com/LedgerHQ/ledger-live/commit/e57fa40a1bb480ebcc03120a1aab3b02e249bf8d), [`e844b3b`](https://github.com/LedgerHQ/ledger-live/commit/e844b3bd5f8a4b21cf94e0a598c22a2a42791490), [`c2d4259`](https://github.com/LedgerHQ/ledger-live/commit/c2d425989b600732f4fb0a88993e2673e93698a7), [`9e80ecc`](https://github.com/LedgerHQ/ledger-live/commit/9e80ecc5ef6da4f39a184d3c555c8d7c439754a8), [`ffa9e7e`](https://github.com/LedgerHQ/ledger-live/commit/ffa9e7e58dd60d0f568362a95e14ba5d130c2d07), [`4caf2ef`](https://github.com/LedgerHQ/ledger-live/commit/4caf2eff2aff2a6f1048ccf8e94295c954554ae1), [`c4045c7`](https://github.com/LedgerHQ/ledger-live/commit/c4045c714ee0fb1f02f6e75cae04e99cdea01ae4)]:
  - @ledgerhq/cryptoassets@13.36.0-next.0
  - @ledgerhq/types-live@6.92.0-next.0
  - @ledgerhq/devices@8.9.0-next.0
  - @ledgerhq/live-env@2.24.0-next.0
  - @ledgerhq/coin-framework@6.11.2-next.0
  - @ledgerhq/live-network@2.1.5-next.0

## 0.2.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/types-live@6.91.1
  - @ledgerhq/coin-framework@6.11.1
  - @ledgerhq/cryptoassets@13.35.1

## 0.2.1-hotfix.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/types-live@6.91.1-hotfix.0
  - @ledgerhq/coin-framework@6.11.1-hotfix.0
  - @ledgerhq/cryptoassets@13.35.1-hotfix.0

## 0.2.0

### Minor Changes

- [#13167](https://github.com/LedgerHQ/ledger-live/pull/13167) [`e44d216`](https://github.com/LedgerHQ/ledger-live/commit/e44d216d516df87e13f033ed64fedc1ce96380f4) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Concordium module init

### Patch Changes

- Updated dependencies [[`480a08a`](https://github.com/LedgerHQ/ledger-live/commit/480a08ae190119829910b46ecc6d2a9fb11bb7c2), [`19a54fd`](https://github.com/LedgerHQ/ledger-live/commit/19a54fd89a2d3c7481aebc28817870875f9d44dc), [`e63194f`](https://github.com/LedgerHQ/ledger-live/commit/e63194f7dbd5ff2b0135c26aac3842a2be676b0a), [`bc76d51`](https://github.com/LedgerHQ/ledger-live/commit/bc76d5154d35f8340b6b282c4909cd26920b8d40), [`4be69a7`](https://github.com/LedgerHQ/ledger-live/commit/4be69a71dcd7624a1cba8dd1b1847ef009eb2d83), [`7ae71b6`](https://github.com/LedgerHQ/ledger-live/commit/7ae71b64161424b398b63f77da5127085143fcdc), [`5fa83e4`](https://github.com/LedgerHQ/ledger-live/commit/5fa83e49c5fb103da7ecf0777b7e75bb35d5ed61), [`c5da2ce`](https://github.com/LedgerHQ/ledger-live/commit/c5da2cef7cded2b53c1af9aa3174cd27e5c92e0a), [`450f518`](https://github.com/LedgerHQ/ledger-live/commit/450f518d4cedb828c5fe1e7ccffaabd483f53226), [`30be235`](https://github.com/LedgerHQ/ledger-live/commit/30be2354822b3497c69322294ff1dab43375be50), [`bdacedf`](https://github.com/LedgerHQ/ledger-live/commit/bdacedfe32bea8ffce96ab675a44c0d7cf395143), [`0924eed`](https://github.com/LedgerHQ/ledger-live/commit/0924eed6a633793999e8657076140523e30ae40b), [`5e8d6be`](https://github.com/LedgerHQ/ledger-live/commit/5e8d6be609dd37c48d747890e56189e0716d5273), [`768718d`](https://github.com/LedgerHQ/ledger-live/commit/768718df029bc8799b88c0299925dc56302b0c53), [`a5ad7d4`](https://github.com/LedgerHQ/ledger-live/commit/a5ad7d4578c06db3e40f260451b644c27e20cb62), [`3e70677`](https://github.com/LedgerHQ/ledger-live/commit/3e706774f8c4e9b768ab18b67abc3471cf61b6b6), [`aadb3d5`](https://github.com/LedgerHQ/ledger-live/commit/aadb3d57f5719cc2cc397975eafec8094b160afe), [`e44d216`](https://github.com/LedgerHQ/ledger-live/commit/e44d216d516df87e13f033ed64fedc1ce96380f4), [`d4bad44`](https://github.com/LedgerHQ/ledger-live/commit/d4bad4433c3fb083d95820d2927a9e8beeaf244f), [`8d8e1b7`](https://github.com/LedgerHQ/ledger-live/commit/8d8e1b7bb26305af326ea21710248223d1e8653b), [`07de7a8`](https://github.com/LedgerHQ/ledger-live/commit/07de7a87415ae4d1126e751d6a4d521ced3065e3), [`d37fa4b`](https://github.com/LedgerHQ/ledger-live/commit/d37fa4baf4534161bffe5033ce44fc7780c79d89), [`5e0556a`](https://github.com/LedgerHQ/ledger-live/commit/5e0556a3bd0ea60277462eed10c997b17b09d299), [`bce6610`](https://github.com/LedgerHQ/ledger-live/commit/bce6610ca8554a85f8f17b6014e921fdecd3fa4f), [`ddd40b4`](https://github.com/LedgerHQ/ledger-live/commit/ddd40b4cae93ecf3139fd33dc0f4dd1c8366d628), [`2a60165`](https://github.com/LedgerHQ/ledger-live/commit/2a601656b7a23a424a29f006ec53090648fdae4f), [`34248c3`](https://github.com/LedgerHQ/ledger-live/commit/34248c306479dafe6335b2c176daf25064c85b3b), [`2d9f320`](https://github.com/LedgerHQ/ledger-live/commit/2d9f32087eea12ae9d5ea2347b277b8bf4e60f55), [`c56ab86`](https://github.com/LedgerHQ/ledger-live/commit/c56ab86ab65597caf87a09b7596faa54f3104bd4)]:
  - @ledgerhq/coin-framework@6.11.0
  - @ledgerhq/types-live@6.91.0
  - @ledgerhq/cryptoassets@13.35.0
  - @ledgerhq/errors@6.28.0
  - @ledgerhq/live-env@2.23.0
  - @ledgerhq/devices@8.8.0
  - @ledgerhq/live-network@2.1.4

## 0.2.0-next.0

### Minor Changes

- [#13167](https://github.com/LedgerHQ/ledger-live/pull/13167) [`e44d216`](https://github.com/LedgerHQ/ledger-live/commit/e44d216d516df87e13f033ed64fedc1ce96380f4) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Concordium module init

### Patch Changes

- Updated dependencies [[`480a08a`](https://github.com/LedgerHQ/ledger-live/commit/480a08ae190119829910b46ecc6d2a9fb11bb7c2), [`19a54fd`](https://github.com/LedgerHQ/ledger-live/commit/19a54fd89a2d3c7481aebc28817870875f9d44dc), [`e63194f`](https://github.com/LedgerHQ/ledger-live/commit/e63194f7dbd5ff2b0135c26aac3842a2be676b0a), [`bc76d51`](https://github.com/LedgerHQ/ledger-live/commit/bc76d5154d35f8340b6b282c4909cd26920b8d40), [`4be69a7`](https://github.com/LedgerHQ/ledger-live/commit/4be69a71dcd7624a1cba8dd1b1847ef009eb2d83), [`7ae71b6`](https://github.com/LedgerHQ/ledger-live/commit/7ae71b64161424b398b63f77da5127085143fcdc), [`5fa83e4`](https://github.com/LedgerHQ/ledger-live/commit/5fa83e49c5fb103da7ecf0777b7e75bb35d5ed61), [`c5da2ce`](https://github.com/LedgerHQ/ledger-live/commit/c5da2cef7cded2b53c1af9aa3174cd27e5c92e0a), [`450f518`](https://github.com/LedgerHQ/ledger-live/commit/450f518d4cedb828c5fe1e7ccffaabd483f53226), [`30be235`](https://github.com/LedgerHQ/ledger-live/commit/30be2354822b3497c69322294ff1dab43375be50), [`bdacedf`](https://github.com/LedgerHQ/ledger-live/commit/bdacedfe32bea8ffce96ab675a44c0d7cf395143), [`0924eed`](https://github.com/LedgerHQ/ledger-live/commit/0924eed6a633793999e8657076140523e30ae40b), [`5e8d6be`](https://github.com/LedgerHQ/ledger-live/commit/5e8d6be609dd37c48d747890e56189e0716d5273), [`768718d`](https://github.com/LedgerHQ/ledger-live/commit/768718df029bc8799b88c0299925dc56302b0c53), [`a5ad7d4`](https://github.com/LedgerHQ/ledger-live/commit/a5ad7d4578c06db3e40f260451b644c27e20cb62), [`3e70677`](https://github.com/LedgerHQ/ledger-live/commit/3e706774f8c4e9b768ab18b67abc3471cf61b6b6), [`aadb3d5`](https://github.com/LedgerHQ/ledger-live/commit/aadb3d57f5719cc2cc397975eafec8094b160afe), [`e44d216`](https://github.com/LedgerHQ/ledger-live/commit/e44d216d516df87e13f033ed64fedc1ce96380f4), [`d4bad44`](https://github.com/LedgerHQ/ledger-live/commit/d4bad4433c3fb083d95820d2927a9e8beeaf244f), [`8d8e1b7`](https://github.com/LedgerHQ/ledger-live/commit/8d8e1b7bb26305af326ea21710248223d1e8653b), [`07de7a8`](https://github.com/LedgerHQ/ledger-live/commit/07de7a87415ae4d1126e751d6a4d521ced3065e3), [`d37fa4b`](https://github.com/LedgerHQ/ledger-live/commit/d37fa4baf4534161bffe5033ce44fc7780c79d89), [`5e0556a`](https://github.com/LedgerHQ/ledger-live/commit/5e0556a3bd0ea60277462eed10c997b17b09d299), [`bce6610`](https://github.com/LedgerHQ/ledger-live/commit/bce6610ca8554a85f8f17b6014e921fdecd3fa4f), [`ddd40b4`](https://github.com/LedgerHQ/ledger-live/commit/ddd40b4cae93ecf3139fd33dc0f4dd1c8366d628), [`2a60165`](https://github.com/LedgerHQ/ledger-live/commit/2a601656b7a23a424a29f006ec53090648fdae4f), [`34248c3`](https://github.com/LedgerHQ/ledger-live/commit/34248c306479dafe6335b2c176daf25064c85b3b), [`2d9f320`](https://github.com/LedgerHQ/ledger-live/commit/2d9f32087eea12ae9d5ea2347b277b8bf4e60f55), [`c56ab86`](https://github.com/LedgerHQ/ledger-live/commit/c56ab86ab65597caf87a09b7596faa54f3104bd4)]:
  - @ledgerhq/coin-framework@6.11.0-next.0
  - @ledgerhq/types-live@6.91.0-next.0
  - @ledgerhq/cryptoassets@13.35.0-next.0
  - @ledgerhq/errors@6.28.0-next.0
  - @ledgerhq/live-env@2.23.0-next.0
  - @ledgerhq/devices@8.8.0-next.0
  - @ledgerhq/live-network@2.1.4-next.0
