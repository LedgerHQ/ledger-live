# @ledgerhq/coin-canton

## 4.0.0-next.0

### Major Changes

- [#25610](https://github.com/LedgerHQ/ledger-live/pull/25610) [`cf74268`](https://github.com/LedgerHQ/ledger-live/commit/cf74268e58c112da0f00b5640e7b761bb97b4914) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Read the coin-canton gateway page size, cache TTLs, reserve and gateway switch from `config_currency_canton_network*`, where they are required with their values in `cantonDefaults`; an invalid or missing value throws `CantonInvalidConfigError`. `gatewayUrl` and `nodeId` are required, `nodeUrl` is dropped, and the network functions and caches take the `CantonContext` first.

### Minor Changes

- [#25573](https://github.com/LedgerHQ/ledger-live/pull/25573) [`c1d2f34`](https://github.com/LedgerHQ/ledger-live/commit/c1d2f347303382fd6394a9ae8b3746a962bd207c) Thanks [@amaslakov](https://github.com/amaslakov)! - Offer Send max on Canton: the amount fills with the whole spendable balance, minus the fee for CC

- [#25256](https://github.com/LedgerHQ/ledger-live/pull/25256) [`69913ea`](https://github.com/LedgerHQ/ledger-live/commit/69913ea3e54831b7f6ddf731cd43d2857048e365) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Expose getAccountStatus on the Canton coin module for account discovery

- [#25376](https://github.com/LedgerHQ/ledger-live/pull/25376) [`ae89855`](https://github.com/LedgerHQ/ledger-live/commit/ae898555a9637ca2db1853fe34eadfade620b03c) Thanks [@amaslakov](https://github.com/amaslakov)! - Reduce repeated Canton history scans and record received offers that sync held back once they settle

- [#25626](https://github.com/LedgerHQ/ledger-live/pull/25626) [`aec8cf1`](https://github.com/LedgerHQ/ledger-live/commit/aec8cf112d8ab931bc7db1556f200188973d680c) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Fill the coin module API's Canton Send max with the amount and tiered fee the wallet's Send max uses

- [#25079](https://github.com/LedgerHQ/ledger-live/pull/25079) [`3854f2a`](https://github.com/LedgerHQ/ledger-live/commit/3854f2a5178b26b00ec34a347e9f2375892a300d) Thanks [@ishaba](https://github.com/ishaba)! - Exclude locked holdings from the Canton too-many-UTXOs count, as the gateway picks transfer inputs from unlocked holdings only

- [#25550](https://github.com/LedgerHQ/ledger-live/pull/25550) [`c0f52e3`](https://github.com/LedgerHQ/ledger-live/commit/c0f52e3fca89dd0c2d2fb4ecbb2553e69b7e5c9d) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Flag failed operations on bridge sync; shape each pending send as the sync records it and keep it until its hash is synced; block a send whose token account is gone

- [#25619](https://github.com/LedgerHQ/ledger-live/pull/25619) [`2bf8c04`](https://github.com/LedgerHQ/ledger-live/commit/2bf8c041f54e6400150a49e78515e7f14680606c) Thanks [@amaslakov](https://github.com/amaslakov)! - Fill the largest Canton Send max amount the tiered fee allows, and charge the tiered fee's 0.001% on the whole part of any amount above 100,000,000 CC

- [#25078](https://github.com/LedgerHQ/ledger-live/pull/25078) [`440f25f`](https://github.com/LedgerHQ/ledger-live/commit/440f25f86cc2974d80e2c29f823db526dcc5e178) Thanks [@ishaba](https://github.com/ishaba)! - Lower the Canton too-many-UTXOs thresholds to the device signing limit (popup above 8, warning above 6)

### Patch Changes

- Updated dependencies [[`afe8aea`](https://github.com/LedgerHQ/ledger-live/commit/afe8aea94052e7475b17e203028ca7e02e2848e1), [`c1f5e3f`](https://github.com/LedgerHQ/ledger-live/commit/c1f5e3f808ab22c42bd0cbc1125106ff84a6e4c7), [`44c63d1`](https://github.com/LedgerHQ/ledger-live/commit/44c63d1ed48ea109d1d7328553f29cef9cd52653), [`35e9ca8`](https://github.com/LedgerHQ/ledger-live/commit/35e9ca85552282ddc37c47bc4212c81b06a2ee2c), [`866ed62`](https://github.com/LedgerHQ/ledger-live/commit/866ed62f04647abce7efeff0ebefe79c8e5bafde), [`52ba745`](https://github.com/LedgerHQ/ledger-live/commit/52ba7459509dbdaeb551bb24b8bd7965e2f0f252), [`fcd1d97`](https://github.com/LedgerHQ/ledger-live/commit/fcd1d979dcce6f25d9e4dfcf7dd6b68d79b8b03c), [`24ce1e8`](https://github.com/LedgerHQ/ledger-live/commit/24ce1e804772ca1f3bbdf74143effce4e021821d)]:
  - @ledgerhq/ledger-wallet-framework@3.14.0-next.0
  - @ledgerhq/types-live@6.134.0-next.0
  - @ledgerhq/hw-app-canton@0.18.0-next.0

## 3.0.0

### Major Changes

- [#24650](https://github.com/LedgerHQ/ledger-live/pull/24650) [`aeab021`](https://github.com/LedgerHQ/ledger-live/commit/aeab021a770f44f773a482aef4e84d59f1f8ce74) Thanks [@amaslakov](https://github.com/amaslakov)! - Implement `craftTransaction`, `estimateFees` and `broadcast` in the CoinModuleApi. A crafted transaction is now a JSON envelope carrying the party and the payload the device signs, `combine` and `broadcast` take the envelope formats instead of a bare serialized transaction and a party appended to the signature, and `createFrameworkSigner` adapts the device signer to the generic framework.

### Minor Changes

- [#24795](https://github.com/LedgerHQ/ledger-live/pull/24795) [`57fb0bf`](https://github.com/LedgerHQ/ledger-live/commit/57fb0bfb2bbae6f63434c7a5c023244d4d372304) Thanks [@amaslakov](https://github.com/amaslakov)! - Show the too-many-UTXOs warning on token sends, and key the cached topology check and enabled instruments by gateway

- [#24460](https://github.com/LedgerHQ/ledger-live/pull/24460) [`e3d0630`](https://github.com/LedgerHQ/ledger-live/commit/e3d063017d281be326dbca1a4504ee559a9e9f22) Thanks [@amaslakov](https://github.com/amaslakov)! - Implement `lastBlock`, `getBalance` and `listOperations` in the Canton CoinModuleApi

- [#24714](https://github.com/LedgerHQ/ledger-live/pull/24714) [`f82d808`](https://github.com/LedgerHQ/ledger-live/commit/f82d8080480437ccb351d111cabb1e3ee110d63b) Thanks [@amaslakov](https://github.com/amaslakov)! - Implement validateIntent in the CoinModuleApi, reading the utxo count and the topology check from the gateway

- [#25179](https://github.com/LedgerHQ/ledger-live/pull/25179) [`347dbb6`](https://github.com/LedgerHQ/ledger-live/commit/347dbb6c160a61827cfe69b7568426399ee56ae0) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump ts-libs packages (`@ledgerhq/live-network` 3.4.1, `@ledgerhq/ledger-key-ring-protocol` 1.2.2, `@ledgerhq/domain-service` 1.10.1, `@ledgerhq/evm-tools` 2.1.1), `axios` to 1.21.1 and `ws` to 8.23.0.

- [#25138](https://github.com/LedgerHQ/ledger-live/pull/25138) [`28984f6`](https://github.com/LedgerHQ/ledger-live/commit/28984f653f0a7e549352e89feea59a634365c62a) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Report the asset of each Canton fee in listOperations

- [#25143](https://github.com/LedgerHQ/ledger-live/pull/25143) [`114ab5f`](https://github.com/LedgerHQ/ledger-live/commit/114ab5f12a49550b01305bd131db441c472b230c) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Remove unused dependencies

- [#24918](https://github.com/LedgerHQ/ledger-live/pull/24918) [`cdf122f`](https://github.com/LedgerHQ/ledger-live/commit/cdf122fb665e1738355d95cf93d75f3c759a8816) Thanks [@amaslakov](https://github.com/amaslakov)! - Count only the network DSO party's holdings of the native instrument as CC, in the bridge's sync and the CoinModuleApi, and keep that party on the account

- [#24976](https://github.com/LedgerHQ/ledger-live/pull/24976) [`e516034`](https://github.com/LedgerHQ/ledger-live/commit/e5160345b50c0dc9e7c490da72d641c631d2ef7f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove unused lodash, invariant, prop-types and @types dependencies, and stop relying on the global React namespace in types-live

- [#25141](https://github.com/LedgerHQ/ledger-live/pull/25141) [`d77070a`](https://github.com/LedgerHQ/ledger-live/commit/d77070a51ec5e8c3cbb9457044991917b3b33a94) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Charge each Canton fee in its own asset: the CC fee of a token send or of a transfer proposal goes to the main account. Every account syncs its history again once, and again when a token gets its sub-account

- [#24800](https://github.com/LedgerHQ/ledger-live/pull/24800) [`3ee9499`](https://github.com/LedgerHQ/ledger-live/commit/3ee9499c13c4c9f0fa02c396736d8b953c662703) Thanks [@amaslakov](https://github.com/amaslakov)! - Build a token's sub-account only from balances, offers and operations under its CAL admin, and read the native balance by its instrument id

### Patch Changes

- Updated dependencies [[`081c422`](https://github.com/LedgerHQ/ledger-live/commit/081c422494180f04d0fbaf9de4d59370d7927863), [`a869e8b`](https://github.com/LedgerHQ/ledger-live/commit/a869e8b37d098ba06c01d36516ad7a6abb9aa0a5), [`8fbb9be`](https://github.com/LedgerHQ/ledger-live/commit/8fbb9beb39ff3ed1d1051d7df0b3e31a809f21f7), [`347dbb6`](https://github.com/LedgerHQ/ledger-live/commit/347dbb6c160a61827cfe69b7568426399ee56ae0), [`dc0e3ad`](https://github.com/LedgerHQ/ledger-live/commit/dc0e3ad24843961f7f71772b288c2dba473e93b0), [`c80f5de`](https://github.com/LedgerHQ/ledger-live/commit/c80f5de17b263d8e111ddd3b3247b04f7b9a687a), [`90db489`](https://github.com/LedgerHQ/ledger-live/commit/90db48910c3525f69fcef5a3644b666febd6a434), [`4ea6c56`](https://github.com/LedgerHQ/ledger-live/commit/4ea6c566069a55a0345df95add6dc62e37a30b01), [`90af53f`](https://github.com/LedgerHQ/ledger-live/commit/90af53fdcab2448e07ced5f4cc8d37efad261c6b), [`14ab34d`](https://github.com/LedgerHQ/ledger-live/commit/14ab34dbbf4c1768fcdc8928f6db43d9ec58f10b), [`e516034`](https://github.com/LedgerHQ/ledger-live/commit/e5160345b50c0dc9e7c490da72d641c631d2ef7f), [`2959603`](https://github.com/LedgerHQ/ledger-live/commit/29596039c7129ac7a5dd216e1f1c172936bed43b), [`2cdf737`](https://github.com/LedgerHQ/ledger-live/commit/2cdf737ce9d268e248253d1f98bd614c0e30da3f), [`cdbdb77`](https://github.com/LedgerHQ/ledger-live/commit/cdbdb773bac6bf3b6b659dc960a55582f181a362), [`b004476`](https://github.com/LedgerHQ/ledger-live/commit/b0044764e765d48ff2edabb567a6e71dbd820276)]:
  - @ledgerhq/types-live@6.133.0
  - @ledgerhq/ledger-wallet-framework@3.13.0
  - @ledgerhq/hw-app-canton@0.17.0

## 3.0.0-next.0

### Major Changes

- [#24650](https://github.com/LedgerHQ/ledger-live/pull/24650) [`aeab021`](https://github.com/LedgerHQ/ledger-live/commit/aeab021a770f44f773a482aef4e84d59f1f8ce74) Thanks [@amaslakov](https://github.com/amaslakov)! - Implement `craftTransaction`, `estimateFees` and `broadcast` in the CoinModuleApi. A crafted transaction is now a JSON envelope carrying the party and the payload the device signs, `combine` and `broadcast` take the envelope formats instead of a bare serialized transaction and a party appended to the signature, and `createFrameworkSigner` adapts the device signer to the generic framework.

### Minor Changes

- [#24795](https://github.com/LedgerHQ/ledger-live/pull/24795) [`57fb0bf`](https://github.com/LedgerHQ/ledger-live/commit/57fb0bfb2bbae6f63434c7a5c023244d4d372304) Thanks [@amaslakov](https://github.com/amaslakov)! - Show the too-many-UTXOs warning on token sends, and key the cached topology check and enabled instruments by gateway

- [#24460](https://github.com/LedgerHQ/ledger-live/pull/24460) [`e3d0630`](https://github.com/LedgerHQ/ledger-live/commit/e3d063017d281be326dbca1a4504ee559a9e9f22) Thanks [@amaslakov](https://github.com/amaslakov)! - Implement `lastBlock`, `getBalance` and `listOperations` in the Canton CoinModuleApi

- [#24714](https://github.com/LedgerHQ/ledger-live/pull/24714) [`f82d808`](https://github.com/LedgerHQ/ledger-live/commit/f82d8080480437ccb351d111cabb1e3ee110d63b) Thanks [@amaslakov](https://github.com/amaslakov)! - Implement validateIntent in the CoinModuleApi, reading the utxo count and the topology check from the gateway

- [#25179](https://github.com/LedgerHQ/ledger-live/pull/25179) [`347dbb6`](https://github.com/LedgerHQ/ledger-live/commit/347dbb6c160a61827cfe69b7568426399ee56ae0) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump ts-libs packages (`@ledgerhq/live-network` 3.4.1, `@ledgerhq/ledger-key-ring-protocol` 1.2.2, `@ledgerhq/domain-service` 1.10.1, `@ledgerhq/evm-tools` 2.1.1), `axios` to 1.21.1 and `ws` to 8.23.0.

- [#25138](https://github.com/LedgerHQ/ledger-live/pull/25138) [`28984f6`](https://github.com/LedgerHQ/ledger-live/commit/28984f653f0a7e549352e89feea59a634365c62a) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Report the asset of each Canton fee in listOperations

- [#25143](https://github.com/LedgerHQ/ledger-live/pull/25143) [`114ab5f`](https://github.com/LedgerHQ/ledger-live/commit/114ab5f12a49550b01305bd131db441c472b230c) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Remove unused dependencies

- [#24918](https://github.com/LedgerHQ/ledger-live/pull/24918) [`cdf122f`](https://github.com/LedgerHQ/ledger-live/commit/cdf122fb665e1738355d95cf93d75f3c759a8816) Thanks [@amaslakov](https://github.com/amaslakov)! - Count only the network DSO party's holdings of the native instrument as CC, in the bridge's sync and the CoinModuleApi, and keep that party on the account

- [#24976](https://github.com/LedgerHQ/ledger-live/pull/24976) [`e516034`](https://github.com/LedgerHQ/ledger-live/commit/e5160345b50c0dc9e7c490da72d641c631d2ef7f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove unused lodash, invariant, prop-types and @types dependencies, and stop relying on the global React namespace in types-live

- [#25141](https://github.com/LedgerHQ/ledger-live/pull/25141) [`d77070a`](https://github.com/LedgerHQ/ledger-live/commit/d77070a51ec5e8c3cbb9457044991917b3b33a94) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Charge each Canton fee in its own asset: the CC fee of a token send or of a transfer proposal goes to the main account. Every account syncs its history again once, and again when a token gets its sub-account

- [#24800](https://github.com/LedgerHQ/ledger-live/pull/24800) [`3ee9499`](https://github.com/LedgerHQ/ledger-live/commit/3ee9499c13c4c9f0fa02c396736d8b953c662703) Thanks [@amaslakov](https://github.com/amaslakov)! - Build a token's sub-account only from balances, offers and operations under its CAL admin, and read the native balance by its instrument id

### Patch Changes

- Updated dependencies [[`081c422`](https://github.com/LedgerHQ/ledger-live/commit/081c422494180f04d0fbaf9de4d59370d7927863), [`a869e8b`](https://github.com/LedgerHQ/ledger-live/commit/a869e8b37d098ba06c01d36516ad7a6abb9aa0a5), [`8fbb9be`](https://github.com/LedgerHQ/ledger-live/commit/8fbb9beb39ff3ed1d1051d7df0b3e31a809f21f7), [`347dbb6`](https://github.com/LedgerHQ/ledger-live/commit/347dbb6c160a61827cfe69b7568426399ee56ae0), [`dc0e3ad`](https://github.com/LedgerHQ/ledger-live/commit/dc0e3ad24843961f7f71772b288c2dba473e93b0), [`c80f5de`](https://github.com/LedgerHQ/ledger-live/commit/c80f5de17b263d8e111ddd3b3247b04f7b9a687a), [`90db489`](https://github.com/LedgerHQ/ledger-live/commit/90db48910c3525f69fcef5a3644b666febd6a434), [`4ea6c56`](https://github.com/LedgerHQ/ledger-live/commit/4ea6c566069a55a0345df95add6dc62e37a30b01), [`90af53f`](https://github.com/LedgerHQ/ledger-live/commit/90af53fdcab2448e07ced5f4cc8d37efad261c6b), [`14ab34d`](https://github.com/LedgerHQ/ledger-live/commit/14ab34dbbf4c1768fcdc8928f6db43d9ec58f10b), [`e516034`](https://github.com/LedgerHQ/ledger-live/commit/e5160345b50c0dc9e7c490da72d641c631d2ef7f), [`2959603`](https://github.com/LedgerHQ/ledger-live/commit/29596039c7129ac7a5dd216e1f1c172936bed43b), [`2cdf737`](https://github.com/LedgerHQ/ledger-live/commit/2cdf737ce9d268e248253d1f98bd614c0e30da3f), [`cdbdb77`](https://github.com/LedgerHQ/ledger-live/commit/cdbdb773bac6bf3b6b659dc960a55582f181a362), [`b004476`](https://github.com/LedgerHQ/ledger-live/commit/b0044764e765d48ff2edabb567a6e71dbd820276)]:
  - @ledgerhq/types-live@6.133.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.13.0-next.0
  - @ledgerhq/hw-app-canton@0.17.0-next.0

## 2.0.0

### Major Changes

- [#24232](https://github.com/LedgerHQ/ledger-live/pull/24232) [`5c70ad0`](https://github.com/LedgerHQ/ledger-live/commit/5c70ad082840b169ae8a22d196fcc765b779575b) Thanks [@amaslakov](https://github.com/amaslakov)! - Pass the CoinModuleApi context to the Canton logic and the resolved config to its network layer, move `common-logic` to a flat `logic` folder, and return 0 from `getNextSequence`. `createBridges` now takes a `Context` instead of seeding a module-level coin config, and the bridge logs through `context.logger`.

### Patch Changes

- Updated dependencies [[`4aa3244`](https://github.com/LedgerHQ/ledger-live/commit/4aa32442c63cd17bd2894d63ad0721d51e0ca41a), [`49de732`](https://github.com/LedgerHQ/ledger-live/commit/49de7327915d876c4a98826d561705171c41d2d2), [`5a9de42`](https://github.com/LedgerHQ/ledger-live/commit/5a9de42cd3a598f1f8954d58b9536280f5fd2927), [`120891d`](https://github.com/LedgerHQ/ledger-live/commit/120891d4dbd9e9bba22dbf552f1bbe0ab34685cc), [`51ce5a0`](https://github.com/LedgerHQ/ledger-live/commit/51ce5a05e95dc02ce0eccc5f9d043d556ba43bbf), [`0cf44d5`](https://github.com/LedgerHQ/ledger-live/commit/0cf44d56a449fb0f4448cd6f8e02c880fc47adb2)]:
  - @ledgerhq/types-live@6.132.0
  - @ledgerhq/ledger-wallet-framework@3.12.0
  - @ledgerhq/hw-app-canton@0.16.0

## 2.0.0-next.0

### Major Changes

- [#24232](https://github.com/LedgerHQ/ledger-live/pull/24232) [`5c70ad0`](https://github.com/LedgerHQ/ledger-live/commit/5c70ad082840b169ae8a22d196fcc765b779575b) Thanks [@amaslakov](https://github.com/amaslakov)! - Pass the CoinModuleApi context to the Canton logic and the resolved config to its network layer, move `common-logic` to a flat `logic` folder, and return 0 from `getNextSequence`. `createBridges` now takes a `Context` instead of seeding a module-level coin config, and the bridge logs through `context.logger`.

### Patch Changes

- Updated dependencies [[`4aa3244`](https://github.com/LedgerHQ/ledger-live/commit/4aa32442c63cd17bd2894d63ad0721d51e0ca41a), [`49de732`](https://github.com/LedgerHQ/ledger-live/commit/49de7327915d876c4a98826d561705171c41d2d2), [`5a9de42`](https://github.com/LedgerHQ/ledger-live/commit/5a9de42cd3a598f1f8954d58b9536280f5fd2927), [`120891d`](https://github.com/LedgerHQ/ledger-live/commit/120891d4dbd9e9bba22dbf552f1bbe0ab34685cc), [`51ce5a0`](https://github.com/LedgerHQ/ledger-live/commit/51ce5a05e95dc02ce0eccc5f9d043d556ba43bbf), [`0cf44d5`](https://github.com/LedgerHQ/ledger-live/commit/0cf44d56a449fb0f4448cd6f8e02c880fc47adb2)]:
  - @ledgerhq/types-live@6.132.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.12.0-next.0
  - @ledgerhq/hw-app-canton@0.16.0

## 1.7.0

### Minor Changes

- [#24373](https://github.com/LedgerHQ/ledger-live/pull/24373) [`6ab5a87`](https://github.com/LedgerHQ/ledger-live/commit/6ab5a87d796726b2fc38b34862209abf82521f72) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Export the default coin configs from each coin package and wrap them in `ledger-live-common` (ADR-063). `coin-celo` and `coin-cosmos` replace their `celoConfig` and `cosmosConfig` exports, which wrapped the defaults in `ConfigInfo`, with plain typed `celoDefaults` and `cosmosDefaults`; their `features` now use the `status` key instead of `type`, Desmos gets the active status it was missing, and Gonka defaults to a minimum gas price of 1 ngonka

- [#24522](https://github.com/LedgerHQ/ledger-live/pull/24522) [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Import bignumber.js through its default export, the form bignumber.js 11 types support

### Patch Changes

- Updated dependencies [[`b77803f`](https://github.com/LedgerHQ/ledger-live/commit/b77803ffbca90848d55bca56b9d8cd3547464620), [`d701bc7`](https://github.com/LedgerHQ/ledger-live/commit/d701bc7564f9f479e0cc867ef76ec40b73f5c49c), [`d36ed0a`](https://github.com/LedgerHQ/ledger-live/commit/d36ed0a5b624f1842e2ad3a857d502621dfb5fb9), [`e051c84`](https://github.com/LedgerHQ/ledger-live/commit/e051c84a8486b78327ea49500c38b6e2138bbc21), [`3a0d8aa`](https://github.com/LedgerHQ/ledger-live/commit/3a0d8aa1d4904fa0ccc53528ec092bc32a63dcd4), [`96fac1e`](https://github.com/LedgerHQ/ledger-live/commit/96fac1eb64856beb33cc68594e98c25e8b308898), [`0d83181`](https://github.com/LedgerHQ/ledger-live/commit/0d83181e9a96f55811f2ce5532527739bdb7e62a), [`e186896`](https://github.com/LedgerHQ/ledger-live/commit/e186896213df32feb1e6a80e38f45cf189655866), [`e7b21f8`](https://github.com/LedgerHQ/ledger-live/commit/e7b21f816021dbbe7314ff51bf32cc4d87291b98), [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e), [`d3f59ae`](https://github.com/LedgerHQ/ledger-live/commit/d3f59ae3fc6b9d9240bd81df9f93c1223cb64ddb)]:
  - @ledgerhq/types-live@6.131.0
  - @ledgerhq/ledger-wallet-framework@3.11.0

## 1.7.0-next.0

### Minor Changes

- [#24373](https://github.com/LedgerHQ/ledger-live/pull/24373) [`6ab5a87`](https://github.com/LedgerHQ/ledger-live/commit/6ab5a87d796726b2fc38b34862209abf82521f72) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Export the default coin configs from each coin package and wrap them in `ledger-live-common` (ADR-063). `coin-celo` and `coin-cosmos` replace their `celoConfig` and `cosmosConfig` exports, which wrapped the defaults in `ConfigInfo`, with plain typed `celoDefaults` and `cosmosDefaults`; their `features` now use the `status` key instead of `type`, Desmos gets the active status it was missing, and Gonka defaults to a minimum gas price of 1 ngonka

- [#24522](https://github.com/LedgerHQ/ledger-live/pull/24522) [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Import bignumber.js through its default export, the form bignumber.js 11 types support

### Patch Changes

- Updated dependencies [[`b77803f`](https://github.com/LedgerHQ/ledger-live/commit/b77803ffbca90848d55bca56b9d8cd3547464620), [`d701bc7`](https://github.com/LedgerHQ/ledger-live/commit/d701bc7564f9f479e0cc867ef76ec40b73f5c49c), [`d36ed0a`](https://github.com/LedgerHQ/ledger-live/commit/d36ed0a5b624f1842e2ad3a857d502621dfb5fb9), [`e051c84`](https://github.com/LedgerHQ/ledger-live/commit/e051c84a8486b78327ea49500c38b6e2138bbc21), [`3a0d8aa`](https://github.com/LedgerHQ/ledger-live/commit/3a0d8aa1d4904fa0ccc53528ec092bc32a63dcd4), [`96fac1e`](https://github.com/LedgerHQ/ledger-live/commit/96fac1eb64856beb33cc68594e98c25e8b308898), [`0d83181`](https://github.com/LedgerHQ/ledger-live/commit/0d83181e9a96f55811f2ce5532527739bdb7e62a), [`e186896`](https://github.com/LedgerHQ/ledger-live/commit/e186896213df32feb1e6a80e38f45cf189655866), [`e7b21f8`](https://github.com/LedgerHQ/ledger-live/commit/e7b21f816021dbbe7314ff51bf32cc4d87291b98), [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e), [`d3f59ae`](https://github.com/LedgerHQ/ledger-live/commit/d3f59ae3fc6b9d9240bd81df9f93c1223cb64ddb)]:
  - @ledgerhq/types-live@6.131.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.11.0-next.0

## 1.6.1

### Patch Changes

- Updated dependencies [[`9907890`](https://github.com/LedgerHQ/ledger-live/commit/9907890790bf8b804d7cc454a067508df0969137), [`8854aff`](https://github.com/LedgerHQ/ledger-live/commit/8854aff9cace72ad17c6d9fd7ee98a4dcd65ecb1), [`77a85a3`](https://github.com/LedgerHQ/ledger-live/commit/77a85a30abe7b42e5f5b4e0478bec14fa39033cf), [`c50f3fa`](https://github.com/LedgerHQ/ledger-live/commit/c50f3fac1c822d61332dbb512b21cdda6bb57210)]:
  - @ledgerhq/types-live@6.130.0
  - @ledgerhq/ledger-wallet-framework@3.10.0

## 1.6.1-next.0

### Patch Changes

- Updated dependencies [[`9907890`](https://github.com/LedgerHQ/ledger-live/commit/9907890790bf8b804d7cc454a067508df0969137), [`8854aff`](https://github.com/LedgerHQ/ledger-live/commit/8854aff9cace72ad17c6d9fd7ee98a4dcd65ecb1), [`77a85a3`](https://github.com/LedgerHQ/ledger-live/commit/77a85a30abe7b42e5f5b4e0478bec14fa39033cf), [`c50f3fa`](https://github.com/LedgerHQ/ledger-live/commit/c50f3fac1c822d61332dbb512b21cdda6bb57210)]:
  - @ledgerhq/types-live@6.130.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.10.0-next.0

## 1.6.0

### Minor Changes

- [#23980](https://github.com/LedgerHQ/ledger-live/pull/23980) [`3d47846`](https://github.com/LedgerHQ/ledger-live/commit/3d47846307baebb9f7dbca75764650bf9c11506c) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Sign the onboarding device challenge in the Canton mock signer so integration tests pass now that devnet requires it.

- [#23846](https://github.com/LedgerHQ/ledger-live/pull/23846) [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359) Thanks [@gre-ledger](https://github.com/gre-ledger)! - fix: ship lib and lib-es in the npm tarballs again, which pnpm 11 dropped

- [#23548](https://github.com/LedgerHQ/ledger-live/pull/23548) [`6c6fd48`](https://github.com/LedgerHQ/ledger-live/commit/6c6fd486fbb642bac383e13fdd88ab67397e4bd6) Thanks [@amaslakov](https://github.com/amaslakov)! - Support Canton onboarding with a single PartyToParticipant topology transaction

### Patch Changes

- Updated dependencies [[`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1), [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359), [`9c7d59d`](https://github.com/LedgerHQ/ledger-live/commit/9c7d59d0ffcc72ba746bc20e9ff744db9730503b)]:
  - @ledgerhq/ledger-wallet-framework@3.9.0
  - @ledgerhq/hw-app-canton@0.16.0
  - @ledgerhq/types-live@6.129.0

## 1.6.0-next.0

### Minor Changes

- [#23980](https://github.com/LedgerHQ/ledger-live/pull/23980) [`3d47846`](https://github.com/LedgerHQ/ledger-live/commit/3d47846307baebb9f7dbca75764650bf9c11506c) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Sign the onboarding device challenge in the Canton mock signer so integration tests pass now that devnet requires it.

- [#23846](https://github.com/LedgerHQ/ledger-live/pull/23846) [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359) Thanks [@gre-ledger](https://github.com/gre-ledger)! - fix: ship lib and lib-es in the npm tarballs again, which pnpm 11 dropped

- [#23548](https://github.com/LedgerHQ/ledger-live/pull/23548) [`6c6fd48`](https://github.com/LedgerHQ/ledger-live/commit/6c6fd486fbb642bac383e13fdd88ab67397e4bd6) Thanks [@amaslakov](https://github.com/amaslakov)! - Support Canton onboarding with a single PartyToParticipant topology transaction

### Patch Changes

- Updated dependencies [[`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1), [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359), [`9c7d59d`](https://github.com/LedgerHQ/ledger-live/commit/9c7d59d0ffcc72ba746bc20e9ff744db9730503b)]:
  - @ledgerhq/ledger-wallet-framework@3.9.0-next.0
  - @ledgerhq/hw-app-canton@0.16.0-next.0
  - @ledgerhq/types-live@6.129.0-next.0

## 1.5.0

### Minor Changes

- [#23319](https://github.com/LedgerHQ/ledger-live/pull/23319) [`0d5c35d`](https://github.com/LedgerHQ/ledger-live/commit/0d5c35d9f29e17c3ad7bcb7632dcaea83d47e7d3) Thanks [@qperrot](https://github.com/qperrot)! - Remove the unused `parseAPIValue` export of Canton, a boilerplate leftover that read the units of `ripple`

### Patch Changes

- Updated dependencies [[`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97)]:
  - @ledgerhq/ledger-wallet-framework@3.8.0
  - @ledgerhq/types-live@6.128.0
  - @ledgerhq/hw-app-canton@0.15.0

## 1.5.0-next.0

### Minor Changes

- [#23319](https://github.com/LedgerHQ/ledger-live/pull/23319) [`0d5c35d`](https://github.com/LedgerHQ/ledger-live/commit/0d5c35d9f29e17c3ad7bcb7632dcaea83d47e7d3) Thanks [@qperrot](https://github.com/qperrot)! - Remove the unused `parseAPIValue` export of Canton, a boilerplate leftover that read the units of `ripple`

### Patch Changes

- Updated dependencies [[`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97)]:
  - @ledgerhq/ledger-wallet-framework@3.8.0-next.0
  - @ledgerhq/types-live@6.128.0-next.0
  - @ledgerhq/hw-app-canton@0.15.0

## 1.4.0

### Minor Changes

- [#22745](https://github.com/LedgerHQ/ledger-live/pull/22745) [`db3bde1`](https://github.com/LedgerHQ/ledger-live/commit/db3bde1a0ea2435389260b012d9759dd26f7b174) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Canton: hide Accept once an offer expires while the screen is open, and show a clear message instead of retry when accepting an expired offer

### Patch Changes

- Updated dependencies [[`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`1731458`](https://github.com/LedgerHQ/ledger-live/commit/17314582789efaad9ba35a5cf5e434a3140d6132), [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0
  - @ledgerhq/types-live@6.127.0
  - @ledgerhq/hw-app-canton@0.15.0

## 1.4.0-next.1

### Patch Changes

- Updated dependencies [[`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.1

## 1.4.0-next.0

### Minor Changes

- [#22745](https://github.com/LedgerHQ/ledger-live/pull/22745) [`db3bde1`](https://github.com/LedgerHQ/ledger-live/commit/db3bde1a0ea2435389260b012d9759dd26f7b174) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Canton: hide Accept once an offer expires while the screen is open, and show a clear message instead of retry when accepting an expired offer

### Patch Changes

- Updated dependencies [[`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`1731458`](https://github.com/LedgerHQ/ledger-live/commit/17314582789efaad9ba35a5cf5e434a3140d6132), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.0
  - @ledgerhq/types-live@6.127.0-next.0
  - @ledgerhq/hw-app-canton@0.15.0-next.0

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
  - @ledgerhq/hw-app-canton@0.14.0
  - @ledgerhq/ledger-wallet-framework@3.5.0
  - @ledgerhq/types-live@6.125.0
  - @ledgerhq/live-env@4.1.0

## 1.2.0-next.0

### Minor Changes

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @ledgerhq/hw-app-canton@0.14.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.5.0-next.0
  - @ledgerhq/types-live@6.125.0-next.0
  - @ledgerhq/live-env@4.1.0-next.0

## 1.1.2

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`da3d09d`](https://github.com/LedgerHQ/ledger-live/commit/da3d09d75d7dcae659611cd371c48d75c03f7ae4), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/types-live@6.124.0
  - @ledgerhq/hw-app-canton@0.13.0
  - @ledgerhq/ledger-wallet-framework@3.4.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
