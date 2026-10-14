# @features/flow-app-longer-password

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

The mandatory longer-password journey for Ledger Wallet Mobile: a legacy password shorter than the
minimum has to be replaced before the app opens. The prompt cannot be dismissed; the new password is
entered, confirmed, stored, and acknowledged. The container lives in the app, which stores the new
verifier and decides when the journey is due.

This journey is temporary: it only serves users migrated from the legacy scheme with a short
password, and the package can be deleted once none are left.

## Scope

- `steps/LongerPassword` — `useLongerPasswordViewModel` and `LongerPasswordView`: walks the prompt,
  the new password, its confirmation and the acknowledgement. The enter and confirm steps reuse
  `SetupPasswordView` and `ConfirmPasswordView` from
  [`@features/flow-app-password-setup`](../app-password-setup/README.md).
- `components/ChangePasswordSheet` — the prompt that starts the change.
- `components/PasswordChangedSheet` — the confirmation once the new password is stored.

## Native only

The epic is mobile only, so the package ships no `.web` variants. Tests use the native project of
`@support/jest-features-flow` (`*.native.test.ts(x)`).
