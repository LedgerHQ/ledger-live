---
"@ledgerhq/transaction-observability": minor
"@shared/feature-flags": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Report Borrow transaction attempts left pending when the Borrow screen is torn down to the Borrow lifecycle sink, behind the new `borrowTxLifecycleMonitoring` flag on Desktop and Mobile. A manifest claimed by both Earn and Borrow now goes to the first enabled product (Earn) instead of being dropped.
