---
"ledger-live-desktop": patch
---

Fix the QR Code Camera Picker fallback mode to properly display in dark mode context. Also add a 20s timeout in specific cases where OS would "never end" instead of failing the getUserMedia call.
