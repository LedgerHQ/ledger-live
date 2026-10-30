# @ledgerhq/coin-aptos

## 4.6.0-next.0

### Minor Changes

- [#23697](https://github.com/LedgerHQ/ledger-live/pull/23697) [`8654ca0`](https://github.com/LedgerHQ/ledger-live/commit/8654ca0db8912b41e7f6d74df7df3f67a9d5866c) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - fix(coin-aptos): order account transactions by version when paging the indexer

  The offset-paginated `account_transactions` queries had no `order_by`, so page boundaries relied on the database's implicit row order. They now order by ascending transaction version.

- [#23709](https://github.com/LedgerHQ/ledger-live/pull/23709) [`e172fe1`](https://github.com/LedgerHQ/ledger-live/commit/e172fe16313acac61b59b7114061bb6c52f0cb67) Thanks [@semeano](https://github.com/semeano)! - fix(coin-aptos): key the fee estimation cache on the recipient

  The cached estimate was reused across recipients for the same amount, so switching to a recipient
  that needs a new primary store could sign with a gas limit that is too low.

- [#23697](https://github.com/LedgerHQ/ledger-live/pull/23697) [`8654ca0`](https://github.com/LedgerHQ/ledger-live/commit/8654ca0db8912b41e7f6d74df7df3f67a9d5866c) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - fix(coin-aptos): filter listOperations by block height instead of transaction version

  `minHeight` was compared with transaction versions, so almost the whole history was returned. It is now mapped to the first transaction version of that block, inclusive.

- [#23709](https://github.com/LedgerHQ/ledger-live/pull/23709) [`e172fe1`](https://github.com/LedgerHQ/ledger-live/commit/e172fe16313acac61b59b7114061bb6c52f0cb67) Thanks [@semeano](https://github.com/semeano)! - fix(coin-aptos): reserve the simulated gas on "use max" sends

  A "use max" send always used the default gas limit (200), so a token transfer to a recipient
  without a primary store for that asset ran out of gas on-chain. It now reserves at least the
  simulated gas.

- [#23846](https://github.com/LedgerHQ/ledger-live/pull/23846) [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359) Thanks [@gre-ledger](https://github.com/gre-ledger)! - fix: ship lib and lib-es in the npm tarballs again, which pnpm 11 dropped

### Patch Changes

- Updated dependencies [[`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1), [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359), [`9c7d59d`](https://github.com/LedgerHQ/ledger-live/commit/9c7d59d0ffcc72ba746bc20e9ff744db9730503b)]:
  - @ledgerhq/ledger-wallet-framework@3.9.0-next.0
  - @ledgerhq/types-live@6.129.0-next.0

## 4.5.0

### Minor Changes

- [#23311](https://github.com/LedgerHQ/ledger-live/pull/23311) [`4282168`](https://github.com/LedgerHQ/ledger-live/commit/42821688658007954e94c223b10522706b8e56aa) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-aptos): stop resolving the currency with `getCryptoCurrencyById` in `isTestnet`

  `isTestnet` now reads the network from the currency id (`aptos_testnet`) instead of looking up the
  currency's `isTestnetFor` through the host currencies resolver. Only the classic bridge and
  `getValidators` (via preload) build `AptosAPI` from a currency id; the API path already builds it from
  `config.aptosSettings`.

### Patch Changes

- Updated dependencies [[`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97)]:
  - @ledgerhq/ledger-wallet-framework@3.8.0
  - @ledgerhq/types-live@6.128.0

## 4.5.0-next.0

### Minor Changes

- [#23311](https://github.com/LedgerHQ/ledger-live/pull/23311) [`4282168`](https://github.com/LedgerHQ/ledger-live/commit/42821688658007954e94c223b10522706b8e56aa) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-aptos): stop resolving the currency with `getCryptoCurrencyById` in `isTestnet`

  `isTestnet` now reads the network from the currency id (`aptos_testnet`) instead of looking up the
  currency's `isTestnetFor` through the host currencies resolver. Only the classic bridge and
  `getValidators` (via preload) build `AptosAPI` from a currency id; the API path already builds it from
  `config.aptosSettings`.

### Patch Changes

- Updated dependencies [[`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97)]:
  - @ledgerhq/ledger-wallet-framework@3.8.0-next.0
  - @ledgerhq/types-live@6.128.0-next.0

## 4.4.0

### Minor Changes

- [#22845](https://github.com/LedgerHQ/ledger-live/pull/22845) [`0680bcd`](https://github.com/LedgerHQ/ledger-live/commit/0680bcd3514e31d8479c4f8ceafe7cf4438a2ec1) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Fix Aptos sync crashing on non-user transactions and decode multisig transfers in history

### Patch Changes

- Updated dependencies [[`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0
  - @ledgerhq/types-live@6.127.0

## 4.4.0-next.1

### Patch Changes

- Updated dependencies [[`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.1

## 4.4.0-next.0

### Minor Changes

- [#22845](https://github.com/LedgerHQ/ledger-live/pull/22845) [`0680bcd`](https://github.com/LedgerHQ/ledger-live/commit/0680bcd3514e31d8479c4f8ceafe7cf4438a2ec1) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Fix Aptos sync crashing on non-user transactions and decode multisig transfers in history

### Patch Changes

- Updated dependencies [[`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.0
  - @ledgerhq/types-live@6.127.0-next.0

## 4.3.0

### Minor Changes

- [#21953](https://github.com/LedgerHQ/ledger-live/pull/21953) [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/live-config`, `@ledgerhq/live-env`, `@ledgerhq/live-currency-format`,
  `@ledgerhq/domain-service` and `@ledgerhq/evm-tools` from npm instead of the workspace — they
  now live in the `ts-libs` repository. No API change.

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d)]:
  - @ledgerhq/types-live@6.126.0
  - @ledgerhq/ledger-wallet-framework@3.6.0

## 4.3.0-next.0

### Minor Changes

- [#21953](https://github.com/LedgerHQ/ledger-live/pull/21953) [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/live-config`, `@ledgerhq/live-env`, `@ledgerhq/live-currency-format`,
  `@ledgerhq/domain-service` and `@ledgerhq/evm-tools` from npm instead of the workspace — they
  now live in the `ts-libs` repository. No API change.

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d)]:
  - @ledgerhq/types-live@6.126.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.6.0-next.0

## 4.2.0

### Minor Changes

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @ledgerhq/ledger-wallet-framework@3.5.0
  - @ledgerhq/types-live@6.125.0
  - @ledgerhq/live-env@4.1.0

## 4.2.0-next.0

### Minor Changes

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @ledgerhq/ledger-wallet-framework@3.5.0-next.0
  - @ledgerhq/types-live@6.125.0-next.0
  - @ledgerhq/live-env@4.1.0-next.0

## 4.1.2

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/types-live@6.124.0
  - @ledgerhq/ledger-wallet-framework@3.4.0

## 4.1.2-next.0

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/types-live@6.124.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.4.0-next.0

## 4.1.1

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @ledgerhq/types-live@6.123.0
  - @ledgerhq/ledger-wallet-framework@3.3.0
  - @ledgerhq/live-env@4.0.0

## 4.1.1-next.0

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @ledgerhq/types-live@6.123.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.3.0-next.0
  - @ledgerhq/live-env@4.0.0-next.0

## 4.1.0

### Minor Changes

- [#21168](https://github.com/LedgerHQ/ledger-live/pull/21168) [`5231fc1`](https://github.com/LedgerHQ/ledger-live/commit/5231fc118d24b4c60faf1f20e38a161f4d22bff5) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

  `createApi` now returns its object with `satisfies CoinModuleImpl<AptosCoinConfig>` — which keeps the precise shape, so a caller sees exactly which methods exist — declaring the nine the module implements: `broadcast`, `combine`, `craftTransaction`, `craftTransactionData`, `estimateFees`, `getBalance`, `lastBlock`, `listOperations` and `validateAddress`.

  The ten capabilities Aptos has none of — `call`, `register`, `craftRawTransaction`, `getBlock`, `getBlockInfo`, `getStakes`, `getRewards`, `getValidators`, `validateIntent` and `getNextSequence` — are omitted instead of each carrying a `throw new Error("… is not supported")`. `validateAddress` is the one capability that stays, because it is a real offline check on the address shape rather than a placeholder; keeping it in the declared shape is what tells a caller the difference.

  Consumers see no change. They reach the module through a resolver that applies the framework's `withDefaults`, which supplies every omitted capability, so the same call still raises the same `"<method> is not supported"` error — except that the default throws synchronously where several of the stubs it replaces were `async` functions returning a rejected promise. `supports(method)` now reports which capabilities are real.

  The authored type also keeps the contract's trailing optional parameter, or a caller reaching the module through it could no longer pass it: `estimateFees` accepts and ignores its own. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/types-live@6.122.0
  - @ledgerhq/ledger-wallet-framework@3.2.0
  - @ledgerhq/live-env@3.2.0

## 4.1.0-next.0

### Minor Changes

- [#21168](https://github.com/LedgerHQ/ledger-live/pull/21168) [`5231fc1`](https://github.com/LedgerHQ/ledger-live/commit/5231fc118d24b4c60faf1f20e38a161f4d22bff5) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

  `createApi` now returns its object with `satisfies CoinModuleImpl<AptosCoinConfig>` — which keeps the precise shape, so a caller sees exactly which methods exist — declaring the nine the module implements: `broadcast`, `combine`, `craftTransaction`, `craftTransactionData`, `estimateFees`, `getBalance`, `lastBlock`, `listOperations` and `validateAddress`.

  The ten capabilities Aptos has none of — `call`, `register`, `craftRawTransaction`, `getBlock`, `getBlockInfo`, `getStakes`, `getRewards`, `getValidators`, `validateIntent` and `getNextSequence` — are omitted instead of each carrying a `throw new Error("… is not supported")`. `validateAddress` is the one capability that stays, because it is a real offline check on the address shape rather than a placeholder; keeping it in the declared shape is what tells a caller the difference.

  Consumers see no change. They reach the module through a resolver that applies the framework's `withDefaults`, which supplies every omitted capability, so the same call still raises the same `"<method> is not supported"` error — except that the default throws synchronously where several of the stubs it replaces were `async` functions returning a rejected promise. `supports(method)` now reports which capabilities are real.

  The authored type also keeps the contract's trailing optional parameter, or a caller reaching the module through it could no longer pass it: `estimateFees` accepts and ignores its own. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/types-live@6.122.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.2.0-next.0
  - @ledgerhq/live-env@3.2.0-next.0

## 4.0.1

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/types-live@6.121.0
  - @ledgerhq/ledger-wallet-framework@3.1.0
  - @ledgerhq/live-env@3.1.0

## 4.0.1-next.0

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/types-live@6.121.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.1.0-next.0
  - @ledgerhq/live-env@3.1.0-next.0

## 4.0.0

### Major Changes

- [#20752](https://github.com/LedgerHQ/ledger-live/pull/20752) [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update combine to accept string[] per ADR-047

### Minor Changes

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20786](https://github.com/LedgerHQ/ledger-live/pull/20786) [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Add unsupported `register` to CoinModuleApi implementations (ADR-046)

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/types-live@6.120.0
  - @ledgerhq/ledger-wallet-framework@3.0.0

## 4.0.0-next.1

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8)]:
  - @ledgerhq/types-live@6.120.0-next.1
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.1

## 4.0.0-next.0

### Major Changes

- [#20752](https://github.com/LedgerHQ/ledger-live/pull/20752) [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update combine to accept string[] per ADR-047

### Minor Changes

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20786](https://github.com/LedgerHQ/ledger-live/pull/20786) [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Add unsupported `register` to CoinModuleApi implementations (ADR-046)

### Patch Changes

- Updated dependencies [[`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.0
  - @ledgerhq/types-live@6.120.0-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
