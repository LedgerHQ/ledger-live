---
"ledger-live-desktop": patch
"live-mobile": patch
---

Fix minor UI issues on the Swap transaction status dialog on Desktop (canvas-sheet background and spacing below the main button). Forward a `swapId` from the `swapRedirectToHistory` handler to the Swap History screen on both Desktop and Mobile so the transaction status dialog/drawer opens automatically for the matching operation.
