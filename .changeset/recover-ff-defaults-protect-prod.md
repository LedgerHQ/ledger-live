---
"@shared/feature-flags": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Replace `protect-simu` schema defaults with `protect-prod` in `protectServicesDesktop` / `protectServicesMobile` and drop deleted manifests from `WebRecoverPlayer` dev top-bar allow-lists.

`protect-simu` was removed from `manifest-api`; clients falling back to schema defaults (local dev, failed remote config fetch, tests) were still deeplinking to it. Also remove `protect-simu` and `protect-staging-v2` from the `WebRecoverPlayer` top-bar allow-lists — both manifests are gone. PROD behavior is unchanged because Firebase Remote Config already pins `protectId` to `protect-prod`.
