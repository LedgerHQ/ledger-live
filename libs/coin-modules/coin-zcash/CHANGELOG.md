# @ledgerhq/coin-zcash

## 1.2.1-next.0

### Patch Changes

- Updated dependencies [[`4aa3244`](https://github.com/LedgerHQ/ledger-live/commit/4aa32442c63cd17bd2894d63ad0721d51e0ca41a), [`332d615`](https://github.com/LedgerHQ/ledger-live/commit/332d6152b6c11aa923d5fc7f5e16606b5d61a252), [`49de732`](https://github.com/LedgerHQ/ledger-live/commit/49de7327915d876c4a98826d561705171c41d2d2), [`5a9de42`](https://github.com/LedgerHQ/ledger-live/commit/5a9de42cd3a598f1f8954d58b9536280f5fd2927), [`120891d`](https://github.com/LedgerHQ/ledger-live/commit/120891d4dbd9e9bba22dbf552f1bbe0ab34685cc), [`51ce5a0`](https://github.com/LedgerHQ/ledger-live/commit/51ce5a05e95dc02ce0eccc5f9d043d556ba43bbf), [`0cf44d5`](https://github.com/LedgerHQ/ledger-live/commit/0cf44d56a449fb0f4448cd6f8e02c880fc47adb2)]:
  - @ledgerhq/types-live@6.132.0-next.0
  - @ledgerhq/hw-app-btc@12.3.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.12.0-next.0
  - @ledgerhq/live-signer-zcash@0.12.0
  - @ledgerhq/wallet-btc@1.2.0

## 1.2.0

### Minor Changes

- [#23955](https://github.com/LedgerHQ/ledger-live/pull/23955) [`03cafaf`](https://github.com/LedgerHQ/ledger-live/commit/03cafaff14567ab3a8ee8495f3da964a7d56683a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@ledgerhq/zcash-utils` to 2.9.0, which ships each native binary in its own optional package. The desktop app now packages only the binaries it runs on (darwin arm64/x64, win32 x64, linux x64) instead of all six.

- [#24488](https://github.com/LedgerHQ/ledger-live/pull/24488) [`3835bab`](https://github.com/LedgerHQ/ledger-live/commit/3835babeb6da9775f5750a2219f480a5422269ab) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: upgrade bs58 to 6.0.0 and bs58check to 4.0.0, drop @types/bs58 and @types/bs58check

- [#24373](https://github.com/LedgerHQ/ledger-live/pull/24373) [`6ab5a87`](https://github.com/LedgerHQ/ledger-live/commit/6ab5a87d796726b2fc38b34862209abf82521f72) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Export the default coin configs from each coin package and wrap them in `ledger-live-common` (ADR-063). `coin-celo` and `coin-cosmos` replace their `celoConfig` and `cosmosConfig` exports, which wrapped the defaults in `ConfigInfo`, with plain typed `celoDefaults` and `cosmosDefaults`; their `features` now use the `status` key instead of `type`, Desmos gets the active status it was missing, and Gonka defaults to a minimum gas price of 1 ngonka

- [#24522](https://github.com/LedgerHQ/ledger-live/pull/24522) [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Import bignumber.js through its default export, the form bignumber.js 11 types support

### Patch Changes

- Updated dependencies [[`b77803f`](https://github.com/LedgerHQ/ledger-live/commit/b77803ffbca90848d55bca56b9d8cd3547464620), [`d701bc7`](https://github.com/LedgerHQ/ledger-live/commit/d701bc7564f9f479e0cc867ef76ec40b73f5c49c), [`d36ed0a`](https://github.com/LedgerHQ/ledger-live/commit/d36ed0a5b624f1842e2ad3a857d502621dfb5fb9), [`3835bab`](https://github.com/LedgerHQ/ledger-live/commit/3835babeb6da9775f5750a2219f480a5422269ab), [`6da9b38`](https://github.com/LedgerHQ/ledger-live/commit/6da9b38e20ae18b9aa3e31d41a155420ace9987b), [`e051c84`](https://github.com/LedgerHQ/ledger-live/commit/e051c84a8486b78327ea49500c38b6e2138bbc21), [`3a0d8aa`](https://github.com/LedgerHQ/ledger-live/commit/3a0d8aa1d4904fa0ccc53528ec092bc32a63dcd4), [`96fac1e`](https://github.com/LedgerHQ/ledger-live/commit/96fac1eb64856beb33cc68594e98c25e8b308898), [`0d83181`](https://github.com/LedgerHQ/ledger-live/commit/0d83181e9a96f55811f2ce5532527739bdb7e62a), [`e186896`](https://github.com/LedgerHQ/ledger-live/commit/e186896213df32feb1e6a80e38f45cf189655866), [`e7b21f8`](https://github.com/LedgerHQ/ledger-live/commit/e7b21f816021dbbe7314ff51bf32cc4d87291b98), [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e), [`d3f59ae`](https://github.com/LedgerHQ/ledger-live/commit/d3f59ae3fc6b9d9240bd81df9f93c1223cb64ddb)]:
  - @ledgerhq/types-live@6.131.0
  - @ledgerhq/ledger-wallet-framework@3.11.0
  - @ledgerhq/hw-app-btc@12.2.0
  - @ledgerhq/wallet-btc@1.2.0
  - @ledgerhq/live-signer-zcash@0.12.0

## 1.2.0-next.0

### Minor Changes

- [#23955](https://github.com/LedgerHQ/ledger-live/pull/23955) [`03cafaf`](https://github.com/LedgerHQ/ledger-live/commit/03cafaff14567ab3a8ee8495f3da964a7d56683a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@ledgerhq/zcash-utils` to 2.9.0, which ships each native binary in its own optional package. The desktop app now packages only the binaries it runs on (darwin arm64/x64, win32 x64, linux x64) instead of all six.

- [#24488](https://github.com/LedgerHQ/ledger-live/pull/24488) [`3835bab`](https://github.com/LedgerHQ/ledger-live/commit/3835babeb6da9775f5750a2219f480a5422269ab) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: upgrade bs58 to 6.0.0 and bs58check to 4.0.0, drop @types/bs58 and @types/bs58check

- [#24373](https://github.com/LedgerHQ/ledger-live/pull/24373) [`6ab5a87`](https://github.com/LedgerHQ/ledger-live/commit/6ab5a87d796726b2fc38b34862209abf82521f72) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Export the default coin configs from each coin package and wrap them in `ledger-live-common` (ADR-063). `coin-celo` and `coin-cosmos` replace their `celoConfig` and `cosmosConfig` exports, which wrapped the defaults in `ConfigInfo`, with plain typed `celoDefaults` and `cosmosDefaults`; their `features` now use the `status` key instead of `type`, Desmos gets the active status it was missing, and Gonka defaults to a minimum gas price of 1 ngonka

- [#24522](https://github.com/LedgerHQ/ledger-live/pull/24522) [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Import bignumber.js through its default export, the form bignumber.js 11 types support

### Patch Changes

- Updated dependencies [[`b77803f`](https://github.com/LedgerHQ/ledger-live/commit/b77803ffbca90848d55bca56b9d8cd3547464620), [`d701bc7`](https://github.com/LedgerHQ/ledger-live/commit/d701bc7564f9f479e0cc867ef76ec40b73f5c49c), [`d36ed0a`](https://github.com/LedgerHQ/ledger-live/commit/d36ed0a5b624f1842e2ad3a857d502621dfb5fb9), [`3835bab`](https://github.com/LedgerHQ/ledger-live/commit/3835babeb6da9775f5750a2219f480a5422269ab), [`6da9b38`](https://github.com/LedgerHQ/ledger-live/commit/6da9b38e20ae18b9aa3e31d41a155420ace9987b), [`e051c84`](https://github.com/LedgerHQ/ledger-live/commit/e051c84a8486b78327ea49500c38b6e2138bbc21), [`3a0d8aa`](https://github.com/LedgerHQ/ledger-live/commit/3a0d8aa1d4904fa0ccc53528ec092bc32a63dcd4), [`96fac1e`](https://github.com/LedgerHQ/ledger-live/commit/96fac1eb64856beb33cc68594e98c25e8b308898), [`0d83181`](https://github.com/LedgerHQ/ledger-live/commit/0d83181e9a96f55811f2ce5532527739bdb7e62a), [`e186896`](https://github.com/LedgerHQ/ledger-live/commit/e186896213df32feb1e6a80e38f45cf189655866), [`e7b21f8`](https://github.com/LedgerHQ/ledger-live/commit/e7b21f816021dbbe7314ff51bf32cc4d87291b98), [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e), [`d3f59ae`](https://github.com/LedgerHQ/ledger-live/commit/d3f59ae3fc6b9d9240bd81df9f93c1223cb64ddb)]:
  - @ledgerhq/types-live@6.131.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.11.0-next.0
  - @ledgerhq/hw-app-btc@12.2.0-next.0
  - @ledgerhq/wallet-btc@1.2.0-next.0
  - @ledgerhq/live-signer-zcash@0.12.0

## 1.1.1

### Patch Changes

- Updated dependencies [[`9907890`](https://github.com/LedgerHQ/ledger-live/commit/9907890790bf8b804d7cc454a067508df0969137), [`8854aff`](https://github.com/LedgerHQ/ledger-live/commit/8854aff9cace72ad17c6d9fd7ee98a4dcd65ecb1), [`77a85a3`](https://github.com/LedgerHQ/ledger-live/commit/77a85a30abe7b42e5f5b4e0478bec14fa39033cf), [`c50f3fa`](https://github.com/LedgerHQ/ledger-live/commit/c50f3fac1c822d61332dbb512b21cdda6bb57210)]:
  - @ledgerhq/types-live@6.130.0
  - @ledgerhq/ledger-wallet-framework@3.10.0
  - @ledgerhq/live-signer-zcash@0.12.0
  - @ledgerhq/wallet-btc@1.1.0

## 1.1.1-next.0

### Patch Changes

- Updated dependencies [[`9907890`](https://github.com/LedgerHQ/ledger-live/commit/9907890790bf8b804d7cc454a067508df0969137), [`8854aff`](https://github.com/LedgerHQ/ledger-live/commit/8854aff9cace72ad17c6d9fd7ee98a4dcd65ecb1), [`77a85a3`](https://github.com/LedgerHQ/ledger-live/commit/77a85a30abe7b42e5f5b4e0478bec14fa39033cf), [`c50f3fa`](https://github.com/LedgerHQ/ledger-live/commit/c50f3fac1c822d61332dbb512b21cdda6bb57210)]:
  - @ledgerhq/types-live@6.130.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.10.0-next.0
  - @ledgerhq/live-signer-zcash@0.12.0
  - @ledgerhq/wallet-btc@1.1.0

## 1.1.0

### Minor Changes

- [#23742](https://github.com/LedgerHQ/ledger-live/pull/23742) [`ed45de0`](https://github.com/LedgerHQ/ledger-live/commit/ed45de0004d46f408dac35d2d7522d7697189288) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Bump `@ledgerhq/zcash-utils` to 2.8.0, built on the stable Zcash crates that set the NU7 mainnet activation height (3543405). A mainnet transaction whose target block is past that height is built under the NU7 branch id, with a 120-block default expiry.

- [#23706](https://github.com/LedgerHQ/ledger-live/pull/23706) [`c43b0f9`](https://github.com/LedgerHQ/ledger-live/commit/c43b0f9ff55c39a5a137e210949419263207d322) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Show the block height of a Zcash operation, label its confirmation count, and show the block height the birthday date resolves to in the private balance flow.

- [#23846](https://github.com/LedgerHQ/ledger-live/pull/23846) [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359) Thanks [@gre-ledger](https://github.com/gre-ledger)! - fix: ship lib and lib-es in the npm tarballs again, which pnpm 11 dropped

### Patch Changes

- Updated dependencies [[`9d96483`](https://github.com/LedgerHQ/ledger-live/commit/9d96483342e32c626abd69143b3cd24a075254bf), [`d37d80e`](https://github.com/LedgerHQ/ledger-live/commit/d37d80e128d89fcd80630fd4ef13c66587e3bebe), [`dd056b8`](https://github.com/LedgerHQ/ledger-live/commit/dd056b8a4c6c7c28879cfb1c44139b2479281987), [`c4b7982`](https://github.com/LedgerHQ/ledger-live/commit/c4b79825af9468fbb8f5325e77e47536d6b392e9), [`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1), [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359), [`9c7d59d`](https://github.com/LedgerHQ/ledger-live/commit/9c7d59d0ffcc72ba746bc20e9ff744db9730503b)]:
  - @ledgerhq/live-signer-zcash@0.12.0
  - @ledgerhq/wallet-btc@1.1.0
  - @ledgerhq/hw-app-btc@12.1.0
  - @ledgerhq/ledger-wallet-framework@3.9.0
  - @ledgerhq/types-live@6.129.0

## 1.1.0-next.0

### Minor Changes

- [#23742](https://github.com/LedgerHQ/ledger-live/pull/23742) [`ed45de0`](https://github.com/LedgerHQ/ledger-live/commit/ed45de0004d46f408dac35d2d7522d7697189288) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Bump `@ledgerhq/zcash-utils` to 2.8.0, built on the stable Zcash crates that set the NU7 mainnet activation height (3543405). A mainnet transaction whose target block is past that height is built under the NU7 branch id, with a 120-block default expiry.

- [#23706](https://github.com/LedgerHQ/ledger-live/pull/23706) [`c43b0f9`](https://github.com/LedgerHQ/ledger-live/commit/c43b0f9ff55c39a5a137e210949419263207d322) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Show the block height of a Zcash operation, label its confirmation count, and show the block height the birthday date resolves to in the private balance flow.

- [#23846](https://github.com/LedgerHQ/ledger-live/pull/23846) [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359) Thanks [@gre-ledger](https://github.com/gre-ledger)! - fix: ship lib and lib-es in the npm tarballs again, which pnpm 11 dropped

### Patch Changes

- Updated dependencies [[`9d96483`](https://github.com/LedgerHQ/ledger-live/commit/9d96483342e32c626abd69143b3cd24a075254bf), [`d37d80e`](https://github.com/LedgerHQ/ledger-live/commit/d37d80e128d89fcd80630fd4ef13c66587e3bebe), [`dd056b8`](https://github.com/LedgerHQ/ledger-live/commit/dd056b8a4c6c7c28879cfb1c44139b2479281987), [`c4b7982`](https://github.com/LedgerHQ/ledger-live/commit/c4b79825af9468fbb8f5325e77e47536d6b392e9), [`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1), [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359), [`9c7d59d`](https://github.com/LedgerHQ/ledger-live/commit/9c7d59d0ffcc72ba746bc20e9ff744db9730503b)]:
  - @ledgerhq/live-signer-zcash@0.12.0-next.0
  - @ledgerhq/wallet-btc@1.1.0-next.0
  - @ledgerhq/hw-app-btc@12.1.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.9.0-next.0
  - @ledgerhq/types-live@6.129.0-next.0

## 1.0.0

### Major Changes

- [#22964](https://github.com/LedgerHQ/ledger-live/pull/22964) [`ca063c4`](https://github.com/LedgerHQ/ledger-live/commit/ca063c4cfad79f12118c5af5bc0ef323857f90bd) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(wallet-btc): inject `logger` instead of using `@ledgerhq/logs`

### Minor Changes

- [#23343](https://github.com/LedgerHQ/ledger-live/pull/23343) [`9365d3a`](https://github.com/LedgerHQ/ledger-live/commit/9365d3ad499ac5c80d445e7816c30adbfe05ffd8) Thanks [@cted-ledger](https://github.com/cted-ledger)! - take the zcash network from the account's currency instead of the zaino url, and pass it to the device signer for transparent sends; the viewing-key export keeps the testnet coin type (1') instead of rejecting it

- [#23215](https://github.com/LedgerHQ/ledger-live/pull/23215) [`ef80ee4`](https://github.com/LedgerHQ/ledger-live/commit/ef80ee46eb564e25090ce08d8459212739158117) Thanks [@cted-ledger](https://github.com/cted-ledger)! - add a transparent-only mode to the zcash bridge, for hosts that do not run the shielded engine

- [#23324](https://github.com/LedgerHQ/ledger-live/pull/23324) [`6b23210`](https://github.com/LedgerHQ/ledger-live/commit/6b232105c11b8b8b86fcb6a715ef19a0b3453b74) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Select the Zcash fee per logical action from the account's synced height and network (ZIP 2009): 1,000 zatoshis from mainnet height 3,590,000 (applied 100 blocks late) and on test networks, 5,000 before. Bump `@ledgerhq/zcash-utils` to 2.7.0. The mainnet switch height can be delayed or the switch disabled through the optional `zip2009.mainnetHeight` coin-config setting (`null` disables it); a height below 3,590,000 is raised to it.

- [#23390](https://github.com/LedgerHQ/ledger-live/pull/23390) [`6582ee6`](https://github.com/LedgerHQ/ledger-live/commit/6582ee63c343dd6f64a31068fddd038af4eb9bd2) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Sign Nano S transparent Zcash sends through the legacy device path when the shielded engine is on, with the inputs and fee shown at review.

- [#23108](https://github.com/LedgerHQ/ledger-live/pull/23108) [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@noble/curves` to 2.4.0 (ESM-only), use the `.js` subpaths and pass `prehash: false` where a digest is signed or verified. CommonJS consumers of `@ledgerhq/hw-app-btc` and `@ledgerhq/wallet-btc` now need Node >= 20.19 (synchronous `require(esm)`) or an ESM-capable bundler.

### Patch Changes

- Updated dependencies [[`9365d3a`](https://github.com/LedgerHQ/ledger-live/commit/9365d3ad499ac5c80d445e7816c30adbfe05ffd8), [`e505c53`](https://github.com/LedgerHQ/ledger-live/commit/e505c537cafd5f44999f201cfe0a773a90cf5671), [`b599cb2`](https://github.com/LedgerHQ/ledger-live/commit/b599cb25afbc5ce2dbdcd0cc1b6126a49bba8068), [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`ca063c4`](https://github.com/LedgerHQ/ledger-live/commit/ca063c4cfad79f12118c5af5bc0ef323857f90bd), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97)]:
  - @ledgerhq/live-signer-zcash@0.11.0
  - @ledgerhq/hw-app-btc@12.0.0
  - @ledgerhq/wallet-btc@1.0.0
  - @ledgerhq/ledger-wallet-framework@3.8.0
  - @ledgerhq/types-live@6.128.0

## 1.0.0-next.1

### Patch Changes

- Updated dependencies [[`e505c53`](https://github.com/LedgerHQ/ledger-live/commit/e505c537cafd5f44999f201cfe0a773a90cf5671)]:
  - @ledgerhq/live-signer-zcash@0.11.0-next.1

## 1.0.0-next.0

### Major Changes

- [#22964](https://github.com/LedgerHQ/ledger-live/pull/22964) [`ca063c4`](https://github.com/LedgerHQ/ledger-live/commit/ca063c4cfad79f12118c5af5bc0ef323857f90bd) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(wallet-btc): inject `logger` instead of using `@ledgerhq/logs`

### Minor Changes

- [#23343](https://github.com/LedgerHQ/ledger-live/pull/23343) [`9365d3a`](https://github.com/LedgerHQ/ledger-live/commit/9365d3ad499ac5c80d445e7816c30adbfe05ffd8) Thanks [@cted-ledger](https://github.com/cted-ledger)! - take the zcash network from the account's currency instead of the zaino url, and pass it to the device signer for transparent sends; the viewing-key export keeps the testnet coin type (1') instead of rejecting it

- [#23215](https://github.com/LedgerHQ/ledger-live/pull/23215) [`ef80ee4`](https://github.com/LedgerHQ/ledger-live/commit/ef80ee46eb564e25090ce08d8459212739158117) Thanks [@cted-ledger](https://github.com/cted-ledger)! - add a transparent-only mode to the zcash bridge, for hosts that do not run the shielded engine

- [#23324](https://github.com/LedgerHQ/ledger-live/pull/23324) [`6b23210`](https://github.com/LedgerHQ/ledger-live/commit/6b232105c11b8b8b86fcb6a715ef19a0b3453b74) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Select the Zcash fee per logical action from the account's synced height and network (ZIP 2009): 1,000 zatoshis from mainnet height 3,590,000 (applied 100 blocks late) and on test networks, 5,000 before. Bump `@ledgerhq/zcash-utils` to 2.7.0. The mainnet switch height can be delayed or the switch disabled through the optional `zip2009.mainnetHeight` coin-config setting (`null` disables it); a height below 3,590,000 is raised to it.

- [#23390](https://github.com/LedgerHQ/ledger-live/pull/23390) [`6582ee6`](https://github.com/LedgerHQ/ledger-live/commit/6582ee63c343dd6f64a31068fddd038af4eb9bd2) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Sign Nano S transparent Zcash sends through the legacy device path when the shielded engine is on, with the inputs and fee shown at review.

- [#23108](https://github.com/LedgerHQ/ledger-live/pull/23108) [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@noble/curves` to 2.4.0 (ESM-only), use the `.js` subpaths and pass `prehash: false` where a digest is signed or verified. CommonJS consumers of `@ledgerhq/hw-app-btc` and `@ledgerhq/wallet-btc` now need Node >= 20.19 (synchronous `require(esm)`) or an ESM-capable bundler.

### Patch Changes

- Updated dependencies [[`9365d3a`](https://github.com/LedgerHQ/ledger-live/commit/9365d3ad499ac5c80d445e7816c30adbfe05ffd8), [`b599cb2`](https://github.com/LedgerHQ/ledger-live/commit/b599cb25afbc5ce2dbdcd0cc1b6126a49bba8068), [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`ca063c4`](https://github.com/LedgerHQ/ledger-live/commit/ca063c4cfad79f12118c5af5bc0ef323857f90bd), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97)]:
  - @ledgerhq/live-signer-zcash@0.11.0-next.0
  - @ledgerhq/hw-app-btc@12.0.0-next.0
  - @ledgerhq/wallet-btc@1.0.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.8.0-next.0
  - @ledgerhq/types-live@6.128.0-next.0

## 0.11.0

### Minor Changes

- [#23189](https://github.com/LedgerHQ/ledger-live/pull/23189) [`3f4e740`](https://github.com/LedgerHQ/ledger-live/commit/3f4e7409bfc66544165598c23cbc826001632f16) Thanks [@cted-ledger](https://github.com/cted-ledger)! - validate and classify zcash recipients per network, mainnet or testnet, and reject a transparent recipient with a bad checksum in the transaction status

- [#22781](https://github.com/LedgerHQ/ledger-live/pull/22781) [`6c8bd31`](https://github.com/LedgerHQ/ledger-live/commit/6c8bd31900a6b6aa8987cc82f6d907bbc3611fc1) Thanks [@KVNLS](https://github.com/KVNLS)! - Build the desktop renderer as a web target instead of `electron-renderer`: Node builtins resolve at build time rather than as runtime `require()` calls, and the bundle has no externals. `process` reads are supplied from a snapshot captured in main at startup, deliberately not a `process/browser` polyfill, which would report `platform === "browser"`. A build-time guard fails the build on an unguarded `process` read or a bare `setImmediate`/`clearImmediate`, rather than letting it surface as a runtime crash.

  ZCash shielded sync receives its IPC channel through `setZCashIpcRenderer` instead of reaching for `electron`; the desktop app supplies it over the preload bridge.

  `@ledgerhq/transaction-observability` (the dApp intent's `app_version`) and `@features/platform-device-action-content` (the E2E animation switch) read `process.env` directly instead of `globalThis.process`, which the web-target renderer does not have.

### Patch Changes

- Updated dependencies [[`6e3211f`](https://github.com/LedgerHQ/ledger-live/commit/6e3211f6c887211d4ecfbf58d909f49c31df6179), [`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4)]:
  - @ledgerhq/wallet-btc@0.7.0
  - @ledgerhq/ledger-wallet-framework@3.7.0
  - @ledgerhq/types-live@6.127.0
  - @ledgerhq/live-signer-zcash@0.10.0

## 0.11.0-next.1

### Patch Changes

- Updated dependencies [[`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.1
  - @ledgerhq/wallet-btc@0.7.0-next.0

## 0.11.0-next.0

### Minor Changes

- [#23189](https://github.com/LedgerHQ/ledger-live/pull/23189) [`3f4e740`](https://github.com/LedgerHQ/ledger-live/commit/3f4e7409bfc66544165598c23cbc826001632f16) Thanks [@cted-ledger](https://github.com/cted-ledger)! - validate and classify zcash recipients per network, mainnet or testnet, and reject a transparent recipient with a bad checksum in the transaction status

- [#22781](https://github.com/LedgerHQ/ledger-live/pull/22781) [`6c8bd31`](https://github.com/LedgerHQ/ledger-live/commit/6c8bd31900a6b6aa8987cc82f6d907bbc3611fc1) Thanks [@KVNLS](https://github.com/KVNLS)! - Build the desktop renderer as a web target instead of `electron-renderer`: Node builtins resolve at build time rather than as runtime `require()` calls, and the bundle has no externals. `process` reads are supplied from a snapshot captured in main at startup, deliberately not a `process/browser` polyfill, which would report `platform === "browser"`. A build-time guard fails the build on an unguarded `process` read or a bare `setImmediate`/`clearImmediate`, rather than letting it surface as a runtime crash.

  ZCash shielded sync receives its IPC channel through `setZCashIpcRenderer` instead of reaching for `electron`; the desktop app supplies it over the preload bridge.

  `@ledgerhq/transaction-observability` (the dApp intent's `app_version`) and `@features/platform-device-action-content` (the E2E animation switch) read `process.env` directly instead of `globalThis.process`, which the web-target renderer does not have.

### Patch Changes

- Updated dependencies [[`6e3211f`](https://github.com/LedgerHQ/ledger-live/commit/6e3211f6c887211d4ecfbf58d909f49c31df6179), [`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4)]:
  - @ledgerhq/wallet-btc@0.7.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.0
  - @ledgerhq/types-live@6.127.0-next.0
  - @ledgerhq/live-signer-zcash@0.10.0

## 0.10.0

### Minor Changes

- [#22561](https://github.com/LedgerHQ/ledger-live/pull/22561) [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae) Thanks [@YazhuEth](https://github.com/YazhuEth)! - chore(currency): drop `CryptoCurrency#bitcoinLikeInfo`

  coin-bitcoin now reads the xpub version from its own `getNetworkParameters`, and coin-zcash from a local `ZCASH_XPUB_VERSION` constant. The unused `bitcoinLikeInfo` field (and `BitcoinLikeInfoSchema`) is removed from the currency types and registry.

- [#21953](https://github.com/LedgerHQ/ledger-live/pull/21953) [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/live-config`, `@ledgerhq/live-env`, `@ledgerhq/live-currency-format`,
  `@ledgerhq/domain-service` and `@ledgerhq/evm-tools` from npm instead of the workspace — they
  now live in the `ts-libs` repository. No API change.

- [#22589](https://github.com/LedgerHQ/ledger-live/pull/22589) [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5) Thanks [@qperrot](https://github.com/qperrot)! - Remove the deprecated `CryptoCurrency.explorerId` field and the `LedgerExplorerId` type.

  Bitcoin-like explorer ids now come from the coin config (`config_currency_<id>.explorerId`), as EVM already does, and fall back to the currency id. The config is passed in rather than read from a module global: `toWalletBtcCurrency`, `walletBtcCurrencyById` and coin-bitcoin's `blockchainBaseURL` take it as an argument, the sync functions take the `coinConfig` resolver given to `createBridges`, and `assignFromAccountRaw` is now built with `makeAssignFromAccountRaw(coinConfig)`.

  Adds `config_currency_bitcoin_testnet`, `config_currency_bitcoin_regtest` and `config_currency_zcash_regtest` so every bitcoin-like currency resolves a config entry.

- [#22542](https://github.com/LedgerHQ/ledger-live/pull/22542) [`06c71d1`](https://github.com/LedgerHQ/ledger-live/commit/06c71d101fb664b50202f6ddc09dd1abbcb76a3a) Thanks [@cted-ledger](https://github.com/cted-ledger)! - fix(coin-zcash): read endpoints and sync limits from the injected coin config

  The module no longer keeps configuration in module state. `createBridges` takes a `Context`
  (ADR-019) and sync, sign and broadcast resolve `config_currency_zcash` from `context.config()` on
  every call. The endpoints `zaino.url` and `explorer.url` are required and default to the production
  hosts in `config_currency_zcash`; the mainnet Zaino default no longer points at staging. The
  optional tuning fields `zaino.timeoutMs` (per-chunk budget of the automatic shielded sync) and
  `zaino.batchSize` (blocks per shielded scan chunk) fall back to the module defaults
  `ZCASH_SHIELDED_CHUNK_TIMEOUT_MS` (120000) and `ZCASH_SHIELDED_BATCH_SIZE` (5000). All of them can
  be changed through the remote currency config without a release. The explorer (`explorer.url` and
  the optional `explorerId`) is bound from the config at use, so deserialization stays config-free.

  Breaking: `createBridges(signerContext, context)` takes a `Context` instead of a config getter;
  `setCoinConfig`, `getCoinConfig`, `setZainoGrpcUrl`, the `ZCASH_GRPC_URL_*` and
  `ZCASH_AUTO_SYNC_TIMEOUT_MS` constants and the `ZcashConfigInfo` type are removed in favour of
  `ZcashCoinConfig` / `ZcashContext`.

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d)]:
  - @ledgerhq/types-live@6.126.0
  - @ledgerhq/ledger-wallet-framework@3.6.0
  - @ledgerhq/live-signer-zcash@0.10.0
  - @ledgerhq/wallet-btc@0.6.0

## 0.10.0-next.0

### Minor Changes

- [#22561](https://github.com/LedgerHQ/ledger-live/pull/22561) [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae) Thanks [@YazhuEth](https://github.com/YazhuEth)! - chore(currency): drop `CryptoCurrency#bitcoinLikeInfo`

  coin-bitcoin now reads the xpub version from its own `getNetworkParameters`, and coin-zcash from a local `ZCASH_XPUB_VERSION` constant. The unused `bitcoinLikeInfo` field (and `BitcoinLikeInfoSchema`) is removed from the currency types and registry.

- [#21953](https://github.com/LedgerHQ/ledger-live/pull/21953) [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/live-config`, `@ledgerhq/live-env`, `@ledgerhq/live-currency-format`,
  `@ledgerhq/domain-service` and `@ledgerhq/evm-tools` from npm instead of the workspace — they
  now live in the `ts-libs` repository. No API change.

- [#22589](https://github.com/LedgerHQ/ledger-live/pull/22589) [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5) Thanks [@qperrot](https://github.com/qperrot)! - Remove the deprecated `CryptoCurrency.explorerId` field and the `LedgerExplorerId` type.

  Bitcoin-like explorer ids now come from the coin config (`config_currency_<id>.explorerId`), as EVM already does, and fall back to the currency id. The config is passed in rather than read from a module global: `toWalletBtcCurrency`, `walletBtcCurrencyById` and coin-bitcoin's `blockchainBaseURL` take it as an argument, the sync functions take the `coinConfig` resolver given to `createBridges`, and `assignFromAccountRaw` is now built with `makeAssignFromAccountRaw(coinConfig)`.

  Adds `config_currency_bitcoin_testnet`, `config_currency_bitcoin_regtest` and `config_currency_zcash_regtest` so every bitcoin-like currency resolves a config entry.

- [#22542](https://github.com/LedgerHQ/ledger-live/pull/22542) [`06c71d1`](https://github.com/LedgerHQ/ledger-live/commit/06c71d101fb664b50202f6ddc09dd1abbcb76a3a) Thanks [@cted-ledger](https://github.com/cted-ledger)! - fix(coin-zcash): read endpoints and sync limits from the injected coin config

  The module no longer keeps configuration in module state. `createBridges` takes a `Context`
  (ADR-019) and sync, sign and broadcast resolve `config_currency_zcash` from `context.config()` on
  every call. The endpoints `zaino.url` and `explorer.url` are required and default to the production
  hosts in `config_currency_zcash`; the mainnet Zaino default no longer points at staging. The
  optional tuning fields `zaino.timeoutMs` (per-chunk budget of the automatic shielded sync) and
  `zaino.batchSize` (blocks per shielded scan chunk) fall back to the module defaults
  `ZCASH_SHIELDED_CHUNK_TIMEOUT_MS` (120000) and `ZCASH_SHIELDED_BATCH_SIZE` (5000). All of them can
  be changed through the remote currency config without a release. The explorer (`explorer.url` and
  the optional `explorerId`) is bound from the config at use, so deserialization stays config-free.

  Breaking: `createBridges(signerContext, context)` takes a `Context` instead of a config getter;
  `setCoinConfig`, `getCoinConfig`, `setZainoGrpcUrl`, the `ZCASH_GRPC_URL_*` and
  `ZCASH_AUTO_SYNC_TIMEOUT_MS` constants and the `ZcashConfigInfo` type are removed in favour of
  `ZcashCoinConfig` / `ZcashContext`.

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d)]:
  - @ledgerhq/types-live@6.126.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.6.0-next.0
  - @ledgerhq/live-signer-zcash@0.10.0
  - @ledgerhq/wallet-btc@0.6.0

## 0.9.0

### Minor Changes

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

- [#22064](https://github.com/LedgerHQ/ledger-live/pull/22064) [`d1d0d90`](https://github.com/LedgerHQ/ledger-live/commit/d1d0d90e75648ae1127b5682a6244b8e8268550a) Thanks [@semeano](https://github.com/semeano)! - Show a Zcash shielding transaction as private and display its shielded destination instead of its transparent change, masking that destination under discreet mode

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`29ce771`](https://github.com/LedgerHQ/ledger-live/commit/29ce7712ce93cd27afa97eda2d14a0ff066551fb), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @ledgerhq/ledger-wallet-framework@3.5.0
  - @ledgerhq/types-live@6.125.0
  - @ledgerhq/live-env@4.1.0
  - @ledgerhq/wallet-btc@0.6.0
  - @ledgerhq/live-signer-zcash@0.10.0

## 0.9.0-next.0

### Minor Changes

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

- [#22064](https://github.com/LedgerHQ/ledger-live/pull/22064) [`d1d0d90`](https://github.com/LedgerHQ/ledger-live/commit/d1d0d90e75648ae1127b5682a6244b8e8268550a) Thanks [@semeano](https://github.com/semeano)! - Show a Zcash shielding transaction as private and display its shielded destination instead of its transparent change, masking that destination under discreet mode

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`29ce771`](https://github.com/LedgerHQ/ledger-live/commit/29ce7712ce93cd27afa97eda2d14a0ff066551fb), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @ledgerhq/ledger-wallet-framework@3.5.0-next.0
  - @ledgerhq/types-live@6.125.0-next.0
  - @ledgerhq/live-env@4.1.0-next.0
  - @ledgerhq/wallet-btc@0.6.0-next.0
  - @ledgerhq/live-signer-zcash@0.10.0

## 0.8.0

### Minor Changes

- [#21962](https://github.com/LedgerHQ/ledger-live/pull/21962) [`f5d0da5`](https://github.com/LedgerHQ/ledger-live/commit/f5d0da5d43ff492175433453b08533cee324c6e2) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Report both legs of a Zcash self-transfer in the account history

  A send from the private balance to the account's own transparent address — the send flow's "Self transfer" — appeared only as `Received`, never as `Sent`. One such transaction is recorded by both sync legs: the transparent leg credits the address it paid (`IN`), the shielded leg debits the pool it drained (`SHIELDED_TX_*_OUT`). `reconcileLegOperations` collapsed the two records by transaction hash alone, on the premise that a hash both legs see is one event seen twice, and kept the transparent one — dropping the send.

  Two records of one transaction are now collapsed only when they report the same direction, which is the case the rule exists for: a shield paying someone else, where the transparent leg debits the UTXOs and the shielded leg sees, through the outgoing viewing key, the note it created. Opposite directions are the two legs of a movement between the account's own pools and both are kept, the way a self-send is reported elsewhere. A superseded record's memo is still copied onto the transparent operation that replaces it; a record that survives keeps its own memo, so it is not printed on both rows.

  The same collapse hid the `Received` leg of the mirror flow, shielding to the account's own shielded address.

- [#22037](https://github.com/LedgerHQ/ledger-live/pull/22037) [`fecfcf7`](https://github.com/LedgerHQ/ledger-live/commit/fecfcf7570ed70213a9c0e32c2822b4eb057eb03) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Fix an incorrect fee on shielded and shielding sends when the leftover change was small enough to
  be folded into the fee instead of kept as a change note.

  The native Ironwood (V6) builder requires the fee to equal the exact ZIP-317 fee for the resulting
  spend/output layout; a fee larger than that by even a few zatoshis is rejected at build time. Coin
  selection no longer absorbs a small residual into the fee for any flow that builds through that
  builder ("shielded", "shielded-to-transparent", "transparent-to-shielded") -- the residual now
  always stays as change.

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`30828c2`](https://github.com/LedgerHQ/ledger-live/commit/30828c22cc44c9929d7eda782e9d559a9e0145c3), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/types-live@6.124.0
  - @ledgerhq/wallet-btc@0.5.0
  - @ledgerhq/ledger-wallet-framework@3.4.0
  - @ledgerhq/live-signer-zcash@0.10.0

## 0.8.0-next.0

### Minor Changes

- [#21962](https://github.com/LedgerHQ/ledger-live/pull/21962) [`f5d0da5`](https://github.com/LedgerHQ/ledger-live/commit/f5d0da5d43ff492175433453b08533cee324c6e2) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Report both legs of a Zcash self-transfer in the account history

  A send from the private balance to the account's own transparent address — the send flow's "Self transfer" — appeared only as `Received`, never as `Sent`. One such transaction is recorded by both sync legs: the transparent leg credits the address it paid (`IN`), the shielded leg debits the pool it drained (`SHIELDED_TX_*_OUT`). `reconcileLegOperations` collapsed the two records by transaction hash alone, on the premise that a hash both legs see is one event seen twice, and kept the transparent one — dropping the send.

  Two records of one transaction are now collapsed only when they report the same direction, which is the case the rule exists for: a shield paying someone else, where the transparent leg debits the UTXOs and the shielded leg sees, through the outgoing viewing key, the note it created. Opposite directions are the two legs of a movement between the account's own pools and both are kept, the way a self-send is reported elsewhere. A superseded record's memo is still copied onto the transparent operation that replaces it; a record that survives keeps its own memo, so it is not printed on both rows.

  The same collapse hid the `Received` leg of the mirror flow, shielding to the account's own shielded address.

- [#22037](https://github.com/LedgerHQ/ledger-live/pull/22037) [`fecfcf7`](https://github.com/LedgerHQ/ledger-live/commit/fecfcf7570ed70213a9c0e32c2822b4eb057eb03) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Fix an incorrect fee on shielded and shielding sends when the leftover change was small enough to
  be folded into the fee instead of kept as a change note.

  The native Ironwood (V6) builder requires the fee to equal the exact ZIP-317 fee for the resulting
  spend/output layout; a fee larger than that by even a few zatoshis is rejected at build time. Coin
  selection no longer absorbs a small residual into the fee for any flow that builds through that
  builder ("shielded", "shielded-to-transparent", "transparent-to-shielded") -- the residual now
  always stays as change.

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`30828c2`](https://github.com/LedgerHQ/ledger-live/commit/30828c22cc44c9929d7eda782e9d559a9e0145c3), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/types-live@6.124.0-next.0
  - @ledgerhq/wallet-btc@0.5.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.4.0-next.0
  - @ledgerhq/live-signer-zcash@0.10.0

## 0.7.0

### Minor Changes

- [#21355](https://github.com/LedgerHQ/ledger-live/pull/21355) [`fc74af8`](https://github.com/LedgerHQ/ledger-live/commit/fc74af8db6038afd89c64de356e67fe9ba4811a0) Thanks [@semeano](https://github.com/semeano)! - Offer the Zcash memo only to shielded recipients. A memo travels in a shielded output, so a transparent recipient could never receive one, yet the send flow showed the input for every Zcash address and made the user fill or skip it. Send descriptors can now distinguish static memo support from recipient-specific visibility, and a memo left over from an earlier shielded recipient is dropped when the recipient turns transparent, so it can no longer reach the transaction builder.

- [#21355](https://github.com/LedgerHQ/ledger-live/pull/21355) [`5c23a76`](https://github.com/LedgerHQ/ledger-live/commit/5c23a7694a8304727c13d7383979d6a0660b1596) Thanks [@semeano](https://github.com/semeano)! - Reject a Zcash memo exceeding the ZIP-302 512-byte limit in getTransactionStatus

- [#21502](https://github.com/LedgerHQ/ledger-live/pull/21502) [`86fdaa1`](https://github.com/LedgerHQ/ledger-live/commit/86fdaa1929eeaf42d6d3765ce206758f0422c631) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Bound transparent-input and Ironwood-note selection to the device's per-PCZT ceilings on both pools, so a send from an account holding more UTXOs or notes than the device can sign in one PCZT no longer produces an unsignable transaction. A send whose full balance covers the requested amount but whose device-safe selection does not now reports a distinct, actionable error instead of a plain insufficient-balance one.

- [#21388](https://github.com/LedgerHQ/ledger-live/pull/21388) [`51a3d3e`](https://github.com/LedgerHQ/ledger-live/commit/51a3d3ef013a9310ed943a17a33ba69ea8d79a6d) Thanks [@pawell24](https://github.com/pawell24)! - Fix a transparent↔shielded transaction (shielding or de-shielding) being recorded twice in `account.operations` — once by the transparent leg's sync and once by the shielded leg's, for the same transaction hash. `reconcileLegOperations` now keeps only the transparent leg's record when both legs see the same hash.

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`0152cad`](https://github.com/LedgerHQ/ledger-live/commit/0152cade87e061bb2b56fd71f8a404c3dfed21e0), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783), [`6656f90`](https://github.com/LedgerHQ/ledger-live/commit/6656f90769c3419e1f121c0c2368eab4566e48ba)]:
  - @ledgerhq/types-live@6.123.0
  - @ledgerhq/ledger-wallet-framework@3.3.0
  - @ledgerhq/live-env@4.0.0
  - @ledgerhq/wallet-btc@0.4.0
  - @ledgerhq/live-signer-zcash@0.10.0

## 0.7.0-next.0

### Minor Changes

- [#21355](https://github.com/LedgerHQ/ledger-live/pull/21355) [`fc74af8`](https://github.com/LedgerHQ/ledger-live/commit/fc74af8db6038afd89c64de356e67fe9ba4811a0) Thanks [@semeano](https://github.com/semeano)! - Offer the Zcash memo only to shielded recipients. A memo travels in a shielded output, so a transparent recipient could never receive one, yet the send flow showed the input for every Zcash address and made the user fill or skip it. Send descriptors can now distinguish static memo support from recipient-specific visibility, and a memo left over from an earlier shielded recipient is dropped when the recipient turns transparent, so it can no longer reach the transaction builder.

- [#21355](https://github.com/LedgerHQ/ledger-live/pull/21355) [`5c23a76`](https://github.com/LedgerHQ/ledger-live/commit/5c23a7694a8304727c13d7383979d6a0660b1596) Thanks [@semeano](https://github.com/semeano)! - Reject a Zcash memo exceeding the ZIP-302 512-byte limit in getTransactionStatus

- [#21502](https://github.com/LedgerHQ/ledger-live/pull/21502) [`86fdaa1`](https://github.com/LedgerHQ/ledger-live/commit/86fdaa1929eeaf42d6d3765ce206758f0422c631) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Bound transparent-input and Ironwood-note selection to the device's per-PCZT ceilings on both pools, so a send from an account holding more UTXOs or notes than the device can sign in one PCZT no longer produces an unsignable transaction. A send whose full balance covers the requested amount but whose device-safe selection does not now reports a distinct, actionable error instead of a plain insufficient-balance one.

- [#21388](https://github.com/LedgerHQ/ledger-live/pull/21388) [`51a3d3e`](https://github.com/LedgerHQ/ledger-live/commit/51a3d3ef013a9310ed943a17a33ba69ea8d79a6d) Thanks [@pawell24](https://github.com/pawell24)! - Fix a transparent↔shielded transaction (shielding or de-shielding) being recorded twice in `account.operations` — once by the transparent leg's sync and once by the shielded leg's, for the same transaction hash. `reconcileLegOperations` now keeps only the transparent leg's record when both legs see the same hash.

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`0152cad`](https://github.com/LedgerHQ/ledger-live/commit/0152cade87e061bb2b56fd71f8a404c3dfed21e0), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783), [`6656f90`](https://github.com/LedgerHQ/ledger-live/commit/6656f90769c3419e1f121c0c2368eab4566e48ba)]:
  - @ledgerhq/types-live@6.123.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.3.0-next.0
  - @ledgerhq/live-env@4.0.0-next.0
  - @ledgerhq/wallet-btc@0.4.0-next.0
  - @ledgerhq/live-signer-zcash@0.10.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
