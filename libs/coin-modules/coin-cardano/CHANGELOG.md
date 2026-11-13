# @ledgerhq/coin-cardano

## 3.0.0

### Major Changes

- [#24457](https://github.com/LedgerHQ/ledger-live/pull/24457) [`420409b`](https://github.com/LedgerHQ/ledger-live/commit/420409ba20ed5eca81813b15b7dcb85a92de1b5b) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Read the Cardano API and epoch-params endpoints from the coin config (`api.url`, `epochParams.url`) instead of the `CARDANO_*_ENDPOINT` env variables, which are removed

  **Breaking change**: `CardanoConfig` gains the required `api: { url: string }` and `epochParams: { url: string }`, and `CARDANO_API_ENDPOINT`, `CARDANO_TESTNET_API_ENDPOINT`, `CARDANO_EPOCH_PARAMS_ENDPOINT` and `CARDANO_TESTNET_EPOCH_PARAMS_ENDPOINT` are no longer exported from `src/constants`. Each currency config carries its own endpoints, so a consumer that builds its own config (such as the coin-service) passes them there; `cardanoDefaults` holds the Ledger defaults.

### Minor Changes

- [#24373](https://github.com/LedgerHQ/ledger-live/pull/24373) [`6ab5a87`](https://github.com/LedgerHQ/ledger-live/commit/6ab5a87d796726b2fc38b34862209abf82521f72) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Export the default coin configs from each coin package and wrap them in `ledger-live-common` (ADR-063). `coin-celo` and `coin-cosmos` replace their `celoConfig` and `cosmosConfig` exports, which wrapped the defaults in `ConfigInfo`, with plain typed `celoDefaults` and `cosmosDefaults`; their `features` now use the `status` key instead of `type`, Desmos gets the active status it was missing, and Gonka defaults to a minimum gas price of 1 ngonka

- [#24522](https://github.com/LedgerHQ/ledger-live/pull/24522) [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Import bignumber.js through its default export, the form bignumber.js 11 types support

### Patch Changes

- Updated dependencies [[`b77803f`](https://github.com/LedgerHQ/ledger-live/commit/b77803ffbca90848d55bca56b9d8cd3547464620), [`d701bc7`](https://github.com/LedgerHQ/ledger-live/commit/d701bc7564f9f479e0cc867ef76ec40b73f5c49c), [`d36ed0a`](https://github.com/LedgerHQ/ledger-live/commit/d36ed0a5b624f1842e2ad3a857d502621dfb5fb9), [`e051c84`](https://github.com/LedgerHQ/ledger-live/commit/e051c84a8486b78327ea49500c38b6e2138bbc21), [`3a0d8aa`](https://github.com/LedgerHQ/ledger-live/commit/3a0d8aa1d4904fa0ccc53528ec092bc32a63dcd4), [`96fac1e`](https://github.com/LedgerHQ/ledger-live/commit/96fac1eb64856beb33cc68594e98c25e8b308898), [`0d83181`](https://github.com/LedgerHQ/ledger-live/commit/0d83181e9a96f55811f2ce5532527739bdb7e62a), [`e186896`](https://github.com/LedgerHQ/ledger-live/commit/e186896213df32feb1e6a80e38f45cf189655866), [`e7b21f8`](https://github.com/LedgerHQ/ledger-live/commit/e7b21f816021dbbe7314ff51bf32cc4d87291b98), [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e), [`d3f59ae`](https://github.com/LedgerHQ/ledger-live/commit/d3f59ae3fc6b9d9240bd81df9f93c1223cb64ddb)]:
  - @ledgerhq/types-live@6.131.0
  - @ledgerhq/ledger-wallet-framework@3.11.0

## 3.0.0-next.0

### Major Changes

- [#24457](https://github.com/LedgerHQ/ledger-live/pull/24457) [`420409b`](https://github.com/LedgerHQ/ledger-live/commit/420409ba20ed5eca81813b15b7dcb85a92de1b5b) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Read the Cardano API and epoch-params endpoints from the coin config (`api.url`, `epochParams.url`) instead of the `CARDANO_*_ENDPOINT` env variables, which are removed

  **Breaking change**: `CardanoConfig` gains the required `api: { url: string }` and `epochParams: { url: string }`, and `CARDANO_API_ENDPOINT`, `CARDANO_TESTNET_API_ENDPOINT`, `CARDANO_EPOCH_PARAMS_ENDPOINT` and `CARDANO_TESTNET_EPOCH_PARAMS_ENDPOINT` are no longer exported from `src/constants`. Each currency config carries its own endpoints, so a consumer that builds its own config (such as the coin-service) passes them there; `cardanoDefaults` holds the Ledger defaults.

### Minor Changes

- [#24373](https://github.com/LedgerHQ/ledger-live/pull/24373) [`6ab5a87`](https://github.com/LedgerHQ/ledger-live/commit/6ab5a87d796726b2fc38b34862209abf82521f72) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Export the default coin configs from each coin package and wrap them in `ledger-live-common` (ADR-063). `coin-celo` and `coin-cosmos` replace their `celoConfig` and `cosmosConfig` exports, which wrapped the defaults in `ConfigInfo`, with plain typed `celoDefaults` and `cosmosDefaults`; their `features` now use the `status` key instead of `type`, Desmos gets the active status it was missing, and Gonka defaults to a minimum gas price of 1 ngonka

- [#24522](https://github.com/LedgerHQ/ledger-live/pull/24522) [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Import bignumber.js through its default export, the form bignumber.js 11 types support

### Patch Changes

- Updated dependencies [[`b77803f`](https://github.com/LedgerHQ/ledger-live/commit/b77803ffbca90848d55bca56b9d8cd3547464620), [`d701bc7`](https://github.com/LedgerHQ/ledger-live/commit/d701bc7564f9f479e0cc867ef76ec40b73f5c49c), [`d36ed0a`](https://github.com/LedgerHQ/ledger-live/commit/d36ed0a5b624f1842e2ad3a857d502621dfb5fb9), [`e051c84`](https://github.com/LedgerHQ/ledger-live/commit/e051c84a8486b78327ea49500c38b6e2138bbc21), [`3a0d8aa`](https://github.com/LedgerHQ/ledger-live/commit/3a0d8aa1d4904fa0ccc53528ec092bc32a63dcd4), [`96fac1e`](https://github.com/LedgerHQ/ledger-live/commit/96fac1eb64856beb33cc68594e98c25e8b308898), [`0d83181`](https://github.com/LedgerHQ/ledger-live/commit/0d83181e9a96f55811f2ce5532527739bdb7e62a), [`e186896`](https://github.com/LedgerHQ/ledger-live/commit/e186896213df32feb1e6a80e38f45cf189655866), [`e7b21f8`](https://github.com/LedgerHQ/ledger-live/commit/e7b21f816021dbbe7314ff51bf32cc4d87291b98), [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e), [`d3f59ae`](https://github.com/LedgerHQ/ledger-live/commit/d3f59ae3fc6b9d9240bd81df9f93c1223cb64ddb)]:
  - @ledgerhq/types-live@6.131.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.11.0-next.0

## 2.1.1

### Patch Changes

- Updated dependencies [[`9907890`](https://github.com/LedgerHQ/ledger-live/commit/9907890790bf8b804d7cc454a067508df0969137), [`8854aff`](https://github.com/LedgerHQ/ledger-live/commit/8854aff9cace72ad17c6d9fd7ee98a4dcd65ecb1), [`77a85a3`](https://github.com/LedgerHQ/ledger-live/commit/77a85a30abe7b42e5f5b4e0478bec14fa39033cf), [`c50f3fa`](https://github.com/LedgerHQ/ledger-live/commit/c50f3fac1c822d61332dbb512b21cdda6bb57210)]:
  - @ledgerhq/types-live@6.130.0
  - @ledgerhq/ledger-wallet-framework@3.10.0

## 2.1.1-next.0

### Patch Changes

- Updated dependencies [[`9907890`](https://github.com/LedgerHQ/ledger-live/commit/9907890790bf8b804d7cc454a067508df0969137), [`8854aff`](https://github.com/LedgerHQ/ledger-live/commit/8854aff9cace72ad17c6d9fd7ee98a4dcd65ecb1), [`77a85a3`](https://github.com/LedgerHQ/ledger-live/commit/77a85a30abe7b42e5f5b4e0478bec14fa39033cf), [`c50f3fa`](https://github.com/LedgerHQ/ledger-live/commit/c50f3fac1c822d61332dbb512b21cdda6bb57210)]:
  - @ledgerhq/types-live@6.130.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.10.0-next.0

## 2.1.0

### Minor Changes

- [#23846](https://github.com/LedgerHQ/ledger-live/pull/23846) [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359) Thanks [@gre-ledger](https://github.com/gre-ledger)! - fix: ship lib and lib-es in the npm tarballs again, which pnpm 11 dropped

- [#23527](https://github.com/LedgerHQ/ledger-live/pull/23527) [`a389665`](https://github.com/LedgerHQ/ledger-live/commit/a389665d6256a750f539ec54516f667cca1fb011) Thanks [@qperrot](https://github.com/qperrot)! - Stop setting name / unit on returned assets

### Patch Changes

- Updated dependencies [[`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1), [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359), [`9c7d59d`](https://github.com/LedgerHQ/ledger-live/commit/9c7d59d0ffcc72ba746bc20e9ff744db9730503b)]:
  - @ledgerhq/ledger-wallet-framework@3.9.0
  - @ledgerhq/types-live@6.129.0

## 2.1.0-next.0

### Minor Changes

- [#23846](https://github.com/LedgerHQ/ledger-live/pull/23846) [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359) Thanks [@gre-ledger](https://github.com/gre-ledger)! - fix: ship lib and lib-es in the npm tarballs again, which pnpm 11 dropped

- [#23527](https://github.com/LedgerHQ/ledger-live/pull/23527) [`a389665`](https://github.com/LedgerHQ/ledger-live/commit/a389665d6256a750f539ec54516f667cca1fb011) Thanks [@qperrot](https://github.com/qperrot)! - Stop setting name / unit on returned assets

### Patch Changes

- Updated dependencies [[`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1), [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359), [`9c7d59d`](https://github.com/LedgerHQ/ledger-live/commit/9c7d59d0ffcc72ba746bc20e9ff744db9730503b)]:
  - @ledgerhq/ledger-wallet-framework@3.9.0-next.0
  - @ledgerhq/types-live@6.129.0-next.0

## 2.0.1

### Patch Changes

- Updated dependencies [[`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97)]:
  - @ledgerhq/ledger-wallet-framework@3.8.0
  - @ledgerhq/types-live@6.128.0

## 2.0.1-next.0

### Patch Changes

- Updated dependencies [[`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97)]:
  - @ledgerhq/ledger-wallet-framework@3.8.0-next.0
  - @ledgerhq/types-live@6.128.0-next.0

## 2.0.0

### Major Changes

- [#23209](https://github.com/LedgerHQ/ledger-live/pull/23209) [`bc85ada`](https://github.com/LedgerHQ/ledger-live/commit/bc85ada15c9403d1180d5af23f730196fd0cc672) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-cardano): stop resolving the currency with `getCryptoCurrencyById`

  The module no longer needs the host currencies resolver. The network is read from a new required
  `testnet` field of the Cardano coin config, served `false` in `config_currency_cardano` and `true` in
  a new `config_currency_cardano_testnet`. `createApi(currencyId)` resolves the config with
  `context.config()` and uses its `currencyId` directly where the id itself is needed (operation ids,
  TTL, network parameters, pool bech32 ids), so no `id` is added to the config. The bridge resolves the
  config for the account's currency instead of always reading `cardano`.

  Breaking: `CardanoConfig` requires `testnet`. `isTestnet`, `lastBlock`, `getValidators`, `getBalance`,
  `getStakes`, `broadcast`, `validateIntent`, `fetchDelegation`, `getTransactions` and the api fetchers
  (`fetchNetworkInfo`, `fetchLatestBlock`, `fetchEpochInfo`, `fetchPoolList`, `fetchPoolDetails`,
  `getDelegationInfo`, `getAllTransactionsByKeys`, `submitTransaction`) take the coin config instead of
  a currency, as first parameter. `listOperations`, `craftTransaction`, `buildUnsignedTransaction` and
  `estimateFees` take `(config, currencyId, ...)`. The live-common `fetchPoolDetails` and
  `useCardanoFamilyPools` keep taking a currency and resolve its config.

### Minor Changes

- [#23007](https://github.com/LedgerHQ/ledger-live/pull/23007) [`94e247b`](https://github.com/LedgerHQ/ledger-live/commit/94e247bcaa49bd601951be6f39182ee26ed67ecc) Thanks [@ishaba](https://github.com/ishaba)! - cardano: stop counting unclaimed staking rewards as spendable. A send never withdraws rewards (the device swap policy rejects withdrawals), so whatever the dRep delegation the account-sync spendable balance now excludes them, the CoinModule `getBalance` reports them as `locked`, and an ADA send is validated against the spendable balance instead of the total balance. Sends and swaps of an amount only the rewards would cover now fail early with `NotEnoughBalance` instead of a build-time `CardanoNotEnoughFunds`, including on an account holding only rewards (no UTXO). Send Max skips that pre-check and is left to the transaction builder.

### Patch Changes

- Updated dependencies [[`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0
  - @ledgerhq/types-live@6.127.0

## 2.0.0-next.1

### Patch Changes

- Updated dependencies [[`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.1

## 2.0.0-next.0

### Major Changes

- [#23209](https://github.com/LedgerHQ/ledger-live/pull/23209) [`bc85ada`](https://github.com/LedgerHQ/ledger-live/commit/bc85ada15c9403d1180d5af23f730196fd0cc672) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-cardano): stop resolving the currency with `getCryptoCurrencyById`

  The module no longer needs the host currencies resolver. The network is read from a new required
  `testnet` field of the Cardano coin config, served `false` in `config_currency_cardano` and `true` in
  a new `config_currency_cardano_testnet`. `createApi(currencyId)` resolves the config with
  `context.config()` and uses its `currencyId` directly where the id itself is needed (operation ids,
  TTL, network parameters, pool bech32 ids), so no `id` is added to the config. The bridge resolves the
  config for the account's currency instead of always reading `cardano`.

  Breaking: `CardanoConfig` requires `testnet`. `isTestnet`, `lastBlock`, `getValidators`, `getBalance`,
  `getStakes`, `broadcast`, `validateIntent`, `fetchDelegation`, `getTransactions` and the api fetchers
  (`fetchNetworkInfo`, `fetchLatestBlock`, `fetchEpochInfo`, `fetchPoolList`, `fetchPoolDetails`,
  `getDelegationInfo`, `getAllTransactionsByKeys`, `submitTransaction`) take the coin config instead of
  a currency, as first parameter. `listOperations`, `craftTransaction`, `buildUnsignedTransaction` and
  `estimateFees` take `(config, currencyId, ...)`. The live-common `fetchPoolDetails` and
  `useCardanoFamilyPools` keep taking a currency and resolve its config.

### Minor Changes

- [#23007](https://github.com/LedgerHQ/ledger-live/pull/23007) [`94e247b`](https://github.com/LedgerHQ/ledger-live/commit/94e247bcaa49bd601951be6f39182ee26ed67ecc) Thanks [@ishaba](https://github.com/ishaba)! - cardano: stop counting unclaimed staking rewards as spendable. A send never withdraws rewards (the device swap policy rejects withdrawals), so whatever the dRep delegation the account-sync spendable balance now excludes them, the CoinModule `getBalance` reports them as `locked`, and an ADA send is validated against the spendable balance instead of the total balance. Sends and swaps of an amount only the rewards would cover now fail early with `NotEnoughBalance` instead of a build-time `CardanoNotEnoughFunds`, including on an account holding only rewards (no UTXO). Send Max skips that pre-check and is left to the transaction builder.

### Patch Changes

- Updated dependencies [[`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.0
  - @ledgerhq/types-live@6.127.0-next.0

## 1.3.0

### Minor Changes

- [#21953](https://github.com/LedgerHQ/ledger-live/pull/21953) [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/live-config`, `@ledgerhq/live-env`, `@ledgerhq/live-currency-format`,
  `@ledgerhq/domain-service` and `@ledgerhq/evm-tools` from npm instead of the workspace — they
  now live in the `ts-libs` repository. No API change.

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d)]:
  - @ledgerhq/types-live@6.126.0
  - @ledgerhq/ledger-wallet-framework@3.6.0

## 1.3.0-next.0

### Minor Changes

- [#21953](https://github.com/LedgerHQ/ledger-live/pull/21953) [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/live-config`, `@ledgerhq/live-env`, `@ledgerhq/live-currency-format`,
  `@ledgerhq/domain-service` and `@ledgerhq/evm-tools` from npm instead of the workspace — they
  now live in the `ts-libs` repository. No API change.

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d)]:
  - @ledgerhq/types-live@6.126.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.6.0-next.0

## 1.2.0

### Minor Changes

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @ledgerhq/ledger-wallet-framework@3.5.0
  - @ledgerhq/types-live@6.125.0
  - @ledgerhq/live-env@4.1.0

## 1.2.0-next.0

### Minor Changes

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @ledgerhq/ledger-wallet-framework@3.5.0-next.0
  - @ledgerhq/types-live@6.125.0-next.0
  - @ledgerhq/live-env@4.1.0-next.0

## 1.1.2

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/types-live@6.124.0
  - @ledgerhq/ledger-wallet-framework@3.4.0

## 1.1.2-next.0

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/types-live@6.124.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.4.0-next.0

## 1.1.1

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @ledgerhq/types-live@6.123.0
  - @ledgerhq/ledger-wallet-framework@3.3.0
  - @ledgerhq/live-env@4.0.0

## 1.1.1-next.0

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @ledgerhq/types-live@6.123.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.3.0-next.0
  - @ledgerhq/live-env@4.0.0-next.0

## 1.1.0

### Minor Changes

- [#21168](https://github.com/LedgerHQ/ledger-live/pull/21168) [`e76361d`](https://github.com/LedgerHQ/ledger-live/commit/e76361de6952dc17336daa0679557fcb7b935430) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

  `createApi` no longer declares `CoinModuleApi` as its return type: it returns the object it actually
  builds, checked with `satisfies CoinModuleImpl<CardanoCoinConfig, StringMemo>`. The seven capability
  methods the module never implemented are omitted instead of stubbed — `call`, `register`,
  `craftRawTransaction`, `getBlock`, `getBlockInfo`, `getRewards` and `getNextSequence`, the last one
  because Cardano is UTXO-based and has no per-account sequence to advance. Cardano's partial staking
  support is unchanged and now visible in the type: `getStakes` and `getValidators` are real
  implementations, only the reward-distribution listing is absent.

  Consumers see no behavioural change. The generic-coin-framework resolver hands the module out through
  the framework's `withDefaults`, which backfills every omitted method with the same
  `"<name> is not supported"` throw the stubs raised — the one wording change is `getNextSequence`,
  which now reports "not supported" rather than "not applicable for Cardano". `supports()` on the
  wrapped api now reports these capabilities as absent, which the stubs previously masked.

  The api test asserts the whole capability surface with the framework's `capabilityReport()` rather than one test per unimplemented capability: one expectation covers that each is absent, that reaching it raises `"<name> is not supported"`, and that `supports()` agrees. Being an exact comparison it is exhaustive, so implementing or dropping a capability changes the list instead of leaving a test that passes while covering less.

- [#21251](https://github.com/LedgerHQ/ledger-live/pull/21251) [`076322c`](https://github.com/LedgerHQ/ledger-live/commit/076322c82b0edcba1eda4981902f98cfe6c62b43) Thanks [@ishaba](https://github.com/ishaba)! - cardano: stop injecting an ABSTAIN vote-delegation certificate (and an automatic reward withdrawal) into plain send transactions. The Conway `ConwayWdrlNotDelegatedToDRep` rule constrains only a transaction that withdraws rewards, so a send that does not touch the reward account is valid with zero certificates and zero withdrawals regardless of unclaimed rewards — injecting either silently changed the user's governance state and broke swaps (the device swap policy rejects any certificate or withdrawal). These reward/governance obligations now apply only to the delegate/undelegate flows, which are unchanged. Fixes Cardano swaps failing on accounts that hold staking rewards. Applies to both the account bridge (`buildTransaction`) and the CoinModule API (`craftTransaction`) paths.

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/types-live@6.122.0
  - @ledgerhq/ledger-wallet-framework@3.2.0
  - @ledgerhq/live-env@3.2.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
