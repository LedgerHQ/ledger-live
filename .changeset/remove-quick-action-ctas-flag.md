---
"@shared/feature-flags": patch
"@features/platform-feature-flags": patch
"ledger-live-desktop": patch
---

Remove the `quickActionCtas` sub-flag of `lwdWallet40` (always enabled) and inline the enabled behavior: QuickActions are now always shown in the Portfolio and the legacy send/receive/exchange sidebar entries are removed
