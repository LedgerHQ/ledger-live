# @ledgerhq/live-signer-evm

## 0.23.0-next.0

### Minor Changes

- [#21245](https://github.com/LedgerHQ/ledger-live/pull/21245) [`45ea28b`](https://github.com/LedgerHQ/ledger-live/commit/45ea28b19d1e950bf4e705388a06181a9a7543aa) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Provide the EVM address book to the DMK Ethereum signer, so registered contacts can be clear-signed.

  `toEvmAddressBook` maps the Contacts state to an `EvmAddressBook` snapshot, keeping EVM-family addresses only. Each app registers it on `evmAddressBookProvider` at its composition root, and `DmkSignerEth` reads it once per instance, so the recipient and the signing account are matched against the same snapshot. Records whose proof material does not decode are dropped, and signing is left untouched when no contact is usable.

  Ledger account contacts are not provided yet: the snapshot always carries an empty `ledgerAccounts`.

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`6cef6b5`](https://github.com/LedgerHQ/ledger-live/commit/6cef6b5341c30850aa74159bdbdea0a18f89de4c), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a), [`5b9df59`](https://github.com/LedgerHQ/ledger-live/commit/5b9df5970cb628dbfe592227231b66ff498f480c)]:
  - @ledgerhq/ledger-wallet-framework@3.2.0-next.0
  - @ledgerhq/live-dmk-shared@0.32.0-next.0
  - @ledgerhq/live-env@3.2.0-next.0
  - @ledgerhq/hw-app-eth@7.8.17-next.0

## 0.22.4

### Patch Changes

- Updated dependencies [[`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/ledger-wallet-framework@3.1.0
  - @ledgerhq/live-env@3.1.0
  - @ledgerhq/hw-app-eth@7.8.16

## 0.22.4-next.0

### Patch Changes

- Updated dependencies [[`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/ledger-wallet-framework@3.1.0-next.0
  - @ledgerhq/live-env@3.1.0-next.0
  - @ledgerhq/hw-app-eth@7.8.16-next.0

## 0.22.3

### Patch Changes

- Updated dependencies [[`1a2df41`](https://github.com/LedgerHQ/ledger-live/commit/1a2df41eed302864ec2e0b58dc9eef75e8b90eec), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/live-dmk-shared@0.31.0
  - @ledgerhq/ledger-wallet-framework@3.0.0
  - @ledgerhq/hw-app-eth@7.8.15

## 0.22.3-next.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.1
  - @ledgerhq/hw-app-eth@7.8.15-next.1

## 0.22.3-next.0

### Patch Changes

- Updated dependencies [[`1a2df41`](https://github.com/LedgerHQ/ledger-live/commit/1a2df41eed302864ec2e0b58dc9eef75e8b90eec), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/live-dmk-shared@0.31.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.0
  - @ledgerhq/hw-app-eth@7.8.15-next.0

## 0.22.2

### Patch Changes

- Updated dependencies [[`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`8a3a0bb`](https://github.com/LedgerHQ/ledger-live/commit/8a3a0bbd8361706daac364d4c89894f56431fc57), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @ledgerhq/ledger-wallet-framework@2.8.0
  - @ledgerhq/live-dmk-shared@0.30.0
  - @ledgerhq/hw-app-eth@7.8.14

## 0.22.2-next.0

### Patch Changes

- Updated dependencies [[`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`8a3a0bb`](https://github.com/LedgerHQ/ledger-live/commit/8a3a0bbd8361706daac364d4c89894f56431fc57), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @ledgerhq/ledger-wallet-framework@2.8.0-next.0
  - @ledgerhq/live-dmk-shared@0.30.0-next.0
  - @ledgerhq/hw-app-eth@7.8.14-next.0

## 0.22.1

### Patch Changes

- Updated dependencies [[`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9)]:
  - @ledgerhq/ledger-wallet-framework@2.7.0
  - @ledgerhq/hw-app-eth@7.8.13

## 0.22.1-next.0

### Patch Changes

- Updated dependencies [[`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9)]:
  - @ledgerhq/ledger-wallet-framework@2.7.0-next.0
  - @ledgerhq/hw-app-eth@7.8.13-next.0

## 0.22.0

### Minor Changes

- [#19860](https://github.com/LedgerHQ/ledger-live/pull/19860) [`d08f2bc`](https://github.com/LedgerHQ/ledger-live/commit/d08f2bccae5f94a339206ec703c8d16139f6cbc9) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Wire CAL_SERVICE_URL into DMK ContextModule for the EVM signer

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010)]:
  - @ledgerhq/errors@7.0.0
  - @ledgerhq/live-env@3.0.0
  - @ledgerhq/hw-app-eth@7.8.12
  - @ledgerhq/live-dmk-shared@0.29.1

## 0.22.0-next.0

### Minor Changes

- [#19860](https://github.com/LedgerHQ/ledger-live/pull/19860) [`d08f2bc`](https://github.com/LedgerHQ/ledger-live/commit/d08f2bccae5f94a339206ec703c8d16139f6cbc9) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Wire CAL_SERVICE_URL into DMK ContextModule for the EVM signer

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010)]:
  - @ledgerhq/errors@7.0.0-next.0
  - @ledgerhq/live-env@3.0.0-next.0
  - @ledgerhq/hw-app-eth@7.8.12-next.0
  - @ledgerhq/live-dmk-shared@0.29.1-next.0

## 0.21.2

### Patch Changes

- Updated dependencies [[`2388d41`](https://github.com/LedgerHQ/ledger-live/commit/2388d4171bd2e5caa2009e8eadcd06548d2209ef), [`762b5eb`](https://github.com/LedgerHQ/ledger-live/commit/762b5ebf332566879a10ab1f16ef85a3da360fe7)]:
  - @ledgerhq/live-dmk-shared@0.29.0
  - @ledgerhq/hw-app-eth@7.8.11

## 0.21.2-next.0

### Patch Changes

- Updated dependencies [[`2388d41`](https://github.com/LedgerHQ/ledger-live/commit/2388d4171bd2e5caa2009e8eadcd06548d2209ef), [`762b5eb`](https://github.com/LedgerHQ/ledger-live/commit/762b5ebf332566879a10ab1f16ef85a3da360fe7)]:
  - @ledgerhq/live-dmk-shared@0.29.0-next.0
  - @ledgerhq/hw-app-eth@7.8.11-next.0

## 0.21.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-app-eth@7.8.10

## 0.21.1-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-app-eth@7.8.10-next.0

## 0.21.0

### Minor Changes

- [#19071](https://github.com/LedgerHQ/ledger-live/pull/19071) [`3b35b5e`](https://github.com/LedgerHQ/ledger-live/commit/3b35b5ea8a0c67c215150f2aee008fd1c1993463) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - coin-evm: move the EVM signer (types + getAddress/signMessage) out to live-signer-evm and ledger-live-common

### Patch Changes

- Updated dependencies [[`d91f849`](https://github.com/LedgerHQ/ledger-live/commit/d91f849185c7a30514349be655bba69dd77bb8c8), [`0225804`](https://github.com/LedgerHQ/ledger-live/commit/0225804cd0f39b90050f52b14e1b159340f0530e)]:
  - @ledgerhq/live-dmk-shared@0.28.0
  - @ledgerhq/hw-app-eth@7.8.9

## 0.21.0-next.0

### Minor Changes

- [#19071](https://github.com/LedgerHQ/ledger-live/pull/19071) [`3b35b5e`](https://github.com/LedgerHQ/ledger-live/commit/3b35b5ea8a0c67c215150f2aee008fd1c1993463) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - coin-evm: move the EVM signer (types + getAddress/signMessage) out to live-signer-evm and ledger-live-common

### Patch Changes

- Updated dependencies [[`d91f849`](https://github.com/LedgerHQ/ledger-live/commit/d91f849185c7a30514349be655bba69dd77bb8c8), [`0225804`](https://github.com/LedgerHQ/ledger-live/commit/0225804cd0f39b90050f52b14e1b159340f0530e)]:
  - @ledgerhq/live-dmk-shared@0.28.0-next.0
  - @ledgerhq/hw-app-eth@7.8.9-next.0

## 0.20.0

### Minor Changes

- [#18627](https://github.com/LedgerHQ/ledger-live/pull/18627) [`7fcf623`](https://github.com/LedgerHQ/ledger-live/commit/7fcf62387e642e10b23503a786e230b11d051cb6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump Device Management Kit to 1.7.1

### Patch Changes

- Updated dependencies [[`7fcf623`](https://github.com/LedgerHQ/ledger-live/commit/7fcf62387e642e10b23503a786e230b11d051cb6), [`636a4cb`](https://github.com/LedgerHQ/ledger-live/commit/636a4cbc5ae01364af425e3837cecf1ce4d3f3bc), [`48dbd53`](https://github.com/LedgerHQ/ledger-live/commit/48dbd533a7a505cbb37989f8ce94f273f84bc7d2), [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934), [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292)]:
  - @ledgerhq/live-dmk-shared@0.27.0
  - @ledgerhq/coin-evm@4.4.0
  - @ledgerhq/errors@6.37.0
  - @ledgerhq/hw-app-eth@7.8.8

## 0.20.0-next.0

### Minor Changes

- [#18627](https://github.com/LedgerHQ/ledger-live/pull/18627) [`7fcf623`](https://github.com/LedgerHQ/ledger-live/commit/7fcf62387e642e10b23503a786e230b11d051cb6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump Device Management Kit to 1.7.1

### Patch Changes

- Updated dependencies [[`7fcf623`](https://github.com/LedgerHQ/ledger-live/commit/7fcf62387e642e10b23503a786e230b11d051cb6), [`636a4cb`](https://github.com/LedgerHQ/ledger-live/commit/636a4cbc5ae01364af425e3837cecf1ce4d3f3bc), [`48dbd53`](https://github.com/LedgerHQ/ledger-live/commit/48dbd533a7a505cbb37989f8ce94f273f84bc7d2), [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934), [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292)]:
  - @ledgerhq/live-dmk-shared@0.27.0-next.0
  - @ledgerhq/coin-evm@4.4.0-next.0
  - @ledgerhq/errors@6.37.0-next.0
  - @ledgerhq/hw-app-eth@7.8.8-next.0

## 0.19.1

### Patch Changes

- Updated dependencies [[`9ddf006`](https://github.com/LedgerHQ/ledger-live/commit/9ddf006bc2897a2393f1a9595b3c6a43d0c35bf7), [`05d8db8`](https://github.com/LedgerHQ/ledger-live/commit/05d8db8489e8338b50a7faa2b7a6db64b80aa516), [`16b9bbc`](https://github.com/LedgerHQ/ledger-live/commit/16b9bbcf1df6546a8894acf22b58fb6e35576ed4), [`82a143f`](https://github.com/LedgerHQ/ledger-live/commit/82a143ff527c4a71e2c9ea79babc473ed395b42d), [`21c7211`](https://github.com/LedgerHQ/ledger-live/commit/21c72111bd99680eca39f97b908d9df0de41e041), [`93a5bcd`](https://github.com/LedgerHQ/ledger-live/commit/93a5bcd8b7e361148f7bac751d072cc8bcec2cf9)]:
  - @ledgerhq/coin-evm@4.3.0
  - @ledgerhq/hw-app-eth@7.8.7

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
