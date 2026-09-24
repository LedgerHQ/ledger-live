# @features/flow-pay-card-details

## 0.5.0-next.1

### Patch Changes

- Updated dependencies [[`48af604`](https://github.com/LedgerHQ/ledger-live/commit/48af6040c2835f067a2dfe38fb8fadde72e0787b)]:
  - @shared/ui-queued-bottom-sheet@0.5.0-next.1
  - @features/flow-pay-card-auth@0.8.0-next.1
  - @features/flow-pay-card-transactions@0.3.0-next.1
  - @features/flow-pay-card-widget@0.4.0-next.1
  - @features/flow-pay-card-assets@0.2.0-next.1

## 0.5.0-next.0

### Minor Changes

- [#22149](https://github.com/LedgerHQ/ledger-live/pull/22149) [`4d1d640`](https://github.com/LedgerHQ/ledger-live/commit/4d1d64049a0bb0562a1a0c8ad2555fe967acdd7f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add card reward wallet endpoint and mobile reward balance view

- [#22150](https://github.com/LedgerHQ/ledger-live/pull/22150) [`731ebd2`](https://github.com/LedgerHQ/ledger-live/commit/731ebd22047779093d5821d38ea53f6f9fc1a694) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Display card reward balance in the desktop card details view

- [#21741](https://github.com/LedgerHQ/ledger-live/pull/21741) [`250c1c0`](https://github.com/LedgerHQ/ledger-live/commit/250c1c0e4cd081a67f46b37e852291a32e02b05b) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a mobile card-numbers View/Hide control that flips to the provider numbers image

- [#22257](https://github.com/LedgerHQ/ledger-live/pull/22257) [`510465b`](https://github.com/LedgerHQ/ledger-live/commit/510465b5ac5808a42729dbea99aea081bf759e4a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Expose settings redirect actions for Manage PIN, Access Baanx and Help on the card's More menu.
  The feature packages take already-resolved host callbacks and never build URLs or read env vars
  themselves — desktop opens Baanx pages through the existing hosted-page opener, mobile through the
  secure browser, and each app opens the Help article externally.

- [#22194](https://github.com/LedgerHQ/ledger-live/pull/22194) [`c7eb01d`](https://github.com/LedgerHQ/ledger-live/commit/c7eb01d392a1adf04db824cd8602d939985599c7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add an Apple/Google Pay add-to-wallet scene on card details.

- [#22233](https://github.com/LedgerHQ/ledger-live/pull/22233) [`dd155a7`](https://github.com/LedgerHQ/ledger-live/commit/dd155a7608f771f8e9a26007e3ad28a82429a700) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add mobile card asset management.

- [#22278](https://github.com/LedgerHQ/ledger-live/pull/22278) [`95a1007`](https://github.com/LedgerHQ/ledger-live/commit/95a1007bb9d4f62d693391a99eca3cb3b12f0e7d) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Reveal card numbers as soon as the image loads and shorten the flip to 300ms

- [#22182](https://github.com/LedgerHQ/ledger-live/pull/22182) [`1557452`](https://github.com/LedgerHQ/ledger-live/commit/1557452f86f214191d2f29e5fca40b5077f90e11) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Reveal card numbers without a password unlock gate

- [#22232](https://github.com/LedgerHQ/ledger-live/pull/22232) [`d7d2b9a`](https://github.com/LedgerHQ/ledger-live/commit/d7d2b9a0907cb0b16dd481f09c92b8796d80d3a9) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add mobile card asset details and withdraw scenes.

- [#22094](https://github.com/LedgerHQ/ledger-live/pull/22094) [`8d073ca`](https://github.com/LedgerHQ/ledger-live/commit/8d073ca6a527a11ce6f10995bb896ae983211f63) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Show what each card wallet is worth in the user's currency.

  - The Assets list is implemented: both views were placeholders that rendered nothing.
  - A row is the design's: currency icon, name and ticker, then the counter value over what the wallet holds.
  - The counter value is left off when nothing could price the wallet; the crypto amount always shows.
  - `CardAssets` takes the currencies, the pricing and the formatter from the host, so the package stays free of the rates.
  - Native lists it inside the card details sheet, under the card actions, where the design puts it; `CardDetails` takes it as a slot.

- [#22111](https://github.com/LedgerHQ/ledger-live/pull/22111) [`dbc9655`](https://github.com/LedgerHQ/ledger-live/commit/dbc9655cb61b4999fa6cd52dca25053f9f301dd3) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a card transaction preview to mobile card details.

- [#22134](https://github.com/LedgerHQ/ledger-live/pull/22134) [`8dcb040`](https://github.com/LedgerHQ/ledger-live/commit/8dcb040ccac4abaeba356e76b60dc03802303bf5) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add back navigation to the mobile Pay Card More scene

- [#22184](https://github.com/LedgerHQ/ledger-live/pull/22184) [`75038d5`](https://github.com/LedgerHQ/ledger-live/commit/75038d59735ac63ab43baf7bd298969890241b3b) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open the provider's top up page from the card on mobile.

  - The Top up button takes the place of the disabled "Coming soon" action on the card face, and it comes back at the bottom of the card details sheet.
  - Mobile opens `/topup` in the secure browser, which carries the provider session. A US card holder gets the US `app_id` on the query, so the page reaches the US tenant.

- [#22183](https://github.com/LedgerHQ/ledger-live/pull/22183) [`d9d1111`](https://github.com/LedgerHQ/ledger-live/commit/d9d1111733e757cc58b6249fdda568dd56d40757) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open the provider's top up page from the card on desktop.

  - `CardTopUpButton` carries the action. On desktop it stays at the bottom of the card panel, above the scrolling content.
  - Desktop opens `/topup` on the hosted live app manifest, the way the signup page already opens.
  - A US card holder gets the US `app_id` on the query, so the page reaches the US tenant.
  - Desktop ends the provider session in the webview on each entry of the Pay tab, so a session left behind by a top up cannot sign the previous holder back in. The login and the signup drop their own wipe: every one of them starts from an entry of the Pay tab.
  - The top up button in the asset details dialog opens the same page, with the asset pre-selected on the query.

- [#22301](https://github.com/LedgerHQ/ledger-live/pull/22301) [`6fe6efb`](https://github.com/LedgerHQ/ledger-live/commit/6fe6efb9f2c9211d6002dd17f4369f90390021bf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Consume the shared Pay analytics provider across card flows.

- [#22337](https://github.com/LedgerHQ/ledger-live/pull/22337) [`e1c0c65`](https://github.com/LedgerHQ/ledger-live/commit/e1c0c65f6c2726b29314ec2a7827d97672989ac0) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add legal agreement link to the Pay Card "More" menu

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce), [`4d1d640`](https://github.com/LedgerHQ/ledger-live/commit/4d1d64049a0bb0562a1a0c8ad2555fe967acdd7f), [`510465b`](https://github.com/LedgerHQ/ledger-live/commit/510465b5ac5808a42729dbea99aea081bf759e4a), [`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914), [`72367fc`](https://github.com/LedgerHQ/ledger-live/commit/72367fcf2343fa488008236f1005da589e6e3054), [`c22ee67`](https://github.com/LedgerHQ/ledger-live/commit/c22ee67d3e0271b382337fe4175170bdabf5dfca), [`3d50917`](https://github.com/LedgerHQ/ledger-live/commit/3d50917da2e7c2177f8288bb754d41a7699f27be), [`cfa249c`](https://github.com/LedgerHQ/ledger-live/commit/cfa249c4c3a30f9eba1ecee1749030121da9291a), [`285b50d`](https://github.com/LedgerHQ/ledger-live/commit/285b50dc311eef60089f779cffdfe14a0422d2ec), [`a1a8b81`](https://github.com/LedgerHQ/ledger-live/commit/a1a8b81b3f9b4eb897ac3d81427a1df0a5e0130b), [`1ec8d15`](https://github.com/LedgerHQ/ledger-live/commit/1ec8d15feb3f9339bc09c18c682e140d370c9efe), [`84bba64`](https://github.com/LedgerHQ/ledger-live/commit/84bba645bfe85f3bd4d6f03431916226113c7bc5), [`c682542`](https://github.com/LedgerHQ/ledger-live/commit/c682542d2adc4066f1c5d6531f781babb0e772b9), [`dd155a7`](https://github.com/LedgerHQ/ledger-live/commit/dd155a7608f771f8e9a26007e3ad28a82429a700), [`233e44e`](https://github.com/LedgerHQ/ledger-live/commit/233e44e3dd724cc9d4f14a02c7e62e39d2e9079b), [`6741356`](https://github.com/LedgerHQ/ledger-live/commit/67413566f84b895e6f4ae2b5d646bfc2e82c6926), [`dafadf0`](https://github.com/LedgerHQ/ledger-live/commit/dafadf005a54007d5430203c11b8718c1636a6e4), [`9652494`](https://github.com/LedgerHQ/ledger-live/commit/96524949cbf8fa1d102a0156f40004ff12a30475), [`5492648`](https://github.com/LedgerHQ/ledger-live/commit/5492648988e327c8e3e6e7d5ead1e0fa2bd9929e), [`905d26b`](https://github.com/LedgerHQ/ledger-live/commit/905d26b9ea6f419d3269a376e0f0c9b6ce8b2b82), [`c52af21`](https://github.com/LedgerHQ/ledger-live/commit/c52af21b622efa62774657e190abb9762cffac1c), [`d7d2b9a`](https://github.com/LedgerHQ/ledger-live/commit/d7d2b9a0907cb0b16dd481f09c92b8796d80d3a9), [`d0fd787`](https://github.com/LedgerHQ/ledger-live/commit/d0fd787fb0e40b35f9d9c70307694d364f99b858), [`b97a3e5`](https://github.com/LedgerHQ/ledger-live/commit/b97a3e5462588d771a2ea5d628cfef7d564bc886), [`fd6b9d0`](https://github.com/LedgerHQ/ledger-live/commit/fd6b9d0b602e44c5520152c2307bd629f11afc7a), [`954ffbd`](https://github.com/LedgerHQ/ledger-live/commit/954ffbdeb8172f555b637599d24cf2a94bcf24db), [`a915d4a`](https://github.com/LedgerHQ/ledger-live/commit/a915d4a577dfe7bb778364c4b0269bc61203075a), [`99bf629`](https://github.com/LedgerHQ/ledger-live/commit/99bf629658121670784047780f74702cfa2c3ebc), [`853e47d`](https://github.com/LedgerHQ/ledger-live/commit/853e47dac8f42644733686353c3f0f4a3fcc035a), [`dbc9655`](https://github.com/LedgerHQ/ledger-live/commit/dbc9655cb61b4999fa6cd52dca25053f9f301dd3), [`afb2750`](https://github.com/LedgerHQ/ledger-live/commit/afb275029ec3aee1c833f1e468c41dc36279ab6f), [`eb06f77`](https://github.com/LedgerHQ/ledger-live/commit/eb06f77c9548a2e4641c37da90c34b4fcffba667), [`75038d5`](https://github.com/LedgerHQ/ledger-live/commit/75038d59735ac63ab43baf7bd298969890241b3b), [`d9d1111`](https://github.com/LedgerHQ/ledger-live/commit/d9d1111733e757cc58b6249fdda568dd56d40757), [`4b346a0`](https://github.com/LedgerHQ/ledger-live/commit/4b346a0f90b2c1f7c66df4be38e7c4b6b992ce57), [`2aeb695`](https://github.com/LedgerHQ/ledger-live/commit/2aeb695663cf9a71d2a234ebc38819567f930564), [`287f042`](https://github.com/LedgerHQ/ledger-live/commit/287f04286e4933e31e31952a3ac6485e145e34f2), [`6fe6efb`](https://github.com/LedgerHQ/ledger-live/commit/6fe6efb9f2c9211d6002dd17f4369f90390021bf), [`bc43337`](https://github.com/LedgerHQ/ledger-live/commit/bc433372ebed1990d81a87b109eeb4d928271315), [`d19e4ae`](https://github.com/LedgerHQ/ledger-live/commit/d19e4aed0efb7e6ff8b8195dd8437cddbd455fe7), [`cb866e1`](https://github.com/LedgerHQ/ledger-live/commit/cb866e1c07252a07fa991abd3dc2d8df68960256), [`43e1a21`](https://github.com/LedgerHQ/ledger-live/commit/43e1a21f2060d53875256b001e054cf0b1f7b86a)]:
  - @features/flow-pay-card-auth@0.8.0-next.0
  - @domain/api-card-management@0.7.0-next.0
  - @shared/ui-queued-bottom-sheet@0.5.0-next.0
  - @features/flow-pay-card-widget@0.4.0-next.0
  - @features/flow-pay-card-assets@0.2.0-next.0
  - @features/flow-pay-card-transactions@0.3.0-next.0
  - @features/platform-pay-analytics@0.2.0-next.0
  - @shared/linking@0.3.0-next.0

## 0.4.0

### Minor Changes

- [#21662](https://github.com/LedgerHQ/ledger-live/pull/21662) [`9164e8b`](https://github.com/LedgerHQ/ledger-live/commit/9164e8b81ecb84e5d8ba0bb606981c2dc83d04c1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add freeze/unfreeze confirmation dialog and bottom sheet for pay card

- [#21928](https://github.com/LedgerHQ/ledger-live/pull/21928) [`1995d49`](https://github.com/LedgerHQ/ledger-live/commit/1995d49c63301199aef3e9a079f1d10fd0598f8b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Render the card transaction history on mobile, inside the card details sheet overview

- [#21697](https://github.com/LedgerHQ/ledger-live/pull/21697) [`2e47336`](https://github.com/LedgerHQ/ledger-live/commit/2e4733627ccb62c39fdf1e7d4b9f7d22559609bf) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a card-numbers reveal view-model that unlocks via Ledger Wallet password or biometrics, then mints the secure details image URL

- [#21707](https://github.com/LedgerHQ/ledger-live/pull/21707) [`8f62cdb`](https://github.com/LedgerHQ/ledger-live/commit/8f62cdbb6d93e207efd7e551af65a41953d28242) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add View/Hide and a 3D flip for card numbers.

- [#21722](https://github.com/LedgerHQ/ledger-live/pull/21722) [`182fae7`](https://github.com/LedgerHQ/ledger-live/commit/182fae7fbfa81b42de061e67da8edf21a7f72281) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a Card Details container with native artwork, Details sheet, and web composition

- [#21754](https://github.com/LedgerHQ/ledger-live/pull/21754) [`ba31ece`](https://github.com/LedgerHQ/ledger-live/commit/ba31ece3a22febeafbec027840d16ea82c2dad5e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Render the native card details overview, freeze confirmation and More menu as scenes inside a single bottom sheet

- [#21681](https://github.com/LedgerHQ/ledger-live/pull/21681) [`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add freeze/unfreeze confirmation error handling with retry

- [#21698](https://github.com/LedgerHQ/ledger-live/pull/21698) [`25224f4`](https://github.com/LedgerHQ/ledger-live/commit/25224f463b834dba7a2811d7150aeec6dbd6a3ac) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the More menu into card details and put freeze and More on one actions row

- [#21829](https://github.com/LedgerHQ/ledger-live/pull/21829) [`939300a`](https://github.com/LedgerHQ/ledger-live/commit/939300add757537632def29302a24a72a67f84b6) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - skip more test

- [#21663](https://github.com/LedgerHQ/ledger-live/pull/21663) [`c6f7bfe`](https://github.com/LedgerHQ/ledger-live/commit/c6f7bfead8593c148fe6e3d177ff8dd734728f5a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Mark a frozen pay card on the card visual: the card face fades out behind a centered snow `Spot`, read from the same card status the freeze tile uses. The features/flow jest projects now compile `@ledgerhq/lumen-utils-shared` instead of leaving its ESM untransformed, so views can use `cn`.

- [#21934](https://github.com/LedgerHQ/ledger-live/pull/21934) [`c5229d1`](https://github.com/LedgerHQ/ledger-live/commit/c5229d1b2bbf8d8067e036f0a34dda403519e206) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Pass host amount and date formatters as one object, using Desktop's date formatter for transaction dates.

- [#21821](https://github.com/LedgerHQ/ledger-live/pull/21821) [`19314ca`](https://github.com/LedgerHQ/ledger-live/commit/19314cafec3eee0803bee7f9b877c9e9ccc819e8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wait for the Card user fetch before pressing the More tile in native CardDetails tests

- [#21871](https://github.com/LedgerHQ/ledger-live/pull/21871) [`a5d438e`](https://github.com/LedgerHQ/ledger-live/commit/a5d438e3c6cd557e8c77f2f40be2c20540f23cec) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Share the Pay Card MSW test store across card flows.

  `@support/msw-features-flow-pay-card` holds the store, the signed-in and signed-out wrappers and the
  MSW server that every Pay Card flow package needs to test a view model against the card API, so each
  one no longer keeps its own copy. `pay-card-details` reads it from there now.

- [#21947](https://github.com/LedgerHQ/ledger-live/pull/21947) [`9d0b721`](https://github.com/LedgerHQ/ledger-live/commit/9d0b721dbfd8b71d32d2d16db22ad8e54f45f541) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the mobile Pay Card transaction detail sheet with tracking and copyable transaction IDs.

- [#21828](https://github.com/LedgerHQ/ledger-live/pull/21828) [`529a7fc`](https://github.com/LedgerHQ/ledger-live/commit/529a7fc909409f4f5740ce8add9abbab1b784157) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix row display for quick actions

### Patch Changes

- Updated dependencies [[`1995d49`](https://github.com/LedgerHQ/ledger-live/commit/1995d49c63301199aef3e9a079f1d10fd0598f8b), [`8f62cdb`](https://github.com/LedgerHQ/ledger-live/commit/8f62cdbb6d93e207efd7e551af65a41953d28242), [`182fae7`](https://github.com/LedgerHQ/ledger-live/commit/182fae7fbfa81b42de061e67da8edf21a7f72281), [`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf), [`25224f4`](https://github.com/LedgerHQ/ledger-live/commit/25224f463b834dba7a2811d7150aeec6dbd6a3ac), [`f7fa8f0`](https://github.com/LedgerHQ/ledger-live/commit/f7fa8f0ff23c03a69933f2d6aa6e0b225af9d542), [`1eb2e00`](https://github.com/LedgerHQ/ledger-live/commit/1eb2e00074fe05f103dd33c3fbf295cfd39e9c2e), [`799219e`](https://github.com/LedgerHQ/ledger-live/commit/799219e262e80a339272113ea164fa506243b438), [`e37413b`](https://github.com/LedgerHQ/ledger-live/commit/e37413b588873a1a2a028ebf4c1971e4fa92ed2a), [`9e61582`](https://github.com/LedgerHQ/ledger-live/commit/9e61582edfcbb98046d0f74111ccf4061ec44bb3), [`cef83ae`](https://github.com/LedgerHQ/ledger-live/commit/cef83ae58ffc5529bebda292737502e78e3b7522), [`3f34609`](https://github.com/LedgerHQ/ledger-live/commit/3f34609edecc5ae85a9a9ac1b76ab47e30a9c66e), [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2), [`c6f7bfe`](https://github.com/LedgerHQ/ledger-live/commit/c6f7bfead8593c148fe6e3d177ff8dd734728f5a), [`0e1e102`](https://github.com/LedgerHQ/ledger-live/commit/0e1e10227aa5cc0d19e8a142533c54838e3ed57e), [`34f8541`](https://github.com/LedgerHQ/ledger-live/commit/34f8541ae58847dcee784b3fe97f227edd644775), [`fcc2ac4`](https://github.com/LedgerHQ/ledger-live/commit/fcc2ac4c5ed270fb63df4c0079068ad6dac94612), [`eddc89e`](https://github.com/LedgerHQ/ledger-live/commit/eddc89e7b86a13aeedfc0ae4956c2dcd08494e5f), [`e7d79ac`](https://github.com/LedgerHQ/ledger-live/commit/e7d79acf1d91e98e2813755f9bebdbfd83e89f39), [`c5229d1`](https://github.com/LedgerHQ/ledger-live/commit/c5229d1b2bbf8d8067e036f0a34dda403519e206), [`37f5759`](https://github.com/LedgerHQ/ledger-live/commit/37f57595f11d40562914794645cb3c7f6e55dc8b), [`a2a0288`](https://github.com/LedgerHQ/ledger-live/commit/a2a028844dbfbfa019f1f971bf6fdbed9005b9ec), [`6553e61`](https://github.com/LedgerHQ/ledger-live/commit/6553e61da87bd604a357d5a79eefd3ac17e225d1), [`8b3320d`](https://github.com/LedgerHQ/ledger-live/commit/8b3320d7aab0ff25eeb8930dafa536fb94962c79), [`e65a6b3`](https://github.com/LedgerHQ/ledger-live/commit/e65a6b3e67e271343b7029613498176b1da2d7d2), [`c88b5c6`](https://github.com/LedgerHQ/ledger-live/commit/c88b5c65b0488097e2a17071ca04ac06ae41763a), [`9d0b721`](https://github.com/LedgerHQ/ledger-live/commit/9d0b721dbfd8b71d32d2d16db22ad8e54f45f541), [`d353658`](https://github.com/LedgerHQ/ledger-live/commit/d353658a0254e49a369ca7481c9680254e9e4851)]:
  - @features/flow-pay-card-transactions@0.2.0
  - @domain/api-card-management@0.6.0
  - @features/flow-pay-card-auth@0.7.0
  - @shared/ui-queued-bottom-sheet@0.4.0
  - @shared/i18n@0.2.0

## 0.4.0-next.0

### Minor Changes

- [#21662](https://github.com/LedgerHQ/ledger-live/pull/21662) [`9164e8b`](https://github.com/LedgerHQ/ledger-live/commit/9164e8b81ecb84e5d8ba0bb606981c2dc83d04c1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add freeze/unfreeze confirmation dialog and bottom sheet for pay card

- [#21928](https://github.com/LedgerHQ/ledger-live/pull/21928) [`1995d49`](https://github.com/LedgerHQ/ledger-live/commit/1995d49c63301199aef3e9a079f1d10fd0598f8b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Render the card transaction history on mobile, inside the card details sheet overview

- [#21697](https://github.com/LedgerHQ/ledger-live/pull/21697) [`2e47336`](https://github.com/LedgerHQ/ledger-live/commit/2e4733627ccb62c39fdf1e7d4b9f7d22559609bf) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a card-numbers reveal view-model that unlocks via Ledger Wallet password or biometrics, then mints the secure details image URL

- [#21707](https://github.com/LedgerHQ/ledger-live/pull/21707) [`8f62cdb`](https://github.com/LedgerHQ/ledger-live/commit/8f62cdbb6d93e207efd7e551af65a41953d28242) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add View/Hide and a 3D flip for card numbers.

- [#21722](https://github.com/LedgerHQ/ledger-live/pull/21722) [`182fae7`](https://github.com/LedgerHQ/ledger-live/commit/182fae7fbfa81b42de061e67da8edf21a7f72281) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a Card Details container with native artwork, Details sheet, and web composition

- [#21754](https://github.com/LedgerHQ/ledger-live/pull/21754) [`ba31ece`](https://github.com/LedgerHQ/ledger-live/commit/ba31ece3a22febeafbec027840d16ea82c2dad5e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Render the native card details overview, freeze confirmation and More menu as scenes inside a single bottom sheet

- [#21681](https://github.com/LedgerHQ/ledger-live/pull/21681) [`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add freeze/unfreeze confirmation error handling with retry

- [#21698](https://github.com/LedgerHQ/ledger-live/pull/21698) [`25224f4`](https://github.com/LedgerHQ/ledger-live/commit/25224f463b834dba7a2811d7150aeec6dbd6a3ac) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the More menu into card details and put freeze and More on one actions row

- [#21829](https://github.com/LedgerHQ/ledger-live/pull/21829) [`939300a`](https://github.com/LedgerHQ/ledger-live/commit/939300add757537632def29302a24a72a67f84b6) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - skip more test

- [#21663](https://github.com/LedgerHQ/ledger-live/pull/21663) [`c6f7bfe`](https://github.com/LedgerHQ/ledger-live/commit/c6f7bfead8593c148fe6e3d177ff8dd734728f5a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Mark a frozen pay card on the card visual: the card face fades out behind a centered snow `Spot`, read from the same card status the freeze tile uses. The features/flow jest projects now compile `@ledgerhq/lumen-utils-shared` instead of leaving its ESM untransformed, so views can use `cn`.

- [#21934](https://github.com/LedgerHQ/ledger-live/pull/21934) [`c5229d1`](https://github.com/LedgerHQ/ledger-live/commit/c5229d1b2bbf8d8067e036f0a34dda403519e206) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Pass host amount and date formatters as one object, using Desktop's date formatter for transaction dates.

- [#21821](https://github.com/LedgerHQ/ledger-live/pull/21821) [`19314ca`](https://github.com/LedgerHQ/ledger-live/commit/19314cafec3eee0803bee7f9b877c9e9ccc819e8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wait for the Card user fetch before pressing the More tile in native CardDetails tests

- [#21871](https://github.com/LedgerHQ/ledger-live/pull/21871) [`a5d438e`](https://github.com/LedgerHQ/ledger-live/commit/a5d438e3c6cd557e8c77f2f40be2c20540f23cec) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Share the Pay Card MSW test store across card flows.

  `@support/msw-features-flow-pay-card` holds the store, the signed-in and signed-out wrappers and the
  MSW server that every Pay Card flow package needs to test a view model against the card API, so each
  one no longer keeps its own copy. `pay-card-details` reads it from there now.

- [#21947](https://github.com/LedgerHQ/ledger-live/pull/21947) [`9d0b721`](https://github.com/LedgerHQ/ledger-live/commit/9d0b721dbfd8b71d32d2d16db22ad8e54f45f541) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the mobile Pay Card transaction detail sheet with tracking and copyable transaction IDs.

- [#21828](https://github.com/LedgerHQ/ledger-live/pull/21828) [`529a7fc`](https://github.com/LedgerHQ/ledger-live/commit/529a7fc909409f4f5740ce8add9abbab1b784157) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix row display for quick actions

### Patch Changes

- Updated dependencies [[`1995d49`](https://github.com/LedgerHQ/ledger-live/commit/1995d49c63301199aef3e9a079f1d10fd0598f8b), [`8f62cdb`](https://github.com/LedgerHQ/ledger-live/commit/8f62cdbb6d93e207efd7e551af65a41953d28242), [`182fae7`](https://github.com/LedgerHQ/ledger-live/commit/182fae7fbfa81b42de061e67da8edf21a7f72281), [`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf), [`25224f4`](https://github.com/LedgerHQ/ledger-live/commit/25224f463b834dba7a2811d7150aeec6dbd6a3ac), [`f7fa8f0`](https://github.com/LedgerHQ/ledger-live/commit/f7fa8f0ff23c03a69933f2d6aa6e0b225af9d542), [`1eb2e00`](https://github.com/LedgerHQ/ledger-live/commit/1eb2e00074fe05f103dd33c3fbf295cfd39e9c2e), [`799219e`](https://github.com/LedgerHQ/ledger-live/commit/799219e262e80a339272113ea164fa506243b438), [`e37413b`](https://github.com/LedgerHQ/ledger-live/commit/e37413b588873a1a2a028ebf4c1971e4fa92ed2a), [`9e61582`](https://github.com/LedgerHQ/ledger-live/commit/9e61582edfcbb98046d0f74111ccf4061ec44bb3), [`cef83ae`](https://github.com/LedgerHQ/ledger-live/commit/cef83ae58ffc5529bebda292737502e78e3b7522), [`3f34609`](https://github.com/LedgerHQ/ledger-live/commit/3f34609edecc5ae85a9a9ac1b76ab47e30a9c66e), [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2), [`c6f7bfe`](https://github.com/LedgerHQ/ledger-live/commit/c6f7bfead8593c148fe6e3d177ff8dd734728f5a), [`0e1e102`](https://github.com/LedgerHQ/ledger-live/commit/0e1e10227aa5cc0d19e8a142533c54838e3ed57e), [`34f8541`](https://github.com/LedgerHQ/ledger-live/commit/34f8541ae58847dcee784b3fe97f227edd644775), [`fcc2ac4`](https://github.com/LedgerHQ/ledger-live/commit/fcc2ac4c5ed270fb63df4c0079068ad6dac94612), [`eddc89e`](https://github.com/LedgerHQ/ledger-live/commit/eddc89e7b86a13aeedfc0ae4956c2dcd08494e5f), [`e7d79ac`](https://github.com/LedgerHQ/ledger-live/commit/e7d79acf1d91e98e2813755f9bebdbfd83e89f39), [`c5229d1`](https://github.com/LedgerHQ/ledger-live/commit/c5229d1b2bbf8d8067e036f0a34dda403519e206), [`37f5759`](https://github.com/LedgerHQ/ledger-live/commit/37f57595f11d40562914794645cb3c7f6e55dc8b), [`a2a0288`](https://github.com/LedgerHQ/ledger-live/commit/a2a028844dbfbfa019f1f971bf6fdbed9005b9ec), [`6553e61`](https://github.com/LedgerHQ/ledger-live/commit/6553e61da87bd604a357d5a79eefd3ac17e225d1), [`8b3320d`](https://github.com/LedgerHQ/ledger-live/commit/8b3320d7aab0ff25eeb8930dafa536fb94962c79), [`e65a6b3`](https://github.com/LedgerHQ/ledger-live/commit/e65a6b3e67e271343b7029613498176b1da2d7d2), [`c88b5c6`](https://github.com/LedgerHQ/ledger-live/commit/c88b5c65b0488097e2a17071ca04ac06ae41763a), [`9d0b721`](https://github.com/LedgerHQ/ledger-live/commit/9d0b721dbfd8b71d32d2d16db22ad8e54f45f541), [`d353658`](https://github.com/LedgerHQ/ledger-live/commit/d353658a0254e49a369ca7481c9680254e9e4851)]:
  - @features/flow-pay-card-transactions@0.2.0-next.0
  - @domain/api-card-management@0.6.0-next.0
  - @features/flow-pay-card-auth@0.7.0-next.0
  - @shared/ui-queued-bottom-sheet@0.4.0-next.0
  - @shared/i18n@0.2.0

## 0.3.0

### Minor Changes

- [#21617](https://github.com/LedgerHQ/ledger-live/pull/21617) [`d01e4c0`](https://github.com/LedgerHQ/ledger-live/commit/d01e4c02a513082f6484c405f9a51977f14a6c03) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add Freeze component with useFreezeCardViewModel: freeze/unfreeze TileButton with optimistic state and error handling

### Patch Changes

- Updated dependencies [[`55bd216`](https://github.com/LedgerHQ/ledger-live/commit/55bd2166238ab3e03c33226bb5f5eb2e8646a818), [`08ee05c`](https://github.com/LedgerHQ/ledger-live/commit/08ee05cfb66f393b14fdf1377ed6c54c4831a87c), [`543b17d`](https://github.com/LedgerHQ/ledger-live/commit/543b17d7a6b49728001c0311c184c665e8c9bbb2), [`a7d54c0`](https://github.com/LedgerHQ/ledger-live/commit/a7d54c0d6af65abe7aa2170053b3fd07ae9b05ab), [`d60ce38`](https://github.com/LedgerHQ/ledger-live/commit/d60ce38581fe06b7f4fa72ba40259af2eabfe11f), [`7aa3071`](https://github.com/LedgerHQ/ledger-live/commit/7aa3071a532c98804a4357ff36a001b23351da73), [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a)]:
  - @domain/api-card-management@0.5.0
  - @shared/i18n@0.2.0

## 0.3.0-next.0

### Minor Changes

- [#21617](https://github.com/LedgerHQ/ledger-live/pull/21617) [`d01e4c0`](https://github.com/LedgerHQ/ledger-live/commit/d01e4c02a513082f6484c405f9a51977f14a6c03) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add Freeze component with useFreezeCardViewModel: freeze/unfreeze TileButton with optimistic state and error handling

### Patch Changes

- Updated dependencies [[`55bd216`](https://github.com/LedgerHQ/ledger-live/commit/55bd2166238ab3e03c33226bb5f5eb2e8646a818), [`08ee05c`](https://github.com/LedgerHQ/ledger-live/commit/08ee05cfb66f393b14fdf1377ed6c54c4831a87c), [`543b17d`](https://github.com/LedgerHQ/ledger-live/commit/543b17d7a6b49728001c0311c184c665e8c9bbb2), [`a7d54c0`](https://github.com/LedgerHQ/ledger-live/commit/a7d54c0d6af65abe7aa2170053b3fd07ae9b05ab), [`d60ce38`](https://github.com/LedgerHQ/ledger-live/commit/d60ce38581fe06b7f4fa72ba40259af2eabfe11f), [`7aa3071`](https://github.com/LedgerHQ/ledger-live/commit/7aa3071a532c98804a4357ff36a001b23351da73), [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a)]:
  - @domain/api-card-management@0.5.0-next.0
  - @shared/i18n@0.2.0

## 0.2.0

### Minor Changes

- [#21079](https://github.com/LedgerHQ/ledger-live/pull/21079) [`f567f20`](https://github.com/LedgerHQ/ledger-live/commit/f567f20c247b03e6335d90a6ac13dc181722c8cb) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the `pay-card-details` package with the `CardArtwork` card-face visual (dark gradient, halftone artwork and network logo) for the Pay tab, cross-platform (web + native).

- [#21081](https://github.com/LedgerHQ/ledger-live/pull/21081) [`35c12b6`](https://github.com/LedgerHQ/ledger-live/commit/35c12b61d14889fe2863be4e9bfa0db581b206e9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `CardVisual`: the card artwork with a balance overlay (localized caption + `AmountDisplay` amount), cross-platform (web + native). Props-only and i18n-agnostic.

## 0.2.0-next.0

### Minor Changes

- [#21079](https://github.com/LedgerHQ/ledger-live/pull/21079) [`f567f20`](https://github.com/LedgerHQ/ledger-live/commit/f567f20c247b03e6335d90a6ac13dc181722c8cb) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the `pay-card-details` package with the `CardArtwork` card-face visual (dark gradient, halftone artwork and network logo) for the Pay tab, cross-platform (web + native).

- [#21081](https://github.com/LedgerHQ/ledger-live/pull/21081) [`35c12b6`](https://github.com/LedgerHQ/ledger-live/commit/35c12b61d14889fe2863be4e9bfa0db581b206e9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `CardVisual`: the card artwork with a balance overlay (localized caption + `AmountDisplay` amount), cross-platform (web + native). Props-only and i18n-agnostic.
