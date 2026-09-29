# @features/platform-pay-analytics

## 0.3.0-next.0

### Minor Changes

- [#22404](https://github.com/LedgerHQ/ledger-live/pull/22404) [`b42673e`](https://github.com/LedgerHQ/ledger-live/commit/b42673eed68aba6b2885486d7294f5f9163f721d) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Read the card cashback banner from `GET /v1/card/cashback`

  - Add `getCardCashback` endpoint, resolving the asset's `currency`/`network` pair (both nullable) to its `ledgerId`
  - Remove `getRewardWallet` (`GET /v1/wallet/reward`), its schema, types, mock and handlers
  - `useCardCashback` replaces `useCardRewardWallet` in the reward banner
  - Banner subtitle now shows the rate and ticker: "Total cashback · 1% in BTC"
  - `cardRewardsAvailable` / `cardRewardCurrency` analytics now read the cashback (amount > 0)

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

- [#22440](https://github.com/LedgerHQ/ledger-live/pull/22440) [`a39ba90`](https://github.com/LedgerHQ/ledger-live/commit/a39ba900d889155ebc4fe2cab88f82a715e3f605) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix remaining Pay Mixpanel events and user properties from the tracking plan

### Patch Changes

- Updated dependencies [[`1302bc7`](https://github.com/LedgerHQ/ledger-live/commit/1302bc7968a7d3bf9cd3d556057b662444b22608), [`3fdfcc0`](https://github.com/LedgerHQ/ledger-live/commit/3fdfcc07ffb1d8e0b5ef39c830a5e7204ced77e3), [`93e6db2`](https://github.com/LedgerHQ/ledger-live/commit/93e6db2db85721b483173e781db9f53db3699715), [`8a305ed`](https://github.com/LedgerHQ/ledger-live/commit/8a305edb307d0a4cd30ad615ccd98ef5d7caf523)]:
  - @shared/analytics@0.4.0-next.0
  - @shared/analytics-react@0.4.0-next.0

## 0.2.0

### Minor Changes

- [#22300](https://github.com/LedgerHQ/ledger-live/pull/22300) [`d0fd787`](https://github.com/LedgerHQ/ledger-live/commit/d0fd787fb0e40b35f9d9c70307694d364f99b858) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Implement the Pay analytics helper, context, and property mappers.

- [#22307](https://github.com/LedgerHQ/ledger-live/pull/22307) [`b97a3e5`](https://github.com/LedgerHQ/ledger-live/commit/b97a3e5462588d771a2ea5d628cfef7d564bc886) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the `@features/platform-pay-analytics` package shell.

## 0.2.0-next.0

### Minor Changes

- [#22300](https://github.com/LedgerHQ/ledger-live/pull/22300) [`d0fd787`](https://github.com/LedgerHQ/ledger-live/commit/d0fd787fb0e40b35f9d9c70307694d364f99b858) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Implement the Pay analytics helper, context, and property mappers.

- [#22307](https://github.com/LedgerHQ/ledger-live/pull/22307) [`b97a3e5`](https://github.com/LedgerHQ/ledger-live/commit/b97a3e5462588d771a2ea5d628cfef7d564bc886) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the `@features/platform-pay-analytics` package shell.
