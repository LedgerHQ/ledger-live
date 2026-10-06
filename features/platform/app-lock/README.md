# @features/platform-app-lock

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

App lock protection state — whether a password exists, whether biometrics is enabled, and whether
the app is currently locked — plus the biometrics status unions and the errors the unlock path
raises. It says _what state the lock is in_, never _how a digest is compared_ (that lives in
[`@shared/password-verifier`](../../../shared/password-verifier/README.md)). The screens live in
the flow packages, one per journey —
[`@features/flow-app-unlock`](../../flow/app-unlock/README.md),
[`@features/flow-app-password-setup`](../../flow/app-password-setup/README.md),
[`@features/flow-app-password-removal`](../../flow/app-password-removal/README.md),
[`@features/flow-app-longer-password`](../../flow/app-longer-password/README.md) and
[`@features/flow-app-protection-prompt`](../../flow/app-protection-prompt/README.md) — and only the UI
several of those journeys share lives here (see [Shared UI](#shared-ui-native-only)).

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

The default entry (`index.ts`) is plain TypeScript, tested in Node:

- `appLockSlice`, its schema and selectors — `hasPassword`, `biometricsEnabled`, `isLocked`,
  `isHydrated`, `needsLongerPassword`, `hasDecidedLaunchLock`.
- `getAuthenticationType` / `AuthenticationType` — `"none" | "password" | "biometrics" | "passwordAndBiometrics"`.
- The rules the journeys share: `resolveAppLockScheme` (any stored protection keeps the revamped
  scheme, whatever the flag says), `isLastProtection`, `isProtectionStale`, `isPasswordLongEnough`.
- `BiometricsAvailability`, `BiometricsPromptResult`, `BiometricsKind`, `classifyBiometricsPromptError`.
- `AppLockError` and its members `WrongPassword`, `PasswordNotSet`. The `name` string is the
  contract; catch `AppLockError` to catch the family.

The native entry (`index.native.ts`) adds what needs React Native:

- The verifier store — `storeNewPassword`, `checkPassword`, `clearPasswordIfCorrect`,
  `clearStoredPassword`, `hasPasswordVerifier`, and the legacy migration (`migrateLegacyPassword`,
  `isLegacyMigrationComplete`). scrypt through `react-native-fast-crypto`, one Keychain item
  (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`), compared with
  [`@shared/password-verifier`](../../../shared/password-verifier/README.md).
- Biometrics — `getBiometricsAvailability`, `promptBiometrics` (an explicit device-owner check that
  accepts the device passcode) and the marker that records the choice.
- The shared UI below.

`AuthenticationType` is **derived** from the two protection flags, not stored: the spec allows
password-only, biometrics-only and both, so the flags stay the single source of truth and the union
cannot drift out of sync with them.

The biometrics types are unions rather than booleans because each case needs a different screen:
`unavailable` (no hardware — never offer it), `notEnrolled` (offer to open system settings) and
`lockedOut` (the OS decides when to relent). Likewise `cancelled` must stay distinguishable from
`failed`, so a dismissed sheet is not counted as a failed attempt.

## Known limits

- The biometrics marker is a plain Keychain item, not a biometric-gated one, so a change of
  enrolment goes undetected.
- On iOS, `react-native-keychain` writes an item by deleting it and adding it again. A crash between
  the two loses the verifier, and the app opens unprotected at the next launch.

## Shared UI (native only)

Exported from `index.native.ts` only, so the default entry stays free of UI:

- `PasswordField` — the one password input every password surface uses, so the label, the reveal
  toggle and the error treatment cannot drift between them.
- `PasswordDraftProvider` / `usePasswordDraft` — carries the chosen password from the step that
  picks it to the step that confirms it in a ref, deliberately not in navigation state, which is
  serialisable and gets persisted.

Their tests run in the React Native project of `@support/jest/features-flow`
(`*.native.test.tsx`); the rest of the package keeps its plain Node project (`*.test.ts`).

## Validation

```sh
pnpm test
pnpm typecheck
pnpm unimported
```
