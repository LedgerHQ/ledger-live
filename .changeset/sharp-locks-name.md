---
"@features/platform-app-lock": minor
"@features/flow-app-protection-prompt": minor
"@features/flow-app-password-removal": minor
"live-mobile": minor
---

Make the biometrics type wording keys verifiable by the i18n key check, and resolve the biometrics type label with one `useBiometricsTypeLabel` hook from `@features/platform-app-lock/native`. `@features/platform-app-lock` no longer exports `biometricsTypeKey`.
