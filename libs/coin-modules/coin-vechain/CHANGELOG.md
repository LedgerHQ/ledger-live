# @ledgerhq/coin-evm

## 4.7.0-next.0

### Minor Changes

- [#25152](https://github.com/LedgerHQ/ledger-live/pull/25152) [`74d373c`](https://github.com/LedgerHQ/ledger-live/commit/74d373cbe30030d37297ac1f074c37aa04d3a4d9) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Report the VeChain fee in VTHO with its payer: `getBlock` and `listOperations` set `feesAsset`, and `listOperations` sets the receipt's gas payer and the fee on every operation

- [#25179](https://github.com/LedgerHQ/ledger-live/pull/25179) [`347dbb6`](https://github.com/LedgerHQ/ledger-live/commit/347dbb6c160a61827cfe69b7568426399ee56ae0) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump ts-libs packages (`@ledgerhq/live-network` 3.4.1, `@ledgerhq/ledger-key-ring-protocol` 1.2.2, `@ledgerhq/domain-service` 1.10.1, `@ledgerhq/evm-tools` 2.1.1), `axios` to 1.21.1 and `ws` to 8.23.0.

- [#25143](https://github.com/LedgerHQ/ledger-live/pull/25143) [`114ab5f`](https://github.com/LedgerHQ/ledger-live/commit/114ab5f12a49550b01305bd131db441c472b230c) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Remove unused dependencies

- [#24976](https://github.com/LedgerHQ/ledger-live/pull/24976) [`e516034`](https://github.com/LedgerHQ/ledger-live/commit/e5160345b50c0dc9e7c490da72d641c631d2ef7f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove unused lodash, invariant, prop-types and @types dependencies, and stop relying on the global React namespace in types-live

### Patch Changes

- Updated dependencies [[`081c422`](https://github.com/LedgerHQ/ledger-live/commit/081c422494180f04d0fbaf9de4d59370d7927863), [`a869e8b`](https://github.com/LedgerHQ/ledger-live/commit/a869e8b37d098ba06c01d36516ad7a6abb9aa0a5), [`8fbb9be`](https://github.com/LedgerHQ/ledger-live/commit/8fbb9beb39ff3ed1d1051d7df0b3e31a809f21f7), [`347dbb6`](https://github.com/LedgerHQ/ledger-live/commit/347dbb6c160a61827cfe69b7568426399ee56ae0), [`dc0e3ad`](https://github.com/LedgerHQ/ledger-live/commit/dc0e3ad24843961f7f71772b288c2dba473e93b0), [`c80f5de`](https://github.com/LedgerHQ/ledger-live/commit/c80f5de17b263d8e111ddd3b3247b04f7b9a687a), [`90db489`](https://github.com/LedgerHQ/ledger-live/commit/90db48910c3525f69fcef5a3644b666febd6a434), [`4ea6c56`](https://github.com/LedgerHQ/ledger-live/commit/4ea6c566069a55a0345df95add6dc62e37a30b01), [`90af53f`](https://github.com/LedgerHQ/ledger-live/commit/90af53fdcab2448e07ced5f4cc8d37efad261c6b), [`14ab34d`](https://github.com/LedgerHQ/ledger-live/commit/14ab34dbbf4c1768fcdc8928f6db43d9ec58f10b), [`2959603`](https://github.com/LedgerHQ/ledger-live/commit/29596039c7129ac7a5dd216e1f1c172936bed43b), [`2cdf737`](https://github.com/LedgerHQ/ledger-live/commit/2cdf737ce9d268e248253d1f98bd614c0e30da3f), [`b004476`](https://github.com/LedgerHQ/ledger-live/commit/b0044764e765d48ff2edabb567a6e71dbd820276)]:
  - @ledgerhq/ledger-wallet-framework@3.13.0-next.0

## 4.6.0

### Minor Changes

- [#24605](https://github.com/LedgerHQ/ledger-live/pull/24605) [`0990a44`](https://github.com/LedgerHQ/ledger-live/commit/0990a44e70cf7798925fae0ffd49316ce0acbd84) Thanks [@gre-ledger](https://github.com/gre-ledger)! - fix(coin-vechain): `isAccountEmpty` no longer throws on an account with an empty `subAccounts`

### Patch Changes

- Updated dependencies [[`49de732`](https://github.com/LedgerHQ/ledger-live/commit/49de7327915d876c4a98826d561705171c41d2d2), [`51ce5a0`](https://github.com/LedgerHQ/ledger-live/commit/51ce5a05e95dc02ce0eccc5f9d043d556ba43bbf), [`0cf44d5`](https://github.com/LedgerHQ/ledger-live/commit/0cf44d56a449fb0f4448cd6f8e02c880fc47adb2)]:
  - @ledgerhq/ledger-wallet-framework@3.12.0

## 4.6.0-next.0

### Minor Changes

- [#24605](https://github.com/LedgerHQ/ledger-live/pull/24605) [`0990a44`](https://github.com/LedgerHQ/ledger-live/commit/0990a44e70cf7798925fae0ffd49316ce0acbd84) Thanks [@gre-ledger](https://github.com/gre-ledger)! - fix(coin-vechain): `isAccountEmpty` no longer throws on an account with an empty `subAccounts`

### Patch Changes

- Updated dependencies [[`49de732`](https://github.com/LedgerHQ/ledger-live/commit/49de7327915d876c4a98826d561705171c41d2d2), [`51ce5a0`](https://github.com/LedgerHQ/ledger-live/commit/51ce5a05e95dc02ce0eccc5f9d043d556ba43bbf), [`0cf44d5`](https://github.com/LedgerHQ/ledger-live/commit/0cf44d56a449fb0f4448cd6f8e02c880fc47adb2)]:
  - @ledgerhq/ledger-wallet-framework@3.12.0-next.0

## 4.5.0

### Minor Changes

- [#24373](https://github.com/LedgerHQ/ledger-live/pull/24373) [`6ab5a87`](https://github.com/LedgerHQ/ledger-live/commit/6ab5a87d796726b2fc38b34862209abf82521f72) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Export the default coin configs from each coin package and wrap them in `ledger-live-common` (ADR-063). `coin-celo` and `coin-cosmos` replace their `celoConfig` and `cosmosConfig` exports, which wrapped the defaults in `ConfigInfo`, with plain typed `celoDefaults` and `cosmosDefaults`; their `features` now use the `status` key instead of `type`, Desmos gets the active status it was missing, and Gonka defaults to a minimum gas price of 1 ngonka

- [#24522](https://github.com/LedgerHQ/ledger-live/pull/24522) [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Import bignumber.js through its default export, the form bignumber.js 11 types support

### Patch Changes

- Updated dependencies [[`d701bc7`](https://github.com/LedgerHQ/ledger-live/commit/d701bc7564f9f479e0cc867ef76ec40b73f5c49c), [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e), [`d3f59ae`](https://github.com/LedgerHQ/ledger-live/commit/d3f59ae3fc6b9d9240bd81df9f93c1223cb64ddb)]:
  - @ledgerhq/ledger-wallet-framework@3.11.0

## 4.5.0-next.0

### Minor Changes

- [#24373](https://github.com/LedgerHQ/ledger-live/pull/24373) [`6ab5a87`](https://github.com/LedgerHQ/ledger-live/commit/6ab5a87d796726b2fc38b34862209abf82521f72) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Export the default coin configs from each coin package and wrap them in `ledger-live-common` (ADR-063). `coin-celo` and `coin-cosmos` replace their `celoConfig` and `cosmosConfig` exports, which wrapped the defaults in `ConfigInfo`, with plain typed `celoDefaults` and `cosmosDefaults`; their `features` now use the `status` key instead of `type`, Desmos gets the active status it was missing, and Gonka defaults to a minimum gas price of 1 ngonka

- [#24522](https://github.com/LedgerHQ/ledger-live/pull/24522) [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Import bignumber.js through its default export, the form bignumber.js 11 types support

### Patch Changes

- Updated dependencies [[`d701bc7`](https://github.com/LedgerHQ/ledger-live/commit/d701bc7564f9f479e0cc867ef76ec40b73f5c49c), [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e), [`d3f59ae`](https://github.com/LedgerHQ/ledger-live/commit/d3f59ae3fc6b9d9240bd81df9f93c1223cb64ddb)]:
  - @ledgerhq/ledger-wallet-framework@3.11.0-next.0

## 4.4.1

### Patch Changes

- Updated dependencies [[`8854aff`](https://github.com/LedgerHQ/ledger-live/commit/8854aff9cace72ad17c6d9fd7ee98a4dcd65ecb1), [`c50f3fa`](https://github.com/LedgerHQ/ledger-live/commit/c50f3fac1c822d61332dbb512b21cdda6bb57210)]:
  - @ledgerhq/ledger-wallet-framework@3.10.0

## 4.4.1-next.0

### Patch Changes

- Updated dependencies [[`8854aff`](https://github.com/LedgerHQ/ledger-live/commit/8854aff9cace72ad17c6d9fd7ee98a4dcd65ecb1), [`c50f3fa`](https://github.com/LedgerHQ/ledger-live/commit/c50f3fac1c822d61332dbb512b21cdda6bb57210)]:
  - @ledgerhq/ledger-wallet-framework@3.10.0-next.0

## 4.4.0

### Minor Changes

- [#23846](https://github.com/LedgerHQ/ledger-live/pull/23846) [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359) Thanks [@gre-ledger](https://github.com/gre-ledger)! - fix: ship lib and lib-es in the npm tarballs again, which pnpm 11 dropped

- [#23527](https://github.com/LedgerHQ/ledger-live/pull/23527) [`a389665`](https://github.com/LedgerHQ/ledger-live/commit/a389665d6256a750f539ec54516f667cca1fb011) Thanks [@qperrot](https://github.com/qperrot)! - Stop setting name / unit on returned assets

### Patch Changes

- Updated dependencies [[`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1), [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359), [`9c7d59d`](https://github.com/LedgerHQ/ledger-live/commit/9c7d59d0ffcc72ba746bc20e9ff744db9730503b)]:
  - @ledgerhq/ledger-wallet-framework@3.9.0

## 4.4.0-next.0

### Minor Changes

- [#23846](https://github.com/LedgerHQ/ledger-live/pull/23846) [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359) Thanks [@gre-ledger](https://github.com/gre-ledger)! - fix: ship lib and lib-es in the npm tarballs again, which pnpm 11 dropped

- [#23527](https://github.com/LedgerHQ/ledger-live/pull/23527) [`a389665`](https://github.com/LedgerHQ/ledger-live/commit/a389665d6256a750f539ec54516f667cca1fb011) Thanks [@qperrot](https://github.com/qperrot)! - Stop setting name / unit on returned assets

### Patch Changes

- Updated dependencies [[`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1), [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359), [`9c7d59d`](https://github.com/LedgerHQ/ledger-live/commit/9c7d59d0ffcc72ba746bc20e9ff744db9730503b)]:
  - @ledgerhq/ledger-wallet-framework@3.9.0-next.0

## 4.3.3

### Patch Changes

- Updated dependencies [[`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97)]:
  - @ledgerhq/ledger-wallet-framework@3.8.0

## 4.3.3-next.0

### Patch Changes

- Updated dependencies [[`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97)]:
  - @ledgerhq/ledger-wallet-framework@3.8.0-next.0

## 4.3.2

### Patch Changes

- Updated dependencies [[`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0

## 4.3.2-next.1

### Patch Changes

- Updated dependencies [[`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.1

## 4.3.2-next.0

### Patch Changes

- Updated dependencies [[`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.0

## 4.3.1

### Patch Changes

- Updated dependencies [[`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d)]:
  - @ledgerhq/ledger-wallet-framework@3.6.0

## 4.3.1-next.0

### Patch Changes

- Updated dependencies [[`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d)]:
  - @ledgerhq/ledger-wallet-framework@3.6.0-next.0

## 4.3.0

### Minor Changes

- [#21951](https://github.com/LedgerHQ/ledger-live/pull/21951) [`f1cd6f5`](https://github.com/LedgerHQ/ledger-live/commit/f1cd6f5c5b4b8c5da27f5603ef564c6a819de9f2) Thanks [@may01](https://github.com/may01)! - Report VTHO transfers and both sides of every transfer in `getBlock`

  `getBlock` mapped only `output.transfers` from Thor's expanded block, which holds native VET clause
  transfers. A VTHO (VIP-180) movement is an ABI-encoded log in `output.events` instead, so every
  token transfer came back with an empty `operations` array even though `listOperations` reported it
  for the same transaction — on recent mainnet blocks that silently dropped the majority of
  transactions. VIP-180 `Transfer` logs emitted by the VTHO contract are now decoded from the same
  expanded-block payload, so no extra request is made.

  Each transfer also produced a single operation, for the recipient only. `BlockOperation.amount` is
  the signed impact on `address`, so a transfer is now reported once per side — negative for the
  sender, positive for the recipient — and an outgoing VET or VTHO transfer is no longer invisible to
  a block-based consumer.

  Native operations now carry the same `NATIVE_ASSET` (`{ type: "native", name: "VET" }`) that
  `getBalance` and `listOperations` already use, instead of a bare `{ type: "native" }`, so an asset
  is identified consistently across the module's outputs.

  **Consumer impact** — `getBlock` output changes shape for callers that were already consuming it,
  hence the minor rather than patch bump:

  - A transfer now yields two operations instead of one. Code that sums `operations[].amount` to get a
    block's net flow now gets ~0, because each credit is cancelled by the matching debit; filter by
    `address` (or by `amount > 0n`) before summing.
  - Blocks whose transactions are VTHO-only now report operations where they previously reported none,
    so per-block operation counts increase.
  - Grouping native operations by structural asset equality must expect `name: "VET"` to be present.

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @ledgerhq/ledger-wallet-framework@3.5.0

## 4.3.0-next.0

### Minor Changes

- [#21951](https://github.com/LedgerHQ/ledger-live/pull/21951) [`f1cd6f5`](https://github.com/LedgerHQ/ledger-live/commit/f1cd6f5c5b4b8c5da27f5603ef564c6a819de9f2) Thanks [@may01](https://github.com/may01)! - Report VTHO transfers and both sides of every transfer in `getBlock`

  `getBlock` mapped only `output.transfers` from Thor's expanded block, which holds native VET clause
  transfers. A VTHO (VIP-180) movement is an ABI-encoded log in `output.events` instead, so every
  token transfer came back with an empty `operations` array even though `listOperations` reported it
  for the same transaction — on recent mainnet blocks that silently dropped the majority of
  transactions. VIP-180 `Transfer` logs emitted by the VTHO contract are now decoded from the same
  expanded-block payload, so no extra request is made.

  Each transfer also produced a single operation, for the recipient only. `BlockOperation.amount` is
  the signed impact on `address`, so a transfer is now reported once per side — negative for the
  sender, positive for the recipient — and an outgoing VET or VTHO transfer is no longer invisible to
  a block-based consumer.

  Native operations now carry the same `NATIVE_ASSET` (`{ type: "native", name: "VET" }`) that
  `getBalance` and `listOperations` already use, instead of a bare `{ type: "native" }`, so an asset
  is identified consistently across the module's outputs.

  **Consumer impact** — `getBlock` output changes shape for callers that were already consuming it,
  hence the minor rather than patch bump:

  - A transfer now yields two operations instead of one. Code that sums `operations[].amount` to get a
    block's net flow now gets ~0, because each credit is cancelled by the matching debit; filter by
    `address` (or by `amount > 0n`) before summing.
  - Blocks whose transactions are VTHO-only now report operations where they previously reported none,
    so per-block operation counts increase.
  - Grouping native operations by structural asset equality must expect `name: "VET"` to be present.

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @ledgerhq/ledger-wallet-framework@3.5.0-next.0

## 4.2.0

### Minor Changes

- [#21818](https://github.com/LedgerHQ/ledger-live/pull/21818) [`92c97cf`](https://github.com/LedgerHQ/ledger-live/commit/92c97cf5ee26cbac54f0db25fcdc19336c2318a2) Thanks [@may01](https://github.com/may01)! - listOperations no longer advertises a next cursor, and honours the requested order

  A page already covers every operation up to the current head, so the cursor it returned (the head
  block, and the caller's own cursor on an empty page) never led to more results — a client paging
  until `next` is falsy looped forever. The page is now returned without `next`.

  `order` was accepted and ignored: `asc` and `desc` both returned newest-first. Operations are now
  sorted in the requested order, `desc` remaining the default.

### Patch Changes

- Updated dependencies [[`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/ledger-wallet-framework@3.4.0

## 4.2.0-next.0

### Minor Changes

- [#21818](https://github.com/LedgerHQ/ledger-live/pull/21818) [`92c97cf`](https://github.com/LedgerHQ/ledger-live/commit/92c97cf5ee26cbac54f0db25fcdc19336c2318a2) Thanks [@may01](https://github.com/may01)! - listOperations no longer advertises a next cursor, and honours the requested order

  A page already covers every operation up to the current head, so the cursor it returned (the head
  block, and the caller's own cursor on an empty page) never led to more results — a client paging
  until `next` is falsy looped forever. The page is now returned without `next`.

  `order` was accepted and ignored: `asc` and `desc` both returned newest-first. Operations are now
  sorted in the requested order, `desc` remaining the default.

### Patch Changes

- Updated dependencies [[`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/ledger-wallet-framework@3.4.0-next.0

## 4.1.1

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215)]:
  - @ledgerhq/ledger-wallet-framework@3.3.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
