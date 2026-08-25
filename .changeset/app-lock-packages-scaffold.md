---
"@features/platform-app-lock": minor
"@shared/password-verifier": minor
"live-mobile": minor
---

Add the two app lock packages the User App Authentication tickets build on: `@shared/password-verifier` (the verifier record and its constant-time comparison) and `@features/platform-app-lock` (protection state schemas, biometrics status unions and errors).

No functional change to Ledger Wallet Mobile: `react-native-keychain` now resolves through the pnpm catalog instead of a direct pin, so the app and `@features/platform-app-lock` cannot drift apart. It still resolves to 10.0.0.
