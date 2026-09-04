---
"@devtools/bindings": minor
---

Add Freeze Card and Unfreeze Card to the Card interaction screen.

- Both sit next to Card Status as probes, so one screen drives the card's whole state.
- Freezing and unfreezing invalidate `CardStatus`, so a status already read refreshes itself without a second press.
