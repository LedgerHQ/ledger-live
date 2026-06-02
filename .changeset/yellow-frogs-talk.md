---
"live-mobile": patch
---

Fix: prevent duplicate transaction broadcast on device action re-render, protecting all chains (including Tron) from double-submission via a mount-once guard
