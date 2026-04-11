---
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

- **Desktop:** Do not auto-open the legacy portfolio analytics opt-in when Wallet V4 is on (consent stays on `/`).
- **Desktop (`AnalyticsConsentDialog`):** Offer the home consent flow when **`hasSeenAnalyticsOptInPrompt` is false**, or when privacy / consent renewal requires it (`analyticsOptIn` on, onboarding complete).
- **Common + desktop + mobile:** On consent renewal, choose **fresh** vs **reconfirm** using **`hasSeenAnalyticsOptInPrompt`**, not analytics sharing state.
- **Desktop (Developer QA screen):** Show `hasSeenAnalyticsOptInPrompt` with **Mark not seen**; remove the old full-reset control from that screen.
