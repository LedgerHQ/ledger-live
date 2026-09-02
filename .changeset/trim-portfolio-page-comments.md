---
"ledger-live-mobile-e2e-tests": patch
---

Trim the portfolio page object comments to one line each

The two settle helpers carried four comment blocks, 15 lines, restating the root
cause already recorded in the QAA-1522 and QAA-1524 pull requests. Long comments
go stale and the analysis is easier to correct where people look for it.

The two container id fields lose their comments entirely — the field names already
say they are containers. Each settle helper keeps one line, holding only the fact a
future reader needs to not remove the wait, plus its ticket reference.
