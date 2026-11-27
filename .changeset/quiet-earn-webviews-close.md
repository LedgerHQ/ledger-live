---
"@ledgerhq/transaction-observability": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Report Earn live app sign attempts left pending when their webview is torn down as `failure/abandoned` on path `earn`, behind `earnTxLifecycleMonitoring`; each webview only abandons its own attempt, and the mobile Earn tab, which stays mounted, only reports on unmount
