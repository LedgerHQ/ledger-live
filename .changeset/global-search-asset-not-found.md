---
"ledger-live-desktop": patch
---

Fix Global Search navigating to "asset not found" for assets without a market-provider entry (e.g. Canton). The search now forwards the full market currency (with its `ledgerIds`) as navigation state, so the Asset Detail screen can resolve such assets via the DADA fallback — matching the behaviour of the Market table rows and mobile.
