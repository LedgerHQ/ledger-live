---
"@domain/api-card-management": minor
"@features/flow-pay-card-transactions": minor
"@features/platform-pay-analytics": minor
"@features/flow-pay-card-widget": patch
"@features/flow-pay-card": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Read the Pay Card transaction history one page at a time.

- `getCardTransactions` is an infinite query; `useGetCardTransactionsQuery` becomes `useGetCardTransactionsInfiniteQuery`.
- `page` moves off the filters onto the query's page param, so `PayCardTransactionsRequest` is filters only.
- The provider answers a page past the end with an empty array, so an empty page ends the reading. No page size is documented, so a short page is read past at the cost of one further request.
- A failure over pages already read no longer blanks the list — a later page or a failed refresh alike. Such a failure is not announced anywhere yet.
- `useCardTransactionsViewModel` exposes `loadMore` and `isLoadingMore`; no surface calls them yet.
- The joined list is ordered by `dateTime`, newest first, with repeats dropped, because a charge landing between two reads shifts the paging. The ordering applies to callers that only ever read one page.
- `toPayGlobalProperties` takes `hasCardTransactions: boolean` in place of the transaction list, so analytics reads the first page through `hasCardTransactions` rather than joining the cached history on every `track()`.
- `loadMore` is not offered once a read has failed, so a scroll-driven caller cannot turn one failure into a request loop.
- The MSW mock pages, and its page size drops from the 10 #22236 sliced at to 6 — 10 exceeded the eight-charge fixture, so that mock never paged.
