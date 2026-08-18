---
"live-mobile": minor
---

Replace the useAnalytics hook with the module-level track function

Internal refactor ahead of the analytics package migration. Event property values are unchanged; duplicate `send_modal` "step review device" emissions caused by the hook's route-keyed callback identity no longer fire, so counts for that event may fall slightly.
