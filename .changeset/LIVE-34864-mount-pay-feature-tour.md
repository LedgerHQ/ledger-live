---
"ledger-live-desktop": minor
"live-mobile": minor
---

Mount the first-time Pay tab FeatureTour on the PayTab screen in both apps. Visibility is self-gated by the payCard slice (shown on first visit, hidden after dismissal), copy is injected from app-owned i18n keys (payTab.featureTour.*), and analytics are wired through the view-model. Adds unit and integration coverage for the conditional rendering.
