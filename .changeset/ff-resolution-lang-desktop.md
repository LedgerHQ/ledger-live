---
"ledger-live-desktop": minor
---

Pass the current app language to the feature-flags middleware (`getAppLanguage` selector in `configureStore`) so it can apply language filtering during resolution, making language-gated remote flags (`languages_whitelisted` / `languages_blacklisted`) resolve correctly.
