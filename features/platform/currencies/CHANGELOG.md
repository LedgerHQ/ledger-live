# @features/platform-currencies

## 0.11.0-next.0

### Minor Changes

- [#23612](https://github.com/LedgerHQ/ledger-live/pull/23612) [`6ea25da`](https://github.com/LedgerHQ/ledger-live/commit/6ea25da0c6060df6aa5056eceacaeedf3d76d2ba) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - The account sync hash is now the CAL token list hash of the account's network (`token_list_hash` from `/v1/networks`, new `getTokenListHash` endpoint) instead of the `X-Ledger-Commit` header. The commit header changed on every CAL deployment, so an update to any chain's tokens made every account of every network resync from scratch. A network the CAL lists no token for gets a fixed `no-tokens` hash.

  The token cache is still validated against the commit (`getTokensSyncHash` endpoint), so a metadata-only token correction still evicts it.

  Stored sync hashes were built from the commit, so each account resyncs from scratch once after this update.

### Patch Changes

- Updated dependencies [[`e3e0f3a`](https://github.com/LedgerHQ/ledger-live/commit/e3e0f3a5fefbdcf08c8c16d7dc2a3d9f6a6922e0), [`08730f5`](https://github.com/LedgerHQ/ledger-live/commit/08730f575a9ec7d9887f9b64ebf492a6d44ac6e8), [`3a1e006`](https://github.com/LedgerHQ/ledger-live/commit/3a1e0066dfdeaa93e5b087396ee84100a607098a), [`5e2a324`](https://github.com/LedgerHQ/ledger-live/commit/5e2a3245cc163b6cc13ef5fd2b7faa85c84ca153), [`dbaf56d`](https://github.com/LedgerHQ/ledger-live/commit/dbaf56ddb47f5a43221feba193700cf40f4a46df), [`6ea25da`](https://github.com/LedgerHQ/ledger-live/commit/6ea25da0c6060df6aa5056eceacaeedf3d76d2ba), [`ffd02a9`](https://github.com/LedgerHQ/ledger-live/commit/ffd02a95c452560d606ad30588f15ff5d2182763), [`0953772`](https://github.com/LedgerHQ/ledger-live/commit/0953772eafec52773cf7a19c08295c72a2e296a2)]:
  - @domain/entity-currency-crypto@0.17.0-next.0
  - @domain/api-currency-token@0.7.0-next.0
  - @shared/api-services@0.11.0-next.0
  - @features/platform-feature-flags@0.10.0-next.0
  - @domain/entity-currency-token@0.5.7-next.0

## 0.10.0

### Minor Changes

- [#23442](https://github.com/LedgerHQ/ledger-live/pull/23442) [`b79ccab`](https://github.com/LedgerHQ/ledger-live/commit/b79ccab839cc7916ff3ecd910479904f87a6e59d) Thanks [@semeano](https://github.com/semeano)! - Register the alpen_testnet EVM currency behind the currencyAlpenTestnet feature flag, disabled by default

- [#23386](https://github.com/LedgerHQ/ledger-live/pull/23386) [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574) Thanks [@dilaouid](https://github.com/dilaouid)! - Remove the Zenrock and Quicksilver integrations, including their chain adapters, currency definitions, feature flags and LCD endpoints

- [#23331](https://github.com/LedgerHQ/ledger-live/pull/23331) [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - remove velas_evm and its feature flag

### Patch Changes

- Updated dependencies [[`d6ab47c`](https://github.com/LedgerHQ/ledger-live/commit/d6ab47c28339866ad88ef0deba75d314c2f6c4f0), [`393a02a`](https://github.com/LedgerHQ/ledger-live/commit/393a02a42be9f0410b75c0c34203915bcde27e43), [`7da1ea9`](https://github.com/LedgerHQ/ledger-live/commit/7da1ea9534a1bdde063e31545363a27f0fdf5abb), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac), [`37a49df`](https://github.com/LedgerHQ/ledger-live/commit/37a49df18649912157d8f269c3b4153d54b7817e)]:
  - @domain/entity-currency-crypto@0.16.0
  - @features/platform-feature-flags@0.9.1
  - @domain/api-currency-token@0.6.5
  - @domain/entity-currency-token@0.5.6
  - @shared/api-services@0.10.1

## 0.10.0-next.0

### Minor Changes

- [#23442](https://github.com/LedgerHQ/ledger-live/pull/23442) [`b79ccab`](https://github.com/LedgerHQ/ledger-live/commit/b79ccab839cc7916ff3ecd910479904f87a6e59d) Thanks [@semeano](https://github.com/semeano)! - Register the alpen_testnet EVM currency behind the currencyAlpenTestnet feature flag, disabled by default

- [#23386](https://github.com/LedgerHQ/ledger-live/pull/23386) [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574) Thanks [@dilaouid](https://github.com/dilaouid)! - Remove the Zenrock and Quicksilver integrations, including their chain adapters, currency definitions, feature flags and LCD endpoints

- [#23331](https://github.com/LedgerHQ/ledger-live/pull/23331) [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - remove velas_evm and its feature flag

### Patch Changes

- Updated dependencies [[`d6ab47c`](https://github.com/LedgerHQ/ledger-live/commit/d6ab47c28339866ad88ef0deba75d314c2f6c4f0), [`393a02a`](https://github.com/LedgerHQ/ledger-live/commit/393a02a42be9f0410b75c0c34203915bcde27e43), [`7da1ea9`](https://github.com/LedgerHQ/ledger-live/commit/7da1ea9534a1bdde063e31545363a27f0fdf5abb), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac), [`37a49df`](https://github.com/LedgerHQ/ledger-live/commit/37a49df18649912157d8f269c3b4153d54b7817e)]:
  - @domain/entity-currency-crypto@0.16.0-next.0
  - @features/platform-feature-flags@0.9.1-next.0
  - @domain/api-currency-token@0.6.5-next.0
  - @domain/entity-currency-token@0.5.6-next.0
  - @shared/api-services@0.10.1-next.0

## 0.9.2

### Patch Changes

- Updated dependencies [[`87de6a7`](https://github.com/LedgerHQ/ledger-live/commit/87de6a72f75df73aab99da6c420de00004bf7692), [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c), [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9)]:
  - @domain/entity-currency-crypto@0.15.0
  - @shared/api-services@0.10.0
  - @features/platform-feature-flags@0.9.0
  - @domain/api-currency-token@0.6.4
  - @domain/entity-currency-token@0.5.5

## 0.9.2-next.0

### Patch Changes

- Updated dependencies [[`87de6a7`](https://github.com/LedgerHQ/ledger-live/commit/87de6a72f75df73aab99da6c420de00004bf7692), [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c), [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9)]:
  - @domain/entity-currency-crypto@0.15.0-next.0
  - @shared/api-services@0.10.0-next.0
  - @features/platform-feature-flags@0.9.0-next.0
  - @domain/api-currency-token@0.6.4-next.0
  - @domain/entity-currency-token@0.5.5-next.0

## 0.9.1

### Patch Changes

- Updated dependencies [[`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`0e98a58`](https://github.com/LedgerHQ/ledger-live/commit/0e98a58c4f313f55c088be010a360c6d85ea7d43)]:
  - @domain/entity-currency-crypto@0.14.0
  - @shared/api-services@0.9.0
  - @features/platform-feature-flags@0.8.1
  - @domain/api-currency-token@0.6.3
  - @domain/entity-currency-token@0.5.4

## 0.9.1-next.1

### Patch Changes

- Updated dependencies []:
  - @features/platform-feature-flags@0.8.1-next.1

## 0.9.1-next.0

### Patch Changes

- Updated dependencies [[`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`0e98a58`](https://github.com/LedgerHQ/ledger-live/commit/0e98a58c4f313f55c088be010a360c6d85ea7d43)]:
  - @domain/entity-currency-crypto@0.14.0-next.0
  - @shared/api-services@0.9.0-next.0
  - @features/platform-feature-flags@0.8.1-next.0
  - @domain/api-currency-token@0.6.3-next.0
  - @domain/entity-currency-token@0.5.4-next.0

## 0.9.0

### Minor Changes

- [#22068](https://github.com/LedgerHQ/ledger-live/pull/22068) [`91531f2`](https://github.com/LedgerHQ/ledger-live/commit/91531f29e71e4e186375a5e2908ddca0c351c0ac) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Carry each card wallet's Ledger currency, so the app can price it.

  - `useCurrenciesByIds` resolves a list of Ledger ids to currencies: coins from the crypto registry, tokens from CAL. The lookups are dispatched rather than hooked, so the list can be any length.
  - A card wallet now carries `ledgerCurrency` instead of a counter value. Converting needs the app's rates, so it happens in platform code.
  - `BAANX_LEDGER_CURRENCY_IDS` lists every Ledger id the card catalog resolves to.
  - The Pay card devtool shows `ledgerCurrencyId` per joined wallet.

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce), [`98e3038`](https://github.com/LedgerHQ/ledger-live/commit/98e303872684da47feca343c0db7d83fcce857b2), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629)]:
  - @shared/api-services@0.8.0
  - @domain/entity-currency-crypto@0.13.0
  - @features/platform-feature-flags@0.8.0
  - @domain/api-currency-token@0.6.2
  - @domain/entity-currency-token@0.5.3

## 0.9.0-next.0

### Minor Changes

- [#22068](https://github.com/LedgerHQ/ledger-live/pull/22068) [`91531f2`](https://github.com/LedgerHQ/ledger-live/commit/91531f29e71e4e186375a5e2908ddca0c351c0ac) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Carry each card wallet's Ledger currency, so the app can price it.

  - `useCurrenciesByIds` resolves a list of Ledger ids to currencies: coins from the crypto registry, tokens from CAL. The lookups are dispatched rather than hooked, so the list can be any length.
  - A card wallet now carries `ledgerCurrency` instead of a counter value. Converting needs the app's rates, so it happens in platform code.
  - `BAANX_LEDGER_CURRENCY_IDS` lists every Ledger id the card catalog resolves to.
  - The Pay card devtool shows `ledgerCurrencyId` per joined wallet.

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce), [`98e3038`](https://github.com/LedgerHQ/ledger-live/commit/98e303872684da47feca343c0db7d83fcce857b2), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629)]:
  - @shared/api-services@0.8.0-next.0
  - @domain/entity-currency-crypto@0.13.0-next.0
  - @features/platform-feature-flags@0.8.0-next.0
  - @domain/api-currency-token@0.6.2-next.0
  - @domain/entity-currency-token@0.5.3-next.0

## 0.8.1

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`600d432`](https://github.com/LedgerHQ/ledger-live/commit/600d432657f1c9adf80af6730dd28f2177e05c5a), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb)]:
  - @features/platform-feature-flags@0.7.0
  - @shared/api-services@0.7.0

## 0.8.1-next.0

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`600d432`](https://github.com/LedgerHQ/ledger-live/commit/600d432657f1c9adf80af6730dd28f2177e05c5a), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb)]:
  - @features/platform-feature-flags@0.7.0-next.0
  - @shared/api-services@0.7.0

## 0.8.0

### Minor Changes

- [#21396](https://github.com/LedgerHQ/ledger-live/pull/21396) [`ebb1371`](https://github.com/LedgerHQ/ledger-live/commit/ebb13714a6de9c39f290b2ccd51ca78370824f6f) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Add the Gonka (GNK) currency feature flag, disabled by default

### Patch Changes

- Updated dependencies [[`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44), [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`a9e389f`](https://github.com/LedgerHQ/ledger-live/commit/a9e389fc59ca30abf53d0ba8decc6290752ba1db), [`d60ce38`](https://github.com/LedgerHQ/ledger-live/commit/d60ce38581fe06b7f4fa72ba40259af2eabfe11f), [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a)]:
  - @shared/api-services@0.7.0
  - @domain/entity-currency-crypto@0.12.0
  - @domain/api-currency-token@0.6.1
  - @features/platform-feature-flags@0.6.9
  - @domain/entity-currency-token@0.5.2

## 0.8.0-next.1

### Patch Changes

- Updated dependencies []:
  - @features/platform-feature-flags@0.6.9-next.1

## 0.8.0-next.0

### Minor Changes

- [#21396](https://github.com/LedgerHQ/ledger-live/pull/21396) [`ebb1371`](https://github.com/LedgerHQ/ledger-live/commit/ebb13714a6de9c39f290b2ccd51ca78370824f6f) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Add the Gonka (GNK) currency feature flag, disabled by default

### Patch Changes

- Updated dependencies [[`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44), [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`a9e389f`](https://github.com/LedgerHQ/ledger-live/commit/a9e389fc59ca30abf53d0ba8decc6290752ba1db), [`d60ce38`](https://github.com/LedgerHQ/ledger-live/commit/d60ce38581fe06b7f4fa72ba40259af2eabfe11f), [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a)]:
  - @shared/api-services@0.7.0-next.0
  - @domain/entity-currency-crypto@0.12.0-next.0
  - @domain/api-currency-token@0.6.1-next.0
  - @domain/entity-currency-token@0.5.2-next.0
  - @features/platform-feature-flags@0.6.9-next.0

## 0.7.0

### Minor Changes

- [#21349](https://github.com/LedgerHQ/ledger-live/pull/21349) [`0df32c7`](https://github.com/LedgerHQ/ledger-live/commit/0df32c7f80d190522285002bfa6bffa0539f5b23) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(domain): add resilience to `null` and `undefined` responses from CAL

### Patch Changes

- Updated dependencies [[`e6d6ed6`](https://github.com/LedgerHQ/ledger-live/commit/e6d6ed6eda460eb614680b31a42ba8067cc28d2a), [`ce47443`](https://github.com/LedgerHQ/ledger-live/commit/ce47443e97f559210443547a7948ef61c01f7feb), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`0df32c7`](https://github.com/LedgerHQ/ledger-live/commit/0df32c7f80d190522285002bfa6bffa0539f5b23)]:
  - @domain/entity-currency-crypto@0.11.0
  - @shared/api-services@0.6.0
  - @domain/api-currency-token@0.6.0
  - @domain/entity-currency-token@0.5.1
  - @features/platform-feature-flags@0.6.8

## 0.7.0-next.0

### Minor Changes

- [#21349](https://github.com/LedgerHQ/ledger-live/pull/21349) [`0df32c7`](https://github.com/LedgerHQ/ledger-live/commit/0df32c7f80d190522285002bfa6bffa0539f5b23) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(domain): add resilience to `null` and `undefined` responses from CAL

### Patch Changes

- Updated dependencies [[`e6d6ed6`](https://github.com/LedgerHQ/ledger-live/commit/e6d6ed6eda460eb614680b31a42ba8067cc28d2a), [`ce47443`](https://github.com/LedgerHQ/ledger-live/commit/ce47443e97f559210443547a7948ef61c01f7feb), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`0df32c7`](https://github.com/LedgerHQ/ledger-live/commit/0df32c7f80d190522285002bfa6bffa0539f5b23)]:
  - @domain/entity-currency-crypto@0.11.0-next.0
  - @shared/api-services@0.6.0-next.0
  - @domain/api-currency-token@0.6.0-next.0
  - @domain/entity-currency-token@0.5.1-next.0
  - @features/platform-feature-flags@0.6.8-next.0

## 0.6.2

### Patch Changes

- Updated dependencies [[`f64ceec`](https://github.com/LedgerHQ/ledger-live/commit/f64ceecbdaccec2c56ace4cc459d670db5920b68), [`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1)]:
  - @shared/api-services@0.5.0
  - @domain/api-currency-token@0.5.1
  - @features/platform-feature-flags@0.6.7

## 0.6.2-next.0

### Patch Changes

- Updated dependencies [[`f64ceec`](https://github.com/LedgerHQ/ledger-live/commit/f64ceecbdaccec2c56ace4cc459d670db5920b68), [`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1)]:
  - @shared/api-services@0.5.0-next.0
  - @domain/api-currency-token@0.5.1-next.0
  - @features/platform-feature-flags@0.6.7-next.0

## 0.6.1

### Patch Changes

- Updated dependencies [[`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2)]:
  - @shared/api-services@0.4.0
  - @domain/entity-currency-token@0.5.0
  - @domain/api-currency-token@0.5.0
  - @features/platform-feature-flags@0.6.6

## 0.6.1-next.1

### Patch Changes

- Updated dependencies []:
  - @features/platform-feature-flags@0.6.6-next.1

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
