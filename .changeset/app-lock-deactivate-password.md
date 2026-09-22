---
"@features/flow-app-lock": minor
"live-mobile": minor
---

Let someone remove their app lock password, behind `lwmPasswordRevamp`.

Turning the switch off used to reach the legacy removal screen, which reads the default keychain item and compares plaintext. A revamped password lives under its own service as a verifier, so that screen could never succeed — and its `if (credentials)` guard skipped the comparison entirely when it found nothing, clearing legacy state without ever checking the password.

The new screen derives with the parameters stored in the verifier rather than today's defaults, compares in constant time, and destroys the verifier before flipping the protection state. A wrong password and a keychain that will not answer are reported differently, since a single boolean forced one to be shown as the other.

The screens also stop taking their strings as a `labels` object built by the app: each one now calls `useTranslation` from `@shared/i18n` where it renders, as the `pay-*` flows already do. That removes the `*Labels` types and the per-screen `useMemo` that rebuilt them, and turns the failure props into booleans so the state stays in the view model while the message lives in the view.
