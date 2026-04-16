# @ledgerhq/ledger-wallet-framework

## 1.3.0-next.0

### Minor Changes

- [#15974](https://github.com/LedgerHQ/ledger-live/pull/15974) [`7aa0706`](https://github.com/LedgerHQ/ledger-live/commit/7aa070618866e7a4c70876e674f07fde9630ccfb) Thanks [@qperrot](https://github.com/qperrot)! - Feat: Add support for tz2 (secp256k1) Tezos accounts in add account and signing flows, while preserving tz1 (Ed25519) as the default new account type

- [#15683](https://github.com/LedgerHQ/ledger-live/pull/15683) [`3b83607`](https://github.com/LedgerHQ/ledger-live/commit/3b83607a045142a8408784c92b57d8bde01445df) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Add staking feature to mina coin-module

- [#15823](https://github.com/LedgerHQ/ledger-live/pull/15823) [`24656de`](https://github.com/LedgerHQ/ledger-live/commit/24656dea461d4d99dcb5f5e2e4b4e949b0823eeb) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Reduce redundant eth_call calls to node by implementing includeAssets from BalanceOptions

- [#16023](https://github.com/LedgerHQ/ledger-live/pull/16023) [`c910c1b`](https://github.com/LedgerHQ/ledger-live/commit/c910c1bd9b4f7fbcc0e33fe19b33da44085ab7f9) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - chore: remove eslint and prettier, replace with with oxlint and oxfmt

- [#15916](https://github.com/LedgerHQ/ledger-live/pull/15916) [`4cf9b8c`](https://github.com/LedgerHQ/ledger-live/commit/4cf9b8cde388aebfe04a894e9a35584856d1713d) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(generic-staking): update generic adapter to support staking

- [#15983](https://github.com/LedgerHQ/ledger-live/pull/15983) [`cd59c95`](https://github.com/LedgerHQ/ledger-live/commit/cd59c95d04bd886114802ca887e1209d2191eaee) Thanks [@acewf](https://github.com/acewf)! - add FA2 Tokens support to list of operations

- [#15798](https://github.com/LedgerHQ/ledger-live/pull/15798) [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore: use `coin-module-framework` from npmjs and remove the now migrated `coin-framework`

### Patch Changes

- Updated dependencies [[`ad5a37d`](https://github.com/LedgerHQ/ledger-live/commit/ad5a37d077dced734defcd464f120825e7bbf5e9), [`2d5c7e0`](https://github.com/LedgerHQ/ledger-live/commit/2d5c7e0cc27f45babe247b39b513d4e848707b01), [`78acbfa`](https://github.com/LedgerHQ/ledger-live/commit/78acbfae7319c5b3fb1453f8727e2210e895669c), [`1bd0cac`](https://github.com/LedgerHQ/ledger-live/commit/1bd0cac7957422fa06e18424e9e2706c39072078), [`7aa0706`](https://github.com/LedgerHQ/ledger-live/commit/7aa070618866e7a4c70876e674f07fde9630ccfb), [`3b83607`](https://github.com/LedgerHQ/ledger-live/commit/3b83607a045142a8408784c92b57d8bde01445df), [`c910c1b`](https://github.com/LedgerHQ/ledger-live/commit/c910c1bd9b4f7fbcc0e33fe19b33da44085ab7f9), [`139cdbf`](https://github.com/LedgerHQ/ledger-live/commit/139cdbfd48120247ff54f5f7863ce866a6a755d0), [`4cf9b8c`](https://github.com/LedgerHQ/ledger-live/commit/4cf9b8cde388aebfe04a894e9a35584856d1713d), [`97d7278`](https://github.com/LedgerHQ/ledger-live/commit/97d727824cef6a5b5a2d034d9b029e4f977f1754), [`63b5b9a`](https://github.com/LedgerHQ/ledger-live/commit/63b5b9a3f3b88fa41f02983350cdb6e73a887839), [`f36e748`](https://github.com/LedgerHQ/ledger-live/commit/f36e74881c03a25164c0eac24b13765bbbbbb440), [`46e78cf`](https://github.com/LedgerHQ/ledger-live/commit/46e78cf3a057a9de39a5abbb49fe779655db6507)]:
  - @ledgerhq/cryptoassets@13.46.0-next.0
  - @ledgerhq/types-live@6.105.0-next.0
  - @ledgerhq/live-env@2.33.0-next.0
  - @ledgerhq/errors@6.34.0-next.0
  - @ledgerhq/live-currency-format@0.8.1-next.0
  - @ledgerhq/live-network@2.5.1-next.0
  - @ledgerhq/devices@8.14.1-next.0

## 1.2.0

### Minor Changes

- [#16017](https://github.com/LedgerHQ/ledger-live/pull/16017) [`9413def`](https://github.com/LedgerHQ/ledger-live/commit/9413def2fb1eccfc0ec8ce38bbcaf982981a0dd9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add stablecoin preset to desktop mock account generator for 7 networks (Ethereum, Arbitrum, Optimism, Base, Solana, Tron, Algorand) with top stablecoins per network

- [#15798](https://github.com/LedgerHQ/ledger-live/pull/15798) [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore: use `coin-module-framework` from npmjs and remove the now migrated `coin-framework`

### Patch Changes

- Updated dependencies [[`24e8f80`](https://github.com/LedgerHQ/ledger-live/commit/24e8f80dc314619f954e6966aff8698591d6e05e), [`ea34195`](https://github.com/LedgerHQ/ledger-live/commit/ea34195c1115aaa40c69259ee2d2ee581e0349ab), [`7ffc0c5`](https://github.com/LedgerHQ/ledger-live/commit/7ffc0c5a7623aea32cdff2e093c14fae87352e71), [`53df748`](https://github.com/LedgerHQ/ledger-live/commit/53df74819753f084ed3df4a2ab9082d398b54920), [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8), [`2ece647`](https://github.com/LedgerHQ/ledger-live/commit/2ece647f386e40f261662fc6e4e6624f302ee34f), [`55c01bc`](https://github.com/LedgerHQ/ledger-live/commit/55c01bcd8e43f9a54e93a41bb383d6d5c633b35f)]:
  - @ledgerhq/types-live@6.104.0
  - @ledgerhq/live-env@2.32.0
  - @ledgerhq/errors@6.33.0
  - @ledgerhq/cryptoassets@13.45.0
  - @ledgerhq/devices@8.14.0
  - @ledgerhq/logs@6.17.0
  - @ledgerhq/types-cryptoassets@7.36.0
  - @ledgerhq/live-config@3.7.0
  - @ledgerhq/live-currency-format@0.8.0
  - @ledgerhq/live-network@2.5.0

## 1.2.0-next.0

### Minor Changes

- [#16017](https://github.com/LedgerHQ/ledger-live/pull/16017) [`9413def`](https://github.com/LedgerHQ/ledger-live/commit/9413def2fb1eccfc0ec8ce38bbcaf982981a0dd9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add stablecoin preset to desktop mock account generator for 7 networks (Ethereum, Arbitrum, Optimism, Base, Solana, Tron, Algorand) with top stablecoins per network

- [#15798](https://github.com/LedgerHQ/ledger-live/pull/15798) [`fd2311d`](https://github.com/LedgerHQ/ledger-live/commit/fd2311d643f4002c1441bfa4fe79d7288df04c21) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore: use `coin-module-framework` from npmjs and remove the now migrated `coin-framework`

### Patch Changes

- Updated dependencies [[`24e8f80`](https://github.com/LedgerHQ/ledger-live/commit/24e8f80dc314619f954e6966aff8698591d6e05e), [`ea34195`](https://github.com/LedgerHQ/ledger-live/commit/ea34195c1115aaa40c69259ee2d2ee581e0349ab), [`7ffc0c5`](https://github.com/LedgerHQ/ledger-live/commit/7ffc0c5a7623aea32cdff2e093c14fae87352e71), [`53df748`](https://github.com/LedgerHQ/ledger-live/commit/53df74819753f084ed3df4a2ab9082d398b54920), [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8), [`2ece647`](https://github.com/LedgerHQ/ledger-live/commit/2ece647f386e40f261662fc6e4e6624f302ee34f), [`55c01bc`](https://github.com/LedgerHQ/ledger-live/commit/55c01bcd8e43f9a54e93a41bb383d6d5c633b35f)]:
  - @ledgerhq/types-live@6.104.0-next.0
  - @ledgerhq/live-env@2.32.0-next.0
  - @ledgerhq/errors@6.33.0-next.0
  - @ledgerhq/cryptoassets@13.45.0-next.0
  - @ledgerhq/devices@8.14.0-next.0
  - @ledgerhq/logs@6.17.0-next.0
  - @ledgerhq/types-cryptoassets@7.36.0-next.0
  - @ledgerhq/live-config@3.7.0-next.0
  - @ledgerhq/live-currency-format@0.8.0-next.0
  - @ledgerhq/live-network@2.5.0-next.0

## 1.1.0

### Minor Changes

- [#15465](https://github.com/LedgerHQ/ledger-live/pull/15465) [`d0559d8`](https://github.com/LedgerHQ/ledger-live/commit/d0559d84e119c844d92dc82c7648d0d9dc6c6e20) Thanks [@ishaba](https://github.com/ishaba)! - feat(sui): add support for testnet config

- [#15617](https://github.com/LedgerHQ/ledger-live/pull/15617) [`e0de96e`](https://github.com/LedgerHQ/ledger-live/commit/e0de96e6311de7e34715784da5941e60ed5c51cc) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: update aleo derivation path

- [#15487](https://github.com/LedgerHQ/ledger-live/pull/15487) [`c5c58e4`](https://github.com/LedgerHQ/ledger-live/commit/c5c58e4efab303a5b6bccc463f91241f4e0f72bc) Thanks [@qperrot](https://github.com/qperrot)! - fix: refactor bridge api definition

### Patch Changes

- Updated dependencies [[`4af828d`](https://github.com/LedgerHQ/ledger-live/commit/4af828d0790bb3568dd095f89dd9f239f7565e84), [`1bf4e7e`](https://github.com/LedgerHQ/ledger-live/commit/1bf4e7efa2fbb310f9c3db8f5d72e68294f0f3fe), [`d0559d8`](https://github.com/LedgerHQ/ledger-live/commit/d0559d84e119c844d92dc82c7648d0d9dc6c6e20), [`deec161`](https://github.com/LedgerHQ/ledger-live/commit/deec16153656d444336f067970dcda5fff016d95), [`41d172e`](https://github.com/LedgerHQ/ledger-live/commit/41d172e74bc074995b7290c4bb6d129276a484ff)]:
  - @ledgerhq/coin-framework@7.1.0
  - @ledgerhq/types-live@6.103.0
  - @ledgerhq/cryptoassets@13.44.0
  - @ledgerhq/live-env@2.31.0
  - @ledgerhq/live-currency-format@0.7.1
  - @ledgerhq/live-network@2.4.3

## 1.1.0-next.0

### Minor Changes

- [#15465](https://github.com/LedgerHQ/ledger-live/pull/15465) [`d0559d8`](https://github.com/LedgerHQ/ledger-live/commit/d0559d84e119c844d92dc82c7648d0d9dc6c6e20) Thanks [@ishaba](https://github.com/ishaba)! - feat(sui): add support for testnet config

- [#15617](https://github.com/LedgerHQ/ledger-live/pull/15617) [`e0de96e`](https://github.com/LedgerHQ/ledger-live/commit/e0de96e6311de7e34715784da5941e60ed5c51cc) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: update aleo derivation path

- [#15487](https://github.com/LedgerHQ/ledger-live/pull/15487) [`c5c58e4`](https://github.com/LedgerHQ/ledger-live/commit/c5c58e4efab303a5b6bccc463f91241f4e0f72bc) Thanks [@qperrot](https://github.com/qperrot)! - fix: refactor bridge api definition

### Patch Changes

- Updated dependencies [[`4af828d`](https://github.com/LedgerHQ/ledger-live/commit/4af828d0790bb3568dd095f89dd9f239f7565e84), [`1bf4e7e`](https://github.com/LedgerHQ/ledger-live/commit/1bf4e7efa2fbb310f9c3db8f5d72e68294f0f3fe), [`d0559d8`](https://github.com/LedgerHQ/ledger-live/commit/d0559d84e119c844d92dc82c7648d0d9dc6c6e20), [`deec161`](https://github.com/LedgerHQ/ledger-live/commit/deec16153656d444336f067970dcda5fff016d95), [`41d172e`](https://github.com/LedgerHQ/ledger-live/commit/41d172e74bc074995b7290c4bb6d129276a484ff)]:
  - @ledgerhq/coin-framework@7.1.0-next.0
  - @ledgerhq/types-live@6.103.0-next.0
  - @ledgerhq/cryptoassets@13.44.0-next.0
  - @ledgerhq/live-env@2.31.0-next.0
  - @ledgerhq/live-currency-format@0.7.1-next.0
  - @ledgerhq/live-network@2.4.3-next.0

## 1.0.1

### Patch Changes

- Updated dependencies [[`a221ae8`](https://github.com/LedgerHQ/ledger-live/commit/a221ae85b846c6d5dc6efb55ed873942d7720b05), [`a270b43`](https://github.com/LedgerHQ/ledger-live/commit/a270b438bf8aca99b795679fecce1b55dc249c12), [`982d4af`](https://github.com/LedgerHQ/ledger-live/commit/982d4afbeb7faf3814c3e96ffb6e3e88b58dfe73), [`6dac7f9`](https://github.com/LedgerHQ/ledger-live/commit/6dac7f974c28dcae409c110a60061996490c5088), [`8ce1cb7`](https://github.com/LedgerHQ/ledger-live/commit/8ce1cb755b3e68c8688f9e828596d3c2605ef3cb), [`01c81b1`](https://github.com/LedgerHQ/ledger-live/commit/01c81b112ab326eff436f0f3279a1225c073f897), [`3ede91a`](https://github.com/LedgerHQ/ledger-live/commit/3ede91a3674a80c9309d305b871ec3b6e9849b41)]:
  - @ledgerhq/coin-framework@7.0.0
  - @ledgerhq/types-live@6.102.0
  - @ledgerhq/devices@8.13.0
  - @ledgerhq/errors@6.32.0
  - @ledgerhq/cryptoassets@13.43.0
  - @ledgerhq/live-currency-format@0.7.0
  - @ledgerhq/live-network@2.4.2

## 1.0.1-next.0

### Patch Changes

- Updated dependencies [[`a221ae8`](https://github.com/LedgerHQ/ledger-live/commit/a221ae85b846c6d5dc6efb55ed873942d7720b05), [`a270b43`](https://github.com/LedgerHQ/ledger-live/commit/a270b438bf8aca99b795679fecce1b55dc249c12), [`982d4af`](https://github.com/LedgerHQ/ledger-live/commit/982d4afbeb7faf3814c3e96ffb6e3e88b58dfe73), [`6dac7f9`](https://github.com/LedgerHQ/ledger-live/commit/6dac7f974c28dcae409c110a60061996490c5088), [`8ce1cb7`](https://github.com/LedgerHQ/ledger-live/commit/8ce1cb755b3e68c8688f9e828596d3c2605ef3cb), [`01c81b1`](https://github.com/LedgerHQ/ledger-live/commit/01c81b112ab326eff436f0f3279a1225c073f897), [`3ede91a`](https://github.com/LedgerHQ/ledger-live/commit/3ede91a3674a80c9309d305b871ec3b6e9849b41)]:
  - @ledgerhq/coin-framework@7.0.0-next.0
  - @ledgerhq/types-live@6.102.0-next.0
  - @ledgerhq/devices@8.13.0-next.0
  - @ledgerhq/errors@6.32.0-next.0
  - @ledgerhq/cryptoassets@13.43.0-next.0
  - @ledgerhq/live-currency-format@0.7.0-next.0
  - @ledgerhq/live-network@2.4.2-next.0
