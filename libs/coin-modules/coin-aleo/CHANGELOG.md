# @ledgerhq/coin-aleo

## 2.8.0

### Minor Changes

- [#23310](https://github.com/LedgerHQ/ledger-live/pull/23310) [`3d5d5c7`](https://github.com/LedgerHQ/ledger-live/commit/3d5d5c7582f6e93c4bd0eeae217eedc068409846) Thanks [@qperrot](https://github.com/qperrot)! - isAleoAccount checks the token's parent currency id instead of looking the currency up

- [#23348](https://github.com/LedgerHQ/ledger-live/pull/23348) [`bc0aa4f`](https://github.com/LedgerHQ/ledger-live/commit/bc0aa4ff32efa315ab4dfaf756bb562db4400df3) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Aleo private sync no longer mutates stored operations when attaching private token operations

- [#23425](https://github.com/LedgerHQ/ledger-live/pull/23425) [`8ebcf5c`](https://github.com/LedgerHQ/ledger-live/commit/8ebcf5c5507558750fb9f7980e9de4f0f5a637ce) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Aleo estimated signing time row on the new send flow Amount step

### Patch Changes

- Updated dependencies [[`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97)]:
  - @ledgerhq/ledger-wallet-framework@3.8.0
  - @ledgerhq/types-live@6.128.0

## 2.8.0-next.0

### Minor Changes

- [#23310](https://github.com/LedgerHQ/ledger-live/pull/23310) [`3d5d5c7`](https://github.com/LedgerHQ/ledger-live/commit/3d5d5c7582f6e93c4bd0eeae217eedc068409846) Thanks [@qperrot](https://github.com/qperrot)! - isAleoAccount checks the token's parent currency id instead of looking the currency up

- [#23348](https://github.com/LedgerHQ/ledger-live/pull/23348) [`bc0aa4f`](https://github.com/LedgerHQ/ledger-live/commit/bc0aa4ff32efa315ab4dfaf756bb562db4400df3) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Aleo private sync no longer mutates stored operations when attaching private token operations

- [#23425](https://github.com/LedgerHQ/ledger-live/pull/23425) [`8ebcf5c`](https://github.com/LedgerHQ/ledger-live/commit/8ebcf5c5507558750fb9f7980e9de4f0f5a637ce) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Aleo estimated signing time row on the new send flow Amount step

### Patch Changes

- Updated dependencies [[`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97)]:
  - @ledgerhq/ledger-wallet-framework@3.8.0-next.0
  - @ledgerhq/types-live@6.128.0-next.0

## 2.7.0

### Minor Changes

- [#23238](https://github.com/LedgerHQ/ledger-live/pull/23238) [`77e1044`](https://github.com/LedgerHQ/ledger-live/commit/77e10442de4ec10827edb16ecc1583490c8da7e1) Thanks [@jprudent](https://github.com/jprudent)! - Aleo listOperations: return an empty list, not an empty string, for a hidden sender or recipient

- [#23106](https://github.com/LedgerHQ/ledger-live/pull/23106) [`06757be`](https://github.com/LedgerHQ/ledger-live/commit/06757be8aa253d449e4bb5b0959cf2919d14a3b8) Thanks [@jprudent](https://github.com/jprudent)! - Aleo listOperations: accept order asc (the default order already is asc)

- [#23029](https://github.com/LedgerHQ/ledger-live/pull/23029) [`e3bb812`](https://github.com/LedgerHQ/ledger-live/commit/e3bb81244302b04cf278bdd4d01f726c0190b167) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - Aleo listOperations: set tx.feesPayer, include the priority fee in tx.fees, add details.stake to staking operations

- [#22917](https://github.com/LedgerHQ/ledger-live/pull/22917) [`708a1f2`](https://github.com/LedgerHQ/ledger-live/commit/708a1f22cbdb566ceed47b2277e976a66b802333) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Report `NotEnoughBalance` for a send-max that resolves to a zero amount, such as a sponsored public send-max from an empty balance.

- [#22583](https://github.com/LedgerHQ/ledger-live/pull/22583) [`33467b2`](https://github.com/LedgerHQ/ledger-live/commit/33467b29525ab06b0abce96ed8489a61a01429c5) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Implement getStakes and getValidators on the CoinModuleApi surface, and report the bonded/unbonding portions from getBalance

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

- [#23238](https://github.com/LedgerHQ/ledger-live/pull/23238) [`77e1044`](https://github.com/LedgerHQ/ledger-live/commit/77e10442de4ec10827edb16ecc1583490c8da7e1) Thanks [@jprudent](https://github.com/jprudent)! - Aleo listOperations: return an empty list, not an empty string, for a hidden sender or recipient

- [#23106](https://github.com/LedgerHQ/ledger-live/pull/23106) [`06757be`](https://github.com/LedgerHQ/ledger-live/commit/06757be8aa253d449e4bb5b0959cf2919d14a3b8) Thanks [@jprudent](https://github.com/jprudent)! - Aleo listOperations: accept order asc (the default order already is asc)

- [#23029](https://github.com/LedgerHQ/ledger-live/pull/23029) [`e3bb812`](https://github.com/LedgerHQ/ledger-live/commit/e3bb81244302b04cf278bdd4d01f726c0190b167) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - Aleo listOperations: set tx.feesPayer, include the priority fee in tx.fees, add details.stake to staking operations

- [#22917](https://github.com/LedgerHQ/ledger-live/pull/22917) [`708a1f2`](https://github.com/LedgerHQ/ledger-live/commit/708a1f22cbdb566ceed47b2277e976a66b802333) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Report `NotEnoughBalance` for a send-max that resolves to a zero amount, such as a sponsored public send-max from an empty balance.

- [#22583](https://github.com/LedgerHQ/ledger-live/pull/22583) [`33467b2`](https://github.com/LedgerHQ/ledger-live/commit/33467b29525ab06b0abce96ed8489a61a01429c5) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Implement getStakes and getValidators on the CoinModuleApi surface, and report the bonded/unbonding portions from getBalance

### Patch Changes

- Updated dependencies [[`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.0
  - @ledgerhq/types-live@6.127.0-next.0

## 2.6.0

### Minor Changes

- [#22634](https://github.com/LedgerHQ/ledger-live/pull/22634) [`e3b6f7a`](https://github.com/LedgerHQ/ledger-live/commit/e3b6f7a8549cbbbdb74dcca483f58bf3d0f4cc80) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - fix(aleo): keep the newer public and private sync fields when both syncs overlap

- [#21953](https://github.com/LedgerHQ/ledger-live/pull/21953) [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/live-config`, `@ledgerhq/live-env`, `@ledgerhq/live-currency-format`,
  `@ledgerhq/domain-service` and `@ledgerhq/evm-tools` from npm instead of the workspace — they
  now live in the `ts-libs` repository. No API change.

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d)]:
  - @ledgerhq/types-live@6.126.0
  - @ledgerhq/ledger-wallet-framework@3.6.0

## 2.6.0-next.0

### Minor Changes

- [#22634](https://github.com/LedgerHQ/ledger-live/pull/22634) [`e3b6f7a`](https://github.com/LedgerHQ/ledger-live/commit/e3b6f7a8549cbbbdb74dcca483f58bf3d0f4cc80) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - fix(aleo): keep the newer public and private sync fields when both syncs overlap

- [#21953](https://github.com/LedgerHQ/ledger-live/pull/21953) [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/live-config`, `@ledgerhq/live-env`, `@ledgerhq/live-currency-format`,
  `@ledgerhq/domain-service` and `@ledgerhq/evm-tools` from npm instead of the workspace — they
  now live in the `ts-libs` repository. No API change.

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d)]:
  - @ledgerhq/types-live@6.126.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.6.0-next.0

## 2.5.0

### Minor Changes

- [#21999](https://github.com/LedgerHQ/ledger-live/pull/21999) [`724f029`](https://github.com/LedgerHQ/ledger-live/commit/724f02932ccdf8ba5b8f8f0ccc10b9edbe7547cd) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(aleo): share the bond pieces between Desktop and Mobile

  Replaces the ad-hoc messages `getTransactionStatus` returned for a rejected bond with typed
  error classes, translated on both clients and now distinguishing a closed validator from an
  unbonding one. Adds the `isValidatorBondable` / `getMinBondAmount` helpers to the coin
  module, moves the per-network default validator into the Aleo currency config so every
  client reads the same address, and adds a reusable Aleo bridge mock for Mobile.

- [#22053](https://github.com/LedgerHQ/ledger-live/pull/22053) [`cf09fa6`](https://github.com/LedgerHQ/ledger-live/commit/cf09fa63c7aa509b1958bc594795895089fdf8de) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat(aleo): add the claim unbonded staking flow

- [#21975](https://github.com/LedgerHQ/ledger-live/pull/21975) [`0a5c2a0`](https://github.com/LedgerHQ/ledger-live/commit/0a5c2a0e13782aa3d12a2be1466b604436fcb4ad) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - added Aleo staking operations, gated on the `enableStaking` flag

- [#22123](https://github.com/LedgerHQ/ledger-live/pull/22123) [`b5338ec`](https://github.com/LedgerHQ/ledger-live/commit/b5338ec9173a08073a4b8524fe095428bb710a99) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat(aleo): add the shared staking hooks the delegation views read

- [#22212](https://github.com/LedgerHQ/ledger-live/pull/22212) [`49b535f`](https://github.com/LedgerHQ/ledger-live/commit/49b535fa6cab495b0b8659c042c743b8f65c2ce2) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor(aleo): serve the validator committee from RTK Query

- [#22187](https://github.com/LedgerHQ/ledger-live/pull/22187) [`31ec33f`](https://github.com/LedgerHQ/ledger-live/commit/31ec33f649209bd2b6971afc173e2e41f53c313f) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo part 2 staking ui

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @ledgerhq/ledger-wallet-framework@3.5.0
  - @ledgerhq/types-live@6.125.0
  - @ledgerhq/live-env@4.1.0

## 2.5.0-next.0

### Minor Changes

- [#21999](https://github.com/LedgerHQ/ledger-live/pull/21999) [`724f029`](https://github.com/LedgerHQ/ledger-live/commit/724f02932ccdf8ba5b8f8f0ccc10b9edbe7547cd) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(aleo): share the bond pieces between Desktop and Mobile

  Replaces the ad-hoc messages `getTransactionStatus` returned for a rejected bond with typed
  error classes, translated on both clients and now distinguishing a closed validator from an
  unbonding one. Adds the `isValidatorBondable` / `getMinBondAmount` helpers to the coin
  module, moves the per-network default validator into the Aleo currency config so every
  client reads the same address, and adds a reusable Aleo bridge mock for Mobile.

- [#22053](https://github.com/LedgerHQ/ledger-live/pull/22053) [`cf09fa6`](https://github.com/LedgerHQ/ledger-live/commit/cf09fa63c7aa509b1958bc594795895089fdf8de) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat(aleo): add the claim unbonded staking flow

- [#21975](https://github.com/LedgerHQ/ledger-live/pull/21975) [`0a5c2a0`](https://github.com/LedgerHQ/ledger-live/commit/0a5c2a0e13782aa3d12a2be1466b604436fcb4ad) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - added Aleo staking operations, gated on the `enableStaking` flag

- [#22123](https://github.com/LedgerHQ/ledger-live/pull/22123) [`b5338ec`](https://github.com/LedgerHQ/ledger-live/commit/b5338ec9173a08073a4b8524fe095428bb710a99) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat(aleo): add the shared staking hooks the delegation views read

- [#22212](https://github.com/LedgerHQ/ledger-live/pull/22212) [`49b535f`](https://github.com/LedgerHQ/ledger-live/commit/49b535fa6cab495b0b8659c042c743b8f65c2ce2) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor(aleo): serve the validator committee from RTK Query

- [#22187](https://github.com/LedgerHQ/ledger-live/pull/22187) [`31ec33f`](https://github.com/LedgerHQ/ledger-live/commit/31ec33f649209bd2b6971afc173e2e41f53c313f) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo part 2 staking ui

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @ledgerhq/ledger-wallet-framework@3.5.0-next.0
  - @ledgerhq/types-live@6.125.0-next.0
  - @ledgerhq/live-env@4.1.0-next.0

## 2.4.0

### Minor Changes

- [#21653](https://github.com/LedgerHQ/ledger-live/pull/21653) [`269d6d4`](https://github.com/LedgerHQ/ledger-live/commit/269d6d404779439d0e98beb2ed3cef82805612ae) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat(aleo): add the bond public staking flow

- [#21729](https://github.com/LedgerHQ/ledger-live/pull/21729) [`4c64bdc`](https://github.com/LedgerHQ/ledger-live/commit/4c64bdc31d29b21c9ea31732ade8f6ba277b9107) Thanks [@0xMM-L](https://github.com/0xMM-L)! - feat: craft unbond_public and claim_unbond_public staking transactions — the two backend wire
  intents, the staker guard, their credits.aleo function names, the shared staking mode →
  operation-type table, fee-valued optimistic operations for all three staking modes, and no Amount
  row on a claim's device confirmation. No user-reachable behaviour yet: nothing can construct a
  transaction in either mode until the bridge transaction mode union is extended.

- [#21753](https://github.com/LedgerHQ/ledger-live/pull/21753) [`452041f`](https://github.com/LedgerHQ/ledger-live/commit/452041f8123bc887534048ed94167c81ca54c2b6) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Persist the Aleo staking position on the account. Each public sync now reads the `credits.aleo` `bonded` and `unbonding` mappings and stores `bondedBalance`, `bondedValidator`, `unbondingBalance` and `unbondingHeight` on `aleoResources`, so a staked position survives serialization and is readable without an extra fetch.

- [#21804](https://github.com/LedgerHQ/ledger-live/pull/21804) [`81456c8`](https://github.com/LedgerHQ/ledger-live/commit/81456c8a3c1e4359f4697cced7c89e9be744f3f6) Thanks [@0xMM-L](https://github.com/0xMM-L)! - feat: prepare bond_public, unbond_public and claim_unbond_public transactions — the two missing
  bridge transaction mode arms and their raw form, per-mode fee lookup, per-mode amount resolution,
  and the withdrawal and recipient addresses pinned to the account's own address so a caller cannot
  choose them. Because an unbond and a claim are therefore self-referential, a self-send is now
  allowed for those two modes while staying rejected for every transfer mode. Also fixes a bond being
  relabelled as a public transfer, and so priced at the transfer fee, on its way through the bridge.
  No user-reachable behaviour yet: the staking flows remain behind the disabled staking configuration
  flag.

- [#21927](https://github.com/LedgerHQ/ledger-live/pull/21927) [`95b4e92`](https://github.com/LedgerHQ/ledger-live/commit/95b4e92bd6ba76987e0f1b540d21312a37c015b0) Thanks [@0xMM-L](https://github.com/0xMM-L)! - feat(aleo): validate bond, unbond and claim transactions in `getTransactionStatus`

- [#21852](https://github.com/LedgerHQ/ledger-live/pull/21852) [`f6dc62f`](https://github.com/LedgerHQ/ledger-live/commit/f6dc62f7f23be9f46812fc13f00ddc373e5ca1af) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat(aleo): add the unbond staking flow

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/types-live@6.124.0
  - @ledgerhq/ledger-wallet-framework@3.4.0

## 2.4.0-next.0

### Minor Changes

- [#21653](https://github.com/LedgerHQ/ledger-live/pull/21653) [`269d6d4`](https://github.com/LedgerHQ/ledger-live/commit/269d6d404779439d0e98beb2ed3cef82805612ae) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat(aleo): add the bond public staking flow

- [#21729](https://github.com/LedgerHQ/ledger-live/pull/21729) [`4c64bdc`](https://github.com/LedgerHQ/ledger-live/commit/4c64bdc31d29b21c9ea31732ade8f6ba277b9107) Thanks [@0xMM-L](https://github.com/0xMM-L)! - feat: craft unbond_public and claim_unbond_public staking transactions — the two backend wire
  intents, the staker guard, their credits.aleo function names, the shared staking mode →
  operation-type table, fee-valued optimistic operations for all three staking modes, and no Amount
  row on a claim's device confirmation. No user-reachable behaviour yet: nothing can construct a
  transaction in either mode until the bridge transaction mode union is extended.

- [#21753](https://github.com/LedgerHQ/ledger-live/pull/21753) [`452041f`](https://github.com/LedgerHQ/ledger-live/commit/452041f8123bc887534048ed94167c81ca54c2b6) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Persist the Aleo staking position on the account. Each public sync now reads the `credits.aleo` `bonded` and `unbonding` mappings and stores `bondedBalance`, `bondedValidator`, `unbondingBalance` and `unbondingHeight` on `aleoResources`, so a staked position survives serialization and is readable without an extra fetch.

- [#21804](https://github.com/LedgerHQ/ledger-live/pull/21804) [`81456c8`](https://github.com/LedgerHQ/ledger-live/commit/81456c8a3c1e4359f4697cced7c89e9be744f3f6) Thanks [@0xMM-L](https://github.com/0xMM-L)! - feat: prepare bond_public, unbond_public and claim_unbond_public transactions — the two missing
  bridge transaction mode arms and their raw form, per-mode fee lookup, per-mode amount resolution,
  and the withdrawal and recipient addresses pinned to the account's own address so a caller cannot
  choose them. Because an unbond and a claim are therefore self-referential, a self-send is now
  allowed for those two modes while staying rejected for every transfer mode. Also fixes a bond being
  relabelled as a public transfer, and so priced at the transfer fee, on its way through the bridge.
  No user-reachable behaviour yet: the staking flows remain behind the disabled staking configuration
  flag.

- [#21927](https://github.com/LedgerHQ/ledger-live/pull/21927) [`95b4e92`](https://github.com/LedgerHQ/ledger-live/commit/95b4e92bd6ba76987e0f1b540d21312a37c015b0) Thanks [@0xMM-L](https://github.com/0xMM-L)! - feat(aleo): validate bond, unbond and claim transactions in `getTransactionStatus`

- [#21852](https://github.com/LedgerHQ/ledger-live/pull/21852) [`f6dc62f`](https://github.com/LedgerHQ/ledger-live/commit/f6dc62f7f23be9f46812fc13f00ddc373e5ca1af) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat(aleo): add the unbond staking flow

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/types-live@6.124.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.4.0-next.0

## 2.3.0

### Minor Changes

- [#21601](https://github.com/LedgerHQ/ledger-live/pull/21601) [`96661b4`](https://github.com/LedgerHQ/ledger-live/commit/96661b459f66f511de75c62b87b3bcd2519a1814) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - part 1 for Aleo bond flow

- [#21391](https://github.com/LedgerHQ/ledger-live/pull/21391) [`3a3d2fa`](https://github.com/LedgerHQ/ledger-live/commit/3a3d2fa06b8dbdcc6ad964bb737898a6e35c934d) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: add the enableStaking feature flag and measured default fees for Aleo's bond_public/unbond_public/claim_unbond_public transaction types, gating the upcoming staking feature

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @ledgerhq/types-live@6.123.0
  - @ledgerhq/ledger-wallet-framework@3.3.0
  - @ledgerhq/live-env@4.0.0

## 2.3.0-next.0

### Minor Changes

- [#21601](https://github.com/LedgerHQ/ledger-live/pull/21601) [`96661b4`](https://github.com/LedgerHQ/ledger-live/commit/96661b459f66f511de75c62b87b3bcd2519a1814) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - part 1 for Aleo bond flow

- [#21391](https://github.com/LedgerHQ/ledger-live/pull/21391) [`3a3d2fa`](https://github.com/LedgerHQ/ledger-live/commit/3a3d2fa06b8dbdcc6ad964bb737898a6e35c934d) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: add the enableStaking feature flag and measured default fees for Aleo's bond_public/unbond_public/claim_unbond_public transaction types, gating the upcoming staking feature

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @ledgerhq/types-live@6.123.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.3.0-next.0
  - @ledgerhq/live-env@4.0.0-next.0

## 2.2.0

### Minor Changes

- [#21168](https://github.com/LedgerHQ/ledger-live/pull/21168) [`fc154ae`](https://github.com/LedgerHQ/ledger-live/commit/fc154ae37fb665625c206b479101ed43389c012a) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

  `createApi` now returns its object with `satisfies CoinModuleImpl<AleoCoinConfig, MemoNotSupported, AleoTransactionIntentData>` — which keeps the precise shape, so a caller sees exactly which methods exist — declaring the eleven the module implements: `broadcast`, `combine`, `craftTransaction`, `craftTransactionData`, `estimateFees`, `getAccountInfo`, `getBalance`, `lastBlock`, `listOperations`, `register` and `validateAddress`.

  The nine capabilities Aleo has none of — `call`, `craftRawTransaction`, `getBlock`, `getBlockInfo`, `getStakes`, `getRewards`, `getValidators`, `validateIntent` and `getNextSequence` — are omitted instead of each carrying a `throw new Error("… is not supported")`.

  The three optional capabilities the module keeps are the ones that carry Aleo's privacy model, and the declared shape is now what says so: `register` enrolls a view key with the Provable record scanner, `getAccountInfo` reports that scanner's progress — which is what bounds a private balance and history — and `validateAddress` is a real offline check. Their absence and their presence used to look the same from the outside; now `supports()` separates them.

  `listOperations` keeps its `throw`: it rejects an `order` other than `desc` and then does its work, which is argument validation on an implemented method rather than an unimplemented capability. Likewise `combine` and `craftTransaction` throw when the context carries no view key.

  Consumers see no change. They reach the module through a resolver that applies the framework's `withDefaults`, which supplies every omitted capability, so the same call still raises the same `"<method> is not supported"` error.

  The authored type also keeps the contract's trailing optional parameters, or a caller reaching the module through it could no longer pass them: `broadcast`, `combine`, `estimateFees` accept and ignore theirs. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.

  The api test asserts the whole capability surface with the framework's `capabilityReport()` rather than one test per unimplemented capability: one expectation covers that each is absent, that reaching it raises `"<name> is not supported"`, and that `supports()` agrees. Being an exact comparison it is exhaustive, so implementing or dropping a capability changes the list instead of leaving a test that passes while covering less.

- [#21153](https://github.com/LedgerHQ/ledger-live/pull/21153) [`150a151`](https://github.com/LedgerHQ/ledger-live/commit/150a151169e4ef40aa197300a115f17db1aa20c0) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo: expose the validator committee with an estimated staking rate through a shared hook

- [#21210](https://github.com/LedgerHQ/ledger-live/pull/21210) [`b26a2c3`](https://github.com/LedgerHQ/ledger-live/commit/b26a2c3942fb13dd4c8849ebda9402e732479432) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo: read staking positions from the credits.aleo bonded, unbonding and withdraw mappings

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/types-live@6.122.0
  - @ledgerhq/ledger-wallet-framework@3.2.0
  - @ledgerhq/live-env@3.2.0

## 2.2.0-next.0

### Minor Changes

- [#21168](https://github.com/LedgerHQ/ledger-live/pull/21168) [`fc154ae`](https://github.com/LedgerHQ/ledger-live/commit/fc154ae37fb665625c206b479101ed43389c012a) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

  `createApi` now returns its object with `satisfies CoinModuleImpl<AleoCoinConfig, MemoNotSupported, AleoTransactionIntentData>` — which keeps the precise shape, so a caller sees exactly which methods exist — declaring the eleven the module implements: `broadcast`, `combine`, `craftTransaction`, `craftTransactionData`, `estimateFees`, `getAccountInfo`, `getBalance`, `lastBlock`, `listOperations`, `register` and `validateAddress`.

  The nine capabilities Aleo has none of — `call`, `craftRawTransaction`, `getBlock`, `getBlockInfo`, `getStakes`, `getRewards`, `getValidators`, `validateIntent` and `getNextSequence` — are omitted instead of each carrying a `throw new Error("… is not supported")`.

  The three optional capabilities the module keeps are the ones that carry Aleo's privacy model, and the declared shape is now what says so: `register` enrolls a view key with the Provable record scanner, `getAccountInfo` reports that scanner's progress — which is what bounds a private balance and history — and `validateAddress` is a real offline check. Their absence and their presence used to look the same from the outside; now `supports()` separates them.

  `listOperations` keeps its `throw`: it rejects an `order` other than `desc` and then does its work, which is argument validation on an implemented method rather than an unimplemented capability. Likewise `combine` and `craftTransaction` throw when the context carries no view key.

  Consumers see no change. They reach the module through a resolver that applies the framework's `withDefaults`, which supplies every omitted capability, so the same call still raises the same `"<method> is not supported"` error.

  The authored type also keeps the contract's trailing optional parameters, or a caller reaching the module through it could no longer pass them: `broadcast`, `combine`, `estimateFees` accept and ignore theirs. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.

  The api test asserts the whole capability surface with the framework's `capabilityReport()` rather than one test per unimplemented capability: one expectation covers that each is absent, that reaching it raises `"<name> is not supported"`, and that `supports()` agrees. Being an exact comparison it is exhaustive, so implementing or dropping a capability changes the list instead of leaving a test that passes while covering less.

- [#21153](https://github.com/LedgerHQ/ledger-live/pull/21153) [`150a151`](https://github.com/LedgerHQ/ledger-live/commit/150a151169e4ef40aa197300a115f17db1aa20c0) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo: expose the validator committee with an estimated staking rate through a shared hook

- [#21210](https://github.com/LedgerHQ/ledger-live/pull/21210) [`b26a2c3`](https://github.com/LedgerHQ/ledger-live/commit/b26a2c3942fb13dd4c8849ebda9402e732479432) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo: read staking positions from the credits.aleo bonded, unbonding and withdraw mappings

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/types-live@6.122.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.2.0-next.0
  - @ledgerhq/live-env@3.2.0-next.0

## 2.1.0

### Minor Changes

- [#20883](https://github.com/LedgerHQ/ledger-live/pull/20883) [`328dd6f`](https://github.com/LedgerHQ/ledger-live/commit/328dd6f802c87d7248c9bfd95fea5b843aec162a) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo private list ops cleanup before extending framework

- [#20835](https://github.com/LedgerHQ/ledger-live/pull/20835) [`e5f61ca`](https://github.com/LedgerHQ/ledger-live/commit/e5f61ca5eae1df9e9ce6abcaa7715db206a71cdf) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add the `register` method to the coin-aleo framework API: it seals the account view key to the Provable record scanner and returns the `{ type: "aleo", provableId }` handle, sharing the seal-and-enroll sequence with the bridge's `accessProvableApi`.

- [#20846](https://github.com/LedgerHQ/ledger-live/pull/20846) [`fc4f6e1`](https://github.com/LedgerHQ/ledger-live/commit/fc4f6e16a4fbf1f5f5a900c6c178635fb55e46fc) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Implement the `combine` method and wire `broadcast` in the coin-aleo framework API: `combine` validates the ordered signature list (root first, then nested calls), reads the view key off the `Context`, and returns the hex-encoded SDK authorization.

- [#20941](https://github.com/LedgerHQ/ledger-live/pull/20941) [`7cb7f9f`](https://github.com/LedgerHQ/ledger-live/commit/7cb7f9fcde70585663639e0c8f8fb1c950489d3c) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo private list ops framework

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/types-live@6.121.0
  - @ledgerhq/ledger-wallet-framework@3.1.0
  - @ledgerhq/live-env@3.1.0

## 2.1.0-next.0

### Minor Changes

- [#20883](https://github.com/LedgerHQ/ledger-live/pull/20883) [`328dd6f`](https://github.com/LedgerHQ/ledger-live/commit/328dd6f802c87d7248c9bfd95fea5b843aec162a) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo private list ops cleanup before extending framework

- [#20835](https://github.com/LedgerHQ/ledger-live/pull/20835) [`e5f61ca`](https://github.com/LedgerHQ/ledger-live/commit/e5f61ca5eae1df9e9ce6abcaa7715db206a71cdf) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add the `register` method to the coin-aleo framework API: it seals the account view key to the Provable record scanner and returns the `{ type: "aleo", provableId }` handle, sharing the seal-and-enroll sequence with the bridge's `accessProvableApi`.

- [#20846](https://github.com/LedgerHQ/ledger-live/pull/20846) [`fc4f6e1`](https://github.com/LedgerHQ/ledger-live/commit/fc4f6e16a4fbf1f5f5a900c6c178635fb55e46fc) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Implement the `combine` method and wire `broadcast` in the coin-aleo framework API: `combine` validates the ordered signature list (root first, then nested calls), reads the view key off the `Context`, and returns the hex-encoded SDK authorization.

- [#20941](https://github.com/LedgerHQ/ledger-live/pull/20941) [`7cb7f9f`](https://github.com/LedgerHQ/ledger-live/commit/7cb7f9fcde70585663639e0c8f8fb1c950489d3c) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo private list ops framework

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/types-live@6.121.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.1.0-next.0
  - @ledgerhq/live-env@3.1.0-next.0

## 2.0.0

### Major Changes

- [#20752](https://github.com/LedgerHQ/ledger-live/pull/20752) [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update combine to accept string[] per ADR-047

### Minor Changes

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20771](https://github.com/LedgerHQ/ledger-live/pull/20771) [`eca1564`](https://github.com/LedgerHQ/ledger-live/commit/eca1564f3e5c28ae96a6b40cec77ecef0cd00920) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo framework `getBalance`

- [#20772](https://github.com/LedgerHQ/ledger-live/pull/20772) [`6d7ce10`](https://github.com/LedgerHQ/ledger-live/commit/6d7ce10fc2e0759656fe0448e7edf5a46f182de3) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: implement `craftTransaction` on the framework API for Aleo

- [#20826](https://github.com/LedgerHQ/ledger-live/pull/20826) [`0d6b626`](https://github.com/LedgerHQ/ledger-live/commit/0d6b62686b344d2142c4e38e8838450d3c0f7933) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: aleo listOperations with arc-20 tokens support

- [#20786](https://github.com/LedgerHQ/ledger-live/pull/20786) [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Add unsupported `register` to CoinModuleApi implementations (ADR-046)

- [#20770](https://github.com/LedgerHQ/ledger-live/pull/20770) [`b73e1f2`](https://github.com/LedgerHQ/ledger-live/commit/b73e1f2b1ba145e66578b1db2fab0a9b35957ee0) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: prepare aleo utils and fixtures for framework getBalance

- [#20749](https://github.com/LedgerHQ/ledger-live/pull/20749) [`d79bbc5`](https://github.com/LedgerHQ/ledger-live/commit/d79bbc546006248bb17e4874c4a61cd456fcdc6e) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Aleo now exposes its record-scanner scan status through `getAccountInfo`, so consumers can read sync progress from the shared API instead of digging into coin-module internals. Returns `{ type: "none" }` when the account isn't enrolled yet.

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/types-live@6.120.0
  - @ledgerhq/ledger-wallet-framework@3.0.0

## 2.0.0-next.1

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8)]:
  - @ledgerhq/types-live@6.120.0-next.1
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.1

## 2.0.0-next.0

### Major Changes

- [#20752](https://github.com/LedgerHQ/ledger-live/pull/20752) [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update combine to accept string[] per ADR-047

### Minor Changes

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20771](https://github.com/LedgerHQ/ledger-live/pull/20771) [`eca1564`](https://github.com/LedgerHQ/ledger-live/commit/eca1564f3e5c28ae96a6b40cec77ecef0cd00920) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo framework `getBalance`

- [#20772](https://github.com/LedgerHQ/ledger-live/pull/20772) [`6d7ce10`](https://github.com/LedgerHQ/ledger-live/commit/6d7ce10fc2e0759656fe0448e7edf5a46f182de3) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: implement `craftTransaction` on the framework API for Aleo

- [#20826](https://github.com/LedgerHQ/ledger-live/pull/20826) [`0d6b626`](https://github.com/LedgerHQ/ledger-live/commit/0d6b62686b344d2142c4e38e8838450d3c0f7933) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: aleo listOperations with arc-20 tokens support

- [#20786](https://github.com/LedgerHQ/ledger-live/pull/20786) [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Add unsupported `register` to CoinModuleApi implementations (ADR-046)

- [#20770](https://github.com/LedgerHQ/ledger-live/pull/20770) [`b73e1f2`](https://github.com/LedgerHQ/ledger-live/commit/b73e1f2b1ba145e66578b1db2fab0a9b35957ee0) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: prepare aleo utils and fixtures for framework getBalance

- [#20749](https://github.com/LedgerHQ/ledger-live/pull/20749) [`d79bbc5`](https://github.com/LedgerHQ/ledger-live/commit/d79bbc546006248bb17e4874c4a61cd456fcdc6e) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Aleo now exposes its record-scanner scan status through `getAccountInfo`, so consumers can read sync progress from the shared API instead of digging into coin-module internals. Returns `{ type: "none" }` when the account isn't enrolled yet.

### Patch Changes

- Updated dependencies [[`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.0
  - @ledgerhq/types-live@6.120.0-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
