---
"@shared/feature-flags": minor
---

Apply feature-flag language filtering. The feature-flags middleware now injects the current app language into `meta.resolutionConfig.appLanguage` on every `featureFlags/*` action — read from app state via an optional `getAppLanguage` selector — and re-resolves all flags when it changes, so `languages_whitelisted` / `languages_blacklisted` constraints take effect.
