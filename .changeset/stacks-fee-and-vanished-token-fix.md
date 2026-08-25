---
"@ledgerhq/coin-stacks": minor
"@ledgerhq/live-common": minor
---

Fix Stacks fee estimation freezing after the first quote instead of re-pricing when the amount, memo, or asset changes. Fix a fully-swept token sub-account (any generic-framework chain, not just Stacks) keeping its pre-sweep balance forever instead of ever reflecting the sweep to zero.
