---
"ledger-live-desktop": minor
---

Fix webview NetworkErrorScreen not appearing on the first load by attaching webview event listeners through a callback ref instead of a one-shot mounted latch
