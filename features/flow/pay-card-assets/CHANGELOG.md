# @features/flow-pay-card-assets

## 0.8.0-next.0

### Minor Changes

- [#25369](https://github.com/LedgerHQ/ledger-live/pull/25369) [`5c7f0ef`](https://github.com/LedgerHQ/ledger-live/commit/5c7f0ef8aaebce9ac0dcf1eb509dd0756f389b10) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Upgrade Lumen to latest

  - Updated `@ledgerhq/lumen-design-core` to `0.1.37`
  - Updated `@ledgerhq/lumen-ui-react` to `0.1.75`
  - Updated `@ledgerhq/lumen-ui-rnative` to `0.1.76`

### Patch Changes

- Updated dependencies []:
  - @domain/entity-currency@0.5.2-next.0
  - @features/flow-pay-card-auth@0.14.1-next.0
  - @domain/api-card-management@0.10.1-next.0
  - @features/flow-pay-card-wallets@0.6.6-next.0
  - @features/flow-pay-card-transactions@0.8.1-next.0

## 0.7.2

### Patch Changes

- Updated dependencies [[`ce2c91d`](https://github.com/LedgerHQ/ledger-live/commit/ce2c91dde08828cc6a213ab19ba1e13efccacc41), [`5af6447`](https://github.com/LedgerHQ/ledger-live/commit/5af6447acb234632ed35feec4735b415d1993ced), [`74c967e`](https://github.com/LedgerHQ/ledger-live/commit/74c967eb7dda848648df0db683910140b5d6e906), [`2267444`](https://github.com/LedgerHQ/ledger-live/commit/226744400780b00d6468f890d06a821440fb5608), [`9300f96`](https://github.com/LedgerHQ/ledger-live/commit/9300f9670ca7e76be132ea6fffc24c04c0f0b3ea), [`9f6f480`](https://github.com/LedgerHQ/ledger-live/commit/9f6f48031fad77047e3a6377838816229ba4da5b)]:
  - @features/flow-pay-card-auth@0.14.0
  - @features/flow-pay-card-transactions@0.8.0
  - @domain/api-card-management@0.10.0
  - @domain/entity-currency@0.5.1
  - @features/flow-pay-card-wallets@0.6.5
  - @features/platform-pay-analytics@0.4.1

## 0.7.2-next.0

### Patch Changes

- Updated dependencies [[`ce2c91d`](https://github.com/LedgerHQ/ledger-live/commit/ce2c91dde08828cc6a213ab19ba1e13efccacc41), [`5af6447`](https://github.com/LedgerHQ/ledger-live/commit/5af6447acb234632ed35feec4735b415d1993ced), [`74c967e`](https://github.com/LedgerHQ/ledger-live/commit/74c967eb7dda848648df0db683910140b5d6e906), [`2267444`](https://github.com/LedgerHQ/ledger-live/commit/226744400780b00d6468f890d06a821440fb5608), [`9300f96`](https://github.com/LedgerHQ/ledger-live/commit/9300f9670ca7e76be132ea6fffc24c04c0f0b3ea), [`9f6f480`](https://github.com/LedgerHQ/ledger-live/commit/9f6f48031fad77047e3a6377838816229ba4da5b)]:
  - @features/flow-pay-card-auth@0.14.0-next.0
  - @features/flow-pay-card-transactions@0.8.0-next.0
  - @domain/api-card-management@0.10.0-next.0
  - @domain/entity-currency@0.5.1-next.0
  - @features/flow-pay-card-wallets@0.6.5-next.0
  - @features/platform-pay-analytics@0.4.1-next.0

## 0.7.1

### Patch Changes

- Updated dependencies [[`8d68514`](https://github.com/LedgerHQ/ledger-live/commit/8d6851405315262fdb54a003dcad1d07f2010c31)]:
  - @features/flow-pay-card-auth@0.13.0
  - @features/flow-pay-card-transactions@0.7.3
  - @features/flow-pay-card-wallets@0.6.4

## 0.7.1-next.0

### Patch Changes

- Updated dependencies [[`8d68514`](https://github.com/LedgerHQ/ledger-live/commit/8d6851405315262fdb54a003dcad1d07f2010c31)]:
  - @features/flow-pay-card-auth@0.13.0-next.0
  - @features/flow-pay-card-transactions@0.7.3-next.0
  - @features/flow-pay-card-wallets@0.6.4

## 0.7.0

### Minor Changes

- [#24216](https://github.com/LedgerHQ/ledger-live/pull/24216) [`cc6d736`](https://github.com/LedgerHQ/ledger-live/commit/cc6d736fba670fcf5795123eb89f664f01807cff) Thanks [@ysitbon](https://github.com/ysitbon)! - Name the card assets view model callbacks after their intent: `onAssetPress` becomes `onOpenAsset`, `onTopUpPress` becomes `onTopUpAsset`, `onWithdrawPress` becomes `onOpenWithdraw`, `onShowHistoryPress` becomes `onShowHistory`, `onManagePress` becomes `onManageAssets`, `onRetryPress` becomes `onRetry` and `onAddAssetPress` becomes `onAddAsset`. `CardAssetDetailsDrawer` takes `onOpenTransaction` instead of `onTransactionPress`.

- [#24134](https://github.com/LedgerHQ/ledger-live/pull/24134) [`b582a36`](https://github.com/LedgerHQ/ledger-live/commit/b582a360738037ab8393a554f304d9e942892287) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @ledgerhq/crypto-icons to v2.0.7

  - Updated `@ledgerhq/crypto-icons` to `2.0.7`

### Patch Changes

- Updated dependencies [[`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @domain/entity-currency@0.5.0
  - @domain/api-card-management@0.9.0
  - @features/flow-pay-card-auth@0.12.0
  - @features/flow-pay-card-wallets@0.6.4
  - @features/flow-pay-card-transactions@0.7.2

## 0.7.0-next.0

### Minor Changes

- [#24216](https://github.com/LedgerHQ/ledger-live/pull/24216) [`cc6d736`](https://github.com/LedgerHQ/ledger-live/commit/cc6d736fba670fcf5795123eb89f664f01807cff) Thanks [@ysitbon](https://github.com/ysitbon)! - Name the card assets view model callbacks after their intent: `onAssetPress` becomes `onOpenAsset`, `onTopUpPress` becomes `onTopUpAsset`, `onWithdrawPress` becomes `onOpenWithdraw`, `onShowHistoryPress` becomes `onShowHistory`, `onManagePress` becomes `onManageAssets`, `onRetryPress` becomes `onRetry` and `onAddAssetPress` becomes `onAddAsset`. `CardAssetDetailsDrawer` takes `onOpenTransaction` instead of `onTransactionPress`.

- [#24134](https://github.com/LedgerHQ/ledger-live/pull/24134) [`b582a36`](https://github.com/LedgerHQ/ledger-live/commit/b582a360738037ab8393a554f304d9e942892287) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @ledgerhq/crypto-icons to v2.0.7

  - Updated `@ledgerhq/crypto-icons` to `2.0.7`

### Patch Changes

- Updated dependencies [[`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @domain/entity-currency@0.5.0-next.0
  - @domain/api-card-management@0.9.0-next.0
  - @features/flow-pay-card-auth@0.12.0-next.0
  - @features/flow-pay-card-wallets@0.6.4-next.0
  - @features/flow-pay-card-transactions@0.7.2-next.0

## 0.6.0

### Minor Changes

- [#24041](https://github.com/LedgerHQ/ledger-live/pull/24041) [`c8c49b0`](https://github.com/LedgerHQ/ledger-live/commit/c8c49b07639f2f855e8acb5af7d3def3c1a69e13) Thanks [@ysitbon](https://github.com/ysitbon)! - Split the card assets exports by platform: `CardAssets` moves to the `./web` entry, and the native `CardAssetsView` and the asset drawers (`CardAssetDetailsDrawer`, `CardAssetDetailsWithdrawDrawer`, `CardAssetTransactionDetailDrawer`, `CardAssetsManageDrawer`) move to the `./native` entry, each with its props type. The `.` entry keeps the hooks, the selector and the types on both platforms. `CardAssetsManageFooter` is no longer exported.

### Patch Changes

- Updated dependencies []:
  - @domain/api-card-management@0.8.4
  - @domain/entity-currency@0.4.9
  - @features/flow-pay-card-auth@0.11.1
  - @features/flow-pay-card-transactions@0.7.1
  - @features/flow-pay-card-wallets@0.6.3

## 0.6.0-next.0

### Minor Changes

- [#24041](https://github.com/LedgerHQ/ledger-live/pull/24041) [`c8c49b0`](https://github.com/LedgerHQ/ledger-live/commit/c8c49b07639f2f855e8acb5af7d3def3c1a69e13) Thanks [@ysitbon](https://github.com/ysitbon)! - Split the card assets exports by platform: `CardAssets` moves to the `./web` entry, and the native `CardAssetsView` and the asset drawers (`CardAssetDetailsDrawer`, `CardAssetDetailsWithdrawDrawer`, `CardAssetTransactionDetailDrawer`, `CardAssetsManageDrawer`) move to the `./native` entry, each with its props type. The `.` entry keeps the hooks, the selector and the types on both platforms. `CardAssetsManageFooter` is no longer exported.

### Patch Changes

- Updated dependencies []:
  - @domain/api-card-management@0.8.4-next.0
  - @domain/entity-currency@0.4.9-next.0
  - @features/flow-pay-card-auth@0.11.1-next.0
  - @features/flow-pay-card-transactions@0.7.1-next.0
  - @features/flow-pay-card-wallets@0.6.3-next.0

## 0.5.0

### Minor Changes

- [#23963](https://github.com/LedgerHQ/ledger-live/pull/23963) [`6c1779a`](https://github.com/LedgerHQ/ledger-live/commit/6c1779af32758f7d6542032888be19c6aa740d59) Thanks [@ysitbon](https://github.com/ysitbon)! - Make the card transaction components universal: `CardTransactions` takes `onOpenTransaction` and `ListItem` takes `onOpenTransaction`, `CardTransactionDetail` is the detail content on both platforms, and the web dialog moves to `CardTransactionDetailDialog` in the `./web` entry. `CategoryIcon` is no longer exported.

### Patch Changes

- Updated dependencies [[`25baf72`](https://github.com/LedgerHQ/ledger-live/commit/25baf72ba4d19425dae6973af5438040e453c234), [`4216add`](https://github.com/LedgerHQ/ledger-live/commit/4216addd84f49f073e5bd7c0ae7019f40799955f), [`00badce`](https://github.com/LedgerHQ/ledger-live/commit/00badce303d15692c8ff9a91658803da1253af0c), [`6c1779a`](https://github.com/LedgerHQ/ledger-live/commit/6c1779af32758f7d6542032888be19c6aa740d59)]:
  - @features/platform-pay-analytics@0.4.0
  - @features/flow-pay-card-auth@0.11.0
  - @features/flow-pay-card-transactions@0.7.0
  - @domain/entity-currency@0.4.8
  - @features/flow-pay-card-wallets@0.6.2
  - @shared/i18n@0.2.0
  - @shared/ui-list-reorder@0.2.0
  - @domain/api-card-management@0.8.3

## 0.5.0-next.0

### Minor Changes

- [#23963](https://github.com/LedgerHQ/ledger-live/pull/23963) [`6c1779a`](https://github.com/LedgerHQ/ledger-live/commit/6c1779af32758f7d6542032888be19c6aa740d59) Thanks [@ysitbon](https://github.com/ysitbon)! - Make the card transaction components universal: `CardTransactions` takes `onOpenTransaction` and `ListItem` takes `onOpenTransaction`, `CardTransactionDetail` is the detail content on both platforms, and the web dialog moves to `CardTransactionDetailDialog` in the `./web` entry. `CategoryIcon` is no longer exported.

### Patch Changes

- Updated dependencies [[`25baf72`](https://github.com/LedgerHQ/ledger-live/commit/25baf72ba4d19425dae6973af5438040e453c234), [`4216add`](https://github.com/LedgerHQ/ledger-live/commit/4216addd84f49f073e5bd7c0ae7019f40799955f), [`00badce`](https://github.com/LedgerHQ/ledger-live/commit/00badce303d15692c8ff9a91658803da1253af0c), [`6c1779a`](https://github.com/LedgerHQ/ledger-live/commit/6c1779af32758f7d6542032888be19c6aa740d59)]:
  - @features/platform-pay-analytics@0.4.0-next.0
  - @features/flow-pay-card-auth@0.11.0-next.0
  - @features/flow-pay-card-transactions@0.7.0-next.0
  - @domain/entity-currency@0.4.8-next.0
  - @features/flow-pay-card-wallets@0.6.2-next.0
  - @shared/i18n@0.2.0
  - @shared/ui-list-reorder@0.2.0
  - @domain/api-card-management@0.8.3-next.0

## 0.4.0

### Minor Changes

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

### Patch Changes

- Updated dependencies [[`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`2e198e2`](https://github.com/LedgerHQ/ledger-live/commit/2e198e2394723873a79e56635cfe21a2ab763454)]:
  - @features/flow-pay-card-transactions@0.6.0
  - @features/flow-pay-card-auth@0.10.1
  - @domain/entity-currency@0.4.7
  - @features/flow-pay-card-wallets@0.6.1
  - @domain/api-card-management@0.8.2

## 0.4.0-next.0

### Minor Changes

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

### Patch Changes

- Updated dependencies [[`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`2e198e2`](https://github.com/LedgerHQ/ledger-live/commit/2e198e2394723873a79e56635cfe21a2ab763454)]:
  - @features/flow-pay-card-transactions@0.6.0-next.0
  - @features/flow-pay-card-auth@0.10.1-next.0
  - @domain/entity-currency@0.4.7-next.0
  - @features/flow-pay-card-wallets@0.6.1-next.0
  - @domain/api-card-management@0.8.2-next.0

## 0.3.1

### Patch Changes

- Updated dependencies [[`20bf9b0`](https://github.com/LedgerHQ/ledger-live/commit/20bf9b0c8694e9a3c873da1e81fd6b310410205c), [`e7996b4`](https://github.com/LedgerHQ/ledger-live/commit/e7996b4bb9f13726af09cc5202d26d1e471563ef), [`77e7162`](https://github.com/LedgerHQ/ledger-live/commit/77e716257785645b79027b580fcef2dfbab7ad3b), [`57921f9`](https://github.com/LedgerHQ/ledger-live/commit/57921f955b6c07389cb78d4c087c881667858dc2), [`514d6f9`](https://github.com/LedgerHQ/ledger-live/commit/514d6f937e082fa8b86d87bcf170cc2ec57d51e0), [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53), [`b2792d8`](https://github.com/LedgerHQ/ledger-live/commit/b2792d8806411c2a35e1622109bee830c44a6cbc), [`bed3cf9`](https://github.com/LedgerHQ/ledger-live/commit/bed3cf9bd880e00d51fc90849dca3741b9ab779f)]:
  - @features/flow-pay-card-transactions@0.5.0
  - @features/flow-pay-card-auth@0.10.0
  - @features/flow-pay-card-wallets@0.6.0
  - @domain/entity-currency@0.4.6
  - @domain/api-card-management@0.8.1
  - @shared/i18n@0.2.0
  - @shared/ui-list-reorder@0.2.0
  - @features/platform-pay-analytics@0.3.0

## 0.3.1-next.0

### Patch Changes

- Updated dependencies [[`20bf9b0`](https://github.com/LedgerHQ/ledger-live/commit/20bf9b0c8694e9a3c873da1e81fd6b310410205c), [`e7996b4`](https://github.com/LedgerHQ/ledger-live/commit/e7996b4bb9f13726af09cc5202d26d1e471563ef), [`77e7162`](https://github.com/LedgerHQ/ledger-live/commit/77e716257785645b79027b580fcef2dfbab7ad3b), [`57921f9`](https://github.com/LedgerHQ/ledger-live/commit/57921f955b6c07389cb78d4c087c881667858dc2), [`514d6f9`](https://github.com/LedgerHQ/ledger-live/commit/514d6f937e082fa8b86d87bcf170cc2ec57d51e0), [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53), [`b2792d8`](https://github.com/LedgerHQ/ledger-live/commit/b2792d8806411c2a35e1622109bee830c44a6cbc), [`bed3cf9`](https://github.com/LedgerHQ/ledger-live/commit/bed3cf9bd880e00d51fc90849dca3741b9ab779f)]:
  - @features/flow-pay-card-transactions@0.5.0-next.0
  - @features/flow-pay-card-auth@0.10.0-next.0
  - @features/flow-pay-card-wallets@0.6.0-next.0
  - @domain/entity-currency@0.4.6-next.0
  - @domain/api-card-management@0.8.1-next.0
  - @shared/i18n@0.2.0
  - @shared/ui-list-reorder@0.2.0
  - @features/platform-pay-analytics@0.3.0

## 0.3.0

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

- Updated dependencies [[`b42673e`](https://github.com/LedgerHQ/ledger-live/commit/b42673eed68aba6b2885486d7294f5f9163f721d), [`ad2f1de`](https://github.com/LedgerHQ/ledger-live/commit/ad2f1deb73d1fd6fed1383133a7f2b259630cd06), [`cee85b4`](https://github.com/LedgerHQ/ledger-live/commit/cee85b47d7d1f414e23935e77c9ad22d98ddf994), [`6baab2e`](https://github.com/LedgerHQ/ledger-live/commit/6baab2e7989b00bec4c361cee3535f76cb919915), [`cfb7566`](https://github.com/LedgerHQ/ledger-live/commit/cfb756682290e9940d65f3b6417d6b111449e546), [`d6866e7`](https://github.com/LedgerHQ/ledger-live/commit/d6866e7dc7ced8898ac585d4e34d9667d9ad7f17), [`05715d2`](https://github.com/LedgerHQ/ledger-live/commit/05715d221f3e9651e95b811419373ad77718bab4), [`83fac3e`](https://github.com/LedgerHQ/ledger-live/commit/83fac3e00782840d1f118180dfb9afb9a484952c), [`b6a9b53`](https://github.com/LedgerHQ/ledger-live/commit/b6a9b531267360fdca64b8db22dd8781aa414dd9), [`68f4179`](https://github.com/LedgerHQ/ledger-live/commit/68f41798cae68cd1b91f291d5447514b80fd6f49), [`ea90542`](https://github.com/LedgerHQ/ledger-live/commit/ea90542540f47a76c18cf5f440bb98b9be71c837), [`e8518d7`](https://github.com/LedgerHQ/ledger-live/commit/e8518d7f0b88096552c6a8f74ffe5752bc517a39), [`56640ba`](https://github.com/LedgerHQ/ledger-live/commit/56640ba2c03cec8555f7452da785c8dd949ec010), [`5ff6348`](https://github.com/LedgerHQ/ledger-live/commit/5ff6348d1505e805bdbbff64685b0b97bc2a8981), [`912b087`](https://github.com/LedgerHQ/ledger-live/commit/912b0877538bd06cc7187b90e2eab8182fe55034), [`defb949`](https://github.com/LedgerHQ/ledger-live/commit/defb949c02d9d0d935882eb8e8617d000e18b163), [`3d41eab`](https://github.com/LedgerHQ/ledger-live/commit/3d41eab30728e94a21c53d4d4d9fe6eec27a5ce1), [`ae229f2`](https://github.com/LedgerHQ/ledger-live/commit/ae229f27b250d6bdd06af1b06a2912a8c556a27c), [`a39ba90`](https://github.com/LedgerHQ/ledger-live/commit/a39ba900d889155ebc4fe2cab88f82a715e3f605), [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21), [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383), [`8947c0b`](https://github.com/LedgerHQ/ledger-live/commit/8947c0b97fa0d5abd017d880bfc3089a74d9cc77), [`c119e0d`](https://github.com/LedgerHQ/ledger-live/commit/c119e0d38f626314cf679bfa06420ce0e4bca03b), [`e19e6cf`](https://github.com/LedgerHQ/ledger-live/commit/e19e6cf36074363d22085b6c85c54ef964eb382c), [`df5d8c9`](https://github.com/LedgerHQ/ledger-live/commit/df5d8c96892094fc6faf06992f415e88ff64b5c8), [`f7ba21f`](https://github.com/LedgerHQ/ledger-live/commit/f7ba21f7df883e71102a0949c8a3d23e20fb4cbd)]:
  - @domain/api-card-management@0.8.0
  - @features/flow-pay-card-wallets@0.5.0
  - @features/platform-pay-analytics@0.3.0
  - @features/flow-pay-card-transactions@0.4.0
  - @features/flow-pay-card-auth@0.9.0
  - @shared/ui-list-reorder@0.2.0
  - @domain/entity-currency@0.4.5

## 0.3.0-next.4

### Patch Changes

- Updated dependencies [[`5ff6348`](https://github.com/LedgerHQ/ledger-live/commit/5ff6348d1505e805bdbbff64685b0b97bc2a8981)]:
  - @features/flow-pay-card-auth@0.9.0-next.3
  - @features/flow-pay-card-transactions@0.4.0-next.4

## 0.3.0-next.3

### Patch Changes

- Updated dependencies [[`56640ba`](https://github.com/LedgerHQ/ledger-live/commit/56640ba2c03cec8555f7452da785c8dd949ec010), [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21)]:
  - @features/flow-pay-card-auth@0.9.0-next.2
  - @features/flow-pay-card-transactions@0.4.0-next.3

## 0.3.0-next.2

### Patch Changes

- Updated dependencies [[`cee85b4`](https://github.com/LedgerHQ/ledger-live/commit/cee85b47d7d1f414e23935e77c9ad22d98ddf994)]:
  - @features/flow-pay-card-auth@0.9.0-next.1
  - @features/flow-pay-card-transactions@0.4.0-next.2

## 0.3.0-next.1

### Patch Changes

- Updated dependencies [[`8947c0b`](https://github.com/LedgerHQ/ledger-live/commit/8947c0b97fa0d5abd017d880bfc3089a74d9cc77)]:
  - @features/flow-pay-card-transactions@0.4.0-next.1

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

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
