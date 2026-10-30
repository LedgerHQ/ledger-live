---
"ledger-live-desktop": minor
"@features/flow-account-detail-hero": minor
---

LWD Account Detail shows the swap console in the right panel, prefilled with the account. It is gated by the `accountDetail` flag (not the swap-console A/B test) and hidden when the currency is unsupported or no asset of the account can be swapped. `resolveSwapConsole` only needs the currency support and swap availability.
