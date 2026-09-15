---
"ledger-live-mobile-e2e-tests": patch
---

Scroll the portfolio hero back into view before asserting on it (QAA-1571)

Android detaches off-screen FlatList rows from the native view hierarchy, so once
the portfolio list is scrolled past its first row the balance and the quick-action
CTAs are absent rather than under-visible, and no wait recovers them. The nightly
hierarchy dumps show the list arriving ~1194px down — the exact height of that row
— with `market-banner-container` as the first attached child at y=54 instead of
y=1248, which is why `quick-actions-ctas` and `portfolio-balance-normal` timed out
on Android while iOS stayed green.

Every portfolio accessor that targets the balance or the quick actions now scrolls
the list up to its own target first, via `scrollToId(target, list, undefined, "up")`.
Visibility thresholds and timeouts are unchanged. Detox's `scrollTo("top")` is not
usable here: the list's pull-to-refresh control means the action never reports a top
edge and force-breaks its loop.
