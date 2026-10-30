# @ledgerhq/coin-cosmos

## 2.1.0-next.0

### Minor Changes

- [#23615](https://github.com/LedgerHQ/ledger-live/pull/23615) [`4c672f6`](https://github.com/LedgerHQ/ledger-live/commit/4c672f6a9278217ddaea38038cb8c81af5fa7edc) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-cosmos): preserve failed operations

- [#23928](https://github.com/LedgerHQ/ledger-live/pull/23928) [`b44c3d6`](https://github.com/LedgerHQ/ledger-live/commit/b44c3d64ae0be535b0de64e95ce64fd253fab018) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `@keplr-wallet/proto-types` and `cosmjs-types@0.2.1` (and with them `protobufjs@6`): use `cosmjs-types@0.10` and a local codec for the Babylon `MsgWrapped*` messages, with byte-identical encoding

- [#23846](https://github.com/LedgerHQ/ledger-live/pull/23846) [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359) Thanks [@gre-ledger](https://github.com/gre-ledger)! - fix: ship lib and lib-es in the npm tarballs again, which pnpm 11 dropped

- [#23255](https://github.com/LedgerHQ/ledger-live/pull/23255) [`0240a0c`](https://github.com/LedgerHQ/ledger-live/commit/0240a0c9a069f895516199995483af5f12993277) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(cosmos): slim the account model (sequence, staking resources with validators, mode-based transaction type)

### Patch Changes

- Updated dependencies [[`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1), [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359), [`9c7d59d`](https://github.com/LedgerHQ/ledger-live/commit/9c7d59d0ffcc72ba746bc20e9ff744db9730503b)]:
  - @ledgerhq/ledger-wallet-framework@3.9.0-next.0
  - @ledgerhq/types-live@6.129.0-next.0

## 2.0.0

### Major Changes

- [#23229](https://github.com/LedgerHQ/ledger-live/pull/23229) [`2cd35c5`](https://github.com/LedgerHQ/ledger-live/commit/2cd35c5e21a9dfe58ca58349280f33266143ca51) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-cosmos): stop resolving the currency with `getCryptoCurrencyById`

  The module no longer needs the host currencies resolver. The on-chain base denom (e.g. `uatom`),
  formerly read from the currency's `units[1].code`, comes from a new required `denom` field of the
  Cosmos coin config, served in every `config_currency_<id>`. `createApi(currencyId)` uses its
  `currencyId` directly where the id is needed. The bridge passes `account.currency.units[1].code`,
  `preload` reuses the currency it receives, and `getTransactionStatus` drops its registry lookup by
  name while keeping the same prefix check. `CosmosCoinConfig` is now typed as
  `CurrencyConfig & { denom: string }` instead of reusing the live-config map type.

  Breaking: `CosmosAPI.getCurrency()` is removed. `CosmosAPI.getAccountInfo`, `getAllBalances`,
  `getDelegations`, `getStakingPositions` and `getRedelegationsWithQueued` take a denom string instead
  of a `CryptoCurrency`. `getBalance`, `getStakes`, `listOperations` and `craftTransaction` take the
  coin config as first parameter; `estimateFees` takes `(config, currencyId, intent)`; and
  `getRedelegations` takes `(currencyId, denom, address)`.

### Minor Changes

- [#23386](https://github.com/LedgerHQ/ledger-live/pull/23386) [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574) Thanks [@dilaouid](https://github.com/dilaouid)! - Remove the Zenrock and Quicksilver integrations, including their chain adapters, currency definitions, feature flags and LCD endpoints

- [#23254](https://github.com/LedgerHQ/ledger-live/pull/23254) [`ff14496`](https://github.com/LedgerHQ/ledger-live/commit/ff14496257201991b52f0dd140e351fca3e84d4d) Thanks [@dilaouid](https://github.com/dilaouid)! - Migrate persisted Cosmos accounts from legacy cosmosResources to staking resources

### Patch Changes

- Updated dependencies [[`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97)]:
  - @ledgerhq/ledger-wallet-framework@3.8.0
  - @ledgerhq/types-live@6.128.0

## 2.0.0-next.0

### Major Changes

- [#23229](https://github.com/LedgerHQ/ledger-live/pull/23229) [`2cd35c5`](https://github.com/LedgerHQ/ledger-live/commit/2cd35c5e21a9dfe58ca58349280f33266143ca51) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-cosmos): stop resolving the currency with `getCryptoCurrencyById`

  The module no longer needs the host currencies resolver. The on-chain base denom (e.g. `uatom`),
  formerly read from the currency's `units[1].code`, comes from a new required `denom` field of the
  Cosmos coin config, served in every `config_currency_<id>`. `createApi(currencyId)` uses its
  `currencyId` directly where the id is needed. The bridge passes `account.currency.units[1].code`,
  `preload` reuses the currency it receives, and `getTransactionStatus` drops its registry lookup by
  name while keeping the same prefix check. `CosmosCoinConfig` is now typed as
  `CurrencyConfig & { denom: string }` instead of reusing the live-config map type.

  Breaking: `CosmosAPI.getCurrency()` is removed. `CosmosAPI.getAccountInfo`, `getAllBalances`,
  `getDelegations`, `getStakingPositions` and `getRedelegationsWithQueued` take a denom string instead
  of a `CryptoCurrency`. `getBalance`, `getStakes`, `listOperations` and `craftTransaction` take the
  coin config as first parameter; `estimateFees` takes `(config, currencyId, intent)`; and
  `getRedelegations` takes `(currencyId, denom, address)`.

### Minor Changes

- [#23386](https://github.com/LedgerHQ/ledger-live/pull/23386) [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574) Thanks [@dilaouid](https://github.com/dilaouid)! - Remove the Zenrock and Quicksilver integrations, including their chain adapters, currency definitions, feature flags and LCD endpoints

- [#23254](https://github.com/LedgerHQ/ledger-live/pull/23254) [`ff14496`](https://github.com/LedgerHQ/ledger-live/commit/ff14496257201991b52f0dd140e351fca3e84d4d) Thanks [@dilaouid](https://github.com/dilaouid)! - Migrate persisted Cosmos accounts from legacy cosmosResources to staking resources

### Patch Changes

- Updated dependencies [[`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97)]:
  - @ledgerhq/ledger-wallet-framework@3.8.0-next.0
  - @ledgerhq/types-live@6.128.0-next.0

## 1.6.0

### Minor Changes

- [#22413](https://github.com/LedgerHQ/ledger-live/pull/22413) [`0f401bb`](https://github.com/LedgerHQ/ledger-live/commit/0f401bb6289b6e78fbd05b6f98977bde4999d22a) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): move the Cosmos memo onto the shared generic-adapter memo fields (LIVE-36108)

  Prep work for the Cosmos generic-coin-framework migration (depends on LIVE-35735, already fixed):
  the shared `transactionToIntent` only reads `memoType`/`memoValue`, fields the four Cosmos memo
  write sites (desktop send field, mobile memo-tag input, mobile edit-memo screen, wallet-api
  adapter) never set — they only wrote the legacy `memo` field. Left as is, flipping Cosmos into
  `genericCoinFrameworkFamilies.json` in a later ticket would silently drop every memo, with no
  error anywhere.

  Adds a `cosmos` entry to the shared memo-application registry, adds `memoType`/`memoValue` to
  `CosmosLikeTransaction` alongside the existing `memo` field (read unchanged by the live legacy
  bridge), and centralizes the three-field patch in a single `cosmosMemoPatch` helper all four
  write sites now call, so they can't drift out of sync. Also adds the memo length check
  (`CosmosMemoTooLong`) to the Alpaca `validateIntent`, which nothing previously enforced outside
  the UI's `maxLength` truncation.

- [#22620](https://github.com/LedgerHQ/ledger-live/pull/22620) [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5) Thanks [@henri-ly](https://github.com/henri-ly)! - Keep WalletConnect `cosmos_signAmino` working on the generic bridge: `BridgeApi.signRawOperation` lets a family replace the generic raw signing (craft, sign, combine) with its own. Cosmos registers its verbatim, detached-signature implementation there, the one its legacy bridge already uses. `account.getPublicKey` now returns the Cosmos account public key instead of the address legacy accounts keep in `xpub`.

- [#22593](https://github.com/LedgerHQ/ledger-live/pull/22593) [`0a65851`](https://github.com/LedgerHQ/ledger-live/commit/0a65851ea6de6228030a2c94f0cad2234903db2b) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - chore(llc): Backfill the now-mandatory `name`/`unit` fields

- [#22677](https://github.com/LedgerHQ/ledger-live/pull/22677) [`77d202b`](https://github.com/LedgerHQ/ledger-live/commit/77d202b1930715ed30b62521fbc5692969b6ec47) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Pass values the NEAR, Cosmos and Filecoin SDK types accept

- [#22059](https://github.com/LedgerHQ/ledger-live/pull/22059) [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): Migrate the desktop staking UI onto the generic path

- [#22352](https://github.com/LedgerHQ/ledger-live/pull/22352) [`99b54cd`](https://github.com/LedgerHQ/ledger-live/commit/99b54cdac46807286d75caa1a94e61a37606c18f) Thanks [@ishaba](https://github.com/ishaba)! - feat(babylon): enable delegation by default instead of gating it behind disableDelegation

- [#22775](https://github.com/LedgerHQ/ledger-live/pull/22775) [`3cdcba9`](https://github.com/LedgerHQ/ledger-live/commit/3cdcba9252780b413452cb100682cf08041d966e) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(coin-cosmos): surface validator bond status

### Patch Changes

- Updated dependencies [[`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0
  - @ledgerhq/types-live@6.127.0

## 1.6.0-next.1

### Patch Changes

- Updated dependencies [[`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.1

## 1.6.0-next.0

### Minor Changes

- [#22413](https://github.com/LedgerHQ/ledger-live/pull/22413) [`0f401bb`](https://github.com/LedgerHQ/ledger-live/commit/0f401bb6289b6e78fbd05b6f98977bde4999d22a) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): move the Cosmos memo onto the shared generic-adapter memo fields (LIVE-36108)

  Prep work for the Cosmos generic-coin-framework migration (depends on LIVE-35735, already fixed):
  the shared `transactionToIntent` only reads `memoType`/`memoValue`, fields the four Cosmos memo
  write sites (desktop send field, mobile memo-tag input, mobile edit-memo screen, wallet-api
  adapter) never set — they only wrote the legacy `memo` field. Left as is, flipping Cosmos into
  `genericCoinFrameworkFamilies.json` in a later ticket would silently drop every memo, with no
  error anywhere.

  Adds a `cosmos` entry to the shared memo-application registry, adds `memoType`/`memoValue` to
  `CosmosLikeTransaction` alongside the existing `memo` field (read unchanged by the live legacy
  bridge), and centralizes the three-field patch in a single `cosmosMemoPatch` helper all four
  write sites now call, so they can't drift out of sync. Also adds the memo length check
  (`CosmosMemoTooLong`) to the Alpaca `validateIntent`, which nothing previously enforced outside
  the UI's `maxLength` truncation.

- [#22620](https://github.com/LedgerHQ/ledger-live/pull/22620) [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5) Thanks [@henri-ly](https://github.com/henri-ly)! - Keep WalletConnect `cosmos_signAmino` working on the generic bridge: `BridgeApi.signRawOperation` lets a family replace the generic raw signing (craft, sign, combine) with its own. Cosmos registers its verbatim, detached-signature implementation there, the one its legacy bridge already uses. `account.getPublicKey` now returns the Cosmos account public key instead of the address legacy accounts keep in `xpub`.

- [#22593](https://github.com/LedgerHQ/ledger-live/pull/22593) [`0a65851`](https://github.com/LedgerHQ/ledger-live/commit/0a65851ea6de6228030a2c94f0cad2234903db2b) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - chore(llc): Backfill the now-mandatory `name`/`unit` fields

- [#22677](https://github.com/LedgerHQ/ledger-live/pull/22677) [`77d202b`](https://github.com/LedgerHQ/ledger-live/commit/77d202b1930715ed30b62521fbc5692969b6ec47) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Pass values the NEAR, Cosmos and Filecoin SDK types accept

- [#22059](https://github.com/LedgerHQ/ledger-live/pull/22059) [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): Migrate the desktop staking UI onto the generic path

- [#22352](https://github.com/LedgerHQ/ledger-live/pull/22352) [`99b54cd`](https://github.com/LedgerHQ/ledger-live/commit/99b54cdac46807286d75caa1a94e61a37606c18f) Thanks [@ishaba](https://github.com/ishaba)! - feat(babylon): enable delegation by default instead of gating it behind disableDelegation

- [#22775](https://github.com/LedgerHQ/ledger-live/pull/22775) [`3cdcba9`](https://github.com/LedgerHQ/ledger-live/commit/3cdcba9252780b413452cb100682cf08041d966e) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(coin-cosmos): surface validator bond status

### Patch Changes

- Updated dependencies [[`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.0
  - @ledgerhq/types-live@6.127.0-next.0

## 1.5.0

### Minor Changes

- [#22558](https://github.com/LedgerHQ/ledger-live/pull/22558) [`e046686`](https://github.com/LedgerHQ/ledger-live/commit/e046686befa308188170ac9950eae394863c76a5) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(cosmos): staking validation rule in the generic path

- [#21953](https://github.com/LedgerHQ/ledger-live/pull/21953) [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/live-config`, `@ledgerhq/live-env`, `@ledgerhq/live-currency-format`,
  `@ledgerhq/domain-service` and `@ledgerhq/evm-tools` from npm instead of the workspace — they
  now live in the `ts-libs` repository. No API change.

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d)]:
  - @ledgerhq/types-live@6.126.0
  - @ledgerhq/ledger-wallet-framework@3.6.0

## 1.5.0-next.0

### Minor Changes

- [#22558](https://github.com/LedgerHQ/ledger-live/pull/22558) [`e046686`](https://github.com/LedgerHQ/ledger-live/commit/e046686befa308188170ac9950eae394863c76a5) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(cosmos): staking validation rule in the generic path

- [#21953](https://github.com/LedgerHQ/ledger-live/pull/21953) [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/live-config`, `@ledgerhq/live-env`, `@ledgerhq/live-currency-format`,
  `@ledgerhq/domain-service` and `@ledgerhq/evm-tools` from npm instead of the workspace — they
  now live in the `ts-libs` repository. No API change.

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d)]:
  - @ledgerhq/types-live@6.126.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.6.0-next.0

## 1.4.0

### Minor Changes

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

- [#22208](https://github.com/LedgerHQ/ledger-live/pull/22208) [`62a6f6c`](https://github.com/LedgerHQ/ledger-live/commit/62a6f6c516180411942c54ef686219387c41fb95) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - feat(coin-cosmos): add the Gonka currency configuration

  Points Gonka at the Ledger-hosted LCD, sets its minimum gas price to 0 (the chain's fee
  consensus parameter), and disables delegation, which the runtime rejects. Hides the account-header
  stake action on Desktop and Mobile for any Cosmos chain whose config sets `disableDelegation`, and
  stops a zero minimum gas price being mistaken for a missing config when preloaded data is restored.

- [#21841](https://github.com/LedgerHQ/ledger-live/pull/21841) [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): migrate account resources to shared staking aggregate

- [#22069](https://github.com/LedgerHQ/ledger-live/pull/22069) [`bb3e182`](https://github.com/LedgerHQ/ledger-live/commit/bb3e1822bfc2cb9ff00089082782d9e2bd229b67) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(coin-cosmos): Add the Cosmos CoinFrameworkSigner adapter so the generic account bridge can construct, receive, and sign without extra device address confirmation

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @ledgerhq/ledger-wallet-framework@3.5.0
  - @ledgerhq/types-live@6.125.0
  - @ledgerhq/live-env@4.1.0

## 1.4.0-next.0

### Minor Changes

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

- [#22208](https://github.com/LedgerHQ/ledger-live/pull/22208) [`62a6f6c`](https://github.com/LedgerHQ/ledger-live/commit/62a6f6c516180411942c54ef686219387c41fb95) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - feat(coin-cosmos): add the Gonka currency configuration

  Points Gonka at the Ledger-hosted LCD, sets its minimum gas price to 0 (the chain's fee
  consensus parameter), and disables delegation, which the runtime rejects. Hides the account-header
  stake action on Desktop and Mobile for any Cosmos chain whose config sets `disableDelegation`, and
  stops a zero minimum gas price being mistaken for a missing config when preloaded data is restored.

- [#21841](https://github.com/LedgerHQ/ledger-live/pull/21841) [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): migrate account resources to shared staking aggregate

- [#22069](https://github.com/LedgerHQ/ledger-live/pull/22069) [`bb3e182`](https://github.com/LedgerHQ/ledger-live/commit/bb3e1822bfc2cb9ff00089082782d9e2bd229b67) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(coin-cosmos): Add the Cosmos CoinFrameworkSigner adapter so the generic account bridge can construct, receive, and sign without extra device address confirmation

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @ledgerhq/ledger-wallet-framework@3.5.0-next.0
  - @ledgerhq/types-live@6.125.0-next.0
  - @ledgerhq/live-env@4.1.0-next.0

## 1.3.0

### Minor Changes

- [#21924](https://github.com/LedgerHQ/ledger-live/pull/21924) [`cdb273b`](https://github.com/LedgerHQ/ledger-live/commit/cdb273b068df78cd5a0dbd4281fb79f22e0a7506) Thanks [@qperrot](https://github.com/qperrot)! - Fix account view crash when cosmos `cosmosResources` is undefined by handling missing resources gracefully in the delegation hook and account UI components

- [#20869](https://github.com/LedgerHQ/ledger-live/pull/20869) [`54fce77`](https://github.com/LedgerHQ/ledger-live/commit/54fce77bfa46c3d42d3e39b80804258a91d910f2) Thanks [@henri-ly](https://github.com/henri-ly)! - Stop discarding a cosmos transaction history when one page of it fails.

  `CosmosAPI.fetchAllTransactions` pages until the accumulated tx count reaches the response's `total`. Any page that failed propagated to the surrounding catch, which returned an empty array — so a single bad page reported the account as having no history at all. Two causes are live on mainnet today: a page past the last one, when a node serves fewer transactions than its `total` counts (`failed to search for txs: page should be within [1, N] range`), and a transaction the node can no longer decode (`unable to resolve type URL /tendermint.liquidity.v1beta1.MsgDepositWithinBatch: tx parse error`, permanent on cosmoshub for accounts holding pre-removal liquidity-module txs). Both are answered as HTTP 500 and retried twice by the network layer. A failing page now ends the walk and keeps the pages already fetched.

  Also in `fetchTransactions`: an empty result serialized as `null` instead of `[]` is read as an empty list, and `total` is coerced to a number — the endpoint returns the uint64 as a string, while the declared type said `number`.

  The loop also stops on an empty page. It only advances on the transactions it receives, so a node that answers 200 with an empty page while still counting more in `total` — rather than the 500 above — never reached the exit condition and paged that node indefinitely.

- [#21719](https://github.com/LedgerHQ/ledger-live/pull/21719) [`bb2f03e`](https://github.com/LedgerHQ/ledger-live/commit/bb2f03e41b96b8f95f239acea75428657cdd64fe) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - fix(cosmos): add the gonka chain and always send the HRP to the signer

  Adds the Gonka chain to the Cosmos coin module's chain factory. Fixes the Cosmos
  signer to send the chain's address prefix to the device on every coin type
  instead of only coin type 60 — the gate was safe while 118 was the only other
  option, but a chain on any other coin type (Gonka is on 1200) could not sign
  through the DMK signer. Chains whose device app is not app-cosmos opt out via
  the new `signWithPrefix` chain parameter: `crypto_org` and `crypto_org_croeseid`
  run the separate "Cronos POS Chain" app on coin type 394 and keep omitting the
  field, so no shipping chain's sign APDU changes. Renames `CosmosSigner.sign`'s
  third parameter from `transactionType` to `hrp`, matching what it actually
  carries. Also treats a zero fee as loaded rather than missing on the send path,
  so a zero-fee chain can send a transaction and use its full spendable balance.

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/types-live@6.124.0
  - @ledgerhq/ledger-wallet-framework@3.4.0

## 1.3.0-next.0

### Minor Changes

- [#21924](https://github.com/LedgerHQ/ledger-live/pull/21924) [`cdb273b`](https://github.com/LedgerHQ/ledger-live/commit/cdb273b068df78cd5a0dbd4281fb79f22e0a7506) Thanks [@qperrot](https://github.com/qperrot)! - Fix account view crash when cosmos `cosmosResources` is undefined by handling missing resources gracefully in the delegation hook and account UI components

- [#20869](https://github.com/LedgerHQ/ledger-live/pull/20869) [`54fce77`](https://github.com/LedgerHQ/ledger-live/commit/54fce77bfa46c3d42d3e39b80804258a91d910f2) Thanks [@henri-ly](https://github.com/henri-ly)! - Stop discarding a cosmos transaction history when one page of it fails.

  `CosmosAPI.fetchAllTransactions` pages until the accumulated tx count reaches the response's `total`. Any page that failed propagated to the surrounding catch, which returned an empty array — so a single bad page reported the account as having no history at all. Two causes are live on mainnet today: a page past the last one, when a node serves fewer transactions than its `total` counts (`failed to search for txs: page should be within [1, N] range`), and a transaction the node can no longer decode (`unable to resolve type URL /tendermint.liquidity.v1beta1.MsgDepositWithinBatch: tx parse error`, permanent on cosmoshub for accounts holding pre-removal liquidity-module txs). Both are answered as HTTP 500 and retried twice by the network layer. A failing page now ends the walk and keeps the pages already fetched.

  Also in `fetchTransactions`: an empty result serialized as `null` instead of `[]` is read as an empty list, and `total` is coerced to a number — the endpoint returns the uint64 as a string, while the declared type said `number`.

  The loop also stops on an empty page. It only advances on the transactions it receives, so a node that answers 200 with an empty page while still counting more in `total` — rather than the 500 above — never reached the exit condition and paged that node indefinitely.

- [#21719](https://github.com/LedgerHQ/ledger-live/pull/21719) [`bb2f03e`](https://github.com/LedgerHQ/ledger-live/commit/bb2f03e41b96b8f95f239acea75428657cdd64fe) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - fix(cosmos): add the gonka chain and always send the HRP to the signer

  Adds the Gonka chain to the Cosmos coin module's chain factory. Fixes the Cosmos
  signer to send the chain's address prefix to the device on every coin type
  instead of only coin type 60 — the gate was safe while 118 was the only other
  option, but a chain on any other coin type (Gonka is on 1200) could not sign
  through the DMK signer. Chains whose device app is not app-cosmos opt out via
  the new `signWithPrefix` chain parameter: `crypto_org` and `crypto_org_croeseid`
  run the separate "Cronos POS Chain" app on coin type 394 and keep omitting the
  field, so no shipping chain's sign APDU changes. Renames `CosmosSigner.sign`'s
  third parameter from `transactionType` to `hrp`, matching what it actually
  carries. Also treats a zero fee as loaded rather than missing on the send path,
  so a zero-fee chain can send a transaction and use its full spendable balance.

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/types-live@6.124.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.4.0-next.0

## 1.2.0

### Minor Changes

- [#21572](https://github.com/LedgerHQ/ledger-live/pull/21572) [`147a290`](https://github.com/LedgerHQ/ledger-live/commit/147a2905d735eee5682d849b3e2c2cde5178f7bb) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): carry operation extras through the familyExtra slot

- [#21380](https://github.com/LedgerHQ/ledger-live/pull/21380) [`59ea8fb`](https://github.com/LedgerHQ/ledger-live/commit/59ea8fbd36754199f1c68ab53537460ca31c70b4) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(cosmos): remove Ledger validator as the default one for Osmosis

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @ledgerhq/types-live@6.123.0
  - @ledgerhq/ledger-wallet-framework@3.3.0
  - @ledgerhq/live-env@4.0.0

## 1.2.0-next.0

### Minor Changes

- [#21572](https://github.com/LedgerHQ/ledger-live/pull/21572) [`147a290`](https://github.com/LedgerHQ/ledger-live/commit/147a2905d735eee5682d849b3e2c2cde5178f7bb) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): carry operation extras through the familyExtra slot

- [#21380](https://github.com/LedgerHQ/ledger-live/pull/21380) [`59ea8fb`](https://github.com/LedgerHQ/ledger-live/commit/59ea8fbd36754199f1c68ab53537460ca31c70b4) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(cosmos): remove Ledger validator as the default one for Osmosis

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @ledgerhq/types-live@6.123.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.3.0-next.0
  - @ledgerhq/live-env@4.0.0-next.0

## 1.1.0

### Minor Changes

- [#21168](https://github.com/LedgerHQ/ledger-live/pull/21168) [`beaaa31`](https://github.com/LedgerHQ/ledger-live/commit/beaaa315b5c4d4ccea8145f3a309ba557f961118) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

  `createApi` no longer declares `CoinModuleApi` as its return type: it returns the object it actually
  builds, checked with `satisfies CoinModuleImpl<CosmosCoinConfig, StringMemo | MemoNotSupported>`. Six
  capability methods that only threw are omitted instead of stubbed — `call`, `register`,
  `craftRawTransaction`, `getRewards`, `getBlock` and `getBlockInfo`. Staking is the notable case: it is
  published à la carte, so `getStakes` and `getValidators` remain real implementations and only the
  reward-distribution listing goes away — the accrued amount stays available through `getStakes`.
  Likewise `lastBlock` is implemented; only the per-height block lookups are absent. `getNextSequence`
  is a real implementation here and is untouched.

  Consumers see no behavioural change: the resolver applies the framework's `withDefaults`, which
  backfills each omitted method with the same `"<name> is not supported"` throw. `supports()` on the
  wrapped api now reports these capabilities as absent, which the stubs previously masked.

  The authored type also keeps the contract's trailing optional parameter, or a caller reaching the module through it could no longer pass it: `broadcast` accepts and ignores its own. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.

  The api test asserts the whole capability surface with the framework's `capabilityReport()` rather than one test per unimplemented capability: one expectation covers that each is absent, that reaching it raises `"<name> is not supported"`, and that `supports()` agrees. Being an exact comparison it is exhaustive, so implementing or dropping a capability changes the list instead of leaving a test that passes while covering less.

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/types-live@6.122.0
  - @ledgerhq/ledger-wallet-framework@3.2.0
  - @ledgerhq/live-env@3.2.0

## 1.1.0-next.0

### Minor Changes

- [#21168](https://github.com/LedgerHQ/ledger-live/pull/21168) [`beaaa31`](https://github.com/LedgerHQ/ledger-live/commit/beaaa315b5c4d4ccea8145f3a309ba557f961118) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

  `createApi` no longer declares `CoinModuleApi` as its return type: it returns the object it actually
  builds, checked with `satisfies CoinModuleImpl<CosmosCoinConfig, StringMemo | MemoNotSupported>`. Six
  capability methods that only threw are omitted instead of stubbed — `call`, `register`,
  `craftRawTransaction`, `getRewards`, `getBlock` and `getBlockInfo`. Staking is the notable case: it is
  published à la carte, so `getStakes` and `getValidators` remain real implementations and only the
  reward-distribution listing goes away — the accrued amount stays available through `getStakes`.
  Likewise `lastBlock` is implemented; only the per-height block lookups are absent. `getNextSequence`
  is a real implementation here and is untouched.

  Consumers see no behavioural change: the resolver applies the framework's `withDefaults`, which
  backfills each omitted method with the same `"<name> is not supported"` throw. `supports()` on the
  wrapped api now reports these capabilities as absent, which the stubs previously masked.

  The authored type also keeps the contract's trailing optional parameter, or a caller reaching the module through it could no longer pass it: `broadcast` accepts and ignores its own. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.

  The api test asserts the whole capability surface with the framework's `capabilityReport()` rather than one test per unimplemented capability: one expectation covers that each is absent, that reaching it raises `"<name> is not supported"`, and that `supports()` agrees. Being an exact comparison it is exhaustive, so implementing or dropping a capability changes the list instead of leaving a test that passes while covering less.

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/types-live@6.122.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.2.0-next.0
  - @ledgerhq/live-env@3.2.0-next.0

## 1.0.1

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/types-live@6.121.0
  - @ledgerhq/ledger-wallet-framework@3.1.0
  - @ledgerhq/live-env@3.1.0

## 1.0.1-next.0

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/types-live@6.121.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.1.0-next.0
  - @ledgerhq/live-env@3.1.0-next.0

## 1.0.0

### Major Changes

- [#20752](https://github.com/LedgerHQ/ledger-live/pull/20752) [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update combine to accept string[] per ADR-047

### Minor Changes

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20786](https://github.com/LedgerHQ/ledger-live/pull/20786) [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Add unsupported `register` to CoinModuleApi implementations (ADR-046)

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/types-live@6.120.0
  - @ledgerhq/ledger-wallet-framework@3.0.0

## 1.0.0-next.1

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8)]:
  - @ledgerhq/types-live@6.120.0-next.1
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.1

## 1.0.0-next.0

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
