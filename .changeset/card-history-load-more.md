---
"@features/flow-pay-card-transactions": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

Let the card transaction history read past its first page.

- Both platforms read on by scrolling: native through the list's `onEndReached`, web through an observer on a sentinel at the end of the table.
- A spinner marks the page in flight; no new copy, so nothing to translate.
- Both take `loadMore`/`isLoadingMore` from the shared view model, so the three-row previews on the Pay surfaces are unaffected.
