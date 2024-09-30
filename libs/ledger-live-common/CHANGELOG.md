## 34.5.0-next.4

## 34.9.0

### Minor Changes

- [#7798](https://github.com/LedgerHQ/ledger-live/pull/7798) [`e0536c5`](https://github.com/LedgerHQ/ledger-live/commit/e0536c5e27a2036919abd0fd182765b32ea0112e) Thanks [@Wozacosta](https://github.com/Wozacosta)! - Add safety margin to Hedera fee estimates

### Patch Changes

- [#7621](https://github.com/LedgerHQ/ledger-live/pull/7621) [`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9) Thanks [@lambertkevin](https://github.com/lambertkevin)! - CAL update

- [#7883](https://github.com/LedgerHQ/ledger-live/pull/7883) [`f805d14`](https://github.com/LedgerHQ/ledger-live/commit/f805d1470f927824233f94eaba065b00d7af18cf) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update Axios to 1.7.7 following CVE: https://github.com/advisories/GHSA-8hc4-vh64-cxmj

- [#7780](https://github.com/LedgerHQ/ledger-live/pull/7780) [`461ddc5`](https://github.com/LedgerHQ/ledger-live/commit/461ddc56fbbe862789fe9a06db8a7e7a894e4bdd) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Remove feature flag "deviceSupportEuropa" (for Ledger Flex)

- [#7875](https://github.com/LedgerHQ/ledger-live/pull/7875) [`672875f`](https://github.com/LedgerHQ/ledger-live/commit/672875feb9876edacf06aaea6c7bb47f4bb7d993) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add spamFilteringTx FF

- [#7813](https://github.com/LedgerHQ/ledger-live/pull/7813) [`5762905`](https://github.com/LedgerHQ/ledger-live/commit/5762905a8cc4d2e737f532a09ba2504c7d7961df) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix issue following CVS migration. The export didn't include account name

- [#7825](https://github.com/LedgerHQ/ledger-live/pull/7825) [`7865dcb`](https://github.com/LedgerHQ/ledger-live/commit/7865dcb1891b89a0d9fe28efeea3a6284f3d87c5) Thanks [@LucasWerey](https://github.com/LucasWerey)! - add a field to ledger sync feature flag so we can use a dynamic learn more link

- [#7750](https://github.com/LedgerHQ/ledger-live/pull/7750) [`8679584`](https://github.com/LedgerHQ/ledger-live/commit/86795841982e06058294528bd8d2847fc4f62513) Thanks [@Wozacosta](https://github.com/Wozacosta)! - Move Multiversx/Elrond to its own module

- Updated dependencies [[`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9), [`308e787`](https://github.com/LedgerHQ/ledger-live/commit/308e787725082b517eb436a4e198595a6a0958c4), [`e4b6647`](https://github.com/LedgerHQ/ledger-live/commit/e4b664794ef5c65b391f29c2d4d8774b103e6348), [`f805d14`](https://github.com/LedgerHQ/ledger-live/commit/f805d1470f927824233f94eaba065b00d7af18cf), [`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9), [`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9), [`f805d14`](https://github.com/LedgerHQ/ledger-live/commit/f805d1470f927824233f94eaba065b00d7af18cf), [`0a71c43`](https://github.com/LedgerHQ/ledger-live/commit/0a71c4344b7bb2c6640f3e5dda152ae815573330), [`0a71c43`](https://github.com/LedgerHQ/ledger-live/commit/0a71c4344b7bb2c6640f3e5dda152ae815573330), [`8679584`](https://github.com/LedgerHQ/ledger-live/commit/86795841982e06058294528bd8d2847fc4f62513), [`f805d14`](https://github.com/LedgerHQ/ledger-live/commit/f805d1470f927824233f94eaba065b00d7af18cf), [`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9)]:
  - @ledgerhq/cryptoassets@13.5.0
  - @ledgerhq/coin-tron@0.0.6
  - @ledgerhq/live-nft@0.4.6
  - @ledgerhq/hw-app-solana@7.2.4
  - @ledgerhq/hw-app-btc@10.4.3
  - @ledgerhq/hw-app-eth@6.38.2
  - @ledgerhq/coin-bitcoin@0.8.1
  - @ledgerhq/coin-cosmos@0.1.2
  - @ledgerhq/coin-evm@2.3.0
  - @ledgerhq/live-network@2.0.1
  - @ledgerhq/errors@6.19.1
  - @ledgerhq/device-core@0.4.0
  - @ledgerhq/hw-app-elrond@6.21.1
  - @ledgerhq/coin-elrond@0.1.1
  - @ledgerhq/coin-framework@0.18.1
  - @ledgerhq/coin-algorand@0.5.6
  - @ledgerhq/coin-cardano@0.2.1
  - @ledgerhq/coin-icon@0.4.3
  - @ledgerhq/coin-near@0.5.6
  - @ledgerhq/coin-polkadot@1.2.2
  - @ledgerhq/coin-solana@0.7.6
  - @ledgerhq/coin-stellar@0.3.1
  - @ledgerhq/coin-tezos@0.6.2
  - @ledgerhq/coin-ton@0.3.14
  - @ledgerhq/coin-xrp@0.5.2
  - @ledgerhq/hw-app-vet@0.2.6
  - @ledgerhq/live-countervalues@0.2.6
  - @ledgerhq/live-countervalues-react@0.2.6
  - @ledgerhq/live-wallet@0.6.1
  - @ledgerhq/hw-app-exchange@0.6.1
  - @ledgerhq/speculos-transport@0.1.6
  - @ledgerhq/devices@8.4.4
  - @ledgerhq/hw-app-algorand@6.29.4
  - @ledgerhq/hw-app-cosmos@6.30.4
  - @ledgerhq/hw-app-icon@1.1.2
  - @ledgerhq/hw-app-polkadot@6.31.4
  - @ledgerhq/hw-app-str@7.0.4
  - @ledgerhq/hw-transport@6.31.4
  - @ledgerhq/hw-app-near@6.29.4
  - @ledgerhq/hw-app-tezos@6.29.4
  - @ledgerhq/hw-app-trx@6.29.4
  - @ledgerhq/hw-app-xrp@6.29.4
  - @ledgerhq/hw-transport-mocker@6.29.4

## 34.9.0-next.1

### Patch Changes

- [#7883](https://github.com/LedgerHQ/ledger-live/pull/7883) [`f805d14`](https://github.com/LedgerHQ/ledger-live/commit/f805d1470f927824233f94eaba065b00d7af18cf) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update Axios to 1.7.7 following CVE: https://github.com/advisories/GHSA-8hc4-vh64-cxmj

- Updated dependencies [[`f805d14`](https://github.com/LedgerHQ/ledger-live/commit/f805d1470f927824233f94eaba065b00d7af18cf), [`f805d14`](https://github.com/LedgerHQ/ledger-live/commit/f805d1470f927824233f94eaba065b00d7af18cf), [`f805d14`](https://github.com/LedgerHQ/ledger-live/commit/f805d1470f927824233f94eaba065b00d7af18cf)]:
  - @ledgerhq/hw-app-solana@7.2.4-next.1
  - @ledgerhq/cryptoassets@13.5.0-next.1
  - @ledgerhq/hw-app-btc@10.4.3-next.1
  - @ledgerhq/hw-app-eth@6.38.2-next.1
  - @ledgerhq/coin-bitcoin@0.8.1-next.1
  - @ledgerhq/coin-cosmos@0.1.2-next.1
  - @ledgerhq/coin-evm@2.3.0-next.1
  - @ledgerhq/live-network@2.0.1-next.1
  - @ledgerhq/coin-framework@0.18.1-next.1
  - @ledgerhq/hw-app-exchange@0.6.1-next.0
  - @ledgerhq/speculos-transport@0.1.6-next.1
  - @ledgerhq/coin-algorand@0.5.6-next.1
  - @ledgerhq/coin-cardano@0.2.1-next.1
  - @ledgerhq/coin-elrond@0.1.1-next.1
  - @ledgerhq/coin-icon@0.4.3-next.1
  - @ledgerhq/coin-near@0.5.6-next.1
  - @ledgerhq/coin-polkadot@1.2.2-next.1
  - @ledgerhq/coin-solana@0.7.6-next.1
  - @ledgerhq/coin-stellar@0.3.1-next.1
  - @ledgerhq/coin-tezos@0.6.2-next.1
  - @ledgerhq/coin-ton@0.3.14-next.1
  - @ledgerhq/coin-tron@0.0.6-next.1
  - @ledgerhq/coin-xrp@0.5.2-next.1
  - @ledgerhq/hw-app-vet@0.2.6-next.1
  - @ledgerhq/live-countervalues@0.2.6-next.1
  - @ledgerhq/live-countervalues-react@0.2.6-next.1
  - @ledgerhq/live-nft@0.4.6-next.1
  - @ledgerhq/live-wallet@0.6.1-next.1
  - @ledgerhq/device-core@0.4.0-next.1

## 34.9.0-next.0

### Minor Changes

- [#7798](https://github.com/LedgerHQ/ledger-live/pull/7798) [`e0536c5`](https://github.com/LedgerHQ/ledger-live/commit/e0536c5e27a2036919abd0fd182765b32ea0112e) Thanks [@Wozacosta](https://github.com/Wozacosta)! - Add safety margin to Hedera fee estimates

### Patch Changes

- [#7621](https://github.com/LedgerHQ/ledger-live/pull/7621) [`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9) Thanks [@lambertkevin](https://github.com/lambertkevin)! - CAL update

- [#7780](https://github.com/LedgerHQ/ledger-live/pull/7780) [`461ddc5`](https://github.com/LedgerHQ/ledger-live/commit/461ddc56fbbe862789fe9a06db8a7e7a894e4bdd) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Remove feature flag "deviceSupportEuropa" (for Ledger Flex)

- [#7875](https://github.com/LedgerHQ/ledger-live/pull/7875) [`672875f`](https://github.com/LedgerHQ/ledger-live/commit/672875feb9876edacf06aaea6c7bb47f4bb7d993) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add spamFilteringTx FF

- [#7813](https://github.com/LedgerHQ/ledger-live/pull/7813) [`5762905`](https://github.com/LedgerHQ/ledger-live/commit/5762905a8cc4d2e737f532a09ba2504c7d7961df) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix issue following CVS migration. The export didn't include account name

- [#7825](https://github.com/LedgerHQ/ledger-live/pull/7825) [`7865dcb`](https://github.com/LedgerHQ/ledger-live/commit/7865dcb1891b89a0d9fe28efeea3a6284f3d87c5) Thanks [@LucasWerey](https://github.com/LucasWerey)! - add a field to ledger sync feature flag so we can use a dynamic learn more link

- [#7750](https://github.com/LedgerHQ/ledger-live/pull/7750) [`8679584`](https://github.com/LedgerHQ/ledger-live/commit/86795841982e06058294528bd8d2847fc4f62513) Thanks [@Wozacosta](https://github.com/Wozacosta)! - Move Multiversx/Elrond to its own module

- Updated dependencies [[`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9), [`308e787`](https://github.com/LedgerHQ/ledger-live/commit/308e787725082b517eb436a4e198595a6a0958c4), [`e4b6647`](https://github.com/LedgerHQ/ledger-live/commit/e4b664794ef5c65b391f29c2d4d8774b103e6348), [`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9), [`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9), [`0a71c43`](https://github.com/LedgerHQ/ledger-live/commit/0a71c4344b7bb2c6640f3e5dda152ae815573330), [`0a71c43`](https://github.com/LedgerHQ/ledger-live/commit/0a71c4344b7bb2c6640f3e5dda152ae815573330), [`8679584`](https://github.com/LedgerHQ/ledger-live/commit/86795841982e06058294528bd8d2847fc4f62513), [`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9)]:
  - @ledgerhq/cryptoassets@13.5.0-next.0
  - @ledgerhq/coin-tron@0.0.6-next.0
  - @ledgerhq/live-nft@0.4.6-next.0
  - @ledgerhq/coin-evm@2.3.0-next.0
  - @ledgerhq/coin-cosmos@0.1.2-next.0
  - @ledgerhq/errors@6.19.1-next.0
  - @ledgerhq/device-core@0.4.0-next.0
  - @ledgerhq/hw-app-elrond@6.21.1-next.0
  - @ledgerhq/coin-elrond@0.1.1-next.0
  - @ledgerhq/coin-framework@0.18.1-next.0
  - @ledgerhq/coin-algorand@0.5.6-next.0
  - @ledgerhq/coin-bitcoin@0.8.1-next.0
  - @ledgerhq/coin-cardano@0.2.1-next.0
  - @ledgerhq/coin-icon@0.4.3-next.0
  - @ledgerhq/coin-near@0.5.6-next.0
  - @ledgerhq/coin-polkadot@1.2.2-next.0
  - @ledgerhq/coin-solana@0.7.6-next.0
  - @ledgerhq/coin-stellar@0.3.1-next.0
  - @ledgerhq/coin-tezos@0.6.2-next.0
  - @ledgerhq/coin-ton@0.3.14-next.0
  - @ledgerhq/coin-xrp@0.5.2-next.0
  - @ledgerhq/hw-app-eth@6.38.2-next.0
  - @ledgerhq/hw-app-vet@0.2.6-next.0
  - @ledgerhq/live-countervalues@0.2.6-next.0
  - @ledgerhq/live-countervalues-react@0.2.6-next.0
  - @ledgerhq/live-wallet@0.6.1-next.0
  - @ledgerhq/devices@8.4.4-next.0
  - @ledgerhq/hw-app-algorand@6.29.4-next.0
  - @ledgerhq/hw-app-cosmos@6.30.4-next.0
  - @ledgerhq/hw-app-exchange@0.6.1-next.0
  - @ledgerhq/hw-app-icon@1.1.2-next.0
  - @ledgerhq/hw-app-polkadot@6.31.4-next.0
  - @ledgerhq/hw-app-solana@7.2.4-next.0
  - @ledgerhq/hw-app-str@7.0.4-next.0
  - @ledgerhq/hw-transport@6.31.4-next.0
  - @ledgerhq/live-network@2.0.1-next.0
  - @ledgerhq/speculos-transport@0.1.6-next.0
  - @ledgerhq/hw-app-btc@10.4.3-next.0
  - @ledgerhq/hw-app-near@6.29.4-next.0
  - @ledgerhq/hw-app-tezos@6.29.4-next.0
  - @ledgerhq/hw-app-trx@6.29.4-next.0
  - @ledgerhq/hw-app-xrp@6.29.4-next.0
  - @ledgerhq/hw-transport-mocker@6.29.4-next.0

## 34.8.0

### Minor Changes

- [#7634](https://github.com/LedgerHQ/ledger-live/pull/7634) [`940d807`](https://github.com/LedgerHQ/ledger-live/commit/940d8073f6395cbcc2369f46aa6ad30216b00198) Thanks [@Justkant](https://github.com/Justkant)! - feat: add dependencies support on wallet-api and dapp browser for transaction

- [#7213](https://github.com/LedgerHQ/ledger-live/pull/7213) [`354d913`](https://github.com/LedgerHQ/ledger-live/commit/354d9138a4bd9b54001ff1330a8000ee94aea008) Thanks [@pavanvora](https://github.com/pavanvora)! - Add babbage support to Cardano with typhonjs v2

- [#7613](https://github.com/LedgerHQ/ledger-live/pull/7613) [`f0eb405`](https://github.com/LedgerHQ/ledger-live/commit/f0eb405b52de5484ee98ac87e87522b33836224c) Thanks [@chrisduma-ledger](https://github.com/chrisduma-ledger)! - Adds support for tBTC

- [#7414](https://github.com/LedgerHQ/ledger-live/pull/7414) [`5758950`](https://github.com/LedgerHQ/ledger-live/commit/5758950841fbf8018dd848e745017484aec67333) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Add ERC20 token support for filecoin

- [#7744](https://github.com/LedgerHQ/ledger-live/pull/7744) [`fcd8d52`](https://github.com/LedgerHQ/ledger-live/commit/fcd8d5272176a4acec4e396ed313d3578e1c5b86) Thanks [@valpinkman](https://github.com/valpinkman)! - Delete local app data when uninstalling apps

- [#7741](https://github.com/LedgerHQ/ledger-live/pull/7741) [`224e33c`](https://github.com/LedgerHQ/ledger-live/commit/224e33c93d2acd22c82892148b240df004284037) Thanks [@CremaFR](https://github.com/CremaFR)! - fixed bnb custom fee crashes and erased gasLimit

- [#7572](https://github.com/LedgerHQ/ledger-live/pull/7572) [`c8c273c`](https://github.com/LedgerHQ/ledger-live/commit/c8c273c9a443a75b2fb85b831c8d40cf6ff068c6) Thanks [@valpinkman](https://github.com/valpinkman)! - Add new installAppWithRestore and uninstallAppWithBackup to handle app data restore and backup

- [#7580](https://github.com/LedgerHQ/ledger-live/pull/7580) [`6417959`](https://github.com/LedgerHQ/ledger-live/commit/641795937e14908ba9632a7b9744563b7e206be7) Thanks [@marcotoniut-ledger](https://github.com/marcotoniut-ledger)! - Add discover section deep link initial category filter to enable links like `ledgerlive://discover?category=restaking` to load the discover screen with the category pre-selected

- [#7698](https://github.com/LedgerHQ/ledger-live/pull/7698) [`1bcff16`](https://github.com/LedgerHQ/ledger-live/commit/1bcff1673fa0cbc43f43201044d7e9425f8991f1) Thanks [@valpinkman](https://github.com/valpinkman)! - Add new use case to delete locally stored app data (llm/lld)

- [#7684](https://github.com/LedgerHQ/ledger-live/pull/7684) [`eb9a36f`](https://github.com/LedgerHQ/ledger-live/commit/eb9a36f6ee8487c9ffbb841c3e6c0ca84f68bb0a) Thanks [@CremaFR](https://github.com/CremaFR)! - feat: added new env to bypass app requirements to init swaps

- [#7268](https://github.com/LedgerHQ/ledger-live/pull/7268) [`9c2f1b3`](https://github.com/LedgerHQ/ledger-live/commit/9c2f1b3b6e11a37a6b5ecf02d1e1ae7f0258e3ae) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Prepare CoinModule Stellar for Alpaca

- [#7723](https://github.com/LedgerHQ/ledger-live/pull/7723) [`042e1ab`](https://github.com/LedgerHQ/ledger-live/commit/042e1abf2d0bdbdc906cb88e30770d4de1eef356) Thanks [@CremaFR](https://github.com/CremaFR)! - updated cal fetch to use API calls instead of loading the cal inside LL

- [#7558](https://github.com/LedgerHQ/ledger-live/pull/7558) [`9a650da`](https://github.com/LedgerHQ/ledger-live/commit/9a650da9a147d6881f7082278d2bf764c37e1451) Thanks [@thesan](https://github.com/thesan)! - Create the llmMarketQuickActions feature flag

### Patch Changes

- [#7614](https://github.com/LedgerHQ/ledger-live/pull/7614) [`f8756b2`](https://github.com/LedgerHQ/ledger-live/commit/f8756b29a83048d423d500e16ea3f9789763b90d) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - add delay to determine if the max amout value is less than 0

- [#7761](https://github.com/LedgerHQ/ledger-live/pull/7761) [`9c55e81`](https://github.com/LedgerHQ/ledger-live/commit/9c55e81c84d3372f2a7fd36248f970376aec905a) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - add ton token importer for CAL

- [#7728](https://github.com/LedgerHQ/ledger-live/pull/7728) [`5de6b47`](https://github.com/LedgerHQ/ledger-live/commit/5de6b47f4fec831a24ccd58ee95d69b8c2c15d57) Thanks [@ayelenmurano](https://github.com/ayelenmurano)! - adjust the adrres when it is obtained from the public key in Casper Blockchain

- [#7593](https://github.com/LedgerHQ/ledger-live/pull/7593) [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update `axios` to fixed version `1.7.3`

- [#7532](https://github.com/LedgerHQ/ledger-live/pull/7532) [`b97b76c`](https://github.com/LedgerHQ/ledger-live/commit/b97b76cc99845b0240426f5ca75c765b615ccec5) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix tezos min reveal gaslimit

- [#7710](https://github.com/LedgerHQ/ledger-live/pull/7710) [`cc291f5`](https://github.com/LedgerHQ/ledger-live/commit/cc291f5466d80a2b7e9394338ab588ecd3db4623) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Migrating the Matic currency to POL (see https://polygon.technology/blog/save-the-date-matic-pol-migration-coming-september-4th-everything-you-need-to-know)

- [#7672](https://github.com/LedgerHQ/ledger-live/pull/7672) [`fb9466a`](https://github.com/LedgerHQ/ledger-live/commit/fb9466a4d7827fd4759c726ad3ae0b43dddcacd3) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Add support for jettons

- [#7542](https://github.com/LedgerHQ/ledger-live/pull/7542) [`313d0e4`](https://github.com/LedgerHQ/ledger-live/commit/313d0e42b81b69b57aa81a760465a414e6afd7f7) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - My Ledger: fix & refactor logic of "is app supported by Ledger Live" depending on feature flags, and associated filters in apps catalog. Now this logic is in one single place and fully unit tested.

- [#7628](https://github.com/LedgerHQ/ledger-live/pull/7628) [`94afd9e`](https://github.com/LedgerHQ/ledger-live/commit/94afd9e0742d0e227b1e6ff953edee7a66ad61a3) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - chore(BACK-7633): switch app store API endpoints from POST to GET when applicable

  This change will reduce load on the backend service and improve latency for clients.

  Related:

  - https://github.com/LedgerHQ/nano-appstore/releases/tag/v1.7.0
  - https://github.com/LedgerHQ/tf-aws-production/pull/3546

- [#7573](https://github.com/LedgerHQ/ledger-live/pull/7573) [`0c80144`](https://github.com/LedgerHQ/ledger-live/commit/0c80144b8c16fc3729baa6503875d21af87b2752) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - [swap] setup demo3 flag and routes

- [#7525](https://github.com/LedgerHQ/ledger-live/pull/7525) [`4799d5d`](https://github.com/LedgerHQ/ledger-live/commit/4799d5de3fb1dcef2b01de31fe29b59e76922576) Thanks [@valpinkman](https://github.com/valpinkman)! - Use MOCK_APP_UPDATE to fake app updates

- [#7669](https://github.com/LedgerHQ/ledger-live/pull/7669) [`6ccd01c`](https://github.com/LedgerHQ/ledger-live/commit/6ccd01cd738362db00c9dbc74cd0a77ccc01b206) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - show gasPrice as error not warning

- [#7563](https://github.com/LedgerHQ/ledger-live/pull/7563) [`ef82161`](https://github.com/LedgerHQ/ledger-live/commit/ef82161688fc49bf32cbc88f1837b15490e5d2b4) Thanks [@Wozacosta](https://github.com/Wozacosta)! - remove pivx code

- [#7550](https://github.com/LedgerHQ/ledger-live/pull/7550) [`cd440bb`](https://github.com/LedgerHQ/ledger-live/commit/cd440bbd647633278d983a15803032c1e676d4fe) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - Change to spendable balance tron

- [#7586](https://github.com/LedgerHQ/ledger-live/pull/7586) [`94bf322`](https://github.com/LedgerHQ/ledger-live/commit/94bf322023cf497b19399be8abcf54a57ea740d1) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix: replace expo-random lib with expo-crypto

- [#7636](https://github.com/LedgerHQ/ledger-live/pull/7636) [`a0bb74b`](https://github.com/LedgerHQ/ledger-live/commit/a0bb74b8f3704ab9d5567c9d14c16cab9e0872f7) Thanks [@Wozacosta](https://github.com/Wozacosta)! - Move Cosmos and Cosmos-based coins to its own module

- [#7693](https://github.com/LedgerHQ/ledger-live/pull/7693) [`1d1bfd1`](https://github.com/LedgerHQ/ledger-live/commit/1d1bfd164847431c0f4afe7ed8ae6d5df535c9cf) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix listApps: fallback to HSM script runner if listApps APDU is not available

- [#7523](https://github.com/LedgerHQ/ledger-live/pull/7523) [`91374dd`](https://github.com/LedgerHQ/ledger-live/commit/91374dde37f0ec3b63817254b9e26c1eb02ed981) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - show error when balance minus network fees is a negative value

- [#7679](https://github.com/LedgerHQ/ledger-live/pull/7679) [`54578c3`](https://github.com/LedgerHQ/ledger-live/commit/54578c329baf4434f9c5d9accb8842da00e45630) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix removal of custom lock screen on LLD

- [#7702](https://github.com/LedgerHQ/ledger-live/pull/7702) [`9d58923`](https://github.com/LedgerHQ/ledger-live/commit/9d5892327b43e219b3b672e7a56e1e2d6413a83b) Thanks [@Justkant](https://github.com/Justkant)! - fix: missing deps in useEffect array
  And cleanup unused code and picomatch dependency
- Updated dependencies [[`5c738cb`](https://github.com/LedgerHQ/ledger-live/commit/5c738cbd35ce5d0ca39ad3b86a61cc6234d1bdf7), [`354d913`](https://github.com/LedgerHQ/ledger-live/commit/354d9138a4bd9b54001ff1330a8000ee94aea008), [`3de65c8`](https://github.com/LedgerHQ/ledger-live/commit/3de65c89b64bc8ba6f5d29c819753d25146c5303), [`9c55e81`](https://github.com/LedgerHQ/ledger-live/commit/9c55e81c84d3372f2a7fd36248f970376aec905a), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`b97b76c`](https://github.com/LedgerHQ/ledger-live/commit/b97b76cc99845b0240426f5ca75c765b615ccec5), [`c8c273c`](https://github.com/LedgerHQ/ledger-live/commit/c8c273c9a443a75b2fb85b831c8d40cf6ff068c6), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`cc291f5`](https://github.com/LedgerHQ/ledger-live/commit/cc291f5466d80a2b7e9394338ab588ecd3db4623), [`fb9466a`](https://github.com/LedgerHQ/ledger-live/commit/fb9466a4d7827fd4759c726ad3ae0b43dddcacd3), [`5758950`](https://github.com/LedgerHQ/ledger-live/commit/5758950841fbf8018dd848e745017484aec67333), [`16aee39`](https://github.com/LedgerHQ/ledger-live/commit/16aee39a3b8c33d5b3680a9d7045cd11a3863b9a), [`5ecbe88`](https://github.com/LedgerHQ/ledger-live/commit/5ecbe88474032b724d6c408ab63be08aa567e0fc), [`ce18c9b`](https://github.com/LedgerHQ/ledger-live/commit/ce18c9bde11fbd6cc196091716b1547354063d89), [`93128e3`](https://github.com/LedgerHQ/ledger-live/commit/93128e367e6bff621309334f163198b9c07fb92e), [`d2f7d9b`](https://github.com/LedgerHQ/ledger-live/commit/d2f7d9b418c374bd6b87927c1f67d58c118b556d), [`940d807`](https://github.com/LedgerHQ/ledger-live/commit/940d8073f6395cbcc2369f46aa6ad30216b00198), [`94afd9e`](https://github.com/LedgerHQ/ledger-live/commit/94afd9e0742d0e227b1e6ff953edee7a66ad61a3), [`bb1ca23`](https://github.com/LedgerHQ/ledger-live/commit/bb1ca23865c787ef18b7623162487e3045c22ded), [`1353e7a`](https://github.com/LedgerHQ/ledger-live/commit/1353e7ae02f22e8f9194a1e3c34f9444785b6fb6), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`224e33c`](https://github.com/LedgerHQ/ledger-live/commit/224e33c93d2acd22c82892148b240df004284037), [`4799d5d`](https://github.com/LedgerHQ/ledger-live/commit/4799d5de3fb1dcef2b01de31fe29b59e76922576), [`ef82161`](https://github.com/LedgerHQ/ledger-live/commit/ef82161688fc49bf32cbc88f1837b15490e5d2b4), [`c21eddc`](https://github.com/LedgerHQ/ledger-live/commit/c21eddcf11683d018875e0a247ac53a4f4c4a2f4), [`c8ac662`](https://github.com/LedgerHQ/ledger-live/commit/c8ac662e6f88349187f802741e14c3d5fb67cddb), [`d13e7b9`](https://github.com/LedgerHQ/ledger-live/commit/d13e7b9f55d92098cacc9384fd7fab24033c040f), [`277648c`](https://github.com/LedgerHQ/ledger-live/commit/277648cbc0b58694a49d8d929c8ec0b89986f4cf), [`94bf322`](https://github.com/LedgerHQ/ledger-live/commit/94bf322023cf497b19399be8abcf54a57ea740d1), [`a3fd728`](https://github.com/LedgerHQ/ledger-live/commit/a3fd72861f2a7df676bd793062b3816fdb9d1f57), [`a0bb74b`](https://github.com/LedgerHQ/ledger-live/commit/a0bb74b8f3704ab9d5567c9d14c16cab9e0872f7), [`9a732c6`](https://github.com/LedgerHQ/ledger-live/commit/9a732c6d0b6e61b39f00d46c3af240640b4883e8), [`eb9a36f`](https://github.com/LedgerHQ/ledger-live/commit/eb9a36f6ee8487c9ffbb841c3e6c0ca84f68bb0a), [`6815f6f`](https://github.com/LedgerHQ/ledger-live/commit/6815f6fccb9bca627a2e51ab954dc3f9b8f7c710), [`9c2f1b3`](https://github.com/LedgerHQ/ledger-live/commit/9c2f1b3b6e11a37a6b5ecf02d1e1ae7f0258e3ae), [`9abf63b`](https://github.com/LedgerHQ/ledger-live/commit/9abf63b51a159fe6c501a6b50d1e33c1551834e8), [`d213d81`](https://github.com/LedgerHQ/ledger-live/commit/d213d8122647d559b7a0f44e2beffa5e39c3249b), [`e6b8cea`](https://github.com/LedgerHQ/ledger-live/commit/e6b8ceac486147f4000aab7f0ae7f89d2ac205b1), [`e7db725`](https://github.com/LedgerHQ/ledger-live/commit/e7db72552042ff4dd85bec236f6bd083fa3da533)]:
  - @ledgerhq/errors@6.19.0
  - @ledgerhq/coin-cardano@0.2.0
  - @ledgerhq/crypto-icons-ui@1.4.1
  - @ledgerhq/cryptoassets@13.4.0
  - @ledgerhq/coin-ton@0.3.13
  - @ledgerhq/hw-app-solana@7.2.3
  - @ledgerhq/hw-app-btc@10.4.2
  - @ledgerhq/hw-app-eth@6.38.1
  - @ledgerhq/coin-bitcoin@0.8.0
  - @ledgerhq/coin-evm@2.2.0
  - @ledgerhq/live-network@2.0.0
  - @ledgerhq/coin-tezos@0.6.1
  - @ledgerhq/device-core@0.3.3
  - @ledgerhq/live-countervalues@0.2.5
  - @ledgerhq/coin-framework@0.18.0
  - @ledgerhq/live-countervalues-react@0.2.5
  - @ledgerhq/coin-icon@0.4.2
  - @ledgerhq/speculos-transport@0.1.5
  - @ledgerhq/live-env@2.3.0
  - @ledgerhq/hw-app-exchange@0.6.0
  - @ledgerhq/live-wallet@0.6.0
  - @ledgerhq/coin-polkadot@1.2.1
  - @ledgerhq/wallet-api-exchange-module@0.7.1
  - @ledgerhq/coin-cosmos@0.1.1
  - @ledgerhq/coin-stellar@0.3.0
  - @ledgerhq/coin-xrp@0.5.1
  - @ledgerhq/coin-algorand@0.5.5
  - @ledgerhq/coin-near@0.5.5
  - @ledgerhq/coin-solana@0.7.5
  - @ledgerhq/coin-tron@0.0.5
  - @ledgerhq/devices@8.4.3
  - @ledgerhq/hw-app-algorand@6.29.3
  - @ledgerhq/hw-app-cosmos@6.30.3
  - @ledgerhq/hw-app-icon@1.1.1
  - @ledgerhq/hw-app-polkadot@6.31.3
  - @ledgerhq/hw-app-str@7.0.3
  - @ledgerhq/hw-app-vet@0.2.5
  - @ledgerhq/hw-transport@6.31.3
  - @ledgerhq/live-nft@0.4.5
  - @ledgerhq/hw-app-near@6.29.3
  - @ledgerhq/hw-app-tezos@6.29.3
  - @ledgerhq/hw-app-trx@6.29.3
  - @ledgerhq/hw-app-xrp@6.29.3
  - @ledgerhq/hw-transport-mocker@6.29.3

## 34.8.0-next.0

### Minor Changes

- [#7634](https://github.com/LedgerHQ/ledger-live/pull/7634) [`940d807`](https://github.com/LedgerHQ/ledger-live/commit/940d8073f6395cbcc2369f46aa6ad30216b00198) Thanks [@Justkant](https://github.com/Justkant)! - feat: add dependencies support on wallet-api and dapp browser for transaction

- [#7213](https://github.com/LedgerHQ/ledger-live/pull/7213) [`354d913`](https://github.com/LedgerHQ/ledger-live/commit/354d9138a4bd9b54001ff1330a8000ee94aea008) Thanks [@pavanvora](https://github.com/pavanvora)! - Add babbage support to Cardano with typhonjs v2

- [#7613](https://github.com/LedgerHQ/ledger-live/pull/7613) [`f0eb405`](https://github.com/LedgerHQ/ledger-live/commit/f0eb405b52de5484ee98ac87e87522b33836224c) Thanks [@chrisduma-ledger](https://github.com/chrisduma-ledger)! - Adds support for tBTC

- [#7414](https://github.com/LedgerHQ/ledger-live/pull/7414) [`5758950`](https://github.com/LedgerHQ/ledger-live/commit/5758950841fbf8018dd848e745017484aec67333) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Add ERC20 token support for filecoin

- [#7744](https://github.com/LedgerHQ/ledger-live/pull/7744) [`fcd8d52`](https://github.com/LedgerHQ/ledger-live/commit/fcd8d5272176a4acec4e396ed313d3578e1c5b86) Thanks [@valpinkman](https://github.com/valpinkman)! - Delete local app data when uninstalling apps

- [#7741](https://github.com/LedgerHQ/ledger-live/pull/7741) [`224e33c`](https://github.com/LedgerHQ/ledger-live/commit/224e33c93d2acd22c82892148b240df004284037) Thanks [@CremaFR](https://github.com/CremaFR)! - fixed bnb custom fee crashes and erased gasLimit

- [#7572](https://github.com/LedgerHQ/ledger-live/pull/7572) [`c8c273c`](https://github.com/LedgerHQ/ledger-live/commit/c8c273c9a443a75b2fb85b831c8d40cf6ff068c6) Thanks [@valpinkman](https://github.com/valpinkman)! - Add new installAppWithRestore and uninstallAppWithBackup to handle app data restore and backup

- [#7580](https://github.com/LedgerHQ/ledger-live/pull/7580) [`6417959`](https://github.com/LedgerHQ/ledger-live/commit/641795937e14908ba9632a7b9744563b7e206be7) Thanks [@marcotoniut-ledger](https://github.com/marcotoniut-ledger)! - Add discover section deep link initial category filter to enable links like `ledgerlive://discover?category=restaking` to load the discover screen with the category pre-selected

- [#7698](https://github.com/LedgerHQ/ledger-live/pull/7698) [`1bcff16`](https://github.com/LedgerHQ/ledger-live/commit/1bcff1673fa0cbc43f43201044d7e9425f8991f1) Thanks [@valpinkman](https://github.com/valpinkman)! - Add new use case to delete locally stored app data (llm/lld)

- [#7684](https://github.com/LedgerHQ/ledger-live/pull/7684) [`eb9a36f`](https://github.com/LedgerHQ/ledger-live/commit/eb9a36f6ee8487c9ffbb841c3e6c0ca84f68bb0a) Thanks [@CremaFR](https://github.com/CremaFR)! - feat: added new env to bypass app requirements to init swaps

- [#7268](https://github.com/LedgerHQ/ledger-live/pull/7268) [`9c2f1b3`](https://github.com/LedgerHQ/ledger-live/commit/9c2f1b3b6e11a37a6b5ecf02d1e1ae7f0258e3ae) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Prepare CoinModule Stellar for Alpaca

- [#7723](https://github.com/LedgerHQ/ledger-live/pull/7723) [`042e1ab`](https://github.com/LedgerHQ/ledger-live/commit/042e1abf2d0bdbdc906cb88e30770d4de1eef356) Thanks [@CremaFR](https://github.com/CremaFR)! - updated cal fetch to use API calls instead of loading the cal inside LL

- [#7558](https://github.com/LedgerHQ/ledger-live/pull/7558) [`9a650da`](https://github.com/LedgerHQ/ledger-live/commit/9a650da9a147d6881f7082278d2bf764c37e1451) Thanks [@thesan](https://github.com/thesan)! - Create the llmMarketQuickActions feature flag

### Patch Changes

- [#7614](https://github.com/LedgerHQ/ledger-live/pull/7614) [`f8756b2`](https://github.com/LedgerHQ/ledger-live/commit/f8756b29a83048d423d500e16ea3f9789763b90d) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - add delay to determine if the max amout value is less than 0

- [#7761](https://github.com/LedgerHQ/ledger-live/pull/7761) [`9c55e81`](https://github.com/LedgerHQ/ledger-live/commit/9c55e81c84d3372f2a7fd36248f970376aec905a) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - add ton token importer for CAL

- [#7728](https://github.com/LedgerHQ/ledger-live/pull/7728) [`5de6b47`](https://github.com/LedgerHQ/ledger-live/commit/5de6b47f4fec831a24ccd58ee95d69b8c2c15d57) Thanks [@ayelenmurano](https://github.com/ayelenmurano)! - adjust the adrres when it is obtained from the public key in Casper Blockchain

- [#7593](https://github.com/LedgerHQ/ledger-live/pull/7593) [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update `axios` to fixed version `1.7.3`

- [#7532](https://github.com/LedgerHQ/ledger-live/pull/7532) [`b97b76c`](https://github.com/LedgerHQ/ledger-live/commit/b97b76cc99845b0240426f5ca75c765b615ccec5) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix tezos min reveal gaslimit

- [#7710](https://github.com/LedgerHQ/ledger-live/pull/7710) [`cc291f5`](https://github.com/LedgerHQ/ledger-live/commit/cc291f5466d80a2b7e9394338ab588ecd3db4623) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Migrating the Matic currency to POL (see https://polygon.technology/blog/save-the-date-matic-pol-migration-coming-september-4th-everything-you-need-to-know)

- [#7672](https://github.com/LedgerHQ/ledger-live/pull/7672) [`fb9466a`](https://github.com/LedgerHQ/ledger-live/commit/fb9466a4d7827fd4759c726ad3ae0b43dddcacd3) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Add support for jettons

- [#7542](https://github.com/LedgerHQ/ledger-live/pull/7542) [`313d0e4`](https://github.com/LedgerHQ/ledger-live/commit/313d0e42b81b69b57aa81a760465a414e6afd7f7) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - My Ledger: fix & refactor logic of "is app supported by Ledger Live" depending on feature flags, and associated filters in apps catalog. Now this logic is in one single place and fully unit tested.

- [#7628](https://github.com/LedgerHQ/ledger-live/pull/7628) [`94afd9e`](https://github.com/LedgerHQ/ledger-live/commit/94afd9e0742d0e227b1e6ff953edee7a66ad61a3) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - chore(BACK-7633): switch app store API endpoints from POST to GET when applicable

  This change will reduce load on the backend service and improve latency for clients.

  Related:

  - https://github.com/LedgerHQ/nano-appstore/releases/tag/v1.7.0
  - https://github.com/LedgerHQ/tf-aws-production/pull/3546

- [#7573](https://github.com/LedgerHQ/ledger-live/pull/7573) [`0c80144`](https://github.com/LedgerHQ/ledger-live/commit/0c80144b8c16fc3729baa6503875d21af87b2752) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - [swap] setup demo3 flag and routes

- [#7525](https://github.com/LedgerHQ/ledger-live/pull/7525) [`4799d5d`](https://github.com/LedgerHQ/ledger-live/commit/4799d5de3fb1dcef2b01de31fe29b59e76922576) Thanks [@valpinkman](https://github.com/valpinkman)! - Use MOCK_APP_UPDATE to fake app updates

- [#7669](https://github.com/LedgerHQ/ledger-live/pull/7669) [`6ccd01c`](https://github.com/LedgerHQ/ledger-live/commit/6ccd01cd738362db00c9dbc74cd0a77ccc01b206) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - show gasPrice as error not warning

- [#7563](https://github.com/LedgerHQ/ledger-live/pull/7563) [`ef82161`](https://github.com/LedgerHQ/ledger-live/commit/ef82161688fc49bf32cbc88f1837b15490e5d2b4) Thanks [@Wozacosta](https://github.com/Wozacosta)! - remove pivx code

- [#7550](https://github.com/LedgerHQ/ledger-live/pull/7550) [`cd440bb`](https://github.com/LedgerHQ/ledger-live/commit/cd440bbd647633278d983a15803032c1e676d4fe) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - Change to spendable balance tron

- [#7586](https://github.com/LedgerHQ/ledger-live/pull/7586) [`94bf322`](https://github.com/LedgerHQ/ledger-live/commit/94bf322023cf497b19399be8abcf54a57ea740d1) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix: replace expo-random lib with expo-crypto

- [#7636](https://github.com/LedgerHQ/ledger-live/pull/7636) [`a0bb74b`](https://github.com/LedgerHQ/ledger-live/commit/a0bb74b8f3704ab9d5567c9d14c16cab9e0872f7) Thanks [@Wozacosta](https://github.com/Wozacosta)! - Move Cosmos and Cosmos-based coins to its own module

- [#7693](https://github.com/LedgerHQ/ledger-live/pull/7693) [`1d1bfd1`](https://github.com/LedgerHQ/ledger-live/commit/1d1bfd164847431c0f4afe7ed8ae6d5df535c9cf) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix listApps: fallback to HSM script runner if listApps APDU is not available

- [#7523](https://github.com/LedgerHQ/ledger-live/pull/7523) [`91374dd`](https://github.com/LedgerHQ/ledger-live/commit/91374dde37f0ec3b63817254b9e26c1eb02ed981) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - show error when balance minus network fees is a negative value

- [#7679](https://github.com/LedgerHQ/ledger-live/pull/7679) [`54578c3`](https://github.com/LedgerHQ/ledger-live/commit/54578c329baf4434f9c5d9accb8842da00e45630) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix removal of custom lock screen on LLD

- [#7702](https://github.com/LedgerHQ/ledger-live/pull/7702) [`9d58923`](https://github.com/LedgerHQ/ledger-live/commit/9d5892327b43e219b3b672e7a56e1e2d6413a83b) Thanks [@Justkant](https://github.com/Justkant)! - fix: missing deps in useEffect array
  And cleanup unused code and picomatch dependency
- Updated dependencies [[`5c738cb`](https://github.com/LedgerHQ/ledger-live/commit/5c738cbd35ce5d0ca39ad3b86a61cc6234d1bdf7), [`354d913`](https://github.com/LedgerHQ/ledger-live/commit/354d9138a4bd9b54001ff1330a8000ee94aea008), [`3de65c8`](https://github.com/LedgerHQ/ledger-live/commit/3de65c89b64bc8ba6f5d29c819753d25146c5303), [`9c55e81`](https://github.com/LedgerHQ/ledger-live/commit/9c55e81c84d3372f2a7fd36248f970376aec905a), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`b97b76c`](https://github.com/LedgerHQ/ledger-live/commit/b97b76cc99845b0240426f5ca75c765b615ccec5), [`c8c273c`](https://github.com/LedgerHQ/ledger-live/commit/c8c273c9a443a75b2fb85b831c8d40cf6ff068c6), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`cc291f5`](https://github.com/LedgerHQ/ledger-live/commit/cc291f5466d80a2b7e9394338ab588ecd3db4623), [`fb9466a`](https://github.com/LedgerHQ/ledger-live/commit/fb9466a4d7827fd4759c726ad3ae0b43dddcacd3), [`5758950`](https://github.com/LedgerHQ/ledger-live/commit/5758950841fbf8018dd848e745017484aec67333), [`16aee39`](https://github.com/LedgerHQ/ledger-live/commit/16aee39a3b8c33d5b3680a9d7045cd11a3863b9a), [`5ecbe88`](https://github.com/LedgerHQ/ledger-live/commit/5ecbe88474032b724d6c408ab63be08aa567e0fc), [`ce18c9b`](https://github.com/LedgerHQ/ledger-live/commit/ce18c9bde11fbd6cc196091716b1547354063d89), [`93128e3`](https://github.com/LedgerHQ/ledger-live/commit/93128e367e6bff621309334f163198b9c07fb92e), [`d2f7d9b`](https://github.com/LedgerHQ/ledger-live/commit/d2f7d9b418c374bd6b87927c1f67d58c118b556d), [`940d807`](https://github.com/LedgerHQ/ledger-live/commit/940d8073f6395cbcc2369f46aa6ad30216b00198), [`94afd9e`](https://github.com/LedgerHQ/ledger-live/commit/94afd9e0742d0e227b1e6ff953edee7a66ad61a3), [`bb1ca23`](https://github.com/LedgerHQ/ledger-live/commit/bb1ca23865c787ef18b7623162487e3045c22ded), [`1353e7a`](https://github.com/LedgerHQ/ledger-live/commit/1353e7ae02f22e8f9194a1e3c34f9444785b6fb6), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`224e33c`](https://github.com/LedgerHQ/ledger-live/commit/224e33c93d2acd22c82892148b240df004284037), [`4799d5d`](https://github.com/LedgerHQ/ledger-live/commit/4799d5de3fb1dcef2b01de31fe29b59e76922576), [`ef82161`](https://github.com/LedgerHQ/ledger-live/commit/ef82161688fc49bf32cbc88f1837b15490e5d2b4), [`c21eddc`](https://github.com/LedgerHQ/ledger-live/commit/c21eddcf11683d018875e0a247ac53a4f4c4a2f4), [`c8ac662`](https://github.com/LedgerHQ/ledger-live/commit/c8ac662e6f88349187f802741e14c3d5fb67cddb), [`d13e7b9`](https://github.com/LedgerHQ/ledger-live/commit/d13e7b9f55d92098cacc9384fd7fab24033c040f), [`277648c`](https://github.com/LedgerHQ/ledger-live/commit/277648cbc0b58694a49d8d929c8ec0b89986f4cf), [`94bf322`](https://github.com/LedgerHQ/ledger-live/commit/94bf322023cf497b19399be8abcf54a57ea740d1), [`a3fd728`](https://github.com/LedgerHQ/ledger-live/commit/a3fd72861f2a7df676bd793062b3816fdb9d1f57), [`a0bb74b`](https://github.com/LedgerHQ/ledger-live/commit/a0bb74b8f3704ab9d5567c9d14c16cab9e0872f7), [`9a732c6`](https://github.com/LedgerHQ/ledger-live/commit/9a732c6d0b6e61b39f00d46c3af240640b4883e8), [`eb9a36f`](https://github.com/LedgerHQ/ledger-live/commit/eb9a36f6ee8487c9ffbb841c3e6c0ca84f68bb0a), [`6815f6f`](https://github.com/LedgerHQ/ledger-live/commit/6815f6fccb9bca627a2e51ab954dc3f9b8f7c710), [`9c2f1b3`](https://github.com/LedgerHQ/ledger-live/commit/9c2f1b3b6e11a37a6b5ecf02d1e1ae7f0258e3ae), [`9abf63b`](https://github.com/LedgerHQ/ledger-live/commit/9abf63b51a159fe6c501a6b50d1e33c1551834e8), [`d213d81`](https://github.com/LedgerHQ/ledger-live/commit/d213d8122647d559b7a0f44e2beffa5e39c3249b), [`e6b8cea`](https://github.com/LedgerHQ/ledger-live/commit/e6b8ceac486147f4000aab7f0ae7f89d2ac205b1), [`e7db725`](https://github.com/LedgerHQ/ledger-live/commit/e7db72552042ff4dd85bec236f6bd083fa3da533)]:
  - @ledgerhq/errors@6.19.0-next.0
  - @ledgerhq/coin-cardano@0.2.0-next.0
  - @ledgerhq/crypto-icons-ui@1.4.1-next.0
  - @ledgerhq/cryptoassets@13.4.0-next.0
  - @ledgerhq/coin-ton@0.3.13-next.0
  - @ledgerhq/hw-app-solana@7.2.3-next.0
  - @ledgerhq/hw-app-btc@10.4.2-next.0
  - @ledgerhq/hw-app-eth@6.38.1-next.0
  - @ledgerhq/coin-bitcoin@0.8.0-next.0
  - @ledgerhq/coin-evm@2.2.0-next.0
  - @ledgerhq/live-network@2.0.0-next.0
  - @ledgerhq/coin-tezos@0.6.1-next.0
  - @ledgerhq/device-core@0.3.3-next.0
  - @ledgerhq/live-countervalues@0.2.5-next.0
  - @ledgerhq/coin-framework@0.18.0-next.0
  - @ledgerhq/live-countervalues-react@0.2.5-next.0
  - @ledgerhq/coin-icon@0.4.2-next.0
  - @ledgerhq/speculos-transport@0.1.5-next.0
  - @ledgerhq/live-env@2.3.0-next.0
  - @ledgerhq/hw-app-exchange@0.6.0-next.0
  - @ledgerhq/live-wallet@0.6.0-next.0
  - @ledgerhq/coin-polkadot@1.2.1-next.0
  - @ledgerhq/wallet-api-exchange-module@0.7.1-next.0
  - @ledgerhq/coin-cosmos@0.1.1-next.0
  - @ledgerhq/coin-stellar@0.3.0-next.0
  - @ledgerhq/coin-xrp@0.5.1-next.0
  - @ledgerhq/coin-algorand@0.5.5-next.0
  - @ledgerhq/coin-near@0.5.5-next.0
  - @ledgerhq/coin-solana@0.7.5-next.0
  - @ledgerhq/coin-tron@0.0.5-next.0
  - @ledgerhq/devices@8.4.3-next.0
  - @ledgerhq/hw-app-algorand@6.29.3-next.0
  - @ledgerhq/hw-app-cosmos@6.30.3-next.0
  - @ledgerhq/hw-app-icon@1.1.1-next.0
  - @ledgerhq/hw-app-polkadot@6.31.3-next.0
  - @ledgerhq/hw-app-str@7.0.3-next.0
  - @ledgerhq/hw-app-vet@0.2.5-next.0
  - @ledgerhq/hw-transport@6.31.3-next.0
  - @ledgerhq/live-nft@0.4.5-next.0
  - @ledgerhq/hw-app-near@6.29.3-next.0
  - @ledgerhq/hw-app-tezos@6.29.3-next.0
  - @ledgerhq/hw-app-trx@6.29.3-next.0
  - @ledgerhq/hw-app-xrp@6.29.3-next.0
  - @ledgerhq/hw-transport-mocker@6.29.3-next.0

## 34.7.1

### Patch Changes

- [#7642](https://github.com/LedgerHQ/ledger-live/pull/7642) [`22ff55b`](https://github.com/LedgerHQ/ledger-live/commit/22ff55bf74a27fa22701c8b20424732a189ca017) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Sentry: disable capture of "performance spans", which were not actually in use, but still causing a stop of the internal process on LLD Windows

- Updated dependencies [[`22ff55b`](https://github.com/LedgerHQ/ledger-live/commit/22ff55bf74a27fa22701c8b20424732a189ca017)]:
  - @ledgerhq/coin-bitcoin@0.7.3

## 34.7.1-hotfix.0

### Patch Changes

- [#7642](https://github.com/LedgerHQ/ledger-live/pull/7642) [`22ff55b`](https://github.com/LedgerHQ/ledger-live/commit/22ff55bf74a27fa22701c8b20424732a189ca017) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Sentry: disable capture of "performance spans", which were not actually in use, but still causing a stop of the internal process on LLD Windows

## 34.7.0

### Minor Changes

- [#7075](https://github.com/LedgerHQ/ledger-live/pull/7075) [`db9c2d7`](https://github.com/LedgerHQ/ledger-live/commit/db9c2d78fb74df586c3ea1b9fb75ce3b014a0f4b) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Integrate Sync, Send, Receive, Create Account for Icon network

- [#7394](https://github.com/LedgerHQ/ledger-live/pull/7394) [`4bd91de`](https://github.com/LedgerHQ/ledger-live/commit/4bd91de13442d12acce3ee83d5f2fd5f087570cf) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - Support for TON blockchain

- [#7497](https://github.com/LedgerHQ/ledger-live/pull/7497) [`52daa39`](https://github.com/LedgerHQ/ledger-live/commit/52daa3998709ac3538afd447fe771faa3e3441be) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Added parameters to lldWalletSync and llmWalletSync to be able to configure the wallet sync feature remotely

### Patch Changes

- [#7363](https://github.com/LedgerHQ/ledger-live/pull/7363) [`3164745`](https://github.com/LedgerHQ/ledger-live/commit/31647459be359bd286c6a97acbc5a75660c32192) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Improve Search for Market when >=2 chars

- [#7490](https://github.com/LedgerHQ/ledger-live/pull/7490) [`03711d5`](https://github.com/LedgerHQ/ledger-live/commit/03711d54b37e7dc613091bb4eb2b150549ae370a) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - replace static data by cdn data

- [#7403](https://github.com/LedgerHQ/ledger-live/pull/7403) [`df9b4b7`](https://github.com/LedgerHQ/ledger-live/commit/df9b4b7b699503bb3aab1dc791b28e11ef0d51b9) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add ordinals feature flag

- [#7453](https://github.com/LedgerHQ/ledger-live/pull/7453) [`87d6bb2`](https://github.com/LedgerHQ/ledger-live/commit/87d6bb2501eac654dc10f45a0f591b28569b3d9f) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Remove listAppsV2minor1 feature flag and all code associated to list apps v1

- [#7466](https://github.com/LedgerHQ/ledger-live/pull/7466) [`1837d42`](https://github.com/LedgerHQ/ledger-live/commit/1837d42491df591a38755278c1e5bf9e4987fb26) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - [tron] display tron keep alive as error not warning

- [#7419](https://github.com/LedgerHQ/ledger-live/pull/7419) [`58c4bee`](https://github.com/LedgerHQ/ledger-live/commit/58c4beefb618cbad7e5f1ff7dfbf946f3bb763f7) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - [tron swap] fix negative amountTo when max switch is on

- [#7296](https://github.com/LedgerHQ/ledger-live/pull/7296) [`7f2ca21`](https://github.com/LedgerHQ/ledger-live/commit/7f2ca21ba29c52a99c1c004173c19bf9cf8082b5) Thanks [@CremaFR](https://github.com/CremaFR)! - feat: extracted fee drawer for swap live app

- [#7504](https://github.com/LedgerHQ/ledger-live/pull/7504) [`22ed462`](https://github.com/LedgerHQ/ledger-live/commit/22ed4624837be92a45c8b32ee6a76eedb094e937) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Force version 3.2.0 of @ton/crypto because 3.3.0 is bugged in the RN context

- [#7406](https://github.com/LedgerHQ/ledger-live/pull/7406) [`c433193`](https://github.com/LedgerHQ/ledger-live/commit/c433193298e86d758d727296bf51271e7d3a5871) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - set tezos gasfeeslimit minvalue

- [#7462](https://github.com/LedgerHQ/ledger-live/pull/7462) [`cd1fee0`](https://github.com/LedgerHQ/ledger-live/commit/cd1fee0030a588a385ca4f58864eebbcf788b795) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Add restore app data use case.

- [#7328](https://github.com/LedgerHQ/ledger-live/pull/7328) [`a0a36e5`](https://github.com/LedgerHQ/ledger-live/commit/a0a36e5fe86865a5643b38ed8d56e93cbda07e15) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Add app data backup use case for desktop

- Updated dependencies [[`1440323`](https://github.com/LedgerHQ/ledger-live/commit/144032348fcac45eb797c5e724cf5f654c9d3527), [`afa03ae`](https://github.com/LedgerHQ/ledger-live/commit/afa03ae921ad1ca7df83dc0ba717c1cc27cb08cd), [`3415d7d`](https://github.com/LedgerHQ/ledger-live/commit/3415d7df077e0c1d44d0d0ce9a26efd8e5ac4811), [`db9c2d7`](https://github.com/LedgerHQ/ledger-live/commit/db9c2d78fb74df586c3ea1b9fb75ce3b014a0f4b), [`555d61f`](https://github.com/LedgerHQ/ledger-live/commit/555d61fae0faa823fcbb210e7ea2c69818d849fd), [`4bd91de`](https://github.com/LedgerHQ/ledger-live/commit/4bd91de13442d12acce3ee83d5f2fd5f087570cf), [`a0a36e5`](https://github.com/LedgerHQ/ledger-live/commit/a0a36e5fe86865a5643b38ed8d56e93cbda07e15), [`53ff78c`](https://github.com/LedgerHQ/ledger-live/commit/53ff78c541d3ed69a3e74854d77f58a7e0d93978), [`37c0b90`](https://github.com/LedgerHQ/ledger-live/commit/37c0b90becb5911c8244015165f6500c97acf8ef), [`ecc3ee4`](https://github.com/LedgerHQ/ledger-live/commit/ecc3ee46b8d5bf5631bcbcf73b3c3a2fb1a8964d), [`8553b3e`](https://github.com/LedgerHQ/ledger-live/commit/8553b3eef10132396ec580a2d5f20b616f5b18a0), [`52daa39`](https://github.com/LedgerHQ/ledger-live/commit/52daa3998709ac3538afd447fe771faa3e3441be), [`db826f8`](https://github.com/LedgerHQ/ledger-live/commit/db826f8ee54dac8bc460abde6991073892a769cc), [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c), [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c), [`c540b7a`](https://github.com/LedgerHQ/ledger-live/commit/c540b7a4450e52c0d2ac00afd8f081c9fa650ec4), [`50b6db6`](https://github.com/LedgerHQ/ledger-live/commit/50b6db67d374a23ba040043aa93e7fbc52685297), [`c94d878`](https://github.com/LedgerHQ/ledger-live/commit/c94d878056f7ddace40cee1dae863f7080ec10d9), [`22ed462`](https://github.com/LedgerHQ/ledger-live/commit/22ed4624837be92a45c8b32ee6a76eedb094e937), [`c433193`](https://github.com/LedgerHQ/ledger-live/commit/c433193298e86d758d727296bf51271e7d3a5871), [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c), [`4179bb8`](https://github.com/LedgerHQ/ledger-live/commit/4179bb89a316843a869bd485157ed141d9d9c84e)]:
  - @ledgerhq/live-wallet@0.5.0
  - @ledgerhq/coin-polkadot@1.2.0
  - @ledgerhq/coin-tezos@0.6.0
  - @ledgerhq/coin-xrp@0.5.0
  - @ledgerhq/coin-framework@0.17.0
  - @ledgerhq/crypto-icons-ui@1.4.0
  - @ledgerhq/cryptoassets@13.3.0
  - @ledgerhq/hw-app-icon@1.1.0
  - @ledgerhq/coin-cardano@0.1.4
  - @ledgerhq/live-config@3.1.0
  - @ledgerhq/live-env@2.2.0
  - @ledgerhq/device-core@0.3.2
  - @ledgerhq/live-network@1.4.0
  - @ledgerhq/live-nft@0.4.4
  - @ledgerhq/coin-evm@2.1.4
  - @ledgerhq/coin-ton@0.3.12
  - @ledgerhq/hw-app-eth@6.38.0
  - @ledgerhq/coin-tron@0.0.4
  - @ledgerhq/coin-algorand@0.5.4
  - @ledgerhq/coin-bitcoin@0.7.2
  - @ledgerhq/coin-icon@0.4.1
  - @ledgerhq/coin-near@0.5.4
  - @ledgerhq/coin-solana@0.7.4
  - @ledgerhq/coin-stellar@0.2.2
  - @ledgerhq/live-countervalues@0.2.4
  - @ledgerhq/live-countervalues-react@0.2.4
  - @ledgerhq/hw-app-vet@0.2.4
  - @ledgerhq/speculos-transport@0.1.4

## 34.7.0-next.1

### Patch Changes

- Updated dependencies [[`50b6db6`](https://github.com/LedgerHQ/ledger-live/commit/50b6db67d374a23ba040043aa93e7fbc52685297)]:
  - @ledgerhq/cryptoassets@13.3.0-next.1
  - @ledgerhq/coin-framework@0.17.0-next.1
  - @ledgerhq/coin-algorand@0.5.4-next.1
  - @ledgerhq/coin-bitcoin@0.7.2-next.1
  - @ledgerhq/coin-cardano@0.1.4-next.1
  - @ledgerhq/coin-evm@2.1.4-next.1
  - @ledgerhq/coin-icon@0.4.1-next.1
  - @ledgerhq/coin-near@0.5.4-next.1
  - @ledgerhq/coin-polkadot@1.2.0-next.1
  - @ledgerhq/coin-solana@0.7.4-next.1
  - @ledgerhq/coin-stellar@0.2.2-next.1
  - @ledgerhq/coin-tezos@0.6.0-next.1
  - @ledgerhq/coin-ton@0.3.12-next.1
  - @ledgerhq/coin-tron@0.0.4-next.1
  - @ledgerhq/coin-xrp@0.5.0-next.1
  - @ledgerhq/hw-app-eth@6.38.0-next.1
  - @ledgerhq/hw-app-vet@0.2.4-next.1
  - @ledgerhq/live-countervalues@0.2.4-next.1
  - @ledgerhq/live-countervalues-react@0.2.4-next.1
  - @ledgerhq/live-nft@0.4.4-next.1
  - @ledgerhq/live-wallet@0.5.0-next.1

## 34.7.0-next.0

### Minor Changes

- [#7075](https://github.com/LedgerHQ/ledger-live/pull/7075) [`db9c2d7`](https://github.com/LedgerHQ/ledger-live/commit/db9c2d78fb74df586c3ea1b9fb75ce3b014a0f4b) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Integrate Sync, Send, Receive, Create Account for Icon network

- [#7394](https://github.com/LedgerHQ/ledger-live/pull/7394) [`4bd91de`](https://github.com/LedgerHQ/ledger-live/commit/4bd91de13442d12acce3ee83d5f2fd5f087570cf) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - Support for TON blockchain

- [#7497](https://github.com/LedgerHQ/ledger-live/pull/7497) [`52daa39`](https://github.com/LedgerHQ/ledger-live/commit/52daa3998709ac3538afd447fe771faa3e3441be) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Added parameters to lldWalletSync and llmWalletSync to be able to configure the wallet sync feature remotely

### Patch Changes

- [#7363](https://github.com/LedgerHQ/ledger-live/pull/7363) [`3164745`](https://github.com/LedgerHQ/ledger-live/commit/31647459be359bd286c6a97acbc5a75660c32192) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Improve Search for Market when >=2 chars

- [#7490](https://github.com/LedgerHQ/ledger-live/pull/7490) [`03711d5`](https://github.com/LedgerHQ/ledger-live/commit/03711d54b37e7dc613091bb4eb2b150549ae370a) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - replace static data by cdn data

- [#7403](https://github.com/LedgerHQ/ledger-live/pull/7403) [`df9b4b7`](https://github.com/LedgerHQ/ledger-live/commit/df9b4b7b699503bb3aab1dc791b28e11ef0d51b9) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add ordinals feature flag

- [#7453](https://github.com/LedgerHQ/ledger-live/pull/7453) [`87d6bb2`](https://github.com/LedgerHQ/ledger-live/commit/87d6bb2501eac654dc10f45a0f591b28569b3d9f) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Remove listAppsV2minor1 feature flag and all code associated to list apps v1

- [#7466](https://github.com/LedgerHQ/ledger-live/pull/7466) [`1837d42`](https://github.com/LedgerHQ/ledger-live/commit/1837d42491df591a38755278c1e5bf9e4987fb26) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - [tron] display tron keep alive as error not warning

- [#7419](https://github.com/LedgerHQ/ledger-live/pull/7419) [`58c4bee`](https://github.com/LedgerHQ/ledger-live/commit/58c4beefb618cbad7e5f1ff7dfbf946f3bb763f7) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - [tron swap] fix negative amountTo when max switch is on

- [#7296](https://github.com/LedgerHQ/ledger-live/pull/7296) [`7f2ca21`](https://github.com/LedgerHQ/ledger-live/commit/7f2ca21ba29c52a99c1c004173c19bf9cf8082b5) Thanks [@CremaFR](https://github.com/CremaFR)! - feat: extracted fee drawer for swap live app

- [#7504](https://github.com/LedgerHQ/ledger-live/pull/7504) [`22ed462`](https://github.com/LedgerHQ/ledger-live/commit/22ed4624837be92a45c8b32ee6a76eedb094e937) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Force version 3.2.0 of @ton/crypto because 3.3.0 is bugged in the RN context

- [#7406](https://github.com/LedgerHQ/ledger-live/pull/7406) [`c433193`](https://github.com/LedgerHQ/ledger-live/commit/c433193298e86d758d727296bf51271e7d3a5871) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - set tezos gasfeeslimit minvalue

- [#7462](https://github.com/LedgerHQ/ledger-live/pull/7462) [`cd1fee0`](https://github.com/LedgerHQ/ledger-live/commit/cd1fee0030a588a385ca4f58864eebbcf788b795) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Add restore app data use case.

- [#7328](https://github.com/LedgerHQ/ledger-live/pull/7328) [`a0a36e5`](https://github.com/LedgerHQ/ledger-live/commit/a0a36e5fe86865a5643b38ed8d56e93cbda07e15) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Add app data backup use case for desktop

- Updated dependencies [[`1440323`](https://github.com/LedgerHQ/ledger-live/commit/144032348fcac45eb797c5e724cf5f654c9d3527), [`afa03ae`](https://github.com/LedgerHQ/ledger-live/commit/afa03ae921ad1ca7df83dc0ba717c1cc27cb08cd), [`3415d7d`](https://github.com/LedgerHQ/ledger-live/commit/3415d7df077e0c1d44d0d0ce9a26efd8e5ac4811), [`db9c2d7`](https://github.com/LedgerHQ/ledger-live/commit/db9c2d78fb74df586c3ea1b9fb75ce3b014a0f4b), [`555d61f`](https://github.com/LedgerHQ/ledger-live/commit/555d61fae0faa823fcbb210e7ea2c69818d849fd), [`4bd91de`](https://github.com/LedgerHQ/ledger-live/commit/4bd91de13442d12acce3ee83d5f2fd5f087570cf), [`a0a36e5`](https://github.com/LedgerHQ/ledger-live/commit/a0a36e5fe86865a5643b38ed8d56e93cbda07e15), [`53ff78c`](https://github.com/LedgerHQ/ledger-live/commit/53ff78c541d3ed69a3e74854d77f58a7e0d93978), [`37c0b90`](https://github.com/LedgerHQ/ledger-live/commit/37c0b90becb5911c8244015165f6500c97acf8ef), [`ecc3ee4`](https://github.com/LedgerHQ/ledger-live/commit/ecc3ee46b8d5bf5631bcbcf73b3c3a2fb1a8964d), [`8553b3e`](https://github.com/LedgerHQ/ledger-live/commit/8553b3eef10132396ec580a2d5f20b616f5b18a0), [`52daa39`](https://github.com/LedgerHQ/ledger-live/commit/52daa3998709ac3538afd447fe771faa3e3441be), [`db826f8`](https://github.com/LedgerHQ/ledger-live/commit/db826f8ee54dac8bc460abde6991073892a769cc), [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c), [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c), [`c540b7a`](https://github.com/LedgerHQ/ledger-live/commit/c540b7a4450e52c0d2ac00afd8f081c9fa650ec4), [`c94d878`](https://github.com/LedgerHQ/ledger-live/commit/c94d878056f7ddace40cee1dae863f7080ec10d9), [`22ed462`](https://github.com/LedgerHQ/ledger-live/commit/22ed4624837be92a45c8b32ee6a76eedb094e937), [`c433193`](https://github.com/LedgerHQ/ledger-live/commit/c433193298e86d758d727296bf51271e7d3a5871), [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c), [`4179bb8`](https://github.com/LedgerHQ/ledger-live/commit/4179bb89a316843a869bd485157ed141d9d9c84e)]:
  - @ledgerhq/live-wallet@0.5.0-next.0
  - @ledgerhq/coin-polkadot@1.2.0-next.0
  - @ledgerhq/coin-tezos@0.6.0-next.0
  - @ledgerhq/coin-xrp@0.5.0-next.0
  - @ledgerhq/coin-framework@0.17.0-next.0
  - @ledgerhq/crypto-icons-ui@1.4.0-next.0
  - @ledgerhq/cryptoassets@13.3.0-next.0
  - @ledgerhq/hw-app-icon@1.1.0-next.0
  - @ledgerhq/coin-cardano@0.1.4-next.0
  - @ledgerhq/live-config@3.1.0-next.0
  - @ledgerhq/live-env@2.2.0-next.0
  - @ledgerhq/device-core@0.3.2-next.0
  - @ledgerhq/live-network@1.4.0-next.0
  - @ledgerhq/live-nft@0.4.4-next.0
  - @ledgerhq/coin-evm@2.1.4-next.0
  - @ledgerhq/coin-ton@0.3.12-next.0
  - @ledgerhq/hw-app-eth@6.38.0-next.0
  - @ledgerhq/coin-tron@0.0.4-next.0
  - @ledgerhq/coin-algorand@0.5.4-next.0
  - @ledgerhq/coin-bitcoin@0.7.2-next.0
  - @ledgerhq/coin-icon@0.4.1-next.0
  - @ledgerhq/coin-near@0.5.4-next.0
  - @ledgerhq/coin-solana@0.7.4-next.0
  - @ledgerhq/coin-stellar@0.2.2-next.0
  - @ledgerhq/live-countervalues@0.2.4-next.0
  - @ledgerhq/live-countervalues-react@0.2.4-next.0
  - @ledgerhq/hw-app-vet@0.2.4-next.0
  - @ledgerhq/speculos-transport@0.1.4-next.0

## 34.6.1

### Patch Changes

- Updated dependencies [[`0b12c90`](https://github.com/LedgerHQ/ledger-live/commit/0b12c9040d6ee0a326b1d5effd261ddee2db452f), [`5451145`](https://github.com/LedgerHQ/ledger-live/commit/54511453591d3702e09ca77559bb0564937b2a65)]:
  - @ledgerhq/devices@8.4.2
  - @ledgerhq/device-core@0.3.1
  - @ledgerhq/coin-framework@0.16.1
  - @ledgerhq/coin-algorand@0.5.3
  - @ledgerhq/coin-bitcoin@0.7.1
  - @ledgerhq/coin-cardano@0.1.3
  - @ledgerhq/coin-evm@2.1.3
  - @ledgerhq/coin-near@0.5.3
  - @ledgerhq/coin-polkadot@1.1.1
  - @ledgerhq/coin-solana@0.7.3
  - @ledgerhq/coin-stellar@0.2.1
  - @ledgerhq/coin-tezos@0.5.1
  - @ledgerhq/coin-tron@0.0.3
  - @ledgerhq/coin-xrp@0.4.1
  - @ledgerhq/hw-transport@6.31.2
  - @ledgerhq/live-wallet@0.4.1
  - @ledgerhq/speculos-transport@0.1.3
  - @ledgerhq/live-countervalues@0.2.3
  - @ledgerhq/live-countervalues-react@0.2.3
  - @ledgerhq/live-nft@0.4.3
  - @ledgerhq/hw-app-algorand@6.29.2
  - @ledgerhq/hw-app-btc@10.4.1
  - @ledgerhq/hw-app-cosmos@6.30.2
  - @ledgerhq/hw-app-eth@6.37.3
  - @ledgerhq/hw-app-exchange@0.5.2
  - @ledgerhq/hw-app-near@6.29.2
  - @ledgerhq/hw-app-polkadot@6.31.2
  - @ledgerhq/hw-app-solana@7.2.2
  - @ledgerhq/hw-app-str@7.0.2
  - @ledgerhq/hw-app-tezos@6.29.2
  - @ledgerhq/hw-app-trx@6.29.2
  - @ledgerhq/hw-app-vet@0.2.3
  - @ledgerhq/hw-app-xrp@6.29.2
  - @ledgerhq/hw-transport-mocker@6.29.2

## 34.6.1-hotfix.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-wallet@0.4.1-hotfix.1

## 34.6.1-hotfix.0

### Patch Changes

- Updated dependencies [[`5d508e5`](https://github.com/LedgerHQ/ledger-live/commit/5d508e5cfd296e458746adf176dd292aa884f7ea), [`6b2fc93`](https://github.com/LedgerHQ/ledger-live/commit/6b2fc93beb6624fb2d991a6bb69cea3e9a8ef453)]:
  - @ledgerhq/devices@8.4.2-hotfix.0
  - @ledgerhq/device-core@0.3.1-hotfix.0
  - @ledgerhq/coin-framework@0.16.1-hotfix.0
  - @ledgerhq/coin-algorand@0.5.3-hotfix.0
  - @ledgerhq/coin-bitcoin@0.7.1-hotfix.0
  - @ledgerhq/coin-cardano@0.1.3-hotfix.0
  - @ledgerhq/coin-evm@2.1.3-hotfix.0
  - @ledgerhq/coin-near@0.5.3-hotfix.0
  - @ledgerhq/coin-polkadot@1.1.1-hotfix.0
  - @ledgerhq/coin-solana@0.7.3-hotfix.0
  - @ledgerhq/coin-stellar@0.2.1-hotfix.0
  - @ledgerhq/coin-tezos@0.5.1-hotfix.0
  - @ledgerhq/coin-tron@0.0.3-hotfix.0
  - @ledgerhq/coin-xrp@0.4.1-hotfix.0
  - @ledgerhq/hw-transport@6.31.2-hotfix.0
  - @ledgerhq/live-wallet@0.4.1-hotfix.0
  - @ledgerhq/speculos-transport@0.1.3-hotfix.0
  - @ledgerhq/live-countervalues@0.2.3-hotfix.0
  - @ledgerhq/live-countervalues-react@0.2.3-hotfix.0
  - @ledgerhq/live-nft@0.4.3-hotfix.0
  - @ledgerhq/hw-app-algorand@6.29.2-hotfix.0
  - @ledgerhq/hw-app-btc@10.4.1-hotfix.0
  - @ledgerhq/hw-app-cosmos@6.30.2-hotfix.0
  - @ledgerhq/hw-app-eth@6.37.3-hotfix.0
  - @ledgerhq/hw-app-exchange@0.5.2-hotfix.0
  - @ledgerhq/hw-app-near@6.29.2-hotfix.0
  - @ledgerhq/hw-app-polkadot@6.31.2-hotfix.0
  - @ledgerhq/hw-app-solana@7.2.2-hotfix.0
  - @ledgerhq/hw-app-str@7.0.2-hotfix.0
  - @ledgerhq/hw-app-tezos@6.29.2-hotfix.0
  - @ledgerhq/hw-app-trx@6.29.2-hotfix.0
  - @ledgerhq/hw-app-vet@0.2.3-hotfix.0
  - @ledgerhq/hw-app-xrp@6.29.2-hotfix.0
  - @ledgerhq/hw-transport-mocker@6.29.2-hotfix.0

## 34.6.0

### Minor Changes

- [#7138](https://github.com/LedgerHQ/ledger-live/pull/7138) [`ef2d53d`](https://github.com/LedgerHQ/ledger-live/commit/ef2d53d514f1f4e6f18fc79fa3423bd9b0208a04) Thanks [@lvndry](https://github.com/lvndry)! - removes via, vtc and ppc support

- [#7295](https://github.com/LedgerHQ/ledger-live/pull/7295) [`c59b06f`](https://github.com/LedgerHQ/ledger-live/commit/c59b06f5a904366ae98840cad316855a8a92c1bc) Thanks [@KVNLS](https://github.com/KVNLS)! - Fix Cosmos library to sign tx

- [#7221](https://github.com/LedgerHQ/ledger-live/pull/7221) [`52db252`](https://github.com/LedgerHQ/ledger-live/commit/52db252757870398cba5366d595b4d5fe8099b90) Thanks [@Justkant](https://github.com/Justkant)! - feat(LLM): web3hub FF to replace discover section [LIVE-13124]

- [#7160](https://github.com/LedgerHQ/ledger-live/pull/7160) [`b14d37d`](https://github.com/LedgerHQ/ledger-live/commit/b14d37dc7bd4708950ecde4ace9b121c436935bc) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Expose API on CoinModule (Xrp and Polkadot) so they can be used in a dedicated service

- [#7194](https://github.com/LedgerHQ/ledger-live/pull/7194) [`c59adf2`](https://github.com/LedgerHQ/ledger-live/commit/c59adf2b0d49ea3c72b94fcb356eb72bcbfc4a6b) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Expose Tezos features for Alpaca

### Patch Changes

- [#7353](https://github.com/LedgerHQ/ledger-live/pull/7353) [`f717195`](https://github.com/LedgerHQ/ledger-live/commit/f7171954d3c1c5bfd223841720522818499abcc4) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Throw notenoughgas for tron token remove NotEnoughBalance from useFromAmountStatusMessage

- [#7158](https://github.com/LedgerHQ/ledger-live/pull/7158) [`0cee1a6`](https://github.com/LedgerHQ/ledger-live/commit/0cee1a68f932adebb5a147854f0973c7cb0c756e) Thanks [@lawRathod](https://github.com/lawRathod)! - Drop casper address checksum encoding to make addresses more compliant to other exchanges

- [#7230](https://github.com/LedgerHQ/ledger-live/pull/7230) [`fdc6453`](https://github.com/LedgerHQ/ledger-live/commit/fdc645396b22e1440868b68ba19189cd041603d8) Thanks [@Justkant](https://github.com/Justkant)! - fix(wallet-api): avoid caching listCurrencies result too early [LIVE-13205]

- [#7278](https://github.com/LedgerHQ/ledger-live/pull/7278) [`383ecdd`](https://github.com/LedgerHQ/ledger-live/commit/383ecdda660f91f1ef9d50910174f1f3d97b2747) Thanks [@CremaFR](https://github.com/CremaFR)! - fix: getAvailableProviders returns CAL providers

- [#7197](https://github.com/LedgerHQ/ledger-live/pull/7197) [`f819703`](https://github.com/LedgerHQ/ledger-live/commit/f81970347d139e63a547ab809be425d6f4d464a4) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove all code associated to referralProgram feature flag on LLM. Only the code that would be used if the feature flag is enabled

- [#7149](https://github.com/LedgerHQ/ledger-live/pull/7149) [`f4f7b0a`](https://github.com/LedgerHQ/ledger-live/commit/f4f7b0a575f85ef7625e7e982ffbd77ea57a2575) Thanks [@cng-ledger](https://github.com/cng-ledger)! - fix(LIVE-13069): swap currencies api cache

- [#7343](https://github.com/LedgerHQ/ledger-live/pull/7343) [`2e99ffc`](https://github.com/LedgerHQ/ledger-live/commit/2e99ffc1febe7778e8a96927060718bc77856732) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Use eq comparitor for bignumber

- [#7189](https://github.com/LedgerHQ/ledger-live/pull/7189) [`a0e3a56`](https://github.com/LedgerHQ/ledger-live/commit/a0e3a56244d92ca62e5c0b3899d0ca18c54e5df9) Thanks [@lvndry](https://github.com/lvndry)! - Move stellar logic to coin-stellar

- [#7277](https://github.com/LedgerHQ/ledger-live/pull/7277) [`289996a`](https://github.com/LedgerHQ/ledger-live/commit/289996ac487b1f3c4f95afa3218b1c86218a30c2) Thanks [@CremaFR](https://github.com/CremaFR)! - fix: regression stop ignoring all swaps error

- [#7036](https://github.com/LedgerHQ/ledger-live/pull/7036) [`57c2c48`](https://github.com/LedgerHQ/ledger-live/commit/57c2c486bf76e531bfb6e27d0c40aeb9144b3636) Thanks [@valpinkman](https://github.com/valpinkman)! - Add a quitApp before launching the renameDevice device flow

- [#7256](https://github.com/LedgerHQ/ledger-live/pull/7256) [`6353cea`](https://github.com/LedgerHQ/ledger-live/commit/6353cea99f7ba6e604b7c7708b056aae817150a4) Thanks [@CremaFR](https://github.com/CremaFR)! - fix: fallback for CDN/CAL failure

- [#7133](https://github.com/LedgerHQ/ledger-live/pull/7133) [`5d17fab`](https://github.com/LedgerHQ/ledger-live/commit/5d17fab23f59b888190cd9e122165be6d0eb8c55) Thanks [@CremaFR](https://github.com/CremaFR)! - fix: incorrect error message on NotEnoughBalance

- [#7074](https://github.com/LedgerHQ/ledger-live/pull/7074) [`1cbf767`](https://github.com/LedgerHQ/ledger-live/commit/1cbf767465d9e1f7bed5de79c5b5a0a5ca06e1b5) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - refactor Swap FF logic and rollback "Add account banner" for demo1

- [#7286](https://github.com/LedgerHQ/ledger-live/pull/7286) [`f979216`](https://github.com/LedgerHQ/ledger-live/commit/f9792160293fc8215c6d099f02e1b136c6655f9b) Thanks [@CremaFR](https://github.com/CremaFR)! - fix: tron max value computation

- [#7202](https://github.com/LedgerHQ/ledger-live/pull/7202) [`c1d2bb0`](https://github.com/LedgerHQ/ledger-live/commit/c1d2bb0866723c10d6e2899d40ddd9b9801189f4) Thanks [@CremaFR](https://github.com/CremaFR)! - feat transform NotEnoughBalance into specific error for swap to have different error messages

- Updated dependencies [[`ef2d53d`](https://github.com/LedgerHQ/ledger-live/commit/ef2d53d514f1f4e6f18fc79fa3423bd9b0208a04), [`f717195`](https://github.com/LedgerHQ/ledger-live/commit/f7171954d3c1c5bfd223841720522818499abcc4), [`b77ab8e`](https://github.com/LedgerHQ/ledger-live/commit/b77ab8e718ee8e10b74dc15370e8a19d2597d39e), [`4d567da`](https://github.com/LedgerHQ/ledger-live/commit/4d567da94cde447400328b1dabe129fbf8b917cd), [`f0ed580`](https://github.com/LedgerHQ/ledger-live/commit/f0ed580b0e71c1f1aa1b38f6ef7a536f14a5e750), [`d540c6e`](https://github.com/LedgerHQ/ledger-live/commit/d540c6e5ef70261bcc102d1e8e23cdd83fe064ec), [`7909030`](https://github.com/LedgerHQ/ledger-live/commit/79090300ca478f51166edbad5fb4d889a6f7bfe8), [`201cf62`](https://github.com/LedgerHQ/ledger-live/commit/201cf622ee3994a4a0c65672183d469a0d1b52fe), [`a0e3a56`](https://github.com/LedgerHQ/ledger-live/commit/a0e3a56244d92ca62e5c0b3899d0ca18c54e5df9), [`fe8a26b`](https://github.com/LedgerHQ/ledger-live/commit/fe8a26b04206df64e50220c3e9249c9a1bd057a6), [`1e7f4ca`](https://github.com/LedgerHQ/ledger-live/commit/1e7f4ca3cad57bacfdb4212f6a8b1614c601e5a2), [`b14d37d`](https://github.com/LedgerHQ/ledger-live/commit/b14d37dc7bd4708950ecde4ace9b121c436935bc), [`e78f3b7`](https://github.com/LedgerHQ/ledger-live/commit/e78f3b75296c7a063f6cddbeae44c36d236055f3), [`f979216`](https://github.com/LedgerHQ/ledger-live/commit/f9792160293fc8215c6d099f02e1b136c6655f9b), [`ac58825`](https://github.com/LedgerHQ/ledger-live/commit/ac58825de73832da71d587911ab9b2635ad16ccf), [`370285f`](https://github.com/LedgerHQ/ledger-live/commit/370285fd5464477526678e8303f4413fea8bcbbe), [`76becbb`](https://github.com/LedgerHQ/ledger-live/commit/76becbbd99330ec0e7dce63437d437ce6c559cb7), [`c1d2bb0`](https://github.com/LedgerHQ/ledger-live/commit/c1d2bb0866723c10d6e2899d40ddd9b9801189f4), [`c59adf2`](https://github.com/LedgerHQ/ledger-live/commit/c59adf2b0d49ea3c72b94fcb356eb72bcbfc4a6b)]:
  - @ledgerhq/cryptoassets@13.2.0
  - @ledgerhq/hw-app-btc@10.4.0
  - @ledgerhq/coin-bitcoin@0.7.0
  - @ledgerhq/crypto-icons-ui@1.3.0
  - @ledgerhq/coin-framework@0.16.0
  - @ledgerhq/live-wallet@0.4.0
  - @ledgerhq/coin-tron@0.0.2
  - @ledgerhq/coin-polkadot@1.1.0
  - @ledgerhq/coin-tezos@0.5.0
  - @ledgerhq/coin-stellar@0.2.0
  - @ledgerhq/coin-solana@0.7.2
  - @ledgerhq/coin-xrp@0.4.0
  - @ledgerhq/errors@6.18.0
  - @ledgerhq/device-core@0.3.0
  - @ledgerhq/coin-algorand@0.5.2
  - @ledgerhq/coin-cardano@0.1.2
  - @ledgerhq/coin-evm@2.1.2
  - @ledgerhq/coin-near@0.5.2
  - @ledgerhq/live-countervalues@0.2.2
  - @ledgerhq/live-countervalues-react@0.2.2
  - @ledgerhq/live-nft@0.4.2
  - @ledgerhq/hw-app-eth@6.37.2
  - @ledgerhq/hw-app-vet@0.2.2
  - @ledgerhq/devices@8.4.1
  - @ledgerhq/hw-app-algorand@6.29.1
  - @ledgerhq/hw-app-cosmos@6.30.1
  - @ledgerhq/hw-app-exchange@0.5.1
  - @ledgerhq/hw-app-polkadot@6.31.1
  - @ledgerhq/hw-app-solana@7.2.1
  - @ledgerhq/hw-app-str@7.0.1
  - @ledgerhq/hw-transport@6.31.1
  - @ledgerhq/live-network@1.3.1
  - @ledgerhq/speculos-transport@0.1.2
  - @ledgerhq/hw-app-near@6.29.1
  - @ledgerhq/hw-app-tezos@6.29.1
  - @ledgerhq/hw-app-trx@6.29.1
  - @ledgerhq/hw-app-xrp@6.29.1
  - @ledgerhq/hw-transport-mocker@6.29.1

## 34.6.0-next.4

### Patch Changes

- [#7353](https://github.com/LedgerHQ/ledger-live/pull/7353) [`f717195`](https://github.com/LedgerHQ/ledger-live/commit/f7171954d3c1c5bfd223841720522818499abcc4) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Throw notenoughgas for tron token remove NotEnoughBalance from useFromAmountStatusMessage

- Updated dependencies [[`f717195`](https://github.com/LedgerHQ/ledger-live/commit/f7171954d3c1c5bfd223841720522818499abcc4)]:
  - @ledgerhq/coin-tron@0.0.2-next.1

## 34.6.0-next.3

### Patch Changes

- [#7343](https://github.com/LedgerHQ/ledger-live/pull/7343) [`2e99ffc`](https://github.com/LedgerHQ/ledger-live/commit/2e99ffc1febe7778e8a96927060718bc77856732) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Use eq comparitor for bignumber

## 34.6.0-next.2

### Patch Changes

- Updated dependencies [[`d540c6e`](https://github.com/LedgerHQ/ledger-live/commit/d540c6e5ef70261bcc102d1e8e23cdd83fe064ec)]:
  - @ledgerhq/coin-tezos@0.5.0-next.1

## 34.6.0-next.1

### Minor Changes

- [#7295](https://github.com/LedgerHQ/ledger-live/pull/7295) [`c59b06f`](https://github.com/LedgerHQ/ledger-live/commit/c59b06f5a904366ae98840cad316855a8a92c1bc) Thanks [@KVNLS](https://github.com/KVNLS)! - Fix Cosmos library to sign tx

## 34.6.0-next.0

### Minor Changes

- [#7138](https://github.com/LedgerHQ/ledger-live/pull/7138) [`ef2d53d`](https://github.com/LedgerHQ/ledger-live/commit/ef2d53d514f1f4e6f18fc79fa3423bd9b0208a04) Thanks [@lvndry](https://github.com/lvndry)! - removes via, vtc and ppc support

- [#7221](https://github.com/LedgerHQ/ledger-live/pull/7221) [`52db252`](https://github.com/LedgerHQ/ledger-live/commit/52db252757870398cba5366d595b4d5fe8099b90) Thanks [@Justkant](https://github.com/Justkant)! - feat(LLM): web3hub FF to replace discover section [LIVE-13124]

- [#7160](https://github.com/LedgerHQ/ledger-live/pull/7160) [`b14d37d`](https://github.com/LedgerHQ/ledger-live/commit/b14d37dc7bd4708950ecde4ace9b121c436935bc) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Expose API on CoinModule (Xrp and Polkadot) so they can be used in a dedicated service

- [#7194](https://github.com/LedgerHQ/ledger-live/pull/7194) [`c59adf2`](https://github.com/LedgerHQ/ledger-live/commit/c59adf2b0d49ea3c72b94fcb356eb72bcbfc4a6b) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Expose Tezos features for Alpaca

### Patch Changes

- [#7158](https://github.com/LedgerHQ/ledger-live/pull/7158) [`0cee1a6`](https://github.com/LedgerHQ/ledger-live/commit/0cee1a68f932adebb5a147854f0973c7cb0c756e) Thanks [@lawRathod](https://github.com/lawRathod)! - Drop casper address checksum encoding to make addresses more compliant to other exchanges

- [#7230](https://github.com/LedgerHQ/ledger-live/pull/7230) [`fdc6453`](https://github.com/LedgerHQ/ledger-live/commit/fdc645396b22e1440868b68ba19189cd041603d8) Thanks [@Justkant](https://github.com/Justkant)! - fix(wallet-api): avoid caching listCurrencies result too early [LIVE-13205]

- [#7278](https://github.com/LedgerHQ/ledger-live/pull/7278) [`383ecdd`](https://github.com/LedgerHQ/ledger-live/commit/383ecdda660f91f1ef9d50910174f1f3d97b2747) Thanks [@CremaFR](https://github.com/CremaFR)! - fix: getAvailableProviders returns CAL providers

- [#7197](https://github.com/LedgerHQ/ledger-live/pull/7197) [`f819703`](https://github.com/LedgerHQ/ledger-live/commit/f81970347d139e63a547ab809be425d6f4d464a4) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove all code associated to referralProgram feature flag on LLM. Only the code that would be used if the feature flag is enabled

- [#7149](https://github.com/LedgerHQ/ledger-live/pull/7149) [`f4f7b0a`](https://github.com/LedgerHQ/ledger-live/commit/f4f7b0a575f85ef7625e7e982ffbd77ea57a2575) Thanks [@cng-ledger](https://github.com/cng-ledger)! - fix(LIVE-13069): swap currencies api cache

- [#7189](https://github.com/LedgerHQ/ledger-live/pull/7189) [`a0e3a56`](https://github.com/LedgerHQ/ledger-live/commit/a0e3a56244d92ca62e5c0b3899d0ca18c54e5df9) Thanks [@lvndry](https://github.com/lvndry)! - Move stellar logic to coin-stellar

- [#7277](https://github.com/LedgerHQ/ledger-live/pull/7277) [`289996a`](https://github.com/LedgerHQ/ledger-live/commit/289996ac487b1f3c4f95afa3218b1c86218a30c2) Thanks [@CremaFR](https://github.com/CremaFR)! - fix: regression stop ignoring all swaps error

- [#7036](https://github.com/LedgerHQ/ledger-live/pull/7036) [`57c2c48`](https://github.com/LedgerHQ/ledger-live/commit/57c2c486bf76e531bfb6e27d0c40aeb9144b3636) Thanks [@valpinkman](https://github.com/valpinkman)! - Add a quitApp before launching the renameDevice device flow

- [#7256](https://github.com/LedgerHQ/ledger-live/pull/7256) [`6353cea`](https://github.com/LedgerHQ/ledger-live/commit/6353cea99f7ba6e604b7c7708b056aae817150a4) Thanks [@CremaFR](https://github.com/CremaFR)! - fix: fallback for CDN/CAL failure

- [#7133](https://github.com/LedgerHQ/ledger-live/pull/7133) [`5d17fab`](https://github.com/LedgerHQ/ledger-live/commit/5d17fab23f59b888190cd9e122165be6d0eb8c55) Thanks [@CremaFR](https://github.com/CremaFR)! - fix: incorrect error message on NotEnoughBalance

- [#7074](https://github.com/LedgerHQ/ledger-live/pull/7074) [`1cbf767`](https://github.com/LedgerHQ/ledger-live/commit/1cbf767465d9e1f7bed5de79c5b5a0a5ca06e1b5) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - refactor Swap FF logic and rollback "Add account banner" for demo1

- [#7286](https://github.com/LedgerHQ/ledger-live/pull/7286) [`f979216`](https://github.com/LedgerHQ/ledger-live/commit/f9792160293fc8215c6d099f02e1b136c6655f9b) Thanks [@CremaFR](https://github.com/CremaFR)! - fix: tron max value computation

- [#7202](https://github.com/LedgerHQ/ledger-live/pull/7202) [`c1d2bb0`](https://github.com/LedgerHQ/ledger-live/commit/c1d2bb0866723c10d6e2899d40ddd9b9801189f4) Thanks [@CremaFR](https://github.com/CremaFR)! - feat transform NotEnoughBalance into specific error for swap to have different error messages

- Updated dependencies [[`ef2d53d`](https://github.com/LedgerHQ/ledger-live/commit/ef2d53d514f1f4e6f18fc79fa3423bd9b0208a04), [`b77ab8e`](https://github.com/LedgerHQ/ledger-live/commit/b77ab8e718ee8e10b74dc15370e8a19d2597d39e), [`4d567da`](https://github.com/LedgerHQ/ledger-live/commit/4d567da94cde447400328b1dabe129fbf8b917cd), [`f0ed580`](https://github.com/LedgerHQ/ledger-live/commit/f0ed580b0e71c1f1aa1b38f6ef7a536f14a5e750), [`7909030`](https://github.com/LedgerHQ/ledger-live/commit/79090300ca478f51166edbad5fb4d889a6f7bfe8), [`201cf62`](https://github.com/LedgerHQ/ledger-live/commit/201cf622ee3994a4a0c65672183d469a0d1b52fe), [`a0e3a56`](https://github.com/LedgerHQ/ledger-live/commit/a0e3a56244d92ca62e5c0b3899d0ca18c54e5df9), [`fe8a26b`](https://github.com/LedgerHQ/ledger-live/commit/fe8a26b04206df64e50220c3e9249c9a1bd057a6), [`1e7f4ca`](https://github.com/LedgerHQ/ledger-live/commit/1e7f4ca3cad57bacfdb4212f6a8b1614c601e5a2), [`b14d37d`](https://github.com/LedgerHQ/ledger-live/commit/b14d37dc7bd4708950ecde4ace9b121c436935bc), [`e78f3b7`](https://github.com/LedgerHQ/ledger-live/commit/e78f3b75296c7a063f6cddbeae44c36d236055f3), [`f979216`](https://github.com/LedgerHQ/ledger-live/commit/f9792160293fc8215c6d099f02e1b136c6655f9b), [`ac58825`](https://github.com/LedgerHQ/ledger-live/commit/ac58825de73832da71d587911ab9b2635ad16ccf), [`370285f`](https://github.com/LedgerHQ/ledger-live/commit/370285fd5464477526678e8303f4413fea8bcbbe), [`76becbb`](https://github.com/LedgerHQ/ledger-live/commit/76becbbd99330ec0e7dce63437d437ce6c559cb7), [`c1d2bb0`](https://github.com/LedgerHQ/ledger-live/commit/c1d2bb0866723c10d6e2899d40ddd9b9801189f4), [`c59adf2`](https://github.com/LedgerHQ/ledger-live/commit/c59adf2b0d49ea3c72b94fcb356eb72bcbfc4a6b)]:
  - @ledgerhq/cryptoassets@13.2.0-next.0
  - @ledgerhq/hw-app-btc@10.4.0-next.0
  - @ledgerhq/coin-bitcoin@0.7.0-next.0
  - @ledgerhq/crypto-icons-ui@1.3.0-next.0
  - @ledgerhq/coin-framework@0.16.0-next.0
  - @ledgerhq/live-wallet@0.4.0-next.0
  - @ledgerhq/coin-tron@0.0.2-next.0
  - @ledgerhq/coin-polkadot@1.1.0-next.0
  - @ledgerhq/coin-stellar@0.2.0-next.0
  - @ledgerhq/coin-solana@0.7.2-next.0
  - @ledgerhq/coin-xrp@0.4.0-next.0
  - @ledgerhq/errors@6.18.0-next.0
  - @ledgerhq/device-core@0.3.0-next.0
  - @ledgerhq/coin-tezos@0.5.0-next.0
  - @ledgerhq/coin-algorand@0.5.2-next.0
  - @ledgerhq/coin-cardano@0.1.2-next.0
  - @ledgerhq/coin-evm@2.1.2-next.0
  - @ledgerhq/coin-near@0.5.2-next.0
  - @ledgerhq/live-countervalues@0.2.2-next.0
  - @ledgerhq/live-countervalues-react@0.2.2-next.0
  - @ledgerhq/live-nft@0.4.2-next.0
  - @ledgerhq/hw-app-eth@6.37.2-next.0
  - @ledgerhq/hw-app-vet@0.2.2-next.0
  - @ledgerhq/devices@8.4.1-next.0
  - @ledgerhq/hw-app-algorand@6.29.1-next.0
  - @ledgerhq/hw-app-cosmos@6.30.1-next.0
  - @ledgerhq/hw-app-exchange@0.5.1-next.0
  - @ledgerhq/hw-app-polkadot@6.31.1-next.0
  - @ledgerhq/hw-app-solana@7.2.1-next.0
  - @ledgerhq/hw-app-str@7.0.1-next.0
  - @ledgerhq/hw-transport@6.31.1-next.0
  - @ledgerhq/live-network@1.3.1-next.0
  - @ledgerhq/speculos-transport@0.1.2-next.0
  - @ledgerhq/hw-app-near@6.29.1-next.0
  - @ledgerhq/hw-app-tezos@6.29.1-next.0
  - @ledgerhq/hw-app-trx@6.29.1-next.0
  - @ledgerhq/hw-app-xrp@6.29.1-next.0
  - @ledgerhq/hw-transport-mocker@6.29.1-next.0

## 34.5.0

### Minor Changes

- [#6891](https://github.com/LedgerHQ/ledger-live/pull/6891) [`d9f586e`](https://github.com/LedgerHQ/ledger-live/commit/d9f586ea4bd45d15f3e42c9f733f30dceef3027d) Thanks [@pavanvora](https://github.com/pavanvora)! - update ledgerjs to 7.1.2 to support cardano app v7

- [#6326](https://github.com/LedgerHQ/ledger-live/pull/6326) [`4b7f19c`](https://github.com/LedgerHQ/ledger-live/commit/4b7f19c96d95d86d5b6fbb480032d77532bf755e) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - polkadot generic nano app support

### Patch Changes

- [#7081](https://github.com/LedgerHQ/ledger-live/pull/7081) [`9551536`](https://github.com/LedgerHQ/ledger-live/commit/955153681ebc19344ed5becfbf7b131224b2ebd0) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Create feature flag for preparation of next feature

- [#6793](https://github.com/LedgerHQ/ledger-live/pull/6793) [`2e5d5bd`](https://github.com/LedgerHQ/ledger-live/commit/2e5d5bdb988c73c91f1fe42c809b192ca5dbeb7a) Thanks [@lawRathod](https://github.com/lawRathod)! - Add pending operations to stacks account object

- [#6923](https://github.com/LedgerHQ/ledger-live/pull/6923) [`782d637`](https://github.com/LedgerHQ/ledger-live/commit/782d637b5fba8c9c9d37609b6ad492f45a4b3737) Thanks [@overcat](https://github.com/overcat)! - Refactor `hw-app-str` and add `signSorobanAuthorization`. Please check the changelog and documentation of "@ledgerhq/hw-app-str" for more information.

  - `Str.getPublicKey`'s function signature has changed. Previously, it was `getPublicKey(path: string, boolValidate?: boolean, boolDisplay?: boolean): Promise<{ publicKey: string; raw: Buffer; }>` and now it is `async getPublicKey(path: string, display = false): Promise<{ rawPublicKey: Buffer }>`
  - `Str.signTransaction` will no longer automatically fallback to `Str.signHash`. If you want to sign a hash, you have to call `Str.signHash` directly.
  - Removed the fixed limit on the maximum length of the transaction in `Str.signTransaction`. Currently, if the transaction is too large for the device to handle, `StellarUserRefusedError` will be thrown.
  - Add `Str.signSorobanAuthorization` method to sign Stellar Soroban authorization.
  - `Str.getAppConfiguration` now returns `maxDataSize`, it represents the maximum size of the data that the device can processed.
  - Add error classes for better error handling, check the documentation for more information:
    - `StellarUserRefusedError`
    - `StellarHashSigningNotEnabledError`
    - `StellarDataTooLargeError`
    - `StellarDataParsingFailedError`

- [#7019](https://github.com/LedgerHQ/ledger-live/pull/7019) [`2e56708`](https://github.com/LedgerHQ/ledger-live/commit/2e567080b07abb8540907c0cb89457c746362917) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Create getAppsCatalogForDevice use case

- [#7019](https://github.com/LedgerHQ/ledger-live/pull/7019) [`2e56708`](https://github.com/LedgerHQ/ledger-live/commit/2e567080b07abb8540907c0cb89457c746362917) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Refactor "app update available" logic to only rely on v2 manager apis

- [#7120](https://github.com/LedgerHQ/ledger-live/pull/7120) [`d2368f6`](https://github.com/LedgerHQ/ledger-live/commit/d2368f632b834207c33df14468599b6a543d11da) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - List apps v2: fix filtering of apps with isDevMode

- [#7094](https://github.com/LedgerHQ/ledger-live/pull/7094) [`785c618`](https://github.com/LedgerHQ/ledger-live/commit/785c6180c2212ca879c2fddb8302f0bab5686761) Thanks [@CremaFR](https://github.com/CremaFR)! - prevent TRC20 swaps if empty tron account

- [#7137](https://github.com/LedgerHQ/ledger-live/pull/7137) [`9e82327`](https://github.com/LedgerHQ/ledger-live/commit/9e823278b69d7ccd5f8927f699930172cd50a59d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update Cosmos snapshots

- [#7090](https://github.com/LedgerHQ/ledger-live/pull/7090) [`fc6d09b`](https://github.com/LedgerHQ/ledger-live/commit/fc6d09be89a6e8775d77b98d5a0256b68346a14d) Thanks [@CremaFR](https://github.com/CremaFR)! - bugfix: incorrect fee computation for erc20 when using max button

- [#7087](https://github.com/LedgerHQ/ledger-live/pull/7087) [`6b3c8ca`](https://github.com/LedgerHQ/ledger-live/commit/6b3c8cab371db8212e1b0a02f03bb0baa46ce95c) Thanks [@CremaFR](https://github.com/CremaFR)! - fixed tron activation fee

- [#6968](https://github.com/LedgerHQ/ledger-live/pull/6968) [`c988a94`](https://github.com/LedgerHQ/ledger-live/commit/c988a946d86e7f874823ac96d66573281ba00b13) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - fix crypto-assets-service integration using wrong URL

- [#7206](https://github.com/LedgerHQ/ledger-live/pull/7206) [`81e5b8b`](https://github.com/LedgerHQ/ledger-live/commit/81e5b8bf4830dcb9d666436f2cc4367d92e93e78) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - chore: resolve merge conflicts

- [#7188](https://github.com/LedgerHQ/ledger-live/pull/7188) [`d13a5d7`](https://github.com/LedgerHQ/ledger-live/commit/d13a5d7f8f23624feb3a4a041cd7966d3b100dcf) Thanks [@cng-ledger](https://github.com/cng-ledger)! - fix(LIVE-13071): use not enough gas error for Tron

- [#7217](https://github.com/LedgerHQ/ledger-live/pull/7217) [`fec3dc8`](https://github.com/LedgerHQ/ledger-live/commit/fec3dc84ea00fc6f7f632942826978607e20c2ff) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - update snapshots

- [#7058](https://github.com/LedgerHQ/ledger-live/pull/7058) [`6692f5f`](https://github.com/LedgerHQ/ledger-live/commit/6692f5fe6701a4e47c626ea3cbb73a4641c9021d) Thanks [@andreicovaciu](https://github.com/andreicovaciu)! - Sends device value for swap accepted & cancelled operations

- Updated dependencies [[`bc8114c`](https://github.com/LedgerHQ/ledger-live/commit/bc8114c0a9a90bf95d57087710b405730b9a6a17), [`782d637`](https://github.com/LedgerHQ/ledger-live/commit/782d637b5fba8c9c9d37609b6ad492f45a4b3737), [`993c5f2`](https://github.com/LedgerHQ/ledger-live/commit/993c5f25b8a3ef3bb1f96dd93883e430e61f9fac), [`2e56708`](https://github.com/LedgerHQ/ledger-live/commit/2e567080b07abb8540907c0cb89457c746362917), [`38a18fd`](https://github.com/LedgerHQ/ledger-live/commit/38a18fdb7233b77dfd631d10d9eec3cd4aeefe9f), [`cde94b9`](https://github.com/LedgerHQ/ledger-live/commit/cde94b9584d6889849fb097813a5fc11ea19d069), [`19c02ce`](https://github.com/LedgerHQ/ledger-live/commit/19c02cead22422b4a2e94aef74ebc67e992ab54d), [`b478096`](https://github.com/LedgerHQ/ledger-live/commit/b478096537a0f86a9e39acc8c6cf17b1184e0849), [`9f33fc1`](https://github.com/LedgerHQ/ledger-live/commit/9f33fc14e0628a68d32957171aa879c30041f27e), [`81e5b8b`](https://github.com/LedgerHQ/ledger-live/commit/81e5b8bf4830dcb9d666436f2cc4367d92e93e78), [`6b86eb6`](https://github.com/LedgerHQ/ledger-live/commit/6b86eb6eed728fa91ab02c9ea23bd1e8bc5b54db), [`4b7f19c`](https://github.com/LedgerHQ/ledger-live/commit/4b7f19c96d95d86d5b6fbb480032d77532bf755e)]:
  - @ledgerhq/coin-cardano@0.1.1
  - @ledgerhq/hw-app-str@7.0.0
  - @ledgerhq/coin-evm@2.1.1
  - @ledgerhq/device-core@0.2.1
  - @ledgerhq/coin-polkadot@1.0.0
  - @ledgerhq/coin-xrp@0.3.0
  - @ledgerhq/coin-framework@0.15.0
  - @ledgerhq/cryptoassets@13.1.1
  - @ledgerhq/live-wallet@0.3.0
  - @ledgerhq/hw-app-polkadot@6.31.0
  - @ledgerhq/hw-app-eth@6.37.1
  - @ledgerhq/hw-app-vet@0.2.1
  - @ledgerhq/coin-algorand@0.5.1
  - @ledgerhq/coin-bitcoin@0.6.1
  - @ledgerhq/coin-solana@0.7.1
  - @ledgerhq/live-countervalues-react@0.2.1
  - @ledgerhq/coin-tezos@0.4.1
  - @ledgerhq/coin-near@0.5.1
  - @ledgerhq/live-countervalues@0.2.1
  - @ledgerhq/live-nft@0.4.1

## 34.5.0-next.7

### Patch Changes

- Updated dependencies [[`6b86eb6`](https://github.com/LedgerHQ/ledger-live/commit/6b86eb6eed728fa91ab02c9ea23bd1e8bc5b54db)]:
  - @ledgerhq/coin-polkadot@1.0.0-next.3

## 34.5.0-next.6

### Patch Changes

- [#7217](https://github.com/LedgerHQ/ledger-live/pull/7217) [`fec3dc8`](https://github.com/LedgerHQ/ledger-live/commit/fec3dc84ea00fc6f7f632942826978607e20c2ff) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - update snapshots

## 34.5.0-next.5

### Patch Changes

- [#7137](https://github.com/LedgerHQ/ledger-live/pull/7137) [`9e82327`](https://github.com/LedgerHQ/ledger-live/commit/9e823278b69d7ccd5f8927f699930172cd50a59d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update Cosmos snapshots

### Patch Changes

- [#7206](https://github.com/LedgerHQ/ledger-live/pull/7206) [`81e5b8b`](https://github.com/LedgerHQ/ledger-live/commit/81e5b8bf4830dcb9d666436f2cc4367d92e93e78) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - chore: resolve merge conflicts

- Updated dependencies [[`81e5b8b`](https://github.com/LedgerHQ/ledger-live/commit/81e5b8bf4830dcb9d666436f2cc4367d92e93e78)]:
  - @ledgerhq/hw-app-polkadot@6.31.0-next.1
  - @ledgerhq/cryptoassets@13.1.1-next.1
  - @ledgerhq/hw-app-eth@6.37.1-next.2
  - @ledgerhq/hw-app-str@7.0.0-next.1
  - @ledgerhq/hw-app-vet@0.2.1-next.1
  - @ledgerhq/coin-algorand@0.5.1-next.2
  - @ledgerhq/coin-polkadot@1.0.0-next.2
  - @ledgerhq/coin-bitcoin@0.6.1-next.2
  - @ledgerhq/coin-cardano@0.1.1-next.2
  - @ledgerhq/coin-solana@0.7.1-next.2
  - @ledgerhq/live-countervalues-react@0.2.1-next.2
  - @ledgerhq/coin-tezos@0.4.1-next.2
  - @ledgerhq/coin-near@0.5.1-next.2
  - @ledgerhq/coin-evm@2.1.1-next.2
  - @ledgerhq/coin-xrp@0.3.0-next.2
  - @ledgerhq/live-countervalues@0.2.1-next.2
  - @ledgerhq/coin-framework@0.15.0-next.2
  - @ledgerhq/device-core@0.2.1-next.3
  - @ledgerhq/live-wallet@0.3.0-next.2
  - @ledgerhq/live-nft@0.4.1-next.2

# @ledgerhq/live-common

## 34.5.0-next.3

### Patch Changes

- [#7188](https://github.com/LedgerHQ/ledger-live/pull/7188) [`d13a5d7`](https://github.com/LedgerHQ/ledger-live/commit/d13a5d7f8f23624feb3a4a041cd7966d3b100dcf) Thanks [@cng-ledger](https://github.com/cng-ledger)! - fix(LIVE-13071): use not enough gas error for Tron

- Updated dependencies [[`b478096`](https://github.com/LedgerHQ/ledger-live/commit/b478096537a0f86a9e39acc8c6cf17b1184e0849)]:
  - @ledgerhq/cryptoassets@13.1.1-next.0
  - @ledgerhq/coin-framework@0.15.0-next.1
  - @ledgerhq/coin-algorand@0.5.1-next.1
  - @ledgerhq/coin-bitcoin@0.6.1-next.1
  - @ledgerhq/coin-cardano@0.1.1-next.1
  - @ledgerhq/coin-evm@2.1.1-next.1
  - @ledgerhq/coin-near@0.5.1-next.1
  - @ledgerhq/coin-polkadot@1.0.0-next.1
  - @ledgerhq/coin-solana@0.7.1-next.1
  - @ledgerhq/coin-tezos@0.4.1-next.1
  - @ledgerhq/coin-xrp@0.3.0-next.1
  - @ledgerhq/hw-app-eth@6.37.1-next.1
  - @ledgerhq/hw-app-vet@0.2.1-next.0
  - @ledgerhq/live-countervalues@0.2.1-next.1
  - @ledgerhq/live-countervalues-react@0.2.1-next.1
  - @ledgerhq/live-nft@0.4.1-next.1
  - @ledgerhq/live-wallet@0.3.0-next.1

## 34.5.0-next.2

### Patch Changes

- Updated dependencies [[`19c02ce`](https://github.com/LedgerHQ/ledger-live/commit/19c02cead22422b4a2e94aef74ebc67e992ab54d)]:
  - @ledgerhq/device-core@0.2.1-next.2

## 34.5.0-next.1

### Patch Changes

- Updated dependencies [[`38a18fd`](https://github.com/LedgerHQ/ledger-live/commit/38a18fdb7233b77dfd631d10d9eec3cd4aeefe9f)]:
  - @ledgerhq/device-core@0.2.1-next.1

## 34.5.0-next.0

### Minor Changes

- [#6891](https://github.com/LedgerHQ/ledger-live/pull/6891) [`d9f586e`](https://github.com/LedgerHQ/ledger-live/commit/d9f586ea4bd45d15f3e42c9f733f30dceef3027d) Thanks [@pavanvora](https://github.com/pavanvora)! - update ledgerjs to 7.1.2 to support cardano app v7

- [#6326](https://github.com/LedgerHQ/ledger-live/pull/6326) [`4b7f19c`](https://github.com/LedgerHQ/ledger-live/commit/4b7f19c96d95d86d5b6fbb480032d77532bf755e) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - polkadot generic nano app support

### Patch Changes

- [#7081](https://github.com/LedgerHQ/ledger-live/pull/7081) [`9551536`](https://github.com/LedgerHQ/ledger-live/commit/955153681ebc19344ed5becfbf7b131224b2ebd0) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Create feature flag for preparation of next feature

- [#6793](https://github.com/LedgerHQ/ledger-live/pull/6793) [`2e5d5bd`](https://github.com/LedgerHQ/ledger-live/commit/2e5d5bdb988c73c91f1fe42c809b192ca5dbeb7a) Thanks [@lawRathod](https://github.com/lawRathod)! - Add pending operations to stacks account object

- [#6923](https://github.com/LedgerHQ/ledger-live/pull/6923) [`782d637`](https://github.com/LedgerHQ/ledger-live/commit/782d637b5fba8c9c9d37609b6ad492f45a4b3737) Thanks [@overcat](https://github.com/overcat)! - Refactor `hw-app-str` and add `signSorobanAuthorization`. Please check the changelog and documentation of "@ledgerhq/hw-app-str" for more information.

  - `Str.getPublicKey`'s function signature has changed. Previously, it was `getPublicKey(path: string, boolValidate?: boolean, boolDisplay?: boolean): Promise<{ publicKey: string; raw: Buffer; }>` and now it is `async getPublicKey(path: string, display = false): Promise<{ rawPublicKey: Buffer }>`
  - `Str.signTransaction` will no longer automatically fallback to `Str.signHash`. If you want to sign a hash, you have to call `Str.signHash` directly.
  - Removed the fixed limit on the maximum length of the transaction in `Str.signTransaction`. Currently, if the transaction is too large for the device to handle, `StellarUserRefusedError` will be thrown.
  - Add `Str.signSorobanAuthorization` method to sign Stellar Soroban authorization.
  - `Str.getAppConfiguration` now returns `maxDataSize`, it represents the maximum size of the data that the device can processed.
  - Add error classes for better error handling, check the documentation for more information:
    - `StellarUserRefusedError`
    - `StellarHashSigningNotEnabledError`
    - `StellarDataTooLargeError`
    - `StellarDataParsingFailedError`

- [#7019](https://github.com/LedgerHQ/ledger-live/pull/7019) [`2e56708`](https://github.com/LedgerHQ/ledger-live/commit/2e567080b07abb8540907c0cb89457c746362917) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Create getAppsCatalogForDevice use case

- [#7019](https://github.com/LedgerHQ/ledger-live/pull/7019) [`2e56708`](https://github.com/LedgerHQ/ledger-live/commit/2e567080b07abb8540907c0cb89457c746362917) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Refactor "app update available" logic to only rely on v2 manager apis

- [#7120](https://github.com/LedgerHQ/ledger-live/pull/7120) [`d2368f6`](https://github.com/LedgerHQ/ledger-live/commit/d2368f632b834207c33df14468599b6a543d11da) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - List apps v2: fix filtering of apps with isDevMode

- [#7094](https://github.com/LedgerHQ/ledger-live/pull/7094) [`785c618`](https://github.com/LedgerHQ/ledger-live/commit/785c6180c2212ca879c2fddb8302f0bab5686761) Thanks [@CremaFR](https://github.com/CremaFR)! - prevent TRC20 swaps if empty tron account

- [#7090](https://github.com/LedgerHQ/ledger-live/pull/7090) [`fc6d09b`](https://github.com/LedgerHQ/ledger-live/commit/fc6d09be89a6e8775d77b98d5a0256b68346a14d) Thanks [@CremaFR](https://github.com/CremaFR)! - bugfix: incorrect fee computation for erc20 when using max button

- [#7087](https://github.com/LedgerHQ/ledger-live/pull/7087) [`6b3c8ca`](https://github.com/LedgerHQ/ledger-live/commit/6b3c8cab371db8212e1b0a02f03bb0baa46ce95c) Thanks [@CremaFR](https://github.com/CremaFR)! - fixed tron activation fee

- [#6968](https://github.com/LedgerHQ/ledger-live/pull/6968) [`c988a94`](https://github.com/LedgerHQ/ledger-live/commit/c988a946d86e7f874823ac96d66573281ba00b13) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - fix crypto-assets-service integration using wrong URL

- [#7058](https://github.com/LedgerHQ/ledger-live/pull/7058) [`6692f5f`](https://github.com/LedgerHQ/ledger-live/commit/6692f5fe6701a4e47c626ea3cbb73a4641c9021d) Thanks [@andreicovaciu](https://github.com/andreicovaciu)! - Sends device value for swap accepted & cancelled operations

- Updated dependencies [[`bc8114c`](https://github.com/LedgerHQ/ledger-live/commit/bc8114c0a9a90bf95d57087710b405730b9a6a17), [`782d637`](https://github.com/LedgerHQ/ledger-live/commit/782d637b5fba8c9c9d37609b6ad492f45a4b3737), [`993c5f2`](https://github.com/LedgerHQ/ledger-live/commit/993c5f25b8a3ef3bb1f96dd93883e430e61f9fac), [`2e56708`](https://github.com/LedgerHQ/ledger-live/commit/2e567080b07abb8540907c0cb89457c746362917), [`cde94b9`](https://github.com/LedgerHQ/ledger-live/commit/cde94b9584d6889849fb097813a5fc11ea19d069), [`9f33fc1`](https://github.com/LedgerHQ/ledger-live/commit/9f33fc14e0628a68d32957171aa879c30041f27e), [`4b7f19c`](https://github.com/LedgerHQ/ledger-live/commit/4b7f19c96d95d86d5b6fbb480032d77532bf755e)]:
  - @ledgerhq/coin-cardano@0.1.1-next.0
  - @ledgerhq/hw-app-str@7.0.0-next.0
  - @ledgerhq/coin-evm@2.1.1-next.0
  - @ledgerhq/device-core@0.2.1-next.0
  - @ledgerhq/coin-polkadot@1.0.0-next.0
  - @ledgerhq/coin-xrp@0.3.0-next.0
  - @ledgerhq/coin-framework@0.15.0-next.0
  - @ledgerhq/live-wallet@0.3.0-next.0
  - @ledgerhq/hw-app-polkadot@6.30.0-next.0
  - @ledgerhq/coin-algorand@0.5.1-next.0
  - @ledgerhq/coin-bitcoin@0.6.1-next.0
  - @ledgerhq/coin-near@0.5.1-next.0
  - @ledgerhq/coin-solana@0.7.1-next.0
  - @ledgerhq/coin-tezos@0.4.1-next.0
  - @ledgerhq/hw-app-eth@6.37.1-next.0
  - @ledgerhq/live-countervalues@0.2.1-next.0
  - @ledgerhq/live-countervalues-react@0.2.1-next.0
  - @ledgerhq/live-nft@0.4.1-next.0

## 34.4.1

### Patch Changes

- [#7245](https://github.com/LedgerHQ/ledger-live/pull/7245) [`2dafbf7`](https://github.com/LedgerHQ/ledger-live/commit/2dafbf7a2ee0cefd00e19b203b97f5918c2607ff) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix: polkadot send tx in LLM

- Updated dependencies [[`2dafbf7`](https://github.com/LedgerHQ/ledger-live/commit/2dafbf7a2ee0cefd00e19b203b97f5918c2607ff)]:
  - @ledgerhq/hw-app-polkadot@6.30.1

## 34.4.1-hotfix.0

### Patch Changes

- [#7245](https://github.com/LedgerHQ/ledger-live/pull/7245) [`2dafbf7`](https://github.com/LedgerHQ/ledger-live/commit/2dafbf7a2ee0cefd00e19b203b97f5918c2607ff) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix: polkadot send tx in LLM

- Updated dependencies [[`2dafbf7`](https://github.com/LedgerHQ/ledger-live/commit/2dafbf7a2ee0cefd00e19b203b97f5918c2607ff)]:
  - @ledgerhq/hw-app-polkadot@6.30.1-hotfix.0

## 34.4.0

### Minor Changes

- [#7153](https://github.com/LedgerHQ/ledger-live/pull/7153) [`b0c7b8d`](https://github.com/LedgerHQ/ledger-live/commit/b0c7b8dcc7088853ad73518cb470e8b5b05be4de) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - polkadot generic nano app support

### Patch Changes

- Updated dependencies [[`b0c7b8d`](https://github.com/LedgerHQ/ledger-live/commit/b0c7b8dcc7088853ad73518cb470e8b5b05be4de)]:
  - @ledgerhq/hw-app-polkadot@6.30.0
  - @ledgerhq/coin-polkadot@0.8.0

## 34.4.0-hotfix.0

### Minor Changes

- [#7153](https://github.com/LedgerHQ/ledger-live/pull/7153) [`b0c7b8d`](https://github.com/LedgerHQ/ledger-live/commit/b0c7b8dcc7088853ad73518cb470e8b5b05be4de) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - polkadot generic nano app support

### Patch Changes

- Updated dependencies [[`b0c7b8d`](https://github.com/LedgerHQ/ledger-live/commit/b0c7b8dcc7088853ad73518cb470e8b5b05be4de)]:
  - @ledgerhq/hw-app-polkadot@6.30.0-hotfix.0
  - @ledgerhq/coin-polkadot@0.8.0-hotfix.0

## 34.3.0

### Minor Changes

- [#6596](https://github.com/LedgerHQ/ledger-live/pull/6596) [`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11) Thanks [@KVNLS](https://github.com/KVNLS)! - Upgrade React Native to version 0.73.6

- [#6814](https://github.com/LedgerHQ/ledger-live/pull/6814) [`d27b731`](https://github.com/LedgerHQ/ledger-live/commit/d27b731bd581619f61b7c7c88b8f536689950e40) Thanks [@Justkant](https://github.com/Justkant)! - feat: export platform enum for use in LLM test

- [#6818](https://github.com/LedgerHQ/ledger-live/pull/6818) [`a18c28e`](https://github.com/LedgerHQ/ledger-live/commit/a18c28e3f6a6132bd5e53d5b61721084b3aa19e8) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Split account utils between coin-fmk and LLC

- [#7041](https://github.com/LedgerHQ/ledger-live/pull/7041) [`2a8d564`](https://github.com/LedgerHQ/ledger-live/commit/2a8d564b483a35045a957b430b4d7d252e2ddcfe) Thanks [@lvndry](https://github.com/lvndry)! - Updated Taquito dependency

- [#6812](https://github.com/LedgerHQ/ledger-live/pull/6812) [`cec1599`](https://github.com/LedgerHQ/ledger-live/commit/cec1599a41aa1a18a249e34312164bc93b63972f) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Modularize Cardano

- [#6902](https://github.com/LedgerHQ/ledger-live/pull/6902) [`6d44f25`](https://github.com/LedgerHQ/ledger-live/commit/6d44f255c5b2f453c61d0b754807db1f76d7174e) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Add coin config to Polkadot and possibility to basic auth to Sidecar

- [#6802](https://github.com/LedgerHQ/ledger-live/pull/6802) [`704c61c`](https://github.com/LedgerHQ/ledger-live/commit/704c61cd2a61b8ad4f99a7ab0c8c30c9a22bc873) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM / LLD - Add a deeplink redirecting to the post onboarding

- [#6876](https://github.com/LedgerHQ/ledger-live/pull/6876) [`689e6e5`](https://github.com/LedgerHQ/ledger-live/commit/689e6e5a443170b8e6c2b404cc99af2e67d8e8e4) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update coin implementations to use new account bridge types & implement cleaner architecture

- [#6721](https://github.com/LedgerHQ/ledger-live/pull/6721) [`1cee8ff`](https://github.com/LedgerHQ/ledger-live/commit/1cee8ff557fdd6e44f55d4d396805e02c2733cc1) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Solana as a coin module

- [#6977](https://github.com/LedgerHQ/ledger-live/pull/6977) [`2f2b754`](https://github.com/LedgerHQ/ledger-live/commit/2f2b754b1350360ca0d9f761ca6e4a8cbaff141b) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Scroll & Scroll Sepolia

- [#6822](https://github.com/LedgerHQ/ledger-live/pull/6822) [`801265b`](https://github.com/LedgerHQ/ledger-live/commit/801265b7ff3ed7ebd0012eb50f70898557a2dd52) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Remove ripple coin logic and make use of `coin-xrp` instead

- [#6796](https://github.com/LedgerHQ/ledger-live/pull/6796) [`6552679`](https://github.com/LedgerHQ/ledger-live/commit/65526794bb4d1fbc7e286c0e1c0b6d021413fc8c) Thanks [@gre](https://github.com/gre)! - Drop technical Account#name and Account#starred fields and replace it with a new architecture: a wallet store that contains all user's data.

- [#6428](https://github.com/LedgerHQ/ledger-live/pull/6428) [`fa06306`](https://github.com/LedgerHQ/ledger-live/commit/fa0630606016cb93b28eca13d815af74c92b90de) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Usage of CVS v3 instead of V2 on Market part

- [#6799](https://github.com/LedgerHQ/ledger-live/pull/6799) [`b099b70`](https://github.com/LedgerHQ/ledger-live/commit/b099b70c0c5b8b23cae7c9bee6580ad22ace6f4a) Thanks [@andreicovaciu](https://github.com/andreicovaciu)! - Track swap cancel and accept with by returning device property from custom.exchange.start handler

- [#6741](https://github.com/LedgerHQ/ledger-live/pull/6741) [`a115d6c`](https://github.com/LedgerHQ/ledger-live/commit/a115d6cd5dcbcc753d02dedb80f5eb1693d1a249) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLC - Automatically dismiss the PostOnboarding EntryPoint after seven days

- [#6816](https://github.com/LedgerHQ/ledger-live/pull/6816) [`60cd799`](https://github.com/LedgerHQ/ledger-live/commit/60cd799e693e3ae0712a5a9e88206b5304bbc214) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Split currencies utils between CoinFmk and LLC

### Patch Changes

- [#6909](https://github.com/LedgerHQ/ledger-live/pull/6909) [`6512191`](https://github.com/LedgerHQ/ledger-live/commit/65121919bc7c93adc56b0f07d784e8d4ff08283b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix Sentry TypeError in useMarketDataProvider + Refetch Some data only every day

- [#6771](https://github.com/LedgerHQ/ledger-live/pull/6771) [`6c35cc5`](https://github.com/LedgerHQ/ledger-live/commit/6c35cc564cb050614ee571907f628ecf15ec4584) Thanks [@gre](https://github.com/gre)! - LL's preferred countervalues will now have all the possible fiats that our CVS api supports.

- [#7049](https://github.com/LedgerHQ/ledger-live/pull/7049) [`09d3577`](https://github.com/LedgerHQ/ledger-live/commit/09d35775d1b2b93594c9ea8eb393dcb3d30cd2fb) Thanks [@Justkant](https://github.com/Justkant)! - fix(wallet-api): ripple wrong family name

- [#6963](https://github.com/LedgerHQ/ledger-live/pull/6963) [`815ae3d`](https://github.com/LedgerHQ/ledger-live/commit/815ae3dae8027823854ada837df3dc983d09b10f) Thanks [@aussedatlo](https://github.com/aussedatlo)! - restore TransportRaceCondition instead of TransportPendingOperation that caused a breaking change

- [#6936](https://github.com/LedgerHQ/ledger-live/pull/6936) [`024ffae`](https://github.com/LedgerHQ/ledger-live/commit/024ffae05c0fa4ec7e42965cdcb3a3b4a516339c) Thanks [@Justkant](https://github.com/Justkant)! - fix(wallet-api): xrp family not present

- [#6853](https://github.com/LedgerHQ/ledger-live/pull/6853) [`2fc0865`](https://github.com/LedgerHQ/ledger-live/commit/2fc08657eb8acc4a42b21e4266a0bac86dec4c79) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - Replace static provider info to API

- [#6663](https://github.com/LedgerHQ/ledger-live/pull/6663) [`de5de2d`](https://github.com/LedgerHQ/ledger-live/commit/de5de2d273ed6966c82bde2c3a95b98ba594204f) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Reorganize coin serializaiton code

- [#6843](https://github.com/LedgerHQ/ledger-live/pull/6843) [`2a689e4`](https://github.com/LedgerHQ/ledger-live/commit/2a689e447250e882a2ed6d091c032074f4280ca0) Thanks [@Wozacosta](https://github.com/Wozacosta)! - fix manifest loading breaking if no cache

- [#6915](https://github.com/LedgerHQ/ledger-live/pull/6915) [`8dabb3b`](https://github.com/LedgerHQ/ledger-live/commit/8dabb3ba31f9f7e14d172cc29636654fbe0288ee) Thanks [@CremaFR](https://github.com/CremaFR)! - desactivate tezos unrevealed account swap

- [#6971](https://github.com/LedgerHQ/ledger-live/pull/6971) [`cb8b5a0`](https://github.com/LedgerHQ/ledger-live/commit/cb8b5a0f2d78203935bb6e1a687e2c96d4b191c4) Thanks [@CremaFR](https://github.com/CremaFR)! - ff used to prevent currency fetch on disabled provider

- [#6856](https://github.com/LedgerHQ/ledger-live/pull/6856) [`f8980de`](https://github.com/LedgerHQ/ledger-live/commit/f8980de0a317a99b8eaea4b629c8d9bdd2c2a136) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix device available storage computation for all devices supporting custom lock screens.

- [#6583](https://github.com/LedgerHQ/ledger-live/pull/6583) [`83e5690`](https://github.com/LedgerHQ/ledger-live/commit/83e5690429e41ecd1c508b3398904ae747085cf7) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Expose Polkadot crafting functions to external components

- [#6770](https://github.com/LedgerHQ/ledger-live/pull/6770) [`bd57754`](https://github.com/LedgerHQ/ledger-live/commit/bd577542ce0648e41da6ac7c5502aa87e91324fa) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add missing nano app dep Oasys & Shiden

- [#6991](https://github.com/LedgerHQ/ledger-live/pull/6991) [`6eec3f9`](https://github.com/LedgerHQ/ledger-live/commit/6eec3f973ecea36bafc7ebc8b88526399048cdc4) Thanks [@CremaFR](https://github.com/CremaFR)! - hooks to filter swap providers based on FF

- [#6754](https://github.com/LedgerHQ/ledger-live/pull/6754) [`4c01029`](https://github.com/LedgerHQ/ledger-live/commit/4c01029b4d4feb32dab2f9e77da1126050d8c1bc) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Move Tezos in its own package

- [#6987](https://github.com/LedgerHQ/ledger-live/pull/6987) [`dc409f0`](https://github.com/LedgerHQ/ledger-live/commit/dc409f00cb3b4bfde1b659a2f5fabd6c7c8fee70) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - [swap] disabled the call to /rates endpoint in LL when Demo1 FF is ON

- [#7035](https://github.com/LedgerHQ/ledger-live/pull/7035) [`4297d2c`](https://github.com/LedgerHQ/ledger-live/commit/4297d2c6e3988f602b3db65fe51d81bd5ca08135) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add optional chaining to `tronResources.cacheTransactionInfoById` since resources are still unstable which prevents account migration

- [#6719](https://github.com/LedgerHQ/ledger-live/pull/6719) [`ca42740`](https://github.com/LedgerHQ/ledger-live/commit/ca4274009ae050b30695b7b505241e4530ecbd55) Thanks [@RamyEB](https://github.com/RamyEB)! - Save locally added manifest into the storage on both Mobile and Desktop client

- [#6979](https://github.com/LedgerHQ/ledger-live/pull/6979) [`55fdf88`](https://github.com/LedgerHQ/ledger-live/commit/55fdf885831d45bdee9e6a9d77cced79568f6817) Thanks [@CremaFR](https://github.com/CremaFR)! - caching swap providers data

- [#7027](https://github.com/LedgerHQ/ledger-live/pull/7027) [`d155ff9`](https://github.com/LedgerHQ/ledger-live/commit/d155ff95c26c0bfe85e8293a8ab0f79b7b4c59e9) Thanks [@CremaFR](https://github.com/CremaFR)! - keep empty tron subAccounts

- [#6870](https://github.com/LedgerHQ/ledger-live/pull/6870) [`6c5106b`](https://github.com/LedgerHQ/ledger-live/commit/6c5106ba14ad91eeb9d78840f7bc3cd3db3c7059) Thanks [@Justkant](https://github.com/Justkant)! - fix: btc signMessage

- [#6452](https://github.com/LedgerHQ/ledger-live/pull/6452) [`7dab046`](https://github.com/LedgerHQ/ledger-live/commit/7dab04608e62b586e213aaf90e319f06676b52e5) Thanks [@RamyEB](https://github.com/RamyEB)! - Add zod Schema for LiveApp

- [#6735](https://github.com/LedgerHQ/ledger-live/pull/6735) [`bbb1e8d`](https://github.com/LedgerHQ/ledger-live/commit/bbb1e8d0cadfa627b4a955a86bbf66e3b4b4957a) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix cosmos code to avoid using deprecated endpoints

- [#6844](https://github.com/LedgerHQ/ledger-live/pull/6844) [`f19960f`](https://github.com/LedgerHQ/ledger-live/commit/f19960f2e7104e5bdf332269fa92fda47455e17d) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Simplify SignerContext generic signature

- [#7123](https://github.com/LedgerHQ/ledger-live/pull/7123) [`84eb10c`](https://github.com/LedgerHQ/ledger-live/commit/84eb10c36bf6d2ab08cc300b0e208e1fca5fec1f) Thanks [@jdabbech-ledger](https://github.com/jdabbech-ledger)! - Hotfix typing groupedFeatures

- [#6900](https://github.com/LedgerHQ/ledger-live/pull/6900) [`dbe40aa`](https://github.com/LedgerHQ/ledger-live/commit/dbe40aa31d3ce84f3a2638429981892eb61196a7) Thanks [@CremaFR](https://github.com/CremaFR)! - bugfix crashes when incorrect payload from partner

- [#7116](https://github.com/LedgerHQ/ledger-live/pull/7116) [`769c6e8`](https://github.com/LedgerHQ/ledger-live/commit/769c6e8a4f01e05bb053bc85ca8517fdc62e1387) Thanks [@jdabbech-ledger](https://github.com/jdabbech-ledger)! - Hidden press toggle europa grouped features instead of stax

- [#6824](https://github.com/LedgerHQ/ledger-live/pull/6824) [`796f7d8`](https://github.com/LedgerHQ/ledger-live/commit/796f7d8a14f75a19df92e11811c305426a472cd5) Thanks [@cng-ledger](https://github.com/cng-ledger)! - fix(LIVE-10131): take 1 TRX off the swappable amount to prevent insufficient balance when max toggle is on

- [#6883](https://github.com/LedgerHQ/ledger-live/pull/6883) [`6623cd1`](https://github.com/LedgerHQ/ledger-live/commit/6623cd13102bd8340bd7d4dfdd469934527985c3) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - Add user IP

- [#7117](https://github.com/LedgerHQ/ledger-live/pull/7117) [`0075af5`](https://github.com/LedgerHQ/ledger-live/commit/0075af54bcdd623ef09b08433c7275662b31ba71) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - List apps v2: fix filtering of apps with isDevMode

- [#6428](https://github.com/LedgerHQ/ledger-live/pull/6428) [`fa06306`](https://github.com/LedgerHQ/ledger-live/commit/fa0630606016cb93b28eca13d815af74c92b90de) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Reorg files

- [#7042](https://github.com/LedgerHQ/ledger-live/pull/7042) [`57fa89c`](https://github.com/LedgerHQ/ledger-live/commit/57fa89c6ef5e05cfdc5173e0f3b18ce696c55842) Thanks [@lvndry](https://github.com/lvndry)! - Migrate deprecated api for stacks to current

- [#6877](https://github.com/LedgerHQ/ledger-live/pull/6877) [`2a2de6d`](https://github.com/LedgerHQ/ledger-live/commit/2a2de6dc7b55c9ce688d5108502ad67881880883) Thanks [@cng-ledger](https://github.com/cng-ledger)! - fix(LIVE-10131): ignore TronSendTrc20ToNewAccountForbidden during swap
  fix(LIVE-10131): stop throwing new trc20 account error TronSendTrc20ToNewAccountForbidden during sign operation

- [#6840](https://github.com/LedgerHQ/ledger-live/pull/6840) [`77d60e6`](https://github.com/LedgerHQ/ledger-live/commit/77d60e6f61f04b0650947fc56db5052dd4ff7e00) Thanks [@Justkant](https://github.com/Justkant)! - chore: bump wallet-api versions

- [#6929](https://github.com/LedgerHQ/ledger-live/pull/6929) [`0bb6b76`](https://github.com/LedgerHQ/ledger-live/commit/0bb6b76733616d7ae392db2f2164139c63a59fc1) Thanks [@CremaFR](https://github.com/CremaFR)! - fetch CDN for swap providers data

- [#7071](https://github.com/LedgerHQ/ledger-live/pull/7071) [`521170b`](https://github.com/LedgerHQ/ledger-live/commit/521170bc4e2338f97924cead842184620988c7de) Thanks [@Justkant](https://github.com/Justkant)! - chore: patch changesets to avoid too big batching on github requests

- [#6887](https://github.com/LedgerHQ/ledger-live/pull/6887) [`7bbad43`](https://github.com/LedgerHQ/ledger-live/commit/7bbad43beab706a98b03ff9147cc67f289220c44) Thanks [@lvndry](https://github.com/lvndry)! - try/catch coin config + fix configuration name typo

- [#6733](https://github.com/LedgerHQ/ledger-live/pull/6733) [`bfca25b`](https://github.com/LedgerHQ/ledger-live/commit/bfca25b975e00c057da3a7ec82a9b05a0e5d5cf7) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Device renaming: add Nano S Plus compatibility

- [#6781](https://github.com/LedgerHQ/ledger-live/pull/6781) [`37836b3`](https://github.com/LedgerHQ/ledger-live/commit/37836b35c97a1540681eadb451e19c44466a3826) Thanks [@CremaFR](https://github.com/CremaFR)! - bugfix: infinite spinner when fund after reject tx

- [#6912](https://github.com/LedgerHQ/ledger-live/pull/6912) [`8384e55`](https://github.com/LedgerHQ/ledger-live/commit/8384e55f70b5eee8484990283ad0c6097e426804) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - RegisterTransportModules: improve typing of discovery results

- [#6771](https://github.com/LedgerHQ/ledger-live/pull/6771) [`6c35cc5`](https://github.com/LedgerHQ/ledger-live/commit/6c35cc564cb050614ee571907f628ecf15ec4584) Thanks [@gre](https://github.com/gre)! - Countervalues performance evolutions. (8min -> 1min refresh rate, more efficient http calls caching,..)

- [#7006](https://github.com/LedgerHQ/ledger-live/pull/7006) [`1a5b277`](https://github.com/LedgerHQ/ledger-live/commit/1a5b2777b7b71aa4c4e353010eeb9e3dab432bca) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Remove feature flags "supportDeviceStax" and "staxWelcomeScreen"

- [#6852](https://github.com/LedgerHQ/ledger-live/pull/6852) [`48ac131`](https://github.com/LedgerHQ/ledger-live/commit/48ac1318f43e003ff8db807391cee79e4b010b3a) Thanks [@drakoFukayu](https://github.com/drakoFukayu)! - increase tr20 expiry time to 10mn for Vault user

- [#6928](https://github.com/LedgerHQ/ledger-live/pull/6928) [`f84fc59`](https://github.com/LedgerHQ/ledger-live/commit/f84fc590cf8838794324d12bfe9b3a37cf18c29b) Thanks [@RamyEB](https://github.com/RamyEB)! - set account on dapp browser

- [#7048](https://github.com/LedgerHQ/ledger-live/pull/7048) [`a2505de`](https://github.com/LedgerHQ/ledger-live/commit/a2505deb93dd0722981a90e12082ff1dbefc29b1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Create Wallet sync arch inside LLM and add FF

- [#6757](https://github.com/LedgerHQ/ledger-live/pull/6757) [`f17a3cb`](https://github.com/LedgerHQ/ledger-live/commit/f17a3cbc16abf7fadf686025a5ca56ec1a1e7bb6) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Add buy sell shortcut feature flag to toggle intro screen flow on buy sell ui live app.

- Updated dependencies [[`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11), [`6c35cc5`](https://github.com/LedgerHQ/ledger-live/commit/6c35cc564cb050614ee571907f628ecf15ec4584), [`b9f1f71`](https://github.com/LedgerHQ/ledger-live/commit/b9f1f715355752d8c57c24ecd6a6d166b80f689d), [`815ae3d`](https://github.com/LedgerHQ/ledger-live/commit/815ae3dae8027823854ada837df3dc983d09b10f), [`aedced6`](https://github.com/LedgerHQ/ledger-live/commit/aedced603abbbd0b1ef5afcc5cb83d9520388117), [`de5de2d`](https://github.com/LedgerHQ/ledger-live/commit/de5de2d273ed6966c82bde2c3a95b98ba594204f), [`0fcce49`](https://github.com/LedgerHQ/ledger-live/commit/0fcce49ae1770682837d9df8df57ba5a81330e87), [`83e5690`](https://github.com/LedgerHQ/ledger-live/commit/83e5690429e41ecd1c508b3398904ae747085cf7), [`4c01029`](https://github.com/LedgerHQ/ledger-live/commit/4c01029b4d4feb32dab2f9e77da1126050d8c1bc), [`12a74b9`](https://github.com/LedgerHQ/ledger-live/commit/12a74b9f2f27285e44a5dca665422b3b8ecd4028), [`326cae0`](https://github.com/LedgerHQ/ledger-live/commit/326cae088cc33795536deb1d868c86e8dbeb6a13), [`6c35cc5`](https://github.com/LedgerHQ/ledger-live/commit/6c35cc564cb050614ee571907f628ecf15ec4584), [`aa312f9`](https://github.com/LedgerHQ/ledger-live/commit/aa312f9e43740106893602c9edbaeca1d20e1c4e), [`4499990`](https://github.com/LedgerHQ/ledger-live/commit/449999066c58ae5df371dfb92a7230f9b5e90a60), [`a18c28e`](https://github.com/LedgerHQ/ledger-live/commit/a18c28e3f6a6132bd5e53d5b61721084b3aa19e8), [`cec1599`](https://github.com/LedgerHQ/ledger-live/commit/cec1599a41aa1a18a249e34312164bc93b63972f), [`49c527a`](https://github.com/LedgerHQ/ledger-live/commit/49c527a6d8717e7ae9ff7223a5fa91312167517b), [`801265b`](https://github.com/LedgerHQ/ledger-live/commit/801265b7ff3ed7ebd0012eb50f70898557a2dd52), [`d5a1300`](https://github.com/LedgerHQ/ledger-live/commit/d5a130034c18c7ac8b1fd3d4c5271423b4f7639d), [`6d44f25`](https://github.com/LedgerHQ/ledger-live/commit/6d44f255c5b2f453c61d0b754807db1f76d7174e), [`d90a17d`](https://github.com/LedgerHQ/ledger-live/commit/d90a17d1fe8b1bc3fe002f0aa28ed1cbca3cc9f8), [`689e6e5`](https://github.com/LedgerHQ/ledger-live/commit/689e6e5a443170b8e6c2b404cc99af2e67d8e8e4), [`434262d`](https://github.com/LedgerHQ/ledger-live/commit/434262db4560f62113002fbb607bd1a8da0712b4), [`f19960f`](https://github.com/LedgerHQ/ledger-live/commit/f19960f2e7104e5bdf332269fa92fda47455e17d), [`1cee8ff`](https://github.com/LedgerHQ/ledger-live/commit/1cee8ff557fdd6e44f55d4d396805e02c2733cc1), [`5d18b4f`](https://github.com/LedgerHQ/ledger-live/commit/5d18b4ff4d1745e7c32993a8d94bb1dc5529391f), [`3b9c93c`](https://github.com/LedgerHQ/ledger-live/commit/3b9c93c0de8ceff2af96a6ee8e42b8d9c2ab7af0), [`6623cd1`](https://github.com/LedgerHQ/ledger-live/commit/6623cd13102bd8340bd7d4dfdd469934527985c3), [`f7e7881`](https://github.com/LedgerHQ/ledger-live/commit/f7e7881a820880143c2b011d6a92b5a36156b2c1), [`2f2b754`](https://github.com/LedgerHQ/ledger-live/commit/2f2b754b1350360ca0d9f761ca6e4a8cbaff141b), [`689e6e5`](https://github.com/LedgerHQ/ledger-live/commit/689e6e5a443170b8e6c2b404cc99af2e67d8e8e4), [`6552679`](https://github.com/LedgerHQ/ledger-live/commit/65526794bb4d1fbc7e286c0e1c0b6d021413fc8c), [`77d60e6`](https://github.com/LedgerHQ/ledger-live/commit/77d60e6f61f04b0650947fc56db5052dd4ff7e00), [`056946e`](https://github.com/LedgerHQ/ledger-live/commit/056946e5a0a27c202e6153996a625ede07ca0833), [`fda6a81`](https://github.com/LedgerHQ/ledger-live/commit/fda6a814544b3a1debceab22f69485911e76cadc), [`801265b`](https://github.com/LedgerHQ/ledger-live/commit/801265b7ff3ed7ebd0012eb50f70898557a2dd52), [`0c6c26c`](https://github.com/LedgerHQ/ledger-live/commit/0c6c26c852a36fb8567bd7eb19716c766f4c0a25), [`bfca25b`](https://github.com/LedgerHQ/ledger-live/commit/bfca25b975e00c057da3a7ec82a9b05a0e5d5cf7), [`7ef6b57`](https://github.com/LedgerHQ/ledger-live/commit/7ef6b574a098f76f1999f1e74147c60b6fafe093), [`689e6e5`](https://github.com/LedgerHQ/ledger-live/commit/689e6e5a443170b8e6c2b404cc99af2e67d8e8e4), [`6c35cc5`](https://github.com/LedgerHQ/ledger-live/commit/6c35cc564cb050614ee571907f628ecf15ec4584), [`b099b70`](https://github.com/LedgerHQ/ledger-live/commit/b099b70c0c5b8b23cae7c9bee6580ad22ace6f4a), [`2a8d564`](https://github.com/LedgerHQ/ledger-live/commit/2a8d564b483a35045a957b430b4d7d252e2ddcfe), [`12a74b9`](https://github.com/LedgerHQ/ledger-live/commit/12a74b9f2f27285e44a5dca665422b3b8ecd4028), [`60cd799`](https://github.com/LedgerHQ/ledger-live/commit/60cd799e693e3ae0712a5a9e88206b5304bbc214), [`84274a6`](https://github.com/LedgerHQ/ledger-live/commit/84274a6e764a385f707bc811ead7a7e92a02ed6a)]:
  - @ledgerhq/hw-transport-mocker@6.29.0
  - @ledgerhq/hw-app-algorand@6.29.0
  - @ledgerhq/hw-app-exchange@0.5.0
  - @ledgerhq/hw-app-polkadot@6.29.0
  - @ledgerhq/hw-app-cosmos@6.30.0
  - @ledgerhq/hw-app-solana@7.2.0
  - @ledgerhq/cryptoassets@13.1.0
  - @ledgerhq/hw-app-tezos@6.29.0
  - @ledgerhq/hw-transport@6.31.0
  - @ledgerhq/hw-app-near@6.29.0
  - @ledgerhq/hw-app-btc@10.3.0
  - @ledgerhq/hw-app-eth@6.37.0
  - @ledgerhq/hw-app-str@6.29.0
  - @ledgerhq/hw-app-trx@6.29.0
  - @ledgerhq/hw-app-vet@0.2.0
  - @ledgerhq/hw-app-xrp@6.29.0
  - @ledgerhq/coin-algorand@0.5.0
  - @ledgerhq/coin-polkadot@0.7.0
  - @ledgerhq/coin-bitcoin@0.6.0
  - @ledgerhq/devices@8.4.0
  - @ledgerhq/errors@6.17.0
  - @ledgerhq/live-countervalues-react@0.2.0
  - @ledgerhq/crypto-icons-ui@1.2.0
  - @ledgerhq/coin-near@0.5.0
  - @ledgerhq/coin-evm@2.1.0
  - @ledgerhq/live-countervalues@0.2.0
  - @ledgerhq/wallet-api-exchange-module@0.7.0
  - @ledgerhq/coin-framework@0.14.0
  - @ledgerhq/live-network@1.3.0
  - @ledgerhq/device-core@0.2.0
  - @ledgerhq/live-nft@0.4.0
  - @ledgerhq/live-promise@0.1.0
  - @ledgerhq/live-env@2.1.0
  - @ledgerhq/coin-tezos@0.4.0
  - @ledgerhq/coin-cardano@0.1.0
  - @ledgerhq/coin-solana@0.7.0
  - @ledgerhq/coin-xrp@0.2.0
  - @ledgerhq/live-wallet@0.2.0
  - @ledgerhq/speculos-transport@0.1.1

## 34.3.0-next.6

### Patch Changes

- [#7123](https://github.com/LedgerHQ/ledger-live/pull/7123) [`84eb10c`](https://github.com/LedgerHQ/ledger-live/commit/84eb10c36bf6d2ab08cc300b0e208e1fca5fec1f) Thanks [@jdabbech-ledger](https://github.com/jdabbech-ledger)! - Hotfix typing groupedFeatures

## 34.3.0-next.5

### Patch Changes

- [#7116](https://github.com/LedgerHQ/ledger-live/pull/7116) [`769c6e8`](https://github.com/LedgerHQ/ledger-live/commit/769c6e8a4f01e05bb053bc85ca8517fdc62e1387) Thanks [@jdabbech-ledger](https://github.com/jdabbech-ledger)! - Hidden press toggle europa grouped features instead of stax

## 34.3.0-next.4

### Patch Changes

- [#7117](https://github.com/LedgerHQ/ledger-live/pull/7117) [`0075af5`](https://github.com/LedgerHQ/ledger-live/commit/0075af54bcdd623ef09b08433c7275662b31ba71) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - List apps v2: fix filtering of apps with isDevMode

## 34.3.0-next.3

### Patch Changes

- Updated dependencies [[`d5a1300`](https://github.com/LedgerHQ/ledger-live/commit/d5a130034c18c7ac8b1fd3d4c5271423b4f7639d)]:
  - @ledgerhq/cryptoassets@13.1.0-next.2
  - @ledgerhq/coin-framework@0.14.0-next.2
  - @ledgerhq/coin-algorand@0.5.0-next.2
  - @ledgerhq/coin-bitcoin@0.6.0-next.2
  - @ledgerhq/coin-cardano@0.1.0-next.2
  - @ledgerhq/coin-evm@2.1.0-next.2
  - @ledgerhq/coin-near@0.5.0-next.2
  - @ledgerhq/coin-polkadot@0.7.0-next.2
  - @ledgerhq/coin-solana@0.7.0-next.2
  - @ledgerhq/coin-tezos@0.4.0-next.2
  - @ledgerhq/coin-xrp@0.2.0-next.2
  - @ledgerhq/hw-app-eth@6.37.0-next.2
  - @ledgerhq/hw-app-vet@0.2.0-next.2
  - @ledgerhq/live-countervalues@0.2.0-next.2
  - @ledgerhq/live-countervalues-react@0.2.0-next.2
  - @ledgerhq/live-nft@0.4.0-next.2
  - @ledgerhq/live-wallet@0.2.0-next.3

## 34.3.0-next.2

### Patch Changes

- Updated dependencies [[`f7e7881`](https://github.com/LedgerHQ/ledger-live/commit/f7e7881a820880143c2b011d6a92b5a36156b2c1)]:
  - @ledgerhq/cryptoassets@13.1.0-next.1
  - @ledgerhq/coin-framework@0.14.0-next.1
  - @ledgerhq/coin-algorand@0.5.0-next.1
  - @ledgerhq/coin-bitcoin@0.6.0-next.1
  - @ledgerhq/coin-cardano@0.1.0-next.1
  - @ledgerhq/coin-evm@2.1.0-next.1
  - @ledgerhq/coin-near@0.5.0-next.1
  - @ledgerhq/coin-polkadot@0.7.0-next.1
  - @ledgerhq/coin-solana@0.7.0-next.1
  - @ledgerhq/coin-tezos@0.4.0-next.1
  - @ledgerhq/coin-xrp@0.2.0-next.1
  - @ledgerhq/hw-app-eth@6.37.0-next.1
  - @ledgerhq/hw-app-vet@0.2.0-next.1
  - @ledgerhq/live-countervalues@0.2.0-next.1
  - @ledgerhq/live-countervalues-react@0.2.0-next.1
  - @ledgerhq/live-nft@0.4.0-next.1
  - @ledgerhq/live-wallet@0.2.0-next.2

## 34.3.0-next.1

### Patch Changes

- Updated dependencies [[`7ef6b57`](https://github.com/LedgerHQ/ledger-live/commit/7ef6b574a098f76f1999f1e74147c60b6fafe093)]:
  - @ledgerhq/live-wallet@0.2.0-next.1

## 34.3.0-next.0

### Minor Changes

- [#6596](https://github.com/LedgerHQ/ledger-live/pull/6596) [`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11) Thanks [@KVNLS](https://github.com/KVNLS)! - Upgrade React Native to version 0.73.6

- [#6814](https://github.com/LedgerHQ/ledger-live/pull/6814) [`d27b731`](https://github.com/LedgerHQ/ledger-live/commit/d27b731bd581619f61b7c7c88b8f536689950e40) Thanks [@Justkant](https://github.com/Justkant)! - feat: export platform enum for use in LLM test

- [#6818](https://github.com/LedgerHQ/ledger-live/pull/6818) [`a18c28e`](https://github.com/LedgerHQ/ledger-live/commit/a18c28e3f6a6132bd5e53d5b61721084b3aa19e8) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Split account utils between coin-fmk and LLC

- [#7041](https://github.com/LedgerHQ/ledger-live/pull/7041) [`2a8d564`](https://github.com/LedgerHQ/ledger-live/commit/2a8d564b483a35045a957b430b4d7d252e2ddcfe) Thanks [@lvndry](https://github.com/lvndry)! - Updated Taquito dependency

- [#6812](https://github.com/LedgerHQ/ledger-live/pull/6812) [`cec1599`](https://github.com/LedgerHQ/ledger-live/commit/cec1599a41aa1a18a249e34312164bc93b63972f) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Modularize Cardano

- [#6902](https://github.com/LedgerHQ/ledger-live/pull/6902) [`6d44f25`](https://github.com/LedgerHQ/ledger-live/commit/6d44f255c5b2f453c61d0b754807db1f76d7174e) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Add coin config to Polkadot and possibility to basic auth to Sidecar

- [#6802](https://github.com/LedgerHQ/ledger-live/pull/6802) [`704c61c`](https://github.com/LedgerHQ/ledger-live/commit/704c61cd2a61b8ad4f99a7ab0c8c30c9a22bc873) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM / LLD - Add a deeplink redirecting to the post onboarding

- [#6876](https://github.com/LedgerHQ/ledger-live/pull/6876) [`689e6e5`](https://github.com/LedgerHQ/ledger-live/commit/689e6e5a443170b8e6c2b404cc99af2e67d8e8e4) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update coin implementations to use new account bridge types & implement cleaner architecture

- [#6721](https://github.com/LedgerHQ/ledger-live/pull/6721) [`1cee8ff`](https://github.com/LedgerHQ/ledger-live/commit/1cee8ff557fdd6e44f55d4d396805e02c2733cc1) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Solana as a coin module

- [#6977](https://github.com/LedgerHQ/ledger-live/pull/6977) [`2f2b754`](https://github.com/LedgerHQ/ledger-live/commit/2f2b754b1350360ca0d9f761ca6e4a8cbaff141b) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Scroll & Scroll Sepolia

- [#6822](https://github.com/LedgerHQ/ledger-live/pull/6822) [`801265b`](https://github.com/LedgerHQ/ledger-live/commit/801265b7ff3ed7ebd0012eb50f70898557a2dd52) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Remove ripple coin logic and make use of `coin-xrp` instead

- [#6796](https://github.com/LedgerHQ/ledger-live/pull/6796) [`6552679`](https://github.com/LedgerHQ/ledger-live/commit/65526794bb4d1fbc7e286c0e1c0b6d021413fc8c) Thanks [@gre](https://github.com/gre)! - Drop technical Account#name and Account#starred fields and replace it with a new architecture: a wallet store that contains all user's data.

- [#6428](https://github.com/LedgerHQ/ledger-live/pull/6428) [`fa06306`](https://github.com/LedgerHQ/ledger-live/commit/fa0630606016cb93b28eca13d815af74c92b90de) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Usage of CVS v3 instead of V2 on Market part

- [#6799](https://github.com/LedgerHQ/ledger-live/pull/6799) [`b099b70`](https://github.com/LedgerHQ/ledger-live/commit/b099b70c0c5b8b23cae7c9bee6580ad22ace6f4a) Thanks [@andreicovaciu](https://github.com/andreicovaciu)! - Track swap cancel and accept with by returning device property from custom.exchange.start handler

- [#6741](https://github.com/LedgerHQ/ledger-live/pull/6741) [`a115d6c`](https://github.com/LedgerHQ/ledger-live/commit/a115d6cd5dcbcc753d02dedb80f5eb1693d1a249) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLC - Automatically dismiss the PostOnboarding EntryPoint after seven days

- [#6816](https://github.com/LedgerHQ/ledger-live/pull/6816) [`60cd799`](https://github.com/LedgerHQ/ledger-live/commit/60cd799e693e3ae0712a5a9e88206b5304bbc214) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Split currencies utils between CoinFmk and LLC

### Patch Changes

- [#6909](https://github.com/LedgerHQ/ledger-live/pull/6909) [`6512191`](https://github.com/LedgerHQ/ledger-live/commit/65121919bc7c93adc56b0f07d784e8d4ff08283b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix Sentry TypeError in useMarketDataProvider + Refetch Some data only every day

- [#6771](https://github.com/LedgerHQ/ledger-live/pull/6771) [`6c35cc5`](https://github.com/LedgerHQ/ledger-live/commit/6c35cc564cb050614ee571907f628ecf15ec4584) Thanks [@gre](https://github.com/gre)! - LL's preferred countervalues will now have all the possible fiats that our CVS api supports.

- [#7049](https://github.com/LedgerHQ/ledger-live/pull/7049) [`09d3577`](https://github.com/LedgerHQ/ledger-live/commit/09d35775d1b2b93594c9ea8eb393dcb3d30cd2fb) Thanks [@Justkant](https://github.com/Justkant)! - fix(wallet-api): ripple wrong family name

- [#6963](https://github.com/LedgerHQ/ledger-live/pull/6963) [`815ae3d`](https://github.com/LedgerHQ/ledger-live/commit/815ae3dae8027823854ada837df3dc983d09b10f) Thanks [@aussedatlo](https://github.com/aussedatlo)! - restore TransportRaceCondition instead of TransportPendingOperation that caused a breaking change

- [#6936](https://github.com/LedgerHQ/ledger-live/pull/6936) [`024ffae`](https://github.com/LedgerHQ/ledger-live/commit/024ffae05c0fa4ec7e42965cdcb3a3b4a516339c) Thanks [@Justkant](https://github.com/Justkant)! - fix(wallet-api): xrp family not present

- [#6853](https://github.com/LedgerHQ/ledger-live/pull/6853) [`2fc0865`](https://github.com/LedgerHQ/ledger-live/commit/2fc08657eb8acc4a42b21e4266a0bac86dec4c79) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - Replace static provider info to API

- [#6663](https://github.com/LedgerHQ/ledger-live/pull/6663) [`de5de2d`](https://github.com/LedgerHQ/ledger-live/commit/de5de2d273ed6966c82bde2c3a95b98ba594204f) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Reorganize coin serializaiton code

- [#6843](https://github.com/LedgerHQ/ledger-live/pull/6843) [`2a689e4`](https://github.com/LedgerHQ/ledger-live/commit/2a689e447250e882a2ed6d091c032074f4280ca0) Thanks [@Wozacosta](https://github.com/Wozacosta)! - fix manifest loading breaking if no cache

- [#6915](https://github.com/LedgerHQ/ledger-live/pull/6915) [`8dabb3b`](https://github.com/LedgerHQ/ledger-live/commit/8dabb3ba31f9f7e14d172cc29636654fbe0288ee) Thanks [@CremaFR](https://github.com/CremaFR)! - desactivate tezos unrevealed account swap

- [#6971](https://github.com/LedgerHQ/ledger-live/pull/6971) [`cb8b5a0`](https://github.com/LedgerHQ/ledger-live/commit/cb8b5a0f2d78203935bb6e1a687e2c96d4b191c4) Thanks [@CremaFR](https://github.com/CremaFR)! - ff used to prevent currency fetch on disabled provider

- [#6856](https://github.com/LedgerHQ/ledger-live/pull/6856) [`f8980de`](https://github.com/LedgerHQ/ledger-live/commit/f8980de0a317a99b8eaea4b629c8d9bdd2c2a136) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix device available storage computation for all devices supporting custom lock screens.

- [#6583](https://github.com/LedgerHQ/ledger-live/pull/6583) [`83e5690`](https://github.com/LedgerHQ/ledger-live/commit/83e5690429e41ecd1c508b3398904ae747085cf7) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Expose Polkadot crafting functions to external components

- [#6770](https://github.com/LedgerHQ/ledger-live/pull/6770) [`bd57754`](https://github.com/LedgerHQ/ledger-live/commit/bd577542ce0648e41da6ac7c5502aa87e91324fa) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add missing nano app dep Oasys & Shiden

- [#6991](https://github.com/LedgerHQ/ledger-live/pull/6991) [`6eec3f9`](https://github.com/LedgerHQ/ledger-live/commit/6eec3f973ecea36bafc7ebc8b88526399048cdc4) Thanks [@CremaFR](https://github.com/CremaFR)! - hooks to filter swap providers based on FF

- [#6754](https://github.com/LedgerHQ/ledger-live/pull/6754) [`4c01029`](https://github.com/LedgerHQ/ledger-live/commit/4c01029b4d4feb32dab2f9e77da1126050d8c1bc) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Move Tezos in its own package

- [#6987](https://github.com/LedgerHQ/ledger-live/pull/6987) [`dc409f0`](https://github.com/LedgerHQ/ledger-live/commit/dc409f00cb3b4bfde1b659a2f5fabd6c7c8fee70) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - [swap] disabled the call to /rates endpoint in LL when Demo1 FF is ON

- [#7035](https://github.com/LedgerHQ/ledger-live/pull/7035) [`4297d2c`](https://github.com/LedgerHQ/ledger-live/commit/4297d2c6e3988f602b3db65fe51d81bd5ca08135) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add optional chaining to `tronResources.cacheTransactionInfoById` since resources are still unstable which prevents account migration

- [#6719](https://github.com/LedgerHQ/ledger-live/pull/6719) [`ca42740`](https://github.com/LedgerHQ/ledger-live/commit/ca4274009ae050b30695b7b505241e4530ecbd55) Thanks [@RamyEB](https://github.com/RamyEB)! - Save locally added manifest into the storage on both Mobile and Desktop client

- [#6979](https://github.com/LedgerHQ/ledger-live/pull/6979) [`55fdf88`](https://github.com/LedgerHQ/ledger-live/commit/55fdf885831d45bdee9e6a9d77cced79568f6817) Thanks [@CremaFR](https://github.com/CremaFR)! - caching swap providers data

- [#7027](https://github.com/LedgerHQ/ledger-live/pull/7027) [`d155ff9`](https://github.com/LedgerHQ/ledger-live/commit/d155ff95c26c0bfe85e8293a8ab0f79b7b4c59e9) Thanks [@CremaFR](https://github.com/CremaFR)! - keep empty tron subAccounts

- [#6870](https://github.com/LedgerHQ/ledger-live/pull/6870) [`6c5106b`](https://github.com/LedgerHQ/ledger-live/commit/6c5106ba14ad91eeb9d78840f7bc3cd3db3c7059) Thanks [@Justkant](https://github.com/Justkant)! - fix: btc signMessage

- [#6452](https://github.com/LedgerHQ/ledger-live/pull/6452) [`7dab046`](https://github.com/LedgerHQ/ledger-live/commit/7dab04608e62b586e213aaf90e319f06676b52e5) Thanks [@RamyEB](https://github.com/RamyEB)! - Add zod Schema for LiveApp

- [#6735](https://github.com/LedgerHQ/ledger-live/pull/6735) [`bbb1e8d`](https://github.com/LedgerHQ/ledger-live/commit/bbb1e8d0cadfa627b4a955a86bbf66e3b4b4957a) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix cosmos code to avoid using deprecated endpoints

- [#6844](https://github.com/LedgerHQ/ledger-live/pull/6844) [`f19960f`](https://github.com/LedgerHQ/ledger-live/commit/f19960f2e7104e5bdf332269fa92fda47455e17d) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Simplify SignerContext generic signature

- [#6900](https://github.com/LedgerHQ/ledger-live/pull/6900) [`dbe40aa`](https://github.com/LedgerHQ/ledger-live/commit/dbe40aa31d3ce84f3a2638429981892eb61196a7) Thanks [@CremaFR](https://github.com/CremaFR)! - bugfix crashes when incorrect payload from partner

- [#6824](https://github.com/LedgerHQ/ledger-live/pull/6824) [`796f7d8`](https://github.com/LedgerHQ/ledger-live/commit/796f7d8a14f75a19df92e11811c305426a472cd5) Thanks [@cng-ledger](https://github.com/cng-ledger)! - fix(LIVE-10131): take 1 TRX off the swappable amount to prevent insufficient balance when max toggle is on

- [#6883](https://github.com/LedgerHQ/ledger-live/pull/6883) [`6623cd1`](https://github.com/LedgerHQ/ledger-live/commit/6623cd13102bd8340bd7d4dfdd469934527985c3) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - Add user IP

- [#6428](https://github.com/LedgerHQ/ledger-live/pull/6428) [`fa06306`](https://github.com/LedgerHQ/ledger-live/commit/fa0630606016cb93b28eca13d815af74c92b90de) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Reorg files

- [#7042](https://github.com/LedgerHQ/ledger-live/pull/7042) [`57fa89c`](https://github.com/LedgerHQ/ledger-live/commit/57fa89c6ef5e05cfdc5173e0f3b18ce696c55842) Thanks [@lvndry](https://github.com/lvndry)! - Migrate deprecated api for stacks to current

- [#6877](https://github.com/LedgerHQ/ledger-live/pull/6877) [`2a2de6d`](https://github.com/LedgerHQ/ledger-live/commit/2a2de6dc7b55c9ce688d5108502ad67881880883) Thanks [@cng-ledger](https://github.com/cng-ledger)! - fix(LIVE-10131): ignore TronSendTrc20ToNewAccountForbidden during swap
  fix(LIVE-10131): stop throwing new trc20 account error TronSendTrc20ToNewAccountForbidden during sign operation

- [#6840](https://github.com/LedgerHQ/ledger-live/pull/6840) [`77d60e6`](https://github.com/LedgerHQ/ledger-live/commit/77d60e6f61f04b0650947fc56db5052dd4ff7e00) Thanks [@Justkant](https://github.com/Justkant)! - chore: bump wallet-api versions

- [#6929](https://github.com/LedgerHQ/ledger-live/pull/6929) [`0bb6b76`](https://github.com/LedgerHQ/ledger-live/commit/0bb6b76733616d7ae392db2f2164139c63a59fc1) Thanks [@CremaFR](https://github.com/CremaFR)! - fetch CDN for swap providers data

- [#7071](https://github.com/LedgerHQ/ledger-live/pull/7071) [`521170b`](https://github.com/LedgerHQ/ledger-live/commit/521170bc4e2338f97924cead842184620988c7de) Thanks [@Justkant](https://github.com/Justkant)! - chore: patch changesets to avoid too big batching on github requests

- [#6887](https://github.com/LedgerHQ/ledger-live/pull/6887) [`7bbad43`](https://github.com/LedgerHQ/ledger-live/commit/7bbad43beab706a98b03ff9147cc67f289220c44) Thanks [@lvndry](https://github.com/lvndry)! - try/catch coin config + fix configuration name typo

- [#6733](https://github.com/LedgerHQ/ledger-live/pull/6733) [`bfca25b`](https://github.com/LedgerHQ/ledger-live/commit/bfca25b975e00c057da3a7ec82a9b05a0e5d5cf7) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Device renaming: add Nano S Plus compatibility

- [#6781](https://github.com/LedgerHQ/ledger-live/pull/6781) [`37836b3`](https://github.com/LedgerHQ/ledger-live/commit/37836b35c97a1540681eadb451e19c44466a3826) Thanks [@CremaFR](https://github.com/CremaFR)! - bugfix: infinite spinner when fund after reject tx

- [#6912](https://github.com/LedgerHQ/ledger-live/pull/6912) [`8384e55`](https://github.com/LedgerHQ/ledger-live/commit/8384e55f70b5eee8484990283ad0c6097e426804) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - RegisterTransportModules: improve typing of discovery results

- [#6771](https://github.com/LedgerHQ/ledger-live/pull/6771) [`6c35cc5`](https://github.com/LedgerHQ/ledger-live/commit/6c35cc564cb050614ee571907f628ecf15ec4584) Thanks [@gre](https://github.com/gre)! - Countervalues performance evolutions. (8min -> 1min refresh rate, more efficient http calls caching,..)

- [#7006](https://github.com/LedgerHQ/ledger-live/pull/7006) [`1a5b277`](https://github.com/LedgerHQ/ledger-live/commit/1a5b2777b7b71aa4c4e353010eeb9e3dab432bca) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Remove feature flags "supportDeviceStax" and "staxWelcomeScreen"

- [#6852](https://github.com/LedgerHQ/ledger-live/pull/6852) [`48ac131`](https://github.com/LedgerHQ/ledger-live/commit/48ac1318f43e003ff8db807391cee79e4b010b3a) Thanks [@drakoFukayu](https://github.com/drakoFukayu)! - increase tr20 expiry time to 10mn for Vault user

- [#6928](https://github.com/LedgerHQ/ledger-live/pull/6928) [`f84fc59`](https://github.com/LedgerHQ/ledger-live/commit/f84fc590cf8838794324d12bfe9b3a37cf18c29b) Thanks [@RamyEB](https://github.com/RamyEB)! - set account on dapp browser

- [#7048](https://github.com/LedgerHQ/ledger-live/pull/7048) [`a2505de`](https://github.com/LedgerHQ/ledger-live/commit/a2505deb93dd0722981a90e12082ff1dbefc29b1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Create Wallet sync arch inside LLM and add FF

- [#6757](https://github.com/LedgerHQ/ledger-live/pull/6757) [`f17a3cb`](https://github.com/LedgerHQ/ledger-live/commit/f17a3cbc16abf7fadf686025a5ca56ec1a1e7bb6) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Add buy sell shortcut feature flag to toggle intro screen flow on buy sell ui live app.

- Updated dependencies [[`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11), [`6c35cc5`](https://github.com/LedgerHQ/ledger-live/commit/6c35cc564cb050614ee571907f628ecf15ec4584), [`b9f1f71`](https://github.com/LedgerHQ/ledger-live/commit/b9f1f715355752d8c57c24ecd6a6d166b80f689d), [`815ae3d`](https://github.com/LedgerHQ/ledger-live/commit/815ae3dae8027823854ada837df3dc983d09b10f), [`aedced6`](https://github.com/LedgerHQ/ledger-live/commit/aedced603abbbd0b1ef5afcc5cb83d9520388117), [`de5de2d`](https://github.com/LedgerHQ/ledger-live/commit/de5de2d273ed6966c82bde2c3a95b98ba594204f), [`0fcce49`](https://github.com/LedgerHQ/ledger-live/commit/0fcce49ae1770682837d9df8df57ba5a81330e87), [`83e5690`](https://github.com/LedgerHQ/ledger-live/commit/83e5690429e41ecd1c508b3398904ae747085cf7), [`4c01029`](https://github.com/LedgerHQ/ledger-live/commit/4c01029b4d4feb32dab2f9e77da1126050d8c1bc), [`12a74b9`](https://github.com/LedgerHQ/ledger-live/commit/12a74b9f2f27285e44a5dca665422b3b8ecd4028), [`326cae0`](https://github.com/LedgerHQ/ledger-live/commit/326cae088cc33795536deb1d868c86e8dbeb6a13), [`6c35cc5`](https://github.com/LedgerHQ/ledger-live/commit/6c35cc564cb050614ee571907f628ecf15ec4584), [`aa312f9`](https://github.com/LedgerHQ/ledger-live/commit/aa312f9e43740106893602c9edbaeca1d20e1c4e), [`4499990`](https://github.com/LedgerHQ/ledger-live/commit/449999066c58ae5df371dfb92a7230f9b5e90a60), [`a18c28e`](https://github.com/LedgerHQ/ledger-live/commit/a18c28e3f6a6132bd5e53d5b61721084b3aa19e8), [`cec1599`](https://github.com/LedgerHQ/ledger-live/commit/cec1599a41aa1a18a249e34312164bc93b63972f), [`49c527a`](https://github.com/LedgerHQ/ledger-live/commit/49c527a6d8717e7ae9ff7223a5fa91312167517b), [`801265b`](https://github.com/LedgerHQ/ledger-live/commit/801265b7ff3ed7ebd0012eb50f70898557a2dd52), [`6d44f25`](https://github.com/LedgerHQ/ledger-live/commit/6d44f255c5b2f453c61d0b754807db1f76d7174e), [`d90a17d`](https://github.com/LedgerHQ/ledger-live/commit/d90a17d1fe8b1bc3fe002f0aa28ed1cbca3cc9f8), [`689e6e5`](https://github.com/LedgerHQ/ledger-live/commit/689e6e5a443170b8e6c2b404cc99af2e67d8e8e4), [`434262d`](https://github.com/LedgerHQ/ledger-live/commit/434262db4560f62113002fbb607bd1a8da0712b4), [`f19960f`](https://github.com/LedgerHQ/ledger-live/commit/f19960f2e7104e5bdf332269fa92fda47455e17d), [`1cee8ff`](https://github.com/LedgerHQ/ledger-live/commit/1cee8ff557fdd6e44f55d4d396805e02c2733cc1), [`5d18b4f`](https://github.com/LedgerHQ/ledger-live/commit/5d18b4ff4d1745e7c32993a8d94bb1dc5529391f), [`3b9c93c`](https://github.com/LedgerHQ/ledger-live/commit/3b9c93c0de8ceff2af96a6ee8e42b8d9c2ab7af0), [`6623cd1`](https://github.com/LedgerHQ/ledger-live/commit/6623cd13102bd8340bd7d4dfdd469934527985c3), [`2f2b754`](https://github.com/LedgerHQ/ledger-live/commit/2f2b754b1350360ca0d9f761ca6e4a8cbaff141b), [`689e6e5`](https://github.com/LedgerHQ/ledger-live/commit/689e6e5a443170b8e6c2b404cc99af2e67d8e8e4), [`6552679`](https://github.com/LedgerHQ/ledger-live/commit/65526794bb4d1fbc7e286c0e1c0b6d021413fc8c), [`77d60e6`](https://github.com/LedgerHQ/ledger-live/commit/77d60e6f61f04b0650947fc56db5052dd4ff7e00), [`056946e`](https://github.com/LedgerHQ/ledger-live/commit/056946e5a0a27c202e6153996a625ede07ca0833), [`fda6a81`](https://github.com/LedgerHQ/ledger-live/commit/fda6a814544b3a1debceab22f69485911e76cadc), [`801265b`](https://github.com/LedgerHQ/ledger-live/commit/801265b7ff3ed7ebd0012eb50f70898557a2dd52), [`0c6c26c`](https://github.com/LedgerHQ/ledger-live/commit/0c6c26c852a36fb8567bd7eb19716c766f4c0a25), [`bfca25b`](https://github.com/LedgerHQ/ledger-live/commit/bfca25b975e00c057da3a7ec82a9b05a0e5d5cf7), [`689e6e5`](https://github.com/LedgerHQ/ledger-live/commit/689e6e5a443170b8e6c2b404cc99af2e67d8e8e4), [`6c35cc5`](https://github.com/LedgerHQ/ledger-live/commit/6c35cc564cb050614ee571907f628ecf15ec4584), [`b099b70`](https://github.com/LedgerHQ/ledger-live/commit/b099b70c0c5b8b23cae7c9bee6580ad22ace6f4a), [`2a8d564`](https://github.com/LedgerHQ/ledger-live/commit/2a8d564b483a35045a957b430b4d7d252e2ddcfe), [`12a74b9`](https://github.com/LedgerHQ/ledger-live/commit/12a74b9f2f27285e44a5dca665422b3b8ecd4028), [`60cd799`](https://github.com/LedgerHQ/ledger-live/commit/60cd799e693e3ae0712a5a9e88206b5304bbc214), [`84274a6`](https://github.com/LedgerHQ/ledger-live/commit/84274a6e764a385f707bc811ead7a7e92a02ed6a)]:
  - @ledgerhq/hw-transport-mocker@6.29.0-next.0
  - @ledgerhq/hw-app-algorand@6.29.0-next.0
  - @ledgerhq/hw-app-exchange@0.5.0-next.0
  - @ledgerhq/hw-app-polkadot@6.29.0-next.0
  - @ledgerhq/hw-app-cosmos@6.30.0-next.0
  - @ledgerhq/hw-app-solana@7.2.0-next.0
  - @ledgerhq/cryptoassets@13.1.0-next.0
  - @ledgerhq/hw-app-tezos@6.29.0-next.0
  - @ledgerhq/hw-transport@6.31.0-next.0
  - @ledgerhq/hw-app-near@6.29.0-next.0
  - @ledgerhq/hw-app-btc@10.3.0-next.0
  - @ledgerhq/hw-app-eth@6.37.0-next.0
  - @ledgerhq/hw-app-str@6.29.0-next.0
  - @ledgerhq/hw-app-trx@6.29.0-next.0
  - @ledgerhq/hw-app-vet@0.2.0-next.0
  - @ledgerhq/hw-app-xrp@6.29.0-next.0
  - @ledgerhq/coin-algorand@0.5.0-next.0
  - @ledgerhq/coin-polkadot@0.7.0-next.0
  - @ledgerhq/coin-bitcoin@0.6.0-next.0
  - @ledgerhq/devices@8.4.0-next.0
  - @ledgerhq/errors@6.17.0-next.0
  - @ledgerhq/live-countervalues-react@0.2.0-next.0
  - @ledgerhq/crypto-icons-ui@1.2.0-next.0
  - @ledgerhq/coin-near@0.5.0-next.0
  - @ledgerhq/coin-evm@2.1.0-next.0
  - @ledgerhq/live-countervalues@0.2.0-next.0
  - @ledgerhq/wallet-api-exchange-module@0.7.0-next.0
  - @ledgerhq/coin-framework@0.14.0-next.0
  - @ledgerhq/live-network@1.3.0-next.0
  - @ledgerhq/device-core@0.2.0-next.0
  - @ledgerhq/live-nft@0.4.0-next.0
  - @ledgerhq/live-promise@0.1.0-next.0
  - @ledgerhq/live-env@2.1.0-next.0
  - @ledgerhq/coin-tezos@0.4.0-next.0
  - @ledgerhq/coin-cardano@0.1.0-next.0
  - @ledgerhq/coin-solana@0.7.0-next.0
  - @ledgerhq/coin-xrp@0.2.0-next.0
  - @ledgerhq/live-wallet@0.1.1-next.0
  - @ledgerhq/speculos-transport@0.1.1-next.0

## 34.2.0

### Minor Changes

- [#6669](https://github.com/LedgerHQ/ledger-live/pull/6669) [`fdb76a7`](https://github.com/LedgerHQ/ledger-live/commit/fdb76a7c3a8459a50b22b3e5a5a3002932805bcd) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Removing support for Ropsten & Goerli networks and adding Sepolia variants

- [#6603](https://github.com/LedgerHQ/ledger-live/pull/6603) [`df1dcbf`](https://github.com/LedgerHQ/ledger-live/commit/df1dcbffe901d7c4baddb46a06b08a4ed5b7a17e) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for failed operations in Cosmos chains. Fix breaking change in the `GetTxsEvent` Cosmos SDK endpoint after v0.47. Fix incorrect transaction simulation in Cosmos chains. Add types to all Cosmos SDK endpoint for better analysis of SDK breaking changes and depreciations.

- [#6682](https://github.com/LedgerHQ/ledger-live/pull/6682) [`10df676`](https://github.com/LedgerHQ/ledger-live/commit/10df67625e4affedd143d0e3c574677d6bf1a6e5) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fixed bug regarding invalid data supplied to ledger and added error message for mobile and desktop

- [#6712](https://github.com/LedgerHQ/ledger-live/pull/6712) [`e7ed028`](https://github.com/LedgerHQ/ledger-live/commit/e7ed028716bccb9dc29aa2fc672ecc7a3e78276a) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add CoinConfig to Near module

### Patch Changes

- [#6340](https://github.com/LedgerHQ/ledger-live/pull/6340) [`433bfec`](https://github.com/LedgerHQ/ledger-live/commit/433bfecf77f85601c4974984fa8342b5e2513469) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - New hooks to fecth Data from CVS and update Market without using MarketDataProvider

- [#6686](https://github.com/LedgerHQ/ledger-live/pull/6686) [`bbe790e`](https://github.com/LedgerHQ/ledger-live/commit/bbe790ef2efdb0d8bdd57829b6543c3baab5dfb9) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Add buy-sell-ui feature flag to enable progressive roll out of new manifest ID.

- [#6645](https://github.com/LedgerHQ/ledger-live/pull/6645) [`d37d8df`](https://github.com/LedgerHQ/ledger-live/commit/d37d8df2482d1c7494401201c215b0a941bdb9f1) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add new storyly instance id

- [#6658](https://github.com/LedgerHQ/ledger-live/pull/6658) [`be3748b`](https://github.com/LedgerHQ/ledger-live/commit/be3748b35eea0b0a68de6825feed7ba2925f057e) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix format param swap

- [#6517](https://github.com/LedgerHQ/ledger-live/pull/6517) [`33c4239`](https://github.com/LedgerHQ/ledger-live/commit/33c42392386e5e8ebf9f3251ccf1ade3af11644d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update MarketPerformers Endpoint

- [#6592](https://github.com/LedgerHQ/ledger-live/pull/6592) [`21f9d07`](https://github.com/LedgerHQ/ledger-live/commit/21f9d07785dc3f162626f37a42ebe692037c9b2a) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - Add expired message error

- [#6692](https://github.com/LedgerHQ/ledger-live/pull/6692) [`3896648`](https://github.com/LedgerHQ/ledger-live/commit/389664874b98074905a7f8f8e5a845bb76908f13) Thanks [@lvndry](https://github.com/lvndry)! - Add support for coin config in bitcoin family

- [#6610](https://github.com/LedgerHQ/ledger-live/pull/6610) [`06f4606`](https://github.com/LedgerHQ/ledger-live/commit/06f4606f354496bc322be34932260eb9a1cdac42) Thanks [@Wozacosta](https://github.com/Wozacosta)! - feat(wallet-api): bump wallet-api to add stacks support

- [#6713](https://github.com/LedgerHQ/ledger-live/pull/6713) [`cc8c36d`](https://github.com/LedgerHQ/ledger-live/commit/cc8c36d65aad93f6090a696d9b9b2273cd193be2) Thanks [@CremaFR](https://github.com/CremaFR)! - added step to userRefused error

- [#6711](https://github.com/LedgerHQ/ledger-live/pull/6711) [`417c180`](https://github.com/LedgerHQ/ledger-live/commit/417c180bf2c82dddd5a217139bdb90aaf54ec116) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - Bug moonpay FF

- [#6608](https://github.com/LedgerHQ/ledger-live/pull/6608) [`1197168`](https://github.com/LedgerHQ/ledger-live/commit/1197168817b37ae5432df3e6c2668e8694497787) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Disable storyly feature flag + protect testing in settings with feature flag enabler

- [#6612](https://github.com/LedgerHQ/ledger-live/pull/6612) [`12daa05`](https://github.com/LedgerHQ/ledger-live/commit/12daa05e5f924a483d305417540ce9c83034b977) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Add additional properties to the accepted and cancelled swap api calls

- [#6684](https://github.com/LedgerHQ/ledger-live/pull/6684) [`96029e1`](https://github.com/LedgerHQ/ledger-live/commit/96029e1396be2f283f0345a59e08009b0a6a96db) Thanks [@CremaFR](https://github.com/CremaFR)! - Allow additional fees when using maxButton

- [#6783](https://github.com/LedgerHQ/ledger-live/pull/6783) [`b6b5d5c`](https://github.com/LedgerHQ/ledger-live/commit/b6b5d5c9664ff6840689b401176a62beff1079c9) Thanks [@CremaFR](https://github.com/CremaFR)! - bugfix: infinite spinner when fund after reject tx

- [#6675](https://github.com/LedgerHQ/ledger-live/pull/6675) [`f87990f`](https://github.com/LedgerHQ/ledger-live/commit/f87990ff29e0a7db6f9ff34e10bce1ff99289b35) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix infinit loop bug in LLM

- [#6683](https://github.com/LedgerHQ/ledger-live/pull/6683) [`d26bd9e`](https://github.com/LedgerHQ/ledger-live/commit/d26bd9e9352d664af7c2acb3170f2a2afe8b0972) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - MarketPerf Widget wasn't updated well when Top 5 crypto is the same for multiples minutes

- [#6662](https://github.com/LedgerHQ/ledger-live/pull/6662) [`1bc09ce`](https://github.com/LedgerHQ/ledger-live/commit/1bc09ce84d1d579a253d0239747ad969e9613b52) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - feat(earlysecuritychecks): make stax update from <=1.3.0 unskippable

- [#6567](https://github.com/LedgerHQ/ledger-live/pull/6567) [`0dae8e5`](https://github.com/LedgerHQ/ledger-live/commit/0dae8e5a33704eaee5976e8ae2cbe29c6f458167) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update Account Bridge `preload` signature which was wrong

- [#6652](https://github.com/LedgerHQ/ledger-live/pull/6652) [`c47f372`](https://github.com/LedgerHQ/ledger-live/commit/c47f372705cd251e17bea08589d5cfe9930108e9) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Fix getRedelegations cosmos coin-module

- Updated dependencies [[`5552ca0`](https://github.com/LedgerHQ/ledger-live/commit/5552ca0542d5734b845ed23dae2f02c6d1b8ba2d), [`fdb76a7`](https://github.com/LedgerHQ/ledger-live/commit/fdb76a7c3a8459a50b22b3e5a5a3002932805bcd), [`0dae8e5`](https://github.com/LedgerHQ/ledger-live/commit/0dae8e5a33704eaee5976e8ae2cbe29c6f458167), [`d766a94`](https://github.com/LedgerHQ/ledger-live/commit/d766a94232dab571f01f4622679f65d651faef3c), [`2b326c8`](https://github.com/LedgerHQ/ledger-live/commit/2b326c855f17009a6b4142c64e7ab41174c3faa1), [`df1dcbf`](https://github.com/LedgerHQ/ledger-live/commit/df1dcbffe901d7c4baddb46a06b08a4ed5b7a17e), [`3896648`](https://github.com/LedgerHQ/ledger-live/commit/389664874b98074905a7f8f8e5a845bb76908f13), [`0db1bf8`](https://github.com/LedgerHQ/ledger-live/commit/0db1bf8cd57d6a38e1f2b3fe56183fb1fc59a9ca), [`8c42c2c`](https://github.com/LedgerHQ/ledger-live/commit/8c42c2c2b718c392833206a33d8b97043daa7b81), [`3896648`](https://github.com/LedgerHQ/ledger-live/commit/389664874b98074905a7f8f8e5a845bb76908f13), [`9f90797`](https://github.com/LedgerHQ/ledger-live/commit/9f90797d00a96674025ca8d1c7d9c5df9f435e24), [`e7ed028`](https://github.com/LedgerHQ/ledger-live/commit/e7ed028716bccb9dc29aa2fc672ecc7a3e78276a), [`e7ed028`](https://github.com/LedgerHQ/ledger-live/commit/e7ed028716bccb9dc29aa2fc672ecc7a3e78276a), [`96029e1`](https://github.com/LedgerHQ/ledger-live/commit/96029e1396be2f283f0345a59e08009b0a6a96db), [`45a53bc`](https://github.com/LedgerHQ/ledger-live/commit/45a53bc227ab2f42b1e839aacbb8c251d0a4a5d2), [`0dae8e5`](https://github.com/LedgerHQ/ledger-live/commit/0dae8e5a33704eaee5976e8ae2cbe29c6f458167), [`fdb76a7`](https://github.com/LedgerHQ/ledger-live/commit/fdb76a7c3a8459a50b22b3e5a5a3002932805bcd), [`06f4606`](https://github.com/LedgerHQ/ledger-live/commit/06f4606f354496bc322be34932260eb9a1cdac42), [`1bc09ce`](https://github.com/LedgerHQ/ledger-live/commit/1bc09ce84d1d579a253d0239747ad969e9613b52), [`d9d8902`](https://github.com/LedgerHQ/ledger-live/commit/d9d890272167aec86db19f028b64314f65a9bf14), [`0dae8e5`](https://github.com/LedgerHQ/ledger-live/commit/0dae8e5a33704eaee5976e8ae2cbe29c6f458167), [`cfb97f7`](https://github.com/LedgerHQ/ledger-live/commit/cfb97f7d5c81824815522e8699b7469047b1513a), [`2f2ef00`](https://github.com/LedgerHQ/ledger-live/commit/2f2ef001145469870ac703b6af28fdf8f0d70945)]:
  - @ledgerhq/live-promise@0.0.4
  - @ledgerhq/coin-framework@0.13.0
  - @ledgerhq/coin-evm@2.0.0
  - @ledgerhq/wallet-api-exchange-module@0.6.0
  - @ledgerhq/coin-near@0.4.0
  - @ledgerhq/live-env@2.0.2
  - @ledgerhq/coin-bitcoin@0.5.0
  - @ledgerhq/coin-polkadot@0.6.2
  - @ledgerhq/live-nft@0.3.2
  - @ledgerhq/hw-app-near@6.28.8
  - @ledgerhq/cryptoassets@13.0.0
  - @ledgerhq/device-core@0.1.2
  - @ledgerhq/live-network@1.2.2
  - @ledgerhq/coin-algorand@0.4.2
  - @ledgerhq/hw-app-eth@6.36.1
  - @ledgerhq/live-countervalues@0.1.5
  - @ledgerhq/live-countervalues-react@0.1.5
  - @ledgerhq/hw-app-vet@0.1.8

## 34.2.0-next.3

### Patch Changes

- Updated dependencies [[`2b326c8`](https://github.com/LedgerHQ/ledger-live/commit/2b326c855f17009a6b4142c64e7ab41174c3faa1)]:
  - @ledgerhq/coin-near@0.4.0-next.2

## 34.2.0-next.2

### Patch Changes

- [#6783](https://github.com/LedgerHQ/ledger-live/pull/6783) [`b6b5d5c`](https://github.com/LedgerHQ/ledger-live/commit/b6b5d5c9664ff6840689b401176a62beff1079c9) Thanks [@CremaFR](https://github.com/CremaFR)! - bugfix: infinite spinner when fund after reject tx

## 34.2.0-next.1

### Patch Changes

- Updated dependencies [[`5552ca0`](https://github.com/LedgerHQ/ledger-live/commit/5552ca0542d5734b845ed23dae2f02c6d1b8ba2d)]:
  - @ledgerhq/live-promise@0.0.4-next.1
  - @ledgerhq/coin-algorand@0.4.2-next.1
  - @ledgerhq/coin-evm@2.0.0-next.1
  - @ledgerhq/live-countervalues@0.1.5-next.1
  - @ledgerhq/live-network@1.2.2-next.1
  - @ledgerhq/live-countervalues-react@0.1.5-next.1
  - @ledgerhq/coin-bitcoin@0.5.0-next.1
  - @ledgerhq/coin-near@0.4.0-next.1
  - @ledgerhq/coin-polkadot@0.6.2-next.1
  - @ledgerhq/device-core@0.1.2-next.1
  - @ledgerhq/live-nft@0.3.2-next.1

## 34.2.0-next.0

### Minor Changes

- [#6669](https://github.com/LedgerHQ/ledger-live/pull/6669) [`fdb76a7`](https://github.com/LedgerHQ/ledger-live/commit/fdb76a7c3a8459a50b22b3e5a5a3002932805bcd) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Removing support for Ropsten & Goerli networks and adding Sepolia variants

- [#6603](https://github.com/LedgerHQ/ledger-live/pull/6603) [`df1dcbf`](https://github.com/LedgerHQ/ledger-live/commit/df1dcbffe901d7c4baddb46a06b08a4ed5b7a17e) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for failed operations in Cosmos chains. Fix breaking change in the `GetTxsEvent` Cosmos SDK endpoint after v0.47. Fix incorrect transaction simulation in Cosmos chains. Add types to all Cosmos SDK endpoint for better analysis of SDK breaking changes and depreciations.

- [#6682](https://github.com/LedgerHQ/ledger-live/pull/6682) [`10df676`](https://github.com/LedgerHQ/ledger-live/commit/10df67625e4affedd143d0e3c574677d6bf1a6e5) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fixed bug regarding invalid data supplied to ledger and added error message for mobile and desktop

- [#6712](https://github.com/LedgerHQ/ledger-live/pull/6712) [`e7ed028`](https://github.com/LedgerHQ/ledger-live/commit/e7ed028716bccb9dc29aa2fc672ecc7a3e78276a) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add CoinConfig to Near module

### Patch Changes

- [#6340](https://github.com/LedgerHQ/ledger-live/pull/6340) [`433bfec`](https://github.com/LedgerHQ/ledger-live/commit/433bfecf77f85601c4974984fa8342b5e2513469) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - New hooks to fecth Data from CVS and update Market without using MarketDataProvider

- [#6686](https://github.com/LedgerHQ/ledger-live/pull/6686) [`bbe790e`](https://github.com/LedgerHQ/ledger-live/commit/bbe790ef2efdb0d8bdd57829b6543c3baab5dfb9) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Add buy-sell-ui feature flag to enable progressive roll out of new manifest ID.

- [#6645](https://github.com/LedgerHQ/ledger-live/pull/6645) [`d37d8df`](https://github.com/LedgerHQ/ledger-live/commit/d37d8df2482d1c7494401201c215b0a941bdb9f1) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add new storyly instance id

- [#6658](https://github.com/LedgerHQ/ledger-live/pull/6658) [`be3748b`](https://github.com/LedgerHQ/ledger-live/commit/be3748b35eea0b0a68de6825feed7ba2925f057e) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix format param swap

- [#6517](https://github.com/LedgerHQ/ledger-live/pull/6517) [`33c4239`](https://github.com/LedgerHQ/ledger-live/commit/33c42392386e5e8ebf9f3251ccf1ade3af11644d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update MarketPerformers Endpoint

- [#6592](https://github.com/LedgerHQ/ledger-live/pull/6592) [`21f9d07`](https://github.com/LedgerHQ/ledger-live/commit/21f9d07785dc3f162626f37a42ebe692037c9b2a) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - Add expired message error

- [#6692](https://github.com/LedgerHQ/ledger-live/pull/6692) [`3896648`](https://github.com/LedgerHQ/ledger-live/commit/389664874b98074905a7f8f8e5a845bb76908f13) Thanks [@lvndry](https://github.com/lvndry)! - Add support for coin config in bitcoin family

- [#6610](https://github.com/LedgerHQ/ledger-live/pull/6610) [`06f4606`](https://github.com/LedgerHQ/ledger-live/commit/06f4606f354496bc322be34932260eb9a1cdac42) Thanks [@Wozacosta](https://github.com/Wozacosta)! - feat(wallet-api): bump wallet-api to add stacks support

- [#6713](https://github.com/LedgerHQ/ledger-live/pull/6713) [`cc8c36d`](https://github.com/LedgerHQ/ledger-live/commit/cc8c36d65aad93f6090a696d9b9b2273cd193be2) Thanks [@CremaFR](https://github.com/CremaFR)! - added step to userRefused error

- [#6711](https://github.com/LedgerHQ/ledger-live/pull/6711) [`417c180`](https://github.com/LedgerHQ/ledger-live/commit/417c180bf2c82dddd5a217139bdb90aaf54ec116) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - Bug moonpay FF

- [#6608](https://github.com/LedgerHQ/ledger-live/pull/6608) [`1197168`](https://github.com/LedgerHQ/ledger-live/commit/1197168817b37ae5432df3e6c2668e8694497787) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Disable storyly feature flag + protect testing in settings with feature flag enabler

- [#6612](https://github.com/LedgerHQ/ledger-live/pull/6612) [`12daa05`](https://github.com/LedgerHQ/ledger-live/commit/12daa05e5f924a483d305417540ce9c83034b977) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Add additional properties to the accepted and cancelled swap api calls

- [#6684](https://github.com/LedgerHQ/ledger-live/pull/6684) [`96029e1`](https://github.com/LedgerHQ/ledger-live/commit/96029e1396be2f283f0345a59e08009b0a6a96db) Thanks [@CremaFR](https://github.com/CremaFR)! - Allow additional fees when using maxButton

- [#6675](https://github.com/LedgerHQ/ledger-live/pull/6675) [`f87990f`](https://github.com/LedgerHQ/ledger-live/commit/f87990ff29e0a7db6f9ff34e10bce1ff99289b35) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix infinit loop bug in LLM

- [#6683](https://github.com/LedgerHQ/ledger-live/pull/6683) [`d26bd9e`](https://github.com/LedgerHQ/ledger-live/commit/d26bd9e9352d664af7c2acb3170f2a2afe8b0972) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - MarketPerf Widget wasn't updated well when Top 5 crypto is the same for multiples minutes

- [#6662](https://github.com/LedgerHQ/ledger-live/pull/6662) [`1bc09ce`](https://github.com/LedgerHQ/ledger-live/commit/1bc09ce84d1d579a253d0239747ad969e9613b52) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - feat(earlysecuritychecks): make stax update from <=1.3.0 unskippable

- [#6567](https://github.com/LedgerHQ/ledger-live/pull/6567) [`0dae8e5`](https://github.com/LedgerHQ/ledger-live/commit/0dae8e5a33704eaee5976e8ae2cbe29c6f458167) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update Account Bridge `preload` signature which was wrong

- [#6652](https://github.com/LedgerHQ/ledger-live/pull/6652) [`c47f372`](https://github.com/LedgerHQ/ledger-live/commit/c47f372705cd251e17bea08589d5cfe9930108e9) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Fix getRedelegations cosmos coin-module

- Updated dependencies [[`fdb76a7`](https://github.com/LedgerHQ/ledger-live/commit/fdb76a7c3a8459a50b22b3e5a5a3002932805bcd), [`0dae8e5`](https://github.com/LedgerHQ/ledger-live/commit/0dae8e5a33704eaee5976e8ae2cbe29c6f458167), [`d766a94`](https://github.com/LedgerHQ/ledger-live/commit/d766a94232dab571f01f4622679f65d651faef3c), [`df1dcbf`](https://github.com/LedgerHQ/ledger-live/commit/df1dcbffe901d7c4baddb46a06b08a4ed5b7a17e), [`3896648`](https://github.com/LedgerHQ/ledger-live/commit/389664874b98074905a7f8f8e5a845bb76908f13), [`0db1bf8`](https://github.com/LedgerHQ/ledger-live/commit/0db1bf8cd57d6a38e1f2b3fe56183fb1fc59a9ca), [`8c42c2c`](https://github.com/LedgerHQ/ledger-live/commit/8c42c2c2b718c392833206a33d8b97043daa7b81), [`3896648`](https://github.com/LedgerHQ/ledger-live/commit/389664874b98074905a7f8f8e5a845bb76908f13), [`9f90797`](https://github.com/LedgerHQ/ledger-live/commit/9f90797d00a96674025ca8d1c7d9c5df9f435e24), [`e7ed028`](https://github.com/LedgerHQ/ledger-live/commit/e7ed028716bccb9dc29aa2fc672ecc7a3e78276a), [`e7ed028`](https://github.com/LedgerHQ/ledger-live/commit/e7ed028716bccb9dc29aa2fc672ecc7a3e78276a), [`96029e1`](https://github.com/LedgerHQ/ledger-live/commit/96029e1396be2f283f0345a59e08009b0a6a96db), [`45a53bc`](https://github.com/LedgerHQ/ledger-live/commit/45a53bc227ab2f42b1e839aacbb8c251d0a4a5d2), [`0dae8e5`](https://github.com/LedgerHQ/ledger-live/commit/0dae8e5a33704eaee5976e8ae2cbe29c6f458167), [`fdb76a7`](https://github.com/LedgerHQ/ledger-live/commit/fdb76a7c3a8459a50b22b3e5a5a3002932805bcd), [`06f4606`](https://github.com/LedgerHQ/ledger-live/commit/06f4606f354496bc322be34932260eb9a1cdac42), [`1bc09ce`](https://github.com/LedgerHQ/ledger-live/commit/1bc09ce84d1d579a253d0239747ad969e9613b52), [`d9d8902`](https://github.com/LedgerHQ/ledger-live/commit/d9d890272167aec86db19f028b64314f65a9bf14), [`0dae8e5`](https://github.com/LedgerHQ/ledger-live/commit/0dae8e5a33704eaee5976e8ae2cbe29c6f458167), [`cfb97f7`](https://github.com/LedgerHQ/ledger-live/commit/cfb97f7d5c81824815522e8699b7469047b1513a), [`2f2ef00`](https://github.com/LedgerHQ/ledger-live/commit/2f2ef001145469870ac703b6af28fdf8f0d70945)]:
  - @ledgerhq/coin-framework@0.13.0-next.0
  - @ledgerhq/coin-evm@2.0.0-next.0
  - @ledgerhq/wallet-api-exchange-module@0.6.0-next.0
  - @ledgerhq/live-env@2.0.2-next.0
  - @ledgerhq/coin-bitcoin@0.5.0-next.0
  - @ledgerhq/coin-polkadot@0.6.2-next.0
  - @ledgerhq/live-nft@0.3.2-next.0
  - @ledgerhq/hw-app-near@6.28.8-next.0
  - @ledgerhq/coin-near@0.4.0-next.0
  - @ledgerhq/cryptoassets@13.0.0-next.0
  - @ledgerhq/device-core@0.1.2-next.0
  - @ledgerhq/live-network@1.2.2-next.0
  - @ledgerhq/live-promise@0.0.4-next.0
  - @ledgerhq/coin-algorand@0.4.2-next.0
  - @ledgerhq/hw-app-eth@6.36.1-next.0
  - @ledgerhq/live-countervalues@0.1.5-next.0
  - @ledgerhq/live-countervalues-react@0.1.5-next.0
  - @ledgerhq/hw-app-vet@0.1.8-next.0

## 34.1.0

### Minor Changes

- [#6614](https://github.com/LedgerHQ/ledger-live/pull/6614) [`762dea1`](https://github.com/LedgerHQ/ledger-live/commit/762dea1c52ef0537961d058f7ba81fa399663ac1) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for failed operations in Cosmos chains. Fix breaking change in the `GetTxsEvent` Cosmos SDK endpoint after v0.47. Fix incorrect transaction simulation in Cosmos chains. Add types to all Cosmos SDK endpoint for better analysis of SDK breaking changes and depreciations.

- [#6495](https://github.com/LedgerHQ/ledger-live/pull/6495) [`5ae6d8f`](https://github.com/LedgerHQ/ledger-live/commit/5ae6d8fb9b868dc01724e84ede2708e7a717c3f2) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLD - Help buttons redirect to the chatbot instead of the faq

- [#6475](https://github.com/LedgerHQ/ledger-live/pull/6475) [`da7ba83`](https://github.com/LedgerHQ/ledger-live/commit/da7ba837b98c1118135b6949ac3efcd403a790ab) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Add debug options to set exchange provider's info

- [#6476](https://github.com/LedgerHQ/ledger-live/pull/6476) [`21f5c44`](https://github.com/LedgerHQ/ledger-live/commit/21f5c4438bb542a3891f692f4274ee4c28aa76cd) Thanks [@KVNLS](https://github.com/KVNLS)! - Remove llmWalletQuickActions feature flag

- [#6261](https://github.com/LedgerHQ/ledger-live/pull/6261) [`a780777`](https://github.com/LedgerHQ/ledger-live/commit/a780777c13e08c1c3cd66ef5f6deac0fe928a894) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add new feature flags: supportDeviceStax, supportDeviceEuropa
  Remove legacy feature flags: syncOnboarding, customImage

- [#6045](https://github.com/LedgerHQ/ledger-live/pull/6045) [`1aa8ef4`](https://github.com/LedgerHQ/ledger-live/commit/1aa8ef404411c31f6ac4cf09fba453042db8b955) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Extract bitcoin as a separate package

- [#6471](https://github.com/LedgerHQ/ledger-live/pull/6471) [`d2f8b26`](https://github.com/LedgerHQ/ledger-live/commit/d2f8b26c99551cba902c07e9c544f3c84d74686c) Thanks [@KVNLS](https://github.com/KVNLS)! - Remove llmNewArchMarket feature flag and cleanup the code

- [#6309](https://github.com/LedgerHQ/ledger-live/pull/6309) [`5848f9e`](https://github.com/LedgerHQ/ledger-live/commit/5848f9e247f169eb7a4aff322253937214b9efdd) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Removes never publicly exposed Evmos & Kava currencies. Also fixes multiple Etherscan based explorers URI (Lukso, RSK, Astar & Boba).

- [#6154](https://github.com/LedgerHQ/ledger-live/pull/6154) [`f0ab3d9`](https://github.com/LedgerHQ/ledger-live/commit/f0ab3d9df5a70368226b1b466fcaadaa21715827) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Add Sell NG support

- [#6496](https://github.com/LedgerHQ/ledger-live/pull/6496) [`e1df8bc`](https://github.com/LedgerHQ/ledger-live/commit/e1df8bca348287e94970de90c51e98fa277c5364) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Redirect to chatbot instead of faq

- [#6502](https://github.com/LedgerHQ/ledger-live/pull/6502) [`f9555f8`](https://github.com/LedgerHQ/ledger-live/commit/f9555f8dfc154c2eb517c098a192927bc9590851) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update Linea Testnet explorer URI

- [#6497](https://github.com/LedgerHQ/ledger-live/pull/6497) [`32c6cac`](https://github.com/LedgerHQ/ledger-live/commit/32c6cac6993cef7ff05e2d8410b0bc1baa2bc924) Thanks [@overcat](https://github.com/overcat)! - Bump stellar-sdk from 10.4.1 to 11.3.0.

- [#6328](https://github.com/LedgerHQ/ledger-live/pull/6328) [`9b54d0d`](https://github.com/LedgerHQ/ledger-live/commit/9b54d0d55bead3a4074b9245bd8c4cb23d96c77f) Thanks [@Justkant](https://github.com/Justkant)! - feat: native dapp support [LIVE-9527]

  Migration from [ETH dApp Browser Live App](https://github.com/LedgerHQ/eth-dapp-browser) and [iframe-provider](https://github.com/LedgerHQ/iframe-provider) to support inside LL directly injecting an EIP 6963 compatible provider in the WebView, using params from the manifest.

- [#6509](https://github.com/LedgerHQ/ledger-live/pull/6509) [`ba5c49b`](https://github.com/LedgerHQ/ledger-live/commit/ba5c49b82af70a2e459720b9cb124546c406b88b) Thanks [@KVNLS](https://github.com/KVNLS)! - Cleanup references to protectServicesDiscoverDesktop Feature Flag

### Patch Changes

- [#6353](https://github.com/LedgerHQ/ledger-live/pull/6353) [`7d5a724`](https://github.com/LedgerHQ/ledger-live/commit/7d5a724f40079a233b159b5231d69f318327e175) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove walletConnectEntryPoint feature flag from codebase

- [#6361](https://github.com/LedgerHQ/ledger-live/pull/6361) [`b3dfed5`](https://github.com/LedgerHQ/ledger-live/commit/b3dfed54bd8d54e62530cb2db92c3c108b43e0d7) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Removes the CEX Deposit feature flag on LLM.

- [#6310](https://github.com/LedgerHQ/ledger-live/pull/6310) [`7887ad9`](https://github.com/LedgerHQ/ledger-live/commit/7887ad9842e59f6fc567f118f06b3e12bdb9073b) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Remove feature flag llmNewFirmwareUpdateUx

- [#6584](https://github.com/LedgerHQ/ledger-live/pull/6584) [`c85a616`](https://github.com/LedgerHQ/ledger-live/commit/c85a6167c56f144d3f0b40adff3946bf9e741e5d) Thanks [@CremaFR](https://github.com/CremaFR)! - Stop sending incorrect gasLimit to live apps

- [#6519](https://github.com/LedgerHQ/ledger-live/pull/6519) [`8ef15bd`](https://github.com/LedgerHQ/ledger-live/commit/8ef15bd5e600d61f908fce664c5ecd9f2c626a5d) Thanks [@cng-ledger](https://github.com/cng-ledger)! - fix(LIVE-11781): exclude explorer url check for provider click

- [#6378](https://github.com/LedgerHQ/ledger-live/pull/6378) [`9ada63a`](https://github.com/LedgerHQ/ledger-live/commit/9ada63a05b2d2518af09a9c07937cf94b5b2ea67) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Edit device name flow adapted for Europa

- [#6410](https://github.com/LedgerHQ/ledger-live/pull/6410) [`d403658`](https://github.com/LedgerHQ/ledger-live/commit/d403658adc7a917f437d472433427ac688b1d73a) Thanks [@CremaFR](https://github.com/CremaFR)! - bugfix: filter duplicate ids before checking swap status

- [#6420](https://github.com/LedgerHQ/ledger-live/pull/6420) [`2b5c3bb`](https://github.com/LedgerHQ/ledger-live/commit/2b5c3bb7c31445f840b66f7e0f51e9e2b07b0c49) Thanks [@sarneijim](https://github.com/sarneijim)! - Use bk payload as source of true for swap

- [#6341](https://github.com/LedgerHQ/ledger-live/pull/6341) [`92e9d19`](https://github.com/LedgerHQ/ledger-live/commit/92e9d194313ffd1542b676c59ae2d34e861f698f) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix swap history

- [#6174](https://github.com/LedgerHQ/ledger-live/pull/6174) [`e786a27`](https://github.com/LedgerHQ/ledger-live/commit/e786a27e21541c0d38d5563d6de8f0835239fd71) Thanks [@RamyEB](https://github.com/RamyEB)! - Update the modal UI for token approval

- [#6343](https://github.com/LedgerHQ/ledger-live/pull/6343) [`e99af59`](https://github.com/LedgerHQ/ledger-live/commit/e99af59455d0ac13892c954cdcb00f5315efd6ca) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Update text Moonpay by MoonPay

- [#6406](https://github.com/LedgerHQ/ledger-live/pull/6406) [`6dcda08`](https://github.com/LedgerHQ/ledger-live/commit/6dcda08bb996fee99b535745c8e225383cfe0d61) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix version format bug.

- [#6257](https://github.com/LedgerHQ/ledger-live/pull/6257) [`fc4f83e`](https://github.com/LedgerHQ/ledger-live/commit/fc4f83e26d9f00b7c518f28157e8d9da55ce3685) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add new errors for wrong device

- [#6553](https://github.com/LedgerHQ/ledger-live/pull/6553) [`3e5d894`](https://github.com/LedgerHQ/ledger-live/commit/3e5d89457601ad4c30881af41acc6b498fa611bb) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix bot test due to liveConfig

- [#6474](https://github.com/LedgerHQ/ledger-live/pull/6474) [`13bea7c`](https://github.com/LedgerHQ/ledger-live/commit/13bea7ced4b8a7ad40fbc5205e3b58ed8a217982) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Remove referralProgramDiscoverCard feature flag

- [#6387](https://github.com/LedgerHQ/ledger-live/pull/6387) [`2341f96`](https://github.com/LedgerHQ/ledger-live/commit/2341f96b373f681182634c4a2d836b341c0e98a9) Thanks [@CremaFR](https://github.com/CremaFR)! - bugfix max button

- [#6369](https://github.com/LedgerHQ/ledger-live/pull/6369) [`4a72ebb`](https://github.com/LedgerHQ/ledger-live/commit/4a72ebbf38ada3b2aaf28adf65dbece9bce8dee5) Thanks [@LucasWerey](https://github.com/LucasWerey)! - feature_lld_analytics_opt_in_prompt define for lld

- [#6588](https://github.com/LedgerHQ/ledger-live/pull/6588) [`370b3b1`](https://github.com/LedgerHQ/ledger-live/commit/370b3b13c1c0d9e3f985ea3d546d5f9cad03ae31) Thanks [@Justkant](https://github.com/Justkant)! - feat(wallet-api): bump wallet-api to add vechain support

- [#6376](https://github.com/LedgerHQ/ledger-live/pull/6376) [`8008a65`](https://github.com/LedgerHQ/ledger-live/commit/8008a65b7d84cac93ace8a183ecebba0bb934864) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix live supported app list bug

- [#6307](https://github.com/LedgerHQ/ledger-live/pull/6307) [`fcb1450`](https://github.com/LedgerHQ/ledger-live/commit/fcb14501bc83c136de0718559abdf304048c3a6c) Thanks [@lawRathod](https://github.com/lawRathod)! - Fix sometimes missing ops for accounts on casper

- [#6301](https://github.com/LedgerHQ/ledger-live/pull/6301) [`5ca7923`](https://github.com/LedgerHQ/ledger-live/commit/5ca79234ccbe66ce22f998fe3ebd2cdec681499a) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Remove feature "Claim NFT" from Ledger Live (cancelled feature)

- [#6367](https://github.com/LedgerHQ/ledger-live/pull/6367) [`7db3315`](https://github.com/LedgerHQ/ledger-live/commit/7db331500bebffe58f3bbe8299c14db1353b434f) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Update dydx lcd

- [#6430](https://github.com/LedgerHQ/ledger-live/pull/6430) [`5031828`](https://github.com/LedgerHQ/ledger-live/commit/5031828903f5601259d53619aa9ba5487ffa7a68) Thanks [@lawRathod](https://github.com/lawRathod)! - Add support for send many ops to be available in history

- [#6261](https://github.com/LedgerHQ/ledger-live/pull/6261) [`d3f0681`](https://github.com/LedgerHQ/ledger-live/commit/d3f06813d6e001b9954455247d56ca6833a0d7de) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Bump wallet-api packages to support DeviceModelId.Europa

- [#6378](https://github.com/LedgerHQ/ledger-live/pull/6378) [`9ada63a`](https://github.com/LedgerHQ/ledger-live/commit/9ada63a05b2d2518af09a9c07937cf94b5b2ea67) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Custom lock screen flow adapted to Europa device

- [#6354](https://github.com/LedgerHQ/ledger-live/pull/6354) [`c7f072f`](https://github.com/LedgerHQ/ledger-live/commit/c7f072f833a950e230137499d4908b792f6b615f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove "walletNftGallery" feature flag from codebase

- [#6359](https://github.com/LedgerHQ/ledger-live/pull/6359) [`2331bae`](https://github.com/LedgerHQ/ledger-live/commit/2331bae7393f822aa64e5d0ab8f51622b6363b33) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Removes the CEX Deposit feature flag on LLD.

- [#6421](https://github.com/LedgerHQ/ledger-live/pull/6421) [`2fc1caa`](https://github.com/LedgerHQ/ledger-live/commit/2fc1caa63ced0b1ac641c10fdc55a8ab659115c9) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - remote config for minimum app version

- [#6319](https://github.com/LedgerHQ/ledger-live/pull/6319) [`b72c52b`](https://github.com/LedgerHQ/ledger-live/commit/b72c52b3e4ebbb7aaf2142afbf6a9b9172e7ee04) Thanks [@KVNLS](https://github.com/KVNLS)! - Remove ptxEarn Feature Flag and cleanup the code

- [#6558](https://github.com/LedgerHQ/ledger-live/pull/6558) [`dc5cd2c`](https://github.com/LedgerHQ/ledger-live/commit/dc5cd2c421adfb475efffb16954ed8c6c38b9a06) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix nanoapp minVersion check

- [#6394](https://github.com/LedgerHQ/ledger-live/pull/6394) [`fb9dc79`](https://github.com/LedgerHQ/ledger-live/commit/fb9dc7969357dcbb378cc8eab93f237db00a97c3) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Handle unresponsive event correctly in LLD

- [#6545](https://github.com/LedgerHQ/ledger-live/pull/6545) [`ee2d968`](https://github.com/LedgerHQ/ledger-live/commit/ee2d968a12f961e6d6e231bad9970f6b72aaa12b) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - fix complete exchange drawer before error

- [#6348](https://github.com/LedgerHQ/ledger-live/pull/6348) [`77c8fd5`](https://github.com/LedgerHQ/ledger-live/commit/77c8fd5c73916ba0aec8c6e7f8684ce95b88bc0d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add tx status inside the exported csv so the user can see failed/succeeded

- [#6459](https://github.com/LedgerHQ/ledger-live/pull/6459) [`52d5703`](https://github.com/LedgerHQ/ledger-live/commit/52d57039bb015af2616670db480364a2e5fc9966) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Remove depositNetworkBannerMobile feature flag

- [#6323](https://github.com/LedgerHQ/ledger-live/pull/6323) [`d97a792`](https://github.com/LedgerHQ/ledger-live/commit/d97a7921f8303955a6c0b6bc1eaa1f2bb8330859) Thanks [@lvndry](https://github.com/lvndry)! - Account migration script

- [#6370](https://github.com/LedgerHQ/ledger-live/pull/6370) [`3c15515`](https://github.com/LedgerHQ/ledger-live/commit/3c155155f2d45fb85f8900e7e77c1b5ab1c7ad67) Thanks [@lvndry](https://github.com/lvndry)! - Get evm node, explorer and gasTracker information from liveconfig

- [#6653](https://github.com/LedgerHQ/ledger-live/pull/6653) [`194cb09`](https://github.com/LedgerHQ/ledger-live/commit/194cb09b5ec1c07536ce8b47bba49abd9ca80b4b) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Fix getRedelegations cosmos coin-module

- Updated dependencies [[`1aa8ef4`](https://github.com/LedgerHQ/ledger-live/commit/1aa8ef404411c31f6ac4cf09fba453042db8b955), [`2b5c3bb`](https://github.com/LedgerHQ/ledger-live/commit/2b5c3bb7c31445f840b66f7e0f51e9e2b07b0c49), [`3c15515`](https://github.com/LedgerHQ/ledger-live/commit/3c155155f2d45fb85f8900e7e77c1b5ab1c7ad67), [`5e939e0`](https://github.com/LedgerHQ/ledger-live/commit/5e939e0540cabb8d9931794b79909fe0a353a179), [`92e9d19`](https://github.com/LedgerHQ/ledger-live/commit/92e9d194313ffd1542b676c59ae2d34e861f698f), [`762dea1`](https://github.com/LedgerHQ/ledger-live/commit/762dea1c52ef0537961d058f7ba81fa399663ac1), [`fc4f83e`](https://github.com/LedgerHQ/ledger-live/commit/fc4f83e26d9f00b7c518f28157e8d9da55ce3685), [`370b3b1`](https://github.com/LedgerHQ/ledger-live/commit/370b3b13c1c0d9e3f985ea3d546d5f9cad03ae31), [`dd1d17f`](https://github.com/LedgerHQ/ledger-live/commit/dd1d17fd3ce7ed42558204b2f93707fb9b1599de), [`671dfcf`](https://github.com/LedgerHQ/ledger-live/commit/671dfcfb5ea7bd002ece07b9ee451417de1d306d), [`d3f0681`](https://github.com/LedgerHQ/ledger-live/commit/d3f06813d6e001b9954455247d56ca6833a0d7de), [`26b3a5d`](https://github.com/LedgerHQ/ledger-live/commit/26b3a5d7d6e11efc226403707d683f3d0098a1c1), [`5848f9e`](https://github.com/LedgerHQ/ledger-live/commit/5848f9e247f169eb7a4aff322253937214b9efdd), [`08c9779`](https://github.com/LedgerHQ/ledger-live/commit/08c9779659628e4e22ac99a152049ac3fa2745fa), [`a8138f9`](https://github.com/LedgerHQ/ledger-live/commit/a8138f9ec0cff714d9745012eb91a09713ffbbd2), [`6a46420`](https://github.com/LedgerHQ/ledger-live/commit/6a46420b2157b30b7fecaedb7faa6f7b98cfce28), [`f0ab3d9`](https://github.com/LedgerHQ/ledger-live/commit/f0ab3d9df5a70368226b1b466fcaadaa21715827), [`ebb45be`](https://github.com/LedgerHQ/ledger-live/commit/ebb45be56c6b1fdb3c36a8c20a16b41600baa264), [`53da330`](https://github.com/LedgerHQ/ledger-live/commit/53da3301aaceeb16e6b1f96b1ea44428fbeb4483), [`3c15515`](https://github.com/LedgerHQ/ledger-live/commit/3c155155f2d45fb85f8900e7e77c1b5ab1c7ad67), [`abb1bbb`](https://github.com/LedgerHQ/ledger-live/commit/abb1bbb09c52a3d08577ba622c6cb0f44aab36c1), [`08c9779`](https://github.com/LedgerHQ/ledger-live/commit/08c9779659628e4e22ac99a152049ac3fa2745fa), [`381023d`](https://github.com/LedgerHQ/ledger-live/commit/381023de2617aa09829a8b5dad7b0ba2c846328e), [`83d0bc6`](https://github.com/LedgerHQ/ledger-live/commit/83d0bc67979159044a7785b5cb4cbda8ed78ebf4)]:
  - @ledgerhq/coin-framework@0.12.0
  - @ledgerhq/coin-bitcoin@0.4.0
  - @ledgerhq/hw-app-exchange@0.4.7
  - @ledgerhq/wallet-api-exchange-module@0.5.0
  - @ledgerhq/cryptoassets@12.1.0
  - @ledgerhq/coin-evm@1.1.0
  - @ledgerhq/live-env@2.0.1
  - @ledgerhq/errors@6.16.4
  - @ledgerhq/devices@8.3.0
  - @ledgerhq/hw-app-eth@6.36.0
  - @ledgerhq/coin-algorand@0.4.1
  - @ledgerhq/coin-near@0.3.12
  - @ledgerhq/coin-polkadot@0.6.1
  - @ledgerhq/device-core@0.1.1
  - @ledgerhq/live-countervalues@0.1.4
  - @ledgerhq/live-countervalues-react@0.1.4
  - @ledgerhq/live-nft@0.3.1
  - @ledgerhq/hw-app-vet@0.1.7
  - @ledgerhq/live-network@1.2.1
  - @ledgerhq/hw-app-algorand@6.28.6
  - @ledgerhq/hw-app-cosmos@6.29.6
  - @ledgerhq/hw-app-polkadot@6.28.6
  - @ledgerhq/hw-app-solana@7.1.6
  - @ledgerhq/hw-transport@6.30.6
  - @ledgerhq/hw-transport-node-speculos@6.28.6
  - @ledgerhq/hw-transport-node-speculos-http@6.28.6
  - @ledgerhq/hw-app-btc@10.2.4
  - @ledgerhq/hw-app-near@6.28.7
  - @ledgerhq/hw-app-str@6.28.6
  - @ledgerhq/hw-app-tezos@6.28.6
  - @ledgerhq/hw-app-trx@6.28.6
  - @ledgerhq/hw-app-xrp@6.28.6
  - @ledgerhq/hw-transport-mocker@6.28.6

## 34.1.0-next.2

### Patch Changes

- [#6653](https://github.com/LedgerHQ/ledger-live/pull/6653) [`194cb09`](https://github.com/LedgerHQ/ledger-live/commit/194cb09b5ec1c07536ce8b47bba49abd9ca80b4b) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Fix getRedelegations cosmos coin-module

## 34.1.0-next.1

### Minor Changes

- [#6614](https://github.com/LedgerHQ/ledger-live/pull/6614) [`762dea1`](https://github.com/LedgerHQ/ledger-live/commit/762dea1c52ef0537961d058f7ba81fa399663ac1) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for failed operations in Cosmos chains. Fix breaking change in the `GetTxsEvent` Cosmos SDK endpoint after v0.47. Fix incorrect transaction simulation in Cosmos chains. Add types to all Cosmos SDK endpoint for better analysis of SDK breaking changes and depreciations.

### Patch Changes

- Updated dependencies [[`762dea1`](https://github.com/LedgerHQ/ledger-live/commit/762dea1c52ef0537961d058f7ba81fa399663ac1)]:
  - @ledgerhq/live-env@2.0.1-next.0
  - @ledgerhq/coin-framework@0.12.0-next.1
  - @ledgerhq/coin-algorand@0.4.1-next.1
  - @ledgerhq/coin-bitcoin@0.4.0-next.1
  - @ledgerhq/coin-evm@1.1.0-next.1
  - @ledgerhq/coin-near@0.3.12-next.1
  - @ledgerhq/coin-polkadot@0.6.1-next.1
  - @ledgerhq/live-countervalues@0.1.4-next.1
  - @ledgerhq/live-network@1.2.1-next.1
  - @ledgerhq/live-nft@0.3.1-next.1
  - @ledgerhq/live-countervalues-react@0.1.4-next.1
  - @ledgerhq/hw-app-eth@6.36.0-next.1
  - @ledgerhq/device-core@0.1.1-next.1

## 34.1.0-next.0

### Minor Changes

- [#6495](https://github.com/LedgerHQ/ledger-live/pull/6495) [`5ae6d8f`](https://github.com/LedgerHQ/ledger-live/commit/5ae6d8fb9b868dc01724e84ede2708e7a717c3f2) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLD - Help buttons redirect to the chatbot instead of the faq

- [#6475](https://github.com/LedgerHQ/ledger-live/pull/6475) [`da7ba83`](https://github.com/LedgerHQ/ledger-live/commit/da7ba837b98c1118135b6949ac3efcd403a790ab) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Add debug options to set exchange provider's info

- [#6476](https://github.com/LedgerHQ/ledger-live/pull/6476) [`21f5c44`](https://github.com/LedgerHQ/ledger-live/commit/21f5c4438bb542a3891f692f4274ee4c28aa76cd) Thanks [@KVNLS](https://github.com/KVNLS)! - Remove llmWalletQuickActions feature flag

- [#6261](https://github.com/LedgerHQ/ledger-live/pull/6261) [`a780777`](https://github.com/LedgerHQ/ledger-live/commit/a780777c13e08c1c3cd66ef5f6deac0fe928a894) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add new feature flags: supportDeviceStax, supportDeviceEuropa
  Remove legacy feature flags: syncOnboarding, customImage

- [#6045](https://github.com/LedgerHQ/ledger-live/pull/6045) [`1aa8ef4`](https://github.com/LedgerHQ/ledger-live/commit/1aa8ef404411c31f6ac4cf09fba453042db8b955) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Extract bitcoin as a separate package

- [#6471](https://github.com/LedgerHQ/ledger-live/pull/6471) [`d2f8b26`](https://github.com/LedgerHQ/ledger-live/commit/d2f8b26c99551cba902c07e9c544f3c84d74686c) Thanks [@KVNLS](https://github.com/KVNLS)! - Remove llmNewArchMarket feature flag and cleanup the code

- [#6309](https://github.com/LedgerHQ/ledger-live/pull/6309) [`5848f9e`](https://github.com/LedgerHQ/ledger-live/commit/5848f9e247f169eb7a4aff322253937214b9efdd) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Removes never publicly exposed Evmos & Kava currencies. Also fixes multiple Etherscan based explorers URI (Lukso, RSK, Astar & Boba).

- [#6154](https://github.com/LedgerHQ/ledger-live/pull/6154) [`f0ab3d9`](https://github.com/LedgerHQ/ledger-live/commit/f0ab3d9df5a70368226b1b466fcaadaa21715827) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Add Sell NG support

- [#6496](https://github.com/LedgerHQ/ledger-live/pull/6496) [`e1df8bc`](https://github.com/LedgerHQ/ledger-live/commit/e1df8bca348287e94970de90c51e98fa277c5364) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM - Redirect to chatbot instead of faq

- [#6502](https://github.com/LedgerHQ/ledger-live/pull/6502) [`f9555f8`](https://github.com/LedgerHQ/ledger-live/commit/f9555f8dfc154c2eb517c098a192927bc9590851) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update Linea Testnet explorer URI

- [#6497](https://github.com/LedgerHQ/ledger-live/pull/6497) [`32c6cac`](https://github.com/LedgerHQ/ledger-live/commit/32c6cac6993cef7ff05e2d8410b0bc1baa2bc924) Thanks [@overcat](https://github.com/overcat)! - Bump stellar-sdk from 10.4.1 to 11.3.0.

- [#6328](https://github.com/LedgerHQ/ledger-live/pull/6328) [`9b54d0d`](https://github.com/LedgerHQ/ledger-live/commit/9b54d0d55bead3a4074b9245bd8c4cb23d96c77f) Thanks [@Justkant](https://github.com/Justkant)! - feat: native dapp support [LIVE-9527]

  Migration from [ETH dApp Browser Live App](https://github.com/LedgerHQ/eth-dapp-browser) and [iframe-provider](https://github.com/LedgerHQ/iframe-provider) to support inside LL directly injecting an EIP 6963 compatible provider in the WebView, using params from the manifest.

- [#6509](https://github.com/LedgerHQ/ledger-live/pull/6509) [`ba5c49b`](https://github.com/LedgerHQ/ledger-live/commit/ba5c49b82af70a2e459720b9cb124546c406b88b) Thanks [@KVNLS](https://github.com/KVNLS)! - Cleanup references to protectServicesDiscoverDesktop Feature Flag

### Patch Changes

- [#6353](https://github.com/LedgerHQ/ledger-live/pull/6353) [`7d5a724`](https://github.com/LedgerHQ/ledger-live/commit/7d5a724f40079a233b159b5231d69f318327e175) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove walletConnectEntryPoint feature flag from codebase

- [#6361](https://github.com/LedgerHQ/ledger-live/pull/6361) [`b3dfed5`](https://github.com/LedgerHQ/ledger-live/commit/b3dfed54bd8d54e62530cb2db92c3c108b43e0d7) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Removes the CEX Deposit feature flag on LLM.

- [#6310](https://github.com/LedgerHQ/ledger-live/pull/6310) [`7887ad9`](https://github.com/LedgerHQ/ledger-live/commit/7887ad9842e59f6fc567f118f06b3e12bdb9073b) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Remove feature flag llmNewFirmwareUpdateUx

- [#6584](https://github.com/LedgerHQ/ledger-live/pull/6584) [`c85a616`](https://github.com/LedgerHQ/ledger-live/commit/c85a6167c56f144d3f0b40adff3946bf9e741e5d) Thanks [@CremaFR](https://github.com/CremaFR)! - Stop sending incorrect gasLimit to live apps

- [#6519](https://github.com/LedgerHQ/ledger-live/pull/6519) [`8ef15bd`](https://github.com/LedgerHQ/ledger-live/commit/8ef15bd5e600d61f908fce664c5ecd9f2c626a5d) Thanks [@cng-ledger](https://github.com/cng-ledger)! - fix(LIVE-11781): exclude explorer url check for provider click

- [#6378](https://github.com/LedgerHQ/ledger-live/pull/6378) [`9ada63a`](https://github.com/LedgerHQ/ledger-live/commit/9ada63a05b2d2518af09a9c07937cf94b5b2ea67) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Edit device name flow adapted for Europa

- [#6410](https://github.com/LedgerHQ/ledger-live/pull/6410) [`d403658`](https://github.com/LedgerHQ/ledger-live/commit/d403658adc7a917f437d472433427ac688b1d73a) Thanks [@CremaFR](https://github.com/CremaFR)! - bugfix: filter duplicate ids before checking swap status

- [#6420](https://github.com/LedgerHQ/ledger-live/pull/6420) [`2b5c3bb`](https://github.com/LedgerHQ/ledger-live/commit/2b5c3bb7c31445f840b66f7e0f51e9e2b07b0c49) Thanks [@sarneijim](https://github.com/sarneijim)! - Use bk payload as source of true for swap

- [#6341](https://github.com/LedgerHQ/ledger-live/pull/6341) [`92e9d19`](https://github.com/LedgerHQ/ledger-live/commit/92e9d194313ffd1542b676c59ae2d34e861f698f) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix swap history

- [#6174](https://github.com/LedgerHQ/ledger-live/pull/6174) [`e786a27`](https://github.com/LedgerHQ/ledger-live/commit/e786a27e21541c0d38d5563d6de8f0835239fd71) Thanks [@RamyEB](https://github.com/RamyEB)! - Update the modal UI for token approval

- [#6343](https://github.com/LedgerHQ/ledger-live/pull/6343) [`e99af59`](https://github.com/LedgerHQ/ledger-live/commit/e99af59455d0ac13892c954cdcb00f5315efd6ca) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Update text Moonpay by MoonPay

- [#6406](https://github.com/LedgerHQ/ledger-live/pull/6406) [`6dcda08`](https://github.com/LedgerHQ/ledger-live/commit/6dcda08bb996fee99b535745c8e225383cfe0d61) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix version format bug.

- [#6257](https://github.com/LedgerHQ/ledger-live/pull/6257) [`fc4f83e`](https://github.com/LedgerHQ/ledger-live/commit/fc4f83e26d9f00b7c518f28157e8d9da55ce3685) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add new errors for wrong device

- [#6553](https://github.com/LedgerHQ/ledger-live/pull/6553) [`3e5d894`](https://github.com/LedgerHQ/ledger-live/commit/3e5d89457601ad4c30881af41acc6b498fa611bb) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix bot test due to liveConfig

- [#6474](https://github.com/LedgerHQ/ledger-live/pull/6474) [`13bea7c`](https://github.com/LedgerHQ/ledger-live/commit/13bea7ced4b8a7ad40fbc5205e3b58ed8a217982) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Remove referralProgramDiscoverCard feature flag

- [#6387](https://github.com/LedgerHQ/ledger-live/pull/6387) [`2341f96`](https://github.com/LedgerHQ/ledger-live/commit/2341f96b373f681182634c4a2d836b341c0e98a9) Thanks [@CremaFR](https://github.com/CremaFR)! - bugfix max button

- [#6369](https://github.com/LedgerHQ/ledger-live/pull/6369) [`4a72ebb`](https://github.com/LedgerHQ/ledger-live/commit/4a72ebbf38ada3b2aaf28adf65dbece9bce8dee5) Thanks [@LucasWerey](https://github.com/LucasWerey)! - feature_lld_analytics_opt_in_prompt define for lld

- [#6588](https://github.com/LedgerHQ/ledger-live/pull/6588) [`370b3b1`](https://github.com/LedgerHQ/ledger-live/commit/370b3b13c1c0d9e3f985ea3d546d5f9cad03ae31) Thanks [@Justkant](https://github.com/Justkant)! - feat(wallet-api): bump wallet-api to add vechain support

- [#6376](https://github.com/LedgerHQ/ledger-live/pull/6376) [`8008a65`](https://github.com/LedgerHQ/ledger-live/commit/8008a65b7d84cac93ace8a183ecebba0bb934864) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix live supported app list bug

- [#6307](https://github.com/LedgerHQ/ledger-live/pull/6307) [`fcb1450`](https://github.com/LedgerHQ/ledger-live/commit/fcb14501bc83c136de0718559abdf304048c3a6c) Thanks [@lawRathod](https://github.com/lawRathod)! - Fix sometimes missing ops for accounts on casper

- [#6301](https://github.com/LedgerHQ/ledger-live/pull/6301) [`5ca7923`](https://github.com/LedgerHQ/ledger-live/commit/5ca79234ccbe66ce22f998fe3ebd2cdec681499a) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Remove feature "Claim NFT" from Ledger Live (cancelled feature)

- [#6367](https://github.com/LedgerHQ/ledger-live/pull/6367) [`7db3315`](https://github.com/LedgerHQ/ledger-live/commit/7db331500bebffe58f3bbe8299c14db1353b434f) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Update dydx lcd

- [#6430](https://github.com/LedgerHQ/ledger-live/pull/6430) [`5031828`](https://github.com/LedgerHQ/ledger-live/commit/5031828903f5601259d53619aa9ba5487ffa7a68) Thanks [@lawRathod](https://github.com/lawRathod)! - Add support for send many ops to be available in history

- [#6261](https://github.com/LedgerHQ/ledger-live/pull/6261) [`d3f0681`](https://github.com/LedgerHQ/ledger-live/commit/d3f06813d6e001b9954455247d56ca6833a0d7de) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Bump wallet-api packages to support DeviceModelId.Europa

- [#6378](https://github.com/LedgerHQ/ledger-live/pull/6378) [`9ada63a`](https://github.com/LedgerHQ/ledger-live/commit/9ada63a05b2d2518af09a9c07937cf94b5b2ea67) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Custom lock screen flow adapted to Europa device

- [#6354](https://github.com/LedgerHQ/ledger-live/pull/6354) [`c7f072f`](https://github.com/LedgerHQ/ledger-live/commit/c7f072f833a950e230137499d4908b792f6b615f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove "walletNftGallery" feature flag from codebase

- [#6359](https://github.com/LedgerHQ/ledger-live/pull/6359) [`2331bae`](https://github.com/LedgerHQ/ledger-live/commit/2331bae7393f822aa64e5d0ab8f51622b6363b33) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Removes the CEX Deposit feature flag on LLD.

- [#6421](https://github.com/LedgerHQ/ledger-live/pull/6421) [`2fc1caa`](https://github.com/LedgerHQ/ledger-live/commit/2fc1caa63ced0b1ac641c10fdc55a8ab659115c9) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - remote config for minimum app version

- [#6319](https://github.com/LedgerHQ/ledger-live/pull/6319) [`b72c52b`](https://github.com/LedgerHQ/ledger-live/commit/b72c52b3e4ebbb7aaf2142afbf6a9b9172e7ee04) Thanks [@KVNLS](https://github.com/KVNLS)! - Remove ptxEarn Feature Flag and cleanup the code

- [#6558](https://github.com/LedgerHQ/ledger-live/pull/6558) [`dc5cd2c`](https://github.com/LedgerHQ/ledger-live/commit/dc5cd2c421adfb475efffb16954ed8c6c38b9a06) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix nanoapp minVersion check

- [#6394](https://github.com/LedgerHQ/ledger-live/pull/6394) [`fb9dc79`](https://github.com/LedgerHQ/ledger-live/commit/fb9dc7969357dcbb378cc8eab93f237db00a97c3) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Handle unresponsive event correctly in LLD

- [#6545](https://github.com/LedgerHQ/ledger-live/pull/6545) [`ee2d968`](https://github.com/LedgerHQ/ledger-live/commit/ee2d968a12f961e6d6e231bad9970f6b72aaa12b) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - fix complete exchange drawer before error

- [#6348](https://github.com/LedgerHQ/ledger-live/pull/6348) [`77c8fd5`](https://github.com/LedgerHQ/ledger-live/commit/77c8fd5c73916ba0aec8c6e7f8684ce95b88bc0d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add tx status inside the exported csv so the user can see failed/succeeded

- [#6459](https://github.com/LedgerHQ/ledger-live/pull/6459) [`52d5703`](https://github.com/LedgerHQ/ledger-live/commit/52d57039bb015af2616670db480364a2e5fc9966) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Remove depositNetworkBannerMobile feature flag

- [#6323](https://github.com/LedgerHQ/ledger-live/pull/6323) [`d97a792`](https://github.com/LedgerHQ/ledger-live/commit/d97a7921f8303955a6c0b6bc1eaa1f2bb8330859) Thanks [@lvndry](https://github.com/lvndry)! - Account migration script

- [#6370](https://github.com/LedgerHQ/ledger-live/pull/6370) [`3c15515`](https://github.com/LedgerHQ/ledger-live/commit/3c155155f2d45fb85f8900e7e77c1b5ab1c7ad67) Thanks [@lvndry](https://github.com/lvndry)! - Get evm node, explorer and gasTracker information from liveconfig

- Updated dependencies [[`1aa8ef4`](https://github.com/LedgerHQ/ledger-live/commit/1aa8ef404411c31f6ac4cf09fba453042db8b955), [`2b5c3bb`](https://github.com/LedgerHQ/ledger-live/commit/2b5c3bb7c31445f840b66f7e0f51e9e2b07b0c49), [`3c15515`](https://github.com/LedgerHQ/ledger-live/commit/3c155155f2d45fb85f8900e7e77c1b5ab1c7ad67), [`5e939e0`](https://github.com/LedgerHQ/ledger-live/commit/5e939e0540cabb8d9931794b79909fe0a353a179), [`92e9d19`](https://github.com/LedgerHQ/ledger-live/commit/92e9d194313ffd1542b676c59ae2d34e861f698f), [`fc4f83e`](https://github.com/LedgerHQ/ledger-live/commit/fc4f83e26d9f00b7c518f28157e8d9da55ce3685), [`370b3b1`](https://github.com/LedgerHQ/ledger-live/commit/370b3b13c1c0d9e3f985ea3d546d5f9cad03ae31), [`dd1d17f`](https://github.com/LedgerHQ/ledger-live/commit/dd1d17fd3ce7ed42558204b2f93707fb9b1599de), [`671dfcf`](https://github.com/LedgerHQ/ledger-live/commit/671dfcfb5ea7bd002ece07b9ee451417de1d306d), [`d3f0681`](https://github.com/LedgerHQ/ledger-live/commit/d3f06813d6e001b9954455247d56ca6833a0d7de), [`26b3a5d`](https://github.com/LedgerHQ/ledger-live/commit/26b3a5d7d6e11efc226403707d683f3d0098a1c1), [`5848f9e`](https://github.com/LedgerHQ/ledger-live/commit/5848f9e247f169eb7a4aff322253937214b9efdd), [`08c9779`](https://github.com/LedgerHQ/ledger-live/commit/08c9779659628e4e22ac99a152049ac3fa2745fa), [`a8138f9`](https://github.com/LedgerHQ/ledger-live/commit/a8138f9ec0cff714d9745012eb91a09713ffbbd2), [`6a46420`](https://github.com/LedgerHQ/ledger-live/commit/6a46420b2157b30b7fecaedb7faa6f7b98cfce28), [`f0ab3d9`](https://github.com/LedgerHQ/ledger-live/commit/f0ab3d9df5a70368226b1b466fcaadaa21715827), [`ebb45be`](https://github.com/LedgerHQ/ledger-live/commit/ebb45be56c6b1fdb3c36a8c20a16b41600baa264), [`53da330`](https://github.com/LedgerHQ/ledger-live/commit/53da3301aaceeb16e6b1f96b1ea44428fbeb4483), [`3c15515`](https://github.com/LedgerHQ/ledger-live/commit/3c155155f2d45fb85f8900e7e77c1b5ab1c7ad67), [`abb1bbb`](https://github.com/LedgerHQ/ledger-live/commit/abb1bbb09c52a3d08577ba622c6cb0f44aab36c1), [`08c9779`](https://github.com/LedgerHQ/ledger-live/commit/08c9779659628e4e22ac99a152049ac3fa2745fa), [`381023d`](https://github.com/LedgerHQ/ledger-live/commit/381023de2617aa09829a8b5dad7b0ba2c846328e), [`83d0bc6`](https://github.com/LedgerHQ/ledger-live/commit/83d0bc67979159044a7785b5cb4cbda8ed78ebf4)]:
  - @ledgerhq/coin-framework@0.12.0-next.0
  - @ledgerhq/coin-bitcoin@0.4.0-next.0
  - @ledgerhq/hw-app-exchange@0.4.7-next.0
  - @ledgerhq/wallet-api-exchange-module@0.5.0-next.0
  - @ledgerhq/cryptoassets@12.1.0-next.0
  - @ledgerhq/coin-evm@1.1.0-next.0
  - @ledgerhq/errors@6.16.4-next.0
  - @ledgerhq/devices@8.3.0-next.0
  - @ledgerhq/hw-app-eth@6.36.0-next.0
  - @ledgerhq/coin-algorand@0.4.1-next.0
  - @ledgerhq/coin-near@0.3.12-next.0
  - @ledgerhq/coin-polkadot@0.6.1-next.0
  - @ledgerhq/device-core@0.1.1-next.0
  - @ledgerhq/live-countervalues@0.1.4-next.0
  - @ledgerhq/live-countervalues-react@0.1.4-next.0
  - @ledgerhq/live-nft@0.3.1-next.0
  - @ledgerhq/hw-app-vet@0.1.7-next.0
  - @ledgerhq/hw-app-algorand@6.28.6-next.0
  - @ledgerhq/hw-app-cosmos@6.29.6-next.0
  - @ledgerhq/hw-app-polkadot@6.28.6-next.0
  - @ledgerhq/hw-app-solana@7.1.6-next.0
  - @ledgerhq/hw-transport@6.30.6-next.0
  - @ledgerhq/hw-transport-node-speculos@6.28.6-next.0
  - @ledgerhq/hw-transport-node-speculos-http@6.28.6-next.0
  - @ledgerhq/live-network@1.2.1-next.0
  - @ledgerhq/hw-app-btc@10.2.4-next.0
  - @ledgerhq/hw-app-near@6.28.7-next.0
  - @ledgerhq/hw-app-str@6.28.6-next.0
  - @ledgerhq/hw-app-tezos@6.28.6-next.0
  - @ledgerhq/hw-app-trx@6.28.6-next.0
  - @ledgerhq/hw-app-xrp@6.28.6-next.0
  - @ledgerhq/hw-transport-mocker@6.28.6-next.0

## 34.0.0

### Major Changes

- [#6113](https://github.com/LedgerHQ/ledger-live/pull/6113) [`9de641d`](https://github.com/LedgerHQ/ledger-live/commit/9de641d1cd3e3130a49acbfc0c478bfa862aef72) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - - Refactoring of `getVersion`

  - moved entrypoint to `@ledgerhq/live-common/device/use-cases/getVersionUseCase`
  - moved logic to live-common/device-core
  - pulled out parsing function in `parseGetDeviceVersionResponse.ts`, reused that same parsing function in legacy `deviceSDK/commands/getVersion.ts`
  - added unit tests for `parseGetDeviceVersionResponse`, removed duplicated tests of parsing logic from `deviceSDK`
  - moved out functions and tests for the version checks `isHardwareVersionSupported`, `isBootloaderVersionSupported`
  - Refactoring of `getDeviceName`
    - moved entrypoint to `@ledgerhq/live-common/device/use-cases/getDeviceNameUseCase`
    - moved logic to live-common/device-core
    - pulled out parsing function in `parseGetDeviceNameResponsed.ts`
    - added unit tests for `parseGetDeviceVersionResponse`, removed duplicated tests of parsing logic from `deviceSDK`

- [#6195](https://github.com/LedgerHQ/ledger-live/pull/6195) [`dfac39b`](https://github.com/LedgerHQ/ledger-live/commit/dfac39b2086f0475d1bc8065032bfe27cbf424f6) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Deprecating Arbitrum goerli & Base goerli

### Minor Changes

- [#6118](https://github.com/LedgerHQ/ledger-live/pull/6118) [`63099cc`](https://github.com/LedgerHQ/ledger-live/commit/63099cc6dc08dfde9957aeb246368252e5591ba1) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Return countdown and refresh rates from the useProviderRates hook

- [#6000](https://github.com/LedgerHQ/ledger-live/pull/6000) [`8d08c2b`](https://github.com/LedgerHQ/ledger-live/commit/8d08c2ba13a0d12ba11a66e90e936f2a54c50520) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Extract Near in its own package

- [#6172](https://github.com/LedgerHQ/ledger-live/pull/6172) [`7fb3eb2`](https://github.com/LedgerHQ/ledger-live/commit/7fb3eb266acdca143c94d2fce74329809ebfbb79) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Remove API injection in coin-module

- [#5977](https://github.com/LedgerHQ/ledger-live/pull/5977) [`30105a4`](https://github.com/LedgerHQ/ledger-live/commit/30105a44d4fe68ee9b195a9fb075652734ea3e0e) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Refactor getLatestFirmwareForDevice, useLatestFirmware and all related API calls

- [#6116](https://github.com/LedgerHQ/ledger-live/pull/6116) [`bb0e77a`](https://github.com/LedgerHQ/ledger-live/commit/bb0e77ab9acb8060bb3a666cf7f0a7b091f6609b) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Update cardano hw-app

- [#6195](https://github.com/LedgerHQ/ledger-live/pull/6195) [`dfac39b`](https://github.com/LedgerHQ/ledger-live/commit/dfac39b2086f0475d1bc8065032bfe27cbf424f6) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Base Sepolia & Arbitrum Sepolia

- [#6009](https://github.com/LedgerHQ/ledger-live/pull/6009) [`67da88e`](https://github.com/LedgerHQ/ledger-live/commit/67da88e89dfdddf570d1256586447501632b3d03) Thanks [@CremaFR](https://github.com/CremaFR)! - update start exchange to support swap based on provider

### Patch Changes

- [#6347](https://github.com/LedgerHQ/ledger-live/pull/6347) [`2a8d97b`](https://github.com/LedgerHQ/ledger-live/commit/2a8d97bcc2a509b27ffa661a83e84d843f072ded) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove swap edit button to not editable families and fix random crash llm

- [#6312](https://github.com/LedgerHQ/ledger-live/pull/6312) [`e500e34`](https://github.com/LedgerHQ/ledger-live/commit/e500e34d5d9ef63804e21f738a7a0b45b1f45710) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - update live config lib

- [#6200](https://github.com/LedgerHQ/ledger-live/pull/6200) [`212c41c`](https://github.com/LedgerHQ/ledger-live/commit/212c41c03f3fdbc492fcaf0827ec4f4cfe66eaeb) Thanks [@lawRathod](https://github.com/lawRathod)! - Fix for accounts sync error on ICP for accounts imported using AccountID alone

- [#6377](https://github.com/LedgerHQ/ledger-live/pull/6377) [`5b0f8f7`](https://github.com/LedgerHQ/ledger-live/commit/5b0f8f7f3855efbf7e17a75240fcb37a51b95e84) Thanks [@cng-ledger](https://github.com/cng-ledger)! - fix(LIVE-11608): longer quote refresh rate for LLM to prevent frequent flow restart

- [#5989](https://github.com/LedgerHQ/ledger-live/pull/5989) [`901c4df`](https://github.com/LedgerHQ/ledger-live/commit/901c4dfd012376a42f8ab9ab186aa2114a7af863) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Revert an earlier change that changed how the internal ledger transaction hash was encoded to a hedera style hash

- [#6312](https://github.com/LedgerHQ/ledger-live/pull/6312) [`e500e34`](https://github.com/LedgerHQ/ledger-live/commit/e500e34d5d9ef63804e21f738a7a0b45b1f45710) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update solana delegate operation values and extra data to fix graph history numbers

- [#6133](https://github.com/LedgerHQ/ledger-live/pull/6133) [`43ad538`](https://github.com/LedgerHQ/ledger-live/commit/43ad5380b5516233eecd5ee32e87373bdc33f32f) Thanks [@lawRathod](https://github.com/lawRathod)! - Possible fix for account sync errors on stacks when user imports account from accountId string

- [#6218](https://github.com/LedgerHQ/ledger-live/pull/6218) [`3b6b538`](https://github.com/LedgerHQ/ledger-live/commit/3b6b53800e29a47ff5792c17221fbfba31cd8500) Thanks [@Wozacosta](https://github.com/Wozacosta)! - use latest version of wallet api packages to handle parentAccountId being passed when requesting accounts

- [#5833](https://github.com/LedgerHQ/ledger-live/pull/5833) [`d39ca26`](https://github.com/LedgerHQ/ledger-live/commit/d39ca26cf5ffc6e058af22946a4adc6778a7e748) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - clarify error message for invalid address selected

- [#6238](https://github.com/LedgerHQ/ledger-live/pull/6238) [`6de15bc`](https://github.com/LedgerHQ/ledger-live/commit/6de15bc96e8b97a2a6815cf3fb1da874f7044b49) Thanks [@mle-gall](https://github.com/mle-gall)! - Adding new analytics opt in prompt for existing users

- [#6050](https://github.com/LedgerHQ/ledger-live/pull/6050) [`231b6fd`](https://github.com/LedgerHQ/ledger-live/commit/231b6fde688b8101671aaf60b5d4340de332305f) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - add doc for bitcoin family

- [#6107](https://github.com/LedgerHQ/ledger-live/pull/6107) [`f456d69`](https://github.com/LedgerHQ/ledger-live/commit/f456d69a2f64b6a217d3c1d9c6a531f31c2817a8) Thanks [@jdabbech-ledger](https://github.com/jdabbech-ledger)! - Improve withDevice hook to throw LockedDeviceError

- [#6312](https://github.com/LedgerHQ/ledger-live/pull/6312) [`e500e34`](https://github.com/LedgerHQ/ledger-live/commit/e500e34d5d9ef63804e21f738a7a0b45b1f45710) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Adding lang parameters to manifest-api call

- [#6388](https://github.com/LedgerHQ/ledger-live/pull/6388) [`b5e2c2c`](https://github.com/LedgerHQ/ledger-live/commit/b5e2c2ca7b51b687aaddd4c8cbc27a8988bfddbf) Thanks [@cng-ledger](https://github.com/cng-ledger)! - fix(LIVE-11382): disable quote refresh during confirmation for LLM

- [#6415](https://github.com/LedgerHQ/ledger-live/pull/6415) [`b37d2f8`](https://github.com/LedgerHQ/ledger-live/commit/b37d2f87a05921873f8fc9905a81450931047bc0) Thanks [@CremaFR](https://github.com/CremaFR)! - Remove errors only inteded for backend

- [#6212](https://github.com/LedgerHQ/ledger-live/pull/6212) [`e7bff4e`](https://github.com/LedgerHQ/ledger-live/commit/e7bff4e3e767c2d50c5f57938cd34378359776cd) Thanks [@lvndry](https://github.com/lvndry)! - bitcoin and evm default live config

- [#6312](https://github.com/LedgerHQ/ledger-live/pull/6312) [`e6db239`](https://github.com/LedgerHQ/ledger-live/commit/e6db239edd84e035f60fff239d574111af318e80) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Bump polkadot minAppVersion to latest

- [#6091](https://github.com/LedgerHQ/ledger-live/pull/6091) [`8fdc176`](https://github.com/LedgerHQ/ledger-live/commit/8fdc17621d6a5b238ae8517e490844af330a3f41) Thanks [@Philippoes](https://github.com/Philippoes)! - Transaction status check on unfreeze should not enter the energy balance check if the resource is bandwidth

- [#6088](https://github.com/LedgerHQ/ledger-live/pull/6088) [`a25d979`](https://github.com/LedgerHQ/ledger-live/commit/a25d9791d3158913b8415cc74cd18bb75d30fd7b) Thanks [@lvndry](https://github.com/lvndry)! - Tezos forge transaction before brodcast

- [#6024](https://github.com/LedgerHQ/ledger-live/pull/6024) [`7b65c60`](https://github.com/LedgerHQ/ledger-live/commit/7b65c60a57f51b8c008d2be3457c1c8121c9dc40) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add feature flag "myLedgerDisplayAppDeveloperName"
  My Ledger's apps catalog: if app's metadata field "authorName" is not empty and the feature flag is enabled, display that name next to the app's version and size.

- [#5925](https://github.com/LedgerHQ/ledger-live/pull/5925) [`42322e0`](https://github.com/LedgerHQ/ledger-live/commit/42322e03f830e1af842c1bc46d10df541aceaf7a) Thanks [@Wozacosta](https://github.com/Wozacosta)! - Handle empty tokens by allowing tokenCurrency field for sign and signAndBroadcast wallet handlers

- [#6157](https://github.com/LedgerHQ/ledger-live/pull/6157) [`85a47ad`](https://github.com/LedgerHQ/ledger-live/commit/85a47adc82598d0fb959c2ed67daa642d194c84b) Thanks [@Wozacosta](https://github.com/Wozacosta)! - pass parentAccount to wallet api when requesting account

- [#6022](https://github.com/LedgerHQ/ledger-live/pull/6022) [`4178cfb`](https://github.com/LedgerHQ/ledger-live/commit/4178cfba8107d16b04f585468344bc6b74de8da4) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Sanitize account data that may be missing when de/serializing Tron accounts

- [#6148](https://github.com/LedgerHQ/ledger-live/pull/6148) [`a0f74f7`](https://github.com/LedgerHQ/ledger-live/commit/a0f74f786fa91aeebfe018b3d1168f47e197bb1d) Thanks [@carlosala](https://github.com/carlosala)! - Replace `@zondax/izari-filecoin` deprecated library by `iso-filecoin`.

- [#6127](https://github.com/LedgerHQ/ledger-live/pull/6127) [`43e5a09`](https://github.com/LedgerHQ/ledger-live/commit/43e5a096b00a271a640bb877f7d061a76f83c74f) Thanks [@CremaFR](https://github.com/CremaFR)! - fixed XLM crash

- [#6120](https://github.com/LedgerHQ/ledger-live/pull/6120) [`eb79c71`](https://github.com/LedgerHQ/ledger-live/commit/eb79c7141543991f6e8fa99e5b592fc7a7f43022) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Support base64 encodng for swap_ng type swaps

- [#6144](https://github.com/LedgerHQ/ledger-live/pull/6144) [`d870e90`](https://github.com/LedgerHQ/ledger-live/commit/d870e904a0dde5f8abf05f930f5f545828eccbc9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update Feature flag to handle threshold spam filter directly from FF

- [#5985](https://github.com/LedgerHQ/ledger-live/pull/5985) [`32796a3`](https://github.com/LedgerHQ/ledger-live/commit/32796a39dafc884b44399339d7d87f48d861401b) Thanks [@lawRathod](https://github.com/lawRathod)! - Fix casper invalid recipient error for ed25519 pubkeys

- [#5817](https://github.com/LedgerHQ/ledger-live/pull/5817) [`72654a7`](https://github.com/LedgerHQ/ledger-live/commit/72654a79a54b0bcdc85f1d38983118cf67c5b77f) Thanks [@sponomarev](https://github.com/sponomarev)! - Fix bot formatter to display mutation details properly

- [#6182](https://github.com/LedgerHQ/ledger-live/pull/6182) [`0c1bc63`](https://github.com/LedgerHQ/ledger-live/commit/0c1bc636ab98ff8110965d56f406ba971b1260a5) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add error message to first throw

- [#6067](https://github.com/LedgerHQ/ledger-live/pull/6067) [`3092dc1`](https://github.com/LedgerHQ/ledger-live/commit/3092dc1be305e39304bee223dbbe19474a2ea869) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix cosmos integration test

- [#5803](https://github.com/LedgerHQ/ledger-live/pull/5803) [`bd4ee6c`](https://github.com/LedgerHQ/ledger-live/commit/bd4ee6c938c27102c2d0529c2aab07ac000f7424) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add bridge tests

- [#6162](https://github.com/LedgerHQ/ledger-live/pull/6162) [`a42fcb0`](https://github.com/LedgerHQ/ledger-live/commit/a42fcb05669f897d991374d301fcd3fd216b8d5f) Thanks [@CremaFR](https://github.com/CremaFR)! - small bugfix tezos reveal check

- [#6199](https://github.com/LedgerHQ/ledger-live/pull/6199) [`b57714f`](https://github.com/LedgerHQ/ledger-live/commit/b57714f3996beef1b383dcc6c03bae1174af6cbd) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - - Fixed bad conditional branching for `listAppsUseCase`: list apps v1 and v2 were switched

  - Added unit tests for that.
  - Fixed `forceProvider` parameter missing in `listAppsV2` call in `listAppsUseCase`. It was resulting in "not found entity" errors regardless of the selected "My Ledger" provider in Ledger Live.
    - Added a stricter typing (the parameter is now always required)
  - Fixed bad error remapping for `HttpManagerApiRepository.getCurrentFirmware` which should throw a `FirmwareNotRecognized` in case of a `404`.
    - Added a unit test for that.
  - Added full unit testing coverage of `HttpManagerApiRepository`.

- [#5986](https://github.com/LedgerHQ/ledger-live/pull/5986) [`11909ed`](https://github.com/LedgerHQ/ledger-live/commit/11909ed94d5fb4e9605d9f65f42a130ceb24ece2) Thanks [@RamyEB](https://github.com/RamyEB)! - Add translation on discover timestamps

- [#6206](https://github.com/LedgerHQ/ledger-live/pull/6206) [`ccd8e2f`](https://github.com/LedgerHQ/ledger-live/commit/ccd8e2f915be87cf401cfdb318bcaa1b671cb21e) Thanks [@pavanvora](https://github.com/pavanvora)! - Cardano stake button fix

- [#6335](https://github.com/LedgerHQ/ledger-live/pull/6335) [`5ab0657`](https://github.com/LedgerHQ/ledger-live/commit/5ab065726aa4064ac98ddabc8d54aec594b869a6) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Safer solana hydrate

- [#6346](https://github.com/LedgerHQ/ledger-live/pull/6346) [`15bc813`](https://github.com/LedgerHQ/ledger-live/commit/15bc813c2aead82b53a9700c8a90f9cca1f3c09c) Thanks [@cng-ledger](https://github.com/cng-ledger)! - fix(LIVE-11547): incorrect deeplink when user doesn't have enough balance in LLM

- [#6141](https://github.com/LedgerHQ/ledger-live/pull/6141) [`f333ac9`](https://github.com/LedgerHQ/ledger-live/commit/f333ac96171dce3a94bcd125a3dcf475e487455c) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - fix min max error with moonpay

- [#6384](https://github.com/LedgerHQ/ledger-live/pull/6384) [`beb8800`](https://github.com/LedgerHQ/ledger-live/commit/beb88001d4862d181dc870e23967c6f7b34157a2) Thanks [@cng-ledger](https://github.com/cng-ledger)! - fix(LIVE-11382): increase LLM quotes timeout to 60 seconds

- [#6114](https://github.com/LedgerHQ/ledger-live/pull/6114) [`50efe96`](https://github.com/LedgerHQ/ledger-live/commit/50efe9655eefc2c832b56e03c3fa23242e009bf6) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add missing dependencies to ETH clones & plugins (Astar EVM, Flare, Moonbeam, Moonriver, XDC Network)

- [#6055](https://github.com/LedgerHQ/ledger-live/pull/6055) [`9806dd6`](https://github.com/LedgerHQ/ledger-live/commit/9806dd604ab4feafbce0dde172c7de31596104a4) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Refactor list apps v2:

  - move entrypoint to `live-common/src/device/use-cases/listAppsUseCase.ts`
  - move more of the `manager/api.ts` logic to `ManagerApiRepository`
  - create `StubManagerApiRepository` for mocks
  - implement some unit tests for `listApps/v2.ts`

  Implement `getProviderIdUseCase` that takes `forceProvider: number` as a parameter

- [#6087](https://github.com/LedgerHQ/ledger-live/pull/6087) [`f9f751c`](https://github.com/LedgerHQ/ledger-live/commit/f9f751c2e16977dd62eeb4cbc8c529a1d7ea2fbd) Thanks [@Justkant](https://github.com/Justkant)! - support: fix RemoteLiveAppProvider not updating if env changes

- Updated dependencies [[`e500e34`](https://github.com/LedgerHQ/ledger-live/commit/e500e34d5d9ef63804e21f738a7a0b45b1f45710), [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370), [`97bafa2`](https://github.com/LedgerHQ/ledger-live/commit/97bafa2573436572fca63469b13214bfcd7eb85c), [`25fe5c4`](https://github.com/LedgerHQ/ledger-live/commit/25fe5c48d44d3d1b11e35b81bb4bf31d30fa1268), [`4715e4c`](https://github.com/LedgerHQ/ledger-live/commit/4715e4c411fa2396330ebcb810aeb6bfc9892e88), [`0dd1546`](https://github.com/LedgerHQ/ledger-live/commit/0dd15467070cbf7fcbb9d9055a4535f6a25b2ad0), [`f456d69`](https://github.com/LedgerHQ/ledger-live/commit/f456d69a2f64b6a217d3c1d9c6a531f31c2817a8), [`4715e4c`](https://github.com/LedgerHQ/ledger-live/commit/4715e4c411fa2396330ebcb810aeb6bfc9892e88), [`3b6b538`](https://github.com/LedgerHQ/ledger-live/commit/3b6b53800e29a47ff5792c17221fbfba31cd8500), [`d39ca26`](https://github.com/LedgerHQ/ledger-live/commit/d39ca26cf5ffc6e058af22946a4adc6778a7e748), [`9c83695`](https://github.com/LedgerHQ/ledger-live/commit/9c8369580b91d82021d4ec28ad7a49dc4ba42e4f), [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370), [`255476b`](https://github.com/LedgerHQ/ledger-live/commit/255476bd65b15971eb523807fe9795c84882f198), [`74ef384`](https://github.com/LedgerHQ/ledger-live/commit/74ef3840c17181fa779035f190f829e9537e1539), [`6d40673`](https://github.com/LedgerHQ/ledger-live/commit/6d4067382b55827b00806a1b71ac0b249563d90f), [`2fd465e`](https://github.com/LedgerHQ/ledger-live/commit/2fd465ee730b11594d231503cfb940b984fa2f5a), [`dfac39b`](https://github.com/LedgerHQ/ledger-live/commit/dfac39b2086f0475d1bc8065032bfe27cbf424f6), [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370), [`7fb3eb2`](https://github.com/LedgerHQ/ledger-live/commit/7fb3eb266acdca143c94d2fce74329809ebfbb79), [`81d3bfb`](https://github.com/LedgerHQ/ledger-live/commit/81d3bfb0a06668d6541e65afa32f35d13c4e2bfa), [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370), [`b34f5cd`](https://github.com/LedgerHQ/ledger-live/commit/b34f5cdda0b7bf34750d258cc8b1c91304516360), [`eb79c71`](https://github.com/LedgerHQ/ledger-live/commit/eb79c7141543991f6e8fa99e5b592fc7a7f43022), [`d870e90`](https://github.com/LedgerHQ/ledger-live/commit/d870e904a0dde5f8abf05f930f5f545828eccbc9), [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370), [`dfac39b`](https://github.com/LedgerHQ/ledger-live/commit/dfac39b2086f0475d1bc8065032bfe27cbf424f6), [`2e5185b`](https://github.com/LedgerHQ/ledger-live/commit/2e5185b3dba497c956272068128e49db72e8af2a), [`8096795`](https://github.com/LedgerHQ/ledger-live/commit/80967954758a5e1d2960ac593fc6314391737558), [`67da88e`](https://github.com/LedgerHQ/ledger-live/commit/67da88e89dfdddf570d1256586447501632b3d03), [`f95785f`](https://github.com/LedgerHQ/ledger-live/commit/f95785fc6d6be852ce8fcda34c6d498e45010e0f)]:
  - @ledgerhq/live-config@3.0.0
  - @ledgerhq/live-env@2.0.0
  - @ledgerhq/crypto-icons-ui@1.1.0
  - @ledgerhq/coin-evm@1.0.0
  - @ledgerhq/hw-app-near@6.28.6
  - @ledgerhq/coin-near@0.3.11
  - @ledgerhq/errors@6.16.3
  - @ledgerhq/cryptoassets@12.0.0
  - @ledgerhq/wallet-api-exchange-module@0.4.0
  - @ledgerhq/hw-app-exchange@0.4.6
  - @ledgerhq/coin-framework@0.11.3
  - @ledgerhq/hw-app-eth@6.35.7
  - @ledgerhq/hw-app-btc@10.2.3
  - @ledgerhq/coin-algorand@0.4.0
  - @ledgerhq/coin-polkadot@0.6.0
  - @ledgerhq/live-network@1.2.0
  - @ledgerhq/live-nft@0.3.0
  - @ledgerhq/live-countervalues@0.1.3
  - @ledgerhq/devices@8.2.2
  - @ledgerhq/hw-app-algorand@6.28.5
  - @ledgerhq/hw-app-cosmos@6.29.5
  - @ledgerhq/hw-app-polkadot@6.28.5
  - @ledgerhq/hw-app-solana@7.1.5
  - @ledgerhq/hw-app-vet@0.1.6
  - @ledgerhq/hw-transport@6.30.5
  - @ledgerhq/hw-transport-node-speculos@6.28.5
  - @ledgerhq/hw-transport-node-speculos-http@6.28.5
  - @ledgerhq/live-countervalues-react@0.1.3
  - @ledgerhq/hw-app-str@6.28.5
  - @ledgerhq/hw-app-tezos@6.28.5
  - @ledgerhq/hw-app-trx@6.28.5
  - @ledgerhq/hw-app-xrp@6.28.5
  - @ledgerhq/hw-transport-mocker@6.28.5

## 34.0.0-next.10

### Patch Changes

- [#6415](https://github.com/LedgerHQ/ledger-live/pull/6415) [`b37d2f8`](https://github.com/LedgerHQ/ledger-live/commit/b37d2f87a05921873f8fc9905a81450931047bc0) Thanks [@CremaFR](https://github.com/CremaFR)! - Remove errors only inteded for backend

## 34.0.0-next.9

### Patch Changes

- [#6388](https://github.com/LedgerHQ/ledger-live/pull/6388) [`b5e2c2c`](https://github.com/LedgerHQ/ledger-live/commit/b5e2c2ca7b51b687aaddd4c8cbc27a8988bfddbf) Thanks [@cng-ledger](https://github.com/cng-ledger)! - fix(LIVE-11382): disable quote refresh during confirmation for LLM

## 34.0.0-next.8

### Patch Changes

- [#6312](https://github.com/LedgerHQ/ledger-live/pull/6312) [`e500e34`](https://github.com/LedgerHQ/ledger-live/commit/e500e34d5d9ef63804e21f738a7a0b45b1f45710) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - update live config lib

- [#6312](https://github.com/LedgerHQ/ledger-live/pull/6312) [`e500e34`](https://github.com/LedgerHQ/ledger-live/commit/e500e34d5d9ef63804e21f738a7a0b45b1f45710) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update solana delegate operation values and extra data to fix graph history numbers

- [#6312](https://github.com/LedgerHQ/ledger-live/pull/6312) [`e500e34`](https://github.com/LedgerHQ/ledger-live/commit/e500e34d5d9ef63804e21f738a7a0b45b1f45710) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Adding lang parameters to manifest-api call

- Updated dependencies [[`e500e34`](https://github.com/LedgerHQ/ledger-live/commit/e500e34d5d9ef63804e21f738a7a0b45b1f45710)]:
  - @ledgerhq/live-config@3.0.0-next.1

## 34.0.0-next.7

### Patch Changes

- [#6346](https://github.com/LedgerHQ/ledger-live/pull/6346) [`15bc813`](https://github.com/LedgerHQ/ledger-live/commit/15bc813c2aead82b53a9700c8a90f9cca1f3c09c) Thanks [@cng-ledger](https://github.com/cng-ledger)! - fix(LIVE-11547): incorrect deeplink when user doesn't have enough balance in LLM

## 34.0.0-next.6

### Patch Changes

- [#6384](https://github.com/LedgerHQ/ledger-live/pull/6384) [`beb8800`](https://github.com/LedgerHQ/ledger-live/commit/beb88001d4862d181dc870e23967c6f7b34157a2) Thanks [@cng-ledger](https://github.com/cng-ledger)! - fix(LIVE-11382): increase LLM quotes timeout to 60 seconds

## 34.0.0-next.5

### Patch Changes

- [#6347](https://github.com/LedgerHQ/ledger-live/pull/6347) [`2a8d97b`](https://github.com/LedgerHQ/ledger-live/commit/2a8d97bcc2a509b27ffa661a83e84d843f072ded) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove swap edit button to not editable families and fix random crash llm

## 34.0.0-next.4

### Patch Changes

- [#6375](https://github.com/LedgerHQ/ledger-live/pull/6375) [`09128f3`](https://github.com/LedgerHQ/ledger-live/commit/09128f3fd41285199122115324964d83befe9237) Thanks [@CremaFR](https://github.com/CremaFR)! - Allow additional fees when using maxButton

- Updated dependencies [[`09128f3`](https://github.com/LedgerHQ/ledger-live/commit/09128f3fd41285199122115324964d83befe9237)]:
  - @ledgerhq/coin-evm@1.0.0-next.1

## 34.0.0-next.3

### Patch Changes

- [#6377](https://github.com/LedgerHQ/ledger-live/pull/6377) [`5b0f8f7`](https://github.com/LedgerHQ/ledger-live/commit/5b0f8f7f3855efbf7e17a75240fcb37a51b95e84) Thanks [@cng-ledger](https://github.com/cng-ledger)! - fix(LIVE-11608): longer quote refresh rate for LLM to prevent frequent flow restart

## 34.0.0-next.2

### Patch Changes

- [#6335](https://github.com/LedgerHQ/ledger-live/pull/6335) [`5ab0657`](https://github.com/LedgerHQ/ledger-live/commit/5ab065726aa4064ac98ddabc8d54aec594b869a6) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Safer solana hydrate

## 34.0.0-next.1

### Patch Changes

- [#6312](https://github.com/LedgerHQ/ledger-live/pull/6312) [`e6db239`](https://github.com/LedgerHQ/ledger-live/commit/e6db239edd84e035f60fff239d574111af318e80) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Bump polkadot minAppVersion to latest

## 34.0.0-next.0

### Major Changes

- [#6113](https://github.com/LedgerHQ/ledger-live/pull/6113) [`9de641d`](https://github.com/LedgerHQ/ledger-live/commit/9de641d1cd3e3130a49acbfc0c478bfa862aef72) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - - Refactoring of `getVersion`

  - moved entrypoint to `@ledgerhq/live-common/device/use-cases/getVersionUseCase`
  - moved logic to live-common/device-core
  - pulled out parsing function in `parseGetDeviceVersionResponse.ts`, reused that same parsing function in legacy `deviceSDK/commands/getVersion.ts`
  - added unit tests for `parseGetDeviceVersionResponse`, removed duplicated tests of parsing logic from `deviceSDK`
  - moved out functions and tests for the version checks `isHardwareVersionSupported`, `isBootloaderVersionSupported`
  - Refactoring of `getDeviceName`
    - moved entrypoint to `@ledgerhq/live-common/device/use-cases/getDeviceNameUseCase`
    - moved logic to live-common/device-core
    - pulled out parsing function in `parseGetDeviceNameResponsed.ts`
    - added unit tests for `parseGetDeviceVersionResponse`, removed duplicated tests of parsing logic from `deviceSDK`

- [#6195](https://github.com/LedgerHQ/ledger-live/pull/6195) [`dfac39b`](https://github.com/LedgerHQ/ledger-live/commit/dfac39b2086f0475d1bc8065032bfe27cbf424f6) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Deprecating Arbitrum goerli & Base goerli

### Minor Changes

- [#6118](https://github.com/LedgerHQ/ledger-live/pull/6118) [`63099cc`](https://github.com/LedgerHQ/ledger-live/commit/63099cc6dc08dfde9957aeb246368252e5591ba1) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Return countdown and refresh rates from the useProviderRates hook

- [#6000](https://github.com/LedgerHQ/ledger-live/pull/6000) [`8d08c2b`](https://github.com/LedgerHQ/ledger-live/commit/8d08c2ba13a0d12ba11a66e90e936f2a54c50520) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Extract Near in its own package

- [#6172](https://github.com/LedgerHQ/ledger-live/pull/6172) [`7fb3eb2`](https://github.com/LedgerHQ/ledger-live/commit/7fb3eb266acdca143c94d2fce74329809ebfbb79) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Remove API injection in coin-module

- [#5977](https://github.com/LedgerHQ/ledger-live/pull/5977) [`30105a4`](https://github.com/LedgerHQ/ledger-live/commit/30105a44d4fe68ee9b195a9fb075652734ea3e0e) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Refactor getLatestFirmwareForDevice, useLatestFirmware and all related API calls

- [#6116](https://github.com/LedgerHQ/ledger-live/pull/6116) [`bb0e77a`](https://github.com/LedgerHQ/ledger-live/commit/bb0e77ab9acb8060bb3a666cf7f0a7b091f6609b) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Update cardano hw-app

- [#6195](https://github.com/LedgerHQ/ledger-live/pull/6195) [`dfac39b`](https://github.com/LedgerHQ/ledger-live/commit/dfac39b2086f0475d1bc8065032bfe27cbf424f6) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Base Sepolia & Arbitrum Sepolia

- [#6189](https://github.com/LedgerHQ/ledger-live/pull/6189) [`fa4886c`](https://github.com/LedgerHQ/ledger-live/commit/fa4886ce7bf90e1f97fa08075fb2c7e6328c82ee) Thanks [@overcat](https://github.com/overcat)! - Bump stellar-sdk from 10.4.1 to 11.2.2.

- [#6009](https://github.com/LedgerHQ/ledger-live/pull/6009) [`67da88e`](https://github.com/LedgerHQ/ledger-live/commit/67da88e89dfdddf570d1256586447501632b3d03) Thanks [@CremaFR](https://github.com/CremaFR)! - update start exchange to support swap based on provider

### Patch Changes

- [#5731](https://github.com/LedgerHQ/ledger-live/pull/5731) [`18f170a`](https://github.com/LedgerHQ/ledger-live/commit/18f170afae57ce1a8f4553f865179b9b0d3a9180) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - update live config lib

- [#6200](https://github.com/LedgerHQ/ledger-live/pull/6200) [`212c41c`](https://github.com/LedgerHQ/ledger-live/commit/212c41c03f3fdbc492fcaf0827ec4f4cfe66eaeb) Thanks [@lawRathod](https://github.com/lawRathod)! - Fix for accounts sync error on ICP for accounts imported using AccountID alone

- [#5989](https://github.com/LedgerHQ/ledger-live/pull/5989) [`901c4df`](https://github.com/LedgerHQ/ledger-live/commit/901c4dfd012376a42f8ab9ab186aa2114a7af863) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Revert an earlier change that changed how the internal ledger transaction hash was encoded to a hedera style hash

- [#6252](https://github.com/LedgerHQ/ledger-live/pull/6252) [`c59ef09`](https://github.com/LedgerHQ/ledger-live/commit/c59ef091e6bb915ae7180be7767a9751451275af) Thanks [@mikhd](https://github.com/mikhd)! - Update solana delegate operation values and extra data to fix graph history numbers

- [#6133](https://github.com/LedgerHQ/ledger-live/pull/6133) [`43ad538`](https://github.com/LedgerHQ/ledger-live/commit/43ad5380b5516233eecd5ee32e87373bdc33f32f) Thanks [@lawRathod](https://github.com/lawRathod)! - Possible fix for account sync errors on stacks when user imports account from accountId string

- [#6218](https://github.com/LedgerHQ/ledger-live/pull/6218) [`3b6b538`](https://github.com/LedgerHQ/ledger-live/commit/3b6b53800e29a47ff5792c17221fbfba31cd8500) Thanks [@Wozacosta](https://github.com/Wozacosta)! - use latest version of wallet api packages to handle parentAccountId being passed when requesting accounts

- [#5833](https://github.com/LedgerHQ/ledger-live/pull/5833) [`d39ca26`](https://github.com/LedgerHQ/ledger-live/commit/d39ca26cf5ffc6e058af22946a4adc6778a7e748) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - clarify error message for invalid address selected

- [#6238](https://github.com/LedgerHQ/ledger-live/pull/6238) [`6de15bc`](https://github.com/LedgerHQ/ledger-live/commit/6de15bc96e8b97a2a6815cf3fb1da874f7044b49) Thanks [@mle-gall](https://github.com/mle-gall)! - Adding new analytics opt in prompt for existing users

- [#6050](https://github.com/LedgerHQ/ledger-live/pull/6050) [`231b6fd`](https://github.com/LedgerHQ/ledger-live/commit/231b6fde688b8101671aaf60b5d4340de332305f) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - add doc for bitcoin family

- [#6107](https://github.com/LedgerHQ/ledger-live/pull/6107) [`f456d69`](https://github.com/LedgerHQ/ledger-live/commit/f456d69a2f64b6a217d3c1d9c6a531f31c2817a8) Thanks [@jdabbech-ledger](https://github.com/jdabbech-ledger)! - Improve withDevice hook to throw LockedDeviceError

- [#6056](https://github.com/LedgerHQ/ledger-live/pull/6056) [`cbe1d81`](https://github.com/LedgerHQ/ledger-live/commit/cbe1d81e2d58d4eefc3c0a70362356af6c634464) Thanks [@RamyEB](https://github.com/RamyEB)! - Adding lang parameters to manifest-api call

- [#6212](https://github.com/LedgerHQ/ledger-live/pull/6212) [`e7bff4e`](https://github.com/LedgerHQ/ledger-live/commit/e7bff4e3e767c2d50c5f57938cd34378359776cd) Thanks [@lvndry](https://github.com/lvndry)! - bitcoin and evm default live config

- [#6091](https://github.com/LedgerHQ/ledger-live/pull/6091) [`8fdc176`](https://github.com/LedgerHQ/ledger-live/commit/8fdc17621d6a5b238ae8517e490844af330a3f41) Thanks [@Philippoes](https://github.com/Philippoes)! - Transaction status check on unfreeze should not enter the energy balance check if the resource is bandwidth

- [#6088](https://github.com/LedgerHQ/ledger-live/pull/6088) [`a25d979`](https://github.com/LedgerHQ/ledger-live/commit/a25d9791d3158913b8415cc74cd18bb75d30fd7b) Thanks [@lvndry](https://github.com/lvndry)! - Tezos forge transaction before brodcast

- [#6024](https://github.com/LedgerHQ/ledger-live/pull/6024) [`7b65c60`](https://github.com/LedgerHQ/ledger-live/commit/7b65c60a57f51b8c008d2be3457c1c8121c9dc40) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add feature flag "myLedgerDisplayAppDeveloperName"
  My Ledger's apps catalog: if app's metadata field "authorName" is not empty and the feature flag is enabled, display that name next to the app's version and size.

- [#5925](https://github.com/LedgerHQ/ledger-live/pull/5925) [`42322e0`](https://github.com/LedgerHQ/ledger-live/commit/42322e03f830e1af842c1bc46d10df541aceaf7a) Thanks [@Wozacosta](https://github.com/Wozacosta)! - Handle empty tokens by allowing tokenCurrency field for sign and signAndBroadcast wallet handlers

- [#6157](https://github.com/LedgerHQ/ledger-live/pull/6157) [`85a47ad`](https://github.com/LedgerHQ/ledger-live/commit/85a47adc82598d0fb959c2ed67daa642d194c84b) Thanks [@Wozacosta](https://github.com/Wozacosta)! - pass parentAccount to wallet api when requesting account

- [#6022](https://github.com/LedgerHQ/ledger-live/pull/6022) [`4178cfb`](https://github.com/LedgerHQ/ledger-live/commit/4178cfba8107d16b04f585468344bc6b74de8da4) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Sanitize account data that may be missing when de/serializing Tron accounts

- [#6148](https://github.com/LedgerHQ/ledger-live/pull/6148) [`a0f74f7`](https://github.com/LedgerHQ/ledger-live/commit/a0f74f786fa91aeebfe018b3d1168f47e197bb1d) Thanks [@carlosala](https://github.com/carlosala)! - Replace `@zondax/izari-filecoin` deprecated library by `iso-filecoin`.

- [#6127](https://github.com/LedgerHQ/ledger-live/pull/6127) [`43e5a09`](https://github.com/LedgerHQ/ledger-live/commit/43e5a096b00a271a640bb877f7d061a76f83c74f) Thanks [@CremaFR](https://github.com/CremaFR)! - fixed XLM crash

- [#6120](https://github.com/LedgerHQ/ledger-live/pull/6120) [`eb79c71`](https://github.com/LedgerHQ/ledger-live/commit/eb79c7141543991f6e8fa99e5b592fc7a7f43022) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Support base64 encodng for swap_ng type swaps

- [#6144](https://github.com/LedgerHQ/ledger-live/pull/6144) [`d870e90`](https://github.com/LedgerHQ/ledger-live/commit/d870e904a0dde5f8abf05f930f5f545828eccbc9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update Feature flag to handle threshold spam filter directly from FF

- [#5985](https://github.com/LedgerHQ/ledger-live/pull/5985) [`32796a3`](https://github.com/LedgerHQ/ledger-live/commit/32796a39dafc884b44399339d7d87f48d861401b) Thanks [@lawRathod](https://github.com/lawRathod)! - Fix casper invalid recipient error for ed25519 pubkeys

- [#5817](https://github.com/LedgerHQ/ledger-live/pull/5817) [`72654a7`](https://github.com/LedgerHQ/ledger-live/commit/72654a79a54b0bcdc85f1d38983118cf67c5b77f) Thanks [@sponomarev](https://github.com/sponomarev)! - Fix bot formatter to display mutation details properly

- [#6182](https://github.com/LedgerHQ/ledger-live/pull/6182) [`0c1bc63`](https://github.com/LedgerHQ/ledger-live/commit/0c1bc636ab98ff8110965d56f406ba971b1260a5) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add error message to first throw

- [#6067](https://github.com/LedgerHQ/ledger-live/pull/6067) [`3092dc1`](https://github.com/LedgerHQ/ledger-live/commit/3092dc1be305e39304bee223dbbe19474a2ea869) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix cosmos integration test

- [#5803](https://github.com/LedgerHQ/ledger-live/pull/5803) [`bd4ee6c`](https://github.com/LedgerHQ/ledger-live/commit/bd4ee6c938c27102c2d0529c2aab07ac000f7424) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add bridge tests

- [#6162](https://github.com/LedgerHQ/ledger-live/pull/6162) [`a42fcb0`](https://github.com/LedgerHQ/ledger-live/commit/a42fcb05669f897d991374d301fcd3fd216b8d5f) Thanks [@CremaFR](https://github.com/CremaFR)! - small bugfix tezos reveal check

- [#6199](https://github.com/LedgerHQ/ledger-live/pull/6199) [`b57714f`](https://github.com/LedgerHQ/ledger-live/commit/b57714f3996beef1b383dcc6c03bae1174af6cbd) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - - Fixed bad conditional branching for `listAppsUseCase`: list apps v1 and v2 were switched

  - Added unit tests for that.
  - Fixed `forceProvider` parameter missing in `listAppsV2` call in `listAppsUseCase`. It was resulting in "not found entity" errors regardless of the selected "My Ledger" provider in Ledger Live.
    - Added a stricter typing (the parameter is now always required)
  - Fixed bad error remapping for `HttpManagerApiRepository.getCurrentFirmware` which should throw a `FirmwareNotRecognized` in case of a `404`.
    - Added a unit test for that.
  - Added full unit testing coverage of `HttpManagerApiRepository`.

- [#5986](https://github.com/LedgerHQ/ledger-live/pull/5986) [`11909ed`](https://github.com/LedgerHQ/ledger-live/commit/11909ed94d5fb4e9605d9f65f42a130ceb24ece2) Thanks [@RamyEB](https://github.com/RamyEB)! - Add translation on discover timestamps

- [#6206](https://github.com/LedgerHQ/ledger-live/pull/6206) [`ccd8e2f`](https://github.com/LedgerHQ/ledger-live/commit/ccd8e2f915be87cf401cfdb318bcaa1b671cb21e) Thanks [@pavanvora](https://github.com/pavanvora)! - Cardano stake button fix

- [#6141](https://github.com/LedgerHQ/ledger-live/pull/6141) [`f333ac9`](https://github.com/LedgerHQ/ledger-live/commit/f333ac96171dce3a94bcd125a3dcf475e487455c) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - fix min max error with moonpay

- [#6114](https://github.com/LedgerHQ/ledger-live/pull/6114) [`50efe96`](https://github.com/LedgerHQ/ledger-live/commit/50efe9655eefc2c832b56e03c3fa23242e009bf6) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add missing dependencies to ETH clones & plugins (Astar EVM, Flare, Moonbeam, Moonriver, XDC Network)

- [#6055](https://github.com/LedgerHQ/ledger-live/pull/6055) [`9806dd6`](https://github.com/LedgerHQ/ledger-live/commit/9806dd604ab4feafbce0dde172c7de31596104a4) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Refactor list apps v2:

  - move entrypoint to `live-common/src/device/use-cases/listAppsUseCase.ts`
  - move more of the `manager/api.ts` logic to `ManagerApiRepository`
  - create `StubManagerApiRepository` for mocks
  - implement some unit tests for `listApps/v2.ts`

  Implement `getProviderIdUseCase` that takes `forceProvider: number` as a parameter

- [#6087](https://github.com/LedgerHQ/ledger-live/pull/6087) [`f9f751c`](https://github.com/LedgerHQ/ledger-live/commit/f9f751c2e16977dd62eeb4cbc8c529a1d7ea2fbd) Thanks [@Justkant](https://github.com/Justkant)! - support: fix RemoteLiveAppProvider not updating if env changes

- Updated dependencies [[`18f170a`](https://github.com/LedgerHQ/ledger-live/commit/18f170afae57ce1a8f4553f865179b9b0d3a9180), [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370), [`97bafa2`](https://github.com/LedgerHQ/ledger-live/commit/97bafa2573436572fca63469b13214bfcd7eb85c), [`25fe5c4`](https://github.com/LedgerHQ/ledger-live/commit/25fe5c48d44d3d1b11e35b81bb4bf31d30fa1268), [`4715e4c`](https://github.com/LedgerHQ/ledger-live/commit/4715e4c411fa2396330ebcb810aeb6bfc9892e88), [`0dd1546`](https://github.com/LedgerHQ/ledger-live/commit/0dd15467070cbf7fcbb9d9055a4535f6a25b2ad0), [`f456d69`](https://github.com/LedgerHQ/ledger-live/commit/f456d69a2f64b6a217d3c1d9c6a531f31c2817a8), [`4715e4c`](https://github.com/LedgerHQ/ledger-live/commit/4715e4c411fa2396330ebcb810aeb6bfc9892e88), [`3b6b538`](https://github.com/LedgerHQ/ledger-live/commit/3b6b53800e29a47ff5792c17221fbfba31cd8500), [`d39ca26`](https://github.com/LedgerHQ/ledger-live/commit/d39ca26cf5ffc6e058af22946a4adc6778a7e748), [`9c83695`](https://github.com/LedgerHQ/ledger-live/commit/9c8369580b91d82021d4ec28ad7a49dc4ba42e4f), [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370), [`255476b`](https://github.com/LedgerHQ/ledger-live/commit/255476bd65b15971eb523807fe9795c84882f198), [`74ef384`](https://github.com/LedgerHQ/ledger-live/commit/74ef3840c17181fa779035f190f829e9537e1539), [`6d40673`](https://github.com/LedgerHQ/ledger-live/commit/6d4067382b55827b00806a1b71ac0b249563d90f), [`2fd465e`](https://github.com/LedgerHQ/ledger-live/commit/2fd465ee730b11594d231503cfb940b984fa2f5a), [`dfac39b`](https://github.com/LedgerHQ/ledger-live/commit/dfac39b2086f0475d1bc8065032bfe27cbf424f6), [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370), [`7fb3eb2`](https://github.com/LedgerHQ/ledger-live/commit/7fb3eb266acdca143c94d2fce74329809ebfbb79), [`81d3bfb`](https://github.com/LedgerHQ/ledger-live/commit/81d3bfb0a06668d6541e65afa32f35d13c4e2bfa), [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370), [`b34f5cd`](https://github.com/LedgerHQ/ledger-live/commit/b34f5cdda0b7bf34750d258cc8b1c91304516360), [`eb79c71`](https://github.com/LedgerHQ/ledger-live/commit/eb79c7141543991f6e8fa99e5b592fc7a7f43022), [`d870e90`](https://github.com/LedgerHQ/ledger-live/commit/d870e904a0dde5f8abf05f930f5f545828eccbc9), [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370), [`dfac39b`](https://github.com/LedgerHQ/ledger-live/commit/dfac39b2086f0475d1bc8065032bfe27cbf424f6), [`2e5185b`](https://github.com/LedgerHQ/ledger-live/commit/2e5185b3dba497c956272068128e49db72e8af2a), [`8096795`](https://github.com/LedgerHQ/ledger-live/commit/80967954758a5e1d2960ac593fc6314391737558), [`67da88e`](https://github.com/LedgerHQ/ledger-live/commit/67da88e89dfdddf570d1256586447501632b3d03), [`f95785f`](https://github.com/LedgerHQ/ledger-live/commit/f95785fc6d6be852ce8fcda34c6d498e45010e0f)]:
  - @ledgerhq/live-config@3.0.0-next.0
  - @ledgerhq/live-env@2.0.0-next.0
  - @ledgerhq/crypto-icons-ui@1.1.0-next.0
  - @ledgerhq/coin-evm@1.0.0-next.0
  - @ledgerhq/hw-app-near@6.28.6-next.0
  - @ledgerhq/coin-near@0.3.11-next.0
  - @ledgerhq/errors@6.16.3-next.0
  - @ledgerhq/cryptoassets@12.0.0-next.0
  - @ledgerhq/wallet-api-exchange-module@0.4.0-next.0
  - @ledgerhq/hw-app-exchange@0.4.6-next.0
  - @ledgerhq/coin-framework@0.11.3-next.0
  - @ledgerhq/hw-app-eth@6.35.7-next.0
  - @ledgerhq/hw-app-btc@10.2.3-next.0
  - @ledgerhq/coin-algorand@0.4.0-next.0
  - @ledgerhq/coin-polkadot@0.6.0-next.0
  - @ledgerhq/live-network@1.2.0-next.0
  - @ledgerhq/live-nft@0.3.0-next.0
  - @ledgerhq/live-countervalues@0.1.3-next.0
  - @ledgerhq/devices@8.2.2-next.0
  - @ledgerhq/hw-app-algorand@6.28.5-next.0
  - @ledgerhq/hw-app-cosmos@6.29.5-next.0
  - @ledgerhq/hw-app-polkadot@6.28.5-next.0
  - @ledgerhq/hw-app-solana@7.1.5-next.0
  - @ledgerhq/hw-app-vet@0.1.6-next.0
  - @ledgerhq/hw-transport@6.30.5-next.0
  - @ledgerhq/hw-transport-node-speculos@6.28.5-next.0
  - @ledgerhq/hw-transport-node-speculos-http@6.28.5-next.0
  - @ledgerhq/live-countervalues-react@0.1.3-next.0
  - @ledgerhq/hw-app-str@6.28.5-next.0
  - @ledgerhq/hw-app-tezos@6.28.5-next.0
  - @ledgerhq/hw-app-trx@6.28.5-next.0
  - @ledgerhq/hw-app-xrp@6.28.5-next.0
  - @ledgerhq/hw-transport-mocker@6.28.5-next.0

## 33.6.1

### Patch Changes

- [#6284](https://github.com/LedgerHQ/ledger-live/pull/6284) [`884cfd6`](https://github.com/LedgerHQ/ledger-live/commit/884cfd64a1440d393fb983dfe361be9c78f3b81c) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Updated CAL support

- Updated dependencies [[`884cfd6`](https://github.com/LedgerHQ/ledger-live/commit/884cfd64a1440d393fb983dfe361be9c78f3b81c), [`3e28615`](https://github.com/LedgerHQ/ledger-live/commit/3e28615a8d5edbec3eff1e93207bf0e9d017666a)]:
  - @ledgerhq/cryptoassets@11.4.1
  - @ledgerhq/hw-app-near@6.28.5
  - @ledgerhq/coin-near@0.3.10
  - @ledgerhq/live-env@1.0.1
  - @ledgerhq/coin-algorand@0.3.11
  - @ledgerhq/coin-evm@0.12.3
  - @ledgerhq/coin-framework@0.11.2
  - @ledgerhq/coin-polkadot@0.5.4
  - @ledgerhq/hw-app-eth@6.35.6
  - @ledgerhq/hw-app-vet@0.1.5
  - @ledgerhq/live-countervalues@0.1.2
  - @ledgerhq/live-countervalues-react@0.1.2
  - @ledgerhq/live-nft@0.2.1
  - @ledgerhq/live-network@1.1.13

## 33.6.1-hotfix.1

### Patch Changes

- [#6284](https://github.com/LedgerHQ/ledger-live/pull/6284) [`884cfd6`](https://github.com/LedgerHQ/ledger-live/commit/884cfd64a1440d393fb983dfe361be9c78f3b81c) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Updated CAL support

- Updated dependencies [[`884cfd6`](https://github.com/LedgerHQ/ledger-live/commit/884cfd64a1440d393fb983dfe361be9c78f3b81c)]:
  - @ledgerhq/cryptoassets@11.4.1-hotfix.0
  - @ledgerhq/coin-algorand@0.3.11-hotfix.1
  - @ledgerhq/coin-evm@0.12.3-hotfix.1
  - @ledgerhq/coin-framework@0.11.2-hotfix.1
  - @ledgerhq/coin-polkadot@0.5.4-hotfix.1
  - @ledgerhq/hw-app-eth@6.35.6-hotfix.1
  - @ledgerhq/hw-app-vet@0.1.5-hotfix.0
  - @ledgerhq/live-countervalues@0.1.2-hotfix.1
  - @ledgerhq/live-countervalues-react@0.1.2-hotfix.1
  - @ledgerhq/live-nft@0.2.1-hotfix.1
  - @ledgerhq/coin-near@0.3.10-hotfix.1

## 33.6.1-hotfix.0

### Patch Changes

- Updated dependencies [[`3e28615`](https://github.com/LedgerHQ/ledger-live/commit/3e28615a8d5edbec3eff1e93207bf0e9d017666a)]:
  - @ledgerhq/hw-app-near@6.28.5-hotfix.0
  - @ledgerhq/coin-near@0.3.10-hotfix.0
  - @ledgerhq/live-env@1.0.1-hotfix.0
  - @ledgerhq/coin-algorand@0.3.11-hotfix.0
  - @ledgerhq/coin-evm@0.12.3-hotfix.0
  - @ledgerhq/coin-framework@0.11.2-hotfix.0
  - @ledgerhq/coin-polkadot@0.5.4-hotfix.0
  - @ledgerhq/live-countervalues@0.1.2-hotfix.0
  - @ledgerhq/live-network@1.1.13-hotfix.0
  - @ledgerhq/live-nft@0.2.1-hotfix.0
  - @ledgerhq/live-countervalues-react@0.1.2-hotfix.0
  - @ledgerhq/hw-app-eth@6.35.6-hotfix.0

## 33.6.0

### Minor Changes

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`b1ec078`](https://github.com/LedgerHQ/ledger-live/commit/b1ec0785795d47801337d82917a0e6d0cee04842) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Extract Near in its own package

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`8e08122`](https://github.com/LedgerHQ/ledger-live/commit/8e08122f22c40c42a5e1ab9728b5efb248b79745) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Refactor getLatestFirmwareForDevice, useLatestFirmware and all related API calls

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`23d9911`](https://github.com/LedgerHQ/ledger-live/commit/23d991193313f49d25d5011c0f9fb1310fd97e69) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - update start exchange to support swap based on provider

### Patch Changes

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`65ce8a1`](https://github.com/LedgerHQ/ledger-live/commit/65ce8a16d8c10e2ffc68cd01ecd86b247506fa91) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - update live config lib

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`feca980`](https://github.com/LedgerHQ/ledger-live/commit/feca980dc4b92f0a1a2590d01a88824fcec91076) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Revert an earlier change that changed how the internal ledger transaction hash was encoded to a hedera style hash

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`78de209`](https://github.com/LedgerHQ/ledger-live/commit/78de209ccfea14826c854b32838a5d6d5016c123) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - clarify error message for invalid address selected

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`0688fad`](https://github.com/LedgerHQ/ledger-live/commit/0688fadee951a214fdfaef262cbdc6d5409cdb52) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - add doc for bitcoin family

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`ee88785`](https://github.com/LedgerHQ/ledger-live/commit/ee8878515671241ce1037362af5e8f7799b3673a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Improve withDevice hook to throw LockedDeviceError

- [#5943](https://github.com/LedgerHQ/ledger-live/pull/5943) [`5e70c4a`](https://github.com/LedgerHQ/ledger-live/commit/5e70c4a88edcad5aacc73a3d3f5a8936369db831) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Open app device action: fix reducer for "deviceChange" and "error" events types, causing issues when the app changes on the device

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`200d98f`](https://github.com/LedgerHQ/ledger-live/commit/200d98fcf07c1d0b998cc32d6cce5f0f1749909b) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Add feature flag "myLedgerDisplayAppDeveloperName"
  My Ledger's apps catalog: if app's metadata field "authorName" is not empty and the feature flag is enabled, display that name next to the app's version and size.

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`a1b8bb6`](https://github.com/LedgerHQ/ledger-live/commit/a1b8bb637c7be43abf36a3571923400e05d964cf) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Handle empty tokens by allowing tokenCurrency field for sign and signAndBroadcast wallet handlers

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`2c4a7c8`](https://github.com/LedgerHQ/ledger-live/commit/2c4a7c8e5d0bf29d51f50863e7c57a5ba5724474) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - fixed XLM crash

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`875677b`](https://github.com/LedgerHQ/ledger-live/commit/875677b2615d4f5d14f42acb5cfa9f80cb5875f2) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Support base64 encodng for swap_ng type swaps

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`c217a6c`](https://github.com/LedgerHQ/ledger-live/commit/c217a6cfa59218278d25d2d987a06dfb33977cd9) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update Feature flag to handle threshold spam filter directly from FF

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`59d0d8a`](https://github.com/LedgerHQ/ledger-live/commit/59d0d8aa10b5cc87d20259d170f9e6e7e1bc0649) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fix casper invalid recipient error for ed25519 pubkeys

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`212f451`](https://github.com/LedgerHQ/ledger-live/commit/212f451beede0d41fd76b86377f5ca329b2d90f4) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - fix cosmos integration test

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`b444092`](https://github.com/LedgerHQ/ledger-live/commit/b444092040af249ae45e5ee18d75be420f9f26f8) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Add bridge tests

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`9e12c9f`](https://github.com/LedgerHQ/ledger-live/commit/9e12c9f54d8254e405042aebc1433e88faecaa6e) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - - Fixed bad conditional branching for `listAppsUseCase`: list apps v1 and v2 were switched

  - Added unit tests for that.
  - Fixed `forceProvider` parameter missing in `listAppsV2` call in `listAppsUseCase`. It was resulting in "not found entity" errors regardless of the selected "My Ledger" provider in Ledger Live.
    - Added a stricter typing (the parameter is now always required)
  - Fixed bad error remapping for `HttpManagerApiRepository.getCurrentFirmware` which should throw a `FirmwareNotRecognized` in case of a `404`.
    - Added a unit test for that.
  - Added full unit testing coverage of `HttpManagerApiRepository`.

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`e79fde6`](https://github.com/LedgerHQ/ledger-live/commit/e79fde68bb88196b9167477f9a0acb52d1be877e) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Add translation on discover timestamps

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`b8f0132`](https://github.com/LedgerHQ/ledger-live/commit/b8f013257ffb5c919586343fe01ad4c25f7ab7b9) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - fix min max error with moonpay

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`d51402b`](https://github.com/LedgerHQ/ledger-live/commit/d51402bc95469c9e6ebe1c52409d3ffef20ad448) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Add missing dependencies to ETH clones & plugins (Astar EVM, Flare, Moonbeam, Moonriver, XDC Network)

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`2652911`](https://github.com/LedgerHQ/ledger-live/commit/26529110c8c13664bf63dd41fbb3bd58d8c6bb82) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Refactor list apps v2:

  - move entrypoint to `live-common/src/device/use-cases/listAppsUseCase.ts`
  - move more of the `manager/api.ts` logic to `ManagerApiRepository`
  - create `StubManagerApiRepository` for mocks
  - implement some unit tests for `listApps/v2.ts`

  Implement `getProviderIdUseCase` that takes `forceProvider: number` as a parameter

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`8c4f317`](https://github.com/LedgerHQ/ledger-live/commit/8c4f31700fbfc13ac78ebb1eae4f4fc80dcc88a3) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - support: fix RemoteLiveAppProvider not updating if env changes

- Updated dependencies [[`65ce8a1`](https://github.com/LedgerHQ/ledger-live/commit/65ce8a16d8c10e2ffc68cd01ecd86b247506fa91), [`c18a0cf`](https://github.com/LedgerHQ/ledger-live/commit/c18a0cfdce5d1e44faf8d8bd5659ebdae38533fa), [`26f343b`](https://github.com/LedgerHQ/ledger-live/commit/26f343b3c08d06ce6e812947d4c63a6e5bae8a9e), [`ee88785`](https://github.com/LedgerHQ/ledger-live/commit/ee8878515671241ce1037362af5e8f7799b3673a), [`78de209`](https://github.com/LedgerHQ/ledger-live/commit/78de209ccfea14826c854b32838a5d6d5016c123), [`8d99b81`](https://github.com/LedgerHQ/ledger-live/commit/8d99b81feaf5e8d46e0c26f34bc70b709a7e3c14), [`c18a0cf`](https://github.com/LedgerHQ/ledger-live/commit/c18a0cfdce5d1e44faf8d8bd5659ebdae38533fa), [`628fa73`](https://github.com/LedgerHQ/ledger-live/commit/628fa732866a6018287ca7bc3d463acb3f5cd6b9), [`71b7001`](https://github.com/LedgerHQ/ledger-live/commit/71b70016650b5239b35ad2fb75d415ac092358d1), [`43eea9e`](https://github.com/LedgerHQ/ledger-live/commit/43eea9e8076f2c9d5aeb0f8a3b0738e97b3152c8), [`c18a0cf`](https://github.com/LedgerHQ/ledger-live/commit/c18a0cfdce5d1e44faf8d8bd5659ebdae38533fa), [`7012417`](https://github.com/LedgerHQ/ledger-live/commit/70124177c55d364e227f902cba97fe0e11397824), [`c18a0cf`](https://github.com/LedgerHQ/ledger-live/commit/c18a0cfdce5d1e44faf8d8bd5659ebdae38533fa), [`1cb83b5`](https://github.com/LedgerHQ/ledger-live/commit/1cb83b5baa4603e22f391609438e349ca0ce9b0e), [`875677b`](https://github.com/LedgerHQ/ledger-live/commit/875677b2615d4f5d14f42acb5cfa9f80cb5875f2), [`c217a6c`](https://github.com/LedgerHQ/ledger-live/commit/c217a6cfa59218278d25d2d987a06dfb33977cd9), [`c18a0cf`](https://github.com/LedgerHQ/ledger-live/commit/c18a0cfdce5d1e44faf8d8bd5659ebdae38533fa), [`f882dde`](https://github.com/LedgerHQ/ledger-live/commit/f882dde22ec194c5cd3dd9413b8c103108eba820), [`23d9911`](https://github.com/LedgerHQ/ledger-live/commit/23d991193313f49d25d5011c0f9fb1310fd97e69), [`66504d5`](https://github.com/LedgerHQ/ledger-live/commit/66504d5874891f4432c5e31efdf7c59a9e5b2cc9)]:
  - @ledgerhq/live-config@2.0.0
  - @ledgerhq/live-env@1.0.0
  - @ledgerhq/crypto-icons-ui@1.0.2
  - @ledgerhq/errors@6.16.2
  - @ledgerhq/hw-app-exchange@0.4.5
  - @ledgerhq/coin-framework@0.11.1
  - @ledgerhq/coin-evm@0.12.2
  - @ledgerhq/hw-app-eth@6.35.5
  - @ledgerhq/hw-app-btc@10.2.2
  - @ledgerhq/live-nft@0.2.0
  - @ledgerhq/wallet-api-exchange-module@0.3.0
  - @ledgerhq/coin-algorand@0.3.10
  - @ledgerhq/coin-near@0.3.9
  - @ledgerhq/coin-polkadot@0.5.3
  - @ledgerhq/live-countervalues@0.1.1
  - @ledgerhq/live-network@1.1.12
  - @ledgerhq/devices@8.2.1
  - @ledgerhq/hw-app-algorand@6.28.4
  - @ledgerhq/hw-app-cosmos@6.29.4
  - @ledgerhq/hw-app-polkadot@6.28.4
  - @ledgerhq/hw-app-solana@7.1.4
  - @ledgerhq/hw-app-vet@0.1.4
  - @ledgerhq/hw-transport@6.30.4
  - @ledgerhq/hw-transport-node-speculos@6.28.4
  - @ledgerhq/hw-transport-node-speculos-http@6.28.4
  - @ledgerhq/live-countervalues-react@0.1.1
  - @ledgerhq/hw-app-near@6.28.4
  - @ledgerhq/hw-app-str@6.28.4
  - @ledgerhq/hw-app-tezos@6.28.4
  - @ledgerhq/hw-app-trx@6.28.4
  - @ledgerhq/hw-app-xrp@6.28.4
  - @ledgerhq/hw-transport-mocker@6.28.4

## 33.6.0-next.1

### Patch Changes

- [#6184](https://github.com/LedgerHQ/ledger-live/pull/6184) [`d47f70f`](https://github.com/LedgerHQ/ledger-live/commit/d47f70f69aa180a92444ebf90487acbe8474403b) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - - Fixed bad conditional branching for `listAppsUseCase`: list apps v1 and v2 were switched
  - Added unit tests for that.
  - Fixed `forceProvider` parameter missing in `listAppsV2` call in `listAppsUseCase`. It was resulting in "not found entity" errors regardless of the selected "My Ledger" provider in Ledger Live.
    - Added a stricter typing (the parameter is now always required)
  - Fixed bad error remapping for `HttpManagerApiRepository.getCurrentFirmware` which should throw a `FirmwareNotRecognized` in case of a `404`.
    - Added a unit test for that.
  - Added full unit testing coverage of `HttpManagerApiRepository`.

## 33.6.0-next.0

### Minor Changes

- [#6118](https://github.com/LedgerHQ/ledger-live/pull/6118) [`63099cc`](https://github.com/LedgerHQ/ledger-live/commit/63099cc6dc08dfde9957aeb246368252e5591ba1) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Return countdown and refresh rates from the useProviderRates hook

- [#6000](https://github.com/LedgerHQ/ledger-live/pull/6000) [`8d08c2b`](https://github.com/LedgerHQ/ledger-live/commit/8d08c2ba13a0d12ba11a66e90e936f2a54c50520) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Extract Near in its own package

- [#5977](https://github.com/LedgerHQ/ledger-live/pull/5977) [`30105a4`](https://github.com/LedgerHQ/ledger-live/commit/30105a44d4fe68ee9b195a9fb075652734ea3e0e) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Refactor getLatestFirmwareForDevice, useLatestFirmware and all related API calls

- [#6009](https://github.com/LedgerHQ/ledger-live/pull/6009) [`67da88e`](https://github.com/LedgerHQ/ledger-live/commit/67da88e89dfdddf570d1256586447501632b3d03) Thanks [@CremaFR](https://github.com/CremaFR)! - update start exchange to support swap based on provider

### Patch Changes

- [#5731](https://github.com/LedgerHQ/ledger-live/pull/5731) [`18f170a`](https://github.com/LedgerHQ/ledger-live/commit/18f170afae57ce1a8f4553f865179b9b0d3a9180) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - update live config lib

- [#5989](https://github.com/LedgerHQ/ledger-live/pull/5989) [`901c4df`](https://github.com/LedgerHQ/ledger-live/commit/901c4dfd012376a42f8ab9ab186aa2114a7af863) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Revert an earlier change that changed how the internal ledger transaction hash was encoded to a hedera style hash

- [#5833](https://github.com/LedgerHQ/ledger-live/pull/5833) [`d39ca26`](https://github.com/LedgerHQ/ledger-live/commit/d39ca26cf5ffc6e058af22946a4adc6778a7e748) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - clarify error message for invalid address selected

- [#6050](https://github.com/LedgerHQ/ledger-live/pull/6050) [`231b6fd`](https://github.com/LedgerHQ/ledger-live/commit/231b6fde688b8101671aaf60b5d4340de332305f) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - add doc for bitcoin family

- [#6107](https://github.com/LedgerHQ/ledger-live/pull/6107) [`f456d69`](https://github.com/LedgerHQ/ledger-live/commit/f456d69a2f64b6a217d3c1d9c6a531f31c2817a8) Thanks [@jdabbech-ledger](https://github.com/jdabbech-ledger)! - Improve withDevice hook to throw LockedDeviceError

- [#5943](https://github.com/LedgerHQ/ledger-live/pull/5943) [`5e70c4a`](https://github.com/LedgerHQ/ledger-live/commit/5e70c4a88edcad5aacc73a3d3f5a8936369db831) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Open app device action: fix reducer for "deviceChange" and "error" events types, causing issues when the app changes on the device

- [#6024](https://github.com/LedgerHQ/ledger-live/pull/6024) [`7b65c60`](https://github.com/LedgerHQ/ledger-live/commit/7b65c60a57f51b8c008d2be3457c1c8121c9dc40) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Add feature flag "myLedgerDisplayAppDeveloperName"
  My Ledger's apps catalog: if app's metadata field "authorName" is not empty and the feature flag is enabled, display that name next to the app's version and size.

- [#5925](https://github.com/LedgerHQ/ledger-live/pull/5925) [`42322e0`](https://github.com/LedgerHQ/ledger-live/commit/42322e03f830e1af842c1bc46d10df541aceaf7a) Thanks [@Wozacosta](https://github.com/Wozacosta)! - Handle empty tokens by allowing tokenCurrency field for sign and signAndBroadcast wallet handlers

- [#6022](https://github.com/LedgerHQ/ledger-live/pull/6022) [`4178cfb`](https://github.com/LedgerHQ/ledger-live/commit/4178cfba8107d16b04f585468344bc6b74de8da4) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Sanitize account data that may be missing when de/serializing Tron accounts

- [#6127](https://github.com/LedgerHQ/ledger-live/pull/6127) [`43e5a09`](https://github.com/LedgerHQ/ledger-live/commit/43e5a096b00a271a640bb877f7d061a76f83c74f) Thanks [@CremaFR](https://github.com/CremaFR)! - fixed XLM crash

- [#6120](https://github.com/LedgerHQ/ledger-live/pull/6120) [`eb79c71`](https://github.com/LedgerHQ/ledger-live/commit/eb79c7141543991f6e8fa99e5b592fc7a7f43022) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Support base64 encodng for swap_ng type swaps

- [#6144](https://github.com/LedgerHQ/ledger-live/pull/6144) [`d870e90`](https://github.com/LedgerHQ/ledger-live/commit/d870e904a0dde5f8abf05f930f5f545828eccbc9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update Feature flag to handle threshold spam filter directly from FF

- [#5985](https://github.com/LedgerHQ/ledger-live/pull/5985) [`32796a3`](https://github.com/LedgerHQ/ledger-live/commit/32796a39dafc884b44399339d7d87f48d861401b) Thanks [@lawRathod](https://github.com/lawRathod)! - Fix casper invalid recipient error for ed25519 pubkeys

- [#6067](https://github.com/LedgerHQ/ledger-live/pull/6067) [`3092dc1`](https://github.com/LedgerHQ/ledger-live/commit/3092dc1be305e39304bee223dbbe19474a2ea869) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix cosmos integration test

- [#5803](https://github.com/LedgerHQ/ledger-live/pull/5803) [`bd4ee6c`](https://github.com/LedgerHQ/ledger-live/commit/bd4ee6c938c27102c2d0529c2aab07ac000f7424) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add bridge tests

- [#5986](https://github.com/LedgerHQ/ledger-live/pull/5986) [`11909ed`](https://github.com/LedgerHQ/ledger-live/commit/11909ed94d5fb4e9605d9f65f42a130ceb24ece2) Thanks [@RamyEB](https://github.com/RamyEB)! - Add translation on discover timestamps

- [#6141](https://github.com/LedgerHQ/ledger-live/pull/6141) [`f333ac9`](https://github.com/LedgerHQ/ledger-live/commit/f333ac96171dce3a94bcd125a3dcf475e487455c) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - fix min max error with moonpay

- [#6114](https://github.com/LedgerHQ/ledger-live/pull/6114) [`50efe96`](https://github.com/LedgerHQ/ledger-live/commit/50efe9655eefc2c832b56e03c3fa23242e009bf6) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add missing dependencies to ETH clones & plugins (Astar EVM, Flare, Moonbeam, Moonriver, XDC Network)

- [#6055](https://github.com/LedgerHQ/ledger-live/pull/6055) [`9806dd6`](https://github.com/LedgerHQ/ledger-live/commit/9806dd604ab4feafbce0dde172c7de31596104a4) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Refactor list apps v2:

  - move entrypoint to `live-common/src/device/use-cases/listAppsUseCase.ts`
  - move more of the `manager/api.ts` logic to `ManagerApiRepository`
  - create `StubManagerApiRepository` for mocks
  - implement some unit tests for `listApps/v2.ts`

  Implement `getProviderIdUseCase` that takes `forceProvider: number` as a parameter

- [#6087](https://github.com/LedgerHQ/ledger-live/pull/6087) [`f9f751c`](https://github.com/LedgerHQ/ledger-live/commit/f9f751c2e16977dd62eeb4cbc8c529a1d7ea2fbd) Thanks [@Justkant](https://github.com/Justkant)! - support: fix RemoteLiveAppProvider not updating if env changes

- Updated dependencies [[`18f170a`](https://github.com/LedgerHQ/ledger-live/commit/18f170afae57ce1a8f4553f865179b9b0d3a9180), [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370), [`97bafa2`](https://github.com/LedgerHQ/ledger-live/commit/97bafa2573436572fca63469b13214bfcd7eb85c), [`f456d69`](https://github.com/LedgerHQ/ledger-live/commit/f456d69a2f64b6a217d3c1d9c6a531f31c2817a8), [`d39ca26`](https://github.com/LedgerHQ/ledger-live/commit/d39ca26cf5ffc6e058af22946a4adc6778a7e748), [`9c83695`](https://github.com/LedgerHQ/ledger-live/commit/9c8369580b91d82021d4ec28ad7a49dc4ba42e4f), [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370), [`74ef384`](https://github.com/LedgerHQ/ledger-live/commit/74ef3840c17181fa779035f190f829e9537e1539), [`6d40673`](https://github.com/LedgerHQ/ledger-live/commit/6d4067382b55827b00806a1b71ac0b249563d90f), [`2fd465e`](https://github.com/LedgerHQ/ledger-live/commit/2fd465ee730b11594d231503cfb940b984fa2f5a), [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370), [`81d3bfb`](https://github.com/LedgerHQ/ledger-live/commit/81d3bfb0a06668d6541e65afa32f35d13c4e2bfa), [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370), [`b34f5cd`](https://github.com/LedgerHQ/ledger-live/commit/b34f5cdda0b7bf34750d258cc8b1c91304516360), [`eb79c71`](https://github.com/LedgerHQ/ledger-live/commit/eb79c7141543991f6e8fa99e5b592fc7a7f43022), [`d870e90`](https://github.com/LedgerHQ/ledger-live/commit/d870e904a0dde5f8abf05f930f5f545828eccbc9), [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370), [`8096795`](https://github.com/LedgerHQ/ledger-live/commit/80967954758a5e1d2960ac593fc6314391737558), [`67da88e`](https://github.com/LedgerHQ/ledger-live/commit/67da88e89dfdddf570d1256586447501632b3d03), [`f95785f`](https://github.com/LedgerHQ/ledger-live/commit/f95785fc6d6be852ce8fcda34c6d498e45010e0f)]:
  - @ledgerhq/live-config@2.0.0-next.0
  - @ledgerhq/live-env@1.0.0-next.0
  - @ledgerhq/crypto-icons-ui@1.0.2-next.0
  - @ledgerhq/errors@6.16.2-next.0
  - @ledgerhq/hw-app-exchange@0.4.5-next.0
  - @ledgerhq/coin-framework@0.11.1-next.0
  - @ledgerhq/coin-evm@0.12.2-next.0
  - @ledgerhq/hw-app-eth@6.35.5-next.0
  - @ledgerhq/hw-app-btc@10.2.2-next.0
  - @ledgerhq/live-nft@0.2.0-next.0
  - @ledgerhq/wallet-api-exchange-module@0.3.0-next.0
  - @ledgerhq/coin-algorand@0.3.10-next.0
  - @ledgerhq/coin-near@0.3.9-next.0
  - @ledgerhq/coin-polkadot@0.5.3-next.0
  - @ledgerhq/live-countervalues@0.1.1-next.0
  - @ledgerhq/live-network@1.1.12-next.0
  - @ledgerhq/devices@8.2.1-next.0
  - @ledgerhq/hw-app-algorand@6.28.4-next.0
  - @ledgerhq/hw-app-cosmos@6.29.4-next.0
  - @ledgerhq/hw-app-polkadot@6.28.4-next.0
  - @ledgerhq/hw-app-solana@7.1.4-next.0
  - @ledgerhq/hw-app-vet@0.1.4-next.0
  - @ledgerhq/hw-transport@6.30.4-next.0
  - @ledgerhq/hw-transport-node-speculos@6.28.4-next.0
  - @ledgerhq/hw-transport-node-speculos-http@6.28.4-next.0
  - @ledgerhq/live-countervalues-react@0.1.1-next.0
  - @ledgerhq/hw-app-near@6.28.4-next.0
  - @ledgerhq/hw-app-str@6.28.4-next.0
  - @ledgerhq/hw-app-tezos@6.28.4-next.0
  - @ledgerhq/hw-app-trx@6.28.4-next.0
  - @ledgerhq/hw-app-xrp@6.28.4-next.0
  - @ledgerhq/hw-transport-mocker@6.28.4-next.0

## 33.5.1

### Patch Changes

- [#5889](https://github.com/LedgerHQ/ledger-live/pull/5889) [`0a03cf1`](https://github.com/LedgerHQ/ledger-live/commit/0a03cf10343e7b79295c1467c8964cc943f16840) Thanks [@RamyEB](https://github.com/RamyEB)! - Make the searchable Dapp only visible through the search bar for both LLD and LLM

- [#5749](https://github.com/LedgerHQ/ledger-live/pull/5749) [`eadebff`](https://github.com/LedgerHQ/ledger-live/commit/eadebff3fe58aef6a5befb033d5147afc49663d3) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix: HID USB reconnection on LLD during the sync onboarding

  - Refactoring of the disconnect after inactivity of the transport implementation
    hw-transport-node-hid-singleton
  - Better logs and documentation

- [#5919](https://github.com/LedgerHQ/ledger-live/pull/5919) [`040e591`](https://github.com/LedgerHQ/ledger-live/commit/040e5918eb7ad5a861b2f6eda09f71d3ce565991) Thanks [@gre](https://github.com/gre)! - Update to Countervalues V3 API with better price coverage and better performance.

- [#5913](https://github.com/LedgerHQ/ledger-live/pull/5913) [`52abfc5`](https://github.com/LedgerHQ/ledger-live/commit/52abfc5af4ec5af9c47e72c7a661993e0432d84b) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Mitigate Solana error when fetching fees for an address

- [#5935](https://github.com/LedgerHQ/ledger-live/pull/5935) [`35e7a3b`](https://github.com/LedgerHQ/ledger-live/commit/35e7a3b976a300df3abfb1427a35275ee6fa6da1) Thanks [@Wozacosta](https://github.com/Wozacosta)! - Remove usage of description in discover search bar

- [#5946](https://github.com/LedgerHQ/ledger-live/pull/5946) [`56f43b1`](https://github.com/LedgerHQ/ledger-live/commit/56f43b10d9a996932ec210ff67f5d327d630fa41) Thanks [@sponomarev](https://github.com/sponomarev)! - use fallback tx fee amount in case of failed retries

- [#6023](https://github.com/LedgerHQ/ledger-live/pull/6023) [`35d4196`](https://github.com/LedgerHQ/ledger-live/commit/35d41969e00e15b4817f2be558a7c81200b71cc7) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Sanitize account data that may be missing when de/serializing Tron accounts

- [#5951](https://github.com/LedgerHQ/ledger-live/pull/5951) [`6aac2b9`](https://github.com/LedgerHQ/ledger-live/commit/6aac2b977454daa67a02f5695d58746fde4d83f3) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Chore: add DisconnectedDeviceDuringOperation to allowed error during sync onboarding polling

- [#5959](https://github.com/LedgerHQ/ledger-live/pull/5959) [`801b16f`](https://github.com/LedgerHQ/ledger-live/commit/801b16fa7a440d914b1e76cd8785a3c7c85b474b) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - List apps v2: fix polyfill of application type

- [#5908](https://github.com/LedgerHQ/ledger-live/pull/5908) [`46298ae`](https://github.com/LedgerHQ/ledger-live/commit/46298aec703e6a0dcb47ab8f2a612dcb3bc4065a) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Fix the free storage available for all devices

- Updated dependencies [[`eadebff`](https://github.com/LedgerHQ/ledger-live/commit/eadebff3fe58aef6a5befb033d5147afc49663d3)]:
  - @ledgerhq/hw-transport@6.30.3
  - @ledgerhq/hw-app-algorand@6.28.3
  - @ledgerhq/hw-app-btc@10.2.1
  - @ledgerhq/hw-app-cosmos@6.29.3
  - @ledgerhq/hw-app-eth@6.35.4
  - @ledgerhq/hw-app-exchange@0.4.4
  - @ledgerhq/hw-app-near@6.28.3
  - @ledgerhq/hw-app-polkadot@6.28.3
  - @ledgerhq/hw-app-solana@7.1.3
  - @ledgerhq/hw-app-str@6.28.3
  - @ledgerhq/hw-app-tezos@6.28.3
  - @ledgerhq/hw-app-trx@6.28.3
  - @ledgerhq/hw-app-vet@0.1.3
  - @ledgerhq/hw-app-xrp@6.28.3
  - @ledgerhq/hw-transport-mocker@6.28.3
  - @ledgerhq/hw-transport-node-speculos@6.28.3
  - @ledgerhq/hw-transport-node-speculos-http@6.28.3
  - @ledgerhq/coin-evm@0.12.1
  - @ledgerhq/coin-framework@0.11.0

## 33.5.1-next.1

### Patch Changes

- [#6023](https://github.com/LedgerHQ/ledger-live/pull/6023) [`35d4196`](https://github.com/LedgerHQ/ledger-live/commit/35d41969e00e15b4817f2be558a7c81200b71cc7) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Sanitize account data that may be missing when de/serializing Tron accounts

## 33.5.1-next.0

### Patch Changes

- [#5889](https://github.com/LedgerHQ/ledger-live/pull/5889) [`0a03cf1`](https://github.com/LedgerHQ/ledger-live/commit/0a03cf10343e7b79295c1467c8964cc943f16840) Thanks [@RamyEB](https://github.com/RamyEB)! - Make the searchable Dapp only visible through the search bar for both LLD and LLM

- [#5749](https://github.com/LedgerHQ/ledger-live/pull/5749) [`eadebff`](https://github.com/LedgerHQ/ledger-live/commit/eadebff3fe58aef6a5befb033d5147afc49663d3) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix: HID USB reconnection on LLD during the sync onboarding

  - Refactoring of the disconnect after inactivity of the transport implementation
    hw-transport-node-hid-singleton
  - Better logs and documentation

- [#5919](https://github.com/LedgerHQ/ledger-live/pull/5919) [`040e591`](https://github.com/LedgerHQ/ledger-live/commit/040e5918eb7ad5a861b2f6eda09f71d3ce565991) Thanks [@gre](https://github.com/gre)! - Update to Countervalues V3 API with better price coverage and better performance.

- [#5913](https://github.com/LedgerHQ/ledger-live/pull/5913) [`52abfc5`](https://github.com/LedgerHQ/ledger-live/commit/52abfc5af4ec5af9c47e72c7a661993e0432d84b) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Mitigate Solana error when fetching fees for an address

- [#5935](https://github.com/LedgerHQ/ledger-live/pull/5935) [`35e7a3b`](https://github.com/LedgerHQ/ledger-live/commit/35e7a3b976a300df3abfb1427a35275ee6fa6da1) Thanks [@Wozacosta](https://github.com/Wozacosta)! - Remove usage of description in discover search bar

- [#5946](https://github.com/LedgerHQ/ledger-live/pull/5946) [`56f43b1`](https://github.com/LedgerHQ/ledger-live/commit/56f43b10d9a996932ec210ff67f5d327d630fa41) Thanks [@sponomarev](https://github.com/sponomarev)! - use fallback tx fee amount in case of failed retries

- [#5951](https://github.com/LedgerHQ/ledger-live/pull/5951) [`6aac2b9`](https://github.com/LedgerHQ/ledger-live/commit/6aac2b977454daa67a02f5695d58746fde4d83f3) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Chore: add DisconnectedDeviceDuringOperation to allowed error during sync onboarding polling

- [#5959](https://github.com/LedgerHQ/ledger-live/pull/5959) [`801b16f`](https://github.com/LedgerHQ/ledger-live/commit/801b16fa7a440d914b1e76cd8785a3c7c85b474b) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - List apps v2: fix polyfill of application type

- [#5908](https://github.com/LedgerHQ/ledger-live/pull/5908) [`46298ae`](https://github.com/LedgerHQ/ledger-live/commit/46298aec703e6a0dcb47ab8f2a612dcb3bc4065a) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Fix the free storage available for all devices

- Updated dependencies [[`eadebff`](https://github.com/LedgerHQ/ledger-live/commit/eadebff3fe58aef6a5befb033d5147afc49663d3)]:
  - @ledgerhq/hw-transport@6.30.3-next.0
  - @ledgerhq/hw-app-algorand@6.28.3-next.0
  - @ledgerhq/hw-app-btc@10.2.1-next.0
  - @ledgerhq/hw-app-cosmos@6.29.3-next.0
  - @ledgerhq/hw-app-eth@6.35.4-next.0
  - @ledgerhq/hw-app-exchange@0.4.4-next.0
  - @ledgerhq/hw-app-near@6.28.3-next.0
  - @ledgerhq/hw-app-polkadot@6.28.3-next.0
  - @ledgerhq/hw-app-solana@7.1.3-next.0
  - @ledgerhq/hw-app-str@6.28.3-next.0
  - @ledgerhq/hw-app-tezos@6.28.3-next.0
  - @ledgerhq/hw-app-trx@6.28.3-next.0
  - @ledgerhq/hw-app-vet@0.1.3-next.0
  - @ledgerhq/hw-app-xrp@6.28.3-next.0
  - @ledgerhq/hw-transport-mocker@6.28.3-next.0
  - @ledgerhq/hw-transport-node-speculos@6.28.3-next.0
  - @ledgerhq/hw-transport-node-speculos-http@6.28.3-next.0
  - @ledgerhq/coin-evm@0.12.1-next.0
  - @ledgerhq/coin-framework@0.11.0

## 33.5.0

### Minor Changes

- [#5648](https://github.com/LedgerHQ/ledger-live/pull/5648) [`6f012ed`](https://github.com/LedgerHQ/ledger-live/commit/6f012eda136d641836e839721a8ffba6bdc3d93f) Thanks [@Justkant](https://github.com/Justkant)! - feat: wallet-api custom echange

- [#5796](https://github.com/LedgerHQ/ledger-live/pull/5796) [`b74faea`](https://github.com/LedgerHQ/ledger-live/commit/b74faea05f856860a253c5b94a9333810a3446ca) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - add support to send FIL tokens to eth address on the Filecoin blockchain

- [#5960](https://github.com/LedgerHQ/ledger-live/pull/5960) [`e38e71b`](https://github.com/LedgerHQ/ledger-live/commit/e38e71b6f956452367fd148cf7dd43160f1fc2bf) Thanks [@CremaFR](https://github.com/CremaFR)! - fix tezos crash when unrevealed account

- [#5904](https://github.com/LedgerHQ/ledger-live/pull/5904) [`7021a71`](https://github.com/LedgerHQ/ledger-live/commit/7021a71c8fbe153656c778c314cda4e8725b1047) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Change Pool ID of Ledger Cardano validator

- [#5534](https://github.com/LedgerHQ/ledger-live/pull/5534) [`a4a72da`](https://github.com/LedgerHQ/ledger-live/commit/a4a72da33ddfefd5ba69ac4d9ecb33d7775583f1) Thanks [@Philippoes](https://github.com/Philippoes)! - Add support for Tron Stake 2.0

- [#5722](https://github.com/LedgerHQ/ledger-live/pull/5722) [`2358e87`](https://github.com/LedgerHQ/ledger-live/commit/2358e8748d9ae9398cfc05a0ec20a6b191fc7324) Thanks [@chabroA](https://github.com/chabroA)! - Add Ethereum Sepolia and Holesky

- [#5697](https://github.com/LedgerHQ/ledger-live/pull/5697) [`78e7aa2`](https://github.com/LedgerHQ/ledger-live/commit/78e7aa26e4d35091abbb32084b0fa748085b38e3) Thanks [@Justkant](https://github.com/Justkant)! - feat(wallet-api): add new optional fields for polkadot

- [#5796](https://github.com/LedgerHQ/ledger-live/pull/5796) [`b74faea`](https://github.com/LedgerHQ/ledger-live/commit/b74faea05f856860a253c5b94a9333810a3446ca) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - switch default derivation scheme to native filecoin wallet one

### Patch Changes

- [#5818](https://github.com/LedgerHQ/ledger-live/pull/5818) [`5f3a394`](https://github.com/LedgerHQ/ledger-live/commit/5f3a39431099ddfdc4573c6155dc1524c6f94afa) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - improve btc sync performance

- [#5942](https://github.com/LedgerHQ/ledger-live/pull/5942) [`6ac34be`](https://github.com/LedgerHQ/ledger-live/commit/6ac34beba9692bde7aad7c6ad38e83cb0b79fb0e) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix: inline install app while another app is opened

- [#5939](https://github.com/LedgerHQ/ledger-live/pull/5939) [`2502530`](https://github.com/LedgerHQ/ledger-live/commit/2502530cdc41b65b65f67bbaf380da690b8d64bf) Thanks [@RamyEB](https://github.com/RamyEB)! - revert usage-of-description-for-search-manifest

- [#5714](https://github.com/LedgerHQ/ledger-live/pull/5714) [`714f15e`](https://github.com/LedgerHQ/ledger-live/commit/714f15e3ec3acf5048dd014d018595ac6a1eb8fb) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Log Cardano raw transactions about to be signed

- [#5845](https://github.com/LedgerHQ/ledger-live/pull/5845) [`5ed4076`](https://github.com/LedgerHQ/ledger-live/commit/5ed407610dc0df8bc5b1c6b17b338d9f2dc0c94e) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Fix the disconnected device drawer behavior when a device is disconnected during action

- [#5923](https://github.com/LedgerHQ/ledger-live/pull/5923) [`bfae509`](https://github.com/LedgerHQ/ledger-live/commit/bfae509744cef7592ed8795be2c35c6f0e7a8125) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Mitigate Solana error when fetching fees for an address

- [#5715](https://github.com/LedgerHQ/ledger-live/pull/5715) [`784c1ac`](https://github.com/LedgerHQ/ledger-live/commit/784c1aceddac6751fa03e117df20729513e37a54) Thanks [@cng-ledger](https://github.com/cng-ledger)! - fix(LIVE-10552): change quote refresh rate to 20 seconds

- [#5723](https://github.com/LedgerHQ/ledger-live/pull/5723) [`418fe65`](https://github.com/LedgerHQ/ledger-live/commit/418fe65c7eb983dd4bae5c9c0799ae9dce36bec8) Thanks [@lvndry](https://github.com/lvndry)! - [solana] update URL to get validators information

- [#5973](https://github.com/LedgerHQ/ledger-live/pull/5973) [`1500f09`](https://github.com/LedgerHQ/ledger-live/commit/1500f09ff786548d673433a7dc15370b07c8e4e6) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Fix stacks transactions low fee issue

- [#5957](https://github.com/LedgerHQ/ledger-live/pull/5957) [`50e03bf`](https://github.com/LedgerHQ/ledger-live/commit/50e03bfe3dbb08f1dee00d04d655990d7abdc7fc) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - use fallback tx fee amount in case of failed retries

- [#5883](https://github.com/LedgerHQ/ledger-live/pull/5883) [`65772fb`](https://github.com/LedgerHQ/ledger-live/commit/65772fbcc1e6887d60ca585147123d356914ba56) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Update swap live app ff logic

- [#5893](https://github.com/LedgerHQ/ledger-live/pull/5893) [`288ad3a`](https://github.com/LedgerHQ/ledger-live/commit/288ad3a8361b49059869624afec8dd40a5ae19d2) Thanks [@CremaFR](https://github.com/CremaFR)! - prevent swap when using never used tezos account

- [#5896](https://github.com/LedgerHQ/ledger-live/pull/5896) [`d54a13e`](https://github.com/LedgerHQ/ledger-live/commit/d54a13e1caf5a831222f10714e654c5f49db00be) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - lower stale timeout on fetch rates

- [#5650](https://github.com/LedgerHQ/ledger-live/pull/5650) [`e4c8b3a`](https://github.com/LedgerHQ/ledger-live/commit/e4c8b3a8200a3e002e4ac130a8b4f3857c5df84e) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Replace hardcoded countervalues URL with env var

- [#5775](https://github.com/LedgerHQ/ledger-live/pull/5775) [`241cdac`](https://github.com/LedgerHQ/ledger-live/commit/241cdace43c9e6b6394617d8a63c60a7505f6a53) Thanks [@lvndry](https://github.com/lvndry)! - [Near] Cache getValidator and getComission

- [#5898](https://github.com/LedgerHQ/ledger-live/pull/5898) [`0079378`](https://github.com/LedgerHQ/ledger-live/commit/00793785dd4f1fcba25e49b436af43b702e54f6b) Thanks [@RamyEB](https://github.com/RamyEB)! - Use description for the search bar

- [#5747](https://github.com/LedgerHQ/ledger-live/pull/5747) [`c9dbad0`](https://github.com/LedgerHQ/ledger-live/commit/c9dbad07da7924ec4b40e94a837f64604645a9e4) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix exchange funds

- [#5228](https://github.com/LedgerHQ/ledger-live/pull/5228) [`7253544`](https://github.com/LedgerHQ/ledger-live/commit/72535447c5323abbba795b9de02a53ac5e90d410) Thanks [@sponomarev](https://github.com/sponomarev)! - Safer Solana staking

- Updated dependencies [[`fc2cf04`](https://github.com/LedgerHQ/ledger-live/commit/fc2cf04c8d3cd55503ea19aeb21fd12ee55046f6), [`dd5d930`](https://github.com/LedgerHQ/ledger-live/commit/dd5d9308e0e3ef8ca78f879c15bc07313ef3c8c4), [`6f012ed`](https://github.com/LedgerHQ/ledger-live/commit/6f012eda136d641836e839721a8ffba6bdc3d93f), [`acc0605`](https://github.com/LedgerHQ/ledger-live/commit/acc06050b622f8d4265be9f962c6c83b1fbaefd5), [`2358e87`](https://github.com/LedgerHQ/ledger-live/commit/2358e8748d9ae9398cfc05a0ec20a6b191fc7324), [`5fdd5f0`](https://github.com/LedgerHQ/ledger-live/commit/5fdd5f0acab5f990d46ad20d245315f38be0f08a), [`65772fb`](https://github.com/LedgerHQ/ledger-live/commit/65772fbcc1e6887d60ca585147123d356914ba56), [`e494a2b`](https://github.com/LedgerHQ/ledger-live/commit/e494a2b984fb0406fe9225bb4eccde3d9585efe1), [`69bbdce`](https://github.com/LedgerHQ/ledger-live/commit/69bbdce5c88d69248cbddb94ac4627334c1df626), [`ed23f46`](https://github.com/LedgerHQ/ledger-live/commit/ed23f4680d4ed1020bf34ac05b064ff659a282f5), [`2b627ae`](https://github.com/LedgerHQ/ledger-live/commit/2b627aebddef859b9cb62467353e7d868bfbc4f9), [`17d1f86`](https://github.com/LedgerHQ/ledger-live/commit/17d1f86022f0122ac85ca6489eb4698c7d9045fb), [`b74faea`](https://github.com/LedgerHQ/ledger-live/commit/b74faea05f856860a253c5b94a9333810a3446ca), [`16b4d7a`](https://github.com/LedgerHQ/ledger-live/commit/16b4d7ab4702022d4967f3c054d3c62a76716947), [`0375de1`](https://github.com/LedgerHQ/ledger-live/commit/0375de19ca909b0b013992c114b0fa2ead2a08f3)]:
  - @ledgerhq/cryptoassets@11.4.0
  - @ledgerhq/crypto-icons-ui@1.0.1
  - @ledgerhq/live-network@1.1.11
  - @ledgerhq/wallet-api-exchange-module@0.2.0
  - @ledgerhq/coin-framework@0.11.0
  - @ledgerhq/coin-evm@0.12.0
  - @ledgerhq/live-env@0.9.0
  - @ledgerhq/hw-app-btc@10.2.0
  - @ledgerhq/live-config@1.0.1
  - @ledgerhq/hw-transport@6.30.2
  - @ledgerhq/coin-algorand@0.3.9
  - @ledgerhq/coin-polkadot@0.5.2
  - @ledgerhq/hw-app-eth@6.35.3
  - @ledgerhq/hw-app-vet@0.1.2
  - @ledgerhq/hw-app-algorand@6.28.2
  - @ledgerhq/hw-app-cosmos@6.29.2
  - @ledgerhq/hw-app-exchange@0.4.3
  - @ledgerhq/hw-app-near@6.28.2
  - @ledgerhq/hw-app-polkadot@6.28.2
  - @ledgerhq/hw-app-solana@7.1.2
  - @ledgerhq/hw-app-str@6.28.2
  - @ledgerhq/hw-app-tezos@6.28.2
  - @ledgerhq/hw-app-trx@6.28.2
  - @ledgerhq/hw-app-xrp@6.28.2
  - @ledgerhq/hw-transport-mocker@6.28.2
  - @ledgerhq/hw-transport-node-speculos@6.28.2
  - @ledgerhq/hw-transport-node-speculos-http@6.28.2

## 33.5.0-next.6

### Patch Changes

- [#5973](https://github.com/LedgerHQ/ledger-live/pull/5973) [`1500f09`](https://github.com/LedgerHQ/ledger-live/commit/1500f09ff786548d673433a7dc15370b07c8e4e6) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Fix stacks transactions low fee issue

## 33.5.0-next.5

### Minor Changes

- [#5960](https://github.com/LedgerHQ/ledger-live/pull/5960) [`e38e71b`](https://github.com/LedgerHQ/ledger-live/commit/e38e71b6f956452367fd148cf7dd43160f1fc2bf) Thanks [@CremaFR](https://github.com/CremaFR)! - fix tezos crash when unrevealed account

## 33.5.0-next.4

### Patch Changes

- [#5957](https://github.com/LedgerHQ/ledger-live/pull/5957) [`50e03bf`](https://github.com/LedgerHQ/ledger-live/commit/50e03bfe3dbb08f1dee00d04d655990d7abdc7fc) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - use fallback tx fee amount in case of failed retries

## 33.5.0-next.3

### Patch Changes

- [#5942](https://github.com/LedgerHQ/ledger-live/pull/5942) [`6ac34be`](https://github.com/LedgerHQ/ledger-live/commit/6ac34beba9692bde7aad7c6ad38e83cb0b79fb0e) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix: inline install app while another app is opened

## 33.5.0-next.2

### Patch Changes

- [#5939](https://github.com/LedgerHQ/ledger-live/pull/5939) [`2502530`](https://github.com/LedgerHQ/ledger-live/commit/2502530cdc41b65b65f67bbaf380da690b8d64bf) Thanks [@RamyEB](https://github.com/RamyEB)! - revert usage-of-description-for-search-manifest

## 33.5.0-next.1

### Patch Changes

- [#5923](https://github.com/LedgerHQ/ledger-live/pull/5923) [`bfae509`](https://github.com/LedgerHQ/ledger-live/commit/bfae509744cef7592ed8795be2c35c6f0e7a8125) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Mitigate Solana error when fetching fees for an address

## 33.5.0-next.0

### Minor Changes

- [#5648](https://github.com/LedgerHQ/ledger-live/pull/5648) [`6f012ed`](https://github.com/LedgerHQ/ledger-live/commit/6f012eda136d641836e839721a8ffba6bdc3d93f) Thanks [@Justkant](https://github.com/Justkant)! - feat: wallet-api custom echange

- [#5796](https://github.com/LedgerHQ/ledger-live/pull/5796) [`b74faea`](https://github.com/LedgerHQ/ledger-live/commit/b74faea05f856860a253c5b94a9333810a3446ca) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - add support to send FIL tokens to eth address on the Filecoin blockchain

- [#5904](https://github.com/LedgerHQ/ledger-live/pull/5904) [`7021a71`](https://github.com/LedgerHQ/ledger-live/commit/7021a71c8fbe153656c778c314cda4e8725b1047) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Change Pool ID of Ledger Cardano validator

- [#5534](https://github.com/LedgerHQ/ledger-live/pull/5534) [`a4a72da`](https://github.com/LedgerHQ/ledger-live/commit/a4a72da33ddfefd5ba69ac4d9ecb33d7775583f1) Thanks [@Philippoes](https://github.com/Philippoes)! - Add support for Tron Stake 2.0

- [#5722](https://github.com/LedgerHQ/ledger-live/pull/5722) [`2358e87`](https://github.com/LedgerHQ/ledger-live/commit/2358e8748d9ae9398cfc05a0ec20a6b191fc7324) Thanks [@chabroA](https://github.com/chabroA)! - Add Ethereum Sepolia and Holesky

- [#5697](https://github.com/LedgerHQ/ledger-live/pull/5697) [`78e7aa2`](https://github.com/LedgerHQ/ledger-live/commit/78e7aa26e4d35091abbb32084b0fa748085b38e3) Thanks [@Justkant](https://github.com/Justkant)! - feat(wallet-api): add new optional fields for polkadot

- [#5796](https://github.com/LedgerHQ/ledger-live/pull/5796) [`b74faea`](https://github.com/LedgerHQ/ledger-live/commit/b74faea05f856860a253c5b94a9333810a3446ca) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - switch default derivation scheme to native filecoin wallet one

### Patch Changes

- [#5818](https://github.com/LedgerHQ/ledger-live/pull/5818) [`5f3a394`](https://github.com/LedgerHQ/ledger-live/commit/5f3a39431099ddfdc4573c6155dc1524c6f94afa) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - improve btc sync performance

- [#5714](https://github.com/LedgerHQ/ledger-live/pull/5714) [`714f15e`](https://github.com/LedgerHQ/ledger-live/commit/714f15e3ec3acf5048dd014d018595ac6a1eb8fb) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Log Cardano raw transactions about to be signed

- [#5845](https://github.com/LedgerHQ/ledger-live/pull/5845) [`5ed4076`](https://github.com/LedgerHQ/ledger-live/commit/5ed407610dc0df8bc5b1c6b17b338d9f2dc0c94e) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Fix the disconnected device drawer behavior when a device is disconnected during action

- [#5715](https://github.com/LedgerHQ/ledger-live/pull/5715) [`784c1ac`](https://github.com/LedgerHQ/ledger-live/commit/784c1aceddac6751fa03e117df20729513e37a54) Thanks [@cng-ledger](https://github.com/cng-ledger)! - fix(LIVE-10552): change quote refresh rate to 20 seconds

- [#5723](https://github.com/LedgerHQ/ledger-live/pull/5723) [`418fe65`](https://github.com/LedgerHQ/ledger-live/commit/418fe65c7eb983dd4bae5c9c0799ae9dce36bec8) Thanks [@lvndry](https://github.com/lvndry)! - [solana] update URL to get validators information

- [#5883](https://github.com/LedgerHQ/ledger-live/pull/5883) [`65772fb`](https://github.com/LedgerHQ/ledger-live/commit/65772fbcc1e6887d60ca585147123d356914ba56) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Update swap live app ff logic

- [#5893](https://github.com/LedgerHQ/ledger-live/pull/5893) [`288ad3a`](https://github.com/LedgerHQ/ledger-live/commit/288ad3a8361b49059869624afec8dd40a5ae19d2) Thanks [@CremaFR](https://github.com/CremaFR)! - prevent swap when using never used tezos account

- [#5896](https://github.com/LedgerHQ/ledger-live/pull/5896) [`d54a13e`](https://github.com/LedgerHQ/ledger-live/commit/d54a13e1caf5a831222f10714e654c5f49db00be) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - lower stale timeout on fetch rates

- [#5650](https://github.com/LedgerHQ/ledger-live/pull/5650) [`e4c8b3a`](https://github.com/LedgerHQ/ledger-live/commit/e4c8b3a8200a3e002e4ac130a8b4f3857c5df84e) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Replace hardcoded countervalues URL with env var

- [#5775](https://github.com/LedgerHQ/ledger-live/pull/5775) [`241cdac`](https://github.com/LedgerHQ/ledger-live/commit/241cdace43c9e6b6394617d8a63c60a7505f6a53) Thanks [@lvndry](https://github.com/lvndry)! - [Near] Cache getValidator and getComission

- [#5898](https://github.com/LedgerHQ/ledger-live/pull/5898) [`0079378`](https://github.com/LedgerHQ/ledger-live/commit/00793785dd4f1fcba25e49b436af43b702e54f6b) Thanks [@RamyEB](https://github.com/RamyEB)! - Use description for the search bar

- [#5747](https://github.com/LedgerHQ/ledger-live/pull/5747) [`c9dbad0`](https://github.com/LedgerHQ/ledger-live/commit/c9dbad07da7924ec4b40e94a837f64604645a9e4) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix exchange funds

- [#5228](https://github.com/LedgerHQ/ledger-live/pull/5228) [`7253544`](https://github.com/LedgerHQ/ledger-live/commit/72535447c5323abbba795b9de02a53ac5e90d410) Thanks [@sponomarev](https://github.com/sponomarev)! - Safer Solana staking

- Updated dependencies [[`fc2cf04`](https://github.com/LedgerHQ/ledger-live/commit/fc2cf04c8d3cd55503ea19aeb21fd12ee55046f6), [`dd5d930`](https://github.com/LedgerHQ/ledger-live/commit/dd5d9308e0e3ef8ca78f879c15bc07313ef3c8c4), [`6f012ed`](https://github.com/LedgerHQ/ledger-live/commit/6f012eda136d641836e839721a8ffba6bdc3d93f), [`acc0605`](https://github.com/LedgerHQ/ledger-live/commit/acc06050b622f8d4265be9f962c6c83b1fbaefd5), [`2358e87`](https://github.com/LedgerHQ/ledger-live/commit/2358e8748d9ae9398cfc05a0ec20a6b191fc7324), [`5fdd5f0`](https://github.com/LedgerHQ/ledger-live/commit/5fdd5f0acab5f990d46ad20d245315f38be0f08a), [`65772fb`](https://github.com/LedgerHQ/ledger-live/commit/65772fbcc1e6887d60ca585147123d356914ba56), [`e494a2b`](https://github.com/LedgerHQ/ledger-live/commit/e494a2b984fb0406fe9225bb4eccde3d9585efe1), [`69bbdce`](https://github.com/LedgerHQ/ledger-live/commit/69bbdce5c88d69248cbddb94ac4627334c1df626), [`ed23f46`](https://github.com/LedgerHQ/ledger-live/commit/ed23f4680d4ed1020bf34ac05b064ff659a282f5), [`2b627ae`](https://github.com/LedgerHQ/ledger-live/commit/2b627aebddef859b9cb62467353e7d868bfbc4f9), [`17d1f86`](https://github.com/LedgerHQ/ledger-live/commit/17d1f86022f0122ac85ca6489eb4698c7d9045fb), [`b74faea`](https://github.com/LedgerHQ/ledger-live/commit/b74faea05f856860a253c5b94a9333810a3446ca), [`16b4d7a`](https://github.com/LedgerHQ/ledger-live/commit/16b4d7ab4702022d4967f3c054d3c62a76716947), [`0375de1`](https://github.com/LedgerHQ/ledger-live/commit/0375de19ca909b0b013992c114b0fa2ead2a08f3)]:
  - @ledgerhq/cryptoassets@11.4.0-next.0
  - @ledgerhq/crypto-icons-ui@1.0.1-next.0
  - @ledgerhq/live-network@1.1.11-next.0
  - @ledgerhq/wallet-api-exchange-module@0.2.0-next.0
  - @ledgerhq/coin-framework@0.11.0-next.0
  - @ledgerhq/coin-evm@0.12.0-next.0
  - @ledgerhq/live-env@0.9.0-next.0
  - @ledgerhq/hw-app-btc@10.2.0-next.0
  - @ledgerhq/live-config@1.0.1-next.0
  - @ledgerhq/hw-transport@6.30.2-next.0
  - @ledgerhq/coin-algorand@0.3.9-next.0
  - @ledgerhq/coin-polkadot@0.5.2-next.0
  - @ledgerhq/hw-app-eth@6.35.3-next.0
  - @ledgerhq/hw-app-vet@0.1.2-next.0
  - @ledgerhq/hw-app-algorand@6.28.2-next.0
  - @ledgerhq/hw-app-cosmos@6.29.2-next.0
  - @ledgerhq/hw-app-exchange@0.4.3-next.0
  - @ledgerhq/hw-app-near@6.28.2-next.0
  - @ledgerhq/hw-app-polkadot@6.28.2-next.0
  - @ledgerhq/hw-app-solana@7.1.2-next.0
  - @ledgerhq/hw-app-str@6.28.2-next.0
  - @ledgerhq/hw-app-tezos@6.28.2-next.0
  - @ledgerhq/hw-app-trx@6.28.2-next.0
  - @ledgerhq/hw-app-xrp@6.28.2-next.0
  - @ledgerhq/hw-transport-mocker@6.28.2-next.0
  - @ledgerhq/hw-transport-node-speculos@6.28.2-next.0
  - @ledgerhq/hw-transport-node-speculos-http@6.28.2-next.0

## 33.4.0

### Minor Changes

- [#5736](https://github.com/LedgerHQ/ledger-live/pull/5736) [`1cb052d`](https://github.com/LedgerHQ/ledger-live/commit/1cb052dada6363c6f0dc4289b358d93de2320594) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Merging solana hotfix (PR #5824)

- [#5383](https://github.com/LedgerHQ/ledger-live/pull/5383) [`3e46bd1`](https://github.com/LedgerHQ/ledger-live/commit/3e46bd1c8b1baccdce1a5d4a2b0adc81cdbd2e41) Thanks [@cng-ledger](https://github.com/cng-ledger)! - feat(LIVE-9451): capture swap live app load failure & use native flow

### Patch Changes

- [#5703](https://github.com/LedgerHQ/ledger-live/pull/5703) [`6c139d7`](https://github.com/LedgerHQ/ledger-live/commit/6c139d7a6431fb87b8711bdeb7b7ffa9882e7723) Thanks [@gre](https://github.com/gre)! - Fixes icons of testnet coins.

- [#5662](https://github.com/LedgerHQ/ledger-live/pull/5662) [`efe1ed0`](https://github.com/LedgerHQ/ledger-live/commit/efe1ed0493b343165ade674ca8c6badfff6ce065) Thanks [@mle-gall](https://github.com/mle-gall)! - Fix post onboarding not clearing it's active state if no actions

- [#5736](https://github.com/LedgerHQ/ledger-live/pull/5736) [`b286aa1`](https://github.com/LedgerHQ/ledger-live/commit/b286aa1b36dbda3ae5fd2a93e116612a32f2ecd1) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Merging solana hotfix (PR #5824)

- [#5680](https://github.com/LedgerHQ/ledger-live/pull/5680) [`8929ea0`](https://github.com/LedgerHQ/ledger-live/commit/8929ea01acb6aa3d2949a16077a02d1c7b37f527) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix new firmware update flow not exitable (over USB)

- [#5736](https://github.com/LedgerHQ/ledger-live/pull/5736) [`d49f444`](https://github.com/LedgerHQ/ledger-live/commit/d49f44417fd175affe71da589c0ca380e88fbb35) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update CAL

- [#5691](https://github.com/LedgerHQ/ledger-live/pull/5691) [`a01636a`](https://github.com/LedgerHQ/ledger-live/commit/a01636a0c14e66d20bb853be1e13b48d6036639e) Thanks [@gre](https://github.com/gre)! - deposit flow: fixes currencies sorting ('2049' bug)

- [#5655](https://github.com/LedgerHQ/ledger-live/pull/5655) [`a8f82dc`](https://github.com/LedgerHQ/ledger-live/commit/a8f82dc1854eaf75e922d55964905b1fd7da0ba2) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - add moonpay swap provider config

- Updated dependencies [[`d49f444`](https://github.com/LedgerHQ/ledger-live/commit/d49f44417fd175affe71da589c0ca380e88fbb35), [`f372d0f`](https://github.com/LedgerHQ/ledger-live/commit/f372d0f02a0f5e18021a9cb49ed3f160552c2791), [`0e2287b`](https://github.com/LedgerHQ/ledger-live/commit/0e2287b1ce4200004ed2c06f3e74cd3b03100784)]:
  - @ledgerhq/cryptoassets@11.3.1
  - @ledgerhq/hw-app-exchange@0.4.2
  - @ledgerhq/crypto-icons-ui@1.0.0
  - @ledgerhq/coin-algorand@0.3.8
  - @ledgerhq/coin-evm@0.11.2
  - @ledgerhq/coin-framework@0.10.1
  - @ledgerhq/coin-polkadot@0.5.1
  - @ledgerhq/hw-app-eth@6.35.2
  - @ledgerhq/hw-app-vet@0.1.1

## 33.4.0-next.1

### Minor Changes

- [#5736](https://github.com/LedgerHQ/ledger-live/pull/5736) [`1cb052d`](https://github.com/LedgerHQ/ledger-live/commit/1cb052dada6363c6f0dc4289b358d93de2320594) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Merging solana hotfix (PR #5824)

## 33.3.2-next.0

### Patch Changes

- [#5736](https://github.com/LedgerHQ/ledger-live/pull/5736) [`b286aa1`](https://github.com/LedgerHQ/ledger-live/commit/b286aa1b36dbda3ae5fd2a93e116612a32f2ecd1) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Merging solana hotfix (PR #5824)

## 33.3.1

### Patch Changes

- [#5824](https://github.com/LedgerHQ/ledger-live/pull/5824) [`1abfe8d`](https://github.com/LedgerHQ/ledger-live/commit/1abfe8dfa4f2f4abd294f3f992f3681a78b33143) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Safer Solana staking

## 33.3.0

### Minor Changes

- [#5341](https://github.com/LedgerHQ/ledger-live/pull/5341) [`1cb527b`](https://github.com/LedgerHQ/ledger-live/commit/1cb527b9a0b03f23a921a446c64f71ab5c9e9013) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - live-config lib setup for featureflag framework

- [#5618](https://github.com/LedgerHQ/ledger-live/pull/5618) [`ed17856`](https://github.com/LedgerHQ/ledger-live/commit/ed17856adc5a6723bc87c409e03a2b832432a1db) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Wait for firebase and analytics to be ready before adding featureflags to segment identity

- [#5171](https://github.com/LedgerHQ/ledger-live/pull/5171) [`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Feat: Usage of new abort timeouts and transport access refactoring

  - `getOnboardingStatePolling` : usage of `transportAbortTimeoutMs` value for both the opening and exchange (via `getVersion`) abort timeout
  - `getVersion` : usage of `abortTimeoutMs` on exchange
  - More tracing and documentations

  `withDevice` refactoring:

  - better variables names
  - more documentation (especially the queue-made-with-promise part)
  - some simple unit tests

  Updates on 1st version of the device SDK:

  The 1st implementation of the "device SDK" is redefining a `withDevie` named `withTransport`.
  It had its own queue of waiting jobs, that was independent from the queue of job from `withDevice`
  With this refactoring, `withTransport` and `withDevice` have been updated to use the same jobs queue.

- [#5543](https://github.com/LedgerHQ/ledger-live/pull/5543) [`0f5292a`](https://github.com/LedgerHQ/ledger-live/commit/0f5292af8feaa517f36ec35155d813b17c4f66e9) Thanks [@chabroA](https://github.com/chabroA)! - rename Crypto.org to Cronos POS Chain

- [#5548](https://github.com/LedgerHQ/ledger-live/pull/5548) [`d4a17e1`](https://github.com/LedgerHQ/ledger-live/commit/d4a17e177afb3cd6888479b7319ccb1c38011faa) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Fix cardano spendable balance and sendmax amount on confirm screen

- [#5574](https://github.com/LedgerHQ/ledger-live/pull/5574) [`3adea7a`](https://github.com/LedgerHQ/ledger-live/commit/3adea7a7ad66080b5e6e4407071a976644158d04) Thanks [@Wozacosta](https://github.com/Wozacosta)! - introduces the ability to highlight live apps in discover section

- [#5639](https://github.com/LedgerHQ/ledger-live/pull/5639) [`313d52a`](https://github.com/LedgerHQ/ledger-live/commit/313d52a516b911229537d7e50badaedd045ed2a0) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Update dydx unbonding period

- [#4947](https://github.com/LedgerHQ/ledger-live/pull/4947) [`2edfa53`](https://github.com/LedgerHQ/ledger-live/commit/2edfa533bccafbfd8a61aea0f5422c0db79825ea) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - vechain integration

- [#5632](https://github.com/LedgerHQ/ledger-live/pull/5632) [`95acaec`](https://github.com/LedgerHQ/ledger-live/commit/95acaec69f559295ffbe289abc8cddc598038ca7) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Fix big number transactions on cosmos family

### Patch Changes

- [#5453](https://github.com/LedgerHQ/ledger-live/pull/5453) [`b7d58b4`](https://github.com/LedgerHQ/ledger-live/commit/b7d58b4cf3aa041b7b794d9af6f0b89bbc0df633) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - Get onboarding Recover state and display banner on portfolio

- [#5522](https://github.com/LedgerHQ/ledger-live/pull/5522) [`44ee889`](https://github.com/LedgerHQ/ledger-live/commit/44ee88944571c73afb105349f5f28b82e8be262d) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - Add recover banner for subscribtion informations

- [#5412](https://github.com/LedgerHQ/ledger-live/pull/5412) [`1ccd674`](https://github.com/LedgerHQ/ledger-live/commit/1ccd6746e9ccec5e60ae576d09aca48767da1124) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Allow explorer links to use timestamp instead of hash

- [#5458](https://github.com/LedgerHQ/ledger-live/pull/5458) [`13d9cbe`](https://github.com/LedgerHQ/ledger-live/commit/13d9cbe9a4afbf3ccd532a33e4ada3685d9d646a) Thanks [@mle-gall](https://github.com/mle-gall)! - Changing post onboarding items in LLM

- [#5647](https://github.com/LedgerHQ/ledger-live/pull/5647) [`18afc73`](https://github.com/LedgerHQ/ledger-live/commit/18afc730b2c40df16af67f95c1061508c13343c8) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fixes icons of testnet coins.

- [#4801](https://github.com/LedgerHQ/ledger-live/pull/4801) [`f20c114`](https://github.com/LedgerHQ/ledger-live/commit/f20c1149be9eb255e05f0f41f4a0575e8b89dab6) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Remove legacy hack for decred,qtum,viacoin fees that is not needed anymore

- [#5519](https://github.com/LedgerHQ/ledger-live/pull/5519) [`75d0019`](https://github.com/LedgerHQ/ledger-live/commit/75d001910faa24bcb76c49eb66c0c49e9770f4b2) Thanks [@sarneijim](https://github.com/sarneijim)! - fix: fix swap crash in swap

- [#5490](https://github.com/LedgerHQ/ledger-live/pull/5490) [`39d327e`](https://github.com/LedgerHQ/ledger-live/commit/39d327ec4965bda6a8fb6f202238e3156451cfde) Thanks [@chabroA](https://github.com/chabroA)! - use-create-tx-in-wallet-api-adapter

- [#5350](https://github.com/LedgerHQ/ledger-live/pull/5350) [`342ed3b`](https://github.com/LedgerHQ/ledger-live/commit/342ed3b81613ca81790c1c3d6cfe639c8700562a) Thanks [@jdabbech-ledger](https://github.com/jdabbech-ledger)! - Fix UI issue on shutdown device during language pack install by whitelisting errors that retry polling

- [#5432](https://github.com/LedgerHQ/ledger-live/pull/5432) [`4d1aade`](https://github.com/LedgerHQ/ledger-live/commit/4d1aade53cd33f8e7548ce340f54fbb834bdcdcb) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: refactoring TransportStatusError

  Refactor into a real class in order to improve TS inference

- [#5613](https://github.com/LedgerHQ/ledger-live/pull/5613) [`eb5ac4d`](https://github.com/LedgerHQ/ledger-live/commit/eb5ac4dca430654f5f86854025fddddab4261a29) Thanks [@chabroA](https://github.com/chabroA)! - update near explorer views urls

- [#5701](https://github.com/LedgerHQ/ledger-live/pull/5701) [`2287d6a`](https://github.com/LedgerHQ/ledger-live/commit/2287d6a04c4737de6aed696e18e29edf06780ab0) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Catch and return error in useAvailableLanguagesForDevice

- [#5633](https://github.com/LedgerHQ/ledger-live/pull/5633) [`cc56827`](https://github.com/LedgerHQ/ledger-live/commit/cc56827cc9682049a02d1360683ecdfd9460f4c9) Thanks [@chabroA](https://github.com/chabroA)! - add display of USDC staking rewards for dydx

- [#5466](https://github.com/LedgerHQ/ledger-live/pull/5466) [`88da01e`](https://github.com/LedgerHQ/ledger-live/commit/88da01e071a0332236b7fdeda619a0eb0284cec7) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - Fix issue on URL constructor when we use hook useCustomPath

- [#5604](https://github.com/LedgerHQ/ledger-live/pull/5604) [`c8172ab`](https://github.com/LedgerHQ/ledger-live/commit/c8172abc5c052a753b93be8b6c9cfd88ce0dd64a) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - add ptxSwapMoonpayProvider feature flag. Display moonpay quote in swap form and redirect to moonpay web app on moonpay quote selection.

- [#5596](https://github.com/LedgerHQ/ledger-live/pull/5596) [`88fc78a`](https://github.com/LedgerHQ/ledger-live/commit/88fc78a7c1a8fee9102b3c8c907372497425d143) Thanks [@sarneijim](https://github.com/sarneijim)! - Support new token exchange in wallet-api

- [#5138](https://github.com/LedgerHQ/ledger-live/pull/5138) [`9d35080`](https://github.com/LedgerHQ/ledger-live/commit/9d35080944a6a63c78f54a545734f4cf3cbded63) Thanks [@aussedatlo](https://github.com/aussedatlo)! - add low battery warning during early security check

- [#5566](https://github.com/LedgerHQ/ledger-live/pull/5566) [`2545442`](https://github.com/LedgerHQ/ledger-live/commit/25454425a7f80b551025513f1c2f1bdecb7cceeb) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: longer timer triggering an error when loading an image on Stax

- [#5594](https://github.com/LedgerHQ/ledger-live/pull/5594) [`124fbb3`](https://github.com/LedgerHQ/ledger-live/commit/124fbb349a67b2aad8f8cc8f102100ff6c7a3d8e) Thanks [@mle-gall](https://github.com/mle-gall)! - Fix - LLM - Fixed post onboarding not properly closed causing it to reopen.

- [#5588](https://github.com/LedgerHQ/ledger-live/pull/5588) [`95ce679`](https://github.com/LedgerHQ/ledger-live/commit/95ce679a9da4e72672903ee63167cca8eea7c910) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add missing account actions for Cardano on LLM + better typing on all families

- [#5438](https://github.com/LedgerHQ/ledger-live/pull/5438) [`6d62700`](https://github.com/LedgerHQ/ledger-live/commit/6d627002d76a81d68663e33cdcaeebcd89ea84d8) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: refactoring deprecated retryWhen

- [#5446](https://github.com/LedgerHQ/ledger-live/pull/5446) [`2b3ed02`](https://github.com/LedgerHQ/ledger-live/commit/2b3ed025d6988a4b7560522c209a5c9c1ca430a2) Thanks [@gre](https://github.com/gre)! - Rework the marketcap ordering of currencies using the new v3 countervalues API.

- [#5517](https://github.com/LedgerHQ/ledger-live/pull/5517) [`6dea540`](https://github.com/LedgerHQ/ledger-live/commit/6dea54057f67162a1f556661afae16e0422f7ac3) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Add isNew field to Feature_ProtectServicesDesktop and rename Ledger Recover to [L] Recover.

- Updated dependencies [[`1cb527b`](https://github.com/LedgerHQ/ledger-live/commit/1cb527b9a0b03f23a921a446c64f71ab5c9e9013), [`618307f`](https://github.com/LedgerHQ/ledger-live/commit/618307f92899af07f4c8ad97c67df483492e3d9d), [`0f5292a`](https://github.com/LedgerHQ/ledger-live/commit/0f5292af8feaa517f36ec35155d813b17c4f66e9), [`cf41c53`](https://github.com/LedgerHQ/ledger-live/commit/cf41c532caa5eb112d2bf3b85de8566e20f71ccb), [`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2), [`4d1aade`](https://github.com/LedgerHQ/ledger-live/commit/4d1aade53cd33f8e7548ce340f54fbb834bdcdcb), [`eb5ac4d`](https://github.com/LedgerHQ/ledger-live/commit/eb5ac4dca430654f5f86854025fddddab4261a29), [`9d35080`](https://github.com/LedgerHQ/ledger-live/commit/9d35080944a6a63c78f54a545734f4cf3cbded63), [`0fb6cb3`](https://github.com/LedgerHQ/ledger-live/commit/0fb6cb3cb0085b71dfadfd3a92602511cb7e9928), [`6dc1007`](https://github.com/LedgerHQ/ledger-live/commit/6dc100774010ad674001d04b531239f5adfdce7b), [`3adea7a`](https://github.com/LedgerHQ/ledger-live/commit/3adea7a7ad66080b5e6e4407071a976644158d04), [`2edfa53`](https://github.com/LedgerHQ/ledger-live/commit/2edfa533bccafbfd8a61aea0f5422c0db79825ea), [`be22d72`](https://github.com/LedgerHQ/ledger-live/commit/be22d724cf5499fe4958bfb3b5f763ffaf0d0446), [`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2), [`335ce83`](https://github.com/LedgerHQ/ledger-live/commit/335ce8366c8c997cdd77f191262a9dedee9888f6), [`e70e345`](https://github.com/LedgerHQ/ledger-live/commit/e70e345bd21d4f5c82fbedfd4447aec0e866be5a), [`ab1db96`](https://github.com/LedgerHQ/ledger-live/commit/ab1db965c25cd629bf384f7323f0b018309e4e66)]:
  - @ledgerhq/live-config@1.0.0
  - @ledgerhq/cryptoassets@11.3.0
  - @ledgerhq/coin-framework@0.10.0
  - @ledgerhq/live-env@0.8.0
  - @ledgerhq/coin-polkadot@0.5.0
  - @ledgerhq/hw-transport@6.30.1
  - @ledgerhq/errors@6.16.1
  - @ledgerhq/coin-evm@0.11.1
  - @ledgerhq/hw-app-vet@0.1.0
  - @ledgerhq/crypto-icons-ui@0.7.0
  - @ledgerhq/devices@8.2.0
  - @ledgerhq/coin-algorand@0.3.7
  - @ledgerhq/hw-app-eth@6.35.1
  - @ledgerhq/live-network@1.1.10
  - @ledgerhq/hw-app-algorand@6.28.1
  - @ledgerhq/hw-app-btc@10.1.1
  - @ledgerhq/hw-app-cosmos@6.29.1
  - @ledgerhq/hw-app-exchange@0.4.1
  - @ledgerhq/hw-app-near@6.28.1
  - @ledgerhq/hw-app-polkadot@6.28.1
  - @ledgerhq/hw-app-solana@7.1.1
  - @ledgerhq/hw-app-str@6.28.1
  - @ledgerhq/hw-app-tezos@6.28.1
  - @ledgerhq/hw-app-trx@6.28.1
  - @ledgerhq/hw-app-xrp@6.28.1
  - @ledgerhq/hw-transport-mocker@6.28.1
  - @ledgerhq/hw-transport-node-speculos@6.28.1
  - @ledgerhq/hw-transport-node-speculos-http@6.28.1

## 33.3.0-next.3

### Patch Changes

- [#5647](https://github.com/LedgerHQ/ledger-live/pull/5647) [`18afc73`](https://github.com/LedgerHQ/ledger-live/commit/18afc730b2c40df16af67f95c1061508c13343c8) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fixes icons of testnet coins.

## 33.3.0-next.2

### Patch Changes

- Updated dependencies [[`0fb6cb3`](https://github.com/LedgerHQ/ledger-live/commit/0fb6cb3cb0085b71dfadfd3a92602511cb7e9928)]:
  - @ledgerhq/coin-evm@0.11.1-next.1

## 33.3.0-next.1

### Patch Changes

- [#5701](https://github.com/LedgerHQ/ledger-live/pull/5701) [`2287d6a`](https://github.com/LedgerHQ/ledger-live/commit/2287d6a04c4737de6aed696e18e29edf06780ab0) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Catch and return error in useAvailableLanguagesForDevice

## 33.3.0-next.0

### Minor Changes

- [#5341](https://github.com/LedgerHQ/ledger-live/pull/5341) [`1cb527b`](https://github.com/LedgerHQ/ledger-live/commit/1cb527b9a0b03f23a921a446c64f71ab5c9e9013) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - live-config lib setup for featureflag framework

- [#5618](https://github.com/LedgerHQ/ledger-live/pull/5618) [`ed17856`](https://github.com/LedgerHQ/ledger-live/commit/ed17856adc5a6723bc87c409e03a2b832432a1db) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Wait for firebase and analytics to be ready before adding featureflags to segment identity

- [#5171](https://github.com/LedgerHQ/ledger-live/pull/5171) [`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Feat: Usage of new abort timeouts and transport access refactoring

  - `getOnboardingStatePolling` : usage of `transportAbortTimeoutMs` value for both the opening and exchange (via `getVersion`) abort timeout
  - `getVersion` : usage of `abortTimeoutMs` on exchange
  - More tracing and documentations

  `withDevice` refactoring:

  - better variables names
  - more documentation (especially the queue-made-with-promise part)
  - some simple unit tests

  Updates on 1st version of the device SDK:

  The 1st implementation of the "device SDK" is redefining a `withDevie` named `withTransport`.
  It had its own queue of waiting jobs, that was independent from the queue of job from `withDevice`
  With this refactoring, `withTransport` and `withDevice` have been updated to use the same jobs queue.

- [#5543](https://github.com/LedgerHQ/ledger-live/pull/5543) [`0f5292a`](https://github.com/LedgerHQ/ledger-live/commit/0f5292af8feaa517f36ec35155d813b17c4f66e9) Thanks [@chabroA](https://github.com/chabroA)! - rename Crypto.org to Cronos POS Chain

- [#5548](https://github.com/LedgerHQ/ledger-live/pull/5548) [`d4a17e1`](https://github.com/LedgerHQ/ledger-live/commit/d4a17e177afb3cd6888479b7319ccb1c38011faa) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Fix cardano spendable balance and sendmax amount on confirm screen

- [#5574](https://github.com/LedgerHQ/ledger-live/pull/5574) [`3adea7a`](https://github.com/LedgerHQ/ledger-live/commit/3adea7a7ad66080b5e6e4407071a976644158d04) Thanks [@Wozacosta](https://github.com/Wozacosta)! - introduces the ability to highlight live apps in discover section

- [#5639](https://github.com/LedgerHQ/ledger-live/pull/5639) [`313d52a`](https://github.com/LedgerHQ/ledger-live/commit/313d52a516b911229537d7e50badaedd045ed2a0) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Update dydx unbonding period

- [#4947](https://github.com/LedgerHQ/ledger-live/pull/4947) [`2edfa53`](https://github.com/LedgerHQ/ledger-live/commit/2edfa533bccafbfd8a61aea0f5422c0db79825ea) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - vechain integration

- [#5632](https://github.com/LedgerHQ/ledger-live/pull/5632) [`95acaec`](https://github.com/LedgerHQ/ledger-live/commit/95acaec69f559295ffbe289abc8cddc598038ca7) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Fix big number transactions on cosmos family

### Patch Changes

- [#5453](https://github.com/LedgerHQ/ledger-live/pull/5453) [`b7d58b4`](https://github.com/LedgerHQ/ledger-live/commit/b7d58b4cf3aa041b7b794d9af6f0b89bbc0df633) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - Get onboarding Recover state and display banner on portfolio

- [#5522](https://github.com/LedgerHQ/ledger-live/pull/5522) [`44ee889`](https://github.com/LedgerHQ/ledger-live/commit/44ee88944571c73afb105349f5f28b82e8be262d) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - Add recover banner for subscribtion informations

- [#5412](https://github.com/LedgerHQ/ledger-live/pull/5412) [`1ccd674`](https://github.com/LedgerHQ/ledger-live/commit/1ccd6746e9ccec5e60ae576d09aca48767da1124) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Allow explorer links to use timestamp instead of hash

- [#5458](https://github.com/LedgerHQ/ledger-live/pull/5458) [`13d9cbe`](https://github.com/LedgerHQ/ledger-live/commit/13d9cbe9a4afbf3ccd532a33e4ada3685d9d646a) Thanks [@mle-gall](https://github.com/mle-gall)! - Changing post onboarding items in LLM

- [#4801](https://github.com/LedgerHQ/ledger-live/pull/4801) [`f20c114`](https://github.com/LedgerHQ/ledger-live/commit/f20c1149be9eb255e05f0f41f4a0575e8b89dab6) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Remove legacy hack for decred,qtum,viacoin fees that is not needed anymore

- [#5519](https://github.com/LedgerHQ/ledger-live/pull/5519) [`75d0019`](https://github.com/LedgerHQ/ledger-live/commit/75d001910faa24bcb76c49eb66c0c49e9770f4b2) Thanks [@sarneijim](https://github.com/sarneijim)! - fix: fix swap crash in swap

- [#5490](https://github.com/LedgerHQ/ledger-live/pull/5490) [`39d327e`](https://github.com/LedgerHQ/ledger-live/commit/39d327ec4965bda6a8fb6f202238e3156451cfde) Thanks [@chabroA](https://github.com/chabroA)! - use-create-tx-in-wallet-api-adapter

- [#5350](https://github.com/LedgerHQ/ledger-live/pull/5350) [`342ed3b`](https://github.com/LedgerHQ/ledger-live/commit/342ed3b81613ca81790c1c3d6cfe639c8700562a) Thanks [@jdabbech-ledger](https://github.com/jdabbech-ledger)! - Fix UI issue on shutdown device during language pack install by whitelisting errors that retry polling

- [#5432](https://github.com/LedgerHQ/ledger-live/pull/5432) [`4d1aade`](https://github.com/LedgerHQ/ledger-live/commit/4d1aade53cd33f8e7548ce340f54fbb834bdcdcb) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: refactoring TransportStatusError

  Refactor into a real class in order to improve TS inference

- [#5613](https://github.com/LedgerHQ/ledger-live/pull/5613) [`eb5ac4d`](https://github.com/LedgerHQ/ledger-live/commit/eb5ac4dca430654f5f86854025fddddab4261a29) Thanks [@chabroA](https://github.com/chabroA)! - update near explorer views urls

- [#5633](https://github.com/LedgerHQ/ledger-live/pull/5633) [`cc56827`](https://github.com/LedgerHQ/ledger-live/commit/cc56827cc9682049a02d1360683ecdfd9460f4c9) Thanks [@chabroA](https://github.com/chabroA)! - add display of USDC staking rewards for dydx

- [#5466](https://github.com/LedgerHQ/ledger-live/pull/5466) [`88da01e`](https://github.com/LedgerHQ/ledger-live/commit/88da01e071a0332236b7fdeda619a0eb0284cec7) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - Fix issue on URL constructor when we use hook useCustomPath

- [#5604](https://github.com/LedgerHQ/ledger-live/pull/5604) [`c8172ab`](https://github.com/LedgerHQ/ledger-live/commit/c8172abc5c052a753b93be8b6c9cfd88ce0dd64a) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - add ptxSwapMoonpayProvider feature flag. Display moonpay quote in swap form and redirect to moonpay web app on moonpay quote selection.

- [#5596](https://github.com/LedgerHQ/ledger-live/pull/5596) [`88fc78a`](https://github.com/LedgerHQ/ledger-live/commit/88fc78a7c1a8fee9102b3c8c907372497425d143) Thanks [@sarneijim](https://github.com/sarneijim)! - Support new token exchange in wallet-api

- [#5138](https://github.com/LedgerHQ/ledger-live/pull/5138) [`9d35080`](https://github.com/LedgerHQ/ledger-live/commit/9d35080944a6a63c78f54a545734f4cf3cbded63) Thanks [@aussedatlo](https://github.com/aussedatlo)! - add low battery warning during early security check

- [#5566](https://github.com/LedgerHQ/ledger-live/pull/5566) [`2545442`](https://github.com/LedgerHQ/ledger-live/commit/25454425a7f80b551025513f1c2f1bdecb7cceeb) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: longer timer triggering an error when loading an image on Stax

- [#5594](https://github.com/LedgerHQ/ledger-live/pull/5594) [`124fbb3`](https://github.com/LedgerHQ/ledger-live/commit/124fbb349a67b2aad8f8cc8f102100ff6c7a3d8e) Thanks [@mle-gall](https://github.com/mle-gall)! - Fix - LLM - Fixed post onboarding not properly closed causing it to reopen.

- [#5588](https://github.com/LedgerHQ/ledger-live/pull/5588) [`95ce679`](https://github.com/LedgerHQ/ledger-live/commit/95ce679a9da4e72672903ee63167cca8eea7c910) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add missing account actions for Cardano on LLM + better typing on all families

- [#5438](https://github.com/LedgerHQ/ledger-live/pull/5438) [`6d62700`](https://github.com/LedgerHQ/ledger-live/commit/6d627002d76a81d68663e33cdcaeebcd89ea84d8) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: refactoring deprecated retryWhen

- [#5446](https://github.com/LedgerHQ/ledger-live/pull/5446) [`2b3ed02`](https://github.com/LedgerHQ/ledger-live/commit/2b3ed025d6988a4b7560522c209a5c9c1ca430a2) Thanks [@gre](https://github.com/gre)! - Rework the marketcap ordering of currencies using the new v3 countervalues API.

- [#5517](https://github.com/LedgerHQ/ledger-live/pull/5517) [`6dea540`](https://github.com/LedgerHQ/ledger-live/commit/6dea54057f67162a1f556661afae16e0422f7ac3) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Add isNew field to Feature_ProtectServicesDesktop and rename Ledger Recover to [L] Recover.

- Updated dependencies [[`1cb527b`](https://github.com/LedgerHQ/ledger-live/commit/1cb527b9a0b03f23a921a446c64f71ab5c9e9013), [`618307f`](https://github.com/LedgerHQ/ledger-live/commit/618307f92899af07f4c8ad97c67df483492e3d9d), [`0f5292a`](https://github.com/LedgerHQ/ledger-live/commit/0f5292af8feaa517f36ec35155d813b17c4f66e9), [`cf41c53`](https://github.com/LedgerHQ/ledger-live/commit/cf41c532caa5eb112d2bf3b85de8566e20f71ccb), [`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2), [`4d1aade`](https://github.com/LedgerHQ/ledger-live/commit/4d1aade53cd33f8e7548ce340f54fbb834bdcdcb), [`eb5ac4d`](https://github.com/LedgerHQ/ledger-live/commit/eb5ac4dca430654f5f86854025fddddab4261a29), [`9d35080`](https://github.com/LedgerHQ/ledger-live/commit/9d35080944a6a63c78f54a545734f4cf3cbded63), [`6dc1007`](https://github.com/LedgerHQ/ledger-live/commit/6dc100774010ad674001d04b531239f5adfdce7b), [`3adea7a`](https://github.com/LedgerHQ/ledger-live/commit/3adea7a7ad66080b5e6e4407071a976644158d04), [`2edfa53`](https://github.com/LedgerHQ/ledger-live/commit/2edfa533bccafbfd8a61aea0f5422c0db79825ea), [`be22d72`](https://github.com/LedgerHQ/ledger-live/commit/be22d724cf5499fe4958bfb3b5f763ffaf0d0446), [`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2), [`335ce83`](https://github.com/LedgerHQ/ledger-live/commit/335ce8366c8c997cdd77f191262a9dedee9888f6), [`e70e345`](https://github.com/LedgerHQ/ledger-live/commit/e70e345bd21d4f5c82fbedfd4447aec0e866be5a), [`ab1db96`](https://github.com/LedgerHQ/ledger-live/commit/ab1db965c25cd629bf384f7323f0b018309e4e66)]:
  - @ledgerhq/live-config@1.0.0-next.0
  - @ledgerhq/cryptoassets@11.3.0-next.0
  - @ledgerhq/coin-framework@0.10.0-next.0
  - @ledgerhq/live-env@0.8.0-next.0
  - @ledgerhq/coin-polkadot@0.5.0-next.0
  - @ledgerhq/hw-transport@6.30.1-next.0
  - @ledgerhq/errors@6.16.1-next.0
  - @ledgerhq/coin-evm@0.11.1-next.0
  - @ledgerhq/hw-app-vet@0.1.0-next.0
  - @ledgerhq/crypto-icons-ui@0.7.0-next.0
  - @ledgerhq/devices@8.2.0-next.0
  - @ledgerhq/coin-algorand@0.3.7-next.0
  - @ledgerhq/hw-app-eth@6.35.1-next.0
  - @ledgerhq/live-network@1.1.10-next.0
  - @ledgerhq/hw-app-algorand@6.28.1-next.0
  - @ledgerhq/hw-app-btc@10.1.1-next.0
  - @ledgerhq/hw-app-cosmos@6.29.1-next.0
  - @ledgerhq/hw-app-exchange@0.4.1-next.0
  - @ledgerhq/hw-app-near@6.28.1-next.0
  - @ledgerhq/hw-app-polkadot@6.28.1-next.0
  - @ledgerhq/hw-app-solana@7.1.1-next.0
  - @ledgerhq/hw-app-str@6.28.1-next.0
  - @ledgerhq/hw-app-tezos@6.28.1-next.0
  - @ledgerhq/hw-app-trx@6.28.1-next.0
  - @ledgerhq/hw-app-xrp@6.28.1-next.0
  - @ledgerhq/hw-transport-mocker@6.28.1-next.0
  - @ledgerhq/hw-transport-node-speculos@6.28.1-next.0
  - @ledgerhq/hw-transport-node-speculos-http@6.28.1-next.0

## 33.2.0

### Minor Changes

- [#4886](https://github.com/LedgerHQ/ledger-live/pull/4886) [`771c9d3c1d`](https://github.com/LedgerHQ/ledger-live/commit/771c9d3c1d138ddd68da2e4f9738e2c41ecaf81b) Thanks [@chabroA](https://github.com/chabroA)! - Add speedup / cancel tx feature for evm

- [#4819](https://github.com/LedgerHQ/ledger-live/pull/4819) [`c5981ae341`](https://github.com/LedgerHQ/ledger-live/commit/c5981ae3411abc4c8594adf2efcb52aacddac143) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support for casper blockchain

- [#5260](https://github.com/LedgerHQ/ledger-live/pull/5260) [`710fed08da`](https://github.com/LedgerHQ/ledger-live/commit/710fed08daf6d54727065657e9cb9feaa1a2e54a) Thanks [@KVNLS](https://github.com/KVNLS)! - Improve performances of sortByMarketcap function

- [#5359](https://github.com/LedgerHQ/ledger-live/pull/5359) [`133ad8f25e`](https://github.com/LedgerHQ/ledger-live/commit/133ad8f25e6b82d779bb5bc92d1ba34e7a65c0e8) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Move useBroadcast from LLD/LLM to live-common

### Patch Changes

- [#5482](https://github.com/LedgerHQ/ledger-live/pull/5482) [`a3ee4acfaa`](https://github.com/LedgerHQ/ledger-live/commit/a3ee4acfaa286c73916514f320451fa9d562d4fb) Thanks [@chabroA](https://github.com/chabroA)! - fix-wallet-api-undefined-nonce

- [#5252](https://github.com/LedgerHQ/ledger-live/pull/5252) [`48487abd29`](https://github.com/LedgerHQ/ledger-live/commit/48487abd297e41629c6725bc0ac9d69bfeaa74d3) Thanks [@ak-ledger](https://github.com/ak-ledger)! - Recover options/promotion remove for uncompatible devices

- [#5413](https://github.com/LedgerHQ/ledger-live/pull/5413) [`98739b2007`](https://github.com/LedgerHQ/ledger-live/commit/98739b2007ee33ad675881cd824056a41b2907f6) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: mocking RxJS timer in unit tests

  In order to not depend on real time during tests

- [#5292](https://github.com/LedgerHQ/ledger-live/pull/5292) [`08dde174fd`](https://github.com/LedgerHQ/ledger-live/commit/08dde174fdeaadbce85dcd914383839f788f21dd) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Lukso

- [#5523](https://github.com/LedgerHQ/ledger-live/pull/5523) [`b47113d7bb`](https://github.com/LedgerHQ/ledger-live/commit/b47113d7bbc42b06e85e4b5e6e247565ec6cd2cb) Thanks [@sarneijim](https://github.com/sarneijim)! - fix: fix swap crash in swap

- [#5392](https://github.com/LedgerHQ/ledger-live/pull/5392) [`f2e408d7a1`](https://github.com/LedgerHQ/ledger-live/commit/f2e408d7a1debf9bb4fcc9811999b2be3764059f) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix format param swap

- [#5367](https://github.com/LedgerHQ/ledger-live/pull/5367) [`a150321fc9`](https://github.com/LedgerHQ/ledger-live/commit/a150321fc90a5256144316ce20f071885065a6d9) Thanks [@RamyEB](https://github.com/RamyEB)! - Make searchable manifests visible in categories

- [#5391](https://github.com/LedgerHQ/ledger-live/pull/5391) [`1b72bebc07`](https://github.com/LedgerHQ/ledger-live/commit/1b72bebc07da1a5be6f16d1b329f5e26c30311f0) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix invalid recipient address messages wording

- [#5387](https://github.com/LedgerHQ/ledger-live/pull/5387) [`d53359ee99`](https://github.com/LedgerHQ/ledger-live/commit/d53359ee994d0f06b4c20b382ec471c2a38d02a8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add isWalletConnectSupported in live-common to be used in both platforms

- [#5486](https://github.com/LedgerHQ/ledger-live/pull/5486) [`4657a5ba87`](https://github.com/LedgerHQ/ledger-live/commit/4657a5ba87e6a237ae73c072e776ad55deb2fa02) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: race condition on exchange issue in PairDevices

  - Due to an incorrect usage of RxJS firstValueFrom
  - Also improve observability with tracing

- [#5333](https://github.com/LedgerHQ/ledger-live/pull/5333) [`3aef1832ea`](https://github.com/LedgerHQ/ledger-live/commit/3aef1832ea76ba32c999bee6e408251e7ecb0b3b) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix list apps v2 polyfill: don't use currencyId if there is no matching cryptocurrency

- [#5345](https://github.com/LedgerHQ/ledger-live/pull/5345) [`3122c64b07`](https://github.com/LedgerHQ/ledger-live/commit/3122c64b07177468016f2becaa036bc67c8743f5) Thanks [@ComradeAERGO](https://github.com/ComradeAERGO)! - fix: remoteLiveApp hook not returning filtered manifest

  This has an impact now that we return customized manifest when filtering we need to return this one in priority

- [#5070](https://github.com/LedgerHQ/ledger-live/pull/5070) [`a4299c5d62`](https://github.com/LedgerHQ/ledger-live/commit/a4299c5d629cd56e6e6795adaa14978ae2b90f42) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove walletConnectLiveApp featurFlag

- [#4987](https://github.com/LedgerHQ/ledger-live/pull/4987) [`e63205b850`](https://github.com/LedgerHQ/ledger-live/commit/e63205b85071538ed2431157a12818d7a8f0ffa9) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - add 10s timeout to estimate gas

- [#5326](https://github.com/LedgerHQ/ledger-live/pull/5326) [`da9e3cd1e6`](https://github.com/LedgerHQ/ledger-live/commit/da9e3cd1e6f3b9b8846260b552e18fde19e18b32) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Manage signature format expected for swap ng

- [#5315](https://github.com/LedgerHQ/ledger-live/pull/5315) [`19c7484663`](https://github.com/LedgerHQ/ledger-live/commit/19c7484663e9e1592b8b2024bee3cdbeb1853e0a) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Improve wording of "not found entity" error

- Updated dependencies [[`743e1ede3e`](https://github.com/LedgerHQ/ledger-live/commit/743e1ede3eebf806e1e22c8627191b419870a476), [`08dde174fd`](https://github.com/LedgerHQ/ledger-live/commit/08dde174fdeaadbce85dcd914383839f788f21dd), [`771c9d3c1d`](https://github.com/LedgerHQ/ledger-live/commit/771c9d3c1d138ddd68da2e4f9738e2c41ecaf81b), [`771c9d3c1d`](https://github.com/LedgerHQ/ledger-live/commit/771c9d3c1d138ddd68da2e4f9738e2c41ecaf81b), [`c5981ae341`](https://github.com/LedgerHQ/ledger-live/commit/c5981ae3411abc4c8594adf2efcb52aacddac143), [`de2e03534a`](https://github.com/LedgerHQ/ledger-live/commit/de2e03534ac831fcb66d1f038d0e90e7f65f2545), [`317685e696`](https://github.com/LedgerHQ/ledger-live/commit/317685e69678e6fe1f489f0c071e7613d329d389), [`b4e7201b0b`](https://github.com/LedgerHQ/ledger-live/commit/b4e7201b0b70d146de7d936ff2c9e9e443164243), [`e63205b850`](https://github.com/LedgerHQ/ledger-live/commit/e63205b85071538ed2431157a12818d7a8f0ffa9), [`5964e30bed`](https://github.com/LedgerHQ/ledger-live/commit/5964e30bed11d64a3b7401c6ab51ffc1ad4c427c), [`4a283060bf`](https://github.com/LedgerHQ/ledger-live/commit/4a283060bf2e837d73c6c1cb5d89f890a4e4b931)]:
  - @ledgerhq/coin-evm@0.11.0
  - @ledgerhq/cryptoassets@11.2.0
  - @ledgerhq/errors@6.16.0
  - @ledgerhq/coin-framework@0.9.0
  - @ledgerhq/live-env@0.7.0
  - @ledgerhq/coin-polkadot@0.4.6
  - @ledgerhq/hw-transport-node-speculos-http@6.28.0
  - @ledgerhq/hw-transport-node-speculos@6.28.0
  - @ledgerhq/hw-transport-mocker@6.28.0
  - @ledgerhq/hw-app-algorand@6.28.0
  - @ledgerhq/hw-app-exchange@0.4.0
  - @ledgerhq/hw-app-polkadot@6.28.0
  - @ledgerhq/hw-app-cosmos@6.29.0
  - @ledgerhq/hw-app-solana@7.1.0
  - @ledgerhq/hw-app-tezos@6.28.0
  - @ledgerhq/hw-transport@6.30.0
  - @ledgerhq/hw-app-near@6.28.0
  - @ledgerhq/hw-app-btc@10.1.0
  - @ledgerhq/hw-app-eth@6.35.0
  - @ledgerhq/hw-app-str@6.28.0
  - @ledgerhq/hw-app-trx@6.28.0
  - @ledgerhq/hw-app-xrp@6.28.0
  - @ledgerhq/devices@8.1.0
  - @ledgerhq/logs@6.12.0
  - @ledgerhq/coin-algorand@0.3.6
  - @ledgerhq/live-network@1.1.9
  - @ledgerhq/live-promise@0.0.3

## 33.2.0-next.4

### Patch Changes

- [#5523](https://github.com/LedgerHQ/ledger-live/pull/5523) [`b47113d7bb`](https://github.com/LedgerHQ/ledger-live/commit/b47113d7bbc42b06e85e4b5e6e247565ec6cd2cb) Thanks [@sarneijim](https://github.com/sarneijim)! - fix: fix swap crash in swap

## 33.2.0-next.3

### Patch Changes

- [#5486](https://github.com/LedgerHQ/ledger-live/pull/5486) [`4657a5ba87`](https://github.com/LedgerHQ/ledger-live/commit/4657a5ba87e6a237ae73c072e776ad55deb2fa02) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: race condition on exchange issue in PairDevices

  - Due to an incorrect usage of RxJS firstValueFrom
  - Also improve observability with tracing

## 33.2.0-next.2

### Patch Changes

- [#5482](https://github.com/LedgerHQ/ledger-live/pull/5482) [`a3ee4acfaa`](https://github.com/LedgerHQ/ledger-live/commit/a3ee4acfaa286c73916514f320451fa9d562d4fb) Thanks [@chabroA](https://github.com/chabroA)! - fix-wallet-api-undefined-nonce

## 33.2.0-next.1

### Patch Changes

- Updated dependencies [[`4a283060bf`](https://github.com/LedgerHQ/ledger-live/commit/4a283060bf2e837d73c6c1cb5d89f890a4e4b931)]:
  - @ledgerhq/cryptoassets@11.2.0-next.1
  - @ledgerhq/coin-algorand@0.3.6-next.1
  - @ledgerhq/coin-evm@0.11.0-next.1
  - @ledgerhq/coin-framework@0.9.0-next.1
  - @ledgerhq/coin-polkadot@0.4.6-next.1
  - @ledgerhq/hw-app-eth@6.35.0-next.1

## 33.2.0-next.0

### Minor Changes

- [#4886](https://github.com/LedgerHQ/ledger-live/pull/4886) [`771c9d3c1d`](https://github.com/LedgerHQ/ledger-live/commit/771c9d3c1d138ddd68da2e4f9738e2c41ecaf81b) Thanks [@chabroA](https://github.com/chabroA)! - Add speedup / cancel tx feature for evm

- [#4819](https://github.com/LedgerHQ/ledger-live/pull/4819) [`c5981ae341`](https://github.com/LedgerHQ/ledger-live/commit/c5981ae3411abc4c8594adf2efcb52aacddac143) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support for casper blockchain

- [#5260](https://github.com/LedgerHQ/ledger-live/pull/5260) [`710fed08da`](https://github.com/LedgerHQ/ledger-live/commit/710fed08daf6d54727065657e9cb9feaa1a2e54a) Thanks [@KVNLS](https://github.com/KVNLS)! - Improve performances of sortByMarketcap function

- [#5359](https://github.com/LedgerHQ/ledger-live/pull/5359) [`133ad8f25e`](https://github.com/LedgerHQ/ledger-live/commit/133ad8f25e6b82d779bb5bc92d1ba34e7a65c0e8) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Move useBroadcast from LLD/LLM to live-common

### Patch Changes

- [#5252](https://github.com/LedgerHQ/ledger-live/pull/5252) [`48487abd29`](https://github.com/LedgerHQ/ledger-live/commit/48487abd297e41629c6725bc0ac9d69bfeaa74d3) Thanks [@ak-ledger](https://github.com/ak-ledger)! - Recover options/promotion remove for uncompatible devices

- [#5413](https://github.com/LedgerHQ/ledger-live/pull/5413) [`98739b2007`](https://github.com/LedgerHQ/ledger-live/commit/98739b2007ee33ad675881cd824056a41b2907f6) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: mocking RxJS timer in unit tests

  In order to not depend on real time during tests

- [#5292](https://github.com/LedgerHQ/ledger-live/pull/5292) [`08dde174fd`](https://github.com/LedgerHQ/ledger-live/commit/08dde174fdeaadbce85dcd914383839f788f21dd) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Lukso

- [#5392](https://github.com/LedgerHQ/ledger-live/pull/5392) [`f2e408d7a1`](https://github.com/LedgerHQ/ledger-live/commit/f2e408d7a1debf9bb4fcc9811999b2be3764059f) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix format param swap

- [#5367](https://github.com/LedgerHQ/ledger-live/pull/5367) [`a150321fc9`](https://github.com/LedgerHQ/ledger-live/commit/a150321fc90a5256144316ce20f071885065a6d9) Thanks [@RamyEB](https://github.com/RamyEB)! - Make searchable manifests visible in categories

- [#5391](https://github.com/LedgerHQ/ledger-live/pull/5391) [`1b72bebc07`](https://github.com/LedgerHQ/ledger-live/commit/1b72bebc07da1a5be6f16d1b329f5e26c30311f0) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix invalid recipient address messages wording

- [#5387](https://github.com/LedgerHQ/ledger-live/pull/5387) [`d53359ee99`](https://github.com/LedgerHQ/ledger-live/commit/d53359ee994d0f06b4c20b382ec471c2a38d02a8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add isWalletConnectSupported in live-common to be used in both platforms

- [#5333](https://github.com/LedgerHQ/ledger-live/pull/5333) [`3aef1832ea`](https://github.com/LedgerHQ/ledger-live/commit/3aef1832ea76ba32c999bee6e408251e7ecb0b3b) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix list apps v2 polyfill: don't use currencyId if there is no matching cryptocurrency

- [#5345](https://github.com/LedgerHQ/ledger-live/pull/5345) [`3122c64b07`](https://github.com/LedgerHQ/ledger-live/commit/3122c64b07177468016f2becaa036bc67c8743f5) Thanks [@ComradeAERGO](https://github.com/ComradeAERGO)! - fix: remoteLiveApp hook not returning filtered manifest

  This has an impact now that we return customized manifest when filtering we need to return this one in priority

- [#5070](https://github.com/LedgerHQ/ledger-live/pull/5070) [`a4299c5d62`](https://github.com/LedgerHQ/ledger-live/commit/a4299c5d629cd56e6e6795adaa14978ae2b90f42) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove walletConnectLiveApp featurFlag

- [#4987](https://github.com/LedgerHQ/ledger-live/pull/4987) [`e63205b850`](https://github.com/LedgerHQ/ledger-live/commit/e63205b85071538ed2431157a12818d7a8f0ffa9) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - add 10s timeout to estimate gas

- [#5326](https://github.com/LedgerHQ/ledger-live/pull/5326) [`da9e3cd1e6`](https://github.com/LedgerHQ/ledger-live/commit/da9e3cd1e6f3b9b8846260b552e18fde19e18b32) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Manage signature format expected for swap ng

- [#5315](https://github.com/LedgerHQ/ledger-live/pull/5315) [`19c7484663`](https://github.com/LedgerHQ/ledger-live/commit/19c7484663e9e1592b8b2024bee3cdbeb1853e0a) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Improve wording of "not found entity" error

- Updated dependencies [[`743e1ede3e`](https://github.com/LedgerHQ/ledger-live/commit/743e1ede3eebf806e1e22c8627191b419870a476), [`08dde174fd`](https://github.com/LedgerHQ/ledger-live/commit/08dde174fdeaadbce85dcd914383839f788f21dd), [`771c9d3c1d`](https://github.com/LedgerHQ/ledger-live/commit/771c9d3c1d138ddd68da2e4f9738e2c41ecaf81b), [`771c9d3c1d`](https://github.com/LedgerHQ/ledger-live/commit/771c9d3c1d138ddd68da2e4f9738e2c41ecaf81b), [`c5981ae341`](https://github.com/LedgerHQ/ledger-live/commit/c5981ae3411abc4c8594adf2efcb52aacddac143), [`de2e03534a`](https://github.com/LedgerHQ/ledger-live/commit/de2e03534ac831fcb66d1f038d0e90e7f65f2545), [`317685e696`](https://github.com/LedgerHQ/ledger-live/commit/317685e69678e6fe1f489f0c071e7613d329d389), [`b4e7201b0b`](https://github.com/LedgerHQ/ledger-live/commit/b4e7201b0b70d146de7d936ff2c9e9e443164243), [`e63205b850`](https://github.com/LedgerHQ/ledger-live/commit/e63205b85071538ed2431157a12818d7a8f0ffa9), [`5964e30bed`](https://github.com/LedgerHQ/ledger-live/commit/5964e30bed11d64a3b7401c6ab51ffc1ad4c427c)]:
  - @ledgerhq/coin-evm@0.11.0-next.0
  - @ledgerhq/cryptoassets@11.2.0-next.0
  - @ledgerhq/errors@6.16.0-next.0
  - @ledgerhq/coin-framework@0.9.0-next.0
  - @ledgerhq/live-env@0.7.0-next.0
  - @ledgerhq/coin-polkadot@0.4.6-next.0
  - @ledgerhq/hw-transport-node-speculos-http@6.28.0-next.0
  - @ledgerhq/hw-transport-node-speculos@6.28.0-next.0
  - @ledgerhq/hw-transport-mocker@6.28.0-next.0
  - @ledgerhq/hw-app-algorand@6.28.0-next.0
  - @ledgerhq/hw-app-exchange@0.4.0-next.0
  - @ledgerhq/hw-app-polkadot@6.28.0-next.0
  - @ledgerhq/hw-app-cosmos@6.29.0-next.0
  - @ledgerhq/hw-app-solana@7.1.0-next.0
  - @ledgerhq/hw-app-tezos@6.28.0-next.0
  - @ledgerhq/hw-transport@6.30.0-next.0
  - @ledgerhq/hw-app-near@6.28.0-next.0
  - @ledgerhq/hw-app-btc@10.1.0-next.0
  - @ledgerhq/hw-app-eth@6.35.0-next.0
  - @ledgerhq/hw-app-str@6.28.0-next.0
  - @ledgerhq/hw-app-trx@6.28.0-next.0
  - @ledgerhq/hw-app-xrp@6.28.0-next.0
  - @ledgerhq/devices@8.1.0-next.0
  - @ledgerhq/logs@6.12.0-next.0
  - @ledgerhq/coin-algorand@0.3.6-next.0
  - @ledgerhq/live-network@1.1.9-next.0
  - @ledgerhq/live-promise@0.0.3-next.0

## 33.1.1

### Patch Changes

- [#5407](https://github.com/LedgerHQ/ledger-live/pull/5407) [`100f41a61f`](https://github.com/LedgerHQ/ledger-live/commit/100f41a61f5958e9ba1426ea0b8069c35ea94cb8) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fix format param swap

- [#5407](https://github.com/LedgerHQ/ledger-live/pull/5407) [`5ea4167efa`](https://github.com/LedgerHQ/ledger-live/commit/5ea4167efa81a0c8257db03e77e833280ece3feb) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - fix: remoteLiveApp hook not returning filtered manifest

  This has an impact now that we return customized manifest when filtering we need to return this one in priority

## 33.1.1-hotfix.1

### Patch Changes

- [#5407](https://github.com/LedgerHQ/ledger-live/pull/5407) [`5ea4167efa`](https://github.com/LedgerHQ/ledger-live/commit/5ea4167efa81a0c8257db03e77e833280ece3feb) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - fix: remoteLiveApp hook not returning filtered manifest

  This has an impact now that we return customized manifest when filtering we need to return this one in priority

## 33.1.1-hotfix.0

### Patch Changes

- [#5407](https://github.com/LedgerHQ/ledger-live/pull/5407) [`100f41a61f`](https://github.com/LedgerHQ/ledger-live/commit/100f41a61f5958e9ba1426ea0b8069c35ea94cb8) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fix format param swap

## 33.1.0

### Minor Changes

- [#5167](https://github.com/LedgerHQ/ledger-live/pull/5167) [`f5a5c315ea`](https://github.com/LedgerHQ/ledger-live/commit/f5a5c315ea2200cd5b52ef3a0b377d1327b1144e) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Integrate Dydx

- [#5173](https://github.com/LedgerHQ/ledger-live/pull/5173) [`17ba334e47`](https://github.com/LedgerHQ/ledger-live/commit/17ba334e47b901e34fbb083396aa3f9952e5233e) Thanks [@chabroA](https://github.com/chabroA)! - Add neon_evm support

- [#4815](https://github.com/LedgerHQ/ledger-live/pull/4815) [`5883eccc3b`](https://github.com/LedgerHQ/ledger-live/commit/5883eccc3b023c8c18615283a88fea08d705ef6a) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Update buy and sell service providers API endpoint; move logic to find if currency can be bought or sold into RampCatalogProvider and expose methods to get the list of providers or whether a given currency is supported; refactor to use ids instead of tickers.

- [#4954](https://github.com/LedgerHQ/ledger-live/pull/4954) [`3b2b2bf847`](https://github.com/LedgerHQ/ledger-live/commit/3b2b2bf847a7e9797b49f48fd31c23368c830a91) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Support new app-exchange version

- [#5194](https://github.com/LedgerHQ/ledger-live/pull/5194) [`e12ab4c986`](https://github.com/LedgerHQ/ledger-live/commit/e12ab4c9863f4c74a32d081637826d807aee7bcb) Thanks [@cng-ledger](https://github.com/cng-ledger)! - adding polkadot support to ledger live common

- [#4985](https://github.com/LedgerHQ/ledger-live/pull/4985) [`e9af8df166`](https://github.com/LedgerHQ/ledger-live/commit/e9af8df16658fbab689af98f4b6f7e5c21967802) Thanks [@Justkant](https://github.com/Justkant)! - feat(wallet-api): add custom handler support

- [#5022](https://github.com/LedgerHQ/ledger-live/pull/5022) [`18d4fb6077`](https://github.com/LedgerHQ/ledger-live/commit/18d4fb6077480fe68cbe215019c77fa21a17be48) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Add default blockHeight to Stellar account

- [#4919](https://github.com/LedgerHQ/ledger-live/pull/4919) [`4d6fa0772e`](https://github.com/LedgerHQ/ledger-live/commit/4d6fa0772e19cdbd4b432fafa43621c42e2a5fdd) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Change network error to better suit node flakiness

### Patch Changes

- [#5184](https://github.com/LedgerHQ/ledger-live/pull/5184) [`2ec5360679`](https://github.com/LedgerHQ/ledger-live/commit/2ec53606794c84a08fa49898c31ee976f3a8b9cc) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Fix networks not displaying for some tokens on receive screen

- [#5202](https://github.com/LedgerHQ/ledger-live/pull/5202) [`a40169babf`](https://github.com/LedgerHQ/ledger-live/commit/a40169babff5f5ea4938464326dd90bc7e0a8a4a) Thanks [@cng-ledger](https://github.com/cng-ledger)! - fix(LIVE-9962): update useAllAmount field when max toggle is interacted

- [#5027](https://github.com/LedgerHQ/ledger-live/pull/5027) [`3dc4937cc0`](https://github.com/LedgerHQ/ledger-live/commit/3dc4937cc0c77f6dc40ac7c628e9ab165dfb899f) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - Add specific deeplinks for useCase tutorial onboarding

- [#4289](https://github.com/LedgerHQ/ledger-live/pull/4289) [`29d9d40f11`](https://github.com/LedgerHQ/ledger-live/commit/29d9d40f11515de9502995349f2fd7fbd5cb8757) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Upgrade dev dependency react-native to 0.72.3

- [#4827](https://github.com/LedgerHQ/ledger-live/pull/4827) [`fc121ce96d`](https://github.com/LedgerHQ/ledger-live/commit/fc121ce96dbcc4f30cfd9836644f778b85f997b7) Thanks [@valpinkman](https://github.com/valpinkman)! - Update react to react 18

- [#4896](https://github.com/LedgerHQ/ledger-live/pull/4896) [`95cf52eb66`](https://github.com/LedgerHQ/ledger-live/commit/95cf52eb66769228feb45dd5e799c444e80c5072) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Feature flag listAppsV2 replaced by listAppsV2minor1
  Fix listApps v2 logic: adapt to breaking changes in the API and fix "polyfilling" logic of data of apps

- [#4999](https://github.com/LedgerHQ/ledger-live/pull/4999) [`da8617e08e`](https://github.com/LedgerHQ/ledger-live/commit/da8617e08e681a25b34b02ec489819df074e1e68) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Refactor FeatureFlagsProvider and take into account new signature of useFeature (can return null)

- [#5073](https://github.com/LedgerHQ/ledger-live/pull/5073) [`9d9f8bb5d2`](https://github.com/LedgerHQ/ledger-live/commit/9d9f8bb5d2b5dcf5d8223b15c7847c7261dade77) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix confirmation message for swap web app

- [#5155](https://github.com/LedgerHQ/ledger-live/pull/5155) [`3ce4f6e485`](https://github.com/LedgerHQ/ledger-live/commit/3ce4f6e485ac07c27e11def153cf2e3b656d5ab2) Thanks [@Justkant](https://github.com/Justkant)! - refactor: add missing types for the wallet-api CustomLogger

- [#4867](https://github.com/LedgerHQ/ledger-live/pull/4867) [`bf4c366b6f`](https://github.com/LedgerHQ/ledger-live/commit/bf4c366b6f5b062476645fe37ce62b3925822377) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - include smallest denomination in swap request

- [#5273](https://github.com/LedgerHQ/ledger-live/pull/5273) [`17a0822f95`](https://github.com/LedgerHQ/ledger-live/commit/17a0822f953a6fc57ed6732b881886b83cfa233b) Thanks [@sarneijim](https://github.com/sarneijim)! - Integrate ptxSwapLiveApp flag for each demo

- [#5114](https://github.com/LedgerHQ/ledger-live/pull/5114) [`38ea4700ff`](https://github.com/LedgerHQ/ledger-live/commit/38ea4700ff7ccf9c663c03b6deb21ac7c7a6fd28) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Correct hedera estimated fees to allow max spendable to work as intended

- [#5226](https://github.com/LedgerHQ/ledger-live/pull/5226) [`c3aea5b42d`](https://github.com/LedgerHQ/ledger-live/commit/c3aea5b42defc71ff381bcd0c3dbb7a9ea9332fe) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix min max limit in swap

- [#5222](https://github.com/LedgerHQ/ledger-live/pull/5222) [`22df6b230c`](https://github.com/LedgerHQ/ledger-live/commit/22df6b230c72d82d18375fb7ae7e8da599f41070) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - update injective icons

- [#5197](https://github.com/LedgerHQ/ledger-live/pull/5197) [`6b68e895fb`](https://github.com/LedgerHQ/ledger-live/commit/6b68e895fbee723a2426f7a956796cac31a45454) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - init swap live app from native swap

- [#5142](https://github.com/LedgerHQ/ledger-live/pull/5142) [`7968dfc551`](https://github.com/LedgerHQ/ledger-live/commit/7968dfc551acca00b7fabf00a726758d74be33de) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: wrong error when user tries to install apps when device is locked

  The bug was due to a wrong implementation of the rxjs operator `retry`.

  The `bot/engine.ts` retry mechanism has been updated too.

- [#5142](https://github.com/LedgerHQ/ledger-live/pull/5142) [`7968dfc551`](https://github.com/LedgerHQ/ledger-live/commit/7968dfc551acca00b7fabf00a726758d74be33de) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: disable retry mechanism on locked device errors for install app

- [#4999](https://github.com/LedgerHQ/ledger-live/pull/4999) [`da8617e08e`](https://github.com/LedgerHQ/ledger-live/commit/da8617e08e681a25b34b02ec489819df074e1e68) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix useFeature that was returning a default value instead of null even for unexisting feature flags

- [#5039](https://github.com/LedgerHQ/ledger-live/pull/5039) [`f52baa219e`](https://github.com/LedgerHQ/ledger-live/commit/f52baa219e1cd85fdb50d47f0c64e10e8533c926) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix WalletAPI fee strategy implementation

- [#4983](https://github.com/LedgerHQ/ledger-live/pull/4983) [`719047f16a`](https://github.com/LedgerHQ/ledger-live/commit/719047f16a69ee51945de539514ed491d07c49dd) Thanks [@aussedatlo](https://github.com/aussedatlo)! - add correct drawer when device is locked during pairing

- [#4884](https://github.com/LedgerHQ/ledger-live/pull/4884) [`df5c9ae02a`](https://github.com/LedgerHQ/ledger-live/commit/df5c9ae02a604ddba13ddc64caf8d9ad079c303d) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - Need to add other link firebase for quickAccess Recover

- [#4800](https://github.com/LedgerHQ/ledger-live/pull/4800) [`e63d3bbc2a`](https://github.com/LedgerHQ/ledger-live/commit/e63d3bbc2ad60411920cc4872d36fc11d1ae73d7) Thanks [@Justkant](https://github.com/Justkant)! - fix: platform-sdk & wallet-api onClose response in `account.request` & `message.sign`

- [#4709](https://github.com/LedgerHQ/ledger-live/pull/4709) [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: usage of new tracing system

  The tracing helps keeping a context (for ex a `job id`) that is propagated to other logs,
  creating a (simple) tracing span

- [#5232](https://github.com/LedgerHQ/ledger-live/pull/5232) [`f3b2e7d0eb`](https://github.com/LedgerHQ/ledger-live/commit/f3b2e7d0eb1413781fc45e27c690e73c1058fec6) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: ignore web socket messages coming from the HSM once a bulk message has been received

  - Added unit/snapshot case test on receiving a message after a bulk message
  - Enabled a blocker on exchange method on mocked TransportReplayer

- Updated dependencies [[`f5a5c315ea`](https://github.com/LedgerHQ/ledger-live/commit/f5a5c315ea2200cd5b52ef3a0b377d1327b1144e), [`173d7d6d22`](https://github.com/LedgerHQ/ledger-live/commit/173d7d6d224bcf1cecf364062b6571f52792e371), [`17ba334e47`](https://github.com/LedgerHQ/ledger-live/commit/17ba334e47b901e34fbb083396aa3f9952e5233e), [`2fc6d1efa0`](https://github.com/LedgerHQ/ledger-live/commit/2fc6d1efa0233a90b0fa273782cff1dd6344d52c), [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac), [`3b2b2bf847`](https://github.com/LedgerHQ/ledger-live/commit/3b2b2bf847a7e9797b49f48fd31c23368c830a91), [`f83e060bf4`](https://github.com/LedgerHQ/ledger-live/commit/f83e060bf474a6b6133406eff49cb054e813046f), [`7968dfc551`](https://github.com/LedgerHQ/ledger-live/commit/7968dfc551acca00b7fabf00a726758d74be33de), [`6b7fc5d071`](https://github.com/LedgerHQ/ledger-live/commit/6b7fc5d0711a83ed2fcacacd02795862a4a3bf1d), [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac), [`54b1d185c9`](https://github.com/LedgerHQ/ledger-live/commit/54b1d185c9df5ae84dc7e85d58249c06550df5f1), [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac), [`9b49ff233c`](https://github.com/LedgerHQ/ledger-live/commit/9b49ff233ccfad68c98d15cd648927dee12a8b0b), [`f3b2e7d0eb`](https://github.com/LedgerHQ/ledger-live/commit/f3b2e7d0eb1413781fc45e27c690e73c1058fec6), [`4d6fa0772e`](https://github.com/LedgerHQ/ledger-live/commit/4d6fa0772e19cdbd4b432fafa43621c42e2a5fdd)]:
  - @ledgerhq/cryptoassets@11.1.0
  - @ledgerhq/coin-evm@0.10.0
  - @ledgerhq/logs@6.11.0
  - @ledgerhq/hw-app-exchange@0.3.0
  - @ledgerhq/coin-framework@0.8.1
  - @ledgerhq/hw-transport-mocker@6.27.20
  - @ledgerhq/hw-transport@6.29.0
  - @ledgerhq/live-env@0.6.1
  - @ledgerhq/errors@6.15.0
  - @ledgerhq/coin-algorand@0.3.5
  - @ledgerhq/coin-polkadot@0.4.5
  - @ledgerhq/hw-app-eth@6.34.9
  - @ledgerhq/devices@8.0.8
  - @ledgerhq/hw-app-btc@10.0.9
  - @ledgerhq/hw-transport-node-speculos@6.27.20
  - @ledgerhq/hw-transport-node-speculos-http@6.27.20
  - @ledgerhq/live-network@1.1.8
  - @ledgerhq/live-promise@0.0.2
  - @ledgerhq/hw-app-algorand@6.27.20
  - @ledgerhq/hw-app-cosmos@6.28.6
  - @ledgerhq/hw-app-near@6.27.15
  - @ledgerhq/hw-app-polkadot@6.27.20
  - @ledgerhq/hw-app-solana@7.0.14
  - @ledgerhq/hw-app-str@6.27.20
  - @ledgerhq/hw-app-tezos@6.27.20
  - @ledgerhq/hw-app-trx@6.27.20
  - @ledgerhq/hw-app-xrp@6.27.20

## 33.1.0-next.0

### Minor Changes

- [#5167](https://github.com/LedgerHQ/ledger-live/pull/5167) [`f5a5c315ea`](https://github.com/LedgerHQ/ledger-live/commit/f5a5c315ea2200cd5b52ef3a0b377d1327b1144e) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Integrate Dydx

- [#5173](https://github.com/LedgerHQ/ledger-live/pull/5173) [`17ba334e47`](https://github.com/LedgerHQ/ledger-live/commit/17ba334e47b901e34fbb083396aa3f9952e5233e) Thanks [@chabroA](https://github.com/chabroA)! - Add neon_evm support

- [#4815](https://github.com/LedgerHQ/ledger-live/pull/4815) [`5883eccc3b`](https://github.com/LedgerHQ/ledger-live/commit/5883eccc3b023c8c18615283a88fea08d705ef6a) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Update buy and sell service providers API endpoint; move logic to find if currency can be bought or sold into RampCatalogProvider and expose methods to get the list of providers or whether a given currency is supported; refactor to use ids instead of tickers.

- [#4954](https://github.com/LedgerHQ/ledger-live/pull/4954) [`3b2b2bf847`](https://github.com/LedgerHQ/ledger-live/commit/3b2b2bf847a7e9797b49f48fd31c23368c830a91) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Support new app-exchange version

- [#5194](https://github.com/LedgerHQ/ledger-live/pull/5194) [`e12ab4c986`](https://github.com/LedgerHQ/ledger-live/commit/e12ab4c9863f4c74a32d081637826d807aee7bcb) Thanks [@cng-ledger](https://github.com/cng-ledger)! - adding polkadot support to ledger live common

- [#4985](https://github.com/LedgerHQ/ledger-live/pull/4985) [`e9af8df166`](https://github.com/LedgerHQ/ledger-live/commit/e9af8df16658fbab689af98f4b6f7e5c21967802) Thanks [@Justkant](https://github.com/Justkant)! - feat(wallet-api): add custom handler support

- [#5022](https://github.com/LedgerHQ/ledger-live/pull/5022) [`18d4fb6077`](https://github.com/LedgerHQ/ledger-live/commit/18d4fb6077480fe68cbe215019c77fa21a17be48) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Add default blockHeight to Stellar account

- [#4919](https://github.com/LedgerHQ/ledger-live/pull/4919) [`4d6fa0772e`](https://github.com/LedgerHQ/ledger-live/commit/4d6fa0772e19cdbd4b432fafa43621c42e2a5fdd) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Change network error to better suit node flakiness

### Patch Changes

- [#5184](https://github.com/LedgerHQ/ledger-live/pull/5184) [`2ec5360679`](https://github.com/LedgerHQ/ledger-live/commit/2ec53606794c84a08fa49898c31ee976f3a8b9cc) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Fix networks not displaying for some tokens on receive screen

- [#5202](https://github.com/LedgerHQ/ledger-live/pull/5202) [`a40169babf`](https://github.com/LedgerHQ/ledger-live/commit/a40169babff5f5ea4938464326dd90bc7e0a8a4a) Thanks [@cng-ledger](https://github.com/cng-ledger)! - fix(LIVE-9962): update useAllAmount field when max toggle is interacted

- [#5027](https://github.com/LedgerHQ/ledger-live/pull/5027) [`3dc4937cc0`](https://github.com/LedgerHQ/ledger-live/commit/3dc4937cc0c77f6dc40ac7c628e9ab165dfb899f) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - Add specific deeplinks for useCase tutorial onboarding

- [#4289](https://github.com/LedgerHQ/ledger-live/pull/4289) [`29d9d40f11`](https://github.com/LedgerHQ/ledger-live/commit/29d9d40f11515de9502995349f2fd7fbd5cb8757) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Upgrade dev dependency react-native to 0.72.3

- [#4827](https://github.com/LedgerHQ/ledger-live/pull/4827) [`fc121ce96d`](https://github.com/LedgerHQ/ledger-live/commit/fc121ce96dbcc4f30cfd9836644f778b85f997b7) Thanks [@valpinkman](https://github.com/valpinkman)! - Update react to react 18

- [#4896](https://github.com/LedgerHQ/ledger-live/pull/4896) [`95cf52eb66`](https://github.com/LedgerHQ/ledger-live/commit/95cf52eb66769228feb45dd5e799c444e80c5072) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Feature flag listAppsV2 replaced by listAppsV2minor1
  Fix listApps v2 logic: adapt to breaking changes in the API and fix "polyfilling" logic of data of apps

- [#4999](https://github.com/LedgerHQ/ledger-live/pull/4999) [`da8617e08e`](https://github.com/LedgerHQ/ledger-live/commit/da8617e08e681a25b34b02ec489819df074e1e68) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Refactor FeatureFlagsProvider and take into account new signature of useFeature (can return null)

- [#5073](https://github.com/LedgerHQ/ledger-live/pull/5073) [`9d9f8bb5d2`](https://github.com/LedgerHQ/ledger-live/commit/9d9f8bb5d2b5dcf5d8223b15c7847c7261dade77) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix confirmation message for swap web app

- [#5155](https://github.com/LedgerHQ/ledger-live/pull/5155) [`3ce4f6e485`](https://github.com/LedgerHQ/ledger-live/commit/3ce4f6e485ac07c27e11def153cf2e3b656d5ab2) Thanks [@Justkant](https://github.com/Justkant)! - refactor: add missing types for the wallet-api CustomLogger

- [#4867](https://github.com/LedgerHQ/ledger-live/pull/4867) [`bf4c366b6f`](https://github.com/LedgerHQ/ledger-live/commit/bf4c366b6f5b062476645fe37ce62b3925822377) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - include smallest denomination in swap request

- [#5273](https://github.com/LedgerHQ/ledger-live/pull/5273) [`17a0822f95`](https://github.com/LedgerHQ/ledger-live/commit/17a0822f953a6fc57ed6732b881886b83cfa233b) Thanks [@sarneijim](https://github.com/sarneijim)! - Integrate ptxSwapLiveApp flag for each demo

- [#5114](https://github.com/LedgerHQ/ledger-live/pull/5114) [`38ea4700ff`](https://github.com/LedgerHQ/ledger-live/commit/38ea4700ff7ccf9c663c03b6deb21ac7c7a6fd28) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Correct hedera estimated fees to allow max spendable to work as intended

- [#5226](https://github.com/LedgerHQ/ledger-live/pull/5226) [`c3aea5b42d`](https://github.com/LedgerHQ/ledger-live/commit/c3aea5b42defc71ff381bcd0c3dbb7a9ea9332fe) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix min max limit in swap

- [#5222](https://github.com/LedgerHQ/ledger-live/pull/5222) [`22df6b230c`](https://github.com/LedgerHQ/ledger-live/commit/22df6b230c72d82d18375fb7ae7e8da599f41070) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - update injective icons

- [#5197](https://github.com/LedgerHQ/ledger-live/pull/5197) [`6b68e895fb`](https://github.com/LedgerHQ/ledger-live/commit/6b68e895fbee723a2426f7a956796cac31a45454) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - init swap live app from native swap

- [#5142](https://github.com/LedgerHQ/ledger-live/pull/5142) [`7968dfc551`](https://github.com/LedgerHQ/ledger-live/commit/7968dfc551acca00b7fabf00a726758d74be33de) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: wrong error when user tries to install apps when device is locked

  The bug was due to a wrong implementation of the rxjs operator `retry`.

  The `bot/engine.ts` retry mechanism has been updated too.

- [#5142](https://github.com/LedgerHQ/ledger-live/pull/5142) [`7968dfc551`](https://github.com/LedgerHQ/ledger-live/commit/7968dfc551acca00b7fabf00a726758d74be33de) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: disable retry mechanism on locked device errors for install app

- [#4999](https://github.com/LedgerHQ/ledger-live/pull/4999) [`da8617e08e`](https://github.com/LedgerHQ/ledger-live/commit/da8617e08e681a25b34b02ec489819df074e1e68) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Fix useFeature that was returning a default value instead of null even for unexisting feature flags

- [#5039](https://github.com/LedgerHQ/ledger-live/pull/5039) [`f52baa219e`](https://github.com/LedgerHQ/ledger-live/commit/f52baa219e1cd85fdb50d47f0c64e10e8533c926) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix WalletAPI fee strategy implementation

- [#4983](https://github.com/LedgerHQ/ledger-live/pull/4983) [`719047f16a`](https://github.com/LedgerHQ/ledger-live/commit/719047f16a69ee51945de539514ed491d07c49dd) Thanks [@aussedatlo](https://github.com/aussedatlo)! - add correct drawer when device is locked during pairing

- [#4884](https://github.com/LedgerHQ/ledger-live/pull/4884) [`df5c9ae02a`](https://github.com/LedgerHQ/ledger-live/commit/df5c9ae02a604ddba13ddc64caf8d9ad079c303d) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - Need to add other link firebase for quickAccess Recover

- [#4800](https://github.com/LedgerHQ/ledger-live/pull/4800) [`e63d3bbc2a`](https://github.com/LedgerHQ/ledger-live/commit/e63d3bbc2ad60411920cc4872d36fc11d1ae73d7) Thanks [@Justkant](https://github.com/Justkant)! - fix: platform-sdk & wallet-api onClose response in `account.request` & `message.sign`

- [#4709](https://github.com/LedgerHQ/ledger-live/pull/4709) [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: usage of new tracing system

  The tracing helps keeping a context (for ex a `job id`) that is propagated to other logs,
  creating a (simple) tracing span

- [#5232](https://github.com/LedgerHQ/ledger-live/pull/5232) [`f3b2e7d0eb`](https://github.com/LedgerHQ/ledger-live/commit/f3b2e7d0eb1413781fc45e27c690e73c1058fec6) Thanks [@alexandremgo](https://github.com/alexandremgo)! - fix: ignore web socket messages coming from the HSM once a bulk message has been received

  - Added unit/snapshot case test on receiving a message after a bulk message
  - Enabled a blocker on exchange method on mocked TransportReplayer

- Updated dependencies [[`f5a5c315ea`](https://github.com/LedgerHQ/ledger-live/commit/f5a5c315ea2200cd5b52ef3a0b377d1327b1144e), [`173d7d6d22`](https://github.com/LedgerHQ/ledger-live/commit/173d7d6d224bcf1cecf364062b6571f52792e371), [`17ba334e47`](https://github.com/LedgerHQ/ledger-live/commit/17ba334e47b901e34fbb083396aa3f9952e5233e), [`2fc6d1efa0`](https://github.com/LedgerHQ/ledger-live/commit/2fc6d1efa0233a90b0fa273782cff1dd6344d52c), [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac), [`3b2b2bf847`](https://github.com/LedgerHQ/ledger-live/commit/3b2b2bf847a7e9797b49f48fd31c23368c830a91), [`f83e060bf4`](https://github.com/LedgerHQ/ledger-live/commit/f83e060bf474a6b6133406eff49cb054e813046f), [`7968dfc551`](https://github.com/LedgerHQ/ledger-live/commit/7968dfc551acca00b7fabf00a726758d74be33de), [`6b7fc5d071`](https://github.com/LedgerHQ/ledger-live/commit/6b7fc5d0711a83ed2fcacacd02795862a4a3bf1d), [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac), [`54b1d185c9`](https://github.com/LedgerHQ/ledger-live/commit/54b1d185c9df5ae84dc7e85d58249c06550df5f1), [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac), [`9b49ff233c`](https://github.com/LedgerHQ/ledger-live/commit/9b49ff233ccfad68c98d15cd648927dee12a8b0b), [`f3b2e7d0eb`](https://github.com/LedgerHQ/ledger-live/commit/f3b2e7d0eb1413781fc45e27c690e73c1058fec6), [`4d6fa0772e`](https://github.com/LedgerHQ/ledger-live/commit/4d6fa0772e19cdbd4b432fafa43621c42e2a5fdd)]:
  - @ledgerhq/cryptoassets@11.1.0-next.0
  - @ledgerhq/coin-evm@0.10.0-next.0
  - @ledgerhq/logs@6.11.0-next.0
  - @ledgerhq/hw-app-exchange@0.3.0-next.0
  - @ledgerhq/coin-framework@0.8.1-next.0
  - @ledgerhq/hw-transport-mocker@6.27.20-next.0
  - @ledgerhq/hw-transport@6.29.0-next.0
  - @ledgerhq/live-env@0.6.1-next.0
  - @ledgerhq/errors@6.15.0-next.0
  - @ledgerhq/coin-algorand@0.3.5-next.0
  - @ledgerhq/coin-polkadot@0.4.5-next.0
  - @ledgerhq/hw-app-eth@6.34.9-next.0
  - @ledgerhq/devices@8.0.8-next.0
  - @ledgerhq/hw-app-btc@10.0.9-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.20-next.0
  - @ledgerhq/hw-transport-node-speculos-http@6.27.20-next.0
  - @ledgerhq/live-network@1.1.8-next.0
  - @ledgerhq/live-promise@0.0.2-next.0
  - @ledgerhq/hw-app-algorand@6.27.20-next.0
  - @ledgerhq/hw-app-cosmos@6.28.6-next.0
  - @ledgerhq/hw-app-near@6.27.15-next.0
  - @ledgerhq/hw-app-polkadot@6.27.20-next.0
  - @ledgerhq/hw-app-solana@7.0.14-next.0
  - @ledgerhq/hw-app-str@6.27.20-next.0
  - @ledgerhq/hw-app-tezos@6.27.20-next.0
  - @ledgerhq/hw-app-trx@6.27.20-next.0
  - @ledgerhq/hw-app-xrp@6.27.20-next.0

## 33.0.1

### Patch Changes

- [#4895](https://github.com/LedgerHQ/ledger-live/pull/4895) [`ce18546c0a`](https://github.com/LedgerHQ/ledger-live/commit/ce18546c0a0b9dd5ed78b1745cac19b7eef7b5eb) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - feat(protect-2592): add other link on firebase for quick access recover

- [#5115](https://github.com/LedgerHQ/ledger-live/pull/5115) [`fbeebfe04b`](https://github.com/LedgerHQ/ledger-live/commit/fbeebfe04b297b33ec258440b694cdfb6213af24) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Adds another default case to the usePickDefaultCurrency hook when ETH or BTC are not available in the provided currencies for the swap.

- Updated dependencies [[`3b4f7501cc`](https://github.com/LedgerHQ/ledger-live/commit/3b4f7501cc5f09be94a2994f20f9998898682975), [`3b4f7501cc`](https://github.com/LedgerHQ/ledger-live/commit/3b4f7501cc5f09be94a2994f20f9998898682975), [`fbeebfe04b`](https://github.com/LedgerHQ/ledger-live/commit/fbeebfe04b297b33ec258440b694cdfb6213af24)]:
  - @ledgerhq/coin-evm@0.9.0
  - @ledgerhq/coin-framework@0.8.0
  - @ledgerhq/cryptoassets@11.0.1
  - @ledgerhq/coin-algorand@0.3.4
  - @ledgerhq/coin-polkadot@0.4.4
  - @ledgerhq/domain-service@1.1.13
  - @ledgerhq/hw-app-eth@6.34.8

## 33.0.1-hotfix.2

### Patch Changes

- [#5115](https://github.com/LedgerHQ/ledger-live/pull/5115) [`fbeebfe04b`](https://github.com/LedgerHQ/ledger-live/commit/fbeebfe04b297b33ec258440b694cdfb6213af24) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Adds another default case to the usePickDefaultCurrency hook when ETH or BTC are not available in the provided currencies for the swap.

- Updated dependencies [[`fbeebfe04b`](https://github.com/LedgerHQ/ledger-live/commit/fbeebfe04b297b33ec258440b694cdfb6213af24)]:
  - @ledgerhq/cryptoassets@11.0.1-hotfix.0
  - @ledgerhq/coin-algorand@0.3.4-hotfix.2
  - @ledgerhq/coin-evm@0.9.0-hotfix.2
  - @ledgerhq/coin-framework@0.8.0-hotfix.2
  - @ledgerhq/coin-polkadot@0.4.4-hotfix.2
  - @ledgerhq/domain-service@1.1.13-hotfix.1
  - @ledgerhq/hw-app-eth@6.34.8-hotfix.1

## 33.0.1-hotfix.1

### Patch Changes

- Updated dependencies [[`3b4f7501cc`](https://github.com/LedgerHQ/ledger-live/commit/3b4f7501cc5f09be94a2994f20f9998898682975), [`3b4f7501cc`](https://github.com/LedgerHQ/ledger-live/commit/3b4f7501cc5f09be94a2994f20f9998898682975)]:
  - @ledgerhq/coin-evm@0.9.0-hotfix.1
  - @ledgerhq/coin-framework@0.8.0-hotfix.1
  - @ledgerhq/coin-algorand@0.3.4-hotfix.1
  - @ledgerhq/coin-polkadot@0.4.4-hotfix.1

## 33.0.1-hotfix.0

### Patch Changes

- [#4895](https://github.com/LedgerHQ/ledger-live/pull/4895) [`ce18546c0a`](https://github.com/LedgerHQ/ledger-live/commit/ce18546c0a0b9dd5ed78b1745cac19b7eef7b5eb) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - feat(protect-2592): add other link on firebase for quick access recover

- Updated dependencies []:
  - @ledgerhq/coin-algorand@0.3.4-hotfix.0
  - @ledgerhq/coin-evm@0.8.1-hotfix.0
  - @ledgerhq/coin-framework@0.7.1-hotfix.0
  - @ledgerhq/coin-polkadot@0.4.4-hotfix.0
  - @ledgerhq/domain-service@1.1.13-hotfix.0
  - @ledgerhq/hw-app-eth@6.34.8-hotfix.0

## 33.0.0

### Major Changes

- [#4285](https://github.com/LedgerHQ/ledger-live/pull/4285) [`533278e2c4`](https://github.com/LedgerHQ/ledger-live/commit/533278e2c40ee764ecb87d4430fa6650f251ff0c) Thanks [@chabroA](https://github.com/chabroA)! - Migrate Ethereum family implementation to EVM family

  Replace the legcay Ethereum familly implementation that was present in ledger-live-common by the coin-evm lib implementation.
  This change was made in order to improve scalabillity and maintainability of the evm coins, as well as more easilly integrate new evm based chains in the future.

### Minor Changes

- [#4771](https://github.com/LedgerHQ/ledger-live/pull/4771) [`61a891b06f`](https://github.com/LedgerHQ/ledger-live/commit/61a891b06f9028f285f87c321487f691272a9172) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Force nano app min version

- [#4583](https://github.com/LedgerHQ/ledger-live/pull/4583) [`f527d1bb5a`](https://github.com/LedgerHQ/ledger-live/commit/f527d1bb5a2888a916f761d43d2ba5093eaa3e3f) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Integrate injective + gas rework

- [#4741](https://github.com/LedgerHQ/ledger-live/pull/4741) [`a134f28e9d`](https://github.com/LedgerHQ/ledger-live/commit/a134f28e9d220d172148619ed281d4ca897d5532) Thanks [@chabroA](https://github.com/chabroA)! - Add loading state to useGasOptions hook to be used by UI while gasOptions are being fetched

- [#4706](https://github.com/LedgerHQ/ledger-live/pull/4706) [`4dd486d87f`](https://github.com/LedgerHQ/ledger-live/commit/4dd486d87fea4c641cc4a21fc181c6097bab9d3d) Thanks [@Justkant](https://github.com/Justkant)! - feat: send LL version to the manifest-api

### Patch Changes

- [#4879](https://github.com/LedgerHQ/ledger-live/pull/4879) [`51857f5c20`](https://github.com/LedgerHQ/ledger-live/commit/51857f5c2016d435fa970fac899aa906e3f97722) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Remove old obsolete hack on Tezos gas limit

- [#4615](https://github.com/LedgerHQ/ledger-live/pull/4615) [`cf2f585659`](https://github.com/LedgerHQ/ledger-live/commit/cf2f58565937b2a695ac7ff7d225cdbb6e598039) Thanks [@sarneijim](https://github.com/sarneijim)! - Save swap history wallet api exchange

- [#4699](https://github.com/LedgerHQ/ledger-live/pull/4699) [`b21de593ee`](https://github.com/LedgerHQ/ledger-live/commit/b21de593ee705ece38fc812eedb9bf85694e94cb) Thanks [@chabroA](https://github.com/chabroA)! - fix wallet-api complete exchange logic

- [#4648](https://github.com/LedgerHQ/ledger-live/pull/4648) [`8b09b0b571`](https://github.com/LedgerHQ/ledger-live/commit/8b09b0b5717a47aedae5a8a80acf6d077af3b40b) Thanks [@cksanders](https://github.com/cksanders)! - Update multibuy manifest to v2 to ensure full backwards compatibility

- [#4533](https://github.com/LedgerHQ/ledger-live/pull/4533) [`70e4277bc9`](https://github.com/LedgerHQ/ledger-live/commit/70e4277bc9dda253b894bdae5f2c8a5f43a9a64e) Thanks [@sshmaxime](https://github.com/sshmaxime)! - Typed useFeature hook

- Updated dependencies [[`c86637f6e5`](https://github.com/LedgerHQ/ledger-live/commit/c86637f6e57845716a791854dd8f686807152e73), [`72288402ec`](https://github.com/LedgerHQ/ledger-live/commit/72288402ec70f9159022505cb3187e63b24df450), [`f527d1bb5a`](https://github.com/LedgerHQ/ledger-live/commit/f527d1bb5a2888a916f761d43d2ba5093eaa3e3f), [`a134f28e9d`](https://github.com/LedgerHQ/ledger-live/commit/a134f28e9d220d172148619ed281d4ca897d5532), [`4cb507a52b`](https://github.com/LedgerHQ/ledger-live/commit/4cb507a52bf336d395b08b4c1a429bd4956ab22d), [`a134f28e9d`](https://github.com/LedgerHQ/ledger-live/commit/a134f28e9d220d172148619ed281d4ca897d5532), [`49ea3fd98b`](https://github.com/LedgerHQ/ledger-live/commit/49ea3fd98ba1e1e0ed54d29ab5fdc71c4918183f), [`b779f6c964`](https://github.com/LedgerHQ/ledger-live/commit/b779f6c964079b9cd9a4ee985cd5cdbb8c49406e), [`533278e2c4`](https://github.com/LedgerHQ/ledger-live/commit/533278e2c40ee764ecb87d4430fa6650f251ff0c)]:
  - @ledgerhq/hw-app-eth@6.34.7
  - @ledgerhq/cryptoassets@11.0.0
  - @ledgerhq/coin-evm@0.8.0
  - @ledgerhq/coin-framework@0.7.0
  - @ledgerhq/live-env@0.6.0
  - @ledgerhq/coin-algorand@0.3.3
  - @ledgerhq/coin-polkadot@0.4.3
  - @ledgerhq/domain-service@1.1.12
  - @ledgerhq/live-network@1.1.7

## 32.1.0-next.0

### Minor Changes

- [#4771](https://github.com/LedgerHQ/ledger-live/pull/4771) [`61a891b06f`](https://github.com/LedgerHQ/ledger-live/commit/61a891b06f9028f285f87c321487f691272a9172) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Force nano app min version

## 31.8.0

### Minor Changes

- [#4846](https://github.com/LedgerHQ/ledger-live/pull/4846) [`61272164de`](https://github.com/LedgerHQ/ledger-live/commit/61272164de6e81d9b5e5ad988b7eb8c40d3cf735) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Force min app cosmos version to 2.34.12

- [#4851](https://github.com/LedgerHQ/ledger-live/pull/4851) [`6c83521fee`](https://github.com/LedgerHQ/ledger-live/commit/6c83521fee8da656858630c1cb37a5af95df3362) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Integrate injective + gas rework

### Patch Changes

- Updated dependencies [[`6c83521fee`](https://github.com/LedgerHQ/ledger-live/commit/6c83521fee8da656858630c1cb37a5af95df3362)]:
  - @ledgerhq/cryptoassets@9.13.0
  - @ledgerhq/coin-algorand@0.3.2
  - @ledgerhq/coin-evm@0.6.2
  - @ledgerhq/coin-framework@0.5.4
  - @ledgerhq/coin-polkadot@0.4.2
  - @ledgerhq/domain-service@1.1.11
  - @ledgerhq/evm-tools@1.0.7
  - @ledgerhq/hw-app-eth@6.34.6

## 31.7.0

### Minor Changes

- [#4476](https://github.com/LedgerHQ/ledger-live/pull/4476) [`b2e8c1053e`](https://github.com/LedgerHQ/ledger-live/commit/b2e8c1053e57c763575c9c4d77d1daca8ef566fe) Thanks [@KVNLS](https://github.com/KVNLS)! - Add modelId and modelIdList in meta object when we do an export with the qrcode

### Patch Changes

- [#4510](https://github.com/LedgerHQ/ledger-live/pull/4510) [`e0cc3a0841`](https://github.com/LedgerHQ/ledger-live/commit/e0cc3a08415de84b9d3ce828444248a043a9d699) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix cosmos family bot

- [#4578](https://github.com/LedgerHQ/ledger-live/pull/4578) [`18b4a47b48`](https://github.com/LedgerHQ/ledger-live/commit/18b4a47b4878a23695a50096b7770134883b8a2e) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix elrond bot tests

- [#4174](https://github.com/LedgerHQ/ledger-live/pull/4174) [`5d20c326a0`](https://github.com/LedgerHQ/ledger-live/commit/5d20c326a038a430a38f28815ba65af71152118b) Thanks [@sarneijim](https://github.com/sarneijim)! - Support customFees in swap web app mode

- [#4528](https://github.com/LedgerHQ/ledger-live/pull/4528) [`1c6deb2336`](https://github.com/LedgerHQ/ledger-live/commit/1c6deb2336a8b76517cc4d367f76dca24f9228dc) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Fix regression when serializing cosmos operation extra

- [#4534](https://github.com/LedgerHQ/ledger-live/pull/4534) [`3ec5739f8a`](https://github.com/LedgerHQ/ledger-live/commit/3ec5739f8a4e3ff81da468cd91036b7b271dfd06) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Add useAPI hook and useFetch hooks for swap v5

- [#4540](https://github.com/LedgerHQ/ledger-live/pull/4540) [`bfd4fef405`](https://github.com/LedgerHQ/ledger-live/commit/bfd4fef405f832489cc5258330e6483260c896d2) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Hardcode Ledger validator details for Solana

- Updated dependencies [[`e0cc3a0841`](https://github.com/LedgerHQ/ledger-live/commit/e0cc3a08415de84b9d3ce828444248a043a9d699), [`18b4a47b48`](https://github.com/LedgerHQ/ledger-live/commit/18b4a47b4878a23695a50096b7770134883b8a2e)]:
  - @ledgerhq/coin-framework@0.5.3
  - @ledgerhq/cryptoassets@9.12.1
  - @ledgerhq/coin-algorand@0.3.1
  - @ledgerhq/coin-evm@0.6.1
  - @ledgerhq/coin-polkadot@0.4.1
  - @ledgerhq/domain-service@1.1.10
  - @ledgerhq/evm-tools@1.0.6
  - @ledgerhq/hw-app-eth@6.34.5

## 31.6.0

### Minor Changes

- [#4235](https://github.com/LedgerHQ/ledger-live/pull/4235) [`8e9df43a0c`](https://github.com/LedgerHQ/ledger-live/commit/8e9df43a0cd00a2065b494439f300f96724b8eb8) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Better typing for the Operation.extra field

- [#4248](https://github.com/LedgerHQ/ledger-live/pull/4248) [`d031e69737`](https://github.com/LedgerHQ/ledger-live/commit/d031e69737ac4b4d00890de477408dfa4870faf7) Thanks [@bantalon](https://github.com/bantalon)! - Crypto Icons - Add PYUSD token icon

- [#4212](https://github.com/LedgerHQ/ledger-live/pull/4212) [`9154178962`](https://github.com/LedgerHQ/ledger-live/commit/9154178962b68ef974831ebff36d39d2e27d15e2) Thanks [@cksanders](https://github.com/cksanders)! - - Update WebPTXPlayer to load correct manifest

  - Remove unused LL BUY/SELL in favour of BUY/SELL Live App

- [#4364](https://github.com/LedgerHQ/ledger-live/pull/4364) [`a4648d5c78`](https://github.com/LedgerHQ/ledger-live/commit/a4648d5c78e21989c9d5a3de7c7df80e05672eef) Thanks [@AlexandruPislariu](https://github.com/AlexandruPislariu)! - Fixed improper minimum staking balance calculation.

- [#4207](https://github.com/LedgerHQ/ledger-live/pull/4207) [`f3f4745b20`](https://github.com/LedgerHQ/ledger-live/commit/f3f4745b20261b877a938a897b5ad24291fca8aa) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Filter on currency and disabled currencies on bot runs

### Patch Changes

- [#3890](https://github.com/LedgerHQ/ledger-live/pull/3890) [`b238109174`](https://github.com/LedgerHQ/ledger-live/commit/b238109174ab3cad39f9531639b32bf3778abc72) Thanks [@Sheng-Long](https://github.com/Sheng-Long)! - Fix how hedera hashes are encoded

- [#4391](https://github.com/LedgerHQ/ledger-live/pull/4391) [`fde2fe79f1`](https://github.com/LedgerHQ/ledger-live/commit/fde2fe79f1df69fffe80763cd6d9792fe9de1262) Thanks [@valpinkman](https://github.com/valpinkman)! - Rework some env typings

- [#4360](https://github.com/LedgerHQ/ledger-live/pull/4360) [`2f73df6545`](https://github.com/LedgerHQ/ledger-live/commit/2f73df65457c16cceb632a9c745e4c20a6ae4934) Thanks [@Justkant](https://github.com/Justkant)! - fix(wallet-api): missing new on error constructor

- [#4402](https://github.com/LedgerHQ/ledger-live/pull/4402) [`032b68731f`](https://github.com/LedgerHQ/ledger-live/commit/032b68731f29a4faad2c84a51bda588507ccf45d) Thanks [@lawRathod](https://github.com/lawRathod)! - Fix unknown txn on stacks

- [#4169](https://github.com/LedgerHQ/ledger-live/pull/4169) [`75ef6eb224`](https://github.com/LedgerHQ/ledger-live/commit/75ef6eb2240901a049fb11724760642b891c333a) Thanks [@gre](https://github.com/gre)! - Export Event type from 'app' device actions

- [#4429](https://github.com/LedgerHQ/ledger-live/pull/4429) [`7002c6c8f9`](https://github.com/LedgerHQ/ledger-live/commit/7002c6c8f9bcbc5c2387cb064f218c5e27c70315) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - update coreum staking doc url

- [#4281](https://github.com/LedgerHQ/ledger-live/pull/4281) [`88846cc39d`](https://github.com/LedgerHQ/ledger-live/commit/88846cc39d053726800aabb435b04dc299c4c485) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix cosmos amount string parser

- [#4256](https://github.com/LedgerHQ/ledger-live/pull/4256) [`f6f70ba0e8`](https://github.com/LedgerHQ/ledger-live/commit/f6f70ba0e85c7898cdeec19402b1eadfde6a2206) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - added implementation only for /currencies/to endpoint on swap

- [#4391](https://github.com/LedgerHQ/ledger-live/pull/4391) [`1b4321f363`](https://github.com/LedgerHQ/ledger-live/commit/1b4321f363b1e2c93e2406dd327cd4d1def7b458) Thanks [@valpinkman](https://github.com/valpinkman)! - remove env.ts and it's refence in favor of @ledgerhq/live-env

- [#3887](https://github.com/LedgerHQ/ledger-live/pull/3887) [`f19f0b3b1e`](https://github.com/LedgerHQ/ledger-live/commit/f19f0b3b1ed57f1f4dc718fa2cdccb45a42c2ab5) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: returns a function to reset states of useOnboardingStatePolling hook

- [#4152](https://github.com/LedgerHQ/ledger-live/pull/4152) [`7415ca2a67`](https://github.com/LedgerHQ/ledger-live/commit/7415ca2a67308d914a58d744bcaef47c48fae074) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix: battery check command logic

  The battery check command was updating and keeping (to a lower value) the unresponsive timeout due
  to race conditions. It was creating incorrect locked device errors.

- [#4548](https://github.com/LedgerHQ/ledger-live/pull/4548) [`de641a013f`](https://github.com/LedgerHQ/ledger-live/commit/de641a013fc8c4bb6897624d306f2a34339691d0) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Hardcode Ledger validator details for Solana

- [#3887](https://github.com/LedgerHQ/ledger-live/pull/3887) [`f19f0b3b1e`](https://github.com/LedgerHQ/ledger-live/commit/f19f0b3b1ed57f1f4dc718fa2cdccb45a42c2ab5) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Slight change to the hook API on the getDeviceInfo action (make dependency injection of the action optional on TypeScript)

- [#4426](https://github.com/LedgerHQ/ledger-live/pull/4426) [`2bec4b7f08`](https://github.com/LedgerHQ/ledger-live/commit/2bec4b7f080d6dc9a6b22805c0fa317ff55c7202) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Custom lockscreen errors: replace ImageMetadataLoadingError by 2 errors: ImageSizeLoadingError, NFTMetadataLoadingError

- [#3928](https://github.com/LedgerHQ/ledger-live/pull/3928) [`45be23c776`](https://github.com/LedgerHQ/ledger-live/commit/45be23c77666697dbe395f836ab592062173d5cb) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Introduce new hook for Mapped Assets and Group Assets by provider

- [#4317](https://github.com/LedgerHQ/ledger-live/pull/4317) [`3f36af3127`](https://github.com/LedgerHQ/ledger-live/commit/3f36af31273aba263b79b3f161599ac089cfc6e7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - LLC - Remove Implementation and legacy code for WalletConnect

- [#4271](https://github.com/LedgerHQ/ledger-live/pull/4271) [`4cb6add5d9`](https://github.com/LedgerHQ/ledger-live/commit/4cb6add5d991e24acebac8b59549ced40ee1a19d) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Add implementation only of /v5/currencies/all endpoint in swap

- [#4353](https://github.com/LedgerHQ/ledger-live/pull/4353) [`0d9ad3599b`](https://github.com/LedgerHQ/ledger-live/commit/0d9ad3599bce8872fde97d27c977ab24445afc3a) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - add evm mock test

- [#4258](https://github.com/LedgerHQ/ledger-live/pull/4258) [`e8a7bc5378`](https://github.com/LedgerHQ/ledger-live/commit/e8a7bc537898ef58ab312097860bae1d27999a81) Thanks [@cng-ledger](https://github.com/cng-ledger)! - feat(LIVE-8241): implement call to v5 /currencies/from endpoint for swap

- [#4451](https://github.com/LedgerHQ/ledger-live/pull/4451) [`87a0a8b0dc`](https://github.com/LedgerHQ/ledger-live/commit/87a0a8b0dce2d36a34541f890697b4ffba258382) Thanks [@Justkant](https://github.com/Justkant)! - fix: recover restore and onboarding issues

  Fix desktop LNX onboarding back when coming from recover
  Skip genuine check when coming from recover to restore the device (it would be better to allow unseeded device on the genuine check screen instead)
  Send the deviceId to the recover app in order to avoid multiple device selection during the restore process
  Update the podfile to config the build settings with ccache support (You might need to check https://stackoverflow.com/a/70189990 for ccache to work correctly when building with xcode)
  Cleanup old RecoverStaxFlow screen
  Patch react-native-webview to add support for `allowsUnsecureHttps`
  Added `IGNORE_CERTIFICATE_ERRORS=1` to use `allowsUnsecureHttps` in the webview in dev same as for LLD
  Added `protect-local` & `protect-local-dev` manifest support in dev
  Update wallet-api dependencies

- [#4269](https://github.com/LedgerHQ/ledger-live/pull/4269) [`f7ab71db0e`](https://github.com/LedgerHQ/ledger-live/commit/f7ab71db0eaeb5c69a7c7b9aeed755f17c872797) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLC - added an amount property to the feature_referral_program_desktop_sidebar feature flag

- Updated dependencies [[`8e9df43a0c`](https://github.com/LedgerHQ/ledger-live/commit/8e9df43a0cd00a2065b494439f300f96724b8eb8), [`fde2fe79f1`](https://github.com/LedgerHQ/ledger-live/commit/fde2fe79f1df69fffe80763cd6d9792fe9de1262), [`f6f70ba0e8`](https://github.com/LedgerHQ/ledger-live/commit/f6f70ba0e85c7898cdeec19402b1eadfde6a2206), [`45be23c776`](https://github.com/LedgerHQ/ledger-live/commit/45be23c77666697dbe395f836ab592062173d5cb), [`1020f27632`](https://github.com/LedgerHQ/ledger-live/commit/1020f276322fe361585a56573091ec647fbd901e), [`6375c250a9`](https://github.com/LedgerHQ/ledger-live/commit/6375c250a9a58b33e3dd1d6c96a96c7e46150298), [`0d9ad3599b`](https://github.com/LedgerHQ/ledger-live/commit/0d9ad3599bce8872fde97d27c977ab24445afc3a), [`707e59f8b5`](https://github.com/LedgerHQ/ledger-live/commit/707e59f8b516448e6f2845288ad4cb3f5488e688)]:
  - @ledgerhq/coin-algorand@0.3.0
  - @ledgerhq/coin-polkadot@0.4.0
  - @ledgerhq/coin-evm@0.6.0
  - @ledgerhq/live-env@0.5.0
  - @ledgerhq/coin-framework@0.5.2
  - @ledgerhq/cryptoassets@9.12.0
  - @ledgerhq/domain-service@1.1.9
  - @ledgerhq/evm-tools@1.0.5
  - @ledgerhq/hw-app-eth@6.34.4
  - @ledgerhq/live-network@1.1.6

## 31.6.0-next.1

### Patch Changes

- [#4548](https://github.com/LedgerHQ/ledger-live/pull/4548) [`de641a013f`](https://github.com/LedgerHQ/ledger-live/commit/de641a013fc8c4bb6897624d306f2a34339691d0) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Hardcode Ledger validator details for Solana

## 31.6.0-next.0

### Minor Changes

- [#4235](https://github.com/LedgerHQ/ledger-live/pull/4235) [`8e9df43a0c`](https://github.com/LedgerHQ/ledger-live/commit/8e9df43a0cd00a2065b494439f300f96724b8eb8) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Better typing for the Operation.extra field

- [#4248](https://github.com/LedgerHQ/ledger-live/pull/4248) [`d031e69737`](https://github.com/LedgerHQ/ledger-live/commit/d031e69737ac4b4d00890de477408dfa4870faf7) Thanks [@bantalon](https://github.com/bantalon)! - Crypto Icons - Add PYUSD token icon

- [#4212](https://github.com/LedgerHQ/ledger-live/pull/4212) [`9154178962`](https://github.com/LedgerHQ/ledger-live/commit/9154178962b68ef974831ebff36d39d2e27d15e2) Thanks [@cksanders](https://github.com/cksanders)! - - Update WebPTXPlayer to load correct manifest

  - Remove unused LL BUY/SELL in favour of BUY/SELL Live App

- [#4364](https://github.com/LedgerHQ/ledger-live/pull/4364) [`a4648d5c78`](https://github.com/LedgerHQ/ledger-live/commit/a4648d5c78e21989c9d5a3de7c7df80e05672eef) Thanks [@AlexandruPislariu](https://github.com/AlexandruPislariu)! - Fixed improper minimum staking balance calculation.

- [#4207](https://github.com/LedgerHQ/ledger-live/pull/4207) [`f3f4745b20`](https://github.com/LedgerHQ/ledger-live/commit/f3f4745b20261b877a938a897b5ad24291fca8aa) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Filter on currency and disabled currencies on bot runs

### Patch Changes

- [#3890](https://github.com/LedgerHQ/ledger-live/pull/3890) [`b238109174`](https://github.com/LedgerHQ/ledger-live/commit/b238109174ab3cad39f9531639b32bf3778abc72) Thanks [@Sheng-Long](https://github.com/Sheng-Long)! - Fix how hedera hashes are encoded

- [#4391](https://github.com/LedgerHQ/ledger-live/pull/4391) [`fde2fe79f1`](https://github.com/LedgerHQ/ledger-live/commit/fde2fe79f1df69fffe80763cd6d9792fe9de1262) Thanks [@valpinkman](https://github.com/valpinkman)! - Rework some env typings

- [#4360](https://github.com/LedgerHQ/ledger-live/pull/4360) [`2f73df6545`](https://github.com/LedgerHQ/ledger-live/commit/2f73df65457c16cceb632a9c745e4c20a6ae4934) Thanks [@Justkant](https://github.com/Justkant)! - fix(wallet-api): missing new on error constructor

- [#4402](https://github.com/LedgerHQ/ledger-live/pull/4402) [`032b68731f`](https://github.com/LedgerHQ/ledger-live/commit/032b68731f29a4faad2c84a51bda588507ccf45d) Thanks [@lawRathod](https://github.com/lawRathod)! - Fix unknown txn on stacks

- [#4169](https://github.com/LedgerHQ/ledger-live/pull/4169) [`75ef6eb224`](https://github.com/LedgerHQ/ledger-live/commit/75ef6eb2240901a049fb11724760642b891c333a) Thanks [@gre](https://github.com/gre)! - Export Event type from 'app' device actions

- [#4429](https://github.com/LedgerHQ/ledger-live/pull/4429) [`7002c6c8f9`](https://github.com/LedgerHQ/ledger-live/commit/7002c6c8f9bcbc5c2387cb064f218c5e27c70315) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - update coreum staking doc url

- [#4281](https://github.com/LedgerHQ/ledger-live/pull/4281) [`88846cc39d`](https://github.com/LedgerHQ/ledger-live/commit/88846cc39d053726800aabb435b04dc299c4c485) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix cosmos amount string parser

- [#4256](https://github.com/LedgerHQ/ledger-live/pull/4256) [`f6f70ba0e8`](https://github.com/LedgerHQ/ledger-live/commit/f6f70ba0e85c7898cdeec19402b1eadfde6a2206) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - added implementation only for /currencies/to endpoint on swap

- [#4391](https://github.com/LedgerHQ/ledger-live/pull/4391) [`1b4321f363`](https://github.com/LedgerHQ/ledger-live/commit/1b4321f363b1e2c93e2406dd327cd4d1def7b458) Thanks [@valpinkman](https://github.com/valpinkman)! - remove env.ts and it's refence in favor of @ledgerhq/live-env

- [#3887](https://github.com/LedgerHQ/ledger-live/pull/3887) [`f19f0b3b1e`](https://github.com/LedgerHQ/ledger-live/commit/f19f0b3b1ed57f1f4dc718fa2cdccb45a42c2ab5) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: returns a function to reset states of useOnboardingStatePolling hook

- [#4152](https://github.com/LedgerHQ/ledger-live/pull/4152) [`7415ca2a67`](https://github.com/LedgerHQ/ledger-live/commit/7415ca2a67308d914a58d744bcaef47c48fae074) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix: battery check command logic

  The battery check command was updating and keeping (to a lower value) the unresponsive timeout due
  to race conditions. It was creating incorrect locked device errors.

- [#3887](https://github.com/LedgerHQ/ledger-live/pull/3887) [`f19f0b3b1e`](https://github.com/LedgerHQ/ledger-live/commit/f19f0b3b1ed57f1f4dc718fa2cdccb45a42c2ab5) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Slight change to the hook API on the getDeviceInfo action (make dependency injection of the action optional on TypeScript)

- [#4426](https://github.com/LedgerHQ/ledger-live/pull/4426) [`2bec4b7f08`](https://github.com/LedgerHQ/ledger-live/commit/2bec4b7f080d6dc9a6b22805c0fa317ff55c7202) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Custom lockscreen errors: replace ImageMetadataLoadingError by 2 errors: ImageSizeLoadingError, NFTMetadataLoadingError

- [#3928](https://github.com/LedgerHQ/ledger-live/pull/3928) [`45be23c776`](https://github.com/LedgerHQ/ledger-live/commit/45be23c77666697dbe395f836ab592062173d5cb) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Introduce new hook for Mapped Assets and Group Assets by provider

- [#4317](https://github.com/LedgerHQ/ledger-live/pull/4317) [`3f36af3127`](https://github.com/LedgerHQ/ledger-live/commit/3f36af31273aba263b79b3f161599ac089cfc6e7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - LLC - Remove Implementation and legacy code for WalletConnect

- [#4271](https://github.com/LedgerHQ/ledger-live/pull/4271) [`4cb6add5d9`](https://github.com/LedgerHQ/ledger-live/commit/4cb6add5d991e24acebac8b59549ced40ee1a19d) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Add implementation only of /v5/currencies/all endpoint in swap

- [#4353](https://github.com/LedgerHQ/ledger-live/pull/4353) [`0d9ad3599b`](https://github.com/LedgerHQ/ledger-live/commit/0d9ad3599bce8872fde97d27c977ab24445afc3a) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - add evm mock test

- [#4258](https://github.com/LedgerHQ/ledger-live/pull/4258) [`e8a7bc5378`](https://github.com/LedgerHQ/ledger-live/commit/e8a7bc537898ef58ab312097860bae1d27999a81) Thanks [@cng-ledger](https://github.com/cng-ledger)! - feat(LIVE-8241): implement call to v5 /currencies/from endpoint for swap

- [#4451](https://github.com/LedgerHQ/ledger-live/pull/4451) [`87a0a8b0dc`](https://github.com/LedgerHQ/ledger-live/commit/87a0a8b0dce2d36a34541f890697b4ffba258382) Thanks [@Justkant](https://github.com/Justkant)! - fix: recover restore and onboarding issues

  Fix desktop LNX onboarding back when coming from recover
  Skip genuine check when coming from recover to restore the device (it would be better to allow unseeded device on the genuine check screen instead)
  Send the deviceId to the recover app in order to avoid multiple device selection during the restore process
  Update the podfile to config the build settings with ccache support (You might need to check https://stackoverflow.com/a/70189990 for ccache to work correctly when building with xcode)
  Cleanup old RecoverStaxFlow screen
  Patch react-native-webview to add support for `allowsUnsecureHttps`
  Added `IGNORE_CERTIFICATE_ERRORS=1` to use `allowsUnsecureHttps` in the webview in dev same as for LLD
  Added `protect-local` & `protect-local-dev` manifest support in dev
  Update wallet-api dependencies

- [#4269](https://github.com/LedgerHQ/ledger-live/pull/4269) [`f7ab71db0e`](https://github.com/LedgerHQ/ledger-live/commit/f7ab71db0eaeb5c69a7c7b9aeed755f17c872797) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLC - added an amount property to the feature_referral_program_desktop_sidebar feature flag

- Updated dependencies [[`8e9df43a0c`](https://github.com/LedgerHQ/ledger-live/commit/8e9df43a0cd00a2065b494439f300f96724b8eb8), [`fde2fe79f1`](https://github.com/LedgerHQ/ledger-live/commit/fde2fe79f1df69fffe80763cd6d9792fe9de1262), [`f6f70ba0e8`](https://github.com/LedgerHQ/ledger-live/commit/f6f70ba0e85c7898cdeec19402b1eadfde6a2206), [`45be23c776`](https://github.com/LedgerHQ/ledger-live/commit/45be23c77666697dbe395f836ab592062173d5cb), [`1020f27632`](https://github.com/LedgerHQ/ledger-live/commit/1020f276322fe361585a56573091ec647fbd901e), [`6375c250a9`](https://github.com/LedgerHQ/ledger-live/commit/6375c250a9a58b33e3dd1d6c96a96c7e46150298), [`0d9ad3599b`](https://github.com/LedgerHQ/ledger-live/commit/0d9ad3599bce8872fde97d27c977ab24445afc3a), [`707e59f8b5`](https://github.com/LedgerHQ/ledger-live/commit/707e59f8b516448e6f2845288ad4cb3f5488e688)]:
  - @ledgerhq/coin-algorand@0.3.0-next.0
  - @ledgerhq/coin-polkadot@0.4.0-next.0
  - @ledgerhq/coin-evm@0.6.0-next.0
  - @ledgerhq/live-env@0.5.0-next.0
  - @ledgerhq/coin-framework@0.5.2-next.0
  - @ledgerhq/cryptoassets@9.12.0-next.0
  - @ledgerhq/domain-service@1.1.9-next.0
  - @ledgerhq/evm-tools@1.0.5-next.0
  - @ledgerhq/hw-app-eth@6.34.4-next.0
  - @ledgerhq/live-network@1.1.6-next.0

## 31.5.0

### Minor Changes

- [#4148](https://github.com/LedgerHQ/ledger-live/pull/4148) [`dfea8a7a0c`](https://github.com/LedgerHQ/ledger-live/commit/dfea8a7a0c24e85b45863a314d010bb7e2bcd878) Thanks [@Justkant](https://github.com/Justkant)! - feat: update wallet-api

  Add `device.select` and `device.open` support
  Bump `bignumber.js` to latest because of mismatch between wallet-api version and ours

- [#4154](https://github.com/LedgerHQ/ledger-live/pull/4154) [`3455944496`](https://github.com/LedgerHQ/ledger-live/commit/34559444969ce1571ff4c54f33feb7f3fb59a33a) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Added NotEnoughGasSwap to errors, will return amountFromWarning from useSwapTransaction and display and interpolate NotEnoughGasSwap in LLD

### Patch Changes

- [#4145](https://github.com/LedgerHQ/ledger-live/pull/4145) [`95088eab45`](https://github.com/LedgerHQ/ledger-live/commit/95088eab45f6af919e347a605cefefb6d7705808) Thanks [@ggilchrist-ledger](https://github.com/ggilchrist-ledger)! - Removing FTX and Wyre related code from LLD, LLM and LLC

- [#4170](https://github.com/LedgerHQ/ledger-live/pull/4170) [`d5d0e399ce`](https://github.com/LedgerHQ/ledger-live/commit/d5d0e399ce3cf3a49802bc8a5563eedd8a590094) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: handle device in bootloader as a fatal error in the polling mechanism

- [#4209](https://github.com/LedgerHQ/ledger-live/pull/4209) [`90d7c237a4`](https://github.com/LedgerHQ/ledger-live/commit/90d7c237a4380ad91134f24d0c39c10079896725) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Add account as query param to multibuy redirect on NotEnoughGasSwap link click

- [#4186](https://github.com/LedgerHQ/ledger-live/pull/4186) [`a61a43fc47`](https://github.com/LedgerHQ/ledger-live/commit/a61a43fc47399e969fa68539de6af51bfa41e921) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Add linked errors to LLM

- [#4270](https://github.com/LedgerHQ/ledger-live/pull/4270) [`9fa642e428`](https://github.com/LedgerHQ/ledger-live/commit/9fa642e428dc88f88dcd3e6e439c3ee40337dbaf) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLC - added an amount property to the feature_referral_program_desktop_sidebar feature flag

- [#4053](https://github.com/LedgerHQ/ledger-live/pull/4053) [`229cf62304`](https://github.com/LedgerHQ/ledger-live/commit/229cf623043b29eefed3e8e37a102325fa6e0387) Thanks [@mle-gall](https://github.com/mle-gall)! - New NPS ratings flow

- Updated dependencies [[`95088eab45`](https://github.com/LedgerHQ/ledger-live/commit/95088eab45f6af919e347a605cefefb6d7705808), [`a61a43fc47`](https://github.com/LedgerHQ/ledger-live/commit/a61a43fc47399e969fa68539de6af51bfa41e921), [`4c2539a1d5`](https://github.com/LedgerHQ/ledger-live/commit/4c2539a1d5c9c01c0f9fa7cd1daf5a5a63c02996), [`3455944496`](https://github.com/LedgerHQ/ledger-live/commit/34559444969ce1571ff4c54f33feb7f3fb59a33a)]:
  - @ledgerhq/live-env@0.4.2
  - @ledgerhq/errors@6.14.0
  - @ledgerhq/cryptoassets@9.11.1
  - @ledgerhq/coin-algorand@0.2.6
  - @ledgerhq/coin-evm@0.5.1
  - @ledgerhq/coin-framework@0.5.1
  - @ledgerhq/coin-polkadot@0.3.3
  - @ledgerhq/domain-service@1.1.8
  - @ledgerhq/evm-tools@1.0.4
  - @ledgerhq/hw-app-eth@6.34.3
  - @ledgerhq/live-network@1.1.5
  - @ledgerhq/devices@8.0.7
  - @ledgerhq/hw-app-algorand@6.27.19
  - @ledgerhq/hw-app-cosmos@6.28.5
  - @ledgerhq/hw-app-exchange@0.2.3
  - @ledgerhq/hw-app-near@6.27.14
  - @ledgerhq/hw-app-polkadot@6.27.19
  - @ledgerhq/hw-app-solana@7.0.13
  - @ledgerhq/hw-app-trx@6.27.19
  - @ledgerhq/hw-transport@6.28.8
  - @ledgerhq/hw-transport-node-speculos@6.27.19
  - @ledgerhq/hw-transport-node-speculos-http@6.27.19
  - @ledgerhq/hw-app-btc@10.0.8
  - @ledgerhq/hw-app-str@6.27.19
  - @ledgerhq/hw-app-tezos@6.27.19
  - @ledgerhq/hw-app-xrp@6.27.19
  - @ledgerhq/hw-transport-mocker@6.27.19

## 31.5.0-next.1

### Patch Changes

- [#4270](https://github.com/LedgerHQ/ledger-live/pull/4270) [`9fa642e428`](https://github.com/LedgerHQ/ledger-live/commit/9fa642e428dc88f88dcd3e6e439c3ee40337dbaf) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLC - added an amount property to the feature_referral_program_desktop_sidebar feature flag

## 31.5.0-next.0

### Minor Changes

- [#4148](https://github.com/LedgerHQ/ledger-live/pull/4148) [`dfea8a7a0c`](https://github.com/LedgerHQ/ledger-live/commit/dfea8a7a0c24e85b45863a314d010bb7e2bcd878) Thanks [@Justkant](https://github.com/Justkant)! - feat: update wallet-api

  Add `device.select` and `device.open` support
  Bump `bignumber.js` to latest because of mismatch between wallet-api version and ours

- [#4154](https://github.com/LedgerHQ/ledger-live/pull/4154) [`3455944496`](https://github.com/LedgerHQ/ledger-live/commit/34559444969ce1571ff4c54f33feb7f3fb59a33a) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Added NotEnoughGasSwap to errors, will return amountFromWarning from useSwapTransaction and display and interpolate NotEnoughGasSwap in LLD

### Patch Changes

- [#4145](https://github.com/LedgerHQ/ledger-live/pull/4145) [`95088eab45`](https://github.com/LedgerHQ/ledger-live/commit/95088eab45f6af919e347a605cefefb6d7705808) Thanks [@ggilchrist-ledger](https://github.com/ggilchrist-ledger)! - Removing FTX and Wyre related code from LLD, LLM and LLC

- [#4170](https://github.com/LedgerHQ/ledger-live/pull/4170) [`d5d0e399ce`](https://github.com/LedgerHQ/ledger-live/commit/d5d0e399ce3cf3a49802bc8a5563eedd8a590094) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: handle device in bootloader as a fatal error in the polling mechanism

- [#4209](https://github.com/LedgerHQ/ledger-live/pull/4209) [`90d7c237a4`](https://github.com/LedgerHQ/ledger-live/commit/90d7c237a4380ad91134f24d0c39c10079896725) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Add account as query param to multibuy redirect on NotEnoughGasSwap link click

- [#4186](https://github.com/LedgerHQ/ledger-live/pull/4186) [`a61a43fc47`](https://github.com/LedgerHQ/ledger-live/commit/a61a43fc47399e969fa68539de6af51bfa41e921) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Add linked errors to LLM

- [#4053](https://github.com/LedgerHQ/ledger-live/pull/4053) [`229cf62304`](https://github.com/LedgerHQ/ledger-live/commit/229cf623043b29eefed3e8e37a102325fa6e0387) Thanks [@mle-gall](https://github.com/mle-gall)! - New NPS ratings flow

- Updated dependencies [[`95088eab45`](https://github.com/LedgerHQ/ledger-live/commit/95088eab45f6af919e347a605cefefb6d7705808), [`a61a43fc47`](https://github.com/LedgerHQ/ledger-live/commit/a61a43fc47399e969fa68539de6af51bfa41e921), [`4c2539a1d5`](https://github.com/LedgerHQ/ledger-live/commit/4c2539a1d5c9c01c0f9fa7cd1daf5a5a63c02996), [`3455944496`](https://github.com/LedgerHQ/ledger-live/commit/34559444969ce1571ff4c54f33feb7f3fb59a33a)]:
  - @ledgerhq/live-env@0.4.2-next.0
  - @ledgerhq/errors@6.14.0-next.0
  - @ledgerhq/cryptoassets@9.11.1-next.0
  - @ledgerhq/coin-algorand@0.2.6-next.0
  - @ledgerhq/coin-evm@0.5.1-next.0
  - @ledgerhq/coin-framework@0.5.1-next.0
  - @ledgerhq/coin-polkadot@0.3.3-next.0
  - @ledgerhq/domain-service@1.1.8-next.0
  - @ledgerhq/evm-tools@1.0.4-next.0
  - @ledgerhq/hw-app-eth@6.34.3-next.0
  - @ledgerhq/live-network@1.1.5-next.0
  - @ledgerhq/devices@8.0.7-next.0
  - @ledgerhq/hw-app-algorand@6.27.19-next.0
  - @ledgerhq/hw-app-cosmos@6.28.5-next.0
  - @ledgerhq/hw-app-exchange@0.2.3-next.0
  - @ledgerhq/hw-app-near@6.27.14-next.0
  - @ledgerhq/hw-app-polkadot@6.27.19-next.0
  - @ledgerhq/hw-app-solana@7.0.13-next.0
  - @ledgerhq/hw-app-trx@6.27.19-next.0
  - @ledgerhq/hw-transport@6.28.8-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.19-next.0
  - @ledgerhq/hw-transport-node-speculos-http@6.27.19-next.0
  - @ledgerhq/hw-app-btc@10.0.8-next.0
  - @ledgerhq/hw-app-str@6.27.19-next.0
  - @ledgerhq/hw-app-tezos@6.27.19-next.0
  - @ledgerhq/hw-app-xrp@6.27.19-next.0
  - @ledgerhq/hw-transport-mocker@6.27.19-next.0

## 31.4.0

### Minor Changes

- [#4061](https://github.com/LedgerHQ/ledger-live/pull/4061) [`a690f9802f`](https://github.com/LedgerHQ/ledger-live/commit/a690f9802f81643ac047d6626f691353953adca1) Thanks [@cng-ledger](https://github.com/cng-ledger)! - adding tron exchange support to ledger live common

- [#4139](https://github.com/LedgerHQ/ledger-live/pull/4139) [`28068a5333`](https://github.com/LedgerHQ/ledger-live/commit/28068a53336eb51936c529e0a06605b64ece24ec) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - add generic error and add error screen recover device already seeded

- [#3926](https://github.com/LedgerHQ/ledger-live/pull/3926) [`7901608c80`](https://github.com/LedgerHQ/ledger-live/commit/7901608c80343abb271cce495fce673c544e6330) Thanks [@Justkant](https://github.com/Justkant)! - feat(recover): restore check seeded [PROTECT-1711]

- [#4021](https://github.com/LedgerHQ/ledger-live/pull/4021) [`e5f9cc46d6`](https://github.com/LedgerHQ/ledger-live/commit/e5f9cc46d69b82ad7267296b350e9d97a47f9e86) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add telos evm currency

- [#3827](https://github.com/LedgerHQ/ledger-live/pull/3827) [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update `Batcher` to be more agnostic

- [#3704](https://github.com/LedgerHQ/ledger-live/pull/3704) [`b6e50932af`](https://github.com/LedgerHQ/ledger-live/commit/b6e50932afac6acc2d2f9fa9ed10b77a62378e03) Thanks [@chabroA](https://github.com/chabroA)! - Create EVM send flow

- [#4015](https://github.com/LedgerHQ/ledger-live/pull/4015) [`374e339c27`](https://github.com/LedgerHQ/ledger-live/commit/374e339c27e317656d01463a822898ad3a60df85) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Polygon zkEVM, Base Goerli, Klaytn

### Patch Changes

- [#4065](https://github.com/LedgerHQ/ledger-live/pull/4065) [`12c6004c2c`](https://github.com/LedgerHQ/ledger-live/commit/12c6004c2cbc97df13cd465e1a9a09e6114df2be) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix osmo naming error

- [#4113](https://github.com/LedgerHQ/ledger-live/pull/4113) [`4e47969867`](https://github.com/LedgerHQ/ledger-live/commit/4e4796986724579c8a9e405add44db6280878508) Thanks [@grsoares21](https://github.com/grsoares21)! - Add automatic retry mechanism for app installation operations

- [#4000](https://github.com/LedgerHQ/ledger-live/pull/4000) [`e775c83ab7`](https://github.com/LedgerHQ/ledger-live/commit/e775c83ab7fa28b395c149d03679cdd93535b14a) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Cosmos tx2op multiple event fix

- [#4086](https://github.com/LedgerHQ/ledger-live/pull/4086) [`2e5e37af96`](https://github.com/LedgerHQ/ledger-live/commit/2e5e37af96120b58fb56386cf77b6478cf06eed8) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Sync onboarding: remove Polygon from default list of apps installed on device as it is no longer needed for full setup of Stax (because we are dropping the claim NFT feature in the post onboarding)

- [#4003](https://github.com/LedgerHQ/ledger-live/pull/4003) [`3de79a2927`](https://github.com/LedgerHQ/ledger-live/commit/3de79a2927a1679ce4571f2c298cd404877cc49a) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove extra refresh effect when configuration change in swap llm

- [#3983](https://github.com/LedgerHQ/ledger-live/pull/3983) [`5dba98a39d`](https://github.com/LedgerHQ/ledger-live/commit/5dba98a39de6765539f76446613f1a90ddb743d5) Thanks [@cng-ledger](https://github.com/cng-ledger)! - added ProviderIcon component to LLD & LLM which loads svg icons from CDN

- [#4096](https://github.com/LedgerHQ/ledger-live/pull/4096) [`03896700ca`](https://github.com/LedgerHQ/ledger-live/commit/03896700ca019b5a0b6a2d68b49abb80e47d3d02) Thanks [@lawRathod](https://github.com/lawRathod)! - Update scanAccount and snapshot for icp bridge integration tests.

- [#4130](https://github.com/LedgerHQ/ledger-live/pull/4130) [`cfbff52724`](https://github.com/LedgerHQ/ledger-live/commit/cfbff527241534aba69bff3d86733b50a14eb4ce) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - coreum integration

- [#4090](https://github.com/LedgerHQ/ledger-live/pull/4090) [`7675787398`](https://github.com/LedgerHQ/ledger-live/commit/767578739822597768f877f94fd8f7f35441395a) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix building & bundling of `evm-tools` & `domain-service` libs due to .gitignore(s)

- [#4020](https://github.com/LedgerHQ/ledger-live/pull/4020) [`37c4e845c3`](https://github.com/LedgerHQ/ledger-live/commit/37c4e845c3f821760a67c56bdbfa09f45f736c78) Thanks [@chabroA](https://github.com/chabroA)! - remove unnecessary check on tx networkInfo

- [#4153](https://github.com/LedgerHQ/ledger-live/pull/4153) [`cd00fe93c5`](https://github.com/LedgerHQ/ledger-live/commit/cd00fe93c599dfd8d71c49adf538c0c8fd2e4280) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix cosmos operation detail fields names destination_validator and source_validator

- [#4042](https://github.com/LedgerHQ/ledger-live/pull/4042) [`c7c484acf0`](https://github.com/LedgerHQ/ledger-live/commit/c7c484acf01e9db8dc5a5507b62ffcb863c77ca4) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: new get latest available firmware action and hook

  Created a getLatestAvailableFirmwareAction and a React adapter with a hook: useGetLatestAvailableFirmware
  The need came from having a version of a "get latest available firmware" function that is resilient
  to Transport race conditions (by catching and retrying).

  Implemented using the new device SDK paradigm.

  Also now propagating the following informations:

  - does the current error that occurred in a task triggered an attempt to retry the task ?
  - what kind of locked device error occurred: 0x5515 (LockedDeviceError) or device "unresponsive"

- Updated dependencies [[`1263b7a9c1`](https://github.com/LedgerHQ/ledger-live/commit/1263b7a9c1916da81ad55bb2ca1e804cff5f89e2), [`770842cdbe`](https://github.com/LedgerHQ/ledger-live/commit/770842cdbe94c629b6844f93d1b5d94d381931b1), [`a59028f761`](https://github.com/LedgerHQ/ledger-live/commit/a59028f761c84d257eca72be7668af5fbc981c3a), [`e5f9cc46d6`](https://github.com/LedgerHQ/ledger-live/commit/e5f9cc46d69b82ad7267296b350e9d97a47f9e86), [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1), [`cfbff52724`](https://github.com/LedgerHQ/ledger-live/commit/cfbff527241534aba69bff3d86733b50a14eb4ce), [`b6e50932af`](https://github.com/LedgerHQ/ledger-live/commit/b6e50932afac6acc2d2f9fa9ed10b77a62378e03), [`b6e50932af`](https://github.com/LedgerHQ/ledger-live/commit/b6e50932afac6acc2d2f9fa9ed10b77a62378e03), [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1), [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1), [`7675787398`](https://github.com/LedgerHQ/ledger-live/commit/767578739822597768f877f94fd8f7f35441395a), [`c7c484acf0`](https://github.com/LedgerHQ/ledger-live/commit/c7c484acf01e9db8dc5a5507b62ffcb863c77ca4), [`374e339c27`](https://github.com/LedgerHQ/ledger-live/commit/374e339c27e317656d01463a822898ad3a60df85), [`c2fd7e2e3d`](https://github.com/LedgerHQ/ledger-live/commit/c2fd7e2e3d684da831a7eafe6b22b5e2c96a3722), [`66769a98e6`](https://github.com/LedgerHQ/ledger-live/commit/66769a98e69f2b8156417e464e90d9162272b470)]:
  - @ledgerhq/cryptoassets@9.11.0
  - @ledgerhq/live-env@0.4.1
  - @ledgerhq/coin-polkadot@0.3.2
  - @ledgerhq/coin-evm@0.5.0
  - @ledgerhq/coin-framework@0.5.0
  - @ledgerhq/evm-tools@1.0.3
  - @ledgerhq/hw-app-eth@6.34.2
  - @ledgerhq/errors@6.13.1
  - @ledgerhq/coin-algorand@0.2.5
  - @ledgerhq/domain-service@1.1.7
  - @ledgerhq/live-network@1.1.4
  - @ledgerhq/devices@8.0.6
  - @ledgerhq/hw-app-algorand@6.27.18
  - @ledgerhq/hw-app-cosmos@6.28.4
  - @ledgerhq/hw-app-exchange@0.2.2
  - @ledgerhq/hw-app-near@6.27.13
  - @ledgerhq/hw-app-polkadot@6.27.18
  - @ledgerhq/hw-app-solana@7.0.12
  - @ledgerhq/hw-app-trx@6.27.18
  - @ledgerhq/hw-transport@6.28.7
  - @ledgerhq/hw-transport-node-speculos@6.27.18
  - @ledgerhq/hw-transport-node-speculos-http@6.27.18
  - @ledgerhq/hw-app-btc@10.0.7
  - @ledgerhq/hw-app-str@6.27.18
  - @ledgerhq/hw-app-tezos@6.27.18
  - @ledgerhq/hw-app-xrp@6.27.18
  - @ledgerhq/hw-transport-mocker@6.27.18

## 31.4.0-next.0

### Minor Changes

- [#4061](https://github.com/LedgerHQ/ledger-live/pull/4061) [`a690f9802f`](https://github.com/LedgerHQ/ledger-live/commit/a690f9802f81643ac047d6626f691353953adca1) Thanks [@cng-ledger](https://github.com/cng-ledger)! - adding tron exchange support to ledger live common

- [#4139](https://github.com/LedgerHQ/ledger-live/pull/4139) [`28068a5333`](https://github.com/LedgerHQ/ledger-live/commit/28068a53336eb51936c529e0a06605b64ece24ec) Thanks [@stephane-lieumont-ledger](https://github.com/stephane-lieumont-ledger)! - add generic error and add error screen recover device already seeded

- [#3926](https://github.com/LedgerHQ/ledger-live/pull/3926) [`7901608c80`](https://github.com/LedgerHQ/ledger-live/commit/7901608c80343abb271cce495fce673c544e6330) Thanks [@Justkant](https://github.com/Justkant)! - feat(recover): restore check seeded [PROTECT-1711]

- [#4021](https://github.com/LedgerHQ/ledger-live/pull/4021) [`e5f9cc46d6`](https://github.com/LedgerHQ/ledger-live/commit/e5f9cc46d69b82ad7267296b350e9d97a47f9e86) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add telos evm currency

- [#3827](https://github.com/LedgerHQ/ledger-live/pull/3827) [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update `Batcher` to be more agnostic

- [#3704](https://github.com/LedgerHQ/ledger-live/pull/3704) [`b6e50932af`](https://github.com/LedgerHQ/ledger-live/commit/b6e50932afac6acc2d2f9fa9ed10b77a62378e03) Thanks [@chabroA](https://github.com/chabroA)! - Create EVM send flow

- [#4015](https://github.com/LedgerHQ/ledger-live/pull/4015) [`374e339c27`](https://github.com/LedgerHQ/ledger-live/commit/374e339c27e317656d01463a822898ad3a60df85) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Polygon zkEVM, Base Goerli, Klaytn

### Patch Changes

- [#4065](https://github.com/LedgerHQ/ledger-live/pull/4065) [`12c6004c2c`](https://github.com/LedgerHQ/ledger-live/commit/12c6004c2cbc97df13cd465e1a9a09e6114df2be) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix osmo naming error

- [#4113](https://github.com/LedgerHQ/ledger-live/pull/4113) [`4e47969867`](https://github.com/LedgerHQ/ledger-live/commit/4e4796986724579c8a9e405add44db6280878508) Thanks [@grsoares21](https://github.com/grsoares21)! - Add automatic retry mechanism for app installation operations

- [#4000](https://github.com/LedgerHQ/ledger-live/pull/4000) [`e775c83ab7`](https://github.com/LedgerHQ/ledger-live/commit/e775c83ab7fa28b395c149d03679cdd93535b14a) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Cosmos tx2op multiple event fix

- [#4086](https://github.com/LedgerHQ/ledger-live/pull/4086) [`2e5e37af96`](https://github.com/LedgerHQ/ledger-live/commit/2e5e37af96120b58fb56386cf77b6478cf06eed8) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Sync onboarding: remove Polygon from default list of apps installed on device as it is no longer needed for full setup of Stax (because we are dropping the claim NFT feature in the post onboarding)

- [#4003](https://github.com/LedgerHQ/ledger-live/pull/4003) [`3de79a2927`](https://github.com/LedgerHQ/ledger-live/commit/3de79a2927a1679ce4571f2c298cd404877cc49a) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove extra refresh effect when configuration change in swap llm

- [#3983](https://github.com/LedgerHQ/ledger-live/pull/3983) [`5dba98a39d`](https://github.com/LedgerHQ/ledger-live/commit/5dba98a39de6765539f76446613f1a90ddb743d5) Thanks [@cng-ledger](https://github.com/cng-ledger)! - added ProviderIcon component to LLD & LLM which loads svg icons from CDN

- [#4096](https://github.com/LedgerHQ/ledger-live/pull/4096) [`03896700ca`](https://github.com/LedgerHQ/ledger-live/commit/03896700ca019b5a0b6a2d68b49abb80e47d3d02) Thanks [@lawRathod](https://github.com/lawRathod)! - Update scanAccount and snapshot for icp bridge integration tests.

- [#4130](https://github.com/LedgerHQ/ledger-live/pull/4130) [`cfbff52724`](https://github.com/LedgerHQ/ledger-live/commit/cfbff527241534aba69bff3d86733b50a14eb4ce) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - coreum integration

- [#4090](https://github.com/LedgerHQ/ledger-live/pull/4090) [`7675787398`](https://github.com/LedgerHQ/ledger-live/commit/767578739822597768f877f94fd8f7f35441395a) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix building & bundling of `evm-tools` & `domain-service` libs due to .gitignore(s)

- [#4020](https://github.com/LedgerHQ/ledger-live/pull/4020) [`37c4e845c3`](https://github.com/LedgerHQ/ledger-live/commit/37c4e845c3f821760a67c56bdbfa09f45f736c78) Thanks [@chabroA](https://github.com/chabroA)! - remove unnecessary check on tx networkInfo

- [#4153](https://github.com/LedgerHQ/ledger-live/pull/4153) [`cd00fe93c5`](https://github.com/LedgerHQ/ledger-live/commit/cd00fe93c599dfd8d71c49adf538c0c8fd2e4280) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix cosmos operation detail fields names destination_validator and source_validator

- [#4042](https://github.com/LedgerHQ/ledger-live/pull/4042) [`c7c484acf0`](https://github.com/LedgerHQ/ledger-live/commit/c7c484acf01e9db8dc5a5507b62ffcb863c77ca4) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: new get latest available firmware action and hook

  Created a getLatestAvailableFirmwareAction and a React adapter with a hook: useGetLatestAvailableFirmware
  The need came from having a version of a "get latest available firmware" function that is resilient
  to Transport race conditions (by catching and retrying).

  Implemented using the new device SDK paradigm.

  Also now propagating the following informations:

  - does the current error that occurred in a task triggered an attempt to retry the task ?
  - what kind of locked device error occurred: 0x5515 (LockedDeviceError) or device "unresponsive"

- Updated dependencies [[`1263b7a9c1`](https://github.com/LedgerHQ/ledger-live/commit/1263b7a9c1916da81ad55bb2ca1e804cff5f89e2), [`770842cdbe`](https://github.com/LedgerHQ/ledger-live/commit/770842cdbe94c629b6844f93d1b5d94d381931b1), [`a59028f761`](https://github.com/LedgerHQ/ledger-live/commit/a59028f761c84d257eca72be7668af5fbc981c3a), [`e5f9cc46d6`](https://github.com/LedgerHQ/ledger-live/commit/e5f9cc46d69b82ad7267296b350e9d97a47f9e86), [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1), [`cfbff52724`](https://github.com/LedgerHQ/ledger-live/commit/cfbff527241534aba69bff3d86733b50a14eb4ce), [`b6e50932af`](https://github.com/LedgerHQ/ledger-live/commit/b6e50932afac6acc2d2f9fa9ed10b77a62378e03), [`b6e50932af`](https://github.com/LedgerHQ/ledger-live/commit/b6e50932afac6acc2d2f9fa9ed10b77a62378e03), [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1), [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1), [`7675787398`](https://github.com/LedgerHQ/ledger-live/commit/767578739822597768f877f94fd8f7f35441395a), [`c7c484acf0`](https://github.com/LedgerHQ/ledger-live/commit/c7c484acf01e9db8dc5a5507b62ffcb863c77ca4), [`374e339c27`](https://github.com/LedgerHQ/ledger-live/commit/374e339c27e317656d01463a822898ad3a60df85), [`c2fd7e2e3d`](https://github.com/LedgerHQ/ledger-live/commit/c2fd7e2e3d684da831a7eafe6b22b5e2c96a3722), [`66769a98e6`](https://github.com/LedgerHQ/ledger-live/commit/66769a98e69f2b8156417e464e90d9162272b470)]:
  - @ledgerhq/cryptoassets@9.11.0-next.0
  - @ledgerhq/live-env@0.4.1-next.0
  - @ledgerhq/coin-polkadot@0.3.2-next.0
  - @ledgerhq/coin-evm@0.5.0-next.0
  - @ledgerhq/coin-framework@0.5.0-next.0
  - @ledgerhq/evm-tools@1.0.3-next.0
  - @ledgerhq/hw-app-eth@6.34.2-next.0
  - @ledgerhq/errors@6.13.1-next.0
  - @ledgerhq/coin-algorand@0.2.5-next.0
  - @ledgerhq/domain-service@1.1.7-next.0
  - @ledgerhq/live-network@1.1.4-next.0
  - @ledgerhq/devices@8.0.6-next.0
  - @ledgerhq/hw-app-algorand@6.27.18-next.0
  - @ledgerhq/hw-app-cosmos@6.28.4-next.0
  - @ledgerhq/hw-app-exchange@0.2.2-next.0
  - @ledgerhq/hw-app-near@6.27.13-next.0
  - @ledgerhq/hw-app-polkadot@6.27.18-next.0
  - @ledgerhq/hw-app-solana@7.0.12-next.0
  - @ledgerhq/hw-app-trx@6.27.18-next.0
  - @ledgerhq/hw-transport@6.28.7-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.18-next.0
  - @ledgerhq/hw-transport-node-speculos-http@6.27.18-next.0
  - @ledgerhq/hw-app-btc@10.0.7-next.0
  - @ledgerhq/hw-app-str@6.27.18-next.0
  - @ledgerhq/hw-app-tezos@6.27.18-next.0
  - @ledgerhq/hw-app-xrp@6.27.18-next.0
  - @ledgerhq/hw-transport-mocker@6.27.18-next.0

## 31.3.1

### Patch Changes

- [#4103](https://github.com/LedgerHQ/ledger-live/pull/4103) [`2317fccb67`](https://github.com/LedgerHQ/ledger-live/commit/2317fccb6776a077eaca8828da8371d402323be4) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fix building & bundling of `evm-tools` & `domain-service` libs due to .gitignore(s)

- Updated dependencies [[`2317fccb67`](https://github.com/LedgerHQ/ledger-live/commit/2317fccb6776a077eaca8828da8371d402323be4)]:
  - @ledgerhq/coin-evm@0.4.1
  - @ledgerhq/evm-tools@1.0.2
  - @ledgerhq/hw-app-eth@6.34.1

## 31.3.1-hotfix.0

### Patch Changes

- [#4103](https://github.com/LedgerHQ/ledger-live/pull/4103) [`2317fccb67`](https://github.com/LedgerHQ/ledger-live/commit/2317fccb6776a077eaca8828da8371d402323be4) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fix building & bundling of `evm-tools` & `domain-service` libs due to .gitignore(s)

- Updated dependencies [[`2317fccb67`](https://github.com/LedgerHQ/ledger-live/commit/2317fccb6776a077eaca8828da8371d402323be4)]:
  - @ledgerhq/coin-evm@0.4.1-hotfix.0
  - @ledgerhq/evm-tools@1.0.2-hotfix.0
  - @ledgerhq/hw-app-eth@6.34.1-hotfix.0

## 31.3.0

### Minor Changes

- [#3864](https://github.com/LedgerHQ/ledger-live/pull/3864) [`d0cfcbc6d7`](https://github.com/LedgerHQ/ledger-live/commit/d0cfcbc6d7ca4693bd9db9f3958d4fbbdd947865) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Increase ttl coinc config

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add NFT support to EVM family synchronization

- [#3843](https://github.com/LedgerHQ/ledger-live/pull/3843) [`96322128d8`](https://github.com/LedgerHQ/ledger-live/commit/96322128d8e4fffd0eea384e4f787c9e26e9fbac) Thanks [@Justkant](https://github.com/Justkant)! - feat: recover llm stax

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Moving NFT related files from live-common to coin-framework with retrocompatibility

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update NftMetadataProvider types

- [#3459](https://github.com/LedgerHQ/ledger-live/pull/3459) [`49182846de`](https://github.com/LedgerHQ/ledger-live/commit/49182846dee35ae9b3535c0c120e17d0eaecde70) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - add support to stacks blockchain

- [#3924](https://github.com/LedgerHQ/ledger-live/pull/3924) [`14cce73003`](https://github.com/LedgerHQ/ledger-live/commit/14cce7300333c51cbcdbd5a7e290ddc600c9f3a1) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update SignMessage logic to be simpler, with improved typing.

- [#3815](https://github.com/LedgerHQ/ledger-live/pull/3815) [`0f4293e9bf`](https://github.com/LedgerHQ/ledger-live/commit/0f4293e9bf9cac4c2a195efeb0831aab3d51933d) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Support for Internet Computer blockchain

- [#3949](https://github.com/LedgerHQ/ledger-live/pull/3949) [`16d29e18ee`](https://github.com/LedgerHQ/ledger-live/commit/16d29e18eef21009ba384f15f495c92b2028b4c4) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Add timeout and timeoutErrorMessage params to useSwapTransaction

- [#3841](https://github.com/LedgerHQ/ledger-live/pull/3841) [`bae3b64dd2`](https://github.com/LedgerHQ/ledger-live/commit/bae3b64dd2710a3743552600166be986e93d9099) Thanks [@Justkant](https://github.com/Justkant)! - feat: recover on LLD

  Handle the recover deeplink
  Add a screen to redirect to the correct device onboarding automatically
  Rework of the recover feature flags
  Add upsell screen for recover after onboarding

- [#3825](https://github.com/LedgerHQ/ledger-live/pull/3825) [`9692adc2a6`](https://github.com/LedgerHQ/ledger-live/commit/9692adc2a6774feb4424fc7a984810918c946b1b) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Cosmos chains : stargaze, desmos, umee, secret network

### Patch Changes

- [#3918](https://github.com/LedgerHQ/ledger-live/pull/3918) [`9676e157b3`](https://github.com/LedgerHQ/ledger-live/commit/9676e157b3471ce43c9a283417c718ee11978ee4) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: return device info from hook to get latest available firmware update

  - return device info from getLatestAvailableFirmwareFromDeviceId
  - return device info from hook useGetLatestAvailableFirmware

- [#3865](https://github.com/LedgerHQ/ledger-live/pull/3865) [`d2c1b9ed8d`](https://github.com/LedgerHQ/ledger-live/commit/d2c1b9ed8d7dc3bacfc9c5020a4612693cd62272) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Remove condition of terminated coin for Nano app installation

- [#3709](https://github.com/LedgerHQ/ledger-live/pull/3709) [`f474bc5631`](https://github.com/LedgerHQ/ledger-live/commit/f474bc56314a32b8b81453bf2c3c43959d42c3bd) Thanks [@grsoares21](https://github.com/grsoares21)! - Small fix on the state handling of the firmware update device action

- [#3859](https://github.com/LedgerHQ/ledger-live/pull/3859) [`2292a285e0`](https://github.com/LedgerHQ/ledger-live/commit/2292a285e03d34951b57d778b0c3626e9b4aff17) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix bitcoin family bot

- [#3883](https://github.com/LedgerHQ/ledger-live/pull/3883) [`194acaf3d7`](https://github.com/LedgerHQ/ledger-live/commit/194acaf3d7389727ace87206a45a39fd3a5e1f98) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix a device action implementation issue that was causing the UI to flicker during device actions

- [#3881](https://github.com/LedgerHQ/ledger-live/pull/3881) [`b68120562b`](https://github.com/LedgerHQ/ledger-live/commit/b68120562b99d6a19ffc4c9cc13ac49979bef3e8) Thanks [@aboissiere-ledger](https://github.com/aboissiere-ledger)! - Fix jest config to generate coverage report and include untested files

- [#3831](https://github.com/LedgerHQ/ledger-live/pull/3831) [`04f63f0776`](https://github.com/LedgerHQ/ledger-live/commit/04f63f077647f9d77fe2c80ec62f872547ed332a) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Fix no funds swap result

- [#3692](https://github.com/LedgerHQ/ledger-live/pull/3692) [`be437fa19f`](https://github.com/LedgerHQ/ledger-live/commit/be437fa19ff8c0557fe426fc8a174445fbee0f7a) Thanks [@cksanders](https://github.com/cksanders)! - Move swap dex utils to common and remove DEX feature flag.

- [#4011](https://github.com/LedgerHQ/ledger-live/pull/4011) [`23f26c0f80`](https://github.com/LedgerHQ/ledger-live/commit/23f26c0f8005f7accbbdd96909b858fbfc4719a0) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Disable default derivation scheme for ICP, to use only the custom one

- [#3892](https://github.com/LedgerHQ/ledger-live/pull/3892) [`ae9f327cc7`](https://github.com/LedgerHQ/ledger-live/commit/ae9f327cc7414d7f769704dd1cc83128c876d185) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix missing pending transaction bug

- [#3917](https://github.com/LedgerHQ/ledger-live/pull/3917) [`989707f00c`](https://github.com/LedgerHQ/ledger-live/commit/989707f00c76145cef924f3e5417894ee117080e) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - debounce setFromAmount in LLC by 400ms

- Updated dependencies [[`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`49182846de`](https://github.com/LedgerHQ/ledger-live/commit/49182846dee35ae9b3535c0c120e17d0eaecde70), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`c660c4e389`](https://github.com/LedgerHQ/ledger-live/commit/c660c4e389ac200ef308cbc3882930d392375de3), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`11e62b1e1e`](https://github.com/LedgerHQ/ledger-live/commit/11e62b1e1e3773eeaad748453973e0b3bcd3e3bf), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`2c28d5aab3`](https://github.com/LedgerHQ/ledger-live/commit/2c28d5aab36b8b0cf2cb2a50e02eac4c5a588e41), [`14cce73003`](https://github.com/LedgerHQ/ledger-live/commit/14cce7300333c51cbcdbd5a7e290ddc600c9f3a1), [`0f4293e9bf`](https://github.com/LedgerHQ/ledger-live/commit/0f4293e9bf9cac4c2a195efeb0831aab3d51933d), [`14cce73003`](https://github.com/LedgerHQ/ledger-live/commit/14cce7300333c51cbcdbd5a7e290ddc600c9f3a1), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`bae3b64dd2`](https://github.com/LedgerHQ/ledger-live/commit/bae3b64dd2710a3743552600166be986e93d9099), [`9692adc2a6`](https://github.com/LedgerHQ/ledger-live/commit/9692adc2a6774feb4424fc7a984810918c946b1b), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec)]:
  - @ledgerhq/live-env@0.4.0
  - @ledgerhq/coin-evm@0.4.0
  - @ledgerhq/coin-framework@0.4.0
  - @ledgerhq/cryptoassets@9.10.0
  - @ledgerhq/errors@6.13.0
  - @ledgerhq/hw-app-eth@6.34.0
  - @ledgerhq/coin-algorand@0.2.4
  - @ledgerhq/coin-polkadot@0.3.1
  - @ledgerhq/evm-tools@1.0.1
  - @ledgerhq/live-network@1.1.3
  - @ledgerhq/domain-service@1.1.6
  - @ledgerhq/devices@8.0.5
  - @ledgerhq/hw-app-algorand@6.27.17
  - @ledgerhq/hw-app-cosmos@6.28.3
  - @ledgerhq/hw-app-exchange@0.2.1
  - @ledgerhq/hw-app-near@6.27.12
  - @ledgerhq/hw-app-polkadot@6.27.17
  - @ledgerhq/hw-app-solana@7.0.11
  - @ledgerhq/hw-app-trx@6.27.17
  - @ledgerhq/hw-transport@6.28.6
  - @ledgerhq/hw-transport-node-speculos@6.27.17
  - @ledgerhq/hw-transport-node-speculos-http@6.27.17
  - @ledgerhq/hw-app-btc@10.0.6
  - @ledgerhq/hw-app-str@6.27.17
  - @ledgerhq/hw-app-tezos@6.27.17
  - @ledgerhq/hw-app-xrp@6.27.17
  - @ledgerhq/hw-transport-mocker@6.27.17

## 31.3.0-next.1

### Patch Changes

- [#4011](https://github.com/LedgerHQ/ledger-live/pull/4011) [`23f26c0f80`](https://github.com/LedgerHQ/ledger-live/commit/23f26c0f8005f7accbbdd96909b858fbfc4719a0) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Disable default derivation scheme for ICP, to use only the custom one

## 31.3.0-next.0

### Minor Changes

- [#3864](https://github.com/LedgerHQ/ledger-live/pull/3864) [`d0cfcbc6d7`](https://github.com/LedgerHQ/ledger-live/commit/d0cfcbc6d7ca4693bd9db9f3958d4fbbdd947865) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Increase ttl coinc config

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add NFT support to EVM family synchronization

- [#3843](https://github.com/LedgerHQ/ledger-live/pull/3843) [`96322128d8`](https://github.com/LedgerHQ/ledger-live/commit/96322128d8e4fffd0eea384e4f787c9e26e9fbac) Thanks [@Justkant](https://github.com/Justkant)! - feat: recover llm stax

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Moving NFT related files from live-common to coin-framework with retrocompatibility

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update NftMetadataProvider types

- [#3459](https://github.com/LedgerHQ/ledger-live/pull/3459) [`49182846de`](https://github.com/LedgerHQ/ledger-live/commit/49182846dee35ae9b3535c0c120e17d0eaecde70) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - add support to stacks blockchain

- [#3924](https://github.com/LedgerHQ/ledger-live/pull/3924) [`14cce73003`](https://github.com/LedgerHQ/ledger-live/commit/14cce7300333c51cbcdbd5a7e290ddc600c9f3a1) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update SignMessage logic to be simpler, with improved typing.

- [#3815](https://github.com/LedgerHQ/ledger-live/pull/3815) [`0f4293e9bf`](https://github.com/LedgerHQ/ledger-live/commit/0f4293e9bf9cac4c2a195efeb0831aab3d51933d) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Support for Internet Computer blockchain

- [#3949](https://github.com/LedgerHQ/ledger-live/pull/3949) [`16d29e18ee`](https://github.com/LedgerHQ/ledger-live/commit/16d29e18eef21009ba384f15f495c92b2028b4c4) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Add timeout and timeoutErrorMessage params to useSwapTransaction

- [#3841](https://github.com/LedgerHQ/ledger-live/pull/3841) [`bae3b64dd2`](https://github.com/LedgerHQ/ledger-live/commit/bae3b64dd2710a3743552600166be986e93d9099) Thanks [@Justkant](https://github.com/Justkant)! - feat: recover on LLD

  Handle the recover deeplink
  Add a screen to redirect to the correct device onboarding automatically
  Rework of the recover feature flags
  Add upsell screen for recover after onboarding

- [#3825](https://github.com/LedgerHQ/ledger-live/pull/3825) [`9692adc2a6`](https://github.com/LedgerHQ/ledger-live/commit/9692adc2a6774feb4424fc7a984810918c946b1b) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Cosmos chains : stargaze, desmos, umee, secret network

### Patch Changes

- [#3918](https://github.com/LedgerHQ/ledger-live/pull/3918) [`9676e157b3`](https://github.com/LedgerHQ/ledger-live/commit/9676e157b3471ce43c9a283417c718ee11978ee4) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: return device info from hook to get latest available firmware update

  - return device info from getLatestAvailableFirmwareFromDeviceId
  - return device info from hook useGetLatestAvailableFirmware

- [#3865](https://github.com/LedgerHQ/ledger-live/pull/3865) [`d2c1b9ed8d`](https://github.com/LedgerHQ/ledger-live/commit/d2c1b9ed8d7dc3bacfc9c5020a4612693cd62272) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Remove condition of terminated coin for Nano app installation

- [#3709](https://github.com/LedgerHQ/ledger-live/pull/3709) [`f474bc5631`](https://github.com/LedgerHQ/ledger-live/commit/f474bc56314a32b8b81453bf2c3c43959d42c3bd) Thanks [@grsoares21](https://github.com/grsoares21)! - Small fix on the state handling of the firmware update device action

- [#3859](https://github.com/LedgerHQ/ledger-live/pull/3859) [`2292a285e0`](https://github.com/LedgerHQ/ledger-live/commit/2292a285e03d34951b57d778b0c3626e9b4aff17) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix bitcoin family bot

- [#3883](https://github.com/LedgerHQ/ledger-live/pull/3883) [`194acaf3d7`](https://github.com/LedgerHQ/ledger-live/commit/194acaf3d7389727ace87206a45a39fd3a5e1f98) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix a device action implementation issue that was causing the UI to flicker during device actions

- [#3881](https://github.com/LedgerHQ/ledger-live/pull/3881) [`b68120562b`](https://github.com/LedgerHQ/ledger-live/commit/b68120562b99d6a19ffc4c9cc13ac49979bef3e8) Thanks [@aboissiere-ledger](https://github.com/aboissiere-ledger)! - Fix jest config to generate coverage report and include untested files

- [#3831](https://github.com/LedgerHQ/ledger-live/pull/3831) [`04f63f0776`](https://github.com/LedgerHQ/ledger-live/commit/04f63f077647f9d77fe2c80ec62f872547ed332a) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Fix no funds swap result

- [#3692](https://github.com/LedgerHQ/ledger-live/pull/3692) [`be437fa19f`](https://github.com/LedgerHQ/ledger-live/commit/be437fa19ff8c0557fe426fc8a174445fbee0f7a) Thanks [@cksanders](https://github.com/cksanders)! - Move swap dex utils to common and remove DEX feature flag.

- [#3892](https://github.com/LedgerHQ/ledger-live/pull/3892) [`ae9f327cc7`](https://github.com/LedgerHQ/ledger-live/commit/ae9f327cc7414d7f769704dd1cc83128c876d185) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix missing pending transaction bug

- [#3917](https://github.com/LedgerHQ/ledger-live/pull/3917) [`989707f00c`](https://github.com/LedgerHQ/ledger-live/commit/989707f00c76145cef924f3e5417894ee117080e) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - debounce setFromAmount in LLC by 400ms

- Updated dependencies [[`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`49182846de`](https://github.com/LedgerHQ/ledger-live/commit/49182846dee35ae9b3535c0c120e17d0eaecde70), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`c660c4e389`](https://github.com/LedgerHQ/ledger-live/commit/c660c4e389ac200ef308cbc3882930d392375de3), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`11e62b1e1e`](https://github.com/LedgerHQ/ledger-live/commit/11e62b1e1e3773eeaad748453973e0b3bcd3e3bf), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`2c28d5aab3`](https://github.com/LedgerHQ/ledger-live/commit/2c28d5aab36b8b0cf2cb2a50e02eac4c5a588e41), [`14cce73003`](https://github.com/LedgerHQ/ledger-live/commit/14cce7300333c51cbcdbd5a7e290ddc600c9f3a1), [`0f4293e9bf`](https://github.com/LedgerHQ/ledger-live/commit/0f4293e9bf9cac4c2a195efeb0831aab3d51933d), [`14cce73003`](https://github.com/LedgerHQ/ledger-live/commit/14cce7300333c51cbcdbd5a7e290ddc600c9f3a1), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`bae3b64dd2`](https://github.com/LedgerHQ/ledger-live/commit/bae3b64dd2710a3743552600166be986e93d9099), [`9692adc2a6`](https://github.com/LedgerHQ/ledger-live/commit/9692adc2a6774feb4424fc7a984810918c946b1b), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec)]:
  - @ledgerhq/live-env@0.4.0-next.0
  - @ledgerhq/coin-evm@0.4.0-next.0
  - @ledgerhq/coin-framework@0.4.0-next.0
  - @ledgerhq/cryptoassets@9.10.0-next.0
  - @ledgerhq/errors@6.13.0-next.0
  - @ledgerhq/hw-app-eth@6.34.0-next.0
  - @ledgerhq/coin-algorand@0.2.4-next.0
  - @ledgerhq/coin-polkadot@0.3.1-next.0
  - @ledgerhq/evm-tools@1.0.1-next.0
  - @ledgerhq/live-network@1.1.3-next.0
  - @ledgerhq/domain-service@1.1.6-next.0
  - @ledgerhq/devices@8.0.5-next.0
  - @ledgerhq/hw-app-algorand@6.27.17-next.0
  - @ledgerhq/hw-app-cosmos@6.28.3-next.0
  - @ledgerhq/hw-app-exchange@0.2.1-next.0
  - @ledgerhq/hw-app-near@6.27.12-next.0
  - @ledgerhq/hw-app-polkadot@6.27.17-next.0
  - @ledgerhq/hw-app-solana@7.0.11-next.0
  - @ledgerhq/hw-app-trx@6.27.17-next.0
  - @ledgerhq/hw-transport@6.28.6-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.17-next.0
  - @ledgerhq/hw-transport-node-speculos-http@6.27.17-next.0
  - @ledgerhq/hw-app-btc@10.0.6-next.0
  - @ledgerhq/hw-app-str@6.27.17-next.0
  - @ledgerhq/hw-app-tezos@6.27.17-next.0
  - @ledgerhq/hw-app-xrp@6.27.17-next.0
  - @ledgerhq/hw-transport-mocker@6.27.17-next.0

## 31.2.0

### Minor Changes

- [#2441](https://github.com/LedgerHQ/ledger-live/pull/2441) [`44192f2ab2`](https://github.com/LedgerHQ/ledger-live/commit/44192f2ab2857cbae2ef4a81ee9608d395dcd2b9) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - edit eth transaction feature for LLD

- [#3611](https://github.com/LedgerHQ/ledger-live/pull/3611) [`092cb8d317`](https://github.com/LedgerHQ/ledger-live/commit/092cb8d317fa7971e0f790b77f900ae3864d96c2) Thanks [@chabroA](https://github.com/chabroA)! - Create GasTracker abstraction for evm familly

- [#3686](https://github.com/LedgerHQ/ledger-live/pull/3686) [`e4bd3297cf`](https://github.com/LedgerHQ/ledger-live/commit/e4bd3297cf1064faa04935c2e35455e06ed88e9e) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add pagination support for transaction history retrieved from cosmos nodes

- [#3389](https://github.com/LedgerHQ/ledger-live/pull/3389) [`f2bfff7234`](https://github.com/LedgerHQ/ledger-live/commit/f2bfff7234a4eaa41e039aec09c5dfb68c5cba39) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - add support to address type 4 and general improvements

- [#3389](https://github.com/LedgerHQ/ledger-live/pull/3389) [`f2bfff7234`](https://github.com/LedgerHQ/ledger-live/commit/f2bfff7234a4eaa41e039aec09c5dfb68c5cba39) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - change tag values for alternative derivation schemes on filecoin

- [#3742](https://github.com/LedgerHQ/ledger-live/pull/3742) [`cc31fc9213`](https://github.com/LedgerHQ/ledger-live/commit/cc31fc9213dc2e3e751b63a7722207dc711bbe3d) Thanks [@sarneijim](https://github.com/sarneijim)! - fix errors in exchangeComplete

### Patch Changes

- [#3741](https://github.com/LedgerHQ/ledger-live/pull/3741) [`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update eip55 dependency

- [#3828](https://github.com/LedgerHQ/ledger-live/pull/3828) [`32e3d60144`](https://github.com/LedgerHQ/ledger-live/commit/32e3d60144d3e6afebcffd87400c6cb1c10aeb67) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - Fix discover catalog visibility and ordering

- [#3875](https://github.com/LedgerHQ/ledger-live/pull/3875) [`8df4c0a0dc`](https://github.com/LedgerHQ/ledger-live/commit/8df4c0a0dcf1e2ff51dc49403f3a3c377ae272a8) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix a device action implementation issue that was causing the UI to flicker during device actions

- [#3752](https://github.com/LedgerHQ/ledger-live/pull/3752) [`e8b94aab79`](https://github.com/LedgerHQ/ledger-live/commit/e8b94aab79736d1ca4e81005ae9a8978e23cf0d5) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Add support for "Fido U2F", "Security Key" on v2 listApps as well as maintaining the order of installation in the storage bar

- [#3696](https://github.com/LedgerHQ/ledger-live/pull/3696) [`5af41b6fa1`](https://github.com/LedgerHQ/ledger-live/commit/5af41b6fa1e43037ccdb2df279c82e12ef3d2b1a) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Allow to enable listAppsV2 via feature flags instead of experimental settings

- [#3741](https://github.com/LedgerHQ/ledger-live/pull/3741) [`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update eip55 dependency to 2.1.1 fixing browser context usage

- [#3661](https://github.com/LedgerHQ/ledger-live/pull/3661) [`ea8e24732f`](https://github.com/LedgerHQ/ledger-live/commit/ea8e24732f44a9315eb5a27077cd9d34b6c408b4) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Logic implementation of the bulk uninstall apdu with test

- [#3628](https://github.com/LedgerHQ/ledger-live/pull/3628) [`42d99e6c65`](https://github.com/LedgerHQ/ledger-live/commit/42d99e6c659845b4893173af2ccbad4b098e2c15) Thanks [@grsoares21](https://github.com/grsoares21)! - Debounce device change events for longer than polling frequency on connect manager device action

- [#3657](https://github.com/LedgerHQ/ledger-live/pull/3657) [`88063df9d6`](https://github.com/LedgerHQ/ledger-live/commit/88063df9d6046c78c32258ea95cd527cda9214d5) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Sanitize the bulk exchange payload from HSM before exchanging it with the device

- Updated dependencies [[`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc), [`cb95f72c24`](https://github.com/LedgerHQ/ledger-live/commit/cb95f72c2415876ef88ca83fd2c4363a57669b92), [`be5f56b233`](https://github.com/LedgerHQ/ledger-live/commit/be5f56b2330c166323914b79fef37a3c05e0e13a), [`092cb8d317`](https://github.com/LedgerHQ/ledger-live/commit/092cb8d317fa7971e0f790b77f900ae3864d96c2), [`5af41b6fa1`](https://github.com/LedgerHQ/ledger-live/commit/5af41b6fa1e43037ccdb2df279c82e12ef3d2b1a), [`cc31fc9213`](https://github.com/LedgerHQ/ledger-live/commit/cc31fc9213dc2e3e751b63a7722207dc711bbe3d), [`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc), [`d1d1578ab5`](https://github.com/LedgerHQ/ledger-live/commit/d1d1578ab5b351544c98d56b67c68f18640f2d20), [`abd673dc7c`](https://github.com/LedgerHQ/ledger-live/commit/abd673dc7c994ad7efc8dd3199995a99add677c6)]:
  - @ledgerhq/domain-service@1.1.5
  - @ledgerhq/coin-evm@0.3.0
  - @ledgerhq/cryptoassets@9.9.0
  - @ledgerhq/live-env@0.3.1
  - @ledgerhq/hw-app-exchange@0.2.0
  - @ledgerhq/coin-polkadot@0.3.0
  - @ledgerhq/hw-app-eth@6.33.7
  - @ledgerhq/coin-algorand@0.2.3
  - @ledgerhq/coin-framework@0.3.7
  - @ledgerhq/live-network@1.1.2

## 31.2.0-next.2

### Patch Changes

- [#3875](https://github.com/LedgerHQ/ledger-live/pull/3875) [`8df4c0a0dc`](https://github.com/LedgerHQ/ledger-live/commit/8df4c0a0dcf1e2ff51dc49403f3a3c377ae272a8) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix a device action implementation issue that was causing the UI to flicker during device actions

## 31.2.0-next.1

### Patch Changes

- Updated dependencies [[`d1d1578ab5`](https://github.com/LedgerHQ/ledger-live/commit/d1d1578ab5b351544c98d56b67c68f18640f2d20)]:
  - @ledgerhq/coin-evm@0.3.0-next.1

## 31.2.0-next.0

### Minor Changes

- [#2441](https://github.com/LedgerHQ/ledger-live/pull/2441) [`44192f2ab2`](https://github.com/LedgerHQ/ledger-live/commit/44192f2ab2857cbae2ef4a81ee9608d395dcd2b9) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - edit eth transaction feature for LLD

- [#3611](https://github.com/LedgerHQ/ledger-live/pull/3611) [`092cb8d317`](https://github.com/LedgerHQ/ledger-live/commit/092cb8d317fa7971e0f790b77f900ae3864d96c2) Thanks [@chabroA](https://github.com/chabroA)! - Create GasTracker abstraction for evm familly

- [#3686](https://github.com/LedgerHQ/ledger-live/pull/3686) [`e4bd3297cf`](https://github.com/LedgerHQ/ledger-live/commit/e4bd3297cf1064faa04935c2e35455e06ed88e9e) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add pagination support for transaction history retrieved from cosmos nodes

- [#3389](https://github.com/LedgerHQ/ledger-live/pull/3389) [`f2bfff7234`](https://github.com/LedgerHQ/ledger-live/commit/f2bfff7234a4eaa41e039aec09c5dfb68c5cba39) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - add support to address type 4 and general improvements

- [#3389](https://github.com/LedgerHQ/ledger-live/pull/3389) [`f2bfff7234`](https://github.com/LedgerHQ/ledger-live/commit/f2bfff7234a4eaa41e039aec09c5dfb68c5cba39) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - change tag values for alternative derivation schemes on filecoin

- [#3742](https://github.com/LedgerHQ/ledger-live/pull/3742) [`cc31fc9213`](https://github.com/LedgerHQ/ledger-live/commit/cc31fc9213dc2e3e751b63a7722207dc711bbe3d) Thanks [@sarneijim](https://github.com/sarneijim)! - fix errors in exchangeComplete

### Patch Changes

- [#3741](https://github.com/LedgerHQ/ledger-live/pull/3741) [`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update eip55 dependency

- [#3828](https://github.com/LedgerHQ/ledger-live/pull/3828) [`32e3d60144`](https://github.com/LedgerHQ/ledger-live/commit/32e3d60144d3e6afebcffd87400c6cb1c10aeb67) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - Fix discover catalog visibility and ordering

- [#3752](https://github.com/LedgerHQ/ledger-live/pull/3752) [`e8b94aab79`](https://github.com/LedgerHQ/ledger-live/commit/e8b94aab79736d1ca4e81005ae9a8978e23cf0d5) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Add support for "Fido U2F", "Security Key" on v2 listApps as well as maintaining the order of installation in the storage bar

- [#3696](https://github.com/LedgerHQ/ledger-live/pull/3696) [`5af41b6fa1`](https://github.com/LedgerHQ/ledger-live/commit/5af41b6fa1e43037ccdb2df279c82e12ef3d2b1a) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Allow to enable listAppsV2 via feature flags instead of experimental settings

- [#3741](https://github.com/LedgerHQ/ledger-live/pull/3741) [`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update eip55 dependency to 2.1.1 fixing browser context usage

- [#3661](https://github.com/LedgerHQ/ledger-live/pull/3661) [`ea8e24732f`](https://github.com/LedgerHQ/ledger-live/commit/ea8e24732f44a9315eb5a27077cd9d34b6c408b4) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Logic implementation of the bulk uninstall apdu with test

- [#3628](https://github.com/LedgerHQ/ledger-live/pull/3628) [`42d99e6c65`](https://github.com/LedgerHQ/ledger-live/commit/42d99e6c659845b4893173af2ccbad4b098e2c15) Thanks [@grsoares21](https://github.com/grsoares21)! - Debounce device change events for longer than polling frequency on connect manager device action

- [#3657](https://github.com/LedgerHQ/ledger-live/pull/3657) [`88063df9d6`](https://github.com/LedgerHQ/ledger-live/commit/88063df9d6046c78c32258ea95cd527cda9214d5) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Sanitize the bulk exchange payload from HSM before exchanging it with the device

- Updated dependencies [[`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc), [`cb95f72c24`](https://github.com/LedgerHQ/ledger-live/commit/cb95f72c2415876ef88ca83fd2c4363a57669b92), [`be5f56b233`](https://github.com/LedgerHQ/ledger-live/commit/be5f56b2330c166323914b79fef37a3c05e0e13a), [`092cb8d317`](https://github.com/LedgerHQ/ledger-live/commit/092cb8d317fa7971e0f790b77f900ae3864d96c2), [`5af41b6fa1`](https://github.com/LedgerHQ/ledger-live/commit/5af41b6fa1e43037ccdb2df279c82e12ef3d2b1a), [`cc31fc9213`](https://github.com/LedgerHQ/ledger-live/commit/cc31fc9213dc2e3e751b63a7722207dc711bbe3d), [`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc), [`abd673dc7c`](https://github.com/LedgerHQ/ledger-live/commit/abd673dc7c994ad7efc8dd3199995a99add677c6)]:
  - @ledgerhq/domain-service@1.1.5-next.0
  - @ledgerhq/coin-evm@0.3.0-next.0
  - @ledgerhq/cryptoassets@9.9.0-next.0
  - @ledgerhq/live-env@0.3.1-next.0
  - @ledgerhq/hw-app-exchange@0.2.0-next.0
  - @ledgerhq/coin-polkadot@0.3.0-next.0
  - @ledgerhq/hw-app-eth@6.33.7-next.0
  - @ledgerhq/coin-algorand@0.2.3-next.0
  - @ledgerhq/coin-framework@0.3.7-next.0
  - @ledgerhq/live-network@1.1.2-next.0

## 31.1.0

### Minor Changes

- [#3497](https://github.com/LedgerHQ/ledger-live/pull/3497) [`81dd0c3ef3`](https://github.com/LedgerHQ/ledger-live/commit/81dd0c3ef38a3d6d69c27c65864bf1b41c52643c) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: new toggleOnboardingEarlyCheckAction device action

  Introducing a new device action (implemented in the device SDK): toggleOnboardingEarlyCheckAction with

  - its associated new command and task
  - its associated new onboarding state
  - a hook useToggleOnboardingEarlyCheck for simple usage on LLM and LLD
  - unit tests
  - its associated cli command deviceSDKToggleOnboardingEarlyCheck

  This new action uses a new APDU to enter and exit the "early security check" blocking step during the onboarding of Stax.

- [#3618](https://github.com/LedgerHQ/ledger-live/pull/3618) [`8f50c4d927`](https://github.com/LedgerHQ/ledger-live/commit/8f50c4d927f368fd869401b752a51ba7398e59e1) Thanks [@jnwng](https://github.com/jnwng)! - Updated `@solana/web3.js`, enabled versioned transactions

- [#3640](https://github.com/LedgerHQ/ledger-live/pull/3640) [`66fdfef314`](https://github.com/LedgerHQ/ledger-live/commit/66fdfef314b6dd63cfd74f00c579138b900ee241) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Change unbonding period for onomy

### Patch Changes

- [#3528](https://github.com/LedgerHQ/ledger-live/pull/3528) [`24483331fe`](https://github.com/LedgerHQ/ledger-live/commit/24483331fe19b9ae4a24544e2f3e1d2ad1892492) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Improve the image removal flow for Stax

- [#3329](https://github.com/LedgerHQ/ledger-live/pull/3329) [`b93f543a20`](https://github.com/LedgerHQ/ledger-live/commit/b93f543a207f35edbe25f3d609533120c9babbe1) Thanks [@loouis-t](https://github.com/loouis-t)! - Add icon for EUROC ERC20 token

- [#3400](https://github.com/LedgerHQ/ledger-live/pull/3400) [`3cf4397b60`](https://github.com/LedgerHQ/ledger-live/commit/3cf4397b60a2da5c1ee92cff42e9f979e30ad489) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Fix cosmos rewards value

- [#3483](https://github.com/LedgerHQ/ledger-live/pull/3483) [`4a1454beb3`](https://github.com/LedgerHQ/ledger-live/commit/4a1454beb3f86405ba2686e07879c12a7d35ad8e) Thanks [@gre](https://github.com/gre)! - use ledger currency id on Countervalues API usage.

- [#3542](https://github.com/LedgerHQ/ledger-live/pull/3542) [`db1a6f92e1`](https://github.com/LedgerHQ/ledger-live/commit/db1a6f92e17dcd63b0c9fa6700496f5f4722f1e5) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Add fake delay before device action failures for better UX

- [#3545](https://github.com/LedgerHQ/ledger-live/pull/3545) [`5bc987cd8f`](https://github.com/LedgerHQ/ledger-live/commit/5bc987cd8f850bb63e4ced62c28218d7c75744e8) Thanks [@IAmMorrow](https://github.com/IAmMorrow)! - Fixed a wallet-api message signature issue

- [#3617](https://github.com/LedgerHQ/ledger-live/pull/3617) [`42d8be7694`](https://github.com/LedgerHQ/ledger-live/commit/42d8be76949e258d6360a1fda3ca5a1df50c8bcb) Thanks [@JesseKuntz](https://github.com/JesseKuntz)! - Adjusting the commission calculation for NEAR validators as the value from the API has changed.

- [#3590](https://github.com/LedgerHQ/ledger-live/pull/3590) [`ac205cce9f`](https://github.com/LedgerHQ/ledger-live/commit/ac205cce9f328165369c5c270681be1d7ba7d0f2) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Prevent endless loop in swap request

- Updated dependencies [[`9adc1862dd`](https://github.com/LedgerHQ/ledger-live/commit/9adc1862dda605a722d19f3b6895bd324834c914), [`4a1454beb3`](https://github.com/LedgerHQ/ledger-live/commit/4a1454beb3f86405ba2686e07879c12a7d35ad8e), [`d1aa522db7`](https://github.com/LedgerHQ/ledger-live/commit/d1aa522db75f7ea850efe412abaa4dc7d37af6b7), [`ebe5b07afe`](https://github.com/LedgerHQ/ledger-live/commit/ebe5b07afec441ea3e2d9103da9e1175972add47), [`895205e898`](https://github.com/LedgerHQ/ledger-live/commit/895205e8981612616d3147de9261d19051dbc0b2)]:
  - @ledgerhq/errors@6.12.7
  - @ledgerhq/cryptoassets@9.8.0
  - @ledgerhq/coin-polkadot@0.2.0
  - @ledgerhq/coin-algorand@0.2.2
  - @ledgerhq/coin-evm@0.2.1
  - @ledgerhq/coin-framework@0.3.6
  - @ledgerhq/domain-service@1.1.4
  - @ledgerhq/devices@8.0.4
  - @ledgerhq/hw-app-cosmos@6.28.2
  - @ledgerhq/hw-app-eth@6.33.6
  - @ledgerhq/hw-app-exchange@0.1.3
  - @ledgerhq/hw-app-near@6.27.11
  - @ledgerhq/hw-app-polkadot@6.27.16
  - @ledgerhq/hw-app-solana@7.0.10
  - @ledgerhq/hw-app-trx@6.27.16
  - @ledgerhq/hw-transport@6.28.5
  - @ledgerhq/hw-transport-node-speculos-http@6.27.16
  - @ledgerhq/live-network@1.1.1
  - @ledgerhq/live-portfolio@0.0.8
  - @ledgerhq/hw-app-btc@10.0.5
  - @ledgerhq/hw-app-str@6.27.16
  - @ledgerhq/hw-app-tezos@6.27.16
  - @ledgerhq/hw-app-xrp@6.27.16
  - @ledgerhq/hw-transport-mocker@6.27.16

## 31.1.0-next.1

### Patch Changes

- Updated dependencies [[`895205e898`](https://github.com/LedgerHQ/ledger-live/commit/895205e8981612616d3147de9261d19051dbc0b2)]:
  - @ledgerhq/coin-polkadot@0.2.0-next.1

## 31.1.0-next.0

### Minor Changes

- [#3497](https://github.com/LedgerHQ/ledger-live/pull/3497) [`81dd0c3ef3`](https://github.com/LedgerHQ/ledger-live/commit/81dd0c3ef38a3d6d69c27c65864bf1b41c52643c) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: new toggleOnboardingEarlyCheckAction device action

  Introducing a new device action (implemented in the device SDK): toggleOnboardingEarlyCheckAction with

  - its associated new command and task
  - its associated new onboarding state
  - a hook useToggleOnboardingEarlyCheck for simple usage on LLM and LLD
  - unit tests
  - its associated cli command deviceSDKToggleOnboardingEarlyCheck

  This new action uses a new APDU to enter and exit the "early security check" blocking step during the onboarding of Stax.

- [#3618](https://github.com/LedgerHQ/ledger-live/pull/3618) [`8f50c4d927`](https://github.com/LedgerHQ/ledger-live/commit/8f50c4d927f368fd869401b752a51ba7398e59e1) Thanks [@jnwng](https://github.com/jnwng)! - Updated `@solana/web3.js`, enabled versioned transactions

- [#3640](https://github.com/LedgerHQ/ledger-live/pull/3640) [`66fdfef314`](https://github.com/LedgerHQ/ledger-live/commit/66fdfef314b6dd63cfd74f00c579138b900ee241) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Change unbonding period for onomy

### Patch Changes

- [#3528](https://github.com/LedgerHQ/ledger-live/pull/3528) [`24483331fe`](https://github.com/LedgerHQ/ledger-live/commit/24483331fe19b9ae4a24544e2f3e1d2ad1892492) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Improve the image removal flow for Stax

- [#3329](https://github.com/LedgerHQ/ledger-live/pull/3329) [`b93f543a20`](https://github.com/LedgerHQ/ledger-live/commit/b93f543a207f35edbe25f3d609533120c9babbe1) Thanks [@loouis-t](https://github.com/loouis-t)! - Add icon for EUROC ERC20 token

- [#3400](https://github.com/LedgerHQ/ledger-live/pull/3400) [`3cf4397b60`](https://github.com/LedgerHQ/ledger-live/commit/3cf4397b60a2da5c1ee92cff42e9f979e30ad489) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Fix cosmos rewards value

- [#3483](https://github.com/LedgerHQ/ledger-live/pull/3483) [`4a1454beb3`](https://github.com/LedgerHQ/ledger-live/commit/4a1454beb3f86405ba2686e07879c12a7d35ad8e) Thanks [@gre](https://github.com/gre)! - use ledger currency id on Countervalues API usage.

- [#3542](https://github.com/LedgerHQ/ledger-live/pull/3542) [`db1a6f92e1`](https://github.com/LedgerHQ/ledger-live/commit/db1a6f92e17dcd63b0c9fa6700496f5f4722f1e5) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Add fake delay before device action failures for better UX

- [#3545](https://github.com/LedgerHQ/ledger-live/pull/3545) [`5bc987cd8f`](https://github.com/LedgerHQ/ledger-live/commit/5bc987cd8f850bb63e4ced62c28218d7c75744e8) Thanks [@IAmMorrow](https://github.com/IAmMorrow)! - Fixed a wallet-api message signature issue

- [#3617](https://github.com/LedgerHQ/ledger-live/pull/3617) [`42d8be7694`](https://github.com/LedgerHQ/ledger-live/commit/42d8be76949e258d6360a1fda3ca5a1df50c8bcb) Thanks [@JesseKuntz](https://github.com/JesseKuntz)! - Adjusting the commission calculation for NEAR validators as the value from the API has changed.

- [#3590](https://github.com/LedgerHQ/ledger-live/pull/3590) [`ac205cce9f`](https://github.com/LedgerHQ/ledger-live/commit/ac205cce9f328165369c5c270681be1d7ba7d0f2) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Prevent endless loop in swap request

- Updated dependencies [[`9adc1862dd`](https://github.com/LedgerHQ/ledger-live/commit/9adc1862dda605a722d19f3b6895bd324834c914), [`4a1454beb3`](https://github.com/LedgerHQ/ledger-live/commit/4a1454beb3f86405ba2686e07879c12a7d35ad8e), [`d1aa522db7`](https://github.com/LedgerHQ/ledger-live/commit/d1aa522db75f7ea850efe412abaa4dc7d37af6b7), [`ebe5b07afe`](https://github.com/LedgerHQ/ledger-live/commit/ebe5b07afec441ea3e2d9103da9e1175972add47)]:
  - @ledgerhq/errors@6.12.7-next.0
  - @ledgerhq/cryptoassets@9.8.0-next.0
  - @ledgerhq/coin-algorand@0.2.2-next.0
  - @ledgerhq/coin-evm@0.2.1-next.0
  - @ledgerhq/coin-framework@0.3.6-next.0
  - @ledgerhq/coin-polkadot@0.1.7-next.0
  - @ledgerhq/domain-service@1.1.4-next.0
  - @ledgerhq/devices@8.0.4-next.0
  - @ledgerhq/hw-app-cosmos@6.28.2-next.0
  - @ledgerhq/hw-app-eth@6.33.6-next.0
  - @ledgerhq/hw-app-exchange@0.1.3-next.0
  - @ledgerhq/hw-app-near@6.27.11-next.0
  - @ledgerhq/hw-app-polkadot@6.27.16-next.0
  - @ledgerhq/hw-app-solana@7.0.10-next.0
  - @ledgerhq/hw-app-trx@6.27.16-next.0
  - @ledgerhq/hw-transport@6.28.5-next.0
  - @ledgerhq/hw-transport-node-speculos-http@6.27.16-next.0
  - @ledgerhq/live-network@1.1.1-next.0
  - @ledgerhq/live-portfolio@0.0.8-next.0
  - @ledgerhq/hw-app-btc@10.0.5-next.0
  - @ledgerhq/hw-app-str@6.27.16-next.0
  - @ledgerhq/hw-app-tezos@6.27.16-next.0
  - @ledgerhq/hw-app-xrp@6.27.16-next.0
  - @ledgerhq/hw-transport-mocker@6.27.16-next.0

## 31.0.0

### Major Changes

- [#3536](https://github.com/LedgerHQ/ledger-live/pull/3536) [`a380bfc53a`](https://github.com/LedgerHQ/ledger-live/commit/a380bfc53a25bf196031337cd7ab8bc459731e16) Thanks [@chabroA](https://github.com/chabroA)! - Move evm familly logic in own package

### Minor Changes

- [#3515](https://github.com/LedgerHQ/ledger-live/pull/3515) [`ce675302c7`](https://github.com/LedgerHQ/ledger-live/commit/ce675302c78311571e1087cfa35ee67580263796) Thanks [@chabroA](https://github.com/chabroA)! - Use live-network package

- [#3468](https://github.com/LedgerHQ/ledger-live/pull/3468) [`5c28db16a5`](https://github.com/LedgerHQ/ledger-live/commit/5c28db16a5b7e804dff8e51062baca311574a50c) Thanks [@RamyEB](https://github.com/RamyEB)! - Chnage api call + type

- [#2977](https://github.com/LedgerHQ/ledger-live/pull/2977) [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500) Thanks [@grsoares21](https://github.com/grsoares21)! - Minor changes on several device actions to allow for retries and to better manage the state in memory

- [#2977](https://github.com/LedgerHQ/ledger-live/pull/2977) [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500) Thanks [@grsoares21](https://github.com/grsoares21)! - Add new commands to the device SDK, refactorings on the firmware update device actions and hook

- [#2977](https://github.com/LedgerHQ/ledger-live/pull/2977) [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500) Thanks [@grsoares21](https://github.com/grsoares21)! - Retrieve the updated firmware info after the execution of the new firmware update device action

- [#3491](https://github.com/LedgerHQ/ledger-live/pull/3491) [`f13bf2e2cc`](https://github.com/LedgerHQ/ledger-live/commit/f13bf2e2ccd1684692e1f641b66f0f3b4d457c2d) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Update LiveAppManifest params type whilst keeping it backwards compatible. Add helper functions to fetch and augment the manifest.params.dappUrl

### Patch Changes

- [#3320](https://github.com/LedgerHQ/ledger-live/pull/3320) [`b574c30b2b`](https://github.com/LedgerHQ/ledger-live/commit/b574c30b2ba9ba49e12ab20ce1fd7c68c2220acf) Thanks [@lvndry](https://github.com/lvndry)! - Rework add account feature flagging in manager app

- [#3194](https://github.com/LedgerHQ/ledger-live/pull/3194) [`76699bc304`](https://github.com/LedgerHQ/ledger-live/commit/76699bc304204232b280984644a7c5709fdff063) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - improve bitcoin sync performance

- [#2977](https://github.com/LedgerHQ/ledger-live/pull/2977) [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500) Thanks [@grsoares21](https://github.com/grsoares21)! - Minor code style fixes

- [#3454](https://github.com/LedgerHQ/ledger-live/pull/3454) [`eb258d57c2`](https://github.com/LedgerHQ/ledger-live/commit/eb258d57c2abd8d0db9154a82932e1fd83bfce9a) Thanks [@overcat](https://github.com/overcat)! - fix the calculation of spendable balance in Stellar accounts.

- [#3525](https://github.com/LedgerHQ/ledger-live/pull/3525) [`b40fa18379`](https://github.com/LedgerHQ/ledger-live/commit/b40fa18379bcadb56e8cbd902a299426d97e2345) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix `mustUpgrade` & `shouldUpgrade` for pre-release tags with higher than exepected versions

- [#3584](https://github.com/LedgerHQ/ledger-live/pull/3584) [`5c53afd2c2`](https://github.com/LedgerHQ/ledger-live/commit/5c53afd2c2a343c52f5bf36cc08f55c06f313eed) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Prevent endless loop in swap request

- Updated dependencies [[`5cce6e3593`](https://github.com/LedgerHQ/ledger-live/commit/5cce6e359309110df53e16ef989c5b8b94492dfd), [`a380bfc53a`](https://github.com/LedgerHQ/ledger-live/commit/a380bfc53a25bf196031337cd7ab8bc459731e16), [`30bf4d92c7`](https://github.com/LedgerHQ/ledger-live/commit/30bf4d92c7d79cb81b1e4ad014857459739c33be), [`b30ead9d22`](https://github.com/LedgerHQ/ledger-live/commit/b30ead9d22a4bce5f8ee27febf0190fccd2ca25b), [`ce675302c7`](https://github.com/LedgerHQ/ledger-live/commit/ce675302c78311571e1087cfa35ee67580263796)]:
  - @ledgerhq/cryptoassets@9.7.0
  - @ledgerhq/coin-evm@0.2.0
  - @ledgerhq/live-network@1.1.0
  - @ledgerhq/coin-algorand@0.2.1
  - @ledgerhq/coin-framework@0.3.5
  - @ledgerhq/coin-polkadot@0.1.6
  - @ledgerhq/domain-service@1.1.3
  - @ledgerhq/hw-app-eth@6.33.5
  - @ledgerhq/live-portfolio@0.0.7

## 31.0.0-next.2

### Patch Changes

- [#3584](https://github.com/LedgerHQ/ledger-live/pull/3584) [`5c53afd2c2`](https://github.com/LedgerHQ/ledger-live/commit/5c53afd2c2a343c52f5bf36cc08f55c06f313eed) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Prevent endless loop in swap request

## 31.0.0-next.1

### Patch Changes

- Updated dependencies [[`30bf4d92c7`](https://github.com/LedgerHQ/ledger-live/commit/30bf4d92c7d79cb81b1e4ad014857459739c33be)]:
  - @ledgerhq/cryptoassets@9.7.0-next.1
  - @ledgerhq/coin-algorand@0.2.1-next.1
  - @ledgerhq/coin-evm@0.2.0-next.1
  - @ledgerhq/coin-framework@0.3.5-next.1
  - @ledgerhq/coin-polkadot@0.1.6-next.1
  - @ledgerhq/domain-service@1.1.3-next.1
  - @ledgerhq/hw-app-eth@6.33.5-next.1

## 31.0.0-next.0

### Major Changes

- [#3536](https://github.com/LedgerHQ/ledger-live/pull/3536) [`a380bfc53a`](https://github.com/LedgerHQ/ledger-live/commit/a380bfc53a25bf196031337cd7ab8bc459731e16) Thanks [@chabroA](https://github.com/chabroA)! - Move evm familly logic in own package

### Minor Changes

- [#3515](https://github.com/LedgerHQ/ledger-live/pull/3515) [`ce675302c7`](https://github.com/LedgerHQ/ledger-live/commit/ce675302c78311571e1087cfa35ee67580263796) Thanks [@chabroA](https://github.com/chabroA)! - Use live-network package

- [#3468](https://github.com/LedgerHQ/ledger-live/pull/3468) [`5c28db16a5`](https://github.com/LedgerHQ/ledger-live/commit/5c28db16a5b7e804dff8e51062baca311574a50c) Thanks [@RamyEB](https://github.com/RamyEB)! - Chnage api call + type

- [#2977](https://github.com/LedgerHQ/ledger-live/pull/2977) [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500) Thanks [@grsoares21](https://github.com/grsoares21)! - Minor changes on several device actions to allow for retries and to better manage the state in memory

- [#2977](https://github.com/LedgerHQ/ledger-live/pull/2977) [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500) Thanks [@grsoares21](https://github.com/grsoares21)! - Add new commands to the device SDK, refactorings on the firmware update device actions and hook

- [#2977](https://github.com/LedgerHQ/ledger-live/pull/2977) [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500) Thanks [@grsoares21](https://github.com/grsoares21)! - Retrieve the updated firmware info after the execution of the new firmware update device action

- [#3491](https://github.com/LedgerHQ/ledger-live/pull/3491) [`f13bf2e2cc`](https://github.com/LedgerHQ/ledger-live/commit/f13bf2e2ccd1684692e1f641b66f0f3b4d457c2d) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - Update LiveAppManifest params type whilst keeping it backwards compatible. Add helper functions to fetch and augment the manifest.params.dappUrl

### Patch Changes

- [#3320](https://github.com/LedgerHQ/ledger-live/pull/3320) [`b574c30b2b`](https://github.com/LedgerHQ/ledger-live/commit/b574c30b2ba9ba49e12ab20ce1fd7c68c2220acf) Thanks [@lvndry](https://github.com/lvndry)! - Rework add account feature flagging in manager app

- [#3194](https://github.com/LedgerHQ/ledger-live/pull/3194) [`76699bc304`](https://github.com/LedgerHQ/ledger-live/commit/76699bc304204232b280984644a7c5709fdff063) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - improve bitcoin sync performance

- [#2977](https://github.com/LedgerHQ/ledger-live/pull/2977) [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500) Thanks [@grsoares21](https://github.com/grsoares21)! - Minor code style fixes

- [#3454](https://github.com/LedgerHQ/ledger-live/pull/3454) [`eb258d57c2`](https://github.com/LedgerHQ/ledger-live/commit/eb258d57c2abd8d0db9154a82932e1fd83bfce9a) Thanks [@overcat](https://github.com/overcat)! - fix the calculation of spendable balance in Stellar accounts.

- [#3525](https://github.com/LedgerHQ/ledger-live/pull/3525) [`b40fa18379`](https://github.com/LedgerHQ/ledger-live/commit/b40fa18379bcadb56e8cbd902a299426d97e2345) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix `mustUpgrade` & `shouldUpgrade` for pre-release tags with higher than exepected versions

- Updated dependencies [[`5cce6e3593`](https://github.com/LedgerHQ/ledger-live/commit/5cce6e359309110df53e16ef989c5b8b94492dfd), [`a380bfc53a`](https://github.com/LedgerHQ/ledger-live/commit/a380bfc53a25bf196031337cd7ab8bc459731e16), [`b30ead9d22`](https://github.com/LedgerHQ/ledger-live/commit/b30ead9d22a4bce5f8ee27febf0190fccd2ca25b), [`7439b63325`](https://github.com/LedgerHQ/ledger-live/commit/7439b63325a9b0181a3af4310ba787f00faa80c9), [`ce675302c7`](https://github.com/LedgerHQ/ledger-live/commit/ce675302c78311571e1087cfa35ee67580263796)]:
  - @ledgerhq/cryptoassets@9.7.0-next.0
  - @ledgerhq/coin-evm@0.2.0-next.0
  - @ledgerhq/live-network@1.1.0-next.0
  - @ledgerhq/coin-algorand@0.2.1-next.0
  - @ledgerhq/coin-framework@0.3.5-next.0
  - @ledgerhq/coin-polkadot@0.1.6-next.0
  - @ledgerhq/domain-service@1.1.3-next.0
  - @ledgerhq/hw-app-eth@6.33.5-next.0
  - @ledgerhq/live-portfolio@0.0.7-next.0

## 30.0.0

### Major Changes

- [#3306](https://github.com/LedgerHQ/ledger-live/pull/3306) [`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546) Thanks [@chabroA](https://github.com/chabroA)! - Move algorand coin logic in own package

### Minor Changes

- [#3338](https://github.com/LedgerHQ/ledger-live/pull/3338) [`22491091f7`](https://github.com/LedgerHQ/ledger-live/commit/22491091f7b4e06ee6a0cdf964498aa5b08d6eb0) Thanks [@chabroA](https://github.com/chabroA)! - Restore full network logs under env var and with experimental setting

- [#3405](https://github.com/LedgerHQ/ledger-live/pull/3405) [`eb3997d762`](https://github.com/LedgerHQ/ledger-live/commit/eb3997d7621c78e2f7f224d5f62a7857aae873e2) Thanks [@Justkant](https://github.com/Justkant)! - feat: stax recover onboarding [PROTECT-1710]

- [#3411](https://github.com/LedgerHQ/ledger-live/pull/3411) [`2b24af44c3`](https://github.com/LedgerHQ/ledger-live/commit/2b24af44c3f77f2bc46f7a2d9ebcf1ae3759ef80) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Change Speculos Transport with http one

- [#3418](https://github.com/LedgerHQ/ledger-live/pull/3418) [`034c68fe40`](https://github.com/LedgerHQ/ledger-live/commit/034c68fe40220dbb2c33a549a26bd0d67097eb45) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - upgrade wallet-api to support EIP-1559 on dapp browser

### Patch Changes

- [#3324](https://github.com/LedgerHQ/ledger-live/pull/3324) [`186e82c88b`](https://github.com/LedgerHQ/ledger-live/commit/186e82c88b196976f62e776e9d060eab565234f9) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: clean filtering on toasts

- [#3322](https://github.com/LedgerHQ/ledger-live/pull/3322) [`4da51fc11e`](https://github.com/LedgerHQ/ledger-live/commit/4da51fc11eb3244c74a499167c0de77913ded68b) Thanks [@juan-cortes](https://github.com/juan-cortes)! - implementation of cls removal on llc

- [#3452](https://github.com/LedgerHQ/ledger-live/pull/3452) [`6d09361b6b`](https://github.com/LedgerHQ/ledger-live/commit/6d09361b6b8de34c6b202e00c9bac8f4844eb105) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Correctly serialize feesCurrency

- [#3322](https://github.com/LedgerHQ/ledger-live/pull/3322) [`4da51fc11e`](https://github.com/LedgerHQ/ledger-live/commit/4da51fc11eb3244c74a499167c0de77913ded68b) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Implemented remove custom image command for stax and exposed it on CLI.

- [#3489](https://github.com/LedgerHQ/ledger-live/pull/3489) [`6036036c92`](https://github.com/LedgerHQ/ledger-live/commit/6036036c92ff7236468e748a936d50b0feb65c92) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add validators to persistence, onomy, quicksilver, axelar

- Updated dependencies [[`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546), [`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546), [`817a8dd811`](https://github.com/LedgerHQ/ledger-live/commit/817a8dd8112ff7c4640852ab4e47ea0436df2ec1), [`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546), [`22491091f7`](https://github.com/LedgerHQ/ledger-live/commit/22491091f7b4e06ee6a0cdf964498aa5b08d6eb0), [`7cf49e1919`](https://github.com/LedgerHQ/ledger-live/commit/7cf49e1919466836e9025693ed07b18ebf99041a)]:
  - @ledgerhq/errors@6.12.6
  - @ledgerhq/coin-algorand@0.2.0
  - @ledgerhq/cryptoassets@9.6.0
  - @ledgerhq/coin-framework@0.3.4
  - @ledgerhq/live-env@0.3.0
  - @ledgerhq/coin-polkadot@0.1.5
  - @ledgerhq/domain-service@1.1.2
  - @ledgerhq/devices@8.0.3
  - @ledgerhq/hw-app-cosmos@6.28.1
  - @ledgerhq/hw-app-eth@6.33.4
  - @ledgerhq/hw-app-exchange@0.1.2
  - @ledgerhq/hw-app-near@6.27.10
  - @ledgerhq/hw-app-polkadot@6.27.15
  - @ledgerhq/hw-app-solana@7.0.9
  - @ledgerhq/hw-app-trx@6.27.15
  - @ledgerhq/hw-transport@6.28.4
  - @ledgerhq/hw-transport-node-speculos-http@6.27.15
  - @ledgerhq/live-portfolio@0.0.6
  - @ledgerhq/hw-app-btc@10.0.4
  - @ledgerhq/hw-app-str@6.27.15
  - @ledgerhq/hw-app-tezos@6.27.15
  - @ledgerhq/hw-app-xrp@6.27.15
  - @ledgerhq/hw-transport-mocker@6.27.15

## 30.0.0-next.0

### Major Changes

- [#3306](https://github.com/LedgerHQ/ledger-live/pull/3306) [`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546) Thanks [@chabroA](https://github.com/chabroA)! - Move algorand coin logic in own package

### Minor Changes

- [#3338](https://github.com/LedgerHQ/ledger-live/pull/3338) [`22491091f7`](https://github.com/LedgerHQ/ledger-live/commit/22491091f7b4e06ee6a0cdf964498aa5b08d6eb0) Thanks [@chabroA](https://github.com/chabroA)! - Restore full network logs under env var and with experimental setting

- [#3405](https://github.com/LedgerHQ/ledger-live/pull/3405) [`eb3997d762`](https://github.com/LedgerHQ/ledger-live/commit/eb3997d7621c78e2f7f224d5f62a7857aae873e2) Thanks [@Justkant](https://github.com/Justkant)! - feat: stax recover onboarding [PROTECT-1710]

- [#3411](https://github.com/LedgerHQ/ledger-live/pull/3411) [`2b24af44c3`](https://github.com/LedgerHQ/ledger-live/commit/2b24af44c3f77f2bc46f7a2d9ebcf1ae3759ef80) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Change Speculos Transport with http one

- [#3418](https://github.com/LedgerHQ/ledger-live/pull/3418) [`034c68fe40`](https://github.com/LedgerHQ/ledger-live/commit/034c68fe40220dbb2c33a549a26bd0d67097eb45) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - upgrade wallet-api to support EIP-1559 on dapp browser

### Patch Changes

- [#3324](https://github.com/LedgerHQ/ledger-live/pull/3324) [`186e82c88b`](https://github.com/LedgerHQ/ledger-live/commit/186e82c88b196976f62e776e9d060eab565234f9) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: clean filtering on toasts

- [#3322](https://github.com/LedgerHQ/ledger-live/pull/3322) [`4da51fc11e`](https://github.com/LedgerHQ/ledger-live/commit/4da51fc11eb3244c74a499167c0de77913ded68b) Thanks [@juan-cortes](https://github.com/juan-cortes)! - implementation of cls removal on llc

- [#3452](https://github.com/LedgerHQ/ledger-live/pull/3452) [`6d09361b6b`](https://github.com/LedgerHQ/ledger-live/commit/6d09361b6b8de34c6b202e00c9bac8f4844eb105) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Correctly serialize feesCurrency

- [#3322](https://github.com/LedgerHQ/ledger-live/pull/3322) [`4da51fc11e`](https://github.com/LedgerHQ/ledger-live/commit/4da51fc11eb3244c74a499167c0de77913ded68b) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Implemented remove custom image command for stax and exposed it on CLI.

- [#3489](https://github.com/LedgerHQ/ledger-live/pull/3489) [`6036036c92`](https://github.com/LedgerHQ/ledger-live/commit/6036036c92ff7236468e748a936d50b0feb65c92) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add validators to persistence, onomy, quicksilver, axelar

- Updated dependencies [[`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546), [`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546), [`817a8dd811`](https://github.com/LedgerHQ/ledger-live/commit/817a8dd8112ff7c4640852ab4e47ea0436df2ec1), [`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546), [`22491091f7`](https://github.com/LedgerHQ/ledger-live/commit/22491091f7b4e06ee6a0cdf964498aa5b08d6eb0), [`7cf49e1919`](https://github.com/LedgerHQ/ledger-live/commit/7cf49e1919466836e9025693ed07b18ebf99041a)]:
  - @ledgerhq/errors@6.12.6-next.0
  - @ledgerhq/coin-algorand@0.2.0-next.0
  - @ledgerhq/cryptoassets@9.6.0-next.0
  - @ledgerhq/coin-framework@0.3.4-next.0
  - @ledgerhq/live-env@0.3.0-next.0
  - @ledgerhq/coin-polkadot@0.1.5-next.0
  - @ledgerhq/domain-service@1.1.2-next.0
  - @ledgerhq/devices@8.0.3-next.0
  - @ledgerhq/hw-app-cosmos@6.28.1-next.0
  - @ledgerhq/hw-app-eth@6.33.4-next.0
  - @ledgerhq/hw-app-exchange@0.1.2-next.0
  - @ledgerhq/hw-app-near@6.27.10-next.0
  - @ledgerhq/hw-app-polkadot@6.27.15-next.0
  - @ledgerhq/hw-app-solana@7.0.9-next.0
  - @ledgerhq/hw-app-trx@6.27.15-next.0
  - @ledgerhq/hw-transport@6.28.4-next.0
  - @ledgerhq/hw-transport-node-speculos-http@6.27.15-next.0
  - @ledgerhq/live-portfolio@0.0.6-next.0
  - @ledgerhq/hw-app-btc@10.0.4-next.0
  - @ledgerhq/hw-app-str@6.27.15-next.0
  - @ledgerhq/hw-app-tezos@6.27.15-next.0
  - @ledgerhq/hw-app-xrp@6.27.15-next.0
  - @ledgerhq/hw-transport-mocker@6.27.15-next.0

## 29.6.0

### Minor Changes

- [#3366](https://github.com/LedgerHQ/ledger-live/pull/3366) [`491b37f08d`](https://github.com/LedgerHQ/ledger-live/commit/491b37f08d9a17404eaf32c491628e65d2d8666a) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Updating the `shouldUpgrade` & `mustUpgrade` helpers to allow for pre-release tags

- [#3255](https://github.com/LedgerHQ/ledger-live/pull/3255) [`0e4f34fac2`](https://github.com/LedgerHQ/ledger-live/commit/0e4f34fac2ceebdece29d408e914b3664228db36) Thanks [@RamyEB](https://github.com/RamyEB)! - add field visibility to manifest and tests

### Patch Changes

- [#3386](https://github.com/LedgerHQ/ledger-live/pull/3386) [`dfccb01b94`](https://github.com/LedgerHQ/ledger-live/commit/dfccb01b94d545af80ee5e77bf1d04d9d2fd0faa) Thanks [@grsoares21](https://github.com/grsoares21)! - Throttle the events coming from inline app installs. They were causing the UI to slow down as they weren't being properly throttled.

- Updated dependencies [[`fb1fcc47e4`](https://github.com/LedgerHQ/ledger-live/commit/fb1fcc47e444c35b0908d528b58e096d79d6f967)]:
  - @ledgerhq/hw-app-btc@10.0.3
  - @ledgerhq/coin-framework@0.3.3
  - @ledgerhq/coin-polkadot@0.1.4
  - @ledgerhq/domain-service@1.1.1
  - @ledgerhq/live-portfolio@0.0.5
  - @ledgerhq/hw-app-eth@6.33.3

## 29.6.0-next.0

### Minor Changes

- [#3366](https://github.com/LedgerHQ/ledger-live/pull/3366) [`491b37f08d`](https://github.com/LedgerHQ/ledger-live/commit/491b37f08d9a17404eaf32c491628e65d2d8666a) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Updating the `shouldUpgrade` & `mustUpgrade` helpers to allow for pre-release tags

- [#3255](https://github.com/LedgerHQ/ledger-live/pull/3255) [`0e4f34fac2`](https://github.com/LedgerHQ/ledger-live/commit/0e4f34fac2ceebdece29d408e914b3664228db36) Thanks [@RamyEB](https://github.com/RamyEB)! - add field visibility to manifest and tests

### Patch Changes

- [#3386](https://github.com/LedgerHQ/ledger-live/pull/3386) [`dfccb01b94`](https://github.com/LedgerHQ/ledger-live/commit/dfccb01b94d545af80ee5e77bf1d04d9d2fd0faa) Thanks [@grsoares21](https://github.com/grsoares21)! - Throttle the events coming from inline app installs. They were causing the UI to slow down as they weren't being properly throttled.

- Updated dependencies [[`fb1fcc47e4`](https://github.com/LedgerHQ/ledger-live/commit/fb1fcc47e444c35b0908d528b58e096d79d6f967)]:
  - @ledgerhq/hw-app-btc@10.0.3-next.0
  - @ledgerhq/coin-framework@0.3.3-next.0
  - @ledgerhq/coin-polkadot@0.1.4-next.0
  - @ledgerhq/domain-service@1.1.1-next.0
  - @ledgerhq/live-portfolio@0.0.5-next.0
  - @ledgerhq/hw-app-eth@6.33.3-next.0

## 29.5.0

### Minor Changes

- [#3315](https://github.com/LedgerHQ/ledger-live/pull/3315) [`a1c1ea56aa`](https://github.com/LedgerHQ/ledger-live/commit/a1c1ea56aa2a9e106b831107d8fae24ea0f27d4d) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add env & exerimental feature for the base fee multiplier used to compose the maxFeePerGas of an EIP1559 transaction

- [#3153](https://github.com/LedgerHQ/ledger-live/pull/3153) [`cec978f36e`](https://github.com/LedgerHQ/ledger-live/commit/cec978f36e5841ce3f8d117530e13902590596c3) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Adding support for new EVM chains, including Layer 2s like Optimism & Arbitrum

- [#3105](https://github.com/LedgerHQ/ledger-live/pull/3105) [`5d7bd8c68e`](https://github.com/LedgerHQ/ledger-live/commit/5d7bd8c68ee33507ff065c05965e1a8c387a4fae) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Refactor device action implementations unifying the logic

- [#2809](https://github.com/LedgerHQ/ledger-live/pull/2809) [`51c01541df`](https://github.com/LedgerHQ/ledger-live/commit/51c01541df8a414851ea4ef493dc9045272ef949) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add Quicksilver, Persistence, Onomy, Axelar to Cosmos family

- [#2953](https://github.com/LedgerHQ/ledger-live/pull/2953) [`baa687a281`](https://github.com/LedgerHQ/ledger-live/commit/baa687a281b5f75cacd06b05b5438807874fa152) Thanks [@RamyEB](https://github.com/RamyEB)! - refacto type and name of platform field

### Patch Changes

- [#3271](https://github.com/LedgerHQ/ledger-live/pull/3271) [`07fc266a10`](https://github.com/LedgerHQ/ledger-live/commit/07fc266a10479f77044e36b9347b9a97e42f0566) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix regression in the stax load image introduced by device action rework

- [#3227](https://github.com/LedgerHQ/ledger-live/pull/3227) [`f11d282bde`](https://github.com/LedgerHQ/ledger-live/commit/f11d282bded679dfcbb0bbffe88055d55995e03f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add helper for Segment event/properties

- [#3369](https://github.com/LedgerHQ/ledger-live/pull/3369) [`0ebfbbf596`](https://github.com/LedgerHQ/ledger-live/commit/0ebfbbf596ef3d690f1eb225698512f9a1108b59) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Update osmosis node to fix history

- [#3244](https://github.com/LedgerHQ/ledger-live/pull/3244) [`5e6f053a27`](https://github.com/LedgerHQ/ledger-live/commit/5e6f053a2744a5ff5f5364609cc1287c3dd8e69e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add new FF

- [#3280](https://github.com/LedgerHQ/ledger-live/pull/3280) [`d67f7480f7`](https://github.com/LedgerHQ/ledger-live/commit/d67f7480f767ffceab82a43c37089948315a3fc4) Thanks [@lvndry](https://github.com/lvndry)! - Delete api folder in live-common

- [#3364](https://github.com/LedgerHQ/ledger-live/pull/3364) [`164409ab4e`](https://github.com/LedgerHQ/ledger-live/commit/164409ab4e035bb6c941c2f5a0c4e26873c52270) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Fix onomy redelegation

- [#3241](https://github.com/LedgerHQ/ledger-live/pull/3241) [`ec9426b354`](https://github.com/LedgerHQ/ledger-live/commit/ec9426b354156eb9362a74649a1f887a3aef7f8d) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLC - Stop tracking SyncError event

- [#3229](https://github.com/LedgerHQ/ledger-live/pull/3229) [`87d2349fd8`](https://github.com/LedgerHQ/ledger-live/commit/87d2349fd835e5deb39d1ee8dfcf3539f4195472) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added mising error for broken ble pairing

- [#3097](https://github.com/LedgerHQ/ledger-live/pull/3097) [`4500a00f21`](https://github.com/LedgerHQ/ledger-live/commit/4500a00f215f73e6c9bbf1d904cb6a4c3d67e678) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Introduce a new manager API for listApps, which should bring memory and time improvements.

- Updated dependencies [[`a1c1ea56aa`](https://github.com/LedgerHQ/ledger-live/commit/a1c1ea56aa2a9e106b831107d8fae24ea0f27d4d), [`cec978f36e`](https://github.com/LedgerHQ/ledger-live/commit/cec978f36e5841ce3f8d117530e13902590596c3), [`a0a4e2eb0e`](https://github.com/LedgerHQ/ledger-live/commit/a0a4e2eb0e84f5679ba5994f8d375054c8466c7e), [`87d2349fd8`](https://github.com/LedgerHQ/ledger-live/commit/87d2349fd835e5deb39d1ee8dfcf3539f4195472), [`51c01541df`](https://github.com/LedgerHQ/ledger-live/commit/51c01541df8a414851ea4ef493dc9045272ef949), [`4500a00f21`](https://github.com/LedgerHQ/ledger-live/commit/4500a00f215f73e6c9bbf1d904cb6a4c3d67e678)]:
  - @ledgerhq/live-env@0.2.0
  - @ledgerhq/cryptoassets@9.5.0
  - @ledgerhq/domain-service@1.1.0
  - @ledgerhq/errors@6.12.5
  - @ledgerhq/hw-app-cosmos@6.28.0
  - @ledgerhq/coin-framework@0.3.2
  - @ledgerhq/coin-polkadot@0.1.3
  - @ledgerhq/live-portfolio@0.0.4
  - @ledgerhq/hw-app-eth@6.33.2
  - @ledgerhq/devices@8.0.2
  - @ledgerhq/hw-app-algorand@6.27.14
  - @ledgerhq/hw-app-exchange@0.1.1
  - @ledgerhq/hw-app-near@6.27.9
  - @ledgerhq/hw-app-polkadot@6.27.14
  - @ledgerhq/hw-app-solana@7.0.8
  - @ledgerhq/hw-app-trx@6.27.14
  - @ledgerhq/hw-transport@6.28.3
  - @ledgerhq/hw-transport-node-speculos@6.27.14
  - @ledgerhq/hw-app-btc@10.0.2
  - @ledgerhq/hw-app-str@6.27.14
  - @ledgerhq/hw-app-tezos@6.27.14
  - @ledgerhq/hw-app-xrp@6.27.14
  - @ledgerhq/hw-transport-mocker@6.27.14

## 29.5.0-next.2

### Patch Changes

- [#3369](https://github.com/LedgerHQ/ledger-live/pull/3369) [`0ebfbbf596`](https://github.com/LedgerHQ/ledger-live/commit/0ebfbbf596ef3d690f1eb225698512f9a1108b59) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Update osmosis node to fix history

## 29.5.0-next.1

### Patch Changes

- [#3364](https://github.com/LedgerHQ/ledger-live/pull/3364) [`164409ab4e`](https://github.com/LedgerHQ/ledger-live/commit/164409ab4e035bb6c941c2f5a0c4e26873c52270) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Fix onomy redelegation

## 29.5.0-next.0

### Minor Changes

- [#3315](https://github.com/LedgerHQ/ledger-live/pull/3315) [`a1c1ea56aa`](https://github.com/LedgerHQ/ledger-live/commit/a1c1ea56aa2a9e106b831107d8fae24ea0f27d4d) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add env & exerimental feature for the base fee multiplier used to compose the maxFeePerGas of an EIP1559 transaction

- [#3153](https://github.com/LedgerHQ/ledger-live/pull/3153) [`cec978f36e`](https://github.com/LedgerHQ/ledger-live/commit/cec978f36e5841ce3f8d117530e13902590596c3) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Adding support for new EVM chains, including Layer 2s like Optimism & Arbitrum

- [#3105](https://github.com/LedgerHQ/ledger-live/pull/3105) [`5d7bd8c68e`](https://github.com/LedgerHQ/ledger-live/commit/5d7bd8c68ee33507ff065c05965e1a8c387a4fae) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Refactor device action implementations unifying the logic

- [#2809](https://github.com/LedgerHQ/ledger-live/pull/2809) [`51c01541df`](https://github.com/LedgerHQ/ledger-live/commit/51c01541df8a414851ea4ef493dc9045272ef949) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add Quicksilver, Persistence, Onomy, Axelar to Cosmos family

- [#2953](https://github.com/LedgerHQ/ledger-live/pull/2953) [`baa687a281`](https://github.com/LedgerHQ/ledger-live/commit/baa687a281b5f75cacd06b05b5438807874fa152) Thanks [@RamyEB](https://github.com/RamyEB)! - refacto type and name of platform field

### Patch Changes

- [#3271](https://github.com/LedgerHQ/ledger-live/pull/3271) [`07fc266a10`](https://github.com/LedgerHQ/ledger-live/commit/07fc266a10479f77044e36b9347b9a97e42f0566) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Fix regression in the stax load image introduced by device action rework

- [#3227](https://github.com/LedgerHQ/ledger-live/pull/3227) [`f11d282bde`](https://github.com/LedgerHQ/ledger-live/commit/f11d282bded679dfcbb0bbffe88055d55995e03f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add helper for Segment event/properties

- [#3244](https://github.com/LedgerHQ/ledger-live/pull/3244) [`5e6f053a27`](https://github.com/LedgerHQ/ledger-live/commit/5e6f053a2744a5ff5f5364609cc1287c3dd8e69e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add new FF

- [#3280](https://github.com/LedgerHQ/ledger-live/pull/3280) [`d67f7480f7`](https://github.com/LedgerHQ/ledger-live/commit/d67f7480f767ffceab82a43c37089948315a3fc4) Thanks [@lvndry](https://github.com/lvndry)! - Delete api folder in live-common

- [#3241](https://github.com/LedgerHQ/ledger-live/pull/3241) [`ec9426b354`](https://github.com/LedgerHQ/ledger-live/commit/ec9426b354156eb9362a74649a1f887a3aef7f8d) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLC - Stop tracking SyncError event

- [#3229](https://github.com/LedgerHQ/ledger-live/pull/3229) [`87d2349fd8`](https://github.com/LedgerHQ/ledger-live/commit/87d2349fd835e5deb39d1ee8dfcf3539f4195472) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added mising error for broken ble pairing

- [#3097](https://github.com/LedgerHQ/ledger-live/pull/3097) [`4500a00f21`](https://github.com/LedgerHQ/ledger-live/commit/4500a00f215f73e6c9bbf1d904cb6a4c3d67e678) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Introduce a new manager API for listApps, which should bring memory and time improvements.

- Updated dependencies [[`a1c1ea56aa`](https://github.com/LedgerHQ/ledger-live/commit/a1c1ea56aa2a9e106b831107d8fae24ea0f27d4d), [`cec978f36e`](https://github.com/LedgerHQ/ledger-live/commit/cec978f36e5841ce3f8d117530e13902590596c3), [`a0a4e2eb0e`](https://github.com/LedgerHQ/ledger-live/commit/a0a4e2eb0e84f5679ba5994f8d375054c8466c7e), [`87d2349fd8`](https://github.com/LedgerHQ/ledger-live/commit/87d2349fd835e5deb39d1ee8dfcf3539f4195472), [`51c01541df`](https://github.com/LedgerHQ/ledger-live/commit/51c01541df8a414851ea4ef493dc9045272ef949), [`4500a00f21`](https://github.com/LedgerHQ/ledger-live/commit/4500a00f215f73e6c9bbf1d904cb6a4c3d67e678)]:
  - @ledgerhq/live-env@0.2.0-next.0
  - @ledgerhq/cryptoassets@9.5.0-next.0
  - @ledgerhq/domain-service@1.1.0-next.0
  - @ledgerhq/errors@6.12.5-next.0
  - @ledgerhq/hw-app-cosmos@6.28.0-next.0
  - @ledgerhq/coin-framework@0.3.2-next.0
  - @ledgerhq/coin-polkadot@0.1.3-next.0
  - @ledgerhq/live-portfolio@0.0.4-next.0
  - @ledgerhq/hw-app-eth@6.33.2-next.0
  - @ledgerhq/devices@8.0.2-next.0
  - @ledgerhq/hw-app-algorand@6.27.14-next.0
  - @ledgerhq/hw-app-exchange@0.1.1-next.0
  - @ledgerhq/hw-app-near@6.27.9-next.0
  - @ledgerhq/hw-app-polkadot@6.27.14-next.0
  - @ledgerhq/hw-app-solana@7.0.8-next.0
  - @ledgerhq/hw-app-trx@6.27.14-next.0
  - @ledgerhq/hw-transport@6.28.3-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.14-next.0
  - @ledgerhq/hw-app-btc@10.0.2-next.0
  - @ledgerhq/hw-app-str@6.27.14-next.0
  - @ledgerhq/hw-app-tezos@6.27.14-next.0
  - @ledgerhq/hw-app-xrp@6.27.14-next.0
  - @ledgerhq/hw-transport-mocker@6.27.14-next.0

## 29.4.0

### Minor Changes

- [#3142](https://github.com/LedgerHQ/ledger-live/pull/3142) [`147af2b5e6`](https://github.com/LedgerHQ/ledger-live/commit/147af2b5e674a7020f101a081135c2b187356060) Thanks [@grsoares21](https://github.com/grsoares21)! - Make stax image padding optional on Stax Load image device action

- [#3265](https://github.com/LedgerHQ/ledger-live/pull/3265) [`5059c9584c`](https://github.com/LedgerHQ/ledger-live/commit/5059c9584ca70208a67e9d49025422d395637878) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix incremental sync order for Ethereum family to prevent fetching operations before a block instead of after a block

- [#3187](https://github.com/LedgerHQ/ledger-live/pull/3187) [`87d08d6d1c`](https://github.com/LedgerHQ/ledger-live/commit/87d08d6d1c6111b7f5fb15f3e1bbe85658686e4a) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - Fixes error messaging when retrieving swap rates

### Patch Changes

- [#3182](https://github.com/LedgerHQ/ledger-live/pull/3182) [`9fec3a9b3a`](https://github.com/LedgerHQ/ledger-live/commit/9fec3a9b3a26bfce6ef7fdc4afb83e4f3c04cb69) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - bump wallet-api deps

- [#3223](https://github.com/LedgerHQ/ledger-live/pull/3223) [`530909c036`](https://github.com/LedgerHQ/ledger-live/commit/530909c0368d03aea1e5d0638adb027fa00ab897) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix btc integration test

- [#3174](https://github.com/LedgerHQ/ledger-live/pull/3174) [`29badd80d0`](https://github.com/LedgerHQ/ledger-live/commit/29badd80d062f76139ba3a056df22277858021bd) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Remove dead code of unsupported neo family

- [#3180](https://github.com/LedgerHQ/ledger-live/pull/3180) [`992351d66d`](https://github.com/LedgerHQ/ledger-live/commit/992351d66d44d978f069b3aa13f9baf23f9b4482) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Fix cosmos fees by simulation

- [#3164](https://github.com/LedgerHQ/ledger-live/pull/3164) [`be5589dac6`](https://github.com/LedgerHQ/ledger-live/commit/be5589dac675e2c8c1771b135bd0f330a868ed2d) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add a 'feesCurrency' field to 'Account' type, and use it

- [#3169](https://github.com/LedgerHQ/ledger-live/pull/3169) [`c44d61c2b3`](https://github.com/LedgerHQ/ledger-live/commit/c44d61c2b3dc7b4de1041adab676351f8c05b8b9) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Allow for model and version dependent max name length

- [#3184](https://github.com/LedgerHQ/ledger-live/pull/3184) [`42233141e8`](https://github.com/LedgerHQ/ledger-live/commit/42233141e853f2e9752268e5fa711416d460e0e3) Thanks [@PorlyBe](https://github.com/PorlyBe)! - Crypto Icons - Add support for VERSE token icon

- Updated dependencies [[`294f5685df`](https://github.com/LedgerHQ/ledger-live/commit/294f5685df6bb8e414bba5d2463f327aaf5d3d23), [`d5cf1abc6e`](https://github.com/LedgerHQ/ledger-live/commit/d5cf1abc6eb30d399c83b827452dc4bc61fd2253), [`3242a0a794`](https://github.com/LedgerHQ/ledger-live/commit/3242a0a7948c20fb0100ce3cc73e55e338534d32), [`be5589dac6`](https://github.com/LedgerHQ/ledger-live/commit/be5589dac675e2c8c1771b135bd0f330a868ed2d)]:
  - @ledgerhq/domain-service@1.0.1
  - @ledgerhq/coin-framework@0.3.1
  - @ledgerhq/cryptoassets@9.4.0
  - @ledgerhq/hw-app-eth@6.33.1
  - @ledgerhq/coin-polkadot@0.1.2
  - @ledgerhq/live-portfolio@0.0.3

## 29.4.0-next.2

### Patch Changes

- Updated dependencies [[`294f5685df`](https://github.com/LedgerHQ/ledger-live/commit/294f5685df6bb8e414bba5d2463f327aaf5d3d23)]:
  - @ledgerhq/domain-service@1.0.1-next.1
  - @ledgerhq/hw-app-eth@6.33.1-next.1

## 29.4.0-next.1

### Minor Changes

- [#3239](https://github.com/LedgerHQ/ledger-live/pull/3239) [`5059c9584c`](https://github.com/LedgerHQ/ledger-live/commit/5059c9584ca70208a67e9d49025422d395637878) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fix incremental sync order for Ethereum family to prevent fetching operations before a block instead of after a block

## 29.4.0-next.0

### Minor Changes

- [#3142](https://github.com/LedgerHQ/ledger-live/pull/3142) [`147af2b5e6`](https://github.com/LedgerHQ/ledger-live/commit/147af2b5e674a7020f101a081135c2b187356060) Thanks [@grsoares21](https://github.com/grsoares21)! - Make stax image padding optional on Stax Load image device action

- [#3187](https://github.com/LedgerHQ/ledger-live/pull/3187) [`87d08d6d1c`](https://github.com/LedgerHQ/ledger-live/commit/87d08d6d1c6111b7f5fb15f3e1bbe85658686e4a) Thanks [@cjordan-ledger](https://github.com/cjordan-ledger)! - Fixes error messaging when retrieving swap rates

### Patch Changes

- [#3182](https://github.com/LedgerHQ/ledger-live/pull/3182) [`9fec3a9b3a`](https://github.com/LedgerHQ/ledger-live/commit/9fec3a9b3a26bfce6ef7fdc4afb83e4f3c04cb69) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - bump wallet-api deps

- [#3223](https://github.com/LedgerHQ/ledger-live/pull/3223) [`530909c036`](https://github.com/LedgerHQ/ledger-live/commit/530909c0368d03aea1e5d0638adb027fa00ab897) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix btc integration test

- [#3174](https://github.com/LedgerHQ/ledger-live/pull/3174) [`29badd80d0`](https://github.com/LedgerHQ/ledger-live/commit/29badd80d062f76139ba3a056df22277858021bd) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Remove dead code of unsupported neo family

- [#3180](https://github.com/LedgerHQ/ledger-live/pull/3180) [`992351d66d`](https://github.com/LedgerHQ/ledger-live/commit/992351d66d44d978f069b3aa13f9baf23f9b4482) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Fix cosmos fees by simulation

- [#3164](https://github.com/LedgerHQ/ledger-live/pull/3164) [`be5589dac6`](https://github.com/LedgerHQ/ledger-live/commit/be5589dac675e2c8c1771b135bd0f330a868ed2d) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add a 'feesCurrency' field to 'Account' type, and use it

- [#3169](https://github.com/LedgerHQ/ledger-live/pull/3169) [`c44d61c2b3`](https://github.com/LedgerHQ/ledger-live/commit/c44d61c2b3dc7b4de1041adab676351f8c05b8b9) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Allow for model and version dependent max name length

- [#3184](https://github.com/LedgerHQ/ledger-live/pull/3184) [`42233141e8`](https://github.com/LedgerHQ/ledger-live/commit/42233141e853f2e9752268e5fa711416d460e0e3) Thanks [@PorlyBe](https://github.com/PorlyBe)! - Crypto Icons - Add support for VERSE token icon

- Updated dependencies [[`d5cf1abc6e`](https://github.com/LedgerHQ/ledger-live/commit/d5cf1abc6eb30d399c83b827452dc4bc61fd2253), [`3242a0a794`](https://github.com/LedgerHQ/ledger-live/commit/3242a0a7948c20fb0100ce3cc73e55e338534d32), [`be5589dac6`](https://github.com/LedgerHQ/ledger-live/commit/be5589dac675e2c8c1771b135bd0f330a868ed2d)]:
  - @ledgerhq/coin-framework@0.3.1-next.0
  - @ledgerhq/cryptoassets@9.4.0-next.0
  - @ledgerhq/coin-polkadot@0.1.2-next.0
  - @ledgerhq/domain-service@1.0.1-next.0
  - @ledgerhq/hw-app-eth@6.33.1-next.0
  - @ledgerhq/live-portfolio@0.0.3-next.0

## 29.3.0

### Minor Changes

- [#3016](https://github.com/LedgerHQ/ledger-live/pull/3016) [`5fa3f57e08`](https://github.com/LedgerHQ/ledger-live/commit/5fa3f57e08676481d18bdf7fc2406ac1184b1a9a) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - feat: ledger recover feature flag

* [#3079](https://github.com/LedgerHQ/ledger-live/pull/3079) [`d9732f38ed`](https://github.com/LedgerHQ/ledger-live/commit/d9732f38ed891ce090c98645de55103208015a60) Thanks [@gre](https://github.com/gre)! - Sunset Compound Lending from Ledger Live 'native' codebase

- [#3122](https://github.com/LedgerHQ/ledger-live/pull/3122) [`282cad03fb`](https://github.com/LedgerHQ/ledger-live/commit/282cad03fb733cc71e767b641c53ee2d469b8295) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - update plugins deps

* [#3139](https://github.com/LedgerHQ/ledger-live/pull/3139) [`197d28697b`](https://github.com/LedgerHQ/ledger-live/commit/197d28697b173c3f6b2badfe4d1deddeadc912d4) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - add protectServicesDiscoverDesktop feature flag

- [#2861](https://github.com/LedgerHQ/ledger-live/pull/2861) [`0941844a56`](https://github.com/LedgerHQ/ledger-live/commit/0941844a560b5b7b066fb1ffbec1dde7111c083a) Thanks [@cksanders](https://github.com/cksanders)! - - Update Kotlin version
  - Updated `wallet-api-server` and `wallet-api-core` version
  - Add Next storage & remove obsolete `AsyncStorage_db_size_in_MB`
  - Added wallet api storage support
  - Add stable & tested LLD storage support

* [#3059](https://github.com/LedgerHQ/ledger-live/pull/3059) [`d4834aad3f`](https://github.com/LedgerHQ/ledger-live/commit/d4834aad3f58d904850be9a3ab40b46260d9f7d4) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add domain support to Ledger Live apps and libs

- [#3079](https://github.com/LedgerHQ/ledger-live/pull/3079) [`d9732f38ed`](https://github.com/LedgerHQ/ledger-live/commit/d9732f38ed891ce090c98645de55103208015a60) Thanks [@gre](https://github.com/gre)! - Sunset the migrate accounts old mecanism

### Patch Changes

- [#3172](https://github.com/LedgerHQ/ledger-live/pull/3172) [`a1e3f90e7f`](https://github.com/LedgerHQ/ledger-live/commit/a1e3f90e7f34303ab779e90c0e48642348d79280) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fix cosmos fees by simulation

* [#2950](https://github.com/LedgerHQ/ledger-live/pull/2950) [`c59bee8935`](https://github.com/LedgerHQ/ledger-live/commit/c59bee89357bb29097fb97ca67ece845630d982a) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Estimate gas using simulate endpoint instead of hardcoded value

- [#3081](https://github.com/LedgerHQ/ledger-live/pull/3081) [`64ee0b2e03`](https://github.com/LedgerHQ/ledger-live/commit/64ee0b2e032187f5b742f594390a5b30d3850751) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add missing conversion from string to number in Cosmos API response

* [#3103](https://github.com/LedgerHQ/ledger-live/pull/3103) [`fb65760778`](https://github.com/LedgerHQ/ledger-live/commit/fb6576077854fb21541350a9f7c1cb528fba6e6d) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Update minimum Polkadot app version to 20.9370.0

- [#3093](https://github.com/LedgerHQ/ledger-live/pull/3093) [`a62be79a56`](https://github.com/LedgerHQ/ledger-live/commit/a62be79a56e7aaaf7712fe006d357e3517f1c4b9) Thanks [@lvndry](https://github.com/lvndry)! - ethereum fetchAllTransaction method uses `from_height` query parameter

- Updated dependencies [[`d9732f38ed`](https://github.com/LedgerHQ/ledger-live/commit/d9732f38ed891ce090c98645de55103208015a60), [`5785155282`](https://github.com/LedgerHQ/ledger-live/commit/5785155282d61d0dbdc30f7a66d3243a74fce117), [`d4834aad3f`](https://github.com/LedgerHQ/ledger-live/commit/d4834aad3f58d904850be9a3ab40b46260d9f7d4), [`d4834aad3f`](https://github.com/LedgerHQ/ledger-live/commit/d4834aad3f58d904850be9a3ab40b46260d9f7d4)]:
  - @ledgerhq/cryptoassets@9.3.0
  - @ledgerhq/coin-framework@0.3.0
  - @ledgerhq/live-env@0.1.0
  - @ledgerhq/hw-app-eth@6.33.0
  - @ledgerhq/domain-service@1.0.0
  - @ledgerhq/coin-polkadot@0.1.1
  - @ledgerhq/live-portfolio@0.0.2

## 29.3.0-next.1

### Patch Changes

- [#3172](https://github.com/LedgerHQ/ledger-live/pull/3172) [`a1e3f90e7f`](https://github.com/LedgerHQ/ledger-live/commit/a1e3f90e7f34303ab779e90c0e48642348d79280) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fix cosmos fees by simulation

## 29.3.0-next.0

### Minor Changes

- [#3016](https://github.com/LedgerHQ/ledger-live/pull/3016) [`5fa3f57e08`](https://github.com/LedgerHQ/ledger-live/commit/5fa3f57e08676481d18bdf7fc2406ac1184b1a9a) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - feat: ledger recover feature flag

- [#3079](https://github.com/LedgerHQ/ledger-live/pull/3079) [`d9732f38ed`](https://github.com/LedgerHQ/ledger-live/commit/d9732f38ed891ce090c98645de55103208015a60) Thanks [@gre](https://github.com/gre)! - Sunset Compound Lending from Ledger Live 'native' codebase

- [#3122](https://github.com/LedgerHQ/ledger-live/pull/3122) [`282cad03fb`](https://github.com/LedgerHQ/ledger-live/commit/282cad03fb733cc71e767b641c53ee2d469b8295) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - update plugins deps

- [#3139](https://github.com/LedgerHQ/ledger-live/pull/3139) [`197d28697b`](https://github.com/LedgerHQ/ledger-live/commit/197d28697b173c3f6b2badfe4d1deddeadc912d4) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - add protectServicesDiscoverDesktop feature flag

- [#2861](https://github.com/LedgerHQ/ledger-live/pull/2861) [`0941844a56`](https://github.com/LedgerHQ/ledger-live/commit/0941844a560b5b7b066fb1ffbec1dde7111c083a) Thanks [@cksanders](https://github.com/cksanders)! - - Update Kotlin version

  - Updated `wallet-api-server` and `wallet-api-core` version
  - Add Next storage & remove obsolete `AsyncStorage_db_size_in_MB`
  - Added wallet api storage support
  - Add stable & tested LLD storage support

- [#3059](https://github.com/LedgerHQ/ledger-live/pull/3059) [`d4834aad3f`](https://github.com/LedgerHQ/ledger-live/commit/d4834aad3f58d904850be9a3ab40b46260d9f7d4) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add domain support to Ledger Live apps and libs

- [#3079](https://github.com/LedgerHQ/ledger-live/pull/3079) [`d9732f38ed`](https://github.com/LedgerHQ/ledger-live/commit/d9732f38ed891ce090c98645de55103208015a60) Thanks [@gre](https://github.com/gre)! - Sunset the migrate accounts old mecanism

### Patch Changes

- [#2950](https://github.com/LedgerHQ/ledger-live/pull/2950) [`c59bee8935`](https://github.com/LedgerHQ/ledger-live/commit/c59bee89357bb29097fb97ca67ece845630d982a) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Estimate gas using simulate endpoint instead of hardcoded value

- [#3081](https://github.com/LedgerHQ/ledger-live/pull/3081) [`64ee0b2e03`](https://github.com/LedgerHQ/ledger-live/commit/64ee0b2e032187f5b742f594390a5b30d3850751) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add missing conversion from string to number in Cosmos API response

- [#3103](https://github.com/LedgerHQ/ledger-live/pull/3103) [`fb65760778`](https://github.com/LedgerHQ/ledger-live/commit/fb6576077854fb21541350a9f7c1cb528fba6e6d) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Update minimum Polkadot app version to 20.9370.0

- [#3093](https://github.com/LedgerHQ/ledger-live/pull/3093) [`a62be79a56`](https://github.com/LedgerHQ/ledger-live/commit/a62be79a56e7aaaf7712fe006d357e3517f1c4b9) Thanks [@lvndry](https://github.com/lvndry)! - ethereum fetchAllTransaction method uses `from_height` query parameter

- Updated dependencies [[`d9732f38ed`](https://github.com/LedgerHQ/ledger-live/commit/d9732f38ed891ce090c98645de55103208015a60), [`5785155282`](https://github.com/LedgerHQ/ledger-live/commit/5785155282d61d0dbdc30f7a66d3243a74fce117), [`d4834aad3f`](https://github.com/LedgerHQ/ledger-live/commit/d4834aad3f58d904850be9a3ab40b46260d9f7d4), [`d4834aad3f`](https://github.com/LedgerHQ/ledger-live/commit/d4834aad3f58d904850be9a3ab40b46260d9f7d4)]:
  - @ledgerhq/cryptoassets@9.3.0-next.0
  - @ledgerhq/coin-framework@0.3.0-next.0
  - @ledgerhq/live-env@0.1.0-next.0
  - @ledgerhq/hw-app-eth@6.33.0-next.0
  - @ledgerhq/domain-service@1.0.0-next.0
  - @ledgerhq/coin-polkadot@0.1.1-next.0
  - @ledgerhq/live-portfolio@0.0.2-next.0

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
