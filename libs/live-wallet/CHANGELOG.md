# @ledgerhq/live-wallet

## 0.6.1

### Patch Changes

- Updated dependencies [[`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9), [`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9), [`f805d14`](https://github.com/LedgerHQ/ledger-live/commit/f805d1470f927824233f94eaba065b00d7af18cf), [`c4309b1`](https://github.com/LedgerHQ/ledger-live/commit/c4309b17f8e34e664896fd357d1eeac14e318473), [`52ae4d3`](https://github.com/LedgerHQ/ledger-live/commit/52ae4d3ea2ae52306e868923e48f4a5807a78d57), [`461ddc5`](https://github.com/LedgerHQ/ledger-live/commit/461ddc56fbbe862789fe9a06db8a7e7a894e4bdd), [`672875f`](https://github.com/LedgerHQ/ledger-live/commit/672875feb9876edacf06aaea6c7bb47f4bb7d993), [`7865dcb`](https://github.com/LedgerHQ/ledger-live/commit/7865dcb1891b89a0d9fe28efeea3a6284f3d87c5), [`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9)]:
  - @ledgerhq/cryptoassets@13.5.0
  - @ledgerhq/types-cryptoassets@7.15.2
  - @ledgerhq/live-network@2.0.1
  - @ledgerhq/trustchain@0.4.0
  - @ledgerhq/types-live@6.51.1
  - @ledgerhq/coin-framework@0.18.1
  - @ledgerhq/devices@8.4.4

## 0.6.1-next.1

### Patch Changes

- Updated dependencies [[`f805d14`](https://github.com/LedgerHQ/ledger-live/commit/f805d1470f927824233f94eaba065b00d7af18cf)]:
  - @ledgerhq/cryptoassets@13.5.0-next.1
  - @ledgerhq/live-network@2.0.1-next.1
  - @ledgerhq/coin-framework@0.18.1-next.1
  - @ledgerhq/trustchain@0.4.0-next.1

## 0.6.1-next.0

### Patch Changes

- Updated dependencies [[`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9), [`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9), [`c4309b1`](https://github.com/LedgerHQ/ledger-live/commit/c4309b17f8e34e664896fd357d1eeac14e318473), [`52ae4d3`](https://github.com/LedgerHQ/ledger-live/commit/52ae4d3ea2ae52306e868923e48f4a5807a78d57), [`461ddc5`](https://github.com/LedgerHQ/ledger-live/commit/461ddc56fbbe862789fe9a06db8a7e7a894e4bdd), [`672875f`](https://github.com/LedgerHQ/ledger-live/commit/672875feb9876edacf06aaea6c7bb47f4bb7d993), [`7865dcb`](https://github.com/LedgerHQ/ledger-live/commit/7865dcb1891b89a0d9fe28efeea3a6284f3d87c5), [`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9)]:
  - @ledgerhq/cryptoassets@13.5.0-next.0
  - @ledgerhq/types-cryptoassets@7.15.2-next.0
  - @ledgerhq/trustchain@0.4.0-next.0
  - @ledgerhq/types-live@6.51.1-next.0
  - @ledgerhq/coin-framework@0.18.1-next.0
  - @ledgerhq/devices@8.4.4-next.0
  - @ledgerhq/live-network@2.0.1-next.0

## 0.6.0

### Minor Changes

- [#7714](https://github.com/LedgerHQ/ledger-live/pull/7714) [`5ecbe88`](https://github.com/LedgerHQ/ledger-live/commit/5ecbe88474032b724d6c408ab63be08aa567e0fc) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Ledger Sync - Improve account names module to avoid erasing custom names with the default ones when two instances are pushing around the same time

- [#7691](https://github.com/LedgerHQ/ledger-live/pull/7691) [`ce18c9b`](https://github.com/LedgerHQ/ledger-live/commit/ce18c9bde11fbd6cc196091716b1547354063d89) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Ledger Sync - Added a Loading screen on LLM and LLD when initializing ledger sync while accounts are synchronizing

### Patch Changes

- [#7528](https://github.com/LedgerHQ/ledger-live/pull/7528) [`1353e7a`](https://github.com/LedgerHQ/ledger-live/commit/1353e7ae02f22e8f9194a1e3c34f9444785b6fb6) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LIVE-WALLET - Test non imported accounts

- [#7517](https://github.com/LedgerHQ/ledger-live/pull/7517) [`277648c`](https://github.com/LedgerHQ/ledger-live/commit/277648cbc0b58694a49d8d929c8ec0b89986f4cf) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LIVE-WALLET - Added unit tests to cover the createWalletSyncWatchLoop

- Updated dependencies [[`87c160d`](https://github.com/LedgerHQ/ledger-live/commit/87c160d855b512d5a0394eaee7626e2b8cd431ee), [`5c738cb`](https://github.com/LedgerHQ/ledger-live/commit/5c738cbd35ce5d0ca39ad3b86a61cc6234d1bdf7), [`d60a022`](https://github.com/LedgerHQ/ledger-live/commit/d60a02238db9ed16142de4c1874e26d27aaaa98c), [`9c55e81`](https://github.com/LedgerHQ/ledger-live/commit/9c55e81c84d3372f2a7fd36248f970376aec905a), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`267526c`](https://github.com/LedgerHQ/ledger-live/commit/267526c3f8cc4863d4947ab3c28ba20dc5593028), [`1fb2b90`](https://github.com/LedgerHQ/ledger-live/commit/1fb2b909c5d97e373a0f72baa37578132bd8b24a), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`cc291f5`](https://github.com/LedgerHQ/ledger-live/commit/cc291f5466d80a2b7e9394338ab588ecd3db4623), [`fb9466a`](https://github.com/LedgerHQ/ledger-live/commit/fb9466a4d7827fd4759c726ad3ae0b43dddcacd3), [`5758950`](https://github.com/LedgerHQ/ledger-live/commit/5758950841fbf8018dd848e745017484aec67333), [`ef99222`](https://github.com/LedgerHQ/ledger-live/commit/ef99222a5adcd9732d06600bc875309c440e084f), [`a84f3d3`](https://github.com/LedgerHQ/ledger-live/commit/a84f3d344e37301dc76f182c0f99b0b01106abfa), [`ce18c9b`](https://github.com/LedgerHQ/ledger-live/commit/ce18c9bde11fbd6cc196091716b1547354063d89), [`271f90d`](https://github.com/LedgerHQ/ledger-live/commit/271f90dc0f5b46ddaf136873dc034d4c44045dd0), [`297ce51`](https://github.com/LedgerHQ/ledger-live/commit/297ce513f496f256efe8f9011734324125f462a5), [`0c80144`](https://github.com/LedgerHQ/ledger-live/commit/0c80144b8c16fc3729baa6503875d21af87b2752), [`bc044e4`](https://github.com/LedgerHQ/ledger-live/commit/bc044e482ea2827dca281c44ec36526d63da5194), [`4799d5d`](https://github.com/LedgerHQ/ledger-live/commit/4799d5de3fb1dcef2b01de31fe29b59e76922576), [`ef82161`](https://github.com/LedgerHQ/ledger-live/commit/ef82161688fc49bf32cbc88f1837b15490e5d2b4), [`d13e7b9`](https://github.com/LedgerHQ/ledger-live/commit/d13e7b9f55d92098cacc9384fd7fab24033c040f), [`a3fd728`](https://github.com/LedgerHQ/ledger-live/commit/a3fd72861f2a7df676bd793062b3816fdb9d1f57), [`a0bb74b`](https://github.com/LedgerHQ/ledger-live/commit/a0bb74b8f3704ab9d5567c9d14c16cab9e0872f7), [`eb9a36f`](https://github.com/LedgerHQ/ledger-live/commit/eb9a36f6ee8487c9ffbb841c3e6c0ca84f68bb0a), [`6815f6f`](https://github.com/LedgerHQ/ledger-live/commit/6815f6fccb9bca627a2e51ab954dc3f9b8f7c710), [`9c2f1b3`](https://github.com/LedgerHQ/ledger-live/commit/9c2f1b3b6e11a37a6b5ecf02d1e1ae7f0258e3ae), [`9a650da`](https://github.com/LedgerHQ/ledger-live/commit/9a650da9a147d6881f7082278d2bf764c37e1451)]:
  - @ledgerhq/trustchain@0.3.0
  - @ledgerhq/cryptoassets@13.4.0
  - @ledgerhq/live-network@2.0.0
  - @ledgerhq/coin-framework@0.18.0
  - @ledgerhq/types-live@6.51.0
  - @ledgerhq/live-env@2.3.0
  - @ledgerhq/types-cryptoassets@7.15.1
  - @ledgerhq/devices@8.4.3

## 0.6.0-next.0

### Minor Changes

- [#7714](https://github.com/LedgerHQ/ledger-live/pull/7714) [`5ecbe88`](https://github.com/LedgerHQ/ledger-live/commit/5ecbe88474032b724d6c408ab63be08aa567e0fc) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Ledger Sync - Improve account names module to avoid erasing custom names with the default ones when two instances are pushing around the same time

- [#7691](https://github.com/LedgerHQ/ledger-live/pull/7691) [`ce18c9b`](https://github.com/LedgerHQ/ledger-live/commit/ce18c9bde11fbd6cc196091716b1547354063d89) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Ledger Sync - Added a Loading screen on LLM and LLD when initializing ledger sync while accounts are synchronizing

### Patch Changes

- [#7528](https://github.com/LedgerHQ/ledger-live/pull/7528) [`1353e7a`](https://github.com/LedgerHQ/ledger-live/commit/1353e7ae02f22e8f9194a1e3c34f9444785b6fb6) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LIVE-WALLET - Test non imported accounts

- [#7517](https://github.com/LedgerHQ/ledger-live/pull/7517) [`277648c`](https://github.com/LedgerHQ/ledger-live/commit/277648cbc0b58694a49d8d929c8ec0b89986f4cf) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LIVE-WALLET - Added unit tests to cover the createWalletSyncWatchLoop

- Updated dependencies [[`87c160d`](https://github.com/LedgerHQ/ledger-live/commit/87c160d855b512d5a0394eaee7626e2b8cd431ee), [`5c738cb`](https://github.com/LedgerHQ/ledger-live/commit/5c738cbd35ce5d0ca39ad3b86a61cc6234d1bdf7), [`d60a022`](https://github.com/LedgerHQ/ledger-live/commit/d60a02238db9ed16142de4c1874e26d27aaaa98c), [`9c55e81`](https://github.com/LedgerHQ/ledger-live/commit/9c55e81c84d3372f2a7fd36248f970376aec905a), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`267526c`](https://github.com/LedgerHQ/ledger-live/commit/267526c3f8cc4863d4947ab3c28ba20dc5593028), [`1fb2b90`](https://github.com/LedgerHQ/ledger-live/commit/1fb2b909c5d97e373a0f72baa37578132bd8b24a), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`cc291f5`](https://github.com/LedgerHQ/ledger-live/commit/cc291f5466d80a2b7e9394338ab588ecd3db4623), [`fb9466a`](https://github.com/LedgerHQ/ledger-live/commit/fb9466a4d7827fd4759c726ad3ae0b43dddcacd3), [`5758950`](https://github.com/LedgerHQ/ledger-live/commit/5758950841fbf8018dd848e745017484aec67333), [`ef99222`](https://github.com/LedgerHQ/ledger-live/commit/ef99222a5adcd9732d06600bc875309c440e084f), [`a84f3d3`](https://github.com/LedgerHQ/ledger-live/commit/a84f3d344e37301dc76f182c0f99b0b01106abfa), [`ce18c9b`](https://github.com/LedgerHQ/ledger-live/commit/ce18c9bde11fbd6cc196091716b1547354063d89), [`271f90d`](https://github.com/LedgerHQ/ledger-live/commit/271f90dc0f5b46ddaf136873dc034d4c44045dd0), [`297ce51`](https://github.com/LedgerHQ/ledger-live/commit/297ce513f496f256efe8f9011734324125f462a5), [`0c80144`](https://github.com/LedgerHQ/ledger-live/commit/0c80144b8c16fc3729baa6503875d21af87b2752), [`bc044e4`](https://github.com/LedgerHQ/ledger-live/commit/bc044e482ea2827dca281c44ec36526d63da5194), [`4799d5d`](https://github.com/LedgerHQ/ledger-live/commit/4799d5de3fb1dcef2b01de31fe29b59e76922576), [`ef82161`](https://github.com/LedgerHQ/ledger-live/commit/ef82161688fc49bf32cbc88f1837b15490e5d2b4), [`d13e7b9`](https://github.com/LedgerHQ/ledger-live/commit/d13e7b9f55d92098cacc9384fd7fab24033c040f), [`a3fd728`](https://github.com/LedgerHQ/ledger-live/commit/a3fd72861f2a7df676bd793062b3816fdb9d1f57), [`a0bb74b`](https://github.com/LedgerHQ/ledger-live/commit/a0bb74b8f3704ab9d5567c9d14c16cab9e0872f7), [`eb9a36f`](https://github.com/LedgerHQ/ledger-live/commit/eb9a36f6ee8487c9ffbb841c3e6c0ca84f68bb0a), [`6815f6f`](https://github.com/LedgerHQ/ledger-live/commit/6815f6fccb9bca627a2e51ab954dc3f9b8f7c710), [`9c2f1b3`](https://github.com/LedgerHQ/ledger-live/commit/9c2f1b3b6e11a37a6b5ecf02d1e1ae7f0258e3ae), [`9a650da`](https://github.com/LedgerHQ/ledger-live/commit/9a650da9a147d6881f7082278d2bf764c37e1451)]:
  - @ledgerhq/trustchain@0.3.0-next.0
  - @ledgerhq/cryptoassets@13.4.0-next.0
  - @ledgerhq/live-network@2.0.0-next.0
  - @ledgerhq/coin-framework@0.18.0-next.0
  - @ledgerhq/types-live@6.51.0-next.0
  - @ledgerhq/live-env@2.3.0-next.0
  - @ledgerhq/types-cryptoassets@7.15.1-next.0
  - @ledgerhq/devices@8.4.3-next.0

## 0.5.0

### Minor Changes

- [#7497](https://github.com/LedgerHQ/ledger-live/pull/7497) [`52daa39`](https://github.com/LedgerHQ/ledger-live/commit/52daa3998709ac3538afd447fe771faa3e3441be) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Added parameters to lldWalletSync and llmWalletSync to be able to configure the wallet sync feature remotely

### Patch Changes

- [#7502](https://github.com/LedgerHQ/ledger-live/pull/7502) [`1440323`](https://github.com/LedgerHQ/ledger-live/commit/144032348fcac45eb797c5e724cf5f654c9d3527) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Live-Wallet - Sending trustchain id to cloudsync api

- [#7435](https://github.com/LedgerHQ/ledger-live/pull/7435) [`ecc3ee4`](https://github.com/LedgerHQ/ledger-live/commit/ecc3ee46b8d5bf5631bcbcf73b3c3a2fb1a8964d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add Ledger Sync check status

- [#7499](https://github.com/LedgerHQ/ledger-live/pull/7499) [`c94d878`](https://github.com/LedgerHQ/ledger-live/commit/c94d878056f7ddace40cee1dae863f7080ec10d9) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Live-Wallet - Fix a wallet sync parser issue happening when the info field was null

- Updated dependencies [[`08e85c3`](https://github.com/LedgerHQ/ledger-live/commit/08e85c3fbaf5e27b072e39730f9ceb4135a59d1e), [`afa03ae`](https://github.com/LedgerHQ/ledger-live/commit/afa03ae921ad1ca7df83dc0ba717c1cc27cb08cd), [`c0f4803`](https://github.com/LedgerHQ/ledger-live/commit/c0f48035b974f2bcde9df8423c6bb9bbb31d4b38), [`df9b4b7`](https://github.com/LedgerHQ/ledger-live/commit/df9b4b7b699503bb3aab1dc791b28e11ef0d51b9), [`db9c2d7`](https://github.com/LedgerHQ/ledger-live/commit/db9c2d78fb74df586c3ea1b9fb75ce3b014a0f4b), [`87d6bb2`](https://github.com/LedgerHQ/ledger-live/commit/87d6bb2501eac654dc10f45a0f591b28569b3d9f), [`4bd91de`](https://github.com/LedgerHQ/ledger-live/commit/4bd91de13442d12acce3ee83d5f2fd5f087570cf), [`53ff78c`](https://github.com/LedgerHQ/ledger-live/commit/53ff78c541d3ed69a3e74854d77f58a7e0d93978), [`ecc3ee4`](https://github.com/LedgerHQ/ledger-live/commit/ecc3ee46b8d5bf5631bcbcf73b3c3a2fb1a8964d), [`8553b3e`](https://github.com/LedgerHQ/ledger-live/commit/8553b3eef10132396ec580a2d5f20b616f5b18a0), [`52daa39`](https://github.com/LedgerHQ/ledger-live/commit/52daa3998709ac3538afd447fe771faa3e3441be), [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c), [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c), [`50b6db6`](https://github.com/LedgerHQ/ledger-live/commit/50b6db67d374a23ba040043aa93e7fbc52685297), [`506a3c3`](https://github.com/LedgerHQ/ledger-live/commit/506a3c33f59acf0afc9350e4f36f22f11cf7da26)]:
  - @ledgerhq/trustchain@0.2.0
  - @ledgerhq/coin-framework@0.17.0
  - @ledgerhq/types-live@6.50.0
  - @ledgerhq/cryptoassets@13.3.0
  - @ledgerhq/types-cryptoassets@7.15.0
  - @ledgerhq/live-env@2.2.0
  - @ledgerhq/live-network@1.4.0

## 0.5.0-next.1

### Patch Changes

- Updated dependencies [[`50b6db6`](https://github.com/LedgerHQ/ledger-live/commit/50b6db67d374a23ba040043aa93e7fbc52685297)]:
  - @ledgerhq/cryptoassets@13.3.0-next.1
  - @ledgerhq/coin-framework@0.17.0-next.1

## 0.5.0-next.0

### Minor Changes

- [#7497](https://github.com/LedgerHQ/ledger-live/pull/7497) [`52daa39`](https://github.com/LedgerHQ/ledger-live/commit/52daa3998709ac3538afd447fe771faa3e3441be) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Added parameters to lldWalletSync and llmWalletSync to be able to configure the wallet sync feature remotely

### Patch Changes

- [#7502](https://github.com/LedgerHQ/ledger-live/pull/7502) [`1440323`](https://github.com/LedgerHQ/ledger-live/commit/144032348fcac45eb797c5e724cf5f654c9d3527) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Live-Wallet - Sending trustchain id to cloudsync api

- [#7435](https://github.com/LedgerHQ/ledger-live/pull/7435) [`ecc3ee4`](https://github.com/LedgerHQ/ledger-live/commit/ecc3ee46b8d5bf5631bcbcf73b3c3a2fb1a8964d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add Ledger Sync check status

- [#7499](https://github.com/LedgerHQ/ledger-live/pull/7499) [`c94d878`](https://github.com/LedgerHQ/ledger-live/commit/c94d878056f7ddace40cee1dae863f7080ec10d9) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Live-Wallet - Fix a wallet sync parser issue happening when the info field was null

- Updated dependencies [[`08e85c3`](https://github.com/LedgerHQ/ledger-live/commit/08e85c3fbaf5e27b072e39730f9ceb4135a59d1e), [`afa03ae`](https://github.com/LedgerHQ/ledger-live/commit/afa03ae921ad1ca7df83dc0ba717c1cc27cb08cd), [`c0f4803`](https://github.com/LedgerHQ/ledger-live/commit/c0f48035b974f2bcde9df8423c6bb9bbb31d4b38), [`df9b4b7`](https://github.com/LedgerHQ/ledger-live/commit/df9b4b7b699503bb3aab1dc791b28e11ef0d51b9), [`db9c2d7`](https://github.com/LedgerHQ/ledger-live/commit/db9c2d78fb74df586c3ea1b9fb75ce3b014a0f4b), [`87d6bb2`](https://github.com/LedgerHQ/ledger-live/commit/87d6bb2501eac654dc10f45a0f591b28569b3d9f), [`4bd91de`](https://github.com/LedgerHQ/ledger-live/commit/4bd91de13442d12acce3ee83d5f2fd5f087570cf), [`53ff78c`](https://github.com/LedgerHQ/ledger-live/commit/53ff78c541d3ed69a3e74854d77f58a7e0d93978), [`ecc3ee4`](https://github.com/LedgerHQ/ledger-live/commit/ecc3ee46b8d5bf5631bcbcf73b3c3a2fb1a8964d), [`8553b3e`](https://github.com/LedgerHQ/ledger-live/commit/8553b3eef10132396ec580a2d5f20b616f5b18a0), [`52daa39`](https://github.com/LedgerHQ/ledger-live/commit/52daa3998709ac3538afd447fe771faa3e3441be), [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c), [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c), [`506a3c3`](https://github.com/LedgerHQ/ledger-live/commit/506a3c33f59acf0afc9350e4f36f22f11cf7da26)]:
  - @ledgerhq/trustchain@0.2.0-next.0
  - @ledgerhq/coin-framework@0.17.0-next.0
  - @ledgerhq/types-live@6.50.0-next.0
  - @ledgerhq/cryptoassets@13.3.0-next.0
  - @ledgerhq/types-cryptoassets@7.15.0-next.0
  - @ledgerhq/live-env@2.2.0-next.0
  - @ledgerhq/live-network@1.4.0-next.0

## 0.4.1

### Patch Changes

- Updated dependencies [[`0b12c90`](https://github.com/LedgerHQ/ledger-live/commit/0b12c9040d6ee0a326b1d5effd261ddee2db452f)]:
  - @ledgerhq/devices@8.4.2
  - @ledgerhq/coin-framework@0.16.1
  - @ledgerhq/types-live@6.49.0
  - @ledgerhq/trustchain@0.1.3

## 0.4.1-hotfix.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/types-live@6.49.0
  - @ledgerhq/trustchain@0.1.3-hotfix.1

## 0.4.1-hotfix.0

### Patch Changes

- Updated dependencies [[`5d508e5`](https://github.com/LedgerHQ/ledger-live/commit/5d508e5cfd296e458746adf176dd292aa884f7ea)]:
  - @ledgerhq/devices@8.4.2-hotfix.0
  - @ledgerhq/coin-framework@0.16.1-hotfix.0
  - @ledgerhq/trustchain@0.1.3-hotfix.0

## 0.4.0

### Minor Changes

- [#7138](https://github.com/LedgerHQ/ledger-live/pull/7138) [`ef2d53d`](https://github.com/LedgerHQ/ledger-live/commit/ef2d53d514f1f4e6f18fc79fa3423bd9b0208a04) Thanks [@lvndry](https://github.com/lvndry)! - removes via, vtc and ppc support

### Patch Changes

- Updated dependencies [[`ef2d53d`](https://github.com/LedgerHQ/ledger-live/commit/ef2d53d514f1f4e6f18fc79fa3423bd9b0208a04), [`b77ab8e`](https://github.com/LedgerHQ/ledger-live/commit/b77ab8e718ee8e10b74dc15370e8a19d2597d39e), [`52db252`](https://github.com/LedgerHQ/ledger-live/commit/52db252757870398cba5366d595b4d5fe8099b90), [`f819703`](https://github.com/LedgerHQ/ledger-live/commit/f81970347d139e63a547ab809be425d6f4d464a4), [`fe8a26b`](https://github.com/LedgerHQ/ledger-live/commit/fe8a26b04206df64e50220c3e9249c9a1bd057a6), [`1cbf767`](https://github.com/LedgerHQ/ledger-live/commit/1cbf767465d9e1f7bed5de79c5b5a0a5ca06e1b5), [`c59adf2`](https://github.com/LedgerHQ/ledger-live/commit/c59adf2b0d49ea3c72b94fcb356eb72bcbfc4a6b)]:
  - @ledgerhq/types-cryptoassets@7.14.0
  - @ledgerhq/cryptoassets@13.2.0
  - @ledgerhq/types-live@6.49.0
  - @ledgerhq/coin-framework@0.16.0
  - @ledgerhq/trustchain@0.1.2
  - @ledgerhq/devices@8.4.1
  - @ledgerhq/live-network@1.3.1

## 0.4.0-next.0

### Minor Changes

- [#7138](https://github.com/LedgerHQ/ledger-live/pull/7138) [`ef2d53d`](https://github.com/LedgerHQ/ledger-live/commit/ef2d53d514f1f4e6f18fc79fa3423bd9b0208a04) Thanks [@lvndry](https://github.com/lvndry)! - removes via, vtc and ppc support

### Patch Changes

- Updated dependencies [[`ef2d53d`](https://github.com/LedgerHQ/ledger-live/commit/ef2d53d514f1f4e6f18fc79fa3423bd9b0208a04), [`b77ab8e`](https://github.com/LedgerHQ/ledger-live/commit/b77ab8e718ee8e10b74dc15370e8a19d2597d39e), [`52db252`](https://github.com/LedgerHQ/ledger-live/commit/52db252757870398cba5366d595b4d5fe8099b90), [`f819703`](https://github.com/LedgerHQ/ledger-live/commit/f81970347d139e63a547ab809be425d6f4d464a4), [`fe8a26b`](https://github.com/LedgerHQ/ledger-live/commit/fe8a26b04206df64e50220c3e9249c9a1bd057a6), [`1cbf767`](https://github.com/LedgerHQ/ledger-live/commit/1cbf767465d9e1f7bed5de79c5b5a0a5ca06e1b5), [`c59adf2`](https://github.com/LedgerHQ/ledger-live/commit/c59adf2b0d49ea3c72b94fcb356eb72bcbfc4a6b)]:
  - @ledgerhq/types-cryptoassets@7.14.0-next.0
  - @ledgerhq/cryptoassets@13.2.0-next.0
  - @ledgerhq/types-live@6.49.0-next.0
  - @ledgerhq/coin-framework@0.16.0-next.0
  - @ledgerhq/trustchain@0.1.2-next.0
  - @ledgerhq/devices@8.4.1-next.0
  - @ledgerhq/live-network@1.3.1-next.0

## 0.3.0

### Minor Changes

- [#7079](https://github.com/LedgerHQ/ledger-live/pull/7079) [`9f33fc1`](https://github.com/LedgerHQ/ledger-live/commit/9f33fc14e0628a68d32957171aa879c30041f27e) Thanks [@KVNLS](https://github.com/KVNLS)! - Keep previously renamed accounts alias

### Patch Changes

- [#7206](https://github.com/LedgerHQ/ledger-live/pull/7206) [`81e5b8b`](https://github.com/LedgerHQ/ledger-live/commit/81e5b8bf4830dcb9d666436f2cc4367d92e93e78) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - chore: resolve merge conflicts

- Updated dependencies [[`9551536`](https://github.com/LedgerHQ/ledger-live/commit/955153681ebc19344ed5becfbf7b131224b2ebd0), [`cde94b9`](https://github.com/LedgerHQ/ledger-live/commit/cde94b9584d6889849fb097813a5fc11ea19d069), [`785c618`](https://github.com/LedgerHQ/ledger-live/commit/785c6180c2212ca879c2fddb8302f0bab5686761), [`b478096`](https://github.com/LedgerHQ/ledger-live/commit/b478096537a0f86a9e39acc8c6cf17b1184e0849), [`81e5b8b`](https://github.com/LedgerHQ/ledger-live/commit/81e5b8bf4830dcb9d666436f2cc4367d92e93e78)]:
  - @ledgerhq/types-live@6.48.1
  - @ledgerhq/coin-framework@0.15.0
  - @ledgerhq/cryptoassets@13.1.1

## 0.3.0-next.2

### Patch Changes

- [#7206](https://github.com/LedgerHQ/ledger-live/pull/7206) [`81e5b8b`](https://github.com/LedgerHQ/ledger-live/commit/81e5b8bf4830dcb9d666436f2cc4367d92e93e78) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - chore: resolve merge conflicts

- Updated dependencies [[`81e5b8b`](https://github.com/LedgerHQ/ledger-live/commit/81e5b8bf4830dcb9d666436f2cc4367d92e93e78)]:
  - @ledgerhq/cryptoassets@13.1.1-next.1
  - @ledgerhq/types-live@6.48.1-next.1
  - @ledgerhq/coin-framework@0.15.0-next.2

## 0.3.0-next.1

### Patch Changes

- Updated dependencies [[`b478096`](https://github.com/LedgerHQ/ledger-live/commit/b478096537a0f86a9e39acc8c6cf17b1184e0849)]:
  - @ledgerhq/cryptoassets@13.1.1-next.0
  - @ledgerhq/coin-framework@0.15.0-next.1

## 0.3.0-next.0

### Minor Changes

- [#7079](https://github.com/LedgerHQ/ledger-live/pull/7079) [`9f33fc1`](https://github.com/LedgerHQ/ledger-live/commit/9f33fc14e0628a68d32957171aa879c30041f27e) Thanks [@KVNLS](https://github.com/KVNLS)! - Keep previously renamed accounts alias

### Patch Changes

- Updated dependencies [[`9551536`](https://github.com/LedgerHQ/ledger-live/commit/955153681ebc19344ed5becfbf7b131224b2ebd0), [`cde94b9`](https://github.com/LedgerHQ/ledger-live/commit/cde94b9584d6889849fb097813a5fc11ea19d069), [`785c618`](https://github.com/LedgerHQ/ledger-live/commit/785c6180c2212ca879c2fddb8302f0bab5686761)]:
  - @ledgerhq/types-live@6.48.1-next.0
  - @ledgerhq/coin-framework@0.15.0-next.0

## 0.2.0

### Minor Changes

- [#7080](https://github.com/LedgerHQ/ledger-live/pull/7080) [`7ef6b57`](https://github.com/LedgerHQ/ledger-live/commit/7ef6b574a098f76f1999f1e74147c60b6fafe093) Thanks [@KVNLS](https://github.com/KVNLS)! - Keep previously renamed accounts alias

### Patch Changes

- [#6796](https://github.com/LedgerHQ/ledger-live/pull/6796) [`6552679`](https://github.com/LedgerHQ/ledger-live/commit/65526794bb4d1fbc7e286c0e1c0b6d021413fc8c) Thanks [@gre](https://github.com/gre)! - Drop technical Account#name and Account#starred fields and replace it with a new architecture: a wallet store that contains all user's data.

- [#6816](https://github.com/LedgerHQ/ledger-live/pull/6816) [`60cd799`](https://github.com/LedgerHQ/ledger-live/commit/60cd799e693e3ae0712a5a9e88206b5304bbc214) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Split currencies utils between CoinFmk and LLC

- Updated dependencies [[`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11), [`6c35cc5`](https://github.com/LedgerHQ/ledger-live/commit/6c35cc564cb050614ee571907f628ecf15ec4584), [`b9f1f71`](https://github.com/LedgerHQ/ledger-live/commit/b9f1f715355752d8c57c24ecd6a6d166b80f689d), [`de5de2d`](https://github.com/LedgerHQ/ledger-live/commit/de5de2d273ed6966c82bde2c3a95b98ba594204f), [`83e5690`](https://github.com/LedgerHQ/ledger-live/commit/83e5690429e41ecd1c508b3398904ae747085cf7), [`6eec3f9`](https://github.com/LedgerHQ/ledger-live/commit/6eec3f973ecea36bafc7ebc8b88526399048cdc4), [`4c01029`](https://github.com/LedgerHQ/ledger-live/commit/4c01029b4d4feb32dab2f9e77da1126050d8c1bc), [`326cae0`](https://github.com/LedgerHQ/ledger-live/commit/326cae088cc33795536deb1d868c86e8dbeb6a13), [`6c35cc5`](https://github.com/LedgerHQ/ledger-live/commit/6c35cc564cb050614ee571907f628ecf15ec4584), [`4499990`](https://github.com/LedgerHQ/ledger-live/commit/449999066c58ae5df371dfb92a7230f9b5e90a60), [`a18c28e`](https://github.com/LedgerHQ/ledger-live/commit/a18c28e3f6a6132bd5e53d5b61721084b3aa19e8), [`801265b`](https://github.com/LedgerHQ/ledger-live/commit/801265b7ff3ed7ebd0012eb50f70898557a2dd52), [`d5a1300`](https://github.com/LedgerHQ/ledger-live/commit/d5a130034c18c7ac8b1fd3d4c5271423b4f7639d), [`6d44f25`](https://github.com/LedgerHQ/ledger-live/commit/6d44f255c5b2f453c61d0b754807db1f76d7174e), [`f19960f`](https://github.com/LedgerHQ/ledger-live/commit/f19960f2e7104e5bdf332269fa92fda47455e17d), [`3b9c93c`](https://github.com/LedgerHQ/ledger-live/commit/3b9c93c0de8ceff2af96a6ee8e42b8d9c2ab7af0), [`6623cd1`](https://github.com/LedgerHQ/ledger-live/commit/6623cd13102bd8340bd7d4dfdd469934527985c3), [`f7e7881`](https://github.com/LedgerHQ/ledger-live/commit/f7e7881a820880143c2b011d6a92b5a36156b2c1), [`2f2b754`](https://github.com/LedgerHQ/ledger-live/commit/2f2b754b1350360ca0d9f761ca6e4a8cbaff141b), [`689e6e5`](https://github.com/LedgerHQ/ledger-live/commit/689e6e5a443170b8e6c2b404cc99af2e67d8e8e4), [`6552679`](https://github.com/LedgerHQ/ledger-live/commit/65526794bb4d1fbc7e286c0e1c0b6d021413fc8c), [`fda6a81`](https://github.com/LedgerHQ/ledger-live/commit/fda6a814544b3a1debceab22f69485911e76cadc), [`689e6e5`](https://github.com/LedgerHQ/ledger-live/commit/689e6e5a443170b8e6c2b404cc99af2e67d8e8e4), [`1a5b277`](https://github.com/LedgerHQ/ledger-live/commit/1a5b2777b7b71aa4c4e353010eeb9e3dab432bca), [`a115d6c`](https://github.com/LedgerHQ/ledger-live/commit/a115d6cd5dcbcc753d02dedb80f5eb1693d1a249), [`a2505de`](https://github.com/LedgerHQ/ledger-live/commit/a2505deb93dd0722981a90e12082ff1dbefc29b1), [`f17a3cb`](https://github.com/LedgerHQ/ledger-live/commit/f17a3cbc16abf7fadf686025a5ca56ec1a1e7bb6), [`60cd799`](https://github.com/LedgerHQ/ledger-live/commit/60cd799e693e3ae0712a5a9e88206b5304bbc214), [`84274a6`](https://github.com/LedgerHQ/ledger-live/commit/84274a6e764a385f707bc811ead7a7e92a02ed6a)]:
  - @ledgerhq/types-cryptoassets@7.13.0
  - @ledgerhq/cryptoassets@13.1.0
  - @ledgerhq/types-live@6.48.0
  - @ledgerhq/devices@8.4.0
  - @ledgerhq/coin-framework@0.14.0
  - @ledgerhq/live-promise@0.1.0
  - @ledgerhq/live-env@2.1.0

## 0.2.0-next.3

### Patch Changes

- Updated dependencies [[`d5a1300`](https://github.com/LedgerHQ/ledger-live/commit/d5a130034c18c7ac8b1fd3d4c5271423b4f7639d)]:
  - @ledgerhq/cryptoassets@13.1.0-next.2
  - @ledgerhq/coin-framework@0.14.0-next.2

## 0.2.0-next.2

### Patch Changes

- Updated dependencies [[`f7e7881`](https://github.com/LedgerHQ/ledger-live/commit/f7e7881a820880143c2b011d6a92b5a36156b2c1)]:
  - @ledgerhq/cryptoassets@13.1.0-next.1
  - @ledgerhq/coin-framework@0.14.0-next.1

## 0.2.0-next.1

### Minor Changes

- [#7080](https://github.com/LedgerHQ/ledger-live/pull/7080) [`7ef6b57`](https://github.com/LedgerHQ/ledger-live/commit/7ef6b574a098f76f1999f1e74147c60b6fafe093) Thanks [@KVNLS](https://github.com/KVNLS)! - Keep previously renamed accounts alias

## 0.1.1-next.0

### Patch Changes

- [#6796](https://github.com/LedgerHQ/ledger-live/pull/6796) [`6552679`](https://github.com/LedgerHQ/ledger-live/commit/65526794bb4d1fbc7e286c0e1c0b6d021413fc8c) Thanks [@gre](https://github.com/gre)! - Drop technical Account#name and Account#starred fields and replace it with a new architecture: a wallet store that contains all user's data.

- [#6816](https://github.com/LedgerHQ/ledger-live/pull/6816) [`60cd799`](https://github.com/LedgerHQ/ledger-live/commit/60cd799e693e3ae0712a5a9e88206b5304bbc214) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Split currencies utils between CoinFmk and LLC

- Updated dependencies [[`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11), [`6c35cc5`](https://github.com/LedgerHQ/ledger-live/commit/6c35cc564cb050614ee571907f628ecf15ec4584), [`b9f1f71`](https://github.com/LedgerHQ/ledger-live/commit/b9f1f715355752d8c57c24ecd6a6d166b80f689d), [`de5de2d`](https://github.com/LedgerHQ/ledger-live/commit/de5de2d273ed6966c82bde2c3a95b98ba594204f), [`83e5690`](https://github.com/LedgerHQ/ledger-live/commit/83e5690429e41ecd1c508b3398904ae747085cf7), [`6eec3f9`](https://github.com/LedgerHQ/ledger-live/commit/6eec3f973ecea36bafc7ebc8b88526399048cdc4), [`4c01029`](https://github.com/LedgerHQ/ledger-live/commit/4c01029b4d4feb32dab2f9e77da1126050d8c1bc), [`326cae0`](https://github.com/LedgerHQ/ledger-live/commit/326cae088cc33795536deb1d868c86e8dbeb6a13), [`6c35cc5`](https://github.com/LedgerHQ/ledger-live/commit/6c35cc564cb050614ee571907f628ecf15ec4584), [`4499990`](https://github.com/LedgerHQ/ledger-live/commit/449999066c58ae5df371dfb92a7230f9b5e90a60), [`a18c28e`](https://github.com/LedgerHQ/ledger-live/commit/a18c28e3f6a6132bd5e53d5b61721084b3aa19e8), [`801265b`](https://github.com/LedgerHQ/ledger-live/commit/801265b7ff3ed7ebd0012eb50f70898557a2dd52), [`6d44f25`](https://github.com/LedgerHQ/ledger-live/commit/6d44f255c5b2f453c61d0b754807db1f76d7174e), [`f19960f`](https://github.com/LedgerHQ/ledger-live/commit/f19960f2e7104e5bdf332269fa92fda47455e17d), [`3b9c93c`](https://github.com/LedgerHQ/ledger-live/commit/3b9c93c0de8ceff2af96a6ee8e42b8d9c2ab7af0), [`6623cd1`](https://github.com/LedgerHQ/ledger-live/commit/6623cd13102bd8340bd7d4dfdd469934527985c3), [`2f2b754`](https://github.com/LedgerHQ/ledger-live/commit/2f2b754b1350360ca0d9f761ca6e4a8cbaff141b), [`689e6e5`](https://github.com/LedgerHQ/ledger-live/commit/689e6e5a443170b8e6c2b404cc99af2e67d8e8e4), [`6552679`](https://github.com/LedgerHQ/ledger-live/commit/65526794bb4d1fbc7e286c0e1c0b6d021413fc8c), [`fda6a81`](https://github.com/LedgerHQ/ledger-live/commit/fda6a814544b3a1debceab22f69485911e76cadc), [`689e6e5`](https://github.com/LedgerHQ/ledger-live/commit/689e6e5a443170b8e6c2b404cc99af2e67d8e8e4), [`1a5b277`](https://github.com/LedgerHQ/ledger-live/commit/1a5b2777b7b71aa4c4e353010eeb9e3dab432bca), [`a115d6c`](https://github.com/LedgerHQ/ledger-live/commit/a115d6cd5dcbcc753d02dedb80f5eb1693d1a249), [`a2505de`](https://github.com/LedgerHQ/ledger-live/commit/a2505deb93dd0722981a90e12082ff1dbefc29b1), [`f17a3cb`](https://github.com/LedgerHQ/ledger-live/commit/f17a3cbc16abf7fadf686025a5ca56ec1a1e7bb6), [`60cd799`](https://github.com/LedgerHQ/ledger-live/commit/60cd799e693e3ae0712a5a9e88206b5304bbc214), [`84274a6`](https://github.com/LedgerHQ/ledger-live/commit/84274a6e764a385f707bc811ead7a7e92a02ed6a)]:
  - @ledgerhq/types-cryptoassets@7.13.0-next.0
  - @ledgerhq/cryptoassets@13.1.0-next.0
  - @ledgerhq/types-live@6.48.0-next.0
  - @ledgerhq/devices@8.4.0-next.0
  - @ledgerhq/coin-framework@0.14.0-next.0
  - @ledgerhq/live-promise@0.1.0-next.0
  - @ledgerhq/live-env@2.1.0-next.0
