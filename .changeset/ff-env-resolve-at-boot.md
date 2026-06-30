---
"@shared/feature-flags": minor
---

feature-flags: apply env (`FEATURE_FLAGS`) overrides at store boot even when the first remote-flags fetch fails. The middleware now re-resolves once on the first settled fetch — on success as before, and once on the first failure — so env (and version/language) resolution runs at boot without depending on a successful remote fetch. Subsequent failed polls do not re-resolve (a one-shot guard), so there is no per-poll churn. No app changes are required: any consumer of `createFeatureFlagsMiddleware` gets correct env-at-boot resolution.
