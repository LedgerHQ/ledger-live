---
"ledger-live-mobile-e2e-tests": patch
---

Wait for the transfer bottom sheet to settle before tapping it (QAA-1522)

`tapById` does not wait, and `openReceiveDrawer` tapped the sheet's receive button
immediately after asking the sheet to open. `toBeVisible()` is satisfied at 75%,
which a bottom sheet meets while still sliding, so on Android CI the tap landed
either on a moving view — Espresso refusing the action with `target view does not
match one or more of the following constraints` — or before the button had
mounted at all. 3/5 nightlies, still failing in the latest.

Each of the three sheet taps now waits for the sheet's own container
(`transfer-drawer`) at 100% visibility, per `e2e/mobile/docs/add-or-update-e2e.md` rules 11
and 12: anchor on the state that proves the sheet is at rest rather than adding a
retry or lengthening a timeout.
