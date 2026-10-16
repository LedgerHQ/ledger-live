# @features/flow-app-protection-prompt

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

The app protection prompt for Ledger Wallet Mobile: before a feature that needs the app protected —
the Card login today — an unprotected user is asked to enable biometrics, or to create a password
when the device has none, and is told once it is done. The container lives in the app, which
decides when the prompt is requested and runs the biometrics or password setup.

## Scope

- `steps/ProtectionPrompt` — `useProtectionPromptViewModel`: opens only for an unprotected user once
  the biometrics capability is known, picks the biometrics or password variant, guards against a
  second system prompt while one is open, and reports the enable press as `button_clicked`.
- `components/EnableProtectionSheet` — the prompt itself, with a loading state while the system
  biometrics prompt is up.
- `components/ProtectionEnabledSheet` — the confirmation once the app is protected.

The biometrics types and labels come from
[`@features/platform-app-lock`](../../platform/app-lock/README.md).

## Native only

The epic is mobile only, so the package ships no `.web` variants. Tests use the native project of
`@support/jest/features-flow` (`*.native.test.ts(x)`).
