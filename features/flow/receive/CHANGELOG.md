# @features/flow-receive

## 0.4.0-next.0

### Minor Changes

- [#25428](https://github.com/LedgerHQ/ledger-live/pull/25428) [`452b4ed`](https://github.com/LedgerHQ/ledger-live/commit/452b4ed3cc44a6c9dc9726dfe0aa840b0cd3babd) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Follow coin-modules ADR-079: the coin module account status answers `activated` instead of `isOnboarded`, each field optional, and the asset activation gate no longer names its method

- [#25436](https://github.com/LedgerHQ/ledger-live/pull/25436) [`8030207`](https://github.com/LedgerHQ/ledger-live/commit/803020759f7f1b66ddeede81a2cd88c4fc36708a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Keep `@domain/entity-account-descriptor` for the edges: AccountUUID moves to `@domain/entity-account`, NetworkId and Address to the new `@domain/entity-network`, DerivationPath and the legacy path bridges to `@domain/entity-derivation`

- [#25374](https://github.com/LedgerHQ/ledger-live/pull/25374) [`ef04300`](https://github.com/LedgerHQ/ledger-live/commit/ef04300008fd43cd44b74d252653d72c13a4175a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Share, Copy and Verify tiles, the verify hint and copy from a press on the QR code to the mobile receive screen; Share sends an image of the address card through the new @shared/share-sheet package, which Pay Tab now uses too

- [#25423](https://github.com/LedgerHQ/ledger-live/pull/25423) [`ed00958`](https://github.com/LedgerHQ/ledger-live/commit/ed00958b914fefe16416405ab3e109f0b2b1d67e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - useAccountData and useAccountDataBatch take the AccountUUID and read the descriptor from the accounts slice

- [#25579](https://github.com/LedgerHQ/ledger-live/pull/25579) [`ed3d726`](https://github.com/LedgerHQ/ledger-live/commit/ed3d726cb936e75f9a54bc782bd97103dafbe51f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Receive flow holds only the AccountUUID: network from the asset, assetStatus read for every asset, taproot from the legacy account

- [#25243](https://github.com/LedgerHQ/ledger-live/pull/25243) [`3b1517c`](https://github.com/LedgerHQ/ledger-live/commit/3b1517ccc795bd9db1661b7ae4a2fd4e97918f58) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add Copy, Share and Verify to the receive address screen

- [#25261](https://github.com/LedgerHQ/ledger-live/pull/25261) [`f60f5cf`](https://github.com/LedgerHQ/ledger-live/commit/f60f5cf9649b38011656bde091713fc3f404c237) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Copy and Verify tiles, the verify hint and copy from a click on the QR code to the desktop receive screen

- [#25264](https://github.com/LedgerHQ/ledger-live/pull/25264) [`8fa7713`](https://github.com/LedgerHQ/ledger-live/commit/8fa7713bdf17583286e3c2cd4cd0fdd75b11a0b9) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Keep the network badge border of the receive QR code icon light in dark theme on desktop

- [#25323](https://github.com/LedgerHQ/ledger-live/pull/25323) [`514ccdb`](https://github.com/LedgerHQ/ledger-live/commit/514ccdb44d56aaba35f51dac57debf98b6a37533) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Verify shows the receive address on the device, then Got it: the device check runs before the address is shown, the Verified screen is removed, and a mismatch returned by the device still shows its warning

- [#25360](https://github.com/LedgerHQ/ledger-live/pull/25360) [`31557d8`](https://github.com/LedgerHQ/ledger-live/commit/31557d8791d9ab9fb63132ddbd03e91320e5ef7b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - The receive address QR code on mobile shows the asset icon without its network badge

- [#25595](https://github.com/LedgerHQ/ledger-live/pull/25595) [`43ab12c`](https://github.com/LedgerHQ/ledger-live/commit/43ab12c6ed56e638dadeecb2b623b233ac7afd5c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Receive: soft haptic feedback when the address is copied from Copy or the QR code on mobile

- [#25554](https://github.com/LedgerHQ/ledger-live/pull/25554) [`141fa5b`](https://github.com/LedgerHQ/ledger-live/commit/141fa5bac5b997f2c243248b29aa23bc78eacf16) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Receive address screen: onboarding and activation states, with a port for the app to open the family flow

- [#25679](https://github.com/LedgerHQ/ledger-live/pull/25679) [`9aae059`](https://github.com/LedgerHQ/ledger-live/commit/9aae059686c0668d32da2f83be3bfa5803c8d489) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Receive address (mobile): "Need support? Get help" sits at the bottom of a short screen

- [#25524](https://github.com/LedgerHQ/ledger-live/pull/25524) [`5ac8385`](https://github.com/LedgerHQ/ledger-live/commit/5ac8385c5dcd43b8bc0686e6c0c98d14358c0e00) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Receive address screen: help card and FAQ data, with their events. The screen opens its links through `@shared/linking`, support articles in the user's language; `useUrlLocalizer` localizes any URL, and `isSafeUrl` tells whether the opener accepts a URL; incident links it refuses show as text

- [#25533](https://github.com/LedgerHQ/ledger-live/pull/25533) [`5dcb721`](https://github.com/LedgerHQ/ledger-live/commit/5dcb721fabb3ad922f9751a6c1d7a9b3045fe9eb) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Receive address dialog: "Need support? Get help" card and its help panel

- [#25585](https://github.com/LedgerHQ/ledger-live/pull/25585) [`3b1afb5`](https://github.com/LedgerHQ/ledger-live/commit/3b1afb550854b13348417fdc3f20d22153f7088b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Receive help sheet rows line up with the other lists of the app

- [#25533](https://github.com/LedgerHQ/ledger-live/pull/25533) [`5dcb721`](https://github.com/LedgerHQ/ledger-live/commit/5dcb721fabb3ad922f9751a6c1d7a9b3045fe9eb) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Receive address screen: "Need support? Get help" card and its help bottom sheet

- [#25600](https://github.com/LedgerHQ/ledger-live/pull/25600) [`2d03bcd`](https://github.com/LedgerHQ/ledger-live/commit/2d03bcde5ad9e1020cfc5c89fd1eef47678e645a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Receive memo bottom sheet: header row with its close button, and the sheet's own 16px margin

- [#25560](https://github.com/LedgerHQ/ledger-live/pull/25560) [`4ff7ba9`](https://github.com/LedgerHQ/ledger-live/commit/4ff7ba9df28fd5aba07a336c2b4bffc6a43be342) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Receive address screen: "Need a Tag/Memo?" card, with its desktop panel and mobile bottom sheet

- [#25655](https://github.com/LedgerHQ/ledger-live/pull/25655) [`d822947`](https://github.com/LedgerHQ/ledger-live/commit/d8229475e9bb4cab8830be6566de6bb79a9d55b6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Receive asset picker: the network step explains which network to pick, with a "How to select the network?" help. Pay Request picks its asset in the receive flow

- [#25465](https://github.com/LedgerHQ/ledger-live/pull/25465) [`3158647`](https://github.com/LedgerHQ/ledger-live/commit/315864750caca883908aacb8f648710be980756c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Receive address screen on desktop: notice banners, and a service incident shown before the address

- [#25504](https://github.com/LedgerHQ/ledger-live/pull/25504) [`7716eba`](https://github.com/LedgerHQ/ledger-live/commit/7716eba4f80e7f80b3a03f526a4300a8f645edae) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Receive address screen on mobile: notice banners, and a service incident bottom sheet over the screen

- [#25429](https://github.com/LedgerHQ/ledger-live/pull/25429) [`b3e594b`](https://github.com/LedgerHQ/ledger-live/commit/b3e594b5b57e841703cf5b93806e06914de8239a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the notices of the receive address screen: the family's notices, the notice that the device cannot show the address, and the service incident warning with its page event

- [#25667](https://github.com/LedgerHQ/ledger-live/pull/25667) [`9be8d2b`](https://github.com/LedgerHQ/ledger-live/commit/9be8d2bcf55c9b751d2bbfb67af6faeb1f4660a4) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Receive address: a sanctioned address is never shown, the screen explains why with a link to the support article

### Patch Changes

- Updated dependencies [[`faeace9`](https://github.com/LedgerHQ/ledger-live/commit/faeace97ae3de8c6e403e66732bdc16d57d78296), [`452b4ed`](https://github.com/LedgerHQ/ledger-live/commit/452b4ed3cc44a6c9dc9726dfe0aa840b0cd3babd), [`9e67809`](https://github.com/LedgerHQ/ledger-live/commit/9e678098ea38d509fc4f19ffe05a2f06003a41c5), [`8030207`](https://github.com/LedgerHQ/ledger-live/commit/803020759f7f1b66ddeede81a2cd88c4fc36708a), [`0568a9d`](https://github.com/LedgerHQ/ledger-live/commit/0568a9d51bcc7244bad8ae415c7775697fc93811), [`d35cf10`](https://github.com/LedgerHQ/ledger-live/commit/d35cf10970da952fb6a760b6c839f28f0ec85758), [`5c7f0ef`](https://github.com/LedgerHQ/ledger-live/commit/5c7f0ef8aaebce9ac0dcf1eb509dd0756f389b10), [`ef04300`](https://github.com/LedgerHQ/ledger-live/commit/ef04300008fd43cd44b74d252653d72c13a4175a), [`7627a66`](https://github.com/LedgerHQ/ledger-live/commit/7627a66e667eb4b00ca417603c39d0adf5e2a094), [`5ea4203`](https://github.com/LedgerHQ/ledger-live/commit/5ea4203bdc7b89f7ef0ffe12ae9036b679320a97), [`ed00958`](https://github.com/LedgerHQ/ledger-live/commit/ed00958b914fefe16416405ab3e109f0b2b1d67e), [`089284b`](https://github.com/LedgerHQ/ledger-live/commit/089284b16bfee3dd5f6255799c58f5c8dbe108c8), [`35e9ca8`](https://github.com/LedgerHQ/ledger-live/commit/35e9ca85552282ddc37c47bc4212c81b06a2ee2c), [`4779bbd`](https://github.com/LedgerHQ/ledger-live/commit/4779bbd567b2f36cf01751c022a978b2d93cf288), [`31cc80c`](https://github.com/LedgerHQ/ledger-live/commit/31cc80c18f3eeed000ce3ee3d97e8e1bdcd1bb37), [`513bdba`](https://github.com/LedgerHQ/ledger-live/commit/513bdba4eee8332446903bb853ec5bc608cb46b9), [`baf40c7`](https://github.com/LedgerHQ/ledger-live/commit/baf40c7721ae8525c7d99d48667a749d8de4e59a), [`ed3d726`](https://github.com/LedgerHQ/ledger-live/commit/ed3d726cb936e75f9a54bc782bd97103dafbe51f), [`43ab12c`](https://github.com/LedgerHQ/ledger-live/commit/43ab12c6ed56e638dadeecb2b623b233ac7afd5c), [`5ac8385`](https://github.com/LedgerHQ/ledger-live/commit/5ac8385c5dcd43b8bc0686e6c0c98d14358c0e00), [`62493e1`](https://github.com/LedgerHQ/ledger-live/commit/62493e1d65a96ef1998f1ff8fd0e1880ae6190b9), [`78d27e7`](https://github.com/LedgerHQ/ledger-live/commit/78d27e7045c452d503ad88e1ffb4e2621ef00074)]:
  - @shared/feature-flags@0.33.0-next.0
  - @domain/entity-account-status@0.2.0-next.0
  - @domain/entity-account@0.5.0-next.0
  - @domain/entity-account-data@0.7.0-next.0
  - @domain/entity-account-receive@0.2.0-next.0
  - @features/platform-account-data@0.5.0-next.0
  - @shared/ui-info-state@0.9.0-next.0
  - @shared/share-sheet@0.2.0-next.0
  - @features/platform-currencies@0.15.0-next.0
  - @shared/ui-animated-qr-code@0.3.0-next.0
  - @shared/linking@0.5.0-next.0
  - @domain/entity-currency@0.5.2-next.0

## 0.3.0

### Minor Changes

- [#25127](https://github.com/LedgerHQ/ledger-live/pull/25127) [`aff97a0`](https://github.com/LedgerHQ/ledger-live/commit/aff97a0a8888e85a66b8d121f41adfa2ea884673) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Verify the receive address on the device with the Device Intent Executor, and show whether it matches once the user confirms on the device

- [#24775](https://github.com/LedgerHQ/ledger-live/pull/24775) [`99b84d2`](https://github.com/LedgerHQ/ledger-live/commit/99b84d26e7fe249a2d322d54472790afffaa4807) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add toReceiveTarget to find the account and asset to receive on in the account model

- [#25176](https://github.com/LedgerHQ/ledger-live/pull/25176) [`e53d295`](https://github.com/LedgerHQ/ledger-live/commit/e53d295fcb840a2e8a8433daac282a6f22098707) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show the asset, its network and a close button in the header of the new receive address dialog

- [#25181](https://github.com/LedgerHQ/ledger-live/pull/25181) [`6157b78`](https://github.com/LedgerHQ/ledger-live/commit/6157b78b2e7055b1389f7ed64a2fcccf26200c39) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show a close button, the asset and its network with its icon at the top of the new receive address screen

- [#25173](https://github.com/LedgerHQ/ledger-live/pull/25173) [`a8363ee`](https://github.com/LedgerHQ/ledger-live/commit/a8363eeb2cd97ce1942bfe0938ec317536e630c6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Name the asset received and its network on the new receive address screen

- [#25133](https://github.com/LedgerHQ/ledger-live/pull/25133) [`ac052f5`](https://github.com/LedgerHQ/ledger-live/commit/ac052f5c42e9151f445e3ff4b20e811fbcfa84b4) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Lay out the zones of the new receive address screen

- [#25225](https://github.com/LedgerHQ/ledger-live/pull/25225) [`fa94370`](https://github.com/LedgerHQ/ledger-live/commit/fa943701719e0fd0d6f9fb28f1c8bb90f6a7c5c9) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Animate the receive QR code on desktop too: a shimmer while the address loads, and a ripple when it is copied from the code or the Copy button

- [#25061](https://github.com/LedgerHQ/ledger-live/pull/25061) [`3c9c36d`](https://github.com/LedgerHQ/ledger-live/commit/3c9c36d4b6aba6232f04e124157bd8df08cf89da) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Route the receive entry points through one rule that opens the new receive screen behind the newReceiveFlow flag; onboarding keeps the legacy receive screen

- [#25047](https://github.com/LedgerHQ/ledger-live/pull/25047) [`b15271c`](https://github.com/LedgerHQ/ledger-live/commit/b15271ca307f00e929474a1560e64fd2af49b75e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Route every receive entry point through one rule that opens the new receive dialog behind the newReceiveFlow flag

- [#25192](https://github.com/LedgerHQ/ledger-live/pull/25192) [`85a7d14`](https://github.com/LedgerHQ/ledger-live/commit/85a7d14d54b4f7f411a3789e310e6f1b8d2d79bb) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Read the address shown on the new receive address screen, with the Zcash choice between its public and private addresses

- [#25196](https://github.com/LedgerHQ/ledger-live/pull/25196) [`c4792da`](https://github.com/LedgerHQ/ledger-live/commit/c4792da62785d15ebbb543c81f444aeb6a62bafc) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show the QR card and the address on the new receive address dialog, and the Zcash choice between public and private addresses

- [#25209](https://github.com/LedgerHQ/ledger-live/pull/25209) [`4ff1d9a`](https://github.com/LedgerHQ/ledger-live/commit/4ff1d9a587abb474300d0e1c188eeb62b0de66ea) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show the animated QR card and the address on the new receive address screen, and the Zcash choice between public and private addresses

- [#25160](https://github.com/LedgerHQ/ledger-live/pull/25160) [`f7f5295`](https://github.com/LedgerHQ/ledger-live/commit/f7f529560de8f7ee9d2ddf98f048610b9335d550) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Read the new receive screen data from the account model, and tell Tron's inactive account from its account status

- [#25222](https://github.com/LedgerHQ/ledger-live/pull/25222) [`c5ad33d`](https://github.com/LedgerHQ/ledger-live/commit/c5ad33db466f7a5eaf24a70f571afdbf2496979a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show a skeleton on the new receive address screen while the address loads, and an error with Retry when it cannot be read

### Patch Changes

- Updated dependencies [[`e1db61a`](https://github.com/LedgerHQ/ledger-live/commit/e1db61afaa383e6c5f0f5608ac0c7cf83436fff6), [`4f46643`](https://github.com/LedgerHQ/ledger-live/commit/4f466432512683457cbdca0ce7b64ddbf678c64d), [`27f3e4e`](https://github.com/LedgerHQ/ledger-live/commit/27f3e4eb74ac31f0f53aa55803ad7f082f669fe3), [`f8afe58`](https://github.com/LedgerHQ/ledger-live/commit/f8afe58413ae68f5331031c27d9655dca1a56143), [`fe1f525`](https://github.com/LedgerHQ/ledger-live/commit/fe1f5257edcee5b92db6153e9f7d619104446294), [`6ad80e8`](https://github.com/LedgerHQ/ledger-live/commit/6ad80e84789de8da5726d52fc27335655a62c2aa), [`c47814c`](https://github.com/LedgerHQ/ledger-live/commit/c47814c94967febb435d0dcb77cc2f8de7f2c3f7), [`36284d6`](https://github.com/LedgerHQ/ledger-live/commit/36284d633c1961face1500f58fa2fc271cfb8ab5), [`74c967e`](https://github.com/LedgerHQ/ledger-live/commit/74c967eb7dda848648df0db683910140b5d6e906), [`fa94370`](https://github.com/LedgerHQ/ledger-live/commit/fa943701719e0fd0d6f9fb28f1c8bb90f6a7c5c9), [`de9c09c`](https://github.com/LedgerHQ/ledger-live/commit/de9c09c26ebca7c2dbceb9494de70a2c16c75a70)]:
  - @features/platform-intent-verify-address@0.5.0
  - @domain/entity-account-status@0.1.0
  - @shared/feature-flags@0.32.0
  - @domain/entity-account-descriptor@0.7.0
  - @shared/ui-animated-qr-code@0.2.0
  - @features/platform-device-intent@5.6.0
  - @shared/analytics@0.5.0
  - @domain/entity-currency@0.5.1
  - @features/platform-currencies@0.14.1
  - @domain/entity-account@0.4.1
  - @domain/entity-account-data@0.6.1
  - @domain/entity-account-receive@0.1.1
  - @features/platform-account-data@0.4.2

## 0.3.0-next.0

### Minor Changes

- [#25127](https://github.com/LedgerHQ/ledger-live/pull/25127) [`aff97a0`](https://github.com/LedgerHQ/ledger-live/commit/aff97a0a8888e85a66b8d121f41adfa2ea884673) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Verify the receive address on the device with the Device Intent Executor, and show whether it matches once the user confirms on the device

- [#24775](https://github.com/LedgerHQ/ledger-live/pull/24775) [`99b84d2`](https://github.com/LedgerHQ/ledger-live/commit/99b84d26e7fe249a2d322d54472790afffaa4807) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add toReceiveTarget to find the account and asset to receive on in the account model

- [#25176](https://github.com/LedgerHQ/ledger-live/pull/25176) [`e53d295`](https://github.com/LedgerHQ/ledger-live/commit/e53d295fcb840a2e8a8433daac282a6f22098707) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show the asset, its network and a close button in the header of the new receive address dialog

- [#25181](https://github.com/LedgerHQ/ledger-live/pull/25181) [`6157b78`](https://github.com/LedgerHQ/ledger-live/commit/6157b78b2e7055b1389f7ed64a2fcccf26200c39) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show a close button, the asset and its network with its icon at the top of the new receive address screen

- [#25173](https://github.com/LedgerHQ/ledger-live/pull/25173) [`a8363ee`](https://github.com/LedgerHQ/ledger-live/commit/a8363eeb2cd97ce1942bfe0938ec317536e630c6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Name the asset received and its network on the new receive address screen

- [#25133](https://github.com/LedgerHQ/ledger-live/pull/25133) [`ac052f5`](https://github.com/LedgerHQ/ledger-live/commit/ac052f5c42e9151f445e3ff4b20e811fbcfa84b4) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Lay out the zones of the new receive address screen

- [#25225](https://github.com/LedgerHQ/ledger-live/pull/25225) [`fa94370`](https://github.com/LedgerHQ/ledger-live/commit/fa943701719e0fd0d6f9fb28f1c8bb90f6a7c5c9) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Animate the receive QR code on desktop too: a shimmer while the address loads, and a ripple when it is copied from the code or the Copy button

- [#25061](https://github.com/LedgerHQ/ledger-live/pull/25061) [`3c9c36d`](https://github.com/LedgerHQ/ledger-live/commit/3c9c36d4b6aba6232f04e124157bd8df08cf89da) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Route the receive entry points through one rule that opens the new receive screen behind the newReceiveFlow flag; onboarding keeps the legacy receive screen

- [#25047](https://github.com/LedgerHQ/ledger-live/pull/25047) [`b15271c`](https://github.com/LedgerHQ/ledger-live/commit/b15271ca307f00e929474a1560e64fd2af49b75e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Route every receive entry point through one rule that opens the new receive dialog behind the newReceiveFlow flag

- [#25192](https://github.com/LedgerHQ/ledger-live/pull/25192) [`85a7d14`](https://github.com/LedgerHQ/ledger-live/commit/85a7d14d54b4f7f411a3789e310e6f1b8d2d79bb) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Read the address shown on the new receive address screen, with the Zcash choice between its public and private addresses

- [#25196](https://github.com/LedgerHQ/ledger-live/pull/25196) [`c4792da`](https://github.com/LedgerHQ/ledger-live/commit/c4792da62785d15ebbb543c81f444aeb6a62bafc) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show the QR card and the address on the new receive address dialog, and the Zcash choice between public and private addresses

- [#25209](https://github.com/LedgerHQ/ledger-live/pull/25209) [`4ff1d9a`](https://github.com/LedgerHQ/ledger-live/commit/4ff1d9a587abb474300d0e1c188eeb62b0de66ea) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show the animated QR card and the address on the new receive address screen, and the Zcash choice between public and private addresses

- [#25160](https://github.com/LedgerHQ/ledger-live/pull/25160) [`f7f5295`](https://github.com/LedgerHQ/ledger-live/commit/f7f529560de8f7ee9d2ddf98f048610b9335d550) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Read the new receive screen data from the account model, and tell Tron's inactive account from its account status

- [#25222](https://github.com/LedgerHQ/ledger-live/pull/25222) [`c5ad33d`](https://github.com/LedgerHQ/ledger-live/commit/c5ad33db466f7a5eaf24a70f571afdbf2496979a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show a skeleton on the new receive address screen while the address loads, and an error with Retry when it cannot be read

### Patch Changes

- Updated dependencies [[`e1db61a`](https://github.com/LedgerHQ/ledger-live/commit/e1db61afaa383e6c5f0f5608ac0c7cf83436fff6), [`4f46643`](https://github.com/LedgerHQ/ledger-live/commit/4f466432512683457cbdca0ce7b64ddbf678c64d), [`27f3e4e`](https://github.com/LedgerHQ/ledger-live/commit/27f3e4eb74ac31f0f53aa55803ad7f082f669fe3), [`f8afe58`](https://github.com/LedgerHQ/ledger-live/commit/f8afe58413ae68f5331031c27d9655dca1a56143), [`fe1f525`](https://github.com/LedgerHQ/ledger-live/commit/fe1f5257edcee5b92db6153e9f7d619104446294), [`6ad80e8`](https://github.com/LedgerHQ/ledger-live/commit/6ad80e84789de8da5726d52fc27335655a62c2aa), [`c47814c`](https://github.com/LedgerHQ/ledger-live/commit/c47814c94967febb435d0dcb77cc2f8de7f2c3f7), [`36284d6`](https://github.com/LedgerHQ/ledger-live/commit/36284d633c1961face1500f58fa2fc271cfb8ab5), [`74c967e`](https://github.com/LedgerHQ/ledger-live/commit/74c967eb7dda848648df0db683910140b5d6e906), [`fa94370`](https://github.com/LedgerHQ/ledger-live/commit/fa943701719e0fd0d6f9fb28f1c8bb90f6a7c5c9), [`de9c09c`](https://github.com/LedgerHQ/ledger-live/commit/de9c09c26ebca7c2dbceb9494de70a2c16c75a70)]:
  - @features/platform-intent-verify-address@0.5.0-next.0
  - @domain/entity-account-status@0.1.0-next.0
  - @shared/feature-flags@0.32.0-next.0
  - @domain/entity-account-descriptor@0.7.0-next.0
  - @shared/ui-animated-qr-code@0.2.0-next.0
  - @features/platform-device-intent@5.6.0-next.0
  - @shared/analytics@0.5.0-next.0
  - @domain/entity-currency@0.5.1-next.0
  - @features/platform-currencies@0.14.1-next.0
  - @domain/entity-account@0.4.1-next.0
  - @domain/entity-account-data@0.6.1-next.0
  - @domain/entity-account-receive@0.1.1-next.0
  - @features/platform-account-data@0.4.2-next.0

## 0.2.0

### Minor Changes

- [#24798](https://github.com/LedgerHQ/ledger-live/pull/24798) [`e8305c7`](https://github.com/LedgerHQ/ledger-live/commit/e8305c7492cc970261e24069e52f040aec65f03c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the receive verify hint state from `@features/flow-pay-request/state` to `@features/flow-receive/state`

- [#24859](https://github.com/LedgerHQ/ledger-live/pull/24859) [`e2afea1`](https://github.com/LedgerHQ/ledger-live/commit/e2afea14298ebf9fa64c61b9cc4d5eca740decc1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the receive family contract: notices, support and unsupported device models of the new receive address screen per coin family

- [#24849](https://github.com/LedgerHQ/ledger-live/pull/24849) [`4ce1aca`](https://github.com/LedgerHQ/ledger-live/commit/4ce1acad62b9bb4b186a6fba14fce381b699d2c2) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Address securely displayed screen of the receive flow

- [#24765](https://github.com/LedgerHQ/ledger-live/pull/24765) [`4a749db`](https://github.com/LedgerHQ/ledger-live/commit/4a749db93ffbb57b2296315869df761a6a2ed6ec) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the @features/flow-receive package

### Patch Changes

- Updated dependencies [[`4aa3244`](https://github.com/LedgerHQ/ledger-live/commit/4aa32442c63cd17bd2894d63ad0721d51e0ca41a), [`1d97ca7`](https://github.com/LedgerHQ/ledger-live/commit/1d97ca78b8e326c5bdd1af98199dd9e9aa06b4c5), [`5020021`](https://github.com/LedgerHQ/ledger-live/commit/5020021654f743e0e868cb9c8d011adc97f4ed9a), [`8064394`](https://github.com/LedgerHQ/ledger-live/commit/806439433d2c57b13db5a513688db52195bfc163), [`d1e1f5f`](https://github.com/LedgerHQ/ledger-live/commit/d1e1f5f156ff95ae5fd7ebdeaec3b5d628d671b7), [`d5d2516`](https://github.com/LedgerHQ/ledger-live/commit/d5d2516e82d0ee1984fcff0357cc0406eca91c48), [`429170c`](https://github.com/LedgerHQ/ledger-live/commit/429170c6f969a90517696f2d750fc853be91e378), [`d593a3d`](https://github.com/LedgerHQ/ledger-live/commit/d593a3d4a21bcdc6e28a193521b949c1323a4a5b), [`5a9de42`](https://github.com/LedgerHQ/ledger-live/commit/5a9de42cd3a598f1f8954d58b9536280f5fd2927), [`5dff2e5`](https://github.com/LedgerHQ/ledger-live/commit/5dff2e54adbff5b6bc5ad2e57bbd6c5e6f85271a), [`3a6ddb3`](https://github.com/LedgerHQ/ledger-live/commit/3a6ddb3fbd9d18c8005b9aef84597c8dc92dcfab)]:
  - @shared/feature-flags@0.31.0
  - @domain/entity-account-descriptor@0.6.0
  - @domain/entity-account-receive@0.1.0
  - @shared/ui-info-state@0.8.0

## 0.2.0-next.0

### Minor Changes

- [#24798](https://github.com/LedgerHQ/ledger-live/pull/24798) [`e8305c7`](https://github.com/LedgerHQ/ledger-live/commit/e8305c7492cc970261e24069e52f040aec65f03c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the receive verify hint state from `@features/flow-pay-request/state` to `@features/flow-receive/state`

- [#24859](https://github.com/LedgerHQ/ledger-live/pull/24859) [`e2afea1`](https://github.com/LedgerHQ/ledger-live/commit/e2afea14298ebf9fa64c61b9cc4d5eca740decc1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the receive family contract: notices, support and unsupported device models of the new receive address screen per coin family

- [#24849](https://github.com/LedgerHQ/ledger-live/pull/24849) [`4ce1aca`](https://github.com/LedgerHQ/ledger-live/commit/4ce1acad62b9bb4b186a6fba14fce381b699d2c2) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Address securely displayed screen of the receive flow

- [#24765](https://github.com/LedgerHQ/ledger-live/pull/24765) [`4a749db`](https://github.com/LedgerHQ/ledger-live/commit/4a749db93ffbb57b2296315869df761a6a2ed6ec) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the @features/flow-receive package

### Patch Changes

- Updated dependencies [[`4aa3244`](https://github.com/LedgerHQ/ledger-live/commit/4aa32442c63cd17bd2894d63ad0721d51e0ca41a), [`1d97ca7`](https://github.com/LedgerHQ/ledger-live/commit/1d97ca78b8e326c5bdd1af98199dd9e9aa06b4c5), [`5020021`](https://github.com/LedgerHQ/ledger-live/commit/5020021654f743e0e868cb9c8d011adc97f4ed9a), [`8064394`](https://github.com/LedgerHQ/ledger-live/commit/806439433d2c57b13db5a513688db52195bfc163), [`d1e1f5f`](https://github.com/LedgerHQ/ledger-live/commit/d1e1f5f156ff95ae5fd7ebdeaec3b5d628d671b7), [`d5d2516`](https://github.com/LedgerHQ/ledger-live/commit/d5d2516e82d0ee1984fcff0357cc0406eca91c48), [`429170c`](https://github.com/LedgerHQ/ledger-live/commit/429170c6f969a90517696f2d750fc853be91e378), [`d593a3d`](https://github.com/LedgerHQ/ledger-live/commit/d593a3d4a21bcdc6e28a193521b949c1323a4a5b), [`5a9de42`](https://github.com/LedgerHQ/ledger-live/commit/5a9de42cd3a598f1f8954d58b9536280f5fd2927), [`5dff2e5`](https://github.com/LedgerHQ/ledger-live/commit/5dff2e54adbff5b6bc5ad2e57bbd6c5e6f85271a), [`3a6ddb3`](https://github.com/LedgerHQ/ledger-live/commit/3a6ddb3fbd9d18c8005b9aef84597c8dc92dcfab)]:
  - @shared/feature-flags@0.31.0-next.0
  - @domain/entity-account-descriptor@0.6.0-next.0
  - @domain/entity-account-receive@0.1.0-next.0
  - @shared/ui-info-state@0.8.0-next.0
