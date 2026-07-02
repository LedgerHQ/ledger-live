---
"ledger-live-desktop": minor
---

fix: keep the caret in place when editing the EVM advanced-mode fee inputs (Max Priority Fee / Max Fee). InputCurrency now maps the caret through sanitizeValueString so editing a value already at the unit's max decimals (e.g. 9 Gwei decimals) no longer teleports the cursor to the end.
