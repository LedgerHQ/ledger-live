# @features/platform-app-lock

> [!CAUTION]
> **Status: UNSTABLE** — Scaffold created in [LIVE-35917](https://ledgerhq.atlassian.net/browse/LIVE-35917); the public API is still being designed.

App lock protection state — whether a password exists, whether biometrics is enabled, and whether
the app is currently locked — plus the biometrics status unions and the errors the unlock path
raises. It says _what state the lock is in_, never _how a digest is compared_ (that lives in
[`@shared/password-verifier`](../../../shared/password-verifier/README.md)) and never _what the user sees_ (that lives
in [`@features/flow-app-lock`](../../flow/app-lock/README.md)).

## Why platform and not domain/entity

App authentication is a Non-Functional Requirement: invisible to users, no screens, no global
routing, but required for the app to deliver its features safely. That is the definition of
`features/platform` in the [architecture guideline](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/6111232117),
alongside `feature-flags` and `coin-loader`.

It is deliberately **not** a `domain/entity`. The guideline restricts entities to business objects —
accounts, currencies, contacts — and states that feature-scoped state is not a domain entity.
`{ hasPassword, biometricsEnabled, isLocked }` is security and session configuration, not a wallet
business concept.

It is also not flow-local, because more than one flow reads it: the unlock flow reads `isLocked`,
Settings reads the two protection flags, and the boot sequence decides the initial lock state.
That combination — cross-flow, domain-adjacent, invisible — is what this layer is for.

## Scope

This is currently a **scaffold**:

- `AppLockStateSchema` / `AppLockState` — `hasPassword`, `biometricsEnabled`, `isLocked`.
- `AuthenticationTypeSchema` / `AuthenticationType` — `"none" | "password" | "biometrics" | "passwordAndBiometrics"`.
- `BiometricsAvailability`, `BiometricsPromptResult`, `BiometricsKind`.
- `AppLockError` and its members `WrongPassword`, `PasswordNotSet`. The `name` string is the
  contract; catch `AppLockError` to catch the family.

`AuthenticationType` is meant to be **derived** from the two protection flags, not stored: the spec
allows password-only, biometrics-only and both, so the flags stay the single source of truth and the
union cannot drift out of sync with them.

The biometrics types are unions rather than booleans because each case needs a different screen:
`unavailable` (no hardware — never offer it), `notEnrolled` (offer to open system settings) and
`lockedOut` (the OS decides when to relent). Likewise `cancelled` must stay distinguishable from
`failed`, so a dismissed sheet is not counted as a failed attempt. These are product requirements
encoded in the type system; the app's biometrics adapter returns them and the flow switches on them.

**Known gap to decide later:** with nothing stored in a biometric-gated keystore item, there is no
way to detect that the user's biometric enrolment has changed. If that matters, it needs a canary
item and a follow-up decision.

The slice, selectors, React hooks and the unlock orchestration (which is what raises the errors) land
with the tickets that consume them — biometrics/password logic, unlock flow, migration.

## Validation

```sh
pnpm test
pnpm typecheck
pnpm unimported
```
