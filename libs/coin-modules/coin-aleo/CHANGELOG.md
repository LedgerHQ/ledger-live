# @ledgerhq/coin-aleo

## 1.8.0-next.0

### Minor Changes

- [#15809](https://github.com/LedgerHQ/ledger-live/pull/15809) [`d3f2070`](https://github.com/LedgerHQ/ledger-live/commit/d3f20708585c3a9c2a6b3a9d7861e26bb9a94f2d) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - add “sponsored by provable” text if fee sponsorship is enabled in the coin config

- [#15758](https://github.com/LedgerHQ/ledger-live/pull/15758) [`66c4add`](https://github.com/LedgerHQ/ledger-live/commit/66c4add957a7e3a3d042d5babe9663dfde52b1cf) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - add aleo getTransactionStatus for private

- [#15525](https://github.com/LedgerHQ/ledger-live/pull/15525) [`3a896bf`](https://github.com/LedgerHQ/ledger-live/commit/3a896bf20639a8090e266a7d05c604b8fe796b15) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add aleo private craft transaction

- [#15617](https://github.com/LedgerHQ/ledger-live/pull/15617) [`e0de96e`](https://github.com/LedgerHQ/ledger-live/commit/e0de96e6311de7e34715784da5941e60ed5c51cc) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: update aleo derivation path

- [#15597](https://github.com/LedgerHQ/ledger-live/pull/15597) [`6ed2cc3`](https://github.com/LedgerHQ/ledger-live/commit/6ed2cc3e388df915015f6e4083917015ef800804) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo encrypted prove integration in broadcast

- [#15640](https://github.com/LedgerHQ/ledger-live/pull/15640) [`08aba09`](https://github.com/LedgerHQ/ledger-live/commit/08aba094d4ce594fdde2167f9120b7d9c45b21ba) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: integrate with development version of aleo signer kit
  feat: aleo sign operation

- [#15518](https://github.com/LedgerHQ/ledger-live/pull/15518) [`91517d9`](https://github.com/LedgerHQ/ledger-live/commit/91517d95480cc44ffa9195adbf572b9817360efa) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: add "last synced: recently" to aleo public balance selector
  fix: empty extra.functionId in aleo optimistic operation
  fix: ensure multiple pending aleo operations are visible
  fix: broken "close modal" in aleo self transfer
  fix: return zero fees when fee sponsorship is enabled

- [#15568](https://github.com/LedgerHQ/ledger-live/pull/15568) [`2bd3190`](https://github.com/LedgerHQ/ledger-live/commit/2bd3190658bd9baeb616251273eba48d1f677be9) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add estimateMaxSpendable for private in aleo module

- [#15696](https://github.com/LedgerHQ/ledger-live/pull/15696) [`633b6ee`](https://github.com/LedgerHQ/ledger-live/commit/633b6eef8a38e1d8bd9219a69c75c9ca35ccf066) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - add aleo prepareTransaction for private

- [#15639](https://github.com/LedgerHQ/ledger-live/pull/15639) [`43b1de5`](https://github.com/LedgerHQ/ledger-live/commit/43b1de5d23a5760cbe1801a18d3691b393184920) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: exclude already spent records from aleo private balance

- [#15647](https://github.com/LedgerHQ/ledger-live/pull/15647) [`332b7b9`](https://github.com/LedgerHQ/ledger-live/commit/332b7b9c0f44b5dff3dd06e5da029d6add8825d8) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo private sync with rxjs

### Patch Changes

- Updated dependencies [[`4af828d`](https://github.com/LedgerHQ/ledger-live/commit/4af828d0790bb3568dd095f89dd9f239f7565e84), [`1bf4e7e`](https://github.com/LedgerHQ/ledger-live/commit/1bf4e7efa2fbb310f9c3db8f5d72e68294f0f3fe), [`d0559d8`](https://github.com/LedgerHQ/ledger-live/commit/d0559d84e119c844d92dc82c7648d0d9dc6c6e20), [`deec161`](https://github.com/LedgerHQ/ledger-live/commit/deec16153656d444336f067970dcda5fff016d95), [`e0de96e`](https://github.com/LedgerHQ/ledger-live/commit/e0de96e6311de7e34715784da5941e60ed5c51cc), [`41d172e`](https://github.com/LedgerHQ/ledger-live/commit/41d172e74bc074995b7290c4bb6d129276a484ff), [`c5c58e4`](https://github.com/LedgerHQ/ledger-live/commit/c5c58e4efab303a5b6bccc463f91241f4e0f72bc)]:
  - @ledgerhq/coin-framework@7.1.0-next.0
  - @ledgerhq/types-live@6.103.0-next.0
  - @ledgerhq/cryptoassets@13.44.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.1.0-next.0
  - @ledgerhq/live-env@2.31.0-next.0
  - @ledgerhq/live-network@2.4.3-next.0

## 1.7.0

### Minor Changes

- [#15291](https://github.com/LedgerHQ/ledger-live/pull/15291) [`a221ae8`](https://github.com/LedgerHQ/ledger-live/commit/a221ae85b846c6d5dc6efb55ed873942d7720b05) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat: add `ledger-wallet-framework`

- [#15398](https://github.com/LedgerHQ/ledger-live/pull/15398) [`46ab4d6`](https://github.com/LedgerHQ/ledger-live/commit/46ab4d6b9303295c42e866a12b4f0fc3a123f79f) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: aleo config type
  chore: more generic name for aleo learn more url

- [#15451](https://github.com/LedgerHQ/ledger-live/pull/15451) [`87d5457`](https://github.com/LedgerHQ/ledger-live/commit/87d5457cffd6c56a80025fd701e50e3429a85e5a) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat: aleo transaction.properties for private transaction details

### Patch Changes

- Updated dependencies [[`a221ae8`](https://github.com/LedgerHQ/ledger-live/commit/a221ae85b846c6d5dc6efb55ed873942d7720b05), [`a270b43`](https://github.com/LedgerHQ/ledger-live/commit/a270b438bf8aca99b795679fecce1b55dc249c12), [`982d4af`](https://github.com/LedgerHQ/ledger-live/commit/982d4afbeb7faf3814c3e96ffb6e3e88b58dfe73), [`6dac7f9`](https://github.com/LedgerHQ/ledger-live/commit/6dac7f974c28dcae409c110a60061996490c5088), [`8ce1cb7`](https://github.com/LedgerHQ/ledger-live/commit/8ce1cb755b3e68c8688f9e828596d3c2605ef3cb), [`01c81b1`](https://github.com/LedgerHQ/ledger-live/commit/01c81b112ab326eff436f0f3279a1225c073f897), [`3ede91a`](https://github.com/LedgerHQ/ledger-live/commit/3ede91a3674a80c9309d305b871ec3b6e9849b41)]:
  - @ledgerhq/coin-framework@7.0.0
  - @ledgerhq/types-live@6.102.0
  - @ledgerhq/devices@8.13.0
  - @ledgerhq/errors@6.32.0
  - @ledgerhq/cryptoassets@13.43.0
  - @ledgerhq/ledger-wallet-framework@1.0.1
  - @ledgerhq/live-network@2.4.2

## 1.7.0-next.0

### Minor Changes

- [#15291](https://github.com/LedgerHQ/ledger-live/pull/15291) [`a221ae8`](https://github.com/LedgerHQ/ledger-live/commit/a221ae85b846c6d5dc6efb55ed873942d7720b05) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat: add `ledger-wallet-framework`

- [#15398](https://github.com/LedgerHQ/ledger-live/pull/15398) [`46ab4d6`](https://github.com/LedgerHQ/ledger-live/commit/46ab4d6b9303295c42e866a12b4f0fc3a123f79f) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: aleo config type
  chore: more generic name for aleo learn more url

- [#15451](https://github.com/LedgerHQ/ledger-live/pull/15451) [`87d5457`](https://github.com/LedgerHQ/ledger-live/commit/87d5457cffd6c56a80025fd701e50e3429a85e5a) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat: aleo transaction.properties for private transaction details

### Patch Changes

- Updated dependencies [[`a221ae8`](https://github.com/LedgerHQ/ledger-live/commit/a221ae85b846c6d5dc6efb55ed873942d7720b05), [`a270b43`](https://github.com/LedgerHQ/ledger-live/commit/a270b438bf8aca99b795679fecce1b55dc249c12), [`982d4af`](https://github.com/LedgerHQ/ledger-live/commit/982d4afbeb7faf3814c3e96ffb6e3e88b58dfe73), [`6dac7f9`](https://github.com/LedgerHQ/ledger-live/commit/6dac7f974c28dcae409c110a60061996490c5088), [`8ce1cb7`](https://github.com/LedgerHQ/ledger-live/commit/8ce1cb755b3e68c8688f9e828596d3c2605ef3cb), [`01c81b1`](https://github.com/LedgerHQ/ledger-live/commit/01c81b112ab326eff436f0f3279a1225c073f897), [`3ede91a`](https://github.com/LedgerHQ/ledger-live/commit/3ede91a3674a80c9309d305b871ec3b6e9849b41)]:
  - @ledgerhq/coin-framework@7.0.0-next.0
  - @ledgerhq/types-live@6.102.0-next.0
  - @ledgerhq/devices@8.13.0-next.0
  - @ledgerhq/errors@6.32.0-next.0
  - @ledgerhq/cryptoassets@13.43.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.0.1-next.0
  - @ledgerhq/live-network@2.4.2-next.0

## 1.6.0

### Minor Changes

- [#15268](https://github.com/LedgerHQ/ledger-live/pull/15268) [`952e4b9`](https://github.com/LedgerHQ/ledger-live/commit/952e4b92acc41b8166c86653a7c52f6b4d02bfe5) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo balance selector

- [#15137](https://github.com/LedgerHQ/ledger-live/pull/15137) [`f1394b5`](https://github.com/LedgerHQ/ledger-live/commit/f1394b53e582fc5be8c06a7ba4df4eb5f54a73c0) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: adjust aleo available balance in get transaction status

- [#15186](https://github.com/LedgerHQ/ledger-live/pull/15186) [`be5e542`](https://github.com/LedgerHQ/ledger-live/commit/be5e5428e7ee38dddb0a893b54a0bdb0c06c8de9) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: use tx.mode instead of tx.type in coin-aleo

- [#15205](https://github.com/LedgerHQ/ledger-live/pull/15205) [`695fc5e`](https://github.com/LedgerHQ/ledger-live/commit/695fc5ed3646f47e81fc622c24514768543e4a10) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo device transaction config

- [#15242](https://github.com/LedgerHQ/ledger-live/pull/15242) [`7038137`](https://github.com/LedgerHQ/ledger-live/commit/703813747349288325fdc661637644d980073b9d) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-framework): move functions to `AlpacaApi`

- [#15229](https://github.com/LedgerHQ/ledger-live/pull/15229) [`a81e55a`](https://github.com/LedgerHQ/ledger-live/commit/a81e55a2c0d8f08017fca5fe0b5c7c8057fbcfa3) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add aleo broadcast method

- [#15237](https://github.com/LedgerHQ/ledger-live/pull/15237) [`312d92d`](https://github.com/LedgerHQ/ledger-live/commit/312d92dbd9d115a2ec6ad6628445c31d45806aea) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-framework): duplicate `BroadcastConfig` inside coin framework

- [#15255](https://github.com/LedgerHQ/ledger-live/pull/15255) [`ad8cf9e`](https://github.com/LedgerHQ/ledger-live/commit/ad8cf9e8e2bef40d868c561ba0a4149f45d9dec5) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add Aleo currency config flag `isFeeSponsored` to control sponsored-fee behavior for private send flows.

- [#15037](https://github.com/LedgerHQ/ledger-live/pull/15037) [`7863b7e`](https://github.com/LedgerHQ/ledger-live/commit/7863b7ed71110b17f999b2092863b7fa2833a4d1) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Increase coverage in aleo for api and bridge

### Patch Changes

- Updated dependencies [[`c8d7be6`](https://github.com/LedgerHQ/ledger-live/commit/c8d7be6964aa9d8defd77de0b77ba7d42f472025), [`ffb3c46`](https://github.com/LedgerHQ/ledger-live/commit/ffb3c46acd292b9ac0f46a2b84509d02775a5f20), [`7cbfb7d`](https://github.com/LedgerHQ/ledger-live/commit/7cbfb7dd2d52ad8380ab4d37b02f63292699cd68), [`bfa4315`](https://github.com/LedgerHQ/ledger-live/commit/bfa4315d2f3b4b95c5a742ffd6e05272662f4550), [`17e1fb3`](https://github.com/LedgerHQ/ledger-live/commit/17e1fb3fdb92d6dab9af72adcbcde62bdd772a71), [`75dfb86`](https://github.com/LedgerHQ/ledger-live/commit/75dfb86c871a026aa90136d0184637878d484484), [`7038137`](https://github.com/LedgerHQ/ledger-live/commit/703813747349288325fdc661637644d980073b9d), [`e6f26e0`](https://github.com/LedgerHQ/ledger-live/commit/e6f26e0f475763aaf3271e2d4ed6cf36fb1f5060), [`42bf9b7`](https://github.com/LedgerHQ/ledger-live/commit/42bf9b7c40c04c7d2eeffba30b778be0b123bfd0), [`164788e`](https://github.com/LedgerHQ/ledger-live/commit/164788e4a7e9c063d7769d44393708632854cb0a), [`9f559e9`](https://github.com/LedgerHQ/ledger-live/commit/9f559e98a1af37073e0e79ee5bb54b4aaecfb8c4), [`312d92d`](https://github.com/LedgerHQ/ledger-live/commit/312d92dbd9d115a2ec6ad6628445c31d45806aea), [`08ee941`](https://github.com/LedgerHQ/ledger-live/commit/08ee9414908ec1f7489493c98b9a823a20cce550), [`fd24208`](https://github.com/LedgerHQ/ledger-live/commit/fd242082615ef0af25f0f5f96389b7406fc194dc), [`8cb2da1`](https://github.com/LedgerHQ/ledger-live/commit/8cb2da1f175f143666abcb66ef94bd230456846d), [`173946c`](https://github.com/LedgerHQ/ledger-live/commit/173946ce652ffef216f04d82b680b14f5686500e), [`70f6288`](https://github.com/LedgerHQ/ledger-live/commit/70f6288597722a1e8fd6b5884d843f27be87e9d8), [`ad66568`](https://github.com/LedgerHQ/ledger-live/commit/ad66568fd9c96cfa08d11123a711e3fa79705f65), [`79f2f0e`](https://github.com/LedgerHQ/ledger-live/commit/79f2f0e3e8b8089664d2aee7c3dd25c7685aec2c), [`4cc02f3`](https://github.com/LedgerHQ/ledger-live/commit/4cc02f3c1ba0bdb93917b5427a375ab44cd5d208), [`37bc15e`](https://github.com/LedgerHQ/ledger-live/commit/37bc15e245107ce1044f36b57d191552a77329e6)]:
  - @ledgerhq/cryptoassets@13.42.0
  - @ledgerhq/devices@8.12.0
  - @ledgerhq/errors@6.31.0
  - @ledgerhq/logs@6.16.0
  - @ledgerhq/types-cryptoassets@7.35.0
  - @ledgerhq/types-live@6.101.0
  - @ledgerhq/coin-framework@6.20.0
  - @ledgerhq/live-env@2.30.0
  - @ledgerhq/live-network@2.4.1
  - @ledgerhq/live-promise@0.2.2

## 1.6.0-next.0

### Minor Changes

- [#15268](https://github.com/LedgerHQ/ledger-live/pull/15268) [`952e4b9`](https://github.com/LedgerHQ/ledger-live/commit/952e4b92acc41b8166c86653a7c52f6b4d02bfe5) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo balance selector

- [#15137](https://github.com/LedgerHQ/ledger-live/pull/15137) [`f1394b5`](https://github.com/LedgerHQ/ledger-live/commit/f1394b53e582fc5be8c06a7ba4df4eb5f54a73c0) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: adjust aleo available balance in get transaction status

- [#15186](https://github.com/LedgerHQ/ledger-live/pull/15186) [`be5e542`](https://github.com/LedgerHQ/ledger-live/commit/be5e5428e7ee38dddb0a893b54a0bdb0c06c8de9) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: use tx.mode instead of tx.type in coin-aleo

- [#15205](https://github.com/LedgerHQ/ledger-live/pull/15205) [`695fc5e`](https://github.com/LedgerHQ/ledger-live/commit/695fc5ed3646f47e81fc622c24514768543e4a10) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo device transaction config

- [#15242](https://github.com/LedgerHQ/ledger-live/pull/15242) [`7038137`](https://github.com/LedgerHQ/ledger-live/commit/703813747349288325fdc661637644d980073b9d) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-framework): move functions to `AlpacaApi`

- [#15229](https://github.com/LedgerHQ/ledger-live/pull/15229) [`a81e55a`](https://github.com/LedgerHQ/ledger-live/commit/a81e55a2c0d8f08017fca5fe0b5c7c8057fbcfa3) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add aleo broadcast method

- [#15237](https://github.com/LedgerHQ/ledger-live/pull/15237) [`312d92d`](https://github.com/LedgerHQ/ledger-live/commit/312d92dbd9d115a2ec6ad6628445c31d45806aea) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-framework): duplicate `BroadcastConfig` inside coin framework

- [#15255](https://github.com/LedgerHQ/ledger-live/pull/15255) [`ad8cf9e`](https://github.com/LedgerHQ/ledger-live/commit/ad8cf9e8e2bef40d868c561ba0a4149f45d9dec5) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add Aleo currency config flag `isFeeSponsored` to control sponsored-fee behavior for private send flows.

- [#15037](https://github.com/LedgerHQ/ledger-live/pull/15037) [`7863b7e`](https://github.com/LedgerHQ/ledger-live/commit/7863b7ed71110b17f999b2092863b7fa2833a4d1) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Increase coverage in aleo for api and bridge

### Patch Changes

- Updated dependencies [[`c8d7be6`](https://github.com/LedgerHQ/ledger-live/commit/c8d7be6964aa9d8defd77de0b77ba7d42f472025), [`ffb3c46`](https://github.com/LedgerHQ/ledger-live/commit/ffb3c46acd292b9ac0f46a2b84509d02775a5f20), [`7cbfb7d`](https://github.com/LedgerHQ/ledger-live/commit/7cbfb7dd2d52ad8380ab4d37b02f63292699cd68), [`bfa4315`](https://github.com/LedgerHQ/ledger-live/commit/bfa4315d2f3b4b95c5a742ffd6e05272662f4550), [`17e1fb3`](https://github.com/LedgerHQ/ledger-live/commit/17e1fb3fdb92d6dab9af72adcbcde62bdd772a71), [`75dfb86`](https://github.com/LedgerHQ/ledger-live/commit/75dfb86c871a026aa90136d0184637878d484484), [`7038137`](https://github.com/LedgerHQ/ledger-live/commit/703813747349288325fdc661637644d980073b9d), [`e6f26e0`](https://github.com/LedgerHQ/ledger-live/commit/e6f26e0f475763aaf3271e2d4ed6cf36fb1f5060), [`42bf9b7`](https://github.com/LedgerHQ/ledger-live/commit/42bf9b7c40c04c7d2eeffba30b778be0b123bfd0), [`164788e`](https://github.com/LedgerHQ/ledger-live/commit/164788e4a7e9c063d7769d44393708632854cb0a), [`9f559e9`](https://github.com/LedgerHQ/ledger-live/commit/9f559e98a1af37073e0e79ee5bb54b4aaecfb8c4), [`312d92d`](https://github.com/LedgerHQ/ledger-live/commit/312d92dbd9d115a2ec6ad6628445c31d45806aea), [`08ee941`](https://github.com/LedgerHQ/ledger-live/commit/08ee9414908ec1f7489493c98b9a823a20cce550), [`fd24208`](https://github.com/LedgerHQ/ledger-live/commit/fd242082615ef0af25f0f5f96389b7406fc194dc), [`8cb2da1`](https://github.com/LedgerHQ/ledger-live/commit/8cb2da1f175f143666abcb66ef94bd230456846d), [`173946c`](https://github.com/LedgerHQ/ledger-live/commit/173946ce652ffef216f04d82b680b14f5686500e), [`70f6288`](https://github.com/LedgerHQ/ledger-live/commit/70f6288597722a1e8fd6b5884d843f27be87e9d8), [`ad66568`](https://github.com/LedgerHQ/ledger-live/commit/ad66568fd9c96cfa08d11123a711e3fa79705f65), [`79f2f0e`](https://github.com/LedgerHQ/ledger-live/commit/79f2f0e3e8b8089664d2aee7c3dd25c7685aec2c), [`4cc02f3`](https://github.com/LedgerHQ/ledger-live/commit/4cc02f3c1ba0bdb93917b5427a375ab44cd5d208), [`37bc15e`](https://github.com/LedgerHQ/ledger-live/commit/37bc15e245107ce1044f36b57d191552a77329e6)]:
  - @ledgerhq/cryptoassets@13.42.0-next.0
  - @ledgerhq/devices@8.12.0-next.0
  - @ledgerhq/errors@6.31.0-next.0
  - @ledgerhq/logs@6.16.0-next.0
  - @ledgerhq/types-cryptoassets@7.35.0-next.0
  - @ledgerhq/types-live@6.101.0-next.0
  - @ledgerhq/coin-framework@6.20.0-next.0
  - @ledgerhq/live-env@2.30.0-next.0
  - @ledgerhq/live-network@2.4.1-next.0
  - @ledgerhq/live-promise@0.2.2-next.0

## 1.5.0

### Minor Changes

- [#14846](https://github.com/LedgerHQ/ledger-live/pull/14846) [`17dd498`](https://github.com/LedgerHQ/ledger-live/commit/17dd4980f045f06a45c9faf4377a5b14ff34b30a) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - This PR adds craftTransaction method to coin-aleo package.

- [#14913](https://github.com/LedgerHQ/ledger-live/pull/14913) [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update TypeScript to latest 5.8.x

- [#14785](https://github.com/LedgerHQ/ledger-live/pull/14785) [`b13ac3b`](https://github.com/LedgerHQ/ledger-live/commit/b13ac3b935eac9d01921d38e3af0c27cab8cb5be) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo patch semi public operations

- [#14914](https://github.com/LedgerHQ/ledger-live/pull/14914) [`a578266`](https://github.com/LedgerHQ/ledger-live/commit/a578266bb6dd141a92eda0710c03b86f0ae76e8e) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo operation details extra

- [#14880](https://github.com/LedgerHQ/ledger-live/pull/14880) [`a2d3b72`](https://github.com/LedgerHQ/ledger-live/commit/a2d3b727a455710ee9d50eda50440e34bae46fed) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add estimateMaxSpendable to the bridge

### Patch Changes

- Updated dependencies [[`748b933`](https://github.com/LedgerHQ/ledger-live/commit/748b933f3786e48ec9dd434c76263c2c9a642c99), [`0dbbca3`](https://github.com/LedgerHQ/ledger-live/commit/0dbbca3f0226347b5abc034a066fe4ad89bfe462), [`9f9ae16`](https://github.com/LedgerHQ/ledger-live/commit/9f9ae16843e5db339c1d40c844a66f75fff498fb), [`ba4d56f`](https://github.com/LedgerHQ/ledger-live/commit/ba4d56fa223b87b89d621de2d1885c5a55922ef4), [`697f2e6`](https://github.com/LedgerHQ/ledger-live/commit/697f2e6f5b24ff023a46cbbbf5c9f85bac90a4c4), [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f)]:
  - @ledgerhq/types-live@6.100.0
  - @ledgerhq/errors@6.30.0
  - @ledgerhq/coin-framework@6.19.0
  - @ledgerhq/cryptoassets@13.41.0
  - @ledgerhq/types-cryptoassets@7.34.0
  - @ledgerhq/devices@8.11.0
  - @ledgerhq/logs@6.15.0
  - @ledgerhq/live-network@2.4.0
  - @ledgerhq/live-promise@0.2.1

## 1.5.0-next.0

### Minor Changes

- [#14846](https://github.com/LedgerHQ/ledger-live/pull/14846) [`17dd498`](https://github.com/LedgerHQ/ledger-live/commit/17dd4980f045f06a45c9faf4377a5b14ff34b30a) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - This PR adds craftTransaction method to coin-aleo package.

- [#14913](https://github.com/LedgerHQ/ledger-live/pull/14913) [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update TypeScript to latest 5.8.x

- [#14785](https://github.com/LedgerHQ/ledger-live/pull/14785) [`b13ac3b`](https://github.com/LedgerHQ/ledger-live/commit/b13ac3b935eac9d01921d38e3af0c27cab8cb5be) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo patch semi public operations

- [#14914](https://github.com/LedgerHQ/ledger-live/pull/14914) [`a578266`](https://github.com/LedgerHQ/ledger-live/commit/a578266bb6dd141a92eda0710c03b86f0ae76e8e) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo operation details extra

- [#14880](https://github.com/LedgerHQ/ledger-live/pull/14880) [`a2d3b72`](https://github.com/LedgerHQ/ledger-live/commit/a2d3b727a455710ee9d50eda50440e34bae46fed) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add estimateMaxSpendable to the bridge

### Patch Changes

- Updated dependencies [[`748b933`](https://github.com/LedgerHQ/ledger-live/commit/748b933f3786e48ec9dd434c76263c2c9a642c99), [`0dbbca3`](https://github.com/LedgerHQ/ledger-live/commit/0dbbca3f0226347b5abc034a066fe4ad89bfe462), [`9f9ae16`](https://github.com/LedgerHQ/ledger-live/commit/9f9ae16843e5db339c1d40c844a66f75fff498fb), [`ba4d56f`](https://github.com/LedgerHQ/ledger-live/commit/ba4d56fa223b87b89d621de2d1885c5a55922ef4), [`697f2e6`](https://github.com/LedgerHQ/ledger-live/commit/697f2e6f5b24ff023a46cbbbf5c9f85bac90a4c4), [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f)]:
  - @ledgerhq/types-live@6.100.0-next.0
  - @ledgerhq/errors@6.30.0-next.0
  - @ledgerhq/coin-framework@6.19.0-next.0
  - @ledgerhq/cryptoassets@13.41.0-next.0
  - @ledgerhq/types-cryptoassets@7.34.0-next.0
  - @ledgerhq/devices@8.11.0-next.0
  - @ledgerhq/logs@6.15.0-next.0
  - @ledgerhq/live-network@2.4.0-next.0
  - @ledgerhq/live-promise@0.2.1-next.0

## 1.4.0

### Minor Changes

- [#14647](https://github.com/LedgerHQ/ledger-live/pull/14647) [`4d23157`](https://github.com/LedgerHQ/ledger-live/commit/4d2315778bca18edd5532099f72c6f8197a05123) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo private balance integration

- [#14728](https://github.com/LedgerHQ/ledger-live/pull/14728) [`aee681e`](https://github.com/LedgerHQ/ledger-live/commit/aee681e950fdac80aa8adc4189e330fc6839da39) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - add aleo getTransactionStatus

- [#14639](https://github.com/LedgerHQ/ledger-live/pull/14639) [`480aeaf`](https://github.com/LedgerHQ/ledger-live/commit/480aeaf728fb6f3597ed11403188aee023bb0ff1) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo createTransaction & prepareTransaction

- [#14645](https://github.com/LedgerHQ/ledger-live/pull/14645) [`3a53226`](https://github.com/LedgerHQ/ledger-live/commit/3a53226459a92d731911f42695457bf8138d71c6) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - feat: aleo validateAddress

- [#14699](https://github.com/LedgerHQ/ledger-live/pull/14699) [`ec8a2d6`](https://github.com/LedgerHQ/ledger-live/commit/ec8a2d619b85117e2d74c595c6eae5cae6fda433) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo private operations list

- [#14636](https://github.com/LedgerHQ/ledger-live/pull/14636) [`efc9d1b`](https://github.com/LedgerHQ/ledger-live/commit/efc9d1bf37871d0715a6580e8d67686b34543198) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo estimateFees

- [#13986](https://github.com/LedgerHQ/ledger-live/pull/13986) [`07fdf5a`](https://github.com/LedgerHQ/ledger-live/commit/07fdf5a4bcd12cb0cc5100389c8e355800d3aec0) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - Alpaca API cleanup and documentation

- [#14689](https://github.com/LedgerHQ/ledger-live/pull/14689) [`5af4762`](https://github.com/LedgerHQ/ledger-live/commit/5af47625517d3b86d4e72f4e6d895448dca9ad83) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: adapt aleo private sync to latest changes

- [#14531](https://github.com/LedgerHQ/ledger-live/pull/14531) [`b7dec5c`](https://github.com/LedgerHQ/ledger-live/commit/b7dec5c2a41520114593701c82192ff8ae8ce06f) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo provable api access

- [#14480](https://github.com/LedgerHQ/ledger-live/pull/14480) [`255cfc4`](https://github.com/LedgerHQ/ledger-live/commit/255cfc4d3583a950b793ee013f5a043e52ee2bdb) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat: aleo transparent list operations

- [#14700](https://github.com/LedgerHQ/ledger-live/pull/14700) [`79953e1`](https://github.com/LedgerHQ/ledger-live/commit/79953e1b18f5fa36939192478f25f3d509f5de37) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo build optimistic operation

### Patch Changes

- Updated dependencies [[`a96dc83`](https://github.com/LedgerHQ/ledger-live/commit/a96dc83916684e22c041904c479c615a3095303b), [`e954c1e`](https://github.com/LedgerHQ/ledger-live/commit/e954c1e0f0e45efe3b0e8c3fda9e6d5b22b5bc01), [`e292df3`](https://github.com/LedgerHQ/ledger-live/commit/e292df30514168181545d7a572f723e31df78e77), [`17149ee`](https://github.com/LedgerHQ/ledger-live/commit/17149ee26eeef8a600d650a6f4903c52320a0d8d), [`ec8a2d6`](https://github.com/LedgerHQ/ledger-live/commit/ec8a2d619b85117e2d74c595c6eae5cae6fda433), [`2ca4f6c`](https://github.com/LedgerHQ/ledger-live/commit/2ca4f6c337a29cd81874261c697d74c82a312eee), [`3bb5c2e`](https://github.com/LedgerHQ/ledger-live/commit/3bb5c2e335c05945b1a7bc8c77d19d0ea03156a6), [`07fdf5a`](https://github.com/LedgerHQ/ledger-live/commit/07fdf5a4bcd12cb0cc5100389c8e355800d3aec0), [`b7dec5c`](https://github.com/LedgerHQ/ledger-live/commit/b7dec5c2a41520114593701c82192ff8ae8ce06f), [`f51402e`](https://github.com/LedgerHQ/ledger-live/commit/f51402ebb8a4f05a933df3c3ef499756fbde5cc8), [`5f1c644`](https://github.com/LedgerHQ/ledger-live/commit/5f1c644fd5f757f48618b62e976faac274ced40d), [`c7ed360`](https://github.com/LedgerHQ/ledger-live/commit/c7ed36086280d60631e235d375cc2db5f60e8aab), [`cc4c8f5`](https://github.com/LedgerHQ/ledger-live/commit/cc4c8f57e38586d77b89f32d359e65cc700912af)]:
  - @ledgerhq/types-live@6.99.0
  - @ledgerhq/cryptoassets@13.40.0
  - @ledgerhq/live-env@2.29.0
  - @ledgerhq/coin-framework@6.18.0
  - @ledgerhq/live-network@2.3.0

## 1.4.0-next.0

### Minor Changes

- [#14647](https://github.com/LedgerHQ/ledger-live/pull/14647) [`4d23157`](https://github.com/LedgerHQ/ledger-live/commit/4d2315778bca18edd5532099f72c6f8197a05123) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo private balance integration

- [#14728](https://github.com/LedgerHQ/ledger-live/pull/14728) [`aee681e`](https://github.com/LedgerHQ/ledger-live/commit/aee681e950fdac80aa8adc4189e330fc6839da39) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - add aleo getTransactionStatus

- [#14639](https://github.com/LedgerHQ/ledger-live/pull/14639) [`480aeaf`](https://github.com/LedgerHQ/ledger-live/commit/480aeaf728fb6f3597ed11403188aee023bb0ff1) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo createTransaction & prepareTransaction

- [#14645](https://github.com/LedgerHQ/ledger-live/pull/14645) [`3a53226`](https://github.com/LedgerHQ/ledger-live/commit/3a53226459a92d731911f42695457bf8138d71c6) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - feat: aleo validateAddress

- [#14699](https://github.com/LedgerHQ/ledger-live/pull/14699) [`ec8a2d6`](https://github.com/LedgerHQ/ledger-live/commit/ec8a2d619b85117e2d74c595c6eae5cae6fda433) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo private operations list

- [#14636](https://github.com/LedgerHQ/ledger-live/pull/14636) [`efc9d1b`](https://github.com/LedgerHQ/ledger-live/commit/efc9d1bf37871d0715a6580e8d67686b34543198) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo estimateFees

- [#13986](https://github.com/LedgerHQ/ledger-live/pull/13986) [`07fdf5a`](https://github.com/LedgerHQ/ledger-live/commit/07fdf5a4bcd12cb0cc5100389c8e355800d3aec0) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - Alpaca API cleanup and documentation

- [#14689](https://github.com/LedgerHQ/ledger-live/pull/14689) [`5af4762`](https://github.com/LedgerHQ/ledger-live/commit/5af47625517d3b86d4e72f4e6d895448dca9ad83) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: adapt aleo private sync to latest changes

- [#14531](https://github.com/LedgerHQ/ledger-live/pull/14531) [`b7dec5c`](https://github.com/LedgerHQ/ledger-live/commit/b7dec5c2a41520114593701c82192ff8ae8ce06f) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo provable api access

- [#14480](https://github.com/LedgerHQ/ledger-live/pull/14480) [`255cfc4`](https://github.com/LedgerHQ/ledger-live/commit/255cfc4d3583a950b793ee013f5a043e52ee2bdb) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat: aleo transparent list operations

- [#14700](https://github.com/LedgerHQ/ledger-live/pull/14700) [`79953e1`](https://github.com/LedgerHQ/ledger-live/commit/79953e1b18f5fa36939192478f25f3d509f5de37) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo build optimistic operation

### Patch Changes

- Updated dependencies [[`a96dc83`](https://github.com/LedgerHQ/ledger-live/commit/a96dc83916684e22c041904c479c615a3095303b), [`e954c1e`](https://github.com/LedgerHQ/ledger-live/commit/e954c1e0f0e45efe3b0e8c3fda9e6d5b22b5bc01), [`e292df3`](https://github.com/LedgerHQ/ledger-live/commit/e292df30514168181545d7a572f723e31df78e77), [`17149ee`](https://github.com/LedgerHQ/ledger-live/commit/17149ee26eeef8a600d650a6f4903c52320a0d8d), [`ec8a2d6`](https://github.com/LedgerHQ/ledger-live/commit/ec8a2d619b85117e2d74c595c6eae5cae6fda433), [`2ca4f6c`](https://github.com/LedgerHQ/ledger-live/commit/2ca4f6c337a29cd81874261c697d74c82a312eee), [`3bb5c2e`](https://github.com/LedgerHQ/ledger-live/commit/3bb5c2e335c05945b1a7bc8c77d19d0ea03156a6), [`07fdf5a`](https://github.com/LedgerHQ/ledger-live/commit/07fdf5a4bcd12cb0cc5100389c8e355800d3aec0), [`b7dec5c`](https://github.com/LedgerHQ/ledger-live/commit/b7dec5c2a41520114593701c82192ff8ae8ce06f), [`f51402e`](https://github.com/LedgerHQ/ledger-live/commit/f51402ebb8a4f05a933df3c3ef499756fbde5cc8), [`5f1c644`](https://github.com/LedgerHQ/ledger-live/commit/5f1c644fd5f757f48618b62e976faac274ced40d), [`c7ed360`](https://github.com/LedgerHQ/ledger-live/commit/c7ed36086280d60631e235d375cc2db5f60e8aab), [`cc4c8f5`](https://github.com/LedgerHQ/ledger-live/commit/cc4c8f57e38586d77b89f32d359e65cc700912af)]:
  - @ledgerhq/types-live@6.99.0-next.0
  - @ledgerhq/cryptoassets@13.40.0-next.0
  - @ledgerhq/live-env@2.29.0-next.0
  - @ledgerhq/coin-framework@6.18.0-next.0
  - @ledgerhq/live-network@2.3.0-next.0

## 1.3.0

### Minor Changes

- [#14388](https://github.com/LedgerHQ/ledger-live/pull/14388) [`71c413a`](https://github.com/LedgerHQ/ledger-live/commit/71c413abb359a47c493e26d5e4e2d71d262f9835) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo view key resolver

- [#14407](https://github.com/LedgerHQ/ledger-live/pull/14407) [`19e62ca`](https://github.com/LedgerHQ/ledger-live/commit/19e62ca57461e3201ce8186023d7896411fce0e0) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - lastBlock method implementation and network api client for Aleo

- [#14561](https://github.com/LedgerHQ/ledger-live/pull/14561) [`b2c6cce`](https://github.com/LedgerHQ/ledger-live/commit/b2c6cce06e2f8cacb16270c11f34522d7fcb4dae) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: api setup for aleo transparent transactions list

- [#14431](https://github.com/LedgerHQ/ledger-live/pull/14431) [`83474a0`](https://github.com/LedgerHQ/ledger-live/commit/83474a0756acd876883407fcc72c74ce7d69ad38) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - getBalance method for Aleo

- [#14510](https://github.com/LedgerHQ/ledger-live/pull/14510) [`1b1fe80`](https://github.com/LedgerHQ/ledger-live/commit/1b1fe80e8be9934b94d2374543b593b2a30d1197) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: store aleo view key in account.id

### Patch Changes

- Updated dependencies [[`e08c1be`](https://github.com/LedgerHQ/ledger-live/commit/e08c1be127e6a9c246c285ba818530e6756033e0), [`19e62ca`](https://github.com/LedgerHQ/ledger-live/commit/19e62ca57461e3201ce8186023d7896411fce0e0), [`d02f203`](https://github.com/LedgerHQ/ledger-live/commit/d02f2035e4f2ac6c3b446cf4107cd017ea4faf43), [`e12fd1e`](https://github.com/LedgerHQ/ledger-live/commit/e12fd1eb27189a668cd8e61798256a0c20c0f078)]:
  - @ledgerhq/types-live@6.98.0
  - @ledgerhq/live-env@2.28.0
  - @ledgerhq/coin-framework@6.17.0
  - @ledgerhq/cryptoassets@13.39.1
  - @ledgerhq/live-network@2.2.3

## 1.3.0-next.0

### Minor Changes

- [#14388](https://github.com/LedgerHQ/ledger-live/pull/14388) [`71c413a`](https://github.com/LedgerHQ/ledger-live/commit/71c413abb359a47c493e26d5e4e2d71d262f9835) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo view key resolver

- [#14407](https://github.com/LedgerHQ/ledger-live/pull/14407) [`19e62ca`](https://github.com/LedgerHQ/ledger-live/commit/19e62ca57461e3201ce8186023d7896411fce0e0) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - lastBlock method implementation and network api client for Aleo

- [#14561](https://github.com/LedgerHQ/ledger-live/pull/14561) [`b2c6cce`](https://github.com/LedgerHQ/ledger-live/commit/b2c6cce06e2f8cacb16270c11f34522d7fcb4dae) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: api setup for aleo transparent transactions list

- [#14431](https://github.com/LedgerHQ/ledger-live/pull/14431) [`83474a0`](https://github.com/LedgerHQ/ledger-live/commit/83474a0756acd876883407fcc72c74ce7d69ad38) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - getBalance method for Aleo

- [#14510](https://github.com/LedgerHQ/ledger-live/pull/14510) [`1b1fe80`](https://github.com/LedgerHQ/ledger-live/commit/1b1fe80e8be9934b94d2374543b593b2a30d1197) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: store aleo view key in account.id

### Patch Changes

- Updated dependencies [[`e08c1be`](https://github.com/LedgerHQ/ledger-live/commit/e08c1be127e6a9c246c285ba818530e6756033e0), [`19e62ca`](https://github.com/LedgerHQ/ledger-live/commit/19e62ca57461e3201ce8186023d7896411fce0e0), [`d02f203`](https://github.com/LedgerHQ/ledger-live/commit/d02f2035e4f2ac6c3b446cf4107cd017ea4faf43), [`e12fd1e`](https://github.com/LedgerHQ/ledger-live/commit/e12fd1eb27189a668cd8e61798256a0c20c0f078)]:
  - @ledgerhq/types-live@6.98.0-next.0
  - @ledgerhq/live-env@2.28.0-next.0
  - @ledgerhq/coin-framework@6.17.0-next.0
  - @ledgerhq/cryptoassets@13.39.1-next.0
  - @ledgerhq/live-network@2.2.3-next.0

## 1.2.0

### Minor Changes

- [#14387](https://github.com/LedgerHQ/ledger-live/pull/14387) [`8a258aa`](https://github.com/LedgerHQ/ledger-live/commit/8a258aa0655123d22f955067acffaf9f74661165) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo derivation config
  fix: missing verify in aleo getAddress
  chore: better error handling in mocked aleo DMK

### Patch Changes

- Updated dependencies [[`03b3105`](https://github.com/LedgerHQ/ledger-live/commit/03b3105efe8094b79ba70432e475fdc5d945c2c4), [`d5da9e0`](https://github.com/LedgerHQ/ledger-live/commit/d5da9e04d7a92b3f7f9df9d462bdd101cadbd300), [`7896aa2`](https://github.com/LedgerHQ/ledger-live/commit/7896aa2dacc12e6781267fa3ca2965aa6fb018d2), [`8a258aa`](https://github.com/LedgerHQ/ledger-live/commit/8a258aa0655123d22f955067acffaf9f74661165), [`c61dc02`](https://github.com/LedgerHQ/ledger-live/commit/c61dc0268072ca43cf726efd17dc11f21eb37ce8), [`8006565`](https://github.com/LedgerHQ/ledger-live/commit/8006565f77487fa0e38bf5f8d7bb4cda4cdba1f5), [`2ec4196`](https://github.com/LedgerHQ/ledger-live/commit/2ec419630bceab7a9600711742a18034ba9ff3cc), [`fe678a1`](https://github.com/LedgerHQ/ledger-live/commit/fe678a1d16eeda84cf8d802eee53026ea677be58), [`de9d068`](https://github.com/LedgerHQ/ledger-live/commit/de9d068800ed2ae72aca0126855480d3eeb12989)]:
  - @ledgerhq/coin-framework@6.16.0
  - @ledgerhq/cryptoassets@13.39.0
  - @ledgerhq/types-live@6.97.0
  - @ledgerhq/types-cryptoassets@7.33.0

## 1.2.0-next.0

### Minor Changes

- [#14387](https://github.com/LedgerHQ/ledger-live/pull/14387) [`8a258aa`](https://github.com/LedgerHQ/ledger-live/commit/8a258aa0655123d22f955067acffaf9f74661165) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo derivation config
  fix: missing verify in aleo getAddress
  chore: better error handling in mocked aleo DMK

### Patch Changes

- Updated dependencies [[`03b3105`](https://github.com/LedgerHQ/ledger-live/commit/03b3105efe8094b79ba70432e475fdc5d945c2c4), [`d5da9e0`](https://github.com/LedgerHQ/ledger-live/commit/d5da9e04d7a92b3f7f9df9d462bdd101cadbd300), [`7896aa2`](https://github.com/LedgerHQ/ledger-live/commit/7896aa2dacc12e6781267fa3ca2965aa6fb018d2), [`8a258aa`](https://github.com/LedgerHQ/ledger-live/commit/8a258aa0655123d22f955067acffaf9f74661165), [`c61dc02`](https://github.com/LedgerHQ/ledger-live/commit/c61dc0268072ca43cf726efd17dc11f21eb37ce8), [`8006565`](https://github.com/LedgerHQ/ledger-live/commit/8006565f77487fa0e38bf5f8d7bb4cda4cdba1f5), [`2ec4196`](https://github.com/LedgerHQ/ledger-live/commit/2ec419630bceab7a9600711742a18034ba9ff3cc), [`fe678a1`](https://github.com/LedgerHQ/ledger-live/commit/fe678a1d16eeda84cf8d802eee53026ea677be58), [`de9d068`](https://github.com/LedgerHQ/ledger-live/commit/de9d068800ed2ae72aca0126855480d3eeb12989)]:
  - @ledgerhq/coin-framework@6.16.0-next.0
  - @ledgerhq/cryptoassets@13.39.0-next.0
  - @ledgerhq/types-live@6.97.0-next.0
  - @ledgerhq/types-cryptoassets@7.33.0-next.0

## 1.1.3

### Patch Changes

- Updated dependencies [[`d7b6d27`](https://github.com/LedgerHQ/ledger-live/commit/d7b6d27d86cade7fcae8013ae66df72532aec3df), [`da660cc`](https://github.com/LedgerHQ/ledger-live/commit/da660ccccf87d97bfdff2b2a066c8b3b422b2d93), [`2d750da`](https://github.com/LedgerHQ/ledger-live/commit/2d750da3bcda547e8c4639e655c5129580baeaad), [`96acd67`](https://github.com/LedgerHQ/ledger-live/commit/96acd679f345729cddcdf73191d4b2a0f948ad5a), [`bf34cf5`](https://github.com/LedgerHQ/ledger-live/commit/bf34cf516a26081ddd493bb01042b1a0e462b029), [`7a75642`](https://github.com/LedgerHQ/ledger-live/commit/7a75642c2f56e27c778106d60a44049917d04014)]:
  - @ledgerhq/types-live@6.96.0
  - @ledgerhq/coin-framework@6.15.0
  - @ledgerhq/live-env@2.27.0
  - @ledgerhq/cryptoassets@13.38.1

## 1.1.3-next.0

### Patch Changes

- Updated dependencies [[`d7b6d27`](https://github.com/LedgerHQ/ledger-live/commit/d7b6d27d86cade7fcae8013ae66df72532aec3df), [`da660cc`](https://github.com/LedgerHQ/ledger-live/commit/da660ccccf87d97bfdff2b2a066c8b3b422b2d93), [`2d750da`](https://github.com/LedgerHQ/ledger-live/commit/2d750da3bcda547e8c4639e655c5129580baeaad), [`96acd67`](https://github.com/LedgerHQ/ledger-live/commit/96acd679f345729cddcdf73191d4b2a0f948ad5a), [`bf34cf5`](https://github.com/LedgerHQ/ledger-live/commit/bf34cf516a26081ddd493bb01042b1a0e462b029), [`7a75642`](https://github.com/LedgerHQ/ledger-live/commit/7a75642c2f56e27c778106d60a44049917d04014)]:
  - @ledgerhq/types-live@6.96.0-next.0
  - @ledgerhq/coin-framework@6.15.0-next.0
  - @ledgerhq/live-env@2.27.0-next.0
  - @ledgerhq/cryptoassets@13.38.1-next.0

## 1.1.2

### Patch Changes

- Updated dependencies [[`dd1122e`](https://github.com/LedgerHQ/ledger-live/commit/dd1122eeb6e9c582541446ff82a488928fa340c2), [`363b630`](https://github.com/LedgerHQ/ledger-live/commit/363b63050ab007266d2c1158a27e4fce79081983), [`cb69f67`](https://github.com/LedgerHQ/ledger-live/commit/cb69f67326834079695935103530d0b24ad3772d), [`1d2d196`](https://github.com/LedgerHQ/ledger-live/commit/1d2d19635c28db69adb04dcd21219b51836186f5), [`9a99ae9`](https://github.com/LedgerHQ/ledger-live/commit/9a99ae9c6b4a99cdda500ae0e216037799de5cd5), [`556dd22`](https://github.com/LedgerHQ/ledger-live/commit/556dd22dd505b4b5ae865ffe36fc5b5aa22a4f81)]:
  - @ledgerhq/coin-framework@6.14.0
  - @ledgerhq/cryptoassets@13.38.0
  - @ledgerhq/types-live@6.95.0

## 1.1.2-next.0

### Patch Changes

- Updated dependencies [[`dd1122e`](https://github.com/LedgerHQ/ledger-live/commit/dd1122eeb6e9c582541446ff82a488928fa340c2), [`363b630`](https://github.com/LedgerHQ/ledger-live/commit/363b63050ab007266d2c1158a27e4fce79081983), [`cb69f67`](https://github.com/LedgerHQ/ledger-live/commit/cb69f67326834079695935103530d0b24ad3772d), [`1d2d196`](https://github.com/LedgerHQ/ledger-live/commit/1d2d19635c28db69adb04dcd21219b51836186f5), [`9a99ae9`](https://github.com/LedgerHQ/ledger-live/commit/9a99ae9c6b4a99cdda500ae0e216037799de5cd5), [`556dd22`](https://github.com/LedgerHQ/ledger-live/commit/556dd22dd505b4b5ae865ffe36fc5b5aa22a4f81)]:
  - @ledgerhq/coin-framework@6.14.0-next.0
  - @ledgerhq/cryptoassets@13.38.0-next.0
  - @ledgerhq/types-live@6.95.0-next.0

## 1.1.1

### Patch Changes

- Updated dependencies [[`c84be03`](https://github.com/LedgerHQ/ledger-live/commit/c84be039f162fd3af72861fd1605f4141c8f0792), [`819d969`](https://github.com/LedgerHQ/ledger-live/commit/819d96907febd9a68a6407c1bad06f475d044a4d), [`6532080`](https://github.com/LedgerHQ/ledger-live/commit/6532080d2a0f5e49052aeab0bf532ee5cd52694a), [`069d298`](https://github.com/LedgerHQ/ledger-live/commit/069d2982cd36c9525addf9d1f9df762a8799b3bb)]:
  - @ledgerhq/types-live@6.94.0
  - @ledgerhq/live-env@2.26.0
  - @ledgerhq/coin-framework@6.13.1
  - @ledgerhq/cryptoassets@13.37.1

## 1.1.1-next.0

### Patch Changes

- Updated dependencies [[`c84be03`](https://github.com/LedgerHQ/ledger-live/commit/c84be039f162fd3af72861fd1605f4141c8f0792), [`819d969`](https://github.com/LedgerHQ/ledger-live/commit/819d96907febd9a68a6407c1bad06f475d044a4d), [`6532080`](https://github.com/LedgerHQ/ledger-live/commit/6532080d2a0f5e49052aeab0bf532ee5cd52694a), [`069d298`](https://github.com/LedgerHQ/ledger-live/commit/069d2982cd36c9525addf9d1f9df762a8799b3bb)]:
  - @ledgerhq/types-live@6.94.0-next.0
  - @ledgerhq/live-env@2.26.0-next.0
  - @ledgerhq/coin-framework@6.13.1-next.0
  - @ledgerhq/cryptoassets@13.37.1-next.0

## 1.1.0

### Minor Changes

- [#13314](https://github.com/LedgerHQ/ledger-live/pull/13314) [`3ac5f26`](https://github.com/LedgerHQ/ledger-live/commit/3ac5f26111f8596327fa7e588e514509de3f8a59) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: coin-aleo template

### Patch Changes

- Updated dependencies [[`537a975`](https://github.com/LedgerHQ/ledger-live/commit/537a975536ca3669d3b88371e1e1f651c4cb9a1b), [`cbcae7c`](https://github.com/LedgerHQ/ledger-live/commit/cbcae7c0ba9b54b1167d26e4227bd2b847207cb9), [`8754614`](https://github.com/LedgerHQ/ledger-live/commit/87546149a62b81f8a25bb6222626592ead629f62), [`50bae0f`](https://github.com/LedgerHQ/ledger-live/commit/50bae0f13a95ef166b2c5609ccbcf5ef01ba1579), [`cf08174`](https://github.com/LedgerHQ/ledger-live/commit/cf0817462e9f0210fceff29ec60b0699e4e69b71), [`b9a3e43`](https://github.com/LedgerHQ/ledger-live/commit/b9a3e431be33943ab4feb4294d6a7f27b966e61b), [`3ac5f26`](https://github.com/LedgerHQ/ledger-live/commit/3ac5f26111f8596327fa7e588e514509de3f8a59), [`7f05536`](https://github.com/LedgerHQ/ledger-live/commit/7f0553665e9c8721f263825cc79994bfc6729d9b)]:
  - @ledgerhq/cryptoassets@13.37.0
  - @ledgerhq/coin-framework@6.13.0
  - @ledgerhq/types-live@6.93.0
  - @ledgerhq/live-env@2.25.0
  - @ledgerhq/types-cryptoassets@7.32.0
  - @ledgerhq/devices@8.10.0

## 1.1.0-next.0

### Minor Changes

- [#13314](https://github.com/LedgerHQ/ledger-live/pull/13314) [`3ac5f26`](https://github.com/LedgerHQ/ledger-live/commit/3ac5f26111f8596327fa7e588e514509de3f8a59) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: coin-aleo template

### Patch Changes

- Updated dependencies [[`537a975`](https://github.com/LedgerHQ/ledger-live/commit/537a975536ca3669d3b88371e1e1f651c4cb9a1b), [`cbcae7c`](https://github.com/LedgerHQ/ledger-live/commit/cbcae7c0ba9b54b1167d26e4227bd2b847207cb9), [`8754614`](https://github.com/LedgerHQ/ledger-live/commit/87546149a62b81f8a25bb6222626592ead629f62), [`50bae0f`](https://github.com/LedgerHQ/ledger-live/commit/50bae0f13a95ef166b2c5609ccbcf5ef01ba1579), [`cf08174`](https://github.com/LedgerHQ/ledger-live/commit/cf0817462e9f0210fceff29ec60b0699e4e69b71), [`b9a3e43`](https://github.com/LedgerHQ/ledger-live/commit/b9a3e431be33943ab4feb4294d6a7f27b966e61b), [`3ac5f26`](https://github.com/LedgerHQ/ledger-live/commit/3ac5f26111f8596327fa7e588e514509de3f8a59), [`7f05536`](https://github.com/LedgerHQ/ledger-live/commit/7f0553665e9c8721f263825cc79994bfc6729d9b)]:
  - @ledgerhq/cryptoassets@13.37.0-next.0
  - @ledgerhq/coin-framework@6.13.0-next.0
  - @ledgerhq/types-live@6.93.0-next.0
  - @ledgerhq/live-env@2.25.0-next.0
  - @ledgerhq/types-cryptoassets@7.32.0-next.0
  - @ledgerhq/devices@8.10.0-next.0
