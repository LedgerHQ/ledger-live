# @ledgerhq/live-common

## 29.2.0

### Minor Changes

- [#3063](https://github.com/LedgerHQ/ledger-live/pull/3063) [`842eaacf83`](https://github.com/LedgerHQ/ledger-live/commit/842eaacf839776956435d12dda8bf6d8b386a784) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - feat: ledger recover feature flag

- [#2296](https://github.com/LedgerHQ/ledger-live/pull/2296) [`3b5bd4f8e3`](https://github.com/LedgerHQ/ledger-live/commit/3b5bd4f8e32333eca7eb8c22d9a6cfda22c766f9) Thanks [@Sheng-Long](https://github.com/Sheng-Long)! - Updated Hedera fee estimate and get usd price if possible for estimate.

- [#2252](https://github.com/LedgerHQ/ledger-live/pull/2252) [`496df9da72`](https://github.com/LedgerHQ/ledger-live/commit/496df9da7216d792d74c7cc22be68fb30415325c) Thanks [@Sheng-Long](https://github.com/Sheng-Long)! - Second Hedera Client created for balance specific queries

- [#2784](https://github.com/LedgerHQ/ledger-live/pull/2784) [`9b22d499f2`](https://github.com/LedgerHQ/ledger-live/commit/9b22d499f2d0e62d78dbe178808d5fa392d22dda) Thanks [@konoart](https://github.com/konoart)! - Fix minimum amount requirement for Solana accounts to be considered rent exempted after transfering and staking

- [#2327](https://github.com/LedgerHQ/ledger-live/pull/2327) [`76a2f02f03`](https://github.com/LedgerHQ/ledger-live/commit/76a2f02f03863ab01fcdf136bd436c62fb8f526e) Thanks [@RamyEB](https://github.com/RamyEB)! - Add Discover v2 UI behind feature flag

- [#2844](https://github.com/LedgerHQ/ledger-live/pull/2844) [`b2a94b9081`](https://github.com/LedgerHQ/ledger-live/commit/b2a94b908103cbee9473319cc3706876d7ce2a19) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - polkadot serialization coin mod part 2

### Patch Changes

- [#2976](https://github.com/LedgerHQ/ledger-live/pull/2976) [`8340016ef0`](https://github.com/LedgerHQ/ledger-live/commit/8340016ef051927a6701c731ac16842b7caf7023) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Remove serialization logic polkadot

- [#2680](https://github.com/LedgerHQ/ledger-live/pull/2680) [`c60e8c4b86`](https://github.com/LedgerHQ/ledger-live/commit/c60e8c4b862177e5adab2bc5eeb74313a5c2b2a9) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Remove bitcoin specific logic outside of its family package

- [#3002](https://github.com/LedgerHQ/ledger-live/pull/3002) [`ef945b05c0`](https://github.com/LedgerHQ/ledger-live/commit/ef945b05c01a791281687abb28e639e1bcc4e472) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Support 5102 status on language pack installation (full device)

- [#3030](https://github.com/LedgerHQ/ledger-live/pull/3030) [`9d15eb2e2f`](https://github.com/LedgerHQ/ledger-live/commit/9d15eb2e2f6b72bf796b12daa88736b03873857b) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix wrong amount displayed for Amount to receive

- [#2949](https://github.com/LedgerHQ/ledger-live/pull/2949) [`1d0b2d19eb`](https://github.com/LedgerHQ/ledger-live/commit/1d0b2d19ebc5acd058930b842c6d37f8daf2a5a3) Thanks [@juan-cortes](https://github.com/juan-cortes)! - modified the getdeviceinfo command to support another status code

- [#2664](https://github.com/LedgerHQ/ledger-live/pull/2664) [`9f55124458`](https://github.com/LedgerHQ/ledger-live/commit/9f551244584c20638e1eec2d984dd725fe2688f6) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Remove cryptoorg coin specific logic outside of its family folder

- [#2814](https://github.com/LedgerHQ/ledger-live/pull/2814) [`81a0cbb8ee`](https://github.com/LedgerHQ/ledger-live/commit/81a0cbb8ee0583bdec083c6de0797510a3bf8be3) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Expose listedApps flag from connectApp for better UX on inline install apps

- [#2975](https://github.com/LedgerHQ/ledger-live/pull/2975) [`a1e097d391`](https://github.com/LedgerHQ/ledger-live/commit/a1e097d391644fe1a7dd51ca49cf7b51667e4625) Thanks [@gre](https://github.com/gre)! - chore: slow rate for account incremental sync and countervalues

- [#2956](https://github.com/LedgerHQ/ledger-live/pull/2956) [`6abe8dd35b`](https://github.com/LedgerHQ/ledger-live/commit/6abe8dd35b103253650f93080b105286afbac4c2) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: handle new restore onboarding steps

  2 new steps: SetupChoiceRestore and RecoverRestore

- [#2911](https://github.com/LedgerHQ/ledger-live/pull/2911) [`fb464093d8`](https://github.com/LedgerHQ/ledger-live/commit/fb464093d85b9e1f73fa761fb7439ee5fb0804d9) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Improve getOnboardingStatePolling logic attempting to fix disconnect bug

- [#2912](https://github.com/LedgerHQ/ledger-live/pull/2912) [`5fa68510b4`](https://github.com/LedgerHQ/ledger-live/commit/5fa68510b49334cfd80c30793dfe68900f1b9b3b) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: re-work of the transport error mapping HwTransportErrorType

  And updating functions and hooks using them

- [#2559](https://github.com/LedgerHQ/ledger-live/pull/2559) [`ae211bda45`](https://github.com/LedgerHQ/ledger-live/commit/ae211bda45192e1575c6c7656dfad68c7dd93ffe) Thanks [@vlad-anger](https://github.com/vlad-anger)! - Crypto Icons - Add support for Ghostmarket tokens icons

- [#2928](https://github.com/LedgerHQ/ledger-live/pull/2928) [`4772a234f7`](https://github.com/LedgerHQ/ledger-live/commit/4772a234f7d35e0c925837eacc194a20bdc49a7c) Thanks [@juan-cortes](https://github.com/juan-cortes)! - chore: reset correctly error in useGenuineCheck.ts

- Updated dependencies [[`c6a88dd5ab`](https://github.com/LedgerHQ/ledger-live/commit/c6a88dd5abae2b85c3c085ea65e81f89950ecdd4), [`1d0b2d19eb`](https://github.com/LedgerHQ/ledger-live/commit/1d0b2d19ebc5acd058930b842c6d37f8daf2a5a3), [`f364721cd9`](https://github.com/LedgerHQ/ledger-live/commit/f364721cd9c1681141b62cd807796e0a0a45efe4), [`ef945b05c0`](https://github.com/LedgerHQ/ledger-live/commit/ef945b05c01a791281687abb28e639e1bcc4e472), [`0ca89a8067`](https://github.com/LedgerHQ/ledger-live/commit/0ca89a80678743e9462aaf977448e759924a56b2), [`9bb21e26a8`](https://github.com/LedgerHQ/ledger-live/commit/9bb21e26a88a2db7093a3d5cc75ab03d12b25ffb), [`a1e097d391`](https://github.com/LedgerHQ/ledger-live/commit/a1e097d391644fe1a7dd51ca49cf7b51667e4625), [`170f608de3`](https://github.com/LedgerHQ/ledger-live/commit/170f608de311f320795793b4606b063a3ce96def), [`5fa68510b4`](https://github.com/LedgerHQ/ledger-live/commit/5fa68510b49334cfd80c30793dfe68900f1b9b3b), [`76a2f02f03`](https://github.com/LedgerHQ/ledger-live/commit/76a2f02f03863ab01fcdf136bd436c62fb8f526e), [`b2a94b9081`](https://github.com/LedgerHQ/ledger-live/commit/b2a94b908103cbee9473319cc3706876d7ce2a19)]:
  - @ledgerhq/coin-framework@0.2.1
  - @ledgerhq/errors@6.12.4
  - @ledgerhq/cryptoassets@9.2.0
  - @ledgerhq/coin-polkadot@0.1.0
  - @ledgerhq/devices@8.0.1
  - @ledgerhq/hw-app-algorand@6.27.13
  - @ledgerhq/hw-app-cosmos@6.27.13
  - @ledgerhq/hw-app-eth@6.32.2
  - @ledgerhq/hw-app-near@6.27.8
  - @ledgerhq/hw-app-polkadot@6.27.13
  - @ledgerhq/hw-app-solana@7.0.7
  - @ledgerhq/hw-app-trx@6.27.13
  - @ledgerhq/hw-transport@6.28.2
  - @ledgerhq/hw-transport-node-speculos@6.27.13
  - @ledgerhq/hw-app-btc@10.0.1
  - @ledgerhq/hw-app-str@6.27.13
  - @ledgerhq/hw-app-tezos@6.27.13
  - @ledgerhq/hw-app-xrp@6.27.13
  - @ledgerhq/hw-transport-mocker@6.27.13

## 29.2.0-next.1

### Minor Changes

- [#3063](https://github.com/LedgerHQ/ledger-live/pull/3063) [`842eaacf83`](https://github.com/LedgerHQ/ledger-live/commit/842eaacf839776956435d12dda8bf6d8b386a784) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - feat: ledger recover feature flag

## 29.2.0-next.0

### Minor Changes

- [#2296](https://github.com/LedgerHQ/ledger-live/pull/2296) [`3b5bd4f8e3`](https://github.com/LedgerHQ/ledger-live/commit/3b5bd4f8e32333eca7eb8c22d9a6cfda22c766f9) Thanks [@Sheng-Long](https://github.com/Sheng-Long)! - Updated Hedera fee estimate and get usd price if possible for estimate.

- [#2252](https://github.com/LedgerHQ/ledger-live/pull/2252) [`496df9da72`](https://github.com/LedgerHQ/ledger-live/commit/496df9da7216d792d74c7cc22be68fb30415325c) Thanks [@Sheng-Long](https://github.com/Sheng-Long)! - Second Hedera Client created for balance specific queries

- [#2784](https://github.com/LedgerHQ/ledger-live/pull/2784) [`9b22d499f2`](https://github.com/LedgerHQ/ledger-live/commit/9b22d499f2d0e62d78dbe178808d5fa392d22dda) Thanks [@konoart](https://github.com/konoart)! - Fix minimum amount requirement for Solana accounts to be considered rent exempted after transfering and staking

- [#2327](https://github.com/LedgerHQ/ledger-live/pull/2327) [`76a2f02f03`](https://github.com/LedgerHQ/ledger-live/commit/76a2f02f03863ab01fcdf136bd436c62fb8f526e) Thanks [@RamyEB](https://github.com/RamyEB)! - Add Discover v2 UI behind feature flag

- [#2844](https://github.com/LedgerHQ/ledger-live/pull/2844) [`b2a94b9081`](https://github.com/LedgerHQ/ledger-live/commit/b2a94b908103cbee9473319cc3706876d7ce2a19) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - polkadot serialization coin mod part 2

### Patch Changes

- [#2976](https://github.com/LedgerHQ/ledger-live/pull/2976) [`8340016ef0`](https://github.com/LedgerHQ/ledger-live/commit/8340016ef051927a6701c731ac16842b7caf7023) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Remove serialization logic polkadot

- [#2680](https://github.com/LedgerHQ/ledger-live/pull/2680) [`c60e8c4b86`](https://github.com/LedgerHQ/ledger-live/commit/c60e8c4b862177e5adab2bc5eeb74313a5c2b2a9) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Remove bitcoin specific logic outside of its family package

- [#3002](https://github.com/LedgerHQ/ledger-live/pull/3002) [`ef945b05c0`](https://github.com/LedgerHQ/ledger-live/commit/ef945b05c01a791281687abb28e639e1bcc4e472) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Support 5102 status on language pack installation (full device)

- [#3030](https://github.com/LedgerHQ/ledger-live/pull/3030) [`9d15eb2e2f`](https://github.com/LedgerHQ/ledger-live/commit/9d15eb2e2f6b72bf796b12daa88736b03873857b) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix wrong amount displayed for Amount to receive

- [#2949](https://github.com/LedgerHQ/ledger-live/pull/2949) [`1d0b2d19eb`](https://github.com/LedgerHQ/ledger-live/commit/1d0b2d19ebc5acd058930b842c6d37f8daf2a5a3) Thanks [@juan-cortes](https://github.com/juan-cortes)! - modified the getdeviceinfo command to support another status code

- [#2664](https://github.com/LedgerHQ/ledger-live/pull/2664) [`9f55124458`](https://github.com/LedgerHQ/ledger-live/commit/9f551244584c20638e1eec2d984dd725fe2688f6) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Remove cryptoorg coin specific logic outside of its family folder

- [#2814](https://github.com/LedgerHQ/ledger-live/pull/2814) [`81a0cbb8ee`](https://github.com/LedgerHQ/ledger-live/commit/81a0cbb8ee0583bdec083c6de0797510a3bf8be3) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Expose listedApps flag from connectApp for better UX on inline install apps

- [#2975](https://github.com/LedgerHQ/ledger-live/pull/2975) [`a1e097d391`](https://github.com/LedgerHQ/ledger-live/commit/a1e097d391644fe1a7dd51ca49cf7b51667e4625) Thanks [@gre](https://github.com/gre)! - chore: slow rate for account incremental sync and countervalues

- [#2956](https://github.com/LedgerHQ/ledger-live/pull/2956) [`6abe8dd35b`](https://github.com/LedgerHQ/ledger-live/commit/6abe8dd35b103253650f93080b105286afbac4c2) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: handle new restore onboarding steps

  2 new steps: SetupChoiceRestore and RecoverRestore

- [#2911](https://github.com/LedgerHQ/ledger-live/pull/2911) [`fb464093d8`](https://github.com/LedgerHQ/ledger-live/commit/fb464093d85b9e1f73fa761fb7439ee5fb0804d9) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Improve getOnboardingStatePolling logic attempting to fix disconnect bug

- [#2912](https://github.com/LedgerHQ/ledger-live/pull/2912) [`5fa68510b4`](https://github.com/LedgerHQ/ledger-live/commit/5fa68510b49334cfd80c30793dfe68900f1b9b3b) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: re-work of the transport error mapping HwTransportErrorType

  And updating functions and hooks using them

- [#2559](https://github.com/LedgerHQ/ledger-live/pull/2559) [`ae211bda45`](https://github.com/LedgerHQ/ledger-live/commit/ae211bda45192e1575c6c7656dfad68c7dd93ffe) Thanks [@vlad-anger](https://github.com/vlad-anger)! - Crypto Icons - Add support for Ghostmarket tokens icons

- [#2928](https://github.com/LedgerHQ/ledger-live/pull/2928) [`4772a234f7`](https://github.com/LedgerHQ/ledger-live/commit/4772a234f7d35e0c925837eacc194a20bdc49a7c) Thanks [@juan-cortes](https://github.com/juan-cortes)! - chore: reset correctly error in useGenuineCheck.ts

- Updated dependencies [[`c6a88dd5ab`](https://github.com/LedgerHQ/ledger-live/commit/c6a88dd5abae2b85c3c085ea65e81f89950ecdd4), [`1d0b2d19eb`](https://github.com/LedgerHQ/ledger-live/commit/1d0b2d19ebc5acd058930b842c6d37f8daf2a5a3), [`f364721cd9`](https://github.com/LedgerHQ/ledger-live/commit/f364721cd9c1681141b62cd807796e0a0a45efe4), [`ef945b05c0`](https://github.com/LedgerHQ/ledger-live/commit/ef945b05c01a791281687abb28e639e1bcc4e472), [`0ca89a8067`](https://github.com/LedgerHQ/ledger-live/commit/0ca89a80678743e9462aaf977448e759924a56b2), [`9bb21e26a8`](https://github.com/LedgerHQ/ledger-live/commit/9bb21e26a88a2db7093a3d5cc75ab03d12b25ffb), [`a1e097d391`](https://github.com/LedgerHQ/ledger-live/commit/a1e097d391644fe1a7dd51ca49cf7b51667e4625), [`170f608de3`](https://github.com/LedgerHQ/ledger-live/commit/170f608de311f320795793b4606b063a3ce96def), [`5fa68510b4`](https://github.com/LedgerHQ/ledger-live/commit/5fa68510b49334cfd80c30793dfe68900f1b9b3b), [`76a2f02f03`](https://github.com/LedgerHQ/ledger-live/commit/76a2f02f03863ab01fcdf136bd436c62fb8f526e), [`b2a94b9081`](https://github.com/LedgerHQ/ledger-live/commit/b2a94b908103cbee9473319cc3706876d7ce2a19)]:
  - @ledgerhq/coin-framework@0.2.1-next.0
  - @ledgerhq/errors@6.12.4-next.0
  - @ledgerhq/cryptoassets@9.2.0-next.0
  - @ledgerhq/coin-polkadot@0.1.0-next.0
  - @ledgerhq/devices@8.0.1-next.0
  - @ledgerhq/hw-app-algorand@6.27.13-next.0
  - @ledgerhq/hw-app-cosmos@6.27.13-next.0
  - @ledgerhq/hw-app-eth@6.32.2-next.0
  - @ledgerhq/hw-app-near@6.27.8-next.0
  - @ledgerhq/hw-app-polkadot@6.27.13-next.0
  - @ledgerhq/hw-app-solana@7.0.7-next.0
  - @ledgerhq/hw-app-trx@6.27.13-next.0
  - @ledgerhq/hw-transport@6.28.2-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.13-next.0
  - @ledgerhq/hw-app-btc@10.0.1-next.0
  - @ledgerhq/hw-app-str@6.27.13-next.0
  - @ledgerhq/hw-app-tezos@6.27.13-next.0
  - @ledgerhq/hw-app-xrp@6.27.13-next.0
  - @ledgerhq/hw-transport-mocker@6.27.13-next.0

## 29.1.0

### Minor Changes

- [#2618](https://github.com/LedgerHQ/ledger-live/pull/2618) [`9ec0582d2a`](https://github.com/LedgerHQ/ledger-live/commit/9ec0582d2ae8ee57884531d4d104a3724735a2c2) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add token for pagination eth explorers tx

- [#2744](https://github.com/LedgerHQ/ledger-live/pull/2744) [`bc3af8a918`](https://github.com/LedgerHQ/ledger-live/commit/bc3af8a91819eaa653f76db6333508111963fdba) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for address poisoning filtering

### Patch Changes

- [#2693](https://github.com/LedgerHQ/ledger-live/pull/2693) [`3460d0908b`](https://github.com/LedgerHQ/ledger-live/commit/3460d0908b6a4fb0f1ff280545cc37644166b06b) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Gas limit error when above available balance fix

- [#2516](https://github.com/LedgerHQ/ledger-live/pull/2516) [`47e3ef84ba`](https://github.com/LedgerHQ/ledger-live/commit/47e3ef84bad0e93d6f1d8f921b3fb2aa04240065) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Remove tezos coin specific logic outside of its folder

- [#2652](https://github.com/LedgerHQ/ledger-live/pull/2652) [`897f42df13`](https://github.com/LedgerHQ/ledger-live/commit/897f42df1389768f66882172341be600e09f1791) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Get device name when accessing the manager

- [#2908](https://github.com/LedgerHQ/ledger-live/pull/2908) [`b947934b68`](https://github.com/LedgerHQ/ledger-live/commit/b947934b68f351f81e3f7f8031bfe52743948fe6) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix btc integration test

- [#2526](https://github.com/LedgerHQ/ledger-live/pull/2526) [`24bc5674d2`](https://github.com/LedgerHQ/ledger-live/commit/24bc5674d28009a032bb421e20f7a480b0557e29) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Remove celo coin specific logic outside of its folder

- [#2740](https://github.com/LedgerHQ/ledger-live/pull/2740) [`fbc7c4c83a`](https://github.com/LedgerHQ/ledger-live/commit/fbc7c4c83a4e84618cf18a4c8d108396fa7cda7a) Thanks [@Justkant](https://github.com/Justkant)! - fix(DeviceConnect): remove onError handler

  The error is already handled by the UI in `DeviceActionModal`
  Also adds a correct title to this screen and fixes the `SafeAreaView`

- [#2737](https://github.com/LedgerHQ/ledger-live/pull/2737) [`ab0781e7cb`](https://github.com/LedgerHQ/ledger-live/commit/ab0781e7cb0ab191519a4860ccc6c7f6a472b500) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Disable intall for elrond

- [#2854](https://github.com/LedgerHQ/ledger-live/pull/2854) [`a87ee27900`](https://github.com/LedgerHQ/ledger-live/commit/a87ee27900ec062bccc0e4cf453b4d2112f83ada) Thanks [@lvndry](https://github.com/lvndry)! - Remove useless dependencies for Avalanche app

- [#2639](https://github.com/LedgerHQ/ledger-live/pull/2639) [`ebe618881d`](https://github.com/LedgerHQ/ledger-live/commit/ebe618881d9e9c7159d7a9fe135e18b0cb2fde8f) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - remove zcash outdated package

- [#2779](https://github.com/LedgerHQ/ledger-live/pull/2779) [`297d6cc4a0`](https://github.com/LedgerHQ/ledger-live/commit/297d6cc4a03444fce5272f192accc96fb7f26cef) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - add edit transaction helper and env variable

- [#2609](https://github.com/LedgerHQ/ledger-live/pull/2609) [`ef5835035b`](https://github.com/LedgerHQ/ledger-live/commit/ef5835035b93bb06f9cfbbb9da74ec2b2a53c5a7) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Remove elrond specific logic outside of elrond family folder

- [#2584](https://github.com/LedgerHQ/ledger-live/pull/2584) [`f2968d5706`](https://github.com/LedgerHQ/ledger-live/commit/f2968d57065bd0b5219f97029887a2f61390ac27) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Remove solana coin specific logic outside of its folder

- [#2791](https://github.com/LedgerHQ/ledger-live/pull/2791) [`684c10d10a`](https://github.com/LedgerHQ/ledger-live/commit/684c10d10a51337e22b838e3ae6465721477c4de) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Blacklist Security Key app from version check on live-common

- [#2681](https://github.com/LedgerHQ/ledger-live/pull/2681) [`0f99b5dc44`](https://github.com/LedgerHQ/ledger-live/commit/0f99b5dc44f0e4f44e4199e80d40fb1bc5a88853) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Remove cosmos coin specific logic outside of its family folder

- [#2787](https://github.com/LedgerHQ/ledger-live/pull/2787) [`0207d76b15`](https://github.com/LedgerHQ/ledger-live/commit/0207d76b15dca7128aea720b1663c58a12f42967) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Enable Localization flags for stax

- [#2561](https://github.com/LedgerHQ/ledger-live/pull/2561) [`7daaa8f750`](https://github.com/LedgerHQ/ledger-live/commit/7daaa8f75029927459b8132befcd6a20b3ef8e17) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Remove tron coin specific logic outside of its folder

- [#2924](https://github.com/LedgerHQ/ledger-live/pull/2924) [`01a33f58ba`](https://github.com/LedgerHQ/ledger-live/commit/01a33f58ba6c5518045546e8f38be3f05fc2a935) Thanks [@Justkant](https://github.com/Justkant)! - fix: requestAccount currencies

- [#2788](https://github.com/LedgerHQ/ledger-live/pull/2788) [`f7f38ae801`](https://github.com/LedgerHQ/ledger-live/commit/f7f38ae801c7f78c04cf776e7fdab63d7cfb77d4) Thanks [@Justkant](https://github.com/Justkant)! - fix: filter outside SelectAccountAndCurrencyDrawer [LIVE-5865]

- [#2827](https://github.com/LedgerHQ/ledger-live/pull/2827) [`16cad60fb0`](https://github.com/LedgerHQ/ledger-live/commit/16cad60fb0d21752fae5e3db6d0100ef5396e0a4) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Solana - set max validators to 1000, set cache duration to 15min

- Updated dependencies [[`bc3af8a918`](https://github.com/LedgerHQ/ledger-live/commit/bc3af8a91819eaa653f76db6333508111963fdba), [`900ef4f528`](https://github.com/LedgerHQ/ledger-live/commit/900ef4f528c3b2359d666fbb76073978d5f9c840), [`0bf82a2b6c`](https://github.com/LedgerHQ/ledger-live/commit/0bf82a2b6cd1d0cac102cc6e142ad8d1ea098497), [`297d6cc4a0`](https://github.com/LedgerHQ/ledger-live/commit/297d6cc4a03444fce5272f192accc96fb7f26cef)]:
  - @ledgerhq/coin-framework@0.2.0
  - @ledgerhq/cryptoassets@9.1.0
  - @ledgerhq/hw-app-eth@6.32.1
  - @ledgerhq/coin-polkadot@0.0.3

## 29.1.0-next.0

### Minor Changes

- [#2618](https://github.com/LedgerHQ/ledger-live/pull/2618) [`9ec0582d2a`](https://github.com/LedgerHQ/ledger-live/commit/9ec0582d2ae8ee57884531d4d104a3724735a2c2) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add token for pagination eth explorers tx

- [#2744](https://github.com/LedgerHQ/ledger-live/pull/2744) [`bc3af8a918`](https://github.com/LedgerHQ/ledger-live/commit/bc3af8a91819eaa653f76db6333508111963fdba) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for address poisoning filtering

### Patch Changes

- [#2693](https://github.com/LedgerHQ/ledger-live/pull/2693) [`3460d0908b`](https://github.com/LedgerHQ/ledger-live/commit/3460d0908b6a4fb0f1ff280545cc37644166b06b) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Gas limit error when above available balance fix

- [#2516](https://github.com/LedgerHQ/ledger-live/pull/2516) [`47e3ef84ba`](https://github.com/LedgerHQ/ledger-live/commit/47e3ef84bad0e93d6f1d8f921b3fb2aa04240065) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Remove tezos coin specific logic outside of its folder

- [#2652](https://github.com/LedgerHQ/ledger-live/pull/2652) [`897f42df13`](https://github.com/LedgerHQ/ledger-live/commit/897f42df1389768f66882172341be600e09f1791) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Get device name when accessing the manager

- [#2908](https://github.com/LedgerHQ/ledger-live/pull/2908) [`b947934b68`](https://github.com/LedgerHQ/ledger-live/commit/b947934b68f351f81e3f7f8031bfe52743948fe6) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix btc integration test

- [#2526](https://github.com/LedgerHQ/ledger-live/pull/2526) [`24bc5674d2`](https://github.com/LedgerHQ/ledger-live/commit/24bc5674d28009a032bb421e20f7a480b0557e29) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Remove celo coin specific logic outside of its folder

- [#2740](https://github.com/LedgerHQ/ledger-live/pull/2740) [`fbc7c4c83a`](https://github.com/LedgerHQ/ledger-live/commit/fbc7c4c83a4e84618cf18a4c8d108396fa7cda7a) Thanks [@Justkant](https://github.com/Justkant)! - fix(DeviceConnect): remove onError handler

  The error is already handled by the UI in `DeviceActionModal`
  Also adds a correct title to this screen and fixes the `SafeAreaView`

- [#2737](https://github.com/LedgerHQ/ledger-live/pull/2737) [`ab0781e7cb`](https://github.com/LedgerHQ/ledger-live/commit/ab0781e7cb0ab191519a4860ccc6c7f6a472b500) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Disable intall for elrond

- [#2854](https://github.com/LedgerHQ/ledger-live/pull/2854) [`a87ee27900`](https://github.com/LedgerHQ/ledger-live/commit/a87ee27900ec062bccc0e4cf453b4d2112f83ada) Thanks [@lvndry](https://github.com/lvndry)! - Remove useless dependencies for Avalanche app

- [#2639](https://github.com/LedgerHQ/ledger-live/pull/2639) [`ebe618881d`](https://github.com/LedgerHQ/ledger-live/commit/ebe618881d9e9c7159d7a9fe135e18b0cb2fde8f) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - remove zcash outdated package

- [#2779](https://github.com/LedgerHQ/ledger-live/pull/2779) [`297d6cc4a0`](https://github.com/LedgerHQ/ledger-live/commit/297d6cc4a03444fce5272f192accc96fb7f26cef) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - add edit transaction helper and env variable

- [#2609](https://github.com/LedgerHQ/ledger-live/pull/2609) [`ef5835035b`](https://github.com/LedgerHQ/ledger-live/commit/ef5835035b93bb06f9cfbbb9da74ec2b2a53c5a7) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Remove elrond specific logic outside of elrond family folder

- [#2584](https://github.com/LedgerHQ/ledger-live/pull/2584) [`f2968d5706`](https://github.com/LedgerHQ/ledger-live/commit/f2968d57065bd0b5219f97029887a2f61390ac27) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Remove solana coin specific logic outside of its folder

- [#2791](https://github.com/LedgerHQ/ledger-live/pull/2791) [`684c10d10a`](https://github.com/LedgerHQ/ledger-live/commit/684c10d10a51337e22b838e3ae6465721477c4de) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Blacklist Security Key app from version check on live-common

- [#2681](https://github.com/LedgerHQ/ledger-live/pull/2681) [`0f99b5dc44`](https://github.com/LedgerHQ/ledger-live/commit/0f99b5dc44f0e4f44e4199e80d40fb1bc5a88853) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Remove cosmos coin specific logic outside of its family folder

- [#2787](https://github.com/LedgerHQ/ledger-live/pull/2787) [`0207d76b15`](https://github.com/LedgerHQ/ledger-live/commit/0207d76b15dca7128aea720b1663c58a12f42967) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Enable Localization flags for stax

- [#2561](https://github.com/LedgerHQ/ledger-live/pull/2561) [`7daaa8f750`](https://github.com/LedgerHQ/ledger-live/commit/7daaa8f75029927459b8132befcd6a20b3ef8e17) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Remove tron coin specific logic outside of its folder

- [#2924](https://github.com/LedgerHQ/ledger-live/pull/2924) [`01a33f58ba`](https://github.com/LedgerHQ/ledger-live/commit/01a33f58ba6c5518045546e8f38be3f05fc2a935) Thanks [@Justkant](https://github.com/Justkant)! - fix: requestAccount currencies

- [#2788](https://github.com/LedgerHQ/ledger-live/pull/2788) [`f7f38ae801`](https://github.com/LedgerHQ/ledger-live/commit/f7f38ae801c7f78c04cf776e7fdab63d7cfb77d4) Thanks [@Justkant](https://github.com/Justkant)! - fix: filter outside SelectAccountAndCurrencyDrawer [LIVE-5865]

- [#2827](https://github.com/LedgerHQ/ledger-live/pull/2827) [`16cad60fb0`](https://github.com/LedgerHQ/ledger-live/commit/16cad60fb0d21752fae5e3db6d0100ef5396e0a4) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Solana - set max validators to 1000, set cache duration to 15min

- Updated dependencies [[`bc3af8a918`](https://github.com/LedgerHQ/ledger-live/commit/bc3af8a91819eaa653f76db6333508111963fdba), [`900ef4f528`](https://github.com/LedgerHQ/ledger-live/commit/900ef4f528c3b2359d666fbb76073978d5f9c840), [`0bf82a2b6c`](https://github.com/LedgerHQ/ledger-live/commit/0bf82a2b6cd1d0cac102cc6e142ad8d1ea098497), [`297d6cc4a0`](https://github.com/LedgerHQ/ledger-live/commit/297d6cc4a03444fce5272f192accc96fb7f26cef)]:
  - @ledgerhq/coin-framework@0.2.0-next.0
  - @ledgerhq/cryptoassets@9.1.0-next.0
  - @ledgerhq/hw-app-eth@6.32.1-next.0
  - @ledgerhq/coin-polkadot@0.0.3-next.0

## 29.0.0

### Major Changes

- [#1991](https://github.com/LedgerHQ/ledger-live/pull/1991) [`62af25493e`](https://github.com/LedgerHQ/ledger-live/commit/62af25493e2becf897d517af42542db208b971c7) Thanks [@valpinkman](https://github.com/valpinkman)! - Remove the support for imports ending with `/` mapping to the `index.js` file.

  For instance:

  ```js
  import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/";
  ```

  Should be rewritten to:

  ```js
  import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
  ```

  This trailing slash is poorly supported by some tools like `vite.js` and was meant as a transitional change.
  Time has come to remove the support for thos shorthand.

### Minor Changes

- [#2416](https://github.com/LedgerHQ/ledger-live/pull/2416) [`109f456ff9`](https://github.com/LedgerHQ/ledger-live/commit/109f456ff9e715de8916d5dd4e096fd085c65319) Thanks [@samuel-tifi](https://github.com/samuel-tifi)! - Crypto Icon - Add support for TiFi Token icon

- [#2560](https://github.com/LedgerHQ/ledger-live/pull/2560) [`b5d8805bef`](https://github.com/LedgerHQ/ledger-live/commit/b5d8805bef1b35c85b2a8f0a7d1487345c65ec67) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Enable Solana in swap

- [#1712](https://github.com/LedgerHQ/ledger-live/pull/1712) [`72cc12fcdb`](https://github.com/LedgerHQ/ledger-live/commit/72cc12fcdbd452c78fab00a064a24de56db2d38c) Thanks [@lvndry](https://github.com/lvndry)! - Add Avalanche C Chain in Ledger Live

- [#2745](https://github.com/LedgerHQ/ledger-live/pull/2745) [`52d3a03dfc`](https://github.com/LedgerHQ/ledger-live/commit/52d3a03dfcbf8a4c8d3ef2fca49025f56ffc7a09) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for address poisoning filtering

- [#2493](https://github.com/LedgerHQ/ledger-live/pull/2493) [`4d8bcb5f83`](https://github.com/LedgerHQ/ledger-live/commit/4d8bcb5f8338987252780735ecaf5a51eea8cbee) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Add hooks for naming service in eth

- [#2521](https://github.com/LedgerHQ/ledger-live/pull/2521) [`cbc5d3ddc5`](https://github.com/LedgerHQ/ledger-live/commit/cbc5d3ddc5aca2ede06e0839388829d5b0eb84bf) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Add PERFORMANCE_CONSOLE env variable

- [#2493](https://github.com/LedgerHQ/ledger-live/pull/2493) [`4d8bcb5f83`](https://github.com/LedgerHQ/ledger-live/commit/4d8bcb5f8338987252780735ecaf5a51eea8cbee) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - change jest to jsdom to test react hooks

- [#2328](https://github.com/LedgerHQ/ledger-live/pull/2328) [`0725151a34`](https://github.com/LedgerHQ/ledger-live/commit/0725151a348608bec1f8338b57772f12a23cb471) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for ERC20 tokens to the EVM family

### Patch Changes

- [#2734](https://github.com/LedgerHQ/ledger-live/pull/2734) [`80e3090edc`](https://github.com/LedgerHQ/ledger-live/commit/80e3090edc91a4e8c2f95891ce2eea48ddb1d319) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Gas limit error when above available balance fix

- [#2484](https://github.com/LedgerHQ/ledger-live/pull/2484) [`a1a2220dfc`](https://github.com/LedgerHQ/ledger-live/commit/a1a2220dfce313ade4c0f055ff4c5b9427fa285d) Thanks [@gre](https://github.com/gre)! - Fixes Tron signOperation immutability

- [#2625](https://github.com/LedgerHQ/ledger-live/pull/2625) [`86ab7eb1d4`](https://github.com/LedgerHQ/ledger-live/commit/86ab7eb1d4d234051bb30930787279ebcdae6ea6) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Feat: device SDK: first device action

  First commands:

  - getVersion
  - getAppAndVersion
  - genuineCheck

  First task (with shared logic):

  - getDeviceInfo

  First action (with shared reducer logic):

  - getDeviceInfo

  Also implemented a hook + a CLI for the getDeviceInfo as a usage example

- [#2627](https://github.com/LedgerHQ/ledger-live/pull/2627) [`3d29b9e7ff`](https://github.com/LedgerHQ/ledger-live/commit/3d29b9e7ff1536b4e5624437b0507c2556e371f3) Thanks [@sarneijim](https://github.com/sarneijim)! - add solana stake account banners

- [#2548](https://github.com/LedgerHQ/ledger-live/pull/2548) [`cec9e0f33d`](https://github.com/LedgerHQ/ledger-live/commit/cec9e0f33d5bc058c0e4b3a2680fc8791d5b61b1) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - cosmos_testnet cleanup

- [#2435](https://github.com/LedgerHQ/ledger-live/pull/2435) [`cfc5d1ec57`](https://github.com/LedgerHQ/ledger-live/commit/cfc5d1ec570241e0fdcfd3a253957cdeb771f43c) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Implement useThrottledPortfolio hook to allow throttling the computation of portfolio graph data

- [#2605](https://github.com/LedgerHQ/ledger-live/pull/2605) [`7423309c87`](https://github.com/LedgerHQ/ledger-live/commit/7423309c87b95020354b147305ff40303d42c8a3) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add noinput parameter

- [#2558](https://github.com/LedgerHQ/ledger-live/pull/2558) [`b003234bd5`](https://github.com/LedgerHQ/ledger-live/commit/b003234bd5db564b4ddf25139e41ea21c5e852fa) Thanks [@Justkant](https://github.com/Justkant)! - fix: correctly filter after listCurrencies

- [#2502](https://github.com/LedgerHQ/ledger-live/pull/2502) [`0469c82884`](https://github.com/LedgerHQ/ledger-live/commit/0469c8288405dc9a47927e19ccf8ddafb38783de) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Remove cardano coin specific logic outside of its folder

- [#2552](https://github.com/LedgerHQ/ledger-live/pull/2552) [`467822aaf6`](https://github.com/LedgerHQ/ledger-live/commit/467822aaf680df334531c1489e5a845fecad492a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add Feature flag for WallectConnect Entry point

- [#2691](https://github.com/LedgerHQ/ledger-live/pull/2691) [`7e9dccf1bb`](https://github.com/LedgerHQ/ledger-live/commit/7e9dccf1bb857226ed95a0e3f9c7e4d0b4429857) Thanks [@Justkant](https://github.com/Justkant)! - fix: empty USER_ID on LLM

- [#2520](https://github.com/LedgerHQ/ledger-live/pull/2520) [`c7a709f224`](https://github.com/LedgerHQ/ledger-live/commit/c7a709f2246fa416513c39ffa9ef05a09488ecec) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Remove near coin specific logic outside of its folder

- [#2161](https://github.com/LedgerHQ/ledger-live/pull/2161) [`9aaa3e75e7`](https://github.com/LedgerHQ/ledger-live/commit/9aaa3e75e7e3d4b0cca2e177b409fc56e38efe1a) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - Introduce useWalletAPIServer

- [#2677](https://github.com/LedgerHQ/ledger-live/pull/2677) [`5c46dfade6`](https://github.com/LedgerHQ/ledger-live/commit/5c46dfade659a4162e032e16b3a5b603dbc8bd66) Thanks [@sarneijim](https://github.com/sarneijim)! - add near stake account banner

- [#2478](https://github.com/LedgerHQ/ledger-live/pull/2478) [`6c075924c0`](https://github.com/LedgerHQ/ledger-live/commit/6c075924c0a0a589ff46cc6681618e6519ef974b) Thanks [@gre](https://github.com/gre)! - Fixes ESDT Token Account sync immutability

- [#2703](https://github.com/LedgerHQ/ledger-live/pull/2703) [`76e381ed73`](https://github.com/LedgerHQ/ledger-live/commit/76e381ed731de5e33a78aad6c3a2a956fb170be0) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - increase gas estimation for claim rewards

- [#2513](https://github.com/LedgerHQ/ledger-live/pull/2513) [`a767918b3b`](https://github.com/LedgerHQ/ledger-live/commit/a767918b3be17319f23e2bfa118135a3924d2ee0) Thanks [@gre](https://github.com/gre)! - Introduce bot summary, a way to check all accounts of the bots and evaluate performance.

- [#1991](https://github.com/LedgerHQ/ledger-live/pull/1991) [`6003fbc140`](https://github.com/LedgerHQ/ledger-live/commit/6003fbc1408243332ee2e4956322e1a53d70de27) Thanks [@valpinkman](https://github.com/valpinkman)! - Publish the `lib-es` folder to the npm registry

- [`2aa9b47db4`](https://github.com/LedgerHQ/ledger-live/commit/2aa9b47db42fa70050fa09d7479988bdd1bebaa9) Thanks [@demonslayer69420](https://github.com/demonslayer69420)! - add icon support for Waifu on ledger live.

- [#2707](https://github.com/LedgerHQ/ledger-live/pull/2707) [`8c4cc6a69f`](https://github.com/LedgerHQ/ledger-live/commit/8c4cc6a69fed65b5ced7fe77f302aa1faf880149) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - fix: filter outside SelectAccountAndCurrencyDrawer [LIVE-5865]

- Updated dependencies [[`0725151a34`](https://github.com/LedgerHQ/ledger-live/commit/0725151a348608bec1f8338b57772f12a23cb471), [`cec9e0f33d`](https://github.com/LedgerHQ/ledger-live/commit/cec9e0f33d5bc058c0e4b3a2680fc8791d5b61b1), [`52d3a03dfc`](https://github.com/LedgerHQ/ledger-live/commit/52d3a03dfcbf8a4c8d3ef2fca49025f56ffc7a09), [`62af25493e`](https://github.com/LedgerHQ/ledger-live/commit/62af25493e2becf897d517af42542db208b971c7), [`885227a1d7`](https://github.com/LedgerHQ/ledger-live/commit/885227a1d7c78c410b276bf53c3016f9eeb4ff93), [`725000b4ed`](https://github.com/LedgerHQ/ledger-live/commit/725000b4ed37a2669f3a0cd70ca2b5d0b1d4825e), [`0725151a34`](https://github.com/LedgerHQ/ledger-live/commit/0725151a348608bec1f8338b57772f12a23cb471)]:
  - @ledgerhq/cryptoassets@9.0.0
  - @ledgerhq/coin-framework@0.1.0
  - @ledgerhq/hw-app-btc@10.0.0
  - @ledgerhq/devices@8.0.0
  - @ledgerhq/hw-app-eth@6.32.0
  - @ledgerhq/coin-polkadot@0.0.2
  - @ledgerhq/hw-transport@6.28.1
  - @ledgerhq/hw-app-algorand@6.27.12
  - @ledgerhq/hw-app-cosmos@6.27.12
  - @ledgerhq/hw-app-near@6.27.7
  - @ledgerhq/hw-app-polkadot@6.27.12
  - @ledgerhq/hw-app-solana@7.0.6
  - @ledgerhq/hw-app-str@6.27.12
  - @ledgerhq/hw-app-tezos@6.27.12
  - @ledgerhq/hw-app-trx@6.27.12
  - @ledgerhq/hw-app-xrp@6.27.12
  - @ledgerhq/hw-transport-mocker@6.27.12
  - @ledgerhq/hw-transport-node-speculos@6.27.12

## 29.0.0-next.4

### Patch Changes

- [#2707](https://github.com/LedgerHQ/ledger-live/pull/2707) [`8c4cc6a69f`](https://github.com/LedgerHQ/ledger-live/commit/8c4cc6a69fed65b5ced7fe77f302aa1faf880149) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - fix: filter outside SelectAccountAndCurrencyDrawer [LIVE-5865]

## 29.0.0-next.3

### Patch Changes

- [#2598](https://github.com/LedgerHQ/ledger-live/pull/2598) [`b4aed3961f`](https://github.com/LedgerHQ/ledger-live/commit/b4aed3961f26ee560bb8f57f60c10112ee70bc28) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Reduce redundant calls for ethereum synchronization

## 29.0.0-next.2

### Minor Changes

- [#2745](https://github.com/LedgerHQ/ledger-live/pull/2745) [`52d3a03dfc`](https://github.com/LedgerHQ/ledger-live/commit/52d3a03dfcbf8a4c8d3ef2fca49025f56ffc7a09) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for address poisoning filtering

### Patch Changes

- Updated dependencies [[`52d3a03dfc`](https://github.com/LedgerHQ/ledger-live/commit/52d3a03dfcbf8a4c8d3ef2fca49025f56ffc7a09)]:
  - @ledgerhq/coin-framework@0.1.0-next.1
  - @ledgerhq/coin-polkadot@0.0.2-next.1

## 29.0.0-next.1

### Patch Changes

- [#2734](https://github.com/LedgerHQ/ledger-live/pull/2734) [`80e3090edc`](https://github.com/LedgerHQ/ledger-live/commit/80e3090edc91a4e8c2f95891ce2eea48ddb1d319) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Gas limit error when above available balance fix

## 29.0.0-next.0

### Major Changes

- [#1991](https://github.com/LedgerHQ/ledger-live/pull/1991) [`62af25493e`](https://github.com/LedgerHQ/ledger-live/commit/62af25493e2becf897d517af42542db208b971c7) Thanks [@valpinkman](https://github.com/valpinkman)! - Remove the support for imports ending with `/` mapping to the `index.js` file.

  For instance:

  ```js
  import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/";
  ```

  Should be rewritten to:

  ```js
  import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
  ```

  This trailing slash is poorly supported by some tools like `vite.js` and was meant as a transitional change.
  Time has come to remove the support for thos shorthand.

### Minor Changes

- [#2416](https://github.com/LedgerHQ/ledger-live/pull/2416) [`109f456ff9`](https://github.com/LedgerHQ/ledger-live/commit/109f456ff9e715de8916d5dd4e096fd085c65319) Thanks [@samuel-tifi](https://github.com/samuel-tifi)! - Crypto Icon - Add support for TiFi Token icon

- [#2560](https://github.com/LedgerHQ/ledger-live/pull/2560) [`b5d8805bef`](https://github.com/LedgerHQ/ledger-live/commit/b5d8805bef1b35c85b2a8f0a7d1487345c65ec67) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Enable Solana in swap

- [#1712](https://github.com/LedgerHQ/ledger-live/pull/1712) [`72cc12fcdb`](https://github.com/LedgerHQ/ledger-live/commit/72cc12fcdbd452c78fab00a064a24de56db2d38c) Thanks [@lvndry](https://github.com/lvndry)! - Add Avalanche C Chain in Ledger Live

- [#2493](https://github.com/LedgerHQ/ledger-live/pull/2493) [`4d8bcb5f83`](https://github.com/LedgerHQ/ledger-live/commit/4d8bcb5f8338987252780735ecaf5a51eea8cbee) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Add hooks for naming service in eth

- [#2521](https://github.com/LedgerHQ/ledger-live/pull/2521) [`cbc5d3ddc5`](https://github.com/LedgerHQ/ledger-live/commit/cbc5d3ddc5aca2ede06e0839388829d5b0eb84bf) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Add PERFORMANCE_CONSOLE env variable

- [#2493](https://github.com/LedgerHQ/ledger-live/pull/2493) [`4d8bcb5f83`](https://github.com/LedgerHQ/ledger-live/commit/4d8bcb5f8338987252780735ecaf5a51eea8cbee) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - change jest to jsdom to test react hooks

- [#2328](https://github.com/LedgerHQ/ledger-live/pull/2328) [`0725151a34`](https://github.com/LedgerHQ/ledger-live/commit/0725151a348608bec1f8338b57772f12a23cb471) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for ERC20 tokens to the EVM family

### Patch Changes

- [#2484](https://github.com/LedgerHQ/ledger-live/pull/2484) [`a1a2220dfc`](https://github.com/LedgerHQ/ledger-live/commit/a1a2220dfce313ade4c0f055ff4c5b9427fa285d) Thanks [@gre](https://github.com/gre)! - Fixes Tron signOperation immutability

- [#2625](https://github.com/LedgerHQ/ledger-live/pull/2625) [`86ab7eb1d4`](https://github.com/LedgerHQ/ledger-live/commit/86ab7eb1d4d234051bb30930787279ebcdae6ea6) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Feat: device SDK: first device action

  First commands:

  - getVersion
  - getAppAndVersion
  - genuineCheck

  First task (with shared logic):

  - getDeviceInfo

  First action (with shared reducer logic):

  - getDeviceInfo

  Also implemented a hook + a CLI for the getDeviceInfo as a usage example

- [#2627](https://github.com/LedgerHQ/ledger-live/pull/2627) [`3d29b9e7ff`](https://github.com/LedgerHQ/ledger-live/commit/3d29b9e7ff1536b4e5624437b0507c2556e371f3) Thanks [@sarneijim](https://github.com/sarneijim)! - add solana stake account banners

- [#2548](https://github.com/LedgerHQ/ledger-live/pull/2548) [`cec9e0f33d`](https://github.com/LedgerHQ/ledger-live/commit/cec9e0f33d5bc058c0e4b3a2680fc8791d5b61b1) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - cosmos_testnet cleanup

- [#2435](https://github.com/LedgerHQ/ledger-live/pull/2435) [`cfc5d1ec57`](https://github.com/LedgerHQ/ledger-live/commit/cfc5d1ec570241e0fdcfd3a253957cdeb771f43c) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Implement useThrottledPortfolio hook to allow throttling the computation of portfolio graph data

- [#2605](https://github.com/LedgerHQ/ledger-live/pull/2605) [`7423309c87`](https://github.com/LedgerHQ/ledger-live/commit/7423309c87b95020354b147305ff40303d42c8a3) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add noinput parameter

- [#2558](https://github.com/LedgerHQ/ledger-live/pull/2558) [`b003234bd5`](https://github.com/LedgerHQ/ledger-live/commit/b003234bd5db564b4ddf25139e41ea21c5e852fa) Thanks [@Justkant](https://github.com/Justkant)! - fix: correctly filter after listCurrencies

- [#2502](https://github.com/LedgerHQ/ledger-live/pull/2502) [`0469c82884`](https://github.com/LedgerHQ/ledger-live/commit/0469c8288405dc9a47927e19ccf8ddafb38783de) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Remove cardano coin specific logic outside of its folder

- [#2552](https://github.com/LedgerHQ/ledger-live/pull/2552) [`467822aaf6`](https://github.com/LedgerHQ/ledger-live/commit/467822aaf680df334531c1489e5a845fecad492a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add Feature flag for WallectConnect Entry point

- [#2691](https://github.com/LedgerHQ/ledger-live/pull/2691) [`7e9dccf1bb`](https://github.com/LedgerHQ/ledger-live/commit/7e9dccf1bb857226ed95a0e3f9c7e4d0b4429857) Thanks [@Justkant](https://github.com/Justkant)! - fix: empty USER_ID on LLM

- [#2520](https://github.com/LedgerHQ/ledger-live/pull/2520) [`c7a709f224`](https://github.com/LedgerHQ/ledger-live/commit/c7a709f2246fa416513c39ffa9ef05a09488ecec) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Remove near coin specific logic outside of its folder

- [#2161](https://github.com/LedgerHQ/ledger-live/pull/2161) [`9aaa3e75e7`](https://github.com/LedgerHQ/ledger-live/commit/9aaa3e75e7e3d4b0cca2e177b409fc56e38efe1a) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - Introduce useWalletAPIServer

- [#2598](https://github.com/LedgerHQ/ledger-live/pull/2598) [`b4aed3961f`](https://github.com/LedgerHQ/ledger-live/commit/b4aed3961f26ee560bb8f57f60c10112ee70bc28) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Reduce redundant calls for ethereum synchronization

- [#2677](https://github.com/LedgerHQ/ledger-live/pull/2677) [`5c46dfade6`](https://github.com/LedgerHQ/ledger-live/commit/5c46dfade659a4162e032e16b3a5b603dbc8bd66) Thanks [@sarneijim](https://github.com/sarneijim)! - add near stake account banner

- [#2478](https://github.com/LedgerHQ/ledger-live/pull/2478) [`6c075924c0`](https://github.com/LedgerHQ/ledger-live/commit/6c075924c0a0a589ff46cc6681618e6519ef974b) Thanks [@gre](https://github.com/gre)! - Fixes ESDT Token Account sync immutability

- [#2703](https://github.com/LedgerHQ/ledger-live/pull/2703) [`76e381ed73`](https://github.com/LedgerHQ/ledger-live/commit/76e381ed731de5e33a78aad6c3a2a956fb170be0) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - increase gas estimation for claim rewards

- [#2513](https://github.com/LedgerHQ/ledger-live/pull/2513) [`a767918b3b`](https://github.com/LedgerHQ/ledger-live/commit/a767918b3be17319f23e2bfa118135a3924d2ee0) Thanks [@gre](https://github.com/gre)! - Introduce bot summary, a way to check all accounts of the bots and evaluate performance.

- [#1991](https://github.com/LedgerHQ/ledger-live/pull/1991) [`6003fbc140`](https://github.com/LedgerHQ/ledger-live/commit/6003fbc1408243332ee2e4956322e1a53d70de27) Thanks [@valpinkman](https://github.com/valpinkman)! - Publish the `lib-es` folder to the npm registry

- [`2aa9b47db4`](https://github.com/LedgerHQ/ledger-live/commit/2aa9b47db42fa70050fa09d7479988bdd1bebaa9) Thanks [@demonslayer69420](https://github.com/demonslayer69420)! - add icon support for Waifu on ledger live.

- Updated dependencies [[`0725151a34`](https://github.com/LedgerHQ/ledger-live/commit/0725151a348608bec1f8338b57772f12a23cb471), [`cec9e0f33d`](https://github.com/LedgerHQ/ledger-live/commit/cec9e0f33d5bc058c0e4b3a2680fc8791d5b61b1), [`62af25493e`](https://github.com/LedgerHQ/ledger-live/commit/62af25493e2becf897d517af42542db208b971c7), [`885227a1d7`](https://github.com/LedgerHQ/ledger-live/commit/885227a1d7c78c410b276bf53c3016f9eeb4ff93), [`725000b4ed`](https://github.com/LedgerHQ/ledger-live/commit/725000b4ed37a2669f3a0cd70ca2b5d0b1d4825e), [`0725151a34`](https://github.com/LedgerHQ/ledger-live/commit/0725151a348608bec1f8338b57772f12a23cb471)]:
  - @ledgerhq/cryptoassets@9.0.0-next.0
  - @ledgerhq/hw-app-btc@10.0.0-next.0
  - @ledgerhq/devices@8.0.0-next.0
  - @ledgerhq/coin-framework@0.0.2-next.0
  - @ledgerhq/hw-app-eth@6.32.0-next.0
  - @ledgerhq/coin-polkadot@0.0.2-next.0
  - @ledgerhq/hw-transport@6.28.1-next.0
  - @ledgerhq/hw-app-algorand@6.27.12-next.0
  - @ledgerhq/hw-app-cosmos@6.27.12-next.0
  - @ledgerhq/hw-app-near@6.27.7-next.0
  - @ledgerhq/hw-app-polkadot@6.27.12-next.0
  - @ledgerhq/hw-app-solana@7.0.6-next.0
  - @ledgerhq/hw-app-str@6.27.12-next.0
  - @ledgerhq/hw-app-tezos@6.27.12-next.0
  - @ledgerhq/hw-app-trx@6.27.12-next.0
  - @ledgerhq/hw-app-xrp@6.27.12-next.0
  - @ledgerhq/hw-transport-mocker@6.27.12-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.12-next.0

## 28.0.2

### Patch Changes

- [#2622](https://github.com/LedgerHQ/ledger-live/pull/2622) [`090c6c8d8f`](https://github.com/LedgerHQ/ledger-live/commit/090c6c8d8f15bc13995851abc9eb35c649f6b678) Thanks [@github-actions](https://github.com/apps/github-actions)! - Reduce redundant calls for ethereum synchronization

## 28.0.2-hotfix.0

### Patch Changes

- [#2622](https://github.com/LedgerHQ/ledger-live/pull/2622) [`090c6c8d8f`](https://github.com/LedgerHQ/ledger-live/commit/090c6c8d8f15bc13995851abc9eb35c649f6b678) Thanks [@github-actions](https://github.com/apps/github-actions)! - Reduce redundant calls for ethereum synchronization

## 28.0.1

### Patch Changes

- [#2543](https://github.com/LedgerHQ/ledger-live/pull/2543) [`61c7aafb21`](https://github.com/LedgerHQ/ledger-live/commit/61c7aafb216099692fad27621fff167f1ba4c840) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Change fee limit to 50

* [#2532](https://github.com/LedgerHQ/ledger-live/pull/2532) [`31f13e8ac2`](https://github.com/LedgerHQ/ledger-live/commit/31f13e8ac2272c54621d2b83f8b17ab5350ce918) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Tron fee limit upgrade to 30

## 28.0.1-hotfix.1

### Patch Changes

- [#2543](https://github.com/LedgerHQ/ledger-live/pull/2543) [`61c7aafb21`](https://github.com/LedgerHQ/ledger-live/commit/61c7aafb216099692fad27621fff167f1ba4c840) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Change fee limit to 50

## 28.0.1-hotfix.0

### Patch Changes

- [#2532](https://github.com/LedgerHQ/ledger-live/pull/2532) [`31f13e8ac2`](https://github.com/LedgerHQ/ledger-live/commit/31f13e8ac2272c54621d2b83f8b17ab5350ce918) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Tron fee limit upgrade to 30

## 28.0.0

### Major Changes

- [#2444](https://github.com/LedgerHQ/ledger-live/pull/2444) [`dcfeef0a2c`](https://github.com/LedgerHQ/ledger-live/commit/dcfeef0a2c0f8c3d344d2943b3d21654f15ae184) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Update to v4 explorers and removal of JSONBigNumber dependency

### Minor Changes

- [#2256](https://github.com/LedgerHQ/ledger-live/pull/2256) [`ebdb20d071`](https://github.com/LedgerHQ/ledger-live/commit/ebdb20d071290c6d4565d64bc77e26ce8191edea) Thanks [@lvndry](https://github.com/lvndry)! - Ledger Live Common can build transactions including OP_RETURN opcode

* [#817](https://github.com/LedgerHQ/ledger-live/pull/817) [`36c1a33638`](https://github.com/LedgerHQ/ledger-live/commit/36c1a33638dd889173f1caf263563c27aebc521f) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Remove algorand dependencies from LLC

- [#1782](https://github.com/LedgerHQ/ledger-live/pull/1782) [`3ca4c9763d`](https://github.com/LedgerHQ/ledger-live/commit/3ca4c9763dd7c7ab7891efbd3cb6785cda2d038f) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - merge osmosis into cosmos family

* [#2405](https://github.com/LedgerHQ/ledger-live/pull/2405) [`7eb8b1a39b`](https://github.com/LedgerHQ/ledger-live/commit/7eb8b1a39b36a5b336d95f89a92edf7ee22bcd26) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Make Ethereum family preload resilient to malformed dynamic CAL

### Patch Changes

- [#2135](https://github.com/LedgerHQ/ledger-live/pull/2135) [`6214ac0412`](https://github.com/LedgerHQ/ledger-live/commit/6214ac0412f5d67ffc9ed965e21ffda44c30ae21) Thanks [@quimodotcom](https://github.com/quimodotcom)! - Crypto Icons - Add support for CRACKER token icons

* [#2510](https://github.com/LedgerHQ/ledger-live/pull/2510) [`0e3dadacce`](https://github.com/LedgerHQ/ledger-live/commit/0e3dadacce1292b85ae028289301b7a84631a8fa) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix cosmos unbond bug and translation

- [#2419](https://github.com/LedgerHQ/ledger-live/pull/2419) [`8ff8e433ed`](https://github.com/LedgerHQ/ledger-live/commit/8ff8e433edb6e95693dc21f83c958f6c4a65f056) Thanks [@gre](https://github.com/gre)! - Simplify network logs

* [#2467](https://github.com/LedgerHQ/ledger-live/pull/2467) [`61ff754c0c`](https://github.com/LedgerHQ/ledger-live/commit/61ff754c0cfcacb564e6c6e0497c23cee17f1eb8) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Base the dependency resolution on the minimum version and not the presence of Bitcoin Legacy

- [#2293](https://github.com/LedgerHQ/ledger-live/pull/2293) [`db03ee7a28`](https://github.com/LedgerHQ/ledger-live/commit/db03ee7a28e832582111eb5ab31ce73694cfb957) Thanks [@Yahmooo](https://github.com/Yahmooo)! - changed the name of a crypto icon from H3M.svg to hmmm.svg because the currency name is hmmm not H3M.

* [#2410](https://github.com/LedgerHQ/ledger-live/pull/2410) [`0839f0886f`](https://github.com/LedgerHQ/ledger-live/commit/0839f0886f3acd544ae21d3c9c3c7a607662303b) Thanks [@chabroA](https://github.com/chabroA)! - Update wallet-api error formatting

- [#2401](https://github.com/LedgerHQ/ledger-live/pull/2401) [`de69b7f2ba`](https://github.com/LedgerHQ/ledger-live/commit/de69b7f2baa614726167e97e4fb4bbe741aafbfb) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Prevent device name bug in LNX

* [#2342](https://github.com/LedgerHQ/ledger-live/pull/2342) [`c2779b1cab`](https://github.com/LedgerHQ/ledger-live/commit/c2779b1cab18a1d5747ca955f5ceee86db920f57) Thanks [@gre](https://github.com/gre)! - Improve performance of socket.ts by using exchangeBulk

* Updated dependencies [[`7eb8b1a39b`](https://github.com/LedgerHQ/ledger-live/commit/7eb8b1a39b36a5b336d95f89a92edf7ee22bcd26), [`3ca4c9763d`](https://github.com/LedgerHQ/ledger-live/commit/3ca4c9763dd7c7ab7891efbd3cb6785cda2d038f), [`0e7ff249f7`](https://github.com/LedgerHQ/ledger-live/commit/0e7ff249f7e1160ff3888e52767ef91151efbedd), [`dcfeef0a2c`](https://github.com/LedgerHQ/ledger-live/commit/dcfeef0a2c0f8c3d344d2943b3d21654f15ae184), [`c2779b1cab`](https://github.com/LedgerHQ/ledger-live/commit/c2779b1cab18a1d5747ca955f5ceee86db920f57)]:
  - @ledgerhq/hw-app-eth@6.31.0
  - @ledgerhq/cryptoassets@8.0.0
  - @ledgerhq/hw-transport@6.28.0
  - @ledgerhq/hw-app-algorand@6.27.11
  - @ledgerhq/hw-app-btc@9.1.3
  - @ledgerhq/hw-app-cosmos@6.27.11
  - @ledgerhq/hw-app-near@6.27.6
  - @ledgerhq/hw-app-polkadot@6.27.11
  - @ledgerhq/hw-app-solana@7.0.5
  - @ledgerhq/hw-app-str@6.27.11
  - @ledgerhq/hw-app-tezos@6.27.11
  - @ledgerhq/hw-app-trx@6.27.11
  - @ledgerhq/hw-app-xrp@6.27.11
  - @ledgerhq/hw-transport-mocker@6.27.11
  - @ledgerhq/hw-transport-node-speculos@6.27.11

## 28.0.0-next.1

### Patch Changes

- [#2510](https://github.com/LedgerHQ/ledger-live/pull/2510) [`0e3dadacce`](https://github.com/LedgerHQ/ledger-live/commit/0e3dadacce1292b85ae028289301b7a84631a8fa) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix cosmos unbond bug and translation

## 28.0.0-next.0

### Major Changes

- [#2444](https://github.com/LedgerHQ/ledger-live/pull/2444) [`dcfeef0a2c`](https://github.com/LedgerHQ/ledger-live/commit/dcfeef0a2c0f8c3d344d2943b3d21654f15ae184) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Update to v4 explorers and removal of JSONBigNumber dependency

### Minor Changes

- [#2256](https://github.com/LedgerHQ/ledger-live/pull/2256) [`ebdb20d071`](https://github.com/LedgerHQ/ledger-live/commit/ebdb20d071290c6d4565d64bc77e26ce8191edea) Thanks [@lvndry](https://github.com/lvndry)! - Ledger Live Common can build transactions including OP_RETURN opcode

* [#817](https://github.com/LedgerHQ/ledger-live/pull/817) [`36c1a33638`](https://github.com/LedgerHQ/ledger-live/commit/36c1a33638dd889173f1caf263563c27aebc521f) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Remove algorand dependencies from LLC

- [#1782](https://github.com/LedgerHQ/ledger-live/pull/1782) [`3ca4c9763d`](https://github.com/LedgerHQ/ledger-live/commit/3ca4c9763dd7c7ab7891efbd3cb6785cda2d038f) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - merge osmosis into cosmos family

* [#2405](https://github.com/LedgerHQ/ledger-live/pull/2405) [`7eb8b1a39b`](https://github.com/LedgerHQ/ledger-live/commit/7eb8b1a39b36a5b336d95f89a92edf7ee22bcd26) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Make Ethereum family preload resilient to malformed dynamic CAL

### Patch Changes

- [#2135](https://github.com/LedgerHQ/ledger-live/pull/2135) [`6214ac0412`](https://github.com/LedgerHQ/ledger-live/commit/6214ac0412f5d67ffc9ed965e21ffda44c30ae21) Thanks [@quimodotcom](https://github.com/quimodotcom)! - Crypto Icons - Add support for CRACKER token icons

* [#2419](https://github.com/LedgerHQ/ledger-live/pull/2419) [`8ff8e433ed`](https://github.com/LedgerHQ/ledger-live/commit/8ff8e433edb6e95693dc21f83c958f6c4a65f056) Thanks [@gre](https://github.com/gre)! - Simplify network logs

- [#2467](https://github.com/LedgerHQ/ledger-live/pull/2467) [`61ff754c0c`](https://github.com/LedgerHQ/ledger-live/commit/61ff754c0cfcacb564e6c6e0497c23cee17f1eb8) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Base the dependency resolution on the minimum version and not the presence of Bitcoin Legacy

* [#2293](https://github.com/LedgerHQ/ledger-live/pull/2293) [`db03ee7a28`](https://github.com/LedgerHQ/ledger-live/commit/db03ee7a28e832582111eb5ab31ce73694cfb957) Thanks [@Yahmooo](https://github.com/Yahmooo)! - changed the name of a crypto icon from H3M.svg to hmmm.svg because the currency name is hmmm not H3M.

- [#2410](https://github.com/LedgerHQ/ledger-live/pull/2410) [`0839f0886f`](https://github.com/LedgerHQ/ledger-live/commit/0839f0886f3acd544ae21d3c9c3c7a607662303b) Thanks [@chabroA](https://github.com/chabroA)! - Update wallet-api error formatting

* [#2401](https://github.com/LedgerHQ/ledger-live/pull/2401) [`de69b7f2ba`](https://github.com/LedgerHQ/ledger-live/commit/de69b7f2baa614726167e97e4fb4bbe741aafbfb) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Prevent device name bug in LNX

- [#2342](https://github.com/LedgerHQ/ledger-live/pull/2342) [`c2779b1cab`](https://github.com/LedgerHQ/ledger-live/commit/c2779b1cab18a1d5747ca955f5ceee86db920f57) Thanks [@gre](https://github.com/gre)! - Improve performance of socket.ts by using exchangeBulk

- Updated dependencies [[`7eb8b1a39b`](https://github.com/LedgerHQ/ledger-live/commit/7eb8b1a39b36a5b336d95f89a92edf7ee22bcd26), [`3ca4c9763d`](https://github.com/LedgerHQ/ledger-live/commit/3ca4c9763dd7c7ab7891efbd3cb6785cda2d038f), [`0e7ff249f7`](https://github.com/LedgerHQ/ledger-live/commit/0e7ff249f7e1160ff3888e52767ef91151efbedd), [`dcfeef0a2c`](https://github.com/LedgerHQ/ledger-live/commit/dcfeef0a2c0f8c3d344d2943b3d21654f15ae184), [`c2779b1cab`](https://github.com/LedgerHQ/ledger-live/commit/c2779b1cab18a1d5747ca955f5ceee86db920f57)]:
  - @ledgerhq/hw-app-eth@6.31.0-next.0
  - @ledgerhq/cryptoassets@8.0.0-next.0
  - @ledgerhq/hw-transport@6.28.0-next.0
  - @ledgerhq/hw-app-algorand@6.27.11-next.0
  - @ledgerhq/hw-app-btc@9.1.3-next.0
  - @ledgerhq/hw-app-cosmos@6.27.11-next.0
  - @ledgerhq/hw-app-near@6.27.6-next.0
  - @ledgerhq/hw-app-polkadot@6.27.11-next.0
  - @ledgerhq/hw-app-solana@7.0.5-next.0
  - @ledgerhq/hw-app-str@6.27.11-next.0
  - @ledgerhq/hw-app-tezos@6.27.11-next.0
  - @ledgerhq/hw-app-trx@6.27.11-next.0
  - @ledgerhq/hw-app-xrp@6.27.11-next.0
  - @ledgerhq/hw-transport-mocker@6.27.11-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.11-next.0

## 27.12.0

### Minor Changes

- [#2191](https://github.com/LedgerHQ/ledger-live/pull/2191) [`efc2b4d4fb`](https://github.com/LedgerHQ/ledger-live/commit/efc2b4d4fb2acb6c63a4c55b5e51e251712dfc5c) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - useSwapTransaction returns when rates are successfully fetched

* [#2162](https://github.com/LedgerHQ/ledger-live/pull/2162) [`97c9cb43a4`](https://github.com/LedgerHQ/ledger-live/commit/97c9cb43a4a4dc2c6369d76f12b4a0c48fe3990a) Thanks [@lvndry](https://github.com/lvndry)! - Ledger Live Common can build transactions including OP_RETURN opcode

- [#2340](https://github.com/LedgerHQ/ledger-live/pull/2340) [`789bfc0fad`](https://github.com/LedgerHQ/ledger-live/commit/789bfc0fadd53c8209a2ad8aa8df6bbf9a2891ab) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - support: add Cometh as dep

* [#2337](https://github.com/LedgerHQ/ledger-live/pull/2337) [`7fef128ffb`](https://github.com/LedgerHQ/ledger-live/commit/7fef128ffba226dd675935c7464db60894f327bb) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - add plugins dependencies

- [#2325](https://github.com/LedgerHQ/ledger-live/pull/2325) [`16195a130e`](https://github.com/LedgerHQ/ledger-live/commit/16195a130e24b06528b6c2c2551e58be253f94f1) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - add feature flag objkt banner on tezos

* [#2310](https://github.com/LedgerHQ/ledger-live/pull/2310) [`7af03d772a`](https://github.com/LedgerHQ/ledger-live/commit/7af03d772a16822024e456224951c48c5e09e45d) Thanks [@sarneijim](https://github.com/sarneijim)! - Add static limit to format value

- [#2351](https://github.com/LedgerHQ/ledger-live/pull/2351) [`f3fd3134a3`](https://github.com/LedgerHQ/ledger-live/commit/f3fd3134a3852f9d872b1be268e60beae8ea3496) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add transactionRaw to Ethereum optimistic operation to allow for resending identical transaction

* [#2364](https://github.com/LedgerHQ/ledger-live/pull/2364) [`5b4aa38421`](https://github.com/LedgerHQ/ledger-live/commit/5b4aa38421380512fb96ef66e1f3149ce8bfd018) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - update polkadot min version

- [#2159](https://github.com/LedgerHQ/ledger-live/pull/2159) [`96458c4f37`](https://github.com/LedgerHQ/ledger-live/commit/96458c4f3777a079e01069005217457f3e6033e2) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - Changes swap kyc alert copy for changelly

* [#2326](https://github.com/LedgerHQ/ledger-live/pull/2326) [`63e63e5fc5`](https://github.com/LedgerHQ/ledger-live/commit/63e63e5fc562c029f1372f664d1a45dc1fda5047) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - Only fetches swap rates for supported CEX and DEX providers.

- [#1978](https://github.com/LedgerHQ/ledger-live/pull/1978) [`192b897ce4`](https://github.com/LedgerHQ/ledger-live/commit/192b897ce45635f0d91021a1d4973035f6d9bf72) Thanks [@RamyEB](https://github.com/RamyEB)! - Deletion of an old logic concerning the manifest fetch and filter, and replacement by a new one + added the possibility to give a custom Provider

* [#2262](https://github.com/LedgerHQ/ledger-live/pull/2262) [`88d6de464b`](https://github.com/LedgerHQ/ledger-live/commit/88d6de464b475b049aaf1724b28d8a592bfd4676) Thanks [@chabroA](https://github.com/chabroA)! - Add walletApiAdapter files to migrate to wallet-api

- [#2313](https://github.com/LedgerHQ/ledger-live/pull/2313) [`0b827ad97a`](https://github.com/LedgerHQ/ledger-live/commit/0b827ad97afb5e12ae0c8d0d1cf3952a6d02ec7c) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - Adds expirationTime to exchange rates returned.

* [#1661](https://github.com/LedgerHQ/ledger-live/pull/1661) [`a56ffa948d`](https://github.com/LedgerHQ/ledger-live/commit/a56ffa948defb16ea9f2968d96d4b896f9839145) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - add elrond staking and token

### Patch Changes

- [#2358](https://github.com/LedgerHQ/ledger-live/pull/2358) [`dcad1bcbdc`](https://github.com/LedgerHQ/ledger-live/commit/dcad1bcbdc6f1674a175f2bca12c85edbdd179e1) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix polygon bug with new backend response in swap

* [#2334](https://github.com/LedgerHQ/ledger-live/pull/2334) [`75fbe7f3b1`](https://github.com/LedgerHQ/ledger-live/commit/75fbe7f3b1058e6eb6906c0d5fac3fb10eefc3eb) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Prevent crash because of legacy identifier "nanoFTS" in post-onboarding related app data

- [#2179](https://github.com/LedgerHQ/ledger-live/pull/2179) [`befe0e224a`](https://github.com/LedgerHQ/ledger-live/commit/befe0e224a93fbc3598f4d03b769b9d9e1af721e) Thanks [@sarneijim](https://github.com/sarneijim)! - Add deeplink to dex quotes

* [#2282](https://github.com/LedgerHQ/ledger-live/pull/2282) [`ea6e557506`](https://github.com/LedgerHQ/ledger-live/commit/ea6e5575069f7ce4c9f9ce4983671aa465740fc5) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Prevents over usage of erc20.json CDN file

- [#2250](https://github.com/LedgerHQ/ledger-live/pull/2250) [`4e9378d63b`](https://github.com/LedgerHQ/ledger-live/commit/4e9378d63b048fef131ee574220c428456ef42d4) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Remove superfluous apdu in getdevicename command

* [#2130](https://github.com/LedgerHQ/ledger-live/pull/2130) [`d26fbee27a`](https://github.com/LedgerHQ/ledger-live/commit/d26fbee27aacd05e2cc5ee0ba3c49492a72f5659) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - feat: enable skipping any app install if not found

  Added in streamAppInstall: param skipAppInstallIfNotFound, set by default to false.

- [#2272](https://github.com/LedgerHQ/ledger-live/pull/2272) [`b7df09bbc9`](https://github.com/LedgerHQ/ledger-live/commit/b7df09bbc9a07602b326fbbe434c13ec61f276e7) Thanks [@lvndry](https://github.com/lvndry)! - Upgrade @celo/\* to 3.0.1

* [#2189](https://github.com/LedgerHQ/ledger-live/pull/2189) [`d0919b03f4`](https://github.com/LedgerHQ/ledger-live/commit/d0919b03f49d2cfd13e0f476f7b94c54e34be872) Thanks [@sarneijim](https://github.com/sarneijim)! - Add SwapExchangeRateAmountTooLowOrTooHigh error to swap dex quotes

- [#2318](https://github.com/LedgerHQ/ledger-live/pull/2318) [`9bba7fd8bd`](https://github.com/LedgerHQ/ledger-live/commit/9bba7fd8bd9b55be569fb57367e7debc442af789) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - bugfix: cosmos delegate/unbond/redelegate tx are wrongly interpreted into claim reward tx

- Updated dependencies [[`a56ffa948d`](https://github.com/LedgerHQ/ledger-live/commit/a56ffa948defb16ea9f2968d96d4b896f9839145)]:
  - @ledgerhq/cryptoassets@7.3.0
  - @ledgerhq/hw-app-eth@6.30.5

## 27.12.0-next.0

### Minor Changes

- [#2191](https://github.com/LedgerHQ/ledger-live/pull/2191) [`efc2b4d4fb`](https://github.com/LedgerHQ/ledger-live/commit/efc2b4d4fb2acb6c63a4c55b5e51e251712dfc5c) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - useSwapTransaction returns when rates are successfully fetched

* [#2162](https://github.com/LedgerHQ/ledger-live/pull/2162) [`97c9cb43a4`](https://github.com/LedgerHQ/ledger-live/commit/97c9cb43a4a4dc2c6369d76f12b4a0c48fe3990a) Thanks [@lvndry](https://github.com/lvndry)! - Ledger Live Common can build transactions including OP_RETURN opcode

- [#2340](https://github.com/LedgerHQ/ledger-live/pull/2340) [`789bfc0fad`](https://github.com/LedgerHQ/ledger-live/commit/789bfc0fadd53c8209a2ad8aa8df6bbf9a2891ab) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - support: add Cometh as dep

* [#2337](https://github.com/LedgerHQ/ledger-live/pull/2337) [`7fef128ffb`](https://github.com/LedgerHQ/ledger-live/commit/7fef128ffba226dd675935c7464db60894f327bb) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - add plugins dependencies

- [#2325](https://github.com/LedgerHQ/ledger-live/pull/2325) [`16195a130e`](https://github.com/LedgerHQ/ledger-live/commit/16195a130e24b06528b6c2c2551e58be253f94f1) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - add feature flag objkt banner on tezos

* [#2310](https://github.com/LedgerHQ/ledger-live/pull/2310) [`7af03d772a`](https://github.com/LedgerHQ/ledger-live/commit/7af03d772a16822024e456224951c48c5e09e45d) Thanks [@sarneijim](https://github.com/sarneijim)! - Add static limit to format value

- [#2351](https://github.com/LedgerHQ/ledger-live/pull/2351) [`f3fd3134a3`](https://github.com/LedgerHQ/ledger-live/commit/f3fd3134a3852f9d872b1be268e60beae8ea3496) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add transactionRaw to Ethereum optimistic operation to allow for resending identical transaction

* [#2364](https://github.com/LedgerHQ/ledger-live/pull/2364) [`5b4aa38421`](https://github.com/LedgerHQ/ledger-live/commit/5b4aa38421380512fb96ef66e1f3149ce8bfd018) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - update polkadot min version

- [#2159](https://github.com/LedgerHQ/ledger-live/pull/2159) [`96458c4f37`](https://github.com/LedgerHQ/ledger-live/commit/96458c4f3777a079e01069005217457f3e6033e2) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - Changes swap kyc alert copy for changelly

* [#2326](https://github.com/LedgerHQ/ledger-live/pull/2326) [`63e63e5fc5`](https://github.com/LedgerHQ/ledger-live/commit/63e63e5fc562c029f1372f664d1a45dc1fda5047) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - Only fetches swap rates for supported CEX and DEX providers.

- [#1978](https://github.com/LedgerHQ/ledger-live/pull/1978) [`192b897ce4`](https://github.com/LedgerHQ/ledger-live/commit/192b897ce45635f0d91021a1d4973035f6d9bf72) Thanks [@RamyEB](https://github.com/RamyEB)! - Deletion of an old logic concerning the manifest fetch and filter, and replacement by a new one + added the possibility to give a custom Provider

* [#2262](https://github.com/LedgerHQ/ledger-live/pull/2262) [`88d6de464b`](https://github.com/LedgerHQ/ledger-live/commit/88d6de464b475b049aaf1724b28d8a592bfd4676) Thanks [@chabroA](https://github.com/chabroA)! - Add walletApiAdapter files to migrate to wallet-api

- [#2313](https://github.com/LedgerHQ/ledger-live/pull/2313) [`0b827ad97a`](https://github.com/LedgerHQ/ledger-live/commit/0b827ad97afb5e12ae0c8d0d1cf3952a6d02ec7c) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - Adds expirationTime to exchange rates returned.

* [#1661](https://github.com/LedgerHQ/ledger-live/pull/1661) [`a56ffa948d`](https://github.com/LedgerHQ/ledger-live/commit/a56ffa948defb16ea9f2968d96d4b896f9839145) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - add elrond staking and token

### Patch Changes

- [#2358](https://github.com/LedgerHQ/ledger-live/pull/2358) [`dcad1bcbdc`](https://github.com/LedgerHQ/ledger-live/commit/dcad1bcbdc6f1674a175f2bca12c85edbdd179e1) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix polygon bug with new backend response in swap

* [#2334](https://github.com/LedgerHQ/ledger-live/pull/2334) [`75fbe7f3b1`](https://github.com/LedgerHQ/ledger-live/commit/75fbe7f3b1058e6eb6906c0d5fac3fb10eefc3eb) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Prevent crash because of legacy identifier "nanoFTS" in post-onboarding related app data

- [#2179](https://github.com/LedgerHQ/ledger-live/pull/2179) [`befe0e224a`](https://github.com/LedgerHQ/ledger-live/commit/befe0e224a93fbc3598f4d03b769b9d9e1af721e) Thanks [@sarneijim](https://github.com/sarneijim)! - Add deeplink to dex quotes

* [#2282](https://github.com/LedgerHQ/ledger-live/pull/2282) [`ea6e557506`](https://github.com/LedgerHQ/ledger-live/commit/ea6e5575069f7ce4c9f9ce4983671aa465740fc5) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Prevents over usage of erc20.json CDN file

- [#2250](https://github.com/LedgerHQ/ledger-live/pull/2250) [`4e9378d63b`](https://github.com/LedgerHQ/ledger-live/commit/4e9378d63b048fef131ee574220c428456ef42d4) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Remove superfluous apdu in getdevicename command

* [#2130](https://github.com/LedgerHQ/ledger-live/pull/2130) [`d26fbee27a`](https://github.com/LedgerHQ/ledger-live/commit/d26fbee27aacd05e2cc5ee0ba3c49492a72f5659) Thanks [@thomasrogerlux](https://github.com/thomasrogerlux)! - feat: enable skipping any app install if not found

  Added in streamAppInstall: param skipAppInstallIfNotFound, set by default to false.

- [#2272](https://github.com/LedgerHQ/ledger-live/pull/2272) [`b7df09bbc9`](https://github.com/LedgerHQ/ledger-live/commit/b7df09bbc9a07602b326fbbe434c13ec61f276e7) Thanks [@lvndry](https://github.com/lvndry)! - Upgrade @celo/\* to 3.0.1

* [#2189](https://github.com/LedgerHQ/ledger-live/pull/2189) [`d0919b03f4`](https://github.com/LedgerHQ/ledger-live/commit/d0919b03f49d2cfd13e0f476f7b94c54e34be872) Thanks [@sarneijim](https://github.com/sarneijim)! - Add SwapExchangeRateAmountTooLowOrTooHigh error to swap dex quotes

- [#2318](https://github.com/LedgerHQ/ledger-live/pull/2318) [`9bba7fd8bd`](https://github.com/LedgerHQ/ledger-live/commit/9bba7fd8bd9b55be569fb57367e7debc442af789) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - bugfix: cosmos delegate/unbond/redelegate tx are wrongly interpreted into claim reward tx

- Updated dependencies [[`a56ffa948d`](https://github.com/LedgerHQ/ledger-live/commit/a56ffa948defb16ea9f2968d96d4b896f9839145)]:
  - @ledgerhq/cryptoassets@7.3.0-next.0
  - @ledgerhq/hw-app-eth@6.30.5-next.0

## 27.11.0

### Minor Changes

- [#2123](https://github.com/LedgerHQ/ledger-live/pull/2123) [`9b3984fb92`](https://github.com/LedgerHQ/ledger-live/commit/9b3984fb92dd5233dda6603b855c402bdfd8c6a9) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - Adds support for getting DEX quotes.

* [#1519](https://github.com/LedgerHQ/ledger-live/pull/1519) [`f9b6ff9d5a`](https://github.com/LedgerHQ/ledger-live/commit/f9b6ff9d5a61cd052855260fe94ac48ce54d41e8) Thanks [@Blockcerts-Blockchain](https://github.com/Blockcerts-Blockchain)! - Crypto Icons - Add support for BCERT tokens icon

- [#2121](https://github.com/LedgerHQ/ledger-live/pull/2121) [`8aca07c549`](https://github.com/LedgerHQ/ledger-live/commit/8aca07c54935a66163aa89af6e88854742383bea) Thanks [@lvndry](https://github.com/lvndry)! - stakenet (xsn) now unsupported in ledger live

* [#1900](https://github.com/LedgerHQ/ledger-live/pull/1900) [`f4b14e0fcc`](https://github.com/LedgerHQ/ledger-live/commit/f4b14e0fccccfebaebb4782b75783b34e12710e4) Thanks [@Justkant](https://github.com/Justkant)! - feat(wallet-api): device.transport LLD & LLM integration [LIVE-4293]

- [#2190](https://github.com/LedgerHQ/ledger-live/pull/2190) [`7733415c32`](https://github.com/LedgerHQ/ledger-live/commit/7733415c32a5838cb4e6a4735530d507ff6ac405) Thanks [@chabroA](https://github.com/chabroA)! - Handle bitcoin.getXPpub wallet api method

* [#1900](https://github.com/LedgerHQ/ledger-live/pull/1900) [`fc444a8a17`](https://github.com/LedgerHQ/ledger-live/commit/fc444a8a172edf1a8bf8bea5c481ab33f70b7e6f) Thanks [@Justkant](https://github.com/Justkant)! - feat(wallet-api): LLM & LLD server implementation [LIVE-4394]

- [#2037](https://github.com/LedgerHQ/ledger-live/pull/2037) [`3574c62cb3`](https://github.com/LedgerHQ/ledger-live/commit/3574c62cb3fd61b29b6794b1c5b40b2836a671f7) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Add dynamicSignificantDigits parameter to formatCurrencyUnit to show more digits of value when needed. Also increased this default parameter value from 4 to 6, so more digits will be displayed throught LLM and LLD.

* [#2148](https://github.com/LedgerHQ/ledger-live/pull/2148) [`bcd7c9fd5b`](https://github.com/LedgerHQ/ledger-live/commit/bcd7c9fd5b2a1e2d1b661df6a2004fc201ae99bf) Thanks [@Justkant](https://github.com/Justkant)! - Crypto Icons - Add support for wDoge token icon

- [#1881](https://github.com/LedgerHQ/ledger-live/pull/1881) [`9a9c5d700c`](https://github.com/LedgerHQ/ledger-live/commit/9a9c5d700cb0231facd1d29df7024cd9bca5da9d) Thanks [@sarneijim](https://github.com/sarneijim)! - Link provider listed to rate requests

* [#1900](https://github.com/LedgerHQ/ledger-live/pull/1900) [`22f514abe1`](https://github.com/LedgerHQ/ledger-live/commit/22f514abe1def1c385262a4cd7519d922b633f10) Thanks [@Justkant](https://github.com/Justkant)! - Anonymise ledger live account ids before sending them through the wallet api

### Patch Changes

- [#2140](https://github.com/LedgerHQ/ledger-live/pull/2140) [`930c655cd5`](https://github.com/LedgerHQ/ledger-live/commit/930c655cd54c7bb9034ae8a81bf937a3ad6c7e6d) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added rename device DeviceAction

* [#2144](https://github.com/LedgerHQ/ledger-live/pull/2144) [`fc37600223`](https://github.com/LedgerHQ/ledger-live/commit/fc3760022341a90b51e4d836f38657ffef74040b) Thanks [@juan-cortes](https://github.com/juan-cortes)! - LLC - rename nano fts to stax

- [#2248](https://github.com/LedgerHQ/ledger-live/pull/2248) [`dc1c82be95`](https://github.com/LedgerHQ/ledger-live/commit/dc1c82be95005d0ec00aa849d69a9e77065ea128) Thanks [@Justkant](https://github.com/Justkant)! - fix(wallet-api): filter currencies families

* [#2280](https://github.com/LedgerHQ/ledger-live/pull/2280) [`a711a20ae8`](https://github.com/LedgerHQ/ledger-live/commit/a711a20ae82c84885705aab7fc6c97f373e973f2) Thanks [@github-actions](https://github.com/apps/github-actions)! - Prevents over usage of erc20.json CDN file

- [#2098](https://github.com/LedgerHQ/ledger-live/pull/2098) [`7025af53de`](https://github.com/LedgerHQ/ledger-live/commit/7025af53dec8b4ec06cbf57e93515af2bca58645) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix evm family mishandling of type 0 transactions and wrong v with specific chains

* [#2124](https://github.com/LedgerHQ/ledger-live/pull/2124) [`ae891a166e`](https://github.com/LedgerHQ/ledger-live/commit/ae891a166e5de9947781af3630b1accca42da1a6) Thanks [@Justkant](https://github.com/Justkant)! - add icon support for h3m on ledger live.

- [#2178](https://github.com/LedgerHQ/ledger-live/pull/2178) [`d4b01dc1b0`](https://github.com/LedgerHQ/ledger-live/commit/d4b01dc1b0f871726c517f9c6e0ebd84e64da2b7) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: cleaning + log in withDevice

  Setting up BLE connection priority inside BleTransport constructor
  and not in each call to withDevice

* [#2131](https://github.com/LedgerHQ/ledger-live/pull/2131) [`7f0ac99dd9`](https://github.com/LedgerHQ/ledger-live/commit/7f0ac99dd9129c2e0833300a3055b90528669485) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Add cache busting strategy for NEAR LLM staking positions, and cover staking edge case where node returns a tiny bit less than what was actually staked.

- [#2156](https://github.com/LedgerHQ/ledger-live/pull/2156) [`57e7afeff1`](https://github.com/LedgerHQ/ledger-live/commit/57e7afeff1035a89caa696449c6d62cf482fac72) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Custom images should padd 2 pixels per column to be the right size

* [#2176](https://github.com/LedgerHQ/ledger-live/pull/2176) [`3df451dafb`](https://github.com/LedgerHQ/ledger-live/commit/3df451dafb7233f5e3f897478aee22e89f6e5339) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Handled IL old firmware bug that prevented access to My Ledger

- [#2066](https://github.com/LedgerHQ/ledger-live/pull/2066) [`3a267c1424`](https://github.com/LedgerHQ/ledger-live/commit/3a267c14241ebc9184490e7eb81b5d4bcc94b092) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - New feature flag staxWelcomeScreen

* [#2149](https://github.com/LedgerHQ/ledger-live/pull/2149) [`184f2fd00d`](https://github.com/LedgerHQ/ledger-live/commit/184f2fd00d98d6ab8a6b94ac16ef7b20651a55e4) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Exposed getDefinitions on live-common

- [#2280](https://github.com/LedgerHQ/ledger-live/pull/2280) [`c469782e4b`](https://github.com/LedgerHQ/ledger-live/commit/c469782e4be0a284d4e7812a1946168e01a6a701) Thanks [@github-actions](https://github.com/apps/github-actions)! - Handle unseeded Stax error

* [#1961](https://github.com/LedgerHQ/ledger-live/pull/1961) [`1aee1b0103`](https://github.com/LedgerHQ/ledger-live/commit/1aee1b01034f0c5ea90f0ff6aa0d28fc7be0b9f9) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Bring isFirmwareUpdateVersionSupported from LLM to live-common with tests

- [#1997](https://github.com/LedgerHQ/ledger-live/pull/1997) [`5cf73f5ce6`](https://github.com/LedgerHQ/ledger-live/commit/5cf73f5ce673bc1e9552ad46bcc7f25c40a92960) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Add support for custom image storage usage in the list apps and distribution logic

* [#2205](https://github.com/LedgerHQ/ledger-live/pull/2205) [`20c5c5e109`](https://github.com/LedgerHQ/ledger-live/commit/20c5c5e1099885173aaa5ea3199052044066ac98) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Better error handling in socket.ts connections to scriptrunners

- [#2150](https://github.com/LedgerHQ/ledger-live/pull/2150) [`e7c1eaa6a2`](https://github.com/LedgerHQ/ledger-live/commit/e7c1eaa6a24d36aa535df7a06f17c55858de5475) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: handle locked device in genuine check, get latest available firmware update, and onboarding polling

* [#2012](https://github.com/LedgerHQ/ledger-live/pull/2012) [`93bd602206`](https://github.com/LedgerHQ/ledger-live/commit/93bd602206137e10e5d5c8aa61d9b5aefef993ce) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added support for Battery status APDU + CLI command and tests

- [#2052](https://github.com/LedgerHQ/ledger-live/pull/2052) [`13078a0825`](https://github.com/LedgerHQ/ledger-live/commit/13078a08256e3d74eb89dd0be4f0dda57611b68c) Thanks [@chabroA](https://github.com/chabroA)! - Refacto exchange partner config

* [#2280](https://github.com/LedgerHQ/ledger-live/pull/2280) [`9bbc36ac05`](https://github.com/LedgerHQ/ledger-live/commit/9bbc36ac05f818ff67553d33f4d1e36df93e5848) Thanks [@github-actions](https://github.com/apps/github-actions)! - bugfix: cosmos delegate/unbond/redelegate tx are wrongly interpreted into claim reward tx

- [#2143](https://github.com/LedgerHQ/ledger-live/pull/2143) [`5fe65a6829`](https://github.com/LedgerHQ/ledger-live/commit/5fe65a6829fecf27391b51ffad71f62b431dc79c) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Exported object groupedFeatures that contains features grouped by common theme.

- Updated dependencies [[`3a267c1424`](https://github.com/LedgerHQ/ledger-live/commit/3a267c14241ebc9184490e7eb81b5d4bcc94b092), [`3200794498`](https://github.com/LedgerHQ/ledger-live/commit/32007944989d1e89162a63e9862bd64066d6216b), [`3df451dafb`](https://github.com/LedgerHQ/ledger-live/commit/3df451dafb7233f5e3f897478aee22e89f6e5339), [`1f65abb76f`](https://github.com/LedgerHQ/ledger-live/commit/1f65abb76f1a36b428b5c33dd3ad6c58b4d96aa2), [`8aca07c549`](https://github.com/LedgerHQ/ledger-live/commit/8aca07c54935a66163aa89af6e88854742383bea), [`04a939310a`](https://github.com/LedgerHQ/ledger-live/commit/04a939310a52a7e0ebf0814286e6ad135c8c8cfa), [`20c5c5e109`](https://github.com/LedgerHQ/ledger-live/commit/20c5c5e1099885173aaa5ea3199052044066ac98), [`e7c1eaa6a2`](https://github.com/LedgerHQ/ledger-live/commit/e7c1eaa6a24d36aa535df7a06f17c55858de5475)]:
  - @ledgerhq/devices@7.0.7
  - @ledgerhq/cryptoassets@7.2.0
  - @ledgerhq/errors@6.12.3
  - @ledgerhq/hw-transport@6.27.10
  - @ledgerhq/hw-app-eth@6.30.4
  - @ledgerhq/hw-app-algorand@6.27.10
  - @ledgerhq/hw-app-cosmos@6.27.10
  - @ledgerhq/hw-app-near@6.27.5
  - @ledgerhq/hw-app-polkadot@6.27.10
  - @ledgerhq/hw-app-solana@7.0.4
  - @ledgerhq/hw-app-trx@6.27.10
  - @ledgerhq/hw-transport-node-speculos@6.27.10
  - @ledgerhq/hw-app-btc@9.1.2
  - @ledgerhq/hw-app-str@6.27.10
  - @ledgerhq/hw-app-tezos@6.27.10
  - @ledgerhq/hw-app-xrp@6.27.10
  - @ledgerhq/hw-transport-mocker@6.27.10

## 27.11.0-next.2

### Patch Changes

- [#2280](https://github.com/LedgerHQ/ledger-live/pull/2280) [`9bbc36ac05`](https://github.com/LedgerHQ/ledger-live/commit/9bbc36ac05f818ff67553d33f4d1e36df93e5848) Thanks [@github-actions](https://github.com/apps/github-actions)! - bugfix: cosmos delegate/unbond/redelegate tx are wrongly interpreted into claim reward tx

## 27.11.0-next.1

### Patch Changes

- [#2280](https://github.com/LedgerHQ/ledger-live/pull/2280) [`a711a20ae8`](https://github.com/LedgerHQ/ledger-live/commit/a711a20ae82c84885705aab7fc6c97f373e973f2) Thanks [@github-actions](https://github.com/apps/github-actions)! - Prevents over usage of erc20.json CDN file

## 27.11.0-next.0

### Minor Changes

- [#2123](https://github.com/LedgerHQ/ledger-live/pull/2123) [`9b3984fb92`](https://github.com/LedgerHQ/ledger-live/commit/9b3984fb92dd5233dda6603b855c402bdfd8c6a9) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - Adds support for getting DEX quotes.

* [#1519](https://github.com/LedgerHQ/ledger-live/pull/1519) [`f9b6ff9d5a`](https://github.com/LedgerHQ/ledger-live/commit/f9b6ff9d5a61cd052855260fe94ac48ce54d41e8) Thanks [@Blockcerts-Blockchain](https://github.com/Blockcerts-Blockchain)! - Crypto Icons - Add support for BCERT tokens icon

- [#2121](https://github.com/LedgerHQ/ledger-live/pull/2121) [`8aca07c549`](https://github.com/LedgerHQ/ledger-live/commit/8aca07c54935a66163aa89af6e88854742383bea) Thanks [@lvndry](https://github.com/lvndry)! - stakenet (xsn) now unsupported in ledger live

* [#1900](https://github.com/LedgerHQ/ledger-live/pull/1900) [`f4b14e0fcc`](https://github.com/LedgerHQ/ledger-live/commit/f4b14e0fccccfebaebb4782b75783b34e12710e4) Thanks [@Justkant](https://github.com/Justkant)! - feat(wallet-api): device.transport LLD & LLM integration [LIVE-4293]

- [#2190](https://github.com/LedgerHQ/ledger-live/pull/2190) [`7733415c32`](https://github.com/LedgerHQ/ledger-live/commit/7733415c32a5838cb4e6a4735530d507ff6ac405) Thanks [@chabroA](https://github.com/chabroA)! - Handle bitcoin.getXPpub wallet api method

* [#1900](https://github.com/LedgerHQ/ledger-live/pull/1900) [`fc444a8a17`](https://github.com/LedgerHQ/ledger-live/commit/fc444a8a172edf1a8bf8bea5c481ab33f70b7e6f) Thanks [@Justkant](https://github.com/Justkant)! - feat(wallet-api): LLM & LLD server implementation [LIVE-4394]

- [#2037](https://github.com/LedgerHQ/ledger-live/pull/2037) [`3574c62cb3`](https://github.com/LedgerHQ/ledger-live/commit/3574c62cb3fd61b29b6794b1c5b40b2836a671f7) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Add dynamicSignificantDigits parameter to formatCurrencyUnit to show more digits of value when needed. Also increased this default parameter value from 4 to 6, so more digits will be displayed throught LLM and LLD.

* [#2148](https://github.com/LedgerHQ/ledger-live/pull/2148) [`bcd7c9fd5b`](https://github.com/LedgerHQ/ledger-live/commit/bcd7c9fd5b2a1e2d1b661df6a2004fc201ae99bf) Thanks [@Justkant](https://github.com/Justkant)! - Crypto Icons - Add support for wDoge token icon

- [#1881](https://github.com/LedgerHQ/ledger-live/pull/1881) [`9a9c5d700c`](https://github.com/LedgerHQ/ledger-live/commit/9a9c5d700cb0231facd1d29df7024cd9bca5da9d) Thanks [@sarneijim](https://github.com/sarneijim)! - Link provider listed to rate requests

* [#1900](https://github.com/LedgerHQ/ledger-live/pull/1900) [`22f514abe1`](https://github.com/LedgerHQ/ledger-live/commit/22f514abe1def1c385262a4cd7519d922b633f10) Thanks [@Justkant](https://github.com/Justkant)! - Anonymise ledger live account ids before sending them through the wallet api

### Patch Changes

- [#2140](https://github.com/LedgerHQ/ledger-live/pull/2140) [`930c655cd5`](https://github.com/LedgerHQ/ledger-live/commit/930c655cd54c7bb9034ae8a81bf937a3ad6c7e6d) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added rename device DeviceAction

* [#2144](https://github.com/LedgerHQ/ledger-live/pull/2144) [`fc37600223`](https://github.com/LedgerHQ/ledger-live/commit/fc3760022341a90b51e4d836f38657ffef74040b) Thanks [@juan-cortes](https://github.com/juan-cortes)! - LLC - rename nano fts to stax

- [#2248](https://github.com/LedgerHQ/ledger-live/pull/2248) [`dc1c82be95`](https://github.com/LedgerHQ/ledger-live/commit/dc1c82be95005d0ec00aa849d69a9e77065ea128) Thanks [@Justkant](https://github.com/Justkant)! - fix(wallet-api): filter currencies families

* [#2098](https://github.com/LedgerHQ/ledger-live/pull/2098) [`7025af53de`](https://github.com/LedgerHQ/ledger-live/commit/7025af53dec8b4ec06cbf57e93515af2bca58645) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix evm family mishandling of type 0 transactions and wrong v with specific chains

- [#2124](https://github.com/LedgerHQ/ledger-live/pull/2124) [`ae891a166e`](https://github.com/LedgerHQ/ledger-live/commit/ae891a166e5de9947781af3630b1accca42da1a6) Thanks [@Justkant](https://github.com/Justkant)! - add icon support for h3m on ledger live.

* [#2178](https://github.com/LedgerHQ/ledger-live/pull/2178) [`d4b01dc1b0`](https://github.com/LedgerHQ/ledger-live/commit/d4b01dc1b0f871726c517f9c6e0ebd84e64da2b7) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: cleaning + log in withDevice

  Setting up BLE connection priority inside BleTransport constructor
  and not in each call to withDevice

- [#2131](https://github.com/LedgerHQ/ledger-live/pull/2131) [`7f0ac99dd9`](https://github.com/LedgerHQ/ledger-live/commit/7f0ac99dd9129c2e0833300a3055b90528669485) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Add cache busting strategy for NEAR LLM staking positions, and cover staking edge case where node returns a tiny bit less than what was actually staked.

* [#2156](https://github.com/LedgerHQ/ledger-live/pull/2156) [`57e7afeff1`](https://github.com/LedgerHQ/ledger-live/commit/57e7afeff1035a89caa696449c6d62cf482fac72) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Custom images should padd 2 pixels per column to be the right size

- [#2176](https://github.com/LedgerHQ/ledger-live/pull/2176) [`3df451dafb`](https://github.com/LedgerHQ/ledger-live/commit/3df451dafb7233f5e3f897478aee22e89f6e5339) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Handled IL old firmware bug that prevented access to My Ledger

* [#2066](https://github.com/LedgerHQ/ledger-live/pull/2066) [`3a267c1424`](https://github.com/LedgerHQ/ledger-live/commit/3a267c14241ebc9184490e7eb81b5d4bcc94b092) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - New feature flag staxWelcomeScreen

- [#2149](https://github.com/LedgerHQ/ledger-live/pull/2149) [`184f2fd00d`](https://github.com/LedgerHQ/ledger-live/commit/184f2fd00d98d6ab8a6b94ac16ef7b20651a55e4) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Exposed getDefinitions on live-common

* [#2280](https://github.com/LedgerHQ/ledger-live/pull/2280) [`c469782e4b`](https://github.com/LedgerHQ/ledger-live/commit/c469782e4be0a284d4e7812a1946168e01a6a701) Thanks [@github-actions](https://github.com/apps/github-actions)! - Handle unseeded Stax error

- [#1961](https://github.com/LedgerHQ/ledger-live/pull/1961) [`1aee1b0103`](https://github.com/LedgerHQ/ledger-live/commit/1aee1b01034f0c5ea90f0ff6aa0d28fc7be0b9f9) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Bring isFirmwareUpdateVersionSupported from LLM to live-common with tests

* [#1997](https://github.com/LedgerHQ/ledger-live/pull/1997) [`5cf73f5ce6`](https://github.com/LedgerHQ/ledger-live/commit/5cf73f5ce673bc1e9552ad46bcc7f25c40a92960) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Add support for custom image storage usage in the list apps and distribution logic

- [#2205](https://github.com/LedgerHQ/ledger-live/pull/2205) [`20c5c5e109`](https://github.com/LedgerHQ/ledger-live/commit/20c5c5e1099885173aaa5ea3199052044066ac98) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Better error handling in socket.ts connections to scriptrunners

* [#2150](https://github.com/LedgerHQ/ledger-live/pull/2150) [`e7c1eaa6a2`](https://github.com/LedgerHQ/ledger-live/commit/e7c1eaa6a24d36aa535df7a06f17c55858de5475) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: handle locked device in genuine check, get latest available firmware update, and onboarding polling

- [#2012](https://github.com/LedgerHQ/ledger-live/pull/2012) [`93bd602206`](https://github.com/LedgerHQ/ledger-live/commit/93bd602206137e10e5d5c8aa61d9b5aefef993ce) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added support for Battery status APDU + CLI command and tests

* [#2052](https://github.com/LedgerHQ/ledger-live/pull/2052) [`13078a0825`](https://github.com/LedgerHQ/ledger-live/commit/13078a08256e3d74eb89dd0be4f0dda57611b68c) Thanks [@chabroA](https://github.com/chabroA)! - Refacto exchange partner config

- [#2143](https://github.com/LedgerHQ/ledger-live/pull/2143) [`5fe65a6829`](https://github.com/LedgerHQ/ledger-live/commit/5fe65a6829fecf27391b51ffad71f62b431dc79c) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Exported object groupedFeatures that contains features grouped by common theme.

- Updated dependencies [[`3a267c1424`](https://github.com/LedgerHQ/ledger-live/commit/3a267c14241ebc9184490e7eb81b5d4bcc94b092), [`3200794498`](https://github.com/LedgerHQ/ledger-live/commit/32007944989d1e89162a63e9862bd64066d6216b), [`3df451dafb`](https://github.com/LedgerHQ/ledger-live/commit/3df451dafb7233f5e3f897478aee22e89f6e5339), [`1f65abb76f`](https://github.com/LedgerHQ/ledger-live/commit/1f65abb76f1a36b428b5c33dd3ad6c58b4d96aa2), [`8aca07c549`](https://github.com/LedgerHQ/ledger-live/commit/8aca07c54935a66163aa89af6e88854742383bea), [`04a939310a`](https://github.com/LedgerHQ/ledger-live/commit/04a939310a52a7e0ebf0814286e6ad135c8c8cfa), [`20c5c5e109`](https://github.com/LedgerHQ/ledger-live/commit/20c5c5e1099885173aaa5ea3199052044066ac98), [`e7c1eaa6a2`](https://github.com/LedgerHQ/ledger-live/commit/e7c1eaa6a24d36aa535df7a06f17c55858de5475)]:
  - @ledgerhq/devices@7.0.7-next.0
  - @ledgerhq/cryptoassets@7.2.0-next.0
  - @ledgerhq/errors@6.12.3-next.0
  - @ledgerhq/hw-transport@6.27.10-next.0
  - @ledgerhq/hw-app-eth@6.30.4-next.0
  - @ledgerhq/hw-app-algorand@6.27.10-next.0
  - @ledgerhq/hw-app-cosmos@6.27.10-next.0
  - @ledgerhq/hw-app-near@6.27.5-next.0
  - @ledgerhq/hw-app-polkadot@6.27.10-next.0
  - @ledgerhq/hw-app-solana@7.0.4-next.0
  - @ledgerhq/hw-app-trx@6.27.10-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.10-next.0
  - @ledgerhq/hw-app-btc@9.1.2-next.0
  - @ledgerhq/hw-app-str@6.27.10-next.0
  - @ledgerhq/hw-app-tezos@6.27.10-next.0
  - @ledgerhq/hw-app-xrp@6.27.10-next.0
  - @ledgerhq/hw-transport-mocker@6.27.10-next.0

## 27.10.0

### Minor Changes

- [#1805](https://github.com/LedgerHQ/ledger-live/pull/1805) [`d99aafd1d4`](https://github.com/LedgerHQ/ledger-live/commit/d99aafd1d48336f6b4da3c1d8e7c52dbc1676278) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - NEAR sync, send and stake

* [#2030](https://github.com/LedgerHQ/ledger-live/pull/2030) [`ee507188f0`](https://github.com/LedgerHQ/ledger-live/commit/ee507188f097429237bef6df0f63b5f6426dd91a) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - update fund partners

### Patch Changes

- [#1984](https://github.com/LedgerHQ/ledger-live/pull/1984) [`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: resilient BLE scanning

* [#2045](https://github.com/LedgerHQ/ledger-live/pull/2045) [`93e19275f3`](https://github.com/LedgerHQ/ledger-live/commit/93e19275f3336672579d2e3bab317489d47853c5) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Made the exported logs on LLM larger and configurable via ENV vars.

- [#2058](https://github.com/LedgerHQ/ledger-live/pull/2058) [`aee5dd361f`](https://github.com/LedgerHQ/ledger-live/commit/aee5dd361fae6aacb8b7320107417185c90f9b8b) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Protection against syncing or adding the burn address for stellar

* [#1984](https://github.com/LedgerHQ/ledger-live/pull/1984) [`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5) Thanks [@alexandremgo](https://github.com/alexandremgo)! - New HwTransportError for all the implementations of Transport

* Updated dependencies [[`d99aafd1d4`](https://github.com/LedgerHQ/ledger-live/commit/d99aafd1d48336f6b4da3c1d8e7c52dbc1676278), [`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5)]:
  - @ledgerhq/cryptoassets@7.1.0
  - @ledgerhq/errors@6.12.2
  - @ledgerhq/hw-transport@6.27.9
  - @ledgerhq/hw-app-eth@6.30.3
  - @ledgerhq/devices@7.0.6
  - @ledgerhq/hw-app-algorand@6.27.9
  - @ledgerhq/hw-app-cosmos@6.27.9
  - @ledgerhq/hw-app-near@6.27.4
  - @ledgerhq/hw-app-polkadot@6.27.9
  - @ledgerhq/hw-app-solana@7.0.3
  - @ledgerhq/hw-app-trx@6.27.9
  - @ledgerhq/hw-transport-node-speculos@6.27.9
  - @ledgerhq/hw-app-btc@9.1.1
  - @ledgerhq/hw-app-str@6.27.9
  - @ledgerhq/hw-app-tezos@6.27.9
  - @ledgerhq/hw-app-xrp@6.27.9
  - @ledgerhq/hw-transport-mocker@6.27.9

## 27.10.0-next.0

### Minor Changes

- [#1805](https://github.com/LedgerHQ/ledger-live/pull/1805) [`d99aafd1d4`](https://github.com/LedgerHQ/ledger-live/commit/d99aafd1d48336f6b4da3c1d8e7c52dbc1676278) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - NEAR sync, send and stake

* [#2030](https://github.com/LedgerHQ/ledger-live/pull/2030) [`ee507188f0`](https://github.com/LedgerHQ/ledger-live/commit/ee507188f097429237bef6df0f63b5f6426dd91a) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - update fund partners

### Patch Changes

- [#1984](https://github.com/LedgerHQ/ledger-live/pull/1984) [`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: resilient BLE scanning

* [#2045](https://github.com/LedgerHQ/ledger-live/pull/2045) [`93e19275f3`](https://github.com/LedgerHQ/ledger-live/commit/93e19275f3336672579d2e3bab317489d47853c5) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Made the exported logs on LLM larger and configurable via ENV vars.

- [#2058](https://github.com/LedgerHQ/ledger-live/pull/2058) [`aee5dd361f`](https://github.com/LedgerHQ/ledger-live/commit/aee5dd361fae6aacb8b7320107417185c90f9b8b) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Protection against syncing or adding the burn address for stellar

* [#1984](https://github.com/LedgerHQ/ledger-live/pull/1984) [`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5) Thanks [@alexandremgo](https://github.com/alexandremgo)! - New HwTransportError for all the implementations of Transport

* Updated dependencies [[`d99aafd1d4`](https://github.com/LedgerHQ/ledger-live/commit/d99aafd1d48336f6b4da3c1d8e7c52dbc1676278), [`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5)]:
  - @ledgerhq/cryptoassets@7.1.0-next.0
  - @ledgerhq/errors@6.12.2-next.0
  - @ledgerhq/hw-transport@6.27.9-next.0
  - @ledgerhq/hw-app-eth@6.30.3-next.0
  - @ledgerhq/devices@7.0.6-next.0
  - @ledgerhq/hw-app-algorand@6.27.9-next.0
  - @ledgerhq/hw-app-cosmos@6.27.9-next.0
  - @ledgerhq/hw-app-near@6.27.4-next.0
  - @ledgerhq/hw-app-polkadot@6.27.9-next.0
  - @ledgerhq/hw-app-solana@7.0.3-next.0
  - @ledgerhq/hw-app-trx@6.27.9-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.9-next.0
  - @ledgerhq/hw-app-btc@9.1.1-next.0
  - @ledgerhq/hw-app-str@6.27.9-next.0
  - @ledgerhq/hw-app-tezos@6.27.9-next.0
  - @ledgerhq/hw-app-xrp@6.27.9-next.0
  - @ledgerhq/hw-transport-mocker@6.27.9-next.0

## 27.9.0

### Minor Changes

- [#1874](https://github.com/LedgerHQ/ledger-live/pull/1874) [`eef8038f61`](https://github.com/LedgerHQ/ledger-live/commit/eef8038f611820efffd3b4834e124be0c29acd39) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Help to filter Solana network error

* [#1918](https://github.com/LedgerHQ/ledger-live/pull/1918) [`a00544e8de`](https://github.com/LedgerHQ/ledger-live/commit/a00544e8de135285609e9aabc2d4ca354f8ebc2a) Thanks [@chabroA](https://github.com/chabroA)! - Add ERC-20 funding

- [#1959](https://github.com/LedgerHQ/ledger-live/pull/1959) [`2aa8cc9c33`](https://github.com/LedgerHQ/ledger-live/commit/2aa8cc9c339ce8c9677b24e70218cc45847d799b) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Change hw-app-btc to remove any dependency to the legacy Bitcoin Nano app API. Update hw-app-btc API (refer to hw-app-btc/src/Btc.ts for new method signature)

### Patch Changes

- [#1871](https://github.com/LedgerHQ/ledger-live/pull/1871) [`ff5cb2cb11`](https://github.com/LedgerHQ/ledger-live/commit/ff5cb2cb11a2dcac0f2a65bf3ae4efac512cfe71) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Allow runner errors to bubble up and not be silenced

* [#1899](https://github.com/LedgerHQ/ledger-live/pull/1899) [`f29d3d9384`](https://github.com/LedgerHQ/ledger-live/commit/f29d3d9384f57c99c228749673d4f5d840b4bf06) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLC - Errors - add custom error

- [`720dc1f58a`](https://github.com/LedgerHQ/ledger-live/commit/720dc1f58a6cea9c8a933139ff94a1d9f1b98129) Thanks [@Justkant](https://github.com/Justkant)! - Fix: improvement on BLE scanning and polling mechanism

- Updated dependencies [[`9100363270`](https://github.com/LedgerHQ/ledger-live/commit/91003632704d11fc327517a582ac6d7009c05bd3), [`82676099c5`](https://github.com/LedgerHQ/ledger-live/commit/82676099c5d99bbe877b92281d29fde040a0285a), [`82676099c5`](https://github.com/LedgerHQ/ledger-live/commit/82676099c5d99bbe877b92281d29fde040a0285a), [`82676099c5`](https://github.com/LedgerHQ/ledger-live/commit/82676099c5d99bbe877b92281d29fde040a0285a), [`2aa8cc9c33`](https://github.com/LedgerHQ/ledger-live/commit/2aa8cc9c339ce8c9677b24e70218cc45847d799b)]:
  - @ledgerhq/cryptoassets@7.0.0
  - @ledgerhq/hw-app-btc@9.1.0
  - @ledgerhq/hw-app-eth@6.30.2

## 27.9.0-next.0

### Minor Changes

- [#1874](https://github.com/LedgerHQ/ledger-live/pull/1874) [`eef8038f61`](https://github.com/LedgerHQ/ledger-live/commit/eef8038f611820efffd3b4834e124be0c29acd39) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Help to filter Solana network error

* [#1918](https://github.com/LedgerHQ/ledger-live/pull/1918) [`a00544e8de`](https://github.com/LedgerHQ/ledger-live/commit/a00544e8de135285609e9aabc2d4ca354f8ebc2a) Thanks [@chabroA](https://github.com/chabroA)! - Add ERC-20 funding

- [#1959](https://github.com/LedgerHQ/ledger-live/pull/1959) [`2aa8cc9c33`](https://github.com/LedgerHQ/ledger-live/commit/2aa8cc9c339ce8c9677b24e70218cc45847d799b) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Change hw-app-btc to remove any dependency to the legacy Bitcoin Nano app API. Update hw-app-btc API (refer to hw-app-btc/src/Btc.ts for new method signature)

### Patch Changes

- [#1871](https://github.com/LedgerHQ/ledger-live/pull/1871) [`ff5cb2cb11`](https://github.com/LedgerHQ/ledger-live/commit/ff5cb2cb11a2dcac0f2a65bf3ae4efac512cfe71) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Allow runner errors to bubble up and not be silenced

* [#1899](https://github.com/LedgerHQ/ledger-live/pull/1899) [`f29d3d9384`](https://github.com/LedgerHQ/ledger-live/commit/f29d3d9384f57c99c228749673d4f5d840b4bf06) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLC - Errors - add custom error

- [`720dc1f58a`](https://github.com/LedgerHQ/ledger-live/commit/720dc1f58a6cea9c8a933139ff94a1d9f1b98129) Thanks [@Justkant](https://github.com/Justkant)! - Fix: improvement on BLE scanning and polling mechanism

- Updated dependencies [[`9100363270`](https://github.com/LedgerHQ/ledger-live/commit/91003632704d11fc327517a582ac6d7009c05bd3), [`82676099c5`](https://github.com/LedgerHQ/ledger-live/commit/82676099c5d99bbe877b92281d29fde040a0285a), [`82676099c5`](https://github.com/LedgerHQ/ledger-live/commit/82676099c5d99bbe877b92281d29fde040a0285a), [`82676099c5`](https://github.com/LedgerHQ/ledger-live/commit/82676099c5d99bbe877b92281d29fde040a0285a), [`2aa8cc9c33`](https://github.com/LedgerHQ/ledger-live/commit/2aa8cc9c339ce8c9677b24e70218cc45847d799b)]:
  - @ledgerhq/cryptoassets@7.0.0-next.0
  - @ledgerhq/hw-app-btc@9.1.0-next.0
  - @ledgerhq/hw-app-eth@6.30.2-next.0

## 27.8.1

### Patch Changes

- [#2099](https://github.com/LedgerHQ/ledger-live/pull/2099) [`6a07e7bc3c`](https://github.com/LedgerHQ/ledger-live/commit/6a07e7bc3c47672e658218e06160fa121f0166ef) Thanks [@github-actions](https://github.com/apps/github-actions)! - Change tron trc20 fees limit when no energy

## 27.8.1-hotfix.0

### Patch Changes

- [#2099](https://github.com/LedgerHQ/ledger-live/pull/2099) [`6a07e7bc3c`](https://github.com/LedgerHQ/ledger-live/commit/6a07e7bc3c47672e658218e06160fa121f0166ef) Thanks [@github-actions](https://github.com/apps/github-actions)! - Change tron trc20 fees limit when no energy

## 27.8.0

### Minor Changes

- [#1775](https://github.com/LedgerHQ/ledger-live/pull/1775) [`d10c727430`](https://github.com/LedgerHQ/ledger-live/commit/d10c727430ffece743bbb7e703aaff61f97dacc1) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Add new NFT helpers used for the NFT Gallery (orderByLastReceived, groupByCurrency, getNFTByTokenId), add mock NFT account

* [#1817](https://github.com/LedgerHQ/ledger-live/pull/1817) [`57b82ad735`](https://github.com/LedgerHQ/ledger-live/commit/57b82ad7350c6368b2d6a731d7b1c52b759516b0) Thanks [@sarneijim](https://github.com/sarneijim)! - CIC swap integration

- [#1798](https://github.com/LedgerHQ/ledger-live/pull/1798) [`e43939cfd5`](https://github.com/LedgerHQ/ledger-live/commit/e43939cfd5e3df8888cfe1f0ba95140acd061eea) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - change polkadot's api call to anticipate new version

* [#1908](https://github.com/LedgerHQ/ledger-live/pull/1908) [`f22d46a006`](https://github.com/LedgerHQ/ledger-live/commit/f22d46a006adc630ccb087808c2290e3ef65cea3) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - add solana dust to staking to prevent user to be unable to do anything

### Patch Changes

- [#1741](https://github.com/LedgerHQ/ledger-live/pull/1741) [`77056e3692`](https://github.com/LedgerHQ/ledger-live/commit/77056e369256112188c183823a2c3fabfea2cba8) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix for locked device error

* [#1835](https://github.com/LedgerHQ/ledger-live/pull/1835) [`70f00ec916`](https://github.com/LedgerHQ/ledger-live/commit/70f00ec91629c917be13c6937e14ebc7201b231f) Thanks [@LFBarreto](https://github.com/LFBarreto)! - fix crypto icons viewport issues

- [#1779](https://github.com/LedgerHQ/ledger-live/pull/1779) [`856f49374e`](https://github.com/LedgerHQ/ledger-live/commit/856f49374ec9b49f005676e270acdb81b78879c8) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Adapted the fetchImage command and added new device action

* [#1957](https://github.com/LedgerHQ/ledger-live/pull/1957) [`3119c17ec3`](https://github.com/LedgerHQ/ledger-live/commit/3119c17ec3966f7dc1780734c016878bab9db722) Thanks [@github-actions](https://github.com/apps/github-actions)! - Fix: improvement on BLE scanning and polling mechanism

* Updated dependencies [[`856f49374e`](https://github.com/LedgerHQ/ledger-live/commit/856f49374ec9b49f005676e270acdb81b78879c8), [`77056e3692`](https://github.com/LedgerHQ/ledger-live/commit/77056e369256112188c183823a2c3fabfea2cba8)]:
  - @ledgerhq/errors@6.12.1
  - @ledgerhq/devices@7.0.5
  - @ledgerhq/hw-app-algorand@6.27.8
  - @ledgerhq/hw-app-cosmos@6.27.8
  - @ledgerhq/hw-app-eth@6.30.1
  - @ledgerhq/hw-app-polkadot@6.27.8
  - @ledgerhq/hw-app-solana@7.0.2
  - @ledgerhq/hw-app-trx@6.27.8
  - @ledgerhq/hw-transport@6.27.8
  - @ledgerhq/hw-transport-node-speculos@6.27.8
  - @ledgerhq/hw-app-btc@9.0.1
  - @ledgerhq/hw-app-str@6.27.8
  - @ledgerhq/hw-app-tezos@6.27.8
  - @ledgerhq/hw-app-xrp@6.27.8
  - @ledgerhq/hw-transport-mocker@6.27.8

## 27.8.0-next.0

### Minor Changes

- [#1775](https://github.com/LedgerHQ/ledger-live/pull/1775) [`d10c727430`](https://github.com/LedgerHQ/ledger-live/commit/d10c727430ffece743bbb7e703aaff61f97dacc1) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Add new NFT helpers used for the NFT Gallery (orderByLastReceived, groupByCurrency, getNFTByTokenId), add mock NFT account

* [#1817](https://github.com/LedgerHQ/ledger-live/pull/1817) [`57b82ad735`](https://github.com/LedgerHQ/ledger-live/commit/57b82ad7350c6368b2d6a731d7b1c52b759516b0) Thanks [@sarneijim](https://github.com/sarneijim)! - CIC swap integration

- [#1798](https://github.com/LedgerHQ/ledger-live/pull/1798) [`e43939cfd5`](https://github.com/LedgerHQ/ledger-live/commit/e43939cfd5e3df8888cfe1f0ba95140acd061eea) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - change polkadot's api call to anticipate new version

* [#1908](https://github.com/LedgerHQ/ledger-live/pull/1908) [`f22d46a006`](https://github.com/LedgerHQ/ledger-live/commit/f22d46a006adc630ccb087808c2290e3ef65cea3) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - add solana dust to staking to prevent user to be unable to do anything

### Patch Changes

- [#1741](https://github.com/LedgerHQ/ledger-live/pull/1741) [`77056e3692`](https://github.com/LedgerHQ/ledger-live/commit/77056e369256112188c183823a2c3fabfea2cba8) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix for locked device error

* [#1835](https://github.com/LedgerHQ/ledger-live/pull/1835) [`70f00ec916`](https://github.com/LedgerHQ/ledger-live/commit/70f00ec91629c917be13c6937e14ebc7201b231f) Thanks [@LFBarreto](https://github.com/LFBarreto)! - fix crypto icons viewport issues

- [#1779](https://github.com/LedgerHQ/ledger-live/pull/1779) [`856f49374e`](https://github.com/LedgerHQ/ledger-live/commit/856f49374ec9b49f005676e270acdb81b78879c8) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Adapted the fetchImage command and added new device action

* [#1957](https://github.com/LedgerHQ/ledger-live/pull/1957) [`3119c17ec3`](https://github.com/LedgerHQ/ledger-live/commit/3119c17ec3966f7dc1780734c016878bab9db722) Thanks [@github-actions](https://github.com/apps/github-actions)! - Fix: improvement on BLE scanning and polling mechanism

* Updated dependencies [[`856f49374e`](https://github.com/LedgerHQ/ledger-live/commit/856f49374ec9b49f005676e270acdb81b78879c8), [`77056e3692`](https://github.com/LedgerHQ/ledger-live/commit/77056e369256112188c183823a2c3fabfea2cba8)]:
  - @ledgerhq/errors@6.12.1-next.0
  - @ledgerhq/devices@7.0.5-next.0
  - @ledgerhq/hw-app-algorand@6.27.8-next.0
  - @ledgerhq/hw-app-cosmos@6.27.8-next.0
  - @ledgerhq/hw-app-eth@6.30.1-next.0
  - @ledgerhq/hw-app-polkadot@6.27.8-next.0
  - @ledgerhq/hw-app-solana@7.0.2-next.0
  - @ledgerhq/hw-app-trx@6.27.8-next.0
  - @ledgerhq/hw-transport@6.27.8-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.8-next.0
  - @ledgerhq/hw-app-btc@9.0.1-next.0
  - @ledgerhq/hw-app-str@6.27.8-next.0
  - @ledgerhq/hw-app-tezos@6.27.8-next.0
  - @ledgerhq/hw-app-xrp@6.27.8-next.0
  - @ledgerhq/hw-transport-mocker@6.27.8-next.0

## 27.7.2

### Patch Changes

- [#1944](https://github.com/LedgerHQ/ledger-live/pull/1944) [`bdf55e0411`](https://github.com/LedgerHQ/ledger-live/commit/bdf55e0411d46c0bf68d42b7f96b75d49ba81a67) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fixing ethereum prepareTransaction breaking before the getTransactionStatus and fixing send max on account with only dust

## 27.7.2-hotfix.0

### Patch Changes

- [#1944](https://github.com/LedgerHQ/ledger-live/pull/1944) [`bdf55e0411`](https://github.com/LedgerHQ/ledger-live/commit/bdf55e0411d46c0bf68d42b7f96b75d49ba81a67) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fixing ethereum prepareTransaction breaking before the getTransactionStatus and fixing send max on account with only dust

## 27.7.1

### Patch Changes

- [#1913](https://github.com/LedgerHQ/ledger-live/pull/1913) [`f7aa25417a`](https://github.com/LedgerHQ/ledger-live/commit/f7aa25417a953a6e4768e0b5d500cab566369a0a) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Prevent error on ERC1155 quantities being array of null

* [#1931](https://github.com/LedgerHQ/ledger-live/pull/1931) [`e3a796b0a0`](https://github.com/LedgerHQ/ledger-live/commit/e3a796b0a021b19ff01061a019657cea26cc46de) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix Ethereum send max transactions using the wrong fee per gas method with EIP1559

## 27.7.1-hotfix.1

### Patch Changes

- [#1931](https://github.com/LedgerHQ/ledger-live/pull/1931) [`e3a796b0a0`](https://github.com/LedgerHQ/ledger-live/commit/e3a796b0a021b19ff01061a019657cea26cc46de) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix Ethereum send max transactions using the wrong fee per gas method with EIP1559

## 27.7.1-hotfix.0

### Patch Changes

- [#1913](https://github.com/LedgerHQ/ledger-live/pull/1913) [`f7aa25417a`](https://github.com/LedgerHQ/ledger-live/commit/f7aa25417a953a6e4768e0b5d500cab566369a0a) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Prevent error on ERC1155 quantities being array of null

## 27.7.0

### Minor Changes

- [#1211](https://github.com/LedgerHQ/ledger-live/pull/1211) [`32c8df8f47`](https://github.com/LedgerHQ/ledger-live/commit/32c8df8f47644278ee44e9db623af864d57ad61c) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add dynamic CAL support for EIP712

* [#1629](https://github.com/LedgerHQ/ledger-live/pull/1629) [`4aa4d42cb1`](https://github.com/LedgerHQ/ledger-live/commit/4aa4d42cb103612c130b01f36100eb6fdd87e8b1) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - add youhodler as fund provider

- [#1757](https://github.com/LedgerHQ/ledger-live/pull/1757) [`aec68cca70`](https://github.com/LedgerHQ/ledger-live/commit/aec68cca70194f7890a09dca62a737046af13305) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - disable nft on ios with feature flag

* [#1628](https://github.com/LedgerHQ/ledger-live/pull/1628) [`57699a19fa`](https://github.com/LedgerHQ/ledger-live/commit/57699a19fa545ba359e457deb7ba0632b15342b5) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - add plugins

- [#1211](https://github.com/LedgerHQ/ledger-live/pull/1211) [`32c8df8f47`](https://github.com/LedgerHQ/ledger-live/commit/32c8df8f47644278ee44e9db623af864d57ad61c) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Remove EIP712 message signing from env and set as definitve feature + update tests accordingly

* [#1662](https://github.com/LedgerHQ/ledger-live/pull/1662) [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6) Thanks [@lambertkevin](https://github.com/lambertkevin)! - EIP1559 support for Ethereum transactions

- [#1811](https://github.com/LedgerHQ/ledger-live/pull/1811) [`f521bf7ef1`](https://github.com/LedgerHQ/ledger-live/commit/f521bf7ef1afa3afe1a03cbf65bd36ebee6d0768) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - change polkadot's api call to anticipate new version

### Patch Changes

- [#1861](https://github.com/LedgerHQ/ledger-live/pull/1861) [`9f8c9be0ae`](https://github.com/LedgerHQ/ledger-live/commit/9f8c9be0aead9eb4101aa9d14e4ee3b560d88792) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Revert "[LIVE-4088] Remove incompatible API from ledger-live with new bitcoin app (#1493)"

* [#1758](https://github.com/LedgerHQ/ledger-live/pull/1758) [`3f516ea41e`](https://github.com/LedgerHQ/ledger-live/commit/3f516ea41e6e1a485be452872c91bd4a315eb167) Thanks [@LFBarreto](https://github.com/LFBarreto)! - bugfix - MarketDataProvider - undefined chartData in specific cases

- [#1853](https://github.com/LedgerHQ/ledger-live/pull/1853) [`2660f2993c`](https://github.com/LedgerHQ/ledger-live/commit/2660f2993cc815f10a8e8ffea18fb761d869fc36) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix gas limit estimation for token transactions in the Ethereum family

* [#1651](https://github.com/LedgerHQ/ledger-live/pull/1651) [`f7b27a97f6`](https://github.com/LedgerHQ/ledger-live/commit/f7b27a97f6cd2b2c553cbe83d008e4ce907c9ad2) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix hardware version checking logic in getVersion command

- [#1731](https://github.com/LedgerHQ/ledger-live/pull/1731) [`ddeace7163`](https://github.com/LedgerHQ/ledger-live/commit/ddeace7163f0c9186f4f48cc4baa2b9273c5ebf3) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Filter the post onboarding actions using Feature Flags

* [#1622](https://github.com/LedgerHQ/ledger-live/pull/1622) [`df8cbb8dd1`](https://github.com/LedgerHQ/ledger-live/commit/df8cbb8dd166a66325eb96d8192f3f985b71df60) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix bootloader repairing steps

- [#1352](https://github.com/LedgerHQ/ledger-live/pull/1352) [`0d7e0f713a`](https://github.com/LedgerHQ/ledger-live/commit/0d7e0f713ab4fbb3d4bd7df147a96c7de73123b7) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Moved custom image errors from ledger-live-mobile to live-common

* [#1685](https://github.com/LedgerHQ/ledger-live/pull/1685) [`e89044242d`](https://github.com/LedgerHQ/ledger-live/commit/e89044242d005bfc3349abbbf1921e9056686d0b) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Handle 0x5515 response for allow manager and connect app device actions on LLM

- [#1141](https://github.com/LedgerHQ/ledger-live/pull/1141) [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd) Thanks [@valpinkman](https://github.com/valpinkman)! - Collateral changes due to solving all LLM typescript/eslint issues/warnings.

* [#1783](https://github.com/LedgerHQ/ledger-live/pull/1783) [`90a9fbb75b`](https://github.com/LedgerHQ/ledger-live/commit/90a9fbb75b3b3960655d601a6c7c987689ef19be) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Enforce nano app version 1.10.1 to prevent latency issues with EIP-712 signature

* Updated dependencies [[`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6), [`32c8df8f47`](https://github.com/LedgerHQ/ledger-live/commit/32c8df8f47644278ee44e9db623af864d57ad61c), [`0308e8c6ae`](https://github.com/LedgerHQ/ledger-live/commit/0308e8c6ae721a99bc50f5dc60db0d11ea8ea1ff), [`8bf7626bbe`](https://github.com/LedgerHQ/ledger-live/commit/8bf7626bbeb4f766868ab37b7fc943bb7e84e2ca), [`f5f4db47d2`](https://github.com/LedgerHQ/ledger-live/commit/f5f4db47d214bc30390b7be91d3bab4814c5fb45), [`32c8df8f47`](https://github.com/LedgerHQ/ledger-live/commit/32c8df8f47644278ee44e9db623af864d57ad61c), [`d3c91a53e0`](https://github.com/LedgerHQ/ledger-live/commit/d3c91a53e06f9f47817e96c452f69e2d9f71d80f), [`df8cbb8dd1`](https://github.com/LedgerHQ/ledger-live/commit/df8cbb8dd166a66325eb96d8192f3f985b71df60), [`5b8315df30`](https://github.com/LedgerHQ/ledger-live/commit/5b8315df306d72e8b0191aa5136760142f9d3447), [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6), [`00e8b9e435`](https://github.com/LedgerHQ/ledger-live/commit/00e8b9e435fc5f13c56206102619eb1f97c62546), [`bef0a76d27`](https://github.com/LedgerHQ/ledger-live/commit/bef0a76d276f6a8d322e890ceaedc266a710b06a), [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd), [`ab40db1288`](https://github.com/LedgerHQ/ledger-live/commit/ab40db1288bf4a795819a8a636821dbccf33073a), [`32c8df8f47`](https://github.com/LedgerHQ/ledger-live/commit/32c8df8f47644278ee44e9db623af864d57ad61c)]:
  - @ledgerhq/cryptoassets@6.37.0
  - @ledgerhq/hw-app-eth@6.30.0
  - @ledgerhq/errors@6.12.0
  - @ledgerhq/hw-transport@6.27.7
  - @ledgerhq/hw-app-solana@7.0.1
  - @ledgerhq/devices@7.0.4
  - @ledgerhq/hw-app-algorand@6.27.7
  - @ledgerhq/hw-app-cosmos@6.27.7
  - @ledgerhq/hw-app-polkadot@6.27.7
  - @ledgerhq/hw-app-trx@6.27.7
  - @ledgerhq/hw-transport-node-speculos@6.27.7
  - @ledgerhq/hw-app-btc@9.0.0
  - @ledgerhq/hw-app-str@6.27.7
  - @ledgerhq/hw-app-tezos@6.27.7
  - @ledgerhq/hw-app-xrp@6.27.7
  - @ledgerhq/hw-transport-mocker@6.27.7

## 27.7.0-next.3

### Patch Changes

- [#1853](https://github.com/LedgerHQ/ledger-live/pull/1853) [`2660f2993c`](https://github.com/LedgerHQ/ledger-live/commit/2660f2993cc815f10a8e8ffea18fb761d869fc36) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix gas limit estimation for token transactions in the Ethereum family

## 27.7.0-next.2

### Patch Changes

- [#1861](https://github.com/LedgerHQ/ledger-live/pull/1861) [`9f8c9be0ae`](https://github.com/LedgerHQ/ledger-live/commit/9f8c9be0aead9eb4101aa9d14e4ee3b560d88792) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Revert "[LIVE-4088] Remove incompatible API from ledger-live with new bitcoin app (#1493)"

## 27.7.0-next.1

### Minor Changes

- [#1811](https://github.com/LedgerHQ/ledger-live/pull/1811) [`f521bf7ef1`](https://github.com/LedgerHQ/ledger-live/commit/f521bf7ef1afa3afe1a03cbf65bd36ebee6d0768) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - change polkadot's api call to anticipate new version

## 27.7.0-next.0

### Minor Changes

- [#1211](https://github.com/LedgerHQ/ledger-live/pull/1211) [`32c8df8f47`](https://github.com/LedgerHQ/ledger-live/commit/32c8df8f47644278ee44e9db623af864d57ad61c) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add dynamic CAL support for EIP712

* [#1629](https://github.com/LedgerHQ/ledger-live/pull/1629) [`4aa4d42cb1`](https://github.com/LedgerHQ/ledger-live/commit/4aa4d42cb103612c130b01f36100eb6fdd87e8b1) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - add youhodler as fund provider

- [#1757](https://github.com/LedgerHQ/ledger-live/pull/1757) [`aec68cca70`](https://github.com/LedgerHQ/ledger-live/commit/aec68cca70194f7890a09dca62a737046af13305) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - disable nft on ios with feature flag

* [#1628](https://github.com/LedgerHQ/ledger-live/pull/1628) [`57699a19fa`](https://github.com/LedgerHQ/ledger-live/commit/57699a19fa545ba359e457deb7ba0632b15342b5) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - add plugins

- [#1211](https://github.com/LedgerHQ/ledger-live/pull/1211) [`32c8df8f47`](https://github.com/LedgerHQ/ledger-live/commit/32c8df8f47644278ee44e9db623af864d57ad61c) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Remove EIP712 message signing from env and set as definitve feature + update tests accordingly

* [#1662](https://github.com/LedgerHQ/ledger-live/pull/1662) [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6) Thanks [@lambertkevin](https://github.com/lambertkevin)! - EIP1559 support for Ethereum transactions

### Patch Changes

- [#1758](https://github.com/LedgerHQ/ledger-live/pull/1758) [`3f516ea41e`](https://github.com/LedgerHQ/ledger-live/commit/3f516ea41e6e1a485be452872c91bd4a315eb167) Thanks [@LFBarreto](https://github.com/LFBarreto)! - bugfix - MarketDataProvider - undefined chartData in specific cases

* [#1651](https://github.com/LedgerHQ/ledger-live/pull/1651) [`f7b27a97f6`](https://github.com/LedgerHQ/ledger-live/commit/f7b27a97f6cd2b2c553cbe83d008e4ce907c9ad2) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix hardware version checking logic in getVersion command

- [#1493](https://github.com/LedgerHQ/ledger-live/pull/1493) [`658303322b`](https://github.com/LedgerHQ/ledger-live/commit/658303322b767f5ed3821def8384b5342ab03089) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Change hw-app-btc to remove any dependency to the legacy Bitcoin Nano app API. Update hw-app-btc API (refer to hw-app-btc/src/Btc.ts for new method signature)

* [#1731](https://github.com/LedgerHQ/ledger-live/pull/1731) [`ddeace7163`](https://github.com/LedgerHQ/ledger-live/commit/ddeace7163f0c9186f4f48cc4baa2b9273c5ebf3) Thanks [@pierrelouis-c](https://github.com/pierrelouis-c)! - Filter the post onboarding actions using Feature Flags

- [#1622](https://github.com/LedgerHQ/ledger-live/pull/1622) [`df8cbb8dd1`](https://github.com/LedgerHQ/ledger-live/commit/df8cbb8dd166a66325eb96d8192f3f985b71df60) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix bootloader repairing steps

* [#1352](https://github.com/LedgerHQ/ledger-live/pull/1352) [`0d7e0f713a`](https://github.com/LedgerHQ/ledger-live/commit/0d7e0f713ab4fbb3d4bd7df147a96c7de73123b7) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Moved custom image errors from ledger-live-mobile to live-common

- [#1685](https://github.com/LedgerHQ/ledger-live/pull/1685) [`e89044242d`](https://github.com/LedgerHQ/ledger-live/commit/e89044242d005bfc3349abbbf1921e9056686d0b) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Handle 0x5515 response for allow manager and connect app device actions on LLM

* [#1141](https://github.com/LedgerHQ/ledger-live/pull/1141) [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd) Thanks [@valpinkman](https://github.com/valpinkman)! - Collateral changes due to solving all LLM typescript/eslint issues/warnings.

- [#1783](https://github.com/LedgerHQ/ledger-live/pull/1783) [`90a9fbb75b`](https://github.com/LedgerHQ/ledger-live/commit/90a9fbb75b3b3960655d601a6c7c987689ef19be) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Enforce nano app version 1.10.1 to prevent latency issues with EIP-712 signature

- Updated dependencies [[`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6), [`32c8df8f47`](https://github.com/LedgerHQ/ledger-live/commit/32c8df8f47644278ee44e9db623af864d57ad61c), [`0308e8c6ae`](https://github.com/LedgerHQ/ledger-live/commit/0308e8c6ae721a99bc50f5dc60db0d11ea8ea1ff), [`8bf7626bbe`](https://github.com/LedgerHQ/ledger-live/commit/8bf7626bbeb4f766868ab37b7fc943bb7e84e2ca), [`f5f4db47d2`](https://github.com/LedgerHQ/ledger-live/commit/f5f4db47d214bc30390b7be91d3bab4814c5fb45), [`658303322b`](https://github.com/LedgerHQ/ledger-live/commit/658303322b767f5ed3821def8384b5342ab03089), [`32c8df8f47`](https://github.com/LedgerHQ/ledger-live/commit/32c8df8f47644278ee44e9db623af864d57ad61c), [`d3c91a53e0`](https://github.com/LedgerHQ/ledger-live/commit/d3c91a53e06f9f47817e96c452f69e2d9f71d80f), [`df8cbb8dd1`](https://github.com/LedgerHQ/ledger-live/commit/df8cbb8dd166a66325eb96d8192f3f985b71df60), [`5b8315df30`](https://github.com/LedgerHQ/ledger-live/commit/5b8315df306d72e8b0191aa5136760142f9d3447), [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6), [`00e8b9e435`](https://github.com/LedgerHQ/ledger-live/commit/00e8b9e435fc5f13c56206102619eb1f97c62546), [`bef0a76d27`](https://github.com/LedgerHQ/ledger-live/commit/bef0a76d276f6a8d322e890ceaedc266a710b06a), [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd), [`ab40db1288`](https://github.com/LedgerHQ/ledger-live/commit/ab40db1288bf4a795819a8a636821dbccf33073a), [`32c8df8f47`](https://github.com/LedgerHQ/ledger-live/commit/32c8df8f47644278ee44e9db623af864d57ad61c)]:
  - @ledgerhq/cryptoassets@6.37.0-next.0
  - @ledgerhq/hw-app-eth@6.30.0-next.0
  - @ledgerhq/errors@6.12.0-next.0
  - @ledgerhq/hw-app-btc@9.0.0-next.0
  - @ledgerhq/hw-transport@6.27.7-next.0
  - @ledgerhq/hw-app-solana@7.0.1-next.0
  - @ledgerhq/devices@7.0.4-next.0
  - @ledgerhq/hw-app-algorand@6.27.7-next.0
  - @ledgerhq/hw-app-cosmos@6.27.7-next.0
  - @ledgerhq/hw-app-polkadot@6.27.7-next.0
  - @ledgerhq/hw-app-trx@6.27.7-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.7-next.0
  - @ledgerhq/hw-app-str@6.27.7-next.0
  - @ledgerhq/hw-app-tezos@6.27.7-next.0
  - @ledgerhq/hw-app-xrp@6.27.7-next.0
  - @ledgerhq/hw-transport-mocker@6.27.7-next.0

## 27.6.0

### Minor Changes

- [#1279](https://github.com/LedgerHQ/ledger-live/pull/1279) [`0f1bf87fdc`](https://github.com/LedgerHQ/ledger-live/commit/0f1bf87fdc8b80a4edb2556222b255d644fdd5da) Thanks [@grsoares21](https://github.com/grsoares21)! - Addad feature flag and type definitions

* [#1520](https://github.com/LedgerHQ/ledger-live/pull/1520) [`24cdfe3869`](https://github.com/LedgerHQ/ledger-live/commit/24cdfe38695b60c7f3bc4827ea46893c8062dbad) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Minimum version for Ethereum nano app from 1.9.17 to 1.9.20

- [#1603](https://github.com/LedgerHQ/ledger-live/pull/1603) [`6bcbd3967a`](https://github.com/LedgerHQ/ledger-live/commit/6bcbd3967a9841779a60708eab4b70144af880d7) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update getEstimationFee for evm family to prevent usage of hardcoded values by `ether.js`

* [#1558](https://github.com/LedgerHQ/ledger-live/pull/1558) [`2c3d6b53ea`](https://github.com/LedgerHQ/ledger-live/commit/2c3d6b53eaaefc0f2ab766addf8584d2f83a5eb9) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Update hw-app-cardano package

### Patch Changes

- [#1537](https://github.com/LedgerHQ/ledger-live/pull/1537) [`cbcc0c1989`](https://github.com/LedgerHQ/ledger-live/commit/cbcc0c19899ffecbdbeda2e4b230a130d0fe1899) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLC - Market Provider - fix potential issue on chartData

* [#1199](https://github.com/LedgerHQ/ledger-live/pull/1199) [`2f615db01b`](https://github.com/LedgerHQ/ledger-live/commit/2f615db01be43e7c21b5654b28bd122dab140252) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Prevent update app loop for users on old fw and old apps

- [#1372](https://github.com/LedgerHQ/ledger-live/pull/1372) [`b53d648424`](https://github.com/LedgerHQ/ledger-live/commit/b53d64842471eb2382066aecfc9f2b3b15ef7aed) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add FEATURE_FLAGS env variable to override feature flags

* [#1477](https://github.com/LedgerHQ/ledger-live/pull/1477) [`b49a269bb2`](https://github.com/LedgerHQ/ledger-live/commit/b49a269bb2d3ff1cdaae5e74d85fb8e1c33da978) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Force Polkadot minimum app version 14.9290.0

- [#330](https://github.com/LedgerHQ/ledger-live/pull/330) [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Feat: Sync onboarding software checks UI

  - handling unlock device during genuine check

- Updated dependencies [[`627f928b9d`](https://github.com/LedgerHQ/ledger-live/commit/627f928b9dc93f072f47b85d09e34c41b1948d0b)]:
  - @ledgerhq/cryptoassets@6.36.1
  - @ledgerhq/hw-app-eth@6.29.11

## 27.5.1-next.0

### Minor Changes

- [#1279](https://github.com/LedgerHQ/ledger-live/pull/1279) [`0f1bf87fdc`](https://github.com/LedgerHQ/ledger-live/commit/0f1bf87fdc8b80a4edb2556222b255d644fdd5da) Thanks [@grsoares21](https://github.com/grsoares21)! - Addad feature flag and type definitions

* [#1520](https://github.com/LedgerHQ/ledger-live/pull/1520) [`24cdfe3869`](https://github.com/LedgerHQ/ledger-live/commit/24cdfe38695b60c7f3bc4827ea46893c8062dbad) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Minimum version for Ethereum nano app from 1.9.17 to 1.9.20

- [#1603](https://github.com/LedgerHQ/ledger-live/pull/1603) [`6bcbd3967a`](https://github.com/LedgerHQ/ledger-live/commit/6bcbd3967a9841779a60708eab4b70144af880d7) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update getEstimationFee for evm family to prevent usage of hardcoded values by `ether.js`

* [#1558](https://github.com/LedgerHQ/ledger-live/pull/1558) [`2c3d6b53ea`](https://github.com/LedgerHQ/ledger-live/commit/2c3d6b53eaaefc0f2ab766addf8584d2f83a5eb9) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Update hw-app-cardano package

### Patch Changes

- [#1537](https://github.com/LedgerHQ/ledger-live/pull/1537) [`cbcc0c1989`](https://github.com/LedgerHQ/ledger-live/commit/cbcc0c19899ffecbdbeda2e4b230a130d0fe1899) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLC - Market Provider - fix potential issue on chartData

* [#1199](https://github.com/LedgerHQ/ledger-live/pull/1199) [`2f615db01b`](https://github.com/LedgerHQ/ledger-live/commit/2f615db01be43e7c21b5654b28bd122dab140252) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Prevent update app loop for users on old fw and old apps

- [#1372](https://github.com/LedgerHQ/ledger-live/pull/1372) [`b53d648424`](https://github.com/LedgerHQ/ledger-live/commit/b53d64842471eb2382066aecfc9f2b3b15ef7aed) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add FEATURE_FLAGS env variable to override feature flags

* [#1477](https://github.com/LedgerHQ/ledger-live/pull/1477) [`b49a269bb2`](https://github.com/LedgerHQ/ledger-live/commit/b49a269bb2d3ff1cdaae5e74d85fb8e1c33da978) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Force Polkadot minimum app version 14.9290.0

- [#330](https://github.com/LedgerHQ/ledger-live/pull/330) [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Feat: Sync onboarding software checks UI

  - handling unlock device during genuine check

- Updated dependencies [[`627f928b9d`](https://github.com/LedgerHQ/ledger-live/commit/627f928b9dc93f072f47b85d09e34c41b1948d0b)]:
  - @ledgerhq/cryptoassets@6.36.1-next.0
  - @ledgerhq/hw-app-eth@6.29.11-next.0

## 27.5.0

### Minor Changes

- [#1620](https://github.com/LedgerHQ/ledger-live/pull/1620) [`455e43b34c`](https://github.com/LedgerHQ/ledger-live/commit/455e43b34c13ca7ed1d2920a36653caa250e42ab) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update getEstimationFee for evm family to prevent usage of hardcoded values by `ether.js`

## 27.5.0-hotfix.0

### Minor Changes

- [#1620](https://github.com/LedgerHQ/ledger-live/pull/1620) [`455e43b34c`](https://github.com/LedgerHQ/ledger-live/commit/455e43b34c13ca7ed1d2920a36653caa250e42ab) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update getEstimationFee for evm family to prevent usage of hardcoded values by `ether.js`

## 27.4.0

### Minor Changes

- [#1525](https://github.com/LedgerHQ/ledger-live/pull/1525) [`64e00a9e30`](https://github.com/LedgerHQ/ledger-live/commit/64e00a9e30cf67b1e34552037e4405379af04a67) Thanks [@github-actions](https://github.com/apps/github-actions)! - Minimum version for Ethereum nano app from 1.9.17 to 1.9.20

* [#1442](https://github.com/LedgerHQ/ledger-live/pull/1442) [`12d40b578b`](https://github.com/LedgerHQ/ledger-live/commit/12d40b578bee2b52de197b679c3db0299bc9a716) Thanks [@sarneijim](https://github.com/sarneijim)! - Update CAL

- [#1474](https://github.com/LedgerHQ/ledger-live/pull/1474) [`2802e2d684`](https://github.com/LedgerHQ/ledger-live/commit/2802e2d6844a7e17127ea7d103fe0d1a45afa032) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Expose more information from inline app installs, allow dashboard as a target app in device actions

### Patch Changes

- [#1419](https://github.com/LedgerHQ/ledger-live/pull/1419) [`2100b9fb81`](https://github.com/LedgerHQ/ledger-live/commit/2100b9fb81a4fd04f65b96561c0a7d618658843a) Thanks [@gre](https://github.com/gre)! - Introduce tests to ensure we define abandonseed values for coin we support

* [#1525](https://github.com/LedgerHQ/ledger-live/pull/1525) [`5fba025686`](https://github.com/LedgerHQ/ledger-live/commit/5fba025686d799badad3f7a7c7c8491cba14be8a) Thanks [@github-actions](https://github.com/apps/github-actions)! - Fix ts rework error

- [#1420](https://github.com/LedgerHQ/ledger-live/pull/1420) [`bd884848bd`](https://github.com/LedgerHQ/ledger-live/commit/bd884848bd3dc2ef3cb5ea4df0127ff8ec6be8b7) Thanks [@gre](https://github.com/gre)! - Tezos: properly remap 'not enough balance' errors

* [#1357](https://github.com/LedgerHQ/ledger-live/pull/1357) [`b34e55181c`](https://github.com/LedgerHQ/ledger-live/commit/b34e55181c12bb0a59ef5dee5e808d7597a21edb) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix typescript lint rules warning

- [#1306](https://github.com/LedgerHQ/ledger-live/pull/1306) [`f6854a3fd7`](https://github.com/LedgerHQ/ledger-live/commit/f6854a3fd79a28eb5507796b69105c85b40bbe98) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - Fix outdated assertion on exchange signature size

* [#1409](https://github.com/LedgerHQ/ledger-live/pull/1409) [`d1aab06a96`](https://github.com/LedgerHQ/ledger-live/commit/d1aab06a966e06269b037b574e51593fe45e987f) Thanks [@crypto-smoke](https://github.com/crypto-smoke)! - Crypto Icons - Add support for YAE token icon

- [#1256](https://github.com/LedgerHQ/ledger-live/pull/1256) [`824efb6e62`](https://github.com/LedgerHQ/ledger-live/commit/824efb6e62b4b042fef700896f0bfd54ccfee5c7) Thanks [@jackthta](https://github.com/jackthta)! - Add user friendly error if add account flow fails to fetch account balance.

- Updated dependencies [[`2100b9fb81`](https://github.com/LedgerHQ/ledger-live/commit/2100b9fb81a4fd04f65b96561c0a7d618658843a), [`1b43ce613f`](https://github.com/LedgerHQ/ledger-live/commit/1b43ce613f599cef9f69e40e7e3cfa8c1033c786), [`d3dc2c6877`](https://github.com/LedgerHQ/ledger-live/commit/d3dc2c6877fbdcaf68e442a781798d752fc5152d)]:
  - @ledgerhq/cryptoassets@6.36.0
  - @ledgerhq/hw-app-solana@7.0.0
  - @ledgerhq/hw-app-eth@6.29.10

## 27.4.0-next.2

### Patch Changes

- [#1525](https://github.com/LedgerHQ/ledger-live/pull/1525) [`5fba025686`](https://github.com/LedgerHQ/ledger-live/commit/5fba025686d799badad3f7a7c7c8491cba14be8a) Thanks [@github-actions](https://github.com/apps/github-actions)! - Fix ts rework error

## 27.4.0-next.1

### Minor Changes

- [#1525](https://github.com/LedgerHQ/ledger-live/pull/1525) [`64e00a9e30`](https://github.com/LedgerHQ/ledger-live/commit/64e00a9e30cf67b1e34552037e4405379af04a67) Thanks [@github-actions](https://github.com/apps/github-actions)! - Minimum version for Ethereum nano app from 1.9.17 to 1.9.20

## 27.4.0-next.0

### Minor Changes

- [#1442](https://github.com/LedgerHQ/ledger-live/pull/1442) [`12d40b578b`](https://github.com/LedgerHQ/ledger-live/commit/12d40b578bee2b52de197b679c3db0299bc9a716) Thanks [@sarneijim](https://github.com/sarneijim)! - Update CAL

* [#1474](https://github.com/LedgerHQ/ledger-live/pull/1474) [`2802e2d684`](https://github.com/LedgerHQ/ledger-live/commit/2802e2d6844a7e17127ea7d103fe0d1a45afa032) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Expose more information from inline app installs, allow dashboard as a target app in device actions

### Patch Changes

- [#1419](https://github.com/LedgerHQ/ledger-live/pull/1419) [`2100b9fb81`](https://github.com/LedgerHQ/ledger-live/commit/2100b9fb81a4fd04f65b96561c0a7d618658843a) Thanks [@gre](https://github.com/gre)! - Introduce tests to ensure we define abandonseed values for coin we support

* [#1420](https://github.com/LedgerHQ/ledger-live/pull/1420) [`bd884848bd`](https://github.com/LedgerHQ/ledger-live/commit/bd884848bd3dc2ef3cb5ea4df0127ff8ec6be8b7) Thanks [@gre](https://github.com/gre)! - Tezos: properly remap 'not enough balance' errors

- [#1357](https://github.com/LedgerHQ/ledger-live/pull/1357) [`b34e55181c`](https://github.com/LedgerHQ/ledger-live/commit/b34e55181c12bb0a59ef5dee5e808d7597a21edb) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix typescript lint rules warning

* [#1306](https://github.com/LedgerHQ/ledger-live/pull/1306) [`f6854a3fd7`](https://github.com/LedgerHQ/ledger-live/commit/f6854a3fd79a28eb5507796b69105c85b40bbe98) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - Fix outdated assertion on exchange signature size

- [#1409](https://github.com/LedgerHQ/ledger-live/pull/1409) [`d1aab06a96`](https://github.com/LedgerHQ/ledger-live/commit/d1aab06a966e06269b037b574e51593fe45e987f) Thanks [@crypto-smoke](https://github.com/crypto-smoke)! - Crypto Icons - Add support for YAE token icon

* [#1256](https://github.com/LedgerHQ/ledger-live/pull/1256) [`824efb6e62`](https://github.com/LedgerHQ/ledger-live/commit/824efb6e62b4b042fef700896f0bfd54ccfee5c7) Thanks [@jackthta](https://github.com/jackthta)! - Add user friendly error if add account flow fails to fetch account balance.

* Updated dependencies [[`2100b9fb81`](https://github.com/LedgerHQ/ledger-live/commit/2100b9fb81a4fd04f65b96561c0a7d618658843a), [`1b43ce613f`](https://github.com/LedgerHQ/ledger-live/commit/1b43ce613f599cef9f69e40e7e3cfa8c1033c786), [`d3dc2c6877`](https://github.com/LedgerHQ/ledger-live/commit/d3dc2c6877fbdcaf68e442a781798d752fc5152d)]:
  - @ledgerhq/cryptoassets@6.36.0-next.0
  - @ledgerhq/hw-app-solana@7.0.0-next.0
  - @ledgerhq/hw-app-eth@6.29.10-next.0

## 27.3.2

### Patch Changes

- [#687](https://github.com/LedgerHQ/ledger-live/pull/687) [`c7e40bfef7`](https://github.com/LedgerHQ/ledger-live/commit/c7e40bfef718b2f806d2f6e942f2ca61b03a0110) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - move swap related types into types.ts

## 27.3.2-hotfix.0

### Patch Changes

- [#687](https://github.com/LedgerHQ/ledger-live/pull/687) [`c7e40bfef7`](https://github.com/LedgerHQ/ledger-live/commit/c7e40bfef718b2f806d2f6e942f2ca61b03a0110) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - move swap related types into types.ts

## 27.3.1

### Patch Changes

- [#1314](https://github.com/LedgerHQ/ledger-live/pull/1314) [`1a23c232fa`](https://github.com/LedgerHQ/ledger-live/commit/1a23c232fa21557ccd48568f4f577263bd6fc6e6) Thanks [@grsoares21](https://github.com/grsoares21)! - Add new onboarding state for the sync onboarding

* [#1331](https://github.com/LedgerHQ/ledger-live/pull/1331) [`2f473b2fdf`](https://github.com/LedgerHQ/ledger-live/commit/2f473b2fdffbbe8641a90aa9ada5ad1dd048460f) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Revert minimum version for Ethereum nano app from 1.9.20 to 1.9.17

* Updated dependencies [[`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa)]:
  - @ledgerhq/cryptoassets@6.35.1
  - @ledgerhq/devices@7.0.3
  - @ledgerhq/errors@6.11.1
  - @ledgerhq/hw-app-algorand@6.27.6
  - @ledgerhq/hw-app-btc@8.1.1
  - @ledgerhq/hw-app-cosmos@6.27.6
  - @ledgerhq/hw-app-eth@6.29.9
  - @ledgerhq/hw-app-polkadot@6.27.6
  - @ledgerhq/hw-app-solana@6.27.6
  - @ledgerhq/hw-app-str@6.27.6
  - @ledgerhq/hw-app-tezos@6.27.6
  - @ledgerhq/hw-app-trx@6.27.6
  - @ledgerhq/hw-app-xrp@6.27.6
  - @ledgerhq/hw-transport-mocker@6.27.6
  - @ledgerhq/hw-transport-node-speculos@6.27.6
  - @ledgerhq/hw-transport@6.27.6
  - @ledgerhq/logs@6.10.1

## 27.3.1-next.0

### Patch Changes

- [#1314](https://github.com/LedgerHQ/ledger-live/pull/1314) [`1a23c232fa`](https://github.com/LedgerHQ/ledger-live/commit/1a23c232fa21557ccd48568f4f577263bd6fc6e6) Thanks [@grsoares21](https://github.com/grsoares21)! - Add new onboarding state for the sync onboarding

* [#1331](https://github.com/LedgerHQ/ledger-live/pull/1331) [`2f473b2fdf`](https://github.com/LedgerHQ/ledger-live/commit/2f473b2fdffbbe8641a90aa9ada5ad1dd048460f) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Revert minimum version for Ethereum nano app from 1.9.20 to 1.9.17

* Updated dependencies [[`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa)]:
  - @ledgerhq/cryptoassets@6.35.1-next.0
  - @ledgerhq/devices@7.0.3-next.0
  - @ledgerhq/errors@6.11.1-next.0
  - @ledgerhq/hw-app-algorand@6.27.6-next.0
  - @ledgerhq/hw-app-btc@8.1.1-next.0
  - @ledgerhq/hw-app-cosmos@6.27.6-next.0
  - @ledgerhq/hw-app-eth@6.29.9-next.0
  - @ledgerhq/hw-app-polkadot@6.27.6-next.0
  - @ledgerhq/hw-app-solana@6.27.6-next.0
  - @ledgerhq/hw-app-str@6.27.6-next.0
  - @ledgerhq/hw-app-tezos@6.27.6-next.0
  - @ledgerhq/hw-app-trx@6.27.6-next.0
  - @ledgerhq/hw-app-xrp@6.27.6-next.0
  - @ledgerhq/hw-transport-mocker@6.27.6-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.6-next.0
  - @ledgerhq/hw-transport@6.27.6-next.0
  - @ledgerhq/logs@6.10.1-next.0

## 27.3.0

### Minor Changes

- [#836](https://github.com/LedgerHQ/ledger-live/pull/836) [`68a0b01efc`](https://github.com/LedgerHQ/ledger-live/commit/68a0b01efcfd481cb8fe71ec22a2fc7217f25ec9) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Support zcash v5 format transaction

* [#742](https://github.com/LedgerHQ/ledger-live/pull/742) [`56068b813c`](https://github.com/LedgerHQ/ledger-live/commit/56068b813ce301a37b9d08bd55273b3d934c7371) Thanks [@grsoares21](https://github.com/grsoares21)! - Adds device action logic for installing and uninstalling language packs

- [#1225](https://github.com/LedgerHQ/ledger-live/pull/1225) [`900eea7642`](https://github.com/LedgerHQ/ledger-live/commit/900eea7642bda94c71e2a171b90d2b6cd4d6ac4e) Thanks [@sarneijim](https://github.com/sarneijim)! - Support selectedRate in useProviderRates and add isRegistrationRequired util

* [#1121](https://github.com/LedgerHQ/ledger-live/pull/1121) [`b4be83ac62`](https://github.com/LedgerHQ/ledger-live/commit/b4be83ac62b3977c16e0c375e26973b05ae4cd9e) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Fix cosmos claim reward operations

- [#1318](https://github.com/LedgerHQ/ledger-live/pull/1318) [`99acc1ad22`](https://github.com/LedgerHQ/ledger-live/commit/99acc1ad22bbb76b91c2cbdc1b8ed67c691b4233) Thanks [@sarneijim](https://github.com/sarneijim)! - Filter provider swap list by status

* [#1177](https://github.com/LedgerHQ/ledger-live/pull/1177) [`8e8db41df4`](https://github.com/LedgerHQ/ledger-live/commit/8e8db41df4319d3406c7f29b8cce18d1b212f12f) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - change tag values for alternative derivation schemes on filecoin

- [#1104](https://github.com/LedgerHQ/ledger-live/pull/1104) [`8fa17173ed`](https://github.com/LedgerHQ/ledger-live/commit/8fa17173ed20415b17bfb6d84e8a14b602516054) Thanks [@grsoares21](https://github.com/grsoares21)! - Update the onboarding states according to the new firmware definitons

* [#1130](https://github.com/LedgerHQ/ledger-live/pull/1130) [`3d2fa9adbb`](https://github.com/LedgerHQ/ledger-live/commit/3d2fa9adbbd408b4be3748f1d2180e90b83de536) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - Switch to swap backend API v4

### Patch Changes

- [#1310](https://github.com/LedgerHQ/ledger-live/pull/1310) [`671700de22`](https://github.com/LedgerHQ/ledger-live/commit/671700de22dbfe7e59a0bee2b7cae243d5b22260) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Protecting a function which can in some case filter on empty arrays

* [#943](https://github.com/LedgerHQ/ledger-live/pull/943) [`8465b5e317`](https://github.com/LedgerHQ/ledger-live/commit/8465b5e317baecaf8f893b9c090537d2d03ac835) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add react-redux and redux-actions peer dependencies

- [#1246](https://github.com/LedgerHQ/ledger-live/pull/1246) [`41a31a0474`](https://github.com/LedgerHQ/ledger-live/commit/41a31a0474725d51d659142b292629c534b94338) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Remove duplicates from all lists passed to setSupportedCurrencies

* [#1302](https://github.com/LedgerHQ/ledger-live/pull/1302) [`5f003287f8`](https://github.com/LedgerHQ/ledger-live/commit/5f003287f85974d160cc230c8e5d7c442b0eb639) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Force Ethereum nano app minimum version to 1.9.20

- [#943](https://github.com/LedgerHQ/ledger-live/pull/943) [`8465b5e317`](https://github.com/LedgerHQ/ledger-live/commit/8465b5e317baecaf8f893b9c090537d2d03ac835) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add post onboarding actions, reducers, hooks and provider logic

* [#1304](https://github.com/LedgerHQ/ledger-live/pull/1304) [`df76dd28c1`](https://github.com/LedgerHQ/ledger-live/commit/df76dd28c15d0cd5b7b57ee3f78aa0bd4170a44a) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix wrong inferences for currencies + add tests to make sure we catch the issue next time

- [#742](https://github.com/LedgerHQ/ledger-live/pull/742) [`56068b813c`](https://github.com/LedgerHQ/ledger-live/commit/56068b813ce301a37b9d08bd55273b3d934c7371) Thanks [@grsoares21](https://github.com/grsoares21)! - Add prompt to change device language when live language is changed

* [#1240](https://github.com/LedgerHQ/ledger-live/pull/1240) [`4d2149c2dc`](https://github.com/LedgerHQ/ledger-live/commit/4d2149c2dc47058aaf3d6e4bd9739e724103ab9a) Thanks [@gre](https://github.com/gre)! - bot: add formatDeviceAmount utility to simplify writing speculos-deviceActions

- [#1330](https://github.com/LedgerHQ/ledger-live/pull/1330) [`692feed2b9`](https://github.com/LedgerHQ/ledger-live/commit/692feed2b95a246f43347695c3e8ab6e64ffd1f5) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Revert minimum version for Ethereum nano app from 1.9.20 to 1.9.17

- Updated dependencies [[`68a0b01efc`](https://github.com/LedgerHQ/ledger-live/commit/68a0b01efcfd481cb8fe71ec22a2fc7217f25ec9), [`1a94cbf28a`](https://github.com/LedgerHQ/ledger-live/commit/1a94cbf28aaa2917c70719e22f446148cd66cef6), [`e0915b34ba`](https://github.com/LedgerHQ/ledger-live/commit/e0915b34ba37d9906b6c65e7e42f87893c088325), [`4f66046ef7`](https://github.com/LedgerHQ/ledger-live/commit/4f66046ef78ebcd14e6d63639f54834e90e6547a), [`df76dd28c1`](https://github.com/LedgerHQ/ledger-live/commit/df76dd28c15d0cd5b7b57ee3f78aa0bd4170a44a)]:
  - @ledgerhq/hw-app-btc@8.1.0
  - @ledgerhq/errors@6.11.0
  - @ledgerhq/devices@7.0.2
  - @ledgerhq/cryptoassets@6.35.0
  - @ledgerhq/hw-app-algorand@6.27.5
  - @ledgerhq/hw-app-cosmos@6.27.5
  - @ledgerhq/hw-app-eth@6.29.8
  - @ledgerhq/hw-app-polkadot@6.27.5
  - @ledgerhq/hw-app-solana@6.27.5
  - @ledgerhq/hw-app-trx@6.27.5
  - @ledgerhq/hw-transport@6.27.5
  - @ledgerhq/hw-transport-node-speculos@6.27.5
  - @ledgerhq/hw-app-str@6.27.5
  - @ledgerhq/hw-app-tezos@6.27.5
  - @ledgerhq/hw-app-xrp@6.27.5
  - @ledgerhq/hw-transport-mocker@6.27.5

## 27.3.0-next.1

### Patch Changes

- [#1330](https://github.com/LedgerHQ/ledger-live/pull/1330) [`692feed2b9`](https://github.com/LedgerHQ/ledger-live/commit/692feed2b95a246f43347695c3e8ab6e64ffd1f5) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Revert minimum version for Ethereum nano app from 1.9.20 to 1.9.17

## 27.3.0-next.0

### Minor Changes

- [#836](https://github.com/LedgerHQ/ledger-live/pull/836) [`68a0b01efc`](https://github.com/LedgerHQ/ledger-live/commit/68a0b01efcfd481cb8fe71ec22a2fc7217f25ec9) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Support zcash v5 format transaction

* [#742](https://github.com/LedgerHQ/ledger-live/pull/742) [`56068b813c`](https://github.com/LedgerHQ/ledger-live/commit/56068b813ce301a37b9d08bd55273b3d934c7371) Thanks [@grsoares21](https://github.com/grsoares21)! - Adds device action logic for installing and uninstalling language packs

- [#1225](https://github.com/LedgerHQ/ledger-live/pull/1225) [`900eea7642`](https://github.com/LedgerHQ/ledger-live/commit/900eea7642bda94c71e2a171b90d2b6cd4d6ac4e) Thanks [@sarneijim](https://github.com/sarneijim)! - Support selectedRate in useProviderRates and add isRegistrationRequired util

* [#1121](https://github.com/LedgerHQ/ledger-live/pull/1121) [`b4be83ac62`](https://github.com/LedgerHQ/ledger-live/commit/b4be83ac62b3977c16e0c375e26973b05ae4cd9e) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Fix cosmos claim reward operations

- [#1318](https://github.com/LedgerHQ/ledger-live/pull/1318) [`99acc1ad22`](https://github.com/LedgerHQ/ledger-live/commit/99acc1ad22bbb76b91c2cbdc1b8ed67c691b4233) Thanks [@sarneijim](https://github.com/sarneijim)! - Filter provider swap list by status

* [#1177](https://github.com/LedgerHQ/ledger-live/pull/1177) [`8e8db41df4`](https://github.com/LedgerHQ/ledger-live/commit/8e8db41df4319d3406c7f29b8cce18d1b212f12f) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - change tag values for alternative derivation schemes on filecoin

- [#1104](https://github.com/LedgerHQ/ledger-live/pull/1104) [`8fa17173ed`](https://github.com/LedgerHQ/ledger-live/commit/8fa17173ed20415b17bfb6d84e8a14b602516054) Thanks [@grsoares21](https://github.com/grsoares21)! - Update the onboarding states according to the new firmware definitons

* [#1130](https://github.com/LedgerHQ/ledger-live/pull/1130) [`3d2fa9adbb`](https://github.com/LedgerHQ/ledger-live/commit/3d2fa9adbbd408b4be3748f1d2180e90b83de536) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - Switch to swap backend API v4

### Patch Changes

- [#1310](https://github.com/LedgerHQ/ledger-live/pull/1310) [`671700de22`](https://github.com/LedgerHQ/ledger-live/commit/671700de22dbfe7e59a0bee2b7cae243d5b22260) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Protecting a function which can in some case filter on empty arrays

* [#943](https://github.com/LedgerHQ/ledger-live/pull/943) [`8465b5e317`](https://github.com/LedgerHQ/ledger-live/commit/8465b5e317baecaf8f893b9c090537d2d03ac835) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add react-redux and redux-actions peer dependencies

- [#1246](https://github.com/LedgerHQ/ledger-live/pull/1246) [`41a31a0474`](https://github.com/LedgerHQ/ledger-live/commit/41a31a0474725d51d659142b292629c534b94338) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Remove duplicates from all lists passed to setSupportedCurrencies

* [#1302](https://github.com/LedgerHQ/ledger-live/pull/1302) [`5f003287f8`](https://github.com/LedgerHQ/ledger-live/commit/5f003287f85974d160cc230c8e5d7c442b0eb639) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Force Ethereum nano app minimum version to 1.9.20

- [#943](https://github.com/LedgerHQ/ledger-live/pull/943) [`8465b5e317`](https://github.com/LedgerHQ/ledger-live/commit/8465b5e317baecaf8f893b9c090537d2d03ac835) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add post onboarding actions, reducers, hooks and provider logic

* [#1304](https://github.com/LedgerHQ/ledger-live/pull/1304) [`df76dd28c1`](https://github.com/LedgerHQ/ledger-live/commit/df76dd28c15d0cd5b7b57ee3f78aa0bd4170a44a) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix wrong inferences for currencies + add tests to make sure we catch the issue next time

- [#742](https://github.com/LedgerHQ/ledger-live/pull/742) [`56068b813c`](https://github.com/LedgerHQ/ledger-live/commit/56068b813ce301a37b9d08bd55273b3d934c7371) Thanks [@grsoares21](https://github.com/grsoares21)! - Add prompt to change device language when live language is changed

* [#1240](https://github.com/LedgerHQ/ledger-live/pull/1240) [`4d2149c2dc`](https://github.com/LedgerHQ/ledger-live/commit/4d2149c2dc47058aaf3d6e4bd9739e724103ab9a) Thanks [@gre](https://github.com/gre)! - bot: add formatDeviceAmount utility to simplify writing speculos-deviceActions

* Updated dependencies [[`68a0b01efc`](https://github.com/LedgerHQ/ledger-live/commit/68a0b01efcfd481cb8fe71ec22a2fc7217f25ec9), [`1a94cbf28a`](https://github.com/LedgerHQ/ledger-live/commit/1a94cbf28aaa2917c70719e22f446148cd66cef6), [`e0915b34ba`](https://github.com/LedgerHQ/ledger-live/commit/e0915b34ba37d9906b6c65e7e42f87893c088325), [`4f66046ef7`](https://github.com/LedgerHQ/ledger-live/commit/4f66046ef78ebcd14e6d63639f54834e90e6547a), [`df76dd28c1`](https://github.com/LedgerHQ/ledger-live/commit/df76dd28c15d0cd5b7b57ee3f78aa0bd4170a44a)]:
  - @ledgerhq/hw-app-btc@8.1.0-next.0
  - @ledgerhq/errors@6.11.0-next.0
  - @ledgerhq/devices@7.0.2-next.0
  - @ledgerhq/cryptoassets@6.35.0-next.0
  - @ledgerhq/hw-app-algorand@6.27.5-next.0
  - @ledgerhq/hw-app-cosmos@6.27.5-next.0
  - @ledgerhq/hw-app-eth@6.29.8-next.0
  - @ledgerhq/hw-app-polkadot@6.27.5-next.0
  - @ledgerhq/hw-app-solana@6.27.5-next.0
  - @ledgerhq/hw-app-trx@6.27.5-next.0
  - @ledgerhq/hw-transport@6.27.5-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.5-next.0
  - @ledgerhq/hw-app-str@6.27.5-next.0
  - @ledgerhq/hw-app-tezos@6.27.5-next.0
  - @ledgerhq/hw-app-xrp@6.27.5-next.0
  - @ledgerhq/hw-transport-mocker@6.27.5-next.0

## 27.2.0

### Minor Changes

- [#892](https://github.com/LedgerHQ/ledger-live/pull/892) [`d70bb7042a`](https://github.com/LedgerHQ/ledger-live/commit/d70bb7042a01de2191b59337d8a1574e22bd8887) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Add EIP-712 capability when preparing message to sign

### Patch Changes

- [#743](https://github.com/LedgerHQ/ledger-live/pull/743) [`a089100d37`](https://github.com/LedgerHQ/ledger-live/commit/a089100d37c2057210201e7faccab2c889a57668) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add "customImage" feature flag.

* [#1179](https://github.com/LedgerHQ/ledger-live/pull/1179) [`ae5e33e15e`](https://github.com/LedgerHQ/ledger-live/commit/ae5e33e15e8a107d0ba8a3688a63eda2c0d43ce7) Thanks [@gre](https://github.com/gre)! - Improve TypeScript of @ledgerhq/errors and fixes 2 bugs in swap and stellar on their error handling

* Updated dependencies [[`ae5e33e15e`](https://github.com/LedgerHQ/ledger-live/commit/ae5e33e15e8a107d0ba8a3688a63eda2c0d43ce7), [`d70bb7042a`](https://github.com/LedgerHQ/ledger-live/commit/d70bb7042a01de2191b59337d8a1574e22bd8887)]:
  - @ledgerhq/errors@6.10.2
  - @ledgerhq/hw-app-eth@6.29.7
  - @ledgerhq/devices@7.0.1
  - @ledgerhq/hw-app-algorand@6.27.4
  - @ledgerhq/hw-app-cosmos@6.27.4
  - @ledgerhq/hw-app-polkadot@6.27.4
  - @ledgerhq/hw-app-solana@6.27.4
  - @ledgerhq/hw-app-trx@6.27.4
  - @ledgerhq/hw-transport@6.27.4
  - @ledgerhq/hw-transport-node-speculos@6.27.4
  - @ledgerhq/hw-app-btc@8.0.2
  - @ledgerhq/hw-app-str@6.27.4
  - @ledgerhq/hw-app-tezos@6.27.4
  - @ledgerhq/hw-app-xrp@6.27.4
  - @ledgerhq/hw-transport-mocker@6.27.4

## 27.2.0-next.0

### Minor Changes

- [#892](https://github.com/LedgerHQ/ledger-live/pull/892) [`d70bb7042`](https://github.com/LedgerHQ/ledger-live/commit/d70bb7042a01de2191b59337d8a1574e22bd8887) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Add EIP-712 capability when preparing message to sign

### Patch Changes

- [#743](https://github.com/LedgerHQ/ledger-live/pull/743) [`a089100d3`](https://github.com/LedgerHQ/ledger-live/commit/a089100d37c2057210201e7faccab2c889a57668) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add "customImage" feature flag.

* [#1179](https://github.com/LedgerHQ/ledger-live/pull/1179) [`ae5e33e15`](https://github.com/LedgerHQ/ledger-live/commit/ae5e33e15e8a107d0ba8a3688a63eda2c0d43ce7) Thanks [@gre](https://github.com/gre)! - Improve TypeScript of @ledgerhq/errors and fixes 2 bugs in swap and stellar on their error handling

* Updated dependencies [[`ae5e33e15`](https://github.com/LedgerHQ/ledger-live/commit/ae5e33e15e8a107d0ba8a3688a63eda2c0d43ce7), [`d70bb7042`](https://github.com/LedgerHQ/ledger-live/commit/d70bb7042a01de2191b59337d8a1574e22bd8887)]:
  - @ledgerhq/errors@6.10.2-next.0
  - @ledgerhq/hw-app-eth@6.29.7-next.0
  - @ledgerhq/devices@7.0.1-next.0
  - @ledgerhq/hw-app-algorand@6.27.4-next.0
  - @ledgerhq/hw-app-cosmos@6.27.4-next.0
  - @ledgerhq/hw-app-polkadot@6.27.4-next.0
  - @ledgerhq/hw-app-solana@6.27.4-next.0
  - @ledgerhq/hw-app-trx@6.27.4-next.0
  - @ledgerhq/hw-transport@6.27.4-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.4-next.0
  - @ledgerhq/hw-app-btc@8.0.2-next.0
  - @ledgerhq/hw-app-str@6.27.4-next.0
  - @ledgerhq/hw-app-tezos@6.27.4-next.0
  - @ledgerhq/hw-app-xrp@6.27.4-next.0
  - @ledgerhq/hw-transport-mocker@6.27.4-next.0

## 27.1.0

### Minor Changes

- [#744](https://github.com/LedgerHQ/ledger-live/pull/744) [`0ebdec50b`](https://github.com/LedgerHQ/ledger-live/commit/0ebdec50bfca81b2d814726f8f9a82237ad42ffc) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add an EVM based family in LLC

* [#669](https://github.com/LedgerHQ/ledger-live/pull/669) [`b615140ba2`](https://github.com/LedgerHQ/ledger-live/commit/b615140ba2e326e1466d15f123d412ea90db3754) Thanks [@andyhass](https://github.com/andyhass)! - Add Celo Staking

- [#1155](https://github.com/LedgerHQ/ledger-live/pull/1155) [`3849ee3f3`](https://github.com/LedgerHQ/ledger-live/commit/3849ee3f30987b51d648ce29bfee4721f4ddff5f) Thanks [@sarneijim](https://github.com/sarneijim)! - Add requirement to cosmos banner

* [#954](https://github.com/LedgerHQ/ledger-live/pull/954) [`336eb879a`](https://github.com/LedgerHQ/ledger-live/commit/336eb879a80573fd81027232c4c6c9b383bd2a97) Thanks [@andyhass](https://github.com/andyhass)! - The Ledger QA team discovered that an error could occur when calculating the max spendable and max non-voting locked balance when pending operations existed. These balances are set when the account syncs, and these balances will not take into account pending operations - leaving it to be higher than it truly is. This results in a runtime error related to trying to create a transaction that is larger than the respective balance.

- [#1059](https://github.com/LedgerHQ/ledger-live/pull/1059) [`685348dd3`](https://github.com/LedgerHQ/ledger-live/commit/685348dd351181a9ed7f23cedb3e3d289b16fe9e) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - fix glitch on tx value when sending tokens

* [#963](https://github.com/LedgerHQ/ledger-live/pull/963) [`dd538c372`](https://github.com/LedgerHQ/ledger-live/commit/dd538c3723853334ce19a89353f20766432d12fd) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - replace cbor lib to get rid of BigInt type

- [#1072](https://github.com/LedgerHQ/ledger-live/pull/1072) [`0601b6541`](https://github.com/LedgerHQ/ledger-live/commit/0601b6541f10635aea72f916626432a334aa49fa) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - display fees on historical transactions properly

* [#856](https://github.com/LedgerHQ/ledger-live/pull/856) [`3615a06f1`](https://github.com/LedgerHQ/ledger-live/commit/3615a06f19ef659480d50a1a1a28f6df952b117a) Thanks [@andyhass](https://github.com/andyhass)! - Gracefully handle when user reaches the maximum number of Celo validator groups they can vote for.

- [#1017](https://github.com/LedgerHQ/ledger-live/pull/1017) [`21ed0bd52`](https://github.com/LedgerHQ/ledger-live/commit/21ed0bd5219a3629abc0bbb547fc4d75f5e71300) Thanks [@sarneijim](https://github.com/sarneijim)! - Add cosmos account banner util

### Patch Changes

- [#1025](https://github.com/LedgerHQ/ledger-live/pull/1025) [`7e812a738`](https://github.com/LedgerHQ/ledger-live/commit/7e812a738db718200138dcb9b7bcc2f6dd0ddd6f) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: hooks for genuine check and get latest available firmware

* [#1092](https://github.com/LedgerHQ/ledger-live/pull/1092) [`058a1af7f`](https://github.com/LedgerHQ/ledger-live/commit/058a1af7ff463d21afe85d03563b61e1d543c95b) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Safe serialization & reconciliation when no account resources

- [#1117](https://github.com/LedgerHQ/ledger-live/pull/1117) [`f228bbdf0`](https://github.com/LedgerHQ/ledger-live/commit/f228bbdf063640770d3baa71ea610483c7380a72) Thanks [@github-actions](https://github.com/apps/github-actions)! - New BLE pairing flow

  Not yet used in production. Accessible from the debug menu.

  Features:

  - scanning and pairing: one screen to go to from anywhere
  - navigate to after pairing success: configuration of the screen (and its associated navigator) with params and name of the route param that will have newly paired device info
  - scanning: filtering on device models
  - scanning: filtering out or displaying already known devices
  - pairing: new animation for pairing (lotties placeholders for now)
  - pairing: possibility to add (or not) the newly paired device to the "known devices" of the app (redux store)

* [#956](https://github.com/LedgerHQ/ledger-live/pull/956) [`d6634bc0b`](https://github.com/LedgerHQ/ledger-live/commit/d6634bc0b720d8a13f3681caf33e2f23d5c64968) Thanks [@pavanvora](https://github.com/pavanvora)! - fix estimateMaxSpendable for Cardano

- [#1083](https://github.com/LedgerHQ/ledger-live/pull/1083) [`5da717c52`](https://github.com/LedgerHQ/ledger-live/commit/5da717c523db7678edeb0f86bdfa88256dfe96c4) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add missing safety check on bitcoinResources

* [#1109](https://github.com/LedgerHQ/ledger-live/pull/1109) [`8fe44e12d`](https://github.com/LedgerHQ/ledger-live/commit/8fe44e12d73fe96636282666dd8f3b02ef96d0e6) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Switch Ethereum Goerli explorer env from staging to prod

* Updated dependencies [[`b615140ba2`](https://github.com/LedgerHQ/ledger-live/commit/b615140ba2e326e1466d15f123d412ea90db3754), [`e80336b28`](https://github.com/LedgerHQ/ledger-live/commit/e80336b28478b3eca7a1c477b43cc512ba38a710), [`318e80452`](https://github.com/LedgerHQ/ledger-live/commit/318e80452569a0f91c4363ae50d2664419251dbd), [`e80336b28`](https://github.com/LedgerHQ/ledger-live/commit/e80336b28478b3eca7a1c477b43cc512ba38a710), [`5dd957b3c`](https://github.com/LedgerHQ/ledger-live/commit/5dd957b3cb893668f044497d25b6eee69b05b2f0)]:
  - @ledgerhq/cryptoassets@6.34.0
  - @ledgerhq/hw-app-eth@6.29.6

## 27.1.0-next.6

### Minor Changes

- [#1155](https://github.com/LedgerHQ/ledger-live/pull/1155) [`3849ee3f30`](https://github.com/LedgerHQ/ledger-live/commit/3849ee3f30987b51d648ce29bfee4721f4ddff5f) Thanks [@sarneijim](https://github.com/sarneijim)! - Add requirement to cosmos banner

## 27.1.0-next.5

### Patch Changes

- [#1097](https://github.com/LedgerHQ/ledger-live/pull/1097) [`936b6dc545`](https://github.com/LedgerHQ/ledger-live/commit/936b6dc5450fcd69a31e03fa2040346d512c0912) Thanks [@alexandremgo](https://github.com/alexandremgo)! - New BLE pairing flow

  Not yet used in production. Accessible from the debug menu.

  Features:

  - scanning and pairing: one screen to go to from anywhere
  - navigate to after pairing success: configuration of the screen (and its associated navigator) with params and name of the route param that will have newly paired device info
  - scanning: filtering on device models
  - scanning: filtering out or displaying already known devices
  - pairing: new animation for pairing (lotties placeholders for now)
  - pairing: possibility to add (or not) the newly paired device to the "known devices" of the app (redux store)

## 27.1.0-next.4

### Minor Changes

- [#744](https://github.com/LedgerHQ/ledger-live/pull/744) [`0ebdec50bf`](https://github.com/LedgerHQ/ledger-live/commit/0ebdec50bfca81b2d814726f8f9a82237ad42ffc) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add an EVM based family in LLC

## 27.1.0-next.3

### Minor Changes

- [#1059](https://github.com/LedgerHQ/ledger-live/pull/1059) [`685348dd35`](https://github.com/LedgerHQ/ledger-live/commit/685348dd351181a9ed7f23cedb3e3d289b16fe9e) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - fix glitch on tx value when sending tokens

* [#963](https://github.com/LedgerHQ/ledger-live/pull/963) [`dd538c3723`](https://github.com/LedgerHQ/ledger-live/commit/dd538c3723853334ce19a89353f20766432d12fd) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - replace cbor lib to get rid of BigInt type

- [#1072](https://github.com/LedgerHQ/ledger-live/pull/1072) [`0601b6541f`](https://github.com/LedgerHQ/ledger-live/commit/0601b6541f10635aea72f916626432a334aa49fa) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - display fees on historical transactions properly

## 27.1.0-next.2

### Minor Changes

- [#1017](https://github.com/LedgerHQ/ledger-live/pull/1017) [`21ed0bd521`](https://github.com/LedgerHQ/ledger-live/commit/21ed0bd5219a3629abc0bbb547fc4d75f5e71300) Thanks [@sarneijim](https://github.com/sarneijim)! - Add cosmos account banner util

### Patch Changes

- [#1109](https://github.com/LedgerHQ/ledger-live/pull/1109) [`8fe44e12d7`](https://github.com/LedgerHQ/ledger-live/commit/8fe44e12d73fe96636282666dd8f3b02ef96d0e6) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Switch Ethereum Goerli explorer env from staging to prod

## 27.1.0-next.1

### Minor Changes

- [#669](https://github.com/LedgerHQ/ledger-live/pull/669) [`b615140ba2`](https://github.com/LedgerHQ/ledger-live/commit/b615140ba2e326e1466d15f123d412ea90db3754) Thanks [@andyhass](https://github.com/andyhass)! - Add Celo Staking

* [#954](https://github.com/LedgerHQ/ledger-live/pull/954) [`336eb879a8`](https://github.com/LedgerHQ/ledger-live/commit/336eb879a80573fd81027232c4c6c9b383bd2a97) Thanks [@andyhass](https://github.com/andyhass)! - The Ledger QA team discovered that an error could occur when calculating the max spendable and max non-voting locked balance when pending operations existed. These balances are set when the account syncs, and these balances will not take into account pending operations - leaving it to be higher than it truly is. This results in a runtime error related to trying to create a transaction that is larger than the respective balance.

- [#856](https://github.com/LedgerHQ/ledger-live/pull/856) [`3615a06f19`](https://github.com/LedgerHQ/ledger-live/commit/3615a06f19ef659480d50a1a1a28f6df952b117a) Thanks [@andyhass](https://github.com/andyhass)! - Gracefully handle when user reaches the maximum number of Celo validator groups they can vote for.

### Patch Changes

- Updated dependencies [[`b615140ba2`](https://github.com/LedgerHQ/ledger-live/commit/b615140ba2e326e1466d15f123d412ea90db3754)]:
  - @ledgerhq/cryptoassets@6.34.0-next.1
  - @ledgerhq/hw-app-eth@6.29.6-next.1

## 27.0.1-next.0

### Patch Changes

- [#1025](https://github.com/LedgerHQ/ledger-live/pull/1025) [`7e812a738d`](https://github.com/LedgerHQ/ledger-live/commit/7e812a738db718200138dcb9b7bcc2f6dd0ddd6f) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: hooks for genuine check and get latest available firmware

* [#1092](https://github.com/LedgerHQ/ledger-live/pull/1092) [`058a1af7ff`](https://github.com/LedgerHQ/ledger-live/commit/058a1af7ff463d21afe85d03563b61e1d543c95b) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Safe serialization & reconciliation when no account resources

- [#956](https://github.com/LedgerHQ/ledger-live/pull/956) [`d6634bc0b7`](https://github.com/LedgerHQ/ledger-live/commit/d6634bc0b720d8a13f3681caf33e2f23d5c64968) Thanks [@pavanvora](https://github.com/pavanvora)! - fix estimateMaxSpendable for Cardano

* [#1083](https://github.com/LedgerHQ/ledger-live/pull/1083) [`5da717c523`](https://github.com/LedgerHQ/ledger-live/commit/5da717c523db7678edeb0f86bdfa88256dfe96c4) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add missing safety check on bitcoinResources

* Updated dependencies [[`e80336b284`](https://github.com/LedgerHQ/ledger-live/commit/e80336b28478b3eca7a1c477b43cc512ba38a710), [`318e804525`](https://github.com/LedgerHQ/ledger-live/commit/318e80452569a0f91c4363ae50d2664419251dbd), [`e80336b284`](https://github.com/LedgerHQ/ledger-live/commit/e80336b28478b3eca7a1c477b43cc512ba38a710), [`5dd957b3cb`](https://github.com/LedgerHQ/ledger-live/commit/5dd957b3cb893668f044497d25b6eee69b05b2f0)]:
  - @ledgerhq/cryptoassets@6.34.0-next.0
  - @ledgerhq/hw-app-eth@6.29.6-next.0

## 26.0.0

### Major Changes

- [#918](https://github.com/LedgerHQ/ledger-live/pull/918) [`a36d1de865`](https://github.com/LedgerHQ/ledger-live/commit/a36d1de865fd318051c46335d1c86f5cf12b2100) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - fix useAllAmount usage when fees are higher than balance

### Minor Changes

- [#764](https://github.com/LedgerHQ/ledger-live/pull/764) [`ebe1adfb7d`](https://github.com/LedgerHQ/ledger-live/commit/ebe1adfb7d264da0f8c9e30b84c188eaa931d1e6) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added development firmware detection to getDeviceInfo

* [#451](https://github.com/LedgerHQ/ledger-live/pull/451) [`134355d561`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Type libraries usage in LLC, LLD, LLM, CLI

- [#723](https://github.com/LedgerHQ/ledger-live/pull/723) [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1) Thanks [@marco-figment](https://github.com/marco-figment)! - Osmosis Send, Receive and Staking + Cosmos refactor

  For additional context on what changed:

  - Ledger Live Desktop: functionality for Osmosis send, receive and staking.
  - Ledger Live Desktop: refactor of some Cosmos components to enable reusing some components for Osmosis.
    and easily integrate future Cosmos-based cryptocurrencies.

  - Ledger Live Common: functionality for Osmosis send, receive and staking.
  - Ledger Live Common: refactor of some Cosmos modules to enable reusing code for Osmosis.
    Notable changes are: renaming the hook useCosmosPreloadData to useCosmosFamilyPreloadData and turning
    validators.ts and js-synchronisation.ts into classes.

  - Ledger Live Mobile: only marked as major because the useCosmosPreloadData hook changed name, which is a breaking change.

  - Cryptoassets: updated a URL in the Osmosis cryptocurrency definition.

  - Live CLI: updated references to cosmosSourceValidators to sourceValidators for re-usability.

### Patch Changes

- [#665](https://github.com/LedgerHQ/ledger-live/pull/665) [`37159cbb9e`](https://github.com/LedgerHQ/ledger-live/commit/37159cbb9e0023b65593e4ed71557f80bf48989e) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Update @polkadot dependencies

* [#664](https://github.com/LedgerHQ/ledger-live/pull/664) [`3dbd4d0781`](https://github.com/LedgerHQ/ledger-live/commit/3dbd4d0781569cd0bfce575854e706def2bd951f) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Update taquito dependency

- [#803](https://github.com/LedgerHQ/ledger-live/pull/803) [`1a33d8641f`](https://github.com/LedgerHQ/ledger-live/commit/1a33d8641f9d1b4e4adfa262a179f124918e0ff5) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Reduce limit param in Stellar requests to avoid 503 "object too large" errors from infra

* [#882](https://github.com/LedgerHQ/ledger-live/pull/882) [`807f3feb94`](https://github.com/LedgerHQ/ledger-live/commit/807f3feb947ffd31d47d43b5aa7b8e85f2bbf6d8) Thanks [@Justkant](https://github.com/Justkant)! - fix: bump platform API version [LIVE-3181]

- [#850](https://github.com/LedgerHQ/ledger-live/pull/850) [`f4b7894426`](https://github.com/LedgerHQ/ledger-live/commit/f4b7894426341f5b909ba3a2422ae2b8ecf31466) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - cardano address validation fix

* [#779](https://github.com/LedgerHQ/ledger-live/pull/779) [`97eab434de`](https://github.com/LedgerHQ/ledger-live/commit/97eab434dee361716588b256146665c99c274af9) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Refactoring of useOnboardingStatePolling bringing 2 changes:

  - avoid re-rendering: the hook only updates its result on a new onboardingState or new allowedError, not at every run
  - update of useOnboardingStatePolling args: getOnboardingStatePolling as an optional injected dependency to the hook. It is needed for LLD to have the polling working on the internal thread. It is set by default to live-common/hw/getOnboardingStatePolling so it is not needed to pass it as an arg to use the hook on LLM.

* Updated dependencies [[`134355d561`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4), [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1), [`e2a9cfad63`](https://github.com/LedgerHQ/ledger-live/commit/e2a9cfad63f3c8fddf4660942a53545eabb03d6b)]:
  - @ledgerhq/cryptoassets@6.32.0
  - @ledgerhq/hw-app-eth@6.29.4

## 27.0.0

### Major Changes

- [#918](https://github.com/LedgerHQ/ledger-live/pull/918) [`a36d1de865`](https://github.com/LedgerHQ/ledger-live/commit/a36d1de865fd318051c46335d1c86f5cf12b2100) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - fix useAllAmount usage when fees are higher than balance

### Minor Changes

- [#492](https://github.com/LedgerHQ/ledger-live/pull/492) [`d679e5feeb`](https://github.com/LedgerHQ/ledger-live/commit/d679e5feebc02e7cd138e1026b7bad5392866ea2) Thanks [@grsoares21](https://github.com/grsoares21)! - Adds device action logic for installing and uninstalling language packs

* [#998](https://github.com/LedgerHQ/ledger-live/pull/998) [`c7aaafa769`](https://github.com/LedgerHQ/ledger-live/commit/c7aaafa76924252f3c7e30371012bd0e69d8100a) Thanks [@github-actions](https://github.com/apps/github-actions)! - Added development/QA tool for feature flags [Desktop]

- [#723](https://github.com/LedgerHQ/ledger-live/pull/723) [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1) Thanks [@marco-figment](https://github.com/marco-figment)! - Osmosis Send, Receive and Staking + Cosmos refactor

  For additional context on what changed:

  - Ledger Live Desktop: functionality for Osmosis send, receive and staking.
  - Ledger Live Desktop: refactor of some Cosmos components to enable reusing some components for Osmosis.
    and easily integrate future Cosmos-based cryptocurrencies.

  - Ledger Live Common: functionality for Osmosis send, receive and staking.
  - Ledger Live Common: refactor of some Cosmos modules to enable reusing code for Osmosis.
    Notable changes are: renaming the hook useCosmosPreloadData to useCosmosFamilyPreloadData and turning
    validators.ts and js-synchronisation.ts into classes.

  - Ledger Live Mobile: only marked as major because the useCosmosPreloadData hook changed name, which is a breaking change.

  - Cryptoassets: updated a URL in the Osmosis cryptocurrency definition.

  - Live CLI: updated references to cosmosSourceValidators to sourceValidators for re-usability.

### Patch Changes

- [#998](https://github.com/LedgerHQ/ledger-live/pull/998) [`f47b2b1f47`](https://github.com/LedgerHQ/ledger-live/commit/f47b2b1f47c2256ad006ed35db9a0935e87cd503) Thanks [@github-actions](https://github.com/apps/github-actions)! - LLM: fixes import from desktop to fully sync accounts before save

* [#730](https://github.com/LedgerHQ/ledger-live/pull/730) [`6e057f7163`](https://github.com/LedgerHQ/ledger-live/commit/6e057f7163dc53658604429e3e6c8057ae9988f4) Thanks [@LFBarreto](https://github.com/LFBarreto)! - update ptx smart routing feature flag and live app web player undefined uri params

- [#970](https://github.com/LedgerHQ/ledger-live/pull/970) [`ecfdd1ebd8`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311) Thanks [@alexandremgo](https://github.com/alexandremgo)! - BLE scanning and pairing hooks

- Updated dependencies [[`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1), [`ecfdd1ebd8`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311)]:
  - @ledgerhq/cryptoassets@6.33.0
  - @ledgerhq/hw-transport@6.27.3
  - @ledgerhq/hw-app-eth@6.29.5
  - @ledgerhq/hw-app-algorand@6.27.3
  - @ledgerhq/hw-app-btc@8.0.1
  - @ledgerhq/hw-app-cosmos@6.27.3
  - @ledgerhq/hw-app-polkadot@6.27.3
  - @ledgerhq/hw-app-solana@6.27.3
  - @ledgerhq/hw-app-str@6.27.3
  - @ledgerhq/hw-app-tezos@6.27.3
  - @ledgerhq/hw-app-trx@6.27.3
  - @ledgerhq/hw-app-xrp@6.27.3
  - @ledgerhq/hw-transport-mocker@6.27.3
  - @ledgerhq/hw-transport-node-speculos@6.27.3

## 27.0.0-next.3

### Patch Changes

- [#998](https://github.com/LedgerHQ/ledger-live/pull/998) [`f47b2b1f47`](https://github.com/LedgerHQ/ledger-live/commit/f47b2b1f47c2256ad006ed35db9a0935e87cd503) Thanks [@github-actions](https://github.com/apps/github-actions)! - LLM: fixes import from desktop to fully sync accounts before save

## 27.0.0-next.2

### Major Changes

- [#918](https://github.com/LedgerHQ/ledger-live/pull/918) [`a36d1de865`](https://github.com/LedgerHQ/ledger-live/commit/a36d1de865fd318051c46335d1c86f5cf12b2100) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - fix useAllAmount usage when fees are higher than balance

### Minor Changes

- [#723](https://github.com/LedgerHQ/ledger-live/pull/723) [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1) Thanks [@marco-figment](https://github.com/marco-figment)! - Osmosis Send, Receive and Staking + Cosmos refactor

  For additional context on what changed:

  - Ledger Live Desktop: functionality for Osmosis send, receive and staking.
  - Ledger Live Desktop: refactor of some Cosmos components to enable reusing some components for Osmosis.
    and easily integrate future Cosmos-based cryptocurrencies.

  - Ledger Live Common: functionality for Osmosis send, receive and staking.
  - Ledger Live Common: refactor of some Cosmos modules to enable reusing code for Osmosis.
    Notable changes are: renaming the hook useCosmosPreloadData to useCosmosFamilyPreloadData and turning
    validators.ts and js-synchronisation.ts into classes.

  - Ledger Live Mobile: only marked as major because the useCosmosPreloadData hook changed name, which is a breaking change.

  - Cryptoassets: updated a URL in the Osmosis cryptocurrency definition.

  - Live CLI: updated references to cosmosSourceValidators to sourceValidators for re-usability.

### Patch Changes

- Updated dependencies [[`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1)]:
  - @ledgerhq/cryptoassets@6.33.0-next.0
  - @ledgerhq/hw-app-eth@6.29.5-next.1

## 26.1.0-next.1

### Minor Changes

- [#492](https://github.com/LedgerHQ/ledger-live/pull/492) [`d679e5feeb`](https://github.com/LedgerHQ/ledger-live/commit/d679e5feebc02e7cd138e1026b7bad5392866ea2) Thanks [@grsoares21](https://github.com/grsoares21)! - Adds device action logic for installing and uninstalling language packs

## 26.1.0-next.0

### Minor Changes

- [#814](https://github.com/LedgerHQ/ledger-live/pull/814) [`23c9bf994`](https://github.com/LedgerHQ/ledger-live/commit/23c9bf9949169d31d534f12dca48e21e35df05b2) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added development/QA tool for feature flags [Desktop]

### Patch Changes

- [#730](https://github.com/LedgerHQ/ledger-live/pull/730) [`6e057f716`](https://github.com/LedgerHQ/ledger-live/commit/6e057f7163dc53658604429e3e6c8057ae9988f4) Thanks [@LFBarreto](https://github.com/LFBarreto)! - update ptx smart routing feature flag and live app web player undefined uri params

* [#970](https://github.com/LedgerHQ/ledger-live/pull/970) [`ecfdd1ebd`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311) Thanks [@alexandremgo](https://github.com/alexandremgo)! - BLE scanning and pairing hooks

* Updated dependencies [[`ecfdd1ebd`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311)]:
  - @ledgerhq/hw-transport@6.27.3-next.0
  - @ledgerhq/hw-app-algorand@6.27.3-next.0
  - @ledgerhq/hw-app-btc@8.0.1-next.0
  - @ledgerhq/hw-app-cosmos@6.27.3-next.0
  - @ledgerhq/hw-app-eth@6.29.5-next.0
  - @ledgerhq/hw-app-polkadot@6.27.3-next.0
  - @ledgerhq/hw-app-solana@6.27.3-next.0
  - @ledgerhq/hw-app-str@6.27.3-next.0
  - @ledgerhq/hw-app-tezos@6.27.3-next.0
  - @ledgerhq/hw-app-trx@6.27.3-next.0
  - @ledgerhq/hw-app-xrp@6.27.3-next.0
  - @ledgerhq/hw-transport-mocker@6.27.3-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.3-next.0

## 26.0.0

### Major Changes

- [#918](https://github.com/LedgerHQ/ledger-live/pull/918) [`a36d1de865`](https://github.com/LedgerHQ/ledger-live/commit/a36d1de865fd318051c46335d1c86f5cf12b2100) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - fix useAllAmount usage when fees are higher than balance

### Minor Changes

- [#764](https://github.com/LedgerHQ/ledger-live/pull/764) [`ebe1adfb7d`](https://github.com/LedgerHQ/ledger-live/commit/ebe1adfb7d264da0f8c9e30b84c188eaa931d1e6) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added development firmware detection to getDeviceInfo

* [#451](https://github.com/LedgerHQ/ledger-live/pull/451) [`134355d561`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Type libraries usage in LLC, LLD, LLM, CLI

- [#723](https://github.com/LedgerHQ/ledger-live/pull/723) [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1) Thanks [@marco-figment](https://github.com/marco-figment)! - Osmosis Send, Receive and Staking + Cosmos refactor

  For additional context on what changed:

  - Ledger Live Desktop: functionality for Osmosis send, receive and staking.
  - Ledger Live Desktop: refactor of some Cosmos components to enable reusing some components for Osmosis.
    and easily integrate future Cosmos-based cryptocurrencies.

  - Ledger Live Common: functionality for Osmosis send, receive and staking.
  - Ledger Live Common: refactor of some Cosmos modules to enable reusing code for Osmosis.
    Notable changes are: renaming the hook useCosmosPreloadData to useCosmosFamilyPreloadData and turning
    validators.ts and js-synchronisation.ts into classes.

  - Ledger Live Mobile: only marked as major because the useCosmosPreloadData hook changed name, which is a breaking change.

  - Cryptoassets: updated a URL in the Osmosis cryptocurrency definition.

  - Live CLI: updated references to cosmosSourceValidators to sourceValidators for re-usability.

### Patch Changes

- [#665](https://github.com/LedgerHQ/ledger-live/pull/665) [`37159cbb9e`](https://github.com/LedgerHQ/ledger-live/commit/37159cbb9e0023b65593e4ed71557f80bf48989e) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Update @polkadot dependencies

* [#664](https://github.com/LedgerHQ/ledger-live/pull/664) [`3dbd4d0781`](https://github.com/LedgerHQ/ledger-live/commit/3dbd4d0781569cd0bfce575854e706def2bd951f) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Update taquito dependency

- [#803](https://github.com/LedgerHQ/ledger-live/pull/803) [`1a33d8641f`](https://github.com/LedgerHQ/ledger-live/commit/1a33d8641f9d1b4e4adfa262a179f124918e0ff5) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Reduce limit param in Stellar requests to avoid 503 "object too large" errors from infra

* [#882](https://github.com/LedgerHQ/ledger-live/pull/882) [`807f3feb94`](https://github.com/LedgerHQ/ledger-live/commit/807f3feb947ffd31d47d43b5aa7b8e85f2bbf6d8) Thanks [@Justkant](https://github.com/Justkant)! - fix: bump platform API version [LIVE-3181]

- [#850](https://github.com/LedgerHQ/ledger-live/pull/850) [`f4b7894426`](https://github.com/LedgerHQ/ledger-live/commit/f4b7894426341f5b909ba3a2422ae2b8ecf31466) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - cardano address validation fix

* [#779](https://github.com/LedgerHQ/ledger-live/pull/779) [`97eab434de`](https://github.com/LedgerHQ/ledger-live/commit/97eab434dee361716588b256146665c99c274af9) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Refactoring of useOnboardingStatePolling bringing 2 changes:

  - avoid re-rendering: the hook only updates its result on a new onboardingState or new allowedError, not at every run
  - update of useOnboardingStatePolling args: getOnboardingStatePolling as an optional injected dependency to the hook. It is needed for LLD to have the polling working on the internal thread. It is set by default to live-common/hw/getOnboardingStatePolling so it is not needed to pass it as an arg to use the hook on LLM.

* Updated dependencies [[`134355d561`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4), [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1), [`e2a9cfad63`](https://github.com/LedgerHQ/ledger-live/commit/e2a9cfad63f3c8fddf4660942a53545eabb03d6b)]:
  - @ledgerhq/cryptoassets@6.32.0
  - @ledgerhq/hw-app-eth@6.29.4

## 26.0.0-next.2

### Major Changes

- [#918](https://github.com/LedgerHQ/ledger-live/pull/918) [`a36d1de86`](https://github.com/LedgerHQ/ledger-live/commit/a36d1de865fd318051c46335d1c86f5cf12b2100) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - fix useAllAmount usage when fees are higher than balance

## 25.2.0-next.1

### Minor Changes

- [#723](https://github.com/LedgerHQ/ledger-live/pull/723) [`0c12f3e89`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1) Thanks [@marco-figment](https://github.com/marco-figment)! - Osmosis Send, Receive and Staking + Cosmos refactor

  For additional context on what changed:

  - Ledger Live Desktop: functionality for Osmosis send, receive and staking.
  - Ledger Live Desktop: refactor of some Cosmos components to enable reusing some components for Osmosis.
    and easily integrate future Cosmos-based cryptocurrencies.

  - Ledger Live Common: functionality for Osmosis send, receive and staking.
  - Ledger Live Common: refactor of some Cosmos modules to enable reusing code for Osmosis.
    Notable changes are: renaming the hook useCosmosPreloadData to useCosmosFamilyPreloadData and turning
    validators.ts and js-synchronisation.ts into classes.

  - Ledger Live Mobile: only marked as major because the useCosmosPreloadData hook changed name, which is a breaking change.

  - Cryptoassets: updated a URL in the Osmosis cryptocurrency definition.

  - Live CLI: updated references to cosmosSourceValidators to sourceValidators for re-usability.

### Patch Changes

- Updated dependencies [[`0c12f3e89`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1)]:
  - @ledgerhq/cryptoassets@6.32.0-next.1
  - @ledgerhq/hw-app-eth@6.29.4-next.1

## 25.2.0-next.0

### Minor Changes

- [#764](https://github.com/LedgerHQ/ledger-live/pull/764) [`ebe1adfb7`](https://github.com/LedgerHQ/ledger-live/commit/ebe1adfb7d264da0f8c9e30b84c188eaa931d1e6) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added development firmware detection to getDeviceInfo

* [#451](https://github.com/LedgerHQ/ledger-live/pull/451) [`134355d56`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Type libraries usage in LLC, LLD, LLM, CLI

### Patch Changes

- [#665](https://github.com/LedgerHQ/ledger-live/pull/665) [`37159cbb9`](https://github.com/LedgerHQ/ledger-live/commit/37159cbb9e0023b65593e4ed71557f80bf48989e) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Update @polkadot dependencies

* [#664](https://github.com/LedgerHQ/ledger-live/pull/664) [`3dbd4d078`](https://github.com/LedgerHQ/ledger-live/commit/3dbd4d0781569cd0bfce575854e706def2bd951f) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Update taquito dependency

- [#803](https://github.com/LedgerHQ/ledger-live/pull/803) [`1a33d8641`](https://github.com/LedgerHQ/ledger-live/commit/1a33d8641f9d1b4e4adfa262a179f124918e0ff5) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Reduce limit param in Stellar requests to avoid 503 "object too large" errors from infra

* [#882](https://github.com/LedgerHQ/ledger-live/pull/882) [`807f3feb9`](https://github.com/LedgerHQ/ledger-live/commit/807f3feb947ffd31d47d43b5aa7b8e85f2bbf6d8) Thanks [@Justkant](https://github.com/Justkant)! - fix: bump platform API version [LIVE-3181]

- [#850](https://github.com/LedgerHQ/ledger-live/pull/850) [`f4b789442`](https://github.com/LedgerHQ/ledger-live/commit/f4b7894426341f5b909ba3a2422ae2b8ecf31466) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - cardano address validation fix

* [#779](https://github.com/LedgerHQ/ledger-live/pull/779) [`97eab434d`](https://github.com/LedgerHQ/ledger-live/commit/97eab434dee361716588b256146665c99c274af9) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Refactoring of useOnboardingStatePolling bringing 2 changes:

  - avoid re-rendering: the hook only updates its result on a new onboardingState or new allowedError, not at every run
  - update of useOnboardingStatePolling args: getOnboardingStatePolling as an optional injected dependency to the hook. It is needed for LLD to have the polling working on the internal thread. It is set by default to live-common/hw/getOnboardingStatePolling so it is not needed to pass it as an arg to use the hook on LLM.

* Updated dependencies [[`134355d56`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4), [`e2a9cfad6`](https://github.com/LedgerHQ/ledger-live/commit/e2a9cfad63f3c8fddf4660942a53545eabb03d6b)]:
  - @ledgerhq/cryptoassets@6.32.0-next.0
  - @ledgerhq/hw-app-eth@6.29.4-next.0

## 25.1.0

### Minor Changes

- [#731](https://github.com/LedgerHQ/ledger-live/pull/731) [`0e115ae5c`](https://github.com/LedgerHQ/ledger-live/commit/0e115ae5cd7ddcc728d9f435dc4084cedb53beed) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Update UI for manager app install/uninstall buttons

* [#507](https://github.com/LedgerHQ/ledger-live/pull/507) [`3bdbfd3cb`](https://github.com/LedgerHQ/ledger-live/commit/3bdbfd3cbc0153a2ebf4ab91f631cb9f6e42d74c) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Push notifications support added to ledger live mobile, new 'notifications' section added to the settings to enable or disable them, new modal added to ask the user if he wants to allow the notifications

### Patch Changes

- [#709](https://github.com/LedgerHQ/ledger-live/pull/709) [`f10d01171`](https://github.com/LedgerHQ/ledger-live/commit/f10d01171f4c0869d1d82e6cc5402da9ca80990b) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Update Polkadot app minimum version to 13.9250.0

* [#673](https://github.com/LedgerHQ/ledger-live/pull/673) [`aa2794813`](https://github.com/LedgerHQ/ledger-live/commit/aa2794813c05b1b39272814cc803cd662662584c) Thanks [@gre](https://github.com/gre)! - Introduce env TEZOS_MAX_TX_QUERIES to configure safe max amount of transaction http fetches for a tezos sync. Increase the default to 100.

- [#748](https://github.com/LedgerHQ/ledger-live/pull/748) [`8afb69530`](https://github.com/LedgerHQ/ledger-live/commit/8afb69530292fa1f41f2fc78b38639134b1fe16f) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fixing support for EIP-712 in hw-signMessage for walletconnect and SDK

* [#707](https://github.com/LedgerHQ/ledger-live/pull/707) [`331794cfb`](https://github.com/LedgerHQ/ledger-live/commit/331794cfbdb901f9224fed759c57f419861ec364) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add a bridge test for AmountRequired error

* Updated dependencies [[`3eeb1e18c`](https://github.com/LedgerHQ/ledger-live/commit/3eeb1e18c883eca22201fb0d882799e2f6667b58)]:
  - @ledgerhq/cryptoassets@6.31.0
  - @ledgerhq/hw-app-eth@6.29.3

## 25.1.0-next.2

### Minor Changes

- [#507](https://github.com/LedgerHQ/ledger-live/pull/507) [`3bdbfd3cb`](https://github.com/LedgerHQ/ledger-live/commit/3bdbfd3cbc0153a2ebf4ab91f631cb9f6e42d74c) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Push notifications support added to ledger live mobile, new 'notifications' section added to the settings to enable or disable them, new modal added to ask the user if he wants to allow the notifications

## 25.1.0-next.1

### Minor Changes

- [#731](https://github.com/LedgerHQ/ledger-live/pull/731) [`0e115ae5c`](https://github.com/LedgerHQ/ledger-live/commit/0e115ae5cd7ddcc728d9f435dc4084cedb53beed) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Update UI for manager app install/uninstall buttons

## 25.0.1-next.0

### Patch Changes

- [#709](https://github.com/LedgerHQ/ledger-live/pull/709) [`f10d01171`](https://github.com/LedgerHQ/ledger-live/commit/f10d01171f4c0869d1d82e6cc5402da9ca80990b) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Update Polkadot app minimum version to 13.9250.0

* [#673](https://github.com/LedgerHQ/ledger-live/pull/673) [`aa2794813`](https://github.com/LedgerHQ/ledger-live/commit/aa2794813c05b1b39272814cc803cd662662584c) Thanks [@gre](https://github.com/gre)! - Introduce env TEZOS_MAX_TX_QUERIES to configure safe max amount of transaction http fetches for a tezos sync. Increase the default to 100.

- [#748](https://github.com/LedgerHQ/ledger-live/pull/748) [`8afb69530`](https://github.com/LedgerHQ/ledger-live/commit/8afb69530292fa1f41f2fc78b38639134b1fe16f) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fixing support for EIP-712 in hw-signMessage for walletconnect and SDK

* [#707](https://github.com/LedgerHQ/ledger-live/pull/707) [`331794cfb`](https://github.com/LedgerHQ/ledger-live/commit/331794cfbdb901f9224fed759c57f419861ec364) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add a bridge test for AmountRequired error

* Updated dependencies [[`3eeb1e18c`](https://github.com/LedgerHQ/ledger-live/commit/3eeb1e18c883eca22201fb0d882799e2f6667b58)]:
  - @ledgerhq/cryptoassets@6.31.0-next.0
  - @ledgerhq/hw-app-eth@6.29.3-next.0

## 25.0.0

### Major Changes

- [#364](https://github.com/LedgerHQ/ledger-live/pull/364) [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8) Thanks [@elbywan](https://github.com/elbywan)! - #### Replace [webpack](https://webpack.js.org/) with [vite.js](https://vitejs.dev/) to speed up the ledger live desktop development process.

  To fully embrace the "bundleless" vite.js approach, it is necessary to transpile our packages contained in the monorepository to the ESM format, and [subpath exports](https://nodejs.org/api/packages.html#subpath-exports) have been added to silently map to commonjs or esm depending on the need.

  #### 🔥 BREAKING CHANGES for `@ledgerhq/live-common`, `@ledgerhq/devices` and `@ledgerhq/hw-app-btc` consumers.

  As highlighted [here](https://github.com/nodejs/node#39994), it is not possible to target folders directly when using subpath exports.

  The workaround is to suffix the call with `/index` (or `/`).

  For instance…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies";
  ```

  …must be rewritten to…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/index;";
  ```

  …or:

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/;";
  ```

### Minor Changes

- [#462](https://github.com/LedgerHQ/ledger-live/pull/462) [`816f2b7e9`](https://github.com/LedgerHQ/ledger-live/commit/816f2b7e942967bf0ed670dc43464521bd0b5d01) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of Cardano tokens in LLD

* [#602](https://github.com/LedgerHQ/ledger-live/pull/602) [`7c15869a7`](https://github.com/LedgerHQ/ledger-live/commit/7c15869a7a2cf74f849f8cf0fe13b66133ff673a) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Accept new message.sign call from the live-app-sdk

- [#460](https://github.com/LedgerHQ/ledger-live/pull/460) [`e4b7dc326`](https://github.com/LedgerHQ/ledger-live/commit/e4b7dc32664d32b43dfae2821c29715ae94a6ab4) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Create index in real time instead of loading from app.json for btc wallet. Fix bug: https://ledgerhq.atlassian.net/browse/LIVE-2495

* [#81](https://github.com/LedgerHQ/ledger-live/pull/81) [`76b2825e8`](https://github.com/LedgerHQ/ledger-live/commit/76b2825e84730e9d5a2f7906abd7c00a191de4db) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - feat: add ERC20 token support to the Platform API

- [#624](https://github.com/LedgerHQ/ledger-live/pull/624) [`947c33140`](https://github.com/LedgerHQ/ledger-live/commit/947c33140e906ca35bf1fbfdf7831e28fe99dd67) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Add Searching bar for validators list of ATOM and SOL

* [#471](https://github.com/LedgerHQ/ledger-live/pull/471) [`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of Stellar assets (tokens)

- [#104](https://github.com/LedgerHQ/ledger-live/pull/104) [`6adbe47e2`](https://github.com/LedgerHQ/ledger-live/commit/6adbe47e2d3037a9a53e5a59b4198f265f644bdf) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add memo capability to hedera coin family.

### Patch Changes

- [#486](https://github.com/LedgerHQ/ledger-live/pull/486) [`345706e24`](https://github.com/LedgerHQ/ledger-live/commit/345706e24e91ba4c397d4a6ffc1b2b174a0ddc84) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLC - Countervalues API - updated pairs method to use new GET format

* [#627](https://github.com/LedgerHQ/ledger-live/pull/627) [`2de4b99c0`](https://github.com/LedgerHQ/ledger-live/commit/2de4b99c0c36766474d5ea037615f9f69942e905) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix undefined xpub bug and the field "hash" to "id" migration bug

- [#547](https://github.com/LedgerHQ/ledger-live/pull/547) [`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f) Thanks [@gre](https://github.com/gre)! - Improve stacktrace in custom errors

- Updated dependencies [[`e142b9484`](https://github.com/LedgerHQ/ledger-live/commit/e142b9484e6371539fb392c002e1ebaf7802542b), [`816f2b7e9`](https://github.com/LedgerHQ/ledger-live/commit/816f2b7e942967bf0ed670dc43464521bd0b5d01), [`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f), [`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0), [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/cryptoassets@6.30.0
  - @ledgerhq/errors@6.10.1
  - @ledgerhq/devices@7.0.0
  - @ledgerhq/hw-app-btc@8.0.0
  - @ledgerhq/hw-app-eth@6.29.2
  - @ledgerhq/hw-app-algorand@6.27.2
  - @ledgerhq/hw-app-cosmos@6.27.2
  - @ledgerhq/hw-app-polkadot@6.27.2
  - @ledgerhq/hw-app-solana@6.27.2
  - @ledgerhq/hw-app-trx@6.27.2
  - @ledgerhq/hw-transport@6.27.2
  - @ledgerhq/hw-transport-node-speculos@6.27.2
  - @ledgerhq/hw-app-str@6.27.2
  - @ledgerhq/hw-app-tezos@6.27.2
  - @ledgerhq/hw-app-xrp@6.27.2
  - @ledgerhq/hw-transport-mocker@6.27.2

## 25.0.0-next.6

### Minor Changes

- [#624](https://github.com/LedgerHQ/ledger-live/pull/624) [`947c33140`](https://github.com/LedgerHQ/ledger-live/commit/947c33140e906ca35bf1fbfdf7831e28fe99dd67) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Add Searching bar for validators list of ATOM and SOL

## 25.0.0-next.5

### Minor Changes

- [#462](https://github.com/LedgerHQ/ledger-live/pull/462) [`816f2b7e9`](https://github.com/LedgerHQ/ledger-live/commit/816f2b7e942967bf0ed670dc43464521bd0b5d01) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of Cardano tokens in LLD

### Patch Changes

- Updated dependencies [[`816f2b7e9`](https://github.com/LedgerHQ/ledger-live/commit/816f2b7e942967bf0ed670dc43464521bd0b5d01)]:
  - @ledgerhq/cryptoassets@6.30.0-next.2
  - @ledgerhq/hw-app-eth@6.29.2-next.2

## 25.0.0-next.4

### Minor Changes

- [#104](https://github.com/LedgerHQ/ledger-live/pull/104) [`6adbe47e2`](https://github.com/LedgerHQ/ledger-live/commit/6adbe47e2d3037a9a53e5a59b4198f265f644bdf) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add memo capability to hedera coin family.

## 25.0.0-next.3

### Minor Changes

- [#81](https://github.com/LedgerHQ/ledger-live/pull/81) [`76b2825e8`](https://github.com/LedgerHQ/ledger-live/commit/76b2825e84730e9d5a2f7906abd7c00a191de4db) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - feat: add ERC20 token support to the Platform API

## 25.0.0-next.2

### Patch Changes

- [#486](https://github.com/LedgerHQ/ledger-live/pull/486) [`345706e24`](https://github.com/LedgerHQ/ledger-live/commit/345706e24e91ba4c397d4a6ffc1b2b174a0ddc84) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLC - Countervalues API - updated pairs method to use new GET format

## 25.0.0-next.1

### Minor Changes

- [#471](https://github.com/LedgerHQ/ledger-live/pull/471) [`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of Stellar assets (tokens)

### Patch Changes

- Updated dependencies [[`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0)]:
  - @ledgerhq/cryptoassets@6.30.0-next.1
  - @ledgerhq/hw-app-eth@6.29.2-next.1

## 25.0.0-next.0

### Major Changes

- [#364](https://github.com/LedgerHQ/ledger-live/pull/364) [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8) Thanks [@elbywan](https://github.com/elbywan)! - #### Replace [webpack](https://webpack.js.org/) with [vite.js](https://vitejs.dev/) to speed up the ledger live desktop development process.

  To fully embrace the "bundleless" vite.js approach, it is necessary to transpile our packages contained in the monorepository to the ESM format, and [subpath exports](https://nodejs.org/api/packages.html#subpath-exports) have been added to silently map to commonjs or esm depending on the need.

  #### 🔥 BREAKING CHANGES for `@ledgerhq/live-common`, `@ledgerhq/devices` and `@ledgerhq/hw-app-btc` consumers.

  As highlighted [here](https://github.com/nodejs/node#39994), it is not possible to target folders directly when using subpath exports.

  The workaround is to suffix the call with `/index` (or `/`).

  For instance…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies";
  ```

  …must be rewritten to…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/index;";
  ```

  …or:

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/;";
  ```

### Minor Changes

- [#602](https://github.com/LedgerHQ/ledger-live/pull/602) [`7c15869a7`](https://github.com/LedgerHQ/ledger-live/commit/7c15869a7a2cf74f849f8cf0fe13b66133ff673a) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Accept new message.sign call from the live-app-sdk

* [#460](https://github.com/LedgerHQ/ledger-live/pull/460) [`e4b7dc326`](https://github.com/LedgerHQ/ledger-live/commit/e4b7dc32664d32b43dfae2821c29715ae94a6ab4) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Create index in real time instead of loading from app.json for btc wallet. Fix bug: https://ledgerhq.atlassian.net/browse/LIVE-2495

### Patch Changes

- [#627](https://github.com/LedgerHQ/ledger-live/pull/627) [`2de4b99c0`](https://github.com/LedgerHQ/ledger-live/commit/2de4b99c0c36766474d5ea037615f9f69942e905) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix undefined xpub bug and the field "hash" to "id" migration bug

* [#547](https://github.com/LedgerHQ/ledger-live/pull/547) [`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f) Thanks [@gre](https://github.com/gre)! - Improve stacktrace in custom errors

* Updated dependencies [[`e142b9484`](https://github.com/LedgerHQ/ledger-live/commit/e142b9484e6371539fb392c002e1ebaf7802542b), [`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f), [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/cryptoassets@6.30.0-next.0
  - @ledgerhq/errors@6.10.1-next.0
  - @ledgerhq/devices@7.0.0-next.0
  - @ledgerhq/hw-app-btc@8.0.0-next.0
  - @ledgerhq/hw-app-eth@6.29.2-next.0
  - @ledgerhq/hw-app-algorand@6.27.2-next.0
  - @ledgerhq/hw-app-cosmos@6.27.2-next.0
  - @ledgerhq/hw-app-polkadot@6.27.2-next.0
  - @ledgerhq/hw-app-solana@6.27.2-next.0
  - @ledgerhq/hw-app-trx@6.27.2-next.0
  - @ledgerhq/hw-transport@6.27.2-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.2-next.0
  - @ledgerhq/hw-app-str@6.27.2-next.0
  - @ledgerhq/hw-app-tezos@6.27.2-next.0
  - @ledgerhq/hw-app-xrp@6.27.2-next.0
  - @ledgerhq/hw-transport-mocker@6.27.2-next.0

## 24.1.0

### Minor Changes

- [#346](https://github.com/LedgerHQ/ledger-live/pull/346) [`60fb9efdc`](https://github.com/LedgerHQ/ledger-live/commit/60fb9efdcc9dbf72f651fd7b388d175a12bf859b) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Synchronized onboarding logic with:

  - Function to extract the device onboarding state from byte flags
  - Polling mechanism to retrieve the device onboarding state
  - Polling mechanism available as a react hook for LLM and LLD

* [#525](https://github.com/LedgerHQ/ledger-live/pull/525) [`3969bac02`](https://github.com/LedgerHQ/ledger-live/commit/3969bac02d6028ff543e61d4b67d95a6bfb14dfe) Thanks [@laure-lebon](https://github.com/laure-lebon)! - Filter added to empty delegation inside array when amount is egal to zero

### Patch Changes

- [#560](https://github.com/LedgerHQ/ledger-live/pull/560) [`414fa596a`](https://github.com/LedgerHQ/ledger-live/commit/414fa596a88aafdce676ac3fb349f41f302ea860) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix crash when there is a transaction with no input for bitcoin. LIVE-2748

* [#408](https://github.com/LedgerHQ/ledger-live/pull/408) [`4c02cf2e0`](https://github.com/LedgerHQ/ledger-live/commit/4c02cf2e0c393ad8d9cc5339e7b63eefb297e2cb) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix reorg causing a failed incremental sync if latest stable operaton block hash doesn't exist on chain

* Updated dependencies [[`89387dee6`](https://github.com/LedgerHQ/ledger-live/commit/89387dee6dfc2a63fa29665ab5524f3950d3ce0e)]:
  - @ledgerhq/hw-app-btc@7.0.0

## 24.1.0-next.1

### Patch Changes

- [#408](https://github.com/LedgerHQ/ledger-live/pull/408) [`4c02cf2e0`](https://github.com/LedgerHQ/ledger-live/commit/4c02cf2e0c393ad8d9cc5339e7b63eefb297e2cb) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix reorg causing a failed incremental sync if latest stable operaton block hash doesn't exist on chain

## 24.1.0-next.0

### Minor Changes

- [#346](https://github.com/LedgerHQ/ledger-live/pull/346) [`60fb9efdc`](https://github.com/LedgerHQ/ledger-live/commit/60fb9efdcc9dbf72f651fd7b388d175a12bf859b) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Synchronized onboarding logic with:

  - Function to extract the device onboarding state from byte flags
  - Polling mechanism to retrieve the device onboarding state
  - Polling mechanism available as a react hook for LLM and LLD

* [#525](https://github.com/LedgerHQ/ledger-live/pull/525) [`3969bac02`](https://github.com/LedgerHQ/ledger-live/commit/3969bac02d6028ff543e61d4b67d95a6bfb14dfe) Thanks [@laure-lebon](https://github.com/laure-lebon)! - Filter added to empty delegation inside array when amount is egal to zero

### Patch Changes

- [#560](https://github.com/LedgerHQ/ledger-live/pull/560) [`414fa596a`](https://github.com/LedgerHQ/ledger-live/commit/414fa596a88aafdce676ac3fb349f41f302ea860) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix crash when there is a transaction with no input for bitcoin. LIVE-2748

- Updated dependencies [[`89387dee6`](https://github.com/LedgerHQ/ledger-live/commit/89387dee6dfc2a63fa29665ab5524f3950d3ce0e)]:
  - @ledgerhq/hw-app-btc@7.0.0-next.0

## 24.0.0

### Major Changes

- [#352](https://github.com/LedgerHQ/ledger-live/pull/352) [`b1e396dd8`](https://github.com/LedgerHQ/ledger-live/commit/b1e396dd89ca2787978dc7e53b7ca865133a1961) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - satstack issue fix Jira ticket: LIVE-2208 and LIVE-2170

* [#360](https://github.com/LedgerHQ/ledger-live/pull/360) [`e9decc277`](https://github.com/LedgerHQ/ledger-live/commit/e9decc27785fb07972460494c8ef39e92b0127a1) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - change tags for glif derivation modes

### Minor Changes

- [#321](https://github.com/LedgerHQ/ledger-live/pull/321) [`c5714333b`](https://github.com/LedgerHQ/ledger-live/commit/c5714333bdb1c90a29c20c7e5793184d89967142) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Adding optimistic operations to NFT transfers

* [#375](https://github.com/LedgerHQ/ledger-live/pull/375) [`d22452817`](https://github.com/LedgerHQ/ledger-live/commit/d224528174313bc4975e62d015adf928d4315620) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Fix Tezos synchronisation with originating type

- [#385](https://github.com/LedgerHQ/ledger-live/pull/385) [`5145781e5`](https://github.com/LedgerHQ/ledger-live/commit/5145781e599fcb64be13695620988951bb805a3e) Thanks [@lambertkevin](https://github.com/lambertkevin)! - NFT counter value added on LLM and LLD with feature flagging

* [#502](https://github.com/LedgerHQ/ledger-live/pull/502) [`bdc76d75f`](https://github.com/LedgerHQ/ledger-live/commit/bdc76d75f9643129384c76ac9868e160c4b52062) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Bitcoin Rbf new implementation. Jira ticket: LIVE-1414, LIVE-1415, LIVE-1416

- [#453](https://github.com/LedgerHQ/ledger-live/pull/453) [`10440ec3c`](https://github.com/LedgerHQ/ledger-live/commit/10440ec3c2bffa7ce8636a7838680bb3501ffe0d) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - XRP: add retry to api call

* [#399](https://github.com/LedgerHQ/ledger-live/pull/399) [`e1f2f07a2`](https://github.com/LedgerHQ/ledger-live/commit/e1f2f07a2ba1de5eab6fa10c4c800b7097c8037d) Thanks [@pavanvora](https://github.com/pavanvora)! - fix(LLC): cardano byron address validation

- [#158](https://github.com/LedgerHQ/ledger-live/pull/158) [`508e4c23b`](https://github.com/LedgerHQ/ledger-live/commit/508e4c23babd04c48e7b626ef4004fb55f3c1ba9) Thanks [@alexalouit](https://github.com/alexalouit)! - Update ledger-live-common dependency stellar-sdk to v10.1.1

### Patch Changes

- [#73](https://github.com/LedgerHQ/ledger-live/pull/73) [`99cc5bbc1`](https://github.com/LedgerHQ/ledger-live/commit/99cc5bbc10d2676ad3e621577fdbcf432d1c91a2) Thanks [@chabroA](https://github.com/chabroA)! - Handle all non final (i.e: non OK nor KO) status as pending

* [#199](https://github.com/LedgerHQ/ledger-live/pull/199) [`22531f3c3`](https://github.com/LedgerHQ/ledger-live/commit/22531f3c377191d56bc5d5635f1174fb32b01957) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Update expected steps labels for Cosmos device actions

- [#418](https://github.com/LedgerHQ/ledger-live/pull/418) [`2012b5477`](https://github.com/LedgerHQ/ledger-live/commit/2012b54773b6391f353903564a247ad02be1a296) Thanks [@gre](https://github.com/gre)! - Drop deprecated "Portfolio V1"

* [#73](https://github.com/LedgerHQ/ledger-live/pull/73) [`99cc5bbc1`](https://github.com/LedgerHQ/ledger-live/commit/99cc5bbc10d2676ad3e621577fdbcf432d1c91a2) Thanks [@chabroA](https://github.com/chabroA)! - Add loading spinner on "From amount" field in Swap form when using "Send max" toggle

- [#332](https://github.com/LedgerHQ/ledger-live/pull/332) [`1e4a5647b`](https://github.com/LedgerHQ/ledger-live/commit/1e4a5647b39c0f806bc311383b49a246fbe453eb) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Patching shouldUpgrade & mustUpgrade logic to allow for pre-release tags that were considered always considered as false before

- Updated dependencies [[`6e956f22b`](https://github.com/LedgerHQ/ledger-live/commit/6e956f22bdf96f7a902b48a8cd231a34053d459b)]:
  - @ledgerhq/cryptoassets@6.29.0
  - @ledgerhq/hw-app-eth@6.29.1

## 24.0.0-next.4

### Major Changes

- [#502](https://github.com/LedgerHQ/ledger-live/pull/502) [`bdc76d75f`](https://github.com/LedgerHQ/ledger-live/commit/bdc76d75f9643129384c76ac9868e160c4b52062) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Bitcoin Rbf new implementation. Jira ticket: LIVE-1414, LIVE-1415, LIVE-1416

## 24.0.0-next.3

### Minor Changes

- 5145781e5: NFT counter value added on LLM and LLD with feature flagging

## 24.0.0-next.2

### Minor Changes

- c5714333b: Adding optimistic operations to NFT transfers

## 24.0.0-next.1

### Patch Changes

- 99cc5bbc1: Handle all non final (i.e: non OK nor KO) status as pending
- 99cc5bbc1: Add loading spinner on "From amount" field in Swap form when using "Send max" toggle

## 24.0.0-next.0

### Major Changes

- b1e396dd8: satstack issue fix Jira ticket: LIVE-2208 and LIVE-2170
- e9decc277: change tags for glif derivation modes

### Minor Changes

- d22452817: Fix Tezos synchronisation with originating type
- 10440ec3c: XRP: add retry to api call
- e1f2f07a2: fix(LLC): cardano byron address validation
- 508e4c23b: Update ledger-live-common dependency stellar-sdk to v10.1.1

### Patch Changes

- 22531f3c3: Update expected steps labels for Cosmos device actions
- 2012b5477: Drop deprecated "Portfolio V1"
- 1e4a5647b: Patching shouldUpgrade & mustUpgrade logic to allow for pre-release tags that were considered always considered as false before
- Updated dependencies [6e956f22b]
  - @ledgerhq/cryptoassets@6.29.0-next.0
  - @ledgerhq/hw-app-eth@6.29.1-next.0

## 23.1.0

### Minor Changes

- 8861c4fe0: upgrade dependencies
- ec5c4fa3d: Fix incremental sync for Cardano, use blockHeight from last operation instead of from account

### Patch Changes

- 8323d2eaa: Fix: Infinite Loading Spinner if no nano connected at start of funding flow [LIVE-2447]
- bf12e0f65: feat: sell and fund flow [LIVE-784]
- 608010c9d: Add a purchase device page embedding a webview from the ecommerce team. Also abstract webview pages logic into its own component (include Learn page's webview). Add a delayed tracking provider to send events to Adjust or Segment with an anonymised timestamp for sensible data.
- 78a64769d: Fix experimental EIP712 variable not working correctly

## 23.1.0-next.4

### Patch Changes

- 78a64769d: Fix experimental EIP712 variable not working correctly

## 23.1.0-next.3

### Minor Changes

- ec5c4fa3d: Fix incremental sync for Cardano, use blockHeight from last operation instead of from account

## 23.1.0-next.2

### Patch Changes

- bf12e0f65: feat: sell and fund flow [LIVE-784]

## 23.1.0-next.1

### Patch Changes

- 608010c9d: Add a purchase device page embedding a webview from the ecommerce team. Also abstract webview pages logic into its own component (include Learn page's webview). Add a delayed tracking provider to send events to Adjust or Segment with an anonymised timestamp for sensible data.

## 23.1.0-next.0

### Minor Changes

- 8861c4fe0: upgrade dependencies

### Patch Changes

- 8323d2eaa: Fix: Infinite Loading Spinner if no nano connected at start of funding flow [LIVE-2447]

## 23.0.0

### Major Changes

- 64c2fdb06: fix collision between bip44 and glif nomral derivation modes

### Minor Changes

- a66fbe852: import fix for Cardano (ADA) when doing a send it may cause invalid address
- 899aa3300: Use of the maxSpendable for bot testing instead of amount balance
- 89e82ed79: Crypto Icons - Add support for Abachi tokens icons
- 403ea8efe: Update cosmos snapshot
- 98ecc6272: First integration of Cardano (sync/send/receive)
- 64c2fdb06: Filecoin integration in LLD and LLM

### Patch Changes

- 09648db7f: refactor of the top perfs filter
- 0f59cfc10: Fix crash related to the way polkadot/crypto handles environments that lack WASM support.
- 8ee9c5568: Fix: Infinite Loading Spinner if no nano connected at start of funding flow [LIVE-2447]
- 9a86fe231: Fix the click on browse assets button on the market screen
- 8b2e24b6c: Fixing an issue with WalletConnect not accepting new connection after a first disconnection, resulting in an infite loading
- b688a592d: fix swap rate formula
- 71ad84023: Track in Sentry the uncaught errors thrown in the bridge transaction flow.
- Updated dependencies [c4be045f9]
  - @ledgerhq/hw-app-eth@6.29.0

## 23.0.0-next.4

### Patch Changes

- 8b2e24b6c: Fixing an issue with WalletConnect not accepting new connection after a first disconnection, resulting in an infite loading

## 23.0.0-next.3

### Minor Changes

- a66fbe852: import fix for Cardano (ADA) when doing a send it may cause invalid address

## 23.0.0-next.2

### Patch Changes

- 8ee9c5568: Fix: Infinite Loading Spinner if no nano connected at start of funding flow [LIVE-2447]

## 23.0.0-next.1

### Minor Changes

- 98ecc6272: First integration of Cardano (sync/send/receive)

## 23.0.0-next.0

### Major Changes

- 64c2fdb06: fix collision between bip44 and glif nomral derivation modes

### Minor Changes

- 899aa3300: Use of the maxSpendable for bot testing instead of amount balance
- 89e82ed79: Crypto Icons - Add support for Abachi tokens icons
- 403ea8efe: Update cosmos snapshot
- 64c2fdb06: Filecoin integration in LLD and LLM

### Patch Changes

- 09648db7f: refactor of the top perfs filter
- 0f59cfc10: Fix crash related to the way polkadot/crypto handles environments that lack WASM support.
- 9a86fe231: Fix the click on browse assets button on the market screen
- b688a592d: fix swap rate formula
- 71ad84023: Track in Sentry the uncaught errors thrown in the bridge transaction flow.
- Updated dependencies [c4be045f9]
  - @ledgerhq/hw-app-eth@6.29.0-next.0

## 22.2.1

### Patch Changes

- 6bcf42ecd: Fix: Infinite Loading Spinner if no nano connected at start of funding flow [LIVE-2447]

## 22.2.0

### Minor Changes

- e0c187073: Change the NFT Media components and model to use the new image processing feature from our NFT Metadata Provider. We now have multiple images and we're supporting videos.
- ee44ffb17: Cosmos Staking V1 LLD and LLC rework of delegation
- 0252fab71: LIVE-1004 Hedera first integration in LLD
- f913f6fdb: LIVE-2162 Solana staking UX improvements
- 9dadffa88: Update cosmos snapshot

### Patch Changes

- 3f816efba: Update stellar-sdk to 10.1.0
- f2574d25d: LIVE-2380 Update min Cosmos Nano app version to 2.34.4
- 04ad3813d: Add missing condition in Account page to check if account type before using isNFTActive helper. Also adds typing and unit tests to all NFT related helpers from live-common.

## 22.2.0-next.2

### Minor Changes

- 9dadffa88: Update cosmos snapshot

## 22.2.0-next.1

### Patch Changes

- 04ad3813d: Add missing condition in Account page to check if account type before using isNFTActive helper. Also adds typing and unit tests to all NFT related helpers from live-common.

## 22.2.0-next.0

### Minor Changes

- e0c18707: Change the NFT Media components and model to use the new image processing feature from our NFT Metadata Provider. We now have multiple images and we're supporting videos.
- ee44ffb1: Cosmos Staking V1 LLD and LLC rework of delegation
- 0252fab7: LIVE-1004 Hedera first integration in LLD
- f913f6fd: LIVE-2162 Solana staking UX improvements

### Patch Changes

- 3f816efb: Update stellar-sdk to 10.1.0
- f2574d25: LIVE-2380 Update min Cosmos Nano app version to 2.34.4
