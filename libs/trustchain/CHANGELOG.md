# @ledgerhq/live-wallet

## 0.3.0

### Minor Changes

- [#7603](https://github.com/LedgerHQ/ledger-live/pull/7603) [`5c738cb`](https://github.com/LedgerHQ/ledger-live/commit/5c738cbd35ce5d0ca39ad3b86a61cc6234d1bdf7) Thanks [@thesan](https://github.com/thesan)! - Fix Trustchain error when switching device while logged in

- [#7646](https://github.com/LedgerHQ/ledger-live/pull/7646) [`267526c`](https://github.com/LedgerHQ/ledger-live/commit/267526c3f8cc4863d4947ab3c28ba20dc5593028) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Ledger Sync - Added the synchronization of a trustchain from mobile to desktop by scanning the QR code

- [#7691](https://github.com/LedgerHQ/ledger-live/pull/7691) [`ce18c9b`](https://github.com/LedgerHQ/ledger-live/commit/ce18c9bde11fbd6cc196091716b1547354063d89) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Ledger Sync - Added a Loading screen on LLM and LLD when initializing ledger sync while accounts are synchronizing

- [#7440](https://github.com/LedgerHQ/ledger-live/pull/7440) [`bc044e4`](https://github.com/LedgerHQ/ledger-live/commit/bc044e482ea2827dca281c44ec36526d63da5194) Thanks [@thesan](https://github.com/thesan)! - Request device access within `HWDeviceProvider`

### Patch Changes

- [#7591](https://github.com/LedgerHQ/ledger-live/pull/7591) [`87c160d`](https://github.com/LedgerHQ/ledger-live/commit/87c160d855b512d5a0394eaee7626e2b8cd431ee) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Trustchain - Prevent duplicate add member

- [#7588](https://github.com/LedgerHQ/ledger-live/pull/7588) [`d60a022`](https://github.com/LedgerHQ/ledger-live/commit/d60a02238db9ed16142de4c1874e26d27aaaa98c) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Trustchain - Removed member ejected on get members

- [#7561](https://github.com/LedgerHQ/ledger-live/pull/7561) [`1fb2b90`](https://github.com/LedgerHQ/ledger-live/commit/1fb2b909c5d97e373a0f72baa37578132bd8b24a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix get Members errors GetMember :Error: ["useGetMembers", null] data is undefined

- [#7733](https://github.com/LedgerHQ/ledger-live/pull/7733) [`ef99222`](https://github.com/LedgerHQ/ledger-live/commit/ef99222a5adcd9732d06600bc875309c440e084f) Thanks [@thesan](https://github.com/thesan)! - Handle Ledgersync onboarding errors

- [#7712](https://github.com/LedgerHQ/ledger-live/pull/7712) [`a84f3d3`](https://github.com/LedgerHQ/ledger-live/commit/a84f3d344e37301dc76f182c0f99b0b01106abfa) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Handle TrustchainAlreadyInitialized & TrustchainAlreadyInitializedWithOtherSeed on Scan QR

- [#7632](https://github.com/LedgerHQ/ledger-live/pull/7632) [`271f90d`](https://github.com/LedgerHQ/ledger-live/commit/271f90dc0f5b46ddaf136873dc034d4c44045dd0) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM / LLD - Fix the getOrCreateTrustchain that wasn't working when another instance destroyed the trustchain

- [#7687](https://github.com/LedgerHQ/ledger-live/pull/7687) [`297ce51`](https://github.com/LedgerHQ/ledger-live/commit/297ce513f496f256efe8f9011734324125f462a5) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Handling alredy created key with new or same Ledger device

- [#7690](https://github.com/LedgerHQ/ledger-live/pull/7690) [`a3fd728`](https://github.com/LedgerHQ/ledger-live/commit/a3fd72861f2a7df676bd793062b3816fdb9d1f57) Thanks [@thesan](https://github.com/thesan)! - Refresh ledger sync QR code on expiration

- Updated dependencies [[`5c738cb`](https://github.com/LedgerHQ/ledger-live/commit/5c738cbd35ce5d0ca39ad3b86a61cc6234d1bdf7), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`fb9466a`](https://github.com/LedgerHQ/ledger-live/commit/fb9466a4d7827fd4759c726ad3ae0b43dddcacd3), [`5758950`](https://github.com/LedgerHQ/ledger-live/commit/5758950841fbf8018dd848e745017484aec67333), [`4799d5d`](https://github.com/LedgerHQ/ledger-live/commit/4799d5de3fb1dcef2b01de31fe29b59e76922576), [`8e0ac04`](https://github.com/LedgerHQ/ledger-live/commit/8e0ac04ac8cdaaee59633ebdf219e5dcf44a10df), [`a3fd728`](https://github.com/LedgerHQ/ledger-live/commit/a3fd72861f2a7df676bd793062b3816fdb9d1f57), [`eb9a36f`](https://github.com/LedgerHQ/ledger-live/commit/eb9a36f6ee8487c9ffbb841c3e6c0ca84f68bb0a)]:
  - @ledgerhq/errors@6.19.0
  - @ledgerhq/live-network@2.0.0
  - @ledgerhq/speculos-transport@0.1.5
  - @ledgerhq/live-env@2.3.0
  - @ledgerhq/hw-trustchain@0.1.5
  - @ledgerhq/hw-transport@6.31.3
  - @ledgerhq/hw-transport-mocker@6.29.3

## 0.3.0-next.0

### Minor Changes

- [#7603](https://github.com/LedgerHQ/ledger-live/pull/7603) [`5c738cb`](https://github.com/LedgerHQ/ledger-live/commit/5c738cbd35ce5d0ca39ad3b86a61cc6234d1bdf7) Thanks [@thesan](https://github.com/thesan)! - Fix Trustchain error when switching device while logged in

- [#7646](https://github.com/LedgerHQ/ledger-live/pull/7646) [`267526c`](https://github.com/LedgerHQ/ledger-live/commit/267526c3f8cc4863d4947ab3c28ba20dc5593028) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Ledger Sync - Added the synchronization of a trustchain from mobile to desktop by scanning the QR code

- [#7691](https://github.com/LedgerHQ/ledger-live/pull/7691) [`ce18c9b`](https://github.com/LedgerHQ/ledger-live/commit/ce18c9bde11fbd6cc196091716b1547354063d89) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Ledger Sync - Added a Loading screen on LLM and LLD when initializing ledger sync while accounts are synchronizing

- [#7440](https://github.com/LedgerHQ/ledger-live/pull/7440) [`bc044e4`](https://github.com/LedgerHQ/ledger-live/commit/bc044e482ea2827dca281c44ec36526d63da5194) Thanks [@thesan](https://github.com/thesan)! - Request device access within `HWDeviceProvider`

### Patch Changes

- [#7591](https://github.com/LedgerHQ/ledger-live/pull/7591) [`87c160d`](https://github.com/LedgerHQ/ledger-live/commit/87c160d855b512d5a0394eaee7626e2b8cd431ee) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Trustchain - Prevent duplicate add member

- [#7588](https://github.com/LedgerHQ/ledger-live/pull/7588) [`d60a022`](https://github.com/LedgerHQ/ledger-live/commit/d60a02238db9ed16142de4c1874e26d27aaaa98c) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Trustchain - Removed member ejected on get members

- [#7561](https://github.com/LedgerHQ/ledger-live/pull/7561) [`1fb2b90`](https://github.com/LedgerHQ/ledger-live/commit/1fb2b909c5d97e373a0f72baa37578132bd8b24a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix get Members errors GetMember :Error: ["useGetMembers", null] data is undefined

- [#7733](https://github.com/LedgerHQ/ledger-live/pull/7733) [`ef99222`](https://github.com/LedgerHQ/ledger-live/commit/ef99222a5adcd9732d06600bc875309c440e084f) Thanks [@thesan](https://github.com/thesan)! - Handle Ledgersync onboarding errors

- [#7712](https://github.com/LedgerHQ/ledger-live/pull/7712) [`a84f3d3`](https://github.com/LedgerHQ/ledger-live/commit/a84f3d344e37301dc76f182c0f99b0b01106abfa) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Handle TrustchainAlreadyInitialized & TrustchainAlreadyInitializedWithOtherSeed on Scan QR

- [#7632](https://github.com/LedgerHQ/ledger-live/pull/7632) [`271f90d`](https://github.com/LedgerHQ/ledger-live/commit/271f90dc0f5b46ddaf136873dc034d4c44045dd0) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - LLM / LLD - Fix the getOrCreateTrustchain that wasn't working when another instance destroyed the trustchain

- [#7687](https://github.com/LedgerHQ/ledger-live/pull/7687) [`297ce51`](https://github.com/LedgerHQ/ledger-live/commit/297ce513f496f256efe8f9011734324125f462a5) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Handling alredy created key with new or same Ledger device

- [#7690](https://github.com/LedgerHQ/ledger-live/pull/7690) [`a3fd728`](https://github.com/LedgerHQ/ledger-live/commit/a3fd72861f2a7df676bd793062b3816fdb9d1f57) Thanks [@thesan](https://github.com/thesan)! - Refresh ledger sync QR code on expiration

- Updated dependencies [[`5c738cb`](https://github.com/LedgerHQ/ledger-live/commit/5c738cbd35ce5d0ca39ad3b86a61cc6234d1bdf7), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`fb9466a`](https://github.com/LedgerHQ/ledger-live/commit/fb9466a4d7827fd4759c726ad3ae0b43dddcacd3), [`5758950`](https://github.com/LedgerHQ/ledger-live/commit/5758950841fbf8018dd848e745017484aec67333), [`4799d5d`](https://github.com/LedgerHQ/ledger-live/commit/4799d5de3fb1dcef2b01de31fe29b59e76922576), [`8e0ac04`](https://github.com/LedgerHQ/ledger-live/commit/8e0ac04ac8cdaaee59633ebdf219e5dcf44a10df), [`a3fd728`](https://github.com/LedgerHQ/ledger-live/commit/a3fd72861f2a7df676bd793062b3816fdb9d1f57), [`eb9a36f`](https://github.com/LedgerHQ/ledger-live/commit/eb9a36f6ee8487c9ffbb841c3e6c0ca84f68bb0a)]:
  - @ledgerhq/errors@6.19.0-next.0
  - @ledgerhq/live-network@2.0.0-next.0
  - @ledgerhq/speculos-transport@0.1.5-next.0
  - @ledgerhq/live-env@2.3.0-next.0
  - @ledgerhq/hw-trustchain@0.1.5-next.0
  - @ledgerhq/hw-transport@6.31.3-next.0
  - @ledgerhq/hw-transport-mocker@6.29.3-next.0

## 0.2.0

### Minor Changes

- [#7497](https://github.com/LedgerHQ/ledger-live/pull/7497) [`52daa39`](https://github.com/LedgerHQ/ledger-live/commit/52daa3998709ac3538afd447fe771faa3e3441be) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Added parameters to lldWalletSync and llmWalletSync to be able to configure the wallet sync feature remotely

### Patch Changes

- [#7131](https://github.com/LedgerHQ/ledger-live/pull/7131) [`08e85c3`](https://github.com/LedgerHQ/ledger-live/commit/08e85c3fbaf5e27b072e39730f9ceb4135a59d1e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Persistent Trustchain store

- [#7303](https://github.com/LedgerHQ/ledger-live/pull/7303) [`c0f4803`](https://github.com/LedgerHQ/ledger-live/commit/c0f48035b974f2bcde9df8423c6bb9bbb31d4b38) Thanks [@thesan](https://github.com/thesan)! - Test refusing member removal on device

- [#7435](https://github.com/LedgerHQ/ledger-live/pull/7435) [`ecc3ee4`](https://github.com/LedgerHQ/ledger-live/commit/ecc3ee46b8d5bf5631bcbcf73b3c3a2fb1a8964d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add Ledger Sync check status

- [#7388](https://github.com/LedgerHQ/ledger-live/pull/7388) [`506a3c3`](https://github.com/LedgerHQ/ledger-live/commit/506a3c33f59acf0afc9350e4f36f22f11cf7da26) Thanks [@thesan](https://github.com/thesan)! - Factor device interactions out of the Trustchain SDK

- Updated dependencies [[`08e85c3`](https://github.com/LedgerHQ/ledger-live/commit/08e85c3fbaf5e27b072e39730f9ceb4135a59d1e), [`4bd91de`](https://github.com/LedgerHQ/ledger-live/commit/4bd91de13442d12acce3ee83d5f2fd5f087570cf), [`53ff78c`](https://github.com/LedgerHQ/ledger-live/commit/53ff78c541d3ed69a3e74854d77f58a7e0d93978), [`52daa39`](https://github.com/LedgerHQ/ledger-live/commit/52daa3998709ac3538afd447fe771faa3e3441be), [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c), [`8dd0fb1`](https://github.com/LedgerHQ/ledger-live/commit/8dd0fb195525eef4600a8ecbca2a80a1899de321)]:
  - @ledgerhq/hw-trustchain@0.1.4
  - @ledgerhq/live-env@2.2.0
  - @ledgerhq/live-network@1.4.0
  - @ledgerhq/types-devices@6.25.3
  - @ledgerhq/speculos-transport@0.1.4

## 0.2.0-next.0

### Minor Changes

- [#7497](https://github.com/LedgerHQ/ledger-live/pull/7497) [`52daa39`](https://github.com/LedgerHQ/ledger-live/commit/52daa3998709ac3538afd447fe771faa3e3441be) Thanks [@cgrellard-ledger](https://github.com/cgrellard-ledger)! - Added parameters to lldWalletSync and llmWalletSync to be able to configure the wallet sync feature remotely

### Patch Changes

- [#7131](https://github.com/LedgerHQ/ledger-live/pull/7131) [`08e85c3`](https://github.com/LedgerHQ/ledger-live/commit/08e85c3fbaf5e27b072e39730f9ceb4135a59d1e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Persistent Trustchain store

- [#7303](https://github.com/LedgerHQ/ledger-live/pull/7303) [`c0f4803`](https://github.com/LedgerHQ/ledger-live/commit/c0f48035b974f2bcde9df8423c6bb9bbb31d4b38) Thanks [@thesan](https://github.com/thesan)! - Test refusing member removal on device

- [#7435](https://github.com/LedgerHQ/ledger-live/pull/7435) [`ecc3ee4`](https://github.com/LedgerHQ/ledger-live/commit/ecc3ee46b8d5bf5631bcbcf73b3c3a2fb1a8964d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add Ledger Sync check status

- [#7388](https://github.com/LedgerHQ/ledger-live/pull/7388) [`506a3c3`](https://github.com/LedgerHQ/ledger-live/commit/506a3c33f59acf0afc9350e4f36f22f11cf7da26) Thanks [@thesan](https://github.com/thesan)! - Factor device interactions out of the Trustchain SDK

- Updated dependencies [[`08e85c3`](https://github.com/LedgerHQ/ledger-live/commit/08e85c3fbaf5e27b072e39730f9ceb4135a59d1e), [`4bd91de`](https://github.com/LedgerHQ/ledger-live/commit/4bd91de13442d12acce3ee83d5f2fd5f087570cf), [`53ff78c`](https://github.com/LedgerHQ/ledger-live/commit/53ff78c541d3ed69a3e74854d77f58a7e0d93978), [`52daa39`](https://github.com/LedgerHQ/ledger-live/commit/52daa3998709ac3538afd447fe771faa3e3441be), [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c), [`8dd0fb1`](https://github.com/LedgerHQ/ledger-live/commit/8dd0fb195525eef4600a8ecbca2a80a1899de321)]:
  - @ledgerhq/hw-trustchain@0.1.4-next.0
  - @ledgerhq/live-env@2.2.0-next.0
  - @ledgerhq/live-network@1.4.0-next.0
  - @ledgerhq/types-devices@6.25.3-next.0
  - @ledgerhq/speculos-transport@0.1.4-next.0

## 0.1.3

### Patch Changes

- Updated dependencies [[`af3d126`](https://github.com/LedgerHQ/ledger-live/commit/af3d126b524dbacf606e3beb56246608f2243eca)]:
  - @ledgerhq/types-devices@6.25.2
  - @ledgerhq/hw-transport@6.31.2
  - @ledgerhq/speculos-transport@0.1.3
  - @ledgerhq/hw-trustchain@0.1.3
  - @ledgerhq/hw-transport-mocker@6.29.2

## 0.1.3-hotfix.1

### Patch Changes

- Updated dependencies [[`af3d126`](https://github.com/LedgerHQ/ledger-live/commit/af3d126b524dbacf606e3beb56246608f2243eca)]:
  - @ledgerhq/types-devices@6.25.2-hotfix.0

## 0.1.3-hotfix.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.31.2-hotfix.0
  - @ledgerhq/speculos-transport@0.1.3-hotfix.0
  - @ledgerhq/hw-trustchain@0.1.3-hotfix.0
  - @ledgerhq/hw-transport-mocker@6.29.2-hotfix.0

## 0.1.2

### Patch Changes

- Updated dependencies [[`c9329bb`](https://github.com/LedgerHQ/ledger-live/commit/c9329bb94d115bef23b02fdbed7c62f01c186d0a), [`e78f3b7`](https://github.com/LedgerHQ/ledger-live/commit/e78f3b75296c7a063f6cddbeae44c36d236055f3), [`f979216`](https://github.com/LedgerHQ/ledger-live/commit/f9792160293fc8215c6d099f02e1b136c6655f9b), [`c1d2bb0`](https://github.com/LedgerHQ/ledger-live/commit/c1d2bb0866723c10d6e2899d40ddd9b9801189f4)]:
  - @ledgerhq/types-devices@6.25.1
  - @ledgerhq/errors@6.18.0
  - @ledgerhq/hw-transport@6.31.1
  - @ledgerhq/live-network@1.3.1
  - @ledgerhq/speculos-transport@0.1.2
  - @ledgerhq/hw-trustchain@0.1.2
  - @ledgerhq/hw-transport-mocker@6.29.1

## 0.1.2-next.0

### Patch Changes

- Updated dependencies [[`c9329bb`](https://github.com/LedgerHQ/ledger-live/commit/c9329bb94d115bef23b02fdbed7c62f01c186d0a), [`e78f3b7`](https://github.com/LedgerHQ/ledger-live/commit/e78f3b75296c7a063f6cddbeae44c36d236055f3), [`f979216`](https://github.com/LedgerHQ/ledger-live/commit/f9792160293fc8215c6d099f02e1b136c6655f9b), [`c1d2bb0`](https://github.com/LedgerHQ/ledger-live/commit/c1d2bb0866723c10d6e2899d40ddd9b9801189f4)]:
  - @ledgerhq/types-devices@6.25.1-next.0
  - @ledgerhq/errors@6.18.0-next.0
  - @ledgerhq/hw-transport@6.31.1-next.0
  - @ledgerhq/live-network@1.3.1-next.0
  - @ledgerhq/speculos-transport@0.1.2-next.0
  - @ledgerhq/hw-trustchain@0.1.2-next.0
  - @ledgerhq/hw-transport-mocker@6.29.1-next.0

## 0.1.1

### Patch Changes

- Updated dependencies [[`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11), [`815ae3d`](https://github.com/LedgerHQ/ledger-live/commit/815ae3dae8027823854ada837df3dc983d09b10f), [`326cae0`](https://github.com/LedgerHQ/ledger-live/commit/326cae088cc33795536deb1d868c86e8dbeb6a13), [`cec1599`](https://github.com/LedgerHQ/ledger-live/commit/cec1599a41aa1a18a249e34312164bc93b63972f), [`6d44f25`](https://github.com/LedgerHQ/ledger-live/commit/6d44f255c5b2f453c61d0b754807db1f76d7174e), [`6623cd1`](https://github.com/LedgerHQ/ledger-live/commit/6623cd13102bd8340bd7d4dfdd469934527985c3), [`6552679`](https://github.com/LedgerHQ/ledger-live/commit/65526794bb4d1fbc7e286c0e1c0b6d021413fc8c)]:
  - @ledgerhq/hw-transport@6.31.0
  - @ledgerhq/errors@6.17.0
  - @ledgerhq/live-network@1.3.0
  - @ledgerhq/live-env@2.1.0
  - @ledgerhq/hw-trustchain@0.1.1

## 0.1.1-next.0

### Patch Changes

- Updated dependencies [[`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11), [`815ae3d`](https://github.com/LedgerHQ/ledger-live/commit/815ae3dae8027823854ada837df3dc983d09b10f), [`326cae0`](https://github.com/LedgerHQ/ledger-live/commit/326cae088cc33795536deb1d868c86e8dbeb6a13), [`cec1599`](https://github.com/LedgerHQ/ledger-live/commit/cec1599a41aa1a18a249e34312164bc93b63972f), [`6d44f25`](https://github.com/LedgerHQ/ledger-live/commit/6d44f255c5b2f453c61d0b754807db1f76d7174e), [`6623cd1`](https://github.com/LedgerHQ/ledger-live/commit/6623cd13102bd8340bd7d4dfdd469934527985c3), [`6552679`](https://github.com/LedgerHQ/ledger-live/commit/65526794bb4d1fbc7e286c0e1c0b6d021413fc8c)]:
  - @ledgerhq/hw-transport@6.31.0-next.0
  - @ledgerhq/errors@6.17.0-next.0
  - @ledgerhq/live-network@1.3.0-next.0
  - @ledgerhq/live-env@2.1.0-next.0
  - @ledgerhq/hw-trustchain@0.1.1-next.0
