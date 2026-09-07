---
"ledger-live-mobile-e2e-tests": patch
---

Wait for the portfolio balance to resolve before reading it (QAA-1523)

`expectTotalBalanceCounterValue` read `portfolio-balance-amount` with no prior
wait. The balance section renders a skeleton in place of that element until the
counter values resolve, so straight after a counter-value change the element does
not exist. `getLabelOfElement` wraps its read in `retryUntilTimeout`, which
retries on throw — so it polled a missing element for 60s and failed with
`❌ [retryUntilTimeout] Timed out after 60000ms`, naming neither the element nor
the reason. 3/5 nightlies on Android.

The assertion now waits for `portfolio-balance-normal`, which the section carries
only once the balance is available, before reading the amount. That puts the
budget on the step that is actually slow and separates "the balance never
resolved" from "it resolved in the wrong currency".
