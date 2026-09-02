---
"ledger-live-mobile-e2e-tests": patch
---

Wait for the portfolio quick-action row to settle before tapping it (QAA-1524)

`tapById` does not wait, so the quick-action taps were issued as soon as the
portfolio rendered. The row mounts after the portfolio's own data resolves, so on
Android CI the tap could land before it existed — `No views in hierarchy found
matching ... quick-action-buy ... VISIBLE`, 3/5 nightlies.

Each press now waits for the row's own container at 100% visibility, which proves
the row is mounted and laid out. Anchoring the wait rather than lengthening a
timeout or adding a retry, per `e2e/mobile/docs/add-or-update-e2e.md` rules 11 and 12.
