---
"ledger-live-desktop": patch
---

Block the Zcash private send recipient step until the shielded sync is complete

The shielded sync banner on the recipient step was purely informational: a private-pool send could
still select an address and advance to amount/signature while the sync was running, ready
(post-export, notes not yet scanned), stopped, or disabled, which risked signing with an incomplete
note set. The recipient notice family slot can now report a blocked state, and generic recipient
code honors it — the step no longer completes, the matched-address and self-transfer actions are
disabled, and forward navigation is refused until the shielded sync reports `complete`.
