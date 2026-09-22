# @features/flow-pay-card

## 0.5.0-next.0

### Minor Changes

- [#21741](https://github.com/LedgerHQ/ledger-live/pull/21741) [`250c1c0`](https://github.com/LedgerHQ/ledger-live/commit/250c1c0e4cd081a67f46b37e852291a32e02b05b) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a mobile card-numbers View/Hide control that flips to the provider numbers image

- [#22257](https://github.com/LedgerHQ/ledger-live/pull/22257) [`510465b`](https://github.com/LedgerHQ/ledger-live/commit/510465b5ac5808a42729dbea99aea081bf759e4a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Expose settings redirect actions for Manage PIN, Access Baanx and Help on the card's More menu.
  The feature packages take already-resolved host callbacks and never build URLs or read env vars
  themselves — desktop opens Baanx pages through the existing hosted-page opener, mobile through the
  secure browser, and each app opens the Help article externally.

- [#22193](https://github.com/LedgerHQ/ledger-live/pull/22193) [`3d50917`](https://github.com/LedgerHQ/ledger-live/commit/3d50917da2e7c2177f8288bb754d41a7699f27be) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Open Apple/Google Pay add-to-wallet from card onboarding and the Pay Tab CTA.

- [#22228](https://github.com/LedgerHQ/ledger-live/pull/22228) [`1ec8d15`](https://github.com/LedgerHQ/ledger-live/commit/1ec8d15feb3f9339bc09c18c682e140d370c9efe) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Refine the Pay card assets list with loading skeletons, translated states, funding information, and asset values in the details dialog.

- [#22182](https://github.com/LedgerHQ/ledger-live/pull/22182) [`1557452`](https://github.com/LedgerHQ/ledger-live/commit/1557452f86f214191d2f29e5fca40b5077f90e11) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Reveal card numbers without a password unlock gate

- [#22232](https://github.com/LedgerHQ/ledger-live/pull/22232) [`d7d2b9a`](https://github.com/LedgerHQ/ledger-live/commit/d7d2b9a0907cb0b16dd481f09c92b8796d80d3a9) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add mobile card asset details and withdraw scenes.

- [#22094](https://github.com/LedgerHQ/ledger-live/pull/22094) [`8d073ca`](https://github.com/LedgerHQ/ledger-live/commit/8d073ca6a527a11ce6f10995bb896ae983211f63) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Show what each card wallet is worth in the user's currency.

  - The Assets list is implemented: both views were placeholders that rendered nothing.
  - A row is the design's: currency icon, name and ticker, then the counter value over what the wallet holds.
  - The counter value is left off when nothing could price the wallet; the crypto amount always shows.
  - `CardAssets` takes the currencies, the pricing and the formatter from the host, so the package stays free of the rates.
  - Native lists it inside the card details sheet, under the card actions, where the design puts it; `CardDetails` takes it as a slot.

- [#22111](https://github.com/LedgerHQ/ledger-live/pull/22111) [`dbc9655`](https://github.com/LedgerHQ/ledger-live/commit/dbc9655cb61b4999fa6cd52dca25053f9f301dd3) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a card transaction preview to mobile card details.

- [#22184](https://github.com/LedgerHQ/ledger-live/pull/22184) [`75038d5`](https://github.com/LedgerHQ/ledger-live/commit/75038d59735ac63ab43baf7bd298969890241b3b) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open the provider's top up page from the card on mobile.

  - The Top up button takes the place of the disabled "Coming soon" action on the card face, and it comes back at the bottom of the card details sheet.
  - Mobile opens `/topup` in the secure browser, which carries the provider session. A US card holder gets the US `app_id` on the query, so the page reaches the US tenant.

- [#22183](https://github.com/LedgerHQ/ledger-live/pull/22183) [`d9d1111`](https://github.com/LedgerHQ/ledger-live/commit/d9d1111733e757cc58b6249fdda568dd56d40757) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open the provider's top up page from the card on desktop.

  - `CardTopUpButton` carries the action. On desktop it stays at the bottom of the card panel, above the scrolling content.
  - Desktop opens `/topup` on the hosted live app manifest, the way the signup page already opens.
  - A US card holder gets the US `app_id` on the query, so the page reaches the US tenant.
  - Desktop ends the provider session in the webview on each entry of the Pay tab, so a session left behind by a top up cannot sign the previous holder back in. The login and the signup drop their own wipe: every one of them starts from an entry of the Pay tab.
  - The top up button in the asset details dialog opens the same page, with the asset pre-selected on the query.

- [#22102](https://github.com/LedgerHQ/ledger-live/pull/22102) [`4b346a0`](https://github.com/LedgerHQ/ledger-live/commit/4b346a0f90b2c1f7c66df4be38e7c4b6b992ce57) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Show the card's real balance on its face, instead of a mocked one.

  - The balance is the funding wallets' worth, summed; the provider reports no total.
  - A wallet nothing could price adds nothing, so the balance can understate what the card holds.
  - The face shows the wallets query's own loading state while the first read is in flight.
  - A failed read, or a host that lists no assets, keeps the bare artwork: a formatted zero would read as a real balance.
  - `useCardWalletsTotal` is published from the assets package; the list keeps its own pricing for the rows it formats.

- [#22046](https://github.com/LedgerHQ/ledger-live/pull/22046) [`2aeb695`](https://github.com/LedgerHQ/ledger-live/commit/2aeb695663cf9a71d2a234ebc38819567f930564) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a card transaction preview to the Pay card details view.

- [#22301](https://github.com/LedgerHQ/ledger-live/pull/22301) [`6fe6efb`](https://github.com/LedgerHQ/ledger-live/commit/6fe6efb9f2c9211d6002dd17f4369f90390021bf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Consume the shared Pay analytics provider across card flows.

- [#21780](https://github.com/LedgerHQ/ledger-live/pull/21780) [`d19e4ae`](https://github.com/LedgerHQ/ledger-live/commit/d19e4aed0efb7e6ff8b8195dd8437cddbd455fe7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Extract CardAssets into @features/flow-pay-card-assets.

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce), [`4d1d640`](https://github.com/LedgerHQ/ledger-live/commit/4d1d64049a0bb0562a1a0c8ad2555fe967acdd7f), [`731ebd2`](https://github.com/LedgerHQ/ledger-live/commit/731ebd22047779093d5821d38ea53f6f9fc1a694), [`250c1c0`](https://github.com/LedgerHQ/ledger-live/commit/250c1c0e4cd081a67f46b37e852291a32e02b05b), [`510465b`](https://github.com/LedgerHQ/ledger-live/commit/510465b5ac5808a42729dbea99aea081bf759e4a), [`c7eb01d`](https://github.com/LedgerHQ/ledger-live/commit/c7eb01d392a1adf04db824cd8602d939985599c7), [`72367fc`](https://github.com/LedgerHQ/ledger-live/commit/72367fcf2343fa488008236f1005da589e6e3054), [`c22ee67`](https://github.com/LedgerHQ/ledger-live/commit/c22ee67d3e0271b382337fe4175170bdabf5dfca), [`3d50917`](https://github.com/LedgerHQ/ledger-live/commit/3d50917da2e7c2177f8288bb754d41a7699f27be), [`cfa249c`](https://github.com/LedgerHQ/ledger-live/commit/cfa249c4c3a30f9eba1ecee1749030121da9291a), [`285b50d`](https://github.com/LedgerHQ/ledger-live/commit/285b50dc311eef60089f779cffdfe14a0422d2ec), [`a1a8b81`](https://github.com/LedgerHQ/ledger-live/commit/a1a8b81b3f9b4eb897ac3d81427a1df0a5e0130b), [`1ec8d15`](https://github.com/LedgerHQ/ledger-live/commit/1ec8d15feb3f9339bc09c18c682e140d370c9efe), [`84bba64`](https://github.com/LedgerHQ/ledger-live/commit/84bba645bfe85f3bd4d6f03431916226113c7bc5), [`c682542`](https://github.com/LedgerHQ/ledger-live/commit/c682542d2adc4066f1c5d6531f781babb0e772b9), [`dd155a7`](https://github.com/LedgerHQ/ledger-live/commit/dd155a7608f771f8e9a26007e3ad28a82429a700), [`95a1007`](https://github.com/LedgerHQ/ledger-live/commit/95a1007bb9d4f62d693391a99eca3cb3b12f0e7d), [`233e44e`](https://github.com/LedgerHQ/ledger-live/commit/233e44e3dd724cc9d4f14a02c7e62e39d2e9079b), [`1557452`](https://github.com/LedgerHQ/ledger-live/commit/1557452f86f214191d2f29e5fca40b5077f90e11), [`6741356`](https://github.com/LedgerHQ/ledger-live/commit/67413566f84b895e6f4ae2b5d646bfc2e82c6926), [`dafadf0`](https://github.com/LedgerHQ/ledger-live/commit/dafadf005a54007d5430203c11b8718c1636a6e4), [`9652494`](https://github.com/LedgerHQ/ledger-live/commit/96524949cbf8fa1d102a0156f40004ff12a30475), [`5492648`](https://github.com/LedgerHQ/ledger-live/commit/5492648988e327c8e3e6e7d5ead1e0fa2bd9929e), [`905d26b`](https://github.com/LedgerHQ/ledger-live/commit/905d26b9ea6f419d3269a376e0f0c9b6ce8b2b82), [`d7d2b9a`](https://github.com/LedgerHQ/ledger-live/commit/d7d2b9a0907cb0b16dd481f09c92b8796d80d3a9), [`d0fd787`](https://github.com/LedgerHQ/ledger-live/commit/d0fd787fb0e40b35f9d9c70307694d364f99b858), [`b97a3e5`](https://github.com/LedgerHQ/ledger-live/commit/b97a3e5462588d771a2ea5d628cfef7d564bc886), [`fd6b9d0`](https://github.com/LedgerHQ/ledger-live/commit/fd6b9d0b602e44c5520152c2307bd629f11afc7a), [`8d073ca`](https://github.com/LedgerHQ/ledger-live/commit/8d073ca6a527a11ce6f10995bb896ae983211f63), [`954ffbd`](https://github.com/LedgerHQ/ledger-live/commit/954ffbdeb8172f555b637599d24cf2a94bcf24db), [`a915d4a`](https://github.com/LedgerHQ/ledger-live/commit/a915d4a577dfe7bb778364c4b0269bc61203075a), [`99bf629`](https://github.com/LedgerHQ/ledger-live/commit/99bf629658121670784047780f74702cfa2c3ebc), [`853e47d`](https://github.com/LedgerHQ/ledger-live/commit/853e47dac8f42644733686353c3f0f4a3fcc035a), [`dbc9655`](https://github.com/LedgerHQ/ledger-live/commit/dbc9655cb61b4999fa6cd52dca25053f9f301dd3), [`afb2750`](https://github.com/LedgerHQ/ledger-live/commit/afb275029ec3aee1c833f1e468c41dc36279ab6f), [`eb06f77`](https://github.com/LedgerHQ/ledger-live/commit/eb06f77c9548a2e4641c37da90c34b4fcffba667), [`8dcb040`](https://github.com/LedgerHQ/ledger-live/commit/8dcb040ccac4abaeba356e76b60dc03802303bf5), [`75038d5`](https://github.com/LedgerHQ/ledger-live/commit/75038d59735ac63ab43baf7bd298969890241b3b), [`d9d1111`](https://github.com/LedgerHQ/ledger-live/commit/d9d1111733e757cc58b6249fdda568dd56d40757), [`4b346a0`](https://github.com/LedgerHQ/ledger-live/commit/4b346a0f90b2c1f7c66df4be38e7c4b6b992ce57), [`2aeb695`](https://github.com/LedgerHQ/ledger-live/commit/2aeb695663cf9a71d2a234ebc38819567f930564), [`287f042`](https://github.com/LedgerHQ/ledger-live/commit/287f04286e4933e31e31952a3ac6485e145e34f2), [`6fe6efb`](https://github.com/LedgerHQ/ledger-live/commit/6fe6efb9f2c9211d6002dd17f4369f90390021bf), [`d19e4ae`](https://github.com/LedgerHQ/ledger-live/commit/d19e4aed0efb7e6ff8b8195dd8437cddbd455fe7), [`43e1a21`](https://github.com/LedgerHQ/ledger-live/commit/43e1a21f2060d53875256b001e054cf0b1f7b86a), [`e1c0c65`](https://github.com/LedgerHQ/ledger-live/commit/e1c0c65f6c2726b29314ec2a7827d97672989ac0)]:
  - @features/flow-pay-card-auth@0.8.0-next.0
  - @domain/api-card-management@0.7.0-next.0
  - @features/flow-pay-card-details@0.5.0-next.0
  - @features/flow-pay-card-widget@0.4.0-next.0
  - @features/flow-pay-card-assets@0.2.0-next.0
  - @features/flow-pay-card-transactions@0.3.0-next.0
  - @features/platform-pay-analytics@0.2.0-next.0

## 0.4.0

### Minor Changes

- [#21928](https://github.com/LedgerHQ/ledger-live/pull/21928) [`1995d49`](https://github.com/LedgerHQ/ledger-live/commit/1995d49c63301199aef3e9a079f1d10fd0598f8b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Render the card transaction history on mobile, inside the card details sheet overview

- [#21707](https://github.com/LedgerHQ/ledger-live/pull/21707) [`8f62cdb`](https://github.com/LedgerHQ/ledger-live/commit/8f62cdbb6d93e207efd7e551af65a41953d28242) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add View/Hide and a 3D flip for card numbers.

- [#21722](https://github.com/LedgerHQ/ledger-live/pull/21722) [`182fae7`](https://github.com/LedgerHQ/ledger-live/commit/182fae7fbfa81b42de061e67da8edf21a7f72281) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a Card Details container with native artwork, Details sheet, and web composition

- [#21698](https://github.com/LedgerHQ/ledger-live/pull/21698) [`25224f4`](https://github.com/LedgerHQ/ledger-live/commit/25224f463b834dba7a2811d7150aeec6dbd6a3ac) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the More menu into card details and put freeze and More on one actions row

- [#21777](https://github.com/LedgerHQ/ledger-live/pull/21777) [`f7fa8f0`](https://github.com/LedgerHQ/ledger-live/commit/f7fa8f0ff23c03a69933f2d6aa6e0b225af9d542) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Resolve a single Pay Card display state so the card face, onboarding widget and login CTA no longer overlap, and hold them back until the stored session is read

- [#21958](https://github.com/LedgerHQ/ledger-live/pull/21958) [`1eb2e00`](https://github.com/LedgerHQ/ledger-live/commit/1eb2e00074fe05f103dd33c3fbf295cfd39e9c2e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the desktop Pay Card transaction detail dialog.

- [#21790](https://github.com/LedgerHQ/ledger-live/pull/21790) [`e7d79ac`](https://github.com/LedgerHQ/ledger-live/commit/e7d79acf1d91e98e2813755f9bebdbfd83e89f39) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - refactor(pay-card): accept a pending login and a host page opener

  `CardProps`/`CardViewProps` now take one nested `login: CardLoginProps` instead of the loose `oauthConfig`, `callback` and `onTrackEvent` props. `CardLoginProps` carries those three and adds optional `openHostedLogin` and `openHostedPage`, so a host app can supply how the Card flow opens its hosted pages instead of the flow assuming one way to do it.

  The flow also ignores a stray login redirect from an abandoned attempt. A redirect from an attempt the user had already retried away from could still land after a fresh attempt started, get exchanged against the new attempt's verifier, fail, and wipe that new attempt. The authorize URL now carries a local attempt id that the app compares against the current attempt before acting on a redirect.

- [#21934](https://github.com/LedgerHQ/ledger-live/pull/21934) [`c5229d1`](https://github.com/LedgerHQ/ledger-live/commit/c5229d1b2bbf8d8067e036f0a34dda403519e206) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Pass host amount and date formatters as one object, using Desktop's date formatter for transaction dates.

- [#21917](https://github.com/LedgerHQ/ledger-live/pull/21917) [`a2a0288`](https://github.com/LedgerHQ/ledger-live/commit/a2a028844dbfbfa019f1f971bf6fdbed9005b9ec) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show card transactions on the Pay Card panel as a list of items, with a subheader when the list is not empty.

- [#22023](https://github.com/LedgerHQ/ledger-live/pull/22023) [`0f4b55e`](https://github.com/LedgerHQ/ledger-live/commit/0f4b55e46459492e880a8e5e118b570a934ce4d7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Polish Pay tab UI: square network icons, verify-address icon size, deposit dialog inset, header/balance spacing, and move card title/balance copy into the flow.

- [#21824](https://github.com/LedgerHQ/ledger-live/pull/21824) [`c88b5c6`](https://github.com/LedgerHQ/ledger-live/commit/c88b5c65b0488097e2a17071ca04ac06ae41763a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Scroll the whole Pay tab: the content no longer gets clipped and clears the tab bar

- [#21771](https://github.com/LedgerHQ/ledger-live/pull/21771) [`6c1be58`](https://github.com/LedgerHQ/ledger-live/commit/6c1be58b4dbcce00cc114442d2aeb76278248d99) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a shared CardAssets view-model that reads card-linked wallets (views still render nothing).

- [#21947](https://github.com/LedgerHQ/ledger-live/pull/21947) [`9d0b721`](https://github.com/LedgerHQ/ledger-live/commit/9d0b721dbfd8b71d32d2d16db22ad8e54f45f541) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the mobile Pay Card transaction detail sheet with tracking and copyable transaction IDs.

### Patch Changes

- Updated dependencies [[`9164e8b`](https://github.com/LedgerHQ/ledger-live/commit/9164e8b81ecb84e5d8ba0bb606981c2dc83d04c1), [`1995d49`](https://github.com/LedgerHQ/ledger-live/commit/1995d49c63301199aef3e9a079f1d10fd0598f8b), [`2e47336`](https://github.com/LedgerHQ/ledger-live/commit/2e4733627ccb62c39fdf1e7d4b9f7d22559609bf), [`8f62cdb`](https://github.com/LedgerHQ/ledger-live/commit/8f62cdbb6d93e207efd7e551af65a41953d28242), [`182fae7`](https://github.com/LedgerHQ/ledger-live/commit/182fae7fbfa81b42de061e67da8edf21a7f72281), [`ba31ece`](https://github.com/LedgerHQ/ledger-live/commit/ba31ece3a22febeafbec027840d16ea82c2dad5e), [`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf), [`25224f4`](https://github.com/LedgerHQ/ledger-live/commit/25224f463b834dba7a2811d7150aeec6dbd6a3ac), [`f7fa8f0`](https://github.com/LedgerHQ/ledger-live/commit/f7fa8f0ff23c03a69933f2d6aa6e0b225af9d542), [`1eb2e00`](https://github.com/LedgerHQ/ledger-live/commit/1eb2e00074fe05f103dd33c3fbf295cfd39e9c2e), [`799219e`](https://github.com/LedgerHQ/ledger-live/commit/799219e262e80a339272113ea164fa506243b438), [`939300a`](https://github.com/LedgerHQ/ledger-live/commit/939300add757537632def29302a24a72a67f84b6), [`cef83ae`](https://github.com/LedgerHQ/ledger-live/commit/cef83ae58ffc5529bebda292737502e78e3b7522), [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2), [`c6f7bfe`](https://github.com/LedgerHQ/ledger-live/commit/c6f7bfead8593c148fe6e3d177ff8dd734728f5a), [`0e1e102`](https://github.com/LedgerHQ/ledger-live/commit/0e1e10227aa5cc0d19e8a142533c54838e3ed57e), [`34f8541`](https://github.com/LedgerHQ/ledger-live/commit/34f8541ae58847dcee784b3fe97f227edd644775), [`eddc89e`](https://github.com/LedgerHQ/ledger-live/commit/eddc89e7b86a13aeedfc0ae4956c2dcd08494e5f), [`b976cda`](https://github.com/LedgerHQ/ledger-live/commit/b976cda52320ef3f778fc11b4f95d2c5bf54ffe0), [`e7d79ac`](https://github.com/LedgerHQ/ledger-live/commit/e7d79acf1d91e98e2813755f9bebdbfd83e89f39), [`c5229d1`](https://github.com/LedgerHQ/ledger-live/commit/c5229d1b2bbf8d8067e036f0a34dda403519e206), [`37f5759`](https://github.com/LedgerHQ/ledger-live/commit/37f57595f11d40562914794645cb3c7f6e55dc8b), [`a2a0288`](https://github.com/LedgerHQ/ledger-live/commit/a2a028844dbfbfa019f1f971bf6fdbed9005b9ec), [`6553e61`](https://github.com/LedgerHQ/ledger-live/commit/6553e61da87bd604a357d5a79eefd3ac17e225d1), [`19314ca`](https://github.com/LedgerHQ/ledger-live/commit/19314cafec3eee0803bee7f9b877c9e9ccc819e8), [`c88b5c6`](https://github.com/LedgerHQ/ledger-live/commit/c88b5c65b0488097e2a17071ca04ac06ae41763a), [`a5d438e`](https://github.com/LedgerHQ/ledger-live/commit/a5d438e3c6cd557e8c77f2f40be2c20540f23cec), [`9d0b721`](https://github.com/LedgerHQ/ledger-live/commit/9d0b721dbfd8b71d32d2d16db22ad8e54f45f541), [`529a7fc`](https://github.com/LedgerHQ/ledger-live/commit/529a7fc909409f4f5740ce8add9abbab1b784157), [`d353658`](https://github.com/LedgerHQ/ledger-live/commit/d353658a0254e49a369ca7481c9680254e9e4851)]:
  - @features/flow-pay-card-details@0.4.0
  - @features/flow-pay-card-transactions@0.2.0
  - @features/flow-pay-card-auth@0.7.0
  - @features/flow-pay-card-wallets@0.3.0
  - @features/flow-pay-card-widget@0.3.0
  - @shared/i18n@0.2.0

## 0.4.0-next.0

### Minor Changes

- [#21928](https://github.com/LedgerHQ/ledger-live/pull/21928) [`1995d49`](https://github.com/LedgerHQ/ledger-live/commit/1995d49c63301199aef3e9a079f1d10fd0598f8b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Render the card transaction history on mobile, inside the card details sheet overview

- [#21707](https://github.com/LedgerHQ/ledger-live/pull/21707) [`8f62cdb`](https://github.com/LedgerHQ/ledger-live/commit/8f62cdbb6d93e207efd7e551af65a41953d28242) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add View/Hide and a 3D flip for card numbers.

- [#21722](https://github.com/LedgerHQ/ledger-live/pull/21722) [`182fae7`](https://github.com/LedgerHQ/ledger-live/commit/182fae7fbfa81b42de061e67da8edf21a7f72281) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a Card Details container with native artwork, Details sheet, and web composition

- [#21698](https://github.com/LedgerHQ/ledger-live/pull/21698) [`25224f4`](https://github.com/LedgerHQ/ledger-live/commit/25224f463b834dba7a2811d7150aeec6dbd6a3ac) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the More menu into card details and put freeze and More on one actions row

- [#21777](https://github.com/LedgerHQ/ledger-live/pull/21777) [`f7fa8f0`](https://github.com/LedgerHQ/ledger-live/commit/f7fa8f0ff23c03a69933f2d6aa6e0b225af9d542) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Resolve a single Pay Card display state so the card face, onboarding widget and login CTA no longer overlap, and hold them back until the stored session is read

- [#21958](https://github.com/LedgerHQ/ledger-live/pull/21958) [`1eb2e00`](https://github.com/LedgerHQ/ledger-live/commit/1eb2e00074fe05f103dd33c3fbf295cfd39e9c2e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the desktop Pay Card transaction detail dialog.

- [#21790](https://github.com/LedgerHQ/ledger-live/pull/21790) [`e7d79ac`](https://github.com/LedgerHQ/ledger-live/commit/e7d79acf1d91e98e2813755f9bebdbfd83e89f39) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - refactor(pay-card): accept a pending login and a host page opener

  `CardProps`/`CardViewProps` now take one nested `login: CardLoginProps` instead of the loose `oauthConfig`, `callback` and `onTrackEvent` props. `CardLoginProps` carries those three and adds optional `openHostedLogin` and `openHostedPage`, so a host app can supply how the Card flow opens its hosted pages instead of the flow assuming one way to do it.

  The flow also ignores a stray login redirect from an abandoned attempt. A redirect from an attempt the user had already retried away from could still land after a fresh attempt started, get exchanged against the new attempt's verifier, fail, and wipe that new attempt. The authorize URL now carries a local attempt id that the app compares against the current attempt before acting on a redirect.

- [#21934](https://github.com/LedgerHQ/ledger-live/pull/21934) [`c5229d1`](https://github.com/LedgerHQ/ledger-live/commit/c5229d1b2bbf8d8067e036f0a34dda403519e206) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Pass host amount and date formatters as one object, using Desktop's date formatter for transaction dates.

- [#21917](https://github.com/LedgerHQ/ledger-live/pull/21917) [`a2a0288`](https://github.com/LedgerHQ/ledger-live/commit/a2a028844dbfbfa019f1f971bf6fdbed9005b9ec) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show card transactions on the Pay Card panel as a list of items, with a subheader when the list is not empty.

- [#22023](https://github.com/LedgerHQ/ledger-live/pull/22023) [`0f4b55e`](https://github.com/LedgerHQ/ledger-live/commit/0f4b55e46459492e880a8e5e118b570a934ce4d7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Polish Pay tab UI: square network icons, verify-address icon size, deposit dialog inset, header/balance spacing, and move card title/balance copy into the flow.

- [#21824](https://github.com/LedgerHQ/ledger-live/pull/21824) [`c88b5c6`](https://github.com/LedgerHQ/ledger-live/commit/c88b5c65b0488097e2a17071ca04ac06ae41763a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Scroll the whole Pay tab: the content no longer gets clipped and clears the tab bar

- [#21771](https://github.com/LedgerHQ/ledger-live/pull/21771) [`6c1be58`](https://github.com/LedgerHQ/ledger-live/commit/6c1be58b4dbcce00cc114442d2aeb76278248d99) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a shared CardAssets view-model that reads card-linked wallets (views still render nothing).

- [#21947](https://github.com/LedgerHQ/ledger-live/pull/21947) [`9d0b721`](https://github.com/LedgerHQ/ledger-live/commit/9d0b721dbfd8b71d32d2d16db22ad8e54f45f541) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the mobile Pay Card transaction detail sheet with tracking and copyable transaction IDs.

### Patch Changes

- Updated dependencies [[`9164e8b`](https://github.com/LedgerHQ/ledger-live/commit/9164e8b81ecb84e5d8ba0bb606981c2dc83d04c1), [`1995d49`](https://github.com/LedgerHQ/ledger-live/commit/1995d49c63301199aef3e9a079f1d10fd0598f8b), [`2e47336`](https://github.com/LedgerHQ/ledger-live/commit/2e4733627ccb62c39fdf1e7d4b9f7d22559609bf), [`8f62cdb`](https://github.com/LedgerHQ/ledger-live/commit/8f62cdbb6d93e207efd7e551af65a41953d28242), [`182fae7`](https://github.com/LedgerHQ/ledger-live/commit/182fae7fbfa81b42de061e67da8edf21a7f72281), [`ba31ece`](https://github.com/LedgerHQ/ledger-live/commit/ba31ece3a22febeafbec027840d16ea82c2dad5e), [`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf), [`25224f4`](https://github.com/LedgerHQ/ledger-live/commit/25224f463b834dba7a2811d7150aeec6dbd6a3ac), [`f7fa8f0`](https://github.com/LedgerHQ/ledger-live/commit/f7fa8f0ff23c03a69933f2d6aa6e0b225af9d542), [`1eb2e00`](https://github.com/LedgerHQ/ledger-live/commit/1eb2e00074fe05f103dd33c3fbf295cfd39e9c2e), [`799219e`](https://github.com/LedgerHQ/ledger-live/commit/799219e262e80a339272113ea164fa506243b438), [`939300a`](https://github.com/LedgerHQ/ledger-live/commit/939300add757537632def29302a24a72a67f84b6), [`cef83ae`](https://github.com/LedgerHQ/ledger-live/commit/cef83ae58ffc5529bebda292737502e78e3b7522), [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2), [`c6f7bfe`](https://github.com/LedgerHQ/ledger-live/commit/c6f7bfead8593c148fe6e3d177ff8dd734728f5a), [`0e1e102`](https://github.com/LedgerHQ/ledger-live/commit/0e1e10227aa5cc0d19e8a142533c54838e3ed57e), [`34f8541`](https://github.com/LedgerHQ/ledger-live/commit/34f8541ae58847dcee784b3fe97f227edd644775), [`eddc89e`](https://github.com/LedgerHQ/ledger-live/commit/eddc89e7b86a13aeedfc0ae4956c2dcd08494e5f), [`b976cda`](https://github.com/LedgerHQ/ledger-live/commit/b976cda52320ef3f778fc11b4f95d2c5bf54ffe0), [`e7d79ac`](https://github.com/LedgerHQ/ledger-live/commit/e7d79acf1d91e98e2813755f9bebdbfd83e89f39), [`c5229d1`](https://github.com/LedgerHQ/ledger-live/commit/c5229d1b2bbf8d8067e036f0a34dda403519e206), [`37f5759`](https://github.com/LedgerHQ/ledger-live/commit/37f57595f11d40562914794645cb3c7f6e55dc8b), [`a2a0288`](https://github.com/LedgerHQ/ledger-live/commit/a2a028844dbfbfa019f1f971bf6fdbed9005b9ec), [`6553e61`](https://github.com/LedgerHQ/ledger-live/commit/6553e61da87bd604a357d5a79eefd3ac17e225d1), [`19314ca`](https://github.com/LedgerHQ/ledger-live/commit/19314cafec3eee0803bee7f9b877c9e9ccc819e8), [`c88b5c6`](https://github.com/LedgerHQ/ledger-live/commit/c88b5c65b0488097e2a17071ca04ac06ae41763a), [`a5d438e`](https://github.com/LedgerHQ/ledger-live/commit/a5d438e3c6cd557e8c77f2f40be2c20540f23cec), [`9d0b721`](https://github.com/LedgerHQ/ledger-live/commit/9d0b721dbfd8b71d32d2d16db22ad8e54f45f541), [`529a7fc`](https://github.com/LedgerHQ/ledger-live/commit/529a7fc909409f4f5740ce8add9abbab1b784157), [`d353658`](https://github.com/LedgerHQ/ledger-live/commit/d353658a0254e49a369ca7481c9680254e9e4851)]:
  - @features/flow-pay-card-details@0.4.0-next.0
  - @features/flow-pay-card-transactions@0.2.0-next.0
  - @features/flow-pay-card-auth@0.7.0-next.0
  - @features/flow-pay-card-wallets@0.3.0-next.0
  - @features/flow-pay-card-widget@0.3.0-next.0
  - @shared/i18n@0.2.0

## 0.3.0

### Minor Changes

- [#21550](https://github.com/LedgerHQ/ledger-live/pull/21550) [`6ed1820`](https://github.com/LedgerHQ/ledger-live/commit/6ed1820776ca6ba59e861da11e4582af406b2188) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Mount and persist the card onboarding widget in Ledger Wallet Desktop.

- [#21610](https://github.com/LedgerHQ/ledger-live/pull/21610) [`6b47659`](https://github.com/LedgerHQ/ledger-live/commit/6b4765929e98abbcb08cd5348fddb528a9e674e7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add native card onboarding widget on mobile with Apple/Google Pay step and wallet persistence

- [#21632](https://github.com/LedgerHQ/ledger-live/pull/21632) [`5f6b8a8`](https://github.com/LedgerHQ/ledger-live/commit/5f6b8a88709d1fd4a94fccaaab915d5ad322c584) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - add freeze button in desktop app

- [#21428](https://github.com/LedgerHQ/ledger-live/pull/21428) [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Show a Card login intro sheet on the first press of the card's action (LIVE-36793). The sheet has two
  buttons. "Log in to Baanx" runs the OAuth2 hosted login. "Create an account" opens the provider's
  own signup page, `/onboarding/signup` on the new `CARD_BAANX_HOSTED_UI` host, in the same browser. The
  intro shows once: a new persisted `payCardLoginIntro` flag goes up when a login the card holder just
  started reaches `ready`, and it survives an app restart inside the shared `payCard` blob. A hydrated
  session raises nothing. A tester resets the flag from the Pay Card devtool, and the intro shows again
  on the next press.

  The same flag now picks what the login block says, from the app's new `payTab.cardLogin.*` keys. It
  sells the card while the flag is down — "Get 1% cashback every time you spend" under a `Get card`
  button that opens the intro — and offers a login once the flag is up: "Log in to access your card"
  under a `Login` button that starts one. Its title is `Crypto Card`, and on mobile it is a Lumen
  `Subheader` under the card face, so the Pay Card flow no longer draws a section title above it there.
  Desktop keeps its host-provided title.

  The virtual card row names one wallet only: Apple Pay on iOS, Google Pay on Android. Desktop cannot
  see the phone the card will be added to, so it keeps naming both. Each row wraps its title and its
  description over as many lines as the copy needs, instead of cutting both off at the first.

  Hosts inject `onTrackEvent`. Get card, Login, the intro buttons and close fire `button_clicked`;
  opening the intro also fires `Page card login intro`.

  `CARD_BAANX_HOSTED_UI` defaults to `https://ledger-ew1uat.baanxapi.com`. Both apps read it with
  `useEnv` and hand it to the flow as `oauthConfig.hostedUiUrl`, so a new value moves the signup page
  to another tenant without a restart.

### Patch Changes

- Updated dependencies [[`d01e4c0`](https://github.com/LedgerHQ/ledger-live/commit/d01e4c02a513082f6484c405f9a51977f14a6c03), [`6b47659`](https://github.com/LedgerHQ/ledger-live/commit/6b4765929e98abbcb08cd5348fddb528a9e674e7), [`b1b1e38`](https://github.com/LedgerHQ/ledger-live/commit/b1b1e38d2a8311f935f30c185276c165a6992dbc), [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6), [`3de7317`](https://github.com/LedgerHQ/ledger-live/commit/3de7317d858c570600eb0a4297876327fdc2c7b5), [`faa8ef1`](https://github.com/LedgerHQ/ledger-live/commit/faa8ef11055a27af3eb7bcf1b662e8bf5c3da77d), [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a)]:
  - @features/flow-pay-card-details@0.3.0
  - @features/flow-pay-card-widget@0.2.0
  - @features/flow-pay-card-auth@0.6.0

## 0.3.0-next.0

### Minor Changes

- [#21550](https://github.com/LedgerHQ/ledger-live/pull/21550) [`6ed1820`](https://github.com/LedgerHQ/ledger-live/commit/6ed1820776ca6ba59e861da11e4582af406b2188) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Mount and persist the card onboarding widget in Ledger Wallet Desktop.

- [#21610](https://github.com/LedgerHQ/ledger-live/pull/21610) [`6b47659`](https://github.com/LedgerHQ/ledger-live/commit/6b4765929e98abbcb08cd5348fddb528a9e674e7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add native card onboarding widget on mobile with Apple/Google Pay step and wallet persistence

- [#21632](https://github.com/LedgerHQ/ledger-live/pull/21632) [`5f6b8a8`](https://github.com/LedgerHQ/ledger-live/commit/5f6b8a88709d1fd4a94fccaaab915d5ad322c584) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - add freeze button in desktop app

- [#21428](https://github.com/LedgerHQ/ledger-live/pull/21428) [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Show a Card login intro sheet on the first press of the card's action (LIVE-36793). The sheet has two
  buttons. "Log in to Baanx" runs the OAuth2 hosted login. "Create an account" opens the provider's
  own signup page, `/onboarding/signup` on the new `CARD_BAANX_HOSTED_UI` host, in the same browser. The
  intro shows once: a new persisted `payCardLoginIntro` flag goes up when a login the card holder just
  started reaches `ready`, and it survives an app restart inside the shared `payCard` blob. A hydrated
  session raises nothing. A tester resets the flag from the Pay Card devtool, and the intro shows again
  on the next press.

  The same flag now picks what the login block says, from the app's new `payTab.cardLogin.*` keys. It
  sells the card while the flag is down — "Get 1% cashback every time you spend" under a `Get card`
  button that opens the intro — and offers a login once the flag is up: "Log in to access your card"
  under a `Login` button that starts one. Its title is `Crypto Card`, and on mobile it is a Lumen
  `Subheader` under the card face, so the Pay Card flow no longer draws a section title above it there.
  Desktop keeps its host-provided title.

  The virtual card row names one wallet only: Apple Pay on iOS, Google Pay on Android. Desktop cannot
  see the phone the card will be added to, so it keeps naming both. Each row wraps its title and its
  description over as many lines as the copy needs, instead of cutting both off at the first.

  Hosts inject `onTrackEvent`. Get card, Login, the intro buttons and close fire `button_clicked`;
  opening the intro also fires `Page card login intro`.

  `CARD_BAANX_HOSTED_UI` defaults to `https://ledger-ew1uat.baanxapi.com`. Both apps read it with
  `useEnv` and hand it to the flow as `oauthConfig.hostedUiUrl`, so a new value moves the signup page
  to another tenant without a restart.

### Patch Changes

- Updated dependencies [[`d01e4c0`](https://github.com/LedgerHQ/ledger-live/commit/d01e4c02a513082f6484c405f9a51977f14a6c03), [`6b47659`](https://github.com/LedgerHQ/ledger-live/commit/6b4765929e98abbcb08cd5348fddb528a9e674e7), [`b1b1e38`](https://github.com/LedgerHQ/ledger-live/commit/b1b1e38d2a8311f935f30c185276c165a6992dbc), [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6), [`3de7317`](https://github.com/LedgerHQ/ledger-live/commit/3de7317d858c570600eb0a4297876327fdc2c7b5), [`faa8ef1`](https://github.com/LedgerHQ/ledger-live/commit/faa8ef11055a27af3eb7bcf1b662e8bf5c3da77d), [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a)]:
  - @features/flow-pay-card-details@0.3.0-next.0
  - @features/flow-pay-card-widget@0.2.0-next.0
  - @features/flow-pay-card-auth@0.6.0-next.0

## 0.2.0

### Minor Changes

- [#21244](https://github.com/LedgerHQ/ledger-live/pull/21244) [`f4986f8`](https://github.com/LedgerHQ/ledger-live/commit/f4986f882385e07dbd531d99a0571c67ca91ada0) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a host-provided Crypto card title on the Pay Card web and native views

- [#21363](https://github.com/LedgerHQ/ledger-live/pull/21363) [`ce47443`](https://github.com/LedgerHQ/ledger-live/commit/ce47443e97f559210443547a7948ef61c01f7feb) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Read CARD_API_URL and CARD_BAANX_CLIENT_KEY on every use, and not one time at boot. The debug settings can now change the Card tenant without a restart. The mobile app also applies its `.env` values before the store reads them.

- [#21099](https://github.com/LedgerHQ/ledger-live/pull/21099) [`c8614bf`](https://github.com/LedgerHQ/ledger-live/commit/c8614bfbfd1dc8de12731c2c333b9d137f0f2f93) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `@features/flow-pay-card`, a Contacts-style orchestrator that aggregates the Pay Card leaf flows behind a single `Card` entry point. It follows the app MVVM split — a `Card` container wires a shared `useCardViewModel` to the platform `CardView` — and composes the card face from `@features/flow-pay-card-details` (`CardVisual` with the balance overlay, or the bare `CardArtwork`) with the authentication controls (`CardLogin` / `CardLogout` from `@features/flow-pay-card-auth`), each of which still decides on its own whether it belongs on screen.

  The flow owns the (currently mocked) card balance and assembles the overlay itself, so hosts no longer pass a pre-built visual: they hand over only what they alone know — `formatCountervalue` (needs the app's locale and counter-value currency) and `balanceLabel` (i18n). Both apps now mount `Card` instead of wiring `CardLogin` / `CardLogout` directly: desktop in the Pay tab's right panel, mobile in the Pay tab body. The package composes rather than re-exports: apps that need a single leaf or its Redux state (`@features/flow-pay-card-auth/state`) keep importing that leaf directly.

### Patch Changes

- Updated dependencies [[`0500726`](https://github.com/LedgerHQ/ledger-live/commit/05007264f5b1726a21c2e545a10c18993fd2fcb5), [`ad1c0ff`](https://github.com/LedgerHQ/ledger-live/commit/ad1c0ff93b94ba9a0b1e7409e5ddbdc2d73bcd30)]:
  - @features/flow-pay-card-auth@0.5.0
  - @features/flow-pay-card-details@0.2.0

## 0.2.0-next.0

### Minor Changes

- [#21244](https://github.com/LedgerHQ/ledger-live/pull/21244) [`f4986f8`](https://github.com/LedgerHQ/ledger-live/commit/f4986f882385e07dbd531d99a0571c67ca91ada0) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a host-provided Crypto card title on the Pay Card web and native views

- [#21363](https://github.com/LedgerHQ/ledger-live/pull/21363) [`ce47443`](https://github.com/LedgerHQ/ledger-live/commit/ce47443e97f559210443547a7948ef61c01f7feb) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Read CARD_API_URL and CARD_BAANX_CLIENT_KEY on every use, and not one time at boot. The debug settings can now change the Card tenant without a restart. The mobile app also applies its `.env` values before the store reads them.

- [#21099](https://github.com/LedgerHQ/ledger-live/pull/21099) [`c8614bf`](https://github.com/LedgerHQ/ledger-live/commit/c8614bfbfd1dc8de12731c2c333b9d137f0f2f93) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `@features/flow-pay-card`, a Contacts-style orchestrator that aggregates the Pay Card leaf flows behind a single `Card` entry point. It follows the app MVVM split — a `Card` container wires a shared `useCardViewModel` to the platform `CardView` — and composes the card face from `@features/flow-pay-card-details` (`CardVisual` with the balance overlay, or the bare `CardArtwork`) with the authentication controls (`CardLogin` / `CardLogout` from `@features/flow-pay-card-auth`), each of which still decides on its own whether it belongs on screen.

  The flow owns the (currently mocked) card balance and assembles the overlay itself, so hosts no longer pass a pre-built visual: they hand over only what they alone know — `formatCountervalue` (needs the app's locale and counter-value currency) and `balanceLabel` (i18n). Both apps now mount `Card` instead of wiring `CardLogin` / `CardLogout` directly: desktop in the Pay tab's right panel, mobile in the Pay tab body. The package composes rather than re-exports: apps that need a single leaf or its Redux state (`@features/flow-pay-card-auth/state`) keep importing that leaf directly.

### Patch Changes

- Updated dependencies [[`0500726`](https://github.com/LedgerHQ/ledger-live/commit/05007264f5b1726a21c2e545a10c18993fd2fcb5), [`ad1c0ff`](https://github.com/LedgerHQ/ledger-live/commit/ad1c0ff93b94ba9a0b1e7409e5ddbdc2d73bcd30)]:
  - @features/flow-pay-card-auth@0.5.0-next.0
  - @features/flow-pay-card-details@0.2.0
