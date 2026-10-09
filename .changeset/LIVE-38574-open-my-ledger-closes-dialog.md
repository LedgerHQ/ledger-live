---
"ledger-live-desktop": patch
---

Close the perps sign dialogs when "Open My Ledger" is clicked from the firmware update, app update or outdated app screens. My Ledger opened behind the dialog, which stayed on top; device action error screens now pass `onOpenManager` so hosts the button cannot close themselves can close on navigation
