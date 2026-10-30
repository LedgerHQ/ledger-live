# @ledgerhq/coin-hedera

## 3.1.0-next.0

### Minor Changes

- [#23846](https://github.com/LedgerHQ/ledger-live/pull/23846) [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359) Thanks [@gre-ledger](https://github.com/gre-ledger)! - fix: ship lib and lib-es in the npm tarballs again, which pnpm 11 dropped

- [#23649](https://github.com/LedgerHQ/ledger-live/pull/23649) [`112cce0`](https://github.com/LedgerHQ/ledger-live/commit/112cce00f8132dc4a0d7287ee3a321fb436cb77f) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - chore: bump @hiero-ledger/sdk from 2.84.0 to 2.90.1

- [#23527](https://github.com/LedgerHQ/ledger-live/pull/23527) [`a389665`](https://github.com/LedgerHQ/ledger-live/commit/a389665d6256a750f539ec54516f667cca1fb011) Thanks [@qperrot](https://github.com/qperrot)! - Stop setting name / unit on returned assets

### Patch Changes

- Updated dependencies [[`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1), [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359), [`9c7d59d`](https://github.com/LedgerHQ/ledger-live/commit/9c7d59d0ffcc72ba746bc20e9ff744db9730503b)]:
  - @ledgerhq/ledger-wallet-framework@3.9.0-next.0
  - @ledgerhq/types-live@6.129.0-next.0

## 3.0.0

### Major Changes

- [#23276](https://github.com/LedgerHQ/ledger-live/pull/23276) [`8daaded`](https://github.com/LedgerHQ/ledger-live/commit/8daaded1316cb30dc1b3a8634301acc176ca97af) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-hedera): stop resolving the currency with `getCryptoCurrencyById` / `findCryptoCurrencyById`

  The module no longer needs the host currencies resolver. Fee estimation and token-association
  validation use the input `currencyId` instead of looking the currency up: the countervalues request
  sends it as `froms`, and the rate cache is keyed by it instead of the ticker. The `InvalidAddress`
  message of `safeParseAccountId` takes the name of the resolved config. The API's `validateAddress` parses with the context config instead of a currency id.

  Breaking: `getCurrencyToUSDRate` takes a currency id instead of a `Currency`, and `getTokenFromAsset`
  takes `(currencyId, asset)` instead of `(currency, asset)`.

### Minor Changes

- [#23271](https://github.com/LedgerHQ/ledger-live/pull/23271) [`d7017e3`](https://github.com/LedgerHQ/ledger-live/commit/d7017e3ac831a9078845b2deea86a2f852522ed9) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Fix sponsored native outgoing operation values

### Patch Changes

- Updated dependencies [[`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97)]:
  - @ledgerhq/ledger-wallet-framework@3.8.0
  - @ledgerhq/types-live@6.128.0

## 3.0.0-next.0

### Major Changes

- [#23276](https://github.com/LedgerHQ/ledger-live/pull/23276) [`8daaded`](https://github.com/LedgerHQ/ledger-live/commit/8daaded1316cb30dc1b3a8634301acc176ca97af) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-hedera): stop resolving the currency with `getCryptoCurrencyById` / `findCryptoCurrencyById`

  The module no longer needs the host currencies resolver. Fee estimation and token-association
  validation use the input `currencyId` instead of looking the currency up: the countervalues request
  sends it as `froms`, and the rate cache is keyed by it instead of the ticker. The `InvalidAddress`
  message of `safeParseAccountId` takes the name of the resolved config. The API's `validateAddress` parses with the context config instead of a currency id.

  Breaking: `getCurrencyToUSDRate` takes a currency id instead of a `Currency`, and `getTokenFromAsset`
  takes `(currencyId, asset)` instead of `(currency, asset)`.

### Minor Changes

- [#23271](https://github.com/LedgerHQ/ledger-live/pull/23271) [`d7017e3`](https://github.com/LedgerHQ/ledger-live/commit/d7017e3ac831a9078845b2deea86a2f852522ed9) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Fix sponsored native outgoing operation values

### Patch Changes

- Updated dependencies [[`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97)]:
  - @ledgerhq/ledger-wallet-framework@3.8.0-next.0
  - @ledgerhq/types-live@6.128.0-next.0

## 2.7.0

### Minor Changes

- [#22757](https://github.com/LedgerHQ/ledger-live/pull/22757) [`63a0ec8`](https://github.com/LedgerHQ/ledger-live/commit/63a0ec8c8d20ace5ed278f21d72286dd8d75094b) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: extract hgraph queries and variables

- [#22609](https://github.com/LedgerHQ/ledger-live/pull/22609) [`826a87c`](https://github.com/LedgerHQ/ledger-live/commit/826a87c08f3757ed3b1fd63f217ed9493082811d) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(hedera): persist hederaResources on the generic adapter

- [#23054](https://github.com/LedgerHQ/ledger-live/pull/23054) [`e294828`](https://github.com/LedgerHQ/ledger-live/commit/e294828087e36263fd917c7514d8a4583063b2b6) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - Nest Hedera extras under `familyExtra` in `getBlock`, as `listOperations` already does, so a transaction gets the same details from both paths

- [#22939](https://github.com/LedgerHQ/ledger-live/pull/22939) [`c59fbf4`](https://github.com/LedgerHQ/ledger-live/commit/c59fbf41212398e3d0c1000c776d33c6344290a3) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - chore(hedera): migrate from @hashgraph/sdk 2.78.0 to @hiero-ledger/sdk 2.84.0
  fix(hedera): keep the nonce when serializing generic transactions

- [#22610](https://github.com/LedgerHQ/ledger-live/pull/22610) [`dd2d1f8`](https://github.com/LedgerHQ/ledger-live/commit/dd2d1f8965897befc6e49f041eeccc51deb9578c) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(hedera): restore legacy prepare-transaction parity on the generic adapter

- [#22608](https://github.com/LedgerHQ/ledger-live/pull/22608) [`b8fc9af`](https://github.com/LedgerHQ/ledger-live/commit/b8fc9af53fc59427695bb0fe81d11d46ef74742e) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(hedera): add the tokenAssociate mode to the generic adapter

- [#22762](https://github.com/LedgerHQ/ledger-live/pull/22762) [`569dceb`](https://github.com/LedgerHQ/ledger-live/commit/569dceb7cdfbd97844c6a426fe421a89128b584e) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - fix(coin-hedera): fix incorrect handling of MirrorNode responses when stake is null or absent

- [#22985](https://github.com/LedgerHQ/ledger-live/pull/22985) [`4182256`](https://github.com/LedgerHQ/ledger-live/commit/4182256c2213208e330861b904a6d8859d1b3e60) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix(hedera): generic adapter fixes for fee estimation, wallet API memo, token association wording, token receive and swap history saved by the legacy bridge

- [#22704](https://github.com/LedgerHQ/ledger-live/pull/22704) [`339d174`](https://github.com/LedgerHQ/ledger-live/commit/339d17482fba108dfca790c2500c697a818f7a1c) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Support minHeight in Hedera listOperations for incremental sync, return finalized operations only and revive stakedAmount as BigNumber on the generic adapter

- [#22906](https://github.com/LedgerHQ/ledger-live/pull/22906) [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: hedera legacy bridge adapter with fixes and optimizations

### Patch Changes

- Updated dependencies [[`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0
  - @ledgerhq/types-live@6.127.0

## 2.7.0-next.1

### Patch Changes

- Updated dependencies [[`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.1

## 2.7.0-next.0

### Minor Changes

- [#22757](https://github.com/LedgerHQ/ledger-live/pull/22757) [`63a0ec8`](https://github.com/LedgerHQ/ledger-live/commit/63a0ec8c8d20ace5ed278f21d72286dd8d75094b) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: extract hgraph queries and variables

- [#22609](https://github.com/LedgerHQ/ledger-live/pull/22609) [`826a87c`](https://github.com/LedgerHQ/ledger-live/commit/826a87c08f3757ed3b1fd63f217ed9493082811d) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(hedera): persist hederaResources on the generic adapter

- [#23054](https://github.com/LedgerHQ/ledger-live/pull/23054) [`e294828`](https://github.com/LedgerHQ/ledger-live/commit/e294828087e36263fd917c7514d8a4583063b2b6) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - Nest Hedera extras under `familyExtra` in `getBlock`, as `listOperations` already does, so a transaction gets the same details from both paths

- [#22939](https://github.com/LedgerHQ/ledger-live/pull/22939) [`c59fbf4`](https://github.com/LedgerHQ/ledger-live/commit/c59fbf41212398e3d0c1000c776d33c6344290a3) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - chore(hedera): migrate from @hashgraph/sdk 2.78.0 to @hiero-ledger/sdk 2.84.0
  fix(hedera): keep the nonce when serializing generic transactions

- [#22610](https://github.com/LedgerHQ/ledger-live/pull/22610) [`dd2d1f8`](https://github.com/LedgerHQ/ledger-live/commit/dd2d1f8965897befc6e49f041eeccc51deb9578c) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(hedera): restore legacy prepare-transaction parity on the generic adapter

- [#22608](https://github.com/LedgerHQ/ledger-live/pull/22608) [`b8fc9af`](https://github.com/LedgerHQ/ledger-live/commit/b8fc9af53fc59427695bb0fe81d11d46ef74742e) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(hedera): add the tokenAssociate mode to the generic adapter

- [#22762](https://github.com/LedgerHQ/ledger-live/pull/22762) [`569dceb`](https://github.com/LedgerHQ/ledger-live/commit/569dceb7cdfbd97844c6a426fe421a89128b584e) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - fix(coin-hedera): fix incorrect handling of MirrorNode responses when stake is null or absent

- [#22985](https://github.com/LedgerHQ/ledger-live/pull/22985) [`4182256`](https://github.com/LedgerHQ/ledger-live/commit/4182256c2213208e330861b904a6d8859d1b3e60) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix(hedera): generic adapter fixes for fee estimation, wallet API memo, token association wording, token receive and swap history saved by the legacy bridge

- [#22704](https://github.com/LedgerHQ/ledger-live/pull/22704) [`339d174`](https://github.com/LedgerHQ/ledger-live/commit/339d17482fba108dfca790c2500c697a818f7a1c) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Support minHeight in Hedera listOperations for incremental sync, return finalized operations only and revive stakedAmount as BigNumber on the generic adapter

- [#22906](https://github.com/LedgerHQ/ledger-live/pull/22906) [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: hedera legacy bridge adapter with fixes and optimizations

### Patch Changes

- Updated dependencies [[`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.0
  - @ledgerhq/types-live@6.127.0-next.0

## 2.6.0

### Minor Changes

- [#22394](https://github.com/LedgerHQ/ledger-live/pull/22394) [`952bcf6`](https://github.com/LedgerHQ/ledger-live/commit/952bcf6855a1166ce70cb3d007d95f00c24e4ff3) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: allow send-max in `craftTransaction` (the amount is resolved upstream) and declare the four staking modes in `supportedFeatures`

- [#21953](https://github.com/LedgerHQ/ledger-live/pull/21953) [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/live-config`, `@ledgerhq/live-env`, `@ledgerhq/live-currency-format`,
  `@ledgerhq/domain-service` and `@ledgerhq/evm-tools` from npm instead of the workspace — they
  now live in the `ts-libs` repository. No API change.

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d)]:
  - @ledgerhq/types-live@6.126.0
  - @ledgerhq/ledger-wallet-framework@3.6.0

## 2.6.0-next.0

### Minor Changes

- [#22394](https://github.com/LedgerHQ/ledger-live/pull/22394) [`952bcf6`](https://github.com/LedgerHQ/ledger-live/commit/952bcf6855a1166ce70cb3d007d95f00c24e4ff3) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: allow send-max in `craftTransaction` (the amount is resolved upstream) and declare the four staking modes in `supportedFeatures`

- [#21953](https://github.com/LedgerHQ/ledger-live/pull/21953) [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/live-config`, `@ledgerhq/live-env`, `@ledgerhq/live-currency-format`,
  `@ledgerhq/domain-service` and `@ledgerhq/evm-tools` from npm instead of the workspace — they
  now live in the `ts-libs` repository. No API change.

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d)]:
  - @ledgerhq/types-live@6.126.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.6.0-next.0

## 2.5.0

### Minor Changes

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @ledgerhq/ledger-wallet-framework@3.5.0
  - @ledgerhq/types-live@6.125.0
  - @ledgerhq/live-env@4.1.0

## 2.5.0-next.0

### Minor Changes

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @ledgerhq/ledger-wallet-framework@3.5.0-next.0
  - @ledgerhq/types-live@6.125.0-next.0
  - @ledgerhq/live-env@4.1.0-next.0

## 2.4.0

### Minor Changes

- [#21703](https://github.com/LedgerHQ/ledger-live/pull/21703) [`2706dda`](https://github.com/LedgerHQ/ledger-live/commit/2706ddad88ea10d117093bba8775b6aef655fbda) Thanks [@ysitbon](https://github.com/ysitbon)! - Restore lazy runtime read of the countervalues API endpoint.

  PR #21659 dropped the live-countervalues dependency and inlined the CVS spot-price call.
  In doing so it replaced the per-call `getEnv("LEDGER_COUNTERVALUES_API")` with a
  module-level `process.env` constant evaluated once at import time. The default URL was
  always correct, but the mobile debug staging toggle (`CountervaluesStagingRow`) calls
  `setEnv("LEDGER_COUNTERVALUES_API", ...)` at runtime; with a const that write is silently
  ignored and Hedera fee estimation stays on production rates while every other CVS caller
  follows the toggle.

  Fix: read `getEnv("LEDGER_COUNTERVALUES_API")` inline at request time and re-add
  `@ledgerhq/live-env` as a runtime dependency.

- [#21659](https://github.com/LedgerHQ/ledger-live/pull/21659) [`c6df5b6`](https://github.com/LedgerHQ/ledger-live/commit/c6df5b65aa66f44d8dff124e4e1d089d53e1d1a6) Thanks [@ysitbon](https://github.com/ysitbon)! - Fetch the HBAR/USD spot rate directly from the countervalues service instead of through `@ledgerhq/live-countervalues`, removing that runtime dependency. Rate values, caching, and the fallback to the default fee estimate are unchanged.

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/types-live@6.124.0
  - @ledgerhq/ledger-wallet-framework@3.4.0

## 2.4.0-next.0

### Minor Changes

- [#21703](https://github.com/LedgerHQ/ledger-live/pull/21703) [`2706dda`](https://github.com/LedgerHQ/ledger-live/commit/2706ddad88ea10d117093bba8775b6aef655fbda) Thanks [@ysitbon](https://github.com/ysitbon)! - Restore lazy runtime read of the countervalues API endpoint.

  PR #21659 dropped the live-countervalues dependency and inlined the CVS spot-price call.
  In doing so it replaced the per-call `getEnv("LEDGER_COUNTERVALUES_API")` with a
  module-level `process.env` constant evaluated once at import time. The default URL was
  always correct, but the mobile debug staging toggle (`CountervaluesStagingRow`) calls
  `setEnv("LEDGER_COUNTERVALUES_API", ...)` at runtime; with a const that write is silently
  ignored and Hedera fee estimation stays on production rates while every other CVS caller
  follows the toggle.

  Fix: read `getEnv("LEDGER_COUNTERVALUES_API")` inline at request time and re-add
  `@ledgerhq/live-env` as a runtime dependency.

- [#21659](https://github.com/LedgerHQ/ledger-live/pull/21659) [`c6df5b6`](https://github.com/LedgerHQ/ledger-live/commit/c6df5b65aa66f44d8dff124e4e1d089d53e1d1a6) Thanks [@ysitbon](https://github.com/ysitbon)! - Fetch the HBAR/USD spot rate directly from the countervalues service instead of through `@ledgerhq/live-countervalues`, removing that runtime dependency. Rate values, caching, and the fallback to the default fee estimate are unchanged.

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/types-live@6.124.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.4.0-next.0

## 2.3.0

### Minor Changes

- [#21302](https://github.com/LedgerHQ/ledger-live/pull/21302) [`1e883b3`](https://github.com/LedgerHQ/ledger-live/commit/1e883b36260cb3d78c34251de87a2da1ec353d9f) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: read Hedera staking validators through an on-demand query on desktop, with loading and fetch-error states

- [#21305](https://github.com/LedgerHQ/ledger-live/pull/21305) [`7aca4c8`](https://github.com/LedgerHQ/ledger-live/commit/7aca4c8a806ab270cd990d63b1c651e443b7e149) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: drop the Hedera preload layer now that no consumer reads it, and fold useHederaEnrichedDelegationV2 back into useHederaEnrichedDelegation

- [#21383](https://github.com/LedgerHQ/ledger-live/pull/21383) [`6f39b04`](https://github.com/LedgerHQ/ledger-live/commit/6f39b0411286ed5c82362c9ffafb953abe8b53b7) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: implement `validateIntent` in coin-hedera's logic layer, replacing the "not supported" throw

- [#21301](https://github.com/LedgerHQ/ledger-live/pull/21301) [`6dfa950`](https://github.com/LedgerHQ/ledger-live/commit/6dfa9501d8125f88d986105882f3f3fc72b8b371) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: fetch validators on demand in coin-hedera module

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`e42c12a`](https://github.com/LedgerHQ/ledger-live/commit/e42c12a392ba60ee839c9a71f4f0d409ad9430fa), [`eb62268`](https://github.com/LedgerHQ/ledger-live/commit/eb622688cb7561882cd02b52c2eed569d5dc68f3), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`53dcdc9`](https://github.com/LedgerHQ/ledger-live/commit/53dcdc9bbef2324b48fac7469c2c1d0e66f7361f), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`54124e4`](https://github.com/LedgerHQ/ledger-live/commit/54124e435c7adc3a2c3a9ed6cd1865fc68fa2584), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`a19ffef`](https://github.com/LedgerHQ/ledger-live/commit/a19ffeff9dd4e173890d75d8634a33e53cc5a5d0), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @ledgerhq/types-live@6.123.0
  - @ledgerhq/ledger-wallet-framework@3.3.0
  - @ledgerhq/live-countervalues@0.25.0
  - @ledgerhq/live-env@4.0.0

## 2.3.0-next.0

### Minor Changes

- [#21302](https://github.com/LedgerHQ/ledger-live/pull/21302) [`1e883b3`](https://github.com/LedgerHQ/ledger-live/commit/1e883b36260cb3d78c34251de87a2da1ec353d9f) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: read Hedera staking validators through an on-demand query on desktop, with loading and fetch-error states

- [#21305](https://github.com/LedgerHQ/ledger-live/pull/21305) [`7aca4c8`](https://github.com/LedgerHQ/ledger-live/commit/7aca4c8a806ab270cd990d63b1c651e443b7e149) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: drop the Hedera preload layer now that no consumer reads it, and fold useHederaEnrichedDelegationV2 back into useHederaEnrichedDelegation

- [#21383](https://github.com/LedgerHQ/ledger-live/pull/21383) [`6f39b04`](https://github.com/LedgerHQ/ledger-live/commit/6f39b0411286ed5c82362c9ffafb953abe8b53b7) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: implement `validateIntent` in coin-hedera's logic layer, replacing the "not supported" throw

- [#21301](https://github.com/LedgerHQ/ledger-live/pull/21301) [`6dfa950`](https://github.com/LedgerHQ/ledger-live/commit/6dfa9501d8125f88d986105882f3f3fc72b8b371) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: fetch validators on demand in coin-hedera module

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`e42c12a`](https://github.com/LedgerHQ/ledger-live/commit/e42c12a392ba60ee839c9a71f4f0d409ad9430fa), [`eb62268`](https://github.com/LedgerHQ/ledger-live/commit/eb622688cb7561882cd02b52c2eed569d5dc68f3), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`53dcdc9`](https://github.com/LedgerHQ/ledger-live/commit/53dcdc9bbef2324b48fac7469c2c1d0e66f7361f), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`54124e4`](https://github.com/LedgerHQ/ledger-live/commit/54124e435c7adc3a2c3a9ed6cd1865fc68fa2584), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`a19ffef`](https://github.com/LedgerHQ/ledger-live/commit/a19ffeff9dd4e173890d75d8634a33e53cc5a5d0), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @ledgerhq/types-live@6.123.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.3.0-next.0
  - @ledgerhq/live-countervalues@0.25.0-next.0
  - @ledgerhq/live-env@4.0.0-next.0

## 2.2.0

### Minor Changes

- [#21168](https://github.com/LedgerHQ/ledger-live/pull/21168) [`1e438d1`](https://github.com/LedgerHQ/ledger-live/commit/1e438d109bf2644b1d25321d3bf9221d15873cfb) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

  `createApi` now returns its object with `satisfies CoinModuleImpl<HederaCoinConfig, HederaMemo, HederaTxData>` — which keeps the precise shape, so a caller sees exactly which methods exist — and omits the five capabilities the module has none of, `validateIntent`, `getNextSequence`, `craftRawTransaction`, `call` and `register`, instead of giving each a `throw new Error("… is not supported")`.

  Why each is absent is recorded above the factory rather than lost with the stub it used to sit on. Two are worth spelling out: intent validation still lives in the account bridge's `getTransactionStatus`, so the api path has none of its own yet, and there is no sequence to hand out because a Hedera transaction is identified by its payer plus a valid-start timestamp rather than by a per-account nonce. Staking, by contrast, is fully covered and untouched — Hedera proxy-stakes to a node id, so `getStakes`, `getRewards` and `getValidators` are all real implementations. So are the two methods that throw for a reason rather than as a placeholder: `craftTransaction` rejects `useAllAmount` and `listOperations` rejects a non-zero `minHeight`, both argument validations on working code.

  The return type also loses its `& BridgeApi` half. Every member of `BridgeApi` is optional and this factory supplied none of them, so the intersection only ever promised hooks that were not there; nothing consumes `createApi` yet, so no call site relied on it.

  The parameters an implementation declares now matter: `satisfies` infers the signature from the function itself, so the trailing `options` argument of `combine`, `craftTransaction`, `getValidators` and `getRewards` carries an explicit `?` rather than relying on the contract to make it optional — the integration suite already calls `getValidators(context)` and `getRewards(context, address)` without it.

  Consumers see no change. They reach the module through a resolver that applies the framework's `withDefaults`, which supplies every omitted capability, so the same call still raises the same `"<method> is not supported"` error — and `supports(method)` now reports which capabilities are real.

  The authored type also keeps the contract's trailing optional parameters, or a caller reaching the module through it could no longer pass them: `broadcast`, `estimateFees`, `getStakes` accept and ignore theirs. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.

  The api test asserts the whole capability surface with the framework's `capabilityReport()` rather than one test per unimplemented capability: one expectation covers that each is absent, that reaching it raises `"<name> is not supported"`, and that `supports()` agrees. Being an exact comparison it is exhaustive, so implementing or dropping a capability changes the list instead of leaving a test that passes while covering less.

- [#21106](https://github.com/LedgerHQ/ledger-live/pull/21106) [`9f37206`](https://github.com/LedgerHQ/ledger-live/commit/9f372065ab564bc75960e4d02b8a9cb4e7ac21b0) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: hedera framework signer

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/types-live@6.122.0
  - @ledgerhq/ledger-wallet-framework@3.2.0
  - @ledgerhq/live-env@3.2.0
  - @ledgerhq/live-countervalues@0.24.5

## 2.2.0-next.0

### Minor Changes

- [#21168](https://github.com/LedgerHQ/ledger-live/pull/21168) [`1e438d1`](https://github.com/LedgerHQ/ledger-live/commit/1e438d109bf2644b1d25321d3bf9221d15873cfb) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

  `createApi` now returns its object with `satisfies CoinModuleImpl<HederaCoinConfig, HederaMemo, HederaTxData>` — which keeps the precise shape, so a caller sees exactly which methods exist — and omits the five capabilities the module has none of, `validateIntent`, `getNextSequence`, `craftRawTransaction`, `call` and `register`, instead of giving each a `throw new Error("… is not supported")`.

  Why each is absent is recorded above the factory rather than lost with the stub it used to sit on. Two are worth spelling out: intent validation still lives in the account bridge's `getTransactionStatus`, so the api path has none of its own yet, and there is no sequence to hand out because a Hedera transaction is identified by its payer plus a valid-start timestamp rather than by a per-account nonce. Staking, by contrast, is fully covered and untouched — Hedera proxy-stakes to a node id, so `getStakes`, `getRewards` and `getValidators` are all real implementations. So are the two methods that throw for a reason rather than as a placeholder: `craftTransaction` rejects `useAllAmount` and `listOperations` rejects a non-zero `minHeight`, both argument validations on working code.

  The return type also loses its `& BridgeApi` half. Every member of `BridgeApi` is optional and this factory supplied none of them, so the intersection only ever promised hooks that were not there; nothing consumes `createApi` yet, so no call site relied on it.

  The parameters an implementation declares now matter: `satisfies` infers the signature from the function itself, so the trailing `options` argument of `combine`, `craftTransaction`, `getValidators` and `getRewards` carries an explicit `?` rather than relying on the contract to make it optional — the integration suite already calls `getValidators(context)` and `getRewards(context, address)` without it.

  Consumers see no change. They reach the module through a resolver that applies the framework's `withDefaults`, which supplies every omitted capability, so the same call still raises the same `"<method> is not supported"` error — and `supports(method)` now reports which capabilities are real.

  The authored type also keeps the contract's trailing optional parameters, or a caller reaching the module through it could no longer pass them: `broadcast`, `estimateFees`, `getStakes` accept and ignore theirs. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.

  The api test asserts the whole capability surface with the framework's `capabilityReport()` rather than one test per unimplemented capability: one expectation covers that each is absent, that reaching it raises `"<name> is not supported"`, and that `supports()` agrees. Being an exact comparison it is exhaustive, so implementing or dropping a capability changes the list instead of leaving a test that passes while covering less.

- [#21106](https://github.com/LedgerHQ/ledger-live/pull/21106) [`9f37206`](https://github.com/LedgerHQ/ledger-live/commit/9f372065ab564bc75960e4d02b8a9cb4e7ac21b0) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: hedera framework signer

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/types-live@6.122.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.2.0-next.0
  - @ledgerhq/live-env@3.2.0-next.0
  - @ledgerhq/live-countervalues@0.24.5-next.0

## 2.1.0

### Minor Changes

- [#20955](https://github.com/LedgerHQ/ledger-live/pull/20955) [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: move hedera envs to config/constants

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/types-live@6.121.0
  - @ledgerhq/ledger-wallet-framework@3.1.0
  - @ledgerhq/live-env@3.1.0
  - @ledgerhq/live-countervalues@0.24.4

## 2.1.0-next.0

### Minor Changes

- [#20955](https://github.com/LedgerHQ/ledger-live/pull/20955) [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: move hedera envs to config/constants

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/types-live@6.121.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.1.0-next.0
  - @ledgerhq/live-env@3.1.0-next.0
  - @ledgerhq/live-countervalues@0.24.4-next.0

## 2.0.0

### Major Changes

- [#20752](https://github.com/LedgerHQ/ledger-live/pull/20752) [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update combine to accept string[] per ADR-047

### Minor Changes

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20786](https://github.com/LedgerHQ/ledger-live/pull/20786) [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Add unsupported `register` to CoinModuleApi implementations (ADR-046)

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/types-live@6.120.0
  - @ledgerhq/ledger-wallet-framework@3.0.0
  - @ledgerhq/live-countervalues@0.24.3

## 2.0.0-next.1

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8)]:
  - @ledgerhq/types-live@6.120.0-next.1
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.1
  - @ledgerhq/live-countervalues@0.24.3-next.1

## 2.0.0-next.0

### Major Changes

- [#20752](https://github.com/LedgerHQ/ledger-live/pull/20752) [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update combine to accept string[] per ADR-047

### Minor Changes

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20786](https://github.com/LedgerHQ/ledger-live/pull/20786) [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Add unsupported `register` to CoinModuleApi implementations (ADR-046)

### Patch Changes

- Updated dependencies [[`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.0
  - @ledgerhq/types-live@6.120.0-next.0
  - @ledgerhq/live-countervalues@0.24.3-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
