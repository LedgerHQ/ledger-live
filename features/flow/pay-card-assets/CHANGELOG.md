# @features/flow-pay-card-assets

## 0.3.0-next.0

### Minor Changes

- [#22622](https://github.com/LedgerHQ/ledger-live/pull/22622) [`3e7bbe9`](https://github.com/LedgerHQ/ledger-live/commit/3e7bbe93f6075a2a6783e05d36459c166366c910) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Start dragging a card asset after a 200 ms long press instead of 500 ms

- [#22511](https://github.com/LedgerHQ/ledger-live/pull/22511) [`c32cde3`](https://github.com/LedgerHQ/ledger-live/commit/c32cde31461523c72df4f67cd18288c6f65c9951) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix drag-and-drop reordering in the card's manage-assets sheet, which never got the gesture

  - `QueuedBottomSheet` takes `enableContentPanningGesture`, so content that owns a drag gesture can stop the sheet's own pan from claiming it.
  - The manage-assets scene turns that gesture off and its list is no longer scrollable, leaving the drag uncontested and letting the sheet size to its rows.
  - The row being dragged takes a `surfacePressed` background.
  - The balance filter sheet sizes to its options instead of always opening at full height, with the confirm button pinned in the sheet's own footer slot.

- [#22528](https://github.com/LedgerHQ/ledger-live/pull/22528) [`6baab2e`](https://github.com/LedgerHQ/ledger-live/commit/6baab2e7989b00bec4c361cee3535f76cb919915) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Size the card transaction detail sheet to its content on mobile, so it no longer scrolls under its own header

  - The transaction and asset-transaction scenes size the sheet to their rows instead of opening at full height, and hold their content in a plain view rather than a scrollable, so the sheet has nowhere to scroll and its header stays put.
  - The card-details scenes declare whether they are scrollable next to their sizing, the way the manage-assets scene already behaved.
  - Content-sized sheets reserve the bottom safe area, which their own height no longer leaves room for.

- [#22619](https://github.com/LedgerHQ/ledger-live/pull/22619) [`4d84f2b`](https://github.com/LedgerHQ/ledger-live/commit/4d84f2b23f3bc04c06770e390e22cd4e35ee3fe3) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Keep the card assets info tooltip clear of the Android navigation bar

- [#22592](https://github.com/LedgerHQ/ledger-live/pull/22592) [`46f0f94`](https://github.com/LedgerHQ/ledger-live/commit/46f0f9447e12faa953268bf2a19fbdfd85a43da9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a dedicated empty and error state in Pay card assets and hide Manage until the list is ready.

- [#22353](https://github.com/LedgerHQ/ledger-live/pull/22353) [`ae229f2`](https://github.com/LedgerHQ/ledger-live/commit/ae229f27b250d6bdd06af1b06a2912a8c556a27c) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Show a counter-value on the card rewards banner.

  - The reward wallet now carries the currency it is denominated in, like a linked wallet does.
  - The banner prices it with the host's rates and leads with the counter-value.
  - The amount is formatted as a token, not as fiat.
  - A reward nothing can price shows the asset amount alone.
  - `priceWallet` is renamed `getCounterValue`: it converts an amount, it does not price a wallet.

- [#22440](https://github.com/LedgerHQ/ledger-live/pull/22440) [`a39ba90`](https://github.com/LedgerHQ/ledger-live/commit/a39ba900d889155ebc4fe2cab88f82a715e3f605) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix remaining Pay Mixpanel events and user properties from the tracking plan

- [#22549](https://github.com/LedgerHQ/ledger-live/pull/22549) [`24e881b`](https://github.com/LedgerHQ/ledger-live/commit/24e881b41d4199d9cf257a7450d139aa5f076a1d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Hide Pay and card history amounts when discreet mode is enabled, and toggle it from the Pay balance

- [#22522](https://github.com/LedgerHQ/ledger-live/pull/22522) [`e19e6cf`](https://github.com/LedgerHQ/ledger-live/commit/e19e6cf36074363d22085b6c85c54ef964eb382c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix the cropped transaction name and date on a card charge funded by several assets, and round card crypto amounts like the rest of the product. A devtool action and a mock fixture now produce such a charge.

- [#22327](https://github.com/LedgerHQ/ledger-live/pull/22327) [`df5d8c9`](https://github.com/LedgerHQ/ledger-live/commit/df5d8c96892094fc6faf06992f415e88ff64b5c8) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open the hosted crypto accounts dashboard when adding a card asset.

### Patch Changes

- Updated dependencies [[`b42673e`](https://github.com/LedgerHQ/ledger-live/commit/b42673eed68aba6b2885486d7294f5f9163f721d), [`ad2f1de`](https://github.com/LedgerHQ/ledger-live/commit/ad2f1deb73d1fd6fed1383133a7f2b259630cd06), [`6baab2e`](https://github.com/LedgerHQ/ledger-live/commit/6baab2e7989b00bec4c361cee3535f76cb919915), [`cfb7566`](https://github.com/LedgerHQ/ledger-live/commit/cfb756682290e9940d65f3b6417d6b111449e546), [`d6866e7`](https://github.com/LedgerHQ/ledger-live/commit/d6866e7dc7ced8898ac585d4e34d9667d9ad7f17), [`05715d2`](https://github.com/LedgerHQ/ledger-live/commit/05715d221f3e9651e95b811419373ad77718bab4), [`83fac3e`](https://github.com/LedgerHQ/ledger-live/commit/83fac3e00782840d1f118180dfb9afb9a484952c), [`b6a9b53`](https://github.com/LedgerHQ/ledger-live/commit/b6a9b531267360fdca64b8db22dd8781aa414dd9), [`68f4179`](https://github.com/LedgerHQ/ledger-live/commit/68f41798cae68cd1b91f291d5447514b80fd6f49), [`ea90542`](https://github.com/LedgerHQ/ledger-live/commit/ea90542540f47a76c18cf5f440bb98b9be71c837), [`e8518d7`](https://github.com/LedgerHQ/ledger-live/commit/e8518d7f0b88096552c6a8f74ffe5752bc517a39), [`912b087`](https://github.com/LedgerHQ/ledger-live/commit/912b0877538bd06cc7187b90e2eab8182fe55034), [`defb949`](https://github.com/LedgerHQ/ledger-live/commit/defb949c02d9d0d935882eb8e8617d000e18b163), [`3d41eab`](https://github.com/LedgerHQ/ledger-live/commit/3d41eab30728e94a21c53d4d4d9fe6eec27a5ce1), [`ae229f2`](https://github.com/LedgerHQ/ledger-live/commit/ae229f27b250d6bdd06af1b06a2912a8c556a27c), [`a39ba90`](https://github.com/LedgerHQ/ledger-live/commit/a39ba900d889155ebc4fe2cab88f82a715e3f605), [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383), [`c119e0d`](https://github.com/LedgerHQ/ledger-live/commit/c119e0d38f626314cf679bfa06420ce0e4bca03b), [`e19e6cf`](https://github.com/LedgerHQ/ledger-live/commit/e19e6cf36074363d22085b6c85c54ef964eb382c), [`df5d8c9`](https://github.com/LedgerHQ/ledger-live/commit/df5d8c96892094fc6faf06992f415e88ff64b5c8), [`f7ba21f`](https://github.com/LedgerHQ/ledger-live/commit/f7ba21f7df883e71102a0949c8a3d23e20fb4cbd)]:
  - @domain/api-card-management@0.8.0-next.0
  - @features/flow-pay-card-wallets@0.5.0-next.0
  - @features/platform-pay-analytics@0.3.0-next.0
  - @features/flow-pay-card-transactions@0.4.0-next.0
  - @features/flow-pay-card-auth@0.9.0-next.0
  - @shared/ui-list-reorder@0.2.0-next.0
  - @domain/entity-currency@0.4.5-next.0

## 0.2.0

### Minor Changes

- [#22228](https://github.com/LedgerHQ/ledger-live/pull/22228) [`1ec8d15`](https://github.com/LedgerHQ/ledger-live/commit/1ec8d15feb3f9339bc09c18c682e140d370c9efe) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Refine the Pay card assets list with loading skeletons, translated states, funding information, and asset values in the details dialog.

- [#22174](https://github.com/LedgerHQ/ledger-live/pull/22174) [`84bba64`](https://github.com/LedgerHQ/ledger-live/commit/84bba645bfe85f3bd4d6f03431916226113c7bc5) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add Pay card asset details and recent transactions.

- [#22231](https://github.com/LedgerHQ/ledger-live/pull/22231) [`c682542`](https://github.com/LedgerHQ/ledger-live/commit/c682542d2adc4066f1c5d6531f781babb0e772b9) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open card transaction history from an asset, scope it to that asset, and show cashback values.

- [#22233](https://github.com/LedgerHQ/ledger-live/pull/22233) [`dd155a7`](https://github.com/LedgerHQ/ledger-live/commit/dd155a7608f771f8e9a26007e3ad28a82429a700) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add mobile card asset management.

- [#22229](https://github.com/LedgerHQ/ledger-live/pull/22229) [`905d26b`](https://github.com/LedgerHQ/ledger-live/commit/905d26b9ea6f419d3269a376e0f0c9b6ce8b2b82) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a manage dialog for reordering Pay card funding assets and starting the add-asset flow.

- [#22232](https://github.com/LedgerHQ/ledger-live/pull/22232) [`d7d2b9a`](https://github.com/LedgerHQ/ledger-live/commit/d7d2b9a0907cb0b16dd481f09c92b8796d80d3a9) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add mobile card asset details and withdraw scenes.

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

- [#22301](https://github.com/LedgerHQ/ledger-live/pull/22301) [`6fe6efb`](https://github.com/LedgerHQ/ledger-live/commit/6fe6efb9f2c9211d6002dd17f4369f90390021bf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Consume the shared Pay analytics provider across card flows.

- [#21780](https://github.com/LedgerHQ/ledger-live/pull/21780) [`d19e4ae`](https://github.com/LedgerHQ/ledger-live/commit/d19e4aed0efb7e6ff8b8195dd8437cddbd455fe7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Extract CardAssets into @features/flow-pay-card-assets.

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce), [`4d1d640`](https://github.com/LedgerHQ/ledger-live/commit/4d1d64049a0bb0562a1a0c8ad2555fe967acdd7f), [`510465b`](https://github.com/LedgerHQ/ledger-live/commit/510465b5ac5808a42729dbea99aea081bf759e4a), [`72367fc`](https://github.com/LedgerHQ/ledger-live/commit/72367fcf2343fa488008236f1005da589e6e3054), [`a1a8b81`](https://github.com/LedgerHQ/ledger-live/commit/a1a8b81b3f9b4eb897ac3d81427a1df0a5e0130b), [`84bba64`](https://github.com/LedgerHQ/ledger-live/commit/84bba645bfe85f3bd4d6f03431916226113c7bc5), [`c682542`](https://github.com/LedgerHQ/ledger-live/commit/c682542d2adc4066f1c5d6531f781babb0e772b9), [`233e44e`](https://github.com/LedgerHQ/ledger-live/commit/233e44e3dd724cc9d4f14a02c7e62e39d2e9079b), [`6741356`](https://github.com/LedgerHQ/ledger-live/commit/67413566f84b895e6f4ae2b5d646bfc2e82c6926), [`dafadf0`](https://github.com/LedgerHQ/ledger-live/commit/dafadf005a54007d5430203c11b8718c1636a6e4), [`9652494`](https://github.com/LedgerHQ/ledger-live/commit/96524949cbf8fa1d102a0156f40004ff12a30475), [`5492648`](https://github.com/LedgerHQ/ledger-live/commit/5492648988e327c8e3e6e7d5ead1e0fa2bd9929e), [`d0fd787`](https://github.com/LedgerHQ/ledger-live/commit/d0fd787fb0e40b35f9d9c70307694d364f99b858), [`b97a3e5`](https://github.com/LedgerHQ/ledger-live/commit/b97a3e5462588d771a2ea5d628cfef7d564bc886), [`fd6b9d0`](https://github.com/LedgerHQ/ledger-live/commit/fd6b9d0b602e44c5520152c2307bd629f11afc7a), [`954ffbd`](https://github.com/LedgerHQ/ledger-live/commit/954ffbdeb8172f555b637599d24cf2a94bcf24db), [`a915d4a`](https://github.com/LedgerHQ/ledger-live/commit/a915d4a577dfe7bb778364c4b0269bc61203075a), [`99bf629`](https://github.com/LedgerHQ/ledger-live/commit/99bf629658121670784047780f74702cfa2c3ebc), [`853e47d`](https://github.com/LedgerHQ/ledger-live/commit/853e47dac8f42644733686353c3f0f4a3fcc035a), [`dbc9655`](https://github.com/LedgerHQ/ledger-live/commit/dbc9655cb61b4999fa6cd52dca25053f9f301dd3), [`afb2750`](https://github.com/LedgerHQ/ledger-live/commit/afb275029ec3aee1c833f1e468c41dc36279ab6f), [`eb06f77`](https://github.com/LedgerHQ/ledger-live/commit/eb06f77c9548a2e4641c37da90c34b4fcffba667), [`75038d5`](https://github.com/LedgerHQ/ledger-live/commit/75038d59735ac63ab43baf7bd298969890241b3b), [`d9d1111`](https://github.com/LedgerHQ/ledger-live/commit/d9d1111733e757cc58b6249fdda568dd56d40757), [`2aeb695`](https://github.com/LedgerHQ/ledger-live/commit/2aeb695663cf9a71d2a234ebc38819567f930564), [`91531f2`](https://github.com/LedgerHQ/ledger-live/commit/91531f29e71e4e186375a5e2908ddca0c351c0ac), [`287f042`](https://github.com/LedgerHQ/ledger-live/commit/287f04286e4933e31e31952a3ac6485e145e34f2), [`6fe6efb`](https://github.com/LedgerHQ/ledger-live/commit/6fe6efb9f2c9211d6002dd17f4369f90390021bf), [`43e1a21`](https://github.com/LedgerHQ/ledger-live/commit/43e1a21f2060d53875256b001e054cf0b1f7b86a)]:
  - @features/flow-pay-card-auth@0.8.0
  - @domain/api-card-management@0.7.0
  - @features/flow-pay-card-transactions@0.3.0
  - @features/platform-pay-analytics@0.2.0
  - @features/flow-pay-card-wallets@0.4.0
  - @domain/entity-currency@0.4.4

## 0.2.0-next.1

### Patch Changes

- Updated dependencies []:
  - @features/flow-pay-card-auth@0.8.0-next.1
  - @features/flow-pay-card-transactions@0.3.0-next.1

## 0.2.0-next.0

### Minor Changes

- [#22228](https://github.com/LedgerHQ/ledger-live/pull/22228) [`1ec8d15`](https://github.com/LedgerHQ/ledger-live/commit/1ec8d15feb3f9339bc09c18c682e140d370c9efe) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Refine the Pay card assets list with loading skeletons, translated states, funding information, and asset values in the details dialog.

- [#22174](https://github.com/LedgerHQ/ledger-live/pull/22174) [`84bba64`](https://github.com/LedgerHQ/ledger-live/commit/84bba645bfe85f3bd4d6f03431916226113c7bc5) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add Pay card asset details and recent transactions.

- [#22231](https://github.com/LedgerHQ/ledger-live/pull/22231) [`c682542`](https://github.com/LedgerHQ/ledger-live/commit/c682542d2adc4066f1c5d6531f781babb0e772b9) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open card transaction history from an asset, scope it to that asset, and show cashback values.

- [#22233](https://github.com/LedgerHQ/ledger-live/pull/22233) [`dd155a7`](https://github.com/LedgerHQ/ledger-live/commit/dd155a7608f771f8e9a26007e3ad28a82429a700) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add mobile card asset management.

- [#22229](https://github.com/LedgerHQ/ledger-live/pull/22229) [`905d26b`](https://github.com/LedgerHQ/ledger-live/commit/905d26b9ea6f419d3269a376e0f0c9b6ce8b2b82) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a manage dialog for reordering Pay card funding assets and starting the add-asset flow.

- [#22232](https://github.com/LedgerHQ/ledger-live/pull/22232) [`d7d2b9a`](https://github.com/LedgerHQ/ledger-live/commit/d7d2b9a0907cb0b16dd481f09c92b8796d80d3a9) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add mobile card asset details and withdraw scenes.

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

- [#22301](https://github.com/LedgerHQ/ledger-live/pull/22301) [`6fe6efb`](https://github.com/LedgerHQ/ledger-live/commit/6fe6efb9f2c9211d6002dd17f4369f90390021bf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Consume the shared Pay analytics provider across card flows.

- [#21780](https://github.com/LedgerHQ/ledger-live/pull/21780) [`d19e4ae`](https://github.com/LedgerHQ/ledger-live/commit/d19e4aed0efb7e6ff8b8195dd8437cddbd455fe7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Extract CardAssets into @features/flow-pay-card-assets.

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce), [`4d1d640`](https://github.com/LedgerHQ/ledger-live/commit/4d1d64049a0bb0562a1a0c8ad2555fe967acdd7f), [`510465b`](https://github.com/LedgerHQ/ledger-live/commit/510465b5ac5808a42729dbea99aea081bf759e4a), [`72367fc`](https://github.com/LedgerHQ/ledger-live/commit/72367fcf2343fa488008236f1005da589e6e3054), [`a1a8b81`](https://github.com/LedgerHQ/ledger-live/commit/a1a8b81b3f9b4eb897ac3d81427a1df0a5e0130b), [`84bba64`](https://github.com/LedgerHQ/ledger-live/commit/84bba645bfe85f3bd4d6f03431916226113c7bc5), [`c682542`](https://github.com/LedgerHQ/ledger-live/commit/c682542d2adc4066f1c5d6531f781babb0e772b9), [`233e44e`](https://github.com/LedgerHQ/ledger-live/commit/233e44e3dd724cc9d4f14a02c7e62e39d2e9079b), [`6741356`](https://github.com/LedgerHQ/ledger-live/commit/67413566f84b895e6f4ae2b5d646bfc2e82c6926), [`dafadf0`](https://github.com/LedgerHQ/ledger-live/commit/dafadf005a54007d5430203c11b8718c1636a6e4), [`9652494`](https://github.com/LedgerHQ/ledger-live/commit/96524949cbf8fa1d102a0156f40004ff12a30475), [`5492648`](https://github.com/LedgerHQ/ledger-live/commit/5492648988e327c8e3e6e7d5ead1e0fa2bd9929e), [`d0fd787`](https://github.com/LedgerHQ/ledger-live/commit/d0fd787fb0e40b35f9d9c70307694d364f99b858), [`b97a3e5`](https://github.com/LedgerHQ/ledger-live/commit/b97a3e5462588d771a2ea5d628cfef7d564bc886), [`fd6b9d0`](https://github.com/LedgerHQ/ledger-live/commit/fd6b9d0b602e44c5520152c2307bd629f11afc7a), [`954ffbd`](https://github.com/LedgerHQ/ledger-live/commit/954ffbdeb8172f555b637599d24cf2a94bcf24db), [`a915d4a`](https://github.com/LedgerHQ/ledger-live/commit/a915d4a577dfe7bb778364c4b0269bc61203075a), [`99bf629`](https://github.com/LedgerHQ/ledger-live/commit/99bf629658121670784047780f74702cfa2c3ebc), [`853e47d`](https://github.com/LedgerHQ/ledger-live/commit/853e47dac8f42644733686353c3f0f4a3fcc035a), [`dbc9655`](https://github.com/LedgerHQ/ledger-live/commit/dbc9655cb61b4999fa6cd52dca25053f9f301dd3), [`afb2750`](https://github.com/LedgerHQ/ledger-live/commit/afb275029ec3aee1c833f1e468c41dc36279ab6f), [`eb06f77`](https://github.com/LedgerHQ/ledger-live/commit/eb06f77c9548a2e4641c37da90c34b4fcffba667), [`75038d5`](https://github.com/LedgerHQ/ledger-live/commit/75038d59735ac63ab43baf7bd298969890241b3b), [`d9d1111`](https://github.com/LedgerHQ/ledger-live/commit/d9d1111733e757cc58b6249fdda568dd56d40757), [`2aeb695`](https://github.com/LedgerHQ/ledger-live/commit/2aeb695663cf9a71d2a234ebc38819567f930564), [`91531f2`](https://github.com/LedgerHQ/ledger-live/commit/91531f29e71e4e186375a5e2908ddca0c351c0ac), [`287f042`](https://github.com/LedgerHQ/ledger-live/commit/287f04286e4933e31e31952a3ac6485e145e34f2), [`6fe6efb`](https://github.com/LedgerHQ/ledger-live/commit/6fe6efb9f2c9211d6002dd17f4369f90390021bf), [`43e1a21`](https://github.com/LedgerHQ/ledger-live/commit/43e1a21f2060d53875256b001e054cf0b1f7b86a)]:
  - @features/flow-pay-card-auth@0.8.0-next.0
  - @domain/api-card-management@0.7.0-next.0
  - @features/flow-pay-card-transactions@0.3.0-next.0
  - @features/platform-pay-analytics@0.2.0-next.0
  - @features/flow-pay-card-wallets@0.4.0-next.0
  - @domain/entity-currency@0.4.4-next.0
