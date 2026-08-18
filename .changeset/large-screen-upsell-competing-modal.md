---
"ledger-live-desktop": minor
"@features/flow-large-screen-upsell": minor
---

Fix Large Screen Upsell competing-modal handling on desktop: do not consume retriesModal when blocked/preempted, rename persisted retries to retriesModal (legacy reset on LWD only), and track modal_blocked.
