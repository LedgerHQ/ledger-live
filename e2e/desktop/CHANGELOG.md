# ledger-live-desktop-e2e-tests

## 0.39.0-next.2

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@37.5.0-next.2
  - @ledgerhq/live-cli@26.3.4-next.2
  - @ledgerhq/live-e2e-shared@0.10.0-next.2

## 0.39.0-next.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@37.5.0-next.1
  - @ledgerhq/live-cli@26.3.4-next.1
  - @ledgerhq/live-e2e-shared@0.10.0-next.1

## 0.39.0-next.0

### Minor Changes

- [#21331](https://github.com/LedgerHQ/ledger-live/pull/21331) [`7e9416b`](https://github.com/LedgerHQ/ledger-live/commit/7e9416b629ae3cf4cf6da97b5a50e1197a2a101c) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Remove dead code from the e2e test suites: page-object methods and locators with no callers are deleted, members used only inside their own class are made `private`, and symbols exported but only referenced in their own file lose the `export`. Two empty page classes left behind by the sweep (`portfolioEmptyState.page.ts`, `transferMenu.drawer.ts`) are removed along with their `Application` wiring.

  Also fixes `e2e/mobile/scripts/typecheck.js`, which passed the raw `tsconfig.json` to `parseJsonConfigFileContent` and so never resolved the `extends` chain. It reported 466 phantom errors on a clean tree, which hid real ones — including the `app.<page>.<method>()` calls that break at runtime with `TypeError: ... is not a function` when a page-object method is deleted while a caller in `e2e/mobile/models/` remains. It now uses `getParsedCommandLineOfConfigFile` and reports clean.

### Patch Changes

- Updated dependencies [[`f9be984`](https://github.com/LedgerHQ/ledger-live/commit/f9be984dd27742c065981d4cebf25ba3e564f48a), [`0b024e8`](https://github.com/LedgerHQ/ledger-live/commit/0b024e8214eb3635d42c18986aa983bd1501c985), [`5e45fdd`](https://github.com/LedgerHQ/ledger-live/commit/5e45fddee9f3483ac3daa7b93f58b01e725e6d4b), [`7249fa2`](https://github.com/LedgerHQ/ledger-live/commit/7249fa2564e028a3e557ce97d63a362b0dd96a92), [`a6e4ace`](https://github.com/LedgerHQ/ledger-live/commit/a6e4ace0712d14b9a0465c123ce88bcb04918ca6), [`7e9416b`](https://github.com/LedgerHQ/ledger-live/commit/7e9416b629ae3cf4cf6da97b5a50e1197a2a101c), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`aafcdb7`](https://github.com/LedgerHQ/ledger-live/commit/aafcdb70e59584d6580f080cfd167cce41e56c19), [`9b4214f`](https://github.com/LedgerHQ/ledger-live/commit/9b4214fea8a3d8d8da30cd0b5ba6f9032610527e), [`11a1e34`](https://github.com/LedgerHQ/ledger-live/commit/11a1e34660116e53b0cfa5f66d2aa22c81dd9c25), [`2ad298a`](https://github.com/LedgerHQ/ledger-live/commit/2ad298ae1f6a60e5d28ca236c17f8eb7d7906c78), [`2c70999`](https://github.com/LedgerHQ/ledger-live/commit/2c709990d3569bc50504822ce90c9e9024210312), [`75711a2`](https://github.com/LedgerHQ/ledger-live/commit/75711a26b6a6e23a8ee1e9e34e3e574a08f76a95), [`9f37206`](https://github.com/LedgerHQ/ledger-live/commit/9f372065ab564bc75960e4d02b8a9cb4e7ac21b0), [`3b3c696`](https://github.com/LedgerHQ/ledger-live/commit/3b3c696a3d857f474a64b25cff6389f4df3b2063), [`71fd65e`](https://github.com/LedgerHQ/ledger-live/commit/71fd65e2bdfd692d1d009f22202d9e7f984826b5), [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`6cc7ac6`](https://github.com/LedgerHQ/ledger-live/commit/6cc7ac68b08cdb80b95c597495acd681ec25caca), [`6110948`](https://github.com/LedgerHQ/ledger-live/commit/61109484660c79a7ce8ad1e32af1f58276ddad7a), [`1cf5583`](https://github.com/LedgerHQ/ledger-live/commit/1cf55832f785fc57881169092f1190fa7ddfecf9), [`c8bb138`](https://github.com/LedgerHQ/ledger-live/commit/c8bb13851393d4b1a50a5ece62763ba43110ae6f), [`150a151`](https://github.com/LedgerHQ/ledger-live/commit/150a151169e4ef40aa197300a115f17db1aa20c0), [`116f006`](https://github.com/LedgerHQ/ledger-live/commit/116f006fb7e1dc3ed7d97c41ec08b2340b66a12e), [`27ea1f5`](https://github.com/LedgerHQ/ledger-live/commit/27ea1f524b3fd4db75f54ef21d163a0815cb6d5d)]:
  - @ledgerhq/live-common@37.5.0-next.0
  - @shared/env@0.5.0-next.0
  - @ledgerhq/live-e2e-shared@0.10.0-next.0
  - @shared/feature-flags@0.21.0-next.0
  - @ledgerhq/live-cli@26.3.4-next.0
  - @ledgerhq/live-dmk-speculos@0.10.7-next.0

## 0.38.0

### Minor Changes

- [#20964](https://github.com/LedgerHQ/ledger-live/pull/20964) [`183706d`](https://github.com/LedgerHQ/ledger-live/commit/183706d1664336ef9798e3bebc06551803fe00bd) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Disable the large-screen upsell modal in E2E defaults so "Spot scams before signing" cannot cover Wallet 4.0 navigation.

### Patch Changes

- Updated dependencies [[`61b4b5f`](https://github.com/LedgerHQ/ledger-live/commit/61b4b5f293524a51f9d34c11e7113c3c923e8dbd), [`26d8617`](https://github.com/LedgerHQ/ledger-live/commit/26d86172869e47608dd0f0e26dfbc905dafa3588), [`eedbb67`](https://github.com/LedgerHQ/ledger-live/commit/eedbb671674c0923b6b273de2ebac1cba7b5f6d2), [`2a4b4b1`](https://github.com/LedgerHQ/ledger-live/commit/2a4b4b195a6074b0197e022f7c3ad3cc51b9cf90), [`bb58645`](https://github.com/LedgerHQ/ledger-live/commit/bb586459d2412e667e35bbaeb1c61b69d06aedf0), [`3bea41d`](https://github.com/LedgerHQ/ledger-live/commit/3bea41dcb6a5ef8d26547be31dee94bc42448e46), [`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6e30537`](https://github.com/LedgerHQ/ledger-live/commit/6e3053733d826fe7b825143eb2d1aa69617ad9db), [`b2a2e9e`](https://github.com/LedgerHQ/ledger-live/commit/b2a2e9ecec155c4ff3fdefa0b22e0ac2226bf830), [`d1ab42f`](https://github.com/LedgerHQ/ledger-live/commit/d1ab42f2b4db3cef7719d25a7b73a4cf223735dd), [`01c088d`](https://github.com/LedgerHQ/ledger-live/commit/01c088db6a0597a479f6371c3a3db81157ead41e), [`91dbf02`](https://github.com/LedgerHQ/ledger-live/commit/91dbf023257961c3f15725f57abf273d2190e3c5), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`32f3b76`](https://github.com/LedgerHQ/ledger-live/commit/32f3b7638dbe8c23fd64f60b8eb5e8dfe8f4c74a), [`d6c7592`](https://github.com/LedgerHQ/ledger-live/commit/d6c7592278f2eed430c0451dd1b0a99fdf5b377d), [`f7e5005`](https://github.com/LedgerHQ/ledger-live/commit/f7e5005f306b306042e3022fcb299ef499e7491a), [`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1), [`4555355`](https://github.com/LedgerHQ/ledger-live/commit/4555355dc1f4162841917325ffd539260322a54d), [`fb4a5bc`](https://github.com/LedgerHQ/ledger-live/commit/fb4a5bc6d78301182f56572ffedbe28bc995f271), [`6e1e0aa`](https://github.com/LedgerHQ/ledger-live/commit/6e1e0aa7b317b7fb5f7c73161198536232b3881e), [`cad4f63`](https://github.com/LedgerHQ/ledger-live/commit/cad4f63be4a3b16880ab490195af1f17921e03c2), [`306a681`](https://github.com/LedgerHQ/ledger-live/commit/306a6813eaabfd67dc575bb7bdfc2b52892037df), [`79bd143`](https://github.com/LedgerHQ/ledger-live/commit/79bd143c2b2fe9dd4036ffbf2f75b82afc6e677f), [`9e0c703`](https://github.com/LedgerHQ/ledger-live/commit/9e0c703631379409b5a9bee047832e9ac147a249), [`e11eebe`](https://github.com/LedgerHQ/ledger-live/commit/e11eebedce8093322ce9dd9140be2e1f29817735), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`a826856`](https://github.com/LedgerHQ/ledger-live/commit/a826856200049687f4b3b37f85bb588eaa4fb4a2), [`b3095f5`](https://github.com/LedgerHQ/ledger-live/commit/b3095f5500b76110b5ce2ed1f08aee9f346a40f3), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`a56baa8`](https://github.com/LedgerHQ/ledger-live/commit/a56baa8d0b71460066bc8173767920049aa50e37), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9), [`9d84383`](https://github.com/LedgerHQ/ledger-live/commit/9d84383b5197f7509eaf232c9a5f12efb6fa162f), [`3908965`](https://github.com/LedgerHQ/ledger-live/commit/3908965e8872b6502558b669897028d39c492f7e), [`d7a9847`](https://github.com/LedgerHQ/ledger-live/commit/d7a9847244eeff976b10ae1aee39fadafec3d1e2)]:
  - @ledgerhq/live-common@37.4.0
  - @ledgerhq/live-e2e-shared@0.9.0
  - @shared/feature-flags@0.20.0
  - @shared/env@0.4.0
  - @ledgerhq/live-cli@26.3.3
  - @ledgerhq/live-dmk-speculos@0.10.6

## 0.38.0-next.0

### Minor Changes

- [#20964](https://github.com/LedgerHQ/ledger-live/pull/20964) [`183706d`](https://github.com/LedgerHQ/ledger-live/commit/183706d1664336ef9798e3bebc06551803fe00bd) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Disable the large-screen upsell modal in E2E defaults so "Spot scams before signing" cannot cover Wallet 4.0 navigation.

### Patch Changes

- Updated dependencies [[`61b4b5f`](https://github.com/LedgerHQ/ledger-live/commit/61b4b5f293524a51f9d34c11e7113c3c923e8dbd), [`26d8617`](https://github.com/LedgerHQ/ledger-live/commit/26d86172869e47608dd0f0e26dfbc905dafa3588), [`eedbb67`](https://github.com/LedgerHQ/ledger-live/commit/eedbb671674c0923b6b273de2ebac1cba7b5f6d2), [`2a4b4b1`](https://github.com/LedgerHQ/ledger-live/commit/2a4b4b195a6074b0197e022f7c3ad3cc51b9cf90), [`bb58645`](https://github.com/LedgerHQ/ledger-live/commit/bb586459d2412e667e35bbaeb1c61b69d06aedf0), [`3bea41d`](https://github.com/LedgerHQ/ledger-live/commit/3bea41dcb6a5ef8d26547be31dee94bc42448e46), [`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6e30537`](https://github.com/LedgerHQ/ledger-live/commit/6e3053733d826fe7b825143eb2d1aa69617ad9db), [`b2a2e9e`](https://github.com/LedgerHQ/ledger-live/commit/b2a2e9ecec155c4ff3fdefa0b22e0ac2226bf830), [`d1ab42f`](https://github.com/LedgerHQ/ledger-live/commit/d1ab42f2b4db3cef7719d25a7b73a4cf223735dd), [`01c088d`](https://github.com/LedgerHQ/ledger-live/commit/01c088db6a0597a479f6371c3a3db81157ead41e), [`91dbf02`](https://github.com/LedgerHQ/ledger-live/commit/91dbf023257961c3f15725f57abf273d2190e3c5), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`32f3b76`](https://github.com/LedgerHQ/ledger-live/commit/32f3b7638dbe8c23fd64f60b8eb5e8dfe8f4c74a), [`d6c7592`](https://github.com/LedgerHQ/ledger-live/commit/d6c7592278f2eed430c0451dd1b0a99fdf5b377d), [`f7e5005`](https://github.com/LedgerHQ/ledger-live/commit/f7e5005f306b306042e3022fcb299ef499e7491a), [`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1), [`4555355`](https://github.com/LedgerHQ/ledger-live/commit/4555355dc1f4162841917325ffd539260322a54d), [`fb4a5bc`](https://github.com/LedgerHQ/ledger-live/commit/fb4a5bc6d78301182f56572ffedbe28bc995f271), [`6e1e0aa`](https://github.com/LedgerHQ/ledger-live/commit/6e1e0aa7b317b7fb5f7c73161198536232b3881e), [`cad4f63`](https://github.com/LedgerHQ/ledger-live/commit/cad4f63be4a3b16880ab490195af1f17921e03c2), [`306a681`](https://github.com/LedgerHQ/ledger-live/commit/306a6813eaabfd67dc575bb7bdfc2b52892037df), [`79bd143`](https://github.com/LedgerHQ/ledger-live/commit/79bd143c2b2fe9dd4036ffbf2f75b82afc6e677f), [`9e0c703`](https://github.com/LedgerHQ/ledger-live/commit/9e0c703631379409b5a9bee047832e9ac147a249), [`e11eebe`](https://github.com/LedgerHQ/ledger-live/commit/e11eebedce8093322ce9dd9140be2e1f29817735), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`a826856`](https://github.com/LedgerHQ/ledger-live/commit/a826856200049687f4b3b37f85bb588eaa4fb4a2), [`b3095f5`](https://github.com/LedgerHQ/ledger-live/commit/b3095f5500b76110b5ce2ed1f08aee9f346a40f3), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`a56baa8`](https://github.com/LedgerHQ/ledger-live/commit/a56baa8d0b71460066bc8173767920049aa50e37), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9), [`9d84383`](https://github.com/LedgerHQ/ledger-live/commit/9d84383b5197f7509eaf232c9a5f12efb6fa162f), [`3908965`](https://github.com/LedgerHQ/ledger-live/commit/3908965e8872b6502558b669897028d39c492f7e), [`d7a9847`](https://github.com/LedgerHQ/ledger-live/commit/d7a9847244eeff976b10ae1aee39fadafec3d1e2)]:
  - @ledgerhq/live-common@37.4.0-next.0
  - @ledgerhq/live-e2e-shared@0.9.0-next.0
  - @shared/feature-flags@0.20.0-next.0
  - @shared/env@0.4.0-next.0
  - @ledgerhq/live-cli@26.3.3-next.0
  - @ledgerhq/live-dmk-speculos@0.10.6-next.0

## 0.37.1

### Patch Changes

- Updated dependencies [[`061d873`](https://github.com/LedgerHQ/ledger-live/commit/061d873d0311a680d31771127c44e2ff219b65cd), [`e4e8d08`](https://github.com/LedgerHQ/ledger-live/commit/e4e8d086fc5672e4ce96c30c9a9af3f2022f863a), [`696f871`](https://github.com/LedgerHQ/ledger-live/commit/696f871fc89aedd6a2a50fe3f0dd442bbd7ebf07), [`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc), [`a7b0bae`](https://github.com/LedgerHQ/ledger-live/commit/a7b0baeaa4e7b2fb180e7ab28ce92a6287b46a68), [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a), [`89171ea`](https://github.com/LedgerHQ/ledger-live/commit/89171ea0279c94d5a55324c3c7194fa42234828a), [`840de0d`](https://github.com/LedgerHQ/ledger-live/commit/840de0d43c75962ab91f0f1dc232dbcef10356a3), [`3c36af2`](https://github.com/LedgerHQ/ledger-live/commit/3c36af2185860d32bfaad670df7c49a3458e44c3), [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8), [`84e3f9d`](https://github.com/LedgerHQ/ledger-live/commit/84e3f9d68bdf2e17281da9ba338745a51a90d822), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`6165c9d`](https://github.com/LedgerHQ/ledger-live/commit/6165c9d4c3082ed97087543b81e9b79c9d47dfa1), [`f5b2359`](https://github.com/LedgerHQ/ledger-live/commit/f5b2359ce6aa655b9e39d87c9925cb7469da248c), [`77dc4d9`](https://github.com/LedgerHQ/ledger-live/commit/77dc4d93ac293095a023efd41713b35b1c5974bf), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`e72d6ff`](https://github.com/LedgerHQ/ledger-live/commit/e72d6ffbd8b1a1ac79d272e1823ecfdfd06ed0ee), [`6a437fd`](https://github.com/LedgerHQ/ledger-live/commit/6a437fd60cb8d5c197f104a522ce1406da197e51), [`352c6a3`](https://github.com/LedgerHQ/ledger-live/commit/352c6a36999c1ee7436bdce218b10f15af0dab5f), [`d1a01e8`](https://github.com/LedgerHQ/ledger-live/commit/d1a01e81f58f2a31b009235b5c9893ff60e6f353), [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d), [`004c294`](https://github.com/LedgerHQ/ledger-live/commit/004c29415d581626e16548fb96f18f7006128c2e), [`481bc40`](https://github.com/LedgerHQ/ledger-live/commit/481bc40f6e9573ff4c1387e9944cfdb1298e092b), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`0076ce3`](https://github.com/LedgerHQ/ledger-live/commit/0076ce3a0da55f3b5b1f8c1f825ea11a0912bcb5), [`8153370`](https://github.com/LedgerHQ/ledger-live/commit/8153370ced31369208fe14ce8b24c6eb0d899ff4), [`6543cfd`](https://github.com/LedgerHQ/ledger-live/commit/6543cfd37c0db9227621df6dff2b2acd6be482e8), [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b), [`320b488`](https://github.com/LedgerHQ/ledger-live/commit/320b4880a45d8ad2ce3f349a0bbae00df563ca84), [`e0d646e`](https://github.com/LedgerHQ/ledger-live/commit/e0d646e62345e411e5c3323a8b8af7361db48802), [`e3e7804`](https://github.com/LedgerHQ/ledger-live/commit/e3e7804bff59e1d6e28ec5c94fcbb421ddbbaf71), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`96ac61e`](https://github.com/LedgerHQ/ledger-live/commit/96ac61e367eae1da998547f00ae144e7c3947f2b)]:
  - @ledgerhq/live-common@37.3.0
  - @shared/feature-flags@0.19.0
  - @ledgerhq/ledger-key-ring-protocol@0.20.0
  - @shared/env@0.3.0
  - @ledgerhq/types-devices@7.0.0
  - @ledgerhq/live-e2e-shared@0.8.0
  - @ledgerhq/live-cli@26.3.2
  - @ledgerhq/live-dmk-speculos@0.10.5
  - @ledgerhq/live-wallet@1.0.1

## 0.37.1-next.1

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8)]:
  - @ledgerhq/live-common@37.3.0-next.1
  - @shared/feature-flags@0.19.0-next.1
  - @ledgerhq/live-cli@26.3.2-next.1
  - @ledgerhq/live-e2e-shared@0.8.0-next.1
  - @ledgerhq/live-wallet@1.0.1-next.1

## 0.37.1-next.0

### Patch Changes

- Updated dependencies [[`061d873`](https://github.com/LedgerHQ/ledger-live/commit/061d873d0311a680d31771127c44e2ff219b65cd), [`e4e8d08`](https://github.com/LedgerHQ/ledger-live/commit/e4e8d086fc5672e4ce96c30c9a9af3f2022f863a), [`696f871`](https://github.com/LedgerHQ/ledger-live/commit/696f871fc89aedd6a2a50fe3f0dd442bbd7ebf07), [`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc), [`a7b0bae`](https://github.com/LedgerHQ/ledger-live/commit/a7b0baeaa4e7b2fb180e7ab28ce92a6287b46a68), [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a), [`89171ea`](https://github.com/LedgerHQ/ledger-live/commit/89171ea0279c94d5a55324c3c7194fa42234828a), [`840de0d`](https://github.com/LedgerHQ/ledger-live/commit/840de0d43c75962ab91f0f1dc232dbcef10356a3), [`3c36af2`](https://github.com/LedgerHQ/ledger-live/commit/3c36af2185860d32bfaad670df7c49a3458e44c3), [`84e3f9d`](https://github.com/LedgerHQ/ledger-live/commit/84e3f9d68bdf2e17281da9ba338745a51a90d822), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`6165c9d`](https://github.com/LedgerHQ/ledger-live/commit/6165c9d4c3082ed97087543b81e9b79c9d47dfa1), [`f5b2359`](https://github.com/LedgerHQ/ledger-live/commit/f5b2359ce6aa655b9e39d87c9925cb7469da248c), [`77dc4d9`](https://github.com/LedgerHQ/ledger-live/commit/77dc4d93ac293095a023efd41713b35b1c5974bf), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`e72d6ff`](https://github.com/LedgerHQ/ledger-live/commit/e72d6ffbd8b1a1ac79d272e1823ecfdfd06ed0ee), [`6a437fd`](https://github.com/LedgerHQ/ledger-live/commit/6a437fd60cb8d5c197f104a522ce1406da197e51), [`352c6a3`](https://github.com/LedgerHQ/ledger-live/commit/352c6a36999c1ee7436bdce218b10f15af0dab5f), [`d1a01e8`](https://github.com/LedgerHQ/ledger-live/commit/d1a01e81f58f2a31b009235b5c9893ff60e6f353), [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d), [`004c294`](https://github.com/LedgerHQ/ledger-live/commit/004c29415d581626e16548fb96f18f7006128c2e), [`481bc40`](https://github.com/LedgerHQ/ledger-live/commit/481bc40f6e9573ff4c1387e9944cfdb1298e092b), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`0076ce3`](https://github.com/LedgerHQ/ledger-live/commit/0076ce3a0da55f3b5b1f8c1f825ea11a0912bcb5), [`8153370`](https://github.com/LedgerHQ/ledger-live/commit/8153370ced31369208fe14ce8b24c6eb0d899ff4), [`6543cfd`](https://github.com/LedgerHQ/ledger-live/commit/6543cfd37c0db9227621df6dff2b2acd6be482e8), [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b), [`320b488`](https://github.com/LedgerHQ/ledger-live/commit/320b4880a45d8ad2ce3f349a0bbae00df563ca84), [`e0d646e`](https://github.com/LedgerHQ/ledger-live/commit/e0d646e62345e411e5c3323a8b8af7361db48802), [`e3e7804`](https://github.com/LedgerHQ/ledger-live/commit/e3e7804bff59e1d6e28ec5c94fcbb421ddbbaf71), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`96ac61e`](https://github.com/LedgerHQ/ledger-live/commit/96ac61e367eae1da998547f00ae144e7c3947f2b)]:
  - @ledgerhq/live-common@37.3.0-next.0
  - @shared/feature-flags@0.19.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.20.0-next.0
  - @shared/env@0.3.0-next.0
  - @ledgerhq/types-devices@7.0.0-next.0
  - @ledgerhq/live-e2e-shared@0.8.0-next.0
  - @ledgerhq/live-cli@26.3.2-next.0
  - @ledgerhq/live-dmk-speculos@0.10.5-next.0
  - @ledgerhq/live-wallet@1.0.1-next.0

## 0.37.0

### Minor Changes

- [#20640](https://github.com/LedgerHQ/ledger-live/pull/20640) [`99bff04`](https://github.com/LedgerHQ/ledger-live/commit/99bff04b37936ecb263c3394b606ba9a92933e2f) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Make the Borrow desktop E2E suite independent and diagnosable: run the specs one at a time instead
  of as a serial group so a failure no longer skips the remaining tests, click Give approval whenever
  the control is on screen, wait on each marker's own visibility rather than a latching `or().first()`
  locator, report the account's on-chain nonce when a flow fails instead of a generic funding hint,
  and keep the on-chain flows on the primary device leg so parallel legs cannot collide on the shared
  borrow account.

### Patch Changes

- Updated dependencies [[`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d), [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`9b3fb2a`](https://github.com/LedgerHQ/ledger-live/commit/9b3fb2a98eaa530c12e55eb3391f58a306c80d8f), [`99bff04`](https://github.com/LedgerHQ/ledger-live/commit/99bff04b37936ecb263c3394b606ba9a92933e2f), [`c4a8141`](https://github.com/LedgerHQ/ledger-live/commit/c4a8141369e63e875fb5bfc9aef3f53362150338), [`44694e5`](https://github.com/LedgerHQ/ledger-live/commit/44694e54fa5b48e47595840638aee94a98213a37), [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf), [`7af726b`](https://github.com/LedgerHQ/ledger-live/commit/7af726b50eb7c8a2712bf734aac5618be61911ef), [`fd7152a`](https://github.com/LedgerHQ/ledger-live/commit/fd7152a28ca7b11bf21edba822d8b4ede6e68d7c), [`d614891`](https://github.com/LedgerHQ/ledger-live/commit/d614891593fe2ce794bd1e6dea8bfb69e89c775b), [`593231c`](https://github.com/LedgerHQ/ledger-live/commit/593231c81f7f9cdf59b28aa8f88fe7b96752d758), [`9708010`](https://github.com/LedgerHQ/ledger-live/commit/970801044529fe978ccbb8c562cc64c00277d1de), [`a0f13a2`](https://github.com/LedgerHQ/ledger-live/commit/a0f13a2b5410acc1e03231a94a5af9d77b6dabf6), [`92b70ef`](https://github.com/LedgerHQ/ledger-live/commit/92b70ef6318741216740d7341f37627c32a3f0d6), [`60b4626`](https://github.com/LedgerHQ/ledger-live/commit/60b462653bad19429c46ebef439ec2b5bb234140), [`28046d3`](https://github.com/LedgerHQ/ledger-live/commit/28046d31707d0290b56522c14b51623860b7a3f8), [`64bb8cf`](https://github.com/LedgerHQ/ledger-live/commit/64bb8cfa5bffde5a1e2c24615f1dd11b864094d2), [`bef9477`](https://github.com/LedgerHQ/ledger-live/commit/bef9477286ba11c0e7eed7af34c1ec7c95204cc9), [`d266e13`](https://github.com/LedgerHQ/ledger-live/commit/d266e13aa8e8b34ca74beaa09687b6e8d426f821), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`7d5cd98`](https://github.com/LedgerHQ/ledger-live/commit/7d5cd9812a7827b3f1b926166a4a3fde20c7b59c), [`cc9d58f`](https://github.com/LedgerHQ/ledger-live/commit/cc9d58f08ae38197ea2bd19115eda870d348f6aa), [`6be80d8`](https://github.com/LedgerHQ/ledger-live/commit/6be80d873a958544f4152348337aae8a0c0c2815), [`0e439a0`](https://github.com/LedgerHQ/ledger-live/commit/0e439a0b73f1ad49aab32e98dfaf4fbd1d0ded04), [`baba728`](https://github.com/LedgerHQ/ledger-live/commit/baba7280d4495fd1c6a80d18cb50412a21ec9a76), [`09c77c1`](https://github.com/LedgerHQ/ledger-live/commit/09c77c1814ddaad1265df5d52f4f6a336bc78ff1), [`8259d4d`](https://github.com/LedgerHQ/ledger-live/commit/8259d4d1617e640e04441644947332936d9fbe81), [`bbfc8cf`](https://github.com/LedgerHQ/ledger-live/commit/bbfc8cf7929d9bffc1aa1b9a5e3b9593e3016436), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`6d45e7c`](https://github.com/LedgerHQ/ledger-live/commit/6d45e7c4245be9acaf2f3a86f48d38e5677d8e96), [`da86f85`](https://github.com/LedgerHQ/ledger-live/commit/da86f85f2bb1cc94c413a94796e6735ba83eee52), [`aa3ea09`](https://github.com/LedgerHQ/ledger-live/commit/aa3ea0972205b589d2f92e352ac7154d11f872bc), [`aac9b34`](https://github.com/LedgerHQ/ledger-live/commit/aac9b34feb7a898e16fc98758046c0c3bc9fcbcb), [`ed79527`](https://github.com/LedgerHQ/ledger-live/commit/ed79527dd83bb950dd6701d1677d6703cec6051c), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`f440c85`](https://github.com/LedgerHQ/ledger-live/commit/f440c85eeb1669f3660ddbff18ae7892bb9f5923), [`fb1ba1b`](https://github.com/LedgerHQ/ledger-live/commit/fb1ba1b97d0e50d8780e678073d12faaab290722), [`135223e`](https://github.com/LedgerHQ/ledger-live/commit/135223e49d4d927183cf893f563ed583e18f3346), [`4c9af42`](https://github.com/LedgerHQ/ledger-live/commit/4c9af429730f79e04d0f220f03b58565a5660e30), [`e664d84`](https://github.com/LedgerHQ/ledger-live/commit/e664d84bc45a0bde9f4794c96d43e8a7eebb83b9)]:
  - @ledgerhq/live-common@37.2.0
  - @ledgerhq/live-e2e-shared@0.7.0
  - @ledgerhq/ledger-key-ring-protocol@0.19.0
  - @shared/cloud-sync@0.1.0
  - @ledgerhq/live-wallet@1.0.0
  - @shared/feature-flags@0.18.0
  - @ledgerhq/types-devices@6.32.0
  - @ledgerhq/live-cli@26.3.1
  - @features/platform-wallet-sync@0.1.1

## 0.37.0-next.0

### Minor Changes

- [#20640](https://github.com/LedgerHQ/ledger-live/pull/20640) [`99bff04`](https://github.com/LedgerHQ/ledger-live/commit/99bff04b37936ecb263c3394b606ba9a92933e2f) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Make the Borrow desktop E2E suite independent and diagnosable: run the specs one at a time instead
  of as a serial group so a failure no longer skips the remaining tests, click Give approval whenever
  the control is on screen, wait on each marker's own visibility rather than a latching `or().first()`
  locator, report the account's on-chain nonce when a flow fails instead of a generic funding hint,
  and keep the on-chain flows on the primary device leg so parallel legs cannot collide on the shared
  borrow account.

### Patch Changes

- Updated dependencies [[`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d), [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`9b3fb2a`](https://github.com/LedgerHQ/ledger-live/commit/9b3fb2a98eaa530c12e55eb3391f58a306c80d8f), [`99bff04`](https://github.com/LedgerHQ/ledger-live/commit/99bff04b37936ecb263c3394b606ba9a92933e2f), [`c4a8141`](https://github.com/LedgerHQ/ledger-live/commit/c4a8141369e63e875fb5bfc9aef3f53362150338), [`44694e5`](https://github.com/LedgerHQ/ledger-live/commit/44694e54fa5b48e47595840638aee94a98213a37), [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf), [`7af726b`](https://github.com/LedgerHQ/ledger-live/commit/7af726b50eb7c8a2712bf734aac5618be61911ef), [`fd7152a`](https://github.com/LedgerHQ/ledger-live/commit/fd7152a28ca7b11bf21edba822d8b4ede6e68d7c), [`d614891`](https://github.com/LedgerHQ/ledger-live/commit/d614891593fe2ce794bd1e6dea8bfb69e89c775b), [`593231c`](https://github.com/LedgerHQ/ledger-live/commit/593231c81f7f9cdf59b28aa8f88fe7b96752d758), [`9708010`](https://github.com/LedgerHQ/ledger-live/commit/970801044529fe978ccbb8c562cc64c00277d1de), [`a0f13a2`](https://github.com/LedgerHQ/ledger-live/commit/a0f13a2b5410acc1e03231a94a5af9d77b6dabf6), [`92b70ef`](https://github.com/LedgerHQ/ledger-live/commit/92b70ef6318741216740d7341f37627c32a3f0d6), [`60b4626`](https://github.com/LedgerHQ/ledger-live/commit/60b462653bad19429c46ebef439ec2b5bb234140), [`28046d3`](https://github.com/LedgerHQ/ledger-live/commit/28046d31707d0290b56522c14b51623860b7a3f8), [`64bb8cf`](https://github.com/LedgerHQ/ledger-live/commit/64bb8cfa5bffde5a1e2c24615f1dd11b864094d2), [`bef9477`](https://github.com/LedgerHQ/ledger-live/commit/bef9477286ba11c0e7eed7af34c1ec7c95204cc9), [`d266e13`](https://github.com/LedgerHQ/ledger-live/commit/d266e13aa8e8b34ca74beaa09687b6e8d426f821), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`7d5cd98`](https://github.com/LedgerHQ/ledger-live/commit/7d5cd9812a7827b3f1b926166a4a3fde20c7b59c), [`cc9d58f`](https://github.com/LedgerHQ/ledger-live/commit/cc9d58f08ae38197ea2bd19115eda870d348f6aa), [`6be80d8`](https://github.com/LedgerHQ/ledger-live/commit/6be80d873a958544f4152348337aae8a0c0c2815), [`0e439a0`](https://github.com/LedgerHQ/ledger-live/commit/0e439a0b73f1ad49aab32e98dfaf4fbd1d0ded04), [`baba728`](https://github.com/LedgerHQ/ledger-live/commit/baba7280d4495fd1c6a80d18cb50412a21ec9a76), [`09c77c1`](https://github.com/LedgerHQ/ledger-live/commit/09c77c1814ddaad1265df5d52f4f6a336bc78ff1), [`8259d4d`](https://github.com/LedgerHQ/ledger-live/commit/8259d4d1617e640e04441644947332936d9fbe81), [`bbfc8cf`](https://github.com/LedgerHQ/ledger-live/commit/bbfc8cf7929d9bffc1aa1b9a5e3b9593e3016436), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`6d45e7c`](https://github.com/LedgerHQ/ledger-live/commit/6d45e7c4245be9acaf2f3a86f48d38e5677d8e96), [`da86f85`](https://github.com/LedgerHQ/ledger-live/commit/da86f85f2bb1cc94c413a94796e6735ba83eee52), [`aa3ea09`](https://github.com/LedgerHQ/ledger-live/commit/aa3ea0972205b589d2f92e352ac7154d11f872bc), [`aac9b34`](https://github.com/LedgerHQ/ledger-live/commit/aac9b34feb7a898e16fc98758046c0c3bc9fcbcb), [`ed79527`](https://github.com/LedgerHQ/ledger-live/commit/ed79527dd83bb950dd6701d1677d6703cec6051c), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`f440c85`](https://github.com/LedgerHQ/ledger-live/commit/f440c85eeb1669f3660ddbff18ae7892bb9f5923), [`fb1ba1b`](https://github.com/LedgerHQ/ledger-live/commit/fb1ba1b97d0e50d8780e678073d12faaab290722), [`135223e`](https://github.com/LedgerHQ/ledger-live/commit/135223e49d4d927183cf893f563ed583e18f3346), [`4c9af42`](https://github.com/LedgerHQ/ledger-live/commit/4c9af429730f79e04d0f220f03b58565a5660e30), [`e664d84`](https://github.com/LedgerHQ/ledger-live/commit/e664d84bc45a0bde9f4794c96d43e8a7eebb83b9)]:
  - @ledgerhq/live-common@37.2.0-next.0
  - @ledgerhq/live-e2e-shared@0.7.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.19.0-next.0
  - @shared/cloud-sync@0.1.0-next.0
  - @ledgerhq/live-wallet@1.0.0-next.0
  - @shared/feature-flags@0.18.0-next.0
  - @ledgerhq/types-devices@6.32.0-next.0
  - @ledgerhq/live-cli@26.3.1-next.0
  - @features/platform-wallet-sync@0.1.1-next.0

## 0.36.0

### Minor Changes

- [#20215](https://github.com/LedgerHQ/ledger-live/pull/20215) [`68a44de`](https://github.com/LedgerHQ/ledger-live/commit/68a44ded561dde782805884b216a245ded96400f) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(e2e): fix truncated address new send flow

- [#20165](https://github.com/LedgerHQ/ledger-live/pull/20165) [`ddc563d`](https://github.com/LedgerHQ/ledger-live/commit/ddc563d19327e7021b7877e442fa84d217d85196) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add Borrow desktop E2E coverage for full repay (B2CQA-6073) and withdraw collateral (B2CQA-6080) using borrow-live-app test ids and the shared Speculos loan driver.

- [#20232](https://github.com/LedgerHQ/ledger-live/pull/20232) [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): a/b testing show recent banner

- [#20273](https://github.com/LedgerHQ/ledger-live/pull/20273) [`6e1f9f3`](https://github.com/LedgerHQ/ledger-live/commit/6e1f9f3e5301d4e64dcde807e836924f9359dc5a) Thanks [@VicAlbr](https://github.com/VicAlbr)! - test(e2e): harmonize LWD and LWM test names for Allure reports

- [#20214](https://github.com/LedgerHQ/ledger-live/pull/20214) [`be5e007`](https://github.com/LedgerHQ/ledger-live/commit/be5e007ce64443de9a139e304f005d507dc34f0b) Thanks [@kentoforik](https://github.com/kentoforik)! - Revert temporary hardcoded HBAR to XRP swap amount workaround (LIVE-33611); provider-side minimum amount bug is now fixed.

- [#20254](https://github.com/LedgerHQ/ledger-live/pull/20254) [`343556e`](https://github.com/LedgerHQ/ledger-live/commit/343556e274d65a0be583295674023070253497b6) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - test(aleo): e2e public transfer

### Patch Changes

- Updated dependencies [[`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`1689e58`](https://github.com/LedgerHQ/ledger-live/commit/1689e583c054bb8ad373bfe9f325b136fe0283bc), [`c016a95`](https://github.com/LedgerHQ/ledger-live/commit/c016a95538dfef2d7ddf1a17914d8cb3e55b644e), [`2fa6e1f`](https://github.com/LedgerHQ/ledger-live/commit/2fa6e1f3fbcb56ff444ca756135d821e141bc439), [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`15e4608`](https://github.com/LedgerHQ/ledger-live/commit/15e4608db80de6909f96f795d8a888994510e07d), [`4e4bf02`](https://github.com/LedgerHQ/ledger-live/commit/4e4bf02352284a821d54b875601e4f7effd8cfbf), [`825f50f`](https://github.com/LedgerHQ/ledger-live/commit/825f50fb9989f929c1462d53d0df58a7242261c0), [`f60f9cb`](https://github.com/LedgerHQ/ledger-live/commit/f60f9cbc79557cfa815ea714b375ace11aea8754), [`72930e9`](https://github.com/LedgerHQ/ledger-live/commit/72930e93e2a01d46012c3e7b72e3e3d4875ae7d7), [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89), [`f0e8ea9`](https://github.com/LedgerHQ/ledger-live/commit/f0e8ea93a3c90767dad4b326deeef3d1c48c36cc), [`140575c`](https://github.com/LedgerHQ/ledger-live/commit/140575c987ce5fa6173e7854edeb2c564e71c258), [`4bbd5a4`](https://github.com/LedgerHQ/ledger-live/commit/4bbd5a441f09e3c3d1709abcc9da3a7d1d6ea50c), [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3), [`42524ad`](https://github.com/LedgerHQ/ledger-live/commit/42524ad0a30bc55ccf3563be35b19cd2c7004199), [`6e1f9f3`](https://github.com/LedgerHQ/ledger-live/commit/6e1f9f3e5301d4e64dcde807e836924f9359dc5a), [`e50980f`](https://github.com/LedgerHQ/ledger-live/commit/e50980fccea5be9b6be8c14d2fd247c6eca6460f), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`ba6e9c1`](https://github.com/LedgerHQ/ledger-live/commit/ba6e9c1e542ad28a59b0163e3b453e2f047a48b9), [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3), [`e44d972`](https://github.com/LedgerHQ/ledger-live/commit/e44d97239af10b46ae3ef703e0c6181cc0c87712), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`b5df122`](https://github.com/LedgerHQ/ledger-live/commit/b5df1223ce9e09766d6f3fecf7e44e2ec3bd3a00), [`343556e`](https://github.com/LedgerHQ/ledger-live/commit/343556e274d65a0be583295674023070253497b6), [`51bc3da`](https://github.com/LedgerHQ/ledger-live/commit/51bc3daa6eb6c4b79bc4c14df4872072657277cd)]:
  - @ledgerhq/live-common@37.1.0
  - @ledgerhq/live-cli@26.3.0
  - @shared/feature-flags@0.17.0
  - @shared/env@0.2.0
  - @ledgerhq/ledger-key-ring-protocol@0.18.0
  - @ledgerhq/live-e2e-shared@0.6.0
  - @ledgerhq/live-wallet@0.30.2
  - @ledgerhq/live-dmk-speculos@0.10.4

## 0.36.0-next.0

### Minor Changes

- [#20215](https://github.com/LedgerHQ/ledger-live/pull/20215) [`68a44de`](https://github.com/LedgerHQ/ledger-live/commit/68a44ded561dde782805884b216a245ded96400f) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(e2e): fix truncated address new send flow

- [#20165](https://github.com/LedgerHQ/ledger-live/pull/20165) [`ddc563d`](https://github.com/LedgerHQ/ledger-live/commit/ddc563d19327e7021b7877e442fa84d217d85196) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add Borrow desktop E2E coverage for full repay (B2CQA-6073) and withdraw collateral (B2CQA-6080) using borrow-live-app test ids and the shared Speculos loan driver.

- [#20232](https://github.com/LedgerHQ/ledger-live/pull/20232) [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): a/b testing show recent banner

- [#20273](https://github.com/LedgerHQ/ledger-live/pull/20273) [`6e1f9f3`](https://github.com/LedgerHQ/ledger-live/commit/6e1f9f3e5301d4e64dcde807e836924f9359dc5a) Thanks [@VicAlbr](https://github.com/VicAlbr)! - test(e2e): harmonize LWD and LWM test names for Allure reports

- [#20214](https://github.com/LedgerHQ/ledger-live/pull/20214) [`be5e007`](https://github.com/LedgerHQ/ledger-live/commit/be5e007ce64443de9a139e304f005d507dc34f0b) Thanks [@kentoforik](https://github.com/kentoforik)! - Revert temporary hardcoded HBAR to XRP swap amount workaround (LIVE-33611); provider-side minimum amount bug is now fixed.

- [#20254](https://github.com/LedgerHQ/ledger-live/pull/20254) [`343556e`](https://github.com/LedgerHQ/ledger-live/commit/343556e274d65a0be583295674023070253497b6) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - test(aleo): e2e public transfer

### Patch Changes

- Updated dependencies [[`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`1689e58`](https://github.com/LedgerHQ/ledger-live/commit/1689e583c054bb8ad373bfe9f325b136fe0283bc), [`c016a95`](https://github.com/LedgerHQ/ledger-live/commit/c016a95538dfef2d7ddf1a17914d8cb3e55b644e), [`2fa6e1f`](https://github.com/LedgerHQ/ledger-live/commit/2fa6e1f3fbcb56ff444ca756135d821e141bc439), [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`15e4608`](https://github.com/LedgerHQ/ledger-live/commit/15e4608db80de6909f96f795d8a888994510e07d), [`4e4bf02`](https://github.com/LedgerHQ/ledger-live/commit/4e4bf02352284a821d54b875601e4f7effd8cfbf), [`825f50f`](https://github.com/LedgerHQ/ledger-live/commit/825f50fb9989f929c1462d53d0df58a7242261c0), [`f60f9cb`](https://github.com/LedgerHQ/ledger-live/commit/f60f9cbc79557cfa815ea714b375ace11aea8754), [`72930e9`](https://github.com/LedgerHQ/ledger-live/commit/72930e93e2a01d46012c3e7b72e3e3d4875ae7d7), [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89), [`f0e8ea9`](https://github.com/LedgerHQ/ledger-live/commit/f0e8ea93a3c90767dad4b326deeef3d1c48c36cc), [`140575c`](https://github.com/LedgerHQ/ledger-live/commit/140575c987ce5fa6173e7854edeb2c564e71c258), [`4bbd5a4`](https://github.com/LedgerHQ/ledger-live/commit/4bbd5a441f09e3c3d1709abcc9da3a7d1d6ea50c), [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3), [`42524ad`](https://github.com/LedgerHQ/ledger-live/commit/42524ad0a30bc55ccf3563be35b19cd2c7004199), [`6e1f9f3`](https://github.com/LedgerHQ/ledger-live/commit/6e1f9f3e5301d4e64dcde807e836924f9359dc5a), [`e50980f`](https://github.com/LedgerHQ/ledger-live/commit/e50980fccea5be9b6be8c14d2fd247c6eca6460f), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`ba6e9c1`](https://github.com/LedgerHQ/ledger-live/commit/ba6e9c1e542ad28a59b0163e3b453e2f047a48b9), [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3), [`e44d972`](https://github.com/LedgerHQ/ledger-live/commit/e44d97239af10b46ae3ef703e0c6181cc0c87712), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`b5df122`](https://github.com/LedgerHQ/ledger-live/commit/b5df1223ce9e09766d6f3fecf7e44e2ec3bd3a00), [`343556e`](https://github.com/LedgerHQ/ledger-live/commit/343556e274d65a0be583295674023070253497b6), [`51bc3da`](https://github.com/LedgerHQ/ledger-live/commit/51bc3daa6eb6c4b79bc4c14df4872072657277cd)]:
  - @ledgerhq/live-common@37.1.0-next.0
  - @ledgerhq/live-cli@26.3.0-next.0
  - @shared/feature-flags@0.17.0-next.0
  - @shared/env@0.2.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.18.0-next.0
  - @ledgerhq/live-e2e-shared@0.6.0-next.0
  - @ledgerhq/live-wallet@0.30.2-next.0
  - @ledgerhq/live-dmk-speculos@0.10.4-next.0

## 0.35.0

### Minor Changes

- [#20144](https://github.com/LedgerHQ/ledger-live/pull/20144) [`6773624`](https://github.com/LedgerHQ/ledger-live/commit/6773624ddd5ffd4621978d3749567f0064f6b5ab) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Review and refactor `subAccount.spec` (QAA-1114): mark the legacy send-flow tests with a `legacy -` prefix and drop that prefix + the `newSendFlow` feature-flag override from the non-send-flow blocks (add account, receive, token visible), add a Solana (SOL_GIGA) sub-account to the add-account coverage, remove the redundant `ETH_LIDO` receive case, and consolidate the SOL + ETH true-e2e sends into a single parameterized `transactionE2E` loop.

- [#20020](https://github.com/LedgerHQ/ledger-live/pull/20020) [`ffa89fb`](https://github.com/LedgerHQ/ledger-live/commit/ffa89fb4ad24075d5837641f04436fcc65b07c41) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Refactor Borrow desktop E2E page object to use stable `BORROW_TEST_IDS` locators
  (LIVE-34696) now that borrow-live-app exposes data-testids in the catalog.

- [#19907](https://github.com/LedgerHQ/ledger-live/pull/19907) [`59706b5`](https://github.com/LedgerHQ/ledger-live/commit/59706b5d93253c3350e8dd12500c1be38ae5a360) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add a headless Borrow driver (Borrow API + Speculos) exposed via `pnpm e2e-cli borrow <open|close|repay|withdraw>` to create/tear down real on-chain loan state, plus reusable E2E setup/teardown hooks (`ensureLoanOpen` / `resetLoanState`), an `afterAll` reset for the open-loan spec, and a `pnpm e2e-cli` subcommand dispatcher. (QAA-1401)

- [#19756](https://github.com/LedgerHQ/ledger-live/pull/19756) [`6bb19c8`](https://github.com/LedgerHQ/ledger-live/commit/6bb19c87f57e9e7de32c068388479fb45ff327df) Thanks [@dilaouid](https://github.com/dilaouid)! - tests(lwd): add e2e coverage for the new send flow (incl. memo on Speculos)

- [#19623](https://github.com/LedgerHQ/ledger-live/pull/19623) [`8269231`](https://github.com/LedgerHQ/ledger-live/commit/8269231ec2f36452a5fc08f9406d71acbdff94c2) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Update earn v2 ice-cold-start E2E tests for earnSimulator/earnUpselling UI

- [#19947](https://github.com/LedgerHQ/ledger-live/pull/19947) [`f98da7f`](https://github.com/LedgerHQ/ledger-live/commit/f98da7f31c7cf67bdf07c8691998e0b3425e08e6) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix Base and Polkadot add-account assertions for aggregated portfolio assets

### Patch Changes

- Updated dependencies [[`ba20e39`](https://github.com/LedgerHQ/ledger-live/commit/ba20e3926e52284c04c9bc4e4b17b7c5e34b3cb5), [`37dac39`](https://github.com/LedgerHQ/ledger-live/commit/37dac39463de1a44bdb5bc4b1b6b37b0cff68922), [`008228e`](https://github.com/LedgerHQ/ledger-live/commit/008228ee22ba86b8aabe50c50d9c2e5e63771add), [`cee41c4`](https://github.com/LedgerHQ/ledger-live/commit/cee41c4e7a7c7e042d4df39d5a34591d72d723d0), [`341ea10`](https://github.com/LedgerHQ/ledger-live/commit/341ea108e30bf8af9abeb6eed484ee4b2c7c4a43), [`6bb19c8`](https://github.com/LedgerHQ/ledger-live/commit/6bb19c87f57e9e7de32c068388479fb45ff327df), [`52253f7`](https://github.com/LedgerHQ/ledger-live/commit/52253f70c302056cdc6b367cdd8b1db408b5e07d), [`452adf8`](https://github.com/LedgerHQ/ledger-live/commit/452adf85380d1cb74f1894478cdd84849b120ef4), [`44798f3`](https://github.com/LedgerHQ/ledger-live/commit/44798f392deb662a5f60123651ece2b320fbf946), [`b1d3f26`](https://github.com/LedgerHQ/ledger-live/commit/b1d3f26cbdf67c439bc125bdda1f1c56c9753f2e), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`dd7758b`](https://github.com/LedgerHQ/ledger-live/commit/dd7758bfa16c6b73b60da072a50c22f3b132c1a2), [`c9dddf2`](https://github.com/LedgerHQ/ledger-live/commit/c9dddf21f6e3208a077aa72bd575f56415287074), [`e7b8ddc`](https://github.com/LedgerHQ/ledger-live/commit/e7b8ddc239b88c1fbf0751c468218d9263f56859), [`e6a9b97`](https://github.com/LedgerHQ/ledger-live/commit/e6a9b973d05af98987c094d591342031f273b31c), [`dfab01f`](https://github.com/LedgerHQ/ledger-live/commit/dfab01f36460bd4e0ea0b0c13aa3d965aef945cd), [`a8d6e25`](https://github.com/LedgerHQ/ledger-live/commit/a8d6e25c0467572fbbc0cd3b35f90d355542b1f7)]:
  - @ledgerhq/live-common@37.0.0
  - @ledgerhq/live-e2e-shared@0.5.0
  - @ledgerhq/live-cli@26.2.0
  - @shared/feature-flags@0.16.0
  - @ledgerhq/live-wallet@0.30.1
  - @ledgerhq/ledger-key-ring-protocol@0.17.2
  - @shared/env@0.1.1
  - @ledgerhq/live-dmk-speculos@0.10.3

## 0.35.0-next.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@37.0.0-next.1
  - @ledgerhq/live-cli@26.2.0-next.1
  - @ledgerhq/live-e2e-shared@0.5.0-next.1

## 0.35.0-next.0

### Minor Changes

- [#20144](https://github.com/LedgerHQ/ledger-live/pull/20144) [`6773624`](https://github.com/LedgerHQ/ledger-live/commit/6773624ddd5ffd4621978d3749567f0064f6b5ab) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Review and refactor `subAccount.spec` (QAA-1114): mark the legacy send-flow tests with a `legacy -` prefix and drop that prefix + the `newSendFlow` feature-flag override from the non-send-flow blocks (add account, receive, token visible), add a Solana (SOL_GIGA) sub-account to the add-account coverage, remove the redundant `ETH_LIDO` receive case, and consolidate the SOL + ETH true-e2e sends into a single parameterized `transactionE2E` loop.

- [#20020](https://github.com/LedgerHQ/ledger-live/pull/20020) [`ffa89fb`](https://github.com/LedgerHQ/ledger-live/commit/ffa89fb4ad24075d5837641f04436fcc65b07c41) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Refactor Borrow desktop E2E page object to use stable `BORROW_TEST_IDS` locators
  (LIVE-34696) now that borrow-live-app exposes data-testids in the catalog.

- [#19907](https://github.com/LedgerHQ/ledger-live/pull/19907) [`59706b5`](https://github.com/LedgerHQ/ledger-live/commit/59706b5d93253c3350e8dd12500c1be38ae5a360) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add a headless Borrow driver (Borrow API + Speculos) exposed via `pnpm e2e-cli borrow <open|close|repay|withdraw>` to create/tear down real on-chain loan state, plus reusable E2E setup/teardown hooks (`ensureLoanOpen` / `resetLoanState`), an `afterAll` reset for the open-loan spec, and a `pnpm e2e-cli` subcommand dispatcher. (QAA-1401)

- [#19756](https://github.com/LedgerHQ/ledger-live/pull/19756) [`6bb19c8`](https://github.com/LedgerHQ/ledger-live/commit/6bb19c87f57e9e7de32c068388479fb45ff327df) Thanks [@dilaouid](https://github.com/dilaouid)! - tests(lwd): add e2e coverage for the new send flow (incl. memo on Speculos)

- [#19623](https://github.com/LedgerHQ/ledger-live/pull/19623) [`8269231`](https://github.com/LedgerHQ/ledger-live/commit/8269231ec2f36452a5fc08f9406d71acbdff94c2) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Update earn v2 ice-cold-start E2E tests for earnSimulator/earnUpselling UI

- [#19947](https://github.com/LedgerHQ/ledger-live/pull/19947) [`f98da7f`](https://github.com/LedgerHQ/ledger-live/commit/f98da7f31c7cf67bdf07c8691998e0b3425e08e6) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix Base and Polkadot add-account assertions for aggregated portfolio assets

### Patch Changes

- Updated dependencies [[`ba20e39`](https://github.com/LedgerHQ/ledger-live/commit/ba20e3926e52284c04c9bc4e4b17b7c5e34b3cb5), [`37dac39`](https://github.com/LedgerHQ/ledger-live/commit/37dac39463de1a44bdb5bc4b1b6b37b0cff68922), [`008228e`](https://github.com/LedgerHQ/ledger-live/commit/008228ee22ba86b8aabe50c50d9c2e5e63771add), [`cee41c4`](https://github.com/LedgerHQ/ledger-live/commit/cee41c4e7a7c7e042d4df39d5a34591d72d723d0), [`341ea10`](https://github.com/LedgerHQ/ledger-live/commit/341ea108e30bf8af9abeb6eed484ee4b2c7c4a43), [`6bb19c8`](https://github.com/LedgerHQ/ledger-live/commit/6bb19c87f57e9e7de32c068388479fb45ff327df), [`52253f7`](https://github.com/LedgerHQ/ledger-live/commit/52253f70c302056cdc6b367cdd8b1db408b5e07d), [`452adf8`](https://github.com/LedgerHQ/ledger-live/commit/452adf85380d1cb74f1894478cdd84849b120ef4), [`44798f3`](https://github.com/LedgerHQ/ledger-live/commit/44798f392deb662a5f60123651ece2b320fbf946), [`b1d3f26`](https://github.com/LedgerHQ/ledger-live/commit/b1d3f26cbdf67c439bc125bdda1f1c56c9753f2e), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`dd7758b`](https://github.com/LedgerHQ/ledger-live/commit/dd7758bfa16c6b73b60da072a50c22f3b132c1a2), [`c9dddf2`](https://github.com/LedgerHQ/ledger-live/commit/c9dddf21f6e3208a077aa72bd575f56415287074), [`e7b8ddc`](https://github.com/LedgerHQ/ledger-live/commit/e7b8ddc239b88c1fbf0751c468218d9263f56859), [`e6a9b97`](https://github.com/LedgerHQ/ledger-live/commit/e6a9b973d05af98987c094d591342031f273b31c), [`dfab01f`](https://github.com/LedgerHQ/ledger-live/commit/dfab01f36460bd4e0ea0b0c13aa3d965aef945cd), [`a8d6e25`](https://github.com/LedgerHQ/ledger-live/commit/a8d6e25c0467572fbbc0cd3b35f90d355542b1f7)]:
  - @ledgerhq/live-common@37.0.0-next.0
  - @ledgerhq/live-e2e-shared@0.5.0-next.0
  - @ledgerhq/live-cli@26.2.0-next.0
  - @shared/feature-flags@0.16.0-next.0
  - @ledgerhq/live-wallet@0.30.1-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.17.2-next.0
  - @shared/env@0.1.1-next.0
  - @ledgerhq/live-dmk-speculos@0.10.3-next.0

## 0.34.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@36.6.1
  - @ledgerhq/live-cli@26.1.1
  - @ledgerhq/live-e2e-shared@0.4.1

## 0.34.1-hotfix.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@36.6.1-hotfix.0
  - @ledgerhq/live-cli@26.1.1-hotfix.0
  - @ledgerhq/live-e2e-shared@0.4.1-hotfix.0

## 0.34.0

### Minor Changes

- [#19767](https://github.com/LedgerHQ/ledger-live/pull/19767) [`5077c9e`](https://github.com/LedgerHQ/ledger-live/commit/5077c9e2f217da78cdfe4811c0a3c19054ce7cda) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add Playwright E2E for Borrow cold-start (B2CQA-6062, LIVE-33746) and open-loan with
  Speculos signing on ETH 4 (B2CQA-6065, LIVE-34606) in `borrow.spec.ts`.

  Run cold-start: `pnpm e2e:desktop test:playwright borrow --grep "Introducing Crypto Loan"`.
  Run open-loan (manual E2E, `enable_broadcast`): `pnpm e2e:desktop test:playwright borrow --grep "open-loan execution"`.

- [#19854](https://github.com/LedgerHQ/ledger-live/pull/19854) [`c3c5329`](https://github.com/LedgerHQ/ledger-live/commit/c3c5329ffe69ed47a1f3a8910ae7fd8b53486f24) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(algo): restore Algorand memo in new send flow with protocol 1024-byte note limit

- [#19366](https://github.com/LedgerHQ/ledger-live/pull/19366) [`0936000`](https://github.com/LedgerHQ/ledger-live/commit/093600077d11e92a790e2d9ef31fa3519b41274a) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(e2e): add tokens tests and more coverage for the new send flow

- [#19888](https://github.com/LedgerHQ/ledger-live/pull/19888) [`f8a6ef6`](https://github.com/LedgerHQ/ledger-live/commit/f8a6ef66a6548c3d729e6db985cc05067013b962) Thanks [@VicAlbr](https://github.com/VicAlbr)! - test(e2e): hardcode the HBAR to XRP swap amount to 500 as a temporary workaround for LIVE-33611; revert once the swap "min amount for quotes" bug is fixed.

- [#19724](https://github.com/LedgerHQ/ledger-live/pull/19724) [`06138af`](https://github.com/LedgerHQ/ledger-live/commit/06138af41298aec793f5dcab5bc5bdb686296c4a) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Review buySell.spec (QAA-1107): pick the buy/sell provider from the available quotes via a shared deterministic weekly rotation helper (`pickRotatingProvider` in live-e2e-shared, used by both desktop and mobile) instead of hardcoded MoonPay, and expand sell coverage to BTC, ETH and USDT. Align the mobile BTC sell TMS link accordingly.

### Patch Changes

- Updated dependencies [[`f57602a`](https://github.com/LedgerHQ/ledger-live/commit/f57602a679ed08b437955a2858f84e3086d6e417), [`0ee3ad8`](https://github.com/LedgerHQ/ledger-live/commit/0ee3ad8ef853baa7b17bb4ca07f41f1bed12268e), [`c3c5329`](https://github.com/LedgerHQ/ledger-live/commit/c3c5329ffe69ed47a1f3a8910ae7fd8b53486f24), [`7708345`](https://github.com/LedgerHQ/ledger-live/commit/77083455c985349f5a2061db4c22b2fa8ce758f9), [`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a), [`2388d41`](https://github.com/LedgerHQ/ledger-live/commit/2388d4171bd2e5caa2009e8eadcd06548d2209ef), [`28c29a1`](https://github.com/LedgerHQ/ledger-live/commit/28c29a1e6f4c28edfeba59483876b130a6e6b97c), [`b2fe0f0`](https://github.com/LedgerHQ/ledger-live/commit/b2fe0f0b9bf9cb5976f4d7f21e24654d60acfcf2), [`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`d243bd0`](https://github.com/LedgerHQ/ledger-live/commit/d243bd0cd2489a836961a724e60f6049a27f74d6), [`f6e5b74`](https://github.com/LedgerHQ/ledger-live/commit/f6e5b7453015db453e604052b115dd9996f266fa), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`ea28df4`](https://github.com/LedgerHQ/ledger-live/commit/ea28df4a67e1c1f64ab0de5fddf7fc016edffa8c), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`9bca613`](https://github.com/LedgerHQ/ledger-live/commit/9bca6135575e4a05db6fdccffa61173b5a438115), [`5c5e022`](https://github.com/LedgerHQ/ledger-live/commit/5c5e022e870e44adcb59215e6a672838b0194310), [`404072e`](https://github.com/LedgerHQ/ledger-live/commit/404072eca7c9fa94ba4da55218504b9a5be07983), [`2eac6a1`](https://github.com/LedgerHQ/ledger-live/commit/2eac6a17b629be3f8ba08cdf650413083b89476e), [`f6ac3dd`](https://github.com/LedgerHQ/ledger-live/commit/f6ac3ddb1bc8fdbbe20cb4222b7229296f61bdba), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`0936000`](https://github.com/LedgerHQ/ledger-live/commit/093600077d11e92a790e2d9ef31fa3519b41274a), [`bd21084`](https://github.com/LedgerHQ/ledger-live/commit/bd21084eef567c13225adbd613eacc046856f9d7), [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`06138af`](https://github.com/LedgerHQ/ledger-live/commit/06138af41298aec793f5dcab5bc5bdb686296c4a), [`f9f5db4`](https://github.com/LedgerHQ/ledger-live/commit/f9f5db46534f5294fdbb3fe12a971ed4f11e6c2d), [`93c54da`](https://github.com/LedgerHQ/ledger-live/commit/93c54daf4076e1163a9b7db86107ab2765b81b5d), [`b4ecf97`](https://github.com/LedgerHQ/ledger-live/commit/b4ecf97c0d16a686078c995f7218a256916a9e39), [`36bbe18`](https://github.com/LedgerHQ/ledger-live/commit/36bbe18500ad6f7aeb74b4a5366994ec7495f761), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7), [`caa76a1`](https://github.com/LedgerHQ/ledger-live/commit/caa76a113979e2d06c6cb2bb950e75a1f33cbe20), [`d63b9ef`](https://github.com/LedgerHQ/ledger-live/commit/d63b9efdc035ddc33a11fcc6877cd6b63f22ec3e)]:
  - @ledgerhq/live-common@36.6.0
  - @ledgerhq/live-wallet@0.30.0
  - @shared/feature-flags@0.15.0
  - @ledgerhq/live-e2e-shared@0.4.0
  - @ledgerhq/live-cli@26.1.0
  - @ledgerhq/ledger-key-ring-protocol@0.17.1

## 0.34.0-next.1

### Patch Changes

- Updated dependencies [[`b2fe0f0`](https://github.com/LedgerHQ/ledger-live/commit/b2fe0f0b9bf9cb5976f4d7f21e24654d60acfcf2)]:
  - @ledgerhq/live-common@36.6.0-next.1
  - @ledgerhq/live-cli@26.1.0-next.1
  - @ledgerhq/live-e2e-shared@0.4.0-next.1

## 0.34.0-next.0

### Minor Changes

- [#19767](https://github.com/LedgerHQ/ledger-live/pull/19767) [`5077c9e`](https://github.com/LedgerHQ/ledger-live/commit/5077c9e2f217da78cdfe4811c0a3c19054ce7cda) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add Playwright E2E for Borrow cold-start (B2CQA-6062, LIVE-33746) and open-loan with
  Speculos signing on ETH 4 (B2CQA-6065, LIVE-34606) in `borrow.spec.ts`.

  Run cold-start: `pnpm e2e:desktop test:playwright borrow --grep "Introducing Crypto Loan"`.
  Run open-loan (manual E2E, `enable_broadcast`): `pnpm e2e:desktop test:playwright borrow --grep "open-loan execution"`.

- [#19854](https://github.com/LedgerHQ/ledger-live/pull/19854) [`c3c5329`](https://github.com/LedgerHQ/ledger-live/commit/c3c5329ffe69ed47a1f3a8910ae7fd8b53486f24) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(algo): restore Algorand memo in new send flow with protocol 1024-byte note limit

- [#19366](https://github.com/LedgerHQ/ledger-live/pull/19366) [`0936000`](https://github.com/LedgerHQ/ledger-live/commit/093600077d11e92a790e2d9ef31fa3519b41274a) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(e2e): add tokens tests and more coverage for the new send flow

- [#19888](https://github.com/LedgerHQ/ledger-live/pull/19888) [`f8a6ef6`](https://github.com/LedgerHQ/ledger-live/commit/f8a6ef66a6548c3d729e6db985cc05067013b962) Thanks [@VicAlbr](https://github.com/VicAlbr)! - test(e2e): hardcode the HBAR to XRP swap amount to 500 as a temporary workaround for LIVE-33611; revert once the swap "min amount for quotes" bug is fixed.

- [#19724](https://github.com/LedgerHQ/ledger-live/pull/19724) [`06138af`](https://github.com/LedgerHQ/ledger-live/commit/06138af41298aec793f5dcab5bc5bdb686296c4a) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Review buySell.spec (QAA-1107): pick the buy/sell provider from the available quotes via a shared deterministic weekly rotation helper (`pickRotatingProvider` in live-e2e-shared, used by both desktop and mobile) instead of hardcoded MoonPay, and expand sell coverage to BTC, ETH and USDT. Align the mobile BTC sell TMS link accordingly.

### Patch Changes

- Updated dependencies [[`f57602a`](https://github.com/LedgerHQ/ledger-live/commit/f57602a679ed08b437955a2858f84e3086d6e417), [`0ee3ad8`](https://github.com/LedgerHQ/ledger-live/commit/0ee3ad8ef853baa7b17bb4ca07f41f1bed12268e), [`c3c5329`](https://github.com/LedgerHQ/ledger-live/commit/c3c5329ffe69ed47a1f3a8910ae7fd8b53486f24), [`7708345`](https://github.com/LedgerHQ/ledger-live/commit/77083455c985349f5a2061db4c22b2fa8ce758f9), [`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a), [`2388d41`](https://github.com/LedgerHQ/ledger-live/commit/2388d4171bd2e5caa2009e8eadcd06548d2209ef), [`28c29a1`](https://github.com/LedgerHQ/ledger-live/commit/28c29a1e6f4c28edfeba59483876b130a6e6b97c), [`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`d243bd0`](https://github.com/LedgerHQ/ledger-live/commit/d243bd0cd2489a836961a724e60f6049a27f74d6), [`f6e5b74`](https://github.com/LedgerHQ/ledger-live/commit/f6e5b7453015db453e604052b115dd9996f266fa), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`ea28df4`](https://github.com/LedgerHQ/ledger-live/commit/ea28df4a67e1c1f64ab0de5fddf7fc016edffa8c), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`9bca613`](https://github.com/LedgerHQ/ledger-live/commit/9bca6135575e4a05db6fdccffa61173b5a438115), [`5c5e022`](https://github.com/LedgerHQ/ledger-live/commit/5c5e022e870e44adcb59215e6a672838b0194310), [`404072e`](https://github.com/LedgerHQ/ledger-live/commit/404072eca7c9fa94ba4da55218504b9a5be07983), [`22afc34`](https://github.com/LedgerHQ/ledger-live/commit/22afc34ac1ff55448414e85227c2d6da96395153), [`2eac6a1`](https://github.com/LedgerHQ/ledger-live/commit/2eac6a17b629be3f8ba08cdf650413083b89476e), [`f6ac3dd`](https://github.com/LedgerHQ/ledger-live/commit/f6ac3ddb1bc8fdbbe20cb4222b7229296f61bdba), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`0936000`](https://github.com/LedgerHQ/ledger-live/commit/093600077d11e92a790e2d9ef31fa3519b41274a), [`bd21084`](https://github.com/LedgerHQ/ledger-live/commit/bd21084eef567c13225adbd613eacc046856f9d7), [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`06138af`](https://github.com/LedgerHQ/ledger-live/commit/06138af41298aec793f5dcab5bc5bdb686296c4a), [`f9f5db4`](https://github.com/LedgerHQ/ledger-live/commit/f9f5db46534f5294fdbb3fe12a971ed4f11e6c2d), [`93c54da`](https://github.com/LedgerHQ/ledger-live/commit/93c54daf4076e1163a9b7db86107ab2765b81b5d), [`b4ecf97`](https://github.com/LedgerHQ/ledger-live/commit/b4ecf97c0d16a686078c995f7218a256916a9e39), [`36bbe18`](https://github.com/LedgerHQ/ledger-live/commit/36bbe18500ad6f7aeb74b4a5366994ec7495f761), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7), [`caa76a1`](https://github.com/LedgerHQ/ledger-live/commit/caa76a113979e2d06c6cb2bb950e75a1f33cbe20), [`d63b9ef`](https://github.com/LedgerHQ/ledger-live/commit/d63b9efdc035ddc33a11fcc6877cd6b63f22ec3e)]:
  - @ledgerhq/live-common@36.6.0-next.0
  - @ledgerhq/live-wallet@0.30.0-next.0
  - @shared/feature-flags@0.15.0-next.0
  - @ledgerhq/live-e2e-shared@0.4.0-next.0
  - @ledgerhq/live-cli@26.1.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.17.1-next.0

## 0.33.0

### Minor Changes

- [#19402](https://github.com/LedgerHQ/ledger-live/pull/19402) [`bc511d2`](https://github.com/LedgerHQ/ledger-live/commit/bc511d29067615b57afc64ba113e4bc2cee20856) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix desktop e2e tests for W4.0 feature flag compatibility

- [#19315](https://github.com/LedgerHQ/ledger-live/pull/19315) [`e9329c2`](https://github.com/LedgerHQ/ledger-live/commit/e9329c22c2353119d8ccba9a2a2deaff76858bbd) Thanks [@jeportie](https://github.com/jeportie)! - Add E2E coverage for the swap cross-account warning across DEX providers (1inch, Velora, Uniswap, OKX) on Desktop (Playwright) and Mobile (Detox): swapping a token to a different account of the destination currency must surface the "Cross-account swaps are not currently supported" message. Mobile now selects a specific destination account via `modularDrawer.selectAssetAndAccount` / the opt-in `selectSpecificToAccount` flag in `performSwapUntilQuoteSelectionStep` (previously the drawer always kept the first account), and relaunches a fresh app per provider for test isolation. `@ledgerhq/live-e2e-shared` exports `keepRunningProviders` for provider-health skipping.

- [#19394](https://github.com/LedgerHQ/ledger-live/pull/19394) [`be7f5f3`](https://github.com/LedgerHQ/ledger-live/commit/be7f5f3a659597e1f27d9996a087391962be5c6e) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Review delegate.spec (QAA-1113): add a Celo vote test, move the ETH liveApp delegation test to earn.v2, and remove the per-currency if/else in the "Delegate" and "Delegate without Broadcasting" specs.

- [#19475](https://github.com/LedgerHQ/ledger-live/pull/19475) [`d2c3ffa`](https://github.com/LedgerHQ/ledger-live/commit/d2c3ffa8814e4d1921206f2f140292f734ff8f69) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add SUI delegate and undelegate e2e tests for LWD and LWM, with supporting testIds

### Patch Changes

- Updated dependencies [[`ca37cfe`](https://github.com/LedgerHQ/ledger-live/commit/ca37cfe7f451b88ebd76a9da7af70fcc6577cc53), [`1f34a90`](https://github.com/LedgerHQ/ledger-live/commit/1f34a9055ccaea91ee2ab98a7b10ef1afc968e85), [`e793664`](https://github.com/LedgerHQ/ledger-live/commit/e793664c0e9b14a598c55f3dd36ae9803ec5dde3), [`8df21c9`](https://github.com/LedgerHQ/ledger-live/commit/8df21c94922550dd6dfe5448afa79b32cfa94a92), [`c75213b`](https://github.com/LedgerHQ/ledger-live/commit/c75213b0c649cc0acfdbabacd62e07848ccee842), [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`2c28696`](https://github.com/LedgerHQ/ledger-live/commit/2c2869679a266a0a330547db0dfb6a13d11b19aa), [`45584e4`](https://github.com/LedgerHQ/ledger-live/commit/45584e4b87ad8ffea9a0e6ba48e196d14164c84a), [`39ed467`](https://github.com/LedgerHQ/ledger-live/commit/39ed467b46543e040bb1d16002f90ff1ec1ef172), [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d), [`bc0573e`](https://github.com/LedgerHQ/ledger-live/commit/bc0573e3bf73e47ad4f8a58e228a3e11e0866e6e), [`ea792bc`](https://github.com/LedgerHQ/ledger-live/commit/ea792bc06b9eb9931d75823bff63186202d3e2de), [`75a33a8`](https://github.com/LedgerHQ/ledger-live/commit/75a33a8ef74a6eef6236bb5db873cadd35643705), [`bae43dd`](https://github.com/LedgerHQ/ledger-live/commit/bae43ddc50439d2a7f18852f2b727e24de0169ed), [`71884d7`](https://github.com/LedgerHQ/ledger-live/commit/71884d759a86bc36ce3f6776ed1c59a2b984343b), [`68dffc1`](https://github.com/LedgerHQ/ledger-live/commit/68dffc18a73915e67739b9206112233574358304), [`b3557c0`](https://github.com/LedgerHQ/ledger-live/commit/b3557c0c7c2b1388f5e0a7270ee4847b1cf53ff6), [`8fd4f90`](https://github.com/LedgerHQ/ledger-live/commit/8fd4f9019c1b3015eaa74ddad62dd786976913f7), [`0040b67`](https://github.com/LedgerHQ/ledger-live/commit/0040b67ca4d65ebf2fede15f625e5958f507d879), [`9479c28`](https://github.com/LedgerHQ/ledger-live/commit/9479c284321915f7d5139746f3f924b1ad2685c3), [`6627cb7`](https://github.com/LedgerHQ/ledger-live/commit/6627cb7ef2627c6e3ac520d01db6b2deefdfe7f3), [`083452c`](https://github.com/LedgerHQ/ledger-live/commit/083452c72359a52c363e7de95e53b98f0c6ed906), [`3fc5836`](https://github.com/LedgerHQ/ledger-live/commit/3fc583609116bcf40956ccafeaadc733e11040b0), [`cd43e66`](https://github.com/LedgerHQ/ledger-live/commit/cd43e6689983aefdc3548ac6dcfb86521a1535ff), [`660f715`](https://github.com/LedgerHQ/ledger-live/commit/660f715056524ee46a2bcc4d94b0adffdc290aa0), [`a5a7fae`](https://github.com/LedgerHQ/ledger-live/commit/a5a7fae90b6921d6c94f3ca1e5f1852ac72938eb), [`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7), [`2ee5ac1`](https://github.com/LedgerHQ/ledger-live/commit/2ee5ac15540a462143b61f2d546063ed9c8cfe40), [`07bfc2c`](https://github.com/LedgerHQ/ledger-live/commit/07bfc2cbcf3c63b55224dec2aef1818d22c2315c), [`77c8a26`](https://github.com/LedgerHQ/ledger-live/commit/77c8a264f2c50fc1d10a5267afb2290b24f4f572), [`3e127f7`](https://github.com/LedgerHQ/ledger-live/commit/3e127f7385f5da907d4a08447c3f7582a9ac4f3f), [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10), [`279b755`](https://github.com/LedgerHQ/ledger-live/commit/279b755ce19d8157c75295d21ad18d1cc2503e79), [`eefaded`](https://github.com/LedgerHQ/ledger-live/commit/eefaded9e81566898f1551e144a805efe60390fe), [`d9dc6e6`](https://github.com/LedgerHQ/ledger-live/commit/d9dc6e621df877b13148688adec0b038983574e0), [`9ab95f0`](https://github.com/LedgerHQ/ledger-live/commit/9ab95f08bcfef089e0d0c0107e0b6501c7c2fef4), [`e9329c2`](https://github.com/LedgerHQ/ledger-live/commit/e9329c22c2353119d8ccba9a2a2deaff76858bbd), [`ad38c6d`](https://github.com/LedgerHQ/ledger-live/commit/ad38c6da54e35e14c53237f9ca4369091f15e8a0), [`edc897d`](https://github.com/LedgerHQ/ledger-live/commit/edc897d25e91f426065ce4eab89882192cb1327c), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`44a08fa`](https://github.com/LedgerHQ/ledger-live/commit/44a08fa1cbbd560da60cee496af1ffa49dc380da), [`26e7fbd`](https://github.com/LedgerHQ/ledger-live/commit/26e7fbd02929042b3f32c6d8cb73db6e3d070709), [`92b234f`](https://github.com/LedgerHQ/ledger-live/commit/92b234fb80a0fdeb9a36ed8917d542a912e817ed), [`fd9da5e`](https://github.com/LedgerHQ/ledger-live/commit/fd9da5e2b3a1e5300d012b826f3707535d07b1d9), [`f2de6f4`](https://github.com/LedgerHQ/ledger-live/commit/f2de6f4813889b9450266aa90d8436569107185d), [`e56f1b5`](https://github.com/LedgerHQ/ledger-live/commit/e56f1b53b0ddcde7dc517aad7bf2bb1a33346d76), [`8238860`](https://github.com/LedgerHQ/ledger-live/commit/8238860c893b0688d2c59a3e042d7a227031547a)]:
  - @ledgerhq/live-common@36.5.0
  - @ledgerhq/live-cli@26.0.0
  - @shared/feature-flags@0.14.0
  - @ledgerhq/live-env@2.42.0
  - @ledgerhq/live-wallet@0.29.0
  - @ledgerhq/ledger-key-ring-protocol@0.17.0
  - @ledgerhq/live-e2e-shared@0.3.0
  - @ledgerhq/live-dmk-speculos@0.10.2

## 0.33.0-next.0

### Minor Changes

- [#19402](https://github.com/LedgerHQ/ledger-live/pull/19402) [`bc511d2`](https://github.com/LedgerHQ/ledger-live/commit/bc511d29067615b57afc64ba113e4bc2cee20856) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix desktop e2e tests for W4.0 feature flag compatibility

- [#19315](https://github.com/LedgerHQ/ledger-live/pull/19315) [`e9329c2`](https://github.com/LedgerHQ/ledger-live/commit/e9329c22c2353119d8ccba9a2a2deaff76858bbd) Thanks [@jeportie](https://github.com/jeportie)! - Add E2E coverage for the swap cross-account warning across DEX providers (1inch, Velora, Uniswap, OKX) on Desktop (Playwright) and Mobile (Detox): swapping a token to a different account of the destination currency must surface the "Cross-account swaps are not currently supported" message. Mobile now selects a specific destination account via `modularDrawer.selectAssetAndAccount` / the opt-in `selectSpecificToAccount` flag in `performSwapUntilQuoteSelectionStep` (previously the drawer always kept the first account), and relaunches a fresh app per provider for test isolation. `@ledgerhq/live-e2e-shared` exports `keepRunningProviders` for provider-health skipping.

- [#19394](https://github.com/LedgerHQ/ledger-live/pull/19394) [`be7f5f3`](https://github.com/LedgerHQ/ledger-live/commit/be7f5f3a659597e1f27d9996a087391962be5c6e) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Review delegate.spec (QAA-1113): add a Celo vote test, move the ETH liveApp delegation test to earn.v2, and remove the per-currency if/else in the "Delegate" and "Delegate without Broadcasting" specs.

- [#19475](https://github.com/LedgerHQ/ledger-live/pull/19475) [`d2c3ffa`](https://github.com/LedgerHQ/ledger-live/commit/d2c3ffa8814e4d1921206f2f140292f734ff8f69) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add SUI delegate and undelegate e2e tests for LWD and LWM, with supporting testIds

### Patch Changes

- Updated dependencies [[`ca37cfe`](https://github.com/LedgerHQ/ledger-live/commit/ca37cfe7f451b88ebd76a9da7af70fcc6577cc53), [`1f34a90`](https://github.com/LedgerHQ/ledger-live/commit/1f34a9055ccaea91ee2ab98a7b10ef1afc968e85), [`e793664`](https://github.com/LedgerHQ/ledger-live/commit/e793664c0e9b14a598c55f3dd36ae9803ec5dde3), [`8df21c9`](https://github.com/LedgerHQ/ledger-live/commit/8df21c94922550dd6dfe5448afa79b32cfa94a92), [`c75213b`](https://github.com/LedgerHQ/ledger-live/commit/c75213b0c649cc0acfdbabacd62e07848ccee842), [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`2c28696`](https://github.com/LedgerHQ/ledger-live/commit/2c2869679a266a0a330547db0dfb6a13d11b19aa), [`45584e4`](https://github.com/LedgerHQ/ledger-live/commit/45584e4b87ad8ffea9a0e6ba48e196d14164c84a), [`39ed467`](https://github.com/LedgerHQ/ledger-live/commit/39ed467b46543e040bb1d16002f90ff1ec1ef172), [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d), [`bc0573e`](https://github.com/LedgerHQ/ledger-live/commit/bc0573e3bf73e47ad4f8a58e228a3e11e0866e6e), [`ea792bc`](https://github.com/LedgerHQ/ledger-live/commit/ea792bc06b9eb9931d75823bff63186202d3e2de), [`75a33a8`](https://github.com/LedgerHQ/ledger-live/commit/75a33a8ef74a6eef6236bb5db873cadd35643705), [`bae43dd`](https://github.com/LedgerHQ/ledger-live/commit/bae43ddc50439d2a7f18852f2b727e24de0169ed), [`71884d7`](https://github.com/LedgerHQ/ledger-live/commit/71884d759a86bc36ce3f6776ed1c59a2b984343b), [`68dffc1`](https://github.com/LedgerHQ/ledger-live/commit/68dffc18a73915e67739b9206112233574358304), [`b3557c0`](https://github.com/LedgerHQ/ledger-live/commit/b3557c0c7c2b1388f5e0a7270ee4847b1cf53ff6), [`8fd4f90`](https://github.com/LedgerHQ/ledger-live/commit/8fd4f9019c1b3015eaa74ddad62dd786976913f7), [`0040b67`](https://github.com/LedgerHQ/ledger-live/commit/0040b67ca4d65ebf2fede15f625e5958f507d879), [`9479c28`](https://github.com/LedgerHQ/ledger-live/commit/9479c284321915f7d5139746f3f924b1ad2685c3), [`6627cb7`](https://github.com/LedgerHQ/ledger-live/commit/6627cb7ef2627c6e3ac520d01db6b2deefdfe7f3), [`083452c`](https://github.com/LedgerHQ/ledger-live/commit/083452c72359a52c363e7de95e53b98f0c6ed906), [`3fc5836`](https://github.com/LedgerHQ/ledger-live/commit/3fc583609116bcf40956ccafeaadc733e11040b0), [`cd43e66`](https://github.com/LedgerHQ/ledger-live/commit/cd43e6689983aefdc3548ac6dcfb86521a1535ff), [`660f715`](https://github.com/LedgerHQ/ledger-live/commit/660f715056524ee46a2bcc4d94b0adffdc290aa0), [`a5a7fae`](https://github.com/LedgerHQ/ledger-live/commit/a5a7fae90b6921d6c94f3ca1e5f1852ac72938eb), [`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7), [`2ee5ac1`](https://github.com/LedgerHQ/ledger-live/commit/2ee5ac15540a462143b61f2d546063ed9c8cfe40), [`07bfc2c`](https://github.com/LedgerHQ/ledger-live/commit/07bfc2cbcf3c63b55224dec2aef1818d22c2315c), [`77c8a26`](https://github.com/LedgerHQ/ledger-live/commit/77c8a264f2c50fc1d10a5267afb2290b24f4f572), [`3e127f7`](https://github.com/LedgerHQ/ledger-live/commit/3e127f7385f5da907d4a08447c3f7582a9ac4f3f), [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10), [`279b755`](https://github.com/LedgerHQ/ledger-live/commit/279b755ce19d8157c75295d21ad18d1cc2503e79), [`eefaded`](https://github.com/LedgerHQ/ledger-live/commit/eefaded9e81566898f1551e144a805efe60390fe), [`d9dc6e6`](https://github.com/LedgerHQ/ledger-live/commit/d9dc6e621df877b13148688adec0b038983574e0), [`9ab95f0`](https://github.com/LedgerHQ/ledger-live/commit/9ab95f08bcfef089e0d0c0107e0b6501c7c2fef4), [`e9329c2`](https://github.com/LedgerHQ/ledger-live/commit/e9329c22c2353119d8ccba9a2a2deaff76858bbd), [`ad38c6d`](https://github.com/LedgerHQ/ledger-live/commit/ad38c6da54e35e14c53237f9ca4369091f15e8a0), [`edc897d`](https://github.com/LedgerHQ/ledger-live/commit/edc897d25e91f426065ce4eab89882192cb1327c), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`44a08fa`](https://github.com/LedgerHQ/ledger-live/commit/44a08fa1cbbd560da60cee496af1ffa49dc380da), [`26e7fbd`](https://github.com/LedgerHQ/ledger-live/commit/26e7fbd02929042b3f32c6d8cb73db6e3d070709), [`92b234f`](https://github.com/LedgerHQ/ledger-live/commit/92b234fb80a0fdeb9a36ed8917d542a912e817ed), [`fd9da5e`](https://github.com/LedgerHQ/ledger-live/commit/fd9da5e2b3a1e5300d012b826f3707535d07b1d9), [`f2de6f4`](https://github.com/LedgerHQ/ledger-live/commit/f2de6f4813889b9450266aa90d8436569107185d), [`e56f1b5`](https://github.com/LedgerHQ/ledger-live/commit/e56f1b53b0ddcde7dc517aad7bf2bb1a33346d76), [`8238860`](https://github.com/LedgerHQ/ledger-live/commit/8238860c893b0688d2c59a3e042d7a227031547a)]:
  - @ledgerhq/live-common@36.5.0-next.0
  - @ledgerhq/live-cli@26.0.0-next.0
  - @shared/feature-flags@0.14.0-next.0
  - @ledgerhq/live-env@2.42.0-next.0
  - @ledgerhq/live-wallet@0.29.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.17.0-next.0
  - @ledgerhq/live-e2e-shared@0.3.0-next.0
  - @ledgerhq/live-dmk-speculos@0.10.2-next.0

## 0.32.0

### Minor Changes

- [#19627](https://github.com/LedgerHQ/ledger-live/pull/19627) [`8e3b521`](https://github.com/LedgerHQ/ledger-live/commit/8e3b521c9604cf0b753f056a2c65556d9f91ae79) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Merge release branch into hotfix support branch, resolving version and changelog conflicts

- [#19027](https://github.com/LedgerHQ/ledger-live/pull/19027) [`e0b8fee`](https://github.com/LedgerHQ/ledger-live/commit/e0b8feed6c1ecf4c1c019c1454c03107f64abbe1) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add a provider selection step for Solana in the desktop delegation e2e flow so the test selects a provider, continues and fills the amount before validating the staking transaction

- [#19062](https://github.com/LedgerHQ/ledger-live/pull/19062) [`5ccd2a9`](https://github.com/LedgerHQ/ledger-live/commit/5ccd2a9c229e8007851c6eb8b01c866c8e605932) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Extract E2E test-support code out of `@ledgerhq/live-common`

  Moved the E2E enums, models, family helpers and speculos/device utilities that lived under
  `@ledgerhq/live-common/e2e/*` into a new dedicated, private package `@ledgerhq/live-e2e-shared`
  (located under `e2e/`, alongside the Desktop and Mobile E2E suites). This keeps test-only code
  out of `live-common`, which is in maintenance mode.

  - `@ledgerhq/live-common`: removed the internal `./e2e` export.
  - `@shared/feature-flags`: now exports `getAllFeatureFlags` (previously in the live-common e2e
    module), so production debug tooling no longer depends on test code.
  - `ledger-live-desktop`: the `devices` reducer now derives the Speculos device model from a small
    local map instead of importing from the e2e module.
  - Desktop/Mobile apps and E2E suites now import from `@ledgerhq/live-e2e-shared`.

- [#19036](https://github.com/LedgerHQ/ledger-live/pull/19036) [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - remove marketbanner param from wallet4.0 FF

- [#19245](https://github.com/LedgerHQ/ledger-live/pull/19245) [`b5699a5`](https://github.com/LedgerHQ/ledger-live/commit/b5699a54d7edd5b3579a7f35d77a03d2b0506d19) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(algo): remove memo algorand in new send flow lwdm

- [#18957](https://github.com/LedgerHQ/ledger-live/pull/18957) [`9bdd94e`](https://github.com/LedgerHQ/ledger-live/commit/9bdd94ef2a307a6c7940b959edbcd62e61003b7c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a `shouldSelectReceiveCryptoOption` step to the sub-account receive e2e flow (used for ETH_USDT and ETH_LIDO) so the test selects the receive-crypto option from the receive menu before continuing.

- [#19084](https://github.com/LedgerHQ/ledger-live/pull/19084) [`01034a2`](https://github.com/LedgerHQ/ledger-live/commit/01034a299c997d6696af00d28a8a485ea9e089ca) Thanks [@VicAlbr](https://github.com/VicAlbr)! - E2E Allure report overview now reflects the feature flags actually applied at runtime (e2e defaults + workflow `E2E_FEATURE_FLAGS_JSON` overrides, with JSON taking precedence), instead of Firebase-only values. FF resolution is centralised per platform via a shared `getMergedFeatureFlags()` used by both the test setup and the report teardown, so the overview and per-test data share one source of truth.

- [#18889](https://github.com/LedgerHQ/ledger-live/pull/18889) [`487f2f2`](https://github.com/LedgerHQ/ledger-live/commit/487f2f25505c304a71fd7a42072c3f492ea98f67) Thanks [@semeano](https://github.com/semeano)! - Disable TON E2E tests

### Patch Changes

- Updated dependencies [[`80d44ad`](https://github.com/LedgerHQ/ledger-live/commit/80d44ade41f3bcb02a2b657c0fe3ca5e3bbdd0b3), [`20efcc6`](https://github.com/LedgerHQ/ledger-live/commit/20efcc67fd38bbba793e23abc1f62a14e29a1104), [`4b615c2`](https://github.com/LedgerHQ/ledger-live/commit/4b615c242a3b4d8ecb2ebf4e039a46e2bbfe5e19), [`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff), [`b98cce3`](https://github.com/LedgerHQ/ledger-live/commit/b98cce3ff564ab8499876b124a4a5f3a08e0066f), [`fe580b7`](https://github.com/LedgerHQ/ledger-live/commit/fe580b7a6205b5fe6e73ee7d67a93e8815b24295), [`8e3b521`](https://github.com/LedgerHQ/ledger-live/commit/8e3b521c9604cf0b753f056a2c65556d9f91ae79), [`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11), [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d), [`bb4e6db`](https://github.com/LedgerHQ/ledger-live/commit/bb4e6dbda83a6738d6ac375615f690e579ce4527), [`f9caf32`](https://github.com/LedgerHQ/ledger-live/commit/f9caf322be2e3b652e8ec06fb40aeb8e02e08c8a), [`3cb6159`](https://github.com/LedgerHQ/ledger-live/commit/3cb615918166922059304724f560c566d2671ac3), [`7a3c4a5`](https://github.com/LedgerHQ/ledger-live/commit/7a3c4a5a2dd0c1ca7382d4bc9c27d2e3bfc671a9), [`3b35b5e`](https://github.com/LedgerHQ/ledger-live/commit/3b35b5ea8a0c67c215150f2aee008fd1c1993463), [`7c27a44`](https://github.com/LedgerHQ/ledger-live/commit/7c27a446680a2e014e3154bbdd5e69673dd3e07c), [`1838412`](https://github.com/LedgerHQ/ledger-live/commit/18384123adca558b00323f169dffc0daf117b822), [`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec), [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e), [`1e17c12`](https://github.com/LedgerHQ/ledger-live/commit/1e17c127178a871b665b25d6f4208d4613826dd1), [`ca07aac`](https://github.com/LedgerHQ/ledger-live/commit/ca07aac857c58e3d85beab71b246d8af687431f3), [`63dcc63`](https://github.com/LedgerHQ/ledger-live/commit/63dcc636c4a1c360beb7ece0a3ee32ba7550b693), [`5ccd2a9`](https://github.com/LedgerHQ/ledger-live/commit/5ccd2a9c229e8007851c6eb8b01c866c8e605932), [`6400154`](https://github.com/LedgerHQ/ledger-live/commit/6400154daa131b225c6ec62c9134f1cd06370729), [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e), [`edebe91`](https://github.com/LedgerHQ/ledger-live/commit/edebe91895773e4e2c9f29bc0a991885d2f44a77), [`acaf6d9`](https://github.com/LedgerHQ/ledger-live/commit/acaf6d991aec6bfcc7b6a0906d873f7d8e57eded), [`7914bd1`](https://github.com/LedgerHQ/ledger-live/commit/7914bd123d4f3b990db035f28dca4904420562ec), [`50ab44f`](https://github.com/LedgerHQ/ledger-live/commit/50ab44f07f628fd819dff28d8cdd14b1ca5e4962), [`2caa65c`](https://github.com/LedgerHQ/ledger-live/commit/2caa65c2ada66ef20c76950b5a2b01c49845f8eb), [`8d7f2b3`](https://github.com/LedgerHQ/ledger-live/commit/8d7f2b3d517780578799cc83152f6434381b2e26), [`8dd5685`](https://github.com/LedgerHQ/ledger-live/commit/8dd5685a0a42b8277846754f0251eaf38a12fa51), [`bfb5437`](https://github.com/LedgerHQ/ledger-live/commit/bfb543708a32256379067903c3f1c3ab46a323d3), [`e2d74f7`](https://github.com/LedgerHQ/ledger-live/commit/e2d74f7c5fe9883d6a141ce790a0b0aa92d7e53a), [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7), [`eab9b13`](https://github.com/LedgerHQ/ledger-live/commit/eab9b130e0a809d6dead08bbd1a588112da94e0c), [`b5699a5`](https://github.com/LedgerHQ/ledger-live/commit/b5699a54d7edd5b3579a7f35d77a03d2b0506d19), [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea), [`c1e9aa3`](https://github.com/LedgerHQ/ledger-live/commit/c1e9aa3a8851a85cf0ec9b0718177baf39cc9db8), [`5c2bc46`](https://github.com/LedgerHQ/ledger-live/commit/5c2bc46ce7e0dac5a9bfbf4089ca14868126bc96), [`34bccb5`](https://github.com/LedgerHQ/ledger-live/commit/34bccb5268c8b27f87f2ab0395e372d4f1d5d926), [`cc01b77`](https://github.com/LedgerHQ/ledger-live/commit/cc01b777c9b54ccf2a9f2b34f0281d3d7123b157), [`966d6a1`](https://github.com/LedgerHQ/ledger-live/commit/966d6a198412c12548575516a2ac72456c380181), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`c8b4ee7`](https://github.com/LedgerHQ/ledger-live/commit/c8b4ee77c03ca2117cbad039331b7b52e50d9620), [`a5a7fae`](https://github.com/LedgerHQ/ledger-live/commit/a5a7fae90b6921d6c94f3ca1e5f1852ac72938eb), [`6ddd641`](https://github.com/LedgerHQ/ledger-live/commit/6ddd64113a4c360a091fc1fd54256cfabaab5220), [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4), [`007f27e`](https://github.com/LedgerHQ/ledger-live/commit/007f27e81cce353a3ee6648543d54d06ae6e7a11), [`8ecbdde`](https://github.com/LedgerHQ/ledger-live/commit/8ecbdde35c80f7c363f1511fa8463155437b9612), [`3f71b7a`](https://github.com/LedgerHQ/ledger-live/commit/3f71b7af8419e92e907be029b7fed052288561b7), [`e9b1707`](https://github.com/LedgerHQ/ledger-live/commit/e9b17073cdf3266692adc4348c9a54f5597da4c8), [`c22afcb`](https://github.com/LedgerHQ/ledger-live/commit/c22afcba4dda045b2be9294abc67c5a96e5f4016), [`babad68`](https://github.com/LedgerHQ/ledger-live/commit/babad685139d06343f6a647686c713992ad1ac1a), [`fa0123a`](https://github.com/LedgerHQ/ledger-live/commit/fa0123a1da7b053d58afab498266cf830958e2ff), [`0e30cdc`](https://github.com/LedgerHQ/ledger-live/commit/0e30cdc29d7fb3cab5bf1f2ef7c24cf0a152516e), [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170), [`fa25271`](https://github.com/LedgerHQ/ledger-live/commit/fa252719220ca27fa4556ce9a02b84ccfca835c3), [`5a64d39`](https://github.com/LedgerHQ/ledger-live/commit/5a64d39ac89a125331c6d937642bf50d44255082), [`c6cf445`](https://github.com/LedgerHQ/ledger-live/commit/c6cf445c9bac5a56bcbf84ccda6b2b269d1ee61a), [`1f25437`](https://github.com/LedgerHQ/ledger-live/commit/1f254373fedec85e50364fdbc6bb9ec4fd5256b2), [`edacd7c`](https://github.com/LedgerHQ/ledger-live/commit/edacd7c60413812e13a20d6451d5870ff5ced34e), [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8), [`e3c0327`](https://github.com/LedgerHQ/ledger-live/commit/e3c032795a0432500a447b756503ce0aefd8c0f6), [`628f21f`](https://github.com/LedgerHQ/ledger-live/commit/628f21f5acf7d5866c0c956d41d69c760caf0caa), [`0fa8c6c`](https://github.com/LedgerHQ/ledger-live/commit/0fa8c6c7daf524f075623287418bc8ad74e464f3), [`5fc438e`](https://github.com/LedgerHQ/ledger-live/commit/5fc438ec9357c406717f4e4e8c136533198a38b7), [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3), [`57a48a5`](https://github.com/LedgerHQ/ledger-live/commit/57a48a5fb17e47c6ce686fe297344c2a580d84d7), [`4b2f537`](https://github.com/LedgerHQ/ledger-live/commit/4b2f537cf6ffd1ed20d2df63f6940dc13f68fbee), [`57a48a5`](https://github.com/LedgerHQ/ledger-live/commit/57a48a5fb17e47c6ce686fe297344c2a580d84d7), [`57a48a5`](https://github.com/LedgerHQ/ledger-live/commit/57a48a5fb17e47c6ce686fe297344c2a580d84d7), [`57a48a5`](https://github.com/LedgerHQ/ledger-live/commit/57a48a5fb17e47c6ce686fe297344c2a580d84d7), [`376915c`](https://github.com/LedgerHQ/ledger-live/commit/376915ca520ecc1708090ed9b3eba1ff7e780540), [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff), [`154ff71`](https://github.com/LedgerHQ/ledger-live/commit/154ff7146a642d7953a91394022eeda5d437c450), [`8169225`](https://github.com/LedgerHQ/ledger-live/commit/81692256d96fd47acf288c0f646b15c92fe8d7be), [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc), [`df088d2`](https://github.com/LedgerHQ/ledger-live/commit/df088d26908b24e936bc8d6f508a438d151222f0), [`2160260`](https://github.com/LedgerHQ/ledger-live/commit/2160260cc0d660331c05f1bfdb0a4f28d486e275), [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55), [`9c42adf`](https://github.com/LedgerHQ/ledger-live/commit/9c42adf9e20ac7c9b4418652a40b5552afe6106d), [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e), [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33), [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a), [`596a445`](https://github.com/LedgerHQ/ledger-live/commit/596a4452f04afbffdf0935e946e691f7775cb80c), [`0e302a5`](https://github.com/LedgerHQ/ledger-live/commit/0e302a5a2e71a63af7e79d9a195e5e2cca36642c), [`363ac4d`](https://github.com/LedgerHQ/ledger-live/commit/363ac4d27f4e71b1e6e00b1c128bc199d1170839), [`e0b2f53`](https://github.com/LedgerHQ/ledger-live/commit/e0b2f53c10d88554f6e9082f728fb3cfff7e805c), [`e9a51af`](https://github.com/LedgerHQ/ledger-live/commit/e9a51afa1d2a79d856e1487ab3bd77670ccc5e86)]:
  - @ledgerhq/live-common@36.4.0
  - @shared/feature-flags@0.13.0
  - @ledgerhq/live-cli@25.0.0
  - @ledgerhq/live-env@2.41.0
  - @ledgerhq/live-e2e-shared@0.2.0
  - @ledgerhq/ledger-key-ring-protocol@0.16.0
  - @ledgerhq/live-wallet@0.28.0
  - @ledgerhq/live-dmk-speculos@0.10.1

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
