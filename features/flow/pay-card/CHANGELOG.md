# @features/flow-pay-card

## 0.9.3-next.0

### Patch Changes

- Updated dependencies [[`5c7f0ef`](https://github.com/LedgerHQ/ledger-live/commit/5c7f0ef8aaebce9ac0dcf1eb509dd0756f389b10)]:
  - @features/flow-pay-card-assets@0.8.0-next.0
  - @features/flow-pay-card-details@0.12.1-next.0
  - @features/flow-pay-card-auth@0.14.1-next.0
  - @domain/api-card-management@0.10.1-next.0
  - @features/flow-pay-card-widget@0.8.1-next.0
  - @features/flow-pay-card-transactions@0.8.1-next.0

## 0.9.2

### Patch Changes

- Updated dependencies [[`ce2c91d`](https://github.com/LedgerHQ/ledger-live/commit/ce2c91dde08828cc6a213ab19ba1e13efccacc41), [`5af6447`](https://github.com/LedgerHQ/ledger-live/commit/5af6447acb234632ed35feec4735b415d1993ced), [`2e761cc`](https://github.com/LedgerHQ/ledger-live/commit/2e761ccb7416b0ba60b5f325c8237761e75a9b8d), [`74c967e`](https://github.com/LedgerHQ/ledger-live/commit/74c967eb7dda848648df0db683910140b5d6e906), [`2267444`](https://github.com/LedgerHQ/ledger-live/commit/226744400780b00d6468f890d06a821440fb5608), [`9300f96`](https://github.com/LedgerHQ/ledger-live/commit/9300f9670ca7e76be132ea6fffc24c04c0f0b3ea), [`d27f68a`](https://github.com/LedgerHQ/ledger-live/commit/d27f68ac780099cbd47e533709ebef83f9345d89), [`9f6f480`](https://github.com/LedgerHQ/ledger-live/commit/9f6f48031fad77047e3a6377838816229ba4da5b), [`7fffee2`](https://github.com/LedgerHQ/ledger-live/commit/7fffee2e21d1a9b056d026bd2ff50431a1b2793a)]:
  - @features/flow-pay-card-auth@0.14.0
  - @features/flow-pay-card-transactions@0.8.0
  - @domain/api-card-management@0.10.0
  - @features/flow-pay-card-details@0.12.0
  - @features/flow-pay-card-widget@0.8.0
  - @features/flow-pay-card-assets@0.7.2
  - @features/platform-pay-analytics@0.4.1

## 0.9.2-next.0

### Patch Changes

- Updated dependencies [[`ce2c91d`](https://github.com/LedgerHQ/ledger-live/commit/ce2c91dde08828cc6a213ab19ba1e13efccacc41), [`5af6447`](https://github.com/LedgerHQ/ledger-live/commit/5af6447acb234632ed35feec4735b415d1993ced), [`2e761cc`](https://github.com/LedgerHQ/ledger-live/commit/2e761ccb7416b0ba60b5f325c8237761e75a9b8d), [`74c967e`](https://github.com/LedgerHQ/ledger-live/commit/74c967eb7dda848648df0db683910140b5d6e906), [`2267444`](https://github.com/LedgerHQ/ledger-live/commit/226744400780b00d6468f890d06a821440fb5608), [`9300f96`](https://github.com/LedgerHQ/ledger-live/commit/9300f9670ca7e76be132ea6fffc24c04c0f0b3ea), [`d27f68a`](https://github.com/LedgerHQ/ledger-live/commit/d27f68ac780099cbd47e533709ebef83f9345d89), [`9f6f480`](https://github.com/LedgerHQ/ledger-live/commit/9f6f48031fad77047e3a6377838816229ba4da5b), [`7fffee2`](https://github.com/LedgerHQ/ledger-live/commit/7fffee2e21d1a9b056d026bd2ff50431a1b2793a)]:
  - @features/flow-pay-card-auth@0.14.0-next.0
  - @features/flow-pay-card-transactions@0.8.0-next.0
  - @domain/api-card-management@0.10.0-next.0
  - @features/flow-pay-card-details@0.12.0-next.0
  - @features/flow-pay-card-widget@0.8.0-next.0
  - @features/flow-pay-card-assets@0.7.2-next.0
  - @features/platform-pay-analytics@0.4.1-next.0

## 0.9.1

### Patch Changes

- Updated dependencies [[`8d68514`](https://github.com/LedgerHQ/ledger-live/commit/8d6851405315262fdb54a003dcad1d07f2010c31)]:
  - @features/flow-pay-card-auth@0.13.0
  - @features/flow-pay-card-transactions@0.7.3
  - @features/flow-pay-card-assets@0.7.1
  - @features/flow-pay-card-details@0.11.1
  - @features/flow-pay-card-widget@0.7.0

## 0.9.1-next.0

### Patch Changes

- Updated dependencies [[`8d68514`](https://github.com/LedgerHQ/ledger-live/commit/8d6851405315262fdb54a003dcad1d07f2010c31)]:
  - @features/flow-pay-card-auth@0.13.0-next.0
  - @features/flow-pay-card-transactions@0.7.3-next.0
  - @features/flow-pay-card-assets@0.7.1-next.0
  - @features/flow-pay-card-details@0.11.1-next.0
  - @features/flow-pay-card-widget@0.7.0

## 0.9.0

### Minor Changes

- [#24216](https://github.com/LedgerHQ/ledger-live/pull/24216) [`cc6d736`](https://github.com/LedgerHQ/ledger-live/commit/cc6d736fba670fcf5795123eb89f664f01807cff) Thanks [@ysitbon](https://github.com/ysitbon)! - Make the card details `.` entry the same on both platforms. `CardArtwork` takes one props contract, `CardArtworkProps`, whose `size` applies on web only. `CardPrimaryActionButton` moves to the `./web` entry with its props type. `CardTopUpButton`, `Freeze`, `More` and `CardVisual` are no longer exported. `pay-card` imports `CardPrimaryActionButton` from `@features/flow-pay-card-details/web`.

### Patch Changes

- Updated dependencies [[`cc6d736`](https://github.com/LedgerHQ/ledger-live/commit/cc6d736fba670fcf5795123eb89f664f01807cff), [`b582a36`](https://github.com/LedgerHQ/ledger-live/commit/b582a360738037ab8393a554f304d9e942892287), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @features/flow-pay-card-assets@0.7.0
  - @features/flow-pay-card-details@0.11.0
  - @domain/api-card-management@0.9.0
  - @features/flow-pay-card-auth@0.12.0
  - @features/flow-pay-card-widget@0.7.0
  - @features/flow-pay-card-transactions@0.7.2

## 0.9.0-next.0

### Minor Changes

- [#24216](https://github.com/LedgerHQ/ledger-live/pull/24216) [`cc6d736`](https://github.com/LedgerHQ/ledger-live/commit/cc6d736fba670fcf5795123eb89f664f01807cff) Thanks [@ysitbon](https://github.com/ysitbon)! - Make the card details `.` entry the same on both platforms. `CardArtwork` takes one props contract, `CardArtworkProps`, whose `size` applies on web only. `CardPrimaryActionButton` moves to the `./web` entry with its props type. `CardTopUpButton`, `Freeze`, `More` and `CardVisual` are no longer exported. `pay-card` imports `CardPrimaryActionButton` from `@features/flow-pay-card-details/web`.

### Patch Changes

- Updated dependencies [[`cc6d736`](https://github.com/LedgerHQ/ledger-live/commit/cc6d736fba670fcf5795123eb89f664f01807cff), [`b582a36`](https://github.com/LedgerHQ/ledger-live/commit/b582a360738037ab8393a554f304d9e942892287), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @features/flow-pay-card-assets@0.7.0-next.0
  - @features/flow-pay-card-details@0.11.0-next.0
  - @domain/api-card-management@0.9.0-next.0
  - @features/flow-pay-card-auth@0.12.0-next.0
  - @features/flow-pay-card-widget@0.7.0-next.0
  - @features/flow-pay-card-transactions@0.7.2-next.0

## 0.8.0

### Minor Changes

- [#24041](https://github.com/LedgerHQ/ledger-live/pull/24041) [`c8c49b0`](https://github.com/LedgerHQ/ledger-live/commit/c8c49b07639f2f855e8acb5af7d3def3c1a69e13) Thanks [@ysitbon](https://github.com/ysitbon)! - Split the card assets exports by platform: `CardAssets` moves to the `./web` entry, and the native `CardAssetsView` and the asset drawers (`CardAssetDetailsDrawer`, `CardAssetDetailsWithdrawDrawer`, `CardAssetTransactionDetailDrawer`, `CardAssetsManageDrawer`) move to the `./native` entry, each with its props type. The `.` entry keeps the hooks, the selector and the types on both platforms. `CardAssetsManageFooter` is no longer exported.

### Patch Changes

- Updated dependencies [[`c8c49b0`](https://github.com/LedgerHQ/ledger-live/commit/c8c49b07639f2f855e8acb5af7d3def3c1a69e13)]:
  - @features/flow-pay-card-assets@0.6.0
  - @features/flow-pay-card-details@0.10.0
  - @domain/api-card-management@0.8.4
  - @features/flow-pay-card-auth@0.11.1
  - @features/flow-pay-card-transactions@0.7.1
  - @features/flow-pay-card-widget@0.6.2

## 0.8.0-next.0

### Minor Changes

- [#24041](https://github.com/LedgerHQ/ledger-live/pull/24041) [`c8c49b0`](https://github.com/LedgerHQ/ledger-live/commit/c8c49b07639f2f855e8acb5af7d3def3c1a69e13) Thanks [@ysitbon](https://github.com/ysitbon)! - Split the card assets exports by platform: `CardAssets` moves to the `./web` entry, and the native `CardAssetsView` and the asset drawers (`CardAssetDetailsDrawer`, `CardAssetDetailsWithdrawDrawer`, `CardAssetTransactionDetailDrawer`, `CardAssetsManageDrawer`) move to the `./native` entry, each with its props type. The `.` entry keeps the hooks, the selector and the types on both platforms. `CardAssetsManageFooter` is no longer exported.

### Patch Changes

- Updated dependencies [[`c8c49b0`](https://github.com/LedgerHQ/ledger-live/commit/c8c49b07639f2f855e8acb5af7d3def3c1a69e13)]:
  - @features/flow-pay-card-assets@0.6.0-next.0
  - @features/flow-pay-card-details@0.10.0-next.0
  - @domain/api-card-management@0.8.4-next.0
  - @features/flow-pay-card-auth@0.11.1-next.0
  - @features/flow-pay-card-transactions@0.7.1-next.0
  - @features/flow-pay-card-widget@0.6.2-next.0

## 0.7.2

### Patch Changes

- Updated dependencies [[`25baf72`](https://github.com/LedgerHQ/ledger-live/commit/25baf72ba4d19425dae6973af5438040e453c234), [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065), [`4216add`](https://github.com/LedgerHQ/ledger-live/commit/4216addd84f49f073e5bd7c0ae7019f40799955f), [`00badce`](https://github.com/LedgerHQ/ledger-live/commit/00badce303d15692c8ff9a91658803da1253af0c), [`6c1779a`](https://github.com/LedgerHQ/ledger-live/commit/6c1779af32758f7d6542032888be19c6aa740d59)]:
  - @features/platform-pay-analytics@0.4.0
  - @features/flow-pay-card-details@0.9.0
  - @features/flow-pay-card-auth@0.11.0
  - @features/flow-pay-card-transactions@0.7.0
  - @features/flow-pay-card-assets@0.5.0
  - @features/flow-pay-card-widget@0.6.1
  - @shared/i18n@0.2.0
  - @domain/api-card-management@0.8.3

## 0.7.2-next.0

### Patch Changes

- Updated dependencies [[`25baf72`](https://github.com/LedgerHQ/ledger-live/commit/25baf72ba4d19425dae6973af5438040e453c234), [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065), [`4216add`](https://github.com/LedgerHQ/ledger-live/commit/4216addd84f49f073e5bd7c0ae7019f40799955f), [`00badce`](https://github.com/LedgerHQ/ledger-live/commit/00badce303d15692c8ff9a91658803da1253af0c), [`6c1779a`](https://github.com/LedgerHQ/ledger-live/commit/6c1779af32758f7d6542032888be19c6aa740d59)]:
  - @features/platform-pay-analytics@0.4.0-next.0
  - @features/flow-pay-card-details@0.9.0-next.0
  - @features/flow-pay-card-auth@0.11.0-next.0
  - @features/flow-pay-card-transactions@0.7.0-next.0
  - @features/flow-pay-card-assets@0.5.0-next.0
  - @features/flow-pay-card-widget@0.6.1-next.0
  - @shared/i18n@0.2.0
  - @domain/api-card-management@0.8.3-next.0

## 0.7.1

### Patch Changes

- Updated dependencies [[`722c6f3`](https://github.com/LedgerHQ/ledger-live/commit/722c6f312e9fd8c33c932ef2f4df15d9062ade31), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`2e198e2`](https://github.com/LedgerHQ/ledger-live/commit/2e198e2394723873a79e56635cfe21a2ab763454), [`3fadda7`](https://github.com/LedgerHQ/ledger-live/commit/3fadda73d3131279b8a318cf15a29778f62d15cd)]:
  - @features/flow-pay-card-details@0.8.0
  - @features/flow-pay-card-assets@0.4.0
  - @features/flow-pay-card-transactions@0.6.0
  - @features/flow-pay-card-widget@0.6.0
  - @features/flow-pay-card-auth@0.10.1
  - @domain/api-card-management@0.8.2

## 0.7.1-next.0

### Patch Changes

- Updated dependencies [[`722c6f3`](https://github.com/LedgerHQ/ledger-live/commit/722c6f312e9fd8c33c932ef2f4df15d9062ade31), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`2e198e2`](https://github.com/LedgerHQ/ledger-live/commit/2e198e2394723873a79e56635cfe21a2ab763454), [`3fadda7`](https://github.com/LedgerHQ/ledger-live/commit/3fadda73d3131279b8a318cf15a29778f62d15cd)]:
  - @features/flow-pay-card-details@0.8.0-next.0
  - @features/flow-pay-card-assets@0.4.0-next.0
  - @features/flow-pay-card-transactions@0.6.0-next.0
  - @features/flow-pay-card-widget@0.6.0-next.0
  - @features/flow-pay-card-auth@0.10.1-next.0
  - @domain/api-card-management@0.8.2-next.0

## 0.7.0

### Minor Changes

- [#22869](https://github.com/LedgerHQ/ledger-live/pull/22869) [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add feature-flag scenarios for the native Pay card, Card live app login, and CL Card disclaimer

### Patch Changes

- Updated dependencies [[`20bf9b0`](https://github.com/LedgerHQ/ledger-live/commit/20bf9b0c8694e9a3c873da1e81fd6b310410205c), [`e7996b4`](https://github.com/LedgerHQ/ledger-live/commit/e7996b4bb9f13726af09cc5202d26d1e471563ef), [`77e7162`](https://github.com/LedgerHQ/ledger-live/commit/77e716257785645b79027b580fcef2dfbab7ad3b), [`57921f9`](https://github.com/LedgerHQ/ledger-live/commit/57921f955b6c07389cb78d4c087c881667858dc2), [`0e7d80a`](https://github.com/LedgerHQ/ledger-live/commit/0e7d80ad750683fd37a150fe36ef5add632072cd), [`5f7cc73`](https://github.com/LedgerHQ/ledger-live/commit/5f7cc73ec88df6e84e970818668adca6cf7e5fe2), [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53), [`b2792d8`](https://github.com/LedgerHQ/ledger-live/commit/b2792d8806411c2a35e1622109bee830c44a6cbc), [`bed3cf9`](https://github.com/LedgerHQ/ledger-live/commit/bed3cf9bd880e00d51fc90849dca3741b9ab779f)]:
  - @features/flow-pay-card-transactions@0.5.0
  - @features/flow-pay-card-auth@0.10.0
  - @features/flow-pay-card-details@0.7.0
  - @features/flow-pay-card-assets@0.3.1
  - @domain/api-card-management@0.8.1
  - @shared/i18n@0.2.0
  - @features/flow-pay-card-widget@0.5.1
  - @features/platform-pay-analytics@0.3.0

## 0.7.0-next.0

### Minor Changes

- [#22869](https://github.com/LedgerHQ/ledger-live/pull/22869) [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add feature-flag scenarios for the native Pay card, Card live app login, and CL Card disclaimer

### Patch Changes

- Updated dependencies [[`20bf9b0`](https://github.com/LedgerHQ/ledger-live/commit/20bf9b0c8694e9a3c873da1e81fd6b310410205c), [`e7996b4`](https://github.com/LedgerHQ/ledger-live/commit/e7996b4bb9f13726af09cc5202d26d1e471563ef), [`77e7162`](https://github.com/LedgerHQ/ledger-live/commit/77e716257785645b79027b580fcef2dfbab7ad3b), [`57921f9`](https://github.com/LedgerHQ/ledger-live/commit/57921f955b6c07389cb78d4c087c881667858dc2), [`0e7d80a`](https://github.com/LedgerHQ/ledger-live/commit/0e7d80ad750683fd37a150fe36ef5add632072cd), [`5f7cc73`](https://github.com/LedgerHQ/ledger-live/commit/5f7cc73ec88df6e84e970818668adca6cf7e5fe2), [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53), [`b2792d8`](https://github.com/LedgerHQ/ledger-live/commit/b2792d8806411c2a35e1622109bee830c44a6cbc), [`bed3cf9`](https://github.com/LedgerHQ/ledger-live/commit/bed3cf9bd880e00d51fc90849dca3741b9ab779f)]:
  - @features/flow-pay-card-transactions@0.5.0-next.0
  - @features/flow-pay-card-auth@0.10.0-next.0
  - @features/flow-pay-card-details@0.7.0-next.0
  - @features/flow-pay-card-assets@0.3.1-next.0
  - @domain/api-card-management@0.8.1-next.0
  - @shared/i18n@0.2.0
  - @features/flow-pay-card-widget@0.5.1-next.0
  - @features/platform-pay-analytics@0.3.0

## 0.6.0

### Minor Changes

- [#22666](https://github.com/LedgerHQ/ledger-live/pull/22666) [`bc28500`](https://github.com/LedgerHQ/ledger-live/commit/bc2850004d7cbc59aac8093b3739bfcc351daf43) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Open card details when the Pay card face is tapped, and replace Top up with Choose card type while that onboarding step is current

- [#22321](https://github.com/LedgerHQ/ledger-live/pull/22321) [`83fac3e`](https://github.com/LedgerHQ/ledger-live/commit/83fac3e00782840d1f118180dfb9afb9a484952c) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Read the Pay Card transaction history one page at a time.

  - `getCardTransactions` is an infinite query; `useGetCardTransactionsQuery` becomes `useGetCardTransactionsInfiniteQuery`.
  - `page` moves off the filters onto the query's page param, so `PayCardTransactionsRequest` is filters only.
  - The provider answers a page past the end with an empty array, so an empty page ends the reading. No page size is documented, so a short page is read past at the cost of one further request.
  - A failure over pages already read no longer blanks the list — a later page or a failed refresh alike. Such a failure is not announced anywhere yet.
  - `useCardTransactionsViewModel` exposes `loadMore` and `isLoadingMore`; no surface calls them yet.
  - The joined list is ordered by `dateTime`, newest first, with repeats dropped, because a charge landing between two reads shifts the paging. The ordering applies to callers that only ever read one page.
  - `toPayGlobalProperties` takes `hasCardTransactions: boolean` in place of the transaction list, so analytics reads the first page through `hasCardTransactions` rather than joining the cached history on every `track()`.
  - `loadMore` is not offered once a read has failed, so a scroll-driven caller cannot turn one failure into a request loop.
  - The MSW mock pages, and its page size drops from the 10 #22236 sliced at to 6 — 10 exceeded the eight-charge fixture, so that mock never paged.

- [#22577](https://github.com/LedgerHQ/ledger-live/pull/22577) [`b6a9b53`](https://github.com/LedgerHQ/ledger-live/commit/b6a9b531267360fdca64b8db22dd8781aa414dd9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix Pay analytics events that never reached Segment, and align the feature-intro page names.

  Pay tracking no longer travels through a React context: `@features/platform-pay-analytics` exposes
  module-level trackers built on `@shared/analytics`, and every Pay flow imports the one it needs.
  The provider could not be reached from inside `@gorhom/bottom-sheet` portals on mobile, so the card
  details sheet and the reward-currencies CTA silently dropped their events. The `onTrackEvent` prop
  is gone from every Pay flow package and from both host apps.

  Card milestone events are now planned from a first-read baseline, so they no longer replay on each
  login. Feature-intro pages report as `Page Feature Intro <flow>`, and the bank transfer flow is
  named `Cash to stable` instead of `C2S`.

- [#22546](https://github.com/LedgerHQ/ledger-live/pull/22546) [`defb949`](https://github.com/LedgerHQ/ledger-live/commit/defb949c02d9d0d935882eb8e8617d000e18b163) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - fix(pay-card): keep the card visible, with a loading balance, while the session resolves

- [#22442](https://github.com/LedgerHQ/ledger-live/pull/22442) [`70d0b90`](https://github.com/LedgerHQ/ledger-live/commit/70d0b90b67ff013f19318378c78a3f3d442f773b) Thanks [@tonykhaov](https://github.com/tonykhaov)! - fix(pay-card): keep lifecycle tracking waiting on onboarding refetches

  `useCardOnboardingStatus` now reports `isFetching` next to `isLoading`, which covers the first
  read only. The lifecycle tracking and the Pay Card devtool read it, so a milestone is no longer
  derived from onboarding signals that a refetch is about to replace.

- [#22446](https://github.com/LedgerHQ/ledger-live/pull/22446) [`3d41eab`](https://github.com/LedgerHQ/ledger-live/commit/3d41eab30728e94a21c53d4d4d9fe6eec27a5ce1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Open the hosted cashback page from the Pay card reward banner

- [#22353](https://github.com/LedgerHQ/ledger-live/pull/22353) [`ae229f2`](https://github.com/LedgerHQ/ledger-live/commit/ae229f27b250d6bdd06af1b06a2912a8c556a27c) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Show a counter-value on the card rewards banner.

  - The reward wallet now carries the currency it is denominated in, like a linked wallet does.
  - The banner prices it with the host's rates and leads with the counter-value.
  - The amount is formatted as a token, not as fiat.
  - A reward nothing can price shows the asset amount alone.
  - `priceWallet` is renamed `getCounterValue`: it converts an amount, it does not price a wallet.

- [#22358](https://github.com/LedgerHQ/ledger-live/pull/22358) [`973a613`](https://github.com/LedgerHQ/ledger-live/commit/973a6136087e8e78eeffd0e761ed3828f9f81691) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a Pay disclaimer at the bottom of the desktop Card panel and the mobile Pay tab.

- [#22440](https://github.com/LedgerHQ/ledger-live/pull/22440) [`a39ba90`](https://github.com/LedgerHQ/ledger-live/commit/a39ba900d889155ebc4fe2cab88f82a715e3f605) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix remaining Pay Mixpanel events and user properties from the tracking plan

- [#22889](https://github.com/LedgerHQ/ledger-live/pull/22889) [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add feature-flag scenarios for the native Pay card, Card live app login, and CL Card disclaimer

- [#22402](https://github.com/LedgerHQ/ledger-live/pull/22402) [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Polish the Pay tab: keep the last row of every Pay bottom sheet clear of the Android navigation bar and the iOS home indicator, size the card action buttons to `md`, make the desktop contacts table responsive with a wider name column, wrap the address-picker title, add 32px of scroll padding, widen the history tabs, fix the disclaimer copy and use the shield icon on verify address

- [#22549](https://github.com/LedgerHQ/ledger-live/pull/22549) [`24e881b`](https://github.com/LedgerHQ/ledger-live/commit/24e881b41d4199d9cf257a7450d139aa5f076a1d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Hide Pay and card history amounts when discreet mode is enabled, and toggle it from the Pay balance

- [#22562](https://github.com/LedgerHQ/ledger-live/pull/22562) [`b8a4056`](https://github.com/LedgerHQ/ledger-live/commit/b8a405658b70b0ca43ec94bff53c5d13e2c16487) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Keep re-reading the Pay Card status after the holder returns from Apple or Google Wallet, and when the app comes back to the foreground

### Patch Changes

- Updated dependencies [[`b42673e`](https://github.com/LedgerHQ/ledger-live/commit/b42673eed68aba6b2885486d7294f5f9163f721d), [`6a5972d`](https://github.com/LedgerHQ/ledger-live/commit/6a5972df49e243bbb36cd973e405302d0d8925bc), [`3e7bbe9`](https://github.com/LedgerHQ/ledger-live/commit/3e7bbe93f6075a2a6783e05d36459c166366c910), [`c32cde3`](https://github.com/LedgerHQ/ledger-live/commit/c32cde31461523c72df4f67cd18288c6f65c9951), [`ad2f1de`](https://github.com/LedgerHQ/ledger-live/commit/ad2f1deb73d1fd6fed1383133a7f2b259630cd06), [`cee85b4`](https://github.com/LedgerHQ/ledger-live/commit/cee85b47d7d1f414e23935e77c9ad22d98ddf994), [`6baab2e`](https://github.com/LedgerHQ/ledger-live/commit/6baab2e7989b00bec4c361cee3535f76cb919915), [`cfb7566`](https://github.com/LedgerHQ/ledger-live/commit/cfb756682290e9940d65f3b6417d6b111449e546), [`bc28500`](https://github.com/LedgerHQ/ledger-live/commit/bc2850004d7cbc59aac8093b3739bfcc351daf43), [`4d84f2b`](https://github.com/LedgerHQ/ledger-live/commit/4d84f2b23f3bc04c06770e390e22cd4e35ee3fe3), [`d6866e7`](https://github.com/LedgerHQ/ledger-live/commit/d6866e7dc7ced8898ac585d4e34d9667d9ad7f17), [`83fac3e`](https://github.com/LedgerHQ/ledger-live/commit/83fac3e00782840d1f118180dfb9afb9a484952c), [`b6a9b53`](https://github.com/LedgerHQ/ledger-live/commit/b6a9b531267360fdca64b8db22dd8781aa414dd9), [`68f4179`](https://github.com/LedgerHQ/ledger-live/commit/68f41798cae68cd1b91f291d5447514b80fd6f49), [`8ecbe06`](https://github.com/LedgerHQ/ledger-live/commit/8ecbe0676b614fed535900aa6085ddebabc8d85c), [`46f0f94`](https://github.com/LedgerHQ/ledger-live/commit/46f0f9447e12faa953268bf2a19fbdfd85a43da9), [`ea90542`](https://github.com/LedgerHQ/ledger-live/commit/ea90542540f47a76c18cf5f440bb98b9be71c837), [`e8518d7`](https://github.com/LedgerHQ/ledger-live/commit/e8518d7f0b88096552c6a8f74ffe5752bc517a39), [`56640ba`](https://github.com/LedgerHQ/ledger-live/commit/56640ba2c03cec8555f7452da785c8dd949ec010), [`5ff6348`](https://github.com/LedgerHQ/ledger-live/commit/5ff6348d1505e805bdbbff64685b0b97bc2a8981), [`912b087`](https://github.com/LedgerHQ/ledger-live/commit/912b0877538bd06cc7187b90e2eab8182fe55034), [`defb949`](https://github.com/LedgerHQ/ledger-live/commit/defb949c02d9d0d935882eb8e8617d000e18b163), [`70d0b90`](https://github.com/LedgerHQ/ledger-live/commit/70d0b90b67ff013f19318378c78a3f3d442f773b), [`887561b`](https://github.com/LedgerHQ/ledger-live/commit/887561bb56c7bbe4c5ff3d62a3309ce3d449a72c), [`aee5fe8`](https://github.com/LedgerHQ/ledger-live/commit/aee5fe897519c1bc39f0d4891bbc1ee4a7aaaaa1), [`3d41eab`](https://github.com/LedgerHQ/ledger-live/commit/3d41eab30728e94a21c53d4d4d9fe6eec27a5ce1), [`ae229f2`](https://github.com/LedgerHQ/ledger-live/commit/ae229f27b250d6bdd06af1b06a2912a8c556a27c), [`3fdebf4`](https://github.com/LedgerHQ/ledger-live/commit/3fdebf4a84f5630192e50aef9a0a60b0c56f6a2f), [`a39ba90`](https://github.com/LedgerHQ/ledger-live/commit/a39ba900d889155ebc4fe2cab88f82a715e3f605), [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21), [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383), [`24e881b`](https://github.com/LedgerHQ/ledger-live/commit/24e881b41d4199d9cf257a7450d139aa5f076a1d), [`8947c0b`](https://github.com/LedgerHQ/ledger-live/commit/8947c0b97fa0d5abd017d880bfc3089a74d9cc77), [`b8a4056`](https://github.com/LedgerHQ/ledger-live/commit/b8a405658b70b0ca43ec94bff53c5d13e2c16487), [`b4a23ea`](https://github.com/LedgerHQ/ledger-live/commit/b4a23ea27edbc4a3e8aeaee1da6f0e7aecefab92), [`c020110`](https://github.com/LedgerHQ/ledger-live/commit/c02011033bf5ca5bf38f05c487adb3a27c209a7d), [`c119e0d`](https://github.com/LedgerHQ/ledger-live/commit/c119e0d38f626314cf679bfa06420ce0e4bca03b), [`e19e6cf`](https://github.com/LedgerHQ/ledger-live/commit/e19e6cf36074363d22085b6c85c54ef964eb382c), [`df5d8c9`](https://github.com/LedgerHQ/ledger-live/commit/df5d8c96892094fc6faf06992f415e88ff64b5c8), [`f7ba21f`](https://github.com/LedgerHQ/ledger-live/commit/f7ba21f7df883e71102a0949c8a3d23e20fb4cbd)]:
  - @domain/api-card-management@0.8.0
  - @features/flow-pay-card-details@0.6.0
  - @features/platform-pay-analytics@0.3.0
  - @features/flow-pay-card-assets@0.3.0
  - @features/flow-pay-card-transactions@0.4.0
  - @features/flow-pay-card-auth@0.9.0
  - @features/flow-pay-card-widget@0.5.0

## 0.6.0-next.4

### Patch Changes

- Updated dependencies [[`5ff6348`](https://github.com/LedgerHQ/ledger-live/commit/5ff6348d1505e805bdbbff64685b0b97bc2a8981)]:
  - @features/flow-pay-card-auth@0.9.0-next.3
  - @features/flow-pay-card-assets@0.3.0-next.4
  - @features/flow-pay-card-details@0.6.0-next.4
  - @features/flow-pay-card-transactions@0.4.0-next.4

## 0.6.0-next.3

### Minor Changes

- [#22889](https://github.com/LedgerHQ/ledger-live/pull/22889) [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add feature-flag scenarios for the native Pay card, Card live app login, and CL Card disclaimer

### Patch Changes

- Updated dependencies [[`56640ba`](https://github.com/LedgerHQ/ledger-live/commit/56640ba2c03cec8555f7452da785c8dd949ec010), [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21)]:
  - @features/flow-pay-card-auth@0.9.0-next.2
  - @features/flow-pay-card-assets@0.3.0-next.3
  - @features/flow-pay-card-details@0.6.0-next.3
  - @features/flow-pay-card-transactions@0.4.0-next.3

## 0.6.0-next.2

### Patch Changes

- Updated dependencies [[`cee85b4`](https://github.com/LedgerHQ/ledger-live/commit/cee85b47d7d1f414e23935e77c9ad22d98ddf994)]:
  - @features/flow-pay-card-auth@0.9.0-next.1
  - @features/flow-pay-card-assets@0.3.0-next.2
  - @features/flow-pay-card-details@0.6.0-next.2
  - @features/flow-pay-card-transactions@0.4.0-next.2

## 0.6.0-next.1

### Patch Changes

- Updated dependencies [[`8947c0b`](https://github.com/LedgerHQ/ledger-live/commit/8947c0b97fa0d5abd017d880bfc3089a74d9cc77)]:
  - @features/flow-pay-card-transactions@0.4.0-next.1
  - @features/flow-pay-card-details@0.6.0-next.1
  - @features/flow-pay-card-assets@0.3.0-next.1

## 0.6.0-next.0

### Minor Changes

- [#22666](https://github.com/LedgerHQ/ledger-live/pull/22666) [`bc28500`](https://github.com/LedgerHQ/ledger-live/commit/bc2850004d7cbc59aac8093b3739bfcc351daf43) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Open card details when the Pay card face is tapped, and replace Top up with Choose card type while that onboarding step is current

- [#22321](https://github.com/LedgerHQ/ledger-live/pull/22321) [`83fac3e`](https://github.com/LedgerHQ/ledger-live/commit/83fac3e00782840d1f118180dfb9afb9a484952c) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Read the Pay Card transaction history one page at a time.

  - `getCardTransactions` is an infinite query; `useGetCardTransactionsQuery` becomes `useGetCardTransactionsInfiniteQuery`.
  - `page` moves off the filters onto the query's page param, so `PayCardTransactionsRequest` is filters only.
  - The provider answers a page past the end with an empty array, so an empty page ends the reading. No page size is documented, so a short page is read past at the cost of one further request.
  - A failure over pages already read no longer blanks the list — a later page or a failed refresh alike. Such a failure is not announced anywhere yet.
  - `useCardTransactionsViewModel` exposes `loadMore` and `isLoadingMore`; no surface calls them yet.
  - The joined list is ordered by `dateTime`, newest first, with repeats dropped, because a charge landing between two reads shifts the paging. The ordering applies to callers that only ever read one page.
  - `toPayGlobalProperties` takes `hasCardTransactions: boolean` in place of the transaction list, so analytics reads the first page through `hasCardTransactions` rather than joining the cached history on every `track()`.
  - `loadMore` is not offered once a read has failed, so a scroll-driven caller cannot turn one failure into a request loop.
  - The MSW mock pages, and its page size drops from the 10 #22236 sliced at to 6 — 10 exceeded the eight-charge fixture, so that mock never paged.

- [#22577](https://github.com/LedgerHQ/ledger-live/pull/22577) [`b6a9b53`](https://github.com/LedgerHQ/ledger-live/commit/b6a9b531267360fdca64b8db22dd8781aa414dd9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix Pay analytics events that never reached Segment, and align the feature-intro page names.

  Pay tracking no longer travels through a React context: `@features/platform-pay-analytics` exposes
  module-level trackers built on `@shared/analytics`, and every Pay flow imports the one it needs.
  The provider could not be reached from inside `@gorhom/bottom-sheet` portals on mobile, so the card
  details sheet and the reward-currencies CTA silently dropped their events. The `onTrackEvent` prop
  is gone from every Pay flow package and from both host apps.

  Card milestone events are now planned from a first-read baseline, so they no longer replay on each
  login. Feature-intro pages report as `Page Feature Intro <flow>`, and the bank transfer flow is
  named `Cash to stable` instead of `C2S`.

- [#22546](https://github.com/LedgerHQ/ledger-live/pull/22546) [`defb949`](https://github.com/LedgerHQ/ledger-live/commit/defb949c02d9d0d935882eb8e8617d000e18b163) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - fix(pay-card): keep the card visible, with a loading balance, while the session resolves

- [#22442](https://github.com/LedgerHQ/ledger-live/pull/22442) [`70d0b90`](https://github.com/LedgerHQ/ledger-live/commit/70d0b90b67ff013f19318378c78a3f3d442f773b) Thanks [@tonykhaov](https://github.com/tonykhaov)! - fix(pay-card): keep lifecycle tracking waiting on onboarding refetches

  `useCardOnboardingStatus` now reports `isFetching` next to `isLoading`, which covers the first
  read only. The lifecycle tracking and the Pay Card devtool read it, so a milestone is no longer
  derived from onboarding signals that a refetch is about to replace.

- [#22446](https://github.com/LedgerHQ/ledger-live/pull/22446) [`3d41eab`](https://github.com/LedgerHQ/ledger-live/commit/3d41eab30728e94a21c53d4d4d9fe6eec27a5ce1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Open the hosted cashback page from the Pay card reward banner

- [#22353](https://github.com/LedgerHQ/ledger-live/pull/22353) [`ae229f2`](https://github.com/LedgerHQ/ledger-live/commit/ae229f27b250d6bdd06af1b06a2912a8c556a27c) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Show a counter-value on the card rewards banner.

  - The reward wallet now carries the currency it is denominated in, like a linked wallet does.
  - The banner prices it with the host's rates and leads with the counter-value.
  - The amount is formatted as a token, not as fiat.
  - A reward nothing can price shows the asset amount alone.
  - `priceWallet` is renamed `getCounterValue`: it converts an amount, it does not price a wallet.

- [#22358](https://github.com/LedgerHQ/ledger-live/pull/22358) [`973a613`](https://github.com/LedgerHQ/ledger-live/commit/973a6136087e8e78eeffd0e761ed3828f9f81691) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a Pay disclaimer at the bottom of the desktop Card panel and the mobile Pay tab.

- [#22440](https://github.com/LedgerHQ/ledger-live/pull/22440) [`a39ba90`](https://github.com/LedgerHQ/ledger-live/commit/a39ba900d889155ebc4fe2cab88f82a715e3f605) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix remaining Pay Mixpanel events and user properties from the tracking plan

- [#22402](https://github.com/LedgerHQ/ledger-live/pull/22402) [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Polish the Pay tab: keep the last row of every Pay bottom sheet clear of the Android navigation bar and the iOS home indicator, size the card action buttons to `md`, make the desktop contacts table responsive with a wider name column, wrap the address-picker title, add 32px of scroll padding, widen the history tabs, fix the disclaimer copy and use the shield icon on verify address

- [#22549](https://github.com/LedgerHQ/ledger-live/pull/22549) [`24e881b`](https://github.com/LedgerHQ/ledger-live/commit/24e881b41d4199d9cf257a7450d139aa5f076a1d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Hide Pay and card history amounts when discreet mode is enabled, and toggle it from the Pay balance

- [#22562](https://github.com/LedgerHQ/ledger-live/pull/22562) [`b8a4056`](https://github.com/LedgerHQ/ledger-live/commit/b8a405658b70b0ca43ec94bff53c5d13e2c16487) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Keep re-reading the Pay Card status after the holder returns from Apple or Google Wallet, and when the app comes back to the foreground

### Patch Changes

- Updated dependencies [[`b42673e`](https://github.com/LedgerHQ/ledger-live/commit/b42673eed68aba6b2885486d7294f5f9163f721d), [`6a5972d`](https://github.com/LedgerHQ/ledger-live/commit/6a5972df49e243bbb36cd973e405302d0d8925bc), [`3e7bbe9`](https://github.com/LedgerHQ/ledger-live/commit/3e7bbe93f6075a2a6783e05d36459c166366c910), [`c32cde3`](https://github.com/LedgerHQ/ledger-live/commit/c32cde31461523c72df4f67cd18288c6f65c9951), [`ad2f1de`](https://github.com/LedgerHQ/ledger-live/commit/ad2f1deb73d1fd6fed1383133a7f2b259630cd06), [`6baab2e`](https://github.com/LedgerHQ/ledger-live/commit/6baab2e7989b00bec4c361cee3535f76cb919915), [`cfb7566`](https://github.com/LedgerHQ/ledger-live/commit/cfb756682290e9940d65f3b6417d6b111449e546), [`bc28500`](https://github.com/LedgerHQ/ledger-live/commit/bc2850004d7cbc59aac8093b3739bfcc351daf43), [`4d84f2b`](https://github.com/LedgerHQ/ledger-live/commit/4d84f2b23f3bc04c06770e390e22cd4e35ee3fe3), [`d6866e7`](https://github.com/LedgerHQ/ledger-live/commit/d6866e7dc7ced8898ac585d4e34d9667d9ad7f17), [`83fac3e`](https://github.com/LedgerHQ/ledger-live/commit/83fac3e00782840d1f118180dfb9afb9a484952c), [`b6a9b53`](https://github.com/LedgerHQ/ledger-live/commit/b6a9b531267360fdca64b8db22dd8781aa414dd9), [`68f4179`](https://github.com/LedgerHQ/ledger-live/commit/68f41798cae68cd1b91f291d5447514b80fd6f49), [`8ecbe06`](https://github.com/LedgerHQ/ledger-live/commit/8ecbe0676b614fed535900aa6085ddebabc8d85c), [`46f0f94`](https://github.com/LedgerHQ/ledger-live/commit/46f0f9447e12faa953268bf2a19fbdfd85a43da9), [`ea90542`](https://github.com/LedgerHQ/ledger-live/commit/ea90542540f47a76c18cf5f440bb98b9be71c837), [`e8518d7`](https://github.com/LedgerHQ/ledger-live/commit/e8518d7f0b88096552c6a8f74ffe5752bc517a39), [`912b087`](https://github.com/LedgerHQ/ledger-live/commit/912b0877538bd06cc7187b90e2eab8182fe55034), [`defb949`](https://github.com/LedgerHQ/ledger-live/commit/defb949c02d9d0d935882eb8e8617d000e18b163), [`70d0b90`](https://github.com/LedgerHQ/ledger-live/commit/70d0b90b67ff013f19318378c78a3f3d442f773b), [`887561b`](https://github.com/LedgerHQ/ledger-live/commit/887561bb56c7bbe4c5ff3d62a3309ce3d449a72c), [`aee5fe8`](https://github.com/LedgerHQ/ledger-live/commit/aee5fe897519c1bc39f0d4891bbc1ee4a7aaaaa1), [`3d41eab`](https://github.com/LedgerHQ/ledger-live/commit/3d41eab30728e94a21c53d4d4d9fe6eec27a5ce1), [`ae229f2`](https://github.com/LedgerHQ/ledger-live/commit/ae229f27b250d6bdd06af1b06a2912a8c556a27c), [`3fdebf4`](https://github.com/LedgerHQ/ledger-live/commit/3fdebf4a84f5630192e50aef9a0a60b0c56f6a2f), [`a39ba90`](https://github.com/LedgerHQ/ledger-live/commit/a39ba900d889155ebc4fe2cab88f82a715e3f605), [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383), [`24e881b`](https://github.com/LedgerHQ/ledger-live/commit/24e881b41d4199d9cf257a7450d139aa5f076a1d), [`b8a4056`](https://github.com/LedgerHQ/ledger-live/commit/b8a405658b70b0ca43ec94bff53c5d13e2c16487), [`b4a23ea`](https://github.com/LedgerHQ/ledger-live/commit/b4a23ea27edbc4a3e8aeaee1da6f0e7aecefab92), [`c020110`](https://github.com/LedgerHQ/ledger-live/commit/c02011033bf5ca5bf38f05c487adb3a27c209a7d), [`c119e0d`](https://github.com/LedgerHQ/ledger-live/commit/c119e0d38f626314cf679bfa06420ce0e4bca03b), [`e19e6cf`](https://github.com/LedgerHQ/ledger-live/commit/e19e6cf36074363d22085b6c85c54ef964eb382c), [`df5d8c9`](https://github.com/LedgerHQ/ledger-live/commit/df5d8c96892094fc6faf06992f415e88ff64b5c8), [`f7ba21f`](https://github.com/LedgerHQ/ledger-live/commit/f7ba21f7df883e71102a0949c8a3d23e20fb4cbd)]:
  - @domain/api-card-management@0.8.0-next.0
  - @features/flow-pay-card-details@0.6.0-next.0
  - @features/platform-pay-analytics@0.3.0-next.0
  - @features/flow-pay-card-assets@0.3.0-next.0
  - @features/flow-pay-card-transactions@0.4.0-next.0
  - @features/flow-pay-card-widget@0.5.0-next.0
  - @features/flow-pay-card-auth@0.9.0-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->
