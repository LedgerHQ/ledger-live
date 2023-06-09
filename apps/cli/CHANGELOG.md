# @ledgerhq/live-cli

## 22.9.1

### Patch Changes

- [#3497](https://github.com/LedgerHQ/ledger-live/pull/3497) [`81dd0c3ef3`](https://github.com/LedgerHQ/ledger-live/commit/81dd0c3ef38a3d6d69c27c65864bf1b41c52643c) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: new toggleOnboardingEarlyCheckAction device action

  Introducing a new device action (implemented in the device SDK): toggleOnboardingEarlyCheckAction with

  - its associated new command and task
  - its associated new onboarding state
  - a hook useToggleOnboardingEarlyCheck for simple usage on LLM and LLD
  - unit tests
  - its associated cli command deviceSDKToggleOnboardingEarlyCheck

  This new action uses a new APDU to enter and exit the "early security check" blocking step during the onboarding of Stax.

- Updated dependencies [[`24483331fe`](https://github.com/LedgerHQ/ledger-live/commit/24483331fe19b9ae4a24544e2f3e1d2ad1892492), [`81dd0c3ef3`](https://github.com/LedgerHQ/ledger-live/commit/81dd0c3ef38a3d6d69c27c65864bf1b41c52643c), [`b93f543a20`](https://github.com/LedgerHQ/ledger-live/commit/b93f543a207f35edbe25f3d609533120c9babbe1), [`3cf4397b60`](https://github.com/LedgerHQ/ledger-live/commit/3cf4397b60a2da5c1ee92cff42e9f979e30ad489), [`8f50c4d927`](https://github.com/LedgerHQ/ledger-live/commit/8f50c4d927f368fd869401b752a51ba7398e59e1), [`4a1454beb3`](https://github.com/LedgerHQ/ledger-live/commit/4a1454beb3f86405ba2686e07879c12a7d35ad8e), [`db1a6f92e1`](https://github.com/LedgerHQ/ledger-live/commit/db1a6f92e17dcd63b0c9fa6700496f5f4722f1e5), [`5bc987cd8f`](https://github.com/LedgerHQ/ledger-live/commit/5bc987cd8f850bb63e4ced62c28218d7c75744e8), [`ebe5b07afe`](https://github.com/LedgerHQ/ledger-live/commit/ebe5b07afec441ea3e2d9103da9e1175972add47), [`42d8be7694`](https://github.com/LedgerHQ/ledger-live/commit/42d8be76949e258d6360a1fda3ca5a1df50c8bcb), [`ac205cce9f`](https://github.com/LedgerHQ/ledger-live/commit/ac205cce9f328165369c5c270681be1d7ba7d0f2)]:
  - @ledgerhq/live-common@31.1.0
  - @ledgerhq/cryptoassets@9.8.0
  - @ledgerhq/coin-framework@0.3.6

## 22.9.0

### Minor Changes

- [#3515](https://github.com/LedgerHQ/ledger-live/pull/3515) [`ce675302c7`](https://github.com/LedgerHQ/ledger-live/commit/ce675302c78311571e1087cfa35ee67580263796) Thanks [@chabroA](https://github.com/chabroA)! - Use live-network package

- [#2977](https://github.com/LedgerHQ/ledger-live/pull/2977) [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500) Thanks [@grsoares21](https://github.com/grsoares21)! - Rename the CLI command used for testing the DeviceSDK firmware update

### Patch Changes

- Updated dependencies [[`b574c30b2b`](https://github.com/LedgerHQ/ledger-live/commit/b574c30b2ba9ba49e12ab20ce1fd7c68c2220acf), [`ce675302c7`](https://github.com/LedgerHQ/ledger-live/commit/ce675302c78311571e1087cfa35ee67580263796), [`5cce6e3593`](https://github.com/LedgerHQ/ledger-live/commit/5cce6e359309110df53e16ef989c5b8b94492dfd), [`5c28db16a5`](https://github.com/LedgerHQ/ledger-live/commit/5c28db16a5b7e804dff8e51062baca311574a50c), [`76699bc304`](https://github.com/LedgerHQ/ledger-live/commit/76699bc304204232b280984644a7c5709fdff063), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500), [`a380bfc53a`](https://github.com/LedgerHQ/ledger-live/commit/a380bfc53a25bf196031337cd7ab8bc459731e16), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500), [`30bf4d92c7`](https://github.com/LedgerHQ/ledger-live/commit/30bf4d92c7d79cb81b1e4ad014857459739c33be), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500), [`eb258d57c2`](https://github.com/LedgerHQ/ledger-live/commit/eb258d57c2abd8d0db9154a82932e1fd83bfce9a), [`b30ead9d22`](https://github.com/LedgerHQ/ledger-live/commit/b30ead9d22a4bce5f8ee27febf0190fccd2ca25b), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500), [`b40fa18379`](https://github.com/LedgerHQ/ledger-live/commit/b40fa18379bcadb56e8cbd902a299426d97e2345), [`f13bf2e2cc`](https://github.com/LedgerHQ/ledger-live/commit/f13bf2e2ccd1684692e1f641b66f0f3b4d457c2d), [`ce675302c7`](https://github.com/LedgerHQ/ledger-live/commit/ce675302c78311571e1087cfa35ee67580263796), [`5c53afd2c2`](https://github.com/LedgerHQ/ledger-live/commit/5c53afd2c2a343c52f5bf36cc08f55c06f313eed)]:
  - @ledgerhq/live-common@31.0.0
  - @ledgerhq/cryptoassets@9.7.0
  - @ledgerhq/live-network@1.1.0
  - @ledgerhq/coin-framework@0.3.5

## 22.9.0-next.2

### Patch Changes

- Updated dependencies [[`5c53afd2c2`](https://github.com/LedgerHQ/ledger-live/commit/5c53afd2c2a343c52f5bf36cc08f55c06f313eed)]:
  - @ledgerhq/live-common@31.0.0-next.2

## 22.9.0-next.1

### Patch Changes

- Updated dependencies [[`30bf4d92c7`](https://github.com/LedgerHQ/ledger-live/commit/30bf4d92c7d79cb81b1e4ad014857459739c33be)]:
  - @ledgerhq/cryptoassets@9.7.0-next.1
  - @ledgerhq/coin-framework@0.3.5-next.1
  - @ledgerhq/live-common@31.0.0-next.1

## 22.9.0-next.0

### Minor Changes

- [#3515](https://github.com/LedgerHQ/ledger-live/pull/3515) [`ce675302c7`](https://github.com/LedgerHQ/ledger-live/commit/ce675302c78311571e1087cfa35ee67580263796) Thanks [@chabroA](https://github.com/chabroA)! - Use live-network package

- [#2977](https://github.com/LedgerHQ/ledger-live/pull/2977) [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500) Thanks [@grsoares21](https://github.com/grsoares21)! - Rename the CLI command used for testing the DeviceSDK firmware update

### Patch Changes

- Updated dependencies [[`b574c30b2b`](https://github.com/LedgerHQ/ledger-live/commit/b574c30b2ba9ba49e12ab20ce1fd7c68c2220acf), [`ce675302c7`](https://github.com/LedgerHQ/ledger-live/commit/ce675302c78311571e1087cfa35ee67580263796), [`5cce6e3593`](https://github.com/LedgerHQ/ledger-live/commit/5cce6e359309110df53e16ef989c5b8b94492dfd), [`5c28db16a5`](https://github.com/LedgerHQ/ledger-live/commit/5c28db16a5b7e804dff8e51062baca311574a50c), [`76699bc304`](https://github.com/LedgerHQ/ledger-live/commit/76699bc304204232b280984644a7c5709fdff063), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500), [`a380bfc53a`](https://github.com/LedgerHQ/ledger-live/commit/a380bfc53a25bf196031337cd7ab8bc459731e16), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500), [`eb258d57c2`](https://github.com/LedgerHQ/ledger-live/commit/eb258d57c2abd8d0db9154a82932e1fd83bfce9a), [`b30ead9d22`](https://github.com/LedgerHQ/ledger-live/commit/b30ead9d22a4bce5f8ee27febf0190fccd2ca25b), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500), [`7439b63325`](https://github.com/LedgerHQ/ledger-live/commit/7439b63325a9b0181a3af4310ba787f00faa80c9), [`b40fa18379`](https://github.com/LedgerHQ/ledger-live/commit/b40fa18379bcadb56e8cbd902a299426d97e2345), [`f13bf2e2cc`](https://github.com/LedgerHQ/ledger-live/commit/f13bf2e2ccd1684692e1f641b66f0f3b4d457c2d), [`ce675302c7`](https://github.com/LedgerHQ/ledger-live/commit/ce675302c78311571e1087cfa35ee67580263796)]:
  - @ledgerhq/live-common@31.0.0-next.0
  - @ledgerhq/cryptoassets@9.7.0-next.0
  - @ledgerhq/live-network@1.1.0-next.0
  - @ledgerhq/coin-framework@0.3.5-next.0

## 22.8.2

### Patch Changes

- [#3322](https://github.com/LedgerHQ/ledger-live/pull/3322) [`4da51fc11e`](https://github.com/LedgerHQ/ledger-live/commit/4da51fc11eb3244c74a499167c0de77913ded68b) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Implemented remove custom image command for stax and exposed it on CLI.

- Updated dependencies [[`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546), [`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546), [`186e82c88b`](https://github.com/LedgerHQ/ledger-live/commit/186e82c88b196976f62e776e9d060eab565234f9), [`4da51fc11e`](https://github.com/LedgerHQ/ledger-live/commit/4da51fc11eb3244c74a499167c0de77913ded68b), [`817a8dd811`](https://github.com/LedgerHQ/ledger-live/commit/817a8dd8112ff7c4640852ab4e47ea0436df2ec1), [`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546), [`22491091f7`](https://github.com/LedgerHQ/ledger-live/commit/22491091f7b4e06ee6a0cdf964498aa5b08d6eb0), [`6d09361b6b`](https://github.com/LedgerHQ/ledger-live/commit/6d09361b6b8de34c6b202e00c9bac8f4844eb105), [`4da51fc11e`](https://github.com/LedgerHQ/ledger-live/commit/4da51fc11eb3244c74a499167c0de77913ded68b), [`eb3997d762`](https://github.com/LedgerHQ/ledger-live/commit/eb3997d7621c78e2f7f224d5f62a7857aae873e2), [`2b24af44c3`](https://github.com/LedgerHQ/ledger-live/commit/2b24af44c3f77f2bc46f7a2d9ebcf1ae3759ef80), [`034c68fe40`](https://github.com/LedgerHQ/ledger-live/commit/034c68fe40220dbb2c33a549a26bd0d67097eb45), [`6036036c92`](https://github.com/LedgerHQ/ledger-live/commit/6036036c92ff7236468e748a936d50b0feb65c92), [`7cf49e1919`](https://github.com/LedgerHQ/ledger-live/commit/7cf49e1919466836e9025693ed07b18ebf99041a)]:
  - @ledgerhq/errors@6.12.6
  - @ledgerhq/live-common@30.0.0
  - @ledgerhq/cryptoassets@9.6.0
  - @ledgerhq/coin-framework@0.3.4
  - @ledgerhq/hw-transport@6.28.4
  - @ledgerhq/hw-transport-http@6.27.15
  - @ledgerhq/hw-transport-node-ble@6.27.15
  - @ledgerhq/hw-transport-node-hid@6.27.15
  - @ledgerhq/hw-transport-node-speculos@6.27.15
  - @ledgerhq/hw-app-btc@10.0.4
  - @ledgerhq/hw-transport-mocker@6.27.15

## 22.8.2-next.0

### Patch Changes

- [#3322](https://github.com/LedgerHQ/ledger-live/pull/3322) [`4da51fc11e`](https://github.com/LedgerHQ/ledger-live/commit/4da51fc11eb3244c74a499167c0de77913ded68b) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Implemented remove custom image command for stax and exposed it on CLI.

- Updated dependencies [[`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546), [`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546), [`186e82c88b`](https://github.com/LedgerHQ/ledger-live/commit/186e82c88b196976f62e776e9d060eab565234f9), [`4da51fc11e`](https://github.com/LedgerHQ/ledger-live/commit/4da51fc11eb3244c74a499167c0de77913ded68b), [`817a8dd811`](https://github.com/LedgerHQ/ledger-live/commit/817a8dd8112ff7c4640852ab4e47ea0436df2ec1), [`77f990e207`](https://github.com/LedgerHQ/ledger-live/commit/77f990e2075c7c9a4be69b364e3754b449c7a546), [`22491091f7`](https://github.com/LedgerHQ/ledger-live/commit/22491091f7b4e06ee6a0cdf964498aa5b08d6eb0), [`6d09361b6b`](https://github.com/LedgerHQ/ledger-live/commit/6d09361b6b8de34c6b202e00c9bac8f4844eb105), [`4da51fc11e`](https://github.com/LedgerHQ/ledger-live/commit/4da51fc11eb3244c74a499167c0de77913ded68b), [`eb3997d762`](https://github.com/LedgerHQ/ledger-live/commit/eb3997d7621c78e2f7f224d5f62a7857aae873e2), [`2b24af44c3`](https://github.com/LedgerHQ/ledger-live/commit/2b24af44c3f77f2bc46f7a2d9ebcf1ae3759ef80), [`034c68fe40`](https://github.com/LedgerHQ/ledger-live/commit/034c68fe40220dbb2c33a549a26bd0d67097eb45), [`6036036c92`](https://github.com/LedgerHQ/ledger-live/commit/6036036c92ff7236468e748a936d50b0feb65c92), [`7cf49e1919`](https://github.com/LedgerHQ/ledger-live/commit/7cf49e1919466836e9025693ed07b18ebf99041a)]:
  - @ledgerhq/errors@6.12.6-next.0
  - @ledgerhq/live-common@30.0.0-next.0
  - @ledgerhq/cryptoassets@9.6.0-next.0
  - @ledgerhq/coin-framework@0.3.4-next.0
  - @ledgerhq/hw-transport@6.28.4-next.0
  - @ledgerhq/hw-transport-http@6.27.15-next.0
  - @ledgerhq/hw-transport-node-ble@6.27.15-next.0
  - @ledgerhq/hw-transport-node-hid@6.27.15-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.15-next.0
  - @ledgerhq/hw-app-btc@10.0.4-next.0
  - @ledgerhq/hw-transport-mocker@6.27.15-next.0

## 22.8.1

### Patch Changes

- Updated dependencies [[`491b37f08d`](https://github.com/LedgerHQ/ledger-live/commit/491b37f08d9a17404eaf32c491628e65d2d8666a), [`dfccb01b94`](https://github.com/LedgerHQ/ledger-live/commit/dfccb01b94d545af80ee5e77bf1d04d9d2fd0faa), [`fb1fcc47e4`](https://github.com/LedgerHQ/ledger-live/commit/fb1fcc47e444c35b0908d528b58e096d79d6f967), [`0e4f34fac2`](https://github.com/LedgerHQ/ledger-live/commit/0e4f34fac2ceebdece29d408e914b3664228db36)]:
  - @ledgerhq/live-common@29.6.0
  - @ledgerhq/hw-app-btc@10.0.3
  - @ledgerhq/coin-framework@0.3.3

## 22.8.1-next.0

### Patch Changes

- Updated dependencies [[`491b37f08d`](https://github.com/LedgerHQ/ledger-live/commit/491b37f08d9a17404eaf32c491628e65d2d8666a), [`dfccb01b94`](https://github.com/LedgerHQ/ledger-live/commit/dfccb01b94d545af80ee5e77bf1d04d9d2fd0faa), [`fb1fcc47e4`](https://github.com/LedgerHQ/ledger-live/commit/fb1fcc47e444c35b0908d528b58e096d79d6f967), [`0e4f34fac2`](https://github.com/LedgerHQ/ledger-live/commit/0e4f34fac2ceebdece29d408e914b3664228db36)]:
  - @ledgerhq/live-common@29.6.0-next.0
  - @ledgerhq/hw-app-btc@10.0.3-next.0
  - @ledgerhq/coin-framework@0.3.3-next.0

## 22.8.0

### Minor Changes

- [#3153](https://github.com/LedgerHQ/ledger-live/pull/3153) [`cec978f36e`](https://github.com/LedgerHQ/ledger-live/commit/cec978f36e5841ce3f8d117530e13902590596c3) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Adding support for new EVM chains, including Layer 2s like Optimism & Arbitrum

- [#2809](https://github.com/LedgerHQ/ledger-live/pull/2809) [`51c01541df`](https://github.com/LedgerHQ/ledger-live/commit/51c01541df8a414851ea4ef493dc9045272ef949) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add Quicksilver, Persistence, Onomy, Axelar to Cosmos family

### Patch Changes

- [#3105](https://github.com/LedgerHQ/ledger-live/pull/3105) [`5d7bd8c68e`](https://github.com/LedgerHQ/ledger-live/commit/5d7bd8c68ee33507ff065c05965e1a8c387a4fae) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Refactor device action implementations unifying the logic

- [#3097](https://github.com/LedgerHQ/ledger-live/pull/3097) [`4500a00f21`](https://github.com/LedgerHQ/ledger-live/commit/4500a00f215f73e6c9bbf1d904cb6a4c3d67e678) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Introduce a new manager API for listApps, which should bring memory and time improvements.

- Updated dependencies [[`07fc266a10`](https://github.com/LedgerHQ/ledger-live/commit/07fc266a10479f77044e36b9347b9a97e42f0566), [`a1c1ea56aa`](https://github.com/LedgerHQ/ledger-live/commit/a1c1ea56aa2a9e106b831107d8fae24ea0f27d4d), [`f11d282bde`](https://github.com/LedgerHQ/ledger-live/commit/f11d282bded679dfcbb0bbffe88055d55995e03f), [`0ebfbbf596`](https://github.com/LedgerHQ/ledger-live/commit/0ebfbbf596ef3d690f1eb225698512f9a1108b59), [`5e6f053a27`](https://github.com/LedgerHQ/ledger-live/commit/5e6f053a2744a5ff5f5364609cc1287c3dd8e69e), [`d67f7480f7`](https://github.com/LedgerHQ/ledger-live/commit/d67f7480f767ffceab82a43c37089948315a3fc4), [`cec978f36e`](https://github.com/LedgerHQ/ledger-live/commit/cec978f36e5841ce3f8d117530e13902590596c3), [`164409ab4e`](https://github.com/LedgerHQ/ledger-live/commit/164409ab4e035bb6c941c2f5a0c4e26873c52270), [`ec9426b354`](https://github.com/LedgerHQ/ledger-live/commit/ec9426b354156eb9362a74649a1f887a3aef7f8d), [`5d7bd8c68e`](https://github.com/LedgerHQ/ledger-live/commit/5d7bd8c68ee33507ff065c05965e1a8c387a4fae), [`87d2349fd8`](https://github.com/LedgerHQ/ledger-live/commit/87d2349fd835e5deb39d1ee8dfcf3539f4195472), [`51c01541df`](https://github.com/LedgerHQ/ledger-live/commit/51c01541df8a414851ea4ef493dc9045272ef949), [`4500a00f21`](https://github.com/LedgerHQ/ledger-live/commit/4500a00f215f73e6c9bbf1d904cb6a4c3d67e678), [`baa687a281`](https://github.com/LedgerHQ/ledger-live/commit/baa687a281b5f75cacd06b05b5438807874fa152)]:
  - @ledgerhq/live-common@29.5.0
  - @ledgerhq/cryptoassets@9.5.0
  - @ledgerhq/errors@6.12.5
  - @ledgerhq/coin-framework@0.3.2
  - @ledgerhq/hw-transport@6.28.3
  - @ledgerhq/hw-transport-http@6.27.14
  - @ledgerhq/hw-transport-node-ble@6.27.14
  - @ledgerhq/hw-transport-node-hid@6.27.14
  - @ledgerhq/hw-transport-node-speculos@6.27.14
  - @ledgerhq/hw-app-btc@10.0.2
  - @ledgerhq/hw-transport-mocker@6.27.14

## 22.8.0-next.2

### Patch Changes

- Updated dependencies [[`0ebfbbf596`](https://github.com/LedgerHQ/ledger-live/commit/0ebfbbf596ef3d690f1eb225698512f9a1108b59)]:
  - @ledgerhq/live-common@29.5.0-next.2

## 22.8.0-next.1

### Patch Changes

- Updated dependencies [[`164409ab4e`](https://github.com/LedgerHQ/ledger-live/commit/164409ab4e035bb6c941c2f5a0c4e26873c52270)]:
  - @ledgerhq/live-common@29.5.0-next.1

## 22.8.0-next.0

### Minor Changes

- [#3153](https://github.com/LedgerHQ/ledger-live/pull/3153) [`cec978f36e`](https://github.com/LedgerHQ/ledger-live/commit/cec978f36e5841ce3f8d117530e13902590596c3) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Adding support for new EVM chains, including Layer 2s like Optimism & Arbitrum

- [#2809](https://github.com/LedgerHQ/ledger-live/pull/2809) [`51c01541df`](https://github.com/LedgerHQ/ledger-live/commit/51c01541df8a414851ea4ef493dc9045272ef949) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add Quicksilver, Persistence, Onomy, Axelar to Cosmos family

### Patch Changes

- [#3105](https://github.com/LedgerHQ/ledger-live/pull/3105) [`5d7bd8c68e`](https://github.com/LedgerHQ/ledger-live/commit/5d7bd8c68ee33507ff065c05965e1a8c387a4fae) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Refactor device action implementations unifying the logic

- [#3097](https://github.com/LedgerHQ/ledger-live/pull/3097) [`4500a00f21`](https://github.com/LedgerHQ/ledger-live/commit/4500a00f215f73e6c9bbf1d904cb6a4c3d67e678) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Introduce a new manager API for listApps, which should bring memory and time improvements.

- Updated dependencies [[`07fc266a10`](https://github.com/LedgerHQ/ledger-live/commit/07fc266a10479f77044e36b9347b9a97e42f0566), [`a1c1ea56aa`](https://github.com/LedgerHQ/ledger-live/commit/a1c1ea56aa2a9e106b831107d8fae24ea0f27d4d), [`f11d282bde`](https://github.com/LedgerHQ/ledger-live/commit/f11d282bded679dfcbb0bbffe88055d55995e03f), [`5e6f053a27`](https://github.com/LedgerHQ/ledger-live/commit/5e6f053a2744a5ff5f5364609cc1287c3dd8e69e), [`d67f7480f7`](https://github.com/LedgerHQ/ledger-live/commit/d67f7480f767ffceab82a43c37089948315a3fc4), [`cec978f36e`](https://github.com/LedgerHQ/ledger-live/commit/cec978f36e5841ce3f8d117530e13902590596c3), [`ec9426b354`](https://github.com/LedgerHQ/ledger-live/commit/ec9426b354156eb9362a74649a1f887a3aef7f8d), [`5d7bd8c68e`](https://github.com/LedgerHQ/ledger-live/commit/5d7bd8c68ee33507ff065c05965e1a8c387a4fae), [`87d2349fd8`](https://github.com/LedgerHQ/ledger-live/commit/87d2349fd835e5deb39d1ee8dfcf3539f4195472), [`51c01541df`](https://github.com/LedgerHQ/ledger-live/commit/51c01541df8a414851ea4ef493dc9045272ef949), [`4500a00f21`](https://github.com/LedgerHQ/ledger-live/commit/4500a00f215f73e6c9bbf1d904cb6a4c3d67e678), [`baa687a281`](https://github.com/LedgerHQ/ledger-live/commit/baa687a281b5f75cacd06b05b5438807874fa152)]:
  - @ledgerhq/live-common@29.5.0-next.0
  - @ledgerhq/cryptoassets@9.5.0-next.0
  - @ledgerhq/errors@6.12.5-next.0
  - @ledgerhq/coin-framework@0.3.2-next.0
  - @ledgerhq/hw-transport@6.28.3-next.0
  - @ledgerhq/hw-transport-http@6.27.14-next.0
  - @ledgerhq/hw-transport-node-ble@6.27.14-next.0
  - @ledgerhq/hw-transport-node-hid@6.27.14-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.14-next.0
  - @ledgerhq/hw-app-btc@10.0.2-next.0
  - @ledgerhq/hw-transport-mocker@6.27.14-next.0

## 22.7.1

### Patch Changes

- Updated dependencies [[`9fec3a9b3a`](https://github.com/LedgerHQ/ledger-live/commit/9fec3a9b3a26bfce6ef7fdc4afb83e4f3c04cb69), [`530909c036`](https://github.com/LedgerHQ/ledger-live/commit/530909c0368d03aea1e5d0638adb027fa00ab897), [`d5cf1abc6e`](https://github.com/LedgerHQ/ledger-live/commit/d5cf1abc6eb30d399c83b827452dc4bc61fd2253), [`29badd80d0`](https://github.com/LedgerHQ/ledger-live/commit/29badd80d062f76139ba3a056df22277858021bd), [`992351d66d`](https://github.com/LedgerHQ/ledger-live/commit/992351d66d44d978f069b3aa13f9baf23f9b4482), [`3242a0a794`](https://github.com/LedgerHQ/ledger-live/commit/3242a0a7948c20fb0100ce3cc73e55e338534d32), [`147af2b5e6`](https://github.com/LedgerHQ/ledger-live/commit/147af2b5e674a7020f101a081135c2b187356060), [`be5589dac6`](https://github.com/LedgerHQ/ledger-live/commit/be5589dac675e2c8c1771b135bd0f330a868ed2d), [`c44d61c2b3`](https://github.com/LedgerHQ/ledger-live/commit/c44d61c2b3dc7b4de1041adab676351f8c05b8b9), [`42233141e8`](https://github.com/LedgerHQ/ledger-live/commit/42233141e853f2e9752268e5fa711416d460e0e3), [`5059c9584c`](https://github.com/LedgerHQ/ledger-live/commit/5059c9584ca70208a67e9d49025422d395637878), [`87d08d6d1c`](https://github.com/LedgerHQ/ledger-live/commit/87d08d6d1c6111b7f5fb15f3e1bbe85658686e4a)]:
  - @ledgerhq/live-common@29.4.0
  - @ledgerhq/coin-framework@0.3.1
  - @ledgerhq/cryptoassets@9.4.0

## 22.7.1-next.2

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@29.4.0-next.2

## 22.7.1-next.1

### Patch Changes

- Updated dependencies [[`5059c9584c`](https://github.com/LedgerHQ/ledger-live/commit/5059c9584ca70208a67e9d49025422d395637878)]:
  - @ledgerhq/live-common@29.4.0-next.1

## 22.7.1-next.0

### Patch Changes

- Updated dependencies [[`9fec3a9b3a`](https://github.com/LedgerHQ/ledger-live/commit/9fec3a9b3a26bfce6ef7fdc4afb83e4f3c04cb69), [`530909c036`](https://github.com/LedgerHQ/ledger-live/commit/530909c0368d03aea1e5d0638adb027fa00ab897), [`d5cf1abc6e`](https://github.com/LedgerHQ/ledger-live/commit/d5cf1abc6eb30d399c83b827452dc4bc61fd2253), [`29badd80d0`](https://github.com/LedgerHQ/ledger-live/commit/29badd80d062f76139ba3a056df22277858021bd), [`992351d66d`](https://github.com/LedgerHQ/ledger-live/commit/992351d66d44d978f069b3aa13f9baf23f9b4482), [`3242a0a794`](https://github.com/LedgerHQ/ledger-live/commit/3242a0a7948c20fb0100ce3cc73e55e338534d32), [`147af2b5e6`](https://github.com/LedgerHQ/ledger-live/commit/147af2b5e674a7020f101a081135c2b187356060), [`be5589dac6`](https://github.com/LedgerHQ/ledger-live/commit/be5589dac675e2c8c1771b135bd0f330a868ed2d), [`c44d61c2b3`](https://github.com/LedgerHQ/ledger-live/commit/c44d61c2b3dc7b4de1041adab676351f8c05b8b9), [`42233141e8`](https://github.com/LedgerHQ/ledger-live/commit/42233141e853f2e9752268e5fa711416d460e0e3), [`87d08d6d1c`](https://github.com/LedgerHQ/ledger-live/commit/87d08d6d1c6111b7f5fb15f3e1bbe85658686e4a)]:
  - @ledgerhq/live-common@29.4.0-next.0
  - @ledgerhq/coin-framework@0.3.1-next.0
  - @ledgerhq/cryptoassets@9.4.0-next.0

## 22.7.0

### Minor Changes

- [#3079](https://github.com/LedgerHQ/ledger-live/pull/3079) [`d9732f38ed`](https://github.com/LedgerHQ/ledger-live/commit/d9732f38ed891ce090c98645de55103208015a60) Thanks [@gre](https://github.com/gre)! - Sunset Compound Lending from Ledger Live 'native' codebase

### Patch Changes

- Updated dependencies [[`5fa3f57e08`](https://github.com/LedgerHQ/ledger-live/commit/5fa3f57e08676481d18bdf7fc2406ac1184b1a9a), [`d9732f38ed`](https://github.com/LedgerHQ/ledger-live/commit/d9732f38ed891ce090c98645de55103208015a60), [`5785155282`](https://github.com/LedgerHQ/ledger-live/commit/5785155282d61d0dbdc30f7a66d3243a74fce117), [`a1e3f90e7f`](https://github.com/LedgerHQ/ledger-live/commit/a1e3f90e7f34303ab779e90c0e48642348d79280), [`c59bee8935`](https://github.com/LedgerHQ/ledger-live/commit/c59bee89357bb29097fb97ca67ece845630d982a), [`64ee0b2e03`](https://github.com/LedgerHQ/ledger-live/commit/64ee0b2e032187f5b742f594390a5b30d3850751), [`fb65760778`](https://github.com/LedgerHQ/ledger-live/commit/fb6576077854fb21541350a9f7c1cb528fba6e6d), [`a62be79a56`](https://github.com/LedgerHQ/ledger-live/commit/a62be79a56e7aaaf7712fe006d357e3517f1c4b9), [`282cad03fb`](https://github.com/LedgerHQ/ledger-live/commit/282cad03fb733cc71e767b641c53ee2d469b8295), [`197d28697b`](https://github.com/LedgerHQ/ledger-live/commit/197d28697b173c3f6b2badfe4d1deddeadc912d4), [`0941844a56`](https://github.com/LedgerHQ/ledger-live/commit/0941844a560b5b7b066fb1ffbec1dde7111c083a), [`d4834aad3f`](https://github.com/LedgerHQ/ledger-live/commit/d4834aad3f58d904850be9a3ab40b46260d9f7d4), [`d9732f38ed`](https://github.com/LedgerHQ/ledger-live/commit/d9732f38ed891ce090c98645de55103208015a60)]:
  - @ledgerhq/live-common@29.3.0
  - @ledgerhq/cryptoassets@9.3.0
  - @ledgerhq/coin-framework@0.3.0

## 22.7.0-next.1

### Patch Changes

- Updated dependencies [[`a1e3f90e7f`](https://github.com/LedgerHQ/ledger-live/commit/a1e3f90e7f34303ab779e90c0e48642348d79280)]:
  - @ledgerhq/live-common@29.3.0-next.1

## 22.7.0-next.0

### Minor Changes

- [#3079](https://github.com/LedgerHQ/ledger-live/pull/3079) [`d9732f38ed`](https://github.com/LedgerHQ/ledger-live/commit/d9732f38ed891ce090c98645de55103208015a60) Thanks [@gre](https://github.com/gre)! - Sunset Compound Lending from Ledger Live 'native' codebase

### Patch Changes

- Updated dependencies [[`5fa3f57e08`](https://github.com/LedgerHQ/ledger-live/commit/5fa3f57e08676481d18bdf7fc2406ac1184b1a9a), [`d9732f38ed`](https://github.com/LedgerHQ/ledger-live/commit/d9732f38ed891ce090c98645de55103208015a60), [`5785155282`](https://github.com/LedgerHQ/ledger-live/commit/5785155282d61d0dbdc30f7a66d3243a74fce117), [`c59bee8935`](https://github.com/LedgerHQ/ledger-live/commit/c59bee89357bb29097fb97ca67ece845630d982a), [`64ee0b2e03`](https://github.com/LedgerHQ/ledger-live/commit/64ee0b2e032187f5b742f594390a5b30d3850751), [`fb65760778`](https://github.com/LedgerHQ/ledger-live/commit/fb6576077854fb21541350a9f7c1cb528fba6e6d), [`a62be79a56`](https://github.com/LedgerHQ/ledger-live/commit/a62be79a56e7aaaf7712fe006d357e3517f1c4b9), [`282cad03fb`](https://github.com/LedgerHQ/ledger-live/commit/282cad03fb733cc71e767b641c53ee2d469b8295), [`197d28697b`](https://github.com/LedgerHQ/ledger-live/commit/197d28697b173c3f6b2badfe4d1deddeadc912d4), [`0941844a56`](https://github.com/LedgerHQ/ledger-live/commit/0941844a560b5b7b066fb1ffbec1dde7111c083a), [`d4834aad3f`](https://github.com/LedgerHQ/ledger-live/commit/d4834aad3f58d904850be9a3ab40b46260d9f7d4), [`d9732f38ed`](https://github.com/LedgerHQ/ledger-live/commit/d9732f38ed891ce090c98645de55103208015a60)]:
  - @ledgerhq/live-common@29.3.0-next.0
  - @ledgerhq/cryptoassets@9.3.0-next.0
  - @ledgerhq/coin-framework@0.3.0-next.0

## 22.6.7

### Patch Changes

- Updated dependencies [[`842eaacf83`](https://github.com/LedgerHQ/ledger-live/commit/842eaacf839776956435d12dda8bf6d8b386a784), [`c6a88dd5ab`](https://github.com/LedgerHQ/ledger-live/commit/c6a88dd5abae2b85c3c085ea65e81f89950ecdd4), [`1d0b2d19eb`](https://github.com/LedgerHQ/ledger-live/commit/1d0b2d19ebc5acd058930b842c6d37f8daf2a5a3), [`f364721cd9`](https://github.com/LedgerHQ/ledger-live/commit/f364721cd9c1681141b62cd807796e0a0a45efe4), [`8340016ef0`](https://github.com/LedgerHQ/ledger-live/commit/8340016ef051927a6701c731ac16842b7caf7023), [`3b5bd4f8e3`](https://github.com/LedgerHQ/ledger-live/commit/3b5bd4f8e32333eca7eb8c22d9a6cfda22c766f9), [`c60e8c4b86`](https://github.com/LedgerHQ/ledger-live/commit/c60e8c4b862177e5adab2bc5eeb74313a5c2b2a9), [`ef945b05c0`](https://github.com/LedgerHQ/ledger-live/commit/ef945b05c01a791281687abb28e639e1bcc4e472), [`9d15eb2e2f`](https://github.com/LedgerHQ/ledger-live/commit/9d15eb2e2f6b72bf796b12daa88736b03873857b), [`1d0b2d19eb`](https://github.com/LedgerHQ/ledger-live/commit/1d0b2d19ebc5acd058930b842c6d37f8daf2a5a3), [`0ca89a8067`](https://github.com/LedgerHQ/ledger-live/commit/0ca89a80678743e9462aaf977448e759924a56b2), [`9bb21e26a8`](https://github.com/LedgerHQ/ledger-live/commit/9bb21e26a88a2db7093a3d5cc75ab03d12b25ffb), [`496df9da72`](https://github.com/LedgerHQ/ledger-live/commit/496df9da7216d792d74c7cc22be68fb30415325c), [`9f55124458`](https://github.com/LedgerHQ/ledger-live/commit/9f551244584c20638e1eec2d984dd725fe2688f6), [`81a0cbb8ee`](https://github.com/LedgerHQ/ledger-live/commit/81a0cbb8ee0583bdec083c6de0797510a3bf8be3), [`9b22d499f2`](https://github.com/LedgerHQ/ledger-live/commit/9b22d499f2d0e62d78dbe178808d5fa392d22dda), [`a1e097d391`](https://github.com/LedgerHQ/ledger-live/commit/a1e097d391644fe1a7dd51ca49cf7b51667e4625), [`170f608de3`](https://github.com/LedgerHQ/ledger-live/commit/170f608de311f320795793b4606b063a3ce96def), [`6abe8dd35b`](https://github.com/LedgerHQ/ledger-live/commit/6abe8dd35b103253650f93080b105286afbac4c2), [`fb464093d8`](https://github.com/LedgerHQ/ledger-live/commit/fb464093d85b9e1f73fa761fb7439ee5fb0804d9), [`5fa68510b4`](https://github.com/LedgerHQ/ledger-live/commit/5fa68510b49334cfd80c30793dfe68900f1b9b3b), [`76a2f02f03`](https://github.com/LedgerHQ/ledger-live/commit/76a2f02f03863ab01fcdf136bd436c62fb8f526e), [`ae211bda45`](https://github.com/LedgerHQ/ledger-live/commit/ae211bda45192e1575c6c7656dfad68c7dd93ffe), [`b2a94b9081`](https://github.com/LedgerHQ/ledger-live/commit/b2a94b908103cbee9473319cc3706876d7ce2a19), [`4772a234f7`](https://github.com/LedgerHQ/ledger-live/commit/4772a234f7d35e0c925837eacc194a20bdc49a7c)]:
  - @ledgerhq/live-common@29.2.0
  - @ledgerhq/coin-framework@0.2.1
  - @ledgerhq/errors@6.12.4
  - @ledgerhq/cryptoassets@9.2.0
  - @ledgerhq/hw-transport@6.28.2
  - @ledgerhq/hw-transport-http@6.27.13
  - @ledgerhq/hw-transport-node-ble@6.27.13
  - @ledgerhq/hw-transport-node-hid@6.27.13
  - @ledgerhq/hw-transport-node-speculos@6.27.13
  - @ledgerhq/hw-app-btc@10.0.1
  - @ledgerhq/hw-transport-mocker@6.27.13

## 22.6.7-next.1

### Patch Changes

- Updated dependencies [[`842eaacf83`](https://github.com/LedgerHQ/ledger-live/commit/842eaacf839776956435d12dda8bf6d8b386a784)]:
  - @ledgerhq/live-common@29.2.0-next.1

## 22.6.7-next.0

### Patch Changes

- Updated dependencies [[`c6a88dd5ab`](https://github.com/LedgerHQ/ledger-live/commit/c6a88dd5abae2b85c3c085ea65e81f89950ecdd4), [`1d0b2d19eb`](https://github.com/LedgerHQ/ledger-live/commit/1d0b2d19ebc5acd058930b842c6d37f8daf2a5a3), [`f364721cd9`](https://github.com/LedgerHQ/ledger-live/commit/f364721cd9c1681141b62cd807796e0a0a45efe4), [`8340016ef0`](https://github.com/LedgerHQ/ledger-live/commit/8340016ef051927a6701c731ac16842b7caf7023), [`3b5bd4f8e3`](https://github.com/LedgerHQ/ledger-live/commit/3b5bd4f8e32333eca7eb8c22d9a6cfda22c766f9), [`c60e8c4b86`](https://github.com/LedgerHQ/ledger-live/commit/c60e8c4b862177e5adab2bc5eeb74313a5c2b2a9), [`ef945b05c0`](https://github.com/LedgerHQ/ledger-live/commit/ef945b05c01a791281687abb28e639e1bcc4e472), [`9d15eb2e2f`](https://github.com/LedgerHQ/ledger-live/commit/9d15eb2e2f6b72bf796b12daa88736b03873857b), [`1d0b2d19eb`](https://github.com/LedgerHQ/ledger-live/commit/1d0b2d19ebc5acd058930b842c6d37f8daf2a5a3), [`0ca89a8067`](https://github.com/LedgerHQ/ledger-live/commit/0ca89a80678743e9462aaf977448e759924a56b2), [`9bb21e26a8`](https://github.com/LedgerHQ/ledger-live/commit/9bb21e26a88a2db7093a3d5cc75ab03d12b25ffb), [`496df9da72`](https://github.com/LedgerHQ/ledger-live/commit/496df9da7216d792d74c7cc22be68fb30415325c), [`9f55124458`](https://github.com/LedgerHQ/ledger-live/commit/9f551244584c20638e1eec2d984dd725fe2688f6), [`81a0cbb8ee`](https://github.com/LedgerHQ/ledger-live/commit/81a0cbb8ee0583bdec083c6de0797510a3bf8be3), [`9b22d499f2`](https://github.com/LedgerHQ/ledger-live/commit/9b22d499f2d0e62d78dbe178808d5fa392d22dda), [`a1e097d391`](https://github.com/LedgerHQ/ledger-live/commit/a1e097d391644fe1a7dd51ca49cf7b51667e4625), [`170f608de3`](https://github.com/LedgerHQ/ledger-live/commit/170f608de311f320795793b4606b063a3ce96def), [`6abe8dd35b`](https://github.com/LedgerHQ/ledger-live/commit/6abe8dd35b103253650f93080b105286afbac4c2), [`fb464093d8`](https://github.com/LedgerHQ/ledger-live/commit/fb464093d85b9e1f73fa761fb7439ee5fb0804d9), [`5fa68510b4`](https://github.com/LedgerHQ/ledger-live/commit/5fa68510b49334cfd80c30793dfe68900f1b9b3b), [`76a2f02f03`](https://github.com/LedgerHQ/ledger-live/commit/76a2f02f03863ab01fcdf136bd436c62fb8f526e), [`ae211bda45`](https://github.com/LedgerHQ/ledger-live/commit/ae211bda45192e1575c6c7656dfad68c7dd93ffe), [`b2a94b9081`](https://github.com/LedgerHQ/ledger-live/commit/b2a94b908103cbee9473319cc3706876d7ce2a19), [`4772a234f7`](https://github.com/LedgerHQ/ledger-live/commit/4772a234f7d35e0c925837eacc194a20bdc49a7c)]:
  - @ledgerhq/coin-framework@0.2.1-next.0
  - @ledgerhq/errors@6.12.4-next.0
  - @ledgerhq/cryptoassets@9.2.0-next.0
  - @ledgerhq/live-common@29.2.0-next.0
  - @ledgerhq/hw-transport@6.28.2-next.0
  - @ledgerhq/hw-transport-http@6.27.13-next.0
  - @ledgerhq/hw-transport-node-ble@6.27.13-next.0
  - @ledgerhq/hw-transport-node-hid@6.27.13-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.13-next.0
  - @ledgerhq/hw-app-btc@10.0.1-next.0
  - @ledgerhq/hw-transport-mocker@6.27.13-next.0

## 22.6.6

### Patch Changes

- [#2791](https://github.com/LedgerHQ/ledger-live/pull/2791) [`9002e51d8b`](https://github.com/LedgerHQ/ledger-live/commit/9002e51d8b01b178f7d0ec12852bc6a768f6fd4e) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Blacklist Security Key app from version check

- Updated dependencies [[`3460d0908b`](https://github.com/LedgerHQ/ledger-live/commit/3460d0908b6a4fb0f1ff280545cc37644166b06b), [`47e3ef84ba`](https://github.com/LedgerHQ/ledger-live/commit/47e3ef84bad0e93d6f1d8f921b3fb2aa04240065), [`897f42df13`](https://github.com/LedgerHQ/ledger-live/commit/897f42df1389768f66882172341be600e09f1791), [`9ec0582d2a`](https://github.com/LedgerHQ/ledger-live/commit/9ec0582d2ae8ee57884531d4d104a3724735a2c2), [`b947934b68`](https://github.com/LedgerHQ/ledger-live/commit/b947934b68f351f81e3f7f8031bfe52743948fe6), [`24bc5674d2`](https://github.com/LedgerHQ/ledger-live/commit/24bc5674d28009a032bb421e20f7a480b0557e29), [`bc3af8a918`](https://github.com/LedgerHQ/ledger-live/commit/bc3af8a91819eaa653f76db6333508111963fdba), [`900ef4f528`](https://github.com/LedgerHQ/ledger-live/commit/900ef4f528c3b2359d666fbb76073978d5f9c840), [`fbc7c4c83a`](https://github.com/LedgerHQ/ledger-live/commit/fbc7c4c83a4e84618cf18a4c8d108396fa7cda7a), [`ab0781e7cb`](https://github.com/LedgerHQ/ledger-live/commit/ab0781e7cb0ab191519a4860ccc6c7f6a472b500), [`a87ee27900`](https://github.com/LedgerHQ/ledger-live/commit/a87ee27900ec062bccc0e4cf453b4d2112f83ada), [`ebe618881d`](https://github.com/LedgerHQ/ledger-live/commit/ebe618881d9e9c7159d7a9fe135e18b0cb2fde8f), [`297d6cc4a0`](https://github.com/LedgerHQ/ledger-live/commit/297d6cc4a03444fce5272f192accc96fb7f26cef), [`ef5835035b`](https://github.com/LedgerHQ/ledger-live/commit/ef5835035b93bb06f9cfbbb9da74ec2b2a53c5a7), [`f2968d5706`](https://github.com/LedgerHQ/ledger-live/commit/f2968d57065bd0b5219f97029887a2f61390ac27), [`684c10d10a`](https://github.com/LedgerHQ/ledger-live/commit/684c10d10a51337e22b838e3ae6465721477c4de), [`0f99b5dc44`](https://github.com/LedgerHQ/ledger-live/commit/0f99b5dc44f0e4f44e4199e80d40fb1bc5a88853), [`0207d76b15`](https://github.com/LedgerHQ/ledger-live/commit/0207d76b15dca7128aea720b1663c58a12f42967), [`7daaa8f750`](https://github.com/LedgerHQ/ledger-live/commit/7daaa8f75029927459b8132befcd6a20b3ef8e17), [`01a33f58ba`](https://github.com/LedgerHQ/ledger-live/commit/01a33f58ba6c5518045546e8f38be3f05fc2a935), [`f7f38ae801`](https://github.com/LedgerHQ/ledger-live/commit/f7f38ae801c7f78c04cf776e7fdab63d7cfb77d4), [`16cad60fb0`](https://github.com/LedgerHQ/ledger-live/commit/16cad60fb0d21752fae5e3db6d0100ef5396e0a4)]:
  - @ledgerhq/live-common@29.1.0
  - @ledgerhq/cryptoassets@9.1.0

## 22.6.6-next.0

### Patch Changes

- [#2791](https://github.com/LedgerHQ/ledger-live/pull/2791) [`9002e51d8b`](https://github.com/LedgerHQ/ledger-live/commit/9002e51d8b01b178f7d0ec12852bc6a768f6fd4e) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Blacklist Security Key app from version check

- Updated dependencies [[`3460d0908b`](https://github.com/LedgerHQ/ledger-live/commit/3460d0908b6a4fb0f1ff280545cc37644166b06b), [`47e3ef84ba`](https://github.com/LedgerHQ/ledger-live/commit/47e3ef84bad0e93d6f1d8f921b3fb2aa04240065), [`897f42df13`](https://github.com/LedgerHQ/ledger-live/commit/897f42df1389768f66882172341be600e09f1791), [`9ec0582d2a`](https://github.com/LedgerHQ/ledger-live/commit/9ec0582d2ae8ee57884531d4d104a3724735a2c2), [`b947934b68`](https://github.com/LedgerHQ/ledger-live/commit/b947934b68f351f81e3f7f8031bfe52743948fe6), [`24bc5674d2`](https://github.com/LedgerHQ/ledger-live/commit/24bc5674d28009a032bb421e20f7a480b0557e29), [`bc3af8a918`](https://github.com/LedgerHQ/ledger-live/commit/bc3af8a91819eaa653f76db6333508111963fdba), [`900ef4f528`](https://github.com/LedgerHQ/ledger-live/commit/900ef4f528c3b2359d666fbb76073978d5f9c840), [`fbc7c4c83a`](https://github.com/LedgerHQ/ledger-live/commit/fbc7c4c83a4e84618cf18a4c8d108396fa7cda7a), [`ab0781e7cb`](https://github.com/LedgerHQ/ledger-live/commit/ab0781e7cb0ab191519a4860ccc6c7f6a472b500), [`a87ee27900`](https://github.com/LedgerHQ/ledger-live/commit/a87ee27900ec062bccc0e4cf453b4d2112f83ada), [`ebe618881d`](https://github.com/LedgerHQ/ledger-live/commit/ebe618881d9e9c7159d7a9fe135e18b0cb2fde8f), [`297d6cc4a0`](https://github.com/LedgerHQ/ledger-live/commit/297d6cc4a03444fce5272f192accc96fb7f26cef), [`ef5835035b`](https://github.com/LedgerHQ/ledger-live/commit/ef5835035b93bb06f9cfbbb9da74ec2b2a53c5a7), [`f2968d5706`](https://github.com/LedgerHQ/ledger-live/commit/f2968d57065bd0b5219f97029887a2f61390ac27), [`684c10d10a`](https://github.com/LedgerHQ/ledger-live/commit/684c10d10a51337e22b838e3ae6465721477c4de), [`0f99b5dc44`](https://github.com/LedgerHQ/ledger-live/commit/0f99b5dc44f0e4f44e4199e80d40fb1bc5a88853), [`0207d76b15`](https://github.com/LedgerHQ/ledger-live/commit/0207d76b15dca7128aea720b1663c58a12f42967), [`7daaa8f750`](https://github.com/LedgerHQ/ledger-live/commit/7daaa8f75029927459b8132befcd6a20b3ef8e17), [`01a33f58ba`](https://github.com/LedgerHQ/ledger-live/commit/01a33f58ba6c5518045546e8f38be3f05fc2a935), [`f7f38ae801`](https://github.com/LedgerHQ/ledger-live/commit/f7f38ae801c7f78c04cf776e7fdab63d7cfb77d4), [`16cad60fb0`](https://github.com/LedgerHQ/ledger-live/commit/16cad60fb0d21752fae5e3db6d0100ef5396e0a4)]:
  - @ledgerhq/live-common@29.1.0-next.0
  - @ledgerhq/cryptoassets@9.1.0-next.0

## 22.6.5

### Patch Changes

- [#2548](https://github.com/LedgerHQ/ledger-live/pull/2548) [`cec9e0f33d`](https://github.com/LedgerHQ/ledger-live/commit/cec9e0f33d5bc058c0e4b3a2680fc8791d5b61b1) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - cosmos_testnet cleanup

- [#2580](https://github.com/LedgerHQ/ledger-live/pull/2580) [`a5a377ed2c`](https://github.com/LedgerHQ/ledger-live/commit/a5a377ed2c4afd6cfe882a1d39714a2cf8efe536) Thanks [@gre](https://github.com/gre)! - 'botTransfer' command has been fixed and filtering/percentage features added

- Updated dependencies [[`109f456ff9`](https://github.com/LedgerHQ/ledger-live/commit/109f456ff9e715de8916d5dd4e096fd085c65319), [`80e3090edc`](https://github.com/LedgerHQ/ledger-live/commit/80e3090edc91a4e8c2f95891ce2eea48ddb1d319), [`b5d8805bef`](https://github.com/LedgerHQ/ledger-live/commit/b5d8805bef1b35c85b2a8f0a7d1487345c65ec67), [`a1a2220dfc`](https://github.com/LedgerHQ/ledger-live/commit/a1a2220dfce313ade4c0f055ff4c5b9427fa285d), [`86ab7eb1d4`](https://github.com/LedgerHQ/ledger-live/commit/86ab7eb1d4d234051bb30930787279ebcdae6ea6), [`3d29b9e7ff`](https://github.com/LedgerHQ/ledger-live/commit/3d29b9e7ff1536b4e5624437b0507c2556e371f3), [`0725151a34`](https://github.com/LedgerHQ/ledger-live/commit/0725151a348608bec1f8338b57772f12a23cb471), [`cec9e0f33d`](https://github.com/LedgerHQ/ledger-live/commit/cec9e0f33d5bc058c0e4b3a2680fc8791d5b61b1), [`72cc12fcdb`](https://github.com/LedgerHQ/ledger-live/commit/72cc12fcdbd452c78fab00a064a24de56db2d38c), [`52d3a03dfc`](https://github.com/LedgerHQ/ledger-live/commit/52d3a03dfcbf8a4c8d3ef2fca49025f56ffc7a09), [`cfc5d1ec57`](https://github.com/LedgerHQ/ledger-live/commit/cfc5d1ec570241e0fdcfd3a253957cdeb771f43c), [`7423309c87`](https://github.com/LedgerHQ/ledger-live/commit/7423309c87b95020354b147305ff40303d42c8a3), [`b003234bd5`](https://github.com/LedgerHQ/ledger-live/commit/b003234bd5db564b4ddf25139e41ea21c5e852fa), [`0469c82884`](https://github.com/LedgerHQ/ledger-live/commit/0469c8288405dc9a47927e19ccf8ddafb38783de), [`62af25493e`](https://github.com/LedgerHQ/ledger-live/commit/62af25493e2becf897d517af42542db208b971c7), [`467822aaf6`](https://github.com/LedgerHQ/ledger-live/commit/467822aaf680df334531c1489e5a845fecad492a), [`7e9dccf1bb`](https://github.com/LedgerHQ/ledger-live/commit/7e9dccf1bb857226ed95a0e3f9c7e4d0b4429857), [`c7a709f224`](https://github.com/LedgerHQ/ledger-live/commit/c7a709f2246fa416513c39ffa9ef05a09488ecec), [`9aaa3e75e7`](https://github.com/LedgerHQ/ledger-live/commit/9aaa3e75e7e3d4b0cca2e177b409fc56e38efe1a), [`4d8bcb5f83`](https://github.com/LedgerHQ/ledger-live/commit/4d8bcb5f8338987252780735ecaf5a51eea8cbee), [`5c46dfade6`](https://github.com/LedgerHQ/ledger-live/commit/5c46dfade659a4162e032e16b3a5b603dbc8bd66), [`6c075924c0`](https://github.com/LedgerHQ/ledger-live/commit/6c075924c0a0a589ff46cc6681618e6519ef974b), [`cbc5d3ddc5`](https://github.com/LedgerHQ/ledger-live/commit/cbc5d3ddc5aca2ede06e0839388829d5b0eb84bf), [`76e381ed73`](https://github.com/LedgerHQ/ledger-live/commit/76e381ed731de5e33a78aad6c3a2a956fb170be0), [`a767918b3b`](https://github.com/LedgerHQ/ledger-live/commit/a767918b3be17319f23e2bfa118135a3924d2ee0), [`6003fbc140`](https://github.com/LedgerHQ/ledger-live/commit/6003fbc1408243332ee2e4956322e1a53d70de27), [`725000b4ed`](https://github.com/LedgerHQ/ledger-live/commit/725000b4ed37a2669f3a0cd70ca2b5d0b1d4825e), [`4d8bcb5f83`](https://github.com/LedgerHQ/ledger-live/commit/4d8bcb5f8338987252780735ecaf5a51eea8cbee), [`2aa9b47db4`](https://github.com/LedgerHQ/ledger-live/commit/2aa9b47db42fa70050fa09d7479988bdd1bebaa9), [`0725151a34`](https://github.com/LedgerHQ/ledger-live/commit/0725151a348608bec1f8338b57772f12a23cb471), [`8c4cc6a69f`](https://github.com/LedgerHQ/ledger-live/commit/8c4cc6a69fed65b5ced7fe77f302aa1faf880149)]:
  - @ledgerhq/live-common@29.0.0
  - @ledgerhq/cryptoassets@9.0.0
  - @ledgerhq/hw-app-btc@10.0.0
  - @ledgerhq/hw-transport@6.28.1
  - @ledgerhq/hw-transport-node-ble@6.27.12
  - @ledgerhq/hw-transport-node-hid@6.27.12
  - @ledgerhq/hw-transport-http@6.27.12
  - @ledgerhq/hw-transport-mocker@6.27.12
  - @ledgerhq/hw-transport-node-speculos@6.27.12

## 22.6.5-next.4

### Patch Changes

- Updated dependencies [[`8c4cc6a69f`](https://github.com/LedgerHQ/ledger-live/commit/8c4cc6a69fed65b5ced7fe77f302aa1faf880149)]:
  - @ledgerhq/live-common@29.0.0-next.4

## 22.6.5-next.3

### Patch Changes

- Updated dependencies [[`b4aed3961f`](https://github.com/LedgerHQ/ledger-live/commit/b4aed3961f26ee560bb8f57f60c10112ee70bc28)]:
  - @ledgerhq/live-common@29.0.0-next.3

## 22.6.5-next.2

### Patch Changes

- Updated dependencies [[`52d3a03dfc`](https://github.com/LedgerHQ/ledger-live/commit/52d3a03dfcbf8a4c8d3ef2fca49025f56ffc7a09)]:
  - @ledgerhq/live-common@29.0.0-next.2

## 22.6.5-next.1

### Patch Changes

- Updated dependencies [[`80e3090edc`](https://github.com/LedgerHQ/ledger-live/commit/80e3090edc91a4e8c2f95891ce2eea48ddb1d319)]:
  - @ledgerhq/live-common@29.0.0-next.1

## 22.6.5-next.0

### Patch Changes

- [#2548](https://github.com/LedgerHQ/ledger-live/pull/2548) [`cec9e0f33d`](https://github.com/LedgerHQ/ledger-live/commit/cec9e0f33d5bc058c0e4b3a2680fc8791d5b61b1) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - cosmos_testnet cleanup

- [#2580](https://github.com/LedgerHQ/ledger-live/pull/2580) [`a5a377ed2c`](https://github.com/LedgerHQ/ledger-live/commit/a5a377ed2c4afd6cfe882a1d39714a2cf8efe536) Thanks [@gre](https://github.com/gre)! - 'botTransfer' command has been fixed and filtering/percentage features added

- Updated dependencies [[`109f456ff9`](https://github.com/LedgerHQ/ledger-live/commit/109f456ff9e715de8916d5dd4e096fd085c65319), [`b5d8805bef`](https://github.com/LedgerHQ/ledger-live/commit/b5d8805bef1b35c85b2a8f0a7d1487345c65ec67), [`a1a2220dfc`](https://github.com/LedgerHQ/ledger-live/commit/a1a2220dfce313ade4c0f055ff4c5b9427fa285d), [`86ab7eb1d4`](https://github.com/LedgerHQ/ledger-live/commit/86ab7eb1d4d234051bb30930787279ebcdae6ea6), [`3d29b9e7ff`](https://github.com/LedgerHQ/ledger-live/commit/3d29b9e7ff1536b4e5624437b0507c2556e371f3), [`0725151a34`](https://github.com/LedgerHQ/ledger-live/commit/0725151a348608bec1f8338b57772f12a23cb471), [`cec9e0f33d`](https://github.com/LedgerHQ/ledger-live/commit/cec9e0f33d5bc058c0e4b3a2680fc8791d5b61b1), [`72cc12fcdb`](https://github.com/LedgerHQ/ledger-live/commit/72cc12fcdbd452c78fab00a064a24de56db2d38c), [`cfc5d1ec57`](https://github.com/LedgerHQ/ledger-live/commit/cfc5d1ec570241e0fdcfd3a253957cdeb771f43c), [`7423309c87`](https://github.com/LedgerHQ/ledger-live/commit/7423309c87b95020354b147305ff40303d42c8a3), [`b003234bd5`](https://github.com/LedgerHQ/ledger-live/commit/b003234bd5db564b4ddf25139e41ea21c5e852fa), [`0469c82884`](https://github.com/LedgerHQ/ledger-live/commit/0469c8288405dc9a47927e19ccf8ddafb38783de), [`62af25493e`](https://github.com/LedgerHQ/ledger-live/commit/62af25493e2becf897d517af42542db208b971c7), [`467822aaf6`](https://github.com/LedgerHQ/ledger-live/commit/467822aaf680df334531c1489e5a845fecad492a), [`7e9dccf1bb`](https://github.com/LedgerHQ/ledger-live/commit/7e9dccf1bb857226ed95a0e3f9c7e4d0b4429857), [`c7a709f224`](https://github.com/LedgerHQ/ledger-live/commit/c7a709f2246fa416513c39ffa9ef05a09488ecec), [`9aaa3e75e7`](https://github.com/LedgerHQ/ledger-live/commit/9aaa3e75e7e3d4b0cca2e177b409fc56e38efe1a), [`4d8bcb5f83`](https://github.com/LedgerHQ/ledger-live/commit/4d8bcb5f8338987252780735ecaf5a51eea8cbee), [`b4aed3961f`](https://github.com/LedgerHQ/ledger-live/commit/b4aed3961f26ee560bb8f57f60c10112ee70bc28), [`5c46dfade6`](https://github.com/LedgerHQ/ledger-live/commit/5c46dfade659a4162e032e16b3a5b603dbc8bd66), [`6c075924c0`](https://github.com/LedgerHQ/ledger-live/commit/6c075924c0a0a589ff46cc6681618e6519ef974b), [`cbc5d3ddc5`](https://github.com/LedgerHQ/ledger-live/commit/cbc5d3ddc5aca2ede06e0839388829d5b0eb84bf), [`76e381ed73`](https://github.com/LedgerHQ/ledger-live/commit/76e381ed731de5e33a78aad6c3a2a956fb170be0), [`a767918b3b`](https://github.com/LedgerHQ/ledger-live/commit/a767918b3be17319f23e2bfa118135a3924d2ee0), [`6003fbc140`](https://github.com/LedgerHQ/ledger-live/commit/6003fbc1408243332ee2e4956322e1a53d70de27), [`725000b4ed`](https://github.com/LedgerHQ/ledger-live/commit/725000b4ed37a2669f3a0cd70ca2b5d0b1d4825e), [`4d8bcb5f83`](https://github.com/LedgerHQ/ledger-live/commit/4d8bcb5f8338987252780735ecaf5a51eea8cbee), [`2aa9b47db4`](https://github.com/LedgerHQ/ledger-live/commit/2aa9b47db42fa70050fa09d7479988bdd1bebaa9), [`0725151a34`](https://github.com/LedgerHQ/ledger-live/commit/0725151a348608bec1f8338b57772f12a23cb471)]:
  - @ledgerhq/live-common@29.0.0-next.0
  - @ledgerhq/cryptoassets@9.0.0-next.0
  - @ledgerhq/hw-app-btc@10.0.0-next.0
  - @ledgerhq/hw-transport@6.28.1-next.0
  - @ledgerhq/hw-transport-node-ble@6.27.12-next.0
  - @ledgerhq/hw-transport-node-hid@6.27.12-next.0
  - @ledgerhq/hw-transport-http@6.27.12-next.0
  - @ledgerhq/hw-transport-mocker@6.27.12-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.12-next.0

## 22.6.4

### Patch Changes

- Updated dependencies [[`090c6c8d8f`](https://github.com/LedgerHQ/ledger-live/commit/090c6c8d8f15bc13995851abc9eb35c649f6b678)]:
  - @ledgerhq/live-common@28.0.2

## 22.6.4-hotfix.0

### Patch Changes

- Updated dependencies [[`090c6c8d8f`](https://github.com/LedgerHQ/ledger-live/commit/090c6c8d8f15bc13995851abc9eb35c649f6b678)]:
  - @ledgerhq/live-common@28.0.2-hotfix.0

## 22.6.3

### Patch Changes

- Updated dependencies [[`61c7aafb21`](https://github.com/LedgerHQ/ledger-live/commit/61c7aafb216099692fad27621fff167f1ba4c840), [`31f13e8ac2`](https://github.com/LedgerHQ/ledger-live/commit/31f13e8ac2272c54621d2b83f8b17ab5350ce918)]:
  - @ledgerhq/live-common@28.0.1

## 22.6.3-hotfix.1

### Patch Changes

- Updated dependencies [[`61c7aafb21`](https://github.com/LedgerHQ/ledger-live/commit/61c7aafb216099692fad27621fff167f1ba4c840)]:
  - @ledgerhq/live-common@28.0.1-hotfix.1

## 22.6.3-hotfix.0

### Patch Changes

- Updated dependencies [[`31f13e8ac2`](https://github.com/LedgerHQ/ledger-live/commit/31f13e8ac2272c54621d2b83f8b17ab5350ce918)]:
  - @ledgerhq/live-common@28.0.1-hotfix.0

## 22.6.2

### Patch Changes

- Updated dependencies [[`ebdb20d071`](https://github.com/LedgerHQ/ledger-live/commit/ebdb20d071290c6d4565d64bc77e26ce8191edea), [`6214ac0412`](https://github.com/LedgerHQ/ledger-live/commit/6214ac0412f5d67ffc9ed965e21ffda44c30ae21), [`36c1a33638`](https://github.com/LedgerHQ/ledger-live/commit/36c1a33638dd889173f1caf263563c27aebc521f), [`3ca4c9763d`](https://github.com/LedgerHQ/ledger-live/commit/3ca4c9763dd7c7ab7891efbd3cb6785cda2d038f), [`0e7ff249f7`](https://github.com/LedgerHQ/ledger-live/commit/0e7ff249f7e1160ff3888e52767ef91151efbedd), [`0e3dadacce`](https://github.com/LedgerHQ/ledger-live/commit/0e3dadacce1292b85ae028289301b7a84631a8fa), [`8ff8e433ed`](https://github.com/LedgerHQ/ledger-live/commit/8ff8e433edb6e95693dc21f83c958f6c4a65f056), [`61ff754c0c`](https://github.com/LedgerHQ/ledger-live/commit/61ff754c0cfcacb564e6c6e0497c23cee17f1eb8), [`db03ee7a28`](https://github.com/LedgerHQ/ledger-live/commit/db03ee7a28e832582111eb5ab31ce73694cfb957), [`dcfeef0a2c`](https://github.com/LedgerHQ/ledger-live/commit/dcfeef0a2c0f8c3d344d2943b3d21654f15ae184), [`0839f0886f`](https://github.com/LedgerHQ/ledger-live/commit/0839f0886f3acd544ae21d3c9c3c7a607662303b), [`de69b7f2ba`](https://github.com/LedgerHQ/ledger-live/commit/de69b7f2baa614726167e97e4fb4bbe741aafbfb), [`c2779b1cab`](https://github.com/LedgerHQ/ledger-live/commit/c2779b1cab18a1d5747ca955f5ceee86db920f57), [`c2779b1cab`](https://github.com/LedgerHQ/ledger-live/commit/c2779b1cab18a1d5747ca955f5ceee86db920f57), [`7eb8b1a39b`](https://github.com/LedgerHQ/ledger-live/commit/7eb8b1a39b36a5b336d95f89a92edf7ee22bcd26), [`dcfeef0a2c`](https://github.com/LedgerHQ/ledger-live/commit/dcfeef0a2c0f8c3d344d2943b3d21654f15ae184)]:
  - @ledgerhq/live-common@28.0.0
  - @ledgerhq/cryptoassets@8.0.0
  - @ledgerhq/hw-transport@6.28.0
  - @ledgerhq/hw-app-btc@9.1.3
  - @ledgerhq/hw-transport-http@6.27.11
  - @ledgerhq/hw-transport-mocker@6.27.11
  - @ledgerhq/hw-transport-node-ble@6.27.11
  - @ledgerhq/hw-transport-node-hid@6.27.11
  - @ledgerhq/hw-transport-node-speculos@6.27.11

## 22.6.2-next.1

### Patch Changes

- Updated dependencies [[`0e3dadacce`](https://github.com/LedgerHQ/ledger-live/commit/0e3dadacce1292b85ae028289301b7a84631a8fa)]:
  - @ledgerhq/live-common@28.0.0-next.1

## 22.6.2-next.0

### Patch Changes

- Updated dependencies [[`ebdb20d071`](https://github.com/LedgerHQ/ledger-live/commit/ebdb20d071290c6d4565d64bc77e26ce8191edea), [`6214ac0412`](https://github.com/LedgerHQ/ledger-live/commit/6214ac0412f5d67ffc9ed965e21ffda44c30ae21), [`36c1a33638`](https://github.com/LedgerHQ/ledger-live/commit/36c1a33638dd889173f1caf263563c27aebc521f), [`3ca4c9763d`](https://github.com/LedgerHQ/ledger-live/commit/3ca4c9763dd7c7ab7891efbd3cb6785cda2d038f), [`0e7ff249f7`](https://github.com/LedgerHQ/ledger-live/commit/0e7ff249f7e1160ff3888e52767ef91151efbedd), [`8ff8e433ed`](https://github.com/LedgerHQ/ledger-live/commit/8ff8e433edb6e95693dc21f83c958f6c4a65f056), [`61ff754c0c`](https://github.com/LedgerHQ/ledger-live/commit/61ff754c0cfcacb564e6c6e0497c23cee17f1eb8), [`db03ee7a28`](https://github.com/LedgerHQ/ledger-live/commit/db03ee7a28e832582111eb5ab31ce73694cfb957), [`dcfeef0a2c`](https://github.com/LedgerHQ/ledger-live/commit/dcfeef0a2c0f8c3d344d2943b3d21654f15ae184), [`0839f0886f`](https://github.com/LedgerHQ/ledger-live/commit/0839f0886f3acd544ae21d3c9c3c7a607662303b), [`de69b7f2ba`](https://github.com/LedgerHQ/ledger-live/commit/de69b7f2baa614726167e97e4fb4bbe741aafbfb), [`c2779b1cab`](https://github.com/LedgerHQ/ledger-live/commit/c2779b1cab18a1d5747ca955f5ceee86db920f57), [`c2779b1cab`](https://github.com/LedgerHQ/ledger-live/commit/c2779b1cab18a1d5747ca955f5ceee86db920f57), [`7eb8b1a39b`](https://github.com/LedgerHQ/ledger-live/commit/7eb8b1a39b36a5b336d95f89a92edf7ee22bcd26), [`dcfeef0a2c`](https://github.com/LedgerHQ/ledger-live/commit/dcfeef0a2c0f8c3d344d2943b3d21654f15ae184)]:
  - @ledgerhq/live-common@28.0.0-next.0
  - @ledgerhq/cryptoassets@8.0.0-next.0
  - @ledgerhq/hw-transport@6.28.0-next.0
  - @ledgerhq/hw-app-btc@9.1.3-next.0
  - @ledgerhq/hw-transport-http@6.27.11-next.0
  - @ledgerhq/hw-transport-mocker@6.27.11-next.0
  - @ledgerhq/hw-transport-node-ble@6.27.11-next.0
  - @ledgerhq/hw-transport-node-hid@6.27.11-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.11-next.0

## 22.6.1

### Patch Changes

- Updated dependencies [[`dcad1bcbdc`](https://github.com/LedgerHQ/ledger-live/commit/dcad1bcbdc6f1674a175f2bca12c85edbdd179e1), [`efc2b4d4fb`](https://github.com/LedgerHQ/ledger-live/commit/efc2b4d4fb2acb6c63a4c55b5e51e251712dfc5c), [`97c9cb43a4`](https://github.com/LedgerHQ/ledger-live/commit/97c9cb43a4a4dc2c6369d76f12b4a0c48fe3990a), [`75fbe7f3b1`](https://github.com/LedgerHQ/ledger-live/commit/75fbe7f3b1058e6eb6906c0d5fac3fb10eefc3eb), [`befe0e224a`](https://github.com/LedgerHQ/ledger-live/commit/befe0e224a93fbc3598f4d03b769b9d9e1af721e), [`ea6e557506`](https://github.com/LedgerHQ/ledger-live/commit/ea6e5575069f7ce4c9f9ce4983671aa465740fc5), [`789bfc0fad`](https://github.com/LedgerHQ/ledger-live/commit/789bfc0fadd53c8209a2ad8aa8df6bbf9a2891ab), [`4e9378d63b`](https://github.com/LedgerHQ/ledger-live/commit/4e9378d63b048fef131ee574220c428456ef42d4), [`d26fbee27a`](https://github.com/LedgerHQ/ledger-live/commit/d26fbee27aacd05e2cc5ee0ba3c49492a72f5659), [`7fef128ffb`](https://github.com/LedgerHQ/ledger-live/commit/7fef128ffba226dd675935c7464db60894f327bb), [`16195a130e`](https://github.com/LedgerHQ/ledger-live/commit/16195a130e24b06528b6c2c2551e58be253f94f1), [`7af03d772a`](https://github.com/LedgerHQ/ledger-live/commit/7af03d772a16822024e456224951c48c5e09e45d), [`f3fd3134a3`](https://github.com/LedgerHQ/ledger-live/commit/f3fd3134a3852f9d872b1be268e60beae8ea3496), [`b7df09bbc9`](https://github.com/LedgerHQ/ledger-live/commit/b7df09bbc9a07602b326fbbe434c13ec61f276e7), [`5b4aa38421`](https://github.com/LedgerHQ/ledger-live/commit/5b4aa38421380512fb96ef66e1f3149ce8bfd018), [`d0919b03f4`](https://github.com/LedgerHQ/ledger-live/commit/d0919b03f49d2cfd13e0f476f7b94c54e34be872), [`96458c4f37`](https://github.com/LedgerHQ/ledger-live/commit/96458c4f3777a079e01069005217457f3e6033e2), [`63e63e5fc5`](https://github.com/LedgerHQ/ledger-live/commit/63e63e5fc562c029f1372f664d1a45dc1fda5047), [`192b897ce4`](https://github.com/LedgerHQ/ledger-live/commit/192b897ce45635f0d91021a1d4973035f6d9bf72), [`9bba7fd8bd`](https://github.com/LedgerHQ/ledger-live/commit/9bba7fd8bd9b55be569fb57367e7debc442af789), [`88d6de464b`](https://github.com/LedgerHQ/ledger-live/commit/88d6de464b475b049aaf1724b28d8a592bfd4676), [`0b827ad97a`](https://github.com/LedgerHQ/ledger-live/commit/0b827ad97afb5e12ae0c8d0d1cf3952a6d02ec7c), [`a56ffa948d`](https://github.com/LedgerHQ/ledger-live/commit/a56ffa948defb16ea9f2968d96d4b896f9839145), [`a56ffa948d`](https://github.com/LedgerHQ/ledger-live/commit/a56ffa948defb16ea9f2968d96d4b896f9839145)]:
  - @ledgerhq/live-common@27.12.0
  - @ledgerhq/cryptoassets@7.3.0

## 22.6.1-next.0

### Patch Changes

- Updated dependencies [[`dcad1bcbdc`](https://github.com/LedgerHQ/ledger-live/commit/dcad1bcbdc6f1674a175f2bca12c85edbdd179e1), [`efc2b4d4fb`](https://github.com/LedgerHQ/ledger-live/commit/efc2b4d4fb2acb6c63a4c55b5e51e251712dfc5c), [`97c9cb43a4`](https://github.com/LedgerHQ/ledger-live/commit/97c9cb43a4a4dc2c6369d76f12b4a0c48fe3990a), [`75fbe7f3b1`](https://github.com/LedgerHQ/ledger-live/commit/75fbe7f3b1058e6eb6906c0d5fac3fb10eefc3eb), [`befe0e224a`](https://github.com/LedgerHQ/ledger-live/commit/befe0e224a93fbc3598f4d03b769b9d9e1af721e), [`ea6e557506`](https://github.com/LedgerHQ/ledger-live/commit/ea6e5575069f7ce4c9f9ce4983671aa465740fc5), [`789bfc0fad`](https://github.com/LedgerHQ/ledger-live/commit/789bfc0fadd53c8209a2ad8aa8df6bbf9a2891ab), [`4e9378d63b`](https://github.com/LedgerHQ/ledger-live/commit/4e9378d63b048fef131ee574220c428456ef42d4), [`d26fbee27a`](https://github.com/LedgerHQ/ledger-live/commit/d26fbee27aacd05e2cc5ee0ba3c49492a72f5659), [`7fef128ffb`](https://github.com/LedgerHQ/ledger-live/commit/7fef128ffba226dd675935c7464db60894f327bb), [`16195a130e`](https://github.com/LedgerHQ/ledger-live/commit/16195a130e24b06528b6c2c2551e58be253f94f1), [`7af03d772a`](https://github.com/LedgerHQ/ledger-live/commit/7af03d772a16822024e456224951c48c5e09e45d), [`f3fd3134a3`](https://github.com/LedgerHQ/ledger-live/commit/f3fd3134a3852f9d872b1be268e60beae8ea3496), [`b7df09bbc9`](https://github.com/LedgerHQ/ledger-live/commit/b7df09bbc9a07602b326fbbe434c13ec61f276e7), [`5b4aa38421`](https://github.com/LedgerHQ/ledger-live/commit/5b4aa38421380512fb96ef66e1f3149ce8bfd018), [`d0919b03f4`](https://github.com/LedgerHQ/ledger-live/commit/d0919b03f49d2cfd13e0f476f7b94c54e34be872), [`96458c4f37`](https://github.com/LedgerHQ/ledger-live/commit/96458c4f3777a079e01069005217457f3e6033e2), [`63e63e5fc5`](https://github.com/LedgerHQ/ledger-live/commit/63e63e5fc562c029f1372f664d1a45dc1fda5047), [`192b897ce4`](https://github.com/LedgerHQ/ledger-live/commit/192b897ce45635f0d91021a1d4973035f6d9bf72), [`9bba7fd8bd`](https://github.com/LedgerHQ/ledger-live/commit/9bba7fd8bd9b55be569fb57367e7debc442af789), [`88d6de464b`](https://github.com/LedgerHQ/ledger-live/commit/88d6de464b475b049aaf1724b28d8a592bfd4676), [`0b827ad97a`](https://github.com/LedgerHQ/ledger-live/commit/0b827ad97afb5e12ae0c8d0d1cf3952a6d02ec7c), [`a56ffa948d`](https://github.com/LedgerHQ/ledger-live/commit/a56ffa948defb16ea9f2968d96d4b896f9839145), [`a56ffa948d`](https://github.com/LedgerHQ/ledger-live/commit/a56ffa948defb16ea9f2968d96d4b896f9839145)]:
  - @ledgerhq/live-common@27.12.0-next.0
  - @ledgerhq/cryptoassets@7.3.0-next.0

## 22.6.0

### Minor Changes

- [#1900](https://github.com/LedgerHQ/ledger-live/pull/1900) [`fc444a8a17`](https://github.com/LedgerHQ/ledger-live/commit/fc444a8a172edf1a8bf8bea5c481ab33f70b7e6f) Thanks [@Justkant](https://github.com/Justkant)! - feat(wallet-api): LLM & LLD server implementation [LIVE-4394]

### Patch Changes

- [#2178](https://github.com/LedgerHQ/ledger-live/pull/2178) [`d4b01dc1b0`](https://github.com/LedgerHQ/ledger-live/commit/d4b01dc1b0f871726c517f9c6e0ebd84e64da2b7) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: cli: adding types in log message

* [#2144](https://github.com/LedgerHQ/ledger-live/pull/2144) [`1cf4b5e6d2`](https://github.com/LedgerHQ/ledger-live/commit/1cf4b5e6d2674f753a1255bc9556892aec71d3d0) Thanks [@juan-cortes](https://github.com/juan-cortes)! - CLI - rename nano fts to stax

- [#2012](https://github.com/LedgerHQ/ledger-live/pull/2012) [`93bd602206`](https://github.com/LedgerHQ/ledger-live/commit/93bd602206137e10e5d5c8aa61d9b5aefef993ce) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added support for Battery status APDU + CLI command and tests

- Updated dependencies [[`930c655cd5`](https://github.com/LedgerHQ/ledger-live/commit/930c655cd54c7bb9034ae8a81bf937a3ad6c7e6d), [`9b3984fb92`](https://github.com/LedgerHQ/ledger-live/commit/9b3984fb92dd5233dda6603b855c402bdfd8c6a9), [`fc37600223`](https://github.com/LedgerHQ/ledger-live/commit/fc3760022341a90b51e4d836f38657ffef74040b), [`dc1c82be95`](https://github.com/LedgerHQ/ledger-live/commit/dc1c82be95005d0ec00aa849d69a9e77065ea128), [`a711a20ae8`](https://github.com/LedgerHQ/ledger-live/commit/a711a20ae82c84885705aab7fc6c97f373e973f2), [`7025af53de`](https://github.com/LedgerHQ/ledger-live/commit/7025af53dec8b4ec06cbf57e93515af2bca58645), [`3200794498`](https://github.com/LedgerHQ/ledger-live/commit/32007944989d1e89162a63e9862bd64066d6216b), [`f9b6ff9d5a`](https://github.com/LedgerHQ/ledger-live/commit/f9b6ff9d5a61cd052855260fe94ac48ce54d41e8), [`8aca07c549`](https://github.com/LedgerHQ/ledger-live/commit/8aca07c54935a66163aa89af6e88854742383bea), [`ae891a166e`](https://github.com/LedgerHQ/ledger-live/commit/ae891a166e5de9947781af3630b1accca42da1a6), [`d4b01dc1b0`](https://github.com/LedgerHQ/ledger-live/commit/d4b01dc1b0f871726c517f9c6e0ebd84e64da2b7), [`7f0ac99dd9`](https://github.com/LedgerHQ/ledger-live/commit/7f0ac99dd9129c2e0833300a3055b90528669485), [`57e7afeff1`](https://github.com/LedgerHQ/ledger-live/commit/57e7afeff1035a89caa696449c6d62cf482fac72), [`3df451dafb`](https://github.com/LedgerHQ/ledger-live/commit/3df451dafb7233f5e3f897478aee22e89f6e5339), [`1f65abb76f`](https://github.com/LedgerHQ/ledger-live/commit/1f65abb76f1a36b428b5c33dd3ad6c58b4d96aa2), [`f4b14e0fcc`](https://github.com/LedgerHQ/ledger-live/commit/f4b14e0fccccfebaebb4782b75783b34e12710e4), [`3a267c1424`](https://github.com/LedgerHQ/ledger-live/commit/3a267c14241ebc9184490e7eb81b5d4bcc94b092), [`7733415c32`](https://github.com/LedgerHQ/ledger-live/commit/7733415c32a5838cb4e6a4735530d507ff6ac405), [`184f2fd00d`](https://github.com/LedgerHQ/ledger-live/commit/184f2fd00d98d6ab8a6b94ac16ef7b20651a55e4), [`fc444a8a17`](https://github.com/LedgerHQ/ledger-live/commit/fc444a8a172edf1a8bf8bea5c481ab33f70b7e6f), [`8aca07c549`](https://github.com/LedgerHQ/ledger-live/commit/8aca07c54935a66163aa89af6e88854742383bea), [`3574c62cb3`](https://github.com/LedgerHQ/ledger-live/commit/3574c62cb3fd61b29b6794b1c5b40b2836a671f7), [`bcd7c9fd5b`](https://github.com/LedgerHQ/ledger-live/commit/bcd7c9fd5b2a1e2d1b661df6a2004fc201ae99bf), [`c469782e4b`](https://github.com/LedgerHQ/ledger-live/commit/c469782e4be0a284d4e7812a1946168e01a6a701), [`f6947ccc8f`](https://github.com/LedgerHQ/ledger-live/commit/f6947ccc8faceef656929e5fdde1fa6f52619efb), [`04a939310a`](https://github.com/LedgerHQ/ledger-live/commit/04a939310a52a7e0ebf0814286e6ad135c8c8cfa), [`9a9c5d700c`](https://github.com/LedgerHQ/ledger-live/commit/9a9c5d700cb0231facd1d29df7024cd9bca5da9d), [`1aee1b0103`](https://github.com/LedgerHQ/ledger-live/commit/1aee1b01034f0c5ea90f0ff6aa0d28fc7be0b9f9), [`5cf73f5ce6`](https://github.com/LedgerHQ/ledger-live/commit/5cf73f5ce673bc1e9552ad46bcc7f25c40a92960), [`20c5c5e109`](https://github.com/LedgerHQ/ledger-live/commit/20c5c5e1099885173aaa5ea3199052044066ac98), [`e7c1eaa6a2`](https://github.com/LedgerHQ/ledger-live/commit/e7c1eaa6a24d36aa535df7a06f17c55858de5475), [`93bd602206`](https://github.com/LedgerHQ/ledger-live/commit/93bd602206137e10e5d5c8aa61d9b5aefef993ce), [`13078a0825`](https://github.com/LedgerHQ/ledger-live/commit/13078a08256e3d74eb89dd0be4f0dda57611b68c), [`9bbc36ac05`](https://github.com/LedgerHQ/ledger-live/commit/9bbc36ac05f818ff67553d33f4d1e36df93e5848), [`5fe65a6829`](https://github.com/LedgerHQ/ledger-live/commit/5fe65a6829fecf27391b51ffad71f62b431dc79c), [`22f514abe1`](https://github.com/LedgerHQ/ledger-live/commit/22f514abe1def1c385262a4cd7519d922b633f10)]:
  - @ledgerhq/live-common@27.11.0
  - @ledgerhq/cryptoassets@7.2.0
  - @ledgerhq/errors@6.12.3
  - @ledgerhq/types-devices@6.22.4
  - @ledgerhq/hw-transport@6.27.10
  - @ledgerhq/hw-transport-node-ble@6.27.10
  - @ledgerhq/hw-transport-node-hid@6.27.10
  - @ledgerhq/hw-transport-http@6.27.10
  - @ledgerhq/hw-transport-node-speculos@6.27.10
  - @ledgerhq/hw-app-btc@9.1.2
  - @ledgerhq/hw-transport-mocker@6.27.10

## 22.6.0-next.2

### Patch Changes

- Updated dependencies [[`9bbc36ac05`](https://github.com/LedgerHQ/ledger-live/commit/9bbc36ac05f818ff67553d33f4d1e36df93e5848)]:
  - @ledgerhq/live-common@27.11.0-next.2

## 22.6.0-next.1

### Patch Changes

- Updated dependencies [[`a711a20ae8`](https://github.com/LedgerHQ/ledger-live/commit/a711a20ae82c84885705aab7fc6c97f373e973f2)]:
  - @ledgerhq/live-common@27.11.0-next.1

## 22.6.0-next.0

### Minor Changes

- [#1900](https://github.com/LedgerHQ/ledger-live/pull/1900) [`fc444a8a17`](https://github.com/LedgerHQ/ledger-live/commit/fc444a8a172edf1a8bf8bea5c481ab33f70b7e6f) Thanks [@Justkant](https://github.com/Justkant)! - feat(wallet-api): LLM & LLD server implementation [LIVE-4394]

### Patch Changes

- [#2178](https://github.com/LedgerHQ/ledger-live/pull/2178) [`d4b01dc1b0`](https://github.com/LedgerHQ/ledger-live/commit/d4b01dc1b0f871726c517f9c6e0ebd84e64da2b7) Thanks [@alexandremgo](https://github.com/alexandremgo)! - chore: cli: adding types in log message

* [#2144](https://github.com/LedgerHQ/ledger-live/pull/2144) [`1cf4b5e6d2`](https://github.com/LedgerHQ/ledger-live/commit/1cf4b5e6d2674f753a1255bc9556892aec71d3d0) Thanks [@juan-cortes](https://github.com/juan-cortes)! - CLI - rename nano fts to stax

- [#2012](https://github.com/LedgerHQ/ledger-live/pull/2012) [`93bd602206`](https://github.com/LedgerHQ/ledger-live/commit/93bd602206137e10e5d5c8aa61d9b5aefef993ce) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added support for Battery status APDU + CLI command and tests

- Updated dependencies [[`930c655cd5`](https://github.com/LedgerHQ/ledger-live/commit/930c655cd54c7bb9034ae8a81bf937a3ad6c7e6d), [`9b3984fb92`](https://github.com/LedgerHQ/ledger-live/commit/9b3984fb92dd5233dda6603b855c402bdfd8c6a9), [`fc37600223`](https://github.com/LedgerHQ/ledger-live/commit/fc3760022341a90b51e4d836f38657ffef74040b), [`dc1c82be95`](https://github.com/LedgerHQ/ledger-live/commit/dc1c82be95005d0ec00aa849d69a9e77065ea128), [`7025af53de`](https://github.com/LedgerHQ/ledger-live/commit/7025af53dec8b4ec06cbf57e93515af2bca58645), [`3200794498`](https://github.com/LedgerHQ/ledger-live/commit/32007944989d1e89162a63e9862bd64066d6216b), [`f9b6ff9d5a`](https://github.com/LedgerHQ/ledger-live/commit/f9b6ff9d5a61cd052855260fe94ac48ce54d41e8), [`8aca07c549`](https://github.com/LedgerHQ/ledger-live/commit/8aca07c54935a66163aa89af6e88854742383bea), [`ae891a166e`](https://github.com/LedgerHQ/ledger-live/commit/ae891a166e5de9947781af3630b1accca42da1a6), [`d4b01dc1b0`](https://github.com/LedgerHQ/ledger-live/commit/d4b01dc1b0f871726c517f9c6e0ebd84e64da2b7), [`7f0ac99dd9`](https://github.com/LedgerHQ/ledger-live/commit/7f0ac99dd9129c2e0833300a3055b90528669485), [`57e7afeff1`](https://github.com/LedgerHQ/ledger-live/commit/57e7afeff1035a89caa696449c6d62cf482fac72), [`3df451dafb`](https://github.com/LedgerHQ/ledger-live/commit/3df451dafb7233f5e3f897478aee22e89f6e5339), [`1f65abb76f`](https://github.com/LedgerHQ/ledger-live/commit/1f65abb76f1a36b428b5c33dd3ad6c58b4d96aa2), [`f4b14e0fcc`](https://github.com/LedgerHQ/ledger-live/commit/f4b14e0fccccfebaebb4782b75783b34e12710e4), [`3a267c1424`](https://github.com/LedgerHQ/ledger-live/commit/3a267c14241ebc9184490e7eb81b5d4bcc94b092), [`7733415c32`](https://github.com/LedgerHQ/ledger-live/commit/7733415c32a5838cb4e6a4735530d507ff6ac405), [`184f2fd00d`](https://github.com/LedgerHQ/ledger-live/commit/184f2fd00d98d6ab8a6b94ac16ef7b20651a55e4), [`fc444a8a17`](https://github.com/LedgerHQ/ledger-live/commit/fc444a8a172edf1a8bf8bea5c481ab33f70b7e6f), [`8aca07c549`](https://github.com/LedgerHQ/ledger-live/commit/8aca07c54935a66163aa89af6e88854742383bea), [`3574c62cb3`](https://github.com/LedgerHQ/ledger-live/commit/3574c62cb3fd61b29b6794b1c5b40b2836a671f7), [`bcd7c9fd5b`](https://github.com/LedgerHQ/ledger-live/commit/bcd7c9fd5b2a1e2d1b661df6a2004fc201ae99bf), [`c469782e4b`](https://github.com/LedgerHQ/ledger-live/commit/c469782e4be0a284d4e7812a1946168e01a6a701), [`f6947ccc8f`](https://github.com/LedgerHQ/ledger-live/commit/f6947ccc8faceef656929e5fdde1fa6f52619efb), [`04a939310a`](https://github.com/LedgerHQ/ledger-live/commit/04a939310a52a7e0ebf0814286e6ad135c8c8cfa), [`9a9c5d700c`](https://github.com/LedgerHQ/ledger-live/commit/9a9c5d700cb0231facd1d29df7024cd9bca5da9d), [`1aee1b0103`](https://github.com/LedgerHQ/ledger-live/commit/1aee1b01034f0c5ea90f0ff6aa0d28fc7be0b9f9), [`5cf73f5ce6`](https://github.com/LedgerHQ/ledger-live/commit/5cf73f5ce673bc1e9552ad46bcc7f25c40a92960), [`20c5c5e109`](https://github.com/LedgerHQ/ledger-live/commit/20c5c5e1099885173aaa5ea3199052044066ac98), [`e7c1eaa6a2`](https://github.com/LedgerHQ/ledger-live/commit/e7c1eaa6a24d36aa535df7a06f17c55858de5475), [`93bd602206`](https://github.com/LedgerHQ/ledger-live/commit/93bd602206137e10e5d5c8aa61d9b5aefef993ce), [`13078a0825`](https://github.com/LedgerHQ/ledger-live/commit/13078a08256e3d74eb89dd0be4f0dda57611b68c), [`5fe65a6829`](https://github.com/LedgerHQ/ledger-live/commit/5fe65a6829fecf27391b51ffad71f62b431dc79c), [`22f514abe1`](https://github.com/LedgerHQ/ledger-live/commit/22f514abe1def1c385262a4cd7519d922b633f10)]:
  - @ledgerhq/live-common@27.11.0-next.0
  - @ledgerhq/cryptoassets@7.2.0-next.0
  - @ledgerhq/errors@6.12.3-next.0
  - @ledgerhq/types-devices@6.22.4-next.0
  - @ledgerhq/hw-transport@6.27.10-next.0
  - @ledgerhq/hw-transport-node-ble@6.27.10-next.0
  - @ledgerhq/hw-transport-node-hid@6.27.10-next.0
  - @ledgerhq/hw-transport-http@6.27.10-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.10-next.0
  - @ledgerhq/hw-app-btc@9.1.2-next.0
  - @ledgerhq/hw-transport-mocker@6.27.10-next.0

## 22.5.1

### Patch Changes

- Updated dependencies [[`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5), [`d99aafd1d4`](https://github.com/LedgerHQ/ledger-live/commit/d99aafd1d48336f6b4da3c1d8e7c52dbc1676278), [`d99aafd1d4`](https://github.com/LedgerHQ/ledger-live/commit/d99aafd1d48336f6b4da3c1d8e7c52dbc1676278), [`93e19275f3`](https://github.com/LedgerHQ/ledger-live/commit/93e19275f3336672579d2e3bab317489d47853c5), [`ee507188f0`](https://github.com/LedgerHQ/ledger-live/commit/ee507188f097429237bef6df0f63b5f6426dd91a), [`aee5dd361f`](https://github.com/LedgerHQ/ledger-live/commit/aee5dd361fae6aacb8b7320107417185c90f9b8b), [`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5)]:
  - @ledgerhq/live-common@27.10.0
  - @ledgerhq/cryptoassets@7.1.0
  - @ledgerhq/errors@6.12.2
  - @ledgerhq/hw-transport@6.27.9
  - @ledgerhq/hw-transport-http@6.27.9
  - @ledgerhq/hw-transport-node-ble@6.27.9
  - @ledgerhq/hw-transport-node-hid@6.27.9
  - @ledgerhq/hw-transport-node-speculos@6.27.9
  - @ledgerhq/hw-app-btc@9.1.1
  - @ledgerhq/hw-transport-mocker@6.27.9

## 22.5.1-next.0

### Patch Changes

- Updated dependencies [[`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5), [`d99aafd1d4`](https://github.com/LedgerHQ/ledger-live/commit/d99aafd1d48336f6b4da3c1d8e7c52dbc1676278), [`d99aafd1d4`](https://github.com/LedgerHQ/ledger-live/commit/d99aafd1d48336f6b4da3c1d8e7c52dbc1676278), [`93e19275f3`](https://github.com/LedgerHQ/ledger-live/commit/93e19275f3336672579d2e3bab317489d47853c5), [`ee507188f0`](https://github.com/LedgerHQ/ledger-live/commit/ee507188f097429237bef6df0f63b5f6426dd91a), [`aee5dd361f`](https://github.com/LedgerHQ/ledger-live/commit/aee5dd361fae6aacb8b7320107417185c90f9b8b), [`f1c15446da`](https://github.com/LedgerHQ/ledger-live/commit/f1c15446dabef05bb91dada8d8f53f9bc6474ba5)]:
  - @ledgerhq/live-common@27.10.0-next.0
  - @ledgerhq/cryptoassets@7.1.0-next.0
  - @ledgerhq/errors@6.12.2-next.0
  - @ledgerhq/hw-transport@6.27.9-next.0
  - @ledgerhq/hw-transport-http@6.27.9-next.0
  - @ledgerhq/hw-transport-node-ble@6.27.9-next.0
  - @ledgerhq/hw-transport-node-hid@6.27.9-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.9-next.0
  - @ledgerhq/hw-app-btc@9.1.1-next.0
  - @ledgerhq/hw-transport-mocker@6.27.9-next.0

## 22.5.0

### Minor Changes

- [#1959](https://github.com/LedgerHQ/ledger-live/pull/1959) [`2aa8cc9c33`](https://github.com/LedgerHQ/ledger-live/commit/2aa8cc9c339ce8c9677b24e70218cc45847d799b) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Change hw-app-btc to remove any dependency to the legacy Bitcoin Nano app API. Update hw-app-btc API (refer to hw-app-btc/src/Btc.ts for new method signature)

### Patch Changes

- Updated dependencies [[`9100363270`](https://github.com/LedgerHQ/ledger-live/commit/91003632704d11fc327517a582ac6d7009c05bd3), [`ff5cb2cb11`](https://github.com/LedgerHQ/ledger-live/commit/ff5cb2cb11a2dcac0f2a65bf3ae4efac512cfe71), [`eef8038f61`](https://github.com/LedgerHQ/ledger-live/commit/eef8038f611820efffd3b4834e124be0c29acd39), [`82676099c5`](https://github.com/LedgerHQ/ledger-live/commit/82676099c5d99bbe877b92281d29fde040a0285a), [`82676099c5`](https://github.com/LedgerHQ/ledger-live/commit/82676099c5d99bbe877b92281d29fde040a0285a), [`82676099c5`](https://github.com/LedgerHQ/ledger-live/commit/82676099c5d99bbe877b92281d29fde040a0285a), [`a00544e8de`](https://github.com/LedgerHQ/ledger-live/commit/a00544e8de135285609e9aabc2d4ca354f8ebc2a), [`f29d3d9384`](https://github.com/LedgerHQ/ledger-live/commit/f29d3d9384f57c99c228749673d4f5d840b4bf06), [`720dc1f58a`](https://github.com/LedgerHQ/ledger-live/commit/720dc1f58a6cea9c8a933139ff94a1d9f1b98129), [`2aa8cc9c33`](https://github.com/LedgerHQ/ledger-live/commit/2aa8cc9c339ce8c9677b24e70218cc45847d799b)]:
  - @ledgerhq/cryptoassets@7.0.0
  - @ledgerhq/live-common@27.9.0
  - @ledgerhq/hw-app-btc@9.1.0

## 22.5.0-next.0

### Minor Changes

- [#1959](https://github.com/LedgerHQ/ledger-live/pull/1959) [`2aa8cc9c33`](https://github.com/LedgerHQ/ledger-live/commit/2aa8cc9c339ce8c9677b24e70218cc45847d799b) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Change hw-app-btc to remove any dependency to the legacy Bitcoin Nano app API. Update hw-app-btc API (refer to hw-app-btc/src/Btc.ts for new method signature)

### Patch Changes

- Updated dependencies [[`9100363270`](https://github.com/LedgerHQ/ledger-live/commit/91003632704d11fc327517a582ac6d7009c05bd3), [`ff5cb2cb11`](https://github.com/LedgerHQ/ledger-live/commit/ff5cb2cb11a2dcac0f2a65bf3ae4efac512cfe71), [`eef8038f61`](https://github.com/LedgerHQ/ledger-live/commit/eef8038f611820efffd3b4834e124be0c29acd39), [`82676099c5`](https://github.com/LedgerHQ/ledger-live/commit/82676099c5d99bbe877b92281d29fde040a0285a), [`82676099c5`](https://github.com/LedgerHQ/ledger-live/commit/82676099c5d99bbe877b92281d29fde040a0285a), [`82676099c5`](https://github.com/LedgerHQ/ledger-live/commit/82676099c5d99bbe877b92281d29fde040a0285a), [`a00544e8de`](https://github.com/LedgerHQ/ledger-live/commit/a00544e8de135285609e9aabc2d4ca354f8ebc2a), [`f29d3d9384`](https://github.com/LedgerHQ/ledger-live/commit/f29d3d9384f57c99c228749673d4f5d840b4bf06), [`720dc1f58a`](https://github.com/LedgerHQ/ledger-live/commit/720dc1f58a6cea9c8a933139ff94a1d9f1b98129), [`2aa8cc9c33`](https://github.com/LedgerHQ/ledger-live/commit/2aa8cc9c339ce8c9677b24e70218cc45847d799b)]:
  - @ledgerhq/cryptoassets@7.0.0-next.0
  - @ledgerhq/live-common@27.9.0-next.0
  - @ledgerhq/hw-app-btc@9.1.0-next.0

## 22.4.10

### Patch Changes

- Updated dependencies [[`6a07e7bc3c`](https://github.com/LedgerHQ/ledger-live/commit/6a07e7bc3c47672e658218e06160fa121f0166ef)]:
  - @ledgerhq/live-common@27.8.1

## 22.4.10-hotfix.0

### Patch Changes

- Updated dependencies [[`6a07e7bc3c`](https://github.com/LedgerHQ/ledger-live/commit/6a07e7bc3c47672e658218e06160fa121f0166ef)]:
  - @ledgerhq/live-common@27.8.1-hotfix.0

## 22.4.9

### Patch Changes

- [#1779](https://github.com/LedgerHQ/ledger-live/pull/1779) [`856f49374e`](https://github.com/LedgerHQ/ledger-live/commit/856f49374ec9b49f005676e270acdb81b78879c8) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Introduce new command for demoing the conditional image fetch

- Updated dependencies [[`d10c727430`](https://github.com/LedgerHQ/ledger-live/commit/d10c727430ffece743bbb7e703aaff61f97dacc1), [`856f49374e`](https://github.com/LedgerHQ/ledger-live/commit/856f49374ec9b49f005676e270acdb81b78879c8), [`57b82ad735`](https://github.com/LedgerHQ/ledger-live/commit/57b82ad7350c6368b2d6a731d7b1c52b759516b0), [`77056e3692`](https://github.com/LedgerHQ/ledger-live/commit/77056e369256112188c183823a2c3fabfea2cba8), [`70f00ec916`](https://github.com/LedgerHQ/ledger-live/commit/70f00ec91629c917be13c6937e14ebc7201b231f), [`e43939cfd5`](https://github.com/LedgerHQ/ledger-live/commit/e43939cfd5e3df8888cfe1f0ba95140acd061eea), [`856f49374e`](https://github.com/LedgerHQ/ledger-live/commit/856f49374ec9b49f005676e270acdb81b78879c8), [`3119c17ec3`](https://github.com/LedgerHQ/ledger-live/commit/3119c17ec3966f7dc1780734c016878bab9db722), [`f22d46a006`](https://github.com/LedgerHQ/ledger-live/commit/f22d46a006adc630ccb087808c2290e3ef65cea3)]:
  - @ledgerhq/live-common@27.8.0
  - @ledgerhq/errors@6.12.1
  - @ledgerhq/hw-transport@6.27.8
  - @ledgerhq/hw-transport-http@6.27.8
  - @ledgerhq/hw-transport-node-ble@6.27.8
  - @ledgerhq/hw-transport-node-hid@6.27.8
  - @ledgerhq/hw-transport-node-speculos@6.27.8
  - @ledgerhq/hw-app-btc@9.0.1
  - @ledgerhq/hw-transport-mocker@6.27.8

## 22.4.9-next.0

### Patch Changes

- [#1779](https://github.com/LedgerHQ/ledger-live/pull/1779) [`856f49374e`](https://github.com/LedgerHQ/ledger-live/commit/856f49374ec9b49f005676e270acdb81b78879c8) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Introduce new command for demoing the conditional image fetch

- Updated dependencies [[`d10c727430`](https://github.com/LedgerHQ/ledger-live/commit/d10c727430ffece743bbb7e703aaff61f97dacc1), [`856f49374e`](https://github.com/LedgerHQ/ledger-live/commit/856f49374ec9b49f005676e270acdb81b78879c8), [`57b82ad735`](https://github.com/LedgerHQ/ledger-live/commit/57b82ad7350c6368b2d6a731d7b1c52b759516b0), [`77056e3692`](https://github.com/LedgerHQ/ledger-live/commit/77056e369256112188c183823a2c3fabfea2cba8), [`70f00ec916`](https://github.com/LedgerHQ/ledger-live/commit/70f00ec91629c917be13c6937e14ebc7201b231f), [`e43939cfd5`](https://github.com/LedgerHQ/ledger-live/commit/e43939cfd5e3df8888cfe1f0ba95140acd061eea), [`856f49374e`](https://github.com/LedgerHQ/ledger-live/commit/856f49374ec9b49f005676e270acdb81b78879c8), [`3119c17ec3`](https://github.com/LedgerHQ/ledger-live/commit/3119c17ec3966f7dc1780734c016878bab9db722), [`f22d46a006`](https://github.com/LedgerHQ/ledger-live/commit/f22d46a006adc630ccb087808c2290e3ef65cea3)]:
  - @ledgerhq/live-common@27.8.0-next.0
  - @ledgerhq/errors@6.12.1-next.0
  - @ledgerhq/hw-transport@6.27.8-next.0
  - @ledgerhq/hw-transport-http@6.27.8-next.0
  - @ledgerhq/hw-transport-node-ble@6.27.8-next.0
  - @ledgerhq/hw-transport-node-hid@6.27.8-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.8-next.0
  - @ledgerhq/hw-app-btc@9.0.1-next.0
  - @ledgerhq/hw-transport-mocker@6.27.8-next.0

## 22.4.8

### Patch Changes

- Updated dependencies [[`bdf55e0411`](https://github.com/LedgerHQ/ledger-live/commit/bdf55e0411d46c0bf68d42b7f96b75d49ba81a67)]:
  - @ledgerhq/live-common@27.7.2

## 22.4.8-hotfix.0

### Patch Changes

- Updated dependencies [[`bdf55e0411`](https://github.com/LedgerHQ/ledger-live/commit/bdf55e0411d46c0bf68d42b7f96b75d49ba81a67)]:
  - @ledgerhq/live-common@27.7.2-hotfix.0

## 22.4.7

### Patch Changes

- Updated dependencies [[`f7aa25417a`](https://github.com/LedgerHQ/ledger-live/commit/f7aa25417a953a6e4768e0b5d500cab566369a0a), [`e3a796b0a0`](https://github.com/LedgerHQ/ledger-live/commit/e3a796b0a021b19ff01061a019657cea26cc46de)]:
  - @ledgerhq/live-common@27.7.1

## 22.4.7-hotfix.1

### Patch Changes

- Updated dependencies [[`e3a796b0a0`](https://github.com/LedgerHQ/ledger-live/commit/e3a796b0a021b19ff01061a019657cea26cc46de)]:
  - @ledgerhq/live-common@27.7.1-hotfix.1

## 22.4.7-hotfix.0

### Patch Changes

- Updated dependencies [[`f7aa25417a`](https://github.com/LedgerHQ/ledger-live/commit/f7aa25417a953a6e4768e0b5d500cab566369a0a)]:
  - @ledgerhq/live-common@27.7.1-hotfix.0

## 22.4.6

### Patch Changes

- [#1622](https://github.com/LedgerHQ/ledger-live/pull/1622) [`df8cbb8dd1`](https://github.com/LedgerHQ/ledger-live/commit/df8cbb8dd166a66325eb96d8192f3f985b71df60) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix bootloader repairing steps

* [#1141](https://github.com/LedgerHQ/ledger-live/pull/1141) [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd) Thanks [@valpinkman](https://github.com/valpinkman)! - Collateral changes due to solving all LLM typescript/eslint issues/warnings.

* Updated dependencies [[`32c8df8f47`](https://github.com/LedgerHQ/ledger-live/commit/32c8df8f47644278ee44e9db623af864d57ad61c), [`4aa4d42cb1`](https://github.com/LedgerHQ/ledger-live/commit/4aa4d42cb103612c130b01f36100eb6fdd87e8b1), [`aec68cca70`](https://github.com/LedgerHQ/ledger-live/commit/aec68cca70194f7890a09dca62a737046af13305), [`9f8c9be0ae`](https://github.com/LedgerHQ/ledger-live/commit/9f8c9be0aead9eb4101aa9d14e4ee3b560d88792), [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6), [`3f516ea41e`](https://github.com/LedgerHQ/ledger-live/commit/3f516ea41e6e1a485be452872c91bd4a315eb167), [`2660f2993c`](https://github.com/LedgerHQ/ledger-live/commit/2660f2993cc815f10a8e8ffea18fb761d869fc36), [`f7b27a97f6`](https://github.com/LedgerHQ/ledger-live/commit/f7b27a97f6cd2b2c553cbe83d008e4ce907c9ad2), [`0308e8c6ae`](https://github.com/LedgerHQ/ledger-live/commit/0308e8c6ae721a99bc50f5dc60db0d11ea8ea1ff), [`32c8df8f47`](https://github.com/LedgerHQ/ledger-live/commit/32c8df8f47644278ee44e9db623af864d57ad61c), [`d3c91a53e0`](https://github.com/LedgerHQ/ledger-live/commit/d3c91a53e06f9f47817e96c452f69e2d9f71d80f), [`ddeace7163`](https://github.com/LedgerHQ/ledger-live/commit/ddeace7163f0c9186f4f48cc4baa2b9273c5ebf3), [`57699a19fa`](https://github.com/LedgerHQ/ledger-live/commit/57699a19fa545ba359e457deb7ba0632b15342b5), [`32c8df8f47`](https://github.com/LedgerHQ/ledger-live/commit/32c8df8f47644278ee44e9db623af864d57ad61c), [`df8cbb8dd1`](https://github.com/LedgerHQ/ledger-live/commit/df8cbb8dd166a66325eb96d8192f3f985b71df60), [`0d7e0f713a`](https://github.com/LedgerHQ/ledger-live/commit/0d7e0f713ab4fbb3d4bd7df147a96c7de73123b7), [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6), [`f521bf7ef1`](https://github.com/LedgerHQ/ledger-live/commit/f521bf7ef1afa3afe1a03cbf65bd36ebee6d0768), [`5b8315df30`](https://github.com/LedgerHQ/ledger-live/commit/5b8315df306d72e8b0191aa5136760142f9d3447), [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6), [`e89044242d`](https://github.com/LedgerHQ/ledger-live/commit/e89044242d005bfc3349abbbf1921e9056686d0b), [`bef0a76d27`](https://github.com/LedgerHQ/ledger-live/commit/bef0a76d276f6a8d322e890ceaedc266a710b06a), [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd), [`90a9fbb75b`](https://github.com/LedgerHQ/ledger-live/commit/90a9fbb75b3b3960655d601a6c7c987689ef19be), [`ab40db1288`](https://github.com/LedgerHQ/ledger-live/commit/ab40db1288bf4a795819a8a636821dbccf33073a)]:
  - @ledgerhq/live-common@27.7.0
  - @ledgerhq/cryptoassets@6.37.0
  - @ledgerhq/errors@6.12.0
  - @ledgerhq/hw-transport-node-hid@6.27.7
  - @ledgerhq/hw-transport@6.27.7
  - @ledgerhq/hw-transport-http@6.27.7
  - @ledgerhq/hw-transport-node-ble@6.27.7
  - @ledgerhq/hw-transport-node-speculos@6.27.7
  - @ledgerhq/hw-app-btc@9.0.0
  - @ledgerhq/hw-transport-mocker@6.27.7

## 22.4.6-next.4

### Patch Changes

- Updated dependencies [[`2660f2993c`](https://github.com/LedgerHQ/ledger-live/commit/2660f2993cc815f10a8e8ffea18fb761d869fc36)]:
  - @ledgerhq/live-common@27.7.0-next.3

## 22.4.6-next.3

### Patch Changes

- Updated dependencies [[`9f8c9be0ae`](https://github.com/LedgerHQ/ledger-live/commit/9f8c9be0aead9eb4101aa9d14e4ee3b560d88792)]:
  - @ledgerhq/live-common@27.7.0-next.2

## 22.4.6-next.2

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@27.7.0-next.1

## 22.4.6-next.1

### Patch Changes

- Updated dependencies [[`f521bf7ef1`](https://github.com/LedgerHQ/ledger-live/commit/f521bf7ef1afa3afe1a03cbf65bd36ebee6d0768)]:
  - @ledgerhq/live-common@27.7.0-next.1

## 22.4.6-next.0

### Patch Changes

- [#1493](https://github.com/LedgerHQ/ledger-live/pull/1493) [`658303322b`](https://github.com/LedgerHQ/ledger-live/commit/658303322b767f5ed3821def8384b5342ab03089) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Change hw-app-btc to remove any dependency to the legacy Bitcoin Nano app API. Update hw-app-btc API (refer to hw-app-btc/src/Btc.ts for new method signature)

* [#1622](https://github.com/LedgerHQ/ledger-live/pull/1622) [`df8cbb8dd1`](https://github.com/LedgerHQ/ledger-live/commit/df8cbb8dd166a66325eb96d8192f3f985b71df60) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Fix bootloader repairing steps

- [#1141](https://github.com/LedgerHQ/ledger-live/pull/1141) [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd) Thanks [@valpinkman](https://github.com/valpinkman)! - Collateral changes due to solving all LLM typescript/eslint issues/warnings.

- Updated dependencies [[`32c8df8f47`](https://github.com/LedgerHQ/ledger-live/commit/32c8df8f47644278ee44e9db623af864d57ad61c), [`4aa4d42cb1`](https://github.com/LedgerHQ/ledger-live/commit/4aa4d42cb103612c130b01f36100eb6fdd87e8b1), [`aec68cca70`](https://github.com/LedgerHQ/ledger-live/commit/aec68cca70194f7890a09dca62a737046af13305), [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6), [`3f516ea41e`](https://github.com/LedgerHQ/ledger-live/commit/3f516ea41e6e1a485be452872c91bd4a315eb167), [`f7b27a97f6`](https://github.com/LedgerHQ/ledger-live/commit/f7b27a97f6cd2b2c553cbe83d008e4ce907c9ad2), [`0308e8c6ae`](https://github.com/LedgerHQ/ledger-live/commit/0308e8c6ae721a99bc50f5dc60db0d11ea8ea1ff), [`658303322b`](https://github.com/LedgerHQ/ledger-live/commit/658303322b767f5ed3821def8384b5342ab03089), [`32c8df8f47`](https://github.com/LedgerHQ/ledger-live/commit/32c8df8f47644278ee44e9db623af864d57ad61c), [`d3c91a53e0`](https://github.com/LedgerHQ/ledger-live/commit/d3c91a53e06f9f47817e96c452f69e2d9f71d80f), [`ddeace7163`](https://github.com/LedgerHQ/ledger-live/commit/ddeace7163f0c9186f4f48cc4baa2b9273c5ebf3), [`57699a19fa`](https://github.com/LedgerHQ/ledger-live/commit/57699a19fa545ba359e457deb7ba0632b15342b5), [`32c8df8f47`](https://github.com/LedgerHQ/ledger-live/commit/32c8df8f47644278ee44e9db623af864d57ad61c), [`df8cbb8dd1`](https://github.com/LedgerHQ/ledger-live/commit/df8cbb8dd166a66325eb96d8192f3f985b71df60), [`0d7e0f713a`](https://github.com/LedgerHQ/ledger-live/commit/0d7e0f713ab4fbb3d4bd7df147a96c7de73123b7), [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6), [`5b8315df30`](https://github.com/LedgerHQ/ledger-live/commit/5b8315df306d72e8b0191aa5136760142f9d3447), [`4ad6155953`](https://github.com/LedgerHQ/ledger-live/commit/4ad615595392f5ef806cbd21f0be1b30d3ae73c6), [`e89044242d`](https://github.com/LedgerHQ/ledger-live/commit/e89044242d005bfc3349abbbf1921e9056686d0b), [`bef0a76d27`](https://github.com/LedgerHQ/ledger-live/commit/bef0a76d276f6a8d322e890ceaedc266a710b06a), [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd), [`90a9fbb75b`](https://github.com/LedgerHQ/ledger-live/commit/90a9fbb75b3b3960655d601a6c7c987689ef19be), [`ab40db1288`](https://github.com/LedgerHQ/ledger-live/commit/ab40db1288bf4a795819a8a636821dbccf33073a)]:
  - @ledgerhq/live-common@27.7.0-next.0
  - @ledgerhq/cryptoassets@6.37.0-next.0
  - @ledgerhq/errors@6.12.0-next.0
  - @ledgerhq/hw-app-btc@9.0.0-next.0
  - @ledgerhq/hw-transport-node-hid@6.27.7-next.0
  - @ledgerhq/hw-transport@6.27.7-next.0
  - @ledgerhq/hw-transport-http@6.27.7-next.0
  - @ledgerhq/hw-transport-node-ble@6.27.7-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.7-next.0
  - @ledgerhq/hw-transport-mocker@6.27.7-next.0

## 22.4.5

### Patch Changes

- [#1279](https://github.com/LedgerHQ/ledger-live/pull/1279) [`0f1bf87fdc`](https://github.com/LedgerHQ/ledger-live/commit/0f1bf87fdc8b80a4edb2556222b255d644fdd5da) Thanks [@grsoares21](https://github.com/grsoares21)! - Fixed compilation issue by adding type definitions

- Updated dependencies [[`0f1bf87fdc`](https://github.com/LedgerHQ/ledger-live/commit/0f1bf87fdc8b80a4edb2556222b255d644fdd5da), [`24cdfe3869`](https://github.com/LedgerHQ/ledger-live/commit/24cdfe38695b60c7f3bc4827ea46893c8062dbad), [`627f928b9d`](https://github.com/LedgerHQ/ledger-live/commit/627f928b9dc93f072f47b85d09e34c41b1948d0b), [`cbcc0c1989`](https://github.com/LedgerHQ/ledger-live/commit/cbcc0c19899ffecbdbeda2e4b230a130d0fe1899), [`2f615db01b`](https://github.com/LedgerHQ/ledger-live/commit/2f615db01be43e7c21b5654b28bd122dab140252), [`6bcbd3967a`](https://github.com/LedgerHQ/ledger-live/commit/6bcbd3967a9841779a60708eab4b70144af880d7), [`b53d648424`](https://github.com/LedgerHQ/ledger-live/commit/b53d64842471eb2382066aecfc9f2b3b15ef7aed), [`2c3d6b53ea`](https://github.com/LedgerHQ/ledger-live/commit/2c3d6b53eaaefc0f2ab766addf8584d2f83a5eb9), [`b49a269bb2`](https://github.com/LedgerHQ/ledger-live/commit/b49a269bb2d3ff1cdaae5e74d85fb8e1c33da978), [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53)]:
  - @ledgerhq/live-common@27.6.0
  - @ledgerhq/cryptoassets@6.36.1

## 22.4.5-next.0

### Patch Changes

- [#1279](https://github.com/LedgerHQ/ledger-live/pull/1279) [`0f1bf87fdc`](https://github.com/LedgerHQ/ledger-live/commit/0f1bf87fdc8b80a4edb2556222b255d644fdd5da) Thanks [@grsoares21](https://github.com/grsoares21)! - Fixed compilation issue by adding type definitions

- Updated dependencies [[`0f1bf87fdc`](https://github.com/LedgerHQ/ledger-live/commit/0f1bf87fdc8b80a4edb2556222b255d644fdd5da), [`24cdfe3869`](https://github.com/LedgerHQ/ledger-live/commit/24cdfe38695b60c7f3bc4827ea46893c8062dbad), [`627f928b9d`](https://github.com/LedgerHQ/ledger-live/commit/627f928b9dc93f072f47b85d09e34c41b1948d0b), [`cbcc0c1989`](https://github.com/LedgerHQ/ledger-live/commit/cbcc0c19899ffecbdbeda2e4b230a130d0fe1899), [`2f615db01b`](https://github.com/LedgerHQ/ledger-live/commit/2f615db01be43e7c21b5654b28bd122dab140252), [`6bcbd3967a`](https://github.com/LedgerHQ/ledger-live/commit/6bcbd3967a9841779a60708eab4b70144af880d7), [`b53d648424`](https://github.com/LedgerHQ/ledger-live/commit/b53d64842471eb2382066aecfc9f2b3b15ef7aed), [`2c3d6b53ea`](https://github.com/LedgerHQ/ledger-live/commit/2c3d6b53eaaefc0f2ab766addf8584d2f83a5eb9), [`b49a269bb2`](https://github.com/LedgerHQ/ledger-live/commit/b49a269bb2d3ff1cdaae5e74d85fb8e1c33da978), [`f7a8df09f8`](https://github.com/LedgerHQ/ledger-live/commit/f7a8df09f8115da779b7082384d5db0823317d53)]:
  - @ledgerhq/live-common@27.5.0-next.0
  - @ledgerhq/cryptoassets@6.36.1-next.0

## 22.4.4

### Patch Changes

- Updated dependencies [[`455e43b34c`](https://github.com/LedgerHQ/ledger-live/commit/455e43b34c13ca7ed1d2920a36653caa250e42ab)]:
  - @ledgerhq/live-common@27.5.0

## 22.4.4-hotfix.0

### Patch Changes

- Updated dependencies [[`455e43b34c`](https://github.com/LedgerHQ/ledger-live/commit/455e43b34c13ca7ed1d2920a36653caa250e42ab)]:
  - @ledgerhq/live-common@27.5.0-hotfix.0

## 22.4.3

### Patch Changes

- Updated dependencies [[`2100b9fb81`](https://github.com/LedgerHQ/ledger-live/commit/2100b9fb81a4fd04f65b96561c0a7d618658843a), [`5fba025686`](https://github.com/LedgerHQ/ledger-live/commit/5fba025686d799badad3f7a7c7c8491cba14be8a), [`64e00a9e30`](https://github.com/LedgerHQ/ledger-live/commit/64e00a9e30cf67b1e34552037e4405379af04a67), [`12d40b578b`](https://github.com/LedgerHQ/ledger-live/commit/12d40b578bee2b52de197b679c3db0299bc9a716), [`bd884848bd`](https://github.com/LedgerHQ/ledger-live/commit/bd884848bd3dc2ef3cb5ea4df0127ff8ec6be8b7), [`2802e2d684`](https://github.com/LedgerHQ/ledger-live/commit/2802e2d6844a7e17127ea7d103fe0d1a45afa032), [`b34e55181c`](https://github.com/LedgerHQ/ledger-live/commit/b34e55181c12bb0a59ef5dee5e808d7597a21edb), [`f6854a3fd7`](https://github.com/LedgerHQ/ledger-live/commit/f6854a3fd79a28eb5507796b69105c85b40bbe98), [`d3dc2c6877`](https://github.com/LedgerHQ/ledger-live/commit/d3dc2c6877fbdcaf68e442a781798d752fc5152d), [`d1aab06a96`](https://github.com/LedgerHQ/ledger-live/commit/d1aab06a966e06269b037b574e51593fe45e987f), [`824efb6e62`](https://github.com/LedgerHQ/ledger-live/commit/824efb6e62b4b042fef700896f0bfd54ccfee5c7)]:
  - @ledgerhq/live-common@27.4.0
  - @ledgerhq/cryptoassets@6.36.0

## 22.4.3-next.2

### Patch Changes

- Updated dependencies [[`5fba025686`](https://github.com/LedgerHQ/ledger-live/commit/5fba025686d799badad3f7a7c7c8491cba14be8a)]:
  - @ledgerhq/live-common@27.4.0-next.2

## 22.4.3-next.1

### Patch Changes

- Updated dependencies [[`64e00a9e30`](https://github.com/LedgerHQ/ledger-live/commit/64e00a9e30cf67b1e34552037e4405379af04a67)]:
  - @ledgerhq/live-common@27.4.0-next.1

## 22.4.3-next.0

### Patch Changes

- Updated dependencies [[`2100b9fb81`](https://github.com/LedgerHQ/ledger-live/commit/2100b9fb81a4fd04f65b96561c0a7d618658843a), [`12d40b578b`](https://github.com/LedgerHQ/ledger-live/commit/12d40b578bee2b52de197b679c3db0299bc9a716), [`bd884848bd`](https://github.com/LedgerHQ/ledger-live/commit/bd884848bd3dc2ef3cb5ea4df0127ff8ec6be8b7), [`2802e2d684`](https://github.com/LedgerHQ/ledger-live/commit/2802e2d6844a7e17127ea7d103fe0d1a45afa032), [`b34e55181c`](https://github.com/LedgerHQ/ledger-live/commit/b34e55181c12bb0a59ef5dee5e808d7597a21edb), [`f6854a3fd7`](https://github.com/LedgerHQ/ledger-live/commit/f6854a3fd79a28eb5507796b69105c85b40bbe98), [`d3dc2c6877`](https://github.com/LedgerHQ/ledger-live/commit/d3dc2c6877fbdcaf68e442a781798d752fc5152d), [`d1aab06a96`](https://github.com/LedgerHQ/ledger-live/commit/d1aab06a966e06269b037b574e51593fe45e987f), [`824efb6e62`](https://github.com/LedgerHQ/ledger-live/commit/824efb6e62b4b042fef700896f0bfd54ccfee5c7)]:
  - @ledgerhq/live-common@27.4.0-next.0
  - @ledgerhq/cryptoassets@6.36.0-next.0

## 22.4.3-hotfix.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@27.3.2

## 22.4.2

### Patch Changes

- Updated dependencies [[`c7e40bfef7`](https://github.com/LedgerHQ/ledger-live/commit/c7e40bfef718b2f806d2f6e942f2ca61b03a0110)]:
  - @ledgerhq/live-common@27.3.2

## 22.4.2-hotfix.0

### Patch Changes

- Updated dependencies [[`c7e40bfef7`](https://github.com/LedgerHQ/ledger-live/commit/c7e40bfef718b2f806d2f6e942f2ca61b03a0110)]:
  - @ledgerhq/live-common@27.3.2-hotfix.0

## 22.4.1

### Patch Changes

- Updated dependencies [[`1a23c232fa`](https://github.com/LedgerHQ/ledger-live/commit/1a23c232fa21557ccd48568f4f577263bd6fc6e6), [`2f473b2fdf`](https://github.com/LedgerHQ/ledger-live/commit/2f473b2fdffbbe8641a90aa9ada5ad1dd048460f), [`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa)]:
  - @ledgerhq/live-common@27.3.1
  - @ledgerhq/cryptoassets@6.35.1
  - @ledgerhq/errors@6.11.1
  - @ledgerhq/hw-app-btc@8.1.1
  - @ledgerhq/hw-transport-http@6.27.6
  - @ledgerhq/hw-transport-mocker@6.27.6
  - @ledgerhq/hw-transport-node-ble@6.27.6
  - @ledgerhq/hw-transport-node-hid@6.27.6
  - @ledgerhq/hw-transport-node-speculos@6.27.6
  - @ledgerhq/hw-transport@6.27.6
  - @ledgerhq/logs@6.10.1

## 22.4.1-next.0

### Patch Changes

- Updated dependencies [[`1a23c232fa`](https://github.com/LedgerHQ/ledger-live/commit/1a23c232fa21557ccd48568f4f577263bd6fc6e6), [`2f473b2fdf`](https://github.com/LedgerHQ/ledger-live/commit/2f473b2fdffbbe8641a90aa9ada5ad1dd048460f), [`ecac411d7a`](https://github.com/LedgerHQ/ledger-live/commit/ecac411d7aad6f4003503ba6259d7c25017ca7aa)]:
  - @ledgerhq/live-common@27.3.1-next.0
  - @ledgerhq/cryptoassets@6.35.1-next.0
  - @ledgerhq/errors@6.11.1-next.0
  - @ledgerhq/hw-app-btc@8.1.1-next.0
  - @ledgerhq/hw-transport-http@6.27.6-next.0
  - @ledgerhq/hw-transport-mocker@6.27.6-next.0
  - @ledgerhq/hw-transport-node-ble@6.27.6-next.0
  - @ledgerhq/hw-transport-node-hid@6.27.6-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.6-next.0
  - @ledgerhq/hw-transport@6.27.6-next.0
  - @ledgerhq/logs@6.10.1-next.0

## 22.4.0

### Minor Changes

- [#742](https://github.com/LedgerHQ/ledger-live/pull/742) [`56068b813c`](https://github.com/LedgerHQ/ledger-live/commit/56068b813ce301a37b9d08bd55273b3d934c7371) Thanks [@grsoares21](https://github.com/grsoares21)! - Adds device action logic for installing and uninstalling language packs

### Patch Changes

- [#1304](https://github.com/LedgerHQ/ledger-live/pull/1304) [`df76dd28c1`](https://github.com/LedgerHQ/ledger-live/commit/df76dd28c15d0cd5b7b57ee3f78aa0bd4170a44a) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix wrong inferences for currencies + add tests to make sure we catch the issue next time

- Updated dependencies [[`671700de22`](https://github.com/LedgerHQ/ledger-live/commit/671700de22dbfe7e59a0bee2b7cae243d5b22260), [`8465b5e317`](https://github.com/LedgerHQ/ledger-live/commit/8465b5e317baecaf8f893b9c090537d2d03ac835), [`41a31a0474`](https://github.com/LedgerHQ/ledger-live/commit/41a31a0474725d51d659142b292629c534b94338), [`5f003287f8`](https://github.com/LedgerHQ/ledger-live/commit/5f003287f85974d160cc230c8e5d7c442b0eb639), [`68a0b01efc`](https://github.com/LedgerHQ/ledger-live/commit/68a0b01efcfd481cb8fe71ec22a2fc7217f25ec9), [`56068b813c`](https://github.com/LedgerHQ/ledger-live/commit/56068b813ce301a37b9d08bd55273b3d934c7371), [`8465b5e317`](https://github.com/LedgerHQ/ledger-live/commit/8465b5e317baecaf8f893b9c090537d2d03ac835), [`900eea7642`](https://github.com/LedgerHQ/ledger-live/commit/900eea7642bda94c71e2a171b90d2b6cd4d6ac4e), [`b4be83ac62`](https://github.com/LedgerHQ/ledger-live/commit/b4be83ac62b3977c16e0c375e26973b05ae4cd9e), [`df76dd28c1`](https://github.com/LedgerHQ/ledger-live/commit/df76dd28c15d0cd5b7b57ee3f78aa0bd4170a44a), [`1a94cbf28a`](https://github.com/LedgerHQ/ledger-live/commit/1a94cbf28aaa2917c70719e22f446148cd66cef6), [`99acc1ad22`](https://github.com/LedgerHQ/ledger-live/commit/99acc1ad22bbb76b91c2cbdc1b8ed67c691b4233), [`8e8db41df4`](https://github.com/LedgerHQ/ledger-live/commit/8e8db41df4319d3406c7f29b8cce18d1b212f12f), [`56068b813c`](https://github.com/LedgerHQ/ledger-live/commit/56068b813ce301a37b9d08bd55273b3d934c7371), [`8fa17173ed`](https://github.com/LedgerHQ/ledger-live/commit/8fa17173ed20415b17bfb6d84e8a14b602516054), [`3d2fa9adbb`](https://github.com/LedgerHQ/ledger-live/commit/3d2fa9adbbd408b4be3748f1d2180e90b83de536), [`4d2149c2dc`](https://github.com/LedgerHQ/ledger-live/commit/4d2149c2dc47058aaf3d6e4bd9739e724103ab9a), [`692feed2b9`](https://github.com/LedgerHQ/ledger-live/commit/692feed2b95a246f43347695c3e8ab6e64ffd1f5), [`4f66046ef7`](https://github.com/LedgerHQ/ledger-live/commit/4f66046ef78ebcd14e6d63639f54834e90e6547a), [`df76dd28c1`](https://github.com/LedgerHQ/ledger-live/commit/df76dd28c15d0cd5b7b57ee3f78aa0bd4170a44a)]:
  - @ledgerhq/live-common@27.3.0
  - @ledgerhq/hw-app-btc@8.1.0
  - @ledgerhq/errors@6.11.0
  - @ledgerhq/cryptoassets@6.35.0
  - @ledgerhq/hw-transport@6.27.5
  - @ledgerhq/hw-transport-http@6.27.5
  - @ledgerhq/hw-transport-node-ble@6.27.5
  - @ledgerhq/hw-transport-node-hid@6.27.5
  - @ledgerhq/hw-transport-node-speculos@6.27.5
  - @ledgerhq/hw-transport-mocker@6.27.5

## 22.4.0-next.1

### Patch Changes

- Updated dependencies [[`692feed2b9`](https://github.com/LedgerHQ/ledger-live/commit/692feed2b95a246f43347695c3e8ab6e64ffd1f5)]:
  - @ledgerhq/live-common@27.3.0-next.1

## 22.4.0-next.0

### Minor Changes

- [#742](https://github.com/LedgerHQ/ledger-live/pull/742) [`56068b813c`](https://github.com/LedgerHQ/ledger-live/commit/56068b813ce301a37b9d08bd55273b3d934c7371) Thanks [@grsoares21](https://github.com/grsoares21)! - Adds device action logic for installing and uninstalling language packs

### Patch Changes

- [#1304](https://github.com/LedgerHQ/ledger-live/pull/1304) [`df76dd28c1`](https://github.com/LedgerHQ/ledger-live/commit/df76dd28c15d0cd5b7b57ee3f78aa0bd4170a44a) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix wrong inferences for currencies + add tests to make sure we catch the issue next time

- Updated dependencies [[`671700de22`](https://github.com/LedgerHQ/ledger-live/commit/671700de22dbfe7e59a0bee2b7cae243d5b22260), [`8465b5e317`](https://github.com/LedgerHQ/ledger-live/commit/8465b5e317baecaf8f893b9c090537d2d03ac835), [`41a31a0474`](https://github.com/LedgerHQ/ledger-live/commit/41a31a0474725d51d659142b292629c534b94338), [`5f003287f8`](https://github.com/LedgerHQ/ledger-live/commit/5f003287f85974d160cc230c8e5d7c442b0eb639), [`68a0b01efc`](https://github.com/LedgerHQ/ledger-live/commit/68a0b01efcfd481cb8fe71ec22a2fc7217f25ec9), [`56068b813c`](https://github.com/LedgerHQ/ledger-live/commit/56068b813ce301a37b9d08bd55273b3d934c7371), [`8465b5e317`](https://github.com/LedgerHQ/ledger-live/commit/8465b5e317baecaf8f893b9c090537d2d03ac835), [`900eea7642`](https://github.com/LedgerHQ/ledger-live/commit/900eea7642bda94c71e2a171b90d2b6cd4d6ac4e), [`b4be83ac62`](https://github.com/LedgerHQ/ledger-live/commit/b4be83ac62b3977c16e0c375e26973b05ae4cd9e), [`df76dd28c1`](https://github.com/LedgerHQ/ledger-live/commit/df76dd28c15d0cd5b7b57ee3f78aa0bd4170a44a), [`1a94cbf28a`](https://github.com/LedgerHQ/ledger-live/commit/1a94cbf28aaa2917c70719e22f446148cd66cef6), [`99acc1ad22`](https://github.com/LedgerHQ/ledger-live/commit/99acc1ad22bbb76b91c2cbdc1b8ed67c691b4233), [`8e8db41df4`](https://github.com/LedgerHQ/ledger-live/commit/8e8db41df4319d3406c7f29b8cce18d1b212f12f), [`56068b813c`](https://github.com/LedgerHQ/ledger-live/commit/56068b813ce301a37b9d08bd55273b3d934c7371), [`8fa17173ed`](https://github.com/LedgerHQ/ledger-live/commit/8fa17173ed20415b17bfb6d84e8a14b602516054), [`3d2fa9adbb`](https://github.com/LedgerHQ/ledger-live/commit/3d2fa9adbbd408b4be3748f1d2180e90b83de536), [`4d2149c2dc`](https://github.com/LedgerHQ/ledger-live/commit/4d2149c2dc47058aaf3d6e4bd9739e724103ab9a), [`4f66046ef7`](https://github.com/LedgerHQ/ledger-live/commit/4f66046ef78ebcd14e6d63639f54834e90e6547a), [`df76dd28c1`](https://github.com/LedgerHQ/ledger-live/commit/df76dd28c15d0cd5b7b57ee3f78aa0bd4170a44a)]:
  - @ledgerhq/live-common@27.3.0-next.0
  - @ledgerhq/hw-app-btc@8.1.0-next.0
  - @ledgerhq/errors@6.11.0-next.0
  - @ledgerhq/cryptoassets@6.35.0-next.0
  - @ledgerhq/hw-transport@6.27.5-next.0
  - @ledgerhq/hw-transport-http@6.27.5-next.0
  - @ledgerhq/hw-transport-node-ble@6.27.5-next.0
  - @ledgerhq/hw-transport-node-hid@6.27.5-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.5-next.0
  - @ledgerhq/hw-transport-mocker@6.27.5-next.0

## 22.3.2

### Patch Changes

- Updated dependencies [[`a089100d37`](https://github.com/LedgerHQ/ledger-live/commit/a089100d37c2057210201e7faccab2c889a57668), [`ae5e33e15e`](https://github.com/LedgerHQ/ledger-live/commit/ae5e33e15e8a107d0ba8a3688a63eda2c0d43ce7), [`d70bb7042a`](https://github.com/LedgerHQ/ledger-live/commit/d70bb7042a01de2191b59337d8a1574e22bd8887)]:
  - @ledgerhq/live-common@27.2.0
  - @ledgerhq/errors@6.10.2
  - @ledgerhq/hw-transport@6.27.4
  - @ledgerhq/hw-transport-http@6.27.4
  - @ledgerhq/hw-transport-node-ble@6.27.4
  - @ledgerhq/hw-transport-node-hid@6.27.4
  - @ledgerhq/hw-transport-node-speculos@6.27.4
  - @ledgerhq/hw-app-btc@8.0.2
  - @ledgerhq/hw-transport-mocker@6.27.4

## 22.3.2-next.0

### Patch Changes

- Updated dependencies [[`a089100d3`](https://github.com/LedgerHQ/ledger-live/commit/a089100d37c2057210201e7faccab2c889a57668), [`ae5e33e15`](https://github.com/LedgerHQ/ledger-live/commit/ae5e33e15e8a107d0ba8a3688a63eda2c0d43ce7), [`d70bb7042`](https://github.com/LedgerHQ/ledger-live/commit/d70bb7042a01de2191b59337d8a1574e22bd8887)]:
  - @ledgerhq/live-common@27.2.0-next.0
  - @ledgerhq/errors@6.10.2-next.0
  - @ledgerhq/hw-transport@6.27.4-next.0
  - @ledgerhq/hw-transport-http@6.27.4-next.0
  - @ledgerhq/hw-transport-node-ble@6.27.4-next.0
  - @ledgerhq/hw-transport-node-hid@6.27.4-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.4-next.0
  - @ledgerhq/hw-app-btc@8.0.2-next.0
  - @ledgerhq/hw-transport-mocker@6.27.4-next.0

## 22.3.1

### Patch Changes

- Updated dependencies [[`0ebdec50b`](https://github.com/LedgerHQ/ledger-live/commit/0ebdec50bfca81b2d814726f8f9a82237ad42ffc), [`b615140ba2`](https://github.com/LedgerHQ/ledger-live/commit/b615140ba2e326e1466d15f123d412ea90db3754), [`7e812a738`](https://github.com/LedgerHQ/ledger-live/commit/7e812a738db718200138dcb9b7bcc2f6dd0ddd6f), [`e80336b28`](https://github.com/LedgerHQ/ledger-live/commit/e80336b28478b3eca7a1c477b43cc512ba38a710), [`058a1af7f`](https://github.com/LedgerHQ/ledger-live/commit/058a1af7ff463d21afe85d03563b61e1d543c95b), [`3849ee3f3`](https://github.com/LedgerHQ/ledger-live/commit/3849ee3f30987b51d648ce29bfee4721f4ddff5f), [`318e80452`](https://github.com/LedgerHQ/ledger-live/commit/318e80452569a0f91c4363ae50d2664419251dbd), [`336eb879a`](https://github.com/LedgerHQ/ledger-live/commit/336eb879a80573fd81027232c4c6c9b383bd2a97), [`f228bbdf0`](https://github.com/LedgerHQ/ledger-live/commit/f228bbdf063640770d3baa71ea610483c7380a72), [`d6634bc0b`](https://github.com/LedgerHQ/ledger-live/commit/d6634bc0b720d8a13f3681caf33e2f23d5c64968), [`685348dd3`](https://github.com/LedgerHQ/ledger-live/commit/685348dd351181a9ed7f23cedb3e3d289b16fe9e), [`5da717c52`](https://github.com/LedgerHQ/ledger-live/commit/5da717c523db7678edeb0f86bdfa88256dfe96c4), [`dd538c372`](https://github.com/LedgerHQ/ledger-live/commit/dd538c3723853334ce19a89353f20766432d12fd), [`0601b6541`](https://github.com/LedgerHQ/ledger-live/commit/0601b6541f10635aea72f916626432a334aa49fa), [`3615a06f1`](https://github.com/LedgerHQ/ledger-live/commit/3615a06f19ef659480d50a1a1a28f6df952b117a), [`e80336b28`](https://github.com/LedgerHQ/ledger-live/commit/e80336b28478b3eca7a1c477b43cc512ba38a710), [`5dd957b3c`](https://github.com/LedgerHQ/ledger-live/commit/5dd957b3cb893668f044497d25b6eee69b05b2f0), [`8fe44e12d`](https://github.com/LedgerHQ/ledger-live/commit/8fe44e12d73fe96636282666dd8f3b02ef96d0e6), [`21ed0bd52`](https://github.com/LedgerHQ/ledger-live/commit/21ed0bd5219a3629abc0bbb547fc4d75f5e71300)]:
  - @ledgerhq/live-common@27.1.0
  - @ledgerhq/cryptoassets@6.34.0

## 22.3.1-next.6

### Patch Changes

- Updated dependencies [[`3849ee3f30`](https://github.com/LedgerHQ/ledger-live/commit/3849ee3f30987b51d648ce29bfee4721f4ddff5f)]:
  - @ledgerhq/live-common@27.1.0-next.6

## 22.3.1-next.5

### Patch Changes

- Updated dependencies [[`936b6dc545`](https://github.com/LedgerHQ/ledger-live/commit/936b6dc5450fcd69a31e03fa2040346d512c0912)]:
  - @ledgerhq/live-common@27.1.0-next.5

## 22.3.1-next.4

### Patch Changes

- Updated dependencies [[`0ebdec50bf`](https://github.com/LedgerHQ/ledger-live/commit/0ebdec50bfca81b2d814726f8f9a82237ad42ffc)]:
  - @ledgerhq/live-common@27.1.0-next.4

## 22.3.1-next.3

### Patch Changes

- Updated dependencies [[`685348dd35`](https://github.com/LedgerHQ/ledger-live/commit/685348dd351181a9ed7f23cedb3e3d289b16fe9e), [`dd538c3723`](https://github.com/LedgerHQ/ledger-live/commit/dd538c3723853334ce19a89353f20766432d12fd), [`0601b6541f`](https://github.com/LedgerHQ/ledger-live/commit/0601b6541f10635aea72f916626432a334aa49fa)]:
  - @ledgerhq/live-common@27.1.0-next.3

## 22.3.1-next.2

### Patch Changes

- Updated dependencies [[`8fe44e12d7`](https://github.com/LedgerHQ/ledger-live/commit/8fe44e12d73fe96636282666dd8f3b02ef96d0e6), [`21ed0bd521`](https://github.com/LedgerHQ/ledger-live/commit/21ed0bd5219a3629abc0bbb547fc4d75f5e71300)]:
  - @ledgerhq/live-common@27.1.0-next.2

## 22.3.1-next.1

### Patch Changes

- Updated dependencies [[`b615140ba2`](https://github.com/LedgerHQ/ledger-live/commit/b615140ba2e326e1466d15f123d412ea90db3754), [`336eb879a8`](https://github.com/LedgerHQ/ledger-live/commit/336eb879a80573fd81027232c4c6c9b383bd2a97), [`3615a06f19`](https://github.com/LedgerHQ/ledger-live/commit/3615a06f19ef659480d50a1a1a28f6df952b117a)]:
  - @ledgerhq/live-common@27.1.0-next.1
  - @ledgerhq/cryptoassets@6.34.0-next.1

## 22.3.1-next.0

### Patch Changes

- Updated dependencies [[`7e812a738d`](https://github.com/LedgerHQ/ledger-live/commit/7e812a738db718200138dcb9b7bcc2f6dd0ddd6f), [`e80336b284`](https://github.com/LedgerHQ/ledger-live/commit/e80336b28478b3eca7a1c477b43cc512ba38a710), [`058a1af7ff`](https://github.com/LedgerHQ/ledger-live/commit/058a1af7ff463d21afe85d03563b61e1d543c95b), [`318e804525`](https://github.com/LedgerHQ/ledger-live/commit/318e80452569a0f91c4363ae50d2664419251dbd), [`d6634bc0b7`](https://github.com/LedgerHQ/ledger-live/commit/d6634bc0b720d8a13f3681caf33e2f23d5c64968), [`5da717c523`](https://github.com/LedgerHQ/ledger-live/commit/5da717c523db7678edeb0f86bdfa88256dfe96c4), [`e80336b284`](https://github.com/LedgerHQ/ledger-live/commit/e80336b28478b3eca7a1c477b43cc512ba38a710), [`5dd957b3cb`](https://github.com/LedgerHQ/ledger-live/commit/5dd957b3cb893668f044497d25b6eee69b05b2f0)]:
  - @ledgerhq/live-common@27.0.1-next.0
  - @ledgerhq/cryptoassets@6.34.0-next.0

## 22.3.0

### Minor Changes

- [#492](https://github.com/LedgerHQ/ledger-live/pull/492) [`d679e5feeb`](https://github.com/LedgerHQ/ledger-live/commit/d679e5feebc02e7cd138e1026b7bad5392866ea2) Thanks [@grsoares21](https://github.com/grsoares21)! - Adds device action logic for installing and uninstalling language packs

* [#723](https://github.com/LedgerHQ/ledger-live/pull/723) [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1) Thanks [@marco-figment](https://github.com/marco-figment)! - Osmosis Send, Receive and Staking + Cosmos refactor

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

- Updated dependencies [[`d679e5feeb`](https://github.com/LedgerHQ/ledger-live/commit/d679e5feebc02e7cd138e1026b7bad5392866ea2), [`c7aaafa769`](https://github.com/LedgerHQ/ledger-live/commit/c7aaafa76924252f3c7e30371012bd0e69d8100a), [`f47b2b1f47`](https://github.com/LedgerHQ/ledger-live/commit/f47b2b1f47c2256ad006ed35db9a0935e87cd503), [`a36d1de865`](https://github.com/LedgerHQ/ledger-live/commit/a36d1de865fd318051c46335d1c86f5cf12b2100), [`6e057f7163`](https://github.com/LedgerHQ/ledger-live/commit/6e057f7163dc53658604429e3e6c8057ae9988f4), [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1), [`ecfdd1ebd8`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311)]:
  - @ledgerhq/live-common@27.0.0
  - @ledgerhq/cryptoassets@6.33.0
  - @ledgerhq/hw-transport@6.27.3
  - @ledgerhq/hw-app-btc@8.0.1
  - @ledgerhq/hw-transport-http@6.27.3
  - @ledgerhq/hw-transport-mocker@6.27.3
  - @ledgerhq/hw-transport-node-ble@6.27.3
  - @ledgerhq/hw-transport-node-hid@6.27.3
  - @ledgerhq/hw-transport-node-speculos@6.27.3

## 22.3.0-next.3

### Patch Changes

- Updated dependencies [[`f47b2b1f47`](https://github.com/LedgerHQ/ledger-live/commit/f47b2b1f47c2256ad006ed35db9a0935e87cd503)]:
  - @ledgerhq/live-common@27.0.0-next.3

## 22.3.0-next.2

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

- Updated dependencies [[`a36d1de865`](https://github.com/LedgerHQ/ledger-live/commit/a36d1de865fd318051c46335d1c86f5cf12b2100), [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1)]:
  - @ledgerhq/live-common@27.0.0-next.2
  - @ledgerhq/cryptoassets@6.33.0-next.0

## 22.3.0-next.1

### Minor Changes

- [#492](https://github.com/LedgerHQ/ledger-live/pull/492) [`d679e5feeb`](https://github.com/LedgerHQ/ledger-live/commit/d679e5feebc02e7cd138e1026b7bad5392866ea2) Thanks [@grsoares21](https://github.com/grsoares21)! - Adds device action logic for installing and uninstalling language packs

### Patch Changes

- Updated dependencies [[`d679e5feeb`](https://github.com/LedgerHQ/ledger-live/commit/d679e5feebc02e7cd138e1026b7bad5392866ea2)]:
  - @ledgerhq/live-common@26.1.0-next.1

## 22.2.1-next.0

### Patch Changes

- Updated dependencies [[`23c9bf994`](https://github.com/LedgerHQ/ledger-live/commit/23c9bf9949169d31d534f12dca48e21e35df05b2), [`6e057f716`](https://github.com/LedgerHQ/ledger-live/commit/6e057f7163dc53658604429e3e6c8057ae9988f4), [`ecfdd1ebd`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311)]:
  - @ledgerhq/live-common@26.1.0-next.0
  - @ledgerhq/hw-transport@6.27.3-next.0
  - @ledgerhq/hw-app-btc@8.0.1-next.0
  - @ledgerhq/hw-transport-http@6.27.3-next.0
  - @ledgerhq/hw-transport-mocker@6.27.3-next.0
  - @ledgerhq/hw-transport-node-ble@6.27.3-next.0
  - @ledgerhq/hw-transport-node-hid@6.27.3-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.3-next.0

## 22.2.0

### Minor Changes

- [#451](https://github.com/LedgerHQ/ledger-live/pull/451) [`134355d561`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Type libraries usage in LLC, LLD, LLM, CLI

* [#723](https://github.com/LedgerHQ/ledger-live/pull/723) [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1) Thanks [@marco-figment](https://github.com/marco-figment)! - Osmosis Send, Receive and Staking + Cosmos refactor

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

- [#882](https://github.com/LedgerHQ/ledger-live/pull/882) [`807f3feb94`](https://github.com/LedgerHQ/ledger-live/commit/807f3feb947ffd31d47d43b5aa7b8e85f2bbf6d8) Thanks [@Justkant](https://github.com/Justkant)! - fix: bump platform API version [LIVE-3181]

- Updated dependencies [[`37159cbb9e`](https://github.com/LedgerHQ/ledger-live/commit/37159cbb9e0023b65593e4ed71557f80bf48989e), [`ebe1adfb7d`](https://github.com/LedgerHQ/ledger-live/commit/ebe1adfb7d264da0f8c9e30b84c188eaa931d1e6), [`3dbd4d0781`](https://github.com/LedgerHQ/ledger-live/commit/3dbd4d0781569cd0bfce575854e706def2bd951f), [`1a33d8641f`](https://github.com/LedgerHQ/ledger-live/commit/1a33d8641f9d1b4e4adfa262a179f124918e0ff5), [`807f3feb94`](https://github.com/LedgerHQ/ledger-live/commit/807f3feb947ffd31d47d43b5aa7b8e85f2bbf6d8), [`134355d561`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4), [`a36d1de865`](https://github.com/LedgerHQ/ledger-live/commit/a36d1de865fd318051c46335d1c86f5cf12b2100), [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1), [`f4b7894426`](https://github.com/LedgerHQ/ledger-live/commit/f4b7894426341f5b909ba3a2422ae2b8ecf31466), [`97eab434de`](https://github.com/LedgerHQ/ledger-live/commit/97eab434dee361716588b256146665c99c274af9), [`e2a9cfad63`](https://github.com/LedgerHQ/ledger-live/commit/e2a9cfad63f3c8fddf4660942a53545eabb03d6b)]:
  - @ledgerhq/live-common@26.0.0
  - @ledgerhq/cryptoassets@6.32.0

## 22.2.0-next.2

### Patch Changes

- Updated dependencies [[`a36d1de86`](https://github.com/LedgerHQ/ledger-live/commit/a36d1de865fd318051c46335d1c86f5cf12b2100)]:
  - @ledgerhq/live-common@26.0.0-next.2

## 22.2.0-next.1

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
  - @ledgerhq/live-common@25.2.0-next.1
  - @ledgerhq/cryptoassets@6.32.0-next.1

## 22.2.0-next.0

### Minor Changes

- [#451](https://github.com/LedgerHQ/ledger-live/pull/451) [`134355d56`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Type libraries usage in LLC, LLD, LLM, CLI

### Patch Changes

- [#882](https://github.com/LedgerHQ/ledger-live/pull/882) [`807f3feb9`](https://github.com/LedgerHQ/ledger-live/commit/807f3feb947ffd31d47d43b5aa7b8e85f2bbf6d8) Thanks [@Justkant](https://github.com/Justkant)! - fix: bump platform API version [LIVE-3181]

- Updated dependencies [[`37159cbb9`](https://github.com/LedgerHQ/ledger-live/commit/37159cbb9e0023b65593e4ed71557f80bf48989e), [`ebe1adfb7`](https://github.com/LedgerHQ/ledger-live/commit/ebe1adfb7d264da0f8c9e30b84c188eaa931d1e6), [`3dbd4d078`](https://github.com/LedgerHQ/ledger-live/commit/3dbd4d0781569cd0bfce575854e706def2bd951f), [`1a33d8641`](https://github.com/LedgerHQ/ledger-live/commit/1a33d8641f9d1b4e4adfa262a179f124918e0ff5), [`807f3feb9`](https://github.com/LedgerHQ/ledger-live/commit/807f3feb947ffd31d47d43b5aa7b8e85f2bbf6d8), [`134355d56`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4), [`f4b789442`](https://github.com/LedgerHQ/ledger-live/commit/f4b7894426341f5b909ba3a2422ae2b8ecf31466), [`97eab434d`](https://github.com/LedgerHQ/ledger-live/commit/97eab434dee361716588b256146665c99c274af9), [`e2a9cfad6`](https://github.com/LedgerHQ/ledger-live/commit/e2a9cfad63f3c8fddf4660942a53545eabb03d6b)]:
  - @ledgerhq/live-common@25.2.0-next.0
  - @ledgerhq/cryptoassets@6.32.0-next.0

## 22.1.1

### Patch Changes

- Updated dependencies [[`f10d01171`](https://github.com/LedgerHQ/ledger-live/commit/f10d01171f4c0869d1d82e6cc5402da9ca80990b), [`aa2794813`](https://github.com/LedgerHQ/ledger-live/commit/aa2794813c05b1b39272814cc803cd662662584c), [`8afb69530`](https://github.com/LedgerHQ/ledger-live/commit/8afb69530292fa1f41f2fc78b38639134b1fe16f), [`0e115ae5c`](https://github.com/LedgerHQ/ledger-live/commit/0e115ae5cd7ddcc728d9f435dc4084cedb53beed), [`3eeb1e18c`](https://github.com/LedgerHQ/ledger-live/commit/3eeb1e18c883eca22201fb0d882799e2f6667b58), [`3bdbfd3cb`](https://github.com/LedgerHQ/ledger-live/commit/3bdbfd3cbc0153a2ebf4ab91f631cb9f6e42d74c), [`331794cfb`](https://github.com/LedgerHQ/ledger-live/commit/331794cfbdb901f9224fed759c57f419861ec364)]:
  - @ledgerhq/live-common@25.1.0
  - @ledgerhq/cryptoassets@6.31.0

## 22.1.1-next.2

### Patch Changes

- Updated dependencies [[`3bdbfd3cb`](https://github.com/LedgerHQ/ledger-live/commit/3bdbfd3cbc0153a2ebf4ab91f631cb9f6e42d74c)]:
  - @ledgerhq/live-common@25.1.0-next.2

## 22.1.1-next.1

### Patch Changes

- Updated dependencies [[`0e115ae5c`](https://github.com/LedgerHQ/ledger-live/commit/0e115ae5cd7ddcc728d9f435dc4084cedb53beed)]:
  - @ledgerhq/live-common@25.1.0-next.1

## 22.1.1-next.0

### Patch Changes

- Updated dependencies [[`f10d01171`](https://github.com/LedgerHQ/ledger-live/commit/f10d01171f4c0869d1d82e6cc5402da9ca80990b), [`aa2794813`](https://github.com/LedgerHQ/ledger-live/commit/aa2794813c05b1b39272814cc803cd662662584c), [`8afb69530`](https://github.com/LedgerHQ/ledger-live/commit/8afb69530292fa1f41f2fc78b38639134b1fe16f), [`3eeb1e18c`](https://github.com/LedgerHQ/ledger-live/commit/3eeb1e18c883eca22201fb0d882799e2f6667b58), [`331794cfb`](https://github.com/LedgerHQ/ledger-live/commit/331794cfbdb901f9224fed759c57f419861ec364)]:
  - @ledgerhq/live-common@25.0.1-next.0
  - @ledgerhq/cryptoassets@6.31.0-next.0

## 22.1.0

### Minor Changes

- [#676](https://github.com/LedgerHQ/ledger-live/pull/676) [`55bcd848d`](https://github.com/LedgerHQ/ledger-live/commit/55bcd848d60f70f8152537e20faa24158fefbda9) Thanks [@LFBarreto](https://github.com/LFBarreto)! - CLI - add solana to list of supported currencies

### Patch Changes

- [#81](https://github.com/LedgerHQ/ledger-live/pull/81) [`76b2825e8`](https://github.com/LedgerHQ/ledger-live/commit/76b2825e84730e9d5a2f7906abd7c00a191de4db) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - feat: add ERC20 token support to the Platform API

* [#364](https://github.com/LedgerHQ/ledger-live/pull/364) [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8) Thanks [@elbywan](https://github.com/elbywan)! - #### Replace [webpack](https://webpack.js.org/) with [vite.js](https://vitejs.dev/) to speed up the ledger live desktop development process.

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

* Updated dependencies [[`345706e24`](https://github.com/LedgerHQ/ledger-live/commit/345706e24e91ba4c397d4a6ffc1b2b174a0ddc84), [`2de4b99c0`](https://github.com/LedgerHQ/ledger-live/commit/2de4b99c0c36766474d5ea037615f9f69942e905), [`e142b9484`](https://github.com/LedgerHQ/ledger-live/commit/e142b9484e6371539fb392c002e1ebaf7802542b), [`816f2b7e9`](https://github.com/LedgerHQ/ledger-live/commit/816f2b7e942967bf0ed670dc43464521bd0b5d01), [`7c15869a7`](https://github.com/LedgerHQ/ledger-live/commit/7c15869a7a2cf74f849f8cf0fe13b66133ff673a), [`e4b7dc326`](https://github.com/LedgerHQ/ledger-live/commit/e4b7dc32664d32b43dfae2821c29715ae94a6ab4), [`76b2825e8`](https://github.com/LedgerHQ/ledger-live/commit/76b2825e84730e9d5a2f7906abd7c00a191de4db), [`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f), [`947c33140`](https://github.com/LedgerHQ/ledger-live/commit/947c33140e906ca35bf1fbfdf7831e28fe99dd67), [`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0), [`6adbe47e2`](https://github.com/LedgerHQ/ledger-live/commit/6adbe47e2d3037a9a53e5a59b4198f265f644bdf), [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/live-common@25.0.0
  - @ledgerhq/cryptoassets@6.30.0
  - @ledgerhq/errors@6.10.1
  - @ledgerhq/hw-app-btc@8.0.0
  - @ledgerhq/hw-transport-node-ble@6.27.2
  - @ledgerhq/hw-transport@6.27.2
  - @ledgerhq/hw-transport-http@6.27.2
  - @ledgerhq/hw-transport-node-hid@6.27.2
  - @ledgerhq/hw-transport-node-speculos@6.27.2
  - @ledgerhq/hw-transport-mocker@6.27.2

## 22.1.0-next.6

### Patch Changes

- Updated dependencies [[`947c33140`](https://github.com/LedgerHQ/ledger-live/commit/947c33140e906ca35bf1fbfdf7831e28fe99dd67)]:
  - @ledgerhq/live-common@25.0.0-next.6

## 22.1.0-next.5

### Patch Changes

- Updated dependencies [[`816f2b7e9`](https://github.com/LedgerHQ/ledger-live/commit/816f2b7e942967bf0ed670dc43464521bd0b5d01)]:
  - @ledgerhq/live-common@25.0.0-next.5
  - @ledgerhq/cryptoassets@6.30.0-next.2

## 22.1.0-next.4

### Patch Changes

- Updated dependencies [[`6adbe47e2`](https://github.com/LedgerHQ/ledger-live/commit/6adbe47e2d3037a9a53e5a59b4198f265f644bdf)]:
  - @ledgerhq/live-common@25.0.0-next.4

## 22.1.0-next.3

### Patch Changes

- [#81](https://github.com/LedgerHQ/ledger-live/pull/81) [`76b2825e8`](https://github.com/LedgerHQ/ledger-live/commit/76b2825e84730e9d5a2f7906abd7c00a191de4db) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - feat: add ERC20 token support to the Platform API

- Updated dependencies [[`76b2825e8`](https://github.com/LedgerHQ/ledger-live/commit/76b2825e84730e9d5a2f7906abd7c00a191de4db)]:
  - @ledgerhq/live-common@25.0.0-next.3

## 22.1.0-next.2

### Patch Changes

- Updated dependencies [[`345706e24`](https://github.com/LedgerHQ/ledger-live/commit/345706e24e91ba4c397d4a6ffc1b2b174a0ddc84)]:
  - @ledgerhq/live-common@25.0.0-next.2

## 22.1.0-next.1

### Patch Changes

- Updated dependencies [[`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0)]:
  - @ledgerhq/live-common@25.0.0-next.1
  - @ledgerhq/cryptoassets@6.30.0-next.1

## 22.1.0-next.0

### Minor Changes

- [#676](https://github.com/LedgerHQ/ledger-live/pull/676) [`55bcd848d`](https://github.com/LedgerHQ/ledger-live/commit/55bcd848d60f70f8152537e20faa24158fefbda9) Thanks [@LFBarreto](https://github.com/LFBarreto)! - CLI - add solana to list of supported currencies

### Patch Changes

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

- Updated dependencies [[`2de4b99c0`](https://github.com/LedgerHQ/ledger-live/commit/2de4b99c0c36766474d5ea037615f9f69942e905), [`e142b9484`](https://github.com/LedgerHQ/ledger-live/commit/e142b9484e6371539fb392c002e1ebaf7802542b), [`7c15869a7`](https://github.com/LedgerHQ/ledger-live/commit/7c15869a7a2cf74f849f8cf0fe13b66133ff673a), [`e4b7dc326`](https://github.com/LedgerHQ/ledger-live/commit/e4b7dc32664d32b43dfae2821c29715ae94a6ab4), [`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f), [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/live-common@25.0.0-next.0
  - @ledgerhq/cryptoassets@6.30.0-next.0
  - @ledgerhq/errors@6.10.1-next.0
  - @ledgerhq/hw-app-btc@8.0.0-next.0
  - @ledgerhq/hw-transport-node-ble@6.27.2-next.0
  - @ledgerhq/hw-transport@6.27.2-next.0
  - @ledgerhq/hw-transport-http@6.27.2-next.0
  - @ledgerhq/hw-transport-node-hid@6.27.2-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.2-next.0
  - @ledgerhq/hw-transport-mocker@6.27.2-next.0

## 22.0.3

### Patch Changes

- Updated dependencies [[`89387dee6`](https://github.com/LedgerHQ/ledger-live/commit/89387dee6dfc2a63fa29665ab5524f3950d3ce0e), [`60fb9efdc`](https://github.com/LedgerHQ/ledger-live/commit/60fb9efdcc9dbf72f651fd7b388d175a12bf859b), [`3969bac02`](https://github.com/LedgerHQ/ledger-live/commit/3969bac02d6028ff543e61d4b67d95a6bfb14dfe), [`414fa596a`](https://github.com/LedgerHQ/ledger-live/commit/414fa596a88aafdce676ac3fb349f41f302ea860), [`4c02cf2e0`](https://github.com/LedgerHQ/ledger-live/commit/4c02cf2e0c393ad8d9cc5339e7b63eefb297e2cb)]:
  - @ledgerhq/hw-app-btc@7.0.0
  - @ledgerhq/live-common@24.1.0

## 22.0.3-next.1

### Patch Changes

- Updated dependencies [[`4c02cf2e0`](https://github.com/LedgerHQ/ledger-live/commit/4c02cf2e0c393ad8d9cc5339e7b63eefb297e2cb)]:
  - @ledgerhq/live-common@24.1.0-next.1

## 22.0.3-next.0

### Patch Changes

- Updated dependencies [[`89387dee6`](https://github.com/LedgerHQ/ledger-live/commit/89387dee6dfc2a63fa29665ab5524f3950d3ce0e), [`60fb9efdc`](https://github.com/LedgerHQ/ledger-live/commit/60fb9efdcc9dbf72f651fd7b388d175a12bf859b), [`3969bac02`](https://github.com/LedgerHQ/ledger-live/commit/3969bac02d6028ff543e61d4b67d95a6bfb14dfe), [`414fa596a`](https://github.com/LedgerHQ/ledger-live/commit/414fa596a88aafdce676ac3fb349f41f302ea860)]:
  - @ledgerhq/hw-app-btc@7.0.0-next.0
  - @ledgerhq/live-common@24.1.0-next.0

## 22.0.2

### Patch Changes

- [#199](https://github.com/LedgerHQ/ledger-live/pull/199) [`22531f3c3`](https://github.com/LedgerHQ/ledger-live/commit/22531f3c377191d56bc5d5635f1174fb32b01957) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Update expected steps labels for Cosmos device actions

* [#369](https://github.com/LedgerHQ/ledger-live/pull/369) [`0616fe75d`](https://github.com/LedgerHQ/ledger-live/commit/0616fe75d6f15905fc588dfb83ef33b27adcf26c) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix WS message now possibly being a Buffer instead of a string

* Updated dependencies [[`99cc5bbc1`](https://github.com/LedgerHQ/ledger-live/commit/99cc5bbc10d2676ad3e621577fdbcf432d1c91a2), [`22531f3c3`](https://github.com/LedgerHQ/ledger-live/commit/22531f3c377191d56bc5d5635f1174fb32b01957), [`6e956f22b`](https://github.com/LedgerHQ/ledger-live/commit/6e956f22bdf96f7a902b48a8cd231a34053d459b), [`c5714333b`](https://github.com/LedgerHQ/ledger-live/commit/c5714333bdb1c90a29c20c7e5793184d89967142), [`d22452817`](https://github.com/LedgerHQ/ledger-live/commit/d224528174313bc4975e62d015adf928d4315620), [`5145781e5`](https://github.com/LedgerHQ/ledger-live/commit/5145781e599fcb64be13695620988951bb805a3e), [`bdc76d75f`](https://github.com/LedgerHQ/ledger-live/commit/bdc76d75f9643129384c76ac9868e160c4b52062), [`2012b5477`](https://github.com/LedgerHQ/ledger-live/commit/2012b54773b6391f353903564a247ad02be1a296), [`10440ec3c`](https://github.com/LedgerHQ/ledger-live/commit/10440ec3c2bffa7ce8636a7838680bb3501ffe0d), [`e1f2f07a2`](https://github.com/LedgerHQ/ledger-live/commit/e1f2f07a2ba1de5eab6fa10c4c800b7097c8037d), [`99cc5bbc1`](https://github.com/LedgerHQ/ledger-live/commit/99cc5bbc10d2676ad3e621577fdbcf432d1c91a2), [`1e4a5647b`](https://github.com/LedgerHQ/ledger-live/commit/1e4a5647b39c0f806bc311383b49a246fbe453eb), [`508e4c23b`](https://github.com/LedgerHQ/ledger-live/commit/508e4c23babd04c48e7b626ef4004fb55f3c1ba9), [`b1e396dd8`](https://github.com/LedgerHQ/ledger-live/commit/b1e396dd89ca2787978dc7e53b7ca865133a1961), [`e9decc277`](https://github.com/LedgerHQ/ledger-live/commit/e9decc27785fb07972460494c8ef39e92b0127a1)]:
  - @ledgerhq/live-common@24.0.0
  - @ledgerhq/cryptoassets@6.29.0

## 22.0.2-next.4

### Patch Changes

- Updated dependencies [[`bdc76d75f`](https://github.com/LedgerHQ/ledger-live/commit/bdc76d75f9643129384c76ac9868e160c4b52062)]:
  - @ledgerhq/live-common@24.0.0-next.4

## 22.0.2-next.3

### Patch Changes

- Updated dependencies [5145781e5]
  - @ledgerhq/live-common@24.0.0-next.3

## 22.0.2-next.2

### Patch Changes

- Updated dependencies [c5714333b]
  - @ledgerhq/live-common@24.0.0-next.2

## 22.0.2-next.1

### Patch Changes

- Updated dependencies [99cc5bbc1]
- Updated dependencies [99cc5bbc1]
  - @ledgerhq/live-common@24.0.0-next.1

## 22.0.2-next.0

### Patch Changes

- 22531f3c3: Update expected steps labels for Cosmos device actions
- 0616fe75d: Fix WS message now possibly being a Buffer instead of a string
- Updated dependencies [22531f3c3]
- Updated dependencies [6e956f22b]
- Updated dependencies [d22452817]
- Updated dependencies [2012b5477]
- Updated dependencies [10440ec3c]
- Updated dependencies [e1f2f07a2]
- Updated dependencies [1e4a5647b]
- Updated dependencies [508e4c23b]
- Updated dependencies [b1e396dd8]
- Updated dependencies [e9decc277]
  - @ledgerhq/live-common@24.0.0-next.0
  - @ledgerhq/cryptoassets@6.29.0-next.0

## 22.0.1

### Patch Changes

- Updated dependencies [8323d2eaa]
- Updated dependencies [bf12e0f65]
- Updated dependencies [8861c4fe0]
- Updated dependencies [ec5c4fa3d]
- Updated dependencies [608010c9d]
- Updated dependencies [78a64769d]
  - @ledgerhq/live-common@23.1.0

## 22.0.1-next.4

### Patch Changes

- Updated dependencies [78a64769d]
  - @ledgerhq/live-common@23.1.0-next.4

## 22.0.1-next.3

### Patch Changes

- Updated dependencies [ec5c4fa3d]
  - @ledgerhq/live-common@23.1.0-next.3

## 22.0.1-next.2

### Patch Changes

- Updated dependencies [bf12e0f65]
  - @ledgerhq/live-common@23.1.0-next.2

## 22.0.1-next.1

### Patch Changes

- Updated dependencies [608010c9d]
  - @ledgerhq/live-common@23.1.0-next.1

## 22.0.1-next.0

### Patch Changes

- Updated dependencies [8323d2eaa]
- Updated dependencies [8861c4fe0]
  - @ledgerhq/live-common@23.1.0-next.0

## 22.0.0

### Major Changes

- 77aa0a570: extracted live-cli to it's own module

### Minor Changes

- 98ecc6272: First integration of Cardano (sync/send/receive)
- c4be045f9: Add support for EIP712
- 64c2fdb06: Filecoin integration in LLD and LLM

### Patch Changes

- 994a1da8f: fix verify flag for getAddress CLI command
- Updated dependencies [09648db7f]
- Updated dependencies [a66fbe852]
- Updated dependencies [0f59cfc10]
- Updated dependencies [8ee9c5568]
- Updated dependencies [899aa3300]
- Updated dependencies [89e82ed79]
- Updated dependencies [403ea8efe]
- Updated dependencies [98ecc6272]
- Updated dependencies [9a86fe231]
- Updated dependencies [8b2e24b6c]
- Updated dependencies [64c2fdb06]
- Updated dependencies [b688a592d]
- Updated dependencies [71ad84023]
- Updated dependencies [64c2fdb06]
  - @ledgerhq/live-common@23.0.0

## 22.0.0-next.4

### Patch Changes

- Updated dependencies [8b2e24b6c]
  - @ledgerhq/live-common@23.0.0-next.4

## 22.0.0-next.3

### Patch Changes

- Updated dependencies [a66fbe852]
  - @ledgerhq/live-common@23.0.0-next.3

## 22.0.0-next.2

### Patch Changes

- Updated dependencies [8ee9c5568]
  - @ledgerhq/live-common@23.0.0-next.2

## 22.0.0-next.1

### Minor Changes

- 98ecc6272: First integration of Cardano (sync/send/receive)

### Patch Changes

- Updated dependencies [98ecc6272]
  - @ledgerhq/live-common@23.0.0-next.1

## 22.0.0-next.0

### Major Changes

- 77aa0a570: extracted live-cli to it's own module

### Minor Changes

- c4be045f9: Add support for EIP712
- 64c2fdb06: Filecoin integration in LLD and LLM

### Patch Changes

- 994a1da8f: fix verify flag for getAddress CLI command
- Updated dependencies [09648db7f]
- Updated dependencies [0f59cfc10]
- Updated dependencies [899aa3300]
- Updated dependencies [89e82ed79]
- Updated dependencies [403ea8efe]
- Updated dependencies [9a86fe231]
- Updated dependencies [64c2fdb06]
- Updated dependencies [b688a592d]
- Updated dependencies [71ad84023]
- Updated dependencies [64c2fdb06]
  - @ledgerhq/live-common@23.0.0-next.0

## 21.33.0

### Minor Changes

- 0252fab71: LIVE-1004 Hedera first integration in LLD

### Patch Changes

- Updated dependencies [e0c187073]
- Updated dependencies [ee44ffb17]
- Updated dependencies [0252fab71]
- Updated dependencies [3f816efba]
- Updated dependencies [f2574d25d]
- Updated dependencies [f913f6fdb]
- Updated dependencies [9dadffa88]
- Updated dependencies [04ad3813d]
  - @ledgerhq/live-common@22.2.0

## 21.33.0-next.2

### Patch Changes

- Updated dependencies [9dadffa88]
  - @ledgerhq/live-common@22.2.0-next.2

## 21.33.0-next.1

### Patch Changes

- Updated dependencies [04ad3813d]
  - @ledgerhq/live-common@22.2.0-next.1

## 21.33.0-next.0

### Minor Changes

- 0252fab7: LIVE-1004 Hedera first integration in LLD

### Patch Changes

- Updated dependencies [e0c18707]
- Updated dependencies [ee44ffb1]
- Updated dependencies [0252fab7]
- Updated dependencies [3f816efb]
- Updated dependencies [f2574d25]
- Updated dependencies [f913f6fd]
  - @ledgerhq/live-common@22.2.0-next.0
