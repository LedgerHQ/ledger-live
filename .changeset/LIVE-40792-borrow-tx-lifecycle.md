---
"@ledgerhq/transaction-observability": minor
"@shared/feature-flags": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Report Borrow transaction attempts left pending when the Borrow screen is torn down to the Borrow lifecycle sink, behind the new `borrowTxLifecycleMonitoring` flag on Desktop and Mobile. Each attempt stays with the product that opened it, so Borrow never closes or reroutes an attempt Earn owns. On Mobile, the device-intent sign drawer now reports a dismissed signature as abandoned, like the legacy sign flow.
