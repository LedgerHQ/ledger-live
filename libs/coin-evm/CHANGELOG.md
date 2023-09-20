# @ledgerhq/coin-evm

## 0.7.0-next.0

### Minor Changes

- [#4741](https://github.com/LedgerHQ/ledger-live/pull/4741) [`a134f28e9d`](https://github.com/LedgerHQ/ledger-live/commit/a134f28e9d220d172148619ed281d4ca897d5532) Thanks [@chabroA](https://github.com/chabroA)! - Add gasOption serialisation and deserialisation to evm transactions

- [#4285](https://github.com/LedgerHQ/ledger-live/pull/4285) [`533278e2c4`](https://github.com/LedgerHQ/ledger-live/commit/533278e2c40ee764ecb87d4430fa6650f251ff0c) Thanks [@chabroA](https://github.com/chabroA)! - Migrate Ethereum family implementation to EVM family

  Replace the legcay Ethereum familly implementation that was present in ledger-live-common by the coin-evm lib implementation.
  This change was made in order to improve scalabillity and maintainability of the evm coins, as well as more easilly integrate new evm based chains in the future.

### Patch Changes

- Updated dependencies [[`c86637f6e5`](https://github.com/LedgerHQ/ledger-live/commit/c86637f6e57845716a791854dd8f686807152e73), [`72288402ec`](https://github.com/LedgerHQ/ledger-live/commit/72288402ec70f9159022505cb3187e63b24df450), [`f527d1bb5a`](https://github.com/LedgerHQ/ledger-live/commit/f527d1bb5a2888a916f761d43d2ba5093eaa3e3f), [`a134f28e9d`](https://github.com/LedgerHQ/ledger-live/commit/a134f28e9d220d172148619ed281d4ca897d5532), [`49ea3fd98b`](https://github.com/LedgerHQ/ledger-live/commit/49ea3fd98ba1e1e0ed54d29ab5fdc71c4918183f), [`533278e2c4`](https://github.com/LedgerHQ/ledger-live/commit/533278e2c40ee764ecb87d4430fa6650f251ff0c), [`70e4277bc9`](https://github.com/LedgerHQ/ledger-live/commit/70e4277bc9dda253b894bdae5f2c8a5f43a9a64e)]:
  - @ledgerhq/hw-app-eth@6.34.6-next.0
  - @ledgerhq/cryptoassets@10.0.0-next.0
  - @ledgerhq/types-cryptoassets@7.5.0-next.0
  - @ledgerhq/types-live@6.40.0-next.0
  - @ledgerhq/coin-framework@0.6.0-next.0
  - @ledgerhq/live-env@0.6.0-next.0
  - @ledgerhq/domain-service@1.1.11-next.0
  - @ledgerhq/evm-tools@1.0.7-next.0
  - @ledgerhq/live-network@1.1.7-next.0

## 0.6.1

### Patch Changes

- Updated dependencies [[`e0cc3a0841`](https://github.com/LedgerHQ/ledger-live/commit/e0cc3a08415de84b9d3ce828444248a043a9d699), [`18b4a47b48`](https://github.com/LedgerHQ/ledger-live/commit/18b4a47b4878a23695a50096b7770134883b8a2e)]:
  - @ledgerhq/coin-framework@0.5.3
  - @ledgerhq/cryptoassets@9.12.1
  - @ledgerhq/domain-service@1.1.10
  - @ledgerhq/evm-tools@1.0.6
  - @ledgerhq/hw-app-eth@6.34.5

## 0.6.0

### Minor Changes

- [#4235](https://github.com/LedgerHQ/ledger-live/pull/4235) [`8e9df43a0c`](https://github.com/LedgerHQ/ledger-live/commit/8e9df43a0cd00a2065b494439f300f96724b8eb8) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Better typing for the Operation.extra field

### Patch Changes

- [#4391](https://github.com/LedgerHQ/ledger-live/pull/4391) [`fde2fe79f1`](https://github.com/LedgerHQ/ledger-live/commit/fde2fe79f1df69fffe80763cd6d9792fe9de1262) Thanks [@valpinkman](https://github.com/valpinkman)! - Rework some env typings

- [#4452](https://github.com/LedgerHQ/ledger-live/pull/4452) [`1020f27632`](https://github.com/LedgerHQ/ledger-live/commit/1020f276322fe361585a56573091ec647fbd901e) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix evm integration tests

- [#4268](https://github.com/LedgerHQ/ledger-live/pull/4268) [`707e59f8b5`](https://github.com/LedgerHQ/ledger-live/commit/707e59f8b516448e6f2845288ad4cb3f5488e688) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix pending transaction bug in evm family

- Updated dependencies [[`8e9df43a0c`](https://github.com/LedgerHQ/ledger-live/commit/8e9df43a0cd00a2065b494439f300f96724b8eb8), [`fde2fe79f1`](https://github.com/LedgerHQ/ledger-live/commit/fde2fe79f1df69fffe80763cd6d9792fe9de1262), [`f6f70ba0e8`](https://github.com/LedgerHQ/ledger-live/commit/f6f70ba0e85c7898cdeec19402b1eadfde6a2206), [`45be23c776`](https://github.com/LedgerHQ/ledger-live/commit/45be23c77666697dbe395f836ab592062173d5cb), [`6375c250a9`](https://github.com/LedgerHQ/ledger-live/commit/6375c250a9a58b33e3dd1d6c96a96c7e46150298), [`0d9ad3599b`](https://github.com/LedgerHQ/ledger-live/commit/0d9ad3599bce8872fde97d27c977ab24445afc3a)]:
  - @ledgerhq/types-live@6.39.0
  - @ledgerhq/live-env@0.5.0
  - @ledgerhq/coin-framework@0.5.2
  - @ledgerhq/cryptoassets@9.12.0
  - @ledgerhq/domain-service@1.1.9
  - @ledgerhq/evm-tools@1.0.5
  - @ledgerhq/hw-app-eth@6.34.4
  - @ledgerhq/live-network@1.1.6

## 0.6.0-next.0

### Minor Changes

- [#4235](https://github.com/LedgerHQ/ledger-live/pull/4235) [`8e9df43a0c`](https://github.com/LedgerHQ/ledger-live/commit/8e9df43a0cd00a2065b494439f300f96724b8eb8) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Better typing for the Operation.extra field

### Patch Changes

- [#4391](https://github.com/LedgerHQ/ledger-live/pull/4391) [`fde2fe79f1`](https://github.com/LedgerHQ/ledger-live/commit/fde2fe79f1df69fffe80763cd6d9792fe9de1262) Thanks [@valpinkman](https://github.com/valpinkman)! - Rework some env typings

- [#4452](https://github.com/LedgerHQ/ledger-live/pull/4452) [`1020f27632`](https://github.com/LedgerHQ/ledger-live/commit/1020f276322fe361585a56573091ec647fbd901e) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix evm integration tests

- [#4268](https://github.com/LedgerHQ/ledger-live/pull/4268) [`707e59f8b5`](https://github.com/LedgerHQ/ledger-live/commit/707e59f8b516448e6f2845288ad4cb3f5488e688) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix pending transaction bug in evm family

- Updated dependencies [[`8e9df43a0c`](https://github.com/LedgerHQ/ledger-live/commit/8e9df43a0cd00a2065b494439f300f96724b8eb8), [`fde2fe79f1`](https://github.com/LedgerHQ/ledger-live/commit/fde2fe79f1df69fffe80763cd6d9792fe9de1262), [`f6f70ba0e8`](https://github.com/LedgerHQ/ledger-live/commit/f6f70ba0e85c7898cdeec19402b1eadfde6a2206), [`45be23c776`](https://github.com/LedgerHQ/ledger-live/commit/45be23c77666697dbe395f836ab592062173d5cb), [`6375c250a9`](https://github.com/LedgerHQ/ledger-live/commit/6375c250a9a58b33e3dd1d6c96a96c7e46150298), [`0d9ad3599b`](https://github.com/LedgerHQ/ledger-live/commit/0d9ad3599bce8872fde97d27c977ab24445afc3a)]:
  - @ledgerhq/types-live@6.39.0-next.0
  - @ledgerhq/live-env@0.5.0-next.0
  - @ledgerhq/coin-framework@0.5.2-next.0
  - @ledgerhq/cryptoassets@9.12.0-next.0
  - @ledgerhq/domain-service@1.1.9-next.0
  - @ledgerhq/evm-tools@1.0.5-next.0
  - @ledgerhq/hw-app-eth@6.34.4-next.0
  - @ledgerhq/live-network@1.1.6-next.0

## 0.5.1

### Patch Changes

- Updated dependencies [[`5bbcea12f9`](https://github.com/LedgerHQ/ledger-live/commit/5bbcea12f93e3cda41705a4d61d50845628a6de6), [`95088eab45`](https://github.com/LedgerHQ/ledger-live/commit/95088eab45f6af919e347a605cefefb6d7705808), [`a61a43fc47`](https://github.com/LedgerHQ/ledger-live/commit/a61a43fc47399e969fa68539de6af51bfa41e921), [`4c2539a1d5`](https://github.com/LedgerHQ/ledger-live/commit/4c2539a1d5c9c01c0f9fa7cd1daf5a5a63c02996), [`229cf62304`](https://github.com/LedgerHQ/ledger-live/commit/229cf623043b29eefed3e8e37a102325fa6e0387), [`3455944496`](https://github.com/LedgerHQ/ledger-live/commit/34559444969ce1571ff4c54f33feb7f3fb59a33a)]:
  - @ledgerhq/types-live@6.38.1
  - @ledgerhq/live-env@0.4.2
  - @ledgerhq/errors@6.14.0
  - @ledgerhq/cryptoassets@9.11.1
  - @ledgerhq/coin-framework@0.5.1
  - @ledgerhq/domain-service@1.1.8
  - @ledgerhq/evm-tools@1.0.4
  - @ledgerhq/hw-app-eth@6.34.3
  - @ledgerhq/live-network@1.1.5
  - @ledgerhq/devices@8.0.7

## 0.5.1-next.0

### Patch Changes

- Updated dependencies [[`5bbcea12f9`](https://github.com/LedgerHQ/ledger-live/commit/5bbcea12f93e3cda41705a4d61d50845628a6de6), [`95088eab45`](https://github.com/LedgerHQ/ledger-live/commit/95088eab45f6af919e347a605cefefb6d7705808), [`a61a43fc47`](https://github.com/LedgerHQ/ledger-live/commit/a61a43fc47399e969fa68539de6af51bfa41e921), [`4c2539a1d5`](https://github.com/LedgerHQ/ledger-live/commit/4c2539a1d5c9c01c0f9fa7cd1daf5a5a63c02996), [`229cf62304`](https://github.com/LedgerHQ/ledger-live/commit/229cf623043b29eefed3e8e37a102325fa6e0387), [`3455944496`](https://github.com/LedgerHQ/ledger-live/commit/34559444969ce1571ff4c54f33feb7f3fb59a33a)]:
  - @ledgerhq/types-live@6.38.1-next.0
  - @ledgerhq/live-env@0.4.2-next.0
  - @ledgerhq/errors@6.14.0-next.0
  - @ledgerhq/cryptoassets@9.11.1-next.0
  - @ledgerhq/coin-framework@0.5.1-next.0
  - @ledgerhq/domain-service@1.1.8-next.0
  - @ledgerhq/evm-tools@1.0.4-next.0
  - @ledgerhq/hw-app-eth@6.34.3-next.0
  - @ledgerhq/live-network@1.1.5-next.0
  - @ledgerhq/devices@8.0.7-next.0

## 0.5.0

### Minor Changes

- [#4021](https://github.com/LedgerHQ/ledger-live/pull/4021) [`e5f9cc46d6`](https://github.com/LedgerHQ/ledger-live/commit/e5f9cc46d69b82ad7267296b350e9d97a47f9e86) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add telos evm currency

- [#3704](https://github.com/LedgerHQ/ledger-live/pull/3704) [`b6e50932af`](https://github.com/LedgerHQ/ledger-live/commit/b6e50932afac6acc2d2f9fa9ed10b77a62378e03) Thanks [@chabroA](https://github.com/chabroA)! - Create EVM send flow

- [#3827](https://github.com/LedgerHQ/ledger-live/pull/3827) [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Ledger infra as node and/or explorer

- [#4015](https://github.com/LedgerHQ/ledger-live/pull/4015) [`374e339c27`](https://github.com/LedgerHQ/ledger-live/commit/374e339c27e317656d01463a822898ad3a60df85) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Polygon zkEVM, Base Goerli, Klaytn

### Patch Changes

- [#4090](https://github.com/LedgerHQ/ledger-live/pull/4090) [`7675787398`](https://github.com/LedgerHQ/ledger-live/commit/767578739822597768f877f94fd8f7f35441395a) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix building & bundling of `evm-tools` & `domain-service` libs due to .gitignore(s)

- [#4143](https://github.com/LedgerHQ/ledger-live/pull/4143) [`c2fd7e2e3d`](https://github.com/LedgerHQ/ledger-live/commit/c2fd7e2e3d684da831a7eafe6b22b5e2c96a3722) Thanks [@chabroA](https://github.com/chabroA)! - Add missing teloscan in type guard

- Updated dependencies [[`1263b7a9c1`](https://github.com/LedgerHQ/ledger-live/commit/1263b7a9c1916da81ad55bb2ca1e804cff5f89e2), [`770842cdbe`](https://github.com/LedgerHQ/ledger-live/commit/770842cdbe94c629b6844f93d1b5d94d381931b1), [`e5f9cc46d6`](https://github.com/LedgerHQ/ledger-live/commit/e5f9cc46d69b82ad7267296b350e9d97a47f9e86), [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1), [`cfbff52724`](https://github.com/LedgerHQ/ledger-live/commit/cfbff527241534aba69bff3d86733b50a14eb4ce), [`b6e50932af`](https://github.com/LedgerHQ/ledger-live/commit/b6e50932afac6acc2d2f9fa9ed10b77a62378e03), [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1), [`7675787398`](https://github.com/LedgerHQ/ledger-live/commit/767578739822597768f877f94fd8f7f35441395a), [`95ac67a5e0`](https://github.com/LedgerHQ/ledger-live/commit/95ac67a5e0359b03c7d82c34fd1f2f3b6eb7df22), [`c7c484acf0`](https://github.com/LedgerHQ/ledger-live/commit/c7c484acf01e9db8dc5a5507b62ffcb863c77ca4), [`374e339c27`](https://github.com/LedgerHQ/ledger-live/commit/374e339c27e317656d01463a822898ad3a60df85), [`66769a98e6`](https://github.com/LedgerHQ/ledger-live/commit/66769a98e69f2b8156417e464e90d9162272b470)]:
  - @ledgerhq/cryptoassets@9.11.0
  - @ledgerhq/live-env@0.4.1
  - @ledgerhq/types-cryptoassets@7.4.0
  - @ledgerhq/types-live@6.38.0
  - @ledgerhq/coin-framework@0.5.0
  - @ledgerhq/evm-tools@1.0.3
  - @ledgerhq/hw-app-eth@6.34.2
  - @ledgerhq/errors@6.13.1
  - @ledgerhq/domain-service@1.1.7
  - @ledgerhq/live-network@1.1.4
  - @ledgerhq/devices@8.0.6

## 0.5.0-next.0

### Minor Changes

- [#4021](https://github.com/LedgerHQ/ledger-live/pull/4021) [`e5f9cc46d6`](https://github.com/LedgerHQ/ledger-live/commit/e5f9cc46d69b82ad7267296b350e9d97a47f9e86) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add telos evm currency

- [#3704](https://github.com/LedgerHQ/ledger-live/pull/3704) [`b6e50932af`](https://github.com/LedgerHQ/ledger-live/commit/b6e50932afac6acc2d2f9fa9ed10b77a62378e03) Thanks [@chabroA](https://github.com/chabroA)! - Create EVM send flow

- [#3827](https://github.com/LedgerHQ/ledger-live/pull/3827) [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Ledger infra as node and/or explorer

- [#4015](https://github.com/LedgerHQ/ledger-live/pull/4015) [`374e339c27`](https://github.com/LedgerHQ/ledger-live/commit/374e339c27e317656d01463a822898ad3a60df85) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Polygon zkEVM, Base Goerli, Klaytn

### Patch Changes

- [#4090](https://github.com/LedgerHQ/ledger-live/pull/4090) [`7675787398`](https://github.com/LedgerHQ/ledger-live/commit/767578739822597768f877f94fd8f7f35441395a) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix building & bundling of `evm-tools` & `domain-service` libs due to .gitignore(s)

- [#4143](https://github.com/LedgerHQ/ledger-live/pull/4143) [`c2fd7e2e3d`](https://github.com/LedgerHQ/ledger-live/commit/c2fd7e2e3d684da831a7eafe6b22b5e2c96a3722) Thanks [@chabroA](https://github.com/chabroA)! - Add missing teloscan in type guard

- Updated dependencies [[`1263b7a9c1`](https://github.com/LedgerHQ/ledger-live/commit/1263b7a9c1916da81ad55bb2ca1e804cff5f89e2), [`770842cdbe`](https://github.com/LedgerHQ/ledger-live/commit/770842cdbe94c629b6844f93d1b5d94d381931b1), [`e5f9cc46d6`](https://github.com/LedgerHQ/ledger-live/commit/e5f9cc46d69b82ad7267296b350e9d97a47f9e86), [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1), [`cfbff52724`](https://github.com/LedgerHQ/ledger-live/commit/cfbff527241534aba69bff3d86733b50a14eb4ce), [`b6e50932af`](https://github.com/LedgerHQ/ledger-live/commit/b6e50932afac6acc2d2f9fa9ed10b77a62378e03), [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1), [`7675787398`](https://github.com/LedgerHQ/ledger-live/commit/767578739822597768f877f94fd8f7f35441395a), [`95ac67a5e0`](https://github.com/LedgerHQ/ledger-live/commit/95ac67a5e0359b03c7d82c34fd1f2f3b6eb7df22), [`c7c484acf0`](https://github.com/LedgerHQ/ledger-live/commit/c7c484acf01e9db8dc5a5507b62ffcb863c77ca4), [`374e339c27`](https://github.com/LedgerHQ/ledger-live/commit/374e339c27e317656d01463a822898ad3a60df85), [`66769a98e6`](https://github.com/LedgerHQ/ledger-live/commit/66769a98e69f2b8156417e464e90d9162272b470)]:
  - @ledgerhq/cryptoassets@9.11.0-next.0
  - @ledgerhq/live-env@0.4.1-next.0
  - @ledgerhq/types-cryptoassets@7.4.0-next.0
  - @ledgerhq/types-live@6.38.0-next.0
  - @ledgerhq/coin-framework@0.5.0-next.0
  - @ledgerhq/evm-tools@1.0.3-next.0
  - @ledgerhq/hw-app-eth@6.34.2-next.0
  - @ledgerhq/errors@6.13.1-next.0
  - @ledgerhq/domain-service@1.1.7-next.0
  - @ledgerhq/live-network@1.1.4-next.0
  - @ledgerhq/devices@8.0.6-next.0

## 0.4.1

### Patch Changes

- [#4103](https://github.com/LedgerHQ/ledger-live/pull/4103) [`2317fccb67`](https://github.com/LedgerHQ/ledger-live/commit/2317fccb6776a077eaca8828da8371d402323be4) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fix building & bundling of `evm-tools` & `domain-service` libs due to .gitignore(s)

- Updated dependencies [[`2317fccb67`](https://github.com/LedgerHQ/ledger-live/commit/2317fccb6776a077eaca8828da8371d402323be4)]:
  - @ledgerhq/evm-tools@1.0.2
  - @ledgerhq/hw-app-eth@6.34.1

## 0.4.1-hotfix.0

### Patch Changes

- [#4103](https://github.com/LedgerHQ/ledger-live/pull/4103) [`2317fccb67`](https://github.com/LedgerHQ/ledger-live/commit/2317fccb6776a077eaca8828da8371d402323be4) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fix building & bundling of `evm-tools` & `domain-service` libs due to .gitignore(s)

- Updated dependencies [[`2317fccb67`](https://github.com/LedgerHQ/ledger-live/commit/2317fccb6776a077eaca8828da8371d402323be4)]:
  - @ledgerhq/evm-tools@1.0.2-hotfix.0
  - @ledgerhq/hw-app-eth@6.34.1-hotfix.0

## 0.4.0

### Minor Changes

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Adding support for NFT transactions

- [#3786](https://github.com/LedgerHQ/ledger-live/pull/3786) [`11e62b1e1e`](https://github.com/LedgerHQ/ledger-live/commit/11e62b1e1e3773eeaad748453973e0b3bcd3e3bf) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Adds support for the `setLoadConfig` during the SignOperation step and adds the usage of environment variables to set the backends URIs

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for non finite quantity w/ NFT transaction data crafting

- [#3924](https://github.com/LedgerHQ/ledger-live/pull/3924) [`14cce73003`](https://github.com/LedgerHQ/ledger-live/commit/14cce7300333c51cbcdbd5a7e290ddc600c9f3a1) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Use of the `evm-tools` new library to bring support for SignMessage

### Patch Changes

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Prevent duplicated sub & nft operations with rate limited explorers & make explorerless implementation also patch sub & nft operations after transaction finalization

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Rename rpc file that prevented shims to be applied for React Native

- Updated dependencies [[`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`49182846de`](https://github.com/LedgerHQ/ledger-live/commit/49182846dee35ae9b3535c0c120e17d0eaecde70), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`c660c4e389`](https://github.com/LedgerHQ/ledger-live/commit/c660c4e389ac200ef308cbc3882930d392375de3), [`2c28d5aab3`](https://github.com/LedgerHQ/ledger-live/commit/2c28d5aab36b8b0cf2cb2a50e02eac4c5a588e41), [`0f4293e9bf`](https://github.com/LedgerHQ/ledger-live/commit/0f4293e9bf9cac4c2a195efeb0831aab3d51933d), [`14cce73003`](https://github.com/LedgerHQ/ledger-live/commit/14cce7300333c51cbcdbd5a7e290ddc600c9f3a1), [`14cce73003`](https://github.com/LedgerHQ/ledger-live/commit/14cce7300333c51cbcdbd5a7e290ddc600c9f3a1), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`bae3b64dd2`](https://github.com/LedgerHQ/ledger-live/commit/bae3b64dd2710a3743552600166be986e93d9099), [`9692adc2a6`](https://github.com/LedgerHQ/ledger-live/commit/9692adc2a6774feb4424fc7a984810918c946b1b), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec)]:
  - @ledgerhq/live-env@0.4.0
  - @ledgerhq/coin-framework@0.4.0
  - @ledgerhq/cryptoassets@9.10.0
  - @ledgerhq/errors@6.13.0
  - @ledgerhq/types-live@6.37.0
  - @ledgerhq/hw-app-eth@6.34.0
  - @ledgerhq/types-cryptoassets@7.3.1
  - @ledgerhq/evm-tools@1.0.1
  - @ledgerhq/live-network@1.1.3
  - @ledgerhq/domain-service@1.1.6
  - @ledgerhq/devices@8.0.5

## 0.4.0-next.0

### Minor Changes

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Adding support for NFT transactions

- [#3786](https://github.com/LedgerHQ/ledger-live/pull/3786) [`11e62b1e1e`](https://github.com/LedgerHQ/ledger-live/commit/11e62b1e1e3773eeaad748453973e0b3bcd3e3bf) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Adds support for the `setLoadConfig` during the SignOperation step and adds the usage of environment variables to set the backends URIs

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for non finite quantity w/ NFT transaction data crafting

- [#3924](https://github.com/LedgerHQ/ledger-live/pull/3924) [`14cce73003`](https://github.com/LedgerHQ/ledger-live/commit/14cce7300333c51cbcdbd5a7e290ddc600c9f3a1) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Use of the `evm-tools` new library to bring support for SignMessage

### Patch Changes

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Prevent duplicated sub & nft operations with rate limited explorers & make explorerless implementation also patch sub & nft operations after transaction finalization

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Rename rpc file that prevented shims to be applied for React Native

- Updated dependencies [[`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`49182846de`](https://github.com/LedgerHQ/ledger-live/commit/49182846dee35ae9b3535c0c120e17d0eaecde70), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`c660c4e389`](https://github.com/LedgerHQ/ledger-live/commit/c660c4e389ac200ef308cbc3882930d392375de3), [`2c28d5aab3`](https://github.com/LedgerHQ/ledger-live/commit/2c28d5aab36b8b0cf2cb2a50e02eac4c5a588e41), [`0f4293e9bf`](https://github.com/LedgerHQ/ledger-live/commit/0f4293e9bf9cac4c2a195efeb0831aab3d51933d), [`14cce73003`](https://github.com/LedgerHQ/ledger-live/commit/14cce7300333c51cbcdbd5a7e290ddc600c9f3a1), [`14cce73003`](https://github.com/LedgerHQ/ledger-live/commit/14cce7300333c51cbcdbd5a7e290ddc600c9f3a1), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`bae3b64dd2`](https://github.com/LedgerHQ/ledger-live/commit/bae3b64dd2710a3743552600166be986e93d9099), [`9692adc2a6`](https://github.com/LedgerHQ/ledger-live/commit/9692adc2a6774feb4424fc7a984810918c946b1b), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec)]:
  - @ledgerhq/live-env@0.4.0-next.0
  - @ledgerhq/coin-framework@0.4.0-next.0
  - @ledgerhq/cryptoassets@9.10.0-next.0
  - @ledgerhq/errors@6.13.0-next.0
  - @ledgerhq/types-live@6.37.0-next.0
  - @ledgerhq/hw-app-eth@6.34.0-next.0
  - @ledgerhq/types-cryptoassets@7.3.1-next.0
  - @ledgerhq/evm-tools@1.0.1-next.0
  - @ledgerhq/live-network@1.1.3-next.0
  - @ledgerhq/domain-service@1.1.6-next.0
  - @ledgerhq/devices@8.0.5-next.0

## 0.3.0

### Minor Changes

- [#3611](https://github.com/LedgerHQ/ledger-live/pull/3611) [`092cb8d317`](https://github.com/LedgerHQ/ledger-live/commit/092cb8d317fa7971e0f790b77f900ae3864d96c2) Thanks [@chabroA](https://github.com/chabroA)! - Create GasTracker abstraction for evm familly

### Patch Changes

- [#3741](https://github.com/LedgerHQ/ledger-live/pull/3741) [`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update eip55 dependency

- [#3741](https://github.com/LedgerHQ/ledger-live/pull/3741) [`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update eip55 dependency to 2.1.1 fixing browser context usage

- [#3872](https://github.com/LedgerHQ/ledger-live/pull/3872) [`d1d1578ab5`](https://github.com/LedgerHQ/ledger-live/commit/d1d1578ab5b351544c98d56b67c68f18640f2d20) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Rename rpc file that prevented shims to be applied for React Native

- Updated dependencies [[`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc), [`44192f2ab2`](https://github.com/LedgerHQ/ledger-live/commit/44192f2ab2857cbae2ef4a81ee9608d395dcd2b9), [`cb95f72c24`](https://github.com/LedgerHQ/ledger-live/commit/cb95f72c2415876ef88ca83fd2c4363a57669b92), [`be5f56b233`](https://github.com/LedgerHQ/ledger-live/commit/be5f56b2330c166323914b79fef37a3c05e0e13a), [`092cb8d317`](https://github.com/LedgerHQ/ledger-live/commit/092cb8d317fa7971e0f790b77f900ae3864d96c2), [`5af41b6fa1`](https://github.com/LedgerHQ/ledger-live/commit/5af41b6fa1e43037ccdb2df279c82e12ef3d2b1a), [`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc)]:
  - @ledgerhq/domain-service@1.1.5
  - @ledgerhq/types-live@6.36.0
  - @ledgerhq/cryptoassets@9.9.0
  - @ledgerhq/types-cryptoassets@7.3.0
  - @ledgerhq/live-env@0.3.1
  - @ledgerhq/hw-app-eth@6.33.7
  - @ledgerhq/coin-framework@0.3.7
  - @ledgerhq/live-network@1.1.2

## 0.3.0-next.1

### Patch Changes

- [#3872](https://github.com/LedgerHQ/ledger-live/pull/3872) [`d1d1578ab5`](https://github.com/LedgerHQ/ledger-live/commit/d1d1578ab5b351544c98d56b67c68f18640f2d20) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Rename rpc file that prevented shims to be applied for React Native

## 0.3.0-next.0

### Minor Changes

- [#3611](https://github.com/LedgerHQ/ledger-live/pull/3611) [`092cb8d317`](https://github.com/LedgerHQ/ledger-live/commit/092cb8d317fa7971e0f790b77f900ae3864d96c2) Thanks [@chabroA](https://github.com/chabroA)! - Create GasTracker abstraction for evm familly

### Patch Changes

- [#3741](https://github.com/LedgerHQ/ledger-live/pull/3741) [`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update eip55 dependency

- [#3741](https://github.com/LedgerHQ/ledger-live/pull/3741) [`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update eip55 dependency to 2.1.1 fixing browser context usage

- Updated dependencies [[`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc), [`44192f2ab2`](https://github.com/LedgerHQ/ledger-live/commit/44192f2ab2857cbae2ef4a81ee9608d395dcd2b9), [`cb95f72c24`](https://github.com/LedgerHQ/ledger-live/commit/cb95f72c2415876ef88ca83fd2c4363a57669b92), [`be5f56b233`](https://github.com/LedgerHQ/ledger-live/commit/be5f56b2330c166323914b79fef37a3c05e0e13a), [`092cb8d317`](https://github.com/LedgerHQ/ledger-live/commit/092cb8d317fa7971e0f790b77f900ae3864d96c2), [`5af41b6fa1`](https://github.com/LedgerHQ/ledger-live/commit/5af41b6fa1e43037ccdb2df279c82e12ef3d2b1a), [`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc)]:
  - @ledgerhq/domain-service@1.1.5-next.0
  - @ledgerhq/types-live@6.36.0-next.0
  - @ledgerhq/cryptoassets@9.9.0-next.0
  - @ledgerhq/types-cryptoassets@7.3.0-next.0
  - @ledgerhq/live-env@0.3.1-next.0
  - @ledgerhq/hw-app-eth@6.33.7-next.0
  - @ledgerhq/coin-framework@0.3.7-next.0
  - @ledgerhq/live-network@1.1.2-next.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`9adc1862dd`](https://github.com/LedgerHQ/ledger-live/commit/9adc1862dda605a722d19f3b6895bd324834c914), [`4a1454beb3`](https://github.com/LedgerHQ/ledger-live/commit/4a1454beb3f86405ba2686e07879c12a7d35ad8e), [`809065c571`](https://github.com/LedgerHQ/ledger-live/commit/809065c57198646a49adea112b9d799e35a57d25), [`d1aa522db7`](https://github.com/LedgerHQ/ledger-live/commit/d1aa522db75f7ea850efe412abaa4dc7d37af6b7), [`ebe5b07afe`](https://github.com/LedgerHQ/ledger-live/commit/ebe5b07afec441ea3e2d9103da9e1175972add47)]:
  - @ledgerhq/errors@6.12.7
  - @ledgerhq/cryptoassets@9.8.0
  - @ledgerhq/types-cryptoassets@7.2.1
  - @ledgerhq/types-live@6.35.1
  - @ledgerhq/coin-framework@0.3.6
  - @ledgerhq/domain-service@1.1.4
  - @ledgerhq/devices@8.0.4
  - @ledgerhq/hw-app-eth@6.33.6
  - @ledgerhq/live-network@1.1.1
  - @ledgerhq/live-portfolio@0.0.8

## 0.2.1-next.0

### Patch Changes

- Updated dependencies [[`9adc1862dd`](https://github.com/LedgerHQ/ledger-live/commit/9adc1862dda605a722d19f3b6895bd324834c914), [`4a1454beb3`](https://github.com/LedgerHQ/ledger-live/commit/4a1454beb3f86405ba2686e07879c12a7d35ad8e), [`809065c571`](https://github.com/LedgerHQ/ledger-live/commit/809065c57198646a49adea112b9d799e35a57d25), [`d1aa522db7`](https://github.com/LedgerHQ/ledger-live/commit/d1aa522db75f7ea850efe412abaa4dc7d37af6b7), [`ebe5b07afe`](https://github.com/LedgerHQ/ledger-live/commit/ebe5b07afec441ea3e2d9103da9e1175972add47)]:
  - @ledgerhq/errors@6.12.7-next.0
  - @ledgerhq/cryptoassets@9.8.0-next.0
  - @ledgerhq/types-cryptoassets@7.2.1-next.0
  - @ledgerhq/types-live@6.35.1-next.0
  - @ledgerhq/coin-framework@0.3.6-next.0
  - @ledgerhq/domain-service@1.1.4-next.0
  - @ledgerhq/devices@8.0.4-next.0
  - @ledgerhq/hw-app-eth@6.33.6-next.0
  - @ledgerhq/live-network@1.1.1-next.0
  - @ledgerhq/live-portfolio@0.0.8-next.0

## 0.2.0

### Minor Changes

- [#3536](https://github.com/LedgerHQ/ledger-live/pull/3536) [`a380bfc53a`](https://github.com/LedgerHQ/ledger-live/commit/a380bfc53a25bf196031337cd7ab8bc459731e16) Thanks [@chabroA](https://github.com/chabroA)! - Move evm familly logic in own package

### Patch Changes

- Updated dependencies [[`5cce6e3593`](https://github.com/LedgerHQ/ledger-live/commit/5cce6e359309110df53e16ef989c5b8b94492dfd), [`30bf4d92c7`](https://github.com/LedgerHQ/ledger-live/commit/30bf4d92c7d79cb81b1e4ad014857459739c33be), [`b30ead9d22`](https://github.com/LedgerHQ/ledger-live/commit/b30ead9d22a4bce5f8ee27febf0190fccd2ca25b), [`ce675302c7`](https://github.com/LedgerHQ/ledger-live/commit/ce675302c78311571e1087cfa35ee67580263796), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500)]:
  - @ledgerhq/cryptoassets@9.7.0
  - @ledgerhq/live-network@1.1.0
  - @ledgerhq/types-live@6.35.0
  - @ledgerhq/coin-framework@0.3.5
  - @ledgerhq/domain-service@1.1.3
  - @ledgerhq/hw-app-eth@6.33.5
  - @ledgerhq/live-portfolio@0.0.7

## 0.2.0-next.1

### Patch Changes

- Updated dependencies [[`30bf4d92c7`](https://github.com/LedgerHQ/ledger-live/commit/30bf4d92c7d79cb81b1e4ad014857459739c33be)]:
  - @ledgerhq/cryptoassets@9.7.0-next.1
  - @ledgerhq/coin-framework@0.3.5-next.1
  - @ledgerhq/domain-service@1.1.3-next.1
  - @ledgerhq/hw-app-eth@6.33.5-next.1

## 0.2.0-next.0

### Minor Changes

- [#3536](https://github.com/LedgerHQ/ledger-live/pull/3536) [`a380bfc53a`](https://github.com/LedgerHQ/ledger-live/commit/a380bfc53a25bf196031337cd7ab8bc459731e16) Thanks [@chabroA](https://github.com/chabroA)! - Move evm familly logic in own package

### Patch Changes

- Updated dependencies [[`5cce6e3593`](https://github.com/LedgerHQ/ledger-live/commit/5cce6e359309110df53e16ef989c5b8b94492dfd), [`b30ead9d22`](https://github.com/LedgerHQ/ledger-live/commit/b30ead9d22a4bce5f8ee27febf0190fccd2ca25b), [`7439b63325`](https://github.com/LedgerHQ/ledger-live/commit/7439b63325a9b0181a3af4310ba787f00faa80c9), [`ce675302c7`](https://github.com/LedgerHQ/ledger-live/commit/ce675302c78311571e1087cfa35ee67580263796), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500)]:
  - @ledgerhq/cryptoassets@9.7.0-next.0
  - @ledgerhq/live-network@1.1.0-next.0
  - @ledgerhq/types-live@6.35.0-next.0
  - @ledgerhq/coin-framework@0.3.5-next.0
  - @ledgerhq/domain-service@1.1.3-next.0
  - @ledgerhq/hw-app-eth@6.33.5-next.0
  - @ledgerhq/live-portfolio@0.0.7-next.0
