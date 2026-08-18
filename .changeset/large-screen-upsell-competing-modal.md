---
"ledger-live-desktop": patch
"@features/flow-large-screen-upsell": patch
---

Fix Large Screen Upsell competing-modal handling on desktop: do not consume retriesModal when blocked/preempted, rename persisted retries to retriesModal (legacy reset on LWD only), and track modal_blocked.
