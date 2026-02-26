---
"ledger-live-desktop": minor
---

Fix timer leaks (setTimeout/setInterval without cleanup) to prevent Jest worker OOM crashes and graceful exit failures
