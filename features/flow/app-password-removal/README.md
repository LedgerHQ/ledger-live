# @features/flow-app-password-removal

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

The app password removal journey for Ledger Wallet Mobile: proving the password before it is
removed, and refusing to remove the last protection while a card is active. The containers live in
the app, which deletes the verifier and decides when removal is allowed.

## Scope

- `steps/DeactivatePassword` — `useDeactivatePasswordViewModel` and `DeactivatePasswordView`: asks
  for the current password, hands it to the caller and reports a wrong one.
- `components/KeepProtectionSheet` — explains why the password or biometrics cannot be turned off
  while it is the only protection left and a card is active. The Settings password and biometrics
  rows open it.

`PasswordField` and the biometrics types come from
[`@features/platform-app-lock`](../../platform/app-lock/README.md).

## Native only

The epic is mobile only, so the package ships no `.web` variants. Tests use the native project of
`@support/jest/features-flow` (`*.native.test.ts(x)`).
