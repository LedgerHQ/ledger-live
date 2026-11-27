# @ledgerhq/coin-aleo

## 2.12.0-next.0

### Minor Changes

- [#25377](https://github.com/LedgerHQ/ledger-live/pull/25377) [`fa1161f`](https://github.com/LedgerHQ/ledger-live/commit/fa1161f005a5409dc3d53f9bc2ec475465190a16) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add `getAccountStatus` on the Aleo public state and the account key codec (`<address>.<viewKey>`)

- [#25471](https://github.com/LedgerHQ/ledger-live/pull/25471) [`b4e886d`](https://github.com/LedgerHQ/ledger-live/commit/b4e886db64a3c223fd67850e51dcfd685d5ef1cf) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `<address>.<viewKey>` account key: `getAccountStatus` reads the account address

### Patch Changes

- Updated dependencies [[`afe8aea`](https://github.com/LedgerHQ/ledger-live/commit/afe8aea94052e7475b17e203028ca7e02e2848e1), [`c1f5e3f`](https://github.com/LedgerHQ/ledger-live/commit/c1f5e3f808ab22c42bd0cbc1125106ff84a6e4c7), [`44c63d1`](https://github.com/LedgerHQ/ledger-live/commit/44c63d1ed48ea109d1d7328553f29cef9cd52653), [`35e9ca8`](https://github.com/LedgerHQ/ledger-live/commit/35e9ca85552282ddc37c47bc4212c81b06a2ee2c), [`866ed62`](https://github.com/LedgerHQ/ledger-live/commit/866ed62f04647abce7efeff0ebefe79c8e5bafde), [`52ba745`](https://github.com/LedgerHQ/ledger-live/commit/52ba7459509dbdaeb551bb24b8bd7965e2f0f252), [`fcd1d97`](https://github.com/LedgerHQ/ledger-live/commit/fcd1d979dcce6f25d9e4dfcf7dd6b68d79b8b03c)]:
  - @ledgerhq/ledger-wallet-framework@3.14.0-next.0
  - @ledgerhq/types-live@6.134.0-next.0

## 2.11.0

### Minor Changes

- [#25237](https://github.com/LedgerHQ/ledger-live/pull/25237) [`081c422`](https://github.com/LedgerHQ/ledger-live/commit/081c422494180f04d0fbaf9de4d59370d7927863) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Expose account balances and honour pool filters in the Wallet API max spendable

- [#25179](https://github.com/LedgerHQ/ledger-live/pull/25179) [`347dbb6`](https://github.com/LedgerHQ/ledger-live/commit/347dbb6c160a61827cfe69b7568426399ee56ae0) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump ts-libs packages (`@ledgerhq/live-network` 3.4.1, `@ledgerhq/ledger-key-ring-protocol` 1.2.2, `@ledgerhq/domain-service` 1.10.1, `@ledgerhq/evm-tools` 2.1.1), `axios` to 1.21.1 and `ws` to 8.23.0.

- [#25143](https://github.com/LedgerHQ/ledger-live/pull/25143) [`114ab5f`](https://github.com/LedgerHQ/ledger-live/commit/114ab5f12a49550b01305bd131db441c472b230c) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Remove unused dependencies

- [#25072](https://github.com/LedgerHQ/ledger-live/pull/25072) [`4ea6c56`](https://github.com/LedgerHQ/ledger-live/commit/4ea6c566069a55a0345df95add6dc62e37a30b01) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Add a per-pool balance breakdown to accounts (`balances`), filled at every sync, with Zcash transparent and Ironwood rows and Aleo public and private rows; Aleo `getBalance` no longer counts staked credits twice

### Patch Changes

- Updated dependencies [[`081c422`](https://github.com/LedgerHQ/ledger-live/commit/081c422494180f04d0fbaf9de4d59370d7927863), [`a869e8b`](https://github.com/LedgerHQ/ledger-live/commit/a869e8b37d098ba06c01d36516ad7a6abb9aa0a5), [`8fbb9be`](https://github.com/LedgerHQ/ledger-live/commit/8fbb9beb39ff3ed1d1051d7df0b3e31a809f21f7), [`347dbb6`](https://github.com/LedgerHQ/ledger-live/commit/347dbb6c160a61827cfe69b7568426399ee56ae0), [`dc0e3ad`](https://github.com/LedgerHQ/ledger-live/commit/dc0e3ad24843961f7f71772b288c2dba473e93b0), [`c80f5de`](https://github.com/LedgerHQ/ledger-live/commit/c80f5de17b263d8e111ddd3b3247b04f7b9a687a), [`90db489`](https://github.com/LedgerHQ/ledger-live/commit/90db48910c3525f69fcef5a3644b666febd6a434), [`4ea6c56`](https://github.com/LedgerHQ/ledger-live/commit/4ea6c566069a55a0345df95add6dc62e37a30b01), [`90af53f`](https://github.com/LedgerHQ/ledger-live/commit/90af53fdcab2448e07ced5f4cc8d37efad261c6b), [`14ab34d`](https://github.com/LedgerHQ/ledger-live/commit/14ab34dbbf4c1768fcdc8928f6db43d9ec58f10b), [`e516034`](https://github.com/LedgerHQ/ledger-live/commit/e5160345b50c0dc9e7c490da72d641c631d2ef7f), [`2959603`](https://github.com/LedgerHQ/ledger-live/commit/29596039c7129ac7a5dd216e1f1c172936bed43b), [`2cdf737`](https://github.com/LedgerHQ/ledger-live/commit/2cdf737ce9d268e248253d1f98bd614c0e30da3f), [`b004476`](https://github.com/LedgerHQ/ledger-live/commit/b0044764e765d48ff2edabb567a6e71dbd820276)]:
  - @ledgerhq/types-live@6.133.0
  - @ledgerhq/ledger-wallet-framework@3.13.0

## 2.11.0-next.0

### Minor Changes

- [#25237](https://github.com/LedgerHQ/ledger-live/pull/25237) [`081c422`](https://github.com/LedgerHQ/ledger-live/commit/081c422494180f04d0fbaf9de4d59370d7927863) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Expose account balances and honour pool filters in the Wallet API max spendable

- [#25179](https://github.com/LedgerHQ/ledger-live/pull/25179) [`347dbb6`](https://github.com/LedgerHQ/ledger-live/commit/347dbb6c160a61827cfe69b7568426399ee56ae0) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump ts-libs packages (`@ledgerhq/live-network` 3.4.1, `@ledgerhq/ledger-key-ring-protocol` 1.2.2, `@ledgerhq/domain-service` 1.10.1, `@ledgerhq/evm-tools` 2.1.1), `axios` to 1.21.1 and `ws` to 8.23.0.

- [#25143](https://github.com/LedgerHQ/ledger-live/pull/25143) [`114ab5f`](https://github.com/LedgerHQ/ledger-live/commit/114ab5f12a49550b01305bd131db441c472b230c) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Remove unused dependencies

- [#25072](https://github.com/LedgerHQ/ledger-live/pull/25072) [`4ea6c56`](https://github.com/LedgerHQ/ledger-live/commit/4ea6c566069a55a0345df95add6dc62e37a30b01) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Add a per-pool balance breakdown to accounts (`balances`), filled at every sync, with Zcash transparent and Ironwood rows and Aleo public and private rows; Aleo `getBalance` no longer counts staked credits twice

### Patch Changes

- Updated dependencies [[`081c422`](https://github.com/LedgerHQ/ledger-live/commit/081c422494180f04d0fbaf9de4d59370d7927863), [`a869e8b`](https://github.com/LedgerHQ/ledger-live/commit/a869e8b37d098ba06c01d36516ad7a6abb9aa0a5), [`8fbb9be`](https://github.com/LedgerHQ/ledger-live/commit/8fbb9beb39ff3ed1d1051d7df0b3e31a809f21f7), [`347dbb6`](https://github.com/LedgerHQ/ledger-live/commit/347dbb6c160a61827cfe69b7568426399ee56ae0), [`dc0e3ad`](https://github.com/LedgerHQ/ledger-live/commit/dc0e3ad24843961f7f71772b288c2dba473e93b0), [`c80f5de`](https://github.com/LedgerHQ/ledger-live/commit/c80f5de17b263d8e111ddd3b3247b04f7b9a687a), [`90db489`](https://github.com/LedgerHQ/ledger-live/commit/90db48910c3525f69fcef5a3644b666febd6a434), [`4ea6c56`](https://github.com/LedgerHQ/ledger-live/commit/4ea6c566069a55a0345df95add6dc62e37a30b01), [`90af53f`](https://github.com/LedgerHQ/ledger-live/commit/90af53fdcab2448e07ced5f4cc8d37efad261c6b), [`14ab34d`](https://github.com/LedgerHQ/ledger-live/commit/14ab34dbbf4c1768fcdc8928f6db43d9ec58f10b), [`e516034`](https://github.com/LedgerHQ/ledger-live/commit/e5160345b50c0dc9e7c490da72d641c631d2ef7f), [`2959603`](https://github.com/LedgerHQ/ledger-live/commit/29596039c7129ac7a5dd216e1f1c172936bed43b), [`2cdf737`](https://github.com/LedgerHQ/ledger-live/commit/2cdf737ce9d268e248253d1f98bd614c0e30da3f), [`b004476`](https://github.com/LedgerHQ/ledger-live/commit/b0044764e765d48ff2edabb567a6e71dbd820276)]:
  - @ledgerhq/types-live@6.133.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.13.0-next.0

## 2.10.1

### Patch Changes

- Updated dependencies [[`4aa3244`](https://github.com/LedgerHQ/ledger-live/commit/4aa32442c63cd17bd2894d63ad0721d51e0ca41a), [`49de732`](https://github.com/LedgerHQ/ledger-live/commit/49de7327915d876c4a98826d561705171c41d2d2), [`5a9de42`](https://github.com/LedgerHQ/ledger-live/commit/5a9de42cd3a598f1f8954d58b9536280f5fd2927), [`120891d`](https://github.com/LedgerHQ/ledger-live/commit/120891d4dbd9e9bba22dbf552f1bbe0ab34685cc), [`51ce5a0`](https://github.com/LedgerHQ/ledger-live/commit/51ce5a05e95dc02ce0eccc5f9d043d556ba43bbf), [`0cf44d5`](https://github.com/LedgerHQ/ledger-live/commit/0cf44d56a449fb0f4448cd6f8e02c880fc47adb2)]:
  - @ledgerhq/types-live@6.132.0
  - @ledgerhq/ledger-wallet-framework@3.12.0

## 2.10.1-next.0

### Patch Changes

- Updated dependencies [[`4aa3244`](https://github.com/LedgerHQ/ledger-live/commit/4aa32442c63cd17bd2894d63ad0721d51e0ca41a), [`49de732`](https://github.com/LedgerHQ/ledger-live/commit/49de7327915d876c4a98826d561705171c41d2d2), [`5a9de42`](https://github.com/LedgerHQ/ledger-live/commit/5a9de42cd3a598f1f8954d58b9536280f5fd2927), [`120891d`](https://github.com/LedgerHQ/ledger-live/commit/120891d4dbd9e9bba22dbf552f1bbe0ab34685cc), [`51ce5a0`](https://github.com/LedgerHQ/ledger-live/commit/51ce5a05e95dc02ce0eccc5f9d043d556ba43bbf), [`0cf44d5`](https://github.com/LedgerHQ/ledger-live/commit/0cf44d56a449fb0f4448cd6f8e02c880fc47adb2)]:
  - @ledgerhq/types-live@6.132.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.12.0-next.0

## 2.10.0

### Minor Changes

- [#24373](https://github.com/LedgerHQ/ledger-live/pull/24373) [`6ab5a87`](https://github.com/LedgerHQ/ledger-live/commit/6ab5a87d796726b2fc38b34862209abf82521f72) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Export the default coin configs from each coin package and wrap them in `ledger-live-common` (ADR-063). `coin-celo` and `coin-cosmos` replace their `celoConfig` and `cosmosConfig` exports, which wrapped the defaults in `ConfigInfo`, with plain typed `celoDefaults` and `cosmosDefaults`; their `features` now use the `status` key instead of `type`, Desmos gets the active status it was missing, and Gonka defaults to a minimum gas price of 1 ngonka

- [#24522](https://github.com/LedgerHQ/ledger-live/pull/24522) [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Import bignumber.js through its default export, the form bignumber.js 11 types support

### Patch Changes

- Updated dependencies [[`b77803f`](https://github.com/LedgerHQ/ledger-live/commit/b77803ffbca90848d55bca56b9d8cd3547464620), [`d701bc7`](https://github.com/LedgerHQ/ledger-live/commit/d701bc7564f9f479e0cc867ef76ec40b73f5c49c), [`d36ed0a`](https://github.com/LedgerHQ/ledger-live/commit/d36ed0a5b624f1842e2ad3a857d502621dfb5fb9), [`e051c84`](https://github.com/LedgerHQ/ledger-live/commit/e051c84a8486b78327ea49500c38b6e2138bbc21), [`3a0d8aa`](https://github.com/LedgerHQ/ledger-live/commit/3a0d8aa1d4904fa0ccc53528ec092bc32a63dcd4), [`96fac1e`](https://github.com/LedgerHQ/ledger-live/commit/96fac1eb64856beb33cc68594e98c25e8b308898), [`0d83181`](https://github.com/LedgerHQ/ledger-live/commit/0d83181e9a96f55811f2ce5532527739bdb7e62a), [`e186896`](https://github.com/LedgerHQ/ledger-live/commit/e186896213df32feb1e6a80e38f45cf189655866), [`e7b21f8`](https://github.com/LedgerHQ/ledger-live/commit/e7b21f816021dbbe7314ff51bf32cc4d87291b98), [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e), [`d3f59ae`](https://github.com/LedgerHQ/ledger-live/commit/d3f59ae3fc6b9d9240bd81df9f93c1223cb64ddb)]:
  - @ledgerhq/types-live@6.131.0
  - @ledgerhq/ledger-wallet-framework@3.11.0

## 2.10.0-next.0

### Minor Changes

- [#24373](https://github.com/LedgerHQ/ledger-live/pull/24373) [`6ab5a87`](https://github.com/LedgerHQ/ledger-live/commit/6ab5a87d796726b2fc38b34862209abf82521f72) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Export the default coin configs from each coin package and wrap them in `ledger-live-common` (ADR-063). `coin-celo` and `coin-cosmos` replace their `celoConfig` and `cosmosConfig` exports, which wrapped the defaults in `ConfigInfo`, with plain typed `celoDefaults` and `cosmosDefaults`; their `features` now use the `status` key instead of `type`, Desmos gets the active status it was missing, and Gonka defaults to a minimum gas price of 1 ngonka

- [#24522](https://github.com/LedgerHQ/ledger-live/pull/24522) [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Import bignumber.js through its default export, the form bignumber.js 11 types support

### Patch Changes

- Updated dependencies [[`b77803f`](https://github.com/LedgerHQ/ledger-live/commit/b77803ffbca90848d55bca56b9d8cd3547464620), [`d701bc7`](https://github.com/LedgerHQ/ledger-live/commit/d701bc7564f9f479e0cc867ef76ec40b73f5c49c), [`d36ed0a`](https://github.com/LedgerHQ/ledger-live/commit/d36ed0a5b624f1842e2ad3a857d502621dfb5fb9), [`e051c84`](https://github.com/LedgerHQ/ledger-live/commit/e051c84a8486b78327ea49500c38b6e2138bbc21), [`3a0d8aa`](https://github.com/LedgerHQ/ledger-live/commit/3a0d8aa1d4904fa0ccc53528ec092bc32a63dcd4), [`96fac1e`](https://github.com/LedgerHQ/ledger-live/commit/96fac1eb64856beb33cc68594e98c25e8b308898), [`0d83181`](https://github.com/LedgerHQ/ledger-live/commit/0d83181e9a96f55811f2ce5532527739bdb7e62a), [`e186896`](https://github.com/LedgerHQ/ledger-live/commit/e186896213df32feb1e6a80e38f45cf189655866), [`e7b21f8`](https://github.com/LedgerHQ/ledger-live/commit/e7b21f816021dbbe7314ff51bf32cc4d87291b98), [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e), [`d3f59ae`](https://github.com/LedgerHQ/ledger-live/commit/d3f59ae3fc6b9d9240bd81df9f93c1223cb64ddb)]:
  - @ledgerhq/types-live@6.131.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.11.0-next.0

## 2.9.1

### Patch Changes

- Updated dependencies [[`9907890`](https://github.com/LedgerHQ/ledger-live/commit/9907890790bf8b804d7cc454a067508df0969137), [`8854aff`](https://github.com/LedgerHQ/ledger-live/commit/8854aff9cace72ad17c6d9fd7ee98a4dcd65ecb1), [`77a85a3`](https://github.com/LedgerHQ/ledger-live/commit/77a85a30abe7b42e5f5b4e0478bec14fa39033cf), [`c50f3fa`](https://github.com/LedgerHQ/ledger-live/commit/c50f3fac1c822d61332dbb512b21cdda6bb57210)]:
  - @ledgerhq/types-live@6.130.0
  - @ledgerhq/ledger-wallet-framework@3.10.0

## 2.9.1-next.0

### Patch Changes

- Updated dependencies [[`9907890`](https://github.com/LedgerHQ/ledger-live/commit/9907890790bf8b804d7cc454a067508df0969137), [`8854aff`](https://github.com/LedgerHQ/ledger-live/commit/8854aff9cace72ad17c6d9fd7ee98a4dcd65ecb1), [`77a85a3`](https://github.com/LedgerHQ/ledger-live/commit/77a85a30abe7b42e5f5b4e0478bec14fa39033cf), [`c50f3fa`](https://github.com/LedgerHQ/ledger-live/commit/c50f3fac1c822d61332dbb512b21cdda6bb57210)]:
  - @ledgerhq/types-live@6.130.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.10.0-next.0

## 2.9.0

### Minor Changes

- [#23592](https://github.com/LedgerHQ/ledger-live/pull/23592) [`8e941a7`](https://github.com/LedgerHQ/ledger-live/commit/8e941a7a7bcb09f8e2f18180a797ba11c1dcb1e3) Thanks [@henri-ly](https://github.com/henri-ly)! - fix(coin-aleo): type a rejected self-transfer OUT so its fee is shown

- [#23846](https://github.com/LedgerHQ/ledger-live/pull/23846) [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359) Thanks [@gre-ledger](https://github.com/gre-ledger)! - fix: ship lib and lib-es in the npm tarballs again, which pnpm 11 dropped

- [#23527](https://github.com/LedgerHQ/ledger-live/pull/23527) [`a389665`](https://github.com/LedgerHQ/ledger-live/commit/a389665d6256a750f539ec54516f667cca1fb011) Thanks [@qperrot](https://github.com/qperrot)! - Stop setting name / unit on returned assets

- [#23584](https://github.com/LedgerHQ/ledger-live/pull/23584) [`7ea1bad`](https://github.com/LedgerHQ/ledger-live/commit/7ea1bad0c360229ef6caaacbd2ad08b8a4166035) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - list fees of rejected private transactions and of private join/split calls, and count join/split records in the private balance

### Patch Changes

- Updated dependencies [[`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1), [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359), [`9c7d59d`](https://github.com/LedgerHQ/ledger-live/commit/9c7d59d0ffcc72ba746bc20e9ff744db9730503b)]:
  - @ledgerhq/ledger-wallet-framework@3.9.0
  - @ledgerhq/types-live@6.129.0

## 2.9.0-next.0

### Minor Changes

- [#23592](https://github.com/LedgerHQ/ledger-live/pull/23592) [`8e941a7`](https://github.com/LedgerHQ/ledger-live/commit/8e941a7a7bcb09f8e2f18180a797ba11c1dcb1e3) Thanks [@henri-ly](https://github.com/henri-ly)! - fix(coin-aleo): type a rejected self-transfer OUT so its fee is shown

- [#23846](https://github.com/LedgerHQ/ledger-live/pull/23846) [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359) Thanks [@gre-ledger](https://github.com/gre-ledger)! - fix: ship lib and lib-es in the npm tarballs again, which pnpm 11 dropped

- [#23527](https://github.com/LedgerHQ/ledger-live/pull/23527) [`a389665`](https://github.com/LedgerHQ/ledger-live/commit/a389665d6256a750f539ec54516f667cca1fb011) Thanks [@qperrot](https://github.com/qperrot)! - Stop setting name / unit on returned assets

- [#23584](https://github.com/LedgerHQ/ledger-live/pull/23584) [`7ea1bad`](https://github.com/LedgerHQ/ledger-live/commit/7ea1bad0c360229ef6caaacbd2ad08b8a4166035) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - list fees of rejected private transactions and of private join/split calls, and count join/split records in the private balance

### Patch Changes

- Updated dependencies [[`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1), [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359), [`9c7d59d`](https://github.com/LedgerHQ/ledger-live/commit/9c7d59d0ffcc72ba746bc20e9ff744db9730503b)]:
  - @ledgerhq/ledger-wallet-framework@3.9.0-next.0
  - @ledgerhq/types-live@6.129.0-next.0

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

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
